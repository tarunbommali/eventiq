"""Quick test: get recommendations for all users and show event titles."""
import os
import requests
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URL"))
db = client[os.getenv("DB_NAME", "test")]

users = list(db.users.find({}, {"_id": 1, "name": 1}))
for u in users:
    uid = str(u["_id"])
    name = u.get("name", "?")
    r = requests.get(f"http://localhost:8000/recommend/{uid}")
    data = r.json()
    print(f"\n--- {name} ({uid}) ---")
    print(f"Source: {data.get('source', 'N/A')}")
    recs = data.get("recommended_event_ids", [])
    if recs:
        evs = list(db.events.find({"_id": {"$in": [ObjectId(e) for e in recs]}}, {"title": 1}))
        for ev in evs:
            print(f"  -> {ev['title']}")
    else:
        print("  (no recommendations)")

client.close()
