import json
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, hash_password, require_admin
from app.models.user import User
from app.models.fcm_token import FCMToken
from app.models.audit_log import AuditLog
from app.services.app_config_service import (
    get_effective_firebase_service_account,
    get_effective_gemini_api_key,
    list_configs,
    set_config,
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def _add_audit(db: Session, admin_user: User, action: str, target: str = "", detail: str = ""):
    log = AuditLog(
        admin_id=str(admin_user.id),
        admin_username=admin_user.username,
        action=action,
        target=target,
        detail=detail,
    )
    db.add(log)
    db.commit()



class ConfigItemIn(BaseModel):
    key: str
    value: str
    description: Optional[str] = None


class UserCreateIn(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(pattern="^(admin|sales|buyer)$")
    nama_lengkap: Optional[str] = None
    nama_toko: Optional[str] = None
    nomor_hp: str
    alamat: Optional[str] = None


class UserUpdateIn(BaseModel):
    role: Optional[str] = Field(default=None, pattern="^(admin|sales|buyer)$")
    nama_lengkap: Optional[str] = None
    nama_toko: Optional[str] = None
    nomor_hp: Optional[str] = None
    alamat: Optional[str] = None


class ResetPasswordIn(BaseModel):
    new_password: str = Field(min_length=6, max_length=128)


@router.get("/health")
def admin_health(
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    firebase_cfg = get_effective_firebase_service_account(db)
    gemini_key = get_effective_gemini_api_key(db)
    return {
        "success": True,
        "user": {"id": str(admin_user.id), "username": admin_user.username, "role": admin_user.role},
        "integrations": {
            "gemini": bool(gemini_key),
            "firebase": bool(firebase_cfg and firebase_cfg.get("project_id") and firebase_cfg.get("client_email") and firebase_cfg.get("private_key")),
        },
    }


@router.get("/configs")
def get_configs(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return {"success": True, "items": list_configs(db, masked=True)}


@router.put("/configs")
def put_configs(payload: list[ConfigItemIn], db: Session = Depends(get_db), admin_user=Depends(require_admin)):
    for item in payload:
        set_config(db, item.key, item.value, updated_by=str(admin_user.id), description=item.description)
    return {"success": True, "message": "Konfigurasi berhasil disimpan"}


@router.post("/firebase/import-json")
async def import_firebase_json(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    if not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="File harus format .json")

    raw = await file.read()
    try:
        content = json.loads(raw.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="JSON tidak valid")

    required = ["project_id", "client_email", "private_key"]
    missing = [k for k in required if not content.get(k)]
    if missing:
        raise HTTPException(status_code=400, detail=f"Field wajib tidak lengkap: {', '.join(missing)}")

    normalized = {
        "type": "service_account",
        "project_id": content["project_id"],
        "client_email": content["client_email"],
        "private_key": content["private_key"],
        "token_uri": content.get("token_uri", "https://oauth2.googleapis.com/token"),
    }

    set_config(
        db,
        "firebase_service_account_json",
        normalized,
        updated_by=str(admin_user.id),
        description="Firebase service account for FCM",
    )

    return {
        "success": True,
        "message": "Firebase JSON berhasil diimport",
        "project_id": normalized["project_id"],
        "client_email": normalized["client_email"],
    }


@router.get("/users")
def list_users(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    rows = db.query(User).order_by(User.created_at.desc()).all()
    
    # Get token count per user
    token_counts = {
        row[0]: row[1] 
        for row in db.query(FCMToken.user_id, func.count(FCMToken.id))
        .group_by(FCMToken.user_id).all()
    }

    return {
        "success": True,
        "items": [
            {
                "id": str(u.id),
                "username": u.username,
                "role": u.role,
                "nama_lengkap": u.nama_lengkap,
                "nama_toko": u.nama_toko,
                "nomor_hp": u.nomor_hp,
                "alamat": u.alamat,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "fcm_token_count": token_counts.get(u.id, 0),
            }
            for u in rows
        ],
    }


@router.post("/users")
def create_user(payload: UserCreateIn, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    exists = db.query(User).filter(User.username == payload.username).first()
    if exists:
        raise HTTPException(status_code=400, detail="Username sudah dipakai")

    user = User(
        username=payload.username.strip(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        nama_lengkap=payload.nama_lengkap,
        nama_toko=payload.nama_toko,
        nomor_hp=payload.nomor_hp,
        alamat=payload.alamat,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"success": True, "message": "User berhasil dibuat", "id": str(user.id)}


@router.put("/users/{user_id}")
def update_user(user_id: UUID, payload: UserUpdateIn, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(user, key, value)
    db.commit()

    return {"success": True, "message": "User berhasil diupdate"}


@router.post("/users/{user_id}/reset-password")
def reset_user_password(user_id: UUID, payload: ResetPasswordIn, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    user.password_hash = hash_password(payload.new_password)
    db.commit()

    return {"success": True, "message": "Password user berhasil direset"}


@router.post("/notifications/send-test")
async def admin_send_test_notification(
    payload: dict,
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    """Admin: Kirim test push notification ke user tertentu."""
    from app.services import notification_service
    user_id = payload.get("user_id")
    title = payload.get("title", "Test Notifikasi")
    body = payload.get("body", "Hai, ini test notifikasi dari admin.")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id wajib diisi")
    
    result = await notification_service.send_notification(
        db, user_id, title, body, {"type": "admin_test"}
    )
    
    reason_messages = {
        "sent": "Notifikasi berhasil terkirim ke device user",
        "firebase_not_configured": "Firebase belum dikonfigurasi. Upload JSON dulu di tab Firebase.",
        "no_tokens": "User belum memiliki FCM token (belum buka app/izinkan notifikasi)",
        "all_failed": "Notifikasi gagal di semua device (token invalid/expired)",
        "exception": "Error saat mengirim notifikasi",
    }
    
    return {
        "success": result["success"],
        "message": reason_messages.get(result.get("reason"), "Notifikasi gagal"),
        "detail": result,
    }


@router.post("/firebase/test")
def test_firebase(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    """Test apakah Firebase berhasil inisialisasi."""
    from app.services.notification_service import _get_firebase_app as get_fb
    try:
        fb_app = get_fb(db)
        if fb_app:
            return {"success": True, "message": "Firebase berhasil inisialisasi", "project_id": fb_app.project_id}
        return {"success": False, "message": "Firebase tidak bisa inisialisasi. Periksa konfigurasi."}
    except Exception as e:
        return {"success": False, "message": f"Firebase error: {str(e)}"}


@router.post("/gemini/test")
def test_gemini(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    """Test apakah Gemini API key valid."""
    api_key = get_effective_gemini_api_key(db)
    if not api_key:
        return {"success": False, "message": "Gemini API key belum diset"}
    
    # Ambil model dari config, default ke alias terbaru yang terbukti aktif via Gemini API.
    from app.services.app_config_service import list_configs
    configs = {c["key"]: c["value"] for c in list_configs(db)}
    model_name = configs.get("gemini_model", "gemini-flash-latest")

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        resp = client.models.generate_content(
            model=model_name,
            contents='Balas dengan: OK',
        )
        return {"success": True, "message": f"Gemini API key valid (Model: {model_name})", "response": resp.text[:100] if resp.text else "OK"}
    except Exception as e:
        return {"success": False, "message": f"Gemini error: {str(e)}"}

