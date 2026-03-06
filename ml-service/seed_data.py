"""
Seed script: insert sample events, a test user, bookings, and recommendation logs.
Run once to populate MongoDB with enough data for train.py.

Usage:
    python seed_data.py
"""

import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URL"))
db = client[os.getenv("DB_NAME", "test")]

now = datetime.now(timezone.utc)

# ── Sample organiser user ────────────────────────────────────────────
organiser_id = ObjectId()

# ── 12 diverse sample events ────────────────────────────────────────
events = [
    {
        "title": "TechFest 2026",
        "description": "Annual technology conference featuring AI, cloud computing, and web development talks by industry leaders.",
        "eventType": "general",
        "category": "Tech",
        "location": "HICC Convention Centre",
        "city": "Hyderabad",
        "date": now + timedelta(days=10),
        "time": "09:00",
        "price": 500,
        "totalCapacity": 200,
        "bookedCount": 0,
        "createdBy": organiser_id,
        "likes": [],
        "dislikes": [],
    },
    {
        "title": "Mumbai Music Carnival",
        "description": "Live music carnival featuring rock, jazz, and Bollywood sessions with top Indian artists.",
        "eventType": "general",
        "category": "Music",
        "location": "Mahalaxmi Racecourse",
        "city": "Mumbai",
        "date": now + timedelta(days=15),
        "time": "17:00",
        "price": 1200,
        "totalCapacity": 500,
        "bookedCount": 0,
        "createdBy": organiser_id,
        "likes": [],
        "dislikes": [],
    },
    {
        "title": "Startup Pitch Night",
        "description": "Pitch your startup idea to a panel of VCs and angel investors. Networking dinner included.",
        "eventType": "seat",
        "category": "Business",
        "location": "T-Hub",
        "city": "Hyderabad",
        "date": now + timedelta(days=20),
        "time": "18:30",
        "price": 0,
        "totalSeats": 50,
        "availableSeats": list(range(1, 51)),
        "createdBy": organiser_id,
        "likes": [],
        "dislikes": [],
    },
    {
        "title": "React Advanced Workshop",
        "description": "Deep-dive workshop on React Server Components, Suspense, and performance optimization.",
        "eventType": "online",
        "category": "Tech",
        "location": "Online (Zoom)",
        "city": "Online",
        "date": now + timedelta(days=7),
        "time": "10:00",
        "price": 300,
        "totalCapacity": 100,
        "bookedCount": 0,
        "createdBy": organiser_id,
        "likes": [],
        "dislikes": [],
    },
    {
        "title": "Bengaluru Art Exhibition",
        "description": "Contemporary art exhibition showcasing paintings, sculptures, and digital art from emerging artists.",
        "eventType": "general",
        "category": "Art",
        "location": "National Gallery of Modern Art",
        "city": "Bengaluru",
        "date": now + timedelta(days=25),
        "time": "11:00",
        "price": 150,
        "totalCapacity": 300,
        "bookedCount": 0,
        "createdBy": organiser_id,
        "likes": [],
        "dislikes": [],
    },
    {
        "title": "Delhi Food Festival",
        "description": "Street food from across India. Pan-Asian cuisine, live cooking demos, and chef battles.",
        "eventType": "general",
        "category": "Food",
        "location": "JLN Stadium Grounds",
        "city": "Delhi",
        "date": now + timedelta(days=12),
        "time": "12:00",
        "price": 200,
        "totalCapacity": 1000,
        "bookedCount": 0,
        "createdBy": organiser_id,
        "likes": [],
        "dislikes": [],
    },
    {
        "title": "Python for Data Science",
        "description": "Hands-on workshop covering pandas, numpy, matplotlib, and scikit-learn with real datasets.",
        "eventType": "online",
        "category": "Tech",
        "location": "Online (Google Meet)",
        "city": "Online",
        "date": now + timedelta(days=5),
        "time": "14:00",
        "price": 250,
        "totalCapacity": 80,
        "bookedCount": 0,
        "createdBy": organiser_id,
        "likes": [],
        "dislikes": [],
    },
    {
        "title": "Hyderabad Marathon 2026",
        "description": "Annual city marathon — 5K, 10K, half marathon, and full marathon categories.",
        "eventType": "general",
        "category": "Sports",
        "location": "People's Plaza",
        "city": "Hyderabad",
        "date": now + timedelta(days=30),
        "time": "05:30",
        "price": 400,
        "totalCapacity": 2000,
        "bookedCount": 0,
        "createdBy": organiser_id,
        "likes": [],
        "dislikes": [],
    },
    {
        "title": "Stand-Up Comedy Night",
        "description": "Laugh-out-loud evening with India's top stand-up comedians performing live.",
        "eventType": "seat",
        "category": "Entertainment",
        "location": "Canvas Laugh Club",
        "city": "Mumbai",
        "date": now + timedelta(days=8),
        "time": "20:00",
        "price": 800,
        "totalSeats": 120,
        "availableSeats": list(range(1, 121)),
        "createdBy": organiser_id,
        "likes": [],
        "dislikes": [],
    },
    {
        "title": "Cloud & DevOps Summit",
        "description": "Expert talks on AWS, Kubernetes, CI/CD, and infrastructure-as-code for production workloads.",
        "eventType": "general",
        "category": "Tech",
        "location": "Taj MG Road",
        "city": "Bengaluru",
        "date": now + timedelta(days=18),
        "time": "09:30",
        "price": 600,
        "totalCapacity": 250,
        "bookedCount": 0,
        "createdBy": organiser_id,
        "likes": [],
        "dislikes": [],
    },
    {
        "title": "Bollywood Dance Workshop",
        "description": "Learn Bollywood dance moves from professional choreographers. All skill levels welcome.",
        "eventType": "general",
        "category": "Dance",
        "location": "Danceworx Studio",
        "city": "Delhi",
        "date": now + timedelta(days=14),
        "time": "16:00",
        "price": 350,
        "totalCapacity": 40,
        "bookedCount": 0,
        "createdBy": organiser_id,
        "likes": [],
        "dislikes": [],
    },
    {
        "title": "Photography Walk — Old City",
        "description": "Guided photography walk through the historic old city. Bring your camera or phone.",
        "eventType": "general",
        "category": "Art",
        "location": "Charminar",
        "city": "Hyderabad",
        "date": now + timedelta(days=9),
        "time": "07:00",
        "price": 100,
        "totalCapacity": 25,
        "bookedCount": 0,
        "createdBy": organiser_id,
        "likes": [],
        "dislikes": [],
    },
]

# Insert events
result = db.events.insert_many(events)
event_ids = result.inserted_ids
print(f"✅ Inserted {len(event_ids)} events")

# ── Fetch existing users ─────────────────────────────────────────────
users = list(db.users.find({}, {"_id": 1}))
if not users:
    print("⚠️  No users found — skipping bookings and logs (sign up via the app first)")
else:
    test_user_id = users[0]["_id"]
    print(f"Using existing user: {test_user_id}")

    # ── Bookings for the test user (3 events) ────────────────────────
    bookings = [
        {
            "user": test_user_id,
            "event": event_ids[0],   # TechFest
            "quantity": 2,
            "noOfTickets": 2,
            "status": "confirmed",
            "bookedAt": now - timedelta(days=2),
        },
        {
            "user": test_user_id,
            "event": event_ids[3],   # React Workshop
            "quantity": 1,
            "noOfTickets": 1,
            "status": "confirmed",
            "bookedAt": now - timedelta(days=1),
        },
        {
            "user": test_user_id,
            "event": event_ids[6],   # Python for Data Science
            "quantity": 1,
            "noOfTickets": 1,
            "status": "confirmed",
            "bookedAt": now,
        },
    ]
    db.bookings.insert_many(bookings)
    print(f"✅ Inserted {len(bookings)} bookings")

    # ── Recommendation click logs ────────────────────────────────────
    logs = [
        {"userId": test_user_id, "eventId": event_ids[0], "clicked": True, "booked": True, "timestamp": now - timedelta(days=2)},
        {"userId": test_user_id, "eventId": event_ids[3], "clicked": True, "booked": True, "timestamp": now - timedelta(days=1)},
        {"userId": test_user_id, "eventId": event_ids[6], "clicked": True, "booked": True, "timestamp": now},
        {"userId": test_user_id, "eventId": event_ids[9], "clicked": True, "booked": False, "timestamp": now - timedelta(hours=6)},
        {"userId": test_user_id, "eventId": event_ids[4], "clicked": True, "booked": False, "timestamp": now - timedelta(hours=3)},
    ]

    # If a second user exists, add some interactions for them too
    if len(users) > 1:
        user2_id = users[1]["_id"]
        logs.extend([
            {"userId": user2_id, "eventId": event_ids[1], "clicked": True, "booked": True, "timestamp": now - timedelta(days=3)},
            {"userId": user2_id, "eventId": event_ids[8], "clicked": True, "booked": False, "timestamp": now - timedelta(days=2)},
            {"userId": user2_id, "eventId": event_ids[10], "clicked": True, "booked": False, "timestamp": now - timedelta(days=1)},
        ])

    db.recommendationlogs.insert_many(logs)
    print(f"✅ Inserted {len(logs)} recommendation logs")

    print(f"\n🆔 Test user ID for /recommend: {test_user_id}")

# Print summary
print(f"\nDB now has:")
print(f"  Events:  {db.events.count_documents({})}")
print(f"  Users:   {db.users.count_documents({})}")
print(f"  Bookings: {db.bookings.count_documents({})}")
print(f"  Logs:    {db.recommendationlogs.count_documents({})}")

client.close()
