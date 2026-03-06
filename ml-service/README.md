# EventIQ — ML Recommendation Service

FastAPI microservice that provides personalised event recommendations using a TF-IDF content-based model trained on user activity history.

## Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.13 | Runtime |
| **FastAPI** | 0.115 | Async ASGI web framework |
| **Uvicorn** | 0.30 | ASGI server |
| **scikit-learn** | 1.6.1 | TF-IDF vectoriser + cosine similarity |
| **PyMongo** | 4.6.1 | MongoDB access for training data |
| **pandas** | 2.2.3 | Data manipulation during training |
| **NumPy** | 2.1.3 | Numerical operations |
| **pickle** | stdlib | Model serialisation / deserialisation |
| **python-dotenv** | 1.0.0 | `.env` loading |

## Setup

```bash
cd ml-service
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

pip install -r requirements.txt
```

Create `.env`:

```env
MONGODB_URL=mongodb://localhost:27017    # MongoDB connection string
DB_NAME=EventIQ                          # Database name
MODEL_PATH=models/event_model.pkl        # Path to trained model file
ML_API_KEY=<strong-random-key>           # API key for authenticating backend requests
ALLOWED_ORIGINS=http://localhost:5173    # Comma-separated CORS origins
```

## Training the Model

Before starting the service, train the TF-IDF model from MongoDB event data:

```bash
python train.py
```

This script:
1. Connects to MongoDB using `MONGODB_URL` / `DB_NAME`
2. Reads events and user activity (clicks, bookings, likes)
3. Builds a TF-IDF matrix from event text features (title, description, category, city)
4. Saves the trained model to `MODEL_PATH` (default: `model.pkl`) using `pickle`

Re-run `train.py` periodically (e.g. via cron) to incorporate new events and activity.

## Running

```bash
# Development
uvicorn app:app --reload --port 8000

# Production
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Security

| Feature | Detail |
|---------|--------|
| **API Key Auth** | All recommendation endpoints require `X-API-Key` header matching `ML_API_KEY` env var |
| **CORS Restriction** | Origins restricted to `ALLOWED_ORIGINS` (no wildcard `*` in production) |
| **Lifespan Model Loading** | Model loaded once at startup via FastAPI `lifespan`, not per-request |

### Authentication Flow

```
Backend → POST /recommend
         Header: X-API-Key: <ML_API_KEY>
         Body: { userId, preferences }
                    ↓
ML Service → verify_api_key() dependency
           → Returns 403 if key missing/invalid
           → Proceeds to recommendation logic
```

If `ML_API_KEY` is not set in the environment, API key verification is skipped (development mode). **Always set `ML_API_KEY` in production.**

## API Endpoints

### `GET /health`

Health check endpoint (no auth required).

**Response:**
```json
{ "status": "healthy" }
```

### `POST /recommend`

Get personalised event recommendations for a user.

**Headers:**
```
X-API-Key: <ML_API_KEY>
```

**Request Body:**
```json
{
  "userId": "648a...",
  "preferences": ["Music", "Tech"]
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "eventId": "648b...",
      "title": "TechFest 2025",
      "score": 0.87
    }
  ]
}
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| 403 | Missing or invalid `X-API-Key` |
| 500 | Model not loaded or internal error |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URL` | Yes | — | MongoDB connection URI |
| `DB_NAME` | Yes | — | Database name |
| `MODEL_PATH` | No | `models/event_model.pkl` | Path to serialised model file |
| `ML_API_KEY` | **Prod: Yes** | — | API key for endpoint authentication |
| `ALLOWED_ORIGINS` | **Prod: Yes** | — | Comma-separated CORS allowed origins |

## Project Structure

```
ml-service/
├── Dockerfile            # Python 3.13 slim, pip install, uvicorn
├── requirements.txt      # Pinned dependencies
├── app.py                # FastAPI app — lifespan loader, CORS, API key auth, /recommend endpoint
├── train.py              # Model training script — reads MongoDB, builds TF-IDF, saves .pkl
└── models/
    └── event_model.pkl   # Trained model artifact (gitignored)
```

## Docker

```bash
docker build -t eventiq-ml .
docker run -p 8000:8000 \
  -e MONGODB_URL=mongodb://mongo:27017 \
  -e DB_NAME=EventIQ \
  -e ML_API_KEY=your-secret-key \
  -e ALLOWED_ORIGINS=http://localhost:5173 \
  eventiq-ml
```

## Integration with Backend

The backend Node.js service calls this ML service from [backend/src/routes/recommend.js](../backend/src/routes/recommend.js):

```
Backend (port 3000) ──► ML Service (port 8000)
                         X-API-Key header
```

The `ML_API_KEY` must match between both services. Set the same value in both the backend and ml-service `.env` files.

## Author

**Tarun Bommali**
