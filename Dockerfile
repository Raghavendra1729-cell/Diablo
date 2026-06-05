# Stage 1: Build the React frontend
FROM node:18 AS frontend-builder
WORKDIR /app/chat-ui
COPY chat-ui/package*.json ./
RUN npm install
COPY chat-ui/ .
RUN npm run build

# Stage 2: Build the FastAPI backend and serve frontend
FROM python:3.10-slim
WORKDIR /app

# Install git for repo cloning during ingestion (if needed)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the rest of the backend code
COPY backend/ ./backend/

# Copy the built React app from Stage 1 into chat-ui/dist
COPY --from=frontend-builder /app/chat-ui/dist ./chat-ui/dist

# Expose port 7860 (Hugging Face Spaces default)
EXPOSE 7860
ENV PORT=7860

# Run FastAPI via uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
