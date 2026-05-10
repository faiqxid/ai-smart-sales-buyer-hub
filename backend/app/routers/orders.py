from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_sales
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.order import (
    OrderCreate, OrderResponse, OrderItemResponse,
    OrderStatusUpdate, ReturnItemRequest
)
from app.services import order_service, inventory_service, notification_service

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def _build_item_response(item: OrderItem) -> OrderItemResponse:
    product = item.product
    return OrderItemResponse(
        id=str(item.id),
        product_id=str(item.product_id),
        nama_produk=product.nama_produk if product else "-",
        qty=item.qty,
        harga_satuan=item.harga_satuan,
        subtotal=item.subtotal,
        estimasi_expired=item.estimasi_expired,
        status_retur=item.status_retur,
        qty_retur=item.qty_retur,
        alasan_retur=item.alasan_retur,
        potongan_retur=item.qty_retur * item.harga_satuan,
    )


def _build_order_response(order: Order, include_items: bool = True) -> OrderResponse:
    buyer = order.buyer
    return OrderResponse(
        id=str(order.id),
        buyer_id=str(order.buyer_id),
        nama_toko=buyer.nama_toko if buyer else None,
        nomor_hp=buyer.nomor_hp if buyer else None,
        status=order.status,
        total_tagihan=order.total_tagihan,
        total_potongan_retur=order.total_potongan_retur,
        grand_total=order.grand_total,
        catatan=order.catatan,
        items=[_build_item_response(i) for i in order.items] if include_items else None,
        created_at=order.created_at.isoformat() if order.created_at else "",
    )


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Hanya buyer yang bisa membuat pesanan")

    try:
        # Pre-validate all products and stock
        items_to_create = []
        total_tagihan = 0

        for item_in in payload.items:
            product = db.query(Product).filter(Product.id == item_in.product_id).first()
            if not product or not product.is_active:
                raise HTTPException(status_code=404, detail=f"Produk tidak ditemukan atau tidak aktif: {item_in.product_id}")
            if product.stok_ball < item_in.qty:
                raise HTTPException(status_code=400, detail=f"Stok {product.nama_produk} tidak cukup. Tersedia: {product.stok_ball}")

            subtotal = product.harga * item_in.qty
            total_tagihan += subtotal
            items_to_create.append({
                "product": product,
                "qty": item_in.qty,
                "harga_satuan": product.harga,
                "subtotal": subtotal,
                "estimasi_expired": item_in.estimasi_expired,
            })

        # Create Order (atomic part begins)
        order = Order(
            buyer_id=current_user.id,
            status="pending",
            total_tagihan=total_tagihan,
            grand_total=total_tagihan,
            catatan=payload.catatan
        )
        db.add(order)
        db.flush()  # Get order.id

        # Process Items and Reduce Stock
        for item_data in items_to_create:
            product = item_data["product"]
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                qty=item_data["qty"],
                harga_satuan=item_data["harga_satuan"],
                subtotal=item_data["subtotal"],
                estimasi_expired=item_data["estimasi_expired"],
            )
            db.add(order_item)
            # Reduce stock WITHOUT commit yet
            inventory_service.reduce_stock(
                db, str(product.id), item_data["qty"], "order", f"Order {order.id}", commit=False
            )

        db.commit()
        db.refresh(order)

        # Send notifications after successful commit
        try:
            from app.models.user import User
            sales_users = db.query(User).filter(User.role == "sales").all()
            for sales in sales_users:
                await notification_service.send_notification(
                    db, str(sales.id),
                    "Pesanan Baru 🛒",
                    f"Pesanan baru dari {current_user.nama_toko or current_user.username}",
                )
        except Exception as e:
            # Don't fail the whole order if notification fails
            import logging
            logging.getLogger(__name__).error(f"Failed to send sales notification: {e}")

        return _build_order_response(order)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        import logging
        logging.getLogger(__name__).error(f"Order creation failed: {e}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan saat memproses pesanan")


@router.get("", response_model=List[OrderResponse])
def list_all_orders(
    db: Session = Depends(get_db),
    current_user=Depends(require_sales),
):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return [_build_order_response(o, include_items=False) for o in orders]


@router.get("/my", response_model=List[OrderResponse])
def my_orders(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    orders = db.query(Order).filter(
        Order.buyer_id == current_user.id
    ).order_by(Order.created_at.desc()).all()
    return [_build_order_response(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    if current_user.role == "buyer" and str(order.buyer_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    return _build_order_response(order)


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_sales),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    order.status = payload.status
    db.commit()
    # Notifikasi buyer
    await notification_service.send_notification(
        db, str(order.buyer_id),
        "Status Pesanan Diperbarui",
        f"Pesanan Anda sekarang berstatus: {payload.status}",
    )
    return {"message": f"Status diperbarui ke {payload.status}"}


@router.post("/{order_id}/return")
def add_return(
    order_id: str,
    payload: ReturnItemRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_sales),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    item = db.query(OrderItem).filter(
        OrderItem.id == payload.item_id,
        OrderItem.order_id == order_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item tidak ditemukan di order ini")
    if payload.qty_retur > item.qty:
        raise HTTPException(status_code=400, detail="Qty retur melebihi qty pesanan")

    item.qty_retur = payload.qty_retur
    item.alasan_retur = payload.alasan_retur
    item.status_retur = payload.status_retur
    db.commit()

    order_service.recalculate_order(db, order)
    return {"message": "Retur berhasil dicatat", "grand_total": float(order.grand_total)}


@router.get("/{order_id}/invoice-summary")
def invoice_summary(
    order_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return order_service.get_invoice_summary(db, order_id)
