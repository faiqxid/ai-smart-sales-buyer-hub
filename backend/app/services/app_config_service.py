import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.config import AppConfig

SECRET_KEYS = {
    "gemini_api_key",
    "firebase_service_account_json",
    "firebase_private_key",
}


def mask_secret(value: Optional[str]) -> Optional[str]:
    if not value:
        return value
    if len(value) <= 10:
        return "********"
    return f"{value[:4]}********{value[-4:]}"


def set_config(db: Session, key: str, value: Any, updated_by: Optional[str] = None, description: Optional[str] = None) -> AppConfig:
    text_value = value if isinstance(value, str) else json.dumps(value)
    item = db.query(AppConfig).filter(AppConfig.key == key).first()
    if not item:
        item = AppConfig(key=key, value=text_value, description=description, updated_by=updated_by)
        db.add(item)
    else:
        item.value = text_value
        if description is not None:
            item.description = description
        item.updated_by = updated_by
    db.commit()
    db.refresh(item)
    return item


def get_config(db: Session, key: str, default: Optional[str] = None) -> Optional[str]:
    item = db.query(AppConfig).filter(AppConfig.key == key).first()
    return item.value if item and item.value is not None else default


def get_json_config(db: Session, key: str) -> Optional[dict]:
    raw = get_config(db, key)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def list_configs(db: Session, masked: bool = True) -> list[dict]:
    rows = db.query(AppConfig).order_by(AppConfig.key.asc()).all()
    results = []
    for row in rows:
        value = row.value
        if masked and row.key in SECRET_KEYS:
            value = mask_secret(value)
        results.append({
            "key": row.key,
            "value": value,
            "description": row.description,
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            "updated_by": row.updated_by,
            "secret": row.key in SECRET_KEYS,
        })
    return results


def get_effective_gemini_api_key(db: Session) -> str:
    return get_config(db, "gemini_api_key") or settings.GEMINI_API_KEY


def get_effective_firebase_service_account(db: Session) -> Optional[dict]:
    stored = get_json_config(db, "firebase_service_account_json")
    if stored:
        return stored
    if settings.firebase_available:
        return {
            "type": "service_account",
            "project_id": settings.FIREBASE_PROJECT_ID,
            "client_email": settings.FIREBASE_CLIENT_EMAIL,
            "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    return None
