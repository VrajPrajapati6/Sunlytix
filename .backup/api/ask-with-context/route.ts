import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ask-with-context
 * Calls FastAPI /ask (RAG pipeline) with an optional inverter context.
 *
 * Body: { question: string, context?: string }
 * Returns: { answer: string, sources: [...] }
 */

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const { question, context } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'question' field" },
        { status: 400 }
      );
    }

    // If extra context provided, prepend it to the question
    const fullQuestion = context
      ? `Context: ${context}\n\nQuestion: ${question}`
      : question;

    const fastapiRes = await fetch(`${FASTAPI_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: fullQuestion }),
      signal: AbortSignal.timeout(30000),
    });

    if (!fastapiRes.ok) {
      const errBody = await fastapiRes.text();
      console.error("FastAPI /ask error:", fastapiRes.status, errBody);
      return NextResponse.json(
        { error: "Failed to get answer from RAG backend" },
        { status: 502 }
      );
    }

    const data = await fastapiRes.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Ask-with-context route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
