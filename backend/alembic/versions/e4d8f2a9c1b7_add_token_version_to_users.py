"""add token_version to users (refresh token revocation)

Revision ID: e4d8f2a9c1b7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-16 14:00:00.000000

Token versioning: incrementado no logout para invalidar todos os refresh
tokens emitidos anteriormente (o refresh token carrega `ver`).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e4d8f2a9c1b7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add token_version column (idempotente)."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "users" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("users")}

    if "token_version" not in columns:
        op.add_column(
            "users",
            sa.Column(
                "token_version",
                sa.Integer(),
                nullable=False,
                server_default=sa.text("0"),
            ),
        )


def downgrade() -> None:
    """Drop token_version column (idempotente)."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "users" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("users")}

    if "token_version" in columns:
        op.drop_column("users", "token_version")
