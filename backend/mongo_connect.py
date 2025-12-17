from pymongo import MongoClient, UpdateOne
import certifi
from datetime import datetime
from bson import ObjectId
import json, os

# MONGODB_URI = os.getenv("MONGO_URI")
MONGODB_URI = "mongodb+srv://deepvgadhiya:OCCWFfX0zy2KkAZ8@cluster0.xp5pd.mongodb.net/"
client = MongoClient(
    MONGODB_URI
)
print("MONGO Connection Info:-", client.server_info())
db = client.geoinsight


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
    """Fetch documents from MongoDB and return list of JSON-serializable dicts."""
    coll = db[collection_name]
    q = filter_query or {}
    sort_dir = -1 if sort_desc else 1
    cursor = coll.find(q).sort(sort_field, sort_dir).limit(limit)
    return [_serialize_doc(d) for d in cursor]


def save_to_mongodb(collection_name: str, data: dict, query_params: dict = None):
    """
    Save (or upsert) API response to MongoDB.
    If query_params provided, upsert based on those fields.
    """
    if not data:
        print("[DB] No data to save")
        return None

    collection = db[collection_name]
    data["timestamp"] = datetime.utcnow()

    try:
        if query_params:
            result = collection.update_one(query_params, {"$set": data}, upsert=True)
            if result.upserted_id:
                print(f"[DB] Inserted new document for {query_params}")
            elif result.modified_count:
                print(f"[DB] Updated existing document for {query_params}")
            else:
                print(f"[DB] No change (data identical) for {query_params}")
            return result.upserted_id or result.modified_count
        else:
            result = collection.insert_one(data)
            print(f"[DB] Inserted new document (no query params)")
            return result.inserted_id
    except Exception as e:
        print(f"[DB ERROR] {e}")
        return None
