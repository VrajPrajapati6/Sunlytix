# Sunlytix — AI-Driven Solar Inverter Failure Prediction & Intelligence Platform

> **Predict. Prevent. Power the Sun.**

Team Members:
- Vraj Prajapati - vrajprajapati6004@gmail.com
- Prince Shah - 2406prince2006@gmail.com
- Trupal Dholariya - dholariyatrupal06@gmail.com
- Niyati Navadiya - 
- Tanish Solanki - solankitanish2007@gmail.com

Sunlytix is an AI-powered platform that predicts solar inverter failures 7–10 days in advance and provides natural language operational guidance to plant operators.

![Architecture](docs/architecture-diagram.png)

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Running with Docker](#running-with-docker)
- [Project Structure](#project-structure)
- [ML Model Details](#ml-model-details)
- [RAG System](#rag-system)
- [Design Decisions](#design-decisions)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## Problem Statement

Solar power plants rely on inverters to convert DC power from solar panels into usable AC power. When an inverter fails or degrades, it causes:

- **Loss of energy generation**
- **Reduced performance ratio (PR)**
- **Lower system uptime**
- **Financial loss**

Most solar plants only detect problems *after* they happen via alarms and dashboards. Sunlytix transforms this from **reactive monitoring** to **proactive intelligence**.

---

## Architecture Overview

```
Solar Plant Telemetry (CSV / Dataset)
        │
        ▼
┌──────────────────────────────────────┐
│       FastAPI Backend (:8000)         │
│                                      │
│  ┌─────────┐  ┌──────────────────┐   │
│  │ ML Model│  │ RAG Pipeline     │   │
│  │ (Random │  │ ┌──────────────┐ │   │
│  │  Forest)│  │ │ FAISS Index  │ │   │
│  │         │  │ │ (35 vectors) │ │   │
│  │ SHAP    │  │ └──────┬───────┘ │   │
│  │ Explain │  │        │         │   │
│  └────┬────┘  │        ▼         │   │
│       │       │ ┌──────────────┐ │   │
│       │       │ │ Groq LLM    │ │   │
│       │       │ │ (llama-3.3) │ │   │
│       │       │ └──────────────┘ │   │
│       │       └──────────────────┘   │
│       │                              │
│  /predict  /explain  /ask  /health   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│     Next.js Frontend (:3000)          │
│                                      │
│  Dashboard  │ Inverters │ Insights   │
│  Assistant  │ Settings  │ Auth       │
│                                      │
│  MongoDB (inverters, telemetry,      │
│           insights collections)      │
└──────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **ML Model** | scikit-learn (RandomForestClassifier), SHAP |
| **RAG** | FAISS, sentence-transformers (all-MiniLM-L6-v2) |
| **LLM** | Groq API (llama-3.3-70b-versatile) |
| **Backend API** | FastAPI (Python 3.11) |
| **Frontend** | Next.js 14 (React 18), TailwindCSS, Recharts |
| **Database** | MongoDB Atlas |
| **Auth** | JWT + Firebase (Google OAuth) |
| **Containerization** | Docker, docker-compose |

---

## Setup Instructions

### Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **MongoDB** (Atlas or local)
- **Groq API key** ([Get one here](https://console.groq.com/keys))

### 1. Clone the repository

```bash
git clone https://github.com/VrajPrajapati6/Sunlytix.git
cd Sunlytix
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Edit .env and add your GROQ_API_KEY and MONGODB_URI
```

### 3. Set up the Python backend

```bash
cd backend
pip install -r requirements.txt
```

### 4. Place model files

Copy the following files into the `model-rag/` directory:

- `model.pkl` — trained RandomForest model (~839MB)
- `feature_columns.pkl` — feature column names
- `faiss_index.bin` — FAISS vector index
- `chunks.pkl` — knowledge base chunks
- `knowledge_base.txt` — generated knowledge documents

> These files are excluded from Git due to size. Contact the team for access.

### 5. Start the backend

```bash
cd backend
python main.py
# Server starts at http://localhost:8000
```

### 6. Set up and start the frontend

```bash
npm install
npm run dev
# Frontend starts at http://localhost:3000
```

---

## API Documentation

### `GET /health`

Health check endpoint.

```json
{
  "status": "ok",
  "model_loaded": true,
  "rag_loaded": true,
  "features_count": 24
}
```

### `POST /predict`

Predict inverter failure risk from telemetry data.

**Request Body:** 24 feature fields (see `TelemetryInput` schema in `backend/main.py`)

**Response:**
```json
{
  "prediction": 1,
  "risk_score": 0.82,
  "risk_category": "CRITICAL",
  "feature_importance": [
    {"feature": "inverter_temp", "importance": 0.3812},
    {"feature": "rolling_std_power_24h", "importance": 0.2614}
  ],
  "explanation": "This inverter shows a critical probability of failure...",
  "prediction_window": "7-10 days"
}
```

### `POST /explain`

Get SHAP explanation + AI narrative for a specific inverter.

**Request Body:**
```json
{
  "inverter_id": "INV-BB",
  "telemetry": { ... 24 features ... }
}
```

### `POST /ask`

RAG-powered Q&A about solar plant operations.

**Request Body:**
```json
{
  "question": "Which inverters in Plant 2 have elevated risk?"
}
```

**Response:**
```json
{
  "answer": "In Plant 2, INV-BB shows elevated risk...",
  "sources": [{"text": "...", "score": 0.612}]
}
```

---

## Running with Docker

```bash
docker-compose up --build
```

This starts:
- **Backend** at `http://localhost:8000`
- **Frontend** at `http://localhost:3000`

---

## Project Structure

```
Sunlytix/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Protected pages
│   │   ├── dashboard/            # Main dashboard
│   │   ├── inverters/            # Inverter list + detail
│   │   ├── insights/             # AI insights
│   │   ├── assistant/            # AI chat Q&A
│   │   └── settings/             # Settings
│   ├── api/                      # API routes
│   │   ├── chat/                 # → FastAPI /ask (RAG)
│   │   ├── explain/[id]/         # → FastAPI /explain
│   │   ├── ask-with-context/     # → FastAPI /ask
│   │   ├── inverters/            # → MongoDB
│   │   └── insights/             # → MongoDB
│   └── auth/                     # Login page
├── backend/                      # Python FastAPI backend
│   ├── main.py                   # FastAPI app (4 endpoints)
│   ├── test_api.py               # Unit tests (7 tests)
│   └── requirements.txt          # Pinned Python deps
├── components/                   # React components
├── lib/                          # Utilities, DB config, mock data
├── services/                     # API service layer
├── model-rag/                    # ML model + RAG (gitignored)
│   ├── model.pkl                 # Trained RandomForest
│   ├── rag_retriever.py          # RAG pipeline
│   ├── predict.py                # Prediction script
│   ├── exp_model.py              # SHAP explainability
│   └── ...                       # Knowledge base, FAISS index
├── Dockerfile                    # Multi-stage Docker build
├── docker-compose.yml            # Service orchestration
└── README.md                     # This file
```

---

## ML Model Details

| Property | Value |
|---|---|
| Algorithm | RandomForestClassifier (100 trees) |
| Features | 24 telemetry + derived features |
| Dataset | 1,047,903 rows, 6 inverters, 3 plants |
| Test Accuracy | 95.88% |
| Train Accuracy | 95.93% |
| Explainability | SHAP TreeExplainer (top 5 features) |

---

## RAG System

| Property | Value |
|---|---|
| Embedding Model | all-MiniLM-L6-v2 (384 dimensions) |
| Vector Store | FAISS IndexFlatIP (cosine similarity) |
| Knowledge Base | 30 documents, 15 sections, 35 chunks |
| LLM | Groq llama-3.3-70b-versatile |
| Retrieval | Top 5 chunks per query |

---

## Design Decisions

1. **RandomForest over XGBoost** — Comparable accuracy (95.88%) with simpler deployment, no gradient boosting library dependency, and native SHAP TreeExplainer support.

2. **FAISS over ChromaDB** — Lightweight, zero external dependencies, fast cosine similarity search suitable for our 35-chunk knowledge base.

3. **Groq over OpenAI** — Faster inference (llama-3.3-70b), lower cost, and sufficient quality for operational summaries. Temperature 0.3 for factual answers.

4. **FastAPI as middleware** — Separates ML concerns from Next.js, enables independent scaling, and provides automatic OpenAPI docs at `/docs`.

5. **RAG-first chat** — Chat endpoint tries FastAPI RAG first (grounded answers), falls back to direct Groq call if backend unavailable. Prevents hallucination by constraining context.

---

## Known Limitations

- `ambient_temperature` is always 0 in the dataset (sensor issue), making `temp_difference` identical to `inverter_temp`
- `hour_of_day` is present in data but not used by the model
- RAG knowledge base is static (generated from training data) — doesn't update with live telemetry
- Model was trained on 6 inverters; generalization to other inverter models untested

---

## Future Improvements

- **Real-time telemetry streaming** via MQTT/Kafka
- **Time-series forecasting** (LSTM/Prophet) for trend prediction
- **Anomaly detection** as complementary signal layer
- **Multi-class output** (no risk / degradation risk / shutdown risk)
- **Walk-forward validation** for time-series aware model evaluation
- **Agentic workflow** — GenAI autonomously retrieves data, runs assessments, drafts maintenance tickets
- **Live RAG updates** — dynamically rebuild knowledge base from new telemetry
