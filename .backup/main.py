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
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import threading
import uuid
import tempfile
from datetime import datetime

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
# FAST CSV UPLOAD (No RAG allowed here to ensure speed)
# ---------------------------------------------------------------------------

_jobs = {}
_MAC_TO_NAME = {
    "3ED2B22A26F5": "INV-01", "D04A67BDB76A": "INV-02", "AFB900AA1C9F": "INV-03",
    "935E8FB52636": "INV-04", "0A9E2741BA3E": "INV-05", "6EB19D6AA492": "INV-06"
}
_MAC_TO_PLANT = {k: "Main Plant" for k in _MAC_TO_NAME}

def categorize_risk(prob: float) -> str:
    if prob < 0.3: return "LOW"
    elif prob < 0.5: return "MEDIUM"
    else: return "HIGH"

def _safe_float(val, default=0.0):
    try: return round(float(val), 4)
    except: return default

def _safe_int(val, default=0):
    try: return int(float(val))
    except: return default

def _risk_status(prob):
    if prob < 0.3: return "Healthy"
    elif prob < 0.5: return "Medium Risk"
    else: return "High Risk"

def _process_csv_job(job_id: str, csv_path: str):
    """Background thread: parse CSV -> ML -> SHAP -> MongoDB upsert."""
    job = _jobs[job_id]

    try:
        job["status"] = "parsing"
        job["message"] = "Parsing CSV file in chunks..."
        
        inverter_stats = {}
        mac_data = {}
        first_chunk = True
        
        for chunk in pd.read_csv(csv_path, chunksize=50000, low_memory=False):
            if first_chunk:
                if "mac" not in chunk.columns:
                    job["status"] = "error"
                    job["message"] = "CSV must contain a 'mac' column."
                    return
                missing = [c for c in _feature_columns if c not in chunk.columns]
                if missing:
                    job["status"] = "error"
                    job["message"] = f"Missing columns: {missing[:5]}..."
                    return
                first_chunk = False
                
            job["totalRows"] += len(chunk)
            job["message"] = f"Parsed {job['totalRows']:,} rows..."
            
            for mac in chunk["mac"].unique():
                inv_chunk = chunk[chunk["mac"] == mac]
                
                if mac not in inverter_stats:
                    inverter_stats[mac] = {
                        "count": 0, "failure_sum": 0, "power_sum": 0.0, "temp_sum": 0.0,
                        "power_max": 0.0, "temp_max": 0.0
                    }
                
                st = inverter_stats[mac]
                st["count"] += len(inv_chunk)
                if "future_failure" in inv_chunk.columns:
                    st["failure_sum"] += pd.to_numeric(inv_chunk["future_failure"], errors="coerce").fillna(0).sum()
                if "inverter_power" in inv_chunk.columns:
                    pow_col = pd.to_numeric(inv_chunk["inverter_power"], errors="coerce").fillna(0)
                    st["power_sum"] += pow_col.sum()
                    if not pow_col.empty:
                        st["power_max"] = max(st["power_max"], float(pow_col.max()))
                if "inverter_temp" in inv_chunk.columns:
                    temp_col = pd.to_numeric(inv_chunk["inverter_temp"], errors="coerce").fillna(0)
                    st["temp_sum"] += temp_col.sum()
                    if not temp_col.empty:
                        st["temp_max"] = max(st["temp_max"], float(temp_col.max()))
                
                if mac not in mac_data:
                    mac_data[mac] = inv_chunk.tail(24)
                else:
                    mac_data[mac] = pd.concat([mac_data[mac], inv_chunk]).tail(24)
                    
        macs = list(mac_data.keys())
        job["totalInverters"] = len(macs)
        job["message"] = f"Found {len(macs)} inverter(s) in {job['totalRows']:,} rows."

        job["status"] = "processing"
        job["message"] = "Connecting to database..."
        
        # Safe connecting with timeout
        from pymongo import MongoClient
        if not globals().get('MONGODB_URI'):
            raise Exception("MONGODB_URI is not set in environment.")

        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        db = client["sunlytix"]

        db.inverters.delete_many({})
        db.insights.delete_many({})
        db.telemetry.delete_many({})
        job["message"] = "Cleared old data. Running fast ML analysis..."

        results = []
        inverter_docs = []
        insight_docs = []
        telemetry_docs = []

        for idx, mac in enumerate(macs):
            inv_data = mac_data[mac]
            inv_name = _MAC_TO_NAME.get(mac, f"INV-{mac[:6]}")
            plant = _MAC_TO_PLANT.get(mac, "Unknown")
            latest = inv_data.iloc[-1]
            st = inverter_stats[mac]

            job["processedInverters"] = idx
            job["currentInverter"] = inv_name
            job["progress"] = int(((idx) / len(macs)) * 100)
            job["message"] = f"Processing {inv_name} ({idx+1}/{len(macs)})..."

            # Stats
            total_rows = st["count"]
            failure_rate = float((st["failure_sum"] / total_rows) * 100) if total_rows > 0 else 0.0
            avg_power = float(st["power_sum"] / total_rows) if total_rows > 0 else 0.0
            avg_temp = float(st["temp_sum"] / total_rows) if total_rows > 0 else 0.0
            max_power = float(st["power_max"])
            max_temp = float(st["temp_max"])

            # ML prediction
            row_dict = {col: float(latest[col]) for col in _feature_columns}
            X = pd.DataFrame([row_dict])
            prediction = int(_model.predict(X)[0])
            probability = float(_model.predict_proba(X)[:, 1][0])
            risk_category = categorize_risk(probability)
            status = _risk_status(probability)

            # SHAP
            shap_values = _shap_explainer.shap_values(X)
            if isinstance(shap_values, list) and len(shap_values) == 2:
                shap_vals = np.array(shap_values[1]).flatten()
            elif isinstance(shap_values, list):
                shap_vals = np.array(shap_values[0]).flatten()
            else:
                shap_vals = np.array(shap_values).flatten()
            shap_vals = shap_vals[:len(_feature_columns)]

            feature_importance = sorted(
                [{"feature": str(_feature_columns[i]), "importance": round(float(shap_vals[i]), 4)}
                 for i in range(len(_feature_columns))],
                key=lambda x: abs(x["importance"]), reverse=True
            )[:5]

            # Inverter doc
            inv_doc = {
                "userId": "system",
                "id": inv_name,
                "mac": mac,
                "plant": plant,
                "location": plant,
                "status": status,
                "riskScore": round(probability, 4),
                "riskCategory": risk_category,
                "prediction": prediction,
                "featureImportance": feature_importance,
                "rootCause": None, # Will be fetched dynamically via /api/explain
                "suggestedSolution": None,
                "DC_POWER": _safe_float(latest.get("inverter_power", 0)),
                "AC_POWER": _safe_float(latest.get("grid_power", 0)),
                "MODULE_TEMPERATURE": _safe_float(latest.get("inverter_temp", 0)),
                "AMBIENT_TEMPERATURE": _safe_float(latest.get("ambient_temperature", 0)),
                "IRRADIATION": 0,
                "inverter_power": _safe_float(latest.get("inverter_power", 0)),
                "grid_power": _safe_float(latest.get("grid_power", 0)),
                "inverter_temp": _safe_float(latest.get("inverter_temp", 0)),
                "power_factor": _safe_float(latest.get("power_factor", 0)),
                "grid_frequency": _safe_float(latest.get("grid_frequency", 0)),
                "energy_today": _safe_float(latest.get("energy_today", 0)),
                "energy_total": _safe_float(latest.get("energy_total", 0)),
                "inverters_alarm_code": _safe_int(latest.get("inverters_alarm_code", 0)),
                "inverters_op_state": _safe_int(latest.get("inverters_op_state", 0)),
                "runtimeHours": total_rows,
                "stats": {
                    "totalRecords": total_rows,
                    "failureRate": round(failure_rate, 1),
                    "avgPower": round(avg_power, 1),
                    "avgTemp": round(avg_temp, 1),
                    "maxPower": round(max_power, 1),
                    "maxTemp": round(max_temp, 1),
                },
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            }
            inverter_docs.append(inv_doc)

            # Telemetry
            for _, row in inv_data.iterrows():
                telemetry_docs.append({
                    "userId": "system",
                    "inverterId": inv_name,
                    "mac": mac,
                    "timestamp": str(row.get("datetime", datetime.utcnow().isoformat())),
                    "MODULE_TEMPERATURE": _safe_float(row.get("inverter_temp", 0)),
                    "AC_POWER": _safe_float(row.get("grid_power", 0)),
                    "DC_POWER": _safe_float(row.get("inverter_power", 0)),
                    "IRRADIATION": 0,
                    "AMBIENT_TEMPERATURE": _safe_float(row.get("ambient_temperature", 0)),
                })

            # Fast Insight Document (no slow Groq call wait)
            fast_explanation = f"{inv_name} is currently showing a {risk_category} risk profile based on SHAP telemetry analysis. Features like {feature_importance[0]['feature']} and {feature_importance[1]['feature']} are the top contributors."

            insight_docs.append({
                "userId": "system",
                "inverterId": inv_name,
                "type": "WARNING" if probability >= 0.3 else "INFO",
                "message": fast_explanation,
                "createdAt": datetime.utcnow(),
                "read": False
            })

            results.append({
                "inverter": inv_name,
                "plant": plant,
                "riskScore": float(probability),
                "riskCategory": risk_category,
                "status": status,
                "rows": total_rows
            })

        job["status"] = "saving"
        job["message"] = "Saving processed data to database..."
        
        if inverter_docs: db.inverters.insert_many(inverter_docs)
        if telemetry_docs: db.telemetry.insert_many(telemetry_docs)
        if insight_docs: db.insights.insert_many(insight_docs)

        job["status"] = "done"
        job["progress"] = 100
        job["message"] = f"Successfully processed {len(macs)} inverters."
        job["results"] = results

    except Exception as e:
        job["status"] = "error"
        job["message"] = f"Processing error: {str(e)}"
        import traceback
        traceback.print_exc()
    finally:
        if os.path.exists(csv_path):
            try: os.remove(csv_path)
            except: pass


@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if _model is None or _feature_columns is None:
        raise HTTPException(status_code=503, detail="ML model not loaded.")
    if not globals().get('MONGODB_URI'):
        raise HTTPException(status_code=503, detail="MONGODB_URI not configured.")

    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    job_id = str(uuid.uuid4())[:8]
    temp_path = os.path.join(tempfile.gettempdir(), f"sunlytix_{job_id}.csv")

    total_bytes = 0
    with open(temp_path, "wb") as f:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk: break
            f.write(chunk)
            total_bytes += len(chunk)

    _jobs[job_id] = {
        "status": "queued", "progress": 0, "message": "Upload complete. Starting processing...",
        "totalRows": 0, "totalInverters": 0, "processedInverters": 0, "currentInverter": "",
        "results": [], "fileSize": total_bytes, "fileName": file.filename
    }

    thread = threading.Thread(target=_process_csv_job, args=(job_id, temp_path))
    thread.start()

    return {"message": "Upload successful", "jobId": job_id, "fileSize": total_bytes}


@app.get("/upload-status/{job_id}")
async def upload_status(job_id: str):
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found.")
    return _jobs[job_id]


# ---------------------------------------------------------------------------
# RUN
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

