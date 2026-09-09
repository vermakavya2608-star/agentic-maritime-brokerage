from app.agents.route_agent import RouteAgent

class QuotationService:

    def __init__(self):
        self.route_agent = RouteAgent()

    def generate_quotation(
        self,
        origin,
        destination,
        cargo_type,
        containers
    ):

        # Ask Route Agent to find the best route

        route_result=self.route_agent.analyze_route(
            origin=origin,
            destination=destination,
            cargo_type=cargo_type,
            containers=containers
        )

        # Stop if route is not found
        
        if route_result["status"] != "success":
            return route_result

        # Get recommended route details
        
        route_details = route_result[
            "recommended_route_details"
        ]

        # Calculate estimated freight
    
        freight_per_container = route_details[
            "base_freight_usd"
        ]
    
        total_freight=(
            freight_per_container * containers
        )
    
        # Create quotation
        
        quotation = {
            "status":"success",

            "origin":origin,

            "destination":destination,

            "cargo_type":cargo_type,

            "containers":containers,
    
            "recommended_route":route_result[
                "recommended_route"
            ],
    
            "route_score":route_details[
                "route_score"
            ],

            "transit_time_days": route_details[
                "transit_days"
            ],

            "freight_per_container_usd":
                freight_per_container,

            "total_freight_usd":
                total_freight,

            "alternatives":
                route_result["alternatives"],

            "message":
                "Quotation generated successfully."
        }

        return quotation