"""Runner para executar data migrations versionadas."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Callable, Iterable

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.logger import logger
from app.database.data_migrations.versions import MIGRATIONS

MigrationCallable = Callable[[Session], int]


def _ensure_migrations_table(db: Session) -> None:
    db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS data_migrations (
                version VARCHAR(64) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                applied_at TIMESTAMP NOT NULL
            )
            """
        )
    )
    db.commit()


def _get_applied_versions(db: Session) -> set[str]:
    rows = db.execute(text("SELECT version FROM data_migrations")).fetchall()
    return {row[0] for row in rows}


def _mark_as_applied(db: Session, version: str, name: str) -> None:
    db.execute(
        text(
            "INSERT INTO data_migrations (version, name, applied_at) VALUES (:version, :name, :applied_at)"
        ),
        {
            "version": version,
            "name": name,
            "applied_at": datetime.now(timezone.utc),
        },
    )


def apply_pending_data_migrations(db: Session) -> list[tuple[str, str, int]]:
    """Executa migrations pendentes em ordem de versão."""
    _ensure_migrations_table(db)
    applied_versions = _get_applied_versions(db)

    executed: list[tuple[str, str, int]] = []

    for migration in MIGRATIONS:
        version = migration["version"]
        name = migration["name"]
        upgrade: MigrationCallable = migration["upgrade"]

        if version in applied_versions:
            continue

        logger.info(f"[data-migration] Executando {version} - {name}")

        # Limpar qualquer transação suja de erros anteriores
        try:
            db.rollback()
        except Exception:
            pass

        try:
            affected_rows = upgrade(db)
            db.flush()  # Garante que não há erro pós-upgrade
            _mark_as_applied(db, version, name)
            db.commit()
            executed.append((version, name, affected_rows))
            logger.info(
                f"[data-migration] ✅ {version} aplicada com sucesso. Registros afetados: {affected_rows}"
            )
        except Exception:
            db.rollback()
            logger.exception(f"[data-migration] ❌ Falha ao aplicar {version} - {name} — pulando")
            continue

    return executed
