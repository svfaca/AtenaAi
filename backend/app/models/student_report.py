from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from datetime import datetime

from app.database.database import Base


class StudentReport(Base):
    __tablename__ = "student_reports"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"), index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
