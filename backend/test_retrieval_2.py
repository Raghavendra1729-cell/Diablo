import asyncio
from src.retrieval.retriever import search
from src.embeddings.embedder import embed_query, embed_query_sparse

async def main():
    q = "WEB-AUTOMATION-AGENT"
    d = embed_query(q)
    s = embed_query_sparse(q)
    hits = search(d, s, top_k=20)
    for hit in hits:
        if 'WEB-AUTOMATION-AGENT' in hit['source'] or 'web' in hit['source'].lower():
            print(hit['source'], hit['score'])

asyncio.run(main())
