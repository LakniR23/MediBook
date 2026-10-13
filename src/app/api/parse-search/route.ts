import { NextRequest, NextResponse } from "next/server";
import { parseSearchQueryLocal } from "@/lib/search-parser";

const FASTAPI_SERVICE_URL =
  process.env.FASTAPI_SERVICE_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = (body.query || "").trim();
    const referenceDate = body.referenceDate || new Date().toISOString();

    if (!query) {
      return NextResponse.json({
        success: true,
        filters: {},
        explanation: "All appointments",
        source: "direct",
      });
    }

    // Attempt calling FastAPI AI service with a 1500ms abort timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const aiResponse = await fetch(`${FASTAPI_SERVICE_URL}/parse-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, referenceDate }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        return NextResponse.json({
          success: true,
          filters: aiData.filters,
          explanation: aiData.explanation,
          source: "ai-service",
        });
      }
    } catch (err: any) {
      // AI service unreachable or timed out - fall back silently
      console.warn(
        `FastAPI AI service unavailable (${err.name}: ${err.message}). Falling back to local parser.`
      );
    }

    // Graceful Fallback: Local deterministic parser
    const localResult = parseSearchQueryLocal(query, new Date(referenceDate));
    return NextResponse.json({
      success: true,
      filters: localResult.filters,
      explanation: localResult.explanation,
      source: "local-fallback",
    });
  } catch (error: any) {
    console.error("Search parse error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to parse search query" },
      { status: 500 }
    );
  }
}
