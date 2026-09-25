from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import smtplib
import os
from email.mime.text import MIMEText
from dotenv import load_dotenv

from app.models import RouteRequest, QuotationRequest, OTPRequest, OTPVerify
from app.services.quotation_service import QuotationService
from app.agents.route_agent import RouteAgent

from app.database import Base, engine
from app.user_model import User
from app.otp_model import OTPCode
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

# In-memory temporary storage for OTPs
otp_database = {}


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

@app.post("/api/auth/send-otp")
def send_otp(request: OTPRequest):
    # Generate a 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    otp_database[request.email] = otp_code
    
    # ---------------------------------------------------------
    # EMAIL CONFIGURATION
    # ---------------------------------------------------------
    sender_email = os.getenv("SMTP_EMAIL")
    app_password = os.getenv("SMTP_APP_PASSWORD")
    
    try:
        # Create the email content
        msg = MIMEText(f"Your MaritimeAI login verification code is: {otp_code}")
        msg['Subject'] = 'MaritimeAI Security: Login OTP'
        msg['From'] = f"MaritimeAI <{sender_email}>"
        msg['To'] = request.email
        
        # Connect to Gmail SMTP server and send
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender_email, app_password)
        server.send_message(msg)
        server.quit()
        
        print(f"Success: OTP sent to {request.email}")
        return {"status": "success", "message": "OTP Sent via Email"}
        
    except Exception as e:
        print(f"Failed to send email to {request.email}: {e}")
        return {"status": "error", "message": "Failed to send email."}


@app.post("/api/auth/verify-otp")
def verify_otp(request: OTPVerify):
    stored_otp = otp_database.get(request.email)
    
    if stored_otp and stored_otp == request.otp:
        # Clear OTP after successful use
        del otp_database[request.email]
        return {"status": "success", "message": "OTP verified successfully"}
        
    return {"status": "error", "message": "Invalid or expired OTP"}