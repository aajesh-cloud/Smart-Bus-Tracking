# 🚌 Smart Bus Tracking System

> A full-stack, real-time college bus tracking system built with the **MERN stack** (MongoDB, Express, React, Node.js) and Socket.IO.
> Passengers track buses live on a Leaflet / OpenStreetMap map, drivers share GPS from their phone's browser, and admins manage
> the entire fleet, routes, stops & drivers through a role-based dashboard. Three apps share a single backend:
> **Passenger Web App** (React + Leaflet) · **Driver Web App** (React + mobile-optimized) · **Admin Dashboard** (inside the passenger app).

---

## 📦 Project Structure (Monorepo)

```
SmartBusTracking/
├── backend/            Node.js · Express · Socket.IO · Mongoose (MongoDB Atlas)
│   └── src/
│       ├── config/         db.js · generateToken.js
│       ├── controllers/    6 CRUD + domain controllers (auth / bus / route / stop / trip / notification)
│       ├── middleware/     authMiddleware + role-based authorize()
│       ├── models/         User · Bus · Route · Stop · Trip · LiveLocation · Notification
│       ├── routes/         Express Routers (all protected behind JWT where needed)
│       ├── sockets/        Socket.IO handler: bus-<id> rooms, admin-room, ETA/busNearStop events
│       └── utils/          geoUtils.js  (Haversine distance + ETA + closest-stop detection)
├── frontend/           React + Vite — Passenger app + Admin dashboard
│   └── src/
│       ├── components/     LiveMap, NotificationBell, DataTable, + admin CRUD modals
│       ├── context/        AuthContext (JWT + axios interceptor) + ThemeContext
│       ├── pages/          Login, Register, Dashboard, Profile, /admin/* (Buses/Routes/Stops/Drivers)
│       └── services/       api.js · socket.js · geoHelpers.js (toLeafletCoords) · routingService.js (OSRM fallback)
├── mobile-driver/      React + Vite — Driver app (mobile-first, no map library)
│   └── src/
│       ├── context/        DriverAuthContext  (rejects non-driver tokens)
│       ├── hooks/          useGpsTracking (Browser Geolocation API, proper cleanup on unmount)
│       ├── pages/          Login, DriverHome, ActiveTrip
│       └── services/       api.js · socket.js · tripService.js
├── docs/               Extra documentation
│   ├── API-Documentation.md
│   ├── Architecture.md
│   ├── Installation-Guide.md
│   ├── Project-Report.md
│   └── database-design.md
├── render.yaml         Backend deploy-as-code for Render
├── .env.example        (Per-app templates live inside backend/ frontend/ mobile-driver/)
└── README.md           You are here.
```

---

## ✨ Features

### Passenger (Web)
- 🔐 JWT login / register (registration always creates **passenger** role — server-enforced)
- 🗺️ **Live map** (Leaflet + OpenStreetMap) with moving bus markers and stop pins
- 🛣️ **Road-following route lines** via OSRM — uses admin-cached `Route.roadPath` first,
  falls back to browser-side OSRM fetch if the admin hasn't prebuilt the route yet
- 🔎 Search & filter buses by number / route / destination
- 🏷️ Status badges: On Time · Delayed · Cancelled
- 🔔 Favorite-stop notifications: toast popups + unread-count bell (marked-read persists to DB)
- 🌓 Dark / light theme toggle
- 🧭 ETA to every stop on the selected route

### Driver (Web · Mobile-Optimized)
- 📱 Mobile-first layout, single-hand tap targets
- 🚍 Sign in → auto-detects assigned bus + routes available
- ▶️ Start trip / ⏹️ Stop trip (creates Trip docs, broadcasts `tripStarted`/`tripStopped`)
- 🛰️ **Continuous background GPS sharing** via `navigator.geolocation.watchPosition`
  (`LiveLocation` upsert — never more than one doc per bus)

### Admin (Dashboard inside Passenger App · role: admin)
- 📊 Dashboard with live stats
- ✏️ Full CRUD for **Buses, Routes, Stops, Drivers** (data tables + modals)
- 🛣️ **Build / Rebuild Road Path** per route (calls OSRM on the backend, caches GeoJSON LineString
  to `Route.roadPath` — passengers then get instant, zero-extra-calls map lines)
- 🔑 Role-based access control middleware on every mutating endpoint

### Real-Time (Socket.IO)
- Rooms: `bus-<busId>` for per-bus subscribers, `admin-room` for admin live overview
- Events: `locationUpdate`, `tripStarted`, `tripStopped`, `etaUpdate`, `busNearStop`

---

## 🧱 Tech Stack

| Layer           | Technology                                                  |
|-----------------|-------------------------------------------------------------|
| Backend         | Node.js 22+, Express 5, MongoDB Atlas, Mongoose 9           |
| Real-time       | Socket.IO 4, socket.io-client                               |
| Auth            | JSON Web Tokens (stateless), bcryptjs                       |
| Passenger UI    | React 19, Vite 7, React Router 7, Leaflet 1.9, Axios        |
| Driver UI       | React 19, Vite 7, Browser Geolocation API                   |
| Routing         | OSRM public server (`router.project-osrm.org`) — road-following |
| Deployment      | Render (backend), Vercel (frontend + driver app)            |
| Data Format     | MongoDB stores GeoJSON in `[longitude, latitude]`; Leaflet flipped via `toLeafletCoords()` |

---

## 🚀 Quick Start (Local Development)

### 0. Prerequisites
- Node.js **≥ 20** (check with `node -v`)
- A MongoDB Atlas cluster (free tier works — see note below about URIs)

### 1. Clone & install

```bash
git clone git@github.com:<your-user>/<your-repo>.git
cd SmartBusTracking

# Backend
cd backend
npm install
cp .env.example .env        # ← EDIT this file with your real MONGO_URI / JWT_SECRET / etc.
npm run dev                 # http://localhost:5000

# Passenger Frontend  (new terminal)
cd frontend
npm install
cp .env.example .env        # ← URLs default to localhost:5000 for local dev
npm run dev                 # http://localhost:5173

# Driver App        (new terminal)
cd mobile-driver
npm install
cp .env.example .env
npm run dev                 # http://localhost:5174
```

### 2. First run — set up the admin account
Public registration always creates a **passenger** (for security — no client-side role escalation is possible).
To create your first admin/driver accounts:

- **Option A (recommended):** use MongoDB Compass or `mongosh` to edit the `role` field on
  an existing user to `"admin"`. Then log in → `/admin`.
- **Option B:** from inside the admin panel, admins can create Drivers directly via the
  Admin → Drivers page.

### 3. Build the road route for each Route
Go to **Admin → Routes** and click 🛣️ **Build Path** for each route. This:

1. Loads the stops in order → calls OSRM segment-by-segment from the **backend** (server→server,
   no browser CORS issues)
2. Caches the resulting `LineString` into `Route.roadPath`
3. LiveMap then renders the cached line instantly with no per-passenger OSRM calls

> You can still click the button later to **Rebuild Path** if the stops change.

---

## 🔐 Environment Variables

Each app ships with a `.env.example` you copy → `.env` and edit:

| File                     | Variables you must set                                                                          |
|--------------------------|-------------------------------------------------------------------------------------------------|
| `backend/.env`           | `PORT`, `MONGO_URI`, `JWT_SECRET`, `ALLOWED_ORIGINS` (see `backend/.env.example`)               |
| `frontend/.env`          | `VITE_API_URL`, `VITE_SOCKET_URL`  (see `frontend/.env.example`)                                |
| `mobile-driver/.env`     | `VITE_API_URL`, `VITE_SOCKET_URL`  (see `mobile-driver/.env.example`)                           |

> ⚠️ **About `MONGO_URI`:** We deliberately use the **standard `mongodb://` URI** with
> *explicit shard hostnames* (`ac-drk3din-shard-00-00/01/02.emgocm1.mongodb.net:27017`),
> NOT the short `mongodb+srv://` form. On restricted / mobile-hotspot networks, SRV DNS
> lookups fail silently and crash the app — the standard URI avoids this entirely.

---

## ☁️ Deployment

### Backend (Render)
```
Root directory:       backend
Build command:        npm install
Start command:        node src/server.js
Environment vars:     PORT=10000
                      MONGO_URI=mongodb://… (paste the same string from local .env)
                      JWT_SECRET=… (long random)
                      NODE_ENV=production
                      ALLOWED_ORIGINS=https://<your-passenger>.vercel.app,https://<your-driver>.vercel.app
```
`render.yaml` at repo root pre-defines most of this. Confirm the secret values in Render dashboard (they're `sync: false`).

### Frontend / Driver App (Vercel)
**Do this twice**, once for `frontend/` and once for `mobile-driver/`:

```
Root directory:      frontend          (2nd time: mobile-driver)
Framework preset:    Vite
Build command:       npm install && npm run build
Output directory:    dist

Environment variables:
  VITE_API_URL       = https://<your-backend>.onrender.com/api
  VITE_SOCKET_URL    = https://<your-backend>.onrender.com
```

⚠️ **Critical:** Add the final Vercel URLs (passenger + driver) to the Render backend's
`ALLOWED_ORIGINS` list, AND make sure `backend/src/server.js` defaultOrigins array also
lists them (fallback when env var is not set).

---

## 🧪 Builds

```bash
# Passenger frontend (output → frontend/dist)
cd frontend && npm run build

# Driver frontend   (output → mobile-driver/dist)
cd mobile-driver && npm run build
```

Both output static sites — fully deployable to any static host.

---

## 📚 Additional Documentation

| Doc                                                        | Contents                                                                     |
|------------------------------------------------------------|------------------------------------------------------------------------------|
| [docs/Installation-Guide.md](docs/Installation-Guide.md)   | Step-by-step install with screenshots, known Windows quirks, Shell tips      |
| [docs/Architecture.md](docs/Architecture.md)               | Auth flow, Socket.IO room diagram, LiveLocation upsert strategy             |
| [docs/API-Documentation.md](docs/API-Documentation.md)     | Every REST endpoint, request/response bodies, auth headers                  |
| [docs/database-design.md](docs/database-design.md)         | Schemas, indexes, GeoJSON conventions, coordinate-order rule                |
| [docs/Project-Report.md](docs/Project-Report.md)           | Project-report write-up suitable for a college submission                   |

---

## 🔑 Key Architectural Decisions

1. **Single `User` collection** with `role` field (`passenger` / `driver` / `admin`), not separate collections.
2. **`LiveLocation.findOneAndUpdate({bus},{upsert:true})`** — at most one document per bus ever.
3. **MongoDB stores `[longitude, latitude]`** per GeoJSON RFC; `frontend/src/services/geoHelpers.js::toLeafletCoords()` flips to `[lat, lng]` for Leaflet.
4. **Stateless JWT** in `Authorization: Bearer <token>`; axios interceptors auto-attach + auto-redirect to login on 401.
5. **Socket.IO rooms:** `bus-<busId>` per bus; `admin-room` for everything.
6. **Public registration always `role: "passenger"` server-side**. Drivers/admins only via admin panel or direct DB edit.

---

## 🛡️ Security Notes

- All mutating admin endpoints have both `protect` (JWT valid) + `authorize("admin")` middleware.
- Driver AuthContext in `mobile-driver` **rejects non-driver tokens even if JWT is valid** (defense in depth).
- Passwords: hashed via `bcryptjs` 10 salt rounds, Mongoose `pre("save")` async (no `next()` callback — Mongoose 7+ pattern).
- `.env` + `*/.env` are in `.gitignore` — never paste secrets into the repo.

---

## 🐛 Known quirks that were "weird on Windows"

- All React + JSX files use the **`.jsx` extension, not `.js`** — Vite 500s otherwise,
  and there was a case-sensitivity bug (`DriverauthContext.js` vs `DriverAuthContext.jsx`)
  that wasted a whole afternoon. Don't reintroduce that.
- Windows `cmd.exe` breaks on `mkdir -p a/b/c` style — use PowerShell or Git Bash.

---

## 📄 License

MIT — see [LICENSE](LICENSE).

> 🎓 Built as a **college project** — full-stack development from scratch covering
> backend APIs, real-time systems, authentication/authorization, geospatial data,
> mapping and routing, mobile-first UI, and multi-app deployment pipelines.
