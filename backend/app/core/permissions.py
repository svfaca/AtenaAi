from fastapi import Depends, HTTPException, status
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole


def require_role(*roles: UserRole):
    def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissão insuficiente"
            )
        return current_user
    return checker
