from sqlalchemy import Column, String, Boolean
from sqlalchemy.dialects.postgresql import UUID
from database.db import Base
import uuid

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # "user" or "admin"
    is_verified = Column(Boolean, nullable=True, default=False)  # NULL = pre-verification account, treated as verified
    verification_code_hash = Column(String, nullable=True)
    reset_token_hash = Column(String, nullable=True)