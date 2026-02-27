from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import json
import logging
from jose import JWTError, jwt

from app.database.database import get_db, SessionLocal
from app.models.user import User
from app.models.classroom import Classroom, classroom_students
from app.models.group_message import GroupMessage
from app.services.websocket_manager import manager
from app.core.dependencies import get_current_user
from app.core.security import SECRET_KEY, ALGORITHM

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/group-chat",
    tags=["Group Chat"]
)


# =========================================================
# WEBSOCKET: CHAT EM TEMPO REAL
# =========================================================

@router.websocket("/ws/{classroom_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    classroom_id: int,
    token: str = Query(...)
):
    """WebSocket endpoint para chat em grupo em tempo real"""
    
    db = SessionLocal()
    user_name = "Unknown"
    
    try:
        logger.debug(f"[WebSocket] New connection attempt for classroom {classroom_id}")
        
        # ========== TOKEN VALIDATION ==========
        try:
            logger.debug(f"[WebSocket] Decoding token...")
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if not user_id:
                await websocket.accept()
                await websocket.close(code=4001, reason="Invalid token")
                logger.warning(f"[WebSocket] Rejected classroom {classroom_id}: Invalid token (no user_id)")
                return
            logger.debug(f"[WebSocket] Token decoded successfully. User ID: {user_id}")
        except JWTError as e:
            await websocket.accept()
            await websocket.close(code=4003, reason="Authentication failed")
            logger.warning(f"[WebSocket] Rejected classroom {classroom_id}: JWT error - {str(e)}")
            return
        except Exception as e:
            logger.error(f"[WebSocket] Unexpected error during token validation: {str(e)}", exc_info=True)
            await websocket.accept()
            await websocket.close(code=5000, reason="Server error")
            return
        
        # ========== USER VALIDATION ==========
        try:
            logger.debug(f"[WebSocket] Looking up user {user_id}...")
            user = db.query(User).filter(User.id == int(user_id)).first()
            if not user:
                await websocket.accept()
                await websocket.close(code=4002, reason="User not found")
                logger.warning(f"[WebSocket] Rejected classroom {classroom_id}: User {user_id} not found")
                return
            
            user_name = user.full_name
            user_role = user.role.value
            logger.debug(f"[WebSocket] User found: {user_name} (role: {user_role})")
        except Exception as e:
            logger.error(f"[WebSocket] Error looking up user {user_id}: {str(e)}", exc_info=True)
            await websocket.accept()
            await websocket.close(code=5000, reason="Server error")
            return
        
        # ========== CLASSROOM & PERMISSION VALIDATION ==========
        try:
            logger.debug(f"[WebSocket] Validating classroom {classroom_id}...")
            classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
            if not classroom:
                await websocket.accept()
                await websocket.close(code=4004, reason="Classroom not found")
                logger.warning(f"[WebSocket] Rejected: Classroom {classroom_id} not found")
                return
            
            is_teacher = classroom.teacher_id == user.id
            is_student = db.query(classroom_students).filter(
                classroom_students.c.classroom_id == classroom_id,
                classroom_students.c.student_id == user.id
            ).first() is not None
            
            logger.debug(f"[WebSocket] User {user_name}: teacher={is_teacher}, student={is_student}")
            
            if not is_teacher and not is_student:
                await websocket.accept()
                await websocket.close(code=4005, reason="Access denied")
                logger.warning(f"[WebSocket] Rejected: User {user_name} (ID: {user.id}) has no access to classroom {classroom_id}")
                return
        except Exception as e:
            logger.error(f"[WebSocket] Error validating classroom {classroom_id}: {str(e)}", exc_info=True)
            await websocket.accept()
            await websocket.close(code=5000, reason="Server error")
            return
        
        # ========== ALL VALIDATIONS PASSED - ACCEPT CONNECTION ==========
        logger.debug(f"[WebSocket] All validations passed. Accepting connection...")
        await websocket.accept()
        logger.info(f"[WebSocket] ACCEPTED: {user_name} (ID: {user.id}) to classroom {classroom_id}")
        
        # Close database session for validation (will create new ones for messages)
        db.close()
        db = None
        
        # ========== ADD TO MANAGER ==========
        if classroom_id not in manager.active_connections:
            manager.active_connections[classroom_id] = []
        
        manager.active_connections[classroom_id].append((websocket, user.id, user_name))
        
        logger.info(f"[WebSocket] {user_name} connected to classroom {classroom_id}. Total: {len(manager.active_connections[classroom_id])}")
        
        # Notify other users
        await manager.broadcast_system_message(
            classroom_id,
            f"{user_name} entrou na sala",
            exclude_user_id=user.id
        )
        
        # ========== MESSAGE LOOP ==========
        logger.debug(f"[WebSocket] Starting message loop for {user_name}...")
        try:
            while True:
                data = await websocket.receive_text()
                logger.debug(f"[WebSocket] Message received from {user_name}: {len(data)} bytes")
                
                try:
                    message_data = json.loads(data)
                    message_content = message_data.get("content", "").strip()
                    
                    if not message_content:
                        continue
                    
                    # Create new session for database operations
                    msg_db = SessionLocal()
                    try:
                        group_message = GroupMessage(
                            content=message_content,
                            classroom_id=classroom_id,
                            user_id=user.id,
                            created_at=datetime.utcnow()
                        )
                        
                        msg_db.add(group_message)
                        msg_db.commit()
                        msg_db.refresh(group_message)
                        
                        broadcast_data = {
                            "type": "message",
                            "id": group_message.id,
                            "content": message_content,
                            "user_id": user.id,
                            "user_name": user_name,
                            "user_role": user_role,
                            "timestamp": group_message.created_at.isoformat(),
                            "is_teacher": is_teacher
                        }
                        
                        await manager.broadcast(classroom_id, broadcast_data)
                        logger.debug(f"[WebSocket] Message broadcast from {user_name} to classroom {classroom_id}")
                    finally:
                        msg_db.close()
                
                except json.JSONDecodeError as e:
                    logger.warning(f"[WebSocket] Invalid JSON from {user_name}: {str(e)}")
                    continue
                except Exception as e:
                    logger.error(f"[WebSocket] Error processing message from {user_name}: {str(e)}", exc_info=True)
                    continue
        
        except WebSocketDisconnect:
            logger.info(f"[WebSocket] Client disconnect: {user_name} (ID: {user.id}) from classroom {classroom_id}")
            user_name_disc = manager.disconnect(websocket, classroom_id)
            if user_name_disc:
                await manager.broadcast_system_message(
                    classroom_id,
                    f"{user_name_disc} saiu da sala"
                )
        except Exception as e:
            logger.error(f"[WebSocket] Message loop error for {user_name}: {str(e)}", exc_info=True)
            manager.disconnect(websocket, classroom_id)
    
    except Exception as e:
        logger.error(f"[WebSocket] Unexpected endpoint error (user={user_name}): {str(e)}", exc_info=True)
        try:
            manager.disconnect(websocket, classroom_id)
        except Exception as disconnect_error:
            logger.debug(f"[WebSocket] Erro ao desconectar: {disconnect_error}")
    finally:
        if db:
            try:
                db.close()
            except Exception as close_error:
                logger.debug(f"[WebSocket] Erro ao fechar DB: {close_error}")
        logger.debug(f"[WebSocket] Cleanup complete for {user_name}")


# =========================================================
# REST: LISTAR MENSAGENS ANTERIORES
# =========================================================

@router.get("/{classroom_id}/messages")
async def get_classroom_messages(
    response: Response,
    classroom_id: int,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retorna mensagens anteriores de uma sala"""
    
    # Set cache header - personal messages cached for 1 minute
    response.headers["Cache-Control"] = "private, max-age=60"
    
    # Verificar acesso à sala
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    is_teacher = classroom.teacher_id == current_user.id
    is_student = db.query(classroom_students).filter(
        classroom_students.c.classroom_id == classroom_id,
        classroom_students.c.student_id == current_user.id
    ).first() is not None
    
    if not is_teacher and not is_student:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Buscar mensagens
    messages = db.query(GroupMessage)\
        .filter(GroupMessage.classroom_id == classroom_id)\
        .order_by(GroupMessage.created_at.desc())\
        .limit(limit)\
        .offset(offset)\
        .all()
    
    # Reverter ordem para mostrar mais antigas primeiro
    messages.reverse()
    
    # Formatar resposta
    return [
        {
            "id": msg.id,
            "content": msg.content,
            "user_id": msg.user_id,
            "user_name": msg.user.full_name,
            "user_role": msg.user.role.value,
            "timestamp": msg.created_at.isoformat(),
            "is_teacher": msg.user_id == classroom.teacher_id
        }
        for msg in messages
    ]


# =========================================================
# REST: USUÁRIOS ONLINE
# =========================================================

@router.get("/{classroom_id}/online-users")
async def get_online_users(
    response: Response,
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retorna lista de usuários online na sala"""
    
    # Set cache header - online users list cached for 10 seconds
    response.headers["Cache-Control"] = "private, max-age=10"
    
    # Verificar acesso
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    is_teacher = classroom.teacher_id == current_user.id
    is_student = db.query(classroom_students).filter(
        classroom_students.c.classroom_id == classroom_id,
        classroom_students.c.student_id == current_user.id
    ).first() is not None
    
    if not is_teacher and not is_student:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Retornar usuários conectados
    return manager.get_classroom_users(classroom_id)
