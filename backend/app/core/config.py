"""
Configurações centralizadas da aplicação com validação.
Otimizado para segurança, performance e escalabilidade.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from typing import List

# =========================================================
# DEBUG: Listar TODAS as variáveis de ambiente no startup
# =========================================================
print("=" * 60)
print("🔍 DEBUG - TODAS AS VARIÁVEIS DE AMBIENTE:")
for k, v in sorted(os.environ.items()):
    # Mostrar apenas primeiros 50 chars do valor por segurança
    val_preview = repr(v[:50]) if v else "None"
    print(f"  {repr(k)} = {val_preview}")
print("=" * 60)

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
# UTILITÁRIO: getenv seguro para Railway
# Railway pode salvar variáveis com \n no final do nome
# Ex: "OPENAI_API_KEY\n" em vez de "OPENAI_API_KEY"
# =========================================================

def getenv_railway(key: str, default: str | None = None) -> str | None:
    """
    Busca variável de ambiente ignorando possíveis \n no final do nome.
    Workaround para bug do Railway onde variáveis são salvas com \n.
    """
    # 1. Tentativa normal
    value = os.getenv(key)
    if value and value.strip():
        return value.strip()
    
    # 2. Fallback: buscar em TODAS as chaves (case insensitive, strip)
    for env_key, env_value in os.environ.items():
        if env_key.strip().upper() == key.upper():
            val = env_value.strip()
            # Remover '=' do início se existir
            if val.startswith("="):
                val = val[1:].strip()
            print(f"🔧 getenv_railway: encontrada '{key}' key={repr(env_key)} valor={repr(val[:60])}")
            if val:
                return val
            break
    
    # 3. Debug: listar chaves similares
    similar = [f"{repr(k)}={repr(v[:30])}" for k, v in os.environ.items() if key.lower() in k.lower()]
    print(f"🔍 getenv_railway: '{key}' não encontrada. Chaves similares: {similar}")
    return default

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
OPENAI_API_KEY = getenv_railway("OPENAI_API_KEY")

# Limites de input/processing
MAX_INPUT_LENGTH = int(os.getenv("MAX_INPUT_LENGTH", "500"))
MAX_MESSAGE_HISTORY = int(os.getenv("MAX_MESSAGE_HISTORY", "10"))
MAX_MESSAGES_PER_REQUEST = int(os.getenv("MAX_MESSAGES_PER_REQUEST", "100"))

# Validar que OpenAI está configurada
if not OPENAI_API_KEY or OPENAI_API_KEY.strip() == "" or OPENAI_API_KEY == "sk-":
    # Listar todas as variáveis do ambiente para diagnóstico
    all_keys = [k for k in os.environ.keys() if "OPENAI" in k.upper()]
    raise ValueError(f"⚠️ OPENAI_API_KEY não configurada! Chaves encontradas com 'OPENAI': {all_keys}. Valor lido: {repr(OPENAI_API_KEY)}")

# =========================================================
# DATABASE CONFIG
# =========================================================

# Valor bruto (obtido com getenv_railway que corrige bug de \n no Railway)
_RAW_DATABASE_URL = getenv_railway("DATABASE_URL", "").strip()

# Esquema válido para connection string de banco
_db_scheme = _RAW_DATABASE_URL.split(":", 1)[0].lower() if _RAW_DATABASE_URL else ""
_valid_schemes = {"sqlite", "postgres", "postgresql", "mysql", "mariadb", "mysql+pymysql"}

if _RAW_DATABASE_URL and _db_scheme not in _valid_schemes:
    # DATABASE_URL existe mas não é connection string de banco.
    # Sintoma comum: apontando para a URL pública do próprio serviço web do Railway.
    # 🔎 Tenta montar a partir das variáveis do plugin Postgres (PGHOST/PGUSER/...)
    _pg_host = getenv_railway("PGHOST") or getenv_railway("PGHOSTADDR")
    _pg_port = getenv_railway("PGPORT") or "5432"
    _pg_user = getenv_railway("PGUSER")
    _pg_pass = getenv_railway("PGPASSWORD")
    _pg_db = getenv_railway("PGDATABASE") or _pg_user
    _pg_url = getenv_railway("POSTGRES_URL") or getenv_railway("POSTGRESQL_URL")

    if _pg_url:
        _RAW_DATABASE_URL = _pg_url
        print(f"🔧 DATABASE_URL inválida ignorada; usando POSTGRES_URL: {repr(_pg_url[:60])}")
    elif _pg_host and _pg_user and _pg_pass and _pg_db:
        _RAW_DATABASE_URL = f"postgresql://{_pg_user}:{_pg_pass}@{_pg_host}:{_pg_port}/{_pg_db}"
        print("🔧 DATABASE_URL inválida ignorada; DATABASE_URL montada da PG* do plugin Postgres.")
    else:
        raise ValueError(
            "⚠️ DATABASE_URL inválida/incorreta no Railway!\n"
            f"  Valor atual: {repr(_RAW_DATABASE_URL)}\n"
            "  Não é uma connection string de banco (ex.: 'postgresql://user:pass@host:5432/db').\n"
            "  Parece estar apontando para a URL pública do serviço web.\n"
            "  CORRIJA: Service → Variables → DATABASE_URL (ou re-vincule o plugin Postgres)."
        )

# Normalizar prefixo antigo do Railway
if _RAW_DATABASE_URL.startswith("postgres://"):
    _RAW_DATABASE_URL = _RAW_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Default final (se nada foi configurado)
if not _RAW_DATABASE_URL:
    _RAW_DATABASE_URL = f"sqlite:///{BASE_DIR / 'database.db'}"

DATABASE_URL = _RAW_DATABASE_URL

# Connection pool settings para melhor performance
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "5"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "10"))
DB_POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))
DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "3600"))

# =========================================================
# CORS CONFIG - VALIDADO
# =========================================================

DEFAULT_CORS = "https://atenaai.savioemmanuel.com.br,https://atena-ai.vercel.app,https://atena-ai-suporte.vercel.app,http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:3000,http://localhost:3000"
CORS_ORIGINS_STR = getenv_railway("CORS_ORIGINS", DEFAULT_CORS)
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS_STR.split(",") if origin.strip()]

# Validar em produção: só rejeita se TODAS as origens forem localhost
if IS_PRODUCTION:
    all_localhost = True
    for origin in CORS_ORIGINS:
        if "localhost" not in origin and "127.0.0.1" not in origin:
            all_localhost = False
            break
    if all_localhost:
        raise ValueError("⚠️ Todas as origens CORS são localhost em produção! Configure CORS_ORIGINS com o domínio do Vercel")

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
