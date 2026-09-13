import uuid

from sqlalchemy import UUID, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from quant_platform.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(1024), index=True, unique=True, nullable=False
    )
    username: Mapped[str] = mapped_column(String(1024), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(1024), nullable=False)

    transactions: Mapped[list["Transaction"]] = relationship(  # noqa: F821, UP037 # type: ignore
        "Transaction", back_populates="user", cascade="all, delete-orphan"
    )
