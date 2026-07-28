"""
Rotas de usuários - Upload e gestão de avatares
Sistema seguro de upload de imagens com validações
Implementa soft delete para preservar integridade histórica
"""
import os
import uuid
import shutil
from pathlib import Path
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status, Body
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.query_helpers import active_users_query
from app.models.user import User
from app.core.dependencies import get_current_user
from app.core.security import verify_password
from app.schemas.user import UserResponse
from app.core.logger import logger
from app.services.file_service import FileService

router = APIRouter(prefix="/users", tags=["Users"])

# =========================================================
# CONFIGURAÇÕES DE AVATAR
# =========================================================

# Diretório de armazenamento de avatares
# Usa UPLOAD_DIR do config para garantir caminho correto em produção
from app.core.config import UPLOAD_DIR
AVATAR_DIR = Path(UPLOAD_DIR) / "avatars"

# Criar diretório se não existir
AVATAR_DIR.mkdir(parents=True, exist_ok=True)

# Tipos de arquivo permitidos
ALLOWED_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp"
}

# Extensões permitidas
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".jfif", ".webp"}

MEDIA_TYPE_BY_EXTENSION = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".jfif": "image/jpeg",
    ".webp": "image/webp",
}

# Tamanho máximo: 2MB
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB em bytes


class DeleteAccountRequest(BaseModel):
    password: str
    confirm_text: str


# =========================================================
# FUNÇÕES AUXILIARES
# =========================================================

def validate_image_file(file: UploadFile) -> None:
    """
    Valida tipo MIME e extensão do arquivo
    Levanta HTTPException se inválido
    """
    # Validar tipo MIME
    if file.content_type not in ALLOWED_MIME_TYPES:
        logger.warning(f"Tipo de arquivo inválido: {file.content_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo não permitido. Use: {', '.join(ALLOWED_MIME_TYPES)}"
        )
    
    # Validar extensão
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            logger.warning(f"Extensão de arquivo inválida: {ext}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Extensão não permitida. Use: {', '.join(ALLOWED_EXTENSIONS)}"
            )


def generate_unique_filename(original_filename: str) -> str:
    """
    Gera nome único usando UUID4
    Previne path traversal e sobrescrita
    """
    ext = Path(original_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".png"  # fallback seguro
    
    unique_name = f"{uuid.uuid4()}{ext}"
    return unique_name


def delete_old_avatar(avatar_url: Optional[str]) -> None:
    """
    Remove avatar antigo do sistema de arquivos
    Silenciosamente ignora erros (arquivo pode não existir)
    """
    if not avatar_url:
        return
    
    try:
        # Extrair filename da URL: /api/v1/users/avatar/{filename}
        filename = avatar_url.split("/")[-1]
        file_path = AVATAR_DIR / filename
        
        if file_path.exists():
            file_path.unlink()
            logger.info(f"Avatar antigo removido: {filename}")
    except Exception as e:
        logger.warning(f"Erro ao remover avatar antigo: {e}")


# =========================================================
# ENDPOINTS
# =========================================================

@router.post("/upload-avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload de avatar do usuário (seguro)
    
    Validações:
    - Tipo MIME (image/png, image/jpeg, image/webp)
    - Extensão do arquivo
    - Tamanho máximo (2MB)
    
    Segurança:
    - Nome UUID (previne path traversal)
    - Arquivo salvo fora do repo
    - Banco salva apenas URL
    - Remove avatar antigo automaticamente
    """
    try:
        logger.info(f"Upload de avatar iniciado - User ID: {current_user.id}")
        
        # 1. Validar tipo de arquivo
        validate_image_file(file)
        
        # 2. Validar tamanho
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > MAX_FILE_SIZE:
            logger.warning(f"Arquivo muito grande: {file_size} bytes")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Arquivo muito grande. Máximo: 2MB. Recebido: {file_size / 1024 / 1024:.2f}MB"
            )
        
        # 3. Gerar nome único
        unique_filename = generate_unique_filename(file.filename or "avatar.png")
        file_path = AVATAR_DIR / unique_filename
        
        # 4. Salvar arquivo
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        logger.info(f"Avatar salvo: {unique_filename}")
        
        # 5. Remover avatar antigo (se existir)
        old_avatar = getattr(current_user, 'profile_image', None)
        delete_old_avatar(old_avatar)  # type: ignore
        
        # 6. Atualizar URL no banco
        avatar_url = f"/api/v1/users/avatar/{unique_filename}"
        setattr(current_user, 'profile_image', avatar_url)  # type: ignore
        
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        
        logger.info(f"Avatar atualizado no banco - User ID: {current_user.id}")
        
        return current_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no upload de avatar: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao processar upload de avatar"
        )


@router.get("/avatar/{filename}")
def get_avatar(filename: str):
    """
    Serve avatar do usuário
    
    Segurança:
    - Valida extensão
    - Previne path traversal
    - Não expõe estrutura de diretórios
    """
    try:
        # Validar extensão (previne acesso a arquivos não-imagem)
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Extensão de arquivo inválida"
            )
        
        # Validar que não há path traversal
        if ".." in filename or "/" in filename or "\\" in filename:
            logger.warning(f"Tentativa de path traversal: {filename}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nome de arquivo inválido"
            )
        
        # Construir caminho seguro
        file_path = AVATAR_DIR / filename
        
        # Verificar se arquivo existe
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Avatar não encontrado"
            )
        
        # Retornar arquivo
        return FileResponse(
            path=file_path,
            media_type=MEDIA_TYPE_BY_EXTENSION.get(ext, "application/octet-stream"),
            headers={
                "Cache-Control": "public, max-age=86400"  # Cache de 1 dia
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao servir avatar: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao carregar avatar"
        )


@router.delete("/avatar", response_model=UserResponse)
def delete_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove avatar do usuário
    """
    try:
        logger.info(f"Removendo avatar - User ID: {current_user.id}")
        
        # Remover arquivo do sistema
        old_avatar = getattr(current_user, 'profile_image', None)
        delete_old_avatar(old_avatar)  # type: ignore
        
        # Remover URL do banco
        setattr(current_user, 'profile_image', None)  # type: ignore
        db.add(current_user)
        db.commit()
        db.refresh(current_user)
        
        logger.info(f"Avatar removido - User ID: {current_user.id}")
        
        return current_user
        
    except Exception as e:
        logger.error(f"Erro ao remover avatar: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao remover avatar"
        )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Retorna perfil do usuário autenticado
    """
    return current_user


@router.delete("/me")
def delete_own_account(
    payload: DeleteAccountRequest = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soft delete da conta do usuário autenticado.
    
    ✅ Preserva integridade referencial:
    - Não quebra foreign keys
    - Mantém histórico de mensagens, salas, relatórios
    - Permite auditoria e conformidade LGPD/GDPR
    
    Regras:
    - senha obrigatória e válida
    - confirmação textual obrigatória: DELETE
    - marca deleted_at ao invés de remover do banco
    """
    try:
        user = active_users_query(db).filter(User.id == current_user.id).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado"
            )

        # Verificar se já foi deletado
        if user.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Conta já foi excluída"
            )

        if payload.confirm_text.strip().upper() != "DELETE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Digite DELETE para confirmar"
            )

        hashed_password = str(getattr(user, "hashed_password", ""))
        if not verify_password(payload.password, hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Senha inválida"
            )

        # Deletar avatar (não bloqueia se falhar)
        profile_image = getattr(user, "profile_image", None)
        if profile_image:
            try:
                FileService.delete_profile_image(str(profile_image))
            except Exception as e:
                logger.warning(f"Erro ao deletar avatar: {e}")

        # 🎯 SOFT DELETE - marca data de exclusão + autor da ação
        setattr(user, 'deleted_at', datetime.utcnow())
        setattr(user, 'deleted_by', current_user.id)
        
        db.add(user)
        db.commit()
        
        logger.info(f"Soft delete executado - User ID: {user.id}")

        return {"message": "Conta excluída com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao deletar conta: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
