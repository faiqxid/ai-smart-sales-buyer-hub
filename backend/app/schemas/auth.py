from pydantic import BaseModel, field_validator
from typing import Optional


class RegisterRequest(BaseModel):
    username: str
    password: str
    nomor_hp: str
    nama_toko: Optional[str] = None
    alamat: Optional[str] = None
    nama_lengkap: Optional[str] = None

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip().lower()
        if len(v) < 3:
            raise ValueError("Username minimal 3 karakter")
        if len(v) > 50:
            raise ValueError("Username maksimal 50 karakter")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password minimal 6 karakter")
        return v

    @field_validator("nomor_hp")
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        from app.utils.phone import normalize_phone
        return normalize_phone(v)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    nama_toko: Optional[str] = None
    nama_lengkap: Optional[str] = None
    nomor_hp: Optional[str] = None


class UserMeResponse(BaseModel):
    id: str
    username: str
    role: str
    nama_lengkap: Optional[str] = None
    nama_toko: Optional[str] = None
    nomor_hp: str
    alamat: Optional[str] = None
    is_active: bool = True

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    nama_lengkap: Optional[str] = None
    nama_toko: Optional[str] = None
    nomor_hp: Optional[str] = None
    alamat: Optional[str] = None

    @field_validator("nomor_hp")
    @classmethod
    def normalize_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        from app.utils.phone import normalize_phone
        return normalize_phone(v)
