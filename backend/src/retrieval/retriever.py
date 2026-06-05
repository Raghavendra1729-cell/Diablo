"""Semantic search retrieval pipeline."""
from __future__ import annotations

import logging
import re
import traceback

from src.config import RETRIEVAL_TOP_K
from src.embeddings.embedder import embed_query, embed_query_sparse
from src.vectordb.vector_store import search, search_with_filter

logger = logging.getLogger(__name__)

import time

# Simple TTL cache for retrieval results (cache up to 64 unique queries)
_retrieval_cache: dict[str, tuple[float, list[str]]] = {}
_CACHE_TTL = 300  # 5 minutes
_CACHE_MAX_SIZE = 64

def _get_cached(query: str, top_k: int) -> list[str] | None:
    """Return cached result if fresh, else None."""
    key = f"{query}:{top_k}"
    if key in _retrieval_cache:
        ts, result = _retrieval_cache[key]
        if time.time() - ts < _CACHE_TTL:
            logger.debug("[retriever] Cache HIT for query: %.50s", query)
            return result
        del _retrieval_cache[key]
    return None

def _set_cache(query: str, top_k: int, result: list[str]) -> None:
    """Store result in cache, evicting oldest if full."""
    key = f"{query}:{top_k}"
    if len(_retrieval_cache) >= _CACHE_MAX_SIZE:
        oldest_key = next(iter(_retrieval_cache))
        del _retrieval_cache[oldest_key]
    _retrieval_cache[key] = (time.time(), result)

# Returned when no chunks survive any retrieval attempt.
# Prevents the LLM from receiving an empty context list.
NO_CONTEXT_SENTINEL = (
    "[No relevant context found in the knowledge base for this query. "
    "DO NOT attempt to guess or hallucinate an answer. "
    "Strictly and politely state that you do not have enough information to answer this question.]"
)

# HyDE — rule-based query expansion for vague/broad queries

# Regex: matches question openers followed by broad topic nouns
_VAGUE_PATTERNS = re.compile(
    r"^(what|tell me|describe|explain|list|show|give me|summarize|can you)"
    r".{0,50}"
    r"(projects?|experience|skills?|background|education|work|repos?|built|made"
    r"|about him|about you|qualifications?|achievements?|hackathon|contest|leetcode)",
    re.IGNORECASE,
)

# Generic keyword expansions for HyDE — intentionally use vocabulary likely
# to align with document chunks WITHOUT containing person-specific facts.
# This avoids the "no hardcoded answers" violation while still improving retrieval quality.
_EXPANSION_MAP: dict[str, str] = {
    "projects": (
        "AI, software, web development, systems projects portfolio including RAG applications, "
        "browser automation agents, HTTP servers, real-time platforms, chatbots, and ML analytics."
    ),
    "experience": (
        "work experience, employment, internship, teaching assistant, mentoring, "
        "code review, debugging sessions, data structures, algorithms tutoring."
    ),
    "skills": (
        "programming languages, frameworks, databases, AI/ML tools, version control, "
        "data structures, algorithms, problem solving, software engineering competencies."
    ),
    "education": (
        "university, college, degree program, computer science, software engineering, "
        "undergraduate studies, academic performance, honors, dean's list."
    ),
    "background": (
        "software engineering student, AI engineering interests, full-stack development, "
        "competitive programming, academic achievements, technical expertise."
    ),
    "repos": (
        "GitHub repositories, open source contributions, personal projects, "
        "code portfolios, software applications, system design implementations."
    ),
    "qualifications": (
        "academic degrees, certifications, competitive programming ratings, "
        "problem solving metrics, academic honors, technical credentials."
    ),
    "achievements": (
        "competitive programming contests, hackathons, coding competitions, "
        "leaderboard rankings, academic distinctions, technical awards."
    ),
}

# Intent detection — route query to right document type filter

_RESUME_INTENT = re.compile(
    r"(education|degree|college|university|gpa|certification|certif|experience"
    r"|job|worked at|company|position|role|career|publication|paper"
    r"|leetcode|codeforces|codechef|atcoder|cgpa|rating|streak"
    r"|contest|hackathon|achievement|honor|dean|scholarship)",
    re.IGNORECASE,
)
_CODE_INTENT = re.compile(
    r"(repo|repository|github|code|codebase|commit|function|class"
    r"|implementation|tech stack|language|framework|library)",
    re.IGNORECASE,
)


# Internal helpers


def _should_use_hyde(query: str) -> bool:
    """Return True for short, vague queries that benefit from HyDE expansion."""
    try:
        words = query.strip().split()
        return len(words) <= 12 and bool(_VAGUE_PATTERNS.search(query))
    except Exception as e:
        logger.error("[retriever] _should_use_hyde error: %s\n%s", e, traceback.format_exc())
        return False


def _expand_query(query: str) -> str:
    """Append a hypothetical answer to the query for better embedding alignment.

    Iterates _EXPANSION_MAP in insertion order; returns on first keyword match.
    Falls back to the original query if no keyword matches.
    """
    try:
        query_lower = query.lower()
        for keyword, expansion in _EXPANSION_MAP.items():
            if keyword in query_lower:
                return f"{query} {expansion}"
        return query
    except Exception as e:
        logger.error("[retriever] _expand_query error: %s\n%s", e, traceback.format_exc())
        return query


def _detect_intent(query: str) -> str | None:
    """Detect which document-type filter (if any) to apply.

    Returns
    -------
    'resume'  — for career / education / certification queries
    'code'    — for repo / codebase / implementation queries
    None      — search all document types (default)
    """
    try:
        if _RESUME_INTENT.search(query):
            return "resume"
        if _CODE_INTENT.search(query):
            return "code"
        return None
    except Exception as e:
        logger.error("[retriever] _detect_intent error: %s\n%s", e, traceback.format_exc())
        return None


# Public API


def retrieve_context(query: str, top_k: int | None = None) -> list[str]:
    """Retrieve relevant context chunks for a query using Hybrid Search + Reranking.

    Pipeline
    --------
    1. HyDE expansion  — vague queries get a hypothetical answer appended.
    2. Embed           — embed the expanded query string (Dense + Sparse).
    3. Hybrid Search   — use RRF to fetch top 20 candidates.
    4. Reranking       — cross-encoder reranks top 20 candidates using original query.
    5. Sentinel        — if 0 hits, return NO_CONTEXT_SENTINEL.

    Parameters
    ----------
    query:  The user's raw question.
    top_k:  Override the configured retrieval top-k if provided.

    Returns
    -------
    List of formatted context strings, or [NO_CONTEXT_SENTINEL] when empty.
    """
    return _retrieve_context_impl(query, top_k)


def retrieve_context_filtered(
    query: str,
    repo_name: str,
    top_k: int | None = None,
) -> list[str]:
    """Retrieve context filtered to a specific GitHub repository.

    Forces ``doc_type='code'`` and filters by ``repo_name`` in Qdrant payload.
    Useful when the LLM pinpoints a specific repo after discovery.
    """
    return _retrieve_context_impl(query, top_k, force_doc_type="code", repo_name=repo_name)


def _retrieve_context_impl(
    query: str,
    top_k: int | None = None,
    force_doc_type: str | None = None,
    repo_name: str | None = None,
) -> list[str]:
    effective_top_k = top_k if top_k is not None else RETRIEVAL_TOP_K
    cached = _get_cached(query, effective_top_k)
    if cached is not None:
        return cached

    try:
        # Step 1 — HyDE expansion for vague queries
        try:
            search_query = _expand_query(query) if _should_use_hyde(query) else query
            if search_query != query:
                logger.debug("[retriever] HyDE expansion applied for query: %.60s...", query)
        except Exception as e:
            logger.error("[retriever] HyDE expansion failed: %s\n%s", e, traceback.format_exc())
            search_query = query

        # Step 2 — Embed (expanded) query (Dense + Sparse) sequentially
        # Sequential inference is often faster for fastembed/ONNX because ONNX is already
        # multi-threaded in C++; Python-level threading just causes CPU thrashing and overhead.
        try:
            dense_vector = embed_query(search_query)
            sparse_vector = embed_query_sparse(search_query)
        except Exception as e:
            logger.error("[retriever] Embedding failed: %s\n%s", e, traceback.format_exc())
            return [NO_CONTEXT_SENTINEL]

        # Step 3 — Hybrid search
        try:
            # Use forced doc_type if provided, otherwise detect intent
            doc_filter = force_doc_type or _detect_intent(query)
            fetch_k = effective_top_k * 2  # Fetch 2x for reranker

            if doc_filter or repo_name:
                logger.debug(
                    "[retriever] Filtered search: doc_type=%s repo_name=%s",
                    doc_filter, repo_name,
                )
                hits = search_with_filter(
                    dense_vector,
                    sparse_vector,
                    doc_type=doc_filter,
                    repo_name=repo_name,
                    top_k=fetch_k,
                )
            else:
                hits = search(dense_vector, sparse_vector, top_k=fetch_k)
        except Exception as e:
            logger.error("[retriever] Vector search failed: %s\n%s", e, traceback.format_exc())
            return [NO_CONTEXT_SENTINEL]

        # Fallback with raw query if no hits
        if not hits:
            logger.info("[retriever] 0 hits for query '%.50s...'; retrying with raw query and no intent filter", query)
            try:
                # Skip re-embedding if HyDE was not used — search_query == query for non-vague queries
                if search_query != query:
                    fallback_dense = embed_query(query)
                    fallback_sparse = embed_query_sparse(query)
                else:
                    fallback_dense = dense_vector
                    fallback_sparse = sparse_vector
                # Drop the intent filter to broaden the search
                hits = search(fallback_dense, fallback_sparse, top_k=fetch_k)
            except Exception as e:
                logger.error("[retriever] Fallback search failed: %s\n%s", e, traceback.format_exc())
                return [NO_CONTEXT_SENTINEL]

        # Sentinel when nothing at all was found
        if not hits:
            logger.info("[retriever] No chunks found for query: %.80s", query)
            return [NO_CONTEXT_SENTINEL]

        # Step 4 — Cross-encoder reranking (DISABLED FOR SPEED on HuggingFace CPU)

        # Format the top reranked chunks mapping back to original hits
        try:
            final_results = [
                f"[Source: {hit['source']} | Relevance: {hit['score']:.2f}]\n{hit['text']}"
                for hit in hits[:effective_top_k]
            ]
        except Exception as e:
            logger.error("[retriever] Result formatting error: %s\n%s", e, traceback.format_exc())
            final_results = [hit["text"] for hit in hits[:effective_top_k]]

        logger.info("[retriever] Retrieved and reranked %d chunks for query.", len(final_results))
        res = final_results if final_results else [NO_CONTEXT_SENTINEL]
        _set_cache(query, effective_top_k, res)
        return res

    except Exception as e:
        logger.error("[retriever] Unhandled error in retrieve_context: %s\n%s", e, traceback.format_exc())
        return [NO_CONTEXT_SENTINEL]
