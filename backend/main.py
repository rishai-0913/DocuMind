from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="DocuMind API",
    description="RAG-powered document chat backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "documind-backend"}


# Routes will be registered here as they are built:
# from routes import upload, chat, documents
# app.include_router(upload.router)
# app.include_router(chat.router)
# app.include_router(documents.router)
