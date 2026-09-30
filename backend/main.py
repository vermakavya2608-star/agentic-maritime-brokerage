from app.agents.llm_agent import LLMAgent

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

import hashlib
import secrets
import smtplib
import socket
import os

from datetime import datetime, timedelta
from email.mime.text import MIMEText
from pydantic import BaseModel
from typing import Optional
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


# ============================================================
# ENVIRONMENT / DATABASE
# ============================================================

load_dotenv()

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Agentic Maritime Brokerage Platform",
    description="AI-powered maritime freight quotation platform",
    version="1.0.0"
)

app.include_router(auth_router)


# ============================================================
# CORS
# ============================================================

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


# ============================================================
# AGENTS / SERVICES
# ============================================================

route_agent = RouteAgent()
llm_agent = LLMAgent()
quotation_service = QuotationService()


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Agentic Maritime Brokerage API is running",
        "project": "Maritime Freight Quotation Platform",
        "milestone": "Milestone 1 - Route Intelligence"
    }


# ============================================================
# SYSTEM HEALTH
# ============================================================

@app.get("/api/health")
def check_system_health():

    # 1. Check local agents
    # Route & Pricing agents require their databases to be active

    base_dir = os.path.dirname(os.path.abspath(__file__))

    routes_path = os.path.join(
        base_dir,
        "app",
        "data",
        "routes.csv"
    )

    pricing_path = os.path.join(
        base_dir,
        "app",
        "data",
        "pricing.csv"
    )

    route_status = (
        "online"
        if os.path.exists(routes_path)
        else "offline"
    )

    pricing_status = (
        "online"
        if os.path.exists(pricing_path)
        else "offline"
    )

    # 2. Check Weather agent
    # Requires external Open-Meteo connectivity

    weather_status = "offline"

    try:
        socket.setdefaulttimeout(1.0)

        socket.socket(
            socket.AF_INET,
            socket.SOCK_STREAM
        ).connect(
            ("api.open-meteo.com", 80)
        )

        weather_status = "online"

    except Exception:
        weather_status = "offline"

    return {
        "status": "success",
        "agents": {
            "route": route_status,
            "weather": weather_status,
            "pricing": pricing_status
        }
    }


# ============================================================
# ROUTE ANALYSIS
# ============================================================

@app.post("/routes")
def analyze_route(request: RouteRequest):

    result = route_agent.analyze_route(
        request.origin,
        request.destination,
        request.cargo_type,
        request.containers
    )

    return result


# ============================================================
# QUOTATION GENERATION
# ============================================================

@app.post("/api/quotations/generate")
def generate_quotation(request: QuotationRequest):

    result = quotation_service.generate_quotation(
        origin=request.origin,
        destination=request.destination,
        cargo_type=request.cargo_type,
        containers=request.containers
    )

    return result


# ============================================================
# LLM ROUTE INSIGHT
# ============================================================

class InsightRequest(BaseModel):
    origin: str
    destination: str
    cargo_type: str
    route_id: Optional[str] = None
    transit_days: Optional[int] = None


@app.post("/api/llm/insight")
def generate_llm_insight(request: InsightRequest):

    insight = llm_agent.get_route_insight(
        origin=request.origin,
        destination=request.destination,
        cargo_type=request.cargo_type,
        route_id=request.route_id,
        transit_days=request.transit_days
    )

    return {
        "status": "success",
        "insight": insight
    }


# ============================================================
# OTP CONFIGURATION
# ============================================================

OTP_EXPIRY_MINUTES = 5
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60


# ============================================================
# OTP HASHING
# ============================================================

def hash_otp(otp: str) -> str:
    return hashlib.sha256(
        otp.encode()
    ).hexdigest()

import secrets # Ensure this is imported at the top of main.py if not already

def send_email_background(sender_email: str, app_password: str, recipient_email: str, otp_code: str):
    try:
        # Generate a random node ID to make the email look like a genuine terminal transmission
        node_id = secrets.token_hex(4).upper()
        
        # Hyper-Modern Dark Mode HTML Template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 40px 20px; background-color: #020617; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-top: 4px solid #38bdf8; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
                
                <!-- TOP SECURITY WARNING -->
                <tr>
                    <td style="padding: 12px 20px; background-color: #071325; border-bottom: 1px solid #1e293b; text-align: center;">
                        <span style="font-family: 'Courier New', monospace; font-size: 11px; color: #ef4444; letter-spacing: 2px; font-weight: bold;">
                            ⚠️ SECURE ENCRYPTED TRANSMISSION
                        </span>
                    </td>
                </tr>

                <!-- 3D HOLOGRAM HEADER -->
                <tr>
                    <td style="padding: 40px 30px 20px; text-align: center;">
                        <!-- Reliable 3D Hologram Globe GIF -->
                        <img src="https://media.tenor.com/0P1LzG_0G3kAAAAC/globe-earth.gif" 
                             alt="Maritime AI Network" 
                             style="width: 120px; height: 120px; margin-bottom: 24px; filter: drop-shadow(0 0 15px rgba(56, 189, 248, 0.4));" />
                        
                        <h2 style="margin: 0 0 8px; font-size: 28px; color: #ffffff; letter-spacing: -0.5px;">
                            Maritime<span style="color: #38bdf8;">AI</span>
                        </h2>
                        <p style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 3px; font-weight: 700;">
                            Brokerage Intelligence
                        </p>
                    </td>
                </tr>

                <!-- INSTRUCTIONS & OTP -->
                <tr>
                    <td style="padding: 10px 30px 30px; text-align: center;">
                        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 30px;">
                            System access requested. To proceed with your authentication into the global routing network, enter the decryption token below.
                        </p>

                        <!-- GLOWING NEON OTP TERMINAL BOX -->
                        <div style="background-color: #020617; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px; padding: 25px 20px; margin: 0 auto; max-width: 320px; box-shadow: inset 0 0 20px rgba(56, 189, 248, 0.1);">
                            <p style="margin: 0 0 12px; color: #38bdf8; font-family: 'Courier New', monospace; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
                                Authorization Token
                            </p>
                            <div style="font-family: 'Courier New', monospace; font-size: 46px; color: #ffffff; letter-spacing: 12px; font-weight: 900; margin-left: 12px; text-shadow: 0 0 15px rgba(56, 189, 248, 0.8);">
                                {otp_code}
                            </div>
                        </div>
                    </td>
                </tr>

                <!-- SUBTLE GRID DIVIDER -->
                <tr>
                    <td style="padding: 0 30px;">
                        <div style="height: 1px; background: linear-gradient(90deg, transparent, #1e293b, transparent);"></div>
                    </td>
                </tr>

                <!-- SECONDARY ANIMATION & WARNING -->
                <tr>
                    <td style="padding: 25px 30px 30px; text-align: center;">
                        <!-- Mini Radar Scan GIF -->
                        <img src="https://media.tenor.com/tHqgUfDk9yIAAAAC/radar-scan.gif" 
                             alt="Radar" 
                             style="width: 30px; height: 30px; opacity: 0.7; margin-bottom: 16px;" />
                        
                        <p style="color: #475569; font-size: 12px; line-height: 1.5; margin: 0;">
                            This token will self-destruct in <strong style="color: #94a3b8;">5 minutes</strong>.<br>
                            If you did not initiate this uplink, secure your account immediately.
                        </p>
                    </td>
                </tr>
                
                <!-- TERMINAL STATUS FOOTER -->
                <tr>
                    <td style="background-color: #020617; padding: 15px; text-align: center; border-top: 1px solid #1e293b;">
                        <span style="font-family: 'Courier New', monospace; color: #334155; font-size: 10px; letter-spacing: 1px;">
                            NODE: ASIA-SOUTH-1 // TERMINAL ID: {node_id}
                        </span>
                    </td>
                </tr>
            </table>

        </body>
        </html>
        """

        msg = MIMEText(html_content, "html")
        msg["Subject"] = "MaritimeAI Security: Access Token"
        msg["From"] = f"MaritimeAI <{sender_email}>"
        msg["To"] = recipient_email

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, app_password)
        server.send_message(msg)
        server.quit()

    except Exception as e:
        print(f"Failed to send background email to {recipient_email}: {e}")


# ============================================================
# SEND LOGIN / EMAIL VERIFICATION OTP
# ============================================================

@app.post("/api/auth/send-otp")
def send_otp(
    request: OTPRequest,
    background_tasks: BackgroundTasks, # <--- ADD THIS
    db=Depends(get_db)
):

    email = request.email.lower().strip()

    # --------------------------------------------------------
    # Check for recently sent OTP
    # --------------------------------------------------------

    recent_otp = (
        db.query(OTPCode)
        .filter(OTPCode.email == email)
        .order_by(OTPCode.created_at.desc())
        .first()
    )

    if recent_otp:

        seconds_since_last_send = (
            datetime.utcnow() -
            recent_otp.last_sent_at
        ).total_seconds()

        if (
            seconds_since_last_send
            < OTP_RESEND_COOLDOWN_SECONDS
        ):

            remaining = int(
                OTP_RESEND_COOLDOWN_SECONDS
                - seconds_since_last_send
            )

            raise HTTPException(
                status_code=429,
                detail=(
                    f"Please wait {remaining} seconds "
                    "before requesting another OTP."
                )
            )

    # --------------------------------------------------------
    # Generate secure 6-digit OTP
    # --------------------------------------------------------

    otp_code = f"{secrets.randbelow(1000000):06d}"

    # Hash OTP before storing
    otp_hash = hash_otp(otp_code)

    now = datetime.utcnow()

    expires_at = (
        now +
        timedelta(minutes=OTP_EXPIRY_MINUTES)
    )

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

    # --------------------------------------------------------
    # SMTP configuration
    # --------------------------------------------------------

    sender_email = os.getenv("SMTP_EMAIL")
    app_password = os.getenv("SMTP_APP_PASSWORD")

    if not sender_email or not app_password:

        db.delete(new_otp)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Email service is not configured."
        )

    # --------------------------------------------------------
    # Send email
    # --------------------------------------------------------

    # --------------------------------------------------------
    # Send email (VIA BACKGROUND TASK)
    # --------------------------------------------------------
    background_tasks.add_task(
        send_email_background,
        sender_email,
        app_password,
        email,
        otp_code
    )

    return {
        "status": "success",
        "message": "OTP queued for background sending."
    }


# ============================================================
# VERIFY LOGIN / EMAIL OTP
# ============================================================

@app.post("/api/auth/verify-otp")
def verify_otp(
    request: OTPVerify,
    db=Depends(get_db)
):

    email = request.email.lower().strip()

    # --------------------------------------------------------
    # Find latest OTP
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Check expiry
    # --------------------------------------------------------

    if datetime.utcnow() > otp_record.expires_at:

        db.delete(otp_record)
        db.commit()

        raise HTTPException(
            status_code=400,
            detail=(
                "OTP has expired. "
                "Please request a new one."
            )
        )

    # --------------------------------------------------------
    # Check maximum attempts
    # --------------------------------------------------------

    if otp_record.attempts >= OTP_MAX_ATTEMPTS:

        db.delete(otp_record)
        db.commit()

        raise HTTPException(
            status_code=429,
            detail=(
                "Too many incorrect attempts. "
                "Please request a new OTP."
            )
        )

    # --------------------------------------------------------
    # Count verification attempt
    # --------------------------------------------------------

    otp_record.attempts += 1
    db.commit()

    # --------------------------------------------------------
    # Compare hashed OTP
    # --------------------------------------------------------

    if (
        hash_otp(request.otp)
        != otp_record.otp_hash
    ):

        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP."
        )

    # --------------------------------------------------------
    # Mark user's email as verified
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if user:

        user.is_email_verified = True
        db.commit()

    # --------------------------------------------------------
    # OTP is one-time use
    # --------------------------------------------------------

    db.delete(otp_record)
    db.commit()

    return {
        "status": "success",
        "message": "OTP verified successfully."
    }


# ============================================================
# REQUEST PASSWORD RESET OTP
# ============================================================

@app.post("/api/auth/request-password-reset")
def request_password_reset(
    request: OTPRequest,
    db=Depends(get_db)
):

    email = request.email.lower().strip()

    # --------------------------------------------------------
    # Find account
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # Always return same response
    # to avoid revealing whether an email exists

    if not user:

        return {
            "status": "success",
            "message": (
                "If an account exists for this email, "
                "a reset OTP has been sent."
            )
        }

    # --------------------------------------------------------
    # Check resend cooldown
    # --------------------------------------------------------

    recent_otp = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.email == email
        )
        .order_by(
            PasswordResetOTP.created_at.desc()
        )
        .first()
    )

    if recent_otp:

        seconds_since_last_send = (
            datetime.utcnow() -
            recent_otp.last_sent_at
        ).total_seconds()

        if (
            seconds_since_last_send
            < OTP_RESEND_COOLDOWN_SECONDS
        ):

            remaining = int(
                OTP_RESEND_COOLDOWN_SECONDS
                - seconds_since_last_send
            )

            raise HTTPException(
                status_code=429,
                detail=(
                    f"Please wait {remaining} seconds "
                    "before requesting another OTP."
                )
            )

    # --------------------------------------------------------
    # Generate secure reset OTP
    # --------------------------------------------------------

    otp_code = f"{secrets.randbelow(1000000):06d}"

    otp_hash = hash_otp(otp_code)

    now = datetime.utcnow()

    expires_at = (
        now +
        timedelta(minutes=OTP_EXPIRY_MINUTES)
    )

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

    # --------------------------------------------------------
    # SMTP configuration
    # --------------------------------------------------------

    sender_email = os.getenv("SMTP_EMAIL")
    app_password = os.getenv("SMTP_APP_PASSWORD")

    if not sender_email or not app_password:

        db.delete(reset_otp)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Email service is not configured."
        )

    # --------------------------------------------------------
    # Send password reset email
    # --------------------------------------------------------

    try:

        msg = MIMEText(
            f"Your MaritimeAI password reset code is: "
            f"{otp_code}\n\n"
            f"This code will expire in "
            f"{OTP_EXPIRY_MINUTES} minutes.\n\n"
            f"If you did not request a password reset, "
            f"you can safely ignore this email."
        )

        msg["Subject"] = (
            "MaritimeAI Security: Password Reset OTP"
        )

        msg["From"] = (
            f"MaritimeAI <{sender_email}>"
        )

        msg["To"] = email

        # Send email in the background instantly
        background_tasks.add_task(
            send_email_background,
            sender_email,
            app_password,
            email,
            otp_code
        )

        print(
            f"Success: Password reset OTP sent to {email}"
        )

        return {
            "status": "success",
            "message": (
                "If an account exists for this email, "
                "a reset OTP has been sent."
            )
        }

    except Exception as e:

        print(
            f"Failed to send password reset email "
            f"to {email}: {e}"
        )

        db.delete(reset_otp)
        db.commit()

        raise HTTPException(
            status_code=500,
            detail="Failed to send password reset email."
        )


# ============================================================
# RESET PASSWORD
# ============================================================

@app.post("/api/auth/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    otp: str,
    db=Depends(get_db)
):

    email = request.email.lower().strip()

    # --------------------------------------------------------
    # Find latest reset OTP
    # --------------------------------------------------------

    otp_record = (
        db.query(PasswordResetOTP)
        .filter(
            PasswordResetOTP.email == email
        )
        .order_by(
            PasswordResetOTP.created_at.desc()
        )
        .first()
    )

    if not otp_record:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or expired "
                "password reset OTP."
            )
        )

    # --------------------------------------------------------
    # Check expiry
    # --------------------------------------------------------

    if datetime.utcnow() > otp_record.expires_at:

        db.delete(otp_record)
        db.commit()

        raise HTTPException(
            status_code=400,
            detail=(
                "Password reset OTP has expired. "
                "Please request a new one."
            )
        )

    # --------------------------------------------------------
    # Check maximum attempts
    # --------------------------------------------------------

    if otp_record.attempts >= OTP_MAX_ATTEMPTS:

        db.delete(otp_record)
        db.commit()

        raise HTTPException(
            status_code=429,
            detail=(
                "Too many incorrect attempts. "
                "Please request a new OTP."
            )
        )

    # --------------------------------------------------------
    # Count attempt
    # --------------------------------------------------------

    otp_record.attempts += 1
    db.commit()

    # --------------------------------------------------------
    # Validate OTP
    # --------------------------------------------------------

    if (
        hash_otp(otp)
        != otp_record.otp_hash
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or expired "
                "password reset OTP."
            )
        )

    # --------------------------------------------------------
    # Password validation
    # --------------------------------------------------------

    if len(request.new_password) < 8:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must be at least "
                "8 characters long."
            )
        )

    if not any(
        char.isupper()
        for char in request.new_password
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain at least "
                "one uppercase letter."
            )
        )

    if not any(
        char.islower()
        for char in request.new_password
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain at least "
                "one lowercase letter."
            )
        )

    if not any(
        char.isdigit()
        for char in request.new_password
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain at least "
                "one number."
            )
        )

    if not any(
        not char.isalnum()
        for char in request.new_password
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain at least "
                "one special character."
            )
        )

    # --------------------------------------------------------
    # Find user
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Update password using secure hashing
    # --------------------------------------------------------

    user.password_hash = hash_password(
        request.new_password
    )

    db.commit()

    # --------------------------------------------------------
    # OTP can only be used once
    # --------------------------------------------------------

    db.delete(otp_record)
    db.commit()

    return {
        "status": "success",
        "message": (
            "Password reset successfully. "
            "You can now log in with your new password."
        )
    }