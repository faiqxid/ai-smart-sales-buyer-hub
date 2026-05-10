import logging
from decimal import Decimal
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.inventory_log import InventoryLog

logger = logging.getLogger(__name__)


def recalculate_order(db: Session, order: Order) -> Order:
    """Hitung ulang total_tagihan, total_potongan_retur, dan grand_total."""
    total_tagihan = Decimal("0")
    total_potongan = Decimal("0")

    for item in order.items:
        total_tagihan += item.subtotal
        potongan = Decimal(str(item.qty_retur)) * item.harga_satuan
        total_potongan += potongan

    order.total_tagihan = total_tagihan
    order.total_potongan_retur = total_potongan
    order.grand_total = total_tagihan - total_potongan
    db.commit()
    db.refresh(order)
    return order


def get_invoice_summary(db: Session, order_id: str) -> dict:
    """Ambil ringkasan invoice order."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    items_data = []
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        items_data.append({
            "nama_produk": product.nama_produk if product else "-",
            "qty": item.qty,
            "harga_satuan": float(item.harga_satuan),
            "subtotal": float(item.subtotal),
            "qty_retur": item.qty_retur,
            "potongan_retur": float(item.qty_retur * item.harga_satuan),
            "status_retur": item.status_retur,
        })

    buyer = order.buyer
    return {
        "order_id": str(order.id),
        "buyer": {
            "nama_toko": buyer.nama_toko,
            "nama_lengkap": buyer.nama_lengkap,
            "nomor_hp": buyer.nomor_hp,
        },
        "status": order.status,
        "items": items_data,
        "total_tagihan": float(order.total_tagihan),
        "total_potongan_retur": float(order.total_potongan_retur),
        "grand_total": float(order.grand_total),
        "created_at": order.created_at.isoformat() if order.created_at else None,
    }
