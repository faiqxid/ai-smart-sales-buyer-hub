from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_sales
from app.schemas.notification import FCMTokenRegister, NotificationSend, NotificationResponse
from app.services import notification_service

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.post("/register-token", response_model=NotificationResponse)
async def register_token(
    payload: FCMTokenRegister,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await notification_service.register_fcm_token(
        db, str(current_user.id), payload.token, payload.platform
    )
    return NotificationResponse(success=True, message="FCM token berhasil didaftarkan")


@router.post("/send-test", response_model=NotificationResponse)
async def send_test(
    payload: NotificationSend,
    db: Session = Depends(get_db),
    current_user=Depends(require_sales),
):
    result = await notification_service.send_notification(
        db, payload.user_id, payload.title, payload.body, payload.data
    )

    reason_messages = {
        "sent": "Notifikasi terkirim",
        "firebase_not_configured": "Notifikasi gagal (Firebase belum dikonfigurasi)",
        "no_tokens": "Notifikasi gagal (user belum punya FCM token/device terdaftar)",
        "all_failed": "Notifikasi gagal dikirim ke semua device (token kemungkinan invalid/expired atau beda Firebase project)",
        "exception": "Notifikasi gagal karena error saat mengirim FCM",
    }

    return NotificationResponse(
        success=result["success"],
        message=reason_messages.get(result.get("reason"), "Notifikasi gagal dikirim"),
    )
