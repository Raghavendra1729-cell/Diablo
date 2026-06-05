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
from src.tools.base import ToolResult
from src.retrieval.retriever import retrieve_context

logger = logging.getLogger(__name__)

from src.config import RETRIEVAL_TOP_K

async def search_knowledge_base(query: str, top_k: int = RETRIEVAL_TOP_K) -> ToolResult:
    """Search the persona knowledge base (resume + GitHub repos) for relevant context.

    This is a thin async wrapper around the synchronous ``retrieve_context``
    retriever. The blocking call is offloaded via ``run_in_threadpool`` to
    avoid tying up the event loop.

    Args:
        query:  Free-text search query from the LLM or caller.
        top_k:  Maximum number of context chunks to return. Defaults to 5.

    Returns:
        ToolResult with data={"chunks": list[str], "count": int} on success,
        or success=False with an error message if retrieval raises.
    """
    from starlette.concurrency import run_in_threadpool
    try:
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
