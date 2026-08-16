"""Add missing user columns for PostgreSQL compatibility

Revision ID: b3d5f8e9c2a1
Revises: 9c2ab6c1d7f4
Create Date: 2026-08-03 12:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b3d5f8e9c2a1"
down_revision: Union[str, Sequence[str], None] = "9c2ab6c1d7f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add missing columns using idempotent, cross-database checks.

    Originalmente usava DO $$ (Postgres-only), o que quebrava `alembic upgrade
    head` em bancos SQLite novos. A versão por inspector funciona em SQLite e
    Postgres e é idempotente (não conflita com a branch b12f4e8a9c31, que
    também adiciona deleted_by/delete_scheduled_at).
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "users" not in inspector.get_table_names():
        return

    existing = {col["name"] for col in inspector.get_columns("users")}

    column_defs = {
        "role": sa.Column(
            "role", sa.String(length=20), nullable=False, server_default="student"
        ),
        "nickname": sa.Column("nickname", sa.String(length=255), nullable=True),
        "interests": sa.Column("interests", sa.Text(), nullable=True),
        "profile_image": sa.Column("profile_image", sa.String(length=500), nullable=True),
        "gender": sa.Column("gender", sa.String(length=50), nullable=True),
        "birth_date": sa.Column("birth_date", sa.Date(), nullable=True),
        "deleted_at": sa.Column("deleted_at", sa.DateTime(), nullable=True),
        "deleted_by": sa.Column("deleted_by", sa.Integer(), nullable=True),
        "delete_scheduled_at": sa.Column(
            "delete_scheduled_at", sa.DateTime(), nullable=True
        ),
    }

    for col_name, column in column_defs.items():
        if col_name not in existing:
            op.add_column("users", column)


def downgrade() -> None:
    """Não remove colunas — downgrade irreversível para evitar perda de dados."""
    pass