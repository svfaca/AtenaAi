from sqlalchemy.orm import Session, Query

from app.models.user import User


def apply_active_user_filter(query: Query) -> Query:
    """Aplica filtro de usuários ativos em qualquer query baseada em User."""
    return query.filter(User.deleted_at.is_(None))


def active_users_query(db: Session) -> Query:
    """Base query para usuários ativos (soft delete aplicado)."""
    return apply_active_user_filter(db.query(User))
