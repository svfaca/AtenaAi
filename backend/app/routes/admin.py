from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User, UserRole
from app.core.permissions import require_role

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


class AdminUserResponse(BaseModel):
    """Resposta segura de admin — NUNCA expõe hashed_password."""
    id: int
    email: str
    full_name: str
    role: str
    account_type: Optional[str] = None
    nickname: Optional[str] = None
    interests: Optional[str] = None
    profile_image: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[int] = None

    class Config:
        from_attributes = True


# =========================
# LISTAR USUÁRIOS
# =========================
@router.get("/users", response_model=List[AdminUserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    # 🔒 response_model explícito impede a serialização de hashed_password
    return db.query(User).order_by(User.id.desc()).all()


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
