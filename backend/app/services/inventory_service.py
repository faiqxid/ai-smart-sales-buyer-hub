import logging
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.inventory_log import InventoryLog

logger = logging.getLogger(__name__)


def add_stock(db: Session, product_id: str, qty: int, note: str = None, commit: bool = True) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError("Produk tidak ditemukan")
    product.stok_ball += qty
    log = InventoryLog(product_id=product_id, change_qty=qty, type="add", note=note)
    db.add(log)
    if commit:
        db.commit()
        db.refresh(product)
    return product


def reduce_stock(
    db: Session,
    product_id: str,
    qty: int,
    type: str = "order",
    note: str = None,
    commit: bool = True,
) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError("Produk tidak ditemukan")
    if product.stok_ball < qty:
        raise ValueError(f"Stok tidak cukup. Stok tersedia: {product.stok_ball}")
    product.stok_ball -= qty
    log = InventoryLog(product_id=product_id, change_qty=-qty, type=type, note=note)
    db.add(log)
    if commit:
        db.commit()
        db.refresh(product)
    return product


def get_low_stock_products(db: Session, threshold: int = 5) -> list:
    return db.query(Product).filter(
        Product.stok_ball <= threshold,
        Product.is_active == True
    ).all()


def get_out_of_stock_products(db: Session) -> list:
    return db.query(Product).filter(
        Product.stok_ball == 0,
        Product.is_active == True
    ).all()
