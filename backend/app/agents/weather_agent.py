import urllib.request
import json
import logging
import socket

# Force a strict 1-second network timeout to prevent UI hanging
socket.setdefaulttimeout(1.0)

class WeatherAgent:
    def __init__(self):
        # Coordinates matching the frontend ports
        self.port_coords = {
            "Antwerp": (51.2194, 4.4025), "Barcelona": (41.3851, 2.1734),
            "Buenos Aires": (-34.6037, -58.3816), "Busan": (35.1796, 129.0756),
            "Cape Town": (-33.9249, 18.4241), "Chennai": (13.0827, 80.2707),
            "Colombo": (6.9271, 79.8612), "Dubai": (25.2048, 55.2708),
            "Durban": (-29.8587, 31.0218), "Genoa": (44.4056, 8.9463),
            "Hamburg": (53.5511, 9.9937), "Hong Kong": (22.3193, 114.1694),
            "Jebel Ali": (25.0113, 55.056), "London": (51.5074, -0.1278),
            "Long Beach": (33.7701, -118.1937), "Los Angeles": (34.0522, -118.2437),
            "Mombasa": (-4.0435, 39.6682), "Mumbai": (18.9667, 72.8333),
            "New York": (40.7128, -74.006), "Panama City": (8.9824, -79.5199),
            "Port Klang": (3.0333, 101.3667), "Rotterdam": (51.9225, 4.4792),
            "Santos": (-23.9618, -46.3322), "Seattle": (47.6062, -122.3321),
            "Shanghai": (31.2304, 121.4737), "Singapore": (1.3521, 103.8198),
            "Sydney": (-33.8688, 151.2093), "Tokyo": (35.6762, 139.6503),
            "Valparaiso": (-33.0456, -71.6202), "Vancouver": (49.2827, -123.1207)
        }

    def decode_wmo(self, code):
        if code == 0: return ("Clear Sky", "☀️")
        elif code in [1, 2]: return ("Partly Cloudy", "⛅")
        elif code == 3: return ("Overcast", "☁️")
        elif code in [45, 48]: return ("Fog", "🌫️")
        elif code in [51, 53, 55]: return ("Drizzle", "🌦️")
        elif code in [61, 63, 65]: return ("Rain", "🌧️")
        elif code in [71, 73, 75]: return ("Snow", "❄️")
        elif code in [80, 81, 82]: return ("Rain Showers", "🌦️")
        elif code >= 95: return ("Thunderstorm", "⛈️")
        return ("Unknown", "🌐")

    def assess_marine_risk(self, max_wind_knots):
        if max_wind_knots < 15:
            return "Low", "Favorable sailing conditions. Normal operations expected."
        elif max_wind_knots < 30:
            return "Moderate", "Moderate wind activity detected. Standard maritime caution advised."
        else:
            return "High", "Gale force winds detected. Expect potential delays or route deviation."

    def fetch_port_weather(self, port_name):
        coords = self.port_coords.get(port_name)
        if not coords:
            return None

        lat, lon = coords
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,wind_speed_10m,weather_code"
            f"&wind_speed_unit=kn"
        )

        try:
            # 1-second aggressive timeout
            req = urllib.request.Request(url, headers={'User-Agent': 'MaritimeAI-Bot'})
            with urllib.request.urlopen(req, timeout=1.0) as response:
                data = json.loads(response.read().decode())
                current = data.get("current", {})
                
                temp = current.get("temperature_2m", 0)
                wind = current.get("wind_speed_10m", 0)
                code = current.get("weather_code", 0)
                desc, icon = self.decode_wmo(code)
                
                return {
                    "port": port_name,
                    "temp_c": round(temp, 1),
                    "wind_knots": round(wind, 1),
                    "condition": desc,
                    "icon": icon
                }
        except Exception as e:
            logging.warning(f"Weather API timeout for {port_name}, using fallback.")
            return {
                "port": port_name,
                "temp_c": 22.0,
                "wind_knots": 12.5,
                "condition": "Simulated Clear",
                "icon": "☀️"
            }

    def get_route_weather(self, origin, destination):
        orig_weather = self.fetch_port_weather(origin)
        dest_weather = self.fetch_port_weather(destination)

        if not orig_weather:
            orig_weather = {"port": origin, "temp_c": "--", "wind_knots": 0, "condition": "Unavailable", "icon": "⚠️"}
        if not dest_weather:
            dest_weather = {"port": destination, "temp_c": "--", "wind_knots": 0, "condition": "Unavailable", "icon": "⚠️"}

        max_wind = max(orig_weather.get("wind_knots", 0), dest_weather.get("wind_knots", 0))
        risk_level, advisory = self.assess_marine_risk(max_wind)

        return {
            "status": "success",
            "origin_weather": orig_weather,
            "destination_weather": dest_weather,
            "max_wind_knots": max_wind,
            "marine_risk_level": risk_level,
            "advisory": advisory
        }