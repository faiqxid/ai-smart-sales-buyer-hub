import uuid
from sqlalchemy import (
    Column, String, Numeric, DateTime, Date, Integer, Text, ForeignKey, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    total_tagihan = Column(Numeric(15, 2), default=0)
    total_potongan_retur = Column(Numeric(15, 2), default=0)
    grand_total = Column(Numeric(15, 2), default=0)
    catatan = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    buyer = relationship("User", foreign_keys=[buyer_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    qty = Column(Integer, nullable=False)
    harga_satuan = Column(Numeric(12, 2), nullable=False)
    subtotal = Column(Numeric(15, 2), nullable=False)
    estimasi_expired = Column(Date, nullable=True)
    status_retur = Column(String(50), default="tidak_retur")
    qty_retur = Column(Integer, default=0)
    alasan_retur = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
