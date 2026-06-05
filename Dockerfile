# Stage 1: Build the React frontend
FROM node:20 AS frontend-builder
WORKDIR /app/chat-ui
COPY chat-ui/package*.json ./
RUN npm install
COPY chat-ui/ .
RUN npm run build

# Stage 2: Build the FastAPI backend and serve frontend
FROM python:3.11-slim

# Install git and curl for repo cloning during ingestion and health checks
RUN apt-get update && apt-get install -y git curl && rm -rf /var/lib/apt/lists/*

# Set up a new user named "user" with user ID 1000 (Required by HuggingFace Spaces)
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PORT=7860 \
    PYTHONPATH=/home/user/app/backend

# Create working directory and assign ownership
RUN mkdir -p /home/user/app/backend && chown -R user:user /home/user/app

WORKDIR /home/user/app/backend

# Switch to user
USER user

# Copy backend requirements and install
COPY --chown=user:user backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download embedding models safely to avoid cold starts
COPY --chown=user:user backend/scripts/pre_download.py /home/user/app/pre_download.py
RUN python /home/user/app/pre_download.py

# Copy the rest of the backend code
COPY --chown=user:user backend/ ./

# Copy the built React app from Stage 1 into chat-ui/dist
COPY --chown=user:user --from=frontend-builder /app/chat-ui/dist /home/user/app/chat-ui/dist

# Expose port 7860
EXPOSE 7860

# Run FastAPI via Gunicorn with UvicornWorker for process management
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost:7860/health || exit 1
CMD ["gunicorn", "main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:7860", \
     "--workers", "1", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
