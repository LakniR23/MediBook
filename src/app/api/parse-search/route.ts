import { NextRequest, NextResponse } from "next/server";
import { searchParserService } from "@/services/search-parser.service";

/**
 * POST /api/parse-search
 * Single Responsibility: Validates incoming HTTP request and delegates to SearchParserService.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = (body.query || "").trim();
    const referenceDate = body.referenceDate ? new Date(body.referenceDate) : new Date();

    const result = await searchParserService.parseQuery(query, referenceDate);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[POST /api/parse-search error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to parse search query", details: error.message },
      { status: 500 }
    );
  }
}
