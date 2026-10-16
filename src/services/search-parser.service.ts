/**
 * Search Parser Service utilizing Strategy Pattern and Dependency Inversion.
 * High-level search consumers depend on the ISearchParser abstraction.
 * Follows Liskov Substitution Principle: FastApiSearchParser and LocalSearchParser
 * are completely interchangeable.
 */

import { parseSearchQueryLocal } from "@/lib/search-parser";
import { ParsedSearchFilters } from "@/lib/types";

export interface ParsedSearchResponse {
  success: boolean;
  filters: ParsedSearchFilters;
  explanation: string;
  source: "ai-service" | "local-fallback" | "direct";
}

/**
 * Common Strategy Contract for all search parsers
 */
export interface ISearchParser {
  parse(query: string, referenceDate: Date): Promise<ParsedSearchResponse>;
}

/**
 * FastAPI + Groq Cloud LLaMA 3.3 Strategy
 */
export class FastApiSearchParser implements ISearchParser {
  private serviceUrl: string;
  private timeoutMs: number;

  constructor(serviceUrl?: string, timeoutMs = 1500) {
    this.serviceUrl =
      serviceUrl || process.env.FASTAPI_SERVICE_URL || "http://127.0.0.1:8000";
    this.timeoutMs = timeoutMs;
  }

  async parse(query: string, referenceDate: Date): Promise<ParsedSearchResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.serviceUrl}/parse-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          referenceDate: referenceDate.toISOString(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`FastAPI responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        filters: data.filters,
        explanation: data.explanation,
        source: "ai-service",
      };
    } catch (err: any) {
      clearTimeout(timer);
      throw err;
    }
  }
}

/**
 * Local Deterministic Rule-Based Strategy (Resilient Fallback)
 */
export class LocalSearchParser implements ISearchParser {
  async parse(query: string, referenceDate: Date): Promise<ParsedSearchResponse> {
    const result = parseSearchQueryLocal(query, referenceDate);
    return {
      success: true,
      filters: result.filters,
      explanation: result.explanation,
      source: "local-fallback",
    };
  }
}

/**
 * SearchParserService Context: Executes primary strategy with automatic fallback
 */
export class SearchParserService {
  private primaryParser: ISearchParser;
  private fallbackParser: ISearchParser;

  constructor(
    primaryParser: ISearchParser = new FastApiSearchParser(),
    fallbackParser: ISearchParser = new LocalSearchParser()
  ) {
    this.primaryParser = primaryParser;
    this.fallbackParser = fallbackParser;
  }

  async parseQuery(query: string, referenceDate: Date = new Date()): Promise<ParsedSearchResponse> {
    const trimmed = query.trim();
    if (!trimmed) {
      return {
        success: true,
        filters: {},
        explanation: "All appointments",
        source: "direct",
      };
    }

    try {
      return await this.primaryParser.parse(trimmed, referenceDate);
    } catch (err: any) {
      console.warn(
        `[SearchParserService] Primary parser failed (${err.name}: ${err.message}). Falling back to local parser.`
      );
      return await this.fallbackParser.parse(trimmed, referenceDate);
    }
  }
}

export const searchParserService = new SearchParserService();
