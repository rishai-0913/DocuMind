# DocuMind — AI Document Chat (RAG App)

## Overview

A full stack web application that lets users upload any document (PDF, DOCX, TXT) and have a natural language conversation with its contents. Powered by Retrieval-Augmented Generation (RAG) — the system extracts, chunks, embeds, and retrieves relevant context before generating accurate, grounded answers.

**Target users:** Researchers, lawyers, students, businesses handling large documents  
**Core value:** Ask questions in plain English, get answers from your own documents — no hallucination, fully grounded in source content

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Tailwind CSS |
| Backend | FastAPI (Python) |
| LLM Orchestration | LangChain |
| Vector Store | ChromaDB (local, free) |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` (local, free) |
| LLM | Groq API — `llama-3.1-70b-versatile` (free tier) |
| File Processing | PyMuPDF (PDF), python-docx (DOCX) |
| Containerisation | Docker + docker-compose |
| Deployment | Railway (backend) + Vercel (frontend) |

> **Cost: $0** — Groq free tier + local embeddings = no API costs during development or demo

---

## API Keys Setup

### 1. Groq API Key (LLM — free)

**Get your key:**
1. Go to `console.groq.com`
2. Sign up with Google or email
3. Go to **API Keys** → **Create API Key**
4. Copy the key (starts with `gsk_...`)

**Configure:**
```bash
# In backend/.env
GROQ_API_KEY=gsk_your_key_here
```

**Free tier limits:**
- 14,400 requests/day
- 30 requests/minute
- Llama 3.1 70B: 6,000 tokens/minute
- No credit card required

---

### 2. sentence-transformers (Embeddings — fully local)

No API key needed. Installs as a Python package and runs on your machine.

```bash
pip install sentence-transformers
```

Model (`all-MiniLM-L6-v2`) downloads automatically on first run (~90MB). After that it runs fully offline.

---

### 3. Environment File

Create `backend/.env`:

```env
# Groq — required
GROQ_API_KEY=gsk_your_key_here

# App config
APP_ENV=development
MAX_FILE_SIZE_MB=10
CHROMA_PERSIST_DIR=./chroma_db
```

Create `backend/.env.example` (commit this, not .env):

```env
GROQ_API_KEY=your_groq_api_key_here
APP_ENV=development
MAX_FILE_SIZE_MB=10
CHROMA_PERSIST_DIR=./chroma_db
```

Add `.env` to `.gitignore` — never commit your actual key.

---

## Features

### Core
- Upload PDF, DOCX, or TXT files (up to 10MB)
- Automatic text extraction and chunking
- Vector embedding and storage in ChromaDB
- Conversational Q&A with full chat history
- Source citations — shows which part of the document the answer came from
- Multiple document support — upload and switch between documents

### UI/UX
- Drag and drop file upload with progress indicator
- Chat interface with message bubbles (user + AI)
- Source highlight panel — click an answer to see the source chunk
- Document list sidebar — manage uploaded documents
- Typing indicator while AI is generating
- Mobile responsive

### Technical
- Chunking strategy: recursive text splitter (500 tokens, 50 overlap)
- Similarity search: top-k=4 most relevant chunks per query
- Conversation memory: last 6 messages passed as context
- Error handling: unsupported format, empty document, API failure
- File cleanup: temp files deleted after processing

---

## Project Structure

```
rag-document-chat/
├── backend/
│   ├── main.py               # FastAPI app + routes
│   ├── rag/
│   │   ├── loader.py         # File extraction
│   │   ├── chunker.py        # Text splitting
│   │   ├── embedder.py       # ChromaDB + sentence-transformers
│   │   └── chain.py          # LangChain RAG chain
│   ├── models/
│   │   └── schemas.py        # Pydantic request/response models
│   ├── requirements.txt
│   ├── .env                  # your keys (never commit)
│   ├── .env.example          # template (commit this)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Upload.tsx
│   │   │   ├── Chat.tsx
│   │   │   └── SourcePanel.tsx
│   │   └── App.tsx
│   ├── package.json
│   └── Dockerfile
├── .gitignore
└── docker-compose.yml
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload and process a document |
| POST | `/chat` | Send a message, receive AI response + sources |
| GET | `/documents` | List uploaded documents |
| DELETE | `/documents/{id}` | Delete a document |

---

## Deployment

```bash
# Local
docker compose up --build

# Backend: localhost:8000
# Frontend: localhost:3000
```

**Production:**
- Backend → Railway (free tier, auto-deploy from GitHub)
  - Add `GROQ_API_KEY` in Railway environment variables
- Frontend → Vercel (free tier)
- ChromaDB → persistent volume on Railway

**Setting keys on Railway:**
1. Go to your Railway project → service → **Variables**
2. Add `GROQ_API_KEY` = your key
3. Railway auto-restarts the service

---

## Estimated Build Time

| Phase | Time |
|-------|------|
| Backend RAG pipeline | 1 day |
| FastAPI routes + file handling | 0.5 day |
| React frontend + chat UI | 1 day |
| Integration + testing | 0.5 day |
| Docker + deployment | 0.5 day |
| **Total** | **~3.5 days** |

---

## Portfolio Value

- Demonstrates RAG architecture end-to-end
- Directly maps to most requested AI Upwork/Fiverr jobs
- Live demo link impresses clients immediately
- Covers: LangChain, Groq, FastAPI, React, ChromaDB, Docker
- **Zero cost to run** — easy to keep live for portfolio demo
