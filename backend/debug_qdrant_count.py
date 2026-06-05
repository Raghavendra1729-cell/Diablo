from src.vectordb.vector_store import get_client
from src.config import VECTORDB_COLLECTION
try:
    client = get_client()
    count = client.count(collection_name=VECTORDB_COLLECTION)
    print("Total count:", count.count)
except Exception as e:
    print("Error:", e)
