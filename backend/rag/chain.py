import json
from functools import lru_cache

from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from config import settings
from rag.embedder import similarity_search

_SYSTEM = """\
You are DocuMind, a helpful assistant that answers questions based on the document context below.

Rules:
- Answer ONLY from the CONTEXT provided. Do not use outside knowledge.
- If the context contains relevant information, answer fully and clearly from it.
- If the context only partially addresses the question, share what you can and note that the full document may have more detail — suggest the user try a more specific question.
- If the context is genuinely off-topic (e.g. only references or bibliography sections with no substantive content), say: "The retrieved sections don't contain enough detail to answer this. Try asking something more specific, like a topic or term mentioned in the document."
- Format your answer using Markdown for readability:
  - Use ## or ### headings to organize multi-part answers
  - Use bullet points (- item) or numbered lists for enumerable items
  - Use **bold** to highlight key terms or important values
  - For short factual answers, a single sentence is fine — don't force structure where it isn't needed
- Answer directly — skip filler phrases like "Based on the document..." or "According to the context...".
- Match depth to the question: a broad question like "key takeaways" warrants headings and bullets; a simple yes/no question does not.
- Never fabricate information not present in the context.

DOCUMENT CONTEXT:
{context}
"""


@lru_cache(maxsize=1)
def _llm() -> ChatGroq:
    return ChatGroq(
        model=settings.llm_model,
        api_key=settings.groq_api_key,
        temperature=0.2,
        max_tokens=1024,
    )


def _build_messages(context: str, question: str, history: list[dict]) -> list:
    messages: list = [("system", _SYSTEM.format(context=context))]
    for turn in history[-(settings.max_history_turns) :]:
        messages.append(("human", turn["user"]))
        messages.append(("assistant", turn["assistant"]))
    messages.append(("human", question))
    return messages


def answer(doc_id: str, question: str, history: list[dict]) -> dict:
    chunks = similarity_search(doc_id, question, k=settings.top_k)
    context = "\n\n---\n\n".join(c.page_content for c in chunks)
    sources = [
        {"content": c.page_content, "chunk_index": c.metadata.get("chunk_index", i)}
        for i, c in enumerate(chunks)
    ]
    chain = ChatPromptTemplate.from_messages(_build_messages(context, question, history)) | _llm()
    response = chain.invoke({})
    return {"answer": response.content, "sources": sources}


async def answer_stream(doc_id: str, question: str, history: list[dict]):
    """Async generator yielding SSE-formatted data lines."""
    chunks = similarity_search(doc_id, question, k=settings.top_k)
    context = "\n\n---\n\n".join(c.page_content for c in chunks)
    sources = [
        {"content": c.page_content, "chunk_index": c.metadata.get("chunk_index", i)}
        for i, c in enumerate(chunks)
    ]

    yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

    chain = ChatPromptTemplate.from_messages(_build_messages(context, question, history)) | _llm()

    async for chunk in chain.astream({}):
        if chunk.content:
            yield f"data: {json.dumps({'type': 'token', 'token': chunk.content})}\n\n"

    yield f"data: {json.dumps({'type': 'done'})}\n\n"
