"""add guest chat usage table

Revision ID: c7f5e9d3a1b2
Revises: b3d5f8e9c2a1
Create Date: 2026-08-16 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c7f5e9d3a1b2"
down_revision: Union[str, Sequence[str], None] = "b3d5f8e9c2a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create guest_chat_usage table (limite diário de visitantes)."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "guest_chat_usage" in inspector.get_table_names():
        return

    op.create_table(
        "guest_chat_usage",
        sa.Column("guest_id", sa.String(length=64), nullable=False),
        sa.Column("usage_date", sa.Date(), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.PrimaryKeyConstraint("guest_id", "usage_date"),
    )


def downgrade() -> None:
    """Drop guest_chat_usage table."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "guest_chat_usage" not in inspector.get_table_names():
        return

    op.drop_table("guest_chat_usage")
