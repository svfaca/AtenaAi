"""v0001: normaliza interesses de usuários para o padrão atual."""

from sqlalchemy.orm import Session

from app.models.user import User
from app.utilities.interests import normalize_interests


def upgrade(db: Session) -> int:
    """Normaliza interesses legados de todos os usuários."""
    try:
        users = db.query(User).all()
    except Exception:
        # Colunas do modelo podem não existir ainda (ex: role, interests)
        # Deixa a migration Alembic criar as colunas primeiro
        return 0

    updated_count = 0

    for user in users:
        if not user.interests:
            continue

        try:
            normalized = normalize_interests(user.interests)
            if normalized != user.interests:
                user.interests = normalized
                updated_count += 1
        except Exception:
            # Pula usuários com dados inválidos
            continue

    return updated_count


migration = {
    "version": "0001",
    "name": "normalize_user_interests",
    "upgrade": upgrade,
}
