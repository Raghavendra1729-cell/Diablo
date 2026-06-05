# RAG Persona Backend

AI persona backend — Corrective RAG pipeline with voice + chat support.
Answers questions about professional background, projects, GitHub repos,
and books interviews autonomously via Cal.com.

## Architecture

```
User Message
  → Guardrails (regex adversarial/off-topic filter)
  → Retrieval (fastembed → Qdrant semantic search)
  → Context Injection (retrieved chunks → system prompt)
  → LLM Generation (OpenAI-compatible → HuggingFace endpoint)
  → Tool Call Extraction (balanced JSON parser)
  → Calendar Booking (Cal.com API for real, mock fallback for dev)
  → Response (plain text for voice, Markdown for web)
```

## Quick Start

```bash
# 1. Install deps
pip install -r requirements.txt

# 2. Configure
cp .env.example .env
# Edit .env with your HF_TOKEN, Qdrant credentials, Cal.com keys
# Edit config.yaml for model/chunking/retrieval settings

# 3. Add your data
# Put content in data/resume.md, data/projects_summary.md, data/repos/*.md

# 4. (Optional) Set up Qdrant
# Either set QDRANT_URL in .env for Qdrant Cloud
# Or run local: docker run -p 6333:6333 qdrant/qdrant

# 5. Index your documents
python -m src.ingestion.loader

# 6. Run server
python main.py
# → http://localhost:8000
```

## API Endpoints

### `GET /health`
```json
{"status": "ok"}
```

### `POST /v1/chat`
```json
// Request
{"message": "Tell me about Python experience", "history": [], "channel": "web"}

// Response
{"response": "Markdown text...", "tool_call": null, "booking_confirmed": false, "booking_details": null}
```

### `POST /v1/availability?date=YYYY-MM-DD`
```json
{"date": "2026-06-10", "available_slots": ["10:00", "11:00", "14:00", "15:00", "16:00"]}
```

## Project Structure

```
backend/
├── main.py                    # Entry point — FastAPI app
├── config.yaml                # Non-secret configuration
├── .env                       # Secrets (API keys, tokens)
├── requirements.txt           # Dependencies
├── src/
│   ├── config.py              # Config loader (yaml + env)
│   ├── ingestion/loader.py    # Document loading + indexing pipeline
│   ├── chunking/chunker.py    # Text chunking
│   ├── embeddings/embedder.py # Local fastembed wrapper
│   ├── vectordb/vector_store.py  # Qdrant client + CRUD
│   ├── retrieval/retriever.py # Semantic search
│   ├── prompts/prompt_templates.py  # System prompt builder
│   ├── llm/llm_client.py      # OpenAI-compatible → HuggingFace
│   ├── api/routes.py          # FastAPI endpoints
│   └── utils/helpers.py       # Guardrails, tool extraction, calendar
├── data/
│   ├── resume.md              # Your resume (RAG source)
│   ├── projects_summary.md    # Project summaries (RAG source)
│   └── repos/                 # Individual repo docs
├── tests/                     # Unit + integration tests
└── logs/                      # Application logs
```

## Running Tests

```bash
python -m pytest tests/ -v
```

## Deploy to Render

1. Set build command: `pip install -r requirements.txt`
2. Set start command: `python main.py`
3. Add env vars: `HF_TOKEN`, `QDRANT_URL`, `QDRANT_API_KEY`, `CAL_API_KEY`, `CAL_EVENT_TYPE_ID`, `PERSONA_NAME`
4. Set Python version: 3.11+

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HF_TOKEN` | Yes | HuggingFace API token |
| `QDRANT_URL` | Cloud | Qdrant Cloud endpoint |
| `QDRANT_API_KEY` | Cloud | Qdrant Cloud API key |
| `QDRANT_HOST` | Local | Qdrant host (default: localhost) |
| `QDRANT_PORT` | Local | Qdrant port (default: 6333) |
| `CAL_API_KEY` | Optional | Cal.com API key |
| `CAL_EVENT_TYPE_ID` | Optional | Cal.com event type |
| `PERSONA_NAME` | Yes | Name of the person this AI represents |
