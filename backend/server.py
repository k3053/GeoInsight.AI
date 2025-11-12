from mcp.server.fastmcp import FastMCP
from langchain_community.utilities import SerpAPIWrapper
from dotenv import load_dotenv
import os
import requests
import googlemaps
import overpy
from mongo_connect import save_to_mongodb
from chat_history import create_chat_history
from langchain_core.messages import BaseMessage, AIMessage, HumanMessage 
import json
from typing import List, Dict, Any

load_dotenv()

GOOGLEMAPS_API_KEY = os.getenv("GOOGLEMAPS_API_KEY")
gmaps = googlemaps.Client(key=GOOGLEMAPS_API_KEY)

mcp = FastMCP("Demo")

@mcp.app.get("/history/{user_id}")
def get_user_chat_history(user_id: str) -> List[Dict[str, Any]]:
    """
    Fetches the chat history for a given user ID (session ID) from Astra DB.
    """
    try:
        message_history = create_chat_history(session_id=user_id)
        messages = message_history.messages
        
        # Serialize LangChain messages into a JSON-friendly format
        serialized_messages = []
        for msg in messages:
            content = msg.content if isinstance(msg, BaseMessage) else str(msg)
            
            # Estimate timestamp from object metadata if available (AstraDBChatMessageHistory doesn't expose it easily)
            # For simplicity, we'll use a placeholder date, but for a real app, AstraDB rows should store and return timestamp.
            timestamp = "Unknown Date" 
            
            # Determine role
            if isinstance(msg, HumanMessage):
                role = "user"
            elif isinstance(msg, AIMessage):
                role = "assistant"
            else:
                role = "system"

            # Create a turn object. AstraDB stores HumanMessage/AIMessage pairs
            serialized_messages.append({
                "role": role,
                "content": content,
                # In a production setting, you would retrieve the actual timestamp from the AstraDB row
                "timestamp": timestamp, 
                "date": datetime.now().strftime("%B %d, %Y") # Placeholder
            })
            
        # Group messages into user-assistant pairs (conversational turns)
        history_turns = []
        for i in range(0, len(serialized_messages), 2):
            user_msg = serialized_messages[i] if i < len(serialized_messages) else None
            ai_msg = serialized_messages[i+1] if i + 1 < len(serialized_messages) else {"role": "assistant", "content": "No response recorded.", "date": user_msg["date"]}
            
            if user_msg:
                 # Check if the next message is actually an AI message before pairing
                if ai_msg["role"] == "assistant":
                    history_turns.append({
                        "id": i // 2,
                        "date": user_msg["date"], 
                        "question": user_msg["content"],
                        "answer": ai_msg["content"],
                        "tags": ["GEO", "AI"],
                    })

        return history_turns

    except Exception as e:
        print(f"Error fetching history: {e}")
        # Return an empty list on failure
        return []

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
        data = response.json()
        
        # Save to MongoDB
        query_params = {"latitude": latitude, "longitude": longitude}
        save_to_mongodb("air_quality", data, query_params)
        
        return data
    
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
        data = response.json()
        
        # Save to MongoDB
        query_params = {"latitude": latitude, "longitude": longitude}
        save_to_mongodb("weather", data, query_params)
        
        return data
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
        data = resp.json()
        
        # Save to MongoDB
        query_params = {
            "latitude": latitude, 
            "longitude": longitude,
            "days": days,
            "page_size": page_size,
            "page_token": page_token
        }
        save_to_mongodb("daily_forecast", data, query_params)
        
        return data
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
        data = response.json()
        
        # Save to MongoDB
        query_params = {"query": query}
        save_to_mongodb("places_search", data, query_params)
        
        return data
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
        data = resp.json()
        
        # Save to MongoDB
        query_params = {
            "latitude": latitude,
            "longitude": longitude,
            "radius": radius,
            "place_type": place_type,
            "max_results": max_results
        }
        save_to_mongodb("nearby_places", data, query_params)
        
        return data
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

@mcp.tool()
def count_nearby_buildings(latitude: float, longitude: float, radius_meters: int = 1000):
    """
    Counts buildings and analyzes their types around a specific lat/lon point using OpenStreetMap data.
    
    Parameters:
    - latitude: The latitude of the center point.
    - longitude: The longitude of the center point.
    - radius_meters: The search radius in meters. Defaults to 1000m (1km).
    
    Returns:
    A JSON object (dictionary) with the total building count, a breakdown of building types, and a list of building details.
    """
    api = overpy.Overpass()
    
    # Overpass API query to find buildings within the specified radius
    query = f"""
    [out:json];
    (
        way["building"](around:{radius_meters},{latitude},{longitude});
        relation["building"](around:{radius_meters},{latitude},{longitude});
    );
    out body;
    >;
    out skel qt;
    """
    
    try:
        result = api.query(query)
        
        total_buildings = len(result.ways) + len(result.relations)
        
        building_types = {}
        building_details = []
        
        all_elements = list(result.ways) + list(result.relations)

        for element in all_elements:
            # Get building type, default to 'yes' if not specified
            building_type = element.tags.get("building", "yes")
            building_types[building_type] = building_types.get(building_type, 0) + 1
            
            # Get representative coordinates for each building
            center_node = None
            if hasattr(element, 'center_lat'):
                center_node = {"lat": float(element.center_lat), "lon": float(element.center_lon)}
            elif element.nodes:
                center_node = {"lat": float(element.nodes[0].lat), "lon": float(element.nodes[0].lon)}

            building_details.append({
                "id": element.id,
                "type": building_type,
                "name": element.tags.get("name"),
                "coords": center_node
            })
            
            data = {
                "totalBuildings": total_buildings,
                "buildingTypes": building_types,
                "points": building_details,
                "location": {"lat": latitude, "lon": longitude},
                "radius": radius_meters
            }
            
            # Save to MongoDB
            query_params = {
                "latitude": latitude,
                "longitude": longitude,
                "radius_meters": radius_meters
            }
            save_to_mongodb("buildings", data, query_params)
            
            return data
    
    except Exception as e:
        print(f"Error in count_nearby_buildings: {e}")
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
    from datetime import datetime
    # Choose transport by CLI arg: `python server.py stdio` or `python server.py http`
    # Default to stdio when run directly to match client expectations.
    arg = sys.argv[1].lower() if len(sys.argv) > 1 else "stdio"
    transport = "stdio" if arg == "stdio" else "streamable-http"
    mcp.run(transport=transport)