import pandas as pd
import random
import itertools
import os

# Ensure the data directory exists
os.makedirs("app/data", exist_ok=True)

ports = [
    "Antwerp", "Barcelona", "Buenos Aires", "Busan", "Cape Town", "Chennai",
    "Colombo", "Dubai", "Durban", "Genoa", "Hamburg", "Hong Kong",
    "Jebel Ali", "London", "Long Beach", "Los Angeles", "Mombasa", "Mumbai",
    "New York", "Panama City", "Port Klang", "Rotterdam", "Santos", "Seattle",
    "Shanghai", "Singapore", "Sydney", "Tokyo", "Valparaiso", "Vancouver"
]

routes_data = []
pricing_data = []
route_counter = 1

print("Generating comprehensive global maritime database...")

# Generate routes for EVERY possible combination of ports
for origin, dest in itertools.permutations(ports, 2):
    
    # We will create 3 alternative routes for each city pair
    variants = [
        {"type": "Direct", "t_min": 10, "t_max": 20, "d_min": 4000, "d_max": 8000, "trans": 0, "f_min": 1500, "f_max": 3500},
        {"type": "Standard", "t_min": 18, "t_max": 30, "d_min": 5000, "d_max": 10000, "trans": 1, "f_min": 1000, "f_max": 2500},
        {"type": "Economy", "t_min": 28, "t_max": 45, "d_min": 7000, "d_max": 13000, "trans": 2, "f_min": 700, "f_max": 1800}
    ]
    
    for v in variants:
        route_id = f"R{route_counter:05d}"
        distance = random.randint(v["d_min"], v["d_max"])
        transshipments = v["trans"]
        base_freight = random.randint(v["f_min"], v["f_max"])
        
        # 1. Append to routes.csv
        routes_data.append({
            "route_id": route_id,
            "origin": origin,
            "destination": dest,
            "route_type": v["type"],
            "transit_days": random.randint(v["t_min"], v["t_max"]),
            "distance_nm": distance,
            "transshipments": transshipments,
            "base_freight_usd": base_freight
        })
        
        # 2. Append corresponding math to pricing.csv
        fuel = round(70 + (distance / 1000) * 5)
        port_charge = 60 + (transshipments * 15)
        demand = random.choice([0.95, 1.00, 1.05, 1.10])
        risk = round(35 + (distance / 1000) * 2 + (transshipments * 15))
        
        pricing_data.append({
            "pricing_id": f"P{route_counter:05d}",
            "route_id": route_id,
            "fuel_surcharge_usd": fuel,
            "port_charge_usd": port_charge,
            "demand_factor": demand,
            "risk_surcharge_usd": risk,
            "target_margin_percent": 15
        })
        
        route_counter += 1

# Overwrite the old limited datasets
pd.DataFrame(routes_data).to_csv("app/data/routes.csv", index=False)
pd.DataFrame(pricing_data).to_csv("app/data/pricing.csv", index=False)

print(f"Success! Generated {len(routes_data)} routes and pricing profiles.")