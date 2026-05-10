import uuid
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class PreOrder(Base):
    __tablename__ = "pre_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    qty_request = Column(Integer, nullable=False)
    qty_matched = Column(Integer, default=0)
    status = Column(String(50), default="pending")  # pending, matched, fulfilled, cancelled
    matched = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    buyer = relationship("User", foreign_keys=[buyer_id])
    product = relationship("Product")
