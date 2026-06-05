import asyncio
from src.retrieval.retriever import _expand_query, _should_use_hyde, _detect_intent
from src.embeddings.embedder import embed_query, embed_query_sparse, rerank_chunks
from src.vectordb.vector_store import search, search_with_filter
from src.config import RETRIEVAL_TOP_K

query = "what are his projects"

print("1. HyDE:")
search_query = _expand_query(query) if _should_use_hyde(query) else query
print("Search query:", search_query)

print("2. Embed:")
d = embed_query(search_query)
s = embed_query_sparse(search_query)

print("3. Intent:")
intent = _detect_intent(query)
print("Intent:", intent)

if intent:
    hits = search_with_filter(d, s, doc_type=intent, top_k=20)
else:
    hits = search(d, s, top_k=20)

print(f"4. Hits (count={len(hits)}):")
for hit in hits:
    print(hit['source'], hit['score'])

if not hits:
    print("No hits found.")
else:
    print("5. Rerank:")
    texts = [hit["text"] for hit in hits]
    reranked = rerank_chunks(query, texts, top_k=RETRIEVAL_TOP_K)
    print("Reranked count:", len(reranked))
    if len(reranked) == 0:
        print("Reranker filtered out EVERYTHING!")
