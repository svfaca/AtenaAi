"""Bootstrap do banco de dados PostgreSQL — colunas ausentes adicionadas via SQL direto."""
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.logger import logger

BOOTSTRAP_SQL = """
-- Colunas da tabela users
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'student';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='nickname') THEN
        ALTER TABLE users ADD COLUMN nickname VARCHAR(255);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='interests') THEN
        ALTER TABLE users ADD COLUMN interests TEXT;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='profile_image') THEN
        ALTER TABLE users ADD COLUMN profile_image VARCHAR(500);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='gender') THEN
        ALTER TABLE users ADD COLUMN gender VARCHAR(50);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='birth_date') THEN
        ALTER TABLE users ADD COLUMN birth_date DATE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='deleted_at') THEN
        ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='deleted_by') THEN
        ALTER TABLE users ADD COLUMN deleted_by INTEGER;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='delete_scheduled_at') THEN
        ALTER TABLE users ADD COLUMN delete_scheduled_at TIMESTAMP;
    END IF;
END $$;

-- Tabela data_migrations (se não existir)
CREATE TABLE IF NOT EXISTS data_migrations (
    version VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP NOT NULL
);
"""

def bootstrap_database(db: Session) -> None:
    """Executa SQL condicional para adicionar colunas/tabelas ausentes."""
    try:
        db.execute(text(BOOTSTRAP_SQL))
        db.commit()
        logger.info("✅ Bootstrap do banco de dados executado com sucesso")
    except Exception as e:
        db.rollback()
        logger.warning(f"⚠️ Bootstrap do banco falhou (pode já estar atualizado): {e}")