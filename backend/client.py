from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.client.streamable_http import streamablehttp_client
from langchain_mcp_adapters.tools import load_mcp_tools
from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.memory import InMemorySaver
# Import message types to format the history
from langchain_core.messages import HumanMessage, AIMessage
from typing import List, Dict, Any
import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import json

load_dotenv()

# Ensure the GOOGLE_API_KEY is used
model = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash-latest",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

# This function converts the simple JSON from the frontend to LangChain's message format
def format_chat_history(chat_history: List[Dict[str, Any]]):
    messages = []
    for message in chat_history:
        if message.get("sender") == "user":
            messages.append(HumanMessage(content=message.get("text")))
        elif message.get("sender") == "assistant":
            messages.append(AIMessage(content=message.get("text")))
    return messages


# Updated function signature to accept history and chat_id
async def run_agent(
    message: str, 
    chat_history: List[Dict[str, Any]], 
    chat_id: str | None,
    mcp_url: str = "http://localhost:8000/mcp"
):
    # Convert the received history into LangChain's format
    formatted_history = format_chat_history(chat_history)
    # Add the new user message to the history
    formatted_history.append(HumanMessage(content=message))

    async def _execute_agent(session):
        tools = await load_mcp_tools(session)
        agent = create_react_agent(model, tools)
        
        async def _invoke():
            # Invoke the agent with the complete message history
            return await agent.ainvoke({"messages": formatted_history})
            
        return await asyncio.wait_for(_invoke(), timeout=30)

    if mcp_url:
        try:
            async def _run_over_http():
                async with streamablehttp_client(mcp_url) as (read_stream, write_stream, _):
                    async with ClientSession(read_stream, write_stream) as session:
                        await session.initialize()
                        return await _execute_agent(session)
            return await asyncio.wait_for(_run_over_http(), timeout=8)
        except Exception:
            # Fallback to stdio if HTTP MCP is unreachable
            pass

    python_exe = sys.executable or "python"
    server_path = str(Path(__file__).parent / "server.py")
    server_params = StdioServerParameters(command=python_exe, args=[server_path, "stdio"])
    
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            return await _execute_agent(session)

# Main execution block remains the same for testing
if __name__ == "__main__":
    test_message = os.environ.get("TEST_MESSAGE", "What is 5 * 12?")
    test_mcp_url = os.environ.get("MCP_URL", "http://localhost:8000/mcp")
    # Note: When running directly, chat_history and chat_id will be empty/None
    result = asyncio.run(run_agent(test_message, [], None, test_mcp_url))
    
    messages = result.get('messages', [])
    if messages:
        last_message = messages[-1]
        if hasattr(last_message, 'content') and last_message.content:
            print(f"\nAnswer: {last_message.content}")
        else:
            print("\nNo final answer found.")
    else:
        print("\nNo messages received.")