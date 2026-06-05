# Stage 1: Build the React frontend
FROM node:20 AS frontend-builder
WORKDIR /app/chat-ui
COPY chat-ui/package*.json ./
RUN npm install
COPY chat-ui/ .
RUN npm run build

# Stage 2: Build the FastAPI backend and serve frontend
FROM python:3.11-slim
WORKDIR /app/backend

# Install git and curl for repo cloning during ingestion and health checks
RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download fastembed models into the image so they don't cold-download at runtime
RUN python -c "\
from fastembed import TextEmbedding, SparseTextEmbedding;\n\
TextEmbedding(model_name='BAAI/bge-small-en-v1.5');\n\
SparseTextEmbedding(model_name='Qdrant/bm25');\n\
"

# Copy the rest of the backend code
COPY backend/ ./

# Copy the built React app from Stage 1 into chat-ui/dist
# Placed precisely where backend/main.py expects it
COPY --from=frontend-builder /app/chat-ui/dist /app/chat-ui/dist

# Expose port 7860 (Hugging Face Spaces default)
EXPOSE 7860
ENV PORT=7860
ENV PYTHONPATH=/app/backend

# Run FastAPI via Gunicorn with UvicornWorker for process management
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost:7860/health || exit 1
CMD ["gunicorn", "main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:7860", \
     "--workers", "1", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
