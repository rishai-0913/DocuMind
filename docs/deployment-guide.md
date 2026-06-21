# DocuMind — Deployment Guide

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- [Node.js](https://nodejs.org/) 18+ (for local frontend dev without Docker)
- [Python](https://www.python.org/) 3.10+ (for local backend dev without Docker)
- A free [Groq](https://console.groq.com) account for the LLM API key
- A [GitHub](https://github.com) account (for Render + Vercel auto-deploy)

---

## Step 1 — Get Your Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with Google or email (no credit card required)
3. Navigate to **API Keys** → **Create API Key**
4. Copy the key — it starts with `gsk_...`

**Free tier limits:**
- 14,400 requests/day
- 30 requests/minute
- Llama 3.3 70B: 6,000 tokens/minute

---

## Step 2 — Configure Environment Variables

Create `backend/.env` (never commit this file):

```env
GROQ_API_KEY=gsk_your_key_here
AUTH_USERNAME=your_username
AUTH_PASSWORD=your_password
APP_ENV=production
MAX_FILE_SIZE_MB=10
CHROMA_PERSIST_DIR=./chroma_db
```

Create `backend/.env.example` (safe to commit as a template):

```env
GROQ_API_KEY=your_groq_api_key_here
AUTH_USERNAME=admin
AUTH_PASSWORD=changeme
APP_ENV=development
MAX_FILE_SIZE_MB=10
CHROMA_PERSIST_DIR=./chroma_db
```

Ensure `.env` is in `.gitignore`:

```gitignore
backend/.env
*.env
chroma_db/
__pycache__/
node_modules/
```

---

## Local Development

### Option A — Docker (Recommended)

Runs the full stack (backend + frontend) with a single command.

```bash
# Clone the repo
git clone git@github.com:your-username/DocuMind.git
cd DocuMind

# Add your .env file
cp backend/.env.example backend/.env
# Edit backend/.env and fill in GROQ_API_KEY, AUTH_USERNAME, AUTH_PASSWORD

# Build and start
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

To stop:
```bash
docker compose down
```

To rebuild after code changes:
```bash
docker compose up --build
```

---

### Option B — Without Docker

**Backend:**

```bash
cd backend
uv sync
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# First run downloads the embedding model (~90MB, one-time)
uvicorn main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev     # Starts on http://localhost:5173
```

> The embedding model (`BAAI/bge-small-en-v1.5`) downloads automatically on first run via FastEmbed. Subsequent runs are fully offline.

---

## Production Deployment

### Architecture

```
Browser → Vercel (React/Vite static)
              ↓ API requests
         Render Web Service (FastAPI)
              ↓ persists to disk
         Render Disk (chroma_db + uploads)
```

> **Storage note:** Render's free Web Service uses an **ephemeral filesystem** — ChromaDB data and uploaded files are wiped on every redeploy or restart. This is fine for demos. For persistent data, add a Render Disk ($0.25/GB/month) mounted at `/data`.

---

### Backend → Render Web Service

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New** → **Web Service**
3. Connect your GitHub repo and select it
4. Configure the service:
   - **Name:** `documind-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Docker` (Render auto-detects the `Dockerfile`)
   - **Instance Type:** Free
5. Under **Environment Variables**, add:
   ```
   GROQ_API_KEY=gsk_your_key_here
   AUTH_USERNAME=your_username
   AUTH_PASSWORD=your_password
   APP_ENV=production
   MAX_FILE_SIZE_MB=10
   CHROMA_PERSIST_DIR=./chroma_db
   ```
6. Click **Create Web Service**
7. Render builds the Docker image and provides a URL like:
   `https://documind-backend.onrender.com`

**Optional — Add a Persistent Disk:**

To keep uploaded files and ChromaDB data across restarts:
1. Go to your Web Service → **Disks** → **Add Disk**
2. Set mount path to `/data`
3. Update the environment variable: `CHROMA_PERSIST_DIR=/data/chroma_db`
4. Update `backend/routes/upload.py` upload dir to `/data/uploads` if needed

> **Cold starts:** Free tier services spin down after 15 minutes of inactivity. The first request after idle takes ~30 seconds to wake up. This is expected on the free plan.

---

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import from GitHub
2. Select the DocuMind repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
4. Under **Environment Variables**, add:
   ```
   VITE_API_URL=https://documind-backend.onrender.com
   ```
5. Click **Deploy**

Any push to `main` triggers an automatic redeploy on both Render and Vercel.

---

### Environment Variables Reference

| Variable | Where | Description |
|----------|-------|-------------|
| `GROQ_API_KEY` | Backend | Groq LLM API key (required) |
| `AUTH_USERNAME` | Backend | Login username |
| `AUTH_PASSWORD` | Backend | Login password |
| `APP_ENV` | Backend | `development` or `production` |
| `MAX_FILE_SIZE_MB` | Backend | Max upload size (default: 10) |
| `CHROMA_PERSIST_DIR` | Backend | Path for ChromaDB data |
| `VITE_API_URL` | Frontend | Backend URL (Render URL in prod) |

---

## Docker Compose Reference (Local)

```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    volumes:
      - chroma_data:/app/chroma_db
      - uploads_data:/app/uploads
    env_file: ./backend/.env

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on: [backend]

volumes:
  chroma_data:
  uploads_data:
```

---

## Verifying the Deployment

After deploying, run through this checklist:

- [ ] Frontend loads at the Vercel URL
- [ ] Login with `AUTH_USERNAME` / `AUTH_PASSWORD` works
- [ ] Continue as Guest — Upload page shows 1 free upload
- [ ] Upload a small PDF — document appears in My Documents
- [ ] Ask a question in Chat — response streams back with source citations
- [ ] Ask a follow-up — conversation context is maintained
- [ ] Delete a document — removed from list with loading state
- [ ] Check Render logs for any backend errors

---

## Common Issues

**Service wakes up slowly on first request**
→ Free Render instances sleep after 15 min idle. The first request takes ~30s to cold-start. Expected behaviour on the free plan.

**`GROQ_API_KEY not set` error on startup**
→ Confirm the environment variable is set in Render's dashboard under your Web Service → Environment.

**ChromaDB data lost after redeploy**
→ Free tier uses ephemeral storage. Add a Render Disk mounted at `/data` and set `CHROMA_PERSIST_DIR=/data/chroma_db` to persist data.

**Frontend can't reach backend (CORS error)**
→ Check `VITE_API_URL` is set to the full Render backend URL with no trailing slash. Also verify the backend's `cors_origins` env var includes the Vercel frontend URL.

**Add CORS origin for Vercel frontend**
→ Set this env var on Render:
```
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
```

**Embedding model download slow on first request**
→ `BAAI/bge-small-en-v1.5` (~90MB) downloads on first use via FastEmbed. Pre-warm by hitting the `/health` endpoint after deploy.

**File upload rejected for a valid PDF**
→ Check `MAX_FILE_SIZE_MB` — the file may exceed the 10MB default limit.
