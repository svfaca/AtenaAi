from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# ✅ Importação dos modelos e esquemas
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.message import ChatMessage
from app.schemas.chat import ConversationResponse
from app.schemas.pagination import PaginationParams, PaginatedResponse
from app.core.dependencies import get_current_user, get_db
from app.core.prompts import get_system_prompt
from app.services.ai_service import get_client

router = APIRouter(prefix="/conversations", tags=["Conversations"])

# ============================
# SCHEMAS LOCAIS
# ============================
class CreateConversationRequest(BaseModel):
    title: Optional[str] = "Nova conversa"

class UpdateConversationRequest(BaseModel):
    title: str

# ============================
# 1. LISTAR CONVERSAS (COM PAGINAÇÃO E EAGER LOADING)
# ============================
@router.get("/", response_model=dict)
def list_conversations(
    response: Response,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of items to return")
):
    """List user conversations with pagination and eager loading of messages"""
    
    # Set cache header - personal data cached for 5 minutes
    response.headers["Cache-Control"] = "private, max-age=300"
    
    # Total count
    total = db.query(Conversation).filter(
        Conversation.user_id == user.id
    ).count()
    
    # Paginated and optimized query with eager loading
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .options(joinedload(Conversation.messages))  # Eager load messages
        .order_by(Conversation.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # Serializar explicitamente para evitar erros com ORM objects
    items = []
    for conv in conversations:
        items.append({
            "id": conv.id,
            "title": conv.title or "Nova conversa",
            "created_at": conv.created_at.isoformat() if conv.created_at else None,
            "updated_at": conv.updated_at.isoformat() if conv.updated_at else (conv.created_at.isoformat() if conv.created_at else None),
            "messages": [
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "created_at": m.created_at.isoformat() if m.created_at else None
                } for m in (conv.messages or [])
            ]
        })
    
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total
    }

# ============================
# 2. PEGAR CONVERSA ÚNICA (HISTÓRICO) COM PAGINAÇÃO DE MENSAGENS
# ============================
@router.get("/{conversation_id}", response_model=dict)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Message offset for pagination"),
    limit: int = Query(50, ge=1, le=100, description="Number of messages to return")
):
    """Get single conversation with paginated messages"""
    
    conv = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id
        )
        .first()
    )

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversa não encontrada"
        )

    # Get message count
    total_messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).count()
    
    # Get paginated messages
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).offset(skip).limit(limit).all()
    
    return {
        "conversation": {
            "id": conv.id,
            "title": conv.title or "Nova conversa",
            "created_at": conv.created_at.isoformat() if conv.created_at else None,
            "updated_at": conv.updated_at.isoformat() if conv.updated_at else (conv.created_at.isoformat() if conv.created_at else None),
        },
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat() if m.created_at else None
            } for m in messages
        ],
        "message_total": total_messages,
        "message_skip": skip,
        "message_limit": limit,
        "messages_has_more": (skip + limit) < total_messages
    }

# ============================
# 3. CRIAR CONVERSA
# ============================
@router.post("/", response_model=ConversationResponse)
def create_conversation(
    request: CreateConversationRequest = CreateConversationRequest(),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    title = request.title if request.title else "Nova conversa"
    conv = Conversation(
        user_id=user.id,
        title=title
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    return conv

# ============================
# 4. ENVIAR MENSAGEM (CHAT)
# ============================
@router.post("/{conversation_id}/messages")
def send_message(
    conversation_id: int,
    payload: ChatMessage,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user.id
    ).first()

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversa não encontrada"
        )

    # 1. Salva mensagem do usuário (Usando 'content' ou 'text')
    content = payload.text if hasattr(payload, 'text') else payload.content
    
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=content
    )
    db.add(user_msg)
    
    # 2. Prepara dados para a IA (Prompt Personalizado)
    user_data = {
        "name": user.full_name,
        "nickname": user.nickname,
        "birth_date": user.birth_date,
        "gender": user.gender,
        "interests": user.interests,
        "account_type": user.account_type
    }
    
    system_instruction = get_system_prompt(payload.language or "pt-BR", user_data)
    
    # Monta histórico para a API da OpenAI
    messages_query = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at).all()
    history = [{"role": "system", "content": system_instruction}]
    for msg in messages_query:
        history.append({"role": msg.role, "content": msg.content})

    # 3. Chama IA
    try:
        client = get_client()
        response = client.chat.completions.create(
            model="gpt-5.2",
            messages=history
        )
        reply = response.choices[0].message.content

        # 4. Salva resposta da IA
        ai_msg = Message(
            conversation_id=conv.id,
            role="assistant",
            content=reply
        )
        db.add(ai_msg)
        
        # Atualiza o timestamp da conversa
        conv.updated_at = datetime.utcnow()
        
        db.commit()
        return {"conversation_id": conv.id, "reply": reply}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro na IA: {str(e)}")

# ============================
# 5. DUPLICAR CONVERSA
# ============================
@router.post("/{conversation_id}/duplicate", response_model=ConversationResponse)
def duplicate_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    original_conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user.id
    ).first()

    if not original_conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversa não encontrada"
        )

    new_conv = Conversation(user_id=user.id, title=f"Cópia - {original_conv.title}")
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)

    original_messages = db.query(Message).filter(Message.conversation_id == original_conv.id).all()
    for msg in original_messages:
        db.add(Message(conversation_id=new_conv.id, role=msg.role, content=msg.content))
    
    db.commit()
    db.refresh(new_conv)
    return new_conv

# ============================
# 6. RENOMEAR E DELETAR (IGUAIS AO ORIGINAL)
# ============================
@router.put("/{conversation_id}", response_model=ConversationResponse)
def update_conversation(conversation_id: int, request: UpdateConversationRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversa não encontrada"
        )
    conv.title = request.title
    db.commit()
    return conv

@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversa não encontrada"
        )
    db.query(Message).filter(Message.conversation_id == conv.id).delete()
    db.delete(conv)
    db.commit()
    return {"message": "Conversa deletada com sucesso"}