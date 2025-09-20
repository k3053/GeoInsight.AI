from langchain_astradb import AstraDBChatMessageHistory
from dotenv import load_dotenv
import os

load_dotenv()

def create_chat_history(session_id: str = "test-session"):
    message_history = AstraDBChatMessageHistory(
        session_id=session_id,
        api_endpoint=os.getenv("ASTRA_DB_API_ENDPOINT"),
        token=os.getenv("ASTRA_DB_TOKEN"),
    )
    return message_history


if  __name__ == "__main__":
    pass
    message_history = create_chat_history()
    # message_history.add_user_message("Meet here ")
    # message_history.add_ai_message("hello, how are you?")
    # print(str(message_history))
    print(message_history.messages)