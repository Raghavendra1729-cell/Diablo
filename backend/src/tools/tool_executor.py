"""Tool executor — dispatches tool_call JSON from the LLM to the right tool function.

The LLM emits a JSON blob like:
    {"name": "book_slot", "arguments": {"date": "2026-06-10", "time_slot": "10:00", "email": "..."}}

``execute_tool`` resolves the name against TOOL_REGISTRY and calls the
matching async function with the provided keyword arguments, returning a
ToolResult in all cases (including unknown-tool or argument errors).
"""
import logging
from typing import Any, Callable, Coroutine

from src.tools.base import ToolResult
from src.tools.calendar_tools import (
    check_availability,
    book_slot,
    cancel_booking,
    reschedule_booking,
    list_bookings,
)
from src.tools.rag_tools import search_knowledge_base, list_repos

logger = logging.getLogger(__name__)

# Tool registry

# Maps every tool name (including aliases for backward compatibility) to its
# async callable.  All values must be ``async def`` functions returning ToolResult.
TOOL_REGISTRY: dict[str, Callable[..., Coroutine[Any, Any, ToolResult]]] = {
    "check_availability": check_availability,
    "book_slot": book_slot,
    "book_meeting": book_slot,            # alias
    "book_interview": book_slot,          # alias — legacy LLM output
    "cancel_booking": cancel_booking,
    "cancel_meeting": cancel_booking,
    "reschedule_booking": reschedule_booking,
    "reschedule_meeting": reschedule_booking,
    "list_bookings": list_bookings,
    "search_knowledge_base": search_knowledge_base,
    "list_repos": list_repos,
}


# Dispatcher

async def execute_tool(tool_call: dict[str, Any]) -> ToolResult:
    """Execute a tool_call dict produced by the LLM.

    Expected format::

        {
            "name": "book_slot",
            "arguments": {
                "date": "2026-06-10",
                "time_slot": "10:00",
                "email": "recruiter@example.com"
            }
        }

    Returns a ToolResult in every code-path — callers never need to handle
    raw exceptions from this function.

    Args:
        tool_call: Dict with keys ``name`` (str) and ``arguments`` (dict).

    Returns:
        ToolResult — success or failure with a human-readable message.
    """
    name: str = tool_call.get("name", "").strip()
    arguments: dict[str, Any] = tool_call.get("arguments", {})

    if not name:
        return ToolResult(
            success=False,
            error="missing_tool_name",
            message="Tool call is missing a 'name' field.",
        )

    if name not in TOOL_REGISTRY:
        available = list(TOOL_REGISTRY.keys())
        logger.warning("[tool_executor] Unknown tool requested: %r. Available: %s", name, available)
        return ToolResult(
            success=False,
            error="unknown_tool",
            message=f"Unknown tool: '{name}'. Available tools: {available}",
        )

    fn = TOOL_REGISTRY[name]
    safe_args = {k: ("***" if k in ("email", "name") else v) for k, v in arguments.items()}
    logger.info("[tool_executor] Executing tool '%s' with args: %s", name, safe_args)

    try:
        result: ToolResult = await fn(**arguments)
        return result

    except TypeError as e:
        # Argument mismatch — e.g. missing required kwarg or unexpected kwarg
        logger.error("[tool_executor] Argument error for tool '%s': %s", name, e)
        return ToolResult(
            success=False,
            error="invalid_arguments",
            message=f"Invalid arguments for tool '{name}': {e}",
        )
    except Exception as e:
        logger.error("[tool_executor] Unexpected error running tool '%s': %s", name, e)
        return ToolResult(
            success=False,
            error="execution_error",
            message=f"Tool '{name}' failed with an unexpected error: {e}",
        )
