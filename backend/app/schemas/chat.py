from pydantic import BaseModel
from typing import List, Optional, Any

class MessageCreate(BaseModel):
    # ✅ CORREÇÃO: Tornamos content opcional e adicionamos text
    # Isso permite que o backend aceite o JSON vindo do JS sem dar erro 422
    content: Optional[str] = None
    text: Optional[str] = None  # <--- O JS do seu chat-page.js usa esse nome
    
    language: Optional[str] = "pt-BR"
    
    # IDs (usados apenas se estiver logado)
    conversation_id: Optional[int] = None
    user_id: Optional[int] = None

    # Campos de perfil (opcionais)
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    user_nickname: Optional[str] = None
    user_role: Optional[str] = None
    user_interests: Optional[str] = None
    user_gender: Optional[str] = None
    user_birth_date: Optional[Any] = None

    # Limite de mensagens do histórico a carregar
    history_limit: Optional[int] = 10

    # Histórico temporário (para modo convidado)
    history: Optional[List[dict]] = None 

# --- Restante dos Schemas permanece igual ---
class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: Any

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: Any
    updated_at: Any
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True