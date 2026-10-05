from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String(100), nullable=False)

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(20),
        default="user",
        nullable=False
    )

    # --- ADD THESE TWO LINES FOR 2FA ---
    totp_secret: Mapped[str] = mapped_column(String(32), nullable=True)
    is_2fa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # --- ADD THESE BILLING COLUMNS ---
    subscription_tier: Mapped[str] = mapped_column(String(50), default="Agentic Platform Pro")
    api_usage: Mapped[int] = mapped_column(Integer, default=1240)
    api_limit: Mapped[int] = mapped_column(Integer, default=5000)
    card_last4: Mapped[str] = mapped_column(String(4), default="4242")
    card_exp: Mapped[str] = mapped_column(String(7), default="12/2028")
    next_billing_date: Mapped[str] = mapped_column(String(50), default="November 1, 2026")

    is_email_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # --- ADD TO THE VERY BOTTOM OF user_model.py ---

class PaymentMethod(Base):
    __tablename__ = "payment_methods"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_email: Mapped[str] = mapped_column(String(100), index=True)
    brand: Mapped[str] = mapped_column(String(50)) # Visa, Mastercard, Amex, PayPal
    last4: Mapped[str] = mapped_column(String(4))
    exp_date: Mapped[str] = mapped_column(String(10))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)