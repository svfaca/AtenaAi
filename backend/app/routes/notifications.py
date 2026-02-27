from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime

from app.database.database import get_db
from app.models.user import User
from app.models.notification import Notification, NotificationType
from app.core.dependencies import get_current_user
from app.core.logger import logger
from pydantic import BaseModel


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# ==================== SCHEMAS ====================

class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    data: str | None
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== ENDPOINTS ====================

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Busca notificações do usuário atual"""
    try:
        logger.info(f"[NOTIFICATIONS] Fetching notifications for user ID: {current_user.id}")
        
        query = db.query(Notification).filter(Notification.user_id == current_user.id)
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        notifications = query.order_by(desc(Notification.created_at)).limit(limit).all()
        logger.info(f"[NOTIFICATIONS] Found {len(notifications)} notifications for user {current_user.id}")
        
        # Convert enum values to strings
        result = []
        for notif in notifications:
            notif_data = NotificationResponse.model_validate(notif)
            # Ensure type is a string value
            if isinstance(notif_data.type, str):
                result.append(notif_data)
            else:
                # Fallback: manually construct the dict
                result.append({
                    "id": notif.id,
                    "type": notif.type.value if hasattr(notif.type, 'value') else str(notif.type),
                    "title": notif.title,
                    "message": notif.message,
                    "data": notif.data,
                    "is_read": notif.is_read,
                    "created_at": notif.created_at
                })
        
        return result
    except Exception as e:
        logger.error(f"[NOTIFICATIONS] Error fetching notifications: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro ao buscar notificações: {str(e)}")


@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retorna a quantidade de notificações não lidas"""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    return {"count": count}


@router.post("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marca uma notificação como lida"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(404, "Notificação não encontrada")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Notificação marcada como lida"}


@router.post("/mark-all-read")
def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marca todas as notificações como lidas"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({
        "is_read": True,
        "read_at": datetime.utcnow()
    })
    db.commit()
    
    return {"message": "Todas as notificações foram marcadas como lidas"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deleta uma notificação"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(404, "Notificação não encontrada")
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notificação deletada"}
