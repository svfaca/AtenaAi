"""merge heads (b12f4e8a9c31 + c7f5e9d3a1b2)

Revision ID: a1b2c3d4e5f6
Revises: b12f4e8a9c31, c7f5e9d3a1b2
Create Date: 2026-08-16 11:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = ("b12f4e8a9c31", "c7f5e9d3a1b2")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge das branches divergentes — nenhuma alteração de schema."""
    pass


def downgrade() -> None:
    """Merge das branches divergentes — nenhuma alteração de schema."""
    pass