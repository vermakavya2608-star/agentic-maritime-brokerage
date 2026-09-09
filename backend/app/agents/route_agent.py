import os
import pandas as pd


class RouteAgent:

    def __init__(self):

        # Find the project root directory
        current_file = os.path.abspath(__file__)

        project_root = os.path.dirname(
            os.path.dirname(
                os.path.dirname(current_file)
            )
        )

        # Location of our route dataset
        self.dataset_path = os.path.join(
            project_root,
            "app",
            "data",
            "routes.csv"
        )

        # Load route dataset
        self.routes = pd.read_csv(self.dataset_path)


    def analyze_route(
        self,
        origin,
        destination,
        cargo_type,
        containers
    ):

        # Find all routes matching origin and destination
        matching_routes = self.routes[
            (self.routes["origin"].str.lower() == origin.lower())
            &
            (self.routes["destination"].str.lower() == destination.lower())
        ].copy()

        # If no route exists
        if matching_routes.empty:

            return {
                "status": "not_found",
                "message": (
                    f"No route found from {origin} "
                    f"to {destination}"
                )
            }

        # -----------------------------------
        # 1. Calculate Transit Score
        # -----------------------------------

        max_transit = matching_routes[
            "transit_days"
        ].max()

        matching_routes["transit_score"] = (

    100

    - (

        matching_routes["transit_days"]

        / max_transit

        * 100

    )

)

        # -----------------------------------
        # 2. Calculate Distance Score
        # -----------------------------------

        max_distance = matching_routes[
            "distance_nm"
        ].max()

        matching_routes["distance_score"] = (

    100

    - (

        matching_routes["distance_nm"]

        / max_distance

        * 100

    )

)

        # -----------------------------------
        # 3. Calculate Transshipment Score
        # -----------------------------------

        matching_routes["transshipment_score"] = (

    100

    - (

        matching_routes["transshipments"] * 20

    )

)
        # -----------------------------------
        # 4. Calculate Overall Route Score
        # -----------------------------------

        matching_routes["route_score"] = (

            matching_routes["transit_score"] * 0.40

            +

            matching_routes["distance_score"] * 0.25

            +

            matching_routes["transshipment_score"] * 0.35
        )

        # -----------------------------------
        # 5. Rank Routes
        # -----------------------------------

        matching_routes = matching_routes.sort_values(
            by="route_score",
            ascending=False
        )

        # -----------------------------------
        # 6. Best Route
        # -----------------------------------

        best_route = matching_routes.iloc[0]

        # -----------------------------------
        # 7. Alternative Routes
        # -----------------------------------

        alternatives = []

        for rank, (_, route) in enumerate(
            matching_routes.iloc[1:].iterrows(),
            start=2
        ):

            alternatives.append({

                "rank": rank,

                "route_id": route["route_id"],

                "route_type": route["route_type"],

                "transit_days": int(
                    route["transit_days"]
                ),

                "distance_nm": int(
                    route["distance_nm"]
                ),

                "transshipments": int(
                    route["transshipments"]
                ),

                "route_score": round(
                    float(route["route_score"]),
                    2
                ),

                "base_freight_usd": float(
                    route["base_freight_usd"]
                ),

                "score_breakdown": {

                    "transit_score": round(
                        float(route["transit_score"]),
                        2
                    ),

                    "distance_score": round(
                        float(route["distance_score"]),
                        2
                    ),

                    "transshipment_score": round(
                        float(route["transshipment_score"]),
                        2
                    )
                }
            })

        # -----------------------------------
        # 8. Return API Response
        # -----------------------------------

        return {

            "status": "success",

            "origin": origin,

            "destination": destination,

            "cargo_type": cargo_type,

            "containers": containers,

            # Recommended Route

            "recommended_route": best_route["route_id"],

            "recommendation_rank": 1,

            # Number of routes evaluated

            "candidate_routes": len(
                matching_routes
            ),

            # Recommended route details

            "recommended_route_details": {

                "route_id": best_route["route_id"],

                "route_type": best_route[
                    "route_type"
                ],

                "transit_days": int(
                    best_route["transit_days"]
                ),

                "distance_nm": int(
                    best_route["distance_nm"]
                ),

                "transshipments": int(
                    best_route["transshipments"]
                ),

                "route_score": round(
                    float(best_route["route_score"]),
                    2
                ),

                "base_freight_usd": float(
                    best_route["base_freight_usd"]
                ),

                "score_breakdown": {

                    "transit_score": round(
                        float(best_route["transit_score"]),
                        2
                    ),

                    "distance_score": round(
                        float(best_route["distance_score"]),
                        2
                    ),

                    "transshipment_score": round(
                        float(
                            best_route[
                                "transshipment_score"
                            ]
                        ),
                        2
                    )
                }
            },

            # Alternative routes

            "alternatives": alternatives,

            "reason": (
                "Routes were evaluated using weighted "
                "transit time, distance, and transshipment "
                "scores."
            )
        }