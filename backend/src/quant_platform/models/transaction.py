import uuid
from datetime import UTC, datetime

from sqlalchemy import UUID, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from quant_platform.models.base import Base
from quant_platform.models.user import User


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid7
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    ticker: Mapped[str] = mapped_column(String(20), index=True)
    shares: Mapped[float] = mapped_column(Float)
    price_per_share: Mapped[float] = mapped_column(Float)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.now(UTC)
    )

    user: Mapped[User] = relationship("User", back_populates="transactions")
