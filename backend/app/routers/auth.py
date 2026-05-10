from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token, get_current_user
)
from app.models.user import User
from app.schemas.auth import RegisterRequest, TokenResponse, UserMeResponse, UserProfileUpdate

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    username = payload.username.lower().strip()
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username sudah digunakan")

    user = User(
        username=username,
        password_hash=hash_password(payload.password),
        role="buyer",
        nama_lengkap=payload.nama_lengkap,
        nama_toko=payload.nama_toko,
        nomor_hp=payload.nomor_hp,
        alamat=payload.alamat,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=str(user.id),
        nama_toko=user.nama_toko,
        nama_lengkap=user.nama_lengkap,
        nomor_hp=user.nomor_hp,
    )


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username.lower().strip()).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
        )
    if not getattr(user, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun dinonaktifkan. Hubungi admin.",
        )
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        role=user.role,
        user_id=str(user.id),
        nama_toko=user.nama_toko,
        nama_lengkap=user.nama_lengkap,
        nomor_hp=user.nomor_hp,
    )


@router.get("/me", response_model=UserMeResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserMeResponse(
        id=str(current_user.id),
        username=current_user.username,
        role=current_user.role,
        nama_lengkap=current_user.nama_lengkap,
        nama_toko=current_user.nama_toko,
        nomor_hp=current_user.nomor_hp,
        alamat=current_user.alamat,
        is_active=getattr(current_user, "is_active", True),
    )


@router.put("/me", response_model=UserMeResponse)
def update_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.nama_lengkap is not None:
        current_user.nama_lengkap = payload.nama_lengkap
    if payload.nama_toko is not None:
        current_user.nama_toko = payload.nama_toko
    if payload.nomor_hp is not None:
        current_user.nomor_hp = payload.nomor_hp
    if payload.alamat is not None:
        current_user.alamat = payload.alamat
    db.commit()
    db.refresh(current_user)
    return UserMeResponse(
        id=str(current_user.id),
        username=current_user.username,
        role=current_user.role,
        nama_lengkap=current_user.nama_lengkap,
        nama_toko=current_user.nama_toko,
        nomor_hp=current_user.nomor_hp,
        alamat=current_user.alamat,
        is_active=getattr(current_user, "is_active", True),
    )
