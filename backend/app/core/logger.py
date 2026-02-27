"""
Configuração centralizada de logging estruturado.
Otimizado para performance e clareza em produção.
"""
import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict
from pythonjsonlogger import jsonlogger

# ===================================================================
# LOGGING ESTRUTURADO - JSON PARA MELHOR PROCESSAMENTO
# ===================================================================

class StructuredFormatter(jsonlogger.JsonFormatter):
    """Formatter customizado para JSON estruturado"""
    def add_fields(self, log_record: Dict, record: logging.LogRecord, message_dict: Dict) -> None:
        super().add_fields(log_record, record, message_dict)
        log_record['timestamp'] = datetime.utcnow().isoformat()
        log_record['logger'] = record.name
        log_record['level'] = record.levelname

def setup_logging(level: str = "INFO") -> logging.Logger:
    """Configura logging estruturado com bom desempenho"""
    logger = logging.getLogger("atenaai")
    logger.setLevel(level)
    
    # Remove handlers antigos
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Handler para stdout (produção)
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setFormatter(StructuredFormatter())
    logger.addHandler(stdout_handler)
    
    # Reduzir verbosidade de bibliotecas
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("asgi_correlation_id").setLevel(logging.WARNING)
    
    return logger

# Instância global
logger = setup_logging()

# ===================================================================
# HELPERS PARA LOGGING ESTRUTURADO
# ===================================================================

def log_event(event: str, level: str = "INFO", **kwargs) -> None:
    """Log estruturado de evento com contexto"""
    log_func = getattr(logger, level.lower(), logger.info)
    log_func(event, extra=kwargs)

def log_api_call(method: str, path: str, status_code: int, duration_ms: float, user_id: Any = None) -> None:
    """Log de chamada API com metadados"""
    logger.info("api_call", extra={
        "method": method,
        "path": path,
        "status": status_code,
        "duration_ms": duration_ms,
        "user_id": user_id
    })

def log_error(error: Exception, context: str = "", user_id: Any = None) -> None:
    """Log de erro com contexto"""
    logger.error(context or str(error), extra={
        "error_type": type(error).__name__,
        "error_message": str(error),
        "user_id": user_id
    }, exc_info=True)
