from pydantic import BaseModel, field_validator
from typing import Optional
from decimal import Decimal


class ProductCreate(BaseModel):
    nama_produk: str
    kategori: str
    harga: Decimal
    stok_ball: int = 0
    deskripsi: Optional[str] = None
    is_active: bool = True

    @field_validator("harga")
    @classmethod
    def harga_positive(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Harga tidak boleh negatif")
        return v

    @field_validator("stok_ball")
    @classmethod
    def stok_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Stok tidak boleh negatif")
        return v


class ProductUpdate(BaseModel):
    nama_produk: Optional[str] = None
    kategori: Optional[str] = None
    harga: Optional[Decimal] = None
    stok_ball: Optional[int] = None
    deskripsi: Optional[str] = None
    is_active: Optional[bool] = None


class StockUpdate(BaseModel):
    qty: int
    note: Optional[str] = None

    @field_validator("qty")
    @classmethod
    def qty_not_zero(cls, v: int) -> int:
        if v == 0:
            raise ValueError("Qty tidak boleh 0")
        return v


class ProductResponse(BaseModel):
    id: str
    nama_produk: str
    kategori: str
    harga: Decimal
    stok_ball: int
    deskripsi: Optional[str] = None
    is_active: bool
    status_stok: str

    model_config = {"from_attributes": True}
