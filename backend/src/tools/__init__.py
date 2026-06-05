"""Tools package — calendar, RAG search, and tool dispatcher.

Public API::

    from src.tools import (
        ToolResult,
        check_availability,
        book_slot,
        cancel_booking,
        reschedule_booking,
        list_bookings,
        search_knowledge_base,
        execute_tool,
        TOOL_REGISTRY,
    )
"""
from src.tools.base import ToolResult
from src.tools.calendar_tools import (
    check_availability,
    book_slot,
    cancel_booking,
    reschedule_booking,
    list_bookings,
)
from src.tools.rag_tools import search_knowledge_base
from src.tools.tool_executor import execute_tool, TOOL_REGISTRY

__all__ = [
    "ToolResult",
    "check_availability",
    "book_slot",
    "cancel_booking",
    "reschedule_booking",
    "list_bookings",
    "search_knowledge_base",
    "execute_tool",
    "TOOL_REGISTRY",
]
