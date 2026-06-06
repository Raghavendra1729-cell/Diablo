"""Email normalization for STT transcription errors.

When callers spell emails letter-by-letter over voice (e.g.,
"S E E T A dot 24 BCS at SST dot scaler dot com"), algorithmic
parsing runs first (fast, handles ~90% of cases). LLM fallback
handles complex patterns the algorithm can't resolve.

Strategy: normalize eagerly BEFORE the LLM sees the message, so it
never has to echo back garbled STT text. Present clean email to user.
"""
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── Regex patterns to find email-like spelled-out text in user messages ──────

# Matches "email is/would be X dot Y at Z dot com"
_EMAIL_PATTERN = re.compile(
    r'(?:email\s+(?:is|address\s+(?:is|would\s+be))?\s*[:=-]?\s*)'
    r'((?:[a-zA-Z0-9](?:[\s.-]*[a-zA-Z0-9])*\s*(?:dot|at|@)\s*)+'
    r'(?:[a-zA-Z0-9](?:[\s.-]*[a-zA-Z0-9])*\s*(?:dot)\s*)+'
    r'(?:com|org|net|edu|io|co|ai|dev|app|in))',
    re.IGNORECASE,
)

# Fallback: find runs of "word dot/at word" patterns anywhere in the message
_SPELLED_OUT_RUN = re.compile(
    r'(?:^|\s)('
    r'(?:[a-zA-Z0-9]+[\s-])+'
    r'(?:dot|at)'
    r'(?:[\s-][a-zA-Z0-9]+)+'
    r'(?:\s(?:dot|at))'
    r'(?:[\s-][a-zA-Z0-9]+)+'
    r')',
    re.IGNORECASE,
)


def fast_normalize(raw: str) -> Optional[str]:
    """Fast algorithmic email normalization. Returns None if unresolvable.

    Handles common patterns without an LLM call:
      "S-E-E-T-A dot 24 BCS 10250 at SST dot scaler dot com" → "seeta.24bcs10250@sst.scaler.com"
      "john at gmail dot com" → "john@gmail.com"
      "s a r a h dot c o n n o r at email dot com" → "sarah.connor@email.com"
    """
    if not raw or "@" in raw:
        return None  # Already has @ — caller does basic cleanup

    text = raw.lower().strip()
    # Remove STT punctuation artifacts (periods after abbreviations, commas)
    text = re.sub(r'[,\?;:!]', ' ', text)

    # Replace " dot " variations → "."
    text = re.sub(r'\s*\.?\s*dot\s*\.?\s*', '.', text)
    # Replace " at " variations → "@"
    text = re.sub(r'\s*\.?\s*at\s*\.?\s*', '@', text)

    # Remove dashes between alphanumeric chars: S-E-E-T-A → SEETA, 1-0-2-5-0 → 10250
    # Lookahead/lookbehind avoids issues with consecutive dash-separated chars
    text = re.sub(r'(?<=[a-zA-Z0-9])-(?=[a-zA-Z0-9])', '', text)

    # Remove all spaces (joins "S E E T A" → "SEETA", "2 4" → "24")
    text = text.replace(' ', '')

    # Clean up artifacts
    while '..' in text:
        text = text.replace('..', '.')
    text = text.strip('.@')

    if '@' in text and '.' in text.split('@')[-1]:
        return text

    return None


def extract_from_message(message: str) -> tuple[Optional[str], Optional[str]]:
    """Try to extract a spelled-out email from a user message.

    Returns:
        (normalized_email, raw_fragment) or (None, None) if no email found.
        raw_fragment is the un-normalized text for LLM fallback.
    """
    # Try structured pattern: "email is X" or "email would be X"
    m = _EMAIL_PATTERN.search(message)
    if m:
        raw = m.group(1).strip()
        normalized = fast_normalize(raw)
        if normalized:
            return normalized, raw
        return None, raw

    # Try looser pattern: runs of "something dot something at something dot com"
    m = _SPELLED_OUT_RUN.search(message)
    if m:
        raw = m.group(1).strip()
        if re.search(r'\b(dot|at)\b', raw.lower()):
            normalized = fast_normalize(raw)
            if normalized:
                return normalized, raw
            return None, raw

    return None, None


async def llm_fallback(raw: str) -> Optional[str]:
    """LLM-based email normalization for patterns the algorithm can't handle."""
    try:
        from src.llm.llm_client import get_client
        from src.config import LLM_MODEL, LLM_TOP_P
        from starlette.concurrency import run_in_threadpool

        client = get_client()
        response = await run_in_threadpool(
            lambda: client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Convert spelled-out email to proper format. "
                            "Return ONLY the email, nothing else. "
                            "Examples: "
                            "'S E E T A dot 24 BCS at SST dot scaler dot com' → 'seeta.24bcs@sst.scaler.com', "
                            "'john at gmail dot com' → 'john@gmail.com'"
                        ),
                    },
                    {"role": "user", "content": f"Convert to email: {raw}"},
                ],
                max_tokens=30,
                temperature=0.0,
                top_p=LLM_TOP_P,
            )
        )
        result = (response.choices[0].message.content or "").strip().lower()
        result = result.replace(" ", "").strip(".@\"'`")
        if "@" in result and "." in result.split("@")[-1]:
            logger.info("[email_normalizer] LLM fallback: %r → %r", raw[:80], result)
            return result
        return None
    except Exception as e:
        logger.error("[email_normalizer] LLM fallback failed: %s", e)
        return None


def basic_cleanup(raw: str) -> str:
    """Minimal cleanup for emails that already have @."""
    fixed = raw.lower().replace(" ", "")
    while ".." in fixed:
        fixed = fixed.replace("..", ".")
    return fixed.strip(".@")
