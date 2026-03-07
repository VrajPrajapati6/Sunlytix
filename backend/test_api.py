"""
Sunlytix API — Unit Tests
==========================
Tests for the FastAPI backend endpoints.

Run: cd backend && pytest test_api.py -v
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import numpy as np

# We'll import the app and mock the heavy ML/RAG components
from main import app, _feature_columns, categorize_risk


client = TestClient(app)


# ─── Sample telemetry matching the 24 feature columns ───
SAMPLE_TELEMETRY = {
    "inverter_power": 0.0,
    "pv1_power": 0.0,
    "energy_total": 669034.0,
    "power_factor": 0.025,
    "inverters_alarm_code": 100.0,
    "grid_frequency": 50.007,
    "pv1_voltage": 0.0,
    "ambient_temperature": 0,
    "grid_power": 0.0,
    "pv2_power": 0.0,
    "inverter_temp": 42.95,
    "pv2_voltage": 0.0,
    "pv2_current": 0.0,
    "inverters_op_state": 0.0,
    "energy_today": 0.0,
    "pv1_current": 0.0,
    "smu_std_current": 0.0,
    "temp_difference": 42.95,
    "hour_of_day": 4,
    "day_of_week": 3,
    "rolling_mean_power_24h": 10.8125,
    "rolling_std_power_24h": 15.599,
    "plant_id_plant_1": True,
    "plant_id_plant_2": False,
    "plant_id_plant_3": False,
}


# ─── Test 1: Health endpoint ───
def test_health_endpoint():
    """GET /health should return 200 with expected keys."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "ok"
    assert "model_loaded" in data
    assert "rag_loaded" in data
    assert "features_count" in data


# ─── Test 2: Predict with valid input ───
def test_predict_valid_input():
    """POST /predict with valid telemetry should return risk score in [0, 1]."""
    response = client.post("/predict", json=SAMPLE_TELEMETRY)
    
    # Model may not be loaded in test env, accept both 200 and 503
    if response.status_code == 503:
        assert "not loaded" in response.json()["detail"].lower()
        return
    
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert data["prediction"] in [0, 1]
    assert "risk_score" in data
    assert 0.0 <= data["risk_score"] <= 1.0
    assert "risk_category" in data
    assert data["risk_category"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert "feature_importance" in data
    assert len(data["feature_importance"]) <= 5
    assert "explanation" in data
    assert len(data["explanation"]) > 0


# ─── Test 3: Predict with invalid/missing input ───
def test_predict_invalid_input():
    """POST /predict with missing fields should return 422."""
    # Send empty body
    response = client.post("/predict", json={})
    assert response.status_code == 422

    # Send partial data (missing required fields)
    response = client.post("/predict", json={"inverter_power": 100.0})
    assert response.status_code == 422


# ─── Test 4: Ask endpoint (RAG) ───
def test_ask_endpoint():
    """POST /ask with a question should return an answer."""
    response = client.post("/ask", json={"question": "What does alarm code 100 mean?"})

    # RAG may not be loaded in test env
    if response.status_code == 503:
        assert "not loaded" in response.json()["detail"].lower()
        return

    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert isinstance(data["answer"], str)
    assert len(data["answer"]) > 0
    assert "sources" in data
    assert isinstance(data["sources"], list)


# ─── Test 5: Ask with empty question ───
def test_ask_empty_question():
    """POST /ask with empty question should return 422."""
    response = client.post("/ask", json={"question": ""})
    assert response.status_code == 422

    response = client.post("/ask", json={})
    assert response.status_code == 422


# ─── Test 6: Risk categorization logic ───
def test_risk_categorization():
    """Risk categories should map correctly to probability ranges."""
    assert categorize_risk(0.0) == "LOW"
    assert categorize_risk(0.15) == "LOW"
    assert categorize_risk(0.29) == "LOW"
    assert categorize_risk(0.3) == "MEDIUM"
    assert categorize_risk(0.45) == "MEDIUM"
    assert categorize_risk(0.5) == "HIGH"
    assert categorize_risk(0.65) == "HIGH"
    assert categorize_risk(0.7) == "CRITICAL"
    assert categorize_risk(0.95) == "CRITICAL"
    assert categorize_risk(1.0) == "CRITICAL"


# ─── Test 7: Explain endpoint ───
def test_explain_endpoint():
    """POST /explain should return explanation for a specific inverter."""
    payload = {
        "inverter_id": "INV-BB",
        "telemetry": SAMPLE_TELEMETRY,
    }
    response = client.post("/explain", json=payload)

    if response.status_code == 503:
        assert "not loaded" in response.json()["detail"].lower()
        return

    assert response.status_code == 200
    data = response.json()
    assert data["inverter_id"] == "INV-BB"
    assert "risk_score" in data
    assert "explanation" in data
