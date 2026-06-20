# DocuMind — Features

## Core Features

### Document Upload
- Supports **PDF, DOCX, and TXT** file formats
- File size limit: **10MB**
- Drag-and-drop interface with click-to-browse fallback
- Upload progress indicator
- Automatic text extraction on upload — no manual steps
- Temp files deleted from disk after processing

### RAG-Powered Q&A
- Ask questions in plain English about any uploaded document
- Answers are **strictly grounded** in the document content — no fabrication
- Every answer includes **source citations** showing which part of the document was used
- Top-4 most semantically relevant chunks retrieved per query
- Chunking: 500-token segments with 50-token overlap to preserve sentence boundaries

### Conversation Memory
- Full chat history displayed in the UI
- Last **6 messages** passed as context to the LLM on each turn
- Allows follow-up questions without repeating context ("what did you just say about X?")

### Source Citations
- Each AI response is linked to the source chunk(s) it was generated from
- **Source highlight panel** — click any answer to view the exact excerpt from the document
- Helps users verify accuracy and read more context if needed

### Multiple Document Support
- Upload and store multiple documents in a single session
- **Document list sidebar** to switch between uploaded files
- Each document maintains its own vector store in ChromaDB
- Delete individual documents (removes file + vectors)

---

## UI / UX

### Chat Interface
- Message bubbles — distinct styles for user and AI messages
- **Typing indicator** while the AI is generating a response
- Smooth scroll to latest message
- Mobile responsive layout

### File Upload Experience
- Drag-and-drop zone with visual feedback on hover
- File type validation before upload (rejects unsupported formats)
- Progress bar during upload and processing
- Clear success/error states

### Document Sidebar
- Lists all uploaded documents by name
- Click to switch active document
- Delete button per document
- Indicates which document is currently active

---

## Technical Details

### Chunking Strategy
| Parameter | Value |
|-----------|-------|
| Splitter | Recursive character text splitter |
| Chunk size | 500 tokens |
| Chunk overlap | 50 tokens |
| Rationale | Overlap preserves sentence context across chunk boundaries |

### Retrieval
| Parameter | Value |
|-----------|-------|
| Search type | Cosine similarity |
| Top-k chunks | 4 per query |
| Embedding model | `sentence-transformers/all-MiniLM-L6-v2` |
| Vector store | ChromaDB (local, persistent) |

### LLM Configuration
| Parameter | Value |
|-----------|-------|
| Provider | Groq API |
| Model | `llama-3.1-70b-versatile` |
| Context window | Retrieved chunks + last 6 messages |
| Rate limit (free tier) | 30 req/min, 6,000 tokens/min |

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Unsupported file format | Upload rejected with clear error message |
| Empty document | Error returned after extraction attempt |
| File too large (>10MB) | Rejected before upload begins |
| Groq API failure | Error message shown in chat, no crash |
| No document uploaded | Chat input disabled until a document is active |

---

## Out of Scope (v1)

The following are not included in the initial build but are logical next steps:

- User authentication and per-user document storage
- Cloud vector store (e.g. Pinecone) for multi-user isolation
- Streaming LLM responses (token-by-token output)
- Document summarisation without a specific query
- Table and image extraction from PDFs
- Export chat history
