"""Configuration loader — merges config.yaml with .env secrets.

Validates critical environment variables at startup and logs warnings
if required secrets are missing.
"""
import os
import logging
import yaml
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_PATH = BASE_DIR / "config.yaml"

with open(CONFIG_PATH) as f:
    _yaml = yaml.safe_load(f)

# Embedding
EMBED_MODEL = _yaml["embedding"]["model"]

# Chunking
CHUNK_SIZE = _yaml["chunking"]["chunk_size"]
CHUNK_OVERLAP = _yaml["chunking"]["overlap"]

# Vector DB
VECTORDB_COLLECTION = _yaml["vectordb"]["collection"]
RETRIEVAL_TOP_K = _yaml["retrieval"]["top_k"]

# Qdrant connection (from .env for secrets, config.yaml for collection name)
QDRANT_URL = os.getenv("QDRANT_URL", "")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))

# LLM
LLM_MODEL = _yaml["llm"]["model"]
LLM_BASE_URL = _yaml["llm"]["base_url"]
LLM_MAX_TOKENS = _yaml["llm"]["max_tokens"]
LLM_MAX_TOKENS_VOICE = _yaml["llm"].get("max_tokens_voice", 150)
LLM_TEMPERATURE = _yaml["llm"]["temperature"]
LLM_TEMPERATURE_VOICE = _yaml["llm"].get("temperature_voice", 0.5)
LLM_TOP_P = _yaml["llm"]["top_p"]
HF_TOKEN = os.getenv("HF_TOKEN", "")

# Calendar
CAL_API_KEY = os.getenv("CAL_API_KEY", "")
CAL_EVENT_TYPE_ID = os.getenv("CAL_EVENT_TYPE_ID", "")
CAL_BASE_URL = _yaml["calendar"]["calcom_base_url"]

# Persona
DATA_DIR = BASE_DIR / _yaml["persona"]["data_dir"]

# Server
SERVER_HOST = _yaml["server"]["host"]
SERVER_PORT = int(os.getenv("PORT", str(_yaml["server"]["port"])))

# Admin key for protected endpoints (e.g. POST /v1/ingest)
INGEST_ADMIN_KEY = os.getenv("INGEST_ADMIN_KEY", "")


def validate_env() -> None:
    """Log warnings for missing critical environment variables at startup."""
    warnings = []

    if not HF_TOKEN:
        warnings.append("HF_TOKEN is not set — LLM calls will fail (HuggingFace auth required).")

    if not QDRANT_URL and QDRANT_HOST == "localhost":
        warnings.append(
            "QDRANT_URL is not set and QDRANT_HOST=localhost — "
            "connecting to local Qdrant. Set QDRANT_URL + QDRANT_API_KEY for Qdrant Cloud."
        )

    if QDRANT_URL and not QDRANT_API_KEY:
        warnings.append(
            "QDRANT_URL is set but QDRANT_API_KEY is empty — "
            "Qdrant Cloud connections will likely fail."
        )

    if not INGEST_ADMIN_KEY:
        warnings.append(
            "INGEST_ADMIN_KEY is not set — POST /v1/ingest endpoint is DISABLED. "
            "Set INGEST_ADMIN_KEY to enable remote re-ingestion."
        )

    for w in warnings:
        logger.warning("[config] %s", w)


# validate_env() moved to main.py lifespan startup handler
# to avoid cluttering test output and allow deferred validation for testing.
