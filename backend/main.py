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
# One asyncio.Lock per IP. acquire_nowait() is called non-blocking:
# - If no request in flight → acquired immediately → proceed
# - If a request IS in flight → raises immediately → return 429
# This stops the Vapi retry storm where 1 slow call → Vapi retries → 1000 calls
_ip_locks: dict[str, asyncio.Lock] = {}
_ip_locks_meta: dict[str, float] = {}

def _get_ip_lock(ip: str) -> asyncio.Lock:
    if ip not in _ip_locks:
        _ip_locks[ip] = asyncio.Lock()
    _ip_locks_meta[ip] = time.time()
    return _ip_locks[ip]

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
    lock.acquire_nowait() is non-blocking and atomic in asyncio's
    single-threaded event loop.

    Scenario it prevents:
      Vapi sends request → LLM takes 25s → Vapi times out → retries
      Without guard: old request + new retry both call LLM → pile-up
      With guard:    retry hits locked IP → instant 429 → 0 extra cost

    LAYER 2 — Sliding window rate limit
    ------------------------------------
    20 requests per 60 s per IP (sustained abuse prevention).
    """
    global _last_full_cleanup

    if request.url.path not in _LLM_ENDPOINTS or request.method != "POST":
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    now = time.time()

    # ── LAYER 1: try to acquire the per-IP lock non-blocking ─────────────────
    lock = _get_ip_lock(client_ip)
    try:
        lock.acquire_nowait()
        # Successfully acquired — we are the only request for this IP
    except Exception:
        # Lock is held → a request is already in flight → reject immediately
        logger.warning(
            "[guard] IN-FLIGHT BLOCKED %s → %s", client_ip, request.url.path
        )
        return JSONResponse(
            status_code=429,
            content={
                "detail": "A request is already being processed. Please wait.",
                "error": "request_in_flight",
            },
            headers={"Retry-After": "30"},
        )

    # Lock is ours — wrap everything in try/finally so we ALWAYS release it
    try:
        # ── LAYER 2: sliding window rate limit ───────────────────────────────
        # Periodic cleanup of stale entries
        if now - _last_full_cleanup > 300:
            _last_full_cleanup = now
            for ip in [k for k, t in _ip_locks_meta.items() if now - t > 600]:
                _ip_locks.pop(ip, None)
                _ip_locks_meta.pop(ip, None)
            for ip in [
                k for k, v in _rate_limit_store.items()
                if not v or v[-1] < now - _RATE_LIMIT_WINDOW
            ]:
                del _rate_limit_store[ip]

        window_start = now - _RATE_LIMIT_WINDOW
        _rate_limit_store[client_ip] = [
            t for t in _rate_limit_store[client_ip] if t > window_start
        ]
        count = len(_rate_limit_store[client_ip])
        if count >= _RATE_LIMIT_MAX:
            logger.warning(
                "[rate_limit] %s exceeded %d req/min on %s",
                client_ip, _RATE_LIMIT_MAX, request.url.path,
            )
            return JSONResponse(
                status_code=429,
                content={
                    "detail": f"Too many requests. Limit: {_RATE_LIMIT_MAX}/min.",
                    "error": "rate_limit_exceeded",
                },
                headers={"Retry-After": "60"},
            )

        _rate_limit_store[client_ip].append(now)
        logger.info(
            "[guard] OK %s → %s  [window %d/%d]",
            client_ip, request.url.path, count + 1, _RATE_LIMIT_MAX,
        )
        return await call_next(request)

    finally:
        lock.release()


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
