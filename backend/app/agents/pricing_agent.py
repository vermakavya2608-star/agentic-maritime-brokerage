import os
import pandas as pd


class PricingAgent:

    def __init__(self):

        # Find the current Python file
        current_file = os.path.abspath(__file__)

        # Find the backend folder
        project_root = os.path.dirname(
            os.path.dirname(
                os.path.dirname(current_file)
            )
        )

        # Location of pricing.csv
        self.pricing_path = os.path.join(
            project_root,
            "app",
            "data",
            "pricing.csv"
        )

        # Load pricing data
        self.pricing = pd.read_csv(self.pricing_path)

    def calculate_pricing(
        self,
        route_id,
        base_freight
    ):

        # Find pricing information for selected route
        pricing_data = self.pricing[
            self.pricing["route_id"] == route_id
        ]

        # If route does not have pricing information
        if pricing_data.empty:
            return {
                "status": "not_found",
                "message": (
                    f"No pricing data found "
                    f"for route {route_id}"
                )
            }

        # Get the first matching pricing record
        pricing = pricing_data.iloc[0]

        # Read pricing factors
        fuel_surcharge = float(
            pricing["fuel_surcharge_usd"]
        )

        port_charge = float(
            pricing["port_charge_usd"]
        )

        risk_surcharge = float(
            pricing["risk_surcharge_usd"]
        )

        demand_factor = float(
            pricing["demand_factor"]
        )

        target_margin = float(
            pricing["target_margin_percent"]
        )

        # Calculate operating cost
        operating_cost = (
            base_freight
            + fuel_surcharge
            + port_charge
            + risk_surcharge
        )

        # Apply market demand factor
        adjusted_cost = operating_cost * demand_factor

        return {
            "status": "success",
            "route_id": route_id,
            "base_freight": base_freight,
            "fuel_surcharge": fuel_surcharge,
            "port_charge": port_charge,
            "risk_surcharge": risk_surcharge,
            "demand_factor": demand_factor,
            "target_margin_percent": target_margin,
            "operating_cost": round(operating_cost, 2),
            "adjusted_cost": round(adjusted_cost, 2)
        }