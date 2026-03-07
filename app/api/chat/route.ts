import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/chat
 * Proxies questions to the FastAPI /ask endpoint (RAG-grounded answers).
 * Falls back to direct Groq call if FastAPI is unavailable.
 */

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const FALLBACK_SYSTEM_PROMPT = `You are the Sunlytix AI Assistant — an expert solar energy monitoring assistant.
You help operators and engineers understand inverter health, plant performance, and maintenance priorities.
Answer concisely and clearly. Use **bold** for key terms when helpful.
If you don't know something specific, say so honestly rather than making up data.`;

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'question' field" },
        { status: 400 }
      );
    }

    // ─── Try FastAPI RAG endpoint first ───
    try {
      const ragRes = await fetch(`${FASTAPI_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: AbortSignal.timeout(30000),
      });

      if (ragRes.ok) {
        const ragData = await ragRes.json();
        return NextResponse.json({
          answer: ragData.answer,
          sources: ragData.sources || [],
          mode: "rag",
        });
      }
    } catch {
      console.warn("FastAPI unavailable — falling back to direct Groq call");
    }

    // ─── Fallback: Direct Groq call (no RAG context) ───
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured and FastAPI is unavailable" },
        { status: 500 }
      );
    }

    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: FALLBACK_SYSTEM_PROMPT },
          { role: "user", content: question },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error("Groq API error:", groqRes.status, errBody);
      return NextResponse.json(
        { error: "LLM API request failed" },
        { status: 502 }
      );
    }

    const data = await groqRes.json();
    const answer =
      data.choices?.[0]?.message?.content?.trim() ??
      "Sorry, I couldn't generate a response.";

    return NextResponse.json({ answer, sources: [], mode: "direct" });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
