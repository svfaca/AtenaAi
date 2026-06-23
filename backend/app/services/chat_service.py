from sqlalchemy.orm import Session
from typing import Any
from app.models import Conversation, Message


def get_or_create_conversation(
    db: Session,
    user_id: Any,
    conversation_id: int | None = None,
    title: str | None = None,
):
    conversation = None

    if conversation_id:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
            .first()
        )

    if not conversation:
        conversation = Conversation(user_id=user_id, title=title)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    return conversation


def save_message(db: Session, conversation_id: int, role: str, content: str):
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
