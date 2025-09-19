# Setup virtual environment
- `uv venv myenv`

# Activate virtual environment
- `.\myenv\Scripts\activate`

# Install dependencies
- `pip install -r requirements.txt`
  
# Run FastAPI 
- `fastapi dev app.py`
- or use `uvicorn app:app --reload --host 0.0.0.0 --port 8080`
- or use `uvicorn app:app --reload --port 8080`
