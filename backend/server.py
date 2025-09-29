from mcp.server.fastmcp import FastMCP
from langchain_community.utilities import SerpAPIWrapper
from dotenv import load_dotenv
import os
import requests
import googlemaps

load_dotenv()

GOOGLEMAPS_API_KEY = os.getenv("GOOGLEMAPS_API_KEY")
gmaps = googlemaps.Client(key=GOOGLEMAPS_API_KEY)

mcp = FastMCP("Demo")

@mcp.tool()
def add_numbers(num1: int, num2: int) -> int:
    """Adds two numbers"""
    return num1 + num2


@mcp.tool()
def web_search(query: str):
    """This tool does the web search using the users query"""
    search = SerpAPIWrapper(serpapi_api_key=os.getenv("SERPAPI_API_KEY"))
    response = search.run(query)
    return response

@mcp.tool()
def geocode_address(address: str):
    """Convert address, places names, malls, schools, colleges, shops, restaurants and all such places to coordinates"""
    try:
        result = gmaps.geocode(address)
        return result
    except Exception as e:
        print(f"Error: {e}")
        return None

@mcp.tool()
def get_air_quality(latitude, longitude):
    """Get air quality data for coordinates (latitude and longitude)"""
    url = f"https://airquality.googleapis.com/v1/currentConditions:lookup?key={GOOGLEMAPS_API_KEY}"
    
    payload = {
        "location": {
            "latitude": latitude,
            "longitude": longitude
        }
    }
    

    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()
    
    except Exception as e:
        print(f"Error: {e}")
        return None


# Distance Matrix
@mcp.tool()
def get_distance_matrix(origins, destinations, units: str = "metric", mode: str = "driving", departure_time: str = None, traffic_model: str = None):
    """
    Get distance and duration between origins and destinations using Google Distance Matrix.

    - origins: string or list of strings (addresses or "latitude,longitude")
    - destinations: string or list of strings (addresses or "latitude,longitude")
    - units: "metric" or "imperial"
    - mode: "driving" | "walking" | "bicycling" | "transit"
    - departure_time: optional, e.g., "now"
    - traffic_model: optional when using driving with departure_time="now" ("best_guess", "pessimistic", "optimistic")
    """
    try:
        kwargs = {"units": units, "mode": mode}
        if departure_time is not None:
            kwargs["departure_time"] = departure_time
        if traffic_model is not None:
            kwargs["traffic_model"] = traffic_model

        result = gmaps.distance_matrix(origins=origins, destinations=destinations, **kwargs)
        return result
    except Exception as e:
        print(f"Error: {e}")
        return None


#GeoLocation
@mcp.tool()
def get_geolocation(mac_address: str, signal_strength: int = None):
    """
    Get approximate geolocation based on WiFi access point MAC address.
    Only required fields are included; signal strength is optional.
    """
    url = f"https://www.googleapis.com/geolocation/v1/geolocate?key={GOOGLEMAPS_API_KEY}"
    
    wifi_point = {"macAddress": mac_address}
    if signal_strength is not None:
        wifi_point["signalStrength"] = signal_strength

    payload = {
        "considerIp": "false",
        "wifiAccessPoints": [wifi_point]
    }

    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None


#Weather
@mcp.tool()
def get_weather(latitude: float, longitude: float):
    """
    Get current weather conditions for a location via Google's Weather API
    `currentConditions:lookup` endpoint.

    Parameters:
    - latitude (float): Latitude in decimal degrees.
    - longitude (float): Longitude in decimal degrees.

    Returns:
    - dict | None: Raw JSON on success (None on error). The response can include:
      - currentTime, timeZone, isDaytime
      - weatherCondition (iconBaseUri, description.text, type)
      - temperature, feelsLikeTemperature, dewPoint, heatIndex, windChill
      - relativeHumidity, uvIndex
      - precipitation (probability.percent/type, qpf.quantity/unit)
      - thunderstormProbability
      - airPressure.meanSeaLevelMillibars
      - wind (direction.degrees/cardinal, speed.value/unit, gust.value/unit)
      - visibility.distance/unit, cloudCover
      - currentConditionsHistory (temperatureChange, maxTemperature, minTemperature, qpf)

    Notes:
    - Units default to metric. The API also supports imperial units via the
      `unitsSystem=IMPERIAL` query parameter. If needed, extend this tool to
      accept a `units_system` argument and pass it through.

    Example:
    - get_weather(37.4220, -122.0841)
    """
    url = (
        f"https://weather.googleapis.com/v1/currentConditions:lookup"
        f"?key={GOOGLEMAPS_API_KEY}&location.latitude={latitude}&location.longitude={longitude}"
    )

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

@mcp.tool()
def get_daily_forecast(
    latitude: float,
    longitude: float,
    days: int = None,
    page_size: int = None,
    page_token: str = None,
):
    """
    Get daily forecast (up to 10 days) for a location using Google Weather API.
    Optional parameters:
    - days: number of days to return (1-10)
    - page_size: number of days per page
    - page_token: token from previous response to fetch next page
    """
    url = "https://weather.googleapis.com/v1/forecast/days:lookup"

    params = {
        "key": GOOGLEMAPS_API_KEY,
        "location.latitude": latitude,
        "location.longitude": longitude,
    }
    if days is not None:
        params["days"] = days
    if page_size is not None:
        params["pageSize"] = page_size
    if page_token:
        params["pageToken"] = page_token

    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

@mcp.tool()
def get_hourly_forecast(
    latitude: float,
    longitude: float,
    hours: int = None,
    page_size: int = None,
    page_token: str = None,
):
    """
    Get hourly forecast (up to 240 hours) for a location using Google Weather API.
    Optional parameters:
    - hours: number of hours to return (1-240)
    - page_size: number of hours per page
    - page_token: token from previous response to fetch next page
    """
    url = "https://weather.googleapis.com/v1/forecast/hours:lookup"

    params = {
        "key": GOOGLEMAPS_API_KEY,
        "location.latitude": latitude,
        "location.longitude": longitude,
    }
    if hours is not None:
        params["hours"] = hours
    if page_size is not None:
        params["pageSize"] = page_size
    if page_token:
        params["pageToken"] = page_token

    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

@mcp.tool()
def search_places(query: str):
    """
    Search for places using text queries (e.g., 'Spicy Vegetarian Food in Sydney, Australia').
    Returns display name, address, and price level if available.
    """
    url = "https://places.googleapis.com/v1/places:searchText"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLEMAPS_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.priceLevel"
    }

    payload = {
        "textQuery": query
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None



@mcp.tool()
def search_nearby_places(latitude, longitude, radius=1000, place_type="restaurant", max_results=10):
    """Search for nearby places using Google Places API"""
    url = "https://places.googleapis.com/v1/places:searchNearby"
    
    payload = {
        "includedTypes": [place_type],
        "maxResultCount": max_results,
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": latitude,
                    "longitude": longitude
                },
                "radius": radius
            }
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLEMAPS_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.location,places.types"
    }
    
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"Error: {e}")
        return None


@mcp.tool()
def compute_area_insights(
    insights,
    location_filter,
    type_filter,
    operating_status=None,
    price_levels=None,
    rating_filter=None,
):
    """
    Call Places Aggregate API to compute insights over a geographic area.

    - insights: list of strings, e.g. ["INSIGHT_COUNT"] or ["INSIGHT_PLACES"].
    - location_filter: one of the following shapes:
        {"circle": {"center": {"latLng": {"latitude": <float>, "longitude": <float>}}, "radius": <meters> }}
        {"circle": {"center": {"place": "places/<PLACE_ID>"}, "radius": <meters> }}
        {"region": {"place": "places/<PLACE_ID>"}}
        {"customArea": {"polygon": {"coordinates": [{"latitude": <float>, "longitude": <float>}, ...]}}}
    - type_filter: e.g. {"includedTypes": ["restaurant"], "excludedTypes": [...], "includedPrimaryTypes": [...], "excludedPrimaryTypes": [...]}
    - operating_status: optional list with values like ["OPERATING_STATUS_OPERATIONAL", "OPERATING_STATUS_TEMPORARILY_CLOSED", "OPERATING_STATUS_PERMANENTLY_CLOSED"]
    - price_levels: optional list, e.g. ["PRICE_LEVEL_INEXPENSIVE", "PRICE_LEVEL_MODERATE", ...]
    - rating_filter: optional dict, e.g. {"minRating": 3.5, "maxRating": 5.0}

    Returns the raw JSON response from the API.
    """
    url = "https://areainsights.googleapis.com/v1:computeInsights"
    headers = {
        "X-Goog-Api-Key": GOOGLEMAPS_API_KEY,
        "Content-Type": "application/json",
    }

    request_body = {
        "insights": insights,
        "filter": {
            "locationFilter": location_filter,
            "typeFilter": type_filter,
        },
    }

    if operating_status is not None:
        request_body["filter"]["operatingStatus"] = operating_status
    if price_levels is not None:
        request_body["filter"]["priceLevels"] = price_levels
    if rating_filter is not None:
        request_body["filter"]["ratingFilter"] = rating_filter

    try:
        resp = requests.post(url, headers=headers, json=request_body, timeout=30)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"Error: {e}")
        return None



# NOTE: Dont remove this
# @mcp.tool()
# def validate_address(region_code: str, locality: str, address_lines: list):
#     """
#     Validate an address using Google Address Validation API.
#     Example: region_code='US', locality='Mountain View', address_lines=['1600 Amphitheatre Pkwy']
#     """
#     url = f"https://addressvalidation.googleapis.com/v1:validateAddress?key={GOOGLEMAPS_API_KEY}"

#     headers = {"Content-Type": "application/json"}

#     payload = {
#         "address": {
#             "regionCode": region_code,
#             "locality": locality,
#             "addressLines": address_lines
#         }
#     }

#     try:
#         response = requests.post(url, headers=headers, json=payload, timeout=30)
#         response.raise_for_status()
#         return response.json()
#     except Exception as e:
#         print(f"Error: {e}")
#         return None



if __name__ == "__main__":
    import sys
    # Choose transport by CLI arg: `python server.py stdio` or `python server.py http`
    # Default to stdio when run directly to match client expectations.
    arg = sys.argv[1].lower() if len(sys.argv) > 1 else "stdio"
    transport = "stdio" if arg == "stdio" else "streamable-http"
    mcp.run(transport=transport)