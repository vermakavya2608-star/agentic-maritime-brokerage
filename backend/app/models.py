from pydantic import BaseModel
from typing import Optional, List

class RouteRequest(BaseModel):
    origin: str
    destination: str
    cargo_type: str
    containers: int

class QuotationRequest(BaseModel):
    origin: str
    destination: str
    cargo_type: str
    containers: int
    transshipments: Optional[int] = 0
    route_type: Optional[str] = "Direct"
    provided_documents: List[str] = []

class CustomsAuditRequest(BaseModel):
    origin: str
    destination: str
    cargo_type: str
    containers: int
    transshipments: Optional[int] = 0
    route_type: Optional[str] = "Direct"
    provided_documents: List[str] = []

# --- OTP & Other Models remain unchanged ---
class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str
    
class InsightRequest(BaseModel):
    origin: str
    destination: str
    cargo_type: str
    route_id: Optional[str] = None
    transit_days: Optional[int] = None