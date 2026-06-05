from src.vectordb.vector_store import get_qdrant_client
from src.config import VECTORDB_COLLECTION
client = get_qdrant_client()
try:
    count = client.count(collection_name=VECTORDB_COLLECTION).count
    print("Total points:", count)
except Exception as e:
    print(e)

