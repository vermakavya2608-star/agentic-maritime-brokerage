from app.services.quotation_service import QuotationService


class FreightIntelligenceService:
    """
    Combines existing route, pricing, margin, weather, and customs
    outputs into one freight intelligence report.
    """

    def __init__(self):
        self.quotation_service = QuotationService()

    def analyze_freight(
        self,
        origin,
        destination,
        cargo_type,
        containers,
        provided_documents=None,
    ):
        # Reuse the existing quotation workflow.
        quotation = self.quotation_service.generate_quotation(
            origin=origin,
            destination=destination,
            cargo_type=cargo_type,
            containers=containers,
            provided_documents=provided_documents or [],
        )

        # Pass through existing error responses without masking them.
        if not isinstance(quotation, dict):
            return {
                "status": "error",
                "message": "The quotation service returned an invalid response.",
            }

        if quotation.get("status") != "success":
            return quotation

        route = quotation.get("recommended_route_details") or {}
        pricing = quotation.get("pricing") or {}
        margin = quotation.get("margin") or {}
        weather = quotation.get("weather") or {}
        customs = quotation.get("customs") or {}
        risk = quotation.get("shipment_risk_report") or {}

        return {
            "status": "success",
            "message": "Freight intelligence analysis completed.",

            "shipment": {
                "origin": origin,
                "destination": destination,
                "cargo_type": cargo_type,
                "containers": containers,
            },

            "route_intelligence": {
                "recommended_route": quotation.get("recommended_route"),
                "route_id": route.get("route_id"),
                "route_type": route.get("route_type"),
                "route_score": quotation.get("route_score"),
                "transit_time_days": quotation.get("transit_time_days"),
                "distance_nm": route.get("distance_nm"),
                "transshipments": route.get("transshipments"),
                "alternatives": quotation.get("alternatives", []),
                "candidate_routes": quotation.get("candidate_routes", []),
            },

            "pricing_intelligence": {
                "pricing": pricing,
                "margin": margin,
                "freight_per_container_usd": quotation.get(
                    "freight_per_container_usd"
                ),
                "total_freight_usd": quotation.get("total_freight_usd"),
                "total_profit_usd": (
                    round(margin["margin_amount"] * containers, 2)
                    if isinstance(margin.get("margin_amount"), (int, float))
                    else None
                ),
                "weather_pricing": quotation.get("weather_pricing", {}),
            },

            "risk_intelligence": {
                "overall_risk": risk.get("overall_risk"),
                "weather_risk": risk.get("weather_risk"),
                "customs_risk": risk.get("customs_risk"),
                "readiness_grade": risk.get("readiness_grade"),
                "readiness_score": risk.get("readiness_score"),
                "summary": risk.get("summary"),
            },

            "weather": weather,
            "customs": customs,
        }
