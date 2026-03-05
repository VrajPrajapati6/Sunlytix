import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      );
    }

    console.log('Calling Groq API with question:', question);

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are Sunlytix AI Assistant, an expert in solar photovoltaic systems and inverter predictive maintenance.

You have access to real-time inverter data including:
- DC_POWER (Watts from solar panels)
- AC_POWER (Watts after inverter conversion)
- MODULE_TEMPERATURE (°C - solar module surface)
- AMBIENT_TEMPERATURE (°C - surrounding air)
- IRRADIATION (W/m² - solar irradiation)
- Risk scores (0-1 scale, higher = more risky)
- Maintenance history and runtime hours

Current plant status (March 5, 2026):
- Total inverters: 48 across 4 blocks (A, B, C, D)
- Healthy: 36 inverters (75%)
- Medium Risk: 8 inverters (17%)
- High Risk: 4 inverters (8%)
- High-risk inverters: INV-21 (thermal stress - MODULE_TEMPERATURE: 72°C, risk score 0.82), INV-44 (power degradation - risk score 0.79)
- Average AC_POWER: ~480W/inverter
- Average MODULE_TEMPERATURE: 47°C
- Average IRRADIATION: 892 W/m²

Specific inverter data insights:
- INV-21: MODULE_TEMPERATURE spike to 72°C (critical), AC_POWER degraded from 510W to 310W over 30 days, DC→AC efficiency dropped to 79%
- INV-44: Power output anomalies, likely soiling on panels or connection issues
- Block A: Mostly healthy (12/12 inverters in good condition)
- Block B: Contains high-risk inverters (INV-21, INV-15)
- Block C: Mixed status with some medium-risk units
- Block D: Contains INV-44, needs urgent attention

Root cause analysis capabilities:
- MODULE_TEMPERATURE rise is the #1 predictor of failure (42% importance)
- AC_POWER drops indicate inverter efficiency issues (28% importance)
- DC→AC conversion losses suggest IGBT thermal stress (16% importance)
- IRRADIATION anomalies may indicate soiling (9% importance)

Provide actionable, technical insights. Use specific data points, risk scores, and maintenance recommendations. Format responses clearly with bullet points or numbered lists. Be precise with technical terms and measurements.`
            },
            {
              role: 'user',
              content: question
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        })
      }
    );

    console.log('Groq response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error response:', errorData);
      return NextResponse.json(
        { error: `Groq API error: ${response.status} - ${errorData}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Groq response:', JSON.stringify(data, null, 2));

    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      const answer = data.choices[0].message.content;
      console.log('Answer:', answer);
      return NextResponse.json({ answer });
    } else if (data.error) {
      console.error('Groq error:', data.error);
      return NextResponse.json(
        { error: `Groq error: ${data.error.message}` },
        { status: 500 }
      );
    } else {
      console.error('Unexpected response format:', data);
      return NextResponse.json(
        { error: 'Invalid response format from Groq API' },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in chat route:', errorMessage);
    return NextResponse.json(
      { error: `Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
