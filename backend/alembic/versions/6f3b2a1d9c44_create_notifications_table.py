"""create notifications table

Revision ID: 6f3b2a1d9c44
Revises: 9c2ab6c1d7f4
Create Date: 2026-03-09 22:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6f3b2a1d9c44"
down_revision: Union[str, Sequence[str], None] = "9c2ab6c1d7f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create notifications table used by User.notifications relationship."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "notifications" in inspector.get_table_names():
        return

    notification_type_enum = sa.Enum(
        "join_request",
        "classroom_join_request",
        "classroom_deleted",
        "classroom_removed",
        "classroom_approved",
        "general",
        name="notificationtype",
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("type", notification_type_enum, nullable=False, server_default="general"),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("message", sa.String(), nullable=False),
        sa.Column("data", sa.String(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_id"), "notifications", ["id"], unique=False)
    op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"], unique=False)


def downgrade() -> None:
    """Drop notifications table."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "notifications" not in inspector.get_table_names():
        return

    op.drop_index(op.f("ix_notifications_user_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_id"), table_name="notifications")
    op.drop_table("notifications")
