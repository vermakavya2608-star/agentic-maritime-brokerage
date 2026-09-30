from pydantic import BaseModel
from typing import Optional

class RouteRequest(BaseModel):
   origin: str
   destination: str
   cargo_type: str
   containers: int

class QuotationRequest(BaseModel):
   origin:str
   destination:str
   cargo_type:str
   containers:int

# --- New OTP Models ---
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