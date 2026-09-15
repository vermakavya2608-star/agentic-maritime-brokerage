from app.agents.route_agent import RouteAgent
from app.agents.pricing_agent import PricingAgent
from app.agents.margin_agent import MarginAgent


class QuotationService:

    def __init__(self):
        self.route_agent = RouteAgent()
        self.pricing_agent = PricingAgent()
        self.margin_agent = MarginAgent()

    def generate_quotation(
        self,
        origin,
        destination,
        cargo_type,
        containers
    ):
        # Step 1: Route Agent
        route_result = self.route_agent.analyze_route(
            origin=origin,
            destination=destination,
            cargo_type=cargo_type,
            containers=containers
        )

        if route_result["status"] != "success":
            return route_result

        route_details = route_result[
            "recommended_route_details"
        ]

        route_id = route_details["route_id"]
        freight_per_container = route_details[
            "base_freight_usd"
        ]

        # Step 2: Pricing Agent
        pricing_result = self.pricing_agent.calculate_pricing(
            route_id=route_id,
            base_freight=freight_per_container
        )

        if pricing_result["status"] != "success":
            return pricing_result

        operating_cost = pricing_result["adjusted_cost"]
        target_margin = pricing_result[
            "target_margin_percent"
        ]

        # Step 3: Margin Agent
        margin_result = self.margin_agent.calculate_margin(
            operating_cost=operating_cost,
            target_margin_percent=target_margin
        )

        if margin_result["status"] != "success":
            return margin_result

        selling_price = margin_result["selling_price"]

        # Step 4: Final quotation
        total_freight = selling_price * containers

        quotation = {
            "status": "success",
            "origin": origin,
            "destination": destination,
            "cargo_type": cargo_type,
            "containers": containers,

            "recommended_route":
                route_result["recommended_route"],

            "recommended_route_details":
                route_details,

            "route_score":
                route_details["route_score"],

            "transit_time_days":
                route_details["transit_days"],

            "pricing":
                pricing_result,

            "margin":
                margin_result,

            "freight_per_container_usd":
                selling_price,

            "total_freight_usd":
                total_freight,

            "alternatives":
                route_result["alternatives"],

            "candidate_routes":
                route_result["candidate_routes"],

            "message":
                "Final quotation generated successfully."
        }

        return quotation