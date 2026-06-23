from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime


# =========================
# STUDENT (resposta leve)
# =========================
class StudentResponse(BaseModel):
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True


# 🆕 CLASSROOM MEMBER SCHEMA
# =========================
class ClassroomMemberCreate(BaseModel):
    """Schema para criar/adicionar membro à sala"""
    user_id: int
    role: str = "student"  # admin, moderator, teacher, student


class ClassroomMemberUpdate(BaseModel):
    """Schema para atualizar role de membro"""
    role: str


class ClassroomMemberResponse(BaseModel):
    """Schema para resposta de membro"""
    id: int
    classroom_id: int
    user_id: int
    role: str
    joined_at: datetime
    
    # Extra info (opcional)
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    
    class Config:
        from_attributes = True


# =========================
# CLASSROOM CREATE
# =========================
class ClassroomCreate(BaseModel):
    name: str


# =========================
# CLASSROOM RESPONSE
# =========================
class ClassroomResponse(BaseModel):
    id: int
    name: str
    code: str
    teacher_id: int
    teacher_name: str = ""
    student_count: int = 0
    status: str = "approved"  # "approved" ou "pending"
    students: List[StudentResponse] = []
    pending_students: List[StudentResponse] = []

    class Config:
        from_attributes = True


# =========================
# CLASSROOM DETAIL (com alunos)
# =========================
class ClassroomDetailResponse(BaseModel):
    id: int
    name: str
    students: List[StudentResponse]
    pending_students: List[StudentResponse] = []

    class Config:
        from_attributes = True


# =========================
# CLASSROOM FULL RESPONSE (com alunos + contagem)
# =========================
class ClassroomFullResponse(BaseModel):
    id: int
    name: str
    code: str
    student_count: int = 0
    students: List[StudentResponse]
    pending_students: List[StudentResponse] = []

    class Config:
        from_attributes = True


# =========================
# CLASSROOM SIMPLE RESPONSE (para contagem dinâmica)
# =========================
class ClassroomSimpleResponse(BaseModel):
    id: int
    name: str
    code: str
    student_count: int = 0

    class Config:
        from_attributes = True


# 🆕 CLASSROOM WITH MEMBERS (novo schema unificado)
# =========================
class ClassroomWithMembersResponse(BaseModel):
    """Schema para sala com membros (roles granulares)"""
    id: int
    name: str
    code: str
    created_at: datetime
    updated_at: datetime
    teacher_id: int
    members: List[ClassroomMemberResponse] = []
    
    class Config:
        from_attributes = True


# =========================
# RELATÓRIO SIMPLES
# =========================
class StudentStats(BaseModel):
    student_id: int
    total_messages: int
    total_conversations: int


class TeacherDashboardResponse(BaseModel):
    total_students: int
    total_classrooms: int
    total_messages: int

# =========================
# CLASSROOM JOIN (aluno entra por código)
# =========================
class ClassroomJoinRequest(BaseModel):
    code: str


class ClassroomJoinResponse(BaseModel):
    id: int
    name: str
    code: str
    teacher_id: int

    class Config:
        from_attributes = True