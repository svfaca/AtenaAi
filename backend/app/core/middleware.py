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
from app.core.config import ENVIRONMENT, DEV_LOGIN_RATE_LIMIT_FALLBACK, TRUSTED_PROXY_IPS

# ===================================================================
# HELPERS
# ===================================================================

def get_client_ip(request: Request) -> str:
    """
    IP real do cliente.

    Confia em X-Forwarded-For APENAS quando o peer (request.client.host) está
    na lista TRUSTED_PROXY_IPS — caso contrário o header pode ser forjado por
    qualquer cliente. Com proxy vazio, retorna o peer (comportamento atual).
    """
    peer = (request.client.host if request.client else "") or ""
    if peer in TRUSTED_PROXY_IPS:
        xff = request.headers.get("x-forwarded-for", "")
        first = xff.split(",")[0].strip() if xff else ""
        if first:
            return first
    return peer

# ===================================================================
# MIDDLEWARE DE LOGGING E PERFORMANCE
# ===================================================================

class LoggingMiddleware(BaseHTTPMiddleware):
    """Log de requisições com timing e status"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        # Extração de usuário autenticado fica com a dependency get_current_user
        # (decodificar JWT aqui duplicaria a lógica sem ganho de segurança).
        user_id = None
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
        "/api/v1/chat/",  # Chat route handles its own rate limiting
        "/docs",
        "/openapi.json"
    }
    
    # Limites por tipo de endpoint (ordem: mais específico primeiro)
    LIMITS = [
        ("/api/v1/auth/login", 10, 900),      # 10 por 15 min
        ("/api/v1/auth/register", 10, 3600),  # 10 por hora (contra spam de contas/bcrypt DoS)
        ("/api/v1/chat/", 30, 60),          # 30 por minuto
        ("/api/v1/group-chat/", 60, 60),    # 60 por minuto
        ("/api/v1/conversations/", 60, 60), # 60 por minuto
        ("/api/v1/classrooms/", 60, 60),    # 60 por minuto
    ]
    DEFAULT_LIMIT = (120, 60)  # Default: 120 por minuto

    @staticmethod
    def _is_local_request(request: Request) -> bool:
        host = (request.client.host if request.client else "") or ""
        # "testclient" é o host usado pelo Starlette TestClient (testes automatizados)
        return host in {"127.0.0.1", "::1", "localhost", "testclient"}
    
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
            # 🔒 Usa o IP real (X-Forwarded-For apenas de proxy confiável)
            rate_key_prefix = f"ip:{get_client_ip(request)}"
        
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
            # Fallback para facilitar testes locais em desenvolvimento.
            if (
                matched_pattern == "/api/v1/auth/login"
                and ENVIRONMENT != "production"
                and DEV_LOGIN_RATE_LIMIT_FALLBACK
                and self._is_local_request(request)
            ):
                logger.warning(
                    "[RATE-LIMIT] Fallback dev ativo para login local: "
                    f"ip={request.client.host if request.client else 'unknown'}"
                )
                return await call_next(request)

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
# MIDDLEWARE DE PROTEÇÃO CSRF (verificação de Origin)
# ===================================================================

class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    Defesa em profundidade contra CSRF (além do SameSite=Lax dos cookies):
    mutações (POST/PUT/PATCH/DELETE) em /api/v1/* exigem Origin (ou Referer)
    de uma origem permitida — quando o header estiver presente.

    Requests SEM Origin/Referer (clientes server-to-server, curl, testes)
    são permitidos: a proteção cobre navegadores, que SEMPRE enviam Origin
    em mutações cross-site.
    """

    SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

    def __init__(self, app, allowed_origins=None):
        super().__init__(app)
        from app.core.config import CORS_ORIGINS

        self.allowed_origins = {
            (origin or "").rstrip("/") for origin in (allowed_origins or CORS_ORIGINS)
        }

    @staticmethod
    def _extract_origin(request: Request) -> str:
        """Prioriza Origin; cai para Referer quando Origin ausente."""
        origin = (request.headers.get("origin") or "").rstrip("/")
        if origin:
            return origin
        referer = request.headers.get("referer")
        if referer:
            try:
                from urllib.parse import urlparse

                parsed = urlparse(referer)
                return f"{parsed.scheme}://{parsed.netloc}"
            except Exception:
                return ""
        return ""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if (
            request.method not in self.SAFE_METHODS
            and request.url.path.startswith("/api/v1")
        ):
            origin = self._extract_origin(request)
            if origin and origin not in self.allowed_origins:
                logger.warning(
                    f"[CSRF] Rejeitado {request.method} {request.url.path} "
                    f"com origem não permitida: {origin}"
                )
                from fastapi.responses import JSONResponse

                return JSONResponse(
                    content={"detail": "Origem não permitida"},
                    status_code=403,
                )
        return await call_next(request)


# ===================================================================
# MIDDLEWARE DE SEGURANÇA
# ===================================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adiciona headers de segurança importante"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # 🔒 API nunca deve ser cacheada pelo navegador/proxy intermediário
        # (evita que dados autenticados fiquem em cache compartilhado).
        if request.url.path.startswith("/api/v1"):
            response.headers["Cache-Control"] = "no-store"
        
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
