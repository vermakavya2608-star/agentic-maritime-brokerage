import urllib.request
import json
import logging
import socket

# Keep external weather requests from blocking the application for too long.
socket.setdefaulttimeout(3.0)

logger = logging.getLogger(__name__)


class WeatherAgent:

    def __init__(self):
        # Coordinates matching the frontend ports
        self.port_coords = {
            "Antwerp": (51.2194, 4.4025),
            "Barcelona": (41.3851, 2.1734),
            "Buenos Aires": (-34.6037, -58.3816),
            "Busan": (35.1796, 129.0756),
            "Cape Town": (-33.9249, 18.4241),
            "Chennai": (13.0827, 80.2707),
            "Colombo": (6.9271, 79.8612),
            "Dubai": (25.2048, 55.2708),
            "Durban": (-29.8587, 31.0218),
            "Genoa": (44.4056, 8.9463),
            "Hamburg": (53.5511, 9.9937),
            "Hong Kong": (22.3193, 114.1694),
            "Jebel Ali": (25.0113, 55.0560),
            "London": (51.5074, -0.1278),
            "Long Beach": (33.7701, -118.1937),
            "Los Angeles": (34.0522, -118.2437),
            "Mombasa": (-4.0435, 39.6682),
            "Mumbai": (18.9667, 72.8333),
            "New York": (40.7128, -74.0060),
            "Panama City": (8.9824, -79.5199),
            "Port Klang": (3.0333, 101.3667),
            "Rotterdam": (51.9225, 4.4792),
            "Santos": (-23.9618, -46.3322),
            "Seattle": (47.6062, -122.3321),
            "Shanghai": (31.2304, 121.4737),
            "Singapore": (1.3521, 103.8198),
            "Sydney": (-33.8688, 151.2093),
            "Tokyo": (35.6762, 139.6503),
            "Valparaiso": (-33.0456, -71.6202),
            "Vancouver": (49.2827, -123.1207),
        }

    def decode_wmo(self, code):
        """Convert Open-Meteo WMO weather codes into readable conditions."""

        if code == 0:
            return "Clear Sky", "☀️"

        if code in [1, 2]:
            return "Partly Cloudy", "⛅"

        if code == 3:
            return "Overcast", "☁️"

        if code in [45, 48]:
            return "Fog", "🌫️"

        if code in [51, 53, 55]:
            return "Drizzle", "🌦️"

        if code in [56, 57]:
            return "Freezing Drizzle", "🌧️"

        if code in [61, 63, 65]:
            return "Rain", "🌧️"

        if code in [66, 67]:
            return "Freezing Rain", "🌧️"

        if code in [71, 73, 75, 77]:
            return "Snow", "❄️"

        if code in [80, 81, 82]:
            return "Rain Showers", "🌦️"

        if code in [85, 86]:
            return "Snow Showers", "🌨️"

        if code == 95:
            return "Thunderstorm", "⛈️"

        if code in [96, 99]:
            return "Thunderstorm with Hail", "⛈️"

        return "Unknown", "🌐"

    def assess_weather_risk(self, wind_knots, condition):
        """
        Assess maritime weather risk using wind speed and
        potentially dangerous weather conditions.
        """

        condition_lower = condition.lower()

        # Severe weather takes priority over wind-only assessment.
        if "thunderstorm" in condition_lower:
            return (
                "High",
                "Thunderstorm activity detected. Sailing conditions may be hazardous."
            )

        if "hail" in condition_lower:
            return (
                "High",
                "Thunderstorm and hail conditions detected. Potential sailing disruption."
            )

        if "freezing rain" in condition_lower:
            return (
                "High",
                "Freezing rain detected. Exercise extreme maritime caution."
            )

        if "fog" in condition_lower:
            if wind_knots >= 15:
                return (
                    "High",
                    "Fog combined with strong winds may significantly reduce sailing safety."
                )

            return (
                "Moderate",
                "Fog may reduce visibility. Additional maritime caution advised."
            )

        if wind_knots >= 30:
            return (
                "High",
                "Gale-force winds detected. Expect possible delays or route deviation."
            )

        if wind_knots >= 15:
            return (
                "Moderate",
                "Moderate wind activity detected. Standard maritime caution advised."
            )

        if any(
            word in condition_lower
            for word in ["heavy rain", "rain showers", "rain"]
        ):
            return (
                "Moderate",
                "Rainy conditions detected. Normal operations may continue with caution."
            )

        return (
            "Low",
            "Favorable sailing conditions. Normal operations expected."
        )

    def calculate_weather_impact(self, risk_level):
        """
        Convert marine weather risk into structured operational
        and commercial impact information.

        This does NOT directly change the quotation price.
        It only provides information that another agent can use.
        """

        if risk_level == "High":
            return {
                "impact_level": "High",
                "surcharge_percent": 8,
                "estimated_delay_days": 3,
                "pricing_impact": "High",
                "operational_impact": (
                    "Possible sailing delays, route deviation, "
                    "or additional maritime precautions."
                ),
            }

        if risk_level == "Moderate":
            return {
                "impact_level": "Moderate",
                "surcharge_percent": 3,
                "estimated_delay_days": 1,
                "pricing_impact": "Moderate",
                "operational_impact": (
                    "Additional maritime caution may be required "
                    "and minor delays are possible."
                ),
            }

        if risk_level == "Low":
            return {
                "impact_level": "Low",
                "surcharge_percent": 0,
                "estimated_delay_days": 0,
                "pricing_impact": "None",
                "operational_impact": (
                    "Minimal weather-related operational impact expected."
                ),
            }

        return {
            "impact_level": "Unknown",
            "surcharge_percent": 0,
            "estimated_delay_days": 0,
            "pricing_impact": "Unknown",
            "operational_impact": (
                "Weather information is incomplete. "
                "Verify conditions before sailing."
            ),
        }

    def fetch_port_weather(self, port_name):
        """Fetch current weather for a supported port."""

        coords = self.port_coords.get(port_name)

        if not coords:
            logger.warning(
                f"Weather coordinates not found for port: {port_name}"
            )
            return None

        lat, lon = coords

        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}"
            f"&longitude={lon}"
            f"&current=temperature_2m,wind_speed_10m,weather_code"
            f"&wind_speed_unit=kn"
        )

        try:
            request = urllib.request.Request(
                url,
                headers={"User-Agent": "MaritimeAI-Bot/1.0"}
            )

            with urllib.request.urlopen(
                request,
                timeout=3.0
            ) as response:

                data = json.loads(
                    response.read().decode()
                )

            current = data.get("current", {})

            temperature = current.get("temperature_2m")
            wind = current.get("wind_speed_10m")
            weather_code = current.get("weather_code")

            if (
                temperature is None
                or wind is None
                or weather_code is None
            ):
                raise ValueError(
                    "Incomplete weather data received from API"
                )

            condition, icon = self.decode_wmo(weather_code)

            risk_level, advisory = self.assess_weather_risk(
                wind,
                condition
            )

            return {
                "port": port_name,
                "temp_c": round(temperature, 1),
                "wind_knots": round(wind, 1),
                "condition": condition,
                "icon": icon,
                "weather_code": weather_code,
                "risk_level": risk_level,
                "advisory": advisory,
                "source": "Open-Meteo",
                "data_type": "Live",
            }

        except Exception as error:

            logger.warning(
                f"Weather API unavailable for {port_name}: {error}"
            )

            return {
                "port": port_name,
                "temp_c": None,
                "wind_knots": None,
                "condition": "Weather data unavailable",
                "icon": "⚠️",
                "weather_code": None,
                "risk_level": "Unknown",
                "advisory": "Live weather data could not be retrieved.",
                "source": "Fallback",
                "data_type": "Unavailable",
            }

    def get_route_weather(self, origin, destination):
        """
        Get weather intelligence for both ends of a shipping route.
        """

        origin_weather = self.fetch_port_weather(origin)
        destination_weather = self.fetch_port_weather(destination)

        if not origin_weather:

            origin_weather = {
                "port": origin,
                "temp_c": None,
                "wind_knots": None,
                "condition": "Unavailable",
                "icon": "⚠️",
                "weather_code": None,
                "risk_level": "Unknown",
                "advisory": (
                    "Weather coordinates unavailable for this port."
                ),
                "source": "Unavailable",
                "data_type": "Unavailable",
            }

        if not destination_weather:

            destination_weather = {
                "port": destination,
                "temp_c": None,
                "wind_knots": None,
                "condition": "Unavailable",
                "icon": "⚠️",
                "weather_code": None,
                "risk_level": "Unknown",
                "advisory": (
                    "Weather coordinates unavailable for this port."
                ),
                "source": "Unavailable",
                "data_type": "Unavailable",
            }

        wind_values = [
            weather["wind_knots"]
            for weather in [
                origin_weather,
                destination_weather
            ]
            if isinstance(
                weather.get("wind_knots"),
                (int, float)
            )
        ]

        max_wind = (
            max(wind_values)
            if wind_values
            else None
        )

        risk_levels = {
            "Low": 1,
            "Moderate": 2,
            "High": 3,
            "Unknown": 0,
        }

        origin_risk = origin_weather.get(
            "risk_level",
            "Unknown"
        )

        destination_risk = destination_weather.get(
            "risk_level",
            "Unknown"
        )

        if (
            risk_levels[destination_risk]
            > risk_levels[origin_risk]
        ):
            route_risk = destination_risk
        else:
            route_risk = origin_risk

        # Weather alerts
        alerts = []

        if origin_risk in ["Moderate", "High"]:
            alerts.append(
                f"{origin}: "
                f"{origin_weather.get('advisory')}"
            )

        if destination_risk in ["Moderate", "High"]:
            alerts.append(
                f"{destination}: "
                f"{destination_weather.get('advisory')}"
            )

        if not alerts:
            alerts.append(
                "No significant weather alerts detected "
                "at the route endpoints."
            )

        # Route advisory
        if route_risk == "High":

            route_advisory = (
                "High weather risk detected. Consider possible "
                "delays, route deviation, or additional "
                "maritime precautions."
            )

        elif route_risk == "Moderate":

            route_advisory = (
                "Moderate weather risk detected. Normal "
                "operations may continue with additional "
                "maritime caution."
            )

        elif route_risk == "Low":

            route_advisory = (
                "Favorable weather conditions detected "
                "at the route endpoints."
            )

        else:

            route_advisory = (
                "Weather information is incomplete. "
                "Verify conditions before sailing."
            )

        # NEW: Convert route weather risk into structured impact.
        weather_impact = self.calculate_weather_impact(
            route_risk
        )

        return {
            "status": "success",
            "origin_weather": origin_weather,
            "destination_weather": destination_weather,
            "max_wind_knots": (
                round(max_wind, 1)
                if max_wind is not None
                else None
            ),
            "marine_risk_level": route_risk,
            "weather_alerts": alerts,
            "advisory": route_advisory,

            # NEW
            "weather_impact": weather_impact,

            "data_source": "Open-Meteo",
        }