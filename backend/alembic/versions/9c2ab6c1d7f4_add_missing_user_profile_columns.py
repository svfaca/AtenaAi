"""add missing user profile columns

Revision ID: 9c2ab6c1d7f4
Revises: a8d5f7e3c1f9
Create Date: 2026-03-08 19:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = "9c2ab6c1d7f4"
down_revision: Union[str, Sequence[str], None] = "a8d5f7e3c1f9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _get_table_columns(table_name: str) -> set[str]:
    bind = op.get_bind()
    rows = bind.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
    return {row[1] for row in rows}


def upgrade() -> None:
    """Add missing profile columns expected by the SQLAlchemy User model."""
    existing_columns = _get_table_columns("users")

    if "nickname" not in existing_columns:
        op.add_column("users", sa.Column("nickname", sa.String(), nullable=True))

    if "profile_image" not in existing_columns:
        op.add_column("users", sa.Column("profile_image", sa.String(), nullable=True))

    if "gender" not in existing_columns:
        op.add_column("users", sa.Column("gender", sa.String(), nullable=True))

    if "birth_date" not in existing_columns:
        op.add_column("users", sa.Column("birth_date", sa.Date(), nullable=True))


def downgrade() -> None:
    """Remove columns only when they exist."""
    existing_columns = _get_table_columns("users")

    if "birth_date" in existing_columns:
        op.drop_column("users", "birth_date")

    if "gender" in existing_columns:
        op.drop_column("users", "gender")

    if "profile_image" in existing_columns:
        op.drop_column("users", "profile_image")

    if "nickname" in existing_columns:
        op.drop_column("users", "nickname")
