"""
Chat Route - Otimizado para performance e com rate limiting centralizado.
"""
from fastapi import APIRouter, HTTPException, Depends, Request, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.schemas.chat import MessageCreate
from app.services.ai_service import generate_ai_response
from app.core.config import MAX_INPUT_LENGTH
from app.core.exceptions import ValidationError, RateLimitError, NotFoundError
from app.core.cache import rate_limiter
from app.core.logger import log_error
from app.database.database import get_db
from app.models.message import Message
from app.models.conversation import Conversation
from app.models.user import User
from app.core.dependencies import get_current_user_optional

router = APIRouter(prefix="/chat", tags=["Chat"])

# Rate limits
GUEST_CHAT_LIMIT = (10, 3600)  # 10 mensagens por hora
USER_CHAT_LIMIT = (100, 60)     # 100 por minuto

@router.post("/")
async def chat(
    message: MessageCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Endpoint de chat - suporta modo visitante e logado com rate limiting"""
    
    try:
        # ========================================
        # 1. VALIDAÇÃO DE CONTEÚDO
        # ========================================
        content = message.content or getattr(message, 'text', None)
        
        if not content or not content.strip():
            raise HTTPException(status_code=400, detail="Mensagem vazia")
        
        if len(content) > MAX_INPUT_LENGTH:
            raise HTTPException(
                status_code=400, 
                detail=f"Mensagem muito longa (máx: {MAX_INPUT_LENGTH})"
            )
        
        # ========================================
        # 2. RATE LIMITING
        # ========================================
        if current_user:
            # Usuário logado
            rate_key = f"user_chat:{current_user.id}"
            max_req, window = USER_CHAT_LIMIT
        else:
            # Visitante
            rate_key = f"ip_chat:{request.client.host}"
            max_req, window = GUEST_CHAT_LIMIT
        
        if not rate_limiter.is_allowed(rate_key, max_req, window):
            reset_time = rate_limiter.get_reset_time(rate_key, window)
            raise RateLimitError(retry_after=reset_time or 60)
        
        # ========================================
        # 3. MODO VISITANTE (SEM BANCO)
        # ========================================
        if not current_user:
            formatted_history = message.history or []
            formatted_history.append({"role": "user", "content": content})
            
            ai_response = generate_ai_response(
                formatted_history,
                user_id=None,
                user_name="Visitante",
                language=message.language
            )
            
            return {"reply": ai_response}
        
        # ========================================
        # 4. MODO LOGADO (COM BANCO)
        # ========================================
        conv_id = message.conversation_id
        
        # Cria conversa se não existir
        if not conv_id:
            title = content[:30] + "..." if len(content) > 30 else content
            new_conv = Conversation(
                user_id=current_user.id,
                title=title,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(new_conv)
            db.commit()
            db.refresh(new_conv)
            conv_id = new_conv.id
        
        # Busca histórico com limit para melhor performance
        db_history = db.query(Message)\
            .filter(Message.conversation_id == conv_id)\
            .order_by(Message.created_at.asc())\
            .limit(message.history_limit or 10)\
            .all()
        
        formatted_history = [{"role": m.role, "content": m.content} for m in db_history]
        formatted_history.append({"role": "user", "content": content})
        
        # Gera resposta da IA
        ai_response = generate_ai_response(
            formatted_history,
            user_id=current_user.id,
            user_name=current_user.full_name,
            user_nickname=current_user.nickname,
            user_interests=current_user.interests,
            user_birth_date=current_user.birth_date,
            language=message.language
        )
        
        # Salva mensagens no banco
        user_msg = Message(conversation_id=conv_id, role="user", content=content)
        ai_msg = Message(conversation_id=conv_id, role="assistant", content=ai_response)
        
        db.add(user_msg)
        db.add(ai_msg)
        
        # Update timestamp da conversa
        db.query(Conversation)\
            .filter(Conversation.id == conv_id)\
            .update({"updated_at": datetime.utcnow()})
        
        db.commit()
        
        return {
            "reply": ai_response,
            "conversation_id": conv_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, context="chat_endpoint", user_id=current_user.id if current_user else None)
        raise HTTPException(status_code=500, detail="Erro ao processar mensagem")

