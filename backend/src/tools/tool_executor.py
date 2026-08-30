"""Tool executor — dispatches tool_call JSON from the LLM to the right tool function.

The LLM emits a schema-validated JSON object like:
    {"name": "book_meeting", "arguments": {"date": "2026-06-10", "time": "10:00", "email": "...", "name": "..."}}

``execute_tool`` resolves the name against TOOL_REGISTRY and calls the
matching async function with the provided keyword arguments, returning a
ToolResult in all cases (including unknown-tool or argument errors).
"""
import logging
from typing import Any, Callable, Coroutine
from pydantic import TypeAdapter, ValidationError

from src.api.schemas import ToolCallSchema
from src.tools.base import ToolResult
from src.tools.calendar_tools import (
    check_availability,
    book_slot,
    cancel_booking,
    reschedule_booking,
)
from src.tools.rag_tools import search_knowledge_base, list_repos

logger = logging.getLogger(__name__)

# Tool registry

# Maps every tool name (including aliases for backward compatibility) to its
# async callable.  All values must be ``async def`` functions returning ToolResult.
TOOL_REGISTRY: dict[str, Callable[..., Coroutine[Any, Any, ToolResult]]] = {
    "check_availability": check_availability,
    "book_meeting": book_slot,
    "cancel_meeting": cancel_booking,
    "reschedule_meeting": reschedule_booking,
    "search_knowledge_base": search_knowledge_base,
    "list_repos": list_repos,
}

_TOOL_CALL_ADAPTER = TypeAdapter(ToolCallSchema)


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
    try:
        validated = _TOOL_CALL_ADAPTER.validate_python(tool_call)
    except ValidationError as exc:
        logger.warning("[tool_executor] Rejected invalid tool call (%d schema errors).", exc.error_count())
        return ToolResult(
            success=False,
            error="invalid_arguments",
            message="The requested tool call did not match the allowed schema.",
        )

    name = validated.name
    arguments = validated.arguments.model_dump(exclude_none=True)
    if name == "list_repos":
        arguments.pop("scope", None)
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
