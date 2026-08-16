"""
🗂️ FILE SERVICE
Gerencia uploads de arquivos, conversão de base64 e processamento de imagens.
Centraliza a lógica de arquivo para manter a arquitetura limpa.
"""

import os
import base64
from datetime import datetime
from typing import Optional, Tuple
from fastapi import UploadFile

# 🔒 Configuração UNIFICADA com app.core.config (evita 3 fontes divergentes de tamanho/tipo).
from app.core.config import UPLOAD_DIR, MAX_UPLOAD_SIZE, ALLOWED_UPLOAD_TYPES

# MIME -> (assinatura mágica, extensão)
IMAGE_SIGNATURES: dict[str, Tuple[bytes, str]] = {
    "image/jpeg": (b"\xff\xd8\xff", ".jpg"),
    "image/png": (b"\x89PNG\r\n\x1a\n", ".png"),
    "image/webp": (b"RIFF", ".webp"),
}

# Extensões derivadas dos tipos permitidos no config
ALLOWED_EXTENSIONS = {ext for _, ext in IMAGE_SIGNATURES.values()}

# Alias para compatibilidade com imports antigos
MAX_FILE_SIZE = MAX_UPLOAD_SIZE


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
    def _detect_image(data: bytes) -> Optional[Tuple[str, str]]:
        """
        Valida magic bytes reais do arquivo (não confia em MIME/header).
        Retorna (mime_type, extensão) ou None se não for imagem conhecida.
        """
        for mime, (signature, ext) in IMAGE_SIGNATURES.items():
            if data.startswith(signature):
                # WebP tem cabeçalho "RIFF....WEBP"
                if mime == "image/webp":
                    if len(data) < 16 or data[8:12] != b"WEBP":
                        continue
                return mime, ext
        return None

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
            # Validar extensão declarada
            if not FileService.is_valid_image_extension(upload_file.filename):
                raise ValueError(f"Formato de arquivo não permitido: {upload_file.filename}")

            # Garantir diretório
            FileService.ensure_upload_dir()

            # Ler e validar tamanho
            contents = await upload_file.read()
            if len(contents) > MAX_FILE_SIZE:
                raise ValueError(f"Arquivo muito grande. Máximo: {MAX_FILE_SIZE // (1024 * 1024)}MB")

            # 🔒 VALIDAÇÃO REAL: magic bytes do conteúdo (não confia no MIME declarado)
            detected = FileService._detect_image(contents)
            if detected is None:
                raise ValueError("Conteúdo do arquivo não é uma imagem válida")

            _, file_extension = detected

            # Gerar nome de arquivo único com a extensão DETECTADA (seguro)
            timestamp = int(datetime.now().timestamp())
            file_name = f"profile_{user_id}_{timestamp}{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, file_name)

            # Salvar arquivo
            with open(file_path, "wb") as f:
                f.write(contents)

            # Retornar URL completa usando o host público correto
            # ⚠️ Usar barras normais (evita 'uploads\file.png' no Windows)
            public_base_url = get_public_base_url(base_url)
            public_path = file_path.replace(os.sep, "/")
            return f"{public_base_url}/{public_path}"

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

            # Validar que o header declara imagem (prevenção básica)
            if "image/" not in header:
                raise ValueError(f"Tipo MIME inválido: {header}")

            # Garantir diretório
            FileService.ensure_upload_dir()

            # Decodificar e validar tamanho
            try:
                file_content = base64.b64decode(data)
            except Exception as e:
                raise ValueError(f"Erro ao decodificar base64: {e}")

            if len(file_content) > MAX_FILE_SIZE:
                raise ValueError(f"Arquivo muito grande. Máximo: {MAX_FILE_SIZE // (1024 * 1024)}MB")

            # 🔒 VALIDAÇÃO REAL: magic bytes do conteúdo (não confia no MIME do data-URI)
            detected = FileService._detect_image(file_content)
            if detected is None:
                raise ValueError("Conteúdo do arquivo não é uma imagem válida")

            _, file_extension = detected

            # Gerar nome de arquivo único
            timestamp = int(datetime.now().timestamp())
            file_name = f"profile_{user_id}_{timestamp}{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, file_name)

            # Salvar arquivo
            with open(file_path, "wb") as f:
                f.write(file_content)

            # Retornar URL completa usando o host público correto
            public_base_url = get_public_base_url(base_url)
            public_path = file_path.replace(os.sep, "/")
            return f"{public_base_url}/{public_path}"

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
            # "http://localhost:8000/uploads/profile_1_1234567890.png" -> "profile_1_1234567890.png"
            if "uploads/" not in image_url:
                return False

            # 🔒 Sanitização: usa APENAS o basename e valida que o caminho final
            # resolve para DENTRO de UPLOAD_DIR (previne path traversal caso o
            # valor da URL venha manipulado no banco).
            relative_path = image_url.split("uploads/", 1)[-1]
            file_path = os.path.basename(relative_path.replace("\\", "/"))
            full_path = os.path.abspath(os.path.join(UPLOAD_DIR, file_path))
            upload_root = os.path.abspath(UPLOAD_DIR)

            if not full_path.startswith(upload_root + os.sep):
                from app.core.logger import logger
                logger.warning(f"[FILE] Tentativa de deletar fora do diretório: {image_url}")
                return False

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
