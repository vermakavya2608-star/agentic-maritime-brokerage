import os
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

# Add get_current_user_email and create_access_token to your existing auth_utils import
from app.auth_utils import hash_password, verify_password, create_access_token, get_current_user_email
from app.database import get_db
from app.user_model import User

from app.user_model import PaymentMethod

import pyotp

import re
from datetime import datetime

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


@router.post("/signup")
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    # Check whether the email is already registered
    existing_user = (
        db.query(User)
        .filter(User.email == request.email.lower())
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    # Password validation
    if len(request.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long."
        )

    if not any(char.isupper() for char in request.password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter."
        )

    if not any(char.islower() for char in request.password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one lowercase letter."
        )

    if not any(char.isdigit() for char in request.password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number."
        )

    if not any(not char.isalnum() for char in request.password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character."
        )

    # Create the user with a secure password hash
    new_user = User(
        name=request.name.strip(),
        email=request.email.lower(),
        password_hash=hash_password(request.password),
        role="user",
        is_email_verified=False,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "status": "success",
        "message": "Account created successfully.",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role
        }
    }

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(User.email == request.email.lower())
        .first()
    )

    # Don't reveal whether the email exists
    if not user or not verify_password(
        request.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )
    # if not user.is_email_verified:
    #     raise HTTPException(
    #         status_code=403,
    #         detail="Please verify your email before logging in."
        # )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="This account is inactive."
        )

    # Generate the JWT
    access_token = create_access_token(data={"sub": user.email})

    # Inside the login() function, update the return statement:
    return {
        "status": "success",
        "message": "Login successful.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_email_verified": user.is_email_verified,
            # ADD THIS LINE:
            "is_2fa_enabled": getattr(user, "is_2fa_enabled", False)
        }
    }

# ... (Existing auth_routes.py code) ...

# ============================================================
# REAL-WORLD 2FA (AUTHENTICATOR APP) ENDPOINTS
# ============================================================

class Generate2FARequest(BaseModel):
    email: EmailStr

@router.post("/2fa/generate")
def generate_2fa(request: Generate2FARequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    # Generate a secure 32-character base32 secret
    secret = pyotp.random_base32()
    user.totp_secret = secret
    db.commit()

    # Create the secure provisioning URI for the QR code
    uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=user.email, 
        issuer_name="MaritimeAI"
    )
    
    return {"status": "success", "secret": secret, "uri": uri}


class Verify2FARequest(BaseModel):
    email: EmailStr
    token: str

@router.post("/2fa/verify")
def verify_2fa(request: Verify2FARequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated.")

    totp = pyotp.TOTP(user.totp_secret)
    clean_token = str(request.token).strip().replace(" ", "")
    
    # --- DEBUG LOGS FOR YOUR FASTAPI TERMINAL ---
    print("\n=== 2FA VERIFICATION ===")
    print(f"Secret Key: {user.totp_secret}")
    print(f"Expected Current Code: {totp.now()}")
    print(f"Code Entered by User:  {clean_token}")
    print("========================\n")
    
    # valid_window=3 gives you a +/- 90 second buffer for PC/Phone clock mismatch
    if totp.verify(clean_token, valid_window=3):
        user.is_2fa_enabled = True
        db.commit()
        return {"status": "success", "message": "2FA successfully enabled."}
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code. Check PC time sync.")


@router.post("/2fa/disable")
def disable_2fa(request: Generate2FARequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if user:
        user.is_2fa_enabled = False
        user.totp_secret = None
        db.commit()
    return {"status": "success", "message": "2FA has been disabled."}

# ============================================================
# ENTERPRISE BILLING & PAYMENT METHODS
# ============================================================

@router.get("/billing")
def get_billing_info(
    db: Session = Depends(get_db), 
    current_email: str = Depends(get_current_user_email)
):
    user = db.query(User).filter(User.email == current_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    methods = db.query(PaymentMethod).filter(PaymentMethod.user_email == current_email).all()

    return {
        "tier": user.subscription_tier,
        "api_usage": user.api_usage,
        "api_limit": user.api_limit,
        "next_billing_date": user.next_billing_date,
        "payment_methods": [
            {"id": m.id, "brand": m.brand, "last4": m.last4, "exp_date": m.exp_date, "is_primary": m.is_primary} 
            for m in methods
        ]
    }

class AddPaymentMethodRequest(BaseModel):
    
    brand: str
    last4: str
    exp_date: str
    is_primary: bool
    payment_token: str | None = None
    upi_id: str | None = None

@router.post("/billing/methods/add")
def add_payment_method(
    request: AddPaymentMethodRequest, 
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email)
):
    user = db.query(User).filter(User.email == current_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    brand = request.brand.strip()
    last4 = request.last4.strip()
    exp_date = request.exp_date.strip()

    if brand in ["Visa", "Mastercard", "American Express"]:
        if len(last4) != 4 or not last4.isdigit():
            raise HTTPException(status_code=400, detail="Card identifier must be exactly 4 digits.")

        exp_match = re.match(r"^(0[1-9]|1[0-2])\/?(20[2-9][0-9]|[2-9][0-9])$", exp_date)
        if not exp_match:
            raise HTTPException(status_code=400, detail="Expiration date must follow MM/YY or MM/YYYY format.")

        month = int(exp_match.group(1))
        raw_year = exp_match.group(2)
        year = int(raw_year) if len(raw_year) == 4 else int(f"20{raw_year}")

        now = datetime.utcnow()
        if year < now.year or (year == now.year and month < now.month):
            raise HTTPException(status_code=400, detail="Card expiration date has expired.")

    elif brand == "Bank Transfer":
        if len(last4) != 4 or not last4.isdigit():
            raise HTTPException(status_code=400, detail="Bank account identifier must be exactly 4 digits.")
    elif brand in ["Apple Pay", "Google Pay", "NFC Tap"]:
        if not request.payment_token or len(request.payment_token) < 20:
             raise HTTPException(status_code=400, detail="Missing or invalid cryptographic payment token.")
        last4 = "NFC"
        exp_date = "Token"
        
    elif brand == "UPI" or brand == "UPI QR":
        if not request.upi_id:
            raise HTTPException(status_code=400, detail="UPI ID is required for mandate generation.")
            
        upi_match = re.match(r"^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$", request.upi_id)
        if not upi_match:
            raise HTTPException(status_code=400, detail="Invalid UPI ID format.")
            
        last4 = request.upi_id[-4:]
        exp_date = "AutoPay"
        
    elif brand == "PayPal":
        if not last4.isalnum():
            raise HTTPException(status_code=400, detail="Invalid account token.")
    else:
        raise HTTPException(status_code=400, detail="Unsupported payment method.")

    duplicate_method = db.query(PaymentMethod).filter(
        PaymentMethod.user_email == current_email,
        PaymentMethod.brand == brand,
        PaymentMethod.last4 == last4[:4]
    ).first()
    if duplicate_method:
        raise HTTPException(status_code=409, detail="This payment method is already registered.")

    existing_count = db.query(PaymentMethod).filter(PaymentMethod.user_email == current_email).count()
    make_primary = request.is_primary or existing_count == 0

    if make_primary:
        db.query(PaymentMethod).filter(PaymentMethod.user_email == current_email).update({"is_primary": False})

    new_method = PaymentMethod(
        user_email=current_email,
        brand=brand,
        last4=last4[:4],
        exp_date=exp_date[:10],
        is_primary=make_primary
    )
    db.add(new_method)
    db.commit()
    return {"status": "success"}



# Notice we added `email: str` so the backend knows who to assign a new default to!
@router.delete("/billing/methods/{method_id}")
def delete_payment_method(
    method_id: int, 
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email)
):
    method_to_delete = db.query(PaymentMethod).filter(
        PaymentMethod.id == method_id,
        PaymentMethod.user_email == current_email
    ).first()

    if not method_to_delete:
        raise HTTPException(status_code=404, detail="Payment method not found.")

    was_primary = method_to_delete.is_primary
    db.delete(method_to_delete)
    db.commit()

    if was_primary:
        next_method = db.query(PaymentMethod).filter(PaymentMethod.user_email == current_email).first()
        if next_method:
            next_method.is_primary = True
            db.commit()

    return {"status": "success"}

@router.put("/billing/methods/{method_id}/primary")
def make_primary_method(
    method_id: int, 
    db: Session = Depends(get_db),
    current_email: str = Depends(get_current_user_email)
):
    target_method = db.query(PaymentMethod).filter(
        PaymentMethod.id == method_id,
        PaymentMethod.user_email == current_email
    ).first()

    if not target_method:
        raise HTTPException(status_code=404, detail="Payment method not found.")

    db.query(PaymentMethod).filter(PaymentMethod.user_email == current_email).update({"is_primary": False})
    target_method.is_primary = True
    db.commit()
    return {"status": "success"}