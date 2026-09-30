from app.agents.llm_agent import LLMAgent
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import smtplib
from email.mime.text import MIMEText
from pydantic import BaseModel
from typing import Optional
import socket
import os

from app.models import RouteRequest, QuotationRequest, OTPRequest, OTPVerify
from app.services.quotation_service import QuotationService
from app.agents.route_agent import RouteAgent

app = FastAPI(
    title="Agentic Maritime Brokerage Platform",
    description="AI-powered maritime freight quotation platform",
    version="1.0.0"
)

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
llm_agent = LLMAgent()
quotation_service = QuotationService()

# In-memory temporary storage for OTPs
otp_database = {}


@app.get("/")

@app.get("/api/health")
def check_system_health():
    # 1. Check local agents (Route & Pricing agents require their databases to be active)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    routes_path = os.path.join(base_dir, "app", "data", "routes.csv")
    pricing_path = os.path.join(base_dir, "app", "data", "pricing.csv")
    
    route_status = "online" if os.path.exists(routes_path) else "offline"
    pricing_status = "online" if os.path.exists(pricing_path) else "offline"
    
    # 2. Check Weather agent (Requires external Open-Meteo satellite connectivity)
    weather_status = "offline"
    try:
        # Pings the weather API with a 1-second timeout
        socket.setdefaulttimeout(1.0)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect(("api.open-meteo.com", 80))
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
    sender_email = "divyamagarwal0123@gmail.com" # <--- ENTER YOUR GMAIL HERE
    app_password = "puuo jenw fhsq qfux" # <--- ENTER YOUR APP PASSWORD HERE
    
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
    return {"status": "success", "insight": insight}