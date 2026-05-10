from pydantic import BaseModel, field_validator
from typing import Optional, List
from decimal import Decimal
from datetime import date

VALID_ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "completed", "cancelled"]
VALID_RETUR_STATUSES = ["tidak_retur", "perlu_ditarik", "sudah_ditarik", "rusak", "expired"]


class OrderItemCreate(BaseModel):
    product_id: str
    qty: int
    estimasi_expired: Optional[date] = None

    @field_validator("qty")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Qty harus lebih dari 0")
        return v


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    catatan: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def status_valid(cls, v: str) -> str:
        if v not in VALID_ORDER_STATUSES:
            raise ValueError(f"Status tidak valid. Pilihan: {VALID_ORDER_STATUSES}")
        return v


class ReturnItemRequest(BaseModel):
    item_id: str
    qty_retur: int
    alasan_retur: str
    status_retur: str

    @field_validator("status_retur")
    @classmethod
    def status_retur_valid(cls, v: str) -> str:
        if v not in VALID_RETUR_STATUSES:
            raise ValueError(f"Status retur tidak valid. Pilihan: {VALID_RETUR_STATUSES}")
        return v

    @field_validator("qty_retur")
    @classmethod
    def qty_retur_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Qty retur harus lebih dari 0")
        return v


class OrderItemResponse(BaseModel):
    id: str
    product_id: str
    nama_produk: str
    qty: int
    harga_satuan: Decimal
    subtotal: Decimal
    estimasi_expired: Optional[date] = None
    status_retur: str
    qty_retur: int
    alasan_retur: Optional[str] = None
    potongan_retur: Decimal

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: str
    buyer_id: str
    nama_toko: Optional[str] = None
    nomor_hp: Optional[str] = None
    status: str
    total_tagihan: Decimal
    total_potongan_retur: Decimal
    grand_total: Decimal
    catatan: Optional[str] = None
    items: Optional[List[OrderItemResponse]] = None
    created_at: str

    model_config = {"from_attributes": True}
