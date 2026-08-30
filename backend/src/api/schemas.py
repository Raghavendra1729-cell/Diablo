"""Strict request, model-output, tool, and response schemas."""
from __future__ import annotations

from typing import Literal, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator


DATE_PATTERN = r"^\d{4}-\d{2}-\d{2}$"
TIME_PATTERN = r"^(?:[01]\d|2[0-3]):[0-5]\d$"


class StrictModel(BaseModel):
    """Base model that rejects fields outside the declared API contract."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Message(StrictModel):
    # System prompts are server-owned and must never be accepted from clients.
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)


class CheckAvailabilityArguments(StrictModel):
    date: str = Field(pattern=DATE_PATTERN)
    timezone: str = Field(min_length=1, max_length=64)


class BookMeetingArguments(StrictModel):
    date: str = Field(pattern=DATE_PATTERN)
    time: str = Field(pattern=TIME_PATTERN)
    email: str = Field(min_length=3, max_length=254)
    name: str = Field(min_length=1, max_length=120)
    timezone: str = Field(min_length=1, max_length=64)

    @field_validator("email")
    @classmethod
    def validate_email_shape(cls, value: str) -> str:
        local, separator, domain = value.rpartition("@")
        if not separator or not local or "." not in domain or domain.startswith("."):
            raise ValueError("email must be a valid address")
        return value


class CancelMeetingArguments(StrictModel):
    booking_id: str = Field(min_length=1, max_length=160)
    reason: str = Field(max_length=300)


class RescheduleMeetingArguments(StrictModel):
    booking_id: str = Field(min_length=1, max_length=160)
    new_date: str = Field(pattern=DATE_PATTERN)
    new_time_slot: str = Field(pattern=TIME_PATTERN)
    timezone: str = Field(min_length=1, max_length=64)
    reason: str = Field(max_length=300)


class SearchKnowledgeBaseArguments(StrictModel):
    query: str = Field(min_length=1, max_length=500)
    repo_name: str | None = Field(min_length=1, max_length=120)


class ListReposArguments(StrictModel):
    scope: Literal["all"]


class CheckAvailabilityCall(StrictModel):
    name: Literal["check_availability"]
    arguments: CheckAvailabilityArguments


class BookMeetingCall(StrictModel):
    name: Literal["book_meeting"]
    arguments: BookMeetingArguments


class CancelMeetingCall(StrictModel):
    name: Literal["cancel_meeting"]
    arguments: CancelMeetingArguments


class RescheduleMeetingCall(StrictModel):
    name: Literal["reschedule_meeting"]
    arguments: RescheduleMeetingArguments


class SearchKnowledgeBaseCall(StrictModel):
    name: Literal["search_knowledge_base"]
    arguments: SearchKnowledgeBaseArguments


class ListReposCall(StrictModel):
    name: Literal["list_repos"]
    arguments: ListReposArguments


ToolCallSchema = Union[
    CheckAvailabilityCall,
    BookMeetingCall,
    CancelMeetingCall,
    RescheduleMeetingCall,
    SearchKnowledgeBaseCall,
    ListReposCall,
]


class CalendarUI(StrictModel):
    type: Literal["calendar"]


class BookingUI(StrictModel):
    type: Literal["booking"]
    date: str = Field(pattern=DATE_PATTERN)
    slots: list[str] = Field(max_length=48)

    @field_validator("slots")
    @classmethod
    def validate_slots(cls, values: list[str]) -> list[str]:
        import re

        if any(not re.fullmatch(TIME_PATTERN, value) for value in values):
            raise ValueError("slots must use HH:MM")
        return values


AssistantUI = Union[CalendarUI, BookingUI]


class LLMOutputSchema(StrictModel):
    response: str = Field(min_length=1, max_length=12000)
    tool_call: ToolCallSchema | None
    ui: AssistantUI | None


class ChatRequest(StrictModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[Message] = Field(default_factory=list, max_length=20)
    channel: Literal["voice", "web"] = "web"


class BookingDetails(StrictModel):
    booking_id: str
    date: str
    time: str
    email: str
    meet_url: str = ""


class ChatResponse(StrictModel):
    response: str
    tool_call: ToolCallSchema | None = None
    ui: AssistantUI | None = None
    booking_confirmed: bool = False
    booking_details: BookingDetails | None = None
