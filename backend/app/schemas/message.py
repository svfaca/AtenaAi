from pydantic import BaseModel
from typing import Optional

class ChatMessage(BaseModel):
    text: str
    language: Optional[str] = None
