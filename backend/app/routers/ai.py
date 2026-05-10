from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import date, datetime, time, timedelta

from app.core.database import get_db
from app.core.security import get_current_user, require_sales
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.pre_order import PreOrder
from app.services import ai_service, inventory_service, order_service

router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.get("/daily-briefing")
async def daily_briefing(
    db: Session = Depends(get_db),
    current_user=Depends(require_sales),
):
    today = date.today()
    soon = today + timedelta(days=3)

    # Item mendekati expired
    expiring = db.query(OrderItem).filter(
        OrderItem.estimasi_expired <= soon,
        OrderItem.estimasi_expired >= today,
        OrderItem.status_retur != "sudah_ditarik",
    ).all()
    expiring_data = [
        {
            "order_id": str(i.order_id),
            "produk": i.product.nama_produk if i.product else "-",
            "expired": str(i.estimasi_expired),
        }
        for i in expiring
    ]

    # Retur belum ditarik
    pending_returns = db.query(OrderItem).filter(
        OrderItem.status_retur == "perlu_ditarik"
    ).all()
    returns_data = [
        {
            "order_id": str(i.order_id),
            "produk": i.product.nama_produk if i.product else "-",
            "qty_retur": i.qty_retur,
        }
        for i in pending_returns
    ]

    # Produk stok rendah/kosong
    low_stock = inventory_service.get_low_stock_products(db, threshold=5)
    low_stock_data = [{"nama": p.nama_produk, "stok": p.stok_ball} for p in low_stock]

    # Pre-order pending
    pending_preorders = db.query(PreOrder).filter(PreOrder.status == "pending").count()

    # ===== Keuangan & performa =====
    start_today = datetime.combine(today, time.min)
    end_today = datetime.combine(today, time.max)
    week_start = datetime.combine(today - timedelta(days=6), time.min)

    omzet_hari_ini = db.query(func.coalesce(func.sum(Order.grand_total), 0)).filter(
        Order.created_at >= start_today,
        Order.created_at <= end_today,
    ).scalar() or 0

    omzet_7_hari = db.query(func.coalesce(func.sum(Order.grand_total), 0)).filter(
        Order.created_at >= week_start,
        Order.created_at <= end_today,
    ).scalar() or 0

    total_order_hari_ini = db.query(Order).filter(
        Order.created_at >= start_today,
        Order.created_at <= end_today,
    ).count()

    total_order_7_hari = db.query(Order).filter(
        Order.created_at >= week_start,
        Order.created_at <= end_today,
    ).count()

    # Estimasi profit sederhana (asumsi margin default 20%)
    margin_asumsi = 0.20
    profit_estimasi_hari_ini = float(omzet_hari_ini) * margin_asumsi
    profit_estimasi_7_hari = float(omzet_7_hari) * margin_asumsi

    # Top produk 7 hari terakhir berdasarkan qty
    top_products_rows = (
        db.query(
            Product.nama_produk,
            func.coalesce(func.sum(OrderItem.qty), 0).label("qty_total"),
            func.coalesce(func.sum(OrderItem.subtotal), 0).label("omzet_total"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.created_at >= week_start, Order.created_at <= end_today)
        .group_by(Product.nama_produk)
        .order_by(func.coalesce(func.sum(OrderItem.qty), 0).desc())
        .limit(5)
        .all()
    )

    top_products = [
        {
            "nama": r[0],
            "qty_total": int(r[1] or 0),
            "omzet_total": float(r[2] or 0),
        }
        for r in top_products_rows
    ]

    data = {
        "expiring_items": expiring_data,
        "pending_returns": returns_data,
        "low_stock": low_stock_data,
        "pending_preorders": pending_preorders,
        "finance": {
            "omzet_hari_ini": float(omzet_hari_ini or 0),
            "omzet_7_hari": float(omzet_7_hari or 0),
            "profit_estimasi_hari_ini": profit_estimasi_hari_ini,
            "profit_estimasi_7_hari": profit_estimasi_7_hari,
            "total_order_hari_ini": total_order_hari_ini,
            "total_order_7_hari": total_order_7_hari,
            "margin_asumsi": margin_asumsi,
        },
        "top_products_7_hari": top_products,
    }

    briefing = await ai_service.generate_daily_briefing(data, db=db)
    return {"briefing": briefing, "data": data}


@router.post("/preorder-matcher/{product_id}")
async def preorder_matcher(
    product_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_sales),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")

    pending_pos = db.query(PreOrder).filter(
        PreOrder.product_id == product_id,
        PreOrder.status == "pending",
    ).order_by(PreOrder.created_at.asc()).all()

    if not pending_pos:
        return {"message": "Tidak ada pre-order pending untuk produk ini", "alokasi": []}

    preorders_data = [
        {
            "id": str(po.id),
            "buyer_id": str(po.buyer_id),
            "nama_toko": po.buyer.nama_toko if po.buyer else "-",
            "qty_request": po.qty_request,
            "qty_matched": po.qty_matched,
        }
        for po in pending_pos
    ]

    product_data = {
        "id": str(product.id),
        "nama_produk": product.nama_produk,
        "stok_ball": product.stok_ball,
    }

    result = await ai_service.generate_preorder_allocation(
        product_data, preorders_data, product.stok_ball, db=db
    )

    # Update pre_order records berdasarkan alokasi
    for alloc in result.get("alokasi", []):
        po = db.query(PreOrder).filter(PreOrder.id == alloc["pre_order_id"]).first()
        if po:
            po.qty_matched += alloc["qty_allocated"]
            if po.qty_matched >= po.qty_request:
                po.status = "matched"
                po.matched = True
    db.commit()  # Commit once after all allocations

    return result


@router.get("/invoice-message/{order_id}")
async def invoice_message(
    order_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_sales),
):
    # Check order existence FIRST before generating summary
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    summary = order_service.get_invoice_summary(db, order_id)

    message = await ai_service.generate_invoice_message(
        summary, summary["buyer"], summary["items"], db=db
    )
    wa_link = None
    if summary["buyer"]["nomor_hp"]:
        from app.utils.phone import to_wa_link
        wa_link = to_wa_link(summary["buyer"]["nomor_hp"])

    return {
        "message": message,
        "wa_link": wa_link,
        "summary": summary,
    }
