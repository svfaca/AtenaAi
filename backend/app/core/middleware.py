"""
Middlewares customizados para segurança, performance e monitoramento.
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Receive, Send
import time
import uuid
from typing import Callable

from app.core.logger import logger, log_api_call, log_error
from app.core.cache import rate_limiter

# ===================================================================
# MIDDLEWARE DE LOGGING E PERFORMANCE
# ===================================================================

class LoggingMiddleware(BaseHTTPMiddleware):
    """Log de requisições com timing e status"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id
        
        # Extrair user_id do token se disponível
        user_id = None
        try:
            # Tentar extrair do header Authorization
            auth = request.headers.get("Authorization", "")
            if auth.startswith("Bearer "):
                # Aqui você poderia decodificar o token se necessário
                pass
        except:
            pass
        
        request.state.user_id = user_id
        
        # Medir tempo
        start_time = time.time()
        
        try:
            response = await call_next(request)
            duration_ms = (time.time() - start_time) * 1000
            
            # Log apenas para endpoints importantes (não assets)
            if not any(x in request.url.path for x in ["/uploads", ".js", ".css", ".png", ".jpg"]):
                log_api_call(
                    method=request.method,
                    path=request.url.path,
                    status_code=response.status_code,
                    duration_ms=duration_ms,
                    user_id=user_id
                )
            
            response.headers["X-Request-ID"] = request_id
            return response
        
        except Exception as exc:
            duration_ms = (time.time() - start_time) * 1000
            log_error(exc, context="middleware_error", user_id=user_id)
            raise

# ===================================================================
# MIDDLEWARE DE RATE LIMITING
# ===================================================================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting por IP para endpoints públicos"""
    
    # Endpoints que não sofrem rate limit
    EXEMPT_PATHS = {
        "/api/v1/auth/register",
        "/api/v1/auth/check-email",
        "/docs",
        "/openapi.json"
    }
    
    # Limites por tipo de endpoint (ordem: mais específico primeiro)
    LIMITS = [
        ("/api/v1/auth/login", 10, 900),   # 10 por 15 min
        ("/api/v1/chat/", 30, 60),          # 30 por minuto
        ("/api/v1/group-chat/", 60, 60),    # 60 por minuto
        ("/api/v1/conversations/", 60, 60), # 60 por minuto
        ("/api/v1/classrooms/", 60, 60),    # 60 por minuto
    ]
    DEFAULT_LIMIT = (120, 60)  # Default: 120 por minuto
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Não limita rotas que retornam assets
        if any(x in request.url.path for x in ["/uploads", ".js", ".css", ".png", ".jpg", "/docs"]):
            return await call_next(request)
        
        # Não limita endpoints isentos
        for exempt_path in self.EXEMPT_PATHS:
            if request.url.path.startswith(exempt_path):
                return await call_next(request)
        
        # Extrair chave (IP ou user_id)
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            rate_key_prefix = f"user:{user_id}"
        else:
            rate_key_prefix = f"ip:{request.client.host}"
        
        # Encontrar limite aplicável (mais específico primeiro)
        max_requests, window = self.DEFAULT_LIMIT
        matched_pattern = "default"
        for pattern, limit, win in self.LIMITS:
            if request.url.path.startswith(pattern):
                max_requests, window = limit, win
                matched_pattern = pattern
                break
        
        # Chave inclui o padrão para separar buckets por endpoint
        rate_key = f"{rate_key_prefix}:{matched_pattern}"
        
        # Verificar rate limit
        if not rate_limiter.is_allowed(rate_key, max_requests, window):
            remaining = rate_limiter.get_remaining(rate_key, max_requests, window)
            reset_time = rate_limiter.get_reset_time(rate_key, window)
            
            from fastapi.responses import JSONResponse
            return JSONResponse(
                content={"detail": "Rate limit exceeded. Tente novamente em breve."},
                status_code=429,
                headers={
                    "X-RateLimit-Remaining": str(remaining),
                    "X-RateLimit-Reset": str(reset_time or 0)
                }
            )
        
        return await call_next(request)

# ===================================================================
# MIDDLEWARE DE SEGURANÇA
# ===================================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adiciona headers de segurança importante"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Headers essenciais de segurança
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Remover headers que expõem informações
        if "Server" in response.headers:
            del response.headers["Server"]
        if "X-Powered-By" in response.headers:
            del response.headers["X-Powered-By"]
        
        return response
