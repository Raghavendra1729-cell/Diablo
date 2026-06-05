from qdrant_client import QdrantClient
from src.config import VECTORDB_COLLECTION
import time

try:
    client = QdrantClient("http://localhost:6333")
    offset = None
    repo_counts = {}
    doc_types = {}
    total = 0
    
    while True:
        res, offset = client.scroll(
            collection_name=VECTORDB_COLLECTION,
            limit=10000,
            with_payload=True,
            with_vectors=False,
            offset=offset
        )
        for p in res:
            total += 1
            repo = p.payload.get("repo_name", "unknown")
            dtype = p.payload.get("doc_type", "unknown")
            repo_counts[repo] = repo_counts.get(repo, 0) + 1
            doc_types[dtype] = doc_types.get(dtype, 0) + 1
            
        if offset is None:
            break
            
    print(f"Total points: {total}")
    print("Repos:")
    for r, c in repo_counts.items():
        print(f"  {r}: {c}")
    print("Doc types:")
    for d, c in doc_types.items():
        print(f"  {d}: {c}")
except Exception as e:
    print("Error:", e)
