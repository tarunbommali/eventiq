"""
Train a TF-IDF based event recommendation model.
Run this script periodically (e.g., via cron or manually) to update the model.

Usage:
    python train.py

The model is saved to model.pkl and loaded by the FastAPI app.
"""

import os
import pickle
import logging
from dotenv import load_dotenv
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from bson import ObjectId

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://mongo:27017/eventbooking")
DB_NAME = os.getenv("DB_NAME", "test")
MODEL_PATH = os.getenv("MODEL_PATH", "model.pkl")


def train():
    """Train TF-IDF model on event content and user interaction data."""
    client = MongoClient(MONGODB_URL)
    db = client[DB_NAME]

    # Fetch all events
    events = list(db.events.find())
    if len(events) < 2:
        logger.warning("Not enough events to train model (need at least 2)")
        return

    logger.info(f"Training on {len(events)} events")

    # Build content strings for TF-IDF
    event_ids = [str(e["_id"]) for e in events]
    event_contents = []
    for e in events:
        content = " ".join([
            e.get("title", ""),
            e.get("description", ""),
            e.get("category", "General"),
            e.get("city", ""),
            e.get("eventType", "general"),
        ])
        event_contents.append(content)

    # TF-IDF vectorization
    vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
    tfidf_matrix = vectorizer.fit_transform(event_contents)

    # Compute cosine similarity matrix
    similarity_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)

    # Build user profiles from interaction logs
    logs = list(db.recommendationlogs.find())
    bookings = list(db.bookings.find({"status": {"$ne": "cancelled"}}))

    logger.info(f"Found {len(logs)} interaction logs and {len(bookings)} bookings")

    # Create event_id to index mapping
    event_id_to_idx = {eid: idx for idx, eid in enumerate(event_ids)}

    # Build user interaction scores
    user_scores = {}  # userId -> {eventId: score}
    for log in logs:
        uid = str(log["userId"])
        eid = str(log["eventId"])
        if uid not in user_scores:
            user_scores[uid] = {}
        score = user_scores[uid].get(eid, 0)
        if log.get("clicked"):
            score += 1
        if log.get("booked"):
            score += 3
        user_scores[uid][eid] = score

    for booking in bookings:
        uid = str(booking["user"])
        eid = str(booking["event"])
        if uid not in user_scores:
            user_scores[uid] = {}
        user_scores[uid][eid] = user_scores[uid].get(eid, 0) + 5

    def recommend(user_id, n=10):
        """Get top-n recommendations for a user."""
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

        # Weighted average of similarity scores
        weights = np.array(weights, dtype=float)
        weights /= weights.sum()

        combined_scores = np.zeros(len(event_ids))
        for idx, weight in zip(interacted_indices, weights):
            combined_scores += weight * similarity_matrix[idx]

        # Exclude already interacted events
        for idx in interacted_indices:
            combined_scores[idx] = -1

        # Get top N
        top_indices = combined_scores.argsort()[::-1][:n]
        return [event_ids[i] for i in top_indices if combined_scores[i] > 0]

    # Save model (data only — recommend function is rebuilt by app.py)
    model = {
        "similarity_matrix": similarity_matrix,
        "event_ids": event_ids,
        "event_id_to_idx": event_id_to_idx,
        "user_scores": user_scores,
    }

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)

    logger.info(f"Model saved to {MODEL_PATH}")
    logger.info(f"User profiles: {len(user_scores)}")


if __name__ == "__main__":
    train()
