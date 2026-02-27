"""
Pagination schemas for paginated API responses.
Provides generic pagination support for all resources.
"""
from typing import TypeVar, Generic, List, Any, Optional
from pydantic import BaseModel, Field

T = TypeVar('T')

class PaginationParams(BaseModel):
    """Pagination input parameters"""
    skip: int = Field(default=0, ge=0, description="Number of items to skip")
    limit: int = Field(default=50, ge=1, le=100, description="Number of items to return (max 100)")
    
    class Config:
        schema_extra = {
            "example": {
                "skip": 0,
                "limit": 50
            }
        }


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response"""
    items: List[T] = Field(description="List of items")
    total: int = Field(description="Total number of items")
    skip: int = Field(description="Number of items skipped")
    limit: int = Field(description="Number of items returned")
    has_more: bool = Field(description="Whether there are more items available")
    
    class Config:
        schema_extra = {
            "example": {
                "items": [],
                "total": 100,
                "skip": 0,
                "limit": 50,
                "has_more": True
            }
        }


class CursorPaginationParams(BaseModel):
    """Cursor-based pagination for better performance"""
    cursor: Optional[str] = Field(default=None, description="Cursor from previous response")
    limit: int = Field(default=50, ge=1, le=100, description="Number of items to return")
    
    class Config:
        schema_extra = {
            "example": {
                "cursor": None,
                "limit": 50
            }
        }


class CursorPaginatedResponse(BaseModel, Generic[T]):
    """Cursor-based paginated response"""
    items: List[T] = Field(description="List of items")
    cursor: Optional[str] = Field(description="Cursor for next batch")
    has_more: bool = Field(description="Whether there are more items available")
    
    class Config:
        schema_extra = {
            "example": {
                "items": [],
                "cursor": None,
                "has_more": False
            }
        }
