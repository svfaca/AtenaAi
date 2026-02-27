from fastapi import APIRouter, Depends, Form, HTTPException, status, File, UploadFile, Response, Request
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import json
import os

# Importações do projeto
from app.database.database import get_db
from app.models.user import User, UserRole
from app.core.dependencies import get_current_user
from app.schemas.user import UserCreate, UserResponse, Token
from app.core.security import create_access_token, verify_password, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES, create_refresh_token, REFRESH_TOKEN_EXPIRE_DAYS
from app.services.file_service import FileService
from app.utilities.interests import normalize_interests

router = APIRouter(prefix="/auth", tags=["Auth"])

BOOTSTRAP_ADMIN_EMAIL = os.getenv("BOOTSTRAP_ADMIN_EMAIL")

# URL BASE (Ajuste para localhost quando estiver testando localmente)
BASE_URL = "http://127.0.0.1:8000"
# Para deploy, use: "https://atenaai.onrender.com"


# ============================
# CONFIGURAÇÕES DE SEGURANÇA (COOKIES)
# ============================
IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"
COOKIE_SECURE = IS_PRODUCTION  # HttpOnly cookies only on HTTPS in production
# Em dev: "none" para permitir requisições cross-port; Em prod: "lax" para CSRF protection
COOKIE_SAMESITE = "lax" if IS_PRODUCTION else "none"
COOKIE_DOMAIN = None  # None = current domain

# ============================
# SCHEMAS LOCAIS
# ============================
class EmailCheckRequest(BaseModel):
    email: str

class EmailCheckResponse(BaseModel):
    available: bool
    message: str

class StatsResponse(BaseModel):
    classroom_count: int
    student_count: int
    pending_requests_count: int

class AuthSuccessResponse(BaseModel):
    """Resposta de login/refresh bem-sucedida (token NÃO é retornado no body)"""
    message: str
    user: UserResponse


# ============================
# 1. ROTA DE REGISTRO (CRIAR CONTA)
# ============================
@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Registra novo usuário.
    Aceita profile_image como string base64 (data:image/...;base64,...)
    """
    try:
        from app.core.logger import logger
        logger.info(f"[REGISTRO] Iniciando registro para email: {user.email}")
        
        # Verifica se email já existe
        user_exists = db.query(User).filter(User.email == user.email).first()
        if user_exists:
            logger.warning(f"[REGISTRO] Email já existe: {user.email}")
            raise HTTPException(
                status_code=400,
                detail="Este email já está registrado."
            )

        logger.info(f"[REGISTRO] Email disponível: {user.email}")

        # Cria novo usuário com senha hash
        hashed_password = get_password_hash(user.password)
        role = UserRole.student

        if BOOTSTRAP_ADMIN_EMAIL and user.email == BOOTSTRAP_ADMIN_EMAIL:
            role = UserRole.admin

        new_user = User(
            email=user.email,
            hashed_password=hashed_password,
            full_name=user.full_name,
            nickname=user.nickname,
            birth_date=user.birth_date,
            gender=user.gender,
            interests=normalize_interests(user.interests),
            role=role.value
        )
        
        logger.info(f"[REGISTRO] Usuário criado em memória: {new_user.email}")
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"[REGISTRO] Usuário salvo no banco: ID={new_user.id}, Email={new_user.email}")
        
        # Processar imagem de perfil (base64) se fornecida
        if user.profile_image:
            logger.info(f"[REGISTRO] Processando imagem de perfil para ID={new_user.id}")
            profile_image_url = FileService.save_profile_image_from_base64(
                user.profile_image,
                new_user.id,
                BASE_URL
            )
            if profile_image_url:
                logger.info(f"[REGISTRO] Imagem salva: {profile_image_url}")
                new_user.profile_image = profile_image_url
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
            else:
                logger.warning(f"[REGISTRO] Falha ao processar imagem")
        
        logger.info(f"[REGISTRO] Registro completo para: {new_user.email}")
        return new_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[REGISTRO] ERRO: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao registrar: {str(e)}"
        )


# ... (mantenha os imports iguais)

# NA ROTA DE LOGIN:
@router.post("/login", response_model=AuthSuccessResponse)
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    ✅ NOVO: Autentica e define cookies HttpOnly/Secure/SameSite
    Token NÃO é retornado no response body (segurança)
    """
    # Busca usuário pelo email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # Verifica senha
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Gera Access Token (15 minutos - CURTO)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role.value
        },
        expires_delta=access_token_expires
    )
    
    # 🔒 NOVO: Gera Refresh Token (7 dias - LONGO)
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        data={
            "sub": str(user.id),
            "role": user.role.value
        },
        expires_delta=refresh_token_expires
    )

    # ✅ SET ACCESS TOKEN COOKIE (HttpOnly, curto)
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,  # 🔒 NÃO acessível via JavaScript
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
    )
    
    # 🔒 NOVO: SET REFRESH TOKEN COOKIE (HttpOnly, longo)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,  # em segundos
        httponly=True,  # 🔒 Mais crítico que access token!
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
    )
    
    # ✅ SET ROLE COOKIE (para middleware)
    response.set_cookie(
        key="role",
        value=user.role.value,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=False,  # Pode ser lido no client (não contém informações sensíveis)
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
    )
    
    # ✅ SET USER ID COOKIE (opcional, para debug)
    response.set_cookie(
        key="user_id",
        value=str(user.id),
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=False,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
    )
    
    return AuthSuccessResponse(
        message="Login bem-sucedido. Token definido em cookie HttpOnly.",
        user=UserResponse.from_orm(user)
    )

# ============================
# 3. VERIFICAR EMAIL
# ============================
@router.post("/check-email", response_model=EmailCheckResponse)
def check_email(data: EmailCheckRequest, db: Session = Depends(get_db)):
    """Verifica se um email já está registrado"""
    try:
        from app.core.logger import logger
        logger.info(f"[EMAIL-CHECK] Verificando email: {data.email}")
        existing_user = db.query(User).filter(User.email == data.email).first()
        
        if existing_user:
            logger.warning(f"[EMAIL-CHECK] Email já existe: {data.email}")
            return {"available": False, "message": "Este email já está registrado."}
        
        logger.info(f"[EMAIL-CHECK] Email disponível: {data.email}")
        return {"available": True, "message": "Email disponível!"}
    except Exception as e:
        logger.error(f"[EMAIL-CHECK] ERRO: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao verificar email: {str(e)}"
        )


# ============================
# 4. PEGAR DADOS DO USUÁRIO (ME)
# ============================
# ============================
@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Retorna informações do usuário logado"""
    from app.core.logger import logger
    logger.info(f"[GET /me] User ID={current_user.id}, full_name={current_user.full_name}, interests={current_user.interests}")
    return current_user



# ============================
# 5. ATUALIZAR PERFIL (COM FOTO)
# ============================
@router.put("/update-profile", response_model=UserResponse)
async def update_profile(
    full_name: Optional[str] = Form(None),
    nickname: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    birth_date: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    interests: Optional[str] = Form(None),
    profile_image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza o perfil do usuário logado.
    Aceita UploadFile para imagem de perfil (FormData).
    """
    
    from app.core.logger import logger
    logger.info(f"[UPDATE-PROFILE] Iniciando atualização para usuário ID={current_user.id}")
    
    # Merge do usuário para a nova sessão
    user = db.merge(current_user)
    
    # Atualizar campos básicos
    if full_name and full_name.strip(): 
        logger.debug(f"[UPDATE-PROFILE] Atualizando full_name: {user.full_name} → {full_name.strip()}")
        user.full_name = full_name.strip()
    if nickname and nickname.strip(): 
        logger.debug(f"[UPDATE-PROFILE] Atualizando nickname: {user.nickname} → {nickname.strip()}")
        user.nickname = nickname.strip()
    if email and email.strip(): 
        logger.debug(f"[UPDATE-PROFILE] Atualizando email: {user.email} → {email.strip()}")
        user.email = email.strip()
    if gender and gender.strip(): 
        logger.debug(f"[UPDATE-PROFILE] Atualizando gender: {user.gender} → {gender.strip()}")
        user.gender = gender.strip()

    # Data de Nascimento
    if birth_date and birth_date.strip():
        try:
            new_birth_date = datetime.strptime(birth_date.strip(), '%Y-%m-%d').date()
            logger.debug(f"[UPDATE-PROFILE] Atualizando birth_date: {user.birth_date} → {new_birth_date}")
            user.birth_date = new_birth_date
        except ValueError:
            logger.warning(f"[UPDATE-PROFILE] Erro ao parsear data: {birth_date}")

    # Interesses (JSON)
    if interests:
        try:
            normalized = normalize_interests(interests)
            logger.debug(f"[UPDATE-PROFILE] Interesses antes: {interests}")
            logger.debug(f"[UPDATE-PROFILE] Interesses após normalização: {normalized}")
            user.interests = normalized
        except Exception as e:
            logger.warning(f"[UPDATE-PROFILE] Erro ao normalizar interesses: {e}")
            user.interests = interests
    
    # Imagem de Perfil (UploadFile)
    if profile_image and profile_image.filename:
        logger.info(f"[UPDATE-PROFILE] Processando nova imagem de perfil: {profile_image.filename}")
        # Deletar imagem anterior se existir
        if user.profile_image:
            logger.debug(f"[UPDATE-PROFILE] Deletando imagem anterior: {user.profile_image}")
            FileService.delete_profile_image(user.profile_image)
        
        # Salvar nova imagem
        new_image_url = await FileService.save_profile_image_from_upload(
            profile_image,
            user.id,
            BASE_URL
        )
        if new_image_url:
            logger.info(f"[UPDATE-PROFILE] Nova imagem salva: {new_image_url}")
            user.profile_image = new_image_url
    
    logger.info(f"[UPDATE-PROFILE] Salvando alterações no banco...")
    db.add(user)
    db.commit()
    db.refresh(user)
    
    logger.info(f"[UPDATE-PROFILE] Perfil atualizado com sucesso!")
    
    return user


# ============================
# 6. DELETAR CONTA
# ============================
@router.delete("/delete-account")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deleta a conta do usuário logado e limpa seus arquivos"""
    user = db.merge(current_user)
    user_id = user.id
    
    # Deletar a foto de perfil se existir
    if user.profile_image:
        FileService.delete_profile_image(user.profile_image)
    
    db.delete(user)
    db.commit()
    
    return {"message": f"Conta do usuário {user_id} deletada com sucesso"}


# ============================
# 7. OBTER ESTATÍSTICAS DO USUÁRIO
# ============================
@router.get("/me/stats", response_model=StatsResponse)
def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retorna estatísticas do professor (turmas, alunos, solicitações pendentes)"""
    from app.models.classroom import Classroom
    from sqlalchemy import func
    
    user = db.merge(current_user)
    
    # Contar turmas do professor
    classroom_count = db.query(Classroom).filter(
        Classroom.teacher_id == user.id
    ).count()
    
    # Contar alunos aprovados em todas as turmas do professor
    student_count = db.query(func.count(Classroom.id)).filter(
        Classroom.teacher_id == user.id
    ).scalar() or 0
    
    # Se há turmas, contar total de alunos
    if classroom_count > 0:
        from app.models.classroom import classroom_students
        student_count = db.query(func.count(classroom_students.c.student_id)).filter(
            classroom_students.c.classroom_id.in_(
                db.query(Classroom.id).filter(Classroom.teacher_id == user.id)
            )
        ).scalar() or 0
    
    # Contar alunos aguardando aprovação
    pending_requests_count = 0
    if classroom_count > 0:
        from app.models.classroom import pending_classroom_students
        pending_requests_count = db.query(func.count(pending_classroom_students.c.student_id)).filter(
            pending_classroom_students.c.classroom_id.in_(
                db.query(Classroom.id).filter(Classroom.teacher_id == user.id)
            )
        ).scalar() or 0
    
    return StatsResponse(
        classroom_count=classroom_count,
        student_count=student_count,
        pending_requests_count=pending_requests_count
    )


# ============================
# 8. REFRESH TOKEN (NOVO - REAL)
# ============================
@router.post("/refresh", response_model=AuthSuccessResponse)
def refresh_token(
    request: Request,  # Para ler cookies
    response: Response,
    db: Session = Depends(get_db)
):
    """
    ✅ REAL REFRESH TOKEN:
    - Lê refresh_token do Cookie (HttpOnly)
    - Valida refresh_token
    - Gera novo access_token CURTO
    - Opcionalmente: rodar refresh_token NOVO (rotação)
    """
    from app.core.security import SECRET_KEY, ALGORITHM
    from jose import JWTError, jwt
    
    # Extrai refresh token do cookie
    refresh_token_cookie = request.cookies.get("refresh_token")
    if not refresh_token_cookie:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token não encontrado"
        )
    
    try:
        # Valida refresh token
        payload = jwt.decode(refresh_token_cookie, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        if token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido (não é refresh token)"
            )
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido ou expirado"
        )
    
    # Busca usuário
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado"
        )
    
    # Gera novo Access Token (CURTO)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role.value
        },
        expires_delta=access_token_expires
    )
    
    # 🔄 ROTAÇÃO: Gera novo Refresh Token (LONGO)
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    new_refresh_token = create_refresh_token(
        data={
            "sub": str(user.id),
            "role": user.role.value
        },
        expires_delta=refresh_token_expires
    )

    # ✅ SET NOVO ACCESS TOKEN
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
    )
    
    # 🔄 SET NOVO REFRESH TOKEN (ROTAÇÃO!)
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        domain=COOKIE_DOMAIN,
    )
    
    return AuthSuccessResponse(
        message="Token renovado com sucesso (rotação aplicada)",
        user=UserResponse.from_orm(user)
    )


# ============================
# 9. LOGOUT (NOVO)
# ============================
@router.post("/logout")
def logout(response: Response):
    """
    ✅ NOVO: Limpa TODOS os cookies de autenticação
    """
    response.delete_cookie("access_token", httponly=True, samesite=COOKIE_SAMESITE)
    response.delete_cookie("refresh_token", httponly=True, samesite=COOKIE_SAMESITE)  # 🔒 NOVO
    response.delete_cookie("role", samesite=COOKIE_SAMESITE)
    response.delete_cookie("user_id", samesite=COOKIE_SAMESITE)
    
    return {"message": "Logout bem-sucedido. Cookies limpos."}