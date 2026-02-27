"""Registro ordenado de data migrations."""

from .v0001_normalize_user_interests import migration as v0001_normalize_user_interests

MIGRATIONS = [
    v0001_normalize_user_interests,
]
