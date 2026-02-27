from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database.database import Base


class NotificationType(str, enum.Enum):
    """Tipos de notificações"""
    join_request = "join_request"  # Quando aluno solicita acesso a turma
    classroom_join_request = "classroom_join_request"  # Legacy: Quando aluno solicita acesso a turma
    classroom_deleted = "classroom_deleted"
    classroom_removed = "classroom_removed"  # Quando o aluno é removido pelo professor
    classroom_approved = "classroom_approved"  # Quando o aluno é aprovado
    general = "general"


class Notification(Base):
    """Notificações para usuários"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Tipo da notificação
    type = Column(
        Enum(NotificationType),
        default=NotificationType.general,
        nullable=False
    )
    
    # Conteúdo
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    
    # Dados extras (JSON string se necessário)
    data = Column(String, nullable=True)
    
    # Status
    is_read = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    read_at = Column(DateTime, nullable=True)
    
    # Relacionamento
    user = relationship("User", back_populates="notifications")
