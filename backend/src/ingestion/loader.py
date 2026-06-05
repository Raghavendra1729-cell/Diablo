"""Document loader — clones GitHub repos + reads local .md files, filters, chunks, indexes.

Run this script directly to index data into Qdrant:
    python ingest.py           # skip if collection already has data
    python ingest.py --force   # force full re-index (wipes and recreates collection)

The loader will NOT automatically run on API startup.
"""
import uuid
import shutil
import logging
import tempfile
from pathlib import Path

from qdrant_client.models import PointStruct

from src.config import DATA_DIR, VECTORDB_COLLECTION
from src.chunking.chunker import chunk_text
from src.embeddings.embedder import embed_texts, embed_texts_sparse
from src.vectordb.vector_store import recreate_collection, upsert_points, check_collection_ready

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)

# Clone & Filter strategy

WHITELIST_EXTENSIONS = {".py", ".js", ".ts", ".md", ".json", ".txt", ".yaml", ".yml", ".toml"}
BLACKLIST_DIRS = {
    ".git", "node_modules", "venv", "__pycache__",
    "dist", "build", ".next", "target", "__MACOSX",
}
MAX_FILE_SIZE_BYTES = 500_000  # skip files larger than 500 KB


def _get_doc_type(file_path: Path) -> str:
    """Infer document type from filename for metadata tagging."""
    name = file_path.name.lower()
    if "resume" in name:
        return "resume"
    if "project" in name:
        return "projects"
    return "document"


def load_local_docs(data_dir: Path = DATA_DIR) -> list[dict]:
    """Walk data/ directory for .md files (resume, project summaries)."""
    docs = []
    if not data_dir.exists():
        logger.warning("[ingest] data_dir does not exist: %s", data_dir)
        return docs
    for md_file in data_dir.rglob("*.md"):
        # Skip repos/ — those are cloned repos, handled separately
        if "repos" in md_file.parts:
            continue
        try:
            content = md_file.read_text(encoding="utf-8")
            if not content.strip():
                continue
            source = str(md_file.relative_to(data_dir))
            chunks = chunk_text(content, extension=md_file.suffix.lower())
            doc_type = _get_doc_type(md_file)
            for i, chunk in enumerate(chunks):
                docs.append({
                    "id": str(uuid.uuid4()),
                    "text": chunk,
                    "source": source,
                    "chunk_index": i,
                    "doc_type": doc_type,
                })
        except Exception as exc:
            logger.warning("[ingest] Skipping %s: %s", md_file, exc)
    return docs


def load_repo_from_url(repo_url: str, branch: str = "main") -> list[dict]:
    """Clone a GitHub repo into temp dir, walk with whitelist/blacklist, chunk files."""
    docs = []
    tmpdir = tempfile.mkdtemp(prefix="repo_")
    try:
        try:
            from git import Repo
        except ImportError:
            logger.error("[ingest] GitPython not installed. Run: pip install GitPython")
            return docs
        logger.info("[ingest] Cloning %s (branch: %s)...", repo_url, branch)
        repo = Repo.clone_from(repo_url, tmpdir, branch=branch)
        
        # Extract full commit history for RAG grounding
        try:
            log_output = repo.git.log('--stat', '--oneline')
            commit_file = Path(tmpdir) / "commit_history.md"
            commit_file.write_text(f"# Commit History for {repo_url}\n\n```text\n{log_output}\n```", encoding="utf-8")
        except Exception as e:
            logger.warning("[ingest] Could not extract git log for %s: %s", repo_url, e)

        source_prefix = repo_url.rstrip("/").split("/")[-1].removesuffix(".git")
        docs = walk_and_chunk(Path(tmpdir), source_prefix=source_prefix)
        logger.info("[ingest]   -> %d chunks from %s", len(docs), repo_url)
    except Exception as exc:
        logger.error("[ingest] ERROR cloning %s: %s", repo_url, exc)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)
    return docs


def load_repo_from_local(repo_path: Path) -> list[dict]:
    """Walk a local repo directory with whitelist/blacklist."""
    if not repo_path.exists():
        logger.warning("[ingest] %s does not exist, skipping", repo_path)
        return []
    source_prefix = repo_path.name
    return walk_and_chunk(repo_path, source_prefix=source_prefix)


def walk_and_chunk(root: Path, source_prefix: str) -> list[dict]:
    """Recursively walk directory, apply whitelist + blacklist + size filter, chunk each file."""
    docs = []
    for file_path in root.rglob("*"):
        if not file_path.is_file():
            continue

        # Blacklist directory check — skip if any parent dir matches
        if any(d in BLACKLIST_DIRS for d in file_path.parts):
            continue

        # Whitelist extension check
        if file_path.suffix.lower() not in WHITELIST_EXTENSIONS:
            continue

        # Size check
        try:
            if file_path.stat().st_size > MAX_FILE_SIZE_BYTES:
                continue
        except OSError:
            continue

        try:
            content = file_path.read_text(encoding="utf-8", errors="replace")
            if not content.strip():
                continue
        except Exception:
            continue

        # Build relative source path
        rel = str(file_path.relative_to(root))
        source = f"{source_prefix}/{rel}"

        chunks = chunk_text(content, extension=file_path.suffix.lower())
        for i, chunk in enumerate(chunks):
            docs.append({
                "id": str(uuid.uuid4()),
                "text": chunk,
                "source": source,
                "chunk_index": i,
                "doc_type": "code",
                "repo_name": source_prefix,
            })
    return docs


# REPO_REGISTRY — REPLACE WITH YOUR REAL GITHUB REPOS
# Format:
#   {"url": "https://github.com/USERNAME/REPO.git", "branch": "main"}   ← clones from GitHub
#   {"local": "data/repos/my-repo"}                                      ← uses local folder
#
# ⚠️  IMPORTANT: The URLs below are PLACEHOLDERS. Replace them with your actual
#     public GitHub repository URLs before running ingestion. Repos that return
#     a 404 will be skipped with a warning — ingestion will continue with
#     whichever repos succeed.

REPO_REGISTRY: list[dict] = [
    {"url": "https://github.com/Raghavendra1729-cell/PrismSearch.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/WEB-AUTOMATION-AGENT.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/SastaNotebookLm.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/WebCloner.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/SGA-2.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/prompt-wars.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/Persona-Ai.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/devops-incident-responder.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/GithubTutorial.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/portfolio.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/forge.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/SST28-LLD101.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/Lost-n-Found.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/Raghavendra1729-cell.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/ecommerce.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/Saathi-App.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/Multithreaded-Http-Server.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/mlnotes.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/MiniJournal-DailyJournal.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/HostelHub.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/SmartMenuApp.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/OtakuNexus.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/ExpenseTracker.git", "branch": "main"},
    {"url": "https://github.com/Raghavendra1729-cell/Typing-Speed.git", "branch": "main"},
]


def load_all_documents(data_dir: Path = DATA_DIR) -> list[dict]:
    """Load from: local data/*.md + cloned GitHub repos + local repos."""
    all_docs: list[dict] = []

    # 1. Local .md files (resume, project summaries)
    logger.info("[ingest] Loading local .md files...")
    local = load_local_docs(data_dir)
    logger.info("[ingest]   -> %d chunks from local data files", len(local))
    all_docs.extend(local)

    # 2. GitHub repos (clone from URL) and local repos
    for entry in REPO_REGISTRY:
        if "url" in entry:
            all_docs.extend(load_repo_from_url(entry["url"], entry.get("branch", "main")))
        elif "local" in entry:
            all_docs.extend(load_repo_from_local(Path(entry["local"])))

    return all_docs


# Main ingestion pipeline

def ingest(data_dir: Path = DATA_DIR, force: bool = False) -> int:
    """Full pipeline: load → chunk → embed → upsert. Returns total chunk count.

    Args:
        data_dir: Root directory containing .md files and repos/.
        force: If True, wipe and re-index even if collection already has data.
               If False (default), skip if collection already has indexed points.

    Returns:
        Number of vectors indexed (0 if skipped).
    """
    logger.info("[ingest] ========================================")
    logger.info("[ingest] Starting ingestion pipeline (force=%s)...", force)
    logger.info("[ingest] ========================================")

    # Skip if already indexed and not forced
    if not force:
        try:
            ready, count = check_collection_ready()
            if ready and count > 0:
                logger.info(
                    "[ingest] Collection '%s' already has %d points. "
                    "Skipping re-ingestion. Use --force to re-index.",
                    VECTORDB_COLLECTION,
                    count,
                )
                return count
        except Exception:
            logger.info("[ingest] Could not verify collection state — proceeding with ingestion.")

    docs = load_all_documents(data_dir)
    if not docs:
        logger.error(
            "[ingest] No documents found. "
            "Add .md files to data/ or configure REPO_REGISTRY with valid repo URLs."
        )
        return 0

    logger.info("[ingest] Total chunks across all sources: %d", len(docs))

    # Embed
    texts = [d["text"] for d in docs]
    logger.info("[ingest] Generating dense embeddings via fastembed in batches...")
    dense_embeddings = []
    batch_size = 1000
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        dense_embeddings.extend(embed_texts(batch))
        logger.info("[ingest]   -> Dense embedded %d/%d chunks", min(i+batch_size, len(texts)), len(texts))
    
    logger.info("[ingest] Generating sparse embeddings via fastembed in batches...")
    sparse_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        sparse_embeddings.extend(embed_texts_sparse(batch))
        logger.info("[ingest]   -> Sparse embedded %d/%d chunks", min(i+batch_size, len(texts)), len(texts))
    
    dim = len(dense_embeddings[0])
    logger.info("[ingest] Dense embedding dimension: %d", dim)

    # Recreate Qdrant collection (wipe + create fresh)
    logger.info("[ingest] Recreating collection '%s'...", VECTORDB_COLLECTION)
    recreate_collection(dim)

    # Upsert in batches of 100 (handled inside upsert_points)
    points = [
        PointStruct(
            id=i,
            vector={
                "dense": dense_embeddings[i],
                "sparse": sparse_embeddings[i]
            },
            payload={
                "text": docs[i]["text"],
                "source": docs[i]["source"],
                "chunk_index": docs[i]["chunk_index"],
                "doc_type": docs[i].get("doc_type", "document"),
                "repo_name": docs[i].get("repo_name", ""),
            },
        )
        for i in range(len(docs))
    ]
    upsert_points(points)
    logger.info("[ingest] ✅ Indexed %d vectors into '%s'.", len(points), VECTORDB_COLLECTION)
    logger.info("[ingest] Done.")
    return len(points)


if __name__ == "__main__":
    # This block only runs when executed directly as a script.
    # The ingest() function is NOT called automatically on API import.
    import sys
    force_flag = "--force" in sys.argv
    ingest(force=force_flag)
