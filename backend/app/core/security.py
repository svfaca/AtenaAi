import bcrypt
from datetime import datetime, timedelta
from jose import jwt
from typing import Optional

# 🔒 FONTE ÚNICA DE VERDADE: todos os segredos vêm de app.core.config.
# Antes havia um fallback hardcoded aqui ("dev-secret-change-in-production"),
# o que permitiria forjar JWTs com chave conhecida se o config não abortasse.
from app.core.config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)

# ========================================================
# 1. FUNÇÃO PRINCIPAL DE HASH
# ========================================================
def get_password_hash(password: str) -> str:
    """
    Gera o hash da senha usando bcrypt.
    Usado pelo novo sistema de rotas (routes/auth.py).
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

# ========================================================
# 2. ALIAS DE COMPATIBILIDADE (O TRUQUE)
# ========================================================
# Aqui dizemos: "Se alguém chamar hash_password, use a função get_password_hash"
# Isso resolve o erro do seu arquivo antigo (register_service.py)
hash_password = get_password_hash

# ========================================================
# 3. VERIFICAÇÃO DE SENHA
# ========================================================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica senha usando bcrypt diretamente"""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

# ========================================================
# 4. CRIAÇÃO DE TOKEN JWT
# ========================================================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ========================================================
# 5. CRIAÇÃO DE REFRESH TOKEN (NOVO)
# ========================================================
def create_refresh_token(
    data: dict,
    ver: int = 0,
    expires_delta: Optional[timedelta] = None,
):
    """
    🔒 Refresh token longo (REFRESH_TOKEN_EXPIRE_DAYS)
    Armazenado em cookie HttpOnly.

    `ver` = token_version do usuário no momento da emissão.
    Na validação, se o token carregar um `ver` diferente do
    token_version atual do usuário (ex.: após logout), o token
    é rejeitado com 401 — permitindo revogação de sessões.
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire, "type": "refresh", "ver": int(ver)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)