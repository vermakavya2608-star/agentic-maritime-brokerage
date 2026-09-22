from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import RouteRequest, QuotationRequest
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