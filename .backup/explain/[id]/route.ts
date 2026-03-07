import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/db";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inverterId = params.id;

    // 1. Fetch the inverter from DB to get its Top Features and Risk Score
    const client = await clientPromise;
    const db = client.db("sunlytix");
    const inverter = await db.collection("inverters").findOne({ id: inverterId });

    if (!inverter) {
      return NextResponse.json({ error: "Inverter not found" }, { status: 404 });
    }

    const featureImportance = inverter.featureImportance || [];
    const factors = featureImportance
      .map((f: any) => `${f.feature} (${f.importance > 0 ? '+' : ''}${f.importance})`)
      .join(", ");

    // 2. Construct the RAG prompt
    const ragQuery = `Inverter ${inverterId} has a ${inverter.riskCategory} risk profile (${inverter.riskScore}). 
Top risk factors from ML model are: ${factors}. 
Based on your knowledge base and maintenance manuals, what is the most likely ROOT CAUSE for this specific failure pattern? Also, independently provide a concrete SUGGESTED SOLUTION. 
Format your response exactly like this:
ROOT CAUSE: <your root cause>
SUGGESTED SOLUTION: <your suggested solution>`;

    // 3. Call FastAPI /ask endpoint
    const response = await fetch(`${FASTAPI_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: ragQuery }),
    });

    if (!response.ok) {
      throw new Error("Failed to get RAG response from backend");
    }

    const data = await response.json();
    const ans = data.answer || "";

    // 4. Parse response
    let rootCause = "Analysis unavailable.";
    let suggestedSolution = "Please inspect manually.";

    if (ans.includes("ROOT CAUSE:") && ans.includes("SUGGESTED SOLUTION:")) {
      const parts = ans.split("SUGGESTED SOLUTION:");
      rootCause = parts[0].replace("ROOT CAUSE:", "").trim();
      suggestedSolution = parts[1].trim();
    } else {
      rootCause = ans;
      suggestedSolution = "See Root Cause details.";
    }

    return NextResponse.json({
      rootCause,
      suggestedSolution
    });

  } catch (error: any) {
    console.error("Explain API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
