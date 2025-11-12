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

# __________________________Implementation of Filter's Endpoints______________________
CACHE={}
CACHE_TTL=86400  # 24 hours
def get_cache_key(filter_name: str, session_id: Optional[str]):
    return f"{(session_id or 'default')}::{filter_name.lower()}"

def normalize_location(loc: Optional[dict]):
    """Return {'latitude': float, 'longitude': float} or None"""
    if not loc:
        return None
    # accept either set
    if "latitude" in loc and "longitude" in loc:
        try:
            return {"latitude": float(loc["latitude"]), "longitude": float(loc["longitude"])}
        except Exception:
            return None
    if "lat" in loc and "lon" in loc:
        try:
            return {"latitude": float(loc["lat"]), "longitude": float(loc["lon"])}
        except Exception:
            return None
    # fallback: maybe lat/lng keys
    if "lat" in loc and "lng" in loc:
        try:
            return {"latitude": float(loc["lat"]), "longitude": float(loc["lng"])}
        except Exception:
            return None
    return None

async def fetch_or_generate_filter_data(body: ChatRequest, filter_name: str):
    """
    Unified logic:
     - check memory cache (done by caller if desired)
     - try scraper
     - if scraper fails, call agent
     - prefer structured JSON from agent (fallback to text parser)
     - normalize location
     - save to MongoDB (upsert)
     - write to cache
     - return dict compatible with ChatResponse
    """
    try:
        print(f"[FETCH] Generating data for {filter_name} (session={body.session_id})")

        # 1) Try scraping first
        scraped = scrape_filter_data(filter_name, body.message or "")
        if scraped and "error" not in scraped and "note" not in scraped:
            insights = scraped
            agent_location = normalize_location({
                "latitude": body.latitude,
                "longitude": body.longitude
            })
            agent_text = None
        else:
            # 2) Fallback to agent
            prompt = (
                f"Provide detailed {filter_name} data and relevant geospatial insights for "
                f"{body.message or 'the specified location'}. "
                f"Respond ONLY with valid JSON that is compatible with json.loads() function of python in the format similar to:\n\n"
                f"{{\n"
                f'  "latitude": <float>,\n'
                f'  "longitude": <float>,\n'
                f'  "bounding_box": [<min_lat>, <max_lat>, <min_lon>, <max_lon>],\n'
                f'  "years": <object>,\n' # Only for Temporal Data
                f'  "data": <float>,\n'
                f'  "dataset": "<string>",\n'
                f'  "source": "<string>",\n'
                f'  "summary": "<short text description>"\n'
                f"}}\n\n"
                f"If you are unsure of any field, set it to null and Add any missing key-value pair which is critical for the said context."
            )

            print(f"[INFO] Scraper not available for {filter_name}, calling agent with prompt: {prompt}")
            agent_result = await run_agent(
                prompt,
                session_id=body.session_id,
                latitude=body.latitude,
                longitude=body.longitude,
            )

            # agent_result.get("text") may already be JSON
            agent_text = agent_result.get("text", "").strip()
            parsed_insights = None

            # 3) Try to parse JSON directly
            try:
                parsed_insights = json.loads(agent_text)
                if not isinstance(parsed_insights, dict):
                    raise ValueError("Agent JSON is not an object")
                print("[INFO] Successfully parsed agent JSON")
            except Exception as e:
                logging.warning(f"Agent response not valid JSON: {e}")
                # fallback: use your existing parser
                parsed_insights = parse_agent_response(agent_text, filter_name)

            # 4) Normalize location
            agent_location = normalize_location(parsed_insights or agent_result.get("location"))

        # 5) Prepare document for MongoDB
        doc = {
            "filter": filter_name,
            "session_id": body.session_id,
            "location": agent_location or {
                "latitude": body.latitude,
                "longitude": body.longitude,
            },
            "insights": insights if scraped and "error" not in scraped and "note" not in scraped else parsed_insights,
            "agent_text": agent_text,
            "source": "scraper" if (scraped and "error" not in scraped and "note" not in scraped) else "agent",
            "timestamp": time.time(),
        }

        # 6) Save to MongoDB (upsert)
        try:
            save_to_mongodb(
                "filter_responses",
                doc,
                query_params={"filter": filter_name, "session_id": body.session_id},
            )
            print(f"[DB] Saved filter {filter_name} for session {body.session_id}")
        except Exception:
            logging.exception("Failed to save filter response to MongoDB")

        # 7) Cache the result
        cache_key = get_cache_key(filter_name, body.session_id)
        CACHE[cache_key] = {
            "data": doc["insights"],
            "timestamp": time.time(),
            "location": doc["location"],
        }

        # 8) Build response
        response = {
            "answer": agent_text or f"Scraped data for {filter_name}",
            "location": doc["location"],
            "insights": doc["insights"],
        }
        return response

    except Exception as e:
        logging.exception("fetch_or_generate_filter_data failed")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- Use in your routes -----------------
# POST /chat/filter (force refresh) should call the unified function and return its dict
@app.post("/chat/filter", response_model=ChatResponse)
async def chat_filter_query(body: ChatRequest, filter_name: str):
    return await fetch_or_generate_filter_data(body, filter_name)

# GET /chat/filter should consult cache / mongo / then call unified fetch function
@app.get("/chat/filter", response_model=ChatResponse)
async def get_or_fetch_filter_data(
    filter_name: str = Query(..., alias="filter_name"),
    session_id: Optional[str] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
):
    cache_key = get_cache_key(filter_name, session_id)
    cached = CACHE.get(cache_key)

    if cached and (time.time() - cached["timestamp"] < CACHE_TTL):
        print(f"[CACHE HIT] Returning cached {filter_name}")
        return {
            "answer": f"Cached result for {filter_name}",
            "location": cached.get("location"),
            "insights": cached["data"],
        }

    # Try Mongo
    q = {"filter": filter_name}
    if session_id:
        q["session_id"] = session_id

    docs = fetch_from_mongodb("filter_responses", filter_query=q, limit=1)
    if docs:
        doc = docs[0]
        if (time.time() - doc.get("timestamp", 0)) < CACHE_TTL:
            print(f"[MONGO HIT] Returning DB cached {filter_name}")
            CACHE[cache_key] = {"data": doc["scraped_insights"], "timestamp": time.time(), "location": normalize_location(doc.get("location"))}
            return {
                "answer": f"MongoDB cached data for {filter_name}",
                "location": normalize_location(doc.get("location")),
                "insights": doc["scraped_insights"],
            }

    # Finally: fetch/generate fresh data
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