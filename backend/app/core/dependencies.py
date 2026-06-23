from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import SessionLocal
from app.database.query_helpers import active_users_query
from app.models.user import User
from app.core.security import SECRET_KEY, ALGORITHM


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


# =========================
# DB
# =========================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# AUTH (estrito e limpo) - com suporte a Cookies + Bearer
# =========================
def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Tentar extrair token do header Authorization
    if not token:
        # Se não houver Bearer token, tentar o cookie
        token = request.cookies.get("access_token")
    
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if not user_id:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = active_users_query(db).filter(User.id == int(user_id)).first()

    if not user:
        raise credentials_exception

    return user


# =========================
# AUTH (opcional - para visitantes) - com suporte a Cookies + Bearer
# =========================
def get_current_user_optional(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Retorna o usuário se autenticado, None se visitante"""
    if not token:
        # Se não houver Bearer token, tentar o cookie
        token = request.cookies.get("access_token")
    
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            return None
            
        return active_users_query(db).filter(User.id == int(user_id)).first()
        
    except JWTError:
        return None
