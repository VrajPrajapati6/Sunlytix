"""
rag.py  ─  Sunlytix RAG Engine
==============================
Two capabilities as per the system specification:

  1. Narrative Generation
     generate_narrative(inverter_id) → plain-language explanation
     Driven by live MongoDB prediction + SHAP/feature-importance analysis.

  2. Question Answering
     answer_query(question) → grounded answer
     Structured retriever over MongoDB records → Groq LLM response.

Architecture
------------
  Query / Inverter ID
        ↓
  Retriever  (structured MongoDB filter)
        ↓
  Feature Importance  (SHAP or RandomForest .feature_importances_)
        ↓
  Context Builder
        ↓
  Prompt Constructor
        ↓
  Groq  (llama-3.1-8b-instant)
        ↓
  Grounded Response
"""

import os
import re
import json
import httpx
import numpy as np
import pandas as pd
from typing import Optional
from pymongo import MongoClient

# ── Env ────────────────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
MONGODB_URI  = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://vrajprajapati6004_db_user:vraj123p@cluster0.exwest4.mongodb.net/?appName=Cluster0",
)
DB_NAME  = "sunlytix"
LLM_MODEL = "llama-3.1-8b-instant"

# ── Risk labels ────────────────────────────────────────────────────────────────
def _risk_label(score: float) -> str:
    if score >= 0.80: return "CRITICAL"
    if score >= 0.60: return "HIGH"
    if score >= 0.35: return "MODERATE"
    return "LOW"

def _urgency(score: float) -> str:
    if score >= 0.80: return "Schedule immediate inspection within 24 hours."
    if score >= 0.60: return "Schedule inspection within 3 days."
    if score >= 0.35: return "Monitor closely; schedule inspection within 7 days."
    return "Continue routine monitoring."

# ── MongoDB helpers ────────────────────────────────────────────────────────────
def _get_db():
    client = MongoClient(MONGODB_URI, tls=True, tlsAllowInvalidCertificates=True)
    return client[DB_NAME]

def _fetch_inverter_display(db, inverter_id: str) -> Optional[dict]:
    return db["inverters"].find_one({"id": inverter_id}, {"_id": 0})

def _fetch_all_inverters(db) -> list[dict]:
    return list(db["inverters"].find({}, {"_id": 0}))

def _fetch_prediction(db, inverter_id: str) -> Optional[dict]:
    return db["predictions"].find_one({"inverterId": inverter_id}, {"_id": 0})

def _fetch_all_predictions(db) -> list[dict]:
    return list(db["predictions"].find({}, {"_id": 0}))

def _fetch_features(db, inverter_id: str) -> Optional[dict]:
    return db["inverter_features"].find_one({"inverterId": inverter_id}, {"_id": 0})

# ── Feature importance ─────────────────────────────────────────────────────────
def _top_features(
    feature_doc: dict,
    model,
    scaler,
    feature_columns: list[str],
    feature_gen,
    top_n: int = 5,
) -> list[dict]:
    """
    Compute per-feature SHAP values if shap is installed, otherwise fall back
    to permutation-weighted feature importances from the RandomForest model.

    Returns list of dicts: [{name, value, importance, direction}, ...]
    """
    # Build feature df (same pipeline as /predict)
    row = {col: feature_doc.get(col, 0.0) for col in feature_columns}
    df_raw = pd.DataFrame([row])
    df_full = feature_gen.transform(df_raw)
    df_ord  = df_full[feature_columns]

    X_scaled = scaler.transform(df_ord)

    # Try SHAP first (tree explainer is fast for RandomForest)
    try:
        import shap  # type: ignore
        explainer = shap.TreeExplainer(model)
        shap_vals = explainer.shap_values(X_scaled)
        # shap_values shape: (n_classes, n_samples, n_features) for RF classifiers
        if isinstance(shap_vals, list):
            importances = np.abs(shap_vals[1][0])  # class=1 (failure)
        else:
            importances = np.abs(shap_vals[0])
        method = "shap"
    except Exception:
        # Fallback: use model's built-in feature_importances_
        importances = model.feature_importances_
        method = "importance"

    # Raw feature values (pre-scale)
    raw_vals = df_ord.iloc[0].to_dict()
    mean_vals = scaler.mean_ if hasattr(scaler, "mean_") else np.zeros(len(feature_columns))

    ranked = sorted(
        zip(feature_columns, importances, scaler.transform(df_ord)[0]),
        key=lambda x: x[1],
        reverse=True,
    )[:top_n]

    results = []
    for feat, imp, scaled_val in ranked:
        raw   = raw_vals.get(feat, 0.0)
        mean  = mean_vals[feature_columns.index(feat)] if hasattr(scaler, "mean_") else 0.0
        direction = "↑ Elevated" if raw > mean else "↓ Below normal"
        results.append({
            "name":       feat.replace("_", " ").title(),
            "raw_name":   feat,
            "value":      round(float(raw), 4),
            "importance": round(float(imp), 4),
            "direction":  direction,
            "method":     method,
        })
    return results


# ── Context builders ───────────────────────────────────────────────────────────
def _inverter_context_block(
    inv: dict,
    pred: Optional[dict],
    top_feats: Optional[list[dict]] = None,
) -> str:
    risk_score = pred["riskScore"] if pred else None
    lines = [
        f"Inverter ID  : {inv.get('id', 'unknown')}",
        f"Location     : {inv.get('location', 'unknown')}",
        f"Status       : {inv.get('status', 'unknown')}",
        f"DC Power     : {inv.get('DC_POWER', 'N/A')} W",
        f"AC Power     : {inv.get('AC_POWER', 'N/A')} W",
        f"Temperature  : {inv.get('MODULE_TEMPERATURE', 'N/A')} °C",
        f"Efficiency   : {inv.get('EFFICIENCY', 'N/A')} %",
    ]
    if pred:
        lines += [
            f"Risk Score   : {risk_score:.2%}  ({_risk_label(risk_score)})",
            f"Prediction   : Failure within {pred.get('predictionWindow', '7 Days')}",
            f"Confidence   : {pred.get('confidence', 0):.1%}",
        ]
    if top_feats:
        lines.append("Top Contributing Factors:")
        for f in top_feats:
            lines.append(f"  • {f['direction']} {f['name']} = {f['value']} (impact: {f['importance']:.4f})")
    return "\n".join(lines)


def _fleet_context(db) -> str:
    inverters   = _fetch_all_inverters(db)
    predictions = {p["inverterId"]: p for p in _fetch_all_predictions(db)}

    total    = len(inverters)
    healthy  = sum(1 for i in inverters if i.get("status") == "online")
    warning  = sum(1 for i in inverters if i.get("status") == "warning")
    critical = sum(1 for i in inverters if i.get("status") == "critical")

    lines = [
        f"Fleet: {total} inverters total — {healthy} healthy, {warning} warning, {critical} critical.",
        "",
    ]
    for inv in sorted(inverters, key=lambda x: predictions.get(x["id"], {}).get("riskScore", 0), reverse=True):
        pred = predictions.get(inv["id"])
        risk = f"risk={pred['riskScore']:.2%} ({_risk_label(pred['riskScore'])})" if pred else "no prediction yet"
        lines.append(
            f"  • {inv['id']} [{inv.get('location','?')}] "
            f"status={inv.get('status','?')} temp={inv.get('MODULE_TEMPERATURE','?')}°C "
            f"eff={inv.get('EFFICIENCY','?')}% {risk}"
        )
    return "\n".join(lines)


# ── Retriever ──────────────────────────────────────────────────────────────────
def _retrieve(query: str, db) -> tuple[str, str]:
    """
    Structured retriever. Returns (context_text, retrieval_mode).

    Rules (in priority order):
      1. Specific inverter mentioned → fetch that inverter's full record
      2. High-risk / critical / urgent → fetch all inverters with risk >= 0.60
      3. Worst / most at risk / inspect first → fetch top-1 by risk score
      4. Default → return full fleet summary
    """
    q = query.lower()

    # 1. Specific inverter ID (e.g. "INV-03", "inverter 3", "inv03")
    match = re.search(r"inv[-\s]?(\d+)", q)
    if match:
        inv_id = f"INV-{match.group(1).zfill(2)}"
        inv    = _fetch_inverter_display(db, inv_id)
        if inv:
            pred = _fetch_prediction(db, inv_id)
            ctx  = f"[Retrieved record for {inv_id}]\n" + _inverter_context_block(inv, pred)
            return ctx, f"specific:{inv_id}"
        return f"No data found for {inv_id}.", f"specific:{inv_id}"

    # 2. High-risk / critical queries
    if any(k in q for k in ["high risk", "critical", "at risk", "danger", "urgent", "alert"]):
        preds = [p for p in _fetch_all_predictions(db) if p.get("riskScore", 0) >= 0.60]
        preds.sort(key=lambda p: p["riskScore"], reverse=True)
        if not preds:
            return "No inverters with elevated risk found.", "high_risk"
        blocks = []
        for p in preds:
            inv = _fetch_inverter_display(db, p["inverterId"])
            if inv:
                blocks.append(_inverter_context_block(inv, p))
        return "[High-risk inverters retrieved]\n\n" + "\n\n---\n\n".join(blocks), "high_risk"

    # 3. Priority / worst / first to inspect
    if any(k in q for k in ["worst", "most risk", "inspect first", "priority", "top", "highest"]):
        preds = _fetch_all_predictions(db)
        if preds:
            preds.sort(key=lambda p: p.get("riskScore", 0), reverse=True)
            top   = preds[0]
            inv   = _fetch_inverter_display(db, top["inverterId"])
            if inv:
                ctx = "[Highest risk inverter retrieved]\n" + _inverter_context_block(inv, top)
                return ctx, "highest_risk"

    # 4. Default → full fleet
    return "[Full fleet summary retrieved]\n" + _fleet_context(db), "fleet"


# ── Groq caller ────────────────────────────────────────────────────────────────
def _call_groq(system_prompt: str, user_prompt: str, max_tokens: int = 800) -> str:
    if not GROQ_API_KEY:
        raise EnvironmentError("GROQ_API_KEY not set.")

    resp = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type":  "application/json",
        },
        json={
            "model": LLM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            "temperature": 0.25,
            "max_tokens":  max_tokens,
        },
        timeout=30.0,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


# ── System prompts ─────────────────────────────────────────────────────────────
_NARRATIVE_SYSTEM = """You are an expert solar plant maintenance engineer writing diagnostic reports for plant operators.

You will receive:
  1. Inverter telemetry (real sensor readings)
  2. ML-predicted failure risk score
  3. Top contributing features (from model explainability)

Your task: produce a concise operator report in THREE sections:
  **Risk Assessment** – state the risk level and what it means in operational terms.
  **Root Causes** – explain which features are driving the risk and the likely technical reason.
  **Recommended Actions** – list specific, prioritised maintenance steps.

Rules:
  – Base your report ONLY on the data provided. Do not invent sensor readings.
  – Be specific: reference actual values (e.g. "temperature of 74°C exceeds safe operating range of 65°C").
  – Keep the tone professional and actionable.
  – Do not add caveats about AI limitations."""

_QA_SYSTEM = """You are an expert solar plant operations assistant answering questions for plant operators.

Rules:
  1. Answer ONLY using information present in the CONTEXT section below.
  2. If the context does not contain enough information, say: "Insufficient data to answer this question."
  3. Cite specific values from the context (risk scores, temperatures, efficiency percentages).
  4. Be concise and factual — no filler phrases.
  5. For maintenance questions, include urgency and specific action.
  6. Never fabricate inverter readings or risk scores."""


# ── Public API ─────────────────────────────────────────────────────────────────
def generate_narrative(
    inverter_id: str,
    model,
    scaler,
    feature_columns: list[str],
    feature_gen,
) -> dict:
    """
    Generate a plain-language maintenance narrative for one inverter.

    Returns:
        {
            "inverter_id"   : str,
            "risk_score"    : float,
            "risk_label"    : str,
            "top_features"  : list[dict],
            "narrative"     : str,
            "urgency"       : str,
        }
    """
    db   = _get_db()
    inv  = _fetch_inverter_display(db, inverter_id)
    pred = _fetch_prediction(db, inverter_id)
    feat_doc = _fetch_features(db, inverter_id)

    if not inv:
        raise ValueError(f"Inverter {inverter_id} not found in database.")

    # Feature importance
    top_feats: list[dict] = []
    if feat_doc and model is not None:
        try:
            top_feats = _top_features(feat_doc, model, scaler, feature_columns, feature_gen)
        except Exception as e:
            top_feats = []

    risk_score = pred["riskScore"] if pred else 0.0
    context    = _inverter_context_block(inv, pred, top_feats)

    user_prompt = f"""--- INVERTER DATA ---
{context}

Please generate the operator maintenance report now."""

    try:
        narrative = _call_groq(_NARRATIVE_SYSTEM, user_prompt, max_tokens=700)
    except Exception as e:
        # Deterministic fallback if Groq is unavailable
        narrative = _fallback_narrative(inv, pred, top_feats)

    return {
        "inverter_id":  inverter_id,
        "risk_score":   risk_score,
        "risk_label":   _risk_label(risk_score),
        "urgency":      _urgency(risk_score),
        "top_features": top_feats,
        "narrative":    narrative,
    }


def answer_query(question: str) -> dict:
    """
    Answer an operator's natural-language question using the RAG pipeline.

    Returns:
        {
            "answer"           : str,
            "retrieval_mode"   : str,
            "context_used"     : str,
        }
    """
    db = _get_db()

    # Retrieve grounded context
    context, mode = _retrieve(question, db)

    user_prompt = (
        f"CONTEXT:\n{context}\n\n"
        f"QUESTION: {question}\n\n"
        f"Answer (based only on the context above):"
    )

    try:
        answer = _call_groq(_QA_SYSTEM, user_prompt, max_tokens=600)
    except Exception as e:
        answer = f"Error calling LLM: {e}\n\nRaw context:\n{context}"

    # Anti-hallucination guard: verify referenced inverter IDs are real
    answer = _validate_inverter_refs(answer, db)

    return {
        "answer":         answer,
        "retrieval_mode": mode,
        "context_used":   context,
    }


# ── Guardrail ──────────────────────────────────────────────────────────────────
def _validate_inverter_refs(answer: str, db) -> str:
    """
    Strip any fabricated INV-XX identifiers from the answer.
    If the LLM mentions an inverter ID not in the database, replace with a note.
    """
    known_ids = {i["id"] for i in _fetch_all_inverters(db)}
    mentioned = set(re.findall(r"INV-\d+", answer, re.IGNORECASE))
    bad = mentioned - known_ids
    for bad_id in bad:
        answer = answer.replace(bad_id, f"[unknown inverter {bad_id}]")
    return answer


# ── Deterministic fallback ─────────────────────────────────────────────────────
def _fallback_narrative(inv: dict, pred: Optional[dict], top_feats: list[dict]) -> str:
    risk_score = pred["riskScore"] if pred else 0.0
    label      = _risk_label(risk_score)
    inv_id     = inv.get("id", "unknown")
    temp       = inv.get("MODULE_TEMPERATURE", "N/A")
    eff        = inv.get("EFFICIENCY", "N/A")

    causes = []
    actions = []
    for f in top_feats[:3]:
        n = f["raw_name"]
        v = f["value"]
        if "temp" in n:
            causes.append(f"inverter temperature of {v}°C exceeds normal operating range.")
            actions.append("Inspect cooling system, fans, and heat-sink assembly.")
        elif "efficiency" in n:
            causes.append(f"DC→AC conversion efficiency of {v}% indicates power loss.")
            actions.append("Check IGBT modules and connection points for degradation.")
        elif "power" in n:
            causes.append(f"power output of {v} W is below expected baseline.")
            actions.append("Inspect PV strings and DC cabling for soiling or faults.")
        elif "alarm" in n and v > 0:
            causes.append(f"active alarm code {int(v)} recorded.")
            actions.append("Review alarm log and follow manufacturer fault resolution guide.")

    return (
        f"**Risk Assessment**\n"
        f"Inverter {inv_id} shows a {label} risk of performance degradation within the next 7 days "
        f"(risk score: {risk_score:.2%}).\n\n"
        f"**Root Causes**\n" +
        ("\n".join(f"• {c.capitalize()}" for c in causes) or "• Insufficient telemetry to determine root cause.") +
        f"\n\n**Recommended Actions**\n" +
        ("\n".join(f"{i+1}. {a}" for i, a in enumerate(actions)) or "1. Schedule routine inspection.") +
        f"\n\n{_urgency(risk_score)}"
    )
