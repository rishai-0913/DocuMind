from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import ChatRequest, ChatResponse, SourceChunk
from rag.chain import answer, answer_stream
from storage import load_metadata

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    meta = load_metadata()
    if req.doc_id not in meta:
        raise HTTPException(404, f"Document '{req.doc_id}' not found.")

    history = [{"user": t.user, "assistant": t.assistant} for t in req.history]
    result = answer(req.doc_id, req.message, history)

    return ChatResponse(
        answer=result["answer"],
        sources=[SourceChunk(**s) for s in result["sources"]],
    )


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    meta = load_metadata()
    if req.doc_id not in meta:
        raise HTTPException(404, f"Document '{req.doc_id}' not found.")

    history = [{"user": t.user, "assistant": t.assistant} for t in req.history]

    return StreamingResponse(
        answer_stream(req.doc_id, req.message, history),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
