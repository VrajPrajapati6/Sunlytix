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
  try {
    console.log('Calling chat API with question:', question);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question })
    });

    console.log('Chat API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Chat API error response:', errorData);
      throw new Error(`Chat API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('Chat API response data:', data);

    if (data.error) {
      console.error('Chat API returned error:', data.error);
      throw new Error(data.error);
    }

    if (data.answer) {
      console.log('Chat answer:', data.answer);
      return data.answer;
    } else {
      console.error('Unexpected response format:', data);
      throw new Error('Invalid response format from chat API');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error calling chat API:', errorMessage);
    return `Error: ${errorMessage}`;
  }
}
