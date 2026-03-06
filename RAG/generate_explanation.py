import os
import pickle
import numpy as np
import pandas as pd
from typing import Optional


# ─────────────────────────────────────────────
# 1.  GenAI backend  (Google Gemini via SDK)
# ─────────────────────────────────────────────
try:
    import google.generativeai as genai
    _BACKEND = "gemini"
except ImportError:
    _BACKEND = None

try:
    import openai as _openai
    _OPENAI_AVAILABLE = True
except ImportError:
    _OPENAI_AVAILABLE = False


# ─────────────────────────────────────────────
# 2.  Build the prompt
# ─────────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert solar plant engineer and AI assistant.

You will receive:
1. Inverter telemetry (a snapshot of real-time sensor readings)
2. A predicted failure risk score (0.0 to 1.0)
3. The top SHAP features – the most influential factors driving the prediction

Your task is to write a concise, data-grounded explanation for a maintenance operator that:
  A. Explains why the inverter is showing elevated failure risk based solely on the provided data
  B. Identifies likely root causes from the telemetry values and SHAP features
  C. Recommends specific, prioritised maintenance actions

Rules:
- Base your explanation ONLY on the provided telemetry and prediction outputs.
- Do NOT invent sensor values not present in the input.
- Keep the tone professional and actionable.
- Format your response clearly with three sections: Risk Assessment, Root Causes, Recommended Actions."""


def build_user_prompt(
    telemetry: dict,
    risk_score: float,
    shap_features: list[dict]
) -> str:
    """Build the user-facing portion of the prompt."""

    telemetry_lines = "\n".join(
        f"  - {k.replace('_', ' ').title()}: {v}"
        for k, v in telemetry.items()
    )

    shap_lines = "\n".join(
        f"  {i+1}. {f['direction']} {f['name']} (impact score: {f['impact']:.4f})"
        for i, f in enumerate(shap_features)
    )

    risk_level = (
        "CRITICAL" if risk_score >= 0.8
        else "HIGH" if risk_score >= 0.6
        else "MODERATE" if risk_score >= 0.4
        else "LOW"
    )

    prompt = f"""--- INVERTER TELEMETRY ---
{telemetry_lines}

--- PREDICTED FAILURE RISK ---
Score: {risk_score:.2%}  ({risk_level})

--- TOP SHAP CONTRIBUTING FEATURES ---
{shap_lines}

Please generate the operator explanation now."""
    return prompt


# ─────────────────────────────────────────────
# 3.  LLM call wrappers
# ─────────────────────────────────────────────
def _call_gemini(system_prompt: str, user_prompt: str, model: str = "gemini-2.0-flash") -> str:
    api_key = os.getenv("GOOGLE_API_KEY", "")
    if not api_key:
        raise EnvironmentError(
            "GOOGLE_API_KEY environment variable is not set. "
            "Please export it before running this script."
        )
    genai.configure(api_key=api_key)
    client = genai.GenerativeModel(
        model_name=model,
        system_instruction=system_prompt,
    )
    response = client.generate_content(user_prompt)
    return response.text


def _call_openai(system_prompt: str, user_prompt: str, model: str = "gpt-4o-mini") -> str:
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise EnvironmentError(
            "OPENAI_API_KEY environment variable is not set. "
            "Please export it before running this script."
        )
    client = _openai.OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        temperature=0.3,
    )
    return response.choices[0].message.content


def _fallback_template(
    telemetry: dict,
    risk_score: float,
    shap_features: list[dict]
) -> str:
    """
    Deterministic template fallback – used when no LLM API key is present.
    Returns a factual, structured summary built purely from the inputs.
    """
    risk_level = (
        "CRITICAL" if risk_score >= 0.8
        else "HIGH" if risk_score >= 0.6
        else "MODERATE" if risk_score >= 0.4
        else "LOW"
    )
    top3 = shap_features[:3]

    causes = []
    actions = []
    for f in top3:
        name = f["name"].lower()
        direction = f["direction"].lower()
        if "temperature" in name:
            causes.append(
                f"Inverter temperature is {direction} ({telemetry.get('temperature', 'N/A')} °C), "
                f"indicating potential thermal management problems."
            )
            actions.append("Inspect cooling fans, heat-sinks, and ventilation around the inverter cabinet.")
        elif "efficiency" in name:
            causes.append(
                f"Efficiency is {direction} ({telemetry.get('efficiency', 'N/A')}), "
                f"suggesting internal losses or degraded components."
            )
            actions.append("Run a comprehensive efficiency diagnostic and check MPPT tracking performance.")
        elif "alarm" in name:
            causes.append(
                f"Alarm count is {direction} ({telemetry.get('alarm_count', 'N/A')}), "
                f"flagging repeated fault events."
            )
            actions.append("Review alarm log history; investigate recurring fault codes for root-cause patterns.")
        elif "voltage" in name or "dc" in name:
            causes.append(
                f"DC voltage is {direction} ({telemetry.get('dc_voltage', 'N/A')} V), "
                f"which may indicate string or connection issues."
            )
            actions.append("Measure individual string voltages and inspect DC cable connections for degradation.")
        elif "power" in name or "ac" in name:
            causes.append(
                f"AC power output is {direction} ({telemetry.get('ac_power', 'N/A')} W), "
                f"deviating from expected generation levels."
            )
            actions.append("Check grid connection, AC breakers, and internal power stage components.")

    cause_block  = "\n  ".join(f"- {c}" for c in causes) if causes else "  - No specific cause identified."
    action_block = "\n  ".join(f"- {a}" for a in actions) if actions else "  - Conduct a full inspection."

    return (
        f"=== Inverter Failure Risk Explanation ===\n\n"
        f"RISK ASSESSMENT\n"
        f"The inverter currently has a {risk_level} failure risk with a predicted score of "
        f"{risk_score:.2%}. This assessment is based on analysis of real-time telemetry and "
        f"historical failure patterns.\n\n"
        f"ROOT CAUSES\n  {cause_block}\n\n"
        f"RECOMMENDED ACTIONS\n  {action_block}\n\n"
        f"Note: This explanation was generated analytically using SHAP feature importances "
        f"because no LLM API key was provided. Set GOOGLE_API_KEY or OPENAI_API_KEY to "
        f"obtain a richer AI-generated narrative."
    )


# ─────────────────────────────────────────────
# 4.  Main public function
# ─────────────────────────────────────────────
def generate_explanation(
    telemetry: dict,
    risk_score: float,
    shap_features: list[dict],
    llm_provider: str = "gemini",   # "gemini" | "openai" | "none"
    llm_model: Optional[str] = None,
) -> str:
    """
    Generate a natural language operator summary from inverter telemetry,
    ML risk score, and SHAP feature attributions.

    Args:
        telemetry     : dict  – sensor reading snapshot, e.g.
                                {"temperature": 72.1, "dc_voltage": 380, ...}
        risk_score    : float – predicted failure probability (0–1)
        shap_features : list  – ranked dicts with keys:
                                {"name": str, "direction": "High"|"Low", "impact": float}
        llm_provider  : str   – "gemini", "openai", or "none" (template fallback)
        llm_model     : str|None – override the default model name for the provider
    Returns:
        str – the generated explanation text
    """
    user_prompt = build_user_prompt(telemetry, risk_score, shap_features)

    if llm_provider == "gemini" and _BACKEND == "gemini":
        try:
            return _call_gemini(SYSTEM_PROMPT, user_prompt, model=llm_model or "gemini-2.0-flash")
        except EnvironmentError:
            pass   # fall through to fallback

    if llm_provider == "openai" and _OPENAI_AVAILABLE:
        try:
            return _call_openai(SYSTEM_PROMPT, user_prompt, model=llm_model or "gpt-4o-mini")
        except EnvironmentError:
            pass   # fall through to fallback

    # Deterministic template fallback (no API key needed)
    return _fallback_template(telemetry, risk_score, shap_features)


# ─────────────────────────────────────────────
# 5.  CLI demo entry-point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    # ── Example telemetry snapshot ──
    sample_telemetry = {
        "temperature":  82.4,     # °C  –  high
        "dc_voltage":   271.6,    # V   –  below nominal
        "ac_power":     0.0,      # W   –  no output
        "efficiency":   0.12,     # fraction – very low
        "alarm_count":  3         # repeated faults
    }

    # ── Predicted risk from trained XGBoost model ──
    sample_risk_score = 0.87   # 87% probability of failure within 7-10 days

    # ── Top SHAP contributing features ──
    # (In production these come from explain_model.py / shap_values)
    sample_shap_features = [
        {"name": "efficiency",   "direction": "Low",  "impact": 0.3821},
        {"name": "temperature",  "direction": "High", "impact": 0.2934},
        {"name": "alarm_count",  "direction": "High", "impact": 0.1873},
        {"name": "dc_voltage",   "direction": "Low",  "impact": 0.0712},
        {"name": "ac_power",     "direction": "Low",  "impact": 0.0601},
    ]

    print("Generating operator explanation...\n")
    explanation = generate_explanation(
        telemetry=sample_telemetry,
        risk_score=sample_risk_score,
        shap_features=sample_shap_features,
        llm_provider="gemini",   # switch to "openai" or "none" as needed
    )
    print(explanation)
