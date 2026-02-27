from sqlalchemy.orm import Session
from app.models import Conversation, Message, User


def get_or_create_conversation(db: Session, user: User):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.created_at.desc())
        .first()
    )

    if not conversation:
        conversation = Conversation(user_id=user.id)
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
