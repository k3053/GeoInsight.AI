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

load_dotenv()

model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
checkpointer = InMemorySaver()

async def run_agent(message: str, session_id: str = "test-session", latitude: str = None, longitude: str = None):
    
    # Spawn server.py using stdio transport with absolute paths and current Python
    python_exe = sys.executable or "python"
    server_path = str(Path(__file__).parent / "server.py")
    server_params = StdioServerParameters(
        command=python_exe,
        args=[server_path, "stdio"],
    )

    # Create per-session chat history only for persistence (do not feed to agent)
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
                config = {"configurable": {"thread_id": "1"}}
                
                # Create context with location if provided
                context = {"messages": message}
                if latitude and longitude:
                    context["location"] = {
                        "latitude": latitude,
                        "longitude": longitude
                    }
                
                # Pass message and location context to the agent
                return await agent.ainvoke(context, config=config)
            
            agent_response = await asyncio.wait_for(_invoke(), timeout=30)

            # Extract only the assistant's text from the response
            def _extract_text(result):
                try:
                    # Shape: { 'messages': [ BaseMessage... ] }
                    if isinstance(result, dict) and "messages" in result:
                        msgs = result.get("messages") or []
                        if msgs:
                            last = msgs[-1]
                            content = getattr(last, "content", None)
                            if isinstance(content, str):
                                return content
                            if isinstance(content, list) and content:
                                text_parts = [p.get("text") for p in content if isinstance(p, dict) and p.get("type") == "text"]
                                combined = "\n".join([t for t in text_parts if t])
                                if combined:
                                    return combined
                    # Shape: direct AIMessage/BaseMessage
                    if hasattr(result, "content"):
                        content = getattr(result, "content", None)
                        if isinstance(content, str):
                            return content
                        if isinstance(content, list) and content:
                            text_parts = [p.get("text") for p in content if isinstance(p, dict) and p.get("type") == "text"]
                            combined = "\n".join([t for t in text_parts if t])
                            if combined:
                                return combined
                    # Already a string
                    if isinstance(result, str):
                        return result
                except Exception:
                    pass
                # Fallback
                return str(result)

            final_text = _extract_text(agent_response)

            # Persist the turn with clean text only (history not used for agent input)
            chat_history.add_user_message(message)
            chat_history.add_ai_message(final_text)
            return final_text


# Run the async function
if __name__ == "__main__":
    pass
