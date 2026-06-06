"""Pydantic request/response schemas for the API layer."""
from typing import Optional, Literal, Dict, Any

from pydantic import BaseModel, Field


class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ToolCallSchema(BaseModel):
    name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)


class LLMOutputSchema(BaseModel):
    thought_process: str = ""
    response: str
    tool_call: Optional[ToolCallSchema] = None


class ChatRequest(BaseModel):
    message: str
    history: list[Message] = Field(default_factory=list)
    channel: Literal["voice", "web"] = "web"


class ChatResponse(BaseModel):
    response: str
    tool_call: Optional[Dict[str, Any]] = None
    booking_confirmed: bool = False
    booking_details: Optional[Dict[str, Any]] = None
