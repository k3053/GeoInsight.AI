from dotenv import load_dotenv
import os

load_dotenv()

from langchain_astradb import AstraDBChatMessageHistory

message_history = AstraDBChatMessageHistory(
    session_id="test-session",
    api_endpoint=os.getenv("ASTRA_DB_API_ENDPOINT"),
    token=os.getenv("ASTRA_DB_TOKEN"),
)

message_history.add_user_message("hi!")

message_history.add_ai_message("hello, how are you?")

print(message_history.messages)