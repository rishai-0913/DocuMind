from pydantic import BaseModel


class DocumentInfo(BaseModel):
    doc_id: str
    filename: str
    file_type: str
    file_size_bytes: int
    chunk_count: int
    created_at: str


class UploadResponse(DocumentInfo):
    pass


class HistoryTurn(BaseModel):
    user: str
    assistant: str


class ChatRequest(BaseModel):
    doc_id: str
    message: str
    history: list[HistoryTurn] = []


class SourceChunk(BaseModel):
    content: str
    chunk_index: int


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]


class DocumentListResponse(BaseModel):
    documents: list[DocumentInfo]


class DeleteResponse(BaseModel):
    deleted: str
