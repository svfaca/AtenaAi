"""add soft delete metadata and index

Revision ID: b12f4e8a9c31
Revises: d931ea04f915
Create Date: 2026-03-10 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b12f4e8a9c31'
down_revision: Union[str, Sequence[str], None] = 'd931ea04f915'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('deleted_by', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('delete_scheduled_at', sa.DateTime(), nullable=True))
    op.create_index('ix_users_deleted_at', 'users', ['deleted_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_users_deleted_at', table_name='users')
    op.drop_column('users', 'delete_scheduled_at')
    op.drop_column('users', 'deleted_by')
