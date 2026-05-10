import uuid
from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nama_produk = Column(String(200), nullable=False)
    kategori = Column(String(100), nullable=False)
    harga = Column(Numeric(12, 2), nullable=False)
    stok_ball = Column(Integer, nullable=False, default=0)
    deskripsi = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
