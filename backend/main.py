from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes import auth, chat, documents, upload

app = FastAPI(
    title="DocuMind API",
    description="RAG-powered document chat backend",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "service": "documind-backend"}


app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(chat.router)
app.include_router(documents.router)
