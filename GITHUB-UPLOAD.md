# —————————————————————————————————————————————————————————————————————————————
# Smart Bus Tracking — GitHub Upload Checklist
# Read this BEFORE your first `git push` to a new GitHub repo.
# —————————————————————————————————————————————————————————————————————————————

# ==============================================================================
# STEP 0 — Make sure NO SECRETS are about to be uploaded (CRITICAL!)
# ==============================================================================
#
#   All of these files MUST be gitignored (already are in the root .gitignore):
#     - backend/.env      frontend/.env      mobile-driver/.env
#     - All dist/ build outputs
#     - All node_modules/
#
#   Double-check by running this command from the repo root (in Git Bash):
#
#     git status --ignored
#
#   If you see any .env file listed under "Untracked files", STOP before committing.
#   If you ever accidentally commit a .env, rotate the MONGO_URI password + JWT_SECRET
#   immediately in MongoDB Atlas + Render dashboard + all 3 local .env files.

# ==============================================================================
# STEP 1 — Initialize a fresh Git repo (run inside SmartBusTracking/)
# ==============================================================================

git init
git checkout -b main

# ==============================================================================
# STEP 2 — Verify .gitignore is working correctly
# ==============================================================================

git status

# Good output looks like:
#   Untracked files:
#     README.md
#     LICENSE
#     CONTRIBUTING.md
#     render.yaml
#     .gitignore
#     .gitattributes
#     .editorconfig
#     backend/...
#     frontend/...
#     mobile-driver/...
#     docs/...
#
# There should be NO mention of: node_modules, .env, dist, build.

# ==============================================================================
# STEP 3 — First commit
# ==============================================================================

git add .
git commit -m "Initial commit: Smart Bus Tracking (MERN monorepo — backend + passenger frontend + driver app + docs)"

# ==============================================================================
# STEP 4 — Create the GitHub repo
# ==============================================================================
#
#   Option A (via GitHub CLI — easiest):
#     gh repo create SmartBusTracking --public --source . --remote origin --push
#
#   Option B (via GitHub website):
#     1. Go to https://github.com/new
#     2. Repository name:  SmartBusTracking
#     3. Visibility:        Public (or Private — your call)
#     4. ⚠️ DO NOT check "Add a README" / "Add .gitignore" / "Add license" — we already have them
#     5. Click "Create repository"
#     6. Follow the "…or push an existing repository from the command line" box:
#
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/SmartBusTracking.git
git branch -M main
git push -u origin main

# ==============================================================================
# STEP 5 — After push
# ==============================================================================
#
#   - Open https://github.com/YOUR_GITHUB_USERNAME/SmartBusTracking → verify all
#     folders show up (backend, frontend, mobile-driver, docs, render.yaml, etc.)
#   - Click into the 3 .env.example files to confirm they ONLY have placeholders
#     — not your real passwords/JWT secrets
#   - (Optional) Under Settings → Branches, add a branch protection rule for
#     `main`: Require pull request reviews before merging, Require status checks.
#   - (Optional) Add a GitHub Social Preview image under Settings → General.

# ==============================================================================
# STEP 6 — Future pushes
# ==============================================================================

git add .
git commit -m "feat: add search-by-route-number on dashboard"
git push origin main
