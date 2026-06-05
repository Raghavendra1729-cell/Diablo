"""Entry point — creates FastAPI app with startup health checks and latency logging.

NOTE: Ingestion is NOT run on startup. Run once explicitly:
    python ingest.py           # skip-if-already-indexed
    python ingest.py --force   # force full re-index
"""
import os
import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from src.api.routes import router
from src.config import SERVER_HOST, SERVER_PORT

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: verify Qdrant collection is ready. Shutdown: no-op."""
    from src.vectordb.vector_store import check_collection_ready

    logger.info("[startup] Checking Qdrant collection health...")
    try:
        ready, count = check_collection_ready()
        if ready:
            logger.info("[startup] ✅ Qdrant collection is ready with %d indexed points.", count)
        else:
            logger.warning(
                "[startup] ⚠️  Qdrant collection is EMPTY or does not exist. "
                "The API will start but /v1/chat will return no context. "
                "Run:  python ingest.py   to index your data."
            )
    except Exception as exc:
        logger.error(
            "[startup] ❌ Could not reach Qdrant: %s. "
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
