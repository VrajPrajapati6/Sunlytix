"""
Sunlytix FastAPI Backend
========================
Exposes the ML model and RAG pipeline via REST API.

Endpoints:
  GET  /health     — Service health check
  POST /predict    — Predict inverter failure risk from telemetry
  POST /explain    — Get SHAP explanation + AI narrative for an inverter
  POST /ask        — RAG-powered Q&A about solar plant operations
"""

import os
import sys
import pickle
import json
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
import shap
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# PATHS — model-rag directory relative to this file
# ---------------------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
MODEL_RAG_DIR = PROJECT_ROOT / "model-rag"

# ---------------------------------------------------------------------------
# LOAD .env
# ---------------------------------------------------------------------------
def _load_env():
    """Read GROQ_API_KEY from .env in project root."""
    for candidate in [PROJECT_ROOT / ".env", BACKEND_DIR / ".env"]:
        if candidate.exists():
            with open(candidate) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, val = line.split("=", 1)
                        key = key.strip()
                        val = val.strip().strip("\"'")
                        if key and key not in os.environ:
                            os.environ[key] = val

_load_env()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# ---------------------------------------------------------------------------
# LOAD ML MODEL (once at startup)
# ---------------------------------------------------------------------------
_model = None
_feature_columns = None
_shap_explainer = None

def load_model():
    global _model, _feature_columns, _shap_explainer
    if _model is not None:
        return

    model_path = MODEL_RAG_DIR / "model.pkl"
    features_path = MODEL_RAG_DIR / "feature_columns.pkl"

    if not model_path.exists():
        raise RuntimeError(f"Model file not found: {model_path}")
    if not features_path.exists():
        raise RuntimeError(f"Feature columns file not found: {features_path}")

    with open(model_path, "rb") as f:
        _model = pickle.load(f)
    with open(features_path, "rb") as f:
        _feature_columns = pickle.load(f)

    _shap_explainer = shap.TreeExplainer(_model)
    print(f"[ML] Model loaded: {len(_feature_columns)} features")


# ---------------------------------------------------------------------------
# LOAD RAG (lazy — imports from model-rag/rag_retriever.py)
# ---------------------------------------------------------------------------
_rag_loaded = False

def load_rag():
    global _rag_loaded
    if _rag_loaded:
        return

    # Add model-rag to Python path so we can import rag_retriever
    rag_dir = str(MODEL_RAG_DIR)
    if rag_dir not in sys.path:
        sys.path.insert(0, rag_dir)

    from rag_retriever import _load as rag_load_artifacts
    rag_load_artifacts()
    _rag_loaded = True
    print("[RAG] Loaded FAISS index + chunks + embedding model")


# ---------------------------------------------------------------------------
# GROQ LLM CALLER
# ---------------------------------------------------------------------------
NARRATIVE_SYSTEM_PROMPT = """You are Sunlytix AI, an expert solar energy monitoring assistant.
Given an inverter's risk prediction and the top contributing features from SHAP analysis,
generate a clear, concise operational summary explaining:
1. The risk level and what it means
2. The top factors driving this prediction
3. Specific recommended actions for the operator

Rules:
- Be concise (3-5 sentences)
- Reference specific values and thresholds
- Always suggest actionable next steps
- Do NOT make up data — only use what is provided"""


def call_groq(prompt: str, system_prompt: str = NARRATIVE_SYSTEM_PROMPT) -> str:
    """Call Groq LLM API."""
    if not GROQ_API_KEY:
        return "[ERROR] GROQ_API_KEY not configured."

    payload = json.dumps({
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 1024,
    }).encode("utf-8")

    req = urllib.request.Request(
        GROQ_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "User-Agent": "Sunlytix/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
            return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        return f"[ERROR] Groq API returned {e.code}: {body}"
    except Exception as e:
        return f"[ERROR] Groq API call failed: {e}"


# ---------------------------------------------------------------------------
# RISK CATEGORIZATION
# ---------------------------------------------------------------------------
def categorize_risk(probability: float) -> str:
    if probability < 0.3:
        return "LOW"
    elif probability < 0.5:
        return "MEDIUM"
    elif probability < 0.7:
        return "HIGH"
    else:
        return "CRITICAL"


# ---------------------------------------------------------------------------
# PYDANTIC MODELS
# ---------------------------------------------------------------------------
class TelemetryInput(BaseModel):
    """Input schema for a single inverter telemetry reading (24 features)."""
    inverter_power: float = Field(..., description="Inverter output power (W)")
    pv1_power: float = Field(..., description="PV string 1 power (W)")
    energy_total: float = Field(..., description="Cumulative energy total (kWh)")
    power_factor: float = Field(..., description="Power factor (-1 to 1)")
    inverters_alarm_code: float = Field(..., description="Active alarm code")
    grid_frequency: float = Field(..., description="Grid frequency (Hz)")
    pv1_voltage: float = Field(..., description="PV string 1 voltage (V)")
    ambient_temperature: float = Field(..., description="Ambient temperature (°C)")
    grid_power: float = Field(..., description="Grid power (W)")
    pv2_power: float = Field(..., description="PV string 2 power (W)")
    inverter_temp: float = Field(..., description="Inverter temperature (°C)")
    pv2_voltage: float = Field(..., description="PV string 2 voltage (V)")
    pv2_current: float = Field(..., description="PV string 2 current (A)")
    inverters_op_state: float = Field(..., description="Operational state code")
    energy_today: float = Field(..., description="Energy generated today (kWh)")
    pv1_current: float = Field(..., description="PV string 1 current (A)")
    smu_std_current: float = Field(..., description="SMU standard current deviation")
    temp_difference: float = Field(..., description="Temperature difference (°C)")
    hour_of_day: int = Field(..., ge=0, le=23, description="Hour of day (0-23)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week (0=Mon, 6=Sun)")
    rolling_mean_power_24h: float = Field(..., description="24h rolling mean power")
    rolling_std_power_24h: float = Field(..., description="24h rolling std power")
    plant_id_plant_1: bool = Field(..., description="Is this Plant 1?")
    plant_id_plant_2: bool = Field(..., description="Is this Plant 2?")
    plant_id_plant_3: bool = Field(..., description="Is this Plant 3?")


class PredictionResponse(BaseModel):
    prediction: int
    risk_score: float
    risk_category: str
    feature_importance: list[dict]
    explanation: str
    prediction_window: str = "7-10 days"


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Question about solar plant operations")


class AskResponse(BaseModel):
    answer: str
    sources: list[dict]


class ExplainRequest(BaseModel):
    inverter_id: str = Field(..., description="Inverter identifier (e.g., INV-BB or MAC)")
    telemetry: TelemetryInput


class ExplainResponse(BaseModel):
    inverter_id: str
    prediction: int
    risk_score: float
    risk_category: str
    feature_importance: list[dict]
    explanation: str
    prediction_window: str = "7-10 days"


# ---------------------------------------------------------------------------
# FASTAPI APP
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Sunlytix API",
    description="AI-Driven Solar Inverter Failure Prediction & Intelligence Platform",
    version="1.0.0",
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Load ML model and RAG artifacts on server start."""
    print("[Sunlytix] Starting up...")
    try:
        load_model()
    except Exception as e:
        print(f"[WARNING] Model load failed: {e}")
    try:
        load_rag()
    except Exception as e:
        print(f"[WARNING] RAG load failed: {e}")


# ---------------------------------------------------------------------------
# ENDPOINTS
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    """Service health check."""
    return {
        "status": "ok",
        "model_loaded": _model is not None,
        "rag_loaded": _rag_loaded,
        "features_count": len(_feature_columns) if _feature_columns else 0,
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(telemetry: TelemetryInput):
    """
    Predict inverter failure risk from telemetry data.
    
    Returns a risk score (0.0-1.0), binary prediction, SHAP feature importance
    (top 5 factors), and an AI-generated narrative explanation.
    """
    if _model is None:
        raise HTTPException(status_code=503, detail="ML model not loaded. Check server logs.")

    # Build feature DataFrame
    data_dict = telemetry.model_dump()
    df = pd.DataFrame([data_dict])

    # Ensure column order matches training
    try:
        X = df[_feature_columns]
    except KeyError as e:
        raise HTTPException(status_code=422, detail=f"Missing feature column: {e}")

    # Predict
    prediction = int(_model.predict(X)[0])
    probability = float(_model.predict_proba(X)[:, 1][0])
    risk_category = categorize_risk(probability)

    # SHAP explainability
    shap_values = _shap_explainer.shap_values(X)
    if isinstance(shap_values, list):
        shap_vals = shap_values[1][0]  # class 1 (failure) SHAP values
    else:
        shap_vals = shap_values[0]

    # Top 5 features
    feature_importance = sorted(
        [{"feature": col, "importance": round(float(val), 4)}
         for col, val in zip(_feature_columns, shap_vals)],
        key=lambda x: abs(x["importance"]),
        reverse=True
    )[:5]

    # Generate narrative explanation via LLM
    prompt = f"""Inverter telemetry analysis results:
- Risk Score: {probability:.2f} ({risk_category})
- Prediction: {'FAILURE LIKELY' if prediction == 1 else 'NO FAILURE EXPECTED'}
- Prediction Window: 7-10 days

Top contributing factors (SHAP values):
{chr(10).join(f"  - {f['feature']}: {f['importance']:+.4f}" for f in feature_importance)}

Key telemetry values:
  - Inverter temperature: {telemetry.inverter_temp}°C
  - Power output: {telemetry.inverter_power}W
  - Grid frequency: {telemetry.grid_frequency}Hz
  - Power factor: {telemetry.power_factor}
  - Alarm code: {int(telemetry.inverters_alarm_code)}
  - Op state: {int(telemetry.inverters_op_state)}

Generate a concise operational summary and recommended actions."""

    explanation = call_groq(prompt)

    return PredictionResponse(
        prediction=prediction,
        risk_score=round(probability, 4),
        risk_category=risk_category,
        feature_importance=feature_importance,
        explanation=explanation,
        prediction_window="7-10 days",
    )


@app.post("/explain", response_model=ExplainResponse)
async def explain(request: ExplainRequest):
    """
    Get a detailed SHAP explanation + AI narrative for a specific inverter.
    Same as /predict but includes the inverter_id for contextual explanation.
    """
    if _model is None:
        raise HTTPException(status_code=503, detail="ML model not loaded.")

    # Build feature DataFrame
    data_dict = request.telemetry.model_dump()
    df = pd.DataFrame([data_dict])

    try:
        X = df[_feature_columns]
    except KeyError as e:
        raise HTTPException(status_code=422, detail=f"Missing feature column: {e}")

    # Predict
    prediction = int(_model.predict(X)[0])
    probability = float(_model.predict_proba(X)[:, 1][0])
    risk_category = categorize_risk(probability)

    # SHAP
    shap_values = _shap_explainer.shap_values(X)
    if isinstance(shap_values, list):
        shap_vals = shap_values[1][0]
    else:
        shap_vals = shap_values[0]

    feature_importance = sorted(
        [{"feature": col, "importance": round(float(val), 4)}
         for col, val in zip(_feature_columns, shap_vals)],
        key=lambda x: abs(x["importance"]),
        reverse=True
    )[:5]

    # LLM narrative with inverter context
    prompt = f"""Inverter {request.inverter_id} analysis:
- Risk Score: {probability:.2f} ({risk_category})
- Prediction: {'FAILURE LIKELY' if prediction == 1 else 'NO FAILURE EXPECTED'}

Top risk factors (SHAP):
{chr(10).join(f"  - {f['feature']}: {f['importance']:+.4f}" for f in feature_importance)}

Telemetry snapshot:
  - Temperature: {request.telemetry.inverter_temp}°C
  - Power: {request.telemetry.inverter_power}W
  - Grid freq: {request.telemetry.grid_frequency}Hz
  - Alarm: {int(request.telemetry.inverters_alarm_code)}

Explain why {request.inverter_id} is at risk and what the operator should do."""

    explanation = call_groq(prompt)

    return ExplainResponse(
        inverter_id=request.inverter_id,
        prediction=prediction,
        risk_score=round(probability, 4),
        risk_category=risk_category,
        feature_importance=feature_importance,
        explanation=explanation,
    )


@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    """
    RAG-powered Q&A. Ask any question about solar plant operations.
    Retrieves relevant context from the knowledge base and generates
    a grounded answer using the LLM.
    """
    if not _rag_loaded:
        raise HTTPException(status_code=503, detail="RAG system not loaded.")

    # Import ask_rag from the RAG module
    rag_dir = str(MODEL_RAG_DIR)
    if rag_dir not in sys.path:
        sys.path.insert(0, rag_dir)

    from rag_retriever import ask_rag

    try:
        result = ask_rag(request.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG pipeline error: {str(e)}")

    return AskResponse(
        answer=result["answer"],
        sources=result.get("sources", []),
    )


# ---------------------------------------------------------------------------
# RUN
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
