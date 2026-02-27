from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    
    # Chave estrangeira para a tabela de conversas
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    
    # Papel de quem enviou: 'user', 'assistant' ou 'system'
    role = Column(String, nullable=False)
    
    # Conteúdo da mensagem (Text para suportar mensagens longas)
    content = Column(Text, nullable=False)
    
    # Data de criação automática
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ✅ RELACIONAMENTO USANDO STRING (Evita erro de import circular)
    conversation = relationship("Conversation", back_populates="messages")