"""
Job de purga de dados — LGPD/GDPR + higiene de tabelas auxiliares.

- purge_soft_deleted_users: exclusão DEFINITIVA de contas soft-deletadas há
  mais de N dias (o soft delete preserva integridade; após o prazo de retenção
  mínima, a LGPD exige eliminação de fato).
- purge_old_guest_usage: remove contadores de visitantes antigos, evitando
  crescimento infinito da tabela guest_chat_usage.

Execução manual (dev):
    cd backend
    python -m app.utilities.data_purge --soft-delete-days 30 --guest-usage-days 30

Produção: agendar via cron/scheduler chamando run_purge().
"""
import argparse
from datetime import datetime, timedelta, date

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.guest_chat_usage import GuestChatUsage
from app.core.logger import logger


def purge_soft_deleted_users(db: Session, older_than_days: int = 30) -> int:
    """
    Exclusão DEFINITIVA de contas soft-deletadas há mais de `older_than_days`
    dias. Os relacionamentos (conversas, mensagens, memberships, notificações,
    group messages, salas) são removidos pelos cascades do model SQLAlchemy.

    Requisito LGPD/GDPR: retenção mínima — após o prazo, eliminar de fato.
    """
    cutoff = datetime.utcnow() - timedelta(days=older_than_days)
    users = (
        db.query(User)
        .filter(User.deleted_at.isnot(None), User.deleted_at < cutoff)
        .all()
    )

    count = 0
    for user in users:
        logger.info(
            f"[PURGE] Hard delete definitivo de User ID={user.id} (email={user.email})"
        )
        db.delete(user)
        count += 1

    db.commit()
    return count


def purge_old_guest_usage(db: Session, older_than_days: int = 30) -> int:
    """
    Remove contadores de visitantes com mais de `older_than_days` dias.
    Evita crescimento infinito da tabela guest_chat_usage.
    """
    cutoff = date.today() - timedelta(days=older_than_days)
    count = (
        db.query(GuestChatUsage)
        .filter(GuestChatUsage.usage_date < cutoff)
        .delete(synchronize_session=False)
    )
    db.commit()
    return count


def run_purge(
    db: Session,
    soft_delete_days: int = 30,
    guest_usage_days: int = 30,
) -> dict:
    """Executa todas as purgas e retorna o resultado."""
    users = purge_soft_deleted_users(db, soft_delete_days)
    guests = purge_old_guest_usage(db, guest_usage_days)
    logger.info(f"[PURGE] users_purged={users} guest_usage_purged={guests}")
    return {"users_purged": users, "guest_usage_purged": guests}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Purga de dados (LGPD/GDPR + higiene de tabelas)"
    )
    parser.add_argument("--soft-delete-days", type=int, default=30)
    parser.add_argument("--guest-usage-days", type=int, default=30)
    args = parser.parse_args()

    from app.database.database import SessionLocal

    db = SessionLocal()
    try:
        result = run_purge(db, args.soft_delete_days, args.guest_usage_days)
        print(result)
    finally:
        db.close()
