from pymongo import MongoClient
from datetime import datetime
import os
from bson import ObjectId
import json

# MongoDB Configuration
try:
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://deepvgadhiya:OCCWFfX0zy2KkAZ8@cluster0.xp5pd.mongodb.net/")
    client = MongoClient(MONGODB_URI)
    db = client.geoinsight  # database name
except Exception as e:
    print(f"Error: {e}")

def _serialize_doc(doc):
    """Convert ObjectId and non-serializable fields to JSON-friendly types."""
    if not isinstance(doc, dict):
        return doc
    out = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, dict):
            out[k] = _serialize_doc(v)
        else:
            try:
                json.dumps(v)
                out[k] = v
            except Exception:
                out[k] = str(v)
    return out

def fetch_from_mongodb(collection_name: str, filter_query: dict = None, limit: int = 100, sort_field: str = "timestamp", sort_desc: bool = True):
    """
    Fetch documents from MongoDB and return list of JSON-serializable dicts.
    """
    coll = db[collection_name]
    q = filter_query or {}
    cursor = coll.find(q).limit(limit)
    if sort_field:
        sort_dir = -1 if sort_desc else 1
        cursor = coll.find(q).sort(sort_field, sort_dir).limit(limit)
    docs = []
    for d in cursor:
        docs.append(_serialize_doc(d))
    return docs

def save_to_mongodb(collection_name: str, data: dict, query_params: dict = None):
    """
    Save API response to MongoDB with metadata
    """
    if not data:
        return None
        
    collection = db[collection_name]
    
    document = {
        "data": data,
        "query_params": query_params,
        "timestamp": datetime.utcnow()
    }
    
    result = collection.insert_one(document)
    return result.inserted_id