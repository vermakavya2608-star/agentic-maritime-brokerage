from app.agents.route_agent import RouteAgent
from app.agents.pricing_agent import PricingAgent
from app.agents.margin_agent import MarginAgent
from app.agents.weather_agent import WeatherAgent
from app.agents.customs_agent import CustomsAgent


class QuotationService:

    def __init__(self):
        self.route_agent = RouteAgent()
        self.pricing_agent = PricingAgent()
        self.margin_agent = MarginAgent()
        self.weather_agent = WeatherAgent()
        self.customs_agent = CustomsAgent()

    def generate_quotation(
        self,
        origin,
        destination,
        cargo_type,
        containers,
        provided_documents=None
    ):

        # ---------------------------------------------
        # Step 1: Route Agent
        # ---------------------------------------------

        route_result = self.route_agent.analyze_route(
            origin=origin,
            destination=destination,
            cargo_type=cargo_type,
            containers=containers
        )

        if route_result["status"] != "success":
            return route_result

        route_details = route_result["recommended_route_details"]

        route_id = route_details["route_id"]

        freight_per_container = route_details["base_freight_usd"]
        transshipments = route_details.get("transshipments", 0)
        route_type = route_details.get("route_type", "Direct")

        # ---------------------------------------------
        # Step 2: Pricing Agent
        # ---------------------------------------------

        pricing_result = self.pricing_agent.calculate_pricing(
            route_id=route_id,
            base_freight=freight_per_container
        )

        if pricing_result["status"] != "success":
            return pricing_result

        operating_cost = pricing_result["adjusted_cost"]

        target_margin = pricing_result["target_margin_percent"]

        # ---------------------------------------------
        # Step 3: Margin Agent
        # ---------------------------------------------

        margin_result = self.margin_agent.calculate_margin(
            operating_cost=operating_cost,
            target_margin_percent=target_margin
        )

        if margin_result["status"] != "success":
            return margin_result

        selling_price = margin_result["selling_price"]

        # ---------------------------------------------
        # Step 4: Weather Agent
        # ---------------------------------------------

        weather_result = self.weather_agent.get_route_weather(
            origin=origin,
            destination=destination
        )

        # ---------------------------------------------
        # Step 5: Customs Agent
        # ---------------------------------------------

        customs_result = self.customs_agent.validate_shipment(
            origin=origin,
            destination=destination,
            cargo_type=cargo_type,
            containers=containers,
            transshipments=transshipments,
            route_type=route_type,
            provided_documents=provided_documents or []
        )

        # ---------------------------------------------
        # Step 6: Weather + Customs Risk
        # ---------------------------------------------

        w_risk = weather_result.get(
            "marine_risk_level",
            "Low"
        )

        c_risk = customs_result.get(
            "customs_risk_level",
            "Low"
        )

        risk_weights = {
            "Low": 1,
            "Moderate": 2,
            "High": 3
        }

        max_risk = max(
            risk_weights.get(w_risk, 1),
            risk_weights.get(c_risk, 1)
        )

        overall_risk = "Low"

        if max_risk == 2:
            overall_risk = "Moderate"
        elif max_risk == 3:
            overall_risk = "High"

        shipment_risk_report = {
            "overall_risk": overall_risk,
            "weather_risk": w_risk,
            "customs_risk": c_risk,
            "readiness_grade": customs_result["audit_metric"]["grade"],
            "readiness_score": customs_result["audit_metric"]["score_out_of_10"],
            "summary": (
                f"Weather conditions pose a {w_risk.lower()} risk. "
                f"Customs status: {customs_result['validation_status']} "
                f"({customs_result['audit_metric']['grade']} compliance readiness)."
            )
        }

        # ---------------------------------------------
        # Step 7: Weather Impact
        # ---------------------------------------------

        weather_impact = weather_result.get(
            "weather_impact",
            {}
        )

        weather_risk = weather_result.get(
            "marine_risk_level",
            "Unknown"
        )

        weather_surcharge_percent = float(
            weather_impact.get(
                "surcharge_percent",
                0
            )
        )

        estimated_delay_days = int(
            weather_impact.get(
                "estimated_delay_days",
                0
            )
        )

        # ---------------------------------------------
        # Step 8: Apply Weather Surcharge
        # ---------------------------------------------
        #
        # This is separate from the existing
        # pricing.csv risk_surcharge.
        #
        # Low risk     -> 0%
        # Moderate     -> 3%
        # High         -> 8%
        #
        # Therefore existing pricing risk_surcharge
        # is NOT double-counted.
        # ---------------------------------------------

        weather_surcharge_amount = (
            selling_price
            * weather_surcharge_percent
            / 100
        )

        weather_adjusted_price = (
            selling_price
            + weather_surcharge_amount
        )

        weather_adjusted_price = round(
            weather_adjusted_price,
            2
        )

        weather_surcharge_amount = round(
            weather_surcharge_amount,
            2
        )

        # ---------------------------------------------
        # Step 9: Final Freight
        # ---------------------------------------------

        total_freight = round(
            weather_adjusted_price * containers,
            2
        )

        # ---------------------------------------------
        # Step 10: Weather Pricing Summary
        # ---------------------------------------------

        weather_pricing = {
            "weather_risk_level": weather_risk,
            "weather_surcharge_percent": weather_surcharge_percent,
            "weather_surcharge_per_container_usd": weather_surcharge_amount,
            "estimated_delay_days": estimated_delay_days,
            "price_before_weather_usd": selling_price,
            "price_after_weather_usd": weather_adjusted_price
        }

        # ---------------------------------------------
        # Step 11: Final Quotation
        # ---------------------------------------------

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

            "weather":
                weather_result,

            "weather_pricing":
                weather_pricing,

            "customs":
                customs_result,

            "shipment_risk_report":
                shipment_risk_report,

            "freight_per_container_usd":
                weather_adjusted_price,

            "total_freight_usd":
                total_freight,

            "alternatives":
                route_result["alternatives"],

            "candidate_routes":
                route_result["candidate_routes"],

            "message":
                "Final quotation and dynamic customs audit generated successfully."
        }

        return quotation