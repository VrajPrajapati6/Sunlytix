import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

/**
 * POST /api/upload-csv
 * Proxies CSV file to FastAPI /upload-csv (Phase 1).
 * Returns jobId for polling.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fastApiForm = new FormData();
    fastApiForm.append("file", file);

    const response = await fetch(`${FASTAPI_URL}/upload-csv`, {
      method: "POST",
      body: fastApiForm,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Upload failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Upload CSV error:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend. Is FastAPI running?" },
      { status: 502 }
    );
  }
}
