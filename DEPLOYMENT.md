# 🚀 Deployment Guide — Smart Bus Tracking

Three apps, three deployments, plus a MongoDB Atlas account. **Order matters** — deploy
in this exact sequence:

```
1️⃣  Backend (Render free plan)    → gives you a URL like https://smart-bus-backend-xxxxx.onrender.com
2️⃣  Passenger App (Vercel)        → uses backend URL for VITE_API_URL / VITE_SOCKET_URL
3️⃣  Driver App (Vercel)           → same two env vars
4️⃣  Post-deploy link-up           → add the 2 Vercel URLs to Render ALLOWED_ORIGINS → redeploy backend
5️⃣  Seed demo users + sanity-test
```

Total time: ~20 minutes for all three (most is waiting on builds).

---

## 📋 Pre-Deployment Checklist (Do This First!)

- [ ] Repository **pushed to GitHub** (see `GITHUB-UPLOAD.md` if not yet done)
- [ ] MongoDB Atlas account + cluster (free tier, M0 Sandbox, OK)
- [ ] Atlas **Database Access** user created (admin read/write)
- [ ] Atlas **Network Access** → `0.0.0.0/0` (Render outbound IPs are dynamic — no fixed list)
- [ ] You have your Atlas MONGO_URI with explicit shards (Option 2 in `.env.example`) ending with `/smart_bus_tracking`
- [ ] Render account (free, signup with GitHub) + Vercel account (free Hobby, signup with GitHub)

---

## 1️⃣ STEP 1 — Deploy Backend to Render

We use the `render.yaml` Blueprint at the repo root — it pre-defines everything so you
don't have to click 15 text boxes.

### Option A: Blueprint (Recommended, fastest)

1. Go to **https://dashboard.render.com/blueprints**
2. Click **New Blueprint Instance**
3. **Connect Repository** → pick the `SmartBusTracking` GitHub repo.
   - (Authorize Render to access it if it prompts.)
4. Under **Branch**: `main`
5. Under **Service Name**: whatever you like (e.g. `smart-bus`)
6. Click **Apply**.
7. Render parses `render.yaml` and creates the `smart-bus-backend` web service. It
   auto-starts provisioning. Wait for the "sync: false" prompts.
8. **Environment Variables** — click the two that say `sync: false` → paste:
   - **`MONGO_URI`**  → the full `mongodb://...` explicit 3-shard URI ending in `/smart_bus_tracking?ssl=true&replicaSet=...&authSource=admin&...`
     *Copy this from Atlas → Database → Connect → Connect your application → then convert it to the explicit-shard form as documented in `backend/.env.example` Option 2.*
   - **`ALLOWED_ORIGINS`**  → you can leave this BLANK for now (because defaultOrigins in `server.js` already includes `smart-bus-tracking-nine.vercel.app` + `smart-bus-driver.vercel.app`). We'll come back and fill it precisely after Step 3.
9. Wait for Render to say `✅ Deployed` and get your **backend public URL**:
   - Looks like: `https://smart-bus-tracking-abpb.onrender.com`
   - Click it → confirm you see JSON: `{ "message": "Smart Bus Tracking backend is running!", "status": "success" }`. If you see this, backend is LIVE.

### Option B: Manual Render Deploy (if Blueprint UI is acting up)

1. Render dashboard → **New +** → **Web Service**
2. Connect `SmartBusTracking` repo.
3. Fill in the form:

   | Field          | Value                              |
   |----------------|------------------------------------|
   | Name           | smart-bus-backend                  |
   | Region         | Oregon (US West)                   |
   | Branch         | main                               |
   | Root Directory | `backend`                          |
   | Runtime        | Node                               |
   | Build Command  | `npm install`                      |
   | Start Command  | `npm start`                        |
   | Plan           | Free                               |

4. **Advanced → Environment Variables** → click **Add Secret File** / **Add from File** or paste one-by-one the same 6 env vars from `render.yaml`:
   ```
   NODE_VERSION    = 20.11.0
   NODE_ENV        = production
   PORT            = 10000
   MONGO_URI       = mongodb://...your-explicit-shard-uri.../smart_bus_tracking?... (sync: false)
   JWT_SECRET      = Generate → Render makes a strong one for you
   JWT_EXPIRES_IN  = 7d
   ALLOWED_ORIGINS = (leave blank, fill after Vercel step)
   ```
5. Click **Create Web Service**. Wait for the green LIVE banner.
6. Health check: open the Render URL in browser → `GET /` should return the JSON status message.

> ⏰ **NOTE:** Render free plan sleeps after 15 minutes of inactivity. The first request
> to it takes 10–30 seconds to "wake up". That is NORMAL. After waking, it's instant.
> If you want it warm 24/7, set up a free monitor at <https://uptimerobot.com> → HTTP
> monitor every 5 minutes → hits `https://<your-backend>.onrender.com/`.

---

## 2️⃣ STEP 2 — Deploy Passenger Frontend to Vercel

1. Go to **https://vercel.com/new**
2. **Import Git Repository** → pick `SmartBusTracking` → click **Import**.
3. **Project Settings**:
   - **Project Name**:  `smart-bus-tracking-nine` (this becomes the URL: `https://smart-bus-tracking-nine.vercel.app`)
   - **Framework Preset**: Vite (auto-detected — good)
   - **Root Directory** ⚠️  **Click EDIT → type `frontend` → Save.** (This is the #1 mistake.)
4. **Environment Variables** (click Add → paste each):
   ```
   Name              Value
   —————————————     ———————————————————————————————————————————————
   VITE_API_URL      https://<your-render-backend-host>.onrender.com/api
   VITE_SOCKET_URL   https://<your-render-backend-host>.onrender.com
   ```
   **IMPORTANT:** No trailing slash after `onrender.com`. `/api` goes ONLY on `VITE_API_URL`.

   Example:
   ```
   VITE_API_URL    = https://smart-bus-tracking-abpb.onrender.com/api
   VITE_SOCKET_URL = https://smart-bus-tracking-abpb.onrender.com
   ```
5. Click **Deploy**. Wait for Build Logs → looks like:
   ```
   [1/4] Resolving packages
   [2/4] Fetching packages
   [3/4] Linking dependencies
   [4/4] Building fresh packages
   ▲ Vercel CLI ...
   vite v8.2.1 building for production...
   ✓ 1562 modules transformed.
   ✓ built in 2.10s
   ```
6. When complete → click **Continue to Dashboard** → copy the **Domains** URL (should be
   `https://smart-bus-tracking-nine.vercel.app` if you set the project name, otherwise
   Vercel picks a random one — write it down).
7. Open it → you should see the passenger Login page.
8. (Optional) If Vercel assigned a random domain name and you want the short one, go
   to **Settings → Domains → Edit** → pick a name you like.

---

## 3️⃣ STEP 3 — Deploy Driver App to Vercel (separate project!)

You're doing this **again, as a brand-new Vercel project** (not the same one), because
the driver app has a completely different build root (`mobile-driver/`).

1. Go to **https://vercel.com/new** (again)
2. Import the **same** `SmartBusTracking` repo.
3. **Project Settings**:
   - **Project Name**:  `smart-bus-driver`  → URL `https://smart-bus-driver.vercel.app`
   - **Root Directory** ⚠️ Edit → `mobile-driver` → Save.
   - Framework Preset: Vite (auto-detected)
4. **Environment Variables** — paste the **SAME TWO** as the passenger app:
   ```
   VITE_API_URL    = https://<your-render-backend-host>.onrender.com/api
   VITE_SOCKET_URL = https://<your-render-backend-host>.onrender.com
   ```
5. Click **Deploy**. Wait for the build.
6. When complete → copy the domain URL → should be `https://smart-bus-driver.vercel.app`.
7. Open it → you should see the Driver App Login page.

---

## 4️⃣ STEP 4 — Link Them All Together (CORS handshake)

We now have 3 URLs in hand:

```
Backend:    https://<your-backend>.onrender.com
Passenger:  https://smart-bus-tracking-nine.vercel.app    (or whichever Vercel assigned)
Driver:     https://smart-bus-driver.vercel.app
```

The backend's default `server.js` origin list already includes the two most common
Vercel URLs, **BUT** to be perfectly safe with any custom domain name you chose, go:

1. **Render Dashboard → smart-bus-backend → Environment**
2. Find (or add) the env var **`ALLOWED_ORIGINS`**
3. Set value to a **comma-separated list with NO TRAILING SLASHES**:
   ```
   https://smart-bus-tracking-nine.vercel.app, https://smart-bus-driver.vercel.app
   ```
   (Add more comma-separated URLs if you're using custom domains.)
4. Click **Save Changes** → Render automatically redeploys.  Wait for the new deploy
   to finish (~2 minutes). This is required — env var changes only take effect after
   restart.

---

## 5️⃣ STEP 5 — Seed Demo Users & Smoke Test

The backend codebase ships with a seed script at `backend/_seed-demo-users.js` which
creates 5 accounts (1 admin, 2 drivers, 2 passengers). Run it from your LOCAL machine
(connecting to the PRODUCTION Mongo database):

1. On your local machine, `cd SmartBusTracking/backend`
2. Temporarily set your `MONGO_URI` in `backend/.env` to the **same production Atlas
   URI** (the same 3-shard one you pasted into Render). Make sure it targets the
   `/smart_bus_tracking` DB.
3. Run:
   ```bash
   node _seed-demo-users.js
   ```
4. It prints:
   ```
   ✅ Connected to MongoDB
   ✅ ADDED ADMIN      admin@smartbus.in   password: Admin@123
   ✅ ADDED DRIVER     driver.rajesh@smartbus.in   password: Driver@123
   ✅ ADDED DRIVER     driver.priya@smartbus.in    password: Driver@123
   ✅ ADDED PASSENGER  passenger.aarav@smartbus.in password: Passenger@123
   ✅ ADDED PASSENGER  passenger.ananya@smartbus.in password: Passenger@123
   ```
5. **Once seeded**, go to Render backend URL → `/` and confirm alive.

### 🧪 Smoke Tests (in order)

| # | What to do (browser) | Pass criteria |
|---|----------------------|---------------|
| A | Open passenger Vercel URL. Click Register → make an account (or login as `admin@smartbus.in` / `Admin@123`). | Logs in → admin dashboard loads. |
| B | Admin → Drivers → Assign Bus → pick Rajesh → pick Bus 1 → save. | "Bus assigned to driver" toast. |
| C | Admin → Routes → open a route with 2+ stops → 🛣️ **Build Path** → run OSRM calc. | "Road path calculated (N points)" toast. |
| D | Open driver Vercel URL → login `driver.rajesh@smartbus.in` / `Driver@123` → select route → Start Trip. | "Trip started" → live GPS broadcasting message appears. |
| E | In passenger app → Dashboard → pick that route. | Live bus marker moves on Leaflet map; route line shows (admin-built `roadPath`). |
| F | In passenger app → set a Favorite Stop → wait for bus to approach. | Toast notification + bell unread badge increment. |
| G | Driver → Stop Trip. | Server updates Trip to `completed`. |

---

## 6️⃣ STEP 6 — Troubleshooting Matrix

| Symptom                                                                   | Root Cause (95% of cases)                                                                                                       | Fix                                                                                                                                                              |
|---------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Render deploy log: `MongoDB connection failed… IP whitelist`             | Atlas still has only your home IP; Render IPs are dynamic                                                                       | Atlas → Security → Network Access → **Add IP Address → ALLOW ACCESS FROM ANYWHERE** → confirm.                                                                  |
| Render deploy log: `bad auth Authentication failed.`                     | Wrong username or password in MONGO_URI, or forgot `/smart_bus_tracking` before `?`                                            | In Atlas → Database Access → reset password, copy the EXACT string from Connect UI, replace DB name with `smart_bus_tracking`.                                  |
| Vercel passenger login → network error / CORS block                      | Either: (a) you forgot `/api` on VITE_API_URL, (b) trailing slash, (c) backend ALLOWED_ORIGINS missing the frontend URL.       | Recheck env vars exactly (STEP 2 env values). Open browser DevTools → Network → see the failing request URL + Response Headers `Access-Control-Allow-Origin`.   |
| Live map loads but bus marker doesn't move                               | (a) Driver not on Active Trip, (b) Socket not connected (open Console → filter for `socket` errors).                            | In Vercel passenger project → env `VITE_SOCKET_URL` must be the same hostname as VITE_API_URL WITHOUT the `/api` suffix.                                        |
| Route line on map is a straight line instead of road-following curve     | Admin never hit "Build Path" → no cached `roadPath` → browser fallback to straight line works (but not pretty).                | Admin → Routes → **🛣️ Build Path** button per route. LiveMap then uses cached line instantly.                                   |
| Driver App opens but says "No bus assigned" on login even though seeded  | The 2 drivers were seeded into User table as `role:driver` but `assignedBus` is null — they need a Bus object + assignment.     | Admin → Buses → create Bus 1. Admin → Drivers → Assign Bus → Rajesh → Bus 1 → Save. Priya → Bus 2 → Save. Then log them out+in. |
| Vercel build: `Error: Cannot find module 'react'` / `npm ERR!`           | Wrong Root Directory on Vercel project. You pointed at the monorepo root not `frontend` or `mobile-driver`.                    | Vercel Project → Settings → General → Root Directory → retype `frontend` or `mobile-driver` → Save → Redeploy.                 |
| First request takes 20-30 seconds, then it's snappy                       | Render free plan cold start.                                                                                                    | Totally normal. For demos: open the backend URL in a tab 2 minutes before you start presenting, or add UptimeRobot 5-min ping.  |

---

## 🔑 All Environment Variables at a Glance

You'll copy-paste these across platforms during Steps 1-3. Save them in a password
manager so you don't have to rebuild from scratch.

| Variable            | Where it goes     | Example / Notes                                                                                         |
|---------------------|-------------------|---------------------------------------------------------------------------------------------------------|
| `PORT`              | Render env        | Always `10000`                                                                                          |
| `NODE_VERSION`      | Render env        | `20.11.0` (matches package.json engines)                                                               |
| `NODE_ENV`          | Render env        | `production`                                                                                            |
| `MONGO_URI`         | Render env        | Standard 3-shard `mongodb://` ending in `/smart_bus_tracking?ssl=true&replicaSet=...&authSource=admin` |
| `JWT_SECRET`        | Render env        | Long random (use Render "Generate value" button)                                                       |
| `JWT_EXPIRES_IN`    | Render env        | `7d`                                                                                                    |
| `ALLOWED_ORIGINS`   | Render env        | Fill AFTER Step 3 — your 2 Vercel URLs, comma separated, no trailing slash                             |
| `VITE_API_URL`      | Vercel (both FE)  | `https://<backend-host>.onrender.com/api`                                                              |
| `VITE_SOCKET_URL`   | Vercel (both FE)  | `https://<backend-host>.onrender.com`                                                                   |

---

## ☁️ Custom Domains (Optional, for college presentation)

If you own a domain (e.g. `smartbus.in`), go to each Vercel project → Settings →
Domains → Add → `app.smartbus.in` (passenger), `driver.smartbus.in` (driver). On
Render → Custom Domains → `api.smartbus.in`. Then update ALLOWED_ORIGINS +
`VITE_API_URL` + `VITE_SOCKET_URL` to use your domain.

---

Good luck with your project demo! 🎓
