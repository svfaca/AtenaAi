"""Add missing user columns for PostgreSQL compatibility

Revision ID: b3d5f8e9c2a1
Revises: 9c2ab6c1d7f4
Create Date: 2026-08-03 12:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
from sqlalchemy import Column, Enum, String, Date, DateTime, Text, Integer


revision: str = "b3d5f8e9c2a1"
down_revision: Union[str, Sequence[str], None] = "9c2ab6c1d7f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Enum compatível — recriar sem dependência do UserRole
user_role_enum = Enum("student", "teacher", "admin", name="userrole")


def upgrade() -> None:
    """Add missing columns using IF NOT EXISTS pattern."""

    # Colunas críticas
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'role'
            ) THEN
                ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'student';
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'nickname'
            ) THEN
                ALTER TABLE users ADD COLUMN nickname VARCHAR(255);
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'interests'
            ) THEN
                ALTER TABLE users ADD COLUMN interests TEXT;
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'profile_image'
            ) THEN
                ALTER TABLE users ADD COLUMN profile_image VARCHAR(500);
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'gender'
            ) THEN
                ALTER TABLE users ADD COLUMN gender VARCHAR(50);
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'birth_date'
            ) THEN
                ALTER TABLE users ADD COLUMN birth_date DATE;
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'deleted_at'
            ) THEN
                ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'deleted_by'
            ) THEN
                ALTER TABLE users ADD COLUMN deleted_by INTEGER;
            END IF;
        END $$;
    """)

    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'delete_scheduled_at'
            ) THEN
                ALTER TABLE users ADD COLUMN delete_scheduled_at TIMESTAMP;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    """Não remove colunas — downgrade irreversível para evitar perda de dados."""
    pass