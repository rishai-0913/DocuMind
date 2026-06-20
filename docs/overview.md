# DocuMind — Project Overview

## What Is DocuMind?

DocuMind is a full-stack AI-powered document chat application. Users upload any document — PDF, DOCX, or TXT — and immediately start asking questions about its contents in plain English. The system finds the most relevant parts of the document and generates accurate, grounded answers with source citations.

No summarisation. No hallucination. Just your document, made conversational.

---

## The Problem It Solves

Reading through a 50-page legal contract, a 200-page research paper, or a dense technical manual to find one specific answer is slow and error-prone. DocuMind lets you skip straight to the answer — and always tells you exactly where in the document it came from.

**Who it's for:**
- Researchers reviewing literature or reports
- Lawyers analysing contracts and case documents
- Students working through textbooks or lecture notes
- Businesses processing internal documentation, policies, or manuals

---

## How It Works

DocuMind uses **Retrieval-Augmented Generation (RAG)** — a pattern that combines semantic search with a large language model:

```
Upload → Extract → Chunk → Embed → Store
                                      ↓
Ask Question → Embed Query → Similarity Search → Retrieve Top Chunks
                                                         ↓
                                              LLM generates answer
                                              grounded in those chunks
```

1. **Upload** — User uploads a PDF, DOCX, or TXT file
2. **Extract** — Text is pulled from the file (PyMuPDF for PDFs, python-docx for DOCX)
3. **Chunk** — Text is split into 500-token segments with 50-token overlap to preserve context
4. **Embed** — Each chunk is converted to a vector using `sentence-transformers/all-MiniLM-L6-v2`
5. **Store** — Vectors are persisted in ChromaDB
6. **Query** — User's question is embedded, top-4 matching chunks are retrieved
7. **Generate** — LangChain passes retrieved chunks + last 6 messages to Llama 3.1 70B via Groq
8. **Respond** — Answer returned with source citations showing which chunks were used

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Tailwind CSS | Fast to build, clean UI |
| Backend | FastAPI (Python) | Async, fast, great for AI workloads |
| LLM Orchestration | LangChain | Handles RAG chain, memory, prompts |
| Vector Store | ChromaDB | Local, persistent, zero cost |
| Embeddings | `all-MiniLM-L6-v2` (sentence-transformers) | Runs fully local, ~90MB, no API cost |
| LLM | Groq API — Llama 3.1 70B | Free tier, fast inference |
| File Parsing | PyMuPDF + python-docx | Reliable extraction for PDF and DOCX |
| Containerisation | Docker + docker-compose | One-command local setup |
| Deployment | Railway + Vercel | Free tier, auto-deploy from GitHub |

**Total running cost: $0** — Groq's free tier covers development and demo usage. Embeddings run locally.

---

## Project Structure

```
rag-document-chat/
├── backend/
│   ├── main.py               # FastAPI app entry point and routes
│   ├── rag/
│   │   ├── loader.py         # File text extraction
│   │   ├── chunker.py        # Recursive text splitting
│   │   ├── embedder.py       # ChromaDB + sentence-transformers
│   │   └── chain.py          # LangChain RAG chain + memory
│   ├── models/
│   │   └── schemas.py        # Pydantic request/response models
│   ├── requirements.txt
│   ├── .env                  # Secret keys (never commit)
│   ├── .env.example          # Template (commit this)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Upload.tsx    # Drag-and-drop file uploader
│   │   │   ├── Chat.tsx      # Chat interface
│   │   │   └── SourcePanel.tsx # Source citation viewer
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
| POST | `/chat` | Send a message, get AI response + sources |
| GET | `/documents` | List all uploaded documents |
| DELETE | `/documents/{id}` | Delete a document and its vectors |

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
