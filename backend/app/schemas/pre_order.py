from pydantic import BaseModel, field_validator
from typing import Optional

VALID_PREORDER_STATUSES = ["pending", "matched", "fulfilled", "cancelled"]


class PreOrderCreate(BaseModel):
    product_id: str
    qty_request: int

    @field_validator("qty_request")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Qty harus lebih dari 0")
        return v


class PreOrderStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def status_valid(cls, v: str) -> str:
        if v not in VALID_PREORDER_STATUSES:
            raise ValueError(f"Status tidak valid. Pilihan: {VALID_PREORDER_STATUSES}")
        return v


class PreOrderResponse(BaseModel):
    id: str
    buyer_id: str
    nama_toko: Optional[str] = None
    nomor_hp: Optional[str] = None
    product_id: str
    nama_produk: str
    qty_request: int
    qty_matched: int
    status: str
    matched: bool
    created_at: str

    model_config = {"from_attributes": True}
