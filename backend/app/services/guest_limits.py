"""
Limite diário de mensagens para visitantes (modo não-logado).

Motivação: o rate limit por IP do visitante é inútil quando o tráfego passa
pelo proxy do Next.js — o backend vê o IP do servidor frontend, então todos
os visitantes compartilham o mesmo bucket (ou o atacante não é limitado, ou
os visitantes legítimos ficam sem quota).

Solução:
1. Identificação por cookie `guest_id` assinado (HMAC com SECRET_KEY).
2. Contagem DIÁRIA persistida na tabela `guest_chat_usage` (sobrevive a
   restarts e funciona com múltiplos workers).
3. Resposta 429 estruturada que o frontend usa para exibir o CTA de criação
   de conta.
"""

import hashlib
import hmac
import secrets
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import Request
from sqlalchemy.orm import Session
from starlette.responses import Response as StarletteResponse

from app.core.config import SECRET_KEY
from app.models.guest_chat_usage import GuestChatUsage

GUEST_COOKIE_NAME = "guest_id"
GUEST_COOKIE_MAX_AGE = 365 * 24 * 60 * 60  # 1 ano


def _sign(guest_id: str) -> str:
    """HMAC-SHA256 do guest_id com SECRET_KEY (impede forjar o cookie)."""
    return hmac.new(
        SECRET_KEY.encode("utf-8"), guest_id.encode("utf-8"), hashlib.sha256
    ).hexdigest()


def verify_guest_cookie(value: Optional[str]) -> Optional[str]:
    """
    Valida o valor do cookie `guest_id` (formato `id.assinatura`).
    Retorna o guest_id se a assinatura confere, senão None.
    """
    if not value or "." not in value:
        return None

    guest_id, signature = value.rsplit(".", 1)
    if not guest_id or not secrets.compare_digest(_sign(guest_id), signature):
        return None

    return guest_id


def resolve_guest_identity(request: Request) -> tuple[str, Optional[str]]:
    """
    Retorna (guest_id, novo_valor_de_cookie_ou_None).

    - Cookie presente e válido → reutiliza a identidade (None no 2º item).
    - Cookie ausente/forjado → gera nova identidade e devolve o valor do
      cookie para o chamador setar no response.
    """
    raw = request.cookies.get(GUEST_COOKIE_NAME)
    if raw:
        guest_id = verify_guest_cookie(raw)
        if guest_id:
            return guest_id, None

    guest_id = secrets.token_hex(16)
    cookie_value = f"{guest_id}.{_sign(guest_id)}"
    return guest_id, cookie_value


def build_guest_cookie_header(value: str, secure: bool) -> str:
    """Monta o header Set-Cookie para o cookie guest_id (HttpOnly, SameSite=Lax)."""
    tmp = StarletteResponse()
    tmp.set_cookie(
        key=GUEST_COOKIE_NAME,
        value=value,
        max_age=GUEST_COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=secure,
        path="/",
    )
    return tmp.headers.get("set-cookie") or ""


def get_guest_usage(db: Session, guest_id: str) -> int:
    """Mensagens usadas hoje por este visitante."""
    row = (
        db.query(GuestChatUsage)
        .filter(
            GuestChatUsage.guest_id == guest_id,
            GuestChatUsage.usage_date == date.today(),
        )
        .first()
    )
    return row.count if row else 0


def increment_guest_usage(db: Session, guest_id: str) -> int:
    """
    Incrementa o contador diário do visitante de forma atômica.
    Retorna o novo total (após incremento).
    """
    today = date.today()

    row = (
        db.query(GuestChatUsage)
        .filter(
            GuestChatUsage.guest_id == guest_id,
            GuestChatUsage.usage_date == today,
        )
        .with_for_update()
        .first()
    )

    if row:
        row.count += 1
    else:
        row = GuestChatUsage(guest_id=guest_id, usage_date=today, count=1)
        db.add(row)

    db.commit()
    return row.count


def seconds_until_midnight() -> int:
    """Segundos até o próximo reset do limite diário (meia-noite local)."""
    now = datetime.now()
    midnight = datetime.combine(now.date() + timedelta(days=1), datetime.min.time())
    return max(1, int((midnight - now).total_seconds()))
