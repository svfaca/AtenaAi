"""Registro ordenado de data migrations."""

from .v0001_normalize_user_interests import migration as v0001_normalize_user_interests
from .v0002_seed_demo_auth_users import migration as v0002_seed_demo_auth_users

MIGRATIONS = [
    v0001_normalize_user_interests,
    v0002_seed_demo_auth_users,
]
