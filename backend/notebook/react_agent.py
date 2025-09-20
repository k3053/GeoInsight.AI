from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import InMemorySaver
from langchain_mcp_adapters.tools import load_mcp_tools
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from langchain_community.utilities import SerpAPIWrapper
from dotenv import load_dotenv
load_dotenv()

def web_search(query: str):
    """This tool does the web search using the users query"""
    search = SerpAPIWrapper(serpapi_api_key=os.getenv("SERPAPI_API_KEY"))
    response = search.run(query)
    return response


checkpointer = InMemorySaver()

model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")

agent = create_react_agent(
    model=model,
    tools=[web_search],
    checkpointer=checkpointer  
)

# Run the agent
config = {"configurable": {"thread_id": "1"}}
sf_response = agent.invoke(
    {"messages": [{"role": "user", "content": "what is google?"}]},
    config  
)
print(sf_response)
ny_response = agent.invoke(
    {"messages": [{"role": "user", "content": "what i asked you?"}]},
    config
)
print(ny_response)