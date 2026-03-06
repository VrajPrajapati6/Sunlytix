"""
Sunlytix FastAPI Backend
Serves the RandomForestClassifier model for inverter failure prediction.
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

# ── Register FeatureGenerator so the pickle can deserialise ────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
from models.feature_generator import FeatureGenerator           # noqa: E402
sys.modules["__main__"].FeatureGenerator = FeatureGenerator     # needed by joblib

# ── Load model artefacts ───────────────────────────────────────────────────────
MODEL_PATH   = os.path.join(BASE_DIR, "models", "model.pkl")
SCALER_PATH  = os.path.join(BASE_DIR, "models", "scaler.pkl")
COLUMNS_PATH = os.path.join(BASE_DIR, "models", "feature_columns.pkl")
FG_PATH      = os.path.join(BASE_DIR, "models", "feature_generator.pkl")

MODEL           = joblib.load(MODEL_PATH)
SCALER          = joblib.load(SCALER_PATH)
FEATURE_COLUMNS = joblib.load(COLUMNS_PATH)   # list of 41 feature names
FEATURE_GEN     = joblib.load(FG_PATH)        # FeatureGenerator transformer

app = FastAPI(title="Sunlytix Prediction API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas ────────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    inverter_id: str

    # Raw measurements
    inverter_power:           float = 0.0
    pv1_power:                float = 0.0
    energy_total:             float = 0.0
    power_factor:             float = 1.0
    inverters_limit_percent:  float = 100.0
    inverters_alarm_code:     float = 0.0
    grid_frequency:           float = 50.0
    meters_meter_kwh_import:  float = 0.0
    pv1_voltage:              float = 0.0
    ambient_temperature:      float = 25.0
    inverters_kwh_midnight:   float = 0.0
    grid_power:               float = 0.0
    pv2_power:                float = 0.0
    inverter_temp:            float = 25.0
    meters_meter_kwh_total:   float = 0.0
    pv2_voltage:              float = 0.0
    pv2_current:              float = 0.0
    inverters_op_state:       float = 1.0
    energy_today:             float = 0.0
    pv1_current:              float = 0.0
    pv3_current:              float = 0.0
    smu_total_current:        float = 0.0
    smu_mean_current:         float = 0.0
    smu_std_current:          float = 0.0
    total_dc_power:           float = 0.0
    efficiency:               float = 0.0
    temp_difference:          float = 0.0
    hour_of_day:              float = 12.0
    day_of_week:              float = 2.0
    rolling_mean_power_24h:   float = 0.0
    rolling_std_power_24h:    float = 0.0

    # Engineered features (can be derived by the caller or pre-computed)
    voltage_current_ratio:    float = 0.0
    pv1_power_calc:           float = 0.0
    pv2_power_calc:           float = 0.0
    power_efficiency:         float = 0.0
    grid_power_ratio:         float = 0.0
    temp_diff_calc:           float = 0.0
    temp_voltage_interaction: float = 0.0
    pv1_current_sq:           float = 0.0
    pv1_voltage_sq:           float = 0.0
    freq_deviation:           float = 0.0


class PredictResponse(BaseModel):
    inverter_id: str
    risk_score: float
    prediction: int          # 0 = no failure, 1 = failure
    confidence: float
    prediction_window: str
    status: str              # healthy / warning / critical


# ── Helpers ────────────────────────────────────────────────────────────────────
def risk_to_status(score: float) -> str:
    if score < 0.35:
        return "healthy"
    elif score < 0.65:
        return "warning"
    return "critical"


def build_feature_df(req: PredictRequest) -> pd.DataFrame:
    """Convert request to DataFrame, run FeatureGenerator, return ordered df."""
    # Build raw row from request fields
    raw = {col: getattr(req, col, 0.0) for col in FEATURE_COLUMNS}
    df_raw = pd.DataFrame([raw])
    # Run the actual FeatureGenerator transformer (same pipeline used at training)
    df_full = FEATURE_GEN.transform(df_raw)
    return df_full[FEATURE_COLUMNS]


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": type(MODEL).__name__,
        "features": len(FEATURE_COLUMNS),
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    # Build feature df using the loaded FeatureGenerator transformer
    df = build_feature_df(req)

    # Scale
    X_scaled = SCALER.transform(df)

    # Predict
    pred_class  = int(MODEL.predict(X_scaled)[0])
    pred_proba  = MODEL.predict_proba(X_scaled)[0]  # [p_no_fail, p_fail]
    risk_score  = float(pred_proba[1])
    confidence  = float(max(pred_proba))

    return PredictResponse(
        inverter_id       = req.inverter_id,
        risk_score        = round(risk_score, 4),
        prediction        = pred_class,
        confidence        = round(confidence, 4),
        prediction_window = "7 Days",
        status            = risk_to_status(risk_score),
    )
