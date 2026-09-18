import uuid

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class User(UserBase):
    hashed_password: str


class UserRead(UserBase):
    id: uuid.UUID
