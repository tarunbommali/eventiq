# EventIQ

Intelligent event booking with distributed seat locking and AI-powered recommendations.

**Tech Stack:** React · Express · MongoDB · FastAPI · Redis · AWS S3 · Docker

---

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend   │─────▶│   Backend   │─────▶│ ML Service  │
│  React + TS  │:5173 │  Express.js │:3000 │   FastAPI    │:8000
│  Vite + TW   │      │  Node.js    │      │  scikit-learn│
└─────────────┘      └──────┬──────┘      └──────┬──────┘
                            │                     │
                     ┌──────┴──────┐              │
                     │             │              │
                ┌────▼───┐  ┌─────▼──┐    ┌──────▼──────┐
                │MongoDB │  │ Redis  │    │   MongoDB   │
                │   :27017│  │  :6379 │    │  (shared)   │
                └────────┘  └────────┘    └─────────────┘
```

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 5173 | React SPA with Tailwind CSS |
| Backend | 3000 | REST API, auth, bookings, uploads |
| ML Service | 8000 | TF-IDF event recommendations |
| MongoDB | 27017 | Primary datastore |
| Redis | 6379 | Distributed seat locking (optional) |

---

## Features

- **Authentication** — JWT cookie-based signup/login with bcrypt password hashing
- **Role-Based Access** — `user`, `organizer`, `admin` roles with middleware guards (server-enforced, no self-escalation)
- **Event Management** — CRUD with three event types: `seat`, `general`, `online`; server-side validation via `validateEvent`; deletion blocked when active bookings exist
- **Organizer Dashboard** — Dedicated "Your Events" page (`/events/mine`) with per-event detail views (`/events/mine/:id`) showing attendee lists and booking search
- **Smart Booking** — Seat selection with Redis-backed distributed locking (5-min TTL), atomic capacity checks
- **ML Recommendations** — TF-IDF content-based filtering with cosine similarity, API-key protected; fallback uses aggregation-based popularity sort
- **Social Interactions** — Like/dislike toggle on events using atomic `$addToSet`/`$pull` (race-condition safe)
- **Profile Photos** — Upload to AWS S3 with multer
- **Search & Filters** — By category, city, event type, free-text search with ReDoS-safe regex escaping
- **Pagination** — All list endpoints support `?page=&limit=` with total/pages metadata
- **Docker Compose** — One-command deployment of all services

---

## Security Features

| Feature | Implementation |
|---------|---------------|
| **Helmet** | Secure HTTP headers (`X-Content-Type-Options`, `X-Frame-Options`, CSP, etc.) |
| **Rate Limiting** | Global: 200 req/15min per IP. Auth routes: 20 req/15min per IP |
| **JWT Secret** | Required via `JWT_SECRET` env var — app crashes at startup if missing |
| **Role Protection** | Signup always assigns `role: "user"` — `role` field is ignored from client input |
| **Input Validation** | Server-side validation using `validator` library before Mongoose layer; `validateEvent` enforces event creation rules |
| **Regex Sanitization** | User search/filter inputs escaped to prevent ReDoS attacks |
| **Error Sanitization** | Internal error details never leaked to clients — generic error messages only; auth middleware returns only "Unauthorized" |
| **Body Size Limit** | `express.json({ limit: "1mb" })` prevents payload attacks |
| **ML API Key Auth** | ML service protected via `X-API-Key` header (opt-in via `ML_API_KEY` env var) |
| **CORS Whitelist** | Both backend and ML service restrict origins to known domains |
| **CSRF-safe Logout** | Logout is `POST` (not `GET`) to prevent CSRF via prefetch/img tags |
| **Graceful Shutdown** | `SIGTERM`/`SIGINT` handlers close DB connections cleanly |
| **Profile Validation** | Profile updates validate name length, phone format, and category array type |
| **404 Catch-all** | Unknown routes return structured `404` instead of framework default |
| **Event Deletion Guard** | Events with active bookings cannot be deleted — prevents orphaned tickets |
| **Password Policy** | Frontend and backend enforce 8+ chars with uppercase, lowercase, number, and symbol |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- MongoDB (local or Atlas)
- Redis (**required for seat-based events** — without Redis, seat bookings will be denied to prevent double-booking)

### 1. Clone

```bash
git clone https://github.com/tarunbommali/basic-activity-booking-app.git
cd basic-activity-booking-app
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
# ── Required ──────────────────────────
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/?appName=Cluster0
JWT_SECRET=your_strong_random_secret_here

# ── Optional ──────────────────────────
NODE_ENV=development
PORT=3000
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
ML_SERVICE_URL=http://localhost:8000
ML_API_KEY=your_ml_api_key           # must match ml-service/.env
FRONTEND_URL=http://localhost:5173

# AWS S3 (for profile photo uploads)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET_NAME=your_bucket
```

> **Important:** `JWT_SECRET` and `MONGODB_URL` are **required**. The app will refuse to start without them.

```bash
npm run dev    # nodemon on port 3000
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:3000/
```

```bash
npm run dev    # Vite on port 5173
```

### 4. ML Service

```bash
cd ml-service
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `ml-service/.env`:

```env
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/?appName=Cluster0
DB_NAME=test
MODEL_PATH=model.pkl
ML_API_KEY=your_ml_api_key            # must match backend/.env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

```bash
# Train model (run periodically as data grows)
python train.py

# Start API server
uvicorn app:app --host 0.0.0.0 --port 8000
```

### 5. Docker (all services)

```bash
docker compose up --build
```

This starts MongoDB, Redis, backend, frontend, and ML service in one command.

---

## API Reference

### Auth

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/signup` | No | 20/15min | Register (name, email, phoneNumber, password) |
| POST | `/login` | No | 20/15min | Login → sets JWT cookie (1-day expiry) |
| GET | `/me` | Yes | 20/15min | Get current user |
| POST | `/logout` | No | 20/15min | Clear auth cookie |
| GET | `/profile` | Yes | 20/15min | Get user profile |
| PATCH | `/profile` | Yes | 20/15min | Update name, phoneNumber, preferredCategories |

> **Note:** Signup always creates users with `role: "user"`. Only an admin can promote users to `organizer` or `admin` roles.

### Events

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/events?page=1&limit=20` | No | — | List events (filters: `search`, `category`, `city`, `eventType`) |
| GET | `/events/:id` | No | — | Get single event |
| POST | `/events` | Yes | organizer/admin | Create event |
| PUT | `/events/:id` | Yes | owner/admin | Update event |
| DELETE | `/events/:id` | Yes | owner/admin | Delete event + bookings (blocked if active bookings exist) |
| POST | `/events/:id/like` | Yes | — | Toggle like |
| POST | `/events/:id/dislike` | Yes | — | Toggle dislike |
| GET | `/events/:id/booked-users` | Yes | host/admin | List booked users |
| GET | `/events/:id/available-seats` | No | — | Get available seat numbers |

#### Pagination Response Format

```json
{
  "events": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

### Bookings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/booking/:eventId` | Yes | Book event (seats[] for seat-based, quantity for general) |
| GET | `/booking?page=1&limit=20` | Yes | Get user's bookings (paginated) |
| GET | `/booking/:id` | Yes | Get single booking |
| POST | `/booking/:id/cancel` | Yes | Cancel booking (owner/admin) |

#### Booking Flow — Concurrency Safe

- **General/online events:** Uses atomic `findOneAndUpdate` with `$inc` and `$expr` capacity check — prevents overbooking under concurrent requests
- **Seat-based events:** Redis distributed lock + MongoDB atomic seat removal
- **Cancellation:** Atomic `$inc` / `$push` to restore capacity/seats — no race conditions

### Recommendations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/recommend` | Yes | ML-powered recommendations (fallback: category-based) |
| POST | `/recommend/log` | Yes | Log recommendation click for ML training |

### Upload

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/upload/profile-photo` | Yes | Upload profile photo to S3 (5MB, JPEG/PNG/WebP) |

### Health Check

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Returns `{ status: "ok", uptime: <seconds> }` |

### ML Service (internal, API-key protected)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/recommend/{user_id}?limit=10` | Get recommended event IDs (requires `X-API-Key` header) |

---

## Data Models

### User

| Field | Type | Notes |
|-------|------|-------|
| name | String | 2-100 chars |
| email | String | Unique, validated with `validator` |
| phoneNumber | String | Validated with `validator` |
| password | String | bcrypt hashed, strong password required |
| profilePhotoUrl | String | S3 URL |
| role | Enum | `user` / `organizer` / `admin` (server-enforced) |
| preferredCategories | [String] | Used for recommendation fallback |

### Event

| Field | Type | Notes |
|-------|------|-------|
| title | String | Required |
| description | String | — |
| eventType | Enum | `seat` / `general` / `online` |
| category | String | Default: "General" |
| location | String | Required |
| city | String | — |
| date | Date | Required, **indexed** |
| time | String | Required |
| price | Number | Default: 0 (free) |
| bannerUrl | String | — |
| totalSeats | Number | For seat-based events |
| availableSeats | [Number] | Remaining seat numbers |
| totalCapacity | Number | For general/online events |
| bookedCount | Number | Current bookings count |
| createdBy | ObjectId → User | **Indexed** |
| likes | [ObjectId] | User IDs |
| dislikes | [ObjectId] | User IDs |

**Indexes:** `{ date: 1 }`, `{ category: 1, city: 1 }`, `{ createdBy: 1 }`, `{ eventType: 1 }`

### Booking

| Field | Type | Notes |
|-------|------|-------|
| user | ObjectId → User | — |
| event | ObjectId → Event | — |
| seats | [Number] | Selected seat numbers |
| quantity | Number | Ticket count |
| status | Enum | `pending` / `confirmed` / `cancelled` |
| bookedAt | Date | — |

**Indexes:** `{ user: 1, event: 1 }` (duplicate check), `{ user: 1 }`, `{ event: 1 }`

### RecommendationLog

| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId → User | Indexed |
| eventId | ObjectId → Event | — |
| clicked | Boolean | — |
| booked | Boolean | — |
| timestamp | Date | Indexed (desc) |

---

## ML Recommendation Pipeline

```
  User Interactions                    Events DB
  (clicks, bookings)                  (title, desc, category, city)
        │                                    │
        ▼                                    ▼
  ┌──────────────┐                 ┌──────────────────┐
  │ User Profiles │                │ TF-IDF Vectorizer │
  │ click=+1      │                │ max 5000 features │
  │ logged_book=+3│                └────────┬─────────┘
  │ booking=+5   │                          │
  └──────┬───────┘                 ┌────────▼─────────┐
         │                        │ Cosine Similarity │
         │                        │     Matrix        │
         │                        └────────┬──────────┘
         │                                 │
         └──────────┬──────────────────────┘
                    ▼
          ┌─────────────────┐
          │ Weighted Average │
          │ of similarities  │
          └────────┬────────┘
                   ▼
          ┌─────────────────┐
          │ Top-N unseen    │
          │ event IDs       │
          └─────────────────┘
```

**Training:** Run `python ml-service/train.py` — builds model from all events + user interaction history, saves to `model.pkl`.

**Serving:** The FastAPI app loads the pickled model **once at startup** via a `lifespan` handler. If no model exists, it falls back to category + recency sorting.

---

## Seat Locking (Redis)

Seat-based events use distributed locking to prevent double-booking:

1. User selects seats → backend calls `lockMultipleSeats(eventId, seats, userId)`
2. Each seat gets a Redis key: `lock:{eventId}:seat:{seatNo}` with `SET NX EX 300`
3. If any seat fails → all acquired locks are rolled back
4. On successful DB write → locks are released
5. Lock TTL: **5 minutes** (auto-expires if user abandons)
6. If Redis is unavailable, seat bookings are **denied** (fail-safe) — prevents double-booking without distributed locks

---

## Concurrency & Data Integrity

| Operation | Strategy | Details |
|-----------|----------|---------|
| General booking | Atomic `findOneAndUpdate` + `$inc` | `$expr` checks capacity in the same atomic op — prevents overbooking |
| Seat booking | Redis lock + atomic array removal | Seats removed from `availableSeats` atomically after lock acquisition |
| Cancellation (general) | Atomic `findOneAndUpdate` + `$inc: { bookedCount: -N }` | Status set to "cancelled" and capacity restored atomically — no double-cancel |
| Cancellation (seat) | Atomic `findOneAndUpdate` + `$push` with `$sort` | Status + seats returned atomically |
| Like/dislike | Atomic `$addToSet` / `$pull` | No read-modify-write race window — concurrent likes are safe |

---

## Project Structure

```
├── docker-compose.yml
├── README.md                         # ← You are here
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── ReadME.md
│   └── src/
│       ├── app.js                    # Express entry + helmet + rate-limit + error handler
│       ├── config/
│       │   ├── database.js           # MongoDB connection (env validated)
│       │   ├── redis.js              # Redis connection (retry strategy, fallback)
│       │   └── s3.js                 # AWS S3 client
│       ├── middleware/
│       │   ├── userAuth.js           # JWT verification (env-based secret)
│       │   └── roleAuth.js           # Role-based access control
│       ├── models/
│       │   ├── user.js               # + strong password validation
│       │   ├── event.js              # + database indexes
│       │   ├── booking.js            # + database indexes
│       │   └── recommendationLog.js
│       ├── routes/
│       │   ├── auth.js               # Signup (validated, role-locked), login, logout (POST), profile update (validated)
│       │   ├── event.js              # CRUD (validateEvent), atomic likes ($addToSet/$pull), search (regex-escaped, paginated), deletion guard
│       │   ├── booking.js            # Atomic book/cancel (findOneAndUpdate, paginated)
│       │   ├── upload.js             # S3 profile photo
│       │   └── recommend.js          # ML proxy + API key + aggregation-based fallback sort
│       ├── services/
│       │   └── seatLock.js           # Redis distributed lock (fail-safe: denies if Redis down)
│       └── utils/
│           └── validation.js         # validateSignup, validateEvent, escapeRegex
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf                    # Reverse proxy to backend
│   ├── package.json
│   ├── README.md
│   └── src/
│       ├── App.tsx                   # Router config
│       ├── main.tsx
│       ├── components/
│       │   ├── AppLayout.tsx
│       │   ├── BookingController.tsx
│       │   ├── EventCard.tsx         # Event display + booking UI + recommendation logging
│       │   ├── Header.tsx            # Navigation, auth, POST logout
│       │   └── Footer.tsx
│       ├── pages/
│       │   ├── Home.tsx              # Events list + ML recommendations
│       │   ├── Bookings.tsx          # User's bookings
│       │   ├── HostEvent.tsx         # Create event form
│       │   ├── YourEvents.tsx        # Organizer's hosted events list
│       │   ├── YourEventDetail.tsx   # Individual hosted event details + attendees
│       │   ├── EventDetail.tsx       # Public event detail view
│       │   ├── Login.tsx             # Login/signup forms
│       │   ├── Profile.tsx           # Profile view/edit
│       │   └── ErrorPage.tsx         # 404 error boundary page
│       ├── context/
│       │   └── AuthContext.tsx        # Auth state provider
│       └── utils/
│           ├── constants.tsx         # BACKEND_URL config
│           └── validation.ts         # Client-side form validation (synced with backend rules)
└── ml-service/
    ├── Dockerfile
    ├── requirements.txt
    ├── README.md
    ├── app.py                        # FastAPI API (lifespan model load, API key auth)
    └── train.py                      # TF-IDF model training script
```

---

## Environment Variables

| Variable | Service | Default | Required | Notes |
|----------|---------|---------|----------|-------|
| `MONGODB_URL` | backend, ml-service | — | **Yes** | App won't start without it |
| `JWT_SECRET` | backend | — | **Yes** | App won't start without it |
| `PORT` | backend | `3000` | No | |
| `NODE_ENV` | backend | — | No | Set `production` for secure cookies |
| `REDIS_HOST` | backend | `127.0.0.1` | No | |
| `REDIS_PORT` | backend | `6379` | No | |
| `REDIS_PASSWORD` | backend | — | No | |
| `ML_SERVICE_URL` | backend | `http://localhost:8000` | No | |
| `ML_API_KEY` | backend, ml-service | — | No | Shared secret for ML service auth |
| `FRONTEND_URL` | backend | — | No | Added to CORS whitelist |
| `AWS_REGION` | backend | `ap-south-1` | No | |
| `AWS_ACCESS_KEY_ID` | backend | — | For uploads | |
| `AWS_SECRET_ACCESS_KEY` | backend | — | For uploads | |
| `AWS_S3_BUCKET_NAME` | backend | — | For uploads | |
| `DB_NAME` | ml-service | `test` | No | |
| `MODEL_PATH` | ml-service | `model.pkl` | No | |
| `ALLOWED_ORIGINS` | ml-service | `localhost:3000,5173` | No | Comma-separated CORS origins |
| `VITE_BACKEND_URL` | frontend | `http://localhost:3000/` | No | |

---

## Deployment

| Service | Platform | Config |
|---------|----------|--------|
| Backend | Render / Vercel | `vercel.json` included |
| Frontend | Netlify | `netlify.toml` included |
| ML Service | Docker / Cloud Run | Dockerfile included |
| Full Stack | Docker Compose | `docker compose up --build` |

---

## Author

**Tarun Bommali**

## License

ISC
