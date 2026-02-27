from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User, UserRole
from app.core.permissions import require_role

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# =========================
# LISTAR USUÁRIOS
# =========================
@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    return db.query(User).all()


# =========================
# PROMOVER USUÁRIO
# =========================
@router.post("/users/{user_id}/promote")
def promote_user(
    user_id: int,
    new_role: UserRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(404, "Usuário não encontrado")

    user.role = new_role.value
    db.commit()

    return {
        "user_id": user.id,
        "email": user.email,
        "new_role": user.role
    }
