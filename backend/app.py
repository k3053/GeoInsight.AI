from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from typing import Dict, Optional, Any
import time
from client import run_agent
import asyncio
import logging
import random
import os
import overpy
from mongo_connect import save_to_mongodb, fetch_from_mongodb
from parse_response import parse_agent_response
from data_scraper import scrape_filter_data
from fastapi import Query

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
    
def get_building_data(latitude: float, longitude: float, radius_meters: int = 1000):
    api = overpy.Overpass()
    query = f"""
    [out:json];(way["building"](around:{radius_meters},{latitude},{longitude});
    relation["building"](around:{radius_meters},{latitude},{longitude}););
    out body;>;out skel qt;
    """
    # print("Query:", query)
    try:
        result = api.query(query)
        total_buildings = len(result.ways) + len(result.relations)
        building_details = []
        all_elements = list(result.ways) + list(result.relations)
        for element in all_elements:
            center_node = None
            try:
                # Try to use element.center_lat if available and not None
                if hasattr(element, 'center_lat') and element.center_lat is not None and element.center_lon is not None:
                    center_node = {"lat": float(element.center_lat), "lon": float(element.center_lon)}
                # Otherwise, use the first node if available and has valid coordinates
                elif element.nodes and len(element.nodes) > 0:
                    node = element.nodes[0]
                    if node.lat is not None and node.lon is not None:
                        center_node = {"lat": float(node.lat), "lon": float(node.lon)}
            except Exception as conv_err:
                print(f"Error converting coordinates for element {element.id}: {conv_err}")

            if center_node:
                building_details.append({
                    "id": element.id,
                    "type": element.tags.get("building", "yes"),
                    "name": element.tags.get("name"),
                    "coords": center_node
                })
        # print("Buildings Data:", building_details)
        return {
            "totalBuildings": total_buildings,
            "points": building_details,
        }
    except Exception as e:
        print(f"Error in get_building_data: {e}")
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


# ---------------- Simple In-Memory Cache ----------------
CACHE = {}
CACHE_TTL = 86400  # 24 hours (in seconds)


def get_cache_key(filter_name: str, session_id: Optional[str]):
    return f"{filter_name.lower()}::{session_id or 'default'}"


# ---------------- Core Logic Function ----------------
async def fetch_or_generate_filter_data(body: ChatRequest, filter_name: str):
    """
    Shared logic: tries scraping → fallback to chatbot → saves to MongoDB.
    """
    try:
        city_name = body.message or "Surat"
        print(f"[INFO] Fetching data for {filter_name} at {city_name}")

        # Step 1️⃣ Try scraping
        scraped = scrape_filter_data(filter_name, city_name)

        if scraped and "error" not in scraped:
            save_to_mongodb(
                "filter_responses",
                {
                    "session_id": body.session_id,
                    "filter": filter_name,
                    "scraped_insights": scraped,
                    "location": {"latitude": body.latitude, "longitude": body.longitude},
                    "timestamp": time.time(),
                },
                query_params={"filter": filter_name, "session_id": body.session_id},
            )
            CACHE[get_cache_key(filter_name, body.session_id)] = {
                "data": scraped,
                "timestamp": time.time(),
            }

            return {
                "answer": f"Scraped data for {filter_name}: {scraped}",
                "location": {"latitude": body.latitude, "longitude": body.longitude},
                "insights": scraped,
            }

        # Step 2️⃣ Fallback → chatbot
        print(f"[WARN] Scraper failed, calling chatbot for {filter_name}")
        result = await run_agent(
            f"Provide numeric insights for {filter_name} at this location",
            session_id=body.session_id,
            latitude=body.latitude,
            longitude=body.longitude,
        )

        agent_text = result.get("text", "")
        insights = parse_agent_response(agent_text, filter_name)

        save_to_mongodb(
            "filter_responses",
            {
                "session_id": body.session_id,
                "filter": filter_name,
                "scraped_insights": insights,
                "location": {"latitude": body.latitude, "longitude": body.longitude},
                "timestamp": time.time(),
            },
            query_params={"filter": filter_name, "session_id": body.session_id},
        )

        CACHE[get_cache_key(filter_name, body.session_id)] = {
            "data": insights,
            "timestamp": time.time(),
        }

        return {"answer": agent_text, "location": result.get("location"), "insights": insights}

    except Exception as e:
        logging.exception("fetch_or_generate_filter_data failed")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- Utility Functions ----------------
def get_cache_key(filter_name: str, session_id: Optional[str]):
    return f"{session_id or 'default'}::{filter_name}"


def normalize_location(loc: dict):
    """Ensure consistent field names for response validation."""
    if not loc:
        return None
    if "lat" in loc and "lon" in loc:
        return {"latitude": loc["lat"], "longitude": loc["lon"]}
    elif "latitude" in loc and "longitude" in loc:
        return loc
    else:
        return None


# ---------------- Mock Functions ----------------
def scrape_filter_data(filter_name, city_name):
    """Mock web-scraping or data-fetching."""
    if "precipitation" in filter_name.lower():
        return {"rainfall_mm": 102, "source": "Mock Weather Data"}
    elif "air quality" in filter_name.lower():
        return {"aqi": 68, "status": "Moderate"}
    elif "crime" in filter_name.lower():
        return {"crime_index": 42.7, "safety_level": "Safe"}
    return {"note": f"No scraper implemented for {filter_name}"}


def save_to_mongodb(collection, data, query_params=None):
    print(f"[MOCK-DB] Saved in {collection}: {data}")


def fetch_from_mongodb(collection, filter_query=None, limit=1):
    print(f"[MOCK-DB] Fetching from {collection} with query: {filter_query}")
    return []  # simulate empty DB

async def run_agent(prompt, session_id, latitude, longitude):
    """Mock chatbot/LLM agent response."""
    print(f"[MOCK-AGENT] Running agent for: {prompt}")
    return {
        "text": f"Generated insights for '{prompt}'",
        "location": {"lat": latitude, "lon": longitude},
    }

def parse_agent_response(text, filter_name):
    """Simplified parser to extract key insight text."""
    return {"parsed": f"Insight about {filter_name}", "raw_text": text}


# ---------------- Core Fetch Logic ----------------
async def fetch_or_generate_filter_data(body: ChatRequest, filter_name: str):
    """
    Main logic: generate fresh data using scraper or agent.
    """
    print(f"[FETCH] Generating data for {filter_name}...")

    # 1️⃣ Try web scraper first
    scraped_data = scrape_filter_data(filter_name, body.message)
    if "error" not in scraped_data and "note" not in scraped_data:
        insights = scraped_data
    else:
        # 2️⃣ Else fallback to chatbot/agent logic
        agent_out = await run_agent(
            f"{filter_name} data for {body.message}",
            body.session_id,
            body.latitude,
            body.longitude,
        )
        insights = parse_agent_response(agent_out["text"], filter_name)

    # 3️⃣ Save result to mock DB
    save_to_mongodb(
        "filter_responses",
        {
            "filter": filter_name,
            "session_id": body.session_id,
            "location": {
                "latitude": body.latitude,
                "longitude": body.longitude,
            },
            "scraped_insights": insights,
            "timestamp": time.time(),
        },
    )

    # 4️⃣ Store in cache
    cache_key = get_cache_key(filter_name, body.session_id)
    CACHE[cache_key] = {"data": insights, "timestamp": time.time()}

    return ChatResponse(
        answer=f"Generated new data for {filter_name}",
        location={"latitude": body.latitude, "longitude": body.longitude},
        insights=insights,
    )


# ---------------- POST Route ----------------
@app.post("/chat/filter", response_model=ChatResponse)
async def chat_filter_query(body: ChatRequest, filter_name: str):
    """
    POST route — force-refresh data for a given filter.
    """
    return await fetch_or_generate_filter_data(body, filter_name)


# ---------------- GET Route (Cache + Mock DB) ----------------
@app.get("/chat/filter", response_model=ChatResponse)
async def get_or_fetch_filter_data(
    filter_name: str = Query(..., alias="filter_name"),
    session_id: Optional[str] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
):
    """
    Unified GET endpoint:
      ✅ Step 1: Check in-memory cache
      ✅ Step 2: Check MongoDB
      ✅ Step 3: Auto-fetch fresh data
    """
    cache_key = get_cache_key(filter_name, session_id)
    cached = CACHE.get(cache_key)

    # Step 1️⃣: Memory cache
    if cached and (time.time() - cached["timestamp"] < CACHE_TTL):
        print(f"[CACHE HIT] Returning cached {filter_name}")
        return ChatResponse(
            answer=f"Cached result for {filter_name}",
            location={"latitude": latitude, "longitude": longitude},
            insights=cached["data"],
        )

    # Step 2️⃣: MongoDB mock
    q = {"filter": filter_name}
    if session_id:
        q["session_id"] = session_id

    docs = fetch_from_mongodb("filter_responses", filter_query=q, limit=1)
    if docs:
        doc = docs[0]
        if (time.time() - doc.get("timestamp", 0)) < CACHE_TTL:
            print(f"[MONGO HIT] Returning DB cached {filter_name}")
            CACHE[cache_key] = {
                "data": doc["scraped_insights"],
                "timestamp": time.time(),
            }
            return ChatResponse(
                answer=f"MongoDB cached data for {filter_name}",
                location=normalize_location(doc.get("location")),
                insights=doc["scraped_insights"],
            )

    # Step 3️⃣: Fetch new data
    print(f"[CACHE MISS] Fetching fresh data for {filter_name}")
    body = ChatRequest(
        session_id=session_id or "auto-session",
        message="Surat",
        latitude=latitude or 21.2094892,
        longitude=longitude or 72.8317058,
    )
    return await fetch_or_generate_filter_data(body, filter_name)

# Mount static frontend AFTER defining API routes to avoid intercepting API methods
# app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")
# app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="frontend")