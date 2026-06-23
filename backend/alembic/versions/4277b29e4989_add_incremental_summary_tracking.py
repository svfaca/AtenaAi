"""add incremental summary tracking

Revision ID: 4277b29e4989
Revises: 5079184c0474
Create Date: 2026-03-08 18:43:17.919025

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4277b29e4989'
down_revision: Union[str, Sequence[str], None] = '5079184c0474'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - apenas adiciona colunas de tracking do resumo."""
    # Adiciona colunas de summarização incremental (SQLite suporta ADD COLUMN)
    op.add_column('conversations', sa.Column('summary_version', sa.Integer(), server_default='0'))
    op.add_column('conversations', sa.Column('messages_summarized_count', sa.Integer(), server_default='0'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('conversations', 'messages_summarized_count')
    op.drop_column('conversations', 'summary_version')
