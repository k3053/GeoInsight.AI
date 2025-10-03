from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from typing import Dict, Optional, Any
from client import run_agent
import asyncio
import logging
import os
import overpy

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
    
@app.get("/data/buildings")
def get_building_data(latitude: float, longitude: float, radius_meters: int = 1000):
    api = overpy.Overpass()
    query = f"""
    [out:json];(way["building"](around:{radius_meters},{latitude},{longitude});relation["building"](around:{radius_meters},{latitude},{longitude}););out body;>;out skel qt;
    """
    try:
        result = api.query(query)
        total_buildings = len(result.ways) + len(result.relations)
        building_details = []
        all_elements = list(result.ways) + list(result.relations)
        for element in all_elements:
            center_node = None
            if hasattr(element, 'center_lat'):
                center_node = {"lat": float(element.center_lat), "lon": float(element.center_lon)}
            elif element.nodes:
                center_node = {"lat": float(element.nodes[0].lat), "lon": float(element.nodes[0].lon)}
            building_details.append({
                "id": element.id,
                "type": element.tags.get("building", "yes"),
                "name": element.tags.get("name"),
                "coords": center_node
            })
        return {
            "totalBuildings": total_buildings,
            "points": building_details,
        }
    except Exception as e:
        print(f"Error in get_building_data: {e}")
        return None

@app.get("/data/buildings")
async def get_buildings(lat: float, lon: float, radius: int = 1000):
    """
    Endpoint to get building count and details for a specific location.
    """
    data = get_building_data(latitude=lat, longitude=lon, radius_meters=radius)
    if data is None:
        raise HTTPException(status_code=500, detail="Failed to fetch data from Overpass API")
    return data

# Mount static frontend AFTER defining API routes to avoid intercepting API methods
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")
app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="frontend")