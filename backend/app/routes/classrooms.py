from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List

from app.database.database import get_db
from app.models.user import User, UserRole
from app.models.classroom import Classroom, classroom_students, pending_classroom_students
from app.models.notification import Notification, NotificationType
from app.core.dependencies import get_current_user
from app.core.permissions import require_role
from app.schemas.teacher import ClassroomJoinRequest, ClassroomJoinResponse, ClassroomCreate, ClassroomResponse, ClassroomDetailResponse, StudentResponse, ClassroomFullResponse, ClassroomSimpleResponse
from app.utils.classroom_code import generate_classroom_code

router = APIRouter(
    prefix="/classrooms",
    tags=["Classrooms"]
)


# =========================================================
# TEACHER: CREATE CLASSROOM
# =========================================================

@router.post("", response_model=ClassroomResponse)
def create_classroom(
    data: ClassroomCreate,
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db)
):
    """Professor cria uma nova sala de aula"""
    # 🔒 garante código único
    code = generate_classroom_code()
    while db.query(Classroom).filter(Classroom.code == code).first():
        code = generate_classroom_code()

    classroom = Classroom(
        name=data.name,
        code=code,
        teacher_id=current_user.id
    )

    db.add(classroom)
    db.commit()
    db.refresh(classroom)

    return classroom


# =========================================================
# TEACHER: LIST CLASSROOMS
# =========================================================

@router.get("", response_model=dict)
def list_classrooms(
    response: Response,
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of items to return")
):
    """Professor lista suas salas de aula com contagem de alunos e alunos pendentes (optimizado com eager loading)"""

    # Não cachear listagem de turmas para evitar mostrar registros já deletados
    response.headers["Cache-Control"] = "no-store"
    
    # Get total count
    total = db.query(Classroom).filter(
        Classroom.teacher_id == current_user.id
    ).count()
    
    # Query with eager loading to avoid N+1
    classrooms = db.query(Classroom).filter(
        Classroom.teacher_id == current_user.id
    ).options(
        joinedload(Classroom.teacher),
        joinedload(Classroom.students),
        joinedload(Classroom.pending_students)
    ).order_by(Classroom.id.desc()).offset(skip).limit(limit).all()
    
    # Adiciona student_count e pending_students para cada classroom
    result = []
    for classroom in classrooms:
        # Obter informações do professor (já carregado via joinedload)
        teacher_info = {
            "id": classroom.teacher.id,
            "full_name": classroom.teacher.full_name,
            "email": classroom.teacher.email
        } if classroom.teacher else None
        
        # Contar apenas alunos válidos (que ainda existem como usuários) - mesma lógica do dashboard
        valid_students_count = (
            db.query(func.count(classroom_students.c.student_id))
            .join(User, User.id == classroom_students.c.student_id)
            .filter(classroom_students.c.classroom_id == classroom.id)
            .scalar()
        ) or 0
        
        # Converter pending_students para lista de dicts (já carregado via joinedload)
        pending_students_list = [
            {
                "id": student.id,
                "full_name": student.full_name,
                "email": student.email
            }
            for student in classroom.pending_students
        ]
        
        classroom_dict = {
            "id": classroom.id,
            "name": classroom.name,
            "code": classroom.code,
            "teacher_id": classroom.teacher_id,
            "teacher": teacher_info,
            "student_count": valid_students_count,
            "students": [
                {
                    "id": student.id,
                    "full_name": student.full_name,
                    "email": student.email
                }
                for student in classroom.students
            ],
            "pending_students": pending_students_list
        }
        result.append(classroom_dict)
    
    from app.core.logger import logger
    logger.debug(f"[CLASSROOMS] Professor {current_user.id} - Turmas com alunos pendentes: {len(result)}")
    
    return {
        "items": result,
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total
    }


# =========================================================
# STUDENT: LIST MY CLASSROOMS
# =========================================================

@router.get("/my", response_model=List[ClassroomResponse])
def list_my_classrooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aluno lista as salas em que está matriculado (aprovadas) + aguardando aprovação"""
    try:
        result = []
        
        # ===== SALAS APROVADAS =====
        approved_classrooms = db.query(Classroom).join(
            classroom_students,
            classroom_students.c.classroom_id == Classroom.id
        ).filter(
            classroom_students.c.student_id == current_user.id
        ).all()
        
        for classroom in approved_classrooms:
            # Forçar carregamento das relações
            db.refresh(classroom)
            
            teacher = db.query(User).filter(User.id == classroom.teacher_id).first()
            teacher_info = {
                "id": teacher.id,
                "full_name": teacher.full_name,
                "email": teacher.email
            } if teacher else None
            
            student_count = db.query(func.count()).select_from(classroom_students).filter(
                classroom_students.c.classroom_id == classroom.id
            ).scalar() or 0
            
            classroom_dict = {
                "id": classroom.id,
                "name": classroom.name,
                "code": classroom.code,
                "teacher_id": classroom.teacher_id,
                "teacher": teacher_info,
                "student_count": student_count,
                "students": [
                    {
                        "id": student.id,
                        "full_name": student.full_name,
                        "email": student.email
                    }
                    for student in classroom.students
                ],
                "pending_students": [],  # Alunos não veem pending
                "status": "approved"
            }
            result.append(classroom_dict)
        
        # ===== SALAS AGUARDANDO APROVAÇÃO =====
        pending_classrooms = db.query(Classroom).join(
            pending_classroom_students,
            pending_classroom_students.c.classroom_id == Classroom.id
        ).filter(
            pending_classroom_students.c.student_id == current_user.id
        ).all()
        
        for classroom in pending_classrooms:
            teacher = db.query(User).filter(User.id == classroom.teacher_id).first()
            teacher_info = {
                "id": teacher.id,
                "full_name": teacher.full_name,
                "email": teacher.email
            } if teacher else None
            
            student_count = db.query(func.count()).select_from(classroom_students).filter(
                classroom_students.c.classroom_id == classroom.id
            ).scalar() or 0
            
            classroom_dict = {
                "id": classroom.id,
                "name": classroom.name,
                "code": classroom.code,
                "teacher_id": classroom.teacher_id,
                "teacher": teacher_info,
                "student_count": student_count,
                "students": [],  # Não mostra students enquanto pendente
                "pending_students": [],
                "status": "pending"
            }
            result.append(classroom_dict)
        
        from app.core.logger import logger
        logger.debug(f"[CLASSROOMS] User {current_user.id} - Approved: {len(approved_classrooms)}, Pending: {len(pending_classrooms)}")
        
        return result
    except Exception as e:
        from app.core.logger import logger
        logger.error(f"[CLASSROOMS] list_my_classrooms erro: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{classroom_id}/leave")
def leave_classroom(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aluno sai de uma sala"""
    # Verifica se o aluno está na sala
    membership = db.execute(
        classroom_students.select().where(
            classroom_students.c.classroom_id == classroom_id,
            classroom_students.c.student_id == current_user.id
        )
    ).fetchone()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Você não está nesta turma"
        )
    
    # Remove o aluno da sala
    db.execute(
        classroom_students.delete().where(
            classroom_students.c.classroom_id == classroom_id,
            classroom_students.c.student_id == current_user.id
        )
    )
    db.commit()
    
    return {"message": "Você saiu da turma com sucesso"}


# =========================================================
# STUDENT: CANCEL JOIN REQUEST (remover de pending)
# =========================================================

@router.delete("/{classroom_id}/cancel-request")
def cancel_join_request(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aluno cancela sua solicitação de entrada em uma sala"""
    # Verifica se o aluno está na lista de aguardando
    pending = db.execute(
        pending_classroom_students.select().where(
            pending_classroom_students.c.classroom_id == classroom_id,
            pending_classroom_students.c.student_id == current_user.id
        )
    ).fetchone()
    
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Você não tem uma solicitação pendente nesta turma"
        )
    
    # Remove da lista de aguardando
    db.execute(
        pending_classroom_students.delete().where(
            pending_classroom_students.c.classroom_id == classroom_id,
            pending_classroom_students.c.student_id == current_user.id
        )
    )
    db.commit()
    
    return {"message": "Solicitação de entrada cancelada com sucesso"}


# =========================================================
# GET CLASSROOM DETAIL (Teacher or Approved Student)
# =========================================================

@router.get("/{classroom_id}", response_model=ClassroomFullResponse)
def classroom_detail(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtém detalhes de uma sala específica (professor ou aluno aprovado)"""
    classroom = db.query(Classroom).filter_by(id=classroom_id).first()
    if not classroom:
        raise HTTPException(404, "Sala não encontrada")
    
    # Verificar permissão: professor OU aluno aprovado
    is_teacher = classroom.teacher_id == current_user.id
    is_approved_student = db.query(classroom_students).filter(
        classroom_students.c.classroom_id == classroom_id,
        classroom_students.c.student_id == current_user.id
    ).first() is not None
    
    if not is_teacher and not is_approved_student:
        raise HTTPException(403, "Permissão insuficiente")
    
    # Contar alunos válidos
    valid_students_count = (
        db.query(func.count(classroom_students.c.student_id))
        .join(User, User.id == classroom_students.c.student_id)
        .filter(classroom_students.c.classroom_id == classroom_id)
        .scalar()
    ) or 0
    
    # Format response explicitly
    response = ClassroomFullResponse(
        id=classroom.id,
        name=classroom.name,
        code=classroom.code,
        student_count=valid_students_count,
        students=[
            StudentResponse(id=s.id, full_name=s.full_name, email=s.email)
            for s in classroom.students
        ],
        pending_students=[
            StudentResponse(id=s.id, full_name=s.full_name, email=s.email)
            for s in classroom.pending_students
        ]
    )
    return response


# =========================================================
# GET CLASSROOM QUICK INFO (apenas student_count)
# =========================================================

@router.get("/{classroom_id}/info", response_model=ClassroomSimpleResponse)
def classroom_info(
    classroom_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtém informações rápidas de uma sala (student_count)"""
    classroom = db.query(Classroom).filter_by(id=classroom_id).first()
    if not classroom:
        raise HTTPException(404, "Sala não encontrada")
    
    # Contar alunos válidos
    valid_students_count = (
        db.query(func.count(classroom_students.c.student_id))
        .join(User, User.id == classroom_students.c.student_id)
        .filter(classroom_students.c.classroom_id == classroom_id)
        .scalar()
    ) or 0
    
    response = ClassroomSimpleResponse(
        id=classroom.id,
        name=classroom.name,
        code=classroom.code,
        student_count=valid_students_count
    )
    return response# =========================================================
# ETAPA 1: STUDENT JOIN CLASSROOM BY CODE
# =========================================================

@router.post("/join", response_model=ClassroomJoinResponse)
def join_classroom(
    data: ClassroomJoinRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Aluno entra em uma sala usando código.
    
    🔒 Segurança (ETAPA 2):
    - Valida que user é student
    - Previne entrada duplicada
    - Garante código válido
    """
    
    # 🔒 ETAPA 2: Garante que apenas students podem entrar
    if current_user.role != UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas alunos podem entrar em salas via código"
        )
    
    # Busca a classroom pelo código
    classroom = db.query(Classroom).filter(
        Classroom.code == data.code
    ).first()
    
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código de sala inválido ou expirado"
        )
    
    # 🔒 ETAPA 2: Verifica se aluno já está na sala
    already_joined = db.execute(
        classroom_students.select().where(
            classroom_students.c.classroom_id == classroom.id,
            classroom_students.c.student_id == current_user.id
        )
    ).first()
    
    if already_joined:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você já está matriculado nesta sala"
        )
    
    # 🆕 Verifica se já está na lista de aprovação
    already_pending = db.execute(
        pending_classroom_students.select().where(
            pending_classroom_students.c.classroom_id == classroom.id,
            pending_classroom_students.c.student_id == current_user.id
        )
    ).first()
    
    if already_pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você já solicitou acesso a esta sala, aguarde aprovação"
        )
    
    # 🆕 Adiciona à lista de aguardando aprovação
    db.execute(
        pending_classroom_students.insert().values(
            classroom_id=classroom.id,
            student_id=current_user.id
        )
    )
    
    # 🔔 Criar notificação para o professor
    teacher = db.query(User).filter(User.id == classroom.teacher_id).first()
    if teacher:
        notification = Notification(
            user_id=teacher.id,
            type=NotificationType.join_request,
            title="Nova solicitação de acesso",
            message=f'O aluno "{current_user.full_name}" solicitou para entrar na turma "{classroom.name}"'
        )
        db.add(notification)
    
    db.commit()
    db.refresh(classroom)
    
    return classroom


# =========================================================
# 🆕 TEACHER: APPROVE/REJECT PENDING STUDENTS
# =========================================================

@router.post("/{classroom_id}/students/{student_id}/approve")
def approve_student(
    classroom_id: int,
    student_id: int,
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db)
):
    """Professor aprova um aluno aguardando acesso"""
    # Verifica se o professor é dono da sala
    classroom = db.query(Classroom).filter_by(
        id=classroom_id,
        teacher_id=current_user.id
    ).first()

    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sala não encontrada"
        )

    # Remove do pending
    db.execute(
        pending_classroom_students.delete().where(
            pending_classroom_students.c.classroom_id == classroom_id,
            pending_classroom_students.c.student_id == student_id
        )
    )

    # Adiciona aos alunos aprovados
    already_approved = db.execute(
        classroom_students.select().where(
            classroom_students.c.classroom_id == classroom_id,
            classroom_students.c.student_id == student_id
        )
    ).first()

    if not already_approved:
        db.execute(
            classroom_students.insert().values(
                classroom_id=classroom_id,
                student_id=student_id
            )
        )

    db.commit()
    return {"message": "Aluno aprovado com sucesso"}


@router.delete("/{classroom_id}/students/{student_id}/reject")
def reject_student(
    classroom_id: int,
    student_id: int,
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db)
):
    """Professor rejeita um aluno aguardando acesso"""
    # Verifica se o professor é dono da sala
    classroom = db.query(Classroom).filter_by(
        id=classroom_id,
        teacher_id=current_user.id
    ).first()

    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sala não encontrada"
        )

    # Remove do pending
    db.execute(
        pending_classroom_students.delete().where(
            pending_classroom_students.c.classroom_id == classroom_id,
            pending_classroom_students.c.student_id == student_id
        )
    )

    db.commit()
    return {"message": "Aluno rejeitado"}


# =========================================================
# 🆕 TEACHER: REMOVE APPROVED STUDENT FROM CLASSROOM
# =========================================================

@router.delete("/{classroom_id}/students/{student_id}")
def remove_student_from_classroom(
    classroom_id: int,
    student_id: int,
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db)
):
    """Professor remove um aluno aprovado da turma"""
    # Verifica se o professor é dono da sala
    classroom = db.query(Classroom).filter_by(
        id=classroom_id,
        teacher_id=current_user.id
    ).first()

    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sala não encontrada"
        )

    # Verifica se o aluno está na sala
    membership = db.execute(
        classroom_students.select().where(
            classroom_students.c.classroom_id == classroom_id,
            classroom_students.c.student_id == student_id
        )
    ).fetchone()

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não está nesta turma"
        )

    # Remove do classroom_students (alunos aprovados)
    db.execute(
        classroom_students.delete().where(
            classroom_students.c.classroom_id == classroom_id,
            classroom_students.c.student_id == student_id
        )
    )

    db.commit()
    return {"message": "Aluno removido da turma com sucesso"}


# =========================================================
# TEACHER: DELETE CLASSROOM
# ========================================================

@router.delete("/{classroom_id}")
def delete_classroom(
    classroom_id: int,
    current_user: User = Depends(require_role(UserRole.teacher)),
    db: Session = Depends(get_db)
):
    """Professor exclui uma sala de aula"""
    from app.core.logger import logger
    
    try:
        logger.info(f"[CLASSROOMS] DELETE iniciado para turma {classroom_id} pelo professor {current_user.id}")
        
        # Buscar a turma
        classroom = db.query(Classroom).filter_by(
            id=classroom_id,
            teacher_id=current_user.id
        ).first()

        if not classroom:
            logger.warning(f"[CLASSROOMS] Turma {classroom_id} não encontrada ou não pertence ao professor {current_user.id}")
            raise HTTPException(404, "Sala não encontrada")

        classroom_name = classroom.name
        logger.info(f"[CLASSROOMS] Encontrada turma '{classroom_name}' (ID: {classroom_id})")

        # Deletar a turma (CASCADE vai cuidar dos relacionamentos)
        logger.info(f"[CLASSROOMS] Deletando turma {classroom_id}...")
        db.delete(classroom)
        logger.info(f"[CLASSROOMS] Turma {classroom_id} marcada para deleção")
        
        db.commit()
        logger.info(f"[CLASSROOMS] Turma {classroom_id} deletada com sucesso via commit")
        
        return {"message": f"Sala '{classroom_name}' excluída com sucesso"}
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        import traceback
        logger.error(f"[CLASSROOMS] ❌ ERRO ao deletar turma {classroom_id}: {str(e)}", exc_info=True)
        logger.error(f"[CLASSROOMS] Traceback completo:\n{traceback.format_exc()}")
        raise HTTPException(500, f"Erro ao deletar sala: {str(e)}")



