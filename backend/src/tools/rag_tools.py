"""RAG search tool — wraps the retrieval layer as a callable tool.

Exposes the vector-store semantic search as a first-class tool so the
tool executor can dispatch it the same way as calendar tools.

.. note::

    ``retrieve_context`` internally calls ``embed_query`` + Qdrant search,
    both of which are synchronous. Under high concurrency the default
    Starlette threadpool (40 threads) could be exhausted. For production,
    consider ``anyio.to_thread.run_sync(retrieve_context, ..., limiter=...)``
    with an explicit concurrency limiter, or move embedding to a dedicated
    worker pool.
"""
import logging
from typing import Optional
from src.tools.base import ToolResult
from src.retrieval.retriever import retrieve_context, retrieve_context_filtered

logger = logging.getLogger(__name__)

from src.config import RETRIEVAL_TOP_K

# Cache the repo list (doesn't change at runtime)
_repo_list_cache: list[str] | None = None


def _get_repo_list() -> list[str]:
    """Return cached list of available repo names from the ingestion registry."""
    global _repo_list_cache
    if _repo_list_cache is None:
        try:
            from src.ingestion.loader import REPO_REGISTRY
            repos = []
            for entry in REPO_REGISTRY:
                if "url" in entry:
                    name = entry["url"].rstrip("/").split("/")[-1].removesuffix(".git")
                    repos.append(name)
                elif "local" in entry:
                    repos.append(entry["local"].split("/")[-1])
            _repo_list_cache = sorted(repos)
        except Exception:
            _repo_list_cache = []
    return _repo_list_cache


async def list_repos() -> ToolResult:
    """Return all available GitHub repositories in the knowledge base.

    The LLM can call this to discover what repos exist, then use
    search_knowledge_base with a specific repo_name to drill into one.
    """
    try:
        repos = _get_repo_list()
        if not repos:
            return ToolResult(
                success=True,
                data={"repos": [], "count": 0},
                message="No repositories found in the knowledge base.",
            )
        return ToolResult(
            success=True,
            data={"repos": repos, "count": len(repos)},
            message=f"Found {len(repos)} repositories.",
        )
    except Exception as e:
        logger.error("[tools/rag] list_repos error: %s", e)
        return ToolResult(
            success=False,
            error=str(e),
            message="Failed to list repositories.",
        )


async def search_knowledge_base(
    query: str,
    repo_name: Optional[str] = None,
    top_k: int = RETRIEVAL_TOP_K,
) -> ToolResult:
    """Search the persona knowledge base for relevant context.

    Args:
        query:     Free-text search query from the LLM or caller.
        repo_name: Optional repo name to filter results to a single repository.
        top_k:     Maximum number of context chunks to return.

    Returns:
        ToolResult with data={"chunks": list[str], "count": int} on success.
    """
    from starlette.concurrency import run_in_threadpool
    try:
        if repo_name:
            chunks = await run_in_threadpool(
                retrieve_context_filtered, query, repo_name, top_k
            )
        else:
            chunks = await run_in_threadpool(retrieve_context, query, top_k)
        return ToolResult(
            success=True,
            data={"chunks": chunks, "count": len(chunks)},
            message=f"Found {len(chunks)} relevant chunks for query.",
        )
    except Exception as e:
        logger.error("[tools/rag] search_knowledge_base error: %s", e)
        return ToolResult(
            success=False,
            error=str(e),
            message="Knowledge base search failed.",
        )
