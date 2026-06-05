"""Qdrant vector store — cloud-first with local fallback.

Thread-safe singleton client via double-checked locking.
upsert_points() batches in UPSERT_BATCH_SIZE chunks (100) to avoid
OOM / timeout on large corpora.

Public API
----------
get_client()            -> QdrantClient
check_collection_ready() -> tuple[bool, int]
recreate_collection(dim) -> None
upsert_points(points)   -> None
search(...)             -> list[dict]
search_with_filter(...) -> list[dict]
"""
from __future__ import annotations

import logging
import threading
import traceback
from typing import Optional

from qdrant_client import QdrantClient, models
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    ScoredPoint,
    VectorParams,
    SparseVectorParams,
    Prefetch,
    FusionQuery,
    Fusion,
)

from src.config import (
    QDRANT_API_KEY,
    QDRANT_HOST,
    QDRANT_PORT,
    QDRANT_URL,
    RETRIEVAL_TOP_K,
    VECTORDB_COLLECTION,
    VECTORDB_SCORE_THRESHOLD,
)

logger = logging.getLogger(__name__)

_client: Optional[QdrantClient] = None
_client_lock = threading.Lock()

UPSERT_BATCH_SIZE = 100  # recommended max points per upsert call


# ---------------------------------------------------------------------------
# Client singleton
# ---------------------------------------------------------------------------


def get_client() -> QdrantClient:
    """Return cached QdrantClient.  Thread-safe double-checked locking.
    Uses Qdrant Cloud when QDRANT_URL is set, otherwise connects to local host/port.
    """
    global _client
    if _client is None:
        with _client_lock:
            if _client is None:  # re-check after acquiring lock
                if QDRANT_URL:
                    logger.info("[vectordb] Connecting to Qdrant Cloud: %s", QDRANT_URL)
                    _client = QdrantClient(
                        url=QDRANT_URL,
                        api_key=QDRANT_API_KEY,
                        timeout=30,
                    )
                else:
                    logger.info(
                        "[vectordb] Connecting to local Qdrant: %s:%s",
                        QDRANT_HOST,
                        QDRANT_PORT,
                    )
                    _client = QdrantClient(
                        host=QDRANT_HOST,
                        port=QDRANT_PORT,
                        timeout=30,
                    )
    return _client


# ---------------------------------------------------------------------------
# Collection helpers
# ---------------------------------------------------------------------------


def check_collection_ready() -> tuple[bool, int]:
    """Check whether the collection exists and contains indexed points.

    Returns
    -------
    (exists, point_count) : tuple[bool, int]
        exists      — True if collection exists AND has at least one point.
        point_count — Actual number of points (0 when collection is absent).
    """
    try:
        client = get_client()
        if not client.collection_exists(VECTORDB_COLLECTION):
            logger.warning("[vectordb] Collection '%s' does not exist.", VECTORDB_COLLECTION)
            return False, 0
        info = client.get_collection(VECTORDB_COLLECTION)
        count: int = info.points_count or 0
        if count == 0:
            logger.warning(
                "[vectordb] Collection '%s' exists but has 0 points.", VECTORDB_COLLECTION
            )
            return False, 0
        logger.info("[vectordb] Collection '%s' has %d points.", VECTORDB_COLLECTION, count)
        return True, count
    except Exception as exc:
        logger.error("[vectordb] check_collection_ready failed: %s", exc)
        raise


def recreate_collection(dim: int) -> None:
    """Delete (if present) and recreate the vector collection with hybrid configuration."""
    client = get_client()
    if client.collection_exists(VECTORDB_COLLECTION):
        logger.info("[vectordb] Deleting existing collection '%s'...", VECTORDB_COLLECTION)
        client.delete_collection(VECTORDB_COLLECTION)
    logger.info(
        "[vectordb] Creating hybrid collection '%s' (dense dim=%d, sparse bm25)...",
        VECTORDB_COLLECTION,
        dim,
    )
    client.create_collection(
        collection_name=VECTORDB_COLLECTION,
        vectors_config={"dense": VectorParams(size=dim, distance=Distance.COSINE)},
        sparse_vectors_config={"sparse": SparseVectorParams()}
    )
    client.create_payload_index(
        collection_name=VECTORDB_COLLECTION,
        field_name="doc_type",
        field_schema="keyword",
    )


def upsert_points(points: list[PointStruct]) -> None:
    """Insert or update points in batches of UPSERT_BATCH_SIZE to avoid timeouts."""
    client = get_client()
    total = len(points)
    for start in range(0, total, UPSERT_BATCH_SIZE):
        batch = points[start : start + UPSERT_BATCH_SIZE]
        client.upsert(collection_name=VECTORDB_COLLECTION, points=batch)
        logger.info(
            "[vectordb] Upserted batch %d–%d of %d",
            start + 1,
            min(start + UPSERT_BATCH_SIZE, total),
            total,
        )


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------


def search(
    dense_vector: list[float],
    sparse_vector: dict,
    top_k: int = RETRIEVAL_TOP_K,
) -> list[dict]:
    """Search for nearest neighbours using Hybrid Search (Dense + Sparse) with RRF.

    Parameters
    ----------
    dense_vector:
        Dense embedding vector to query with.
    sparse_vector:
        Sparse embedding dict {"indices": [...], "values": [...]}.
    top_k:
        Maximum number of results to return.

    Returns
    -------
    list of {text, source, score, doc_type}
    """
    try:
        client = get_client()

        sparse_query = models.SparseVector(indices=sparse_vector["indices"], values=sparse_vector["values"])

        prefetch = [
            Prefetch(query=sparse_query, using="sparse", limit=top_k),
            Prefetch(query=dense_vector, using="dense", limit=top_k),
        ]

        results: list[ScoredPoint] = client.query_points(
            collection_name=VECTORDB_COLLECTION,
            prefetch=prefetch,
            query=FusionQuery(fusion=Fusion.RRF),
            limit=top_k,
        ).points

        results_dicts = [
            {
                "text": hit.payload.get("text", "") if hit.payload else "",
                "source": hit.payload.get("source", "unknown") if hit.payload else "unknown",
                "score": hit.score,
                "doc_type": hit.payload.get("doc_type", "document") if hit.payload else "document",
            }
            for hit in results
        ]
        return results_dicts
    except Exception as e:
        logger.error("[vectordb] search failed: %s\n%s", e, traceback.format_exc())
        raise


def search_with_filter(
    dense_vector: list[float],
    sparse_vector: dict,
    doc_type: str | None = None,
    repo_name: str | None = None,
    top_k: int = RETRIEVAL_TOP_K,
) -> list[dict]:
    """Search with optional Qdrant payload filter using Hybrid Search with RRF.

    Parameters
    ----------
    dense_vector:
        Dense embedding vector to query with.
    sparse_vector:
        Sparse embedding dict {"indices": [...], "values": [...]}.
    doc_type:
        Restrict search to chunks where payload.doc_type == doc_type.
    repo_name:
        Further restrict to a specific repo (only meaningful when doc_type='code').
    top_k:
        Maximum number of results to return.

    Returns
    -------
    list of {text, source, score, doc_type}
    """
    try:
        client = get_client()

        # Build Qdrant filter from provided constraints
        query_filter: Optional[Filter] = None
        if doc_type:
            conditions = [FieldCondition(key="doc_type", match=MatchValue(value=doc_type))]
            if repo_name:
                conditions.append(
                    FieldCondition(key="repo_name", match=MatchValue(value=repo_name))
                )
            query_filter = Filter(must=conditions)

        sparse_query = models.SparseVector(indices=sparse_vector["indices"], values=sparse_vector["values"])

        prefetch = [
            Prefetch(query=sparse_query, using="sparse", limit=top_k),
            Prefetch(query=dense_vector, using="dense", limit=top_k),
        ]

        results: list[ScoredPoint] = client.query_points(
            collection_name=VECTORDB_COLLECTION,
            prefetch=prefetch,
            query=FusionQuery(fusion=Fusion.RRF),
            query_filter=query_filter,
            limit=top_k,
        ).points

        results_dicts = [
            {
                "text": hit.payload.get("text", "") if hit.payload else "",
                "source": hit.payload.get("source", "unknown") if hit.payload else "unknown",
                "score": hit.score,
                "doc_type": hit.payload.get("doc_type", "document") if hit.payload else "document",
            }
            for hit in results
        ]
        return results_dicts
    except Exception as e:
        logger.error("[vectordb] search_with_filter failed: %s\n%s", e, traceback.format_exc())
        raise
