from pydantic import BaseModel
from typing import Optional


class FCMTokenRegister(BaseModel):
    token: str
    platform: str = "web"


class NotificationSend(BaseModel):
    user_id: str
    title: str
    body: str
    data: Optional[dict] = None


class NotificationResponse(BaseModel):
    success: bool
    message: str
