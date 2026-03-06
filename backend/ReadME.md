# EventIQ — Backend API

Production-grade REST API for the EventIQ platform. Handles authentication, event management, bookings with atomic concurrency control, rate limiting, and ML recommendation proxying.

## Tech Stack

- **Node.js 20** / **Express 5** — HTTP framework
- **MongoDB** / **Mongoose** — Database & ODM with indexed collections
- **Redis** / **ioredis** — Distributed seat locking (optional, graceful fallback)
- **JWT** / **bcrypt** — Cookie-based authentication (env-based secret, no hardcoded fallback)
- **AWS S3** — Profile photo uploads via `@aws-sdk/client-s3` + multer
- **Helmet** — Secure HTTP headers (CSP, X-Frame-Options, etc.)
- **express-rate-limit** — Brute-force protection on auth routes
- **Axios** — ML service communication with API key auth

## Security

| Feature | Details |
|---------|---------|
| **Startup validation** | `JWT_SECRET` and `MONGODB_URL` are **required** — app exits with error if missing |
| **Helmet** | Sets `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, CSP, etc. |
| **Rate limiting** | Global: 200 req/15min per IP. Auth routes: 20 req/15min per IP |
| **Role protection** | Signup always sets `role: "user"` regardless of client input — prevents privilege escalation |
| **Input validation** | `validateSignup()` validates name, email, phone, password strength; `validateEvent()` validates event creation fields before Mongoose layer |
| **Regex escaping** | Search & filter inputs escaped via `escapeRegex()` to prevent ReDoS attacks |
| **Error sanitization** | Internal error details (stack traces, Mongoose errors) never sent to clients; auth middleware returns only "Unauthorized" |
| **Body size limit** | `express.json({ limit: "1mb" })` prevents payload-based attacks |
| **Global error handler** | Catches unhandled errors, returns generic `500` response |
| **404 catch-all** | Unknown routes return structured `{ message: "Route not found" }` with 404 status |
| **Profile validation** | Profile updates validate name length, phone format (via `validator`), and category array type |
| **Event deletion guard** | Events with active (non-cancelled) bookings cannot be deleted — prevents orphaned tickets |
| **Graceful shutdown** | `SIGTERM`/`SIGINT` handlers close MongoDB connections before exit |
| **ML API key** | Backend sends `X-API-Key` header to ML service when `ML_API_KEY` is configured |

## Setup

```bash
cd backend
npm install
```

Create `.env`:

```env
# ── Required (app won't start without these) ─────
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/
JWT_SECRET=your_strong_random_secret_here

# ── Optional ──────────────────────────────────────
NODE_ENV=development
PORT=3000
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
ML_SERVICE_URL=http://localhost:8000
ML_API_KEY=shared_secret_with_ml_service
FRONTEND_URL=http://localhost:5173

# AWS S3 (for profile photo uploads)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET_NAME=your_bucket
```

```bash
npm run dev    # nodemon, port 3000
npm start      # production
```

## API Endpoints

### Auth (`/`) — Rate limited: 20 req/15min

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/signup` | No | Register (name, email, phoneNumber, password) — validated, role locked to `user` |
| POST | `/login` | No | Login → sets httpOnly JWT cookie (1-day expiry) |
| GET | `/me` | Yes | Get current authenticated user |
| POST | `/logout` | No | Clear auth cookie (POST to prevent CSRF) |
| GET | `/profile` | Yes | Get user profile |
| PATCH | `/profile` | Yes | Update name, phoneNumber, preferredCategories (validated) |

### Events (`/events`) — Paginated

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/events?page=1&limit=20` | No | — | List events with filters + pagination |
| GET | `/events/:id` | No | — | Get single event details |
| POST | `/events` | Yes | organizer/admin | Create event (`seat`, `general`, or `online` type) — validated via `validateEvent` |
| PUT | `/events/:id` | Yes | owner/admin | Update event (allowlisted fields only) |
| DELETE | `/events/:id` | Yes | owner/admin | Delete event + cancelled bookings (blocked if active bookings exist) |
| POST | `/events/:id/like` | Yes | — | Toggle like (atomic `$addToSet`/`$pull`) |
| POST | `/events/:id/dislike` | Yes | — | Toggle dislike (atomic `$addToSet`/`$pull`) |
| GET | `/events/:id/booked-users` | Yes | host/admin | List booked users |
| GET | `/events/:id/available-seats` | No | — | Get available seat numbers |

#### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Free-text search (title + description, regex-escaped) |
| `category` | string | Filter by category (exact match) |
| `city` | string | Filter by city (case-insensitive, regex-escaped) |
| `eventType` | string | Filter: `seat`, `general`, or `online` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |

#### Paginated Response

```json
{
  "events": [...],
  "pagination": { "page": 1, "limit": 20, "total": 156, "pages": 8 }
}
```

### Bookings (`/booking`) — Concurrency Safe

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/booking/:eventId` | Yes | Book event (seats[] for seat-based, quantity for general/online, max 6) |
| GET | `/booking?page=1&limit=20` | Yes | Get current user's bookings (paginated) |
| GET | `/booking/:id` | Yes | Get single booking |
| POST | `/booking/:id/cancel` | Yes | Cancel booking (owner/admin, atomic `findOneAndUpdate` + capacity restore) |

#### Concurrency Strategy

| Operation | Method | Details |
|-----------|--------|---------|
| General booking | `findOneAndUpdate` + `$inc` | Atomic capacity check via `$expr` — prevents overbooking |
| Seat booking | Redis lock → atomic array removal | Multi-seat atomicity with rollback on partial failure |
| General cancel | `findOneAndUpdate` + `$inc: -N` | Atomic status change + decrement — prevents double-cancel race condition |
| Seat cancel | `findOneAndUpdate` + `$push` + `$sort` | Atomic status change + seat restoration |

### Recommendations (`/recommend`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/recommend` | Yes | ML-powered recommendations (fallback: category + popular) |
| POST | `/recommend/log` | Yes | Log recommendation click for ML training data |

### Upload (`/upload`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/upload/profile-photo` | Yes | Upload profile photo to S3 (5MB, JPEG/PNG/WebP) |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Returns `{ status: "ok", uptime: <seconds> }` |

## Database Indexes

### Booking Collection

| Index | Purpose |
|-------|---------|
| `{ user: 1, event: 1 }` | Fast duplicate-booking check |
| `{ user: 1 }` | User's bookings listing |
| `{ event: 1 }` | Event's bookings listing |

### Event Collection

| Index | Purpose |
|-------|---------|
| `{ date: 1 }` | Sort by date (default listing order) |
| `{ category: 1, city: 1 }` | Compound filter for category + city queries |
| `{ createdBy: 1 }` | Organizer's events listing |
| `{ eventType: 1 }` | Filter by event type |

## Seat Locking (Redis)

Seat-based events use Redis distributed locks to prevent double-booking:

1. Lock key: `lock:{eventId}:seat:{seatNo}` with `SET NX EX 300`
2. Multi-seat requests are atomic — partial failures roll back all locks
3. Locks auto-expire after **5 minutes**
4. If Redis is unavailable, seat bookings are **denied** (fail-safe) to prevent double-booking without distributed locks
5. Redis connection uses retry strategy (max 3 attempts, then stops cleanly)

## Validation

The `validation.js` utility provides:

| Function | Purpose |
|----------|---------|
| `validateSignup({ name, email, phoneNumber, password })` | Returns field-level errors object for registration input |
| `validateEvent({ title, description, location, date, time })` | Returns field-level errors object for event creation |
| `escapeRegex(str)` | Escapes special regex characters to prevent ReDoS in `$regex` queries |

## Project Structure

```
backend/
├── Dockerfile
├── package.json
├── vercel.json
└── src/
    ├── app.js                    # Express entry + helmet + rate-limit + 404 catch-all + error handler + graceful shutdown
    ├── config/
    │   ├── database.js           # MongoDB connection (env validated)
    │   ├── redis.js              # Redis connection (retry strategy, graceful fallback)
    │   └── s3.js                 # AWS S3 client
    ├── middleware/
    │   ├── userAuth.js           # JWT cookie verification (env-based secret, crashes if missing)
    │   └── roleAuth.js           # Role-based access control
    ├── models/
    │   ├── user.js               # Strong password validation, JWT method
    │   ├── event.js              # + 4 database indexes
    │   ├── booking.js            # + 3 database indexes
    │   └── recommendationLog.js
    ├── routes/
    │   ├── auth.js               # Signup (validated, role-locked to "user"), login, POST logout, profile update (validated)
    │   ├── event.js              # CRUD (validateEvent), atomic likes ($addToSet/$pull), search (regex-escaped, paginated), deletion guard
    │   ├── booking.js            # Atomic book/cancel (findOneAndUpdate, paginated)
    │   ├── upload.js             # S3 profile photo upload
    │   └── recommend.js          # ML proxy with API key + aggregation-based fallback sort
    ├── services/
    │   └── seatLock.js           # Redis distributed lock (fail-safe: denies if Redis down)
    └── utils/
        └── validation.js         # validateSignup, validateEvent, escapeRegex
```

## Author

**Tarun Bommali**
