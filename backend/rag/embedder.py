from functools import lru_cache

from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

from config import settings


@lru_cache(maxsize=1)
def _embeddings() -> HuggingFaceEndpointEmbeddings:
    return HuggingFaceEndpointEmbeddings(
        huggingfacehub_api_token=settings.hf_token,
        model=settings.embedding_model,
    )


def _store(doc_id: str) -> Chroma:
    return Chroma(
        collection_name=f"doc_{doc_id}",
        embedding_function=_embeddings(),
        persist_directory=settings.chroma_persist_dir,
    )


def add_document(doc_id: str, chunks: list[Document]) -> None:
    _store(doc_id).add_documents(chunks)


def similarity_search(doc_id: str, query: str, k: int = 4) -> list[Document]:
    fetch_k = min(k * 5, 30)
    return _store(doc_id).max_marginal_relevance_search(query, k=k, fetch_k=fetch_k)


def delete_vectorstore(doc_id: str) -> None:
    _store(doc_id).delete_collection()
