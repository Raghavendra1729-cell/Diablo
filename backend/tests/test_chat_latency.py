"""Regression checks for the web chat request budget."""
import asyncio
from types import SimpleNamespace
from unittest.mock import patch

from src.llm.llm_client import LLM_TIMEOUT_WEB, generate, get_client
from src.prompts.prompt_templates import build_system_prompt


def test_web_prompt_uses_preloaded_context_without_research_tool():
    prompt = build_system_prompt("web", ["Evidence about a project."])
    assert "Evidence about a project." in prompt
    assert "search_knowledge_base" not in prompt
    assert "list_repos" not in prompt
    assert "check_availability" in prompt


def test_web_generation_does_not_retry_stalled_provider():
    calls = []

    def fail(**kwargs):
        calls.append(kwargs)
        raise TimeoutError("provider stalled")

    fake_client = SimpleNamespace(chat=SimpleNamespace(
        completions=SimpleNamespace(create=fail)))
    with patch("src.llm.llm_client.get_client", return_value=fake_client) as client:
        result = asyncio.run(generate([{"role": "user", "content": "hello"}], channel="web"))

    client.assert_called_once_with(LLM_TIMEOUT_WEB)
    assert len(calls) == 1
    assert "temporary issue" in result


def test_openai_sdk_has_no_hidden_retries():
    with patch("src.llm.llm_client.OpenAI") as constructor:
        get_client(LLM_TIMEOUT_WEB)
    assert constructor.call_args.kwargs["max_retries"] == 0
