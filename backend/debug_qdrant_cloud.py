from src.vectordb.vector_store import get_client
from src.config import VECTORDB_COLLECTION
try:
    client = get_client()
    res, _ = client.scroll(
        collection_name=VECTORDB_COLLECTION,
        limit=1000,
        with_payload=True,
        with_vectors=False
    )
    repo_counts = {}
    doc_types = {}
    for p in res:
        repo = p.payload.get("repo_name", "unknown")
        dtype = p.payload.get("doc_type", "unknown")
        repo_counts[repo] = repo_counts.get(repo, 0) + 1
        doc_types[dtype] = doc_types.get(dtype, 0) + 1

    print(f"Total points returned (limit 1000): {len(res)}")
    print("Repos:", repo_counts)
    print("Doc types:", doc_types)
except Exception as e:
    print("Error:", e)
