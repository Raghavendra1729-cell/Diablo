"""Root-level ingestion shim — run from the backend/ directory:

    python ingest.py           # skip if collection already has indexed data
    python ingest.py --force   # wipe + full re-index (use after adding new docs)
"""
import sys
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)

if __name__ == "__main__":
    from src.ingestion.loader import ingest

    force = "--force" in sys.argv
    total = ingest(force=force)
    if total == 0 and not force:
        print(
            "\n[ingest.py] Hint: If you want to force a full re-index (e.g. after "
            "adding new documents), run:\n  python ingest.py --force\n"
        )
    sys.exit(0 if total >= 0 else 1)
