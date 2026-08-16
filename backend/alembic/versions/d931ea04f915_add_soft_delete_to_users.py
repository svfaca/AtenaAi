"""add_soft_delete_to_users

Revision ID: d931ea04f915
Revises: 00fa41353828
Create Date: 2026-03-10 06:27:42.682017

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd931ea04f915'
down_revision: Union[str, Sequence[str], None] = '00fa41353828'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema (idempotente).

    A branch paralela b3d5f8e9c2a1 também adiciona deleted_at. Sem a checagem,
    aplicar esta migration depois da branch b3d5 quebraria com "duplicate
    column".
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "users" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("users")}

    # Adiciona coluna deleted_at para soft delete (se ainda não existir)
    if "deleted_at" not in columns:
        op.add_column('users', sa.Column('deleted_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove coluna deleted_at
    op.drop_column('users', 'deleted_at')
