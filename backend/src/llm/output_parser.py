"""Robust LLM output parsing — extracts response text and tool calls from JSON.

Voice must never fail with "formatting issue". Four strategies + last-resort
text cleaner ensure graceful recovery from malformed LLM output.
"""
import re
import logging
from typing import Optional

from src.api.schemas import LLMOutputSchema

logger = logging.getLogger(__name__)


def parse_llm_output(raw: str, channel: str) -> tuple[Optional[str], Optional[dict]]:
    """Parse LLM output into (response_text, tool_call_dict).

    Returns (None, None) if parsing completely fails and retry needed.
    For voice, falls back to using raw text as response on final attempt.
    """
    if not raw or not raw.strip():
        return (None, None)
    raw = raw.strip()

    # Strategy 1: Strict Pydantic JSON parse (after stripping markdown fences)
    try:
        cleaned = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.MULTILINE)
        cleaned = re.sub(r'\s*```\s*$', '', cleaned, flags=re.MULTILINE)
        cleaned = cleaned.strip()
        parsed = LLMOutputSchema.model_validate_json(cleaned)
        tc = parsed.tool_call.model_dump() if parsed.tool_call else None
        return (parsed.response, tc)
    except Exception:
        pass

    # Strategy 2: Find { ... } substring, try fixes for common JSON errors
    try:
        start = raw.find('{')
        end = raw.rfind('}')
        if start != -1 and end != -1 and end > start:
            json_str = raw[start:end + 1]
            fixes = [json_str]
            # Missing closing brace
            if json_str.count('{') > json_str.count('}'):
                fixes.append(json_str + '}')
            # Trailing comma before }
            fixes.append(re.sub(r',\s*}', '}', json_str))
            for fixed in fixes:
                try:
                    parsed = LLMOutputSchema.model_validate_json(fixed)
                    tc = parsed.tool_call.model_dump() if parsed.tool_call else None
                    return (parsed.response, tc)
                except Exception:
                    continue
    except Exception:
        pass

    # Strategy 3: Voice — use raw text as response, stripping JSON fragments
    if channel == "voice":
        text = re.sub(r'\{[^}]*\}', '', raw)
        text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
        text = re.sub(r'\[BOOKING_WIDGET[^\]]*\]', '', text)
        text = re.sub(r'\[CALENDAR_WIDGET\]', '', text)
        text = re.sub(r'"thought_process"\s*:\s*"[^"]*"', '', text)
        text = re.sub(r'"response"\s*:\s*"', '', text)
        text = re.sub(r'"tool_call"\s*:\s*null', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        if text and len(text) > 3:
            return (text, None)

    # Strategy 4: Regex extract "response" field from malformed JSON
    resp_match = re.search(r'"response"\s*:\s*"((?:[^"\\]|\\.)*)"', raw)
    if resp_match:
        text = resp_match.group(1).replace('\\"', '"').replace('\\n', '\n')
        return (text, None)

    return (None, None)


def clean_voice_text(raw: str) -> str:
    """Last-resort cleaner: strip JSON fragments, markdown, and UI widgets
    from raw LLM output so TTS reads naturally when JSON parsing fails.
    """
    if not raw:
        return "I'm having trouble processing that."

    text = raw
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
    if len(text) > 400:
        return True
    return any(marker.lower() in text.lower() for marker in reasoning_markers)


def strip_voice_markdown(text: str) -> str:
    """Strip markdown and UI artifacts from assistant response text
    before sending to Vapi TTS so it doesn't sound robotic."""
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    text = re.sub(r'#(.*?)\n', r'\1\n', text)
    text = text.replace('`', '')
    text = re.sub(r'\[BOOKING_WIDGET.*?\]', '', text)
    text = re.sub(r'\[CALENDAR_WIDGET\]', '', text)
    text = re.sub(r'\[Email normalized:[^\]]*\]', '', text)
    return text
