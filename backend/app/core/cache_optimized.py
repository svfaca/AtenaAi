"""
Sistema de cache em memória otimizado com limite de tamanho e TTL.
Preparado para Redis em produção.

Otimizações:
- LRU (Least Recently Used) eviction
- TTL automático
- Limite de tamanho configurável
- Thread-safe
- Métricas e stats
"""
from typing import Any, Optional, Dict
from datetime import datetime, timedelta
from functools import lru_cache
import time
from threading import Lock
from collections import OrderedDict

# ===================================================================
# CACHE OTIMIZADO COM LIMITE DE TAMANHO (LRU)
# ===================================================================

class OptimizedCacheManager:
    """
    Cache em memória com TTL, limite de tamanho e eviction LRU.
    Não cresce indefinidamente em produção.
    """
    
    def __init__(self, max_size: int = 1000):
        self._cache: OrderedDict[str, tuple] = OrderedDict()
        self._lock = Lock()
        self.max_size = max_size
        self._hits = 0
        self._misses = 0
        self._evictions = 0
    
    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        """
        Set com TTL e eviction automática ao atingir max_size.
        
        Args:
            key: Chave do cache
            value: Valor a armazenar
            ttl_seconds: Time to live em segundos (default: 1 hora)
        """
        with self._lock:
            # Remove se já existe para atualizar ordem
            if key in self._cache:
                del self._cache[key]
            
            # Eviction: remove entrada mais antiga se atingiu limite
            if len(self._cache) >= self.max_size:
                oldest_key = next(iter(self._cache))
                del self._cache[oldest_key]
                self._evictions += 1
            
            # Adiciona nova entrada
            expiry = time.time() + ttl_seconds
            self._cache[key] = (value, expiry)
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get com validação de TTL.
        Move entrada para final (mais recentemente usada).
        
        Returns:
            Valor ou None se não existir ou expirou
        """
        with self._lock:
            if key not in self._cache:
                self._misses += 1
                return None
            
            value, expiry = self._cache[key]
            
            # Removido se expirou
            if time.time() > expiry:
                del self._cache[key]
                self._misses += 1
                return None
            
            # Move para final (most recently used)
            # Garante LRU correto
            self._cache.move_to_end(key)
            self._hits += 1
            return value
    
    def delete(self, key: str) -> bool:
        """
        Delete uma chave do cache.
        
        Returns:
            True se deletou, False se não existia
        """
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False
    
    def clear(self) -> None:
        """Limpa todo o cache"""
        with self._lock:
            self._cache.clear()
    
    def cleanup_expired(self) -> int:
        """
        Remove entries expiradas.
        Útil para chamar periodicamente.
        
        Returns:
            Número de entries removidas
        """
        with self._lock:
            now = time.time()
            expired_keys = [
                k for k, (_, exp) in self._cache.items()
                if now > exp
            ]
            for key in expired_keys:
                del self._cache[key]
            return len(expired_keys)
    
    def stats(self) -> Dict[str, Any]:
        """
        Retorna estatísticas do cache.
        Útil para monitoramento.
        """
        with self._lock:
            total_requests = self._hits + self._misses
            hit_rate = (self._hits / total_requests * 100) if total_requests > 0 else 0
            
            return {
                "size": len(self._cache),
                "max_size": self.max_size,
                "usage_percent": (len(self._cache) / self.max_size) * 100,
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": f"{hit_rate:.2f}%",
                "evictions": self._evictions,
                "total_requests": total_requests
            }
    
    def get_all_keys(self) -> list:
        """Retorna todas as chaves (para debug)"""
        with self._lock:
            return list(self._cache.keys())


# ===================================================================
# RATE LIMITING DISTRIBUÍDO (OTIMIZADO)
# ===================================================================

class OptimizedRateLimiter:
    """
    Rate limiter com suporte a chaves customizadas.
    Inclui limpeza automática de buckets antigos.
    """
    
    def __init__(self):
        self._buckets: Dict[str, list] = {}
        self._lock = Lock()
    
    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """
        Verifica se requisição é permitida dentro do limite.
        
        Args:
            key: Identificador único (user_id, IP, etc)
            max_requests: Número máximo de requisições
            window_seconds: Janela de tempo em segundos
            
        Returns:
            True se permitido, False se limit atingido
        """
        with self._lock:
            now = time.time()
            
            if key not in self._buckets:
                self._buckets[key] = []
            
            # Remove timestamps antigos (fora da janela)
            self._buckets[key] = [
                t for t in self._buckets[key]
                if now - t < window_seconds
            ]
            
            # Verifica limite
            if len(self._buckets[key]) >= max_requests:
                return False
            
            # Adiciona timestamp desta requisição
            self._buckets[key].append(now)
            return True
    
    def get_remaining(self, key: str, max_requests: int, window_seconds: int) -> int:
        """
        Retorna numero de requisições restantes.
        
        Returns:
            Número de requisições que ainda podem ser feitas
        """
        with self._lock:
            now = time.time()
            
            if key not in self._buckets:
                return max_requests
            
            # Remove timestamps antigos
            valid_requests = [
                t for t in self._buckets[key]
                if now - t < window_seconds
            ]
            self._buckets[key] = valid_requests
            
            return max(0, max_requests - len(valid_requests))
    
    def get_reset_time(self, key: str, window_seconds: int) -> Optional[int]:
        """
        Retorna segundos até próximo reset do rate limit.
        Útil para retry-after headers.
        
        Returns:
            Segundos até reset, ou None se sem limite
        """
        with self._lock:
            if key not in self._buckets or not self._buckets[key]:
                return None
            
            now = time.time()
            oldest_request = min(self._buckets[key])
            reset_time = oldest_request + window_seconds
            seconds_until_reset = max(0, int(reset_time - now))
            
            return seconds_until_reset if seconds_until_reset > 0 else None
    
    def cleanup_old_buckets(self, max_age_seconds: int = 86400) -> int:
        """
        Remove buckets com muita idade (sem requisições recentes).
        Útil para evitar memory leak.
        
        Args:
            max_age_seconds: Remover buckets mais antigos que isso
            
        Returns:
            Número de buckets removidos
        """
        with self._lock:
            now = time.time()
            buckets_to_remove = []
            
            for key, timestamps in self._buckets.items():
                if timestamps:
                    last_request = max(timestamps)
                    if now - last_request > max_age_seconds:
                        buckets_to_remove.append(key)
            
            for key in buckets_to_remove:
                del self._buckets[key]
            
            return len(buckets_to_remove)
    
    def clear(self) -> None:
        """Limpa todos os buckets"""
        with self._lock:
            self._buckets.clear()


# ===================================================================
# INSTANCES GLOBAIS
# ===================================================================

# Cache manager com limite de 1000 entradas
cache_manager = OptimizedCacheManager(max_size=1000)

# Rate limiter para requisições
rate_limiter = OptimizedRateLimiter()


# ===================================================================
# HELPERS E DECORATORS
# ===================================================================

def cache_key(*parts, prefix: str = "cache") -> str:
    """
    Gera chave de cache standardizada.
    
    @example
    key = cache_key("user", user_id, "profile", prefix="profile")
    -> "profile:user:123:profile"
    """
    return f"{prefix}:" + ":".join(str(p) for p in parts)


def cached(ttl_seconds: int = 3600):
    """
    Decorator para cachear resultado de função.
    
    @example
    @cached(ttl_seconds=1800)
    def expensive_operation(user_id):
        # ... lógica pesada
        return result
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Gera chave baseada em função e argumentos
            key = f"{func.__name__}:{args}:{kwargs}"
            
            # Tenta obter do cache
            result = cache_manager.get(key)
            if result is not None:
                return result
            
            # Se não está em cache, executa função
            result = func(*args, **kwargs)
            
            # Armazena em cache
            cache_manager.set(key, result, ttl_seconds)
            
            return result
        
        return wrapper
    return decorator
