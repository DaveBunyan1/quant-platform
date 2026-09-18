import uuid
from datetime import datetime

from sqlalchemy import UUID, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from quant_platform.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid7
    )
    email: Mapped[str] = mapped_column(
        String(1024), index=True, unique=True, nullable=False
    )
    username: Mapped[str] = mapped_column(String(1024), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(1024), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.now
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.now,
        onupdate=datetime.now,
    )

    transactions: Mapped[list["Transaction"]] = relationship(  # noqa: F821, UP037 # type: ignore
        "Transaction", back_populates="user", cascade="all, delete-orphan"
    )
