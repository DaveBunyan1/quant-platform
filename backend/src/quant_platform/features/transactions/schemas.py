import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TransactionBase(BaseModel):
    ticker: str = Field(min_length=1)
    shares: float = Field(gt=0.0)
    price_per_share: float = Field(gt=0.0)
    transaction_at: datetime


class TransactionCreate(TransactionBase):
    pass


class TransactionRead(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
