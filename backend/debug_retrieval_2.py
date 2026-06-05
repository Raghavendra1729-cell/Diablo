import asyncio
from src.retrieval.retriever import _expand_query, _should_use_hyde, _detect_intent
from src.embeddings.embedder import embed_query, embed_query_sparse, get_reranker
from src.vectordb.vector_store import search

query = "what are his projects"
search_query = _expand_query(query) if _should_use_hyde(query) else query

d = embed_query(search_query)
s = embed_query_sparse(search_query)

hits = search(d, s, top_k=5)
texts = [hit["text"] for hit in hits]

reranker = get_reranker()
scores = list(reranker.rerank(query, texts))

for i, (score, hit) in enumerate(zip(scores, hits)):
    print(f"--- Hit {i} ---")
    print("Score:", score)
    print("Text:", hit['text'][:200])

