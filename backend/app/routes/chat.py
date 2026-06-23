"""
Chat Route - Otimizado para performance e com rate limiting centralizado.
"""
from datetime import datetime
from typing import Any, Optional, cast

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.core.cache import rate_limiter
from app.core.config import GUEST_RATE_LIMIT, MAX_INPUT_LENGTH, MAX_MESSAGE_HISTORY, USER_RATE_LIMIT
from app.core.dependencies import get_current_user_optional
from app.core.logger import log_error
from app.database.database import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.chat import MessageCreate
from app.services.ai_service import generate_ai_response, generate_ai_response_stream
from app.services.chat_service import get_or_create_conversation
from app.services.memory_service import get_memory_service
from app.utilities.interests import parse_interests

router = APIRouter(prefix="/chat", tags=["Chat"])


def _normalize_history(messages: Optional[list]) -> list:
    """Normalize incoming chat history to OpenAI-compatible role/content pairs."""
    normalized = []
    for item in messages or []:
        role = item.get("role") if isinstance(item, dict) else getattr(item, "role", None)
        content = item.get("content") if isinstance(item, dict) else getattr(item, "content", None)
        if role in {"user", "assistant"} and isinstance(content, str) and content.strip():
            normalized.append({"role": role, "content": content})
    return normalized


def _build_rate_limit_headers(rate_key: str, max_requests: int, window: int) -> dict[str, str]:
    """Expose remaining requests and reset timer in seconds for frontend UX."""
    remaining = rate_limiter.get_remaining(rate_key, max_requests, window)
    reset_in_seconds = rate_limiter.get_reset_time(rate_key, window) or 0
    return {
        "X-RateLimit-Remaining": str(remaining),
        "X-RateLimit-Reset": str(reset_in_seconds),
    }


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
        # 1. VALIDACAO DE CONTEUDO
        # ========================================
        normalized_messages = _normalize_history(message.messages)[-MAX_MESSAGE_HISTORY:]
        content = normalized_messages[-1]["content"] if normalized_messages else (message.content or getattr(message, "text", None))

        if not content or not content.strip():
            raise HTTPException(status_code=400, detail="Mensagem vazia")

        if len(content) > MAX_INPUT_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Mensagem muito longa (max: {MAX_INPUT_LENGTH})"
            )

        # ========================================
        # 2. RATE LIMITING
        # ========================================
        if current_user:
            rate_key = f"user_chat:{current_user.id}"
            max_req, window = USER_RATE_LIMIT
        else:
            client_host = request.client.host if request.client else "unknown"
            rate_key = f"ip_chat:{client_host}"
            max_req, window = GUEST_RATE_LIMIT

        if not rate_limiter.is_allowed(rate_key, max_req, window):
            raise HTTPException(
                status_code=429,
                detail="Limite diario de mensagens atingido. Tente novamente mais tarde.",
                headers=_build_rate_limit_headers(rate_key, max_req, window),
            )

        rate_limit_headers = _build_rate_limit_headers(rate_key, max_req, window)

        # ========================================
        # 3. MODO VISITANTE (SEM BANCO)
        # ========================================
        if not current_user:
            formatted_history = normalized_messages or _normalize_history(message.history)
            formatted_history = formatted_history[-MAX_MESSAGE_HISTORY:]

            if not formatted_history or formatted_history[-1]["role"] != "user":
                formatted_history.append({"role": "user", "content": content})

            ai_response = generate_ai_response(
                formatted_history,
                user_id=None,
                user_name="Visitante",
                language=message.language
            )

            return JSONResponse(content={"reply": ai_response}, headers=rate_limit_headers)

        # ========================================
        # 4. MODO LOGADO (COM BANCO)
        # ========================================
        title = content[:30] + "..." if len(content) > 30 else content
        conversation = get_or_create_conversation(
            db=db,
            user_id=current_user.id,
            conversation_id=message.conversation_id,
            title=title,
        )
        conv_id = int(conversation.id)  # type: ignore

        # 🧠 OTIMIZAÇÃO: Usa memory service para contexto otimizado (summary + recent messages)
        memory_service = get_memory_service(db)
        optimized_context = memory_service.format_context_for_ai(conv_id, auto_summarize=True)

        # Se há histórico passado pelo cliente, usa-o, senão usa o contexto otimizado
        formatted_history = normalized_messages if normalized_messages else optimized_context
        formatted_history = formatted_history[-MAX_MESSAGE_HISTORY:]

        if not formatted_history or formatted_history[-1]["role"] != "user":
            formatted_history.append({"role": "user", "content": content})

        user_data = cast(Any, current_user)
        user_role = user_data.role.value if hasattr(user_data.role, "value") else str(user_data.role)
        user_id = user_data.id
        user_name = str(user_data.full_name) if user_data.full_name is not None else None
        user_nickname = str(user_data.nickname) if user_data.nickname is not None else None
        user_email = str(user_data.email) if user_data.email is not None else None
        user_gender = str(user_data.gender) if user_data.gender is not None else None
        user_birth_date = user_data.birth_date
        user_interests = parse_interests(user_data.interests)

        ai_response = generate_ai_response(
            formatted_history,
            user_id=user_id,
            user_name=user_name,
            user_nickname=user_nickname,
            user_email=user_email,
            user_gender=user_gender,
            user_birth_date=user_birth_date,
            user_account_type=user_role,
            user_interests=user_interests,
            language=message.language
        )

        user_msg = Message(conversation_id=conv_id, role="user", content=content)
        ai_msg = Message(conversation_id=conv_id, role="assistant", content=ai_response)

        db.add(user_msg)
        db.add(ai_msg)

        db.query(Conversation)\
            .filter(Conversation.id == conv_id)\
            .update({"updated_at": datetime.utcnow()})

        db.commit()

        return JSONResponse(
            content={
                "reply": ai_response,
                "conversation_id": conv_id
            },
            headers=rate_limit_headers,
        )

    except HTTPException:
        raise
    except Exception as e:
        log_error(e, context="chat_endpoint", user_id=current_user.id if current_user else None)
        raise HTTPException(status_code=500, detail="Erro ao processar mensagem")


@router.post("/stream")
async def chat_stream(
    message: MessageCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Endpoint de chat com streaming - token por token"""

    try:
        # ========================================
        # 1. VALIDACAO DE CONTEUDO
        # ========================================
        normalized_messages = _normalize_history(message.messages)[-MAX_MESSAGE_HISTORY:]
        content = normalized_messages[-1]["content"] if normalized_messages else (message.content or getattr(message, "text", None))

        if not content or not content.strip():
            raise HTTPException(status_code=400, detail="Mensagem vazia")

        if len(content) > MAX_INPUT_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Mensagem muito longa (max: {MAX_INPUT_LENGTH})"
            )

        # ========================================
        # 2. RATE LIMITING
        # ========================================
        if current_user:
            rate_key = f"user_chat:{current_user.id}"
            max_req, window = USER_RATE_LIMIT
        else:
            client_host = request.client.host if request.client else "unknown"
            rate_key = f"ip_chat:{client_host}"
            max_req, window = GUEST_RATE_LIMIT

        if not rate_limiter.is_allowed(rate_key, max_req, window):
            raise HTTPException(
                status_code=429,
                detail="Limite diario de mensagens atingido. Tente novamente mais tarde.",
                headers=_build_rate_limit_headers(rate_key, max_req, window),
            )

        # ========================================
        # 3. MODO VISITANTE (SEM BANCO)
        # ========================================
        if not current_user:
            formatted_history = normalized_messages or _normalize_history(message.history)
            formatted_history = formatted_history[-MAX_MESSAGE_HISTORY:]

            if not formatted_history or formatted_history[-1]["role"] != "user":
                formatted_history.append({"role": "user", "content": content})

            def generate():
                for token in generate_ai_response_stream(
                    formatted_history,
                    user_id=None,
                    user_name="Visitante",
                    language=message.language
                ):
                    yield token

            return StreamingResponse(generate(), media_type="text/event-stream")

        # ========================================
        # 4. MODO LOGADO (COM BANCO + STREAMING)
        # ========================================
        title = content[:30] + "..." if len(content) > 30 else content
        conversation = get_or_create_conversation(
            db=db,
            user_id=current_user.id,
            conversation_id=message.conversation_id,
            title=title,
        )
        conv_id = int(conversation.id)  # type: ignore

        # 🧠 OTIMIZAÇÃO: Usa memory service para contexto otimizado (summary + recent messages)
        memory_service = get_memory_service(db)
        optimized_context = memory_service.format_context_for_ai(conv_id, auto_summarize=True)

        # Se há histórico passado pelo cliente, usa-o, senão usa o contexto otimizado
        formatted_history = normalized_messages if normalized_messages else optimized_context
        formatted_history = formatted_history[-MAX_MESSAGE_HISTORY:]

        if not formatted_history or formatted_history[-1]["role"] != "user":
            formatted_history.append({"role": "user", "content": content})

        # Salvar mensagem do usuário
        user_msg = Message(conversation_id=conv_id, role="user", content=content)
        db.add(user_msg)
        db.commit()

        # Parametros para a IA
        user_data = cast(Any, current_user)
        user_role = user_data.role.value if hasattr(user_data.role, "value") else str(user_data.role)
        user_id = user_data.id
        user_name = str(user_data.full_name) if user_data.full_name is not None else None
        user_nickname = str(user_data.nickname) if user_data.nickname is not None else None
        user_email = str(user_data.email) if user_data.email is not None else None
        user_gender = str(user_data.gender) if user_data.gender is not None else None
        user_birth_date = user_data.birth_date
        user_interests = parse_interests(user_data.interests)

        ai_params = {
            "user_id": user_id,
            "user_name": user_name,
            "user_nickname": user_nickname,
            "user_email": user_email,
            "user_gender": user_gender,
            "user_birth_date": user_birth_date,
            "user_account_type": user_role,
            "user_interests": user_interests,
            "language": message.language
        }

        # Gerar resposta com streaming e salvar ao final
        def generate_and_save():
            full_response = ""
            
            for token in generate_ai_response_stream(
                formatted_history,
                **ai_params
            ):
                full_response += token
                yield token
            
            # Salvar resposta completa no banco (após streaming)
            ai_msg = Message(
                conversation_id=conv_id,
                role="assistant",
                content=full_response
            )
            # Cria nova sessão para salvar
            from app.database.database import SessionLocal
            db_save = SessionLocal()
            try:
                db_save.add(ai_msg)
                db_save.query(Conversation)\
                    .filter(Conversation.id == conv_id)\
                    .update({"updated_at": datetime.utcnow()})
                db_save.commit()
            finally:
                db_save.close()

        return StreamingResponse(generate_and_save(), media_type="text/event-stream")

    except HTTPException:
        raise
    except Exception as e:
        log_error(e, context="chat_stream_endpoint", user_id=current_user.id if current_user else None)
        raise HTTPException(status_code=500, detail="Erro ao processar mensagem")
