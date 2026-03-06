# EventIQ — Frontend

React SPA for the EventIQ platform. Provides event browsing with pagination, booking with seat selection, ML-powered recommendations, and user profile management.

## Tech Stack

- **React 19** + **TypeScript 5.8** — UI framework
- **Vite 6** — Build tool with HMR
- **Tailwind CSS 4** — Utility-first styling (via `@tailwindcss/vite`)
- **React Router 7** — Client-side routing
- **Axios** — HTTP client with cookie credentials

## Setup

```bash
cd frontend
npm install
```

Create `.env`:

```env
VITE_BACKEND_URL=http://localhost:3000/
```

```bash
npm run dev      # Vite dev server on port 5173
npm run build    # Production build (tsc + vite)
npm run preview  # Preview production build
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Email/password authentication (login + signup forms) |
| `/` | Home | Paginated event listing with search/filters + ML recommendations |
| `/bookings` | Bookings | User's booking history with cancel + like/dislike |
| `/events/new` | HostEvent | Create new event (organizer/admin only) |
| `/events/mine` | YourEvents | Organizer's hosted events list with clickable cards |
| `/events/mine/:id` | YourEventDetail | Individual hosted event details, attendees, booking search |
| `/events/:eventId` | EventDetail | Public event detail view |
| `/profile` | Profile | View/edit profile, upload photo, manage preferred categories |

## Features

- **Event Browsing** — Search by text, filter by category, city, event type (`seat`/`general`/`online`) with server-side pagination
- **Smart Booking** — Seat picker for seat-based events, ticket selector for general/online (atomic backend operations prevent overbooking)
- **Organizer Dashboard** — Dedicated "Your Events" page with per-event detail views showing attendee lists and booking search
- **ML Recommendations** — Personalized "Recommended for You" section on Home page powered by TF-IDF model
- **Recommendation Logging** — Clicks on recommended events are tracked via `POST /recommend/log` for ML training
- **Social** — Like/dislike toggle on event cards with real-time count updates
- **Profile Photos** — Upload via backend → AWS S3
- **Secure Auth** — httpOnly JWT cookies, `POST /logout` (CSRF-safe), `withCredentials` on all API calls
- **Form Validation** — Client-side validation synced with backend rules (8+ char password with uppercase, lowercase, number, symbol)
- **Error Handling** — `ErrorPage` wired as `errorElement` in React Router for graceful error display
- **Responsive** — Tailwind CSS responsive utilities for mobile/tablet/desktop

## API Integration

All API calls use Axios with `withCredentials: true` for cookie-based JWT auth.

| Component | API Calls |
|-----------|-----------|
| **Header** | `GET /me` (auth check), `POST /logout` |
| **Home** | `GET /events?page=&limit=` (paginated), `GET /recommend` |
| **EventCard** | `POST /booking/:id`, `POST /events/:id/like`, `POST /events/:id/dislike`, `POST /recommend/log` |
| **Bookings** | `GET /booking?page=&limit=`, `POST /booking/:id/cancel` |
| **HostEvent** | `POST /events` |
| **YourEvents** | `GET /events/my-events` |
| **YourEventDetail** | `GET /events/:id`, `GET /events/:id/booked-users` |
| **Login** | `POST /login`, `POST /signup` |
| **Profile** | `GET /profile`, `PATCH /profile`, `POST /upload/profile-photo` |

## Project Structure

```
frontend/
├── Dockerfile              # Multi-stage: node build + nginx serve
├── nginx.conf              # Reverse proxy /api/ → backend
├── netlify.toml            # Netlify deploy config
├── package.json
├── vite.config.ts          # Vite + Tailwind + dev proxy (/api → localhost:3000)
├── tsconfig.json
└── src/
    ├── App.tsx             # Router configuration (with errorElement)
    ├── main.tsx            # Entry point
    ├── components/
    │   ├── AppLayout.tsx   # Layout wrapper (Header + Outlet + Footer)
    │   ├── EventCard.tsx   # Event display, booking UI, likes, seat picker, recommendation logging
    │   ├── Header.tsx      # Navigation (incl. Your Events link), auth state, POST logout
    │   ├── Footer.tsx
    │   └── BookingController.tsx
    ├── context/
    │   └── AuthContext.tsx  # Auth state provider
    ├── pages/
    │   ├── Home.tsx        # Paginated events list + ML recommendations
    │   ├── Bookings.tsx    # User's bookings with cancel
    │   ├── HostEvent.tsx   # Create event form (organizer/admin)
    │   ├── YourEvents.tsx  # Organizer's hosted events list
    │   ├── YourEventDetail.tsx  # Individual hosted event details + attendees
    │   ├── EventDetail.tsx # Public event detail view
    │   ├── Login.tsx       # Login/signup forms with validation
    │   ├── Profile.tsx     # Profile view/edit + photo upload + category management
    │   └── ErrorPage.tsx   # 404 error boundary page
    └── utils/
        ├── constants.tsx   # BACKEND_URL from VITE_BACKEND_URL env var
        └── validation.ts   # Client-side form validation (synced with backend rules)
```

## Docker

The Dockerfile uses a multi-stage build:

1. **Build stage** — `node:20-alpine`, runs `npm run build` with `VITE_BACKEND_URL=/api/` build arg
2. **Serve stage** — `nginx:alpine`, serves static files with reverse proxy `/api/` → backend

```bash
docker build --build-arg VITE_BACKEND_URL=/api/ -t eventiq-frontend .
```

## Dev Proxy

In development, `vite.config.ts` proxies `/api` requests to `http://localhost:3000`, avoiding CORS issues during local development.

## Deployment

| Platform | Config | Notes |
|----------|--------|-------|
| **Netlify** | `netlify.toml` | SPA redirect + build settings |
| **Docker** | `Dockerfile` + `nginx.conf` | Multi-stage build, reverse proxy |
| **Docker Compose** | `docker-compose.yml` (root) | Full stack with backend + ML + DBs |

## Author

**Tarun Bommali**
