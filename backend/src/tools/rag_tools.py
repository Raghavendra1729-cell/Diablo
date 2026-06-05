"""RAG search tool — wraps the retrieval layer as a callable tool.

Exposes the vector-store semantic search as a first-class tool so the
tool executor can dispatch it the same way as calendar tools.
"""
import logging
from src.tools.base import ToolResult
from src.retrieval.retriever import retrieve_context

logger = logging.getLogger(__name__)


async def search_knowledge_base(query: str, top_k: int = 5) -> ToolResult:
    """Search the persona knowledge base (resume + GitHub repos) for relevant context.

    This is a thin async wrapper around the synchronous ``retrieve_context``
    retriever. It is kept ``async`` so it integrates cleanly with the
    ``tool_executor`` dispatcher without blocking the event loop for long
    (embeddings + Qdrant lookup are fast in practice).

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
