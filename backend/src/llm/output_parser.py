"""Strict model-output parsing plus a voice-only spoken-text fallback."""
import re
import logging

from src.api.schemas import LLMOutputSchema

logger = logging.getLogger(__name__)


def parse_llm_output(raw: str) -> tuple[str | None, dict | None, dict | None]:
    """Validate exactly one JSON object against the server-owned schema, supporting markdown code fences."""
    if not raw or not raw.strip():
        return (None, None, None)

    cleaned = raw.strip()
    # Strip <think> reasoning blocks if present
    cleaned = re.sub(r"<think>.*?</think>", "", cleaned, flags=re.DOTALL).strip()

    # If wrapped in markdown code fence ```json ... ``` or ``` ... ```
    if cleaned.startswith("```"):
        fence_match = re.match(r"^```(?:json)?\s*([\s\S]*?)\s*```$", cleaned)
        if fence_match:
            cleaned = fence_match.group(1).strip()

    try:
        parsed = LLMOutputSchema.model_validate_json(cleaned)
        tool_call = parsed.tool_call.model_dump(exclude_none=True) if parsed.tool_call else None
        ui = parsed.ui.model_dump(exclude_none=True) if parsed.ui else None
        return (parsed.response, tool_call, ui)
    except Exception as exc:
        logger.warning("[output_parser] Strict schema validation failed: %s", exc)
        return (None, None, None)


def clean_voice_text(raw: str) -> str:
    """Last-resort cleaner: strip JSON fragments, markdown, and UI widgets
    from raw LLM output so TTS reads naturally when JSON parsing fails.
    """
    if not raw:
        return "I'm having trouble processing that."

    text = raw
    # Strip <think> reasoning blocks
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    # Strip JSON objects and fragments
    text = re.sub(r'\{[^}]*\}', '', text)
    text = re.sub(r'\"[a-z_]+\"\s*:\s*\"[^"]*\"', '', text)
    text = re.sub(r'\"[a-z_]+\"\s*:\s*[^,}]+', '', text)
    # Strip markdown
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    text = re.sub(r'#+\s*', '', text)
    text = text.replace('`', '')
    # Strip UI widgets and internal hints
    text = re.sub(r'\[BOOKING_WIDGET[^\]]*\]', '', text)
    text = re.sub(r'\[CALENDAR_WIDGET\]', '', text)
    text = re.sub(r'\[Email normalized:[^\]]*\]', '', text)
    text = re.sub(r'\[Booking ID:[^\]]*\]', '', text)
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    if not text or len(text) < 3:
        return "I'm having trouble processing that."
    return text


def has_reasoning_leak(text: str) -> bool:
    """Detect if voice response looks like leaked LLM reasoning instead of
    a concise spoken response."""
    if not text:
        return False
    reasoning_markers = [
        "According to the booking rule",
        "The rule says",
        "But in this case",
        "We need to",
        "thought_process",
        "Let me think",
    ]
    return any(marker.lower() in text.lower() for marker in reasoning_markers)


def strip_voice_markdown(text: str) -> str:
    """Strip markdown and UI artifacts from assistant response text
    before sending to Vapi TTS so it doesn't sound robotic."""
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    text = re.sub(r'#(.*?)\n', r'\1\n', text)
    text = text.replace('`', '')
    text = re.sub(r'\[BOOKING_WIDGET.*?\]', '', text)
    text = re.sub(r'\[CALENDAR_WIDGET\]', '', text)
    text = re.sub(r'\[Email normalized:[^\]]*\]', '', text)
    text = re.sub(r'\[Booking ID:[^\]]*\]', '', text)
    return text
