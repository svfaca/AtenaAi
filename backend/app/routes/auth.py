from fastapi import APIRouter, Depends, Form, HTTPException, status, File, UploadFile, Response, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
import json
import os

# Importações do projeto
from app.database.database import get_db
from app.database.query_helpers import active_users_query
from app.models.user import User, UserRole
from app.core.dependencies import get_current_user
from app.schemas.user import UserCreate, UserResponse, Token
from app.core.security import create_access_token, verify_password, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES, create_refresh_token, REFRESH_TOKEN_EXPIRE_DAYS, SECRET_KEY, ALGORITHM
from app.core.logger import logger
from app.core.cache import rate_limiter
from app.services.file_service import FileService
from app.utilities.interests import normalize_interests

router = APIRouter(prefix="/auth", tags=["Auth"])

BOOTSTRAP_ADMIN_EMAIL = os.getenv("BOOTSTRAP_ADMIN_EMAIL")

# URL BASE (Ajuste para localhost quando estiver testando localmente)
BASE_URL = os.getenv("PUBLIC_BASE_URL") or os.getenv("BACKEND_PUBLIC_URL") or os.getenv("APP_URL") or os.getenv("API_BASE_URL") or os.getenv("NEXT_PUBLIC_API_URL") or "http://127.0.0.1:8000"
# Para deploy, use: "https://atenaai.onrender.com"


# ============================
# CONFIGURAÇÕES DE SEGURANÇA (COOKIES)
# ============================
IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"
COOKIE_SECURE = IS_PRODUCTION  # HttpOnly cookies only on HTTPS in production
# Em dev: "lax" para compatibilidade com navegadores (SameSite=None exige Secure=true)
# Em prod: também "lax" para reduzir risco de CSRF mantendo o fluxo de autenticação
COOKIE_SAMESITE = "lax"
COOKIE_DOMAIN = None  # None = current domain

# ============================
# RATE LIMIT POR EMAIL (além do por IP no middleware)
# ============================
# 🔒 Login: 5 tentativas / 15 min por email. Conta mesmo para emails inexistentes
# (não vaza quais emails existem). O middleware já limita por IP (10/15min).
LOGIN_EMAIL_RATE_LIMIT = (5, 900)
# 🔒 Registro: 3 / hora por email. Mitiga abuso de contas E o vetor de
# reativação de contas soft-deletadas (que redefine a senha a partir do email).
REGISTER_EMAIL_RATE_LIMIT = (3, 3600)
# 🔒 Troca de senha: 5 tentativas / 15 min por usuário. Um access token
# vazado não pode ser usado para brute-forcar a senha atual via change-password.
CHANGE_PASSWORD_RATE_LIMIT = (5, 900)

# ============================
# SCHEMAS LOCAIS
# ============================
class EmailCheckRequest(BaseModel):
    email: str

class EmailCheckResponse(BaseModel):
    available: bool
    message: str
    reactivatable: bool = False

class StatsResponse(BaseModel):
    classroom_count: int
    student_count: int
    pending_requests_count: int

class AuthSuccessResponse(BaseModel):
    """Resposta de login/refresh bem-sucedida"""
    message: str
    user: UserResponse
    # 🔒 SEM access_token no body — o token trafega apenas via cookie HttpOnly.

class ChangePasswordRequest(BaseModel):
    """Troca de senha — exige a senha atual + nova senha (política mínima)."""
    current_password: str
    # 🔒 min 8 (alinhado com registro) e max 128 (bcrypt trunca em 72 bytes)
    new_password: str = Field(
        ..., min_length=8, max_length=128, description="Mínimo de 8 caracteres"
    )


# ============================
# 1. ROTA DE REGISTRO (CRIAR CONTA)
# ============================
@router.post("/register", response_model=UserResponse)
def register(
    user: UserCreate,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Registra novo usuário.
    Aceita profile_image como string base64 (data:image/...;base64,...)
    """
    try:
        from app.core.logger import logger
        logger.info(f"[REGISTRO] Iniciando registro para email: {user.email}")
        
        normalized_email = (user.email or "").strip().lower()

        # 🔒 Rate limit por EMAIL (3/h): mitiga abuso de contas E o vetor de
        # reativação de contas soft-deletadas (que redefine a senha a partir
        # apenas do email).
        email_rl_key = f"register_email:{normalized_email}"
        email_max, email_window = REGISTER_EMAIL_RATE_LIMIT
        if not rate_limiter.is_allowed(email_rl_key, email_max, email_window):
            logger.warning(
                f"[REGISTRO] Rate limit por email atingido: {normalized_email}"
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Muitas tentativas de cadastro para este email. Tente novamente mais tarde.",
                headers={
                    "X-RateLimit-Remaining": str(
                        rate_limiter.get_remaining(email_rl_key, email_max, email_window)
                    ),
                    "X-RateLimit-Reset": str(
                        rate_limiter.get_reset_time(email_rl_key, email_window) or 0
                    ),
                },
            )

        # 1) Verifica primeiro usuários ativos com o helper de soft delete.
        active_user = active_users_query(db).filter(User.email == normalized_email).first()
        if active_user:
            logger.warning(f"[REGISTRO] Email já existe (ativo): {normalized_email}")
            raise HTTPException(
                status_code=400,
                detail="Este email já está registrado."
            )

        hashed_password = get_password_hash(user.password)

        # 2) Sem ativo encontrado, busca sem filtro para identificar conta deletada.
        existing_user = db.query(User).filter(User.email == normalized_email).first()

        # Reativa conta deletada em vez de criar novo registro (evita UNIQUE(email)).
        if existing_user and existing_user.deleted_at is not None:
            logger.info(f"[REGISTRO] Reativando conta soft deleted: {normalized_email}")
            existing_user.deleted_at = None
            existing_user.deleted_by = None
            existing_user.delete_scheduled_at = None
            existing_user.hashed_password = hashed_password

            # Atualizar todos os dados com os novos valores fornecidos
            existing_user.full_name = user.full_name
            existing_user.nickname = user.nickname
            existing_user.birth_date = user.birth_date
            existing_user.gender = user.gender
            existing_user.interests = normalize_interests(user.interests)

            # 🔒 SEGURANÇA (V1): o cliente NUNCA escolhe o próprio role.
            # student/teacher são papéis legítimos da UI; admin apenas via BOOTSTRAP_ADMIN_EMAIL.
            role = user.role if user.role in (UserRole.student, UserRole.teacher) else UserRole.student
            if BOOTSTRAP_ADMIN_EMAIL and normalized_email == BOOTSTRAP_ADMIN_EMAIL:
                role = UserRole.admin
            existing_user.role = role.value
            existing_user.account_type = role.value

            db.add(existing_user)
            db.commit()
            db.refresh(existing_user)

            # Processar imagem de perfil se fornecida
            if user.profile_image:
                logger.info(f"[REGISTRO] Processando imagem de perfil para reativação ID={existing_user.id}")
                profile_image_url = FileService.save_profile_image_from_base64(
                    user.profile_image,
                    existing_user.id,
                    str(request.base_url)
                )
                if profile_image_url:
                    existing_user.profile_image = profile_image_url
                    db.add(existing_user)
                    db.commit()
                    db.refresh(existing_user)

            response.headers["X-Account-Reactivated"] = "true"
            logger.info(
                f"[REGISTRO] Conta reativada com sucesso: ID={existing_user.id}, Email={normalized_email}, Role={role}"
            )
            return existing_user

        # 3) Email inexistente: cria novo usuário.
        logger.info(f"[REGISTRO] Email disponível: {normalized_email}")

        # 🔒 SEGURANÇA (V1): o cliente NUNCA escolhe o próprio role.
        # student/teacher são papéis legítimos da UI; admin apenas via BOOTSTRAP_ADMIN_EMAIL.
        role = user.role if user.role in (UserRole.student, UserRole.teacher) else UserRole.student

        if BOOTSTRAP_ADMIN_EMAIL and normalized_email == BOOTSTRAP_ADMIN_EMAIL:
            role = UserRole.admin

        logger.info(f"[REGISTRO] Role selecionada: {role}")

        new_user = User(
            email=normalized_email,
            hashed_password=hashed_password,
            full_name=user.full_name,
            nickname=user.nickname,
            birth_date=user.birth_date,
            gender=user.gender,
            interests=normalize_interests(user.interests),
            role=role.value,
            account_type=role.value,
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
                str(request.base_url)
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
    except IntegrityError as exc:
        db.rollback()
        # 🔴 NÃO assumir que toda IntegrityError é email duplicado.
        # Pode ser constraint NOT NULL/divergência de schema. Logar o erro real.
        logger.error(f"[REGISTRO] IntegrityError (erro real): {exc}", exc_info=True)
        raise HTTPException(
            status_code=400,
            detail="Não foi possível criar a conta. Tente novamente."
        )
    except Exception as e:
        logger.error(f"[REGISTRO] ERRO: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Erro ao registrar. Tente novamente."
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
    normalized_username = (form_data.username or "").strip().lower()

    if not normalized_username:
        logger.warning("[LOGIN] Tentativa sem username no payload")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 🔒 Rate limit por EMAIL (além do limite por IP no middleware).
    # Conta mesmo quando o email não existe → não vaza quais emails existem.
    email_rl_key = f"login_email:{normalized_username}"
    email_max, email_window = LOGIN_EMAIL_RATE_LIMIT
    if not rate_limiter.is_allowed(email_rl_key, email_max, email_window):
        logger.warning(f"[LOGIN] Rate limit por email atingido: {normalized_username}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas de login para este email. Tente novamente em 15 minutos.",
            headers={
                "X-RateLimit-Remaining": str(
                    rate_limiter.get_remaining(email_rl_key, email_max, email_window)
                ),
                "X-RateLimit-Reset": str(
                    rate_limiter.get_reset_time(email_rl_key, email_window) or 0
                ),
            },
        )

    logger.info(f"[LOGIN] Tentativa para email: {normalized_username}")

    # Busca usuário ativo pelo email
    user = active_users_query(db).filter(User.email == normalized_username).first()

    if not user:
        existing_user = db.query(User).filter(User.email == normalized_username).first()
        if existing_user and existing_user.deleted_at is not None:
            logger.warning(
                f"[LOGIN] Conta soft deleted bloqueada: {normalized_username} | "
                f"deleted_at={existing_user.deleted_at}"
            )
        else:
            logger.warning(f"[LOGIN] Usuário não encontrado: {normalized_username}")

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verifica senha
    if not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"[LOGIN] Senha inválida para: {normalized_username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    logger.info(f"[LOGIN] Sucesso para: {normalized_username}")
    
    # Gera Access Token (15 minutos - CURTO)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role.value
        },
        expires_delta=access_token_expires
    )
    
    # 🔒 NOVO: Gera Refresh Token (REFRESH_TOKEN_EXPIRE_DAYS - LONGO)
    # Carrega `ver` = token_version atual do usuário. Se o usuário fizer
    # logout, token_version é incrementado e TODOS os refresh tokens
    # anteriores ficam inválidos.
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        data={
            "sub": str(user.id),
            "role": user.role.value
        },
        ver=getattr(user, "token_version", 0) or 0,
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
    
    
    # 🔒 SEGURANÇA (V5): token NÃO é retornado no body — apenas em cookie HttpOnly.
    # Retornar no JSON anularia a proteção HttpOnly (qualquer XSS teria acesso).
    return {
        "message": "Login bem-sucedido. Token definido em cookie HttpOnly.",
        "user": UserResponse.from_orm(user),
    }

# ============================
# 3. VERIFICAR EMAIL
# ============================
@router.post("/check-email", response_model=EmailCheckResponse)
def check_email(data: EmailCheckRequest, db: Session = Depends(get_db)):
    """Verifica se um email já está registrado"""
    try:
        from app.core.logger import logger
        logger.info(f"[EMAIL-CHECK] Verificando email: {data.email}")
        normalized_email = (data.email or "").strip().lower()
        existing_user = db.query(User).filter(User.email == normalized_email).first()

        if existing_user and existing_user.deleted_at is not None:
            logger.info(f"[EMAIL-CHECK] Email com conta deletada: {normalized_email}")
            return {
                "available": True,
                "reactivatable": True,
                "message": "Essa conta foi excluida anteriormente. Deseja reativa-la?"
            }

        if existing_user:
            logger.warning(f"[EMAIL-CHECK] Email já existe: {normalized_email}")
            return {
                "available": False,
                "reactivatable": False,
                "message": "Este email já está registrado."
            }
        
        logger.info(f"[EMAIL-CHECK] Email disponível: {normalized_email}")
        return {
            "available": True,
            "reactivatable": False,
            "message": "Email disponível!"
        }
    except Exception as e:
        logger.error(f"[EMAIL-CHECK] ERRO: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erro ao verificar email. Tente novamente."
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
    request: Request = None,
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
            user.interests = None
    
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
            str(request.base_url) if request else BASE_URL
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
# 6. OBTER ESTATÍSTICAS DO USUÁRIO
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
# 7. REFRESH TOKEN (NOVO - REAL)
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
    
    # Busca usuário ativo
    user = active_users_query(db).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado"
        )

    # 🔒 TOKEN VERSIONING: o logout incrementa user.token_version.
    # Refresh tokens emitidos ANTES da revogação carregam `ver` antigo
    # e são rejeitados aqui — mesmo com assinatura e exp válidos.
    current_token_version = getattr(user, "token_version", 0) or 0
    if (payload.get("ver", 0) or 0) != current_token_version:
        logger.warning(
            f"[REFRESH] Refresh token revogado (ver antigo) para User ID: {user.id}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revogado. Faça login novamente.",
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
    
    # 🔄 ROTAÇÃO: Gera novo Refresh Token (LONGO) com o MESMO ver (o ver só
    # muda no logout). Rotacionar não revoga; o ver é a fonte de revogação.
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    new_refresh_token = create_refresh_token(
        data={
            "sub": str(user.id),
            "role": user.role.value
        },
        ver=current_token_version,
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
    
    return {
        "message": "Token renovado com sucesso (rotação aplicada)",
        "user": UserResponse.from_orm(user),
    }


# ============================
# 9. LOGOUT (NOVO) — revoga refresh tokens
# ============================
@router.post("/logout")
def logout(
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    ✅ LOGOUT: limpa TODOS os cookies de autenticação E revoga os refresh
    tokens do usuário (token_version += 1).

    Como o refresh é JWT stateless, sem revogação o token roubado
    continuaria válido por REFRESH_TOKEN_EXPIRE_DAYS mesmo após o logout.
    Incrementar token_version invalida TODOS os refresh tokens emitidos
    antes deste momento — em qualquer dispositivo.
    """
    # Identifica o usuário pelo refresh_token do cookie (best-effort:
    # se o token já estiver expirado/corrompido, apenas limpa os cookies).
    refresh_token_cookie = request.cookies.get("refresh_token")
    if refresh_token_cookie:
        try:
            payload = jwt.decode(refresh_token_cookie, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if user_id and payload.get("type") == "refresh":
                user = active_users_query(db).filter(User.id == int(user_id)).first()
                if user:
                    new_version = (getattr(user, "token_version", 0) or 0) + 1
                    user.token_version = new_version
                    db.add(user)
                    db.commit()
                    logger.info(
                        f"[LOGOUT] Refresh tokens revogados para User ID: {user.id} "
                        f"(token_version={new_version})"
                    )
        except (JWTError, ValueError, TypeError):
            # Token inválido/expirado: não há sessão a revogar.
            pass

    response.delete_cookie("access_token", httponly=True, samesite=COOKIE_SAMESITE)
    response.delete_cookie("refresh_token", httponly=True, samesite=COOKIE_SAMESITE)

    return {"message": "Logout bem-sucedido. Cookies limpos e refresh tokens revogados."}


# ============================
# 10. ALTERAR SENHA (revoga TODAS as sessões)
# ============================
@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Altera a senha do usuário autenticado e revoga TODAS as sessões
    (token_version += 1), invalidando os refresh tokens emitidos antes.

    Fluxo:
    - Exige a senha atual (mitiga sessão sequestrada usada para trocar senha).
    - Nova senha com política mínima (8+) e máximo (128) no schema.
    - Após a troca, o usuário precisa logar de novo (sessão atual revogada).
    """
    try:
        user = active_users_query(db).filter(User.id == current_user.id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )

        # 🔒 Rate limit por usuário (contra brute force da senha atual com um
        # access token vazado). Conta ANTES de verificar a senha.
        cp_rl_key = f"change_password:{user.id}"
        cp_max, cp_window = CHANGE_PASSWORD_RATE_LIMIT
        if not rate_limiter.is_allowed(cp_rl_key, cp_max, cp_window):
            logger.warning(
                f"[CHANGE-PASSWORD] Rate limit atingido para User ID: {user.id}"
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Muitas tentativas de troca de senha. Tente novamente em 15 minutos.",
                headers={
                    "X-RateLimit-Remaining": str(
                        rate_limiter.get_remaining(cp_rl_key, cp_max, cp_window)
                    ),
                    "X-RateLimit-Reset": str(
                        rate_limiter.get_reset_time(cp_rl_key, cp_window) or 0
                    ),
                },
            )

        hashed = str(getattr(user, "hashed_password", ""))
        if not verify_password(payload.current_password, hashed):
            logger.warning(
                f"[CHANGE-PASSWORD] Senha atual incorreta para User ID: {user.id}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Senha atual incorreta",
            )

        if verify_password(payload.new_password, hashed):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A nova senha deve ser diferente da atual",
            )

        user.hashed_password = get_password_hash(payload.new_password)
        # 🔒 Revoga TODAS as sessões: refresh tokens emitidos antes da troca
        # passam a carregar `ver` antigo → rejeitados no /refresh.
        user.token_version = (getattr(user, "token_version", 0) or 0) + 1
        db.add(user)
        db.commit()

        logger.info(
            f"[CHANGE-PASSWORD] Senha alterada e sessões revogadas para "
            f"User ID: {user.id} (token_version={user.token_version})"
        )

        # Limpa os cookies de auth — a sessão atual foi revogada.
        response.delete_cookie("access_token", httponly=True, samesite=COOKIE_SAMESITE)
        response.delete_cookie("refresh_token", httponly=True, samesite=COOKIE_SAMESITE)

        return {"message": "Senha alterada com sucesso. Faça login novamente."}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"[CHANGE-PASSWORD] Erro ao alterar senha: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao alterar senha. Tente novamente.",
        )