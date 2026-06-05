"""Base types for the tools layer.

Defines ToolResult — the uniform return type for all tool functions.
All tools must return a ToolResult so the dispatcher can handle
success/failure consistently without inspecting raw dicts.
"""
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class ToolResult:
    """Uniform return type for every tool function.

    Attributes:
        success:  Whether the tool call succeeded.
        data:     Structured payload on success (tool-specific keys).
        error:    Short machine-readable error code on failure, e.g.
                  "not_found", "slot_unavailable", "unknown_tool".
        message:  Human-readable summary suitable for the LLM / user.
    """

    success: bool
    data: Optional[dict[str, Any]] = field(default=None)
    error: Optional[str] = field(default=None)
    message: str = field(default="")

    def to_dict(self) -> dict[str, Any]:
        """Serialise to a plain dict (for JSON responses / logging)."""
        return {
            "success": self.success,
            "data": self.data,
            "error": self.error,
            "message": self.message,
        }
