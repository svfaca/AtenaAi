"""
Sistema de cache em memória otimizado e rate limiting distribuído.
Preparado para Redis em produção.
"""
from typing import Any, Optional, Dict
from datetime import datetime, timedelta
from functools import lru_cache
from collections import OrderedDict
import time
from threading import Lock, Thread
import logging

logger = logging.getLogger(__name__)

# ===================================================================
# CACHE OTIMIZADO COM LRU E LIMITE DE TAMANHO
# ===================================================================

class OptimizedCacheManager:
    """Cache em memória com limite de tamanho + TTL (LRU eviction)"""
    
    def __init__(self, max_size: int = 1000):
        self._cache = OrderedDict()  # Mantém ordem de inserção
        self.max_size = max_size
        self._lock = Lock()
    
    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        """Set com TTL e eviction automática (LRU)"""
        with self._lock:
            # Remove se já existe (para atualizar ordem)
            if key in self._cache:
                del self._cache[key]
            
            # Se atingiu limite, remove o mais antigo (LRU)
            if len(self._cache) >= self.max_size:
                oldest_key = next(iter(self._cache))
                del self._cache[oldest_key]
            
            expiry = time.time() + ttl_seconds
            self._cache[key] = (value, expiry)
    
    def get(self, key: str) -> Optional[Any]:
        """Get com validação de TTL (move para final = most recently used)"""
        with self._lock:
            if key not in self._cache:
                return None
            
            value, expiry = self._cache[key]
            
            # Removido se expirou
            if time.time() > expiry:
                del self._cache[key]
                return None
            
            # Move para o final (most recently used)
            self._cache.move_to_end(key)
            return value
    
    def delete(self, key: str) -> None:
        """Delete"""
        with self._lock:
            self._cache.pop(key, None)
    
    def clear(self) -> None:
        """Clear all cache"""
        with self._lock:
            self._cache.clear()
    
    def cleanup_expired(self) -> int:
        """Remove expired entries"""
        with self._lock:
            now = time.time()
            expired = [k for k, (_, exp) in self._cache.items() if now > exp]
            for key in expired:
                del self._cache[key]
            return len(expired)
    
    def stats(self) -> Dict[str, Any]:
        """Debug stats"""
        with self._lock:
            return {
                "size": len(self._cache),
                "max_size": self.max_size,
                "usage_percent": round((len(self._cache) / self.max_size) * 100, 2)
            }

# ===================================================================
# CACHE SIMPLES EM MEMÓRIA (Mantido para compatibilidade)
# ===================================================================

class CacheManager:
    """Cache simples com TTL para dados frequentemente acessados"""
    
    def __init__(self):
        self._cache: Dict[str, tuple] = {}  # key -> (value, expiry_time)
        self._lock = Lock()
    
    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        """Set com TTL"""
        with self._lock:
            expiry = time.time() + ttl_seconds
            self._cache[key] = (value, expiry)
    
    def get(self, key: str) -> Optional[Any]:
        """Get com validação de TTL"""
        with self._lock:
            if key not in self._cache:
                return None
            
            value, expiry = self._cache[key]
            if time.time() > expiry:
                del self._cache[key]
                return None
            
            return value
    
    def delete(self, key: str) -> None:
        """Delete"""
        with self._lock:
            self._cache.pop(key, None)
    
    def clear(self) -> None:
        """Clear all cache"""
        with self._lock:
            self._cache.clear()
    
    def cleanup_expired(self) -> int:
        """Remove expired entries"""
        with self._lock:
            now = time.time()
            expired = [k for k, (_, exp) in self._cache.items() if now > exp]
            for key in expired:
                del self._cache[key]
            return len(expired)

# ===================================================================
# RATE LIMITING DISTRIBUÍDO
# ===================================================================

class RateLimiter:
    """Rate limiter com suporte a chaves customizadas e cleanup automático"""
    
    def __init__(self, cleanup_interval: int = 3600):
        self._buckets: Dict[str, list] = {}  # key -> [timestamps]
        self._lock = Lock()
        self.cleanup_interval = cleanup_interval  # 1 hora por padrão
        self._cleanup_task = None
        self._start_cleanup_task()
    
    def _start_cleanup_task(self):
        """Inicia thread de background para limpeza de entradas antigas"""
        def cleanup_worker():
            while True:
                try:
                    time.sleep(self.cleanup_interval)
                    self.cleanup_old_entries()
                except Exception as e:
                    logger.error(f"Rate limiter cleanup error: {e}")
        
        thread = Thread(target=cleanup_worker, daemon=True)
        thread.start()
        self._cleanup_task = thread
        logger.info(f"Rate limiter cleanup task started (interval: {self.cleanup_interval}s)")
    
    def cleanup_old_entries(self):
        """Remove entradas com mais de 24 horas"""
        with self._lock:
            now = time.time()
            cutoff = now - (24 * 3600)  # 24 horas atrás
            
            keys_to_delete = []
            for key, timestamps in self._buckets.items():
                # Manter apenas timestamp recentes
                valid_timestamps = [t for t in timestamps if t > cutoff]
                
                if valid_timestamps:
                    self._buckets[key] = valid_timestamps
                else:
                    keys_to_delete.append(key)
            
            # Remover chaves sem timestamps válidos
            for key in keys_to_delete:
                del self._buckets[key]
            
            if keys_to_delete or len(self._buckets) > 100:
                logger.debug(f"Rate limiter cleanup: removed {len(keys_to_delete)} expired keys, {len(self._buckets)} remaining")
    
    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """Check if request is allowed"""
        with self._lock:
            now = time.time()
            
            if key not in self._buckets:
                self._buckets[key] = []
            
            # Remove timestamps antigos
            self._buckets[key] = [t for t in self._buckets[key] if now - t < window_seconds]
            
            # Verifica limite
            if len(self._buckets[key]) >= max_requests:
                return False
            
            self._buckets[key].append(now)
            return True
    
    def get_remaining(self, key: str, max_requests: int, window_seconds: int) -> int:
        """Get remaining requests"""
        with self._lock:
            now = time.time()
            
            if key not in self._buckets:
                return max_requests
            
            valid_requests = [t for t in self._buckets[key] if now - t < window_seconds]
            self._buckets[key] = valid_requests
            
            return max(0, max_requests - len(valid_requests))
    
    def get_reset_time(self, key: str, window_seconds: int) -> Optional[int]:
        """Get time until reset in seconds"""
        with self._lock:
            if key not in self._buckets or not self._buckets[key]:
                return None
            
            oldest = min(self._buckets[key])
            reset_time = int(oldest + window_seconds)
            return max(0, reset_time - int(time.time()))

# ===================================================================
# INSTÂNCIAS GLOBAIS
# ===================================================================

cache = CacheManager()
rate_limiter = RateLimiter()

# ===================================================================
# CACHE DECORATORS
# ===================================================================

def cached(ttl_seconds: int = 3600):
    """Decorator para cachear resultado de função"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Gera chave baseada em função e argumentos
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl_seconds)
            return result
        return wrapper
    return decorator
