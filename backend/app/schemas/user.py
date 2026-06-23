from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Union
from datetime import date
import json

from app.models.user import UserRole
from app.utilities.interests import parse_interests


# =========================
# INPUTS
# =========================

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

    nickname: Optional[str] = None
    interests: Optional[Union[List[str], str]] = None
    profile_image: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None

    @field_validator("interests", mode="before")
    @classmethod
    def normalize_interests(cls, value):
        if isinstance(value, list):
            return json.dumps(value)
        return value


class UserLogin(BaseModel):
    email: str
    password: str


# =========================
# OUTPUTS (PUBLIC)
# =========================

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str

    # ✅ agora consistente com model
    role: UserRole

    nickname: Optional[str] = None
    interests: List[str] = Field(default_factory=list)
    profile_image: Optional[str] = None
    gender: Optional[str] = None
    birth_date: Optional[date] = None

    @field_validator("interests", mode="before")
    @classmethod
    def validate_interests(cls, v):
        """
        Faz parse e normalização de interesses.
        Converte JSON/CSV para lista normalizada em português.
        """
        return parse_interests(v)

    class Config:
        from_attributes = True


# =========================
# STUDENT LITE (teacher usa)
# =========================

class StudentLite(BaseModel):
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True


# =========================
# TOKEN
# =========================

class Token(BaseModel):
    access_token: str
    token_type: str
