/**
 * Placeholder API service layer for Sunlytix.
 * These functions currently return mock data.
 * They will be updated to call real backend endpoints when the API is ready.
 *
 * Future endpoints:
 *   GET  /api/inverters
 *   GET  /api/inverters/:id
 *   GET  /api/predict/:id
 *   GET  /api/insights
 *   POST /api/ask
 */

import {
  mockInverters,
  mockInsights,
  getMockTelemetry,
  mockAssistantResponses,
  type Inverter,
  type Insight,
  type TelemetryPoint,
} from "@/lib/mockData";

// Simulate network latency for realistic UX
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/** Fetch all inverters */
export async function getInverters(): Promise<Inverter[]> {
  await delay(400);
  // TODO: return await fetch('/api/inverters').then(r => r.json())
  return mockInverters;
}

/** Fetch a single inverter by ID */
export async function getInverterById(id: string): Promise<Inverter | null> {
  await delay(300);
  // TODO: return await fetch(`/api/inverters/${id}`).then(r => r.json())
  return mockInverters.find((inv) => inv.id === id) ?? null;
}

/** Fetch telemetry data for a single inverter */
export async function getInverterTelemetry(id: string): Promise<TelemetryPoint[]> {
  await delay(350);
  // TODO: return await fetch(`/api/inverters/${id}/telemetry`).then(r => r.json())
  return getMockTelemetry(id);
}

/** Fetch AI-generated insights */
export async function getInsights(): Promise<Insight[]> {
  await delay(450);
  // TODO: return await fetch('/api/insights').then(r => r.json())
  return mockInsights;
}

/** Fetch risk prediction for a specific inverter */
export async function getPrediction(
  id: string
): Promise<{ riskScore: number; predictionWindow: string; confidence: number }> {
  await delay(500);
  // TODO: return await fetch(`/api/predict/${id}`).then(r => r.json())
  // Payload sent to model: { DC_POWER, AC_POWER, MODULE_TEMPERATURE, AMBIENT_TEMPERATURE, IRRADIATION }
  const inv = mockInverters.find((i) => i.id === id);
  return {
    riskScore: inv?.riskScore ?? 0,
    predictionWindow: "7 Days",
    confidence: 0.87,
  };
}

/** Send a message to the AI assistant and get a response */
export async function askAssistant(question: string): Promise<string> {
  await delay(800);
  // TODO: return await fetch('/api/ask', { method:'POST', body: JSON.stringify({question}) }).then(r=>r.json()).then(d=>d.answer)
  const q = question.toLowerCase();
  if (q.includes("highest risk") || q.includes("most at risk")) {
    return mockAssistantResponses["risk"];
  }
  if (q.includes("inv-21") || q.includes("inv21")) {
    return mockAssistantResponses["inv-21"];
  }
  if (q.includes("inspect") || q.includes("first") || q.includes("priority")) {
    return mockAssistantResponses["inspect"];
  }
  if (q.includes("overview") || q.includes("plant") || q.includes("summary") || q.includes("status")) {
    return mockAssistantResponses["overview"];
  }
  if (q.includes("degrading") || q.includes("degrad") || q.includes("why")) {
    return mockAssistantResponses["degrading"];
  }
  return mockAssistantResponses["default"];
}
