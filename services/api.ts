/**
 * API service layer for Sunlytix.
 * All functions call the real Next.js API routes, which read from MongoDB.
 *
 * MongoDB collections (db: sunlytix):
 *   inverters   — inverter documents
 *   telemetry   — time-series telemetry per inverter (field: inverterId)
 *   insights    — AI-generated insight documents
 *   predictions — ML model output per inverter (written by model teammate)
 *                 Schema: { inverterId, riskScore, predictionWindow, confidence, predictedAt }
 */

import type {
  Inverter,
  Insight,
  TelemetryPoint,
} from "@/lib/mockData";

/** Fetch all inverters */
export async function getInverters(): Promise<Inverter[]> {
  const res = await fetch('/api/inverters');
  if (!res.ok) throw new Error('Failed to fetch inverters');
  return res.json();
}

/** Fetch a single inverter by ID */
export async function getInverterById(id: string): Promise<Inverter | null> {
  const res = await fetch(`/api/inverters/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch inverter ${id}`);
  return res.json();
}

/** Fetch telemetry data for a single inverter */
export async function getInverterTelemetry(id: string): Promise<TelemetryPoint[]> {
  const res = await fetch(`/api/inverters/${id}/telemetry`);
  if (!res.ok) throw new Error(`Failed to fetch telemetry for ${id}`);
  return res.json();
}

/** Fetch AI-generated insights */
export async function getInsights(): Promise<Insight[]> {
  const res = await fetch('/api/insights');
  if (!res.ok) throw new Error('Failed to fetch insights');
  return res.json();
}

/** Fetch risk prediction for a specific inverter (written by ML model teammate) */
export async function getPrediction(
  id: string
): Promise<{ riskScore: number; predictionWindow: string; confidence: number }> {
  const res = await fetch(`/api/predict/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch prediction for ${id}`);
  return res.json();
}

/** Send a message to the AI assistant and get a response */
export async function askAssistant(question: string): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Chat API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    if (data.error) throw new Error(data.error);
    if (data.answer) return data.answer;

    throw new Error('Invalid response format from chat API');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error calling chat API:', errorMessage);
    return `Error: ${errorMessage}`;
  }
}
