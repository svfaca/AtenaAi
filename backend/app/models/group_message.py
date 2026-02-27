from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base


class GroupMessage(Base):
    """Mensagens enviadas em salas de aula (grupo)"""
    __tablename__ = "group_messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relações
    classroom = relationship("Classroom", backref="messages")
    user = relationship("User", backref="group_messages")
