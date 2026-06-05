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

# Install git for repo cloning during ingestion (if needed)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY backend/ ./

# Copy the built React app from Stage 1 into chat-ui/dist
# Placed precisely where backend/main.py expects it
COPY --from=frontend-builder /app/chat-ui/dist /app/chat-ui/dist

# Expose port 7860 (Hugging Face Spaces default)
EXPOSE 7860
ENV PORT=7860
ENV PYTHONPATH=/app/backend

# Run FastAPI via uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
