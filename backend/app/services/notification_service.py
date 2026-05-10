import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.fcm_token import FCMToken
from app.services.app_config_service import get_effective_firebase_service_account

logger = logging.getLogger(__name__)


def _get_firebase_app(db: Optional[Session] = None):
    """Inisialisasi Firebase Admin. Return None jika belum dikonfigurasi."""
    # Prioritas: Config DB, lalu env vars
    fcm_cfg = None
    if db:
        fcm_cfg = get_effective_firebase_service_account(db)
    
    if not fcm_cfg and not settings.firebase_available:
        logger.warning("Firebase belum dikonfigurasi. Notifikasi tidak akan dikirim.")
        return None
    
    try:
        import firebase_admin
        from firebase_admin import credentials
        if not firebase_admin._apps:
            if fcm_cfg:
                # Ambil dari DB
                cred_dict = fcm_cfg
                # Normalisasi private key jika masih mengandung literal \n
                if "private_key" in cred_dict:
                    cred_dict["private_key"] = cred_dict["private_key"].replace("\\n", "\n")
                cred = credentials.Certificate(cred_dict)
            else:
                # Fallback ke env settings
                cred = credentials.Certificate({
                    "type": "service_account",
                    "project_id": settings.FIREBASE_PROJECT_ID,
                    "client_email": settings.FIREBASE_CLIENT_EMAIL,
                    "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
                    "token_uri": "https://oauth2.googleapis.com/token",
                })
            firebase_admin.initialize_app(cred)
        return firebase_admin.get_app()
    except Exception as e:
        logger.error(f"Gagal inisialisasi Firebase: {e}")
        return None



async def send_notification(
    db: Session,
    user_id: str,
    title: str,
    body: str,
    data: Optional[dict] = None
) -> dict:
    """Kirim push notification ke semua FCM token milik user. Return dict dg status & reason."""
    app = _get_firebase_app(db)
    if not app:
        logger.info(f"[FCM Disabled] Notifikasi ke {user_id}: {title} - {body}")
        return {"success": False, "reason": "firebase_not_configured"}

    tokens = db.query(FCMToken).filter(FCMToken.user_id == user_id).all()
    if not tokens:
        logger.info(f"Tidak ada FCM token untuk user {user_id}")
        return {"success": False, "reason": "no_tokens"}

    try:
        from firebase_admin import messaging
        messages = [
            messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data=data or {},
                token=t.token,
            )
            for t in tokens
        ]
        response = messaging.send_each(messages)
        
        # Log detail per token & auto-hapus token tidak valid
        for idx, resp in enumerate(response.responses):
            token_str = tokens[idx].token
            if not resp.success:
                err_code = resp.exception.code if resp.exception else "unknown"
                logger.warning(f"FCM token error ({err_code}) untuk token: {token_str[:10]}...")
                if err_code in ["messaging/invalid-registration-token", "messaging/registration-token-not-registered", "NOT_FOUND"]:
                    logger.info(f"Menghapus token tidak valid: {token_str[:10]}...")
                    db.delete(tokens[idx])
        db.commit()

        success = response.success_count > 0
        logger.info(f"FCM sent {response.success_count}/{len(messages)} untuk user {user_id}")
        
        return {
            "success": success, 
            "reason": "sent" if success else "all_failed",
            "success_count": response.success_count,
            "failure_count": response.failure_count
        }
    except Exception as e:
        logger.error(f"FCM send error: {e}")
        return {"success": False, "reason": "exception"}


async def register_fcm_token(db: Session, user_id: str, token: str, platform: str = "web") -> FCMToken:
    """Simpan atau update FCM token user."""
    existing = db.query(FCMToken).filter(FCMToken.token == token).first()
    if existing:
        existing.user_id = user_id
        existing.platform = platform
        db.commit()
        db.refresh(existing)
        return existing

    fcm = FCMToken(user_id=user_id, token=token, platform=platform)
    db.add(fcm)
    db.commit()
    db.refresh(fcm)
    return fcm
