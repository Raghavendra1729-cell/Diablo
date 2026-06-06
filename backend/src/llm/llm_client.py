"""LLM client — OpenAI-compatible interface pointed at HuggingFace inference endpoint.

Singleton is protected with threading.Lock. Requests include a 60-second timeout
to prevent the event loop from hanging indefinitely.
"""
import asyncio
import logging
import threading
from typing import Optional
from openai import OpenAI
from starlette.concurrency import run_in_threadpool
from src.config import (
    LLM_BASE_URL,
    LLM_MODEL,
    LLM_MAX_TOKENS,
    LLM_MAX_TOKENS_VOICE,
    LLM_TEMPERATURE,
    LLM_TEMPERATURE_VOICE,
    LLM_TOP_P,
    HF_TOKEN,
)

logger = logging.getLogger(__name__)

_client: Optional[OpenAI] = None
_client_lock = threading.Lock()

LLM_TIMEOUT_SECONDS = 25  # Must be < Vapi's timeout (~30s) so we respond before it retries


def get_client() -> OpenAI:
    """Return cached OpenAI client configured for HF endpoint. Thread-safe."""
    global _client
    if _client is None:
        with _client_lock:
            if _client is None:
                logger.info("[llm] Initialising OpenAI-compatible client → %s", LLM_BASE_URL)
                _client = OpenAI(
                    base_url=LLM_BASE_URL,
                    api_key=HF_TOKEN,
                    timeout=LLM_TIMEOUT_SECONDS,
                )
    return _client


async def generate(messages: list[dict], max_retries: int = 1, channel: str = "web") -> str:
    """Send messages to LLM, return response text. Async with retry logic.

    The blocking OpenAI HTTP call is offloaded to a threadpool thread via
    ``run_in_threadpool``. Retry waits use ``asyncio.sleep`` so the event
    loop stays free for other requests during backoff.

    Voice channel uses tighter max_tokens (400) and slightly higher temperature
    for natural-sounding short responses.

    max_retries is set to 1 (not 2) to prevent duplicate LLM costs during
    Vapi retry storms. The in-flight lock in main.py is the primary defence.
    """
    max_tokens = LLM_MAX_TOKENS_VOICE if channel == "voice" else LLM_MAX_TOKENS
    temperature = LLM_TEMPERATURE_VOICE if channel == "voice" else LLM_TEMPERATURE
    # Voice needs json_object too — otherwise Llama 3.3 70B outputs plain text
    # and tool calls are lost. Robust fallback parsing in _parse_llm_output handles
    # any malformed JSON safely.
    use_json = True

    last_exc = None
    tried_json_fallback = False
    for attempt in range(max_retries + 1):
        try:
            client = get_client()
            create_kwargs: dict = {
                "model": LLM_MODEL,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "top_p": LLM_TOP_P,
            }
            if use_json:
                create_kwargs["response_format"] = {"type": "json_object"}

            response = await run_in_threadpool(
                lambda: client.chat.completions.create(**create_kwargs)
            )
            content = response.choices[0].message.content
            return (content or "").strip()
        except Exception as exc:
            last_exc = exc
            # If json_object causes errors, fall back to plain text on next attempt
            if use_json and not tried_json_fallback:
                logger.warning(
                    "[llm] json_object may be unsupported, falling back to plain text. Error: %s", exc
                )
                use_json = False
                tried_json_fallback = True
                await asyncio.sleep(0.5)
                continue
            if attempt < max_retries:
                wait = 2 ** attempt
                logger.warning("[llm] Attempt %d failed, retrying in %ds: %s", attempt + 1, wait, exc)
                await asyncio.sleep(wait)
    logger.error("[llm] All %d attempts failed: %s", max_retries + 1, last_exc)
    return '{"thought_process": "Error occurred.", "response": "I am experiencing a temporary issue. Please try again in a moment.", "tool_call": null}'
