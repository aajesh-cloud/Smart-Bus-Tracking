# Contributing

Thanks for your interest in this college project! 🚌

This repo is primarily a **student project**, so the code is built for
maintainability and readability first. Here's what to know if you want to
hack on it locally or send changes back.

## Workflow

1. **Fork the repo** on GitHub
2. **Clone your fork:** `git clone git@github.com:<you>/SmartBusTracking.git`
3. **Create a feature branch:** `git checkout -b feature/add-route-search`
4. **Make your changes** — please try to keep commits small and focused.
5. **Verify builds pass:**
   ```bash
   cd frontend     && npm install && npm run build
   cd mobile-driver && npm install && npm run build
   ```
6. **Push** and open a pull request against the original repo.

## Conventions we follow

| Area                    | Rule                                                                     |
|-------------------------|--------------------------------------------------------------------------|
| File extension          | React components → `.jsx`. Plain JS utils → `.js`. Never mix them up.   |
| Coordinate order (DB)   | **Always `[longitude, latitude]`** (GeoJSON RFC). Flip only in `toLeafletCoords()` for the map. |
| Coordinate order (UI)   | Leaflet APIs use `[latitude, longitude]`. |
| Auth                    | Stateless JWT in `Authorization: Bearer <token>`. Axios interceptor auto-adds. |
| Socket.IO rooms         | `bus-<busId>` for per-bus, `admin-room` for admins. No "all" broadcast.  |
| Roles                   | Single `User` collection with `role` field. Never separate collections.  |
| Registration            | Public register server-side-forces `role: "passenger"`. Drivers/admins via admin panel only. |
| LiveLocation            | `findOneAndUpdate({bus}, {upsert:true})`. Never `save()` new docs per bus. |
| Env vars                | New ones get a line in the matching `*/.env.example` so other devs know they exist. |
| PR description          | Say *why*, not only *what*. Reference any issue numbers. |

## Reporting issues

Open a GitHub issue with:

- What you expected to happen
- What actually happened (copy/paste the exact error text / screenshot)
- Your OS + browser + Node version
- Steps to reproduce (as small / minimal as possible)

Thank you! —
