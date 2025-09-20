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
# checkpointer = InMemorySaver()

# NOTE: using stdio (Dont remove this)

# server_params = StdioServerParameters(
#     command="python",
#     # Make sure to update to the full absolute path to your math_server.py file
#     args=["server.py"],
    
# )

# # async def run_agent():
# #     async with stdio_client(server_params) as (read, write):
# #         async with ClientSession(read, write) as session:
# #             # Initialize the connection
# #             await session.initialize()

# #             # Get tools
# #             tools = await load_mcp_tools(session)

# #             # Create and run the agent
# #             agent = create_react_agent(model, tools)
# #             # agent_response = await agent.ainvoke({"messages": "what's (3 + 5) x 12?"})
# #             agent_response = await agent.ainvoke({"messages": "What is 5 * 2 and then add it to 10"})
# #             return agent_response


# NOTE: using streamable-http

async def run_agent(message: str):
    # if mcp_url:
    #     try:
    #         async def _run_over_http():
    #             async with streamablehttp_client(mcp_url) as (
    #                 read_stream,
    #                 write_stream,
    #                 _
    #             ):
    #                 async with ClientSession(read_stream, write_stream) as session:
    #                     await session.initialize()
    #                 tools = await load_mcp_tools(session)
    #                 agent = create_react_agent(model, tools)
    #                 # Bound overall agent run to avoid hanging forever
    #                 async def _invoke():
    #                     return await agent.ainvoke({"messages": message})
    #                 return await asyncio.wait_for(_invoke(), timeout=30)

    #         # Bound the HTTP connection/setup time to avoid hanging on wrong URLs
    #         return await asyncio.wait_for(_run_over_http(), timeout=8)
    #     except Exception:
    #         # Fallback to stdio if HTTP MCP is unreachable
    #         pass

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
    # Example CLI usage
    # import os
    # test_message = os.environ.get("TEST_MESSAGE", "Hello")
    # test_mcp_url = os.environ.get("MCP_URL", "http://localhost:8000/mcp")
    # result = asyncio.run(run_agent(test_message, test_mcp_url))
    
    # # Extract the final answer from the last message
    # messages = result['messages']
    # if messages and len(messages) > 0:
    #     last_message = messages[-1]
    #     if hasattr(last_message, 'content') and last_message.content:
    #         print(f"\nAnswer: {last_message.content}")
    #     else:
    #         print("\nNo final answer found.")
    # else:
    #     print("\nNo messages received.")




