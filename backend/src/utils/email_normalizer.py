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
    r'([a-zA-Z0-9\s.-]{5,100}(?:com|org|net|edu|io|co|ai|dev|app|in))\b',
    re.IGNORECASE,
)

# Fallback: find runs of "word dot/at word" patterns anywhere in the message
# Safe, non-overlapping version
_SPELLED_OUT_RUN = re.compile(
    r'(?:^|\s)([a-zA-Z0-9][a-zA-Z0-9\s-]{1,50}(?:dot|at)[a-zA-Z0-9\s-]{1,50}(?:dot|at)[a-zA-Z0-9\s-]{1,50})',
    re.IGNORECASE,
)


# Word-level substitution map — applied BEFORE space/char operations
_WORD_SUBS: list[tuple[re.Pattern, str]] = [
    (re.compile(r'\bat\s+the\s+rate\b', re.IGNORECASE), ' at '),   # "at the rate" → "at"
    (re.compile(r'\bhyphen\b', re.IGNORECASE), '-'),                # "hyphen" → "-"
    (re.compile(r'\bdash\b', re.IGNORECASE), '-'),                  # "dash" → "-"
    (re.compile(r'\bunderscore\b', re.IGNORECASE), '_'),            # "underscore" → "_"
    (re.compile(r'\bslash\b', re.IGNORECASE), '/'),                 # "slash" → "/"  (rare)
    (re.compile(r'\bperiod\b', re.IGNORECASE), '.'),                # "period" → "."
    (re.compile(r'\bpoint\b', re.IGNORECASE), '.'),                 # "point" → "."
    (re.compile(r'\bplus\b', re.IGNORECASE), '+'),                  # "plus" → "+"
]

def fast_normalize(raw: str) -> Optional[str]:
    """Fast algorithmic email normalization. Returns None if unresolvable."""
    if not raw or "@" in raw:
        return None  # Already has @ — caller does basic cleanup

    text = raw.lower().strip()

    # Step 0 — Remove STT punctuation artifacts
    text = re.sub(r'[,?;:!]', ' ', text)

    # Step 1 — Word-level substitutions FIRST (before any space/char ops)
    for pattern, replacement in _WORD_SUBS:
        text = pattern.sub(replacement, text)

    # Step 2 — Replace " dot " / " period " variations → "."
    text = re.sub(r'\s*\.?\s*dot\s*\.?\s*', '.', text)
    # Step 3 — Replace " at " variations → "@"  (after "at the rate" already handled)
    text = re.sub(r'\s*\.?\s*\bat\b\s*\.?\s*', '@', text)

    # Step 4 — Remove dashes between ALPHANUMERIC chars (letter-by-letter dashes)
    #           But KEEP dashes that are now genuine separators (e.g. john-doe)
    #           Heuristic: if it's a sequence of single chars separated by dashes, it's spelled-out
    text = re.sub(r'\b(?:[a-z0-9]-)+[a-z0-9]\b', lambda m: m.group(0).replace('-', ''), text)

    # Step 5 — Remove all remaining spaces (joins spelled-out chars)
    text = text.replace(' ', '')

    # Step 6 — Clean up double dots and leading/trailing junk
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

        client = get_client(10)  # 10s is enough for a 30-token email parse
        response = await run_in_threadpool(
            lambda: client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an email address parser for voice transcription. "
                            "The user spelled out or described their email address verbally. "
                            "Convert it to a valid email address. "
                            "Rules:\n"
                            "- 'at' or 'at the rate' → @\n"
                            "- 'dot' or 'period' or 'point' → .\n"
                            "- 'hyphen' or 'dash' → -\n"
                            "- 'underscore' → _\n"
                            "- Spelled-out letters like 'j o h n' → 'john'\n"
                            "- Dash-separated letters like 'j-o-h-n' → 'john'\n"
                            "Output ONLY the email address with no spaces, no explanation, no quotes.\n"
                            "If you cannot determine a valid email, output the word: UNKNOWN\n\n"
                            "Examples:\n"
                            "  'john hyphen doe at company dot com' → john-doe@company.com\n"
                            "  'j o h n underscore doe at g mail dot com' → john_doe@gmail.com\n"
                            "  'sarah dot connor at sky net dot org' → sarah.connor@skynet.org\n"
                            "  'john at the rate gmail dot com' → john@gmail.com\n"
                            "  'a b c 1 2 3 at example dot c o m' → abc123@example.com\n"
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
