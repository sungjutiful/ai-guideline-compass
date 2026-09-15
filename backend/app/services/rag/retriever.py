from app.core.config import settings
from app.services.rag.embeddings import get_embedding_provider
from app.services.rag.vectorstore import get_collection


def retrieve_relevant_clauses(query: str, top_k: int | None = None) -> list[dict]:
    provider = get_embedding_provider()
    query_embedding = provider.embed_query(query)

    collection = get_collection()
    if collection.count() == 0:
        return []

    n_results = min(top_k or settings.RETRIEVAL_TOP_K, collection.count())
    hits = collection.query(query_embedding, n_results)

    return [
        {
            "clause_id": hit["metadata"]["clause_id"],
            "clause_number": hit["metadata"].get("clause_number") or None,
            "document_title": hit["metadata"].get("document_title", ""),
            "content": hit["document"],
            "similarity": hit["similarity"],
        }
        for hit in hits
    ]
