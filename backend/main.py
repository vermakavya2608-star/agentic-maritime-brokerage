from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import hashlib
import secrets
import smtplib
import os
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from dotenv import load_dotenv

from app.models import (
    RouteRequest,
    QuotationRequest,
    OTPRequest,
    OTPVerify,
    ResetPasswordRequest
)
from app.services.quotation_service import QuotationService
from app.agents.route_agent import RouteAgent

from app.database import Base, engine, get_db
from app.user_model import User
from app.otp_model import OTPCode
from app.password_reset_model import PasswordResetOTP
from app.auth_utils import hash_password
from app.auth_routes import router as auth_router

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Agentic Maritime Brokerage Platform",
    description="AI-powered maritime freight quotation platform",
    version="1.0.0"
)

app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

route_agent = RouteAgent()
quotation_service = QuotationService()

@app.get("/")
def home():
    return {
        "message": "Agentic Maritime Brokerage API is running",
        "project": "Maritime Freight Quotation Platform",
        "milestone": "Milestone 1 - Route Intelligence"
    }


@app.post("/routes")
def analyze_route(request: RouteRequest):

    result = route_agent.analyze_route(
        request.origin,
        request.destination,
        request.cargo_type,
        request.containers
    )

    return result

@app.post("/api/quotations/generate")
def generate_quotation(request: QuotationRequest):

    result = quotation_service.generate_quotation(
        origin=request.origin,
        destination=request.destination,
        cargo_type=request.cargo_type,
        containers=request.containers
    )

    return result


# --- OTP ENDPOINTS ---

OTP_EXPIRY_MINUTES = 5
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60


def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


@app.post("/api/auth/send-otp")
def send_otp(
    request: OTPRequest,
    db=Depends(get_db)
):
    email = request.email.lower().strip()

    # Check for recent OTP
    recent_otp = (
        db.query(OTPCode)
        .filter(OTPCode.email == email)
        .order_by(OTPCode.created_at.desc())
        .first()
    )

    if recent_otp:
        seconds_since_last_send = (
            datetime.utcnow() - recent_otp.last_sent_at
        ).total_seconds()

        if seconds_since_last_send < OTP_RESEND_COOLDOWN_SECONDS:
            remaining = int(
                OTP_RESEND_COOLDOWN_SECONDS - seconds_since_last_send
            )

            raise HTTPException(
                status_code=429,
                detail=f"Please wait {remaining} seconds before requesting another OTP."
            )

    # Generate secure 6-digit OTP
    otp_code = f"{secrets.randbelow(1000000):06d}"

    # Hash OTP before storing it
    otp_hash = hash_otp(otp_code)

    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    new_otp = OTPCode(
        email=email,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempts=0,
        created_at=now,
        last_sent_at=now
    )

    db.add(new_otp)
    db.commit()

    sender_email = os.getenv("SMTP_EMAIL")
    app_password = os.getenv("SMTP_APP_PASSWORD")

    if not sender_email or not app_password:
        raise HTTPException(
            status_code=500,
            detail="Email service is not configured."
        )

    try:
        msg = MIMEText(
            f"Your MaritimeAI login verification code is: {otp_code}\n\n"
            f"This code will expire in {OTP_EXPIRY_MINUTES} minutes."
        )

        msg["Subject"] = "MaritimeAI Security: Login OTP"
        msg["From"] = f"MaritimeAI <{sender_email}>"
        msg["To"] = email

        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(sender_email, app_password)
        server.send_message(msg)
        server.quit()

        print(f"Success: OTP sent to {email}")

        return {
            "status": "success",
            "message": "OTP sent via email."
        }

    except Exception as e:
        print(f"Failed to send email to {email}: {e}")

        # Remove OTP if email failed
        db.delete(new_otp)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Failed to send OTP email."
        )


@app.post("/api/auth/verify-otp")
def verify_otp(
    request: OTPVerify,
    db=Depends(get_db)
):
    email = request.email.lower().strip()

    otp_record = (
        db.query(OTPCode)
        .filter(OTPCode.email == email)
        .order_by(OTPCode.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP."
        )

    # Check expiry
    if datetime.utcnow() > otp_record.expires_at:
        db.delete(otp_record)
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="OTP has expired. Please request a new one."
        )

    # Check maximum attempts
    if otp_record.attempts >= OTP_MAX_ATTEMPTS:
        db.delete(otp_record)
        db.commit()

        raise HTTPException(
            status_code=429,
            detail="Too many incorrect attempts. Please request a new OTP."
        )

    # Count this verification attempt
    otp_record.attempts += 1
    db.commit()

    # Compare hashed OTP
    if hash_otp(request.otp) != otp_record.otp_hash:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP."
        )

    # Mark the user's email as verified
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )
    if user:
        user.is_email_verified = True
        db.commit()
    # OTP successfully verified — one-time use
    db.delete(otp_record)
    db.commit()
    return {
        "status": "success",
        "message": "OTP verified successfully."
    }

@app.post("/api/auth/request-password-reset")
def request_password_reset(
    request: OTPRequest,
    db=Depends(get_db)
):
    email = request.email.lower().strip()

    # Find the account
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # Always return the same response so we don't reveal
    # whether an email is registered.
    if not user:
        return {
            "status": "success",
            "message": "If an account exists for this email, a reset OTP has been sent."
        }

    # Check resend cooldown
    recent_otp = (
        db.query(PasswordResetOTP)
        .filter(PasswordResetOTP.email == email)
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )

    if recent_otp:
        seconds_since_last_send = (
            datetime.utcnow() - recent_otp.last_sent_at
        ).total_seconds()

        if seconds_since_last_send < OTP_RESEND_COOLDOWN_SECONDS:
            remaining = int(
                OTP_RESEND_COOLDOWN_SECONDS - seconds_since_last_send
            )

            raise HTTPException(
                status_code=429,
                detail=f"Please wait {remaining} seconds before requesting another OTP."
            )

    # Generate a secure 6-digit OTP
    otp_code = f"{secrets.randbelow(1000000):06d}"
    otp_hash = hash_otp(otp_code)

    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    reset_otp = PasswordResetOTP(
        email=email,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempts=0,
        created_at=now,
        last_sent_at=now
    )

    db.add(reset_otp)
    db.commit()

    sender_email = os.getenv("SMTP_EMAIL")
    app_password = os.getenv("SMTP_APP_PASSWORD")

    if not sender_email or not app_password:
        db.delete(reset_otp)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Email service is not configured."
        )

    try:
        msg = MIMEText(
            f"Your MaritimeAI password reset code is: {otp_code}\n\n"
            f"This code will expire in {OTP_EXPIRY_MINUTES} minutes.\n\n"
            f"If you did not request a password reset, you can safely ignore this email."
        )

        msg["Subject"] = "MaritimeAI Security: Password Reset OTP"
        msg["From"] = f"MaritimeAI <{sender_email}>"
        msg["To"] = email

        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(sender_email, app_password)
        server.send_message(msg)
        server.quit()

        print(f"Success: Password reset OTP sent to {email}")

        return {
            "status": "success",
            "message": "If an account exists for this email, a reset OTP has been sent."
        }

    except Exception as e:
        print(f"Failed to send password reset email to {email}: {e}")

        db.delete(reset_otp)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Failed to send password reset email."
        )

@app.post("/api/auth/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    otp: str,
    db=Depends(get_db)
):
    email = request.email.lower().strip()

    # Find the latest reset OTP
    otp_record = (
        db.query(PasswordResetOTP)
        .filter(PasswordResetOTP.email == email)
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset OTP."
        )

    # Check expiry
    if datetime.utcnow() > otp_record.expires_at:
        db.delete(otp_record)
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Password reset OTP has expired. Please request a new one."
        )

    # Check maximum attempts
    if otp_record.attempts >= OTP_MAX_ATTEMPTS:
        db.delete(otp_record)
        db.commit()

        raise HTTPException(
            status_code=429,
            detail="Too many incorrect attempts. Please request a new OTP."
        )

    # Validate OTP
    otp_record.attempts += 1
    db.commit()

    if hash_otp(otp) != otp_record.otp_hash:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset OTP."
        )

    # Password validation
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long."
        )

    if not any(char.isupper() for char in request.new_password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter."
        )

    if not any(char.islower() for char in request.new_password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one lowercase letter."
        )

    if not any(char.isdigit() for char in request.new_password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number."
        )

    if not any(not char.isalnum() for char in request.new_password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character."
        )

    # Find the user
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        db.delete(otp_record)
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Unable to reset password."
        )

    # Update password using the existing secure hashing function
    user.password_hash = hash_password(request.new_password)

    db.commit()

    # OTP can only be used once
    db.delete(otp_record)
    db.commit()

    return {
        "status": "success",
        "message": "Password reset successfully. You can now log in with your new password."
    }