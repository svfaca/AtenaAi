"""
🗂️ FILE SERVICE
Gerencia uploads de arquivos, conversão de base64 e processamento de imagens.
Centraliza a lógica de arquivo para manter a arquitetura limpa.
"""

import os
import base64
from datetime import datetime
from typing import Optional
from fastapi import UploadFile

# Configurações
UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def get_public_base_url(base_url: Optional[str] = None) -> str:
    """Resolve a URL pública do backend para gerar links de avatar corretos."""
    if base_url and base_url.strip():
        return base_url.rstrip("/")

    configured = (
        os.getenv("PUBLIC_BASE_URL")
        or os.getenv("BACKEND_PUBLIC_URL")
        or os.getenv("APP_URL")
        or os.getenv("API_BASE_URL")
        or os.getenv("NEXT_PUBLIC_API_URL")
        or "http://127.0.0.1:8000"
    )
    return configured.rstrip("/")


class FileService:
    """Serviço centralizado para gerenciar uploads de arquivos"""

    @staticmethod
    def ensure_upload_dir() -> None:
        """Garante que o diretório de upload existe"""
        os.makedirs(UPLOAD_DIR, exist_ok=True)

    @staticmethod
    def is_valid_image_extension(filename: str) -> bool:
        """Valida extensão de arquivo"""
        if not filename:
            return False
        ext = os.path.splitext(filename)[1].lower()
        return ext in ALLOWED_EXTENSIONS

    @staticmethod
    async def save_profile_image_from_upload(
        upload_file: UploadFile,
        user_id: int,
        base_url: str
    ) -> Optional[str]:
        """
        Salva imagem de perfil a partir de UploadFile.
        Retorna URL da imagem ou None se falhar.
        """
        if not upload_file or not upload_file.filename:
            return None

        try:
            # Validar extensão
            if not FileService.is_valid_image_extension(upload_file.filename):
                raise ValueError(f"Formato de arquivo não permitido: {upload_file.filename}")

            # Garantir diretório
            FileService.ensure_upload_dir()

            # Gerar nome de arquivo único
            file_extension = os.path.splitext(upload_file.filename)[1].lower()
            timestamp = int(datetime.now().timestamp())
            file_name = f"profile_{user_id}_{timestamp}{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, file_name)

            # Ler e validar tamanho
            contents = await upload_file.read()
            if len(contents) > MAX_FILE_SIZE:
                raise ValueError(f"Arquivo muito grande. Máximo: 5MB")

            # Salvar arquivo
            with open(file_path, "wb") as f:
                f.write(contents)

            # Retornar URL completa usando o host público correto
            public_base_url = get_public_base_url(base_url)
            return f"{public_base_url}/{file_path}"

        except Exception as e:
            from app.core.logger import logger
            logger.error(f"[FILE] Erro ao salvar imagem do upload: {e}", exc_info=True)
            return None

    @staticmethod
    def save_profile_image_from_base64(
        base64_string: str,
        user_id: int,
        base_url: str
    ) -> Optional[str]:
        """
        Salva imagem de perfil a partir de string base64.
        Retorna URL da imagem ou None se falhar.
        """
        if not base64_string or not isinstance(base64_string, str):
            return None

        try:
            # Extrair tipo MIME e dados base64
            # Formato esperado: "data:image/png;base64,iVBORw0KGgo..."
            if "," not in base64_string:
                raise ValueError("String base64 inválida (falta vírgula separadora)")

            header, data = base64_string.split(",", 1)

            # Extrair extensão do tipo MIME
            # "data:image/png;base64" -> ".png"
            if "image/" not in header:
                raise ValueError(f"Tipo MIME inválido: {header}")

            mime_type = header.split("image/")[1].split(";")[0]
            file_extension = f".{mime_type}"

            # Validar extensão
            if file_extension not in ALLOWED_EXTENSIONS:
                raise ValueError(f"Formato de imagem não permitido: {file_extension}")

            # Garantir diretório
            FileService.ensure_upload_dir()

            # Gerar nome de arquivo único
            timestamp = int(datetime.now().timestamp())
            file_name = f"profile_{user_id}_{timestamp}{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, file_name)

            # Decodificar e validar tamanho
            try:
                file_content = base64.b64decode(data)
            except Exception as e:
                raise ValueError(f"Erro ao decodificar base64: {e}")

            if len(file_content) > MAX_FILE_SIZE:
                raise ValueError(f"Arquivo muito grande. Máximo: 5MB")

            # Salvar arquivo
            with open(file_path, "wb") as f:
                f.write(file_content)

            # Retornar URL completa usando o host público correto
            public_base_url = get_public_base_url(base_url)
            return f"{public_base_url}/{file_path}"

        except Exception as e:
            from app.core.logger import logger
            logger.error(f"[FILE] Erro ao salvar imagem base64: {e}", exc_info=True)
            return None

    @staticmethod
    def delete_profile_image(image_url: Optional[str]) -> bool:
        """
        Deleta imagem de perfil pelo URL.
        Retorna True se sucesso, False caso contrário.
        """
        if not image_url:
            return False

        try:
            # Extrair caminho do arquivo da URL
            # "http://localhost:8000/uploads/profile_1_1234567890.png" -> "uploads/profile_1_1234567890.png"
            if "uploads/" not in image_url:
                return False

            file_path = image_url.split("uploads/", 1)[-1]
            full_path = os.path.join(UPLOAD_DIR, file_path)

            # Verificar se arquivo existe
            if not os.path.exists(full_path):
                from app.core.logger import logger
                logger.warning(f"[FILE] Arquivo não encontrado: {full_path}")
                return False

            # Deletar arquivo
            os.remove(full_path)
            from app.core.logger import logger
            logger.info(f"[FILE] Imagem deletada: {full_path}")
            return True

        except Exception as e:
            from app.core.logger import logger
            logger.error(f"[FILE] Erro ao deletar imagem: {e}", exc_info=True)
            return False
