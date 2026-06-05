"""Retrieval — semantic search with HyDE expansion + intent-based filtered search.

Strategy overview
-----------------
1. HyDE (rule-based):  vague queries like "what are his projects?" get a
   hypothetical answer appended before embedding, so the query vector is much
   closer to actual document chunks (cosine sim ~0.42 → ~0.65+).
2. Intent detection:   queries mentioning education/career/certification are
   routed to resume-only chunks; queries about repos/code go to code chunks.
   Everything else searches the full collection.
3. Fallback:           if step 2 returns 0 results, retry with the original
   (unexpanded) query at a lower score threshold (0.25) to catch near-misses.
4. NO_CONTEXT_SENTINEL: if still 0 results, return a sentinel string so the
   LLM always receives non-empty context and avoids unguided hallucination.
"""
from __future__ import annotations

import logging
import re
import traceback

from src.config import RETRIEVAL_TOP_K
from src.embeddings.embedder import embed_query, embed_query_sparse, rerank_chunks
from src.vectordb.vector_store import search, search_with_filter

logger = logging.getLogger(__name__)

# Returned when no chunks survive any retrieval attempt.
# Prevents the LLM from receiving an empty context list.
NO_CONTEXT_SENTINEL = (
    "[No relevant context found in the knowledge base for this query. "
    "DO NOT attempt to guess or hallucinate an answer. "
    "Strictly and politely state that you do not have enough information to answer this question.]"
)

# ---------------------------------------------------------------------------
# HyDE — rule-based query expansion for vague/broad queries
# ---------------------------------------------------------------------------

# Regex: matches question openers followed by broad topic nouns
_VAGUE_PATTERNS = re.compile(
    r"^(what|tell me|describe|explain|list|show|give me|summarize|can you)"
    r".{0,50}"
    r"(projects?|experience|skills?|background|education|work|repos?|built|made"
    r"|about him|about you|qualifications?|achievements?|hackathon|contest|leetcode)",
    re.IGNORECASE,
)

# Hypothetical answer expansions keyed on keyword found in query.
# These are intentionally written using the same vocabulary as the source docs
# so the resulting embedding is much closer to real document chunks.
_EXPANSION_MAP: dict[str, str] = {
    "projects": (
        "He has built AI and software projects including SastaNotebookLM (RAG application with "
        "FastAPI, Qdrant, Gemini embeddings), WEB-AUTOMATION-AGENT (browser controller with "
        "Qwen2.5-VL-72B and Playwright), a multithreaded HTTP/1.1 server from scratch in Python, "
        "Lost-n-Found (MERN real-time platform with Socket.IO), Persona-AI chatbot, and "
        "a Sleep Quality Analytics Engine using Scikit-learn and Random Forest."
    ),
    "experience": (
        "He works as a Teaching Assistant Buddy at Scaler School of Technology since March 2026, "
        "mentoring 30+ students in Data Structures, Algorithms, and Object-Oriented Programming. "
        "He conducts weekly debugging and code review sessions."
    ),
    "skills": (
        "His technical skills include Python, JavaScript, TypeScript, C++, FastAPI, React, Node.js, "
        "MongoDB, LangChain, Qdrant, Playwright, Scikit-learn, Socket.IO, and Git. "
        "He is proficient in Data Structures, Algorithms, and has solved 900+ LeetCode problems."
    ),
    "education": (
        "He studies at BITS Pilani (BSc Computer Science, Aug 2024–2027, CGPA 9.0) and "
        "Scaler School of Technology (Software Engineering UG, Aug 2024–2028, CGPA 9.11, Dean's List)."
    ),
    "background": (
        "He is a software engineering student at Scaler School of Technology with a CGPA of 9.11, "
        "ranked on the Dean's List, with expertise in AI engineering, full-stack development, "
        "and competitive programming. Active on LeetCode with a max contest rating of 1750."
    ),
    "repos": (
        "His GitHub repositories include SastaNotebookLM (RAG app), WEB-AUTOMATION-AGENT, "
        "a multithreaded HTTP server, Lost-n-Found platform, Persona-AI, and "
        "Sleep Quality Analytics Engine."
    ),
    "qualifications": (
        "He is pursuing BSc Computer Science at BITS Pilani (CGPA 9.0) and Software Engineering "
        "at Scaler School of Technology (CGPA 9.11, Dean's List). He has solved 900+ LeetCode "
        "problems with a max contest rating of 1750 and is a 3-star CodeChef coder."
    ),
    "achievements": (
        "LeetCode: 900+ problems, max contest rating 1750, 365-day active streak. "
        "CodeChef: 3-Star (max rating 1680). Codeforces: Pupil (max rating 1210). "
        "AtCoder: max rating 970. Hackathon: Ranked 7th out of 150+ teams for Hostel Hub. "
        "Ranked 1st among peers in an all-night algorithm sprint hosted by Scaler."
    ),
}

# ---------------------------------------------------------------------------
# Intent detection — route query to right document type filter
# ---------------------------------------------------------------------------

_RESUME_INTENT = re.compile(
    r"(education|degree|college|university|gpa|certification|certif|experience"
    r"|job|worked at|company|position|role|career|publication|paper)",
    re.IGNORECASE,
)
_CODE_INTENT = re.compile(
    r"(repo|repository|github|code|codebase|commit|function|class"
    r"|implementation|tech stack|language|framework|library)",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


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
            intent = _detect_intent(query)
            effective_top_k = top_k if top_k is not None else RETRIEVAL_TOP_K
            fetch_k = effective_top_k * 2  # Fetch 2x for reranker

            if intent in ("resume", "code"):
                logger.debug("[retriever] Intent detected: '%s' — using Qdrant filter index.", intent)
                hits = search_with_filter(dense_vector, sparse_vector, doc_type=intent, top_k=fetch_k)
            else:
                hits = search(dense_vector, sparse_vector, top_k=fetch_k)
        except Exception as e:
            logger.error("[retriever] Vector search failed: %s\n%s", e, traceback.format_exc())
            return [NO_CONTEXT_SENTINEL]

        # Fallback with raw query if no hits
        if not hits:
            logger.info("[retriever] 0 hits for query '%.50s...'; retrying with raw query", query)
            try:
                fallback_dense = embed_query(query)
                fallback_sparse = embed_query_sparse(query)
                if intent in ("resume", "code"):
                    logger.debug("[retriever] Intent detected: '%s' — using Qdrant filter search for fallback.", intent)
                    hits = search_with_filter(fallback_dense, fallback_sparse, doc_type=intent, top_k=fetch_k)
                else:
                    hits = search(fallback_dense, fallback_sparse, top_k=fetch_k)
            except Exception as e:
                logger.error("[retriever] Fallback search failed: %s\n%s", e, traceback.format_exc())
                return [NO_CONTEXT_SENTINEL]

        # Sentinel when nothing at all was found
        if not hits:
            logger.info("[retriever] No chunks found for query: %.80s", query)
            return [NO_CONTEXT_SENTINEL]

        # Step 4 — Cross-encoder reranking for precision
        try:
            texts = [hit["text"] for hit in hits]
            reranked_texts = rerank_chunks(query, texts, top_k=effective_top_k)
        except Exception as e:
            logger.error("[retriever] Reranking bypass failed: %s\n%s", e, traceback.format_exc())
            reranked_texts = [hit["text"] for hit in hits[:effective_top_k]]

        # Format the top reranked chunks mapping back to original hits
        final_results = []
        used_sources = set()
        try:
            for r_text in reranked_texts:
                for hit in hits:
                    if hit["text"] == r_text and id(hit) not in used_sources:
                        used_sources.add(id(hit))
                        final_results.append(
                            f"[Source: {hit['source']} | Relevance: {hit['score']:.2f}]\n{hit['text']}"
                        )
                        break
        except Exception as e:
            logger.error("[retriever] Result formatting error: %s\n%s", e, traceback.format_exc())
            final_results = [hit["text"] for hit in hits[:effective_top_k]]

        logger.info("[retriever] Retrieved and reranked %d chunks for query.", len(final_results))
        return final_results if final_results else [NO_CONTEXT_SENTINEL]

    except Exception as e:
        logger.error("[retriever] Unhandled error in retrieve_context: %s\n%s", e, traceback.format_exc())
        return [NO_CONTEXT_SENTINEL]
