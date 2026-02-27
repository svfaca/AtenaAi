"""Infraestrutura de data migrations versionadas."""

from .runner import apply_pending_data_migrations

__all__ = ["apply_pending_data_migrations"]
