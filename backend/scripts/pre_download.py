from fastembed import TextEmbedding, SparseTextEmbedding
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pre_download")

def main():
    logger.info("Pre-downloading BAAI/bge-small-en-v1.5 dense model...")
    # Using threads=1 and instantiating it triggers download but limits CPU
    try:
        TextEmbedding(model_name="BAAI/bge-small-en-v1.5", threads=1)
        logger.info("Dense model downloaded successfully.")
    except Exception as e:
        logger.error(f"Failed to download dense model: {e}")
        
    logger.info("Pre-downloading Qdrant/bm25 sparse model...")
    try:
        SparseTextEmbedding(model_name="Qdrant/bm25", threads=1)
        logger.info("Sparse model downloaded successfully.")
    except Exception as e:
        logger.error(f"Failed to download sparse model: {e}")

if __name__ == "__main__":
    main()
