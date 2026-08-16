"""
Modelo de contagem diária de mensagens de visitantes (modo não-logado).

Identificação: cookie `guest_id` assinado (HMAC com SECRET_KEY).
Persistência: tabela própria no banco (Postgres/SQLite) para que o limite
sobreviva a restarts e funcione com múltiplos workers — diferente do
RateLimiter em memória.
"""

from datetime import date

from sqlalchemy import Column, Date, Integer, String

from app.database.database import Base


class GuestChatUsage(Base):
    """Contador diário de mensagens por visitante (guest_id)."""

    __tablename__ = "guest_chat_usage"

    guest_id: str = Column(String(64), primary_key=True)
    usage_date: date = Column(Date, primary_key=True)
    count: int = Column(Integer, nullable=False, default=0)

    def __repr__(self) -> str:
        return (
            f"<GuestChatUsage guest_id={self.guest_id} "
            f"date={self.usage_date} count={self.count}>"
        )
