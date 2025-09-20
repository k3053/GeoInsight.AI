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
import json

load_dotenv()

model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")

async def run_agent(message: str):
    # Spawn server.py using stdio transport with absolute paths and current Python
    python_exe = sys.executable or "python"
    server_path = str(Path(__file__).parent / "server.py")
    server_params = StdioServerParameters(
        command=python_exe,
        args=[server_path, "stdio"],
    )
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await load_mcp_tools(session)
            agent = create_react_agent(model, tools)
            async def _invoke():
                return await agent.ainvoke({"messages": message})
            agent_response = await asyncio.wait_for(_invoke(), timeout=30)
            return agent_response


# Run the async function
if __name__ == "__main__":
    pass


