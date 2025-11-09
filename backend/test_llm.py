from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()


model = ChatGoogleGenerativeAI(model="gemini-2.0-flash")
# model = ChatGroq(model="openai/gpt-oss-120b")

print(model.invoke("wehat is google in one word"))