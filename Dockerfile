# ─── Stage 1: Python Backend ───
FROM python:3.11-slim AS backend

WORKDIR /app/backend

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy model-rag artifacts (model, FAISS index, chunks, etc.)
COPY model-rag/ /app/model-rag/

# Copy .env for API keys
COPY .env /app/.env

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]


# ─── Stage 2: Next.js Frontend ───
FROM node:20-slim AS frontend

WORKDIR /app

# Install Node dependencies
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Copy all frontend code
COPY . .

# Build Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
