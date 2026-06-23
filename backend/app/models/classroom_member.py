from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database.database import Base


class ClassroomMemberRole(str, enum.Enum):
    """Roles disponíveis em uma classroom"""
    admin = "admin"           # Controle total
    moderator = "moderator"   # Gerencia mensagens
    teacher = "teacher"       # Dono da sala (instructor)
    student = "student"       # Aluno padrão


class ClassroomMember(Base):
    """Membros de uma classroom com roles granulares"""
    __tablename__ = "classroom_members"

    id = Column(Integer, primary_key=True, index=True)
    
    # Relacionamentos
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Role na classroom
    role = Column(
        Enum(ClassroomMemberRole),
        default=ClassroomMemberRole.student,
        nullable=False
    )
    
    # Timestamps
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    classroom = relationship("Classroom", back_populates="members")
    user = relationship("User", back_populates="classroom_memberships")
    
    def __repr__(self):
        return f"<ClassroomMember user={self.user_id} classroom={self.classroom_id} role={self.role}>"
