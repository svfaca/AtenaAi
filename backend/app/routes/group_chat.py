from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json
import logging
import asyncio
from jose import JWTError, jwt

from app.database.database import get_db, SessionLocal
from app.models.user import User
from app.models.classroom import Classroom, classroom_students
from app.models.group_message import GroupMessage
from app.services.websocket_manager import manager
from app.services.ai_service import detect_ai_mention, generate_classroom_ai_response, get_ai_user_representation
from app.core.dependencies import get_current_user
from app.core.security import SECRET_KEY, ALGORITHM

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/group-chat",
    tags=["Group Chat"]
)


# =========================================================
# HELPERS (handshake consistente com subprotocolo)
# =========================================================

async def _accept_ws(websocket: WebSocket, ws_token: Optional[str]) -> None:
    """
    Aceita a conexão ecoando o subprotocolo quando o token veio por ele.
    O browser só completa o handshake se o servidor ecoar o subprotocolo
    solicitado em accept().
    """
    if ws_token:
        await websocket.accept(subprotocol=ws_token)
    else:
        await websocket.accept()


async def _reject_ws(
    websocket: WebSocket,
    code: int,
    reason: str,
    ws_token: Optional[str],
) -> None:
    """Aceita (para entregar o close code ao cliente) e fecha com o código."""
    await _accept_ws(websocket, ws_token)
    await websocket.close(code=code, reason=reason)


# =========================================================
# WEBSOCKET: CHAT EM TEMPO REAL
# =========================================================

@router.websocket("/ws/{classroom_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    classroom_id: int,
    # ⚠️ DEPRECADO: token na query string vaza em logs/histórico/Referer.
    # Mantido apenas para compatibilidade — remover após os clientes migrarem
    # para o subprotocolo (Sec-WebSocket-Protocol).
    token: str = Query(None)
):
    """WebSocket endpoint para chat em grupo em tempo real"""
    
    db = SessionLocal()
    user_name = "Unknown"
    
    try:
        logger.debug(f"[WebSocket] New connection attempt for classroom {classroom_id}")

        # 🔒 SEGURANÇA: o token NÃO deve trafegar na URL. O cliente envia via
        # Sec-WebSocket-Protocol: new WebSocket(url, [token]) — o servidor deve
        # ecoar o subprotocolo em accept() para completar o handshake.
        subprotocols = (websocket.headers.get("sec-websocket-protocol") or "").split(",")
        ws_token = None
        for candidate in (p.strip() for p in subprotocols):
            # "eyJ" é o prefixo típico de um JWT (header base64url começa com 'ey')
            if candidate and candidate.startswith("eyJ"):
                ws_token = candidate
                break

        auth_token = ws_token or token  # fallback legado (query string)
        if not auth_token:
            await _reject_ws(websocket, 4003, "Authentication failed", ws_token)
            logger.warning(f"[WebSocket] Rejected classroom {classroom_id}: token ausente")
            return
        
        # ========== TOKEN VALIDATION ==========
        try:
            logger.debug(f"[WebSocket] Decoding token...")
            payload = jwt.decode(auth_token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if not user_id:
                await _reject_ws(websocket, 4001, "Invalid token", ws_token)
                logger.warning(f"[WebSocket] Rejected classroom {classroom_id}: Invalid token (no user_id)")
                return
            logger.debug(f"[WebSocket] Token decoded successfully. User ID: {user_id}")
        except JWTError as e:
            await _reject_ws(websocket, 4003, "Authentication failed", ws_token)
            logger.warning(f"[WebSocket] Rejected classroom {classroom_id}: JWT error - {str(e)}")
            return
        except Exception as e:
            logger.error(f"[WebSocket] Unexpected error during token validation: {str(e)}", exc_info=True)
            await _reject_ws(websocket, 5000, "Server error", ws_token)
            return
        
        # ========== USER VALIDATION ==========
        try:
            logger.debug(f"[WebSocket] Looking up user {user_id}...")
            user = db.query(User).filter(User.id == int(user_id)).first()
            if not user:
                await _reject_ws(websocket, 4002, "User not found", ws_token)
                logger.warning(f"[WebSocket] Rejected classroom {classroom_id}: User {user_id} not found")
                return
            
            user_name = user.full_name
            user_role = user.role.value
            logger.debug(f"[WebSocket] User found: {user_name} (role: {user_role})")
        except Exception as e:
            logger.error(f"[WebSocket] Error looking up user {user_id}: {str(e)}", exc_info=True)
            await _reject_ws(websocket, 5000, "Server error", ws_token)
            return
        
        # ========== CLASSROOM & PERMISSION VALIDATION ==========
        try:
            logger.debug(f"[WebSocket] Validating classroom {classroom_id}...")
            classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
            if not classroom:
                await _reject_ws(websocket, 4004, "Classroom not found", ws_token)
                logger.warning(f"[WebSocket] Rejected: Classroom {classroom_id} not found")
                return
            
            is_teacher = classroom.teacher_id == user.id
            is_student = db.query(classroom_students).filter(
                classroom_students.c.classroom_id == classroom_id,
                classroom_students.c.student_id == user.id
            ).first() is not None
            
            logger.debug(f"[WebSocket] User {user_name}: teacher={is_teacher}, student={is_student}")
            
            if not is_teacher and not is_student:
                await _reject_ws(websocket, 4005, "Access denied", ws_token)
                logger.warning(f"[WebSocket] Rejected: User {user_name} (ID: {user.id}) has no access to classroom {classroom_id}")
                return
        except Exception as e:
            logger.error(f"[WebSocket] Error validating classroom {classroom_id}: {str(e)}", exc_info=True)
            await _reject_ws(websocket, 5000, "Server error", ws_token)
            return
        
        # ========== ALL VALIDATIONS PASSED - ACCEPT CONNECTION ==========
        logger.debug(f"[WebSocket] All validations passed. Accepting connection...")
        # 🔒 Se o token veio via subprotocolo (Sec-WebSocket-Protocol), o servidor
        # DEVE ecoá-lo em accept() para o navegador completar o handshake.
        await _accept_ws(websocket, ws_token)
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
                        
                        # 🆕 CHECK FOR AI MENTION
                        has_ai_mention, clean_prompt = detect_ai_mention(message_content)
                        
                        if has_ai_mention and clean_prompt:
                            logger.info(f"[AI] Mention detected from {user_name} in classroom {classroom_id}")
                            
                            # Generate AI response asynchronously (non-blocking)
                            asyncio.create_task(
                                _handle_ai_response(
                                    clean_prompt,
                                    classroom_id,
                                    user.id,
                                    user_name,
                                    user.interests
                                )
                            )
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


# =========================================================
# 🆕 AI RESPONSE HANDLER (Async background task)
# =========================================================

async def _handle_ai_response(
    prompt: str,
    classroom_id: int,
    user_id: int,
    user_name: str,
    user_interests: str = None
):
    """
    Handles AI response generation and broadcasts it to the classroom
    Runs as a background task to not block the WebSocket
    """
    try:
        logger.info(f"[AI] Generating response for: {prompt[:50]}...")
        
        # Generate AI response
        ai_response = await generate_classroom_ai_response(
            prompt=prompt,
            classroom_id=classroom_id,
            user_id=user_id,
            user_name=user_name,
            user_interests=user_interests
        )
        
        if not ai_response:
            logger.warning("[AI] No response generated")
            return
        
        # Create database session to save AI message
        ai_db = SessionLocal()
        try:
            # Save AI message to database
            ai_message = GroupMessage(
                content=ai_response,
                classroom_id=classroom_id,
                user_id=0,  # Special ID for AI
                created_at=datetime.utcnow()
            )
            
            ai_db.add(ai_message)
            ai_db.commit()
            ai_db.refresh(ai_message)
            
            # Broadcast AI response
            ai_user = get_ai_user_representation()
            broadcast_data = {
                "type": "message",
                "id": ai_message.id,
                "content": ai_response,
                "user_id": ai_user["user_id"],
                "user_name": ai_user["user_name"],
                "user_role": ai_user["role"],
                "timestamp": ai_message.created_at.isoformat(),
                "is_ai": True
            }
            
            await manager.broadcast(classroom_id, broadcast_data)
            logger.info(f"[AI] Response broadcast to classroom {classroom_id}")
            
        except Exception as e:
            logger.error(f"[AI] Error saving AI message: {str(e)}", exc_info=True)
        finally:
            ai_db.close()
            
    except Exception as e:
        logger.error(f"[AI] Error in _handle_ai_response: {str(e)}", exc_info=True)
