"""
FastAPI ML Recommendation Microservice
Provides event recommendations based on user interaction history.
Uses TF-IDF content-based filtering on event categories and descriptions.
"""

import os
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
import pickle
import logging
import numpy as np

load_dotenv()

# ── Configuration ────────────────────────────────────────────────────
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://mongo:27017/eventbooking")
DB_NAME = os.getenv("DB_NAME", "test")
MODEL_PATH = os.getenv("MODEL_PATH", "model.pkl")
ML_API_KEY = os.getenv("ML_API_KEY", "")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173"
).split(",")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Model loaded once at startup ─────────────────────────────────────
_model = None

def _load_model_from_disk():
    """Load the trained recommendation model if available."""
    try:
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, "rb") as f:
                return pickle.load(f)
    except Exception as e:
        logger.warning(f"Could not load model: {e}")
    return None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML model once at startup instead of per-request."""
    global _model
    _model = _load_model_from_disk()
    if _model:
        logger.info("ML model loaded successfully at startup")
    else:
        logger.info("No ML model found, will use fallback recommendations")
    yield
    logger.info("ML service shutting down")

app = FastAPI(title="Event Recommendation Service", version="1.0.0", lifespan=lifespan)

# CORS — restricted to known origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# MongoDB connection
client = MongoClient(MONGODB_URL)
db = client[DB_NAME]


# ── API Key Authentication ───────────────────────────────────────────
async def verify_api_key(x_api_key: str = Header(default="")):
    """Verify the API key if ML_API_KEY is configured."""
    if ML_API_KEY and x_api_key != ML_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return True


@app.get("/")
def health_check():
    return {"status": "ok", "service": "ml-recommendation"}


def _recommend_from_model(user_id: str, n: int = 10):
    """Compute recommendations from the trained TF-IDF similarity model."""
    similarity_matrix = _model["similarity_matrix"]
    event_ids = _model["event_ids"]
    event_id_to_idx = _model["event_id_to_idx"]
    user_scores = _model["user_scores"]

    if user_id not in user_scores:
        return []

    scores = user_scores[user_id]
    interacted_indices = []
    weights = []

    for eid, score in scores.items():
        if eid in event_id_to_idx:
            interacted_indices.append(event_id_to_idx[eid])
            weights.append(score)

    if not interacted_indices:
        return []

    weights = np.array(weights, dtype=float)
    weights /= weights.sum()

    combined_scores = np.zeros(len(event_ids))
    for idx, weight in zip(interacted_indices, weights):
        combined_scores += weight * similarity_matrix[idx]

    for idx in interacted_indices:
        combined_scores[idx] = -1

    top_indices = combined_scores.argsort()[::-1][:n]
    return [event_ids[i] for i in top_indices if combined_scores[i] > 0]


@app.get("/recommend/{user_id}")
def recommend_events(user_id: str, limit: int = 10, auth: bool = Depends(verify_api_key)):
    """
    Get event recommendations for a user.
    
    Strategy:
    1. If trained model exists, use TF-IDF similarity
    2. Fallback: recommend based on user's booking history categories + popular events
    """
    try:
        # Get user's interaction history
        logs = list(
            db.recommendationlogs.find({"userId": ObjectId(user_id)}).sort(
                "timestamp", -1
            ).limit(50)
        )

        # Get user's bookings
        bookings = list(
            db.bookings.find({"user": ObjectId(user_id), "status": {"$ne": "cancelled"}})
        )

        booked_event_ids = set(str(b["event"]) for b in bookings)
        interacted_event_ids = set(str(l["eventId"]) for l in logs)
        exclude_ids = booked_event_ids | interacted_event_ids

        # Get categories from booked events
        if booked_event_ids:
            booked_events = list(
                db.events.find({"_id": {"$in": [ObjectId(eid) for eid in booked_event_ids]}})
            )
            user_categories = set(e.get("category", "General") for e in booked_events)
        else:
            # Get user's preferred categories
            user = db.users.find_one({"_id": ObjectId(user_id)})
            user_categories = set(user.get("preferredCategories", [])) if user else set()

        # Try model-based recommendation (loaded at startup)
        if _model:
            try:
                recommended_ids = _recommend_from_model(user_id, limit)
                if recommended_ids:
                    return {
                        "user_id": user_id,
                        "recommended_event_ids": recommended_ids,
                        "source": "model",
                    }
            except Exception as e:
                logger.warning(f"Model prediction failed: {e}")

        # Fallback: category-based + popularity
        query = {"date": {"$gte": datetime.now(timezone.utc)}}
        if exclude_ids:
            query["_id"] = {"$nin": [ObjectId(eid) for eid in exclude_ids]}

        if user_categories:
            # Prefer events in user's categories
            category_events = list(
                db.events.find({**query, "category": {"$in": list(user_categories)}})
                .sort([("date", 1)])
                .limit(limit)
            )
        else:
            category_events = []

        # Fill remaining spots with popular events
        remaining = limit - len(category_events)
        if remaining > 0:
            already = set(str(e["_id"]) for e in category_events)
            exclude_all = {ObjectId(eid) for eid in (exclude_ids | already)}
            popular_query = {**query}
            if exclude_all:
                popular_query["_id"] = {"$nin": list(exclude_all)}

            popular_events = list(
                db.events.find(popular_query).sort([("date", 1)]).limit(remaining)
            )
            category_events.extend(popular_events)

        recommended_event_ids = [str(e["_id"]) for e in category_events]

        return {
            "user_id": user_id,
            "recommended_event_ids": recommended_event_ids,
            "source": "fallback",
        }

    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
