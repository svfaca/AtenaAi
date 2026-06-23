from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database.database import Base


# ✅ Enum profissional (sem string solta)
class UserRole(str, enum.Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"   # já prepara instituição


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # ========================
    # Auth
    # ========================
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # ========================
    # Dados básicos
    # ========================
    full_name = Column(String, nullable=False)

    role = Column(
        Enum(UserRole),
        default=UserRole.student,
        nullable=False
    )

    # ========================
    # Perfil
    # ========================
    nickname = Column(String, nullable=True)
    interests = Column(Text, nullable=True)
    profile_image = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    birth_date = Column(Date, nullable=True)

    # ========================
    # Soft Delete
    # ========================
    deleted_at = Column(DateTime, nullable=True, default=None, index=True)
    deleted_by = Column(Integer, nullable=True)
    delete_scheduled_at = Column(DateTime, nullable=True)

    # ========================
    # Relacionamentos
    # ========================
    conversations = relationship(
        "Conversation",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # 🔥 prepara professor
    classrooms_owned = relationship(
        "Classroom",
        back_populates="teacher",
        cascade="all, delete"
    )
    
    # Notificações
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # 🆕 Memberships em classrooms com roles
    classroom_memberships = relationship(
        "ClassroomMember",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # Group messages
    group_messages = relationship(
        "GroupMessage",
        back_populates="user",
        cascade="all, delete-orphan"
    )
