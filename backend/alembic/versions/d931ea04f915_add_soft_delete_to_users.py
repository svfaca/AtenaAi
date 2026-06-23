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
    """Upgrade schema."""
    # Adiciona coluna deleted_at para soft delete
    op.add_column('users', sa.Column('deleted_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove coluna deleted_at
    op.drop_column('users', 'deleted_at')
