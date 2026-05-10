from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_sales
from app.models.pre_order import PreOrder
from app.models.product import Product
from app.schemas.pre_order import PreOrderCreate, PreOrderResponse, PreOrderStatusUpdate
from app.services import notification_service

router = APIRouter(prefix="/api/pre-orders", tags=["Pre-Orders"])


def _build_response(po: PreOrder) -> PreOrderResponse:
    buyer = po.buyer
    product = po.product
    return PreOrderResponse(
        id=str(po.id),
        buyer_id=str(po.buyer_id),
        nama_toko=buyer.nama_toko if buyer else None,
        nomor_hp=buyer.nomor_hp if buyer else None,
        product_id=str(po.product_id),
        nama_produk=product.nama_produk if product else "-",
        qty_request=po.qty_request,
        qty_matched=po.qty_matched,
        status=po.status,
        matched=po.matched,
        created_at=po.created_at.isoformat() if po.created_at else "",
    )


@router.post("", response_model=PreOrderResponse, status_code=201)
def create_pre_order(
    payload: PreOrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Hanya buyer yang bisa membuat pre-order")

    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    if product.stok_ball > 0:
        raise HTTPException(status_code=400, detail="Stok masih tersedia, gunakan fitur order biasa")

    # Cek pre-order duplikat pending
    existing = db.query(PreOrder).filter(
        PreOrder.buyer_id == current_user.id,
        PreOrder.product_id == payload.product_id,
        PreOrder.status == "pending",
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Anda sudah punya pre-order pending untuk produk ini")

    po = PreOrder(
        buyer_id=current_user.id,
        product_id=payload.product_id,
        qty_request=payload.qty_request,
    )
    db.add(po)
    db.commit()
    db.refresh(po)
    return _build_response(po)


@router.get("", response_model=List[PreOrderResponse])
def list_pre_orders(
    db: Session = Depends(get_db),
    current_user=Depends(require_sales),
):
    pos = db.query(PreOrder).order_by(PreOrder.created_at.asc()).all()
    return [_build_response(po) for po in pos]


@router.get("/my", response_model=List[PreOrderResponse])
def my_pre_orders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    pos = db.query(PreOrder).filter(
        PreOrder.buyer_id == current_user.id
    ).order_by(PreOrder.created_at.desc()).all()
    return [_build_response(po) for po in pos]


@router.patch("/{pre_order_id}/status")
async def update_pre_order_status(
    pre_order_id: str,
    payload: PreOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_sales),
):
    po = db.query(PreOrder).filter(PreOrder.id == pre_order_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Pre-order tidak ditemukan")
    po.status = payload.status
    if payload.status in ("matched", "fulfilled"):
        po.matched = True
    db.commit()

    await notification_service.send_notification(
        db, str(po.buyer_id),
        "Pre-Order Diperbarui",
        f"Pre-order {po.product.nama_produk if po.product else ''} Anda berstatus: {payload.status}",
    )
    return {"message": f"Status pre-order diperbarui ke {payload.status}"}
