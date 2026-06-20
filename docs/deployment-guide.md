# DocuMind — Deployment Guide

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- [Node.js](https://nodejs.org/) 18+ (for local frontend dev without Docker)
- [Python](https://www.python.org/) 3.10+ (for local backend dev without Docker)
- A free [Groq](https://console.groq.com) account for the LLM API key
- A [GitHub](https://github.com) account (for Railway + Vercel auto-deploy)

---

## Step 1 — Get Your Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with Google or email (no credit card required)
3. Navigate to **API Keys** → **Create API Key**
4. Copy the key — it starts with `gsk_...`

**Free tier limits:**
- 14,400 requests/day
- 30 requests/minute
- Llama 3.1 70B: 6,000 tokens/minute

---

## Step 2 — Configure Environment Variables

Create `backend/.env` (never commit this file):

```env
GROQ_API_KEY=gsk_your_key_here
APP_ENV=development
MAX_FILE_SIZE_MB=10
CHROMA_PERSIST_DIR=./chroma_db
```

Create `backend/.env.example` (commit this as a template):

```env
GROQ_API_KEY=your_groq_api_key_here
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
git clone https://github.com/your-username/rag-document-chat.git
cd rag-document-chat

# Add your .env file
cp backend/.env.example backend/.env
# Edit backend/.env and paste your GROQ_API_KEY

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
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# First run downloads the embedding model (~90MB, one-time)
uvicorn main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev     # Starts on http://localhost:5173
```

> Note: The embedding model (`all-MiniLM-L6-v2`) downloads automatically on first run and caches locally. Subsequent runs are fully offline.

---

## Production Deployment

### Backend → Railway

Railway provides a free tier with persistent volumes, which ChromaDB needs to keep vector data between restarts.

**Steps:**

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select the `rag-document-chat` repository
4. Set the **Root Directory** to `backend`
5. Railway auto-detects the `Dockerfile` and builds it
6. Go to **Variables** and add:
   ```
   GROQ_API_KEY=gsk_your_key_here
   APP_ENV=production
   CHROMA_PERSIST_DIR=/data/chroma_db
   ```
7. Add a **Persistent Volume**:
   - Mount path: `/data`
   - This keeps ChromaDB data across redeploys
8. Railway provides a public URL like `https://your-app.up.railway.app`

---

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import from GitHub
2. Select the `rag-document-chat` repository
3. Set **Root Directory** to `frontend`
4. Add an environment variable:
   ```
   VITE_API_URL=https://your-app.up.railway.app
   ```
5. Click **Deploy** — Vercel builds and publishes automatically
6. Any push to `main` triggers a new deploy

---

### Environment Variables Reference

| Variable | Where | Description |
|----------|-------|-------------|
| `GROQ_API_KEY` | Backend | Groq LLM API key (required) |
| `APP_ENV` | Backend | `development` or `production` |
| `MAX_FILE_SIZE_MB` | Backend | Max upload size (default: 10) |
| `CHROMA_PERSIST_DIR` | Backend | Path for ChromaDB data |
| `VITE_API_URL` | Frontend | Backend URL (Railway URL in prod) |

---

## Docker Compose Reference

```yaml
# docker-compose.yml (summary)
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    volumes:
      - chroma_data:/app/chroma_db
    env_file: ./backend/.env

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on: [backend]

volumes:
  chroma_data:
```

---

## Verifying the Deployment

After deploying, run through this checklist:

- [ ] Frontend loads at the Vercel URL
- [ ] Upload a small PDF — no errors, document appears in sidebar
- [ ] Ask a question — response returns with source citation
- [ ] Ask a follow-up question — conversation context is maintained
- [ ] Delete the document — document removed from sidebar
- [ ] Check Railway logs for any backend errors

---

## Common Issues

**`GROQ_API_KEY not set` error on startup**
→ Confirm the `.env` file exists in `backend/` and the key starts with `gsk_`.

**ChromaDB data lost on Railway redeploy**
→ Ensure the persistent volume is mounted at the correct path (`/data`) and `CHROMA_PERSIST_DIR=/data/chroma_db`.

**Frontend can't reach backend**
→ Check `VITE_API_URL` is set to the Railway backend URL (no trailing slash).

**Embedding model download hangs on first run**
→ The `all-MiniLM-L6-v2` model is ~90MB. Allow a minute on first startup. Subsequent starts are instant.

**File upload rejected for a valid PDF**
→ Check `MAX_FILE_SIZE_MB` — the file may exceed the 10MB limit.
