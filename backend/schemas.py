from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    message: str
    session_id: str = "test-session"
    latitude: Optional[float]= None
    longitude: Optional[float] = None
    # mcp_url: str = "http://localhost:8000/mcp"