"""
FastAPI Application Factory com Arquitetura Otimizada.
Inclui middlewares, exception handlers e configuração de alta performance.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException

from app.core.config import (
    CORS_ORIGINS, API_VERSION, API_TITLE, UPLOAD_DIR, 
    ENVIRONMENT, LOG_LEVEL
)
from app.core.logger import logger, setup_logging
from app.database.database import Base, engine
from app.core.middleware import LoggingMiddleware, RateLimitMiddleware, SecurityHeadersMiddleware
from app.core.exceptions import (
    AtenaAIException, ValidationError, 
    atena_exception_handler, validation_exception_handler, 
    generic_exception_handler
)
from app.database.data_migrations import apply_pending_data_migrations
from app.database.database import SessionLocal

# =====================================================
# SETUP LOGGING
# =====================================================
setup_logging(level=LOG_LEVEL)

# =====================================================
# IMPORT MODELS (para SQLAlchemy) — precisa vir antes do create_all
# =====================================================
import app.models  # noqa: F401  — registra todos os modelos de uma vez

# =====================================================
# DATABASE INIT
# =====================================================
# 🔄 GERENCIADO POR ALEMBIC — não usar create_all() em produção
# Para rodar migrations: alembic upgrade head
# Base.metadata.create_all(bind=engine)

logger.info(f"🚀 AtenaAI Backend iniciando em ambiente: {ENVIRONMENT}")

# =====================================================
# IMPORT ROUTERS
# =====================================================
from app.routes.auth import router as auth_router
from app.routes.chat import router as chat_router
from app.routes.conversations import router as conversations_router
from app.routes.classrooms import router as classrooms_router
from app.routes.teacher import router as teacher_router
from app.routes.admin import router as admin_router
from app.routes.notifications import router as notifications_router
from app.routes.group_chat import router as group_chat_router
from app.routes.users import router as users_router

# =====================================================
# APP INITIALIZATION
# =====================================================

app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description="API de educação com IA para salas de aula virtuais",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# =====================================================
# EXCEPTION HANDLERS (Antes de middlewares!)
# =====================================================

app.add_exception_handler(ValidationError, validation_exception_handler)
app.add_exception_handler(AtenaAIException, atena_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# =====================================================
# MIDDLEWARES (Ordem importante! - Aplicados em ordem REVERSA)
# =====================================================

# 1. CORS MUST BE FIRST (added last = outermost middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    max_age=3600,
)

# 2. GZIP Compression
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,
)

# 3. Logging
app.add_middleware(LoggingMiddleware)

# 4. Rate limiting
app.add_middleware(RateLimitMiddleware)

# 5. Security headers (added first = innermost middleware)
app.add_middleware(SecurityHeadersMiddleware)

# =====================================================
# API PREFIX
# =====================================================
API_PREFIX = "/api/v1"

# =====================================================
# ROUTERS
# =====================================================

app.include_router(auth_router, prefix=API_PREFIX, tags=["Authentication"])
app.include_router(chat_router, prefix=API_PREFIX, tags=["Chat"])
app.include_router(conversations_router, prefix=API_PREFIX, tags=["Conversations"])
app.include_router(classrooms_router, prefix=API_PREFIX, tags=["Classrooms"])
app.include_router(teacher_router, prefix=API_PREFIX, tags=["Teacher"])
app.include_router(admin_router, prefix=API_PREFIX, tags=["Admin"])
app.include_router(notifications_router, prefix=API_PREFIX, tags=["Notifications"])
app.include_router(group_chat_router, prefix=API_PREFIX, tags=["Group Chat"])
app.include_router(users_router, prefix=API_PREFIX, tags=["Users"])

# =====================================================
# HEALTH CHECK
# =====================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Endpoint de health check para monitoramento"""
    return {
        "status": "healthy",
        "version": API_VERSION,
        "environment": ENVIRONMENT
    }

# =====================================================
# STATIC FILES
# =====================================================

os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

logger.info(f"✅ AtenaAI Backend iniciado com sucesso na versão {API_VERSION}")


@app.on_event("startup")
async def startup_event():
    """Executado ao iniciar o servidor"""
    logger.info("=" * 80)
    logger.info("ATENAAI SERVER INICIADO")
    logger.info(f"Version: {API_VERSION}")
    logger.info(f"CORS Origins: {CORS_ORIGINS}")
    logger.info(f"Database: {os.getenv('DATABASE_URL', 'sqlite:///./database.db')}")
    logger.info("=" * 80)

    # Criar todas as tabelas que ainda não existem
    logger.info("🔄 Criando tabelas no banco de dados...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Tabelas criadas/verificadas com sucesso")
    except Exception as e:
        # Ignorar erro de ENUM já existente (ocorre com workers múltiplos)
        if "duplicate key" in str(e) and "pg_type_typname_nsp_index" in str(e):
            logger.warning("⚠️ ENUM type já existe (ignorado para multi-worker)")
        else:
            logger.error(f"❌ Erro ao criar tabelas: {e}")
            raise
    
    # 🧱 Rodar Alembic migrations ANTES das data migrations
    logger.info("🔄 Rodando Alembic migrations...")
    try:
        import subprocess
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            cwd="/app" if os.path.exists("/app") else "."
        )
        if result.returncode == 0:
            logger.info("✅ Alembic migrations aplicadas com sucesso")
        else:
            logger.error(f"❌ Alembic migration falhou: {result.stderr}")
    except Exception as e:
        logger.error(f"❌ Erro ao rodar Alembic: {e}")

    db = SessionLocal()
    try:
        executed = apply_pending_data_migrations(db)
        if executed:
            logger.info(f"✅ Data migrations aplicadas no startup: {executed}")
    finally:
        db.close()
