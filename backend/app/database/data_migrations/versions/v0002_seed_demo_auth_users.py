"""Seed de contas demo para desenvolvimento local."""

from sqlalchemy.orm import Session

from app.core.config import ENVIRONMENT
from app.core.security import get_password_hash
from app.models.user import User, UserRole


DEMO_USERS = [
    {
        "email": "teste@teste.com",
        "full_name": "Aluno Demo",
        "role": UserRole.student,
    },
    {
        "email": "prof@teste.com",
        "full_name": "Professor Demo",
        "role": UserRole.teacher,
    },
]


def upgrade(db: Session) -> int:
    """Cria usuários demo apenas em desenvolvimento e somente se a base estiver vazia."""
    if ENVIRONMENT == "production":
        return 0

    if db.query(User).count() > 0:
        return 0

    password_hash = get_password_hash("123456")
    created_count = 0

    for demo_user in DEMO_USERS:
        db.add(
            User(
                email=demo_user["email"],
                hashed_password=password_hash,
                full_name=demo_user["full_name"],
                role=demo_user["role"],
            )
        )
        created_count += 1

    return created_count


migration = {
    "version": "0002",
    "name": "seed_demo_auth_users",
    "upgrade": upgrade,
}