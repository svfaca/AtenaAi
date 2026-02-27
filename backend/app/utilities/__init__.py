"""
Utilitários do AtenaAI - Performance e Otimizações
"""

from .prompt_builder import (
    build_user_context,
    build_system_prompt,
    build_classroom_context,
    build_report_context,
    truncate_string,
    escape_prompt_special_chars,
)

__all__ = [
    "build_user_context",
    "build_system_prompt",
    "build_classroom_context",
    "build_report_context",
    "truncate_string",
    "escape_prompt_special_chars",
]
