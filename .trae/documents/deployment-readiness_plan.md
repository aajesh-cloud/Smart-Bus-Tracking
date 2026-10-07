# Deployment Readiness Implementation Plan

## Repository Research

Current deployment state of the codebase:

**Backend (Render)**:
- `render.yaml` exists at repo root with 1 Node web service (`smart-bus-backend`, plan `free`, region `oregon`).
- Issues found in current `render.yaml`:
  - Uses `cd backend && npm install` style commands instead of the cleaner/official `rootDir: backend` key.
  - `MONGO_URI` description has a TYPO — says `/smartbustracking` but the real DB is `/smart_bus_tracking` (underscore). Copy-pasters will put the wrong DB name.
  - Missing `NODE_ENV=production` env var — without it some middlewares run in dev mode with verbose stack traces.
  - `PORT` hard-coded to 10000 — Render convention is to let Render set it dynamically (but 10000 is fine; we'll keep explicit).
- `backend/src/server.js`:
  - CORS origin fallback list has a hard-coded `smart-bus-tracking-nine.vercel.app` ✓ but also the old `smart-bus-frontend-lyart.vercel.app` (old alias, harmless but stale).
  - Health check `/` exists → JSON response. Correct for `healthCheckPath: /`.
- `backend/package.json`:
  - Missing `engines` field. Render/Vercel use this to pin Node version. Currently `NODE_VERSION=20.11.0` is only in render.yaml env var.

**Frontend + Driver App (Vercel)**:
- `frontend/vercel.json` and `mobile-driver/vercel.json` both exist and are CORRECT (Vite preset, SPA rewrites, dist output, cleanUrls).
- BUT neither frontend nor driver `package.json` has `engines` — Vercel defaults keep moving; pinning avoids future Node version drift breaking builds.
- Both `vite.config.js` files are minimal `plugins: [react()]` — correct for Vercel sub-pathless deployment at domain root.

**Docs**:
- `README.md` has a Deployment section with Render + Vercel high-level steps.
- `docs/Installation-Guide.md` covers local setup only; there is NO single "copy-paste exact steps" document for deployment.
- No DEPLOYMENT.md document at the moment.

## Files and Modules

- `render.yaml`: Fix `rootDir`, fix MONGO_URI description typo, add `NODE_ENV=production`, simplify build/start commands.
- `backend/package.json`: Add `engines: { node: ">=20" }` + pin npm.
- `frontend/package.json`: Add `engines: { node: ">=20" }`.
- `mobile-driver/package.json`: Add `engines: { node: ">=20" }`.
- `backend/src/server.js`: Clean stale CORS origins, keep the two correct URLs + localhost.
- **Create** `frontend/.vercelignore` (excludes `.env`, `.env.local`, `public/fake-*.png`, `node_modules`).
- **Create** `mobile-driver/.vercelignore` (same idea).
- **Create** `DEPLOYMENT.md` at repo root — click-by-click deployment guide for:
  1. Step 0: Upload repo to GitHub.
  2. Step 1: Deploy Backend on Render (Blueprint from `render.yaml` OR manual) + env vars + final verify URL.
  3. Step 2: Deploy Passenger Frontend on Vercel (GitHub import, root dir=`frontend`, env vars `VITE_API_URL`, `VITE_SOCKET_URL`).
  4. Step 3: Deploy Driver App on Vercel (same, root dir=`mobile-driver`).
  5. Step 4: Post-deploy link-up: update Render `ALLOWED_ORIGINS` with the real Vercel URLs.
  6. Step 5: Seed demo users (`node _seed-demo-users.js`) + sanity smoke tests.
  7. Step 6: Troubleshooting matrix (build fails, CORS blocked, Mongo fails, no real-time).
- Optional: Fix `backend/.env` currently has `MONGO_URI=mongodb://127.0.0.1:27017/SmartBusTracking` (user reset it earlier; leave alone — it's gitignored anyway).

## Implementation Steps

1. Fix `render.yaml`:
   - Add `rootDir: backend` to the service.
   - Change `buildCommand` to `npm install` (no cd).
   - Change `startCommand` to `npm start` (no cd).
   - Fix MONGO_URI description to `/smart_bus_tracking`.
   - Add env var `NODE_ENV=production`.
   - Keep health check path as `/` (already correct).
2. Add `engines` field to all 3 `package.json` files (node `>=20.11.0`, npm optional).
3. Tidy `backend/src/server.js` allowedOrigins list: keep `smart-bus-tracking-nine.vercel.app` (primary passenger), `smart-bus-driver.vercel.app` (primary driver), localhost 5173, localhost 5174.
4. Create `frontend/.vercelignore` + `mobile-driver/.vercelignore`.
5. Write comprehensive `DEPLOYMENT.md` with exact click-steps + screenshots-style headings + full matrix of all env vars by platform.
6. Validation: re-run both `frontend` and `mobile-driver` builds to confirm NO regressions after package.json edits.
7. Output a final summary telling the user the 6 buttons they need to click on Render/Vercel web UIs, because the CLI can't touch those for them.

## Dependencies and Considerations

- Render Blueprint (`render.yaml`) is the recommended path — it saves clicking 10+ env var UI boxes. But the user can also deploy manually if they want; DEPLOYMENT.md covers both.
- Render free plan has: 750h/month, 512MB RAM, 0.1CPU, cold-start on wake. Good enough for a college demo; warn user.
- Vercel Hobby plan is free forever for non-commercial. Good.
- ORDER MATTERS: Deploy backend FIRST (get its URL → fill in frontend/driver VITE_* env vars at import time so build is baked).
- Then deploy 2 frontends, get their URLs, finally go back to Render → Env Groups to update `ALLOWED_ORIGINS` (and redeploy backend one more time).
- IP whitelist in Atlas MUST include `0.0.0.0/0` for Render because Render's outbound IPs are dynamic (no fixed list).

## Validation

1. `cd frontend && npm run build` → exit 0.
2. `cd mobile-driver && npm run build` → exit 0.
3. VS Code GetDiagnostics → 0 errors.
4. Grep for typos like `/smartbustracking` in repo → 0 matches after render.yaml fix.
5. Visually scan `DEPLOYMENT.md` sections match render.yaml env vars exactly (no mismatched key names).

## Risks

- **Risk 1 — Render Blueprint "sync: false" env vars still require user input.** Mitigation: DEPLOYMENT.md calls these out explicitly.
- **Risk 2 — User deploys frontends before backend, has to rebuild.** Mitigation: DEPLOYMENT.md enforces strict order 1) backend → 2) frontend → 3) driver → 4) connect back.
- **Risk 3 — Vite build fails with wrong Node if engines not set months from now.** Mitigation: pinning engines at v20 in all 3 package.json files.
- **Risk 4 — Socket.IO on Render Web Service needs sticky sessions?** Our architecture doesn't need sticky sessions (each trip is one browser tab, one socket connection, and `bus-<busId>` room re-joins on reconnect). Fine on free plan without session affinity.
- **Risk 5 — Render free plan sleeps.** Mitigation: mention in DEPLOYMENT.md that first request wakes it up (10-30s delay). Suggest an UptimeRobot 5-minute ping if they want to keep it warm.
