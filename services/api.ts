/**
 * API service layer for Sunlytix.
 * All functions call the real Next.js API routes, which read from MongoDB.
 *
 * MongoDB collections (db: sunlytix):
 *   inverters   — inverter documents
 *   telemetry   — time-series telemetry per inverter (field: inverterId)
 *   insights    — AI-generated insight documents
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

/** Ask the Sunlytix AI assistant a question (Groq LLM) */
export async function askAssistant(question: string): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error('Failed to get assistant response');
  const data = await res.json();
  return data.answer;
}
