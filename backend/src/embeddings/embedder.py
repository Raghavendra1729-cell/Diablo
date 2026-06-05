"""Local embedding via fastembed — thread-safe lazy singleton."""
import logging
import threading
import traceback
from typing import Optional

from fastembed import TextEmbedding, SparseTextEmbedding

from src.config import EMBED_MODEL

logger = logging.getLogger(__name__)

_embedder: Optional[TextEmbedding] = None
_sparse_embedder: Optional[SparseTextEmbedding] = None
_embedder_lock = threading.Lock()


def get_embedder() -> TextEmbedding:
    """Return cached TextEmbedding instance. Thread-safe double-checked locking."""
    global _embedder
    if _embedder is None:
        with _embedder_lock:
            if _embedder is None:
                logger.info("[embedder] Loading fastembed model: %s", EMBED_MODEL)
                _embedder = TextEmbedding(model_name=EMBED_MODEL)
                logger.info("[embedder] Model loaded.")
    return _embedder


def get_sparse_embedder() -> SparseTextEmbedding:
    """Return cached SparseTextEmbedding instance."""
    global _sparse_embedder
    if _sparse_embedder is None:
        with _embedder_lock:
            if _sparse_embedder is None:
                logger.info("[embedder] Loading fastembed sparse model: Qdrant/bm25")
                _sparse_embedder = SparseTextEmbedding(model_name="Qdrant/bm25")
                logger.info("[embedder] Sparse model loaded.")
    return _sparse_embedder



def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of texts, returning list of float vectors."""
    try:
        embedder = get_embedder()
        embeddings = list(embedder.embed(texts))
        return [emb.tolist() for emb in embeddings]
    except Exception as e:
        logger.error("[embedder] embed_texts failed: %s\n%s", e, traceback.format_exc())
        raise


def embed_query(query: str) -> list[float]:
    """Embed a single query string."""
    try:
        return embed_texts([query])[0]
    except Exception as e:
        logger.error("[embedder] embed_query failed: %s\n%s", e, traceback.format_exc())
        raise


def embed_texts_sparse(texts: list[str]) -> list[dict]:
    """Sparse embed a list of texts."""
    try:
        embedder = get_sparse_embedder()
        embeddings = list(embedder.embed(texts))
        return [{"indices": emb.indices.tolist(), "values": emb.values.tolist()} for emb in embeddings]
    except Exception as e:
        logger.error("[embedder] embed_texts_sparse failed: %s\n%s", e, traceback.format_exc())
        raise


def embed_query_sparse(query: str) -> dict:
    """Sparse embed a single query string."""
    try:
        return embed_texts_sparse([query])[0]
    except Exception as e:
        logger.error("[embedder] embed_query_sparse failed: %s\n%s", e, traceback.format_exc())
        raise


