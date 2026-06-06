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

# ── Rate limiting config ─────────────────────────────────────────────────────
# Per-IP sliding window: 20 requests per 60 seconds (prevents normal abuse)
_RATE_LIMIT_WINDOW = 60
_RATE_LIMIT_MAX = 20
_rate_limit_store: dict[str, list[float]] = defaultdict(list)
_last_full_cleanup = 0.0

# ── Per-IP concurrency lock (THE KEY FIX) ────────────────────────────────────
# Prevents Vapi retry storms: if an IP already has a request in-flight,
# immediately return 429 instead of queuing another expensive LLM call.
# Vapi retries every ~5s when it times out — without this, 1000 calls/min.
_ip_in_flight: set[str] = set()

# ── Endpoints that invoke the LLM (must be guarded) ─────────────────────────
_LLM_ENDPOINTS = {"/v1/chat", "/chat/completions"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: verify Qdrant collection is ready. Shutdown: no-op."""
    from src.vectordb.vector_store import check_collection_ready
    from src.config import validate_env

    validate_env()

    # Pre-warm embedding models so first request isn't slow
    logger.info("[startup] Pre-warming embedding models...")
    try:
        from src.embeddings.embedder import get_embedder, get_sparse_embedder
        get_embedder()        # triggers lazy load of dense model
        get_sparse_embedder() # triggers lazy load of sparse model
        logger.info("[startup] Embedding models warmed up.")
    except Exception as exc:
        logger.warning("[startup] Could not pre-warm embedding models: %s", exc)

    logger.info("[startup] Checking Qdrant collection health...")
    try:
        ready, count = check_collection_ready()
        if ready:
            logger.info("[startup] Qdrant collection is ready with %d indexed points.", count)
        else:
            logger.warning(
                "[startup] Qdrant collection is EMPTY or does not exist. "
                "The API will start but /v1/chat will return no context. "
                "Run:  python ingest.py   to index your data."
            )
    except Exception as exc:
        logger.error(
            "[startup] Could not reach Qdrant: %s. "
            "Check QDRANT_URL / QDRANT_HOST env vars.",
            exc,
        )

    yield
    # --- shutdown ---
    logger.info("[shutdown] API shutting down.")


app = FastAPI(title="RAG Persona API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def rate_limit_and_deduplicate(request: Request, call_next):
    """
    Two-layer protection for all LLM endpoints:

    Layer 1 — CONCURRENCY LOCK (fixes the $10 Vapi retry storm)
    ─────────────────────────────────────────────────────────────
    If an IP already has a request in-flight, immediately return 429.
    Vapi retries aggressively when the LLM is slow (~60s). Without this,
    each retry spawns a new LLM call while the old one is still running,
    causing 1000+ calls in minutes.

    Layer 2 — SLIDING WINDOW RATE LIMIT
    ─────────────────────────────────────
    20 requests per 60 seconds per IP. Prevents sustained abuse.
    """
    global _last_full_cleanup

    if request.url.path in _LLM_ENDPOINTS and request.method == "POST":
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # ── Layer 1: Per-IP concurrency guard ───────────────────────────────
        if client_ip in _ip_in_flight:
            logger.warning(
                "[rate_limit] DUPLICATE IN-FLIGHT blocked for %s → %s "
                "(Vapi retry storm prevention)",
                client_ip, request.url.path,
            )
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "A request is already being processed. Please wait for it to complete.",
                    "error": "request_in_flight",
                },
                headers={"Retry-After": "30"},
            )

        # ── Layer 2: Sliding window rate limit ──────────────────────────────
        # Cleanup stale IPs every 5 minutes
        if now - _last_full_cleanup > 300:
            _last_full_cleanup = now
            stale_ips = [
                ip for ip, times in _rate_limit_store.items()
                if not times or times[-1] < now - _RATE_LIMIT_WINDOW
            ]
            for ip in stale_ips:
                del _rate_limit_store[ip]

        window_start = now - _RATE_LIMIT_WINDOW
        _rate_limit_store[client_ip] = [
            t for t in _rate_limit_store[client_ip] if t > window_start
        ]
        current_count = len(_rate_limit_store[client_ip])
        if current_count >= _RATE_LIMIT_MAX:
            logger.warning(
                "[rate_limit] IP %s hit %d req/min limit on %s",
                client_ip, _RATE_LIMIT_MAX, request.url.path,
            )
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Too many requests. Limit: {_RATE_LIMIT_MAX}/min. Please slow down.",
                    "error": "rate_limit_exceeded",
                },
                headers={"Retry-After": "60"},
            )

        # ── Mark this IP as in-flight, process, then release ────────────────
        _rate_limit_store[client_ip].append(now)
        _ip_in_flight.add(client_ip)
        logger.debug(
            "[rate_limit] %s → %s | window: %d/%d | in-flight IPs: %d",
            client_ip, request.url.path,
            current_count + 1, _RATE_LIMIT_MAX, len(_ip_in_flight),
        )
        try:
            response = await call_next(request)
            return response
        finally:
            # Always release — even if an exception occurs
            _ip_in_flight.discard(client_ip)

    return await call_next(request)


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
        duration = time.time() - start
        logger.info("[%s] %s — %s — %.3fs", request.method, request.url.path, status_code, duration)


app.include_router(router)

# Mount React static files (for production deployment like HuggingFace Spaces)
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "chat-ui", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        # Serve index.html for all non-API routes to support React Router
        if full_path.startswith("v1/") or full_path == "health":
            return {"error": "Not Found"}
        return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", str(SERVER_PORT)))
    uvicorn.run("main:app", host=SERVER_HOST, port=port, reload=True)
