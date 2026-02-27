from pydantic import BaseModel
from typing import List, Optional
from datetime import date


# =========================
# STUDENT (resposta leve)
# =========================
class StudentResponse(BaseModel):
    id: int
    full_name: str
    email: str

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