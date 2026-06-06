"""FastAPI application entry point."""
import os
import time
import asyncio
import logging
from collections import defaultdict
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from src.api.routes import router
from src.config import SERVER_HOST, SERVER_PORT

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)

# ── Rate limiting ─────────────────────────────────────────────────────────────
_RATE_LIMIT_WINDOW = 60   # seconds
_RATE_LIMIT_MAX = 20      # max requests per window per IP
_rate_limit_store: dict[str, list[float]] = defaultdict(list)
_last_full_cleanup = 0.0

# ── Per-IP concurrency guard ──────────────────────────────────────────────────
# A simple set tracking IPs currently processing a request.
# In asyncio's single-threaded event loop, checking and adding to a set
# is completely atomic because there are no `await` yields between them.
# This prevents Vapi retry storms.
_ip_in_flight: set[str] = set()

# Endpoints that invoke the LLM — both must be protected
_LLM_ENDPOINTS = {"/v1/chat", "/chat/completions"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: warm models and verify Qdrant. Shutdown: no-op."""
    from src.vectordb.vector_store import check_collection_ready
    from src.config import validate_env

    validate_env()

    logger.info("[startup] Pre-warming embedding models...")
    try:
        from src.embeddings.embedder import get_embedder, get_sparse_embedder
        get_embedder()
        get_sparse_embedder()
        logger.info("[startup] Embedding models warmed up.")
    except Exception as exc:
        logger.warning("[startup] Could not pre-warm embedding models: %s", exc)

    logger.info("[startup] Checking Qdrant collection health...")
    try:
        ready, count = check_collection_ready()
        if ready:
            logger.info("[startup] Qdrant collection ready — %d points indexed.", count)
        else:
            logger.warning(
                "[startup] Qdrant collection EMPTY. "
                "Run:  python ingest.py   to index your data."
            )
    except Exception as exc:
        logger.error("[startup] Cannot reach Qdrant: %s", exc)

    yield
    logger.info("[shutdown] API shutting down.")
    try:
        from src.tools.calendar_tools import close_http_client
        await close_http_client()
    except Exception as exc:
        logger.warning("[shutdown] Could not close HTTP client: %s", exc)


app = FastAPI(title="RAG Persona API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def guard_llm_endpoints(request: Request, call_next):
    """
    Two-layer protection on /v1/chat and /chat/completions:

    LAYER 1 — Per-IP concurrency lock  (fixes the Vapi retry storm)
    ----------------------------------------------------------------
    If client_ip is already in _ip_in_flight, reject immediately.

    LAYER 2 — Sliding window rate limit
    ------------------------------------
    20 requests per 60 s per IP (sustained abuse prevention).
    """
    global _last_full_cleanup

    if request.url.path not in _LLM_ENDPOINTS or request.method != "POST":
        return await call_next(request)

    # Use x-forwarded-for if behind a proxy like HuggingFace Spaces
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown"
        
    now = time.time()

    # ── LAYER 1: in-flight concurrency guard ─────────────────────────────────
    # DISABLED: Vapi needs to send overlapping requests when a user interrupts
    # the agent mid-sentence, triggering a new turn before the old turn finishes.
    # if client_ip in _ip_in_flight:
    #     logger.warning(
    #         "[guard] IN-FLIGHT BLOCKED %s → %s", client_ip, request.url.path
    #     )
    #     return JSONResponse(
    #         status_code=429,
    #         content={
    #             "detail": "A request is already being processed. Please wait.",
    #             "error": "request_in_flight",
    #         },
    #         headers={"Retry-After": "30"},
    #     )

    # ── LAYER 2: sliding window rate limit ───────────────────────────────
    # DISABLED: Ensuring absolutely zero interruptions during the Loom video recording.
    # if now - _last_full_cleanup > 300:
    #     _last_full_cleanup = now
    #     for ip in [
    #         k for k, v in _rate_limit_store.items()
    #         if not v or v[-1] < now - _RATE_LIMIT_WINDOW
    #     ]:
    #         del _rate_limit_store[ip]
    #
    # window_start = now - _RATE_LIMIT_WINDOW
    # _rate_limit_store[client_ip] = [
    #     t for t in _rate_limit_store[client_ip] if t > window_start
    # ]
    # count = len(_rate_limit_store[client_ip])
    # if count >= _RATE_LIMIT_MAX:
    #     logger.warning(
    #         "[rate_limit] %s exceeded %d req/min on %s",
    #         client_ip, _RATE_LIMIT_MAX, request.url.path,
    #     )
    #     return JSONResponse(
    #         status_code=429,
    #         content={
    #             "detail": f"Too many requests. Limit: {_RATE_LIMIT_MAX}/min.",
    #             "error": "rate_limit_exceeded",
    #         },
    #         headers={"Retry-After": "60"},
    #     )
    #
    # _rate_limit_store[client_ip].append(now)
    # _ip_in_flight.add(client_ip)
    
    logger.info(
        "[guard] OK %s → %s  (Rate limiting disabled for video)",
        client_ip, request.url.path
    )
    
    try:
        return await call_next(request)
    finally:
        _ip_in_flight.discard(client_ip)


@app.middleware("http")
async def log_request_latency(request: Request, call_next):
    start = time.time()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    except Exception:
        raise
    finally:
        elapsed = time.time() - start
        logger.info(
            "[%s] %s — %s — %.3fs",
            request.method, request.url.path, status_code, elapsed,
        )


app.include_router(router)

# Mount React static files (production / HuggingFace Spaces)
frontend_dist = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "chat-ui", "dist",
)
if os.path.isdir(frontend_dist):
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(frontend_dist, "assets")),
        name="assets",
    )

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        if full_path.startswith("v1/") or full_path == "health":
            return {"error": "Not Found"}
        return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", str(SERVER_PORT)))
    uvicorn.run("main:app", host=SERVER_HOST, port=port, reload=True)
