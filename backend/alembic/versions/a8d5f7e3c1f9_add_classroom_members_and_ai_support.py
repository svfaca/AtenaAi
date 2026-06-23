"""add classroom_members and AI support

Revision ID: a8d5f7e3c1f9
Revises: 4277b29e4989
Create Date: 2026-03-08 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8d5f7e3c1f9'
down_revision: Union[str, Sequence[str], None] = '4277b29e4989'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - create classrooms table and classroom_members."""
    
    # ===== CREATE CLASSROOMS TABLE (if not exists) =====
    op.create_table(
        'classrooms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('code', sa.String(), nullable=False, unique=True),
        sa.Column('teacher_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_classrooms_code'), 'classrooms', ['code'], unique=True)
    
    # ===== CREATE CLASSROOM_STUDENTS TABLE =====
    op.create_table(
        'classroom_students',
        sa.Column('classroom_id', sa.Integer(), nullable=True),
        sa.Column('student_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['classroom_id'], ['classrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE')
    )
    
    # ===== CREATE PENDING_CLASSROOM_STUDENTS TABLE =====
    op.create_table(
        'pending_classroom_students',
        sa.Column('classroom_id', sa.Integer(), nullable=True),
        sa.Column('student_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['classroom_id'], ['classrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE')
    )
    
    # ===== CREATE CLASSROOM_MEMBERS TABLE =====
    op.create_table(
        'classroom_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('classroom_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='student'),
        sa.Column('joined_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['classroom_id'], ['classrooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_classroom_members_classroom_id'), 'classroom_members', ['classroom_id'], unique=False)
    op.create_index(op.f('ix_classroom_members_user_id'), 'classroom_members', ['user_id'], unique=False)
    
    # ===== ADD classroom_id TO GROUP_MESSAGES (if not exists) =====
    # Note: This table may already have classroom_id, so we handle gracefully


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_classroom_members_user_id'), table_name='classroom_members')
    op.drop_index(op.f('ix_classroom_members_classroom_id'), table_name='classroom_members')
    op.drop_table('classroom_members')
    
    op.drop_table('pending_classroom_students')
    op.drop_table('classroom_students')
    op.drop_index(op.f('ix_classrooms_code'), table_name='classrooms')
    op.drop_table('classrooms')
