import pandas as pd
import random

# Read existing routes
routes = pd.read_csv("routes.csv")

pricing_data = []

for i, route in routes.iterrows():

    route_id = route["route_id"]

    # Keep the PDF's exact pricing for R001-R010
    pdf_data = {
        "R001": (100, 75, 1.00, 50, 15),
        "R002": (110, 80, 0.95, 60, 15),
        "R003": (105, 70, 1.05, 55, 15),
        "R004": (100, 80, 1.00, 50, 15),
        "R005": (95, 70, 1.00, 45, 15),
        "R006": (105, 75, 0.95, 55, 15),
        "R007": (90, 65, 1.05, 45, 15),
        "R008": (100, 70, 0.95, 50, 15),
        "R009": (85, 60, 1.10, 40, 15),
        "R010": (90, 65, 1.05, 45, 15),
    }

    if route_id in pdf_data:
        fuel, port, demand, risk, margin = pdf_data[route_id]

    else:
        distance = route["distance_nm"]
        transshipments = route["transshipments"]

        # Fuel surcharge based on route distance
        fuel = round(70 + (distance / 1000) * 5)

        # Port charge based on transshipments
        port = 60 + (transshipments * 15)

        # Demand factor
        demand = random.choice([0.95, 1.00, 1.05, 1.10])

        # Risk surcharge based on distance and transshipments
        risk = round(
            35
            + (distance / 1000) * 2
            + (transshipments * 15)
        )

        # Target brokerage margin
        margin = 15

    pricing_data.append({
        "pricing_id": f"P{i + 1:03d}",
        "route_id": route_id,
        "fuel_surcharge_usd": fuel,
        "port_charge_usd": port,
        "demand_factor": demand,
        "risk_surcharge_usd": risk,
        "target_margin_percent": margin
    })


# Create pricing DataFrame
pricing = pd.DataFrame(pricing_data)

# Save pricing.csv
pricing.to_csv("pricing.csv", index=False)

print("pricing.csv created successfully!")
print(f"Total pricing records: {len(pricing)}")