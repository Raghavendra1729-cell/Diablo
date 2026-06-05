import pytest
from unittest.mock import patch, MagicMock
from src.retrieval.retriever import retrieve_context, NO_CONTEXT_SENTINEL, _expand_query, _detect_intent
from src.vectordb.vector_store import check_collection_ready

@pytest.fixture
def mock_embedder():
    with patch("src.retrieval.retriever.embed_query") as m:
        m.return_value = [0.1] * 384
        yield m

@pytest.fixture
def mock_sparse_embedder():
    with patch("src.retrieval.retriever.embed_query_sparse") as m:
        m.return_value = {"indices": [1], "values": [0.5]}
        yield m

@pytest.fixture
def mock_search():
    with patch("src.retrieval.retriever.search") as m:
        m.return_value = [
            {"text": "Sample text", "source": "test_src", "score": 0.8}
        ]
        yield m

@pytest.fixture
def mock_search_with_filter():
    with patch("src.retrieval.retriever.search_with_filter") as m:
        m.return_value = [
            {"text": "Sample code text", "source": "code_src", "score": 0.9}
        ]
        yield m


def test_intent_detection():
    assert _detect_intent("What is his education?") == "resume"
    assert _detect_intent("Show me the github repos") == "code"
    assert _detect_intent("How are you?") is None

def test_hyde_expansion():
    query = "what are his projects?"
    expanded = _expand_query(query)
    assert len(expanded) > len(query)
    assert "projects" in expanded
    assert "portfolio" in expanded

def test_retrieve_context_success(mock_embedder, mock_sparse_embedder, mock_search):
    # Test a general query
    result = retrieve_context("tell me something general")
    assert len(result) > 0
    assert result[0] != NO_CONTEXT_SENTINEL
    assert "Sample text" in result[0]

def test_retrieve_context_filtered(mock_embedder, mock_sparse_embedder, mock_search_with_filter):
    # Test an intent query for code
    result = retrieve_context("show me your github repos")
    mock_search_with_filter.assert_called()
    assert "Sample code text" in result[0]

def test_retrieve_context_no_hits(mock_embedder, mock_sparse_embedder):
    with patch("src.retrieval.retriever.search", return_value=[]):
        result = retrieve_context("a completely random query")
        assert result == [NO_CONTEXT_SENTINEL]

def test_retrieve_context_rerank_fallback():
    # Reranking is currently bypassed (disabled for speed).
    # The retriever slices Qdrant hits directly — an empty search result
    # returns NO_CONTEXT_SENTINEL, not an empty rerank result.
    with patch("src.retrieval.retriever.search", return_value=[]):
        result = retrieve_context("random")
        assert result == [NO_CONTEXT_SENTINEL]
