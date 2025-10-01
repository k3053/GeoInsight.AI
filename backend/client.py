# Create server parameters for stdio connection
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.client.streamable_http import streamablehttp_client
from langchain_mcp_adapters.tools import load_mcp_tools
from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.memory import InMemorySaver
import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from prompt_library import REACT_AGENT_PROMPT
from chat_history import create_chat_history
import json
from langgraph.checkpoint.memory import InMemorySaver
from langchain_groq import ChatGroq

load_dotenv()

# model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
model = ChatGroq(model="openai/gpt-oss-120b")

checkpointer = InMemorySaver()

def _extract_final_response(agent_response):
    """Extracts text and location data from the agent's full response."""
    final_text = None
    location_data = None
    
    try:
        # Standard text extraction from the last message
        if isinstance(agent_response, dict) and "messages" in agent_response:
            last_message = agent_response.get("messages", [])[-1]
            if hasattr(last_message, "content"):
                final_text = last_message.content

        # Look for location data from tool outputs
        # The agent's intermediate steps contain tool call results
        intermediate_steps = agent_response.get("messages", [])
        for step in reversed(intermediate_steps):
            if hasattr(step, "tool_calls") and step.tool_calls:
                for tool_call in step.tool_calls:
                    # If the geocoding tool was called, extract its result
                    if tool_call.get("name") == "geocode_address":
                        # The tool output is often a stringified list of dicts
                        tool_output_str = str(tool_call.get("output", ""))
                        try:
                            # Parse the string to get the actual data
                            geocode_result = json.loads(tool_output_str.replace("'", "\""))
                            if geocode_result and isinstance(geocode_result, list):
                                first_result = geocode_result[0]
                                loc = first_result.get("geometry", {}).get("location", {})
                                if loc:
                                    location_data = {
                                        "latitude": loc.get("lat"),
                                        "longitude": loc.get("lng"),
                                        "displayName": first_result.get("formatted_address")
                                    }
                                    # Stop after finding the first valid location
                                    return {"text": final_text, "location": location_data}
                        except (json.JSONDecodeError, IndexError):
                            continue # Ignore if parsing fails
                            
    except Exception:
        pass # Fallback if extraction fails

    # Fallback to string casting if we couldn't find a clean text response
    if not final_text:
        final_text = str(agent_response)
        
    return {"text": final_text, "location": location_data}


async def run_agent(message: str, session_id: str = "test-session", latitude: float = None, longitude: float = None):
    python_exe = sys.executable or "python"
    server_path = str(Path(__file__).parent / "server.py")
    server_params = StdioServerParameters(
        command=[python_exe, server_path, "stdio"],
    )

    chat_history = create_chat_history(session_id)

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await load_mcp_tools(session)
            
            agent = create_react_agent(
                model,
                tools,
                prompt=REACT_AGENT_PROMPT,
                checkpointer=checkpointer
            )

            async def _invoke():
                config = {"configurable": {"thread_id": session_id}} # Use dynamic session_id
                
                # Construct input message with context
                input_data = {"messages": [("user", message)]}
                if latitude and longitude:
                    # Add location context for the agent to use
                    location_context = f"\n\n--- Location Context ---\nThe user has pinpointed a location on the map at: Latitude={latitude}, Longitude={longitude}. Use these coordinates for any location-based queries unless they specify a different location in their message.\n--- End Location Context ---"
                    input_data["messages"] = [("user", message + location_context)]
                
                return await agent.ainvoke(input_data, config=config)

            agent_response = await asyncio.wait_for(_invoke(), timeout=60)

            # Extract both text and location data
            processed_response = _extract_final_response(agent_response)

            # Persist the turn to chat history
            chat_history.add_user_message(message)
            if processed_response["text"]:
                chat_history.add_ai_message(processed_response["text"])

            return processed_response