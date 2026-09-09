from app.agents.pricing_agent import PricingAgent


agent = PricingAgent()

result = agent.calculate_pricing(
    route_id="R001",
    base_freight=1850
)

print(result)