"""
Configurações centralizadas da aplicação com validação.
Otimizado para segurança, performance e escalabilidade.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from typing import List

# =========================================================
# BASE DIR & ENV LOAD
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

# Carregar .env APENAS se não estiver em produção
# No Railway as variáveis são injetadas diretamente no ambiente
if os.getenv("ENVIRONMENT") != "production":
    load_dotenv(ENV_FILE)

# =========================================================
# ENVIRONMENT & DEBUG
# =========================================================

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = ENVIRONMENT == "development"
IS_PRODUCTION = ENVIRONMENT == "production"

# =========================================================
# API CONFIG
# =========================================================

API_VERSION = "2.0.0"
API_TITLE = "AtenaAI - Plataforma de Educação com IA"

# =========================================================
# SECURITY CONFIG - VALIDADO
# =========================================================

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if IS_PRODUCTION:
        raise ValueError("⚠️ SECRET_KEY não configurada ou inválida em produção!")
    else:
        # Gerar uma chave padrão para desenvolvimento
        SECRET_KEY = "dev-secret-key-change-in-production"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "21600"))  # 15d

# =========================================================
# AI CONFIG
# =========================================================

AI_MODEL = os.getenv("AI_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Limites de input/processing
MAX_INPUT_LENGTH = int(os.getenv("MAX_INPUT_LENGTH", "500"))
MAX_MESSAGE_HISTORY = int(os.getenv("MAX_MESSAGE_HISTORY", "10"))
MAX_MESSAGES_PER_REQUEST = int(os.getenv("MAX_MESSAGES_PER_REQUEST", "100"))

# Validar que OpenAI está configurada
if not OPENAI_API_KEY or OPENAI_API_KEY.strip() == "" or OPENAI_API_KEY == "sk-":
    raise ValueError("⚠️ OPENAI_API_KEY não configurada!")

# =========================================================
# DATABASE CONFIG
# =========================================================

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'database.db'}")
print("USANDO BANCO ABSOLUTO:", BASE_DIR / "database.db")

# Connection pool settings para melhor performance
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "5"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "10"))
DB_POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))
DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "3600"))

# =========================================================
# CORS CONFIG - VALIDADO
# =========================================================

DEFAULT_CORS = "http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:3000,http://localhost:3000"
CORS_ORIGINS_STR = os.getenv("CORS_ORIGINS", DEFAULT_CORS)
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS_STR.split(",") if origin.strip()]

# Validar em produção
if IS_PRODUCTION and ("localhost" in str(CORS_ORIGINS) or "127.0.0.1" in str(CORS_ORIGINS)):
    raise ValueError("⚠️ CORS com localhost em produção! Configure CORS_ORIGINS")

# =========================================================
# UPLOAD CONFIG
# =========================================================

UPLOAD_DIR = str(BASE_DIR / "uploads")
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", "10485760"))  # 10MB
ALLOWED_UPLOAD_TYPES = {"image/jpeg", "image/png", "image/webp"}

# =========================================================
# RATE LIMITING CONFIG
# =========================================================

RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
DEV_LOGIN_RATE_LIMIT_FALLBACK = os.getenv("DEV_LOGIN_RATE_LIMIT_FALLBACK", "true").lower() == "true"
GUEST_RATE_LIMIT = (10, 86400)  # 10 requests per day
USER_RATE_LIMIT = (100, 60)     # 100 requests per minute

# =========================================================
# LOGGING CONFIG
# =========================================================

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO" if not DEBUG else "DEBUG")

# =========================================================
# FEATURE FLAGS
# =========================================================

ENABLE_WEBSOCKET_COMPRESSION = os.getenv("ENABLE_WEBSOCKET_COMPRESSION", "true").lower() == "true"
ENABLE_CACHING = os.getenv("ENABLE_CACHING", "true").lower() == "true"
ENABLE_RATE_LIMITING = os.getenv("ENABLE_RATE_LIMITING", "true").lower() == "true"
