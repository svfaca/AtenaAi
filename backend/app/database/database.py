"""
Configuração de banco de dados otimizada com pooling.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.pool import NullPool, QueuePool
import os

from app.core.logger import logger

# =====================================================
# DATABASE URL
# =====================================================

# Base path aligned with app.core.config and Alembic (backend/)
BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'database.db')}")

# Corrige prefixo postgres antigo (Railway)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# =====================================================
# ENGINE COM POOLING OTIMIZADO
# =====================================================

IS_SQLITE = "sqlite" in DATABASE_URL
pool_class = NullPool if IS_SQLITE else QueuePool

# Preparar kwargs para create_engine (evita parâmetros incompatíveis com SQLite)
engine_kwargs = {
    "poolclass": pool_class,
    "echo": False,  # Mudar para True para debug SQL
}

if not IS_SQLITE:
    # Adicionar parâmetros de pooling apenas para bancos que suportam
    engine_kwargs.update({
        "pool_size": 5,
        "max_overflow": 10,
        "pool_timeout": 30,
        "pool_recycle": 3600,
        "pool_pre_ping": True,
    })
else:
    # Para SQLite, adicionar apenas connect_args
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)

Base = declarative_base()

def get_db() -> Session:
    """Dependency para obter sessão de banco de forma thread-safe"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =====================================================
# EVENTOS DE POOL
# =====================================================

@event.listens_for(engine, "connect")
def receive_connect(dbapi_connection, connection_record):
    """Configurações ao conectar"""
    if IS_SQLITE:
        # Ativar foreign keys no SQLite
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
