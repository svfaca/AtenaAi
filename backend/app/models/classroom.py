from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database.database import Base


classroom_students = Table(
    "classroom_students",
    Base.metadata,
    Column("classroom_id", ForeignKey("classrooms.id", ondelete="CASCADE")),
    Column("student_id", ForeignKey("users.id", ondelete="CASCADE"))
)

# 🆕 TABELA PARA ALUNOS AGUARDANDO APROVAÇÃO
pending_classroom_students = Table(
    "pending_classroom_students",
    Base.metadata,
    Column("classroom_id", ForeignKey("classrooms.id", ondelete="CASCADE")),
    Column("student_id", ForeignKey("users.id", ondelete="CASCADE"))
)


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)

    # 🔥 NOVO: código da turma
    code = Column(String, unique=True, index=True, nullable=False)

    teacher_id = Column(Integer, ForeignKey("users.id"))

    teacher = relationship("User", back_populates="classrooms_owned")
    students = relationship("User", secondary=classroom_students)
    # 🆕 Alunos aguardando aprovação
    pending_students = relationship("User", secondary=pending_classroom_students)
