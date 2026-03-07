import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/explain/[id]
 * Calls FastAPI /explain to get SHAP explanation + AI narrative for a specific inverter.
 *
 * Body: { telemetry: { inverter_power, pv1_power, ... } }
 * Returns: { inverter_id, risk_score, risk_category, feature_importance, explanation }
 */

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { telemetry } = await req.json();
    const inverterId = params.id;

    if (!telemetry || typeof telemetry !== "object") {
      return NextResponse.json(
        { error: "Missing 'telemetry' object in request body" },
        { status: 400 }
      );
    }

    const fastapiRes = await fetch(`${FASTAPI_URL}/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inverter_id: inverterId,
        telemetry,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!fastapiRes.ok) {
      const errBody = await fastapiRes.text();
      console.error("FastAPI /explain error:", fastapiRes.status, errBody);
      return NextResponse.json(
        { error: "Failed to get explanation from ML backend" },
        { status: 502 }
      );
    }

    const data = await fastapiRes.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Explain route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
