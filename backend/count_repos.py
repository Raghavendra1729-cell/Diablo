from qdrant_client import QdrantClient
from src.config import VECTORDB_COLLECTION
client = QdrantClient("http://localhost:6333")
offset = None
repos = {}
while True:
    points, offset = client.scroll(
        collection_name=VECTORDB_COLLECTION,
        limit=10000,
        with_payload=True,
        with_vectors=False,
        offset=offset
    )
    for p in points:
        repo = p.payload.get("repo_name", "unknown")
        repos[repo] = repos.get(repo, 0) + 1
    if offset is None:
        break

for r, c in repos.items():
    print(r, c)
