from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from typing import Dict, Optional, Any
import time
from datetime import datetime
from client import run_agent
import asyncio
import logging
import random
import os
import math
import overpy
from mongo_connect import save_to_mongodb, fetch_from_mongodb
from parse_response import parse_agent_response
from data_scraper import scrape_filter_data
from fastapi import Query
from models_insights import FilterInsight
import json

app = FastAPI(title="Location Intelligence", version="0.1")

DIST_DIR = os.path.join("..", "frontend", "dist")
ASSETS_DIR = os.path.join(DIST_DIR, "assets")


# Enable CORS for browser access (Swagger UI, web apps)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str = "test-session"
    latitude: Optional[float]= None
    longitude: Optional[float] = None
    # mcp_url: str = "http://localhost:8000/mcp"

# A new response model for clarity
class LocationData(BaseModel):
    latitude: float
    longitude: float
    displayName: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    location: Optional[LocationData] = None
    insights: Optional[Dict[str, Any]] = None

@app.get("/")
def read_root():
    return {"message": "Main Page"}

@app.get("/health") 
def health() -> Dict[str, str]:
    """Health check for monitoring and deployment verification"""
    return {
        "status": "ok",
        "service": "Location Intelligence"    
    }

@app.post("/chat/query", response_model=ChatResponse)
async def chat_query(body: ChatRequest):
    try:
        # run_agent now returns a dictionary with 'text' and 'location'
        result = await run_agent(
            body.message, 
            session_id=body.session_id, 
            latitude=body.latitude, 
            longitude=body.longitude
        )

        # Construct the response based on the result from run_agent
        response_data = {
            "answer": result.get("text") or "Sorry, I could not process your request.",
            "location": result.get("location")
        }
        
        return response_data

    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Agent timed out while processing the request")
    except Exception as e:
        logging.exception("/chat/query failed")
        raise HTTPException(status_code=500, detail=str(e))
    
# Multiple Overpass API mirrors (you can add more if needed)
OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.ru/api/interpreter"
]
BUILDING_CATEGORIES = {
    "school": "school",
    "college": "college",
    "university": "college",
    "hospital": "hospital",
    "clinic": "hospital",
    "doctor": "hospital",
    "kindergarten": "school",
    "library": "education",
    "bank": "bank",
    "restaurant": "restaurant",
    "cafe": "restaurant",
    "supermarket": "supermarket",
    "pharmacy": "pharmacy",
    "police": "police",
    "fire_station": "fire_station",
}

def limit_buildings(buildings, max_count=100):
    if len(buildings) > max_count:
        return buildings[:max_count]
    return buildings

def count_building_categories(buildings):
    counts = {}

    for b in buildings:
        tags = b.get("tags", {})
        building_type = tags.get("amenity") or tags.get("building") or ""

        for key, category in BUILDING_CATEGORIES.items():
            if key in building_type.lower():
                counts[category] = counts.get(category, 0) + 1
                break

    return counts

def build_summary_json(lat, lon, radius, buildings, counts):
    return {
        "filter": "Building Density",
        "location": {
            "latitude": lat,
            "longitude": lon
        },
        "radius_meters": radius,
        "building_count": len(buildings),
        "categories": counts,
        "timestamp": time.time()
    }

def save_building_summary(summary_json):
    save_to_mongodb("building_summary", summary_json)

def categorize_buildings(buildings):
    result = {}
    for b in buildings:
        btype = (b.get("type") or "").lower()

        # Try amenity tag if available
        if "amenity" in b:
            btype = b.get("amenity").lower()

        for key, cat in BUILDING_CATEGORIES.items():
            if key in btype:
                result[cat] = result.get(cat, 0) + 1
                break

    return result

def get_building_data(latitude: float, longitude: float, radius_meters: int = 500, max_retries: int = 3):
    # 1️⃣ Check MongoDB Cache First
    tolerance = 0.0005  # ~50m
    q = {
        "latitude": {"$gte": latitude - tolerance, "$lte": latitude + tolerance},
        "longitude": {"$gte": longitude - tolerance, "$lte": longitude + tolerance},
        "radius_meters": radius_meters,
        "filter": "building_summary"
    }

    docs = fetch_from_mongodb("filter_responses", filter_query=q, limit=1)
    if docs:
        print("[Cache] Returning building summary from MongoDB.")
        return docs[0]["data"]

    # 2️⃣ Fetch Raw Buildings via Overpass
    query = f"""
    [out:json];
    (
      way["building"](around:{radius_meters},{latitude},{longitude});
      relation["building"](around:{radius_meters},{latitude},{longitude});
    );
    out body; >; out skel qt;
    """

    endpoints = OVERPASS_ENDPOINTS.copy()
    random.shuffle(endpoints)

    for attempt in range(max_retries):
        for endpoint in endpoints:
            try:
                api = overpy.Overpass(url=endpoint)
                result = api.query(query)

                all_elements = list(result.ways) + list(result.relations)
                building_details = []

                # Convert raw OSM → compact structure
                for element in all_elements:
                    center_node = None
                    try:
                        if hasattr(element, "center_lat") and element.center_lat:
                            center_node = {"lat": float(element.center_lat), "lon": float(element.center_lon)}
                        elif element.nodes:
                            node = element.nodes[0]
                            center_node = {"lat": float(node.lat), "lon": float(node.lon)}
                    except:
                        continue

                    if not center_node:
                        continue

                    b_type = element.tags.get("building", "unknown")

                    building_details.append({
                        "id": element.id,
                        "type": b_type,
                        "lat": center_node["lat"],
                        "lon": center_node["lon"],
                    })

                # 3️⃣ LIMIT buildings to max 100
                building_details = limit_buildings(building_details, max_count=100)

                # 4️⃣ CATEGORY COUNT
                category_counts = categorize_buildings(building_details)

                # 5️⃣ Build Final Summary JSON
                summary = build_summary_json(latitude, longitude, radius_meters, building_details, category_counts)

                # 6️⃣ Save to MongoDB
                record = {
                    "latitude": latitude,
                    "longitude": longitude,
                    "radius_meters": radius_meters,
                    "filter": "building_summary",
                    "data": summary,
                    "timestamp": datetime.utcnow(),
                }

                save_to_mongodb("filter_responses", record)
                print("[Cache] Stored building summary in MongoDB.")

                return summary

            except overpy.exception.OverpassTooManyRequests:
                print(f"[Overpass] Too many requests on {endpoint}, retrying...")
                time.sleep(random.uniform(2, 5))

            except overpy.exception.OverpassGatewayTimeout:
                print(f"[Overpass] Timeout on {endpoint}, retrying...")
                time.sleep(random.uniform(2, 5))

            except Exception as e:
                print(f"[Overpass ERROR] {e}")
                continue

        print(f"[Retry {attempt + 1}/{max_retries}] waiting...")
        time.sleep(2 ** attempt)

    print("[Overpass] All endpoints failed.")
    return None
        
@app.get("/data/buildings")
async def get_buildings(latitude: float, longitude: float):
    """
    Endpoint to get building count and details for a specific location.
    """ 
    data = get_building_data(latitude=latitude, longitude=longitude, radius_meters=1000)
    if data is None:
        raise HTTPException(status_code=500, detail="Failed to fetch data from Overpass API")
    return data

def get_amenity_data(latitude: float, longitude: float, radius_meters: int = 1000, max_retries: int = 3):
    """
    Fetch nearby amenities (schools, colleges, hospitals, etc.) for given coordinates.
    Uses MongoDB caching; if not cached, fetches from Overpass API and stores result.
    """
    tolerance = 0.0005  # ~50 meters tolerance for cache lookup
    q = {
        "latitude": {"$gte": latitude - tolerance, "$lte": latitude + tolerance},
        "longitude": {"$gte": longitude - tolerance, "$lte": longitude + tolerance},
        "radius_meters": radius_meters,
        "type": "amenities"
    }

    docs = fetch_from_mongodb("filter_responses", filter_query=q, limit=1)
    if docs:
        print("[Cache] Returning amenity data from MongoDB cache.")
        return docs[0]["data"]

    # Build Overpass query for key amenities
    query = f"""
    [out:json];
    (
      node["amenity"~"school|college|hospital|pharmacy|bank|restaurant|fuel|park|bus_station|railway_station"](around:{radius_meters},{latitude},{longitude});
      way["amenity"~"school|college|hospital|pharmacy|bank|restaurant|fuel|park|bus_station|railway_station"](around:{radius_meters},{latitude},{longitude});
    );
    out center;
    """

    endpoints = OVERPASS_ENDPOINTS.copy()
    random.shuffle(endpoints)

    for attempt in range(max_retries):
        for endpoint in endpoints:
            try:
                api = overpy.Overpass(url=endpoint)
                result = api.query(query)

                all_elements = list(result.nodes) + list(result.ways)
                amenities = []

                for el in all_elements:
                    try:
                        if hasattr(el, "center_lat") and el.center_lat:
                            lat_c, lon_c = el.center_lat, el.center_lon
                        else:
                            lat_c, lon_c = getattr(el, "lat", None), getattr(el, "lon", None)
                        if not lat_c or not lon_c:
                            continue

                        distance = haversine_distance(latitude, longitude, float(lat_c), float(lon_c))
                        a_type = el.tags.get("amenity", "unknown")
                        a_name = el.tags.get("name")

                        # Filter irrelevant/unlabeled amenities
                        if a_type not in [
                            "school", "college", "hospital", "pharmacy",
                            "bank", "restaurant", "fuel", "park",
                            "bus_station", "railway_station"
                        ]:
                            continue

                        amenities.append({
                            "id": el.id,
                            "type": a_type,
                            "name": a_name,
                            "coords": {"lat": float(lat_c), "lon": float(lon_c)},
                            "distance_m": round(distance, 2)
                        })
                    except Exception as conv_err:
                        print(f"Error parsing amenity {getattr(el, 'id', 'unknown')}: {conv_err}")

                response = {
                    "totalAmenities": len(amenities),
                    "points": amenities
                }

                # Save to MongoDB
                record = {
                    "latitude": latitude,
                    "longitude": longitude,
                    "radius_meters": radius_meters,
                    "type": "amenities",
                    "data": response,
                    "timestamp": datetime.utcnow()
                }
                save_to_mongodb("filter_responses", record)
                print("[Cache] Stored new amenity data in MongoDB.")
                return response

            except overpy.exception.OverpassTooManyRequests:
                print(f"[Overpass] Too many requests on {endpoint}, retrying...")
                time.sleep(random.uniform(2, 5))
            except overpy.exception.OverpassGatewayTimeout:
                print(f"[Overpass] Timeout from {endpoint}, retrying...")
                time.sleep(random.uniform(2, 5))
            except Exception as e:
                if "load too high" in str(e).lower():
                    print(f"[Overpass] Server load too high on {endpoint}, switching endpoint...")
                    time.sleep(random.uniform(3, 7))
                    continue
                else:
                    print(f"[Overpass] Error from {endpoint}: {e}")
                    continue

        print(f"[Retry {attempt+1}/{max_retries}] Waiting before next retry...")
        time.sleep(2 ** attempt)

    print("[Overpass] All endpoints failed after retries.")
    return None

@app.get("/data/amenities")
async def get_amenities(latitude: float, longitude: float):
    """
    Endpoint to get nearby amenities for a specific location.
    Returns school, college, hospital, park, etc.
    """
    data = get_amenity_data(latitude=latitude, longitude=longitude, radius_meters=1000)
    if data is None:
        raise HTTPException(status_code=500, detail="Failed to fetch amenity data from Overpass API")
    return data

# ============================================================
#               FILTER PROCESSING ENGINE — REFACTORED
# ============================================================

CACHE = {}
CACHE_TTL = 86400  # 24 hours


def get_cache_key(filter_name: str, session_id: Optional[str]):
    return f"{(session_id or 'default')}::{filter_name.lower()}"


def normalize_location(loc: Optional[dict]):
    if not loc:
        return None
    try:
        if "latitude" in loc and "longitude" in loc:
            return {"latitude": float(loc["latitude"]), "longitude": float(loc["longitude"])}
        if "lat" in loc and "lon" in loc:
            return {"latitude": float(loc["lat"]), "longitude": float(loc["lon"])}
        if "lat" in loc and "lng" in loc:
            return {"latitude": float(loc["lat"]), "longitude": float(loc["lng"])}
    except:
        return None
    return None


# ============================================================
#                 VALIDATE AGENT OUTPUT USING PYDANTIC
# ============================================================

def validate_agent_output(agent_text: str, filter_name: str):
    """
    agent_text may be:
        - valid JSON
        - partial JSON
        - natural language text
    This function ALWAYS returns a valid FilterInsight dict.
    """
    raw = None
    try:
        raw = json.loads(agent_text)
    except:
        parsed = parse_agent_response(agent_text, filter_name)
        validated = FilterInsight(**parsed)

    # strict Pydantic validation — guarantees JSON shape
    try:
        validated = FilterInsight(**raw)
    except:
        # fallback: parse manually
        parsed = parse_agent_response(agent_text, filter_name)
        validated = FilterInsight(**parsed)

    return validated.model_dump()


# ============================================================
#                   SCRAPER + AGENT COMBINED FLOW
# ============================================================

async def fetch_or_generate_filter_data(body: ChatRequest, filter_name: str):
    try:
        print(f"[FETCH] Generating data for {filter_name} (session={body.session_id})")

        # -----------------------------------------------------
        # 1) SCRAPER TRY
        # -----------------------------------------------------
        scraped = scrape_filter_data(filter_name, body.message or "")

        if scraped and "error" not in scraped and "note" not in scraped:
            print(f"[SCRAPER SUCCESS] {filter_name}")
            insights = scraped
            agent_text = None
            location = {
                "latitude": body.latitude,
                "longitude": body.longitude
            }
            source = "scraper"

        else:
            # -----------------------------------------------------
            # 2) AGENT FALLBACK (NO JSON PROMPT NEEDED)
            # -----------------------------------------------------
            prompt = f"""
                You MUST return ONLY a raw JSON object.

                ABSOLUTE RULES (follow strictly):
                - Do NOT call any tools.
                - Do NOT output {{\"name\": \"...\", \"arguments\": ...}} format.
                - Do NOT output markdown.
                - Do NOT output explanations.
                - Do NOT output text outside the JSON object.

                Return {filter_name} data in EXACTLY this structure:

                {{
                "latitude": <float>,
                "longitude": <float>,
                "bounding_box": [<min_lat>, <max_lat>, <min_lon>, <max_lon>],
                "years": {{
                    "2018": <float>,
                    "2019": <float>,
                    "2020": <float>,
                    "2021": <float>,
                    "2022": <float>,
                    "2023": <float>
                }},
                "data": <float>,
                "dataset": "<string>",
                "source": "<string>",
                "summary": "<string>"
                }}

                STRICT DATA RULES:
                - Use the user's latitude and longitude as the center.
                - bounding_box must be +/- 0.05 degrees around the given coordinates.
                - NO nested objects inside "years".
                - Each year must be a single float between 0 and 1.
                - "data" must equal the 2023 value (latest value).
                - Round all numbers to 2 decimals.
                - Summary must be exactly one sentence.
                - NO extra fields.
                - NO markdown.
                - NO tool calls.
                - The output must be ONLY the JSON object.
            """


            print(f"[AGENT] Calling agent for {filter_name}")

            agent_result = await run_agent(
                prompt,
                session_id=body.session_id,
                latitude=body.latitude,
                longitude=body.longitude
            )

            agent_text = agent_result.get("text", "") or ""
            validated_json = validate_agent_output(agent_text, filter_name)

            insights = validated_json
            location = normalize_location(validated_json) or {
                "latitude": body.latitude,
                "longitude": body.longitude
            }
            source = "agent"

        # -----------------------------------------------------
        # 3) STORE INTO MONGODB (UPSERT)
        # -----------------------------------------------------
        doc = {
            "filter": filter_name,
            "session_id": body.session_id,
            "location": location,
            "insights": insights,
            "agent_text": agent_text,
            "source": source,
            "timestamp": time.time(),
        }

        print("Fetched Document: ", doc)

        try:
            save_to_mongodb(
                "filter_responses",
                doc,
                query_params={"filter": filter_name, "session_id": body.session_id},
            )
        except:
            logging.exception("[MONGO ERROR] Failed to save filter")

        # -----------------------------------------------------
        # 4) UPDATE CACHE
        # -----------------------------------------------------
        cache_key = get_cache_key(filter_name, body.session_id)
        CACHE[cache_key] = {
            "data": insights,
            "timestamp": time.time(),
            "location": location,
        }

        # -----------------------------------------------------
        # 5) FINAL RESPONSE (Frontend expects this)
        # -----------------------------------------------------
        return {
            "answer": agent_text or f"Scraped data for {filter_name}",
            "location": location,
            "insights": insights,
        }

    except Exception as e:
        logging.exception("fetch_or_generate_filter_data failed")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
#                    GET /chat/filter (CACHE FLOW)
# ============================================================

# @app.get("/chat/filter", response_model=ChatResponse)
# async def get_or_fetch_filter_data(
#     filter_name: str = Query(..., alias="filter_name"),
#     session_id: Optional[str] = Query(None),
#     latitude: Optional[float] = Query(None),
#     longitude: Optional[float] = Query(None),
# ):
#     cache_key = get_cache_key(filter_name, session_id)

#     # --------------------------------------
#     # 1) CHECK MEMORY CACHE
#     # --------------------------------------
#     cached = CACHE.get(cache_key)
#     if cached and (time.time() - cached["timestamp"] < CACHE_TTL):
#         print(f"[CACHE HIT] {filter_name}")
#         return {
#             "answer": f"Cached result for {filter_name}",
#             "location": cached["location"],
#             "insights": cached["data"],
#         }

#     # --------------------------------------
#     # 2) CHECK MONGODB CACHE
#     # --------------------------------------
#     query = {"filter": filter_name}
#     if session_id:
#         query["session_id"] = session_id

#     docs = fetch_from_mongodb("filter_responses", filter_query=query, limit=1)
#     if docs:
#         print(f"[MONGO HIT] {filter_name}")
#         doc = docs[0]

#         CACHE[cache_key] = {
#             "data": doc.get("insights"),
#             "location": normalize_location(doc.get("location")),
#             "timestamp": time.time(),
#         }

#         return {
#             "answer": f"MongoDB cached data for {filter_name}",
#             "location": normalize_location(doc.get("location")),
#             "insights": doc.get("insights"),
#         }

#     # --------------------------------------
#     # 3) GENERATE FRESH DATA
#     # --------------------------------------
#     body = ChatRequest(
#         session_id=session_id or "auto-session",
#         message="Surat",
#         latitude=latitude or 21.2094892,
#         longitude=longitude or 72.8317058,
#     )

#     return await fetch_or_generate_filter_data(body, filter_name)

@app.post("/chat/filter", response_model=ChatResponse)
async def chat_filter_query(
    body: ChatRequest,
    filter_name: str = Query(..., alias="filter_name"),
):
    cache_key = get_cache_key(filter_name, body.session_id)

    # --------------------------------------
    # 1) CHECK MEMORY CACHE
    # --------------------------------------
    # cached = CACHE.get(cache_key)
    # if cached and (time.time() - cached["timestamp"] < CACHE_TTL):
    #     print(f"[CACHE HIT] {filter_name}")
    #     return {
    #         "answer": f"Cached result for {filter_name}",
    #         "location": cached["location"],
    #         "insights": cached["data"],
    #     }

    # --------------------------------------
    # 2) CHECK MONGODB CACHE
    # --------------------------------------
    tolerance = 0.045  # roughly ~5km latitude/longitude tolerance
    query = {
        "location.latitude": {"$gte": body.latitude - tolerance, "$lte": body.latitude + tolerance},
        "location.longitude": {"$gte": body.longitude - tolerance, "$lte": body.longitude + tolerance},
        "filter": filter_name,
    }
    # if body:
    #     query["session_id"] = body.session_id
    #     query["latitude"] = body.latitude
    #     query["longitude"] = body.longitude

    docs = fetch_from_mongodb("filter_responses", filter_query=query, limit=1)
    if docs:
        print(f"[MONGO HIT] {filter_name}")
        doc = docs[0]

        CACHE[cache_key] = {
            "data": doc.get("insights"),
            "location": normalize_location(doc.get("location")),
            "timestamp": time.time(),
        }

        return {
            "answer": f"MongoDB cached data for {filter_name}",
            "location": normalize_location(doc.get("location")),
            "insights": doc.get("insights"),
        }

    # --------------------------------------
    # 3) GENERATE FRESH DATA
    # --------------------------------------
    body = ChatRequest(
        session_id=body.session_id or "auto-session",
        message="Surat",
        latitude=body.latitude or 21.2094892,
        longitude=body.longitude or 72.8317058,
    )

    return await fetch_or_generate_filter_data(body, filter_name)

# Mount static frontend AFTER defining API routes to avoid intercepting API methods
# app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")
# app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="frontend")