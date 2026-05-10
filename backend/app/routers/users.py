from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import require_sales
from app.models.user import User
from app.utils.phone import to_wa_link, to_call_link

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/buyers")
def list_buyers(
    db: Session = Depends(get_db),
    current_user=Depends(require_sales),
):
    buyers = db.query(User).filter(User.role == "buyer").order_by(User.nama_toko).all()
    return [
        {
            "id": str(b.id),
            "username": b.username,
            "nama_toko": b.nama_toko,
            "nama_lengkap": b.nama_lengkap,
            "nomor_hp": b.nomor_hp,
            "alamat": b.alamat,
            "wa_link": to_wa_link(b.nomor_hp),
            "call_link": to_call_link(b.nomor_hp),
        }
        for b in buyers
    ]
