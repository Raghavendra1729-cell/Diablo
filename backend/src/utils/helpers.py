"""Utility helpers: guardrails."""
import logging
import traceback

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Guardrails — regex-based adversarial + off-topic detection
# ---------------------------------------------------------------------------

import re

JAILBREAK_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"ignore\s+(all\s+)?above",
    r"disregard\s+(all\s+)?previous",
    r"forget\s+(all\s+)?previous",
    r"you\s+are\s+now\s+(?:a|an)\s+(?!ai\s+(?:assistant|representative))",
    r"act\s+as\s+(?:a|an)\s+(?!ai\s+(?:assistant|representative))",
    r"pretend\s+(?:you\s+are|to\s+be)",
    r"roleplay\s+as",
    r"system\s*prompt",
    r"reveal\s+(?:your\s+)?(?:system|instructions|prompt)",
    r"what\s+(?:are|is)\s+your\s+(?:system|initial)\s+(?:prompt|instructions)",
    r"repeat\s+(?:your\s+)?(?:system|initial)\s+(?:prompt|instructions)",
    r"DAN\s+mode",
    r"developer\s+mode",
    r"bypass\s+(?:your\s+)?(?:restrictions|filters|guardrails)",
]

COMPILED_JAILBREAK = [re.compile(p, re.IGNORECASE) for p in JAILBREAK_PATTERNS]

OFF_TOPIC_PATTERNS = [
    r"write\s+(?:me\s+)?(?:a\s+)?(?:poem|story|essay|song|code\s+for)",
    r"tell\s+me\s+a\s+joke",
    r"what\s+is\s+the\s+meaning\s+of\s+life",
    r"(?:political|religious)\s+(?:views|opinions)",
    r"(?:personal|private)\s+(?:life|relationships)",
]

COMPILED_OFF_TOPIC = [re.compile(p, re.IGNORECASE) for p in OFF_TOPIC_PATTERNS]

GUARDRAIL_RESPONSE = "I am an AI assistant. I can only discuss professional qualifications and scheduling."


def detect_jailbreak(text: str) -> bool:
    """Check if input matches known jailbreak patterns."""
    try:
        for pattern in COMPILED_JAILBREAK:
            if pattern.search(text):
                logger.warning("[helpers] Jailbreak detected in input: %.100s", text)
                return True
        return False
    except Exception as e:
        logger.error("[helpers] detect_jailbreak error: %s\n%s", e, traceback.format_exc())
        return False


def detect_off_topic(text: str) -> bool:
    """Check if input matches known off-topic patterns."""
    try:
        for pattern in COMPILED_OFF_TOPIC:
            if pattern.search(text):
                logger.info("[helpers] Off-topic query detected: %.100s", text)
                return True
        return False
    except Exception as e:
        logger.error("[helpers] detect_off_topic error: %s\n%s", e, traceback.format_exc())
        return False


def check_guardrails(user_message: str) -> str | None:
    """Returns guardrail response if blocked, None if clean."""
    try:
        if detect_jailbreak(user_message) or detect_off_topic(user_message):
            return GUARDRAIL_RESPONSE
        return None
    except Exception as e:
        logger.error("[helpers] check_guardrails error: %s\n%s", e, traceback.format_exc())
        return None



