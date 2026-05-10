import uuid
import sqlalchemy
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="buyer")  # sales | buyer
    nama_lengkap = Column(String(200), nullable=True)
    nama_toko = Column(String(200), nullable=True)
    nomor_hp = Column(String(20), nullable=False)
    alamat = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(sqlalchemy.Boolean, default=True, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
