from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict
from client import run_agent
import asyncio
import logging

app = FastAPI(title="Location Intelligence", version="0.1")

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
    mcp_url: str = "http://localhost:8000/mcp"

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

@app.post("/chat/query")
async def chat_query(body: ChatRequest):
    try:
        # If mcp_url is provided, use streamable-http; otherwise spawn stdio server automatically
        result = await run_agent(body.message, body.mcp_url)
        # Normalize response to a simple string for JSON serialization
        final_text = None
        try:
            # LangGraph return often looks like { 'messages': [ BaseMessage... ] }
            if isinstance(result, dict) and "messages" in result:
                msgs = result.get("messages") or []
                if msgs:
                    last = msgs[-1]
                    content = getattr(last, "content", None)
                    if isinstance(content, str):
                        final_text = content
                    elif isinstance(content, list) and content:
                        # Some models return list of content parts
                        # Take text parts if present
                        text_parts = [p.get("text") for p in content if isinstance(p, dict) and p.get("type") == "text"]
                        final_text = "\n".join([t for t in text_parts if t]) or None
        except Exception:
            pass

        if not final_text:
            # Fallback: string-cast the result
            final_text = str(result)

        return {"answer": final_text}
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Agent timed out while processing the request")
    except Exception as e:
        logging.exception("/chat/query failed")
        raise HTTPException(status_code=500, detail=str(e))


