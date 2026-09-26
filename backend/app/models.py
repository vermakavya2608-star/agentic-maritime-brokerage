from pydantic import BaseModel

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