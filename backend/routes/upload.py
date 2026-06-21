import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from auth import require_auth
from config import settings
from models.schemas import UploadResponse
from rag.chunker import chunk_text
from rag.embedder import add_document
from rag.loader import extract_text
from storage import load_metadata, save_metadata

router = APIRouter(tags=["upload"])

_ALLOWED = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/plain": ".txt",
}
_UPLOAD_DIR = Path("uploads")


@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_document(file: UploadFile = File(...), _: str = Depends(require_auth)):
    # Validate MIME type
    mime = file.content_type or ""
    # Also accept by extension when content_type is generic
    ext_by_name = Path(file.filename or "").suffix.lower()
    ext_map = {".pdf": ".pdf", ".docx": ".docx", ".txt": ".txt"}

    if mime in _ALLOWED:
        ext = _ALLOWED[mime]
    elif ext_by_name in ext_map:
        ext = ext_by_name
    else:
        raise HTTPException(
            400,
            f"Unsupported file type. Allowed: PDF, DOCX, TXT. Got: {mime or ext_by_name}",
        )

    content = await file.read()
    size_mb = len(content) / 1_048_576
    if size_mb > settings.max_file_size_mb:
        raise HTTPException(
            413,
            f"File too large ({size_mb:.1f} MB). Limit: {settings.max_file_size_mb} MB.",
        )

    doc_id = str(uuid.uuid4())
    _UPLOAD_DIR.mkdir(exist_ok=True)
    tmp = _UPLOAD_DIR / f"{doc_id}{ext}"

    try:
        tmp.write_bytes(content)
        text = extract_text(str(tmp))
        if not text.strip():
            raise HTTPException(422, "Document is empty or text could not be extracted.")

        chunks = chunk_text(text, settings.chunk_size, settings.chunk_overlap)
        add_document(doc_id, chunks)

        record = {
            "doc_id": doc_id,
            "filename": file.filename or f"document{ext}",
            "file_type": ext.lstrip("."),
            "file_size_bytes": len(content),
            "chunk_count": len(chunks),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        meta = load_metadata()
        meta[doc_id] = record
        save_metadata(meta)

    except HTTPException:
        tmp.unlink(missing_ok=True)
        raise
    except Exception as e:
        tmp.unlink(missing_ok=True)
        raise HTTPException(500, f"Processing failed: {e}") from e

    return UploadResponse(**record)
