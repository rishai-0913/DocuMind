from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from auth import require_auth
from models.schemas import DeleteResponse, DocumentInfo, DocumentListResponse
from rag.embedder import delete_vectorstore
from storage import load_metadata, save_metadata

_UPLOAD_DIR = Path("uploads")

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=DocumentListResponse)
async def list_documents():
    meta = load_metadata()
    docs = sorted(meta.values(), key=lambda d: d["created_at"], reverse=True)
    return DocumentListResponse(documents=[DocumentInfo(**d) for d in docs])


@router.get("/{doc_id}", response_model=DocumentInfo)
async def get_document(doc_id: str):
    meta = load_metadata()
    if doc_id not in meta:
        raise HTTPException(404, f"Document '{doc_id}' not found.")
    return DocumentInfo(**meta[doc_id])


_MIME_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
}

@router.get("/{doc_id}/file")
async def serve_document_file(doc_id: str, download: bool = False):
    meta = load_metadata()
    if doc_id not in meta:
        raise HTTPException(404, f"Document '{doc_id}' not found.")
    info = meta[doc_id]
    ext = info["file_type"]
    path = _UPLOAD_DIR / f"{doc_id}.{ext}"
    if not path.exists():
        raise HTTPException(404, "File not found on disk.")
    mime = _MIME_TYPES.get(ext, "application/octet-stream")
    headers = {}
    if download:
        headers["Content-Disposition"] = f'attachment; filename="{info["filename"]}"'
    else:
        headers["Content-Disposition"] = f'inline; filename="{info["filename"]}"'
    return FileResponse(path=str(path), media_type=mime, headers=headers)


@router.delete("/{doc_id}", response_model=DeleteResponse)
async def delete_document(doc_id: str, _: str = Depends(require_auth)):
    meta = load_metadata()
    if doc_id not in meta:
        raise HTTPException(404, f"Document '{doc_id}' not found.")

    try:
        delete_vectorstore(doc_id)
    except Exception:
        pass  # collection may not exist if ingestion failed mid-way

    del meta[doc_id]
    save_metadata(meta)
    return DeleteResponse(deleted=doc_id)
