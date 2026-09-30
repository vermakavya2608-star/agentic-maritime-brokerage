import logging

class LLMAgent:
    def __init__(self):
        # Trade corridor choke points & geographical profiles
        self.chokepoints = {
            ("asia", "europe"): "transits via the Suez Canal and Bab-el-Mandeb, where maritime traffic density and regional security protocols require heightened watchstanding",
            ("europe", "asia"): "requires transit through the Bab-el-Mandeb and Suez corridor, subject to maritime security protocols and strict convoy scheduling",
            ("asia", "na_west"): "crosses the North Pacific Great Circle route, exposing vessels to seasonal low-pressure systems and heavy winter swells",
            ("na_west", "asia"): "follows the North Pacific trade lane, requiring vigilant monitoring of seasonal typhoon tracks across the Western Pacific",
            ("asia", "oceania"): "navigates the Western Pacific corridor through the Philippine and Coral Seas, avoiding major geopolitical chokepoints but sensitive to tropical storm seasons",
            ("oceania", "asia"): "runs northbound across the Coral Sea, maintaining high operational safety outside major constrained waterways",
            ("europe", "na_east"): "navigates the North Atlantic corridor, contending with dense traffic in the English Channel and severe winter gale patterns",
            ("na_east", "europe"): "transits the North Atlantic lane with high eastbound current assistance, though subject to heavy sea state volatility",
            ("middle_east", "asia"): "passes through the Strait of Hormuz and Malacca Strait, two of the world's most critical high-density maritime transit arteries",
            ("asia", "middle_east"): "crosses the Malacca Strait into the Indian Ocean and Strait of Hormuz, requiring close navigational coordination"
        }

        # Specialized cargo stowage and protection advisories
        self.cargo_advisories = {
            "electronics": "For high-value electronics, maintain continuous container seal integrity and deploy silica desiccants to mitigate condensation and equatorial thermal shock.",
            "machinery": "Heavy industrial machinery requires reinforced deck lashing, verified center-of-gravity stowage, and specialized sea-fastening to endure dynamic hull acceleration forces.",
            "textiles": "Textile shipments must be loaded in desiccated dry-van units with verified container vents to prevent humidity buildup and mold damage across warm maritime belts.",
            "general cargo": "Standard container stowage applies; verify transshipment hub turnaround times to ensure scheduled transit integrity."
        }

    def _get_region(self, port: str) -> str:
        port = port.strip().lower()
        if port in ["tokyo", "busan", "shanghai", "hong kong", "singapore", "port klang", "chennai", "mumbai", "colombo"]:
            return "asia"
        if port in ["sydney"]:
            return "oceania"
        if port in ["antwerp", "barcelona", "genoa", "hamburg", "london", "rotterdam"]:
            return "europe"
        if port in ["long beach", "los angeles", "seattle", "vancouver"]:
            return "na_west"
        if port in ["new york"]:
            return "na_east"
        if port in ["dubai", "jebel ali"]:
            return "middle_east"
        return "global"

    def get_route_insight(self, origin: str, destination: str, cargo_type: str, route_id: str = None, transit_days: int = None) -> str:
        orig_region = self._get_region(origin)
        dest_region = self._get_region(destination)
        cargo_key = cargo_type.strip().lower()

        # Determine corridor analysis
        corridor = self.chokepoints.get(
            (orig_region, dest_region),
            f"connects {origin} to {destination} along an open ocean lane, subject to localized swell and seasonal weather variations"
        )

        cargo_guidance = self.cargo_advisories.get(
            cargo_key,
            "Ensure standard ISO container lashing protocols are verified prior to departure."
        )

        # Build dynamic, real-time 2-sentence output
        if route_id and transit_days:
            sentence_1 = f"Route {route_id} provides a streamlined {transit_days}-day transit from {origin} to {destination} that {corridor}."
        else:
            sentence_1 = f"The {origin} to {destination} trade lane {corridor}."

        sentence_2 = cargo_guidance

        return f"{sentence_1} {sentence_2}"