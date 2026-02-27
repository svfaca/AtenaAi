from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta

from app.database.database import get_db
from app.models.user import User, UserRole
from app.models.classroom import Classroom, classroom_students
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.student_report import StudentReport

from app.core.permissions import require_role
from app.services.report_service import generate_student_report

router = APIRouter(
    prefix="/teacher",
    tags=["Teacher"]
)

# =========================================================
# STUDENTS
# =========================================================

@router.post("/classrooms/{classroom_id}/students/{student_id}")
def add_student(
    classroom_id: int,
    student_id: int,
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db)
):
    classroom = db.query(Classroom).filter_by(
        id=classroom_id,
        teacher_id=current_user.id
    ).first()

    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sala não encontrada"
        )

    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado"
        )

    # evita duplicação
    exists = db.execute(
        classroom_students.select().where(
            classroom_students.c.classroom_id == classroom_id,
            classroom_students.c.student_id == student_id
        )
    ).first()

    if exists:
        return {"message": "Aluno já está na sala"}

    db.execute(
        classroom_students.insert().values(
            classroom_id=classroom_id,
            student_id=student_id
        )
    )

    db.commit()
    return {"message": "Aluno adicionado"}


@router.get("/students/{student_id}/conversations")
def student_conversations(
    student_id: int,
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of items to return")
):
    """Get student conversations with pagination and eager loading (optimized)"""
    # 🔒 garante que o aluno pertence a alguma sala do professor
    link = db.execute(
        classroom_students.select()
        .join(Classroom)
        .where(
            classroom_students.c.student_id == student_id,
            Classroom.teacher_id == current_user.id
        )
    ).first()

    if not link:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Aluno não pertence às suas salas"
        )

    # Get total count
    total = db.query(Conversation).filter(
        Conversation.user_id == student_id
    ).count()
    
    # Get paginated conversations with eager loading of messages
    conversations = db.query(Conversation).filter(
        Conversation.user_id == student_id
    ).options(joinedload(Conversation.messages)).order_by(
        Conversation.updated_at.desc()
    ).offset(skip).limit(limit).all()
    
    return {
        "items": conversations,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total
    }


# =========================================================
# REPORTS (IA + CACHE)
# =========================================================

@router.get("/students/{student_id}/report")
def student_report(
    student_id: int,
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db)
):
    # mesma validação de pertencimento
    link = db.execute(
        classroom_students.select()
        .join(Classroom)
        .where(
            classroom_students.c.student_id == student_id,
            Classroom.teacher_id == current_user.id
        )
    ).first()

    if not link:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Aluno não pertence às suas salas"
        )

    report = generate_student_report(student_id, db)
    return {"report": report}


# =========================================================
# DASHBOARD
# =========================================================

@router.get("/dashboard")
def teacher_dashboard(
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db)
):
    classrooms = db.query(Classroom).filter(
        Classroom.teacher_id == current_user.id
    ).all()

    classroom_ids = [c.id for c in classrooms]

    # alunos únicos (apenas alunos que ainda existem como usuários)
    students_count = 0
    if classroom_ids:
        # JOIN com User para garantir que apenas alunos válidos sejam contados
        students_count = (
            db.query(func.count(func.distinct(classroom_students.c.student_id)))
            .join(User, User.id == classroom_students.c.student_id)
            .filter(classroom_students.c.classroom_id.in_(classroom_ids))
            .scalar()
        ) or 0
        
        # Debug: listar alunos encontrados
        if students_count > 0:
            from app.core.logger import logger
            student_ids = db.query(classroom_students.c.student_id).filter(
                classroom_students.c.classroom_id.in_(classroom_ids)
            ).distinct().all()
            logger.debug(f"[TEACHER] Total alunos: {students_count}, IDs: {[s[0] for s in student_ids]}")

    # mensagens
    total_messages = 0
    if classroom_ids:
        total_messages = (
            db.query(func.count(Message.id))
            .join(Conversation)
            .join(classroom_students,
                  classroom_students.c.student_id == Conversation.user_id)
            .filter(classroom_students.c.classroom_id.in_(classroom_ids))
            .scalar()
        )

    # relatórios (somente alunos do professor)
    today = datetime.utcnow() - timedelta(days=1)

    reports_today = (
        db.query(func.count(StudentReport.id))
        .join(User)
        .join(classroom_students,
              classroom_students.c.student_id == User.id)
        .join(Classroom,
              Classroom.id == classroom_students.c.classroom_id)
        .filter(
            Classroom.teacher_id == current_user.id,
            StudentReport.created_at >= today
        )
        .scalar()
    )

    return {
        "total_classrooms": len(classrooms),
        "total_students": students_count,
        "total_messages": total_messages or 0,
        "reports_today": reports_today or 0
    }


# =========================================================
# LIST ALL STUDENTS WITH ACTIVITY
# =========================================================

@router.get("/students")
def list_all_students(
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100, description="Number of items to return")
):
    """Get all students of the teacher with their last activity"""
    classrooms = db.query(Classroom).filter(
        Classroom.teacher_id == current_user.id
    ).all()

    classroom_ids = [c.id for c in classrooms]
    if not classroom_ids:
        return {"items": [], "total": 0}

    # Map de todas as turmas por aluno (para permitir remoção mesmo com múltiplas turmas)
    classroom_map_rows = db.query(
        classroom_students.c.student_id,
        classroom_students.c.classroom_id
    ).join(
        Classroom,
        Classroom.id == classroom_students.c.classroom_id
    ).filter(
        Classroom.teacher_id == current_user.id
    ).all()

    classroom_map = {}
    for sid, cid in classroom_map_rows:
        classroom_map.setdefault(sid, []).append(cid)

    # Get all students with one classroom (para mostrar no card) e última atividade
    students = db.query(
        User.id,
        User.full_name,
        User.profile_image,
        Classroom.id.label("classroom_id"),
        Classroom.name.label("classroom_name"),
        func.max(Conversation.updated_at).label("last_activity")
    ).join(
        classroom_students,
        classroom_students.c.student_id == User.id
    ).join(
        Classroom,
        Classroom.id == classroom_students.c.classroom_id
    ).outerjoin(
        Conversation,
        Conversation.user_id == User.id
    ).filter(
        Classroom.teacher_id == current_user.id
    ).group_by(
        User.id,
        User.full_name,
        User.profile_image,
        Classroom.id,
        Classroom.name
    ).order_by(
        User.full_name
    ).limit(limit).all()

    items = []
    for student in students:
        items.append({
            "id": student.id,
            "full_name": student.full_name,
            "profile_image": student.profile_image,
            "classroom_id": student.classroom_id,
            "classroom_ids": classroom_map.get(student.id, []),
            "classroom_name": student.classroom_name,
            "last_activity": student.last_activity
        })

    return {
        "items": items,
        "total": len(items)
    }

# =========================================================
# CLEANUP: REMOVE ORPHAN STUDENT RECORDS
# =========================================================

@router.post("/cleanup-orphans")
def cleanup_orphan_students(
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db)
):
    """Remove registros órfãos de alunos que não existem mais"""
    classrooms = db.query(Classroom).filter(
        Classroom.teacher_id == current_user.id
    ).all()
    
    classroom_ids = [c.id for c in classrooms]
    
    if not classroom_ids:
        return {"message": "Nenhuma turma encontrada", "removed": 0}
    
    # Encontrar registros órfãos em classroom_students
    orphan_records = db.query(classroom_students.c.student_id).filter(
        classroom_students.c.classroom_id.in_(classroom_ids)
    ).outerjoin(User, User.id == classroom_students.c.student_id).filter(
        User.id == None
    ).all()
    
    removed_count = 0
    if orphan_records:
        orphan_ids = [r[0] for r in orphan_records]
        logger.info(f"[TEACHER] Removendo registros órfãos: {len(orphan_ids)} encontrados")
        
        # Remover registros órfãos
        db.execute(
            classroom_students.delete().where(
                classroom_students.c.classroom_id.in_(classroom_ids),
                classroom_students.c.student_id.in_(orphan_ids)
            )
        )
        removed_count = len(orphan_ids)
        db.commit()
    
    return {
        "message": f"Limpeza concluída",
        "removed": removed_count
    }