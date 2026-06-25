"""
Validações centralizadas e exception handlers para toda a aplicação.
"""
from fastapi import HTTPException, status
from typing import Any, Callable, Optional
import re
from email_validator import validate_email, EmailNotValidError

# ===================================================================
# EXCEÇÕES CUSTOMIZADAS
# ===================================================================

class AtenaAIException(Exception):
    """Exceção base da aplicação"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class ValidationError(AtenaAIException):
    """Erro de validação"""
    def __init__(self, message: str):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)

class AuthenticationError(AtenaAIException):
    """Erro de autenticação"""
    def __init__(self, message: str = "Não autenticado"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)

class PermissionError(AtenaAIException):
    """Erro de permissão"""
    def __init__(self, message: str = "Sem permissão"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)

class NotFoundError(AtenaAIException):
    """Recurso não encontrado"""
    def __init__(self, resource: str):
        super().__init__(f"{resource} não encontrado", status.HTTP_404_NOT_FOUND)

class RateLimitError(AtenaAIException):
    """Limite de taxa excedido"""
    def __init__(self, retry_after: int = 60):
        super().__init__(f"Limite de requisições excedido. Tente novamente em {retry_after}s", 
                        status.HTTP_429_TOO_MANY_REQUESTS)

# ===================================================================
# VALIDADORES
# ===================================================================

class Validator:
    """Classe com validadores estáticos"""
    
    @staticmethod
    def email(email: str) -> str:
        """Valida e normaliza email"""
        try:
            valid = validate_email(email)
            return valid.email
        except EmailNotValidError as e:
            raise ValidationError(f"Email inválido: {str(e)}")
    
    @staticmethod
    def password(password: str, min_length: int = 6) -> str:
        """Valida senha"""
        if not password or len(password) < min_length:
            raise ValidationError(f"Senha deve ter no mínimo {min_length} caracteres")
        return password
    
    @staticmethod
    def username(username: str, min_length: int = 3, max_length: int = 50) -> str:
        """Valida username/nome"""
        if not username or not username.strip():
            raise ValidationError("Nome não pode ser vazio")
        
        username = username.strip()
        if len(username) < min_length or len(username) > max_length:
            raise ValidationError(f"Nome deve ter entre {min_length} e {max_length} caracteres")
        
        return username
    
    @staticmethod
    def text_length(text: str, max_length: int = 500) -> str:
        """Valida comprimento de texto"""
        if not text:
            raise ValidationError("Texto não pode ser vazio")
        
        if len(text) > max_length:
            raise ValidationError(f"Texto não pode exceder {max_length} caracteres")
        
        return text.strip()
    
    @staticmethod
    def id(value: Any) -> int:
        """Valida ID"""
        try:
            id_int = int(value)
            if id_int <= 0:
                raise ValueError
            return id_int
        except (ValueError, TypeError):
            raise ValidationError("ID inválido")
    
    @staticmethod
    def classroom_code(code: str) -> str:
        """Valida código de sala"""
        code = code.strip().upper()
        
        if not code or len(code) != 6:
            raise ValidationError("Código da sala deve ter 6 caracteres")
        
        if not re.match(r'^[A-Z0-9]{6}$', code):
            raise ValidationError("Código contém caracteres inválidos")
        
        return code

# ===================================================================
# EXCEPTION HANDLERS PARA FASTAPI
# ===================================================================

async def atena_exception_handler(request, exc: AtenaAIException):
    """Handler para exceções AtenaAI"""
    from fastapi.responses import JSONResponse
    from app.core.logger import log_error
    
    log_error(exc, context="atena_exception", user_id=getattr(request.state, "user_id", None))
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

async def validation_exception_handler(request, exc: ValidationError):
    """Handler para erros de validação"""
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "error_type": "validation_error"}
    )

async def generic_exception_handler(request, exc: Exception):
    """Handler genérico para exceções não tratadas"""
    from fastapi.responses import JSONResponse
    from app.core.logger import log_error
    
    log_error(exc, context="unhandled_exception", user_id=getattr(request.state, "user_id", None))
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor"}
    )
