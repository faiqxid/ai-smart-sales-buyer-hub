from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import require_sales, get_current_user
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, StockUpdate, ProductResponse
from app.services import inventory_service

router = APIRouter(prefix="/api/products", tags=["Products"])


def _to_response(p: Product) -> ProductResponse:
    return ProductResponse(
        id=str(p.id),
        nama_produk=p.nama_produk,
        kategori=p.kategori,
        harga=p.harga,
        stok_ball=p.stok_ball,
        deskripsi=p.deskripsi,
        is_active=p.is_active,
        status_stok="tersedia" if p.stok_ball > 0 else "habis",
    )


@router.get("", response_model=List[ProductResponse])
def list_products(
    aktif_saja: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Product)
    if aktif_saja:
        q = q.filter(Product.is_active == True)
    return [_to_response(p) for p in q.order_by(Product.nama_produk).all()]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    return _to_response(p)


@router.post("", response_model=ProductResponse, status_code=201)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_sales),
):
    p = Product(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return _to_response(p)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_sales),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return _to_response(p)


@router.delete("/{product_id}")
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_sales),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    p.is_active = False
    db.commit()
    return {"message": "Produk dinonaktifkan"}


@router.post("/{product_id}/stock", response_model=ProductResponse)
def update_stock(
    product_id: str,
    payload: StockUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_sales),
):
    try:
        if payload.qty > 0:
            p = inventory_service.add_stock(db, product_id, payload.qty, payload.note)
        else:
            p = inventory_service.reduce_stock(db, product_id, abs(payload.qty), "adjustment", payload.note)
        return _to_response(p)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
