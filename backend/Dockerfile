FROM python:3.11-slim

# Install git (required if you ever trigger /v1/ingest remotely to clone repos)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Set up a new user named "user" with user ID 1000 (Required by HuggingFace Spaces)
RUN useradd -m -u 1000 user

# Define environment variables for the user and cache paths
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    HF_HOME=/home/user/.cache/huggingface \
    FASTEMBED_CACHE_PATH=/home/user/.cache/fastembed \
    PORT=7860

# Create working directory and cache directories, and assign ownership to the non-root user
RUN mkdir -p /app $HF_HOME $FASTEMBED_CACHE_PATH && \
    chown -R user:user /app $HOME

# Switch to the non-root user
USER user
WORKDIR /app

# Install Python dependencies
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download all 3 fastembed models into the image so they don't cold-download at runtime
RUN python -c "\
from fastembed import TextEmbedding, SparseTextEmbedding, TextCrossEncoder;\n\
TextEmbedding(model_name='BAAI/bge-small-en-v1.5');\n\
SparseTextEmbedding(model_name='Qdrant/bm25');\n\
TextCrossEncoder(model_name='BAAI/bge-reranker-base');\n\
"

# Copy application files
COPY --chown=user:user . .

# HuggingFace Spaces default port
EXPOSE 7860

# Start server on 0.0.0.0:7860 with 4 threads for concurrency
CMD ["gunicorn", "main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:7860", \
     "--workers", "1", \
     "--threads", "4", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
