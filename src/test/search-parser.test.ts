import { describe, it, expect } from "vitest";
import { parseSearchQueryLocal } from "@/lib/search-parser";
import { formatDateTime, formatDateOnly, formatTimeOnly, toInputDateTime } from "@/lib/date-utils";

describe("Search Query Local Fallback Parser", () => {
  const referenceDate = new Date("2026-10-13T10:00:00Z"); // Tuesday

  it("correctly parses doctor, status, and 'next week' relative date", () => {
    const result = parseSearchQueryLocal(
      "cancelled appointments with Dr. Perera next week",
      referenceDate
    );

    expect(result.filters.status).toBe("CANCELLED");
    expect(result.filters.doctorName).toBe("Dr. Nimal Perera");
    expect(result.filters.startDate).toBeDefined();
    expect(result.filters.endDate).toBeDefined();
    expect(result.source).toBe("local-fallback");
  });

  it("correctly parses doctor, appointment type, and 'today'", () => {
    const result = parseSearchQueryLocal(
      "checkup with Dr. Jenkins today",
      referenceDate
    );

    expect(result.filters.appointmentType).toBe("CHECKUP");
    expect(result.filters.doctorName).toBe("Dr. Sarah Jenkins");
    expect(result.filters.startDate).toBeDefined();
    expect(result.filters.endDate).toBeDefined();
  });

  it("correctly parses tomorrow and appointment type", () => {
    const result = parseSearchQueryLocal(
      "follow-up tomorrow",
      referenceDate
    );

    expect(result.filters.appointmentType).toBe("FOLLOW_UP");
    expect(result.filters.startDate).toBeDefined();
  });

  it("extracts patient name for simple queries", () => {
    const result = parseSearchQueryLocal(
      "appointments for Arthur Dent",
      referenceDate
    );

    expect(result.filters.patientName).toBe("Arthur Dent");
  });

  it("handles blank or whitespace input gracefully", () => {
    const result = parseSearchQueryLocal("   ", referenceDate);
    expect(result.filters).toEqual({});
    expect(result.explanation).toBe("Showing all appointments");
  });
});

describe("Date Utilities", () => {
  it("formats dates and times consistently", () => {
    const iso = "2026-10-13T14:30:00.000Z";
    expect(formatDateTime(iso)).toContain("Oct 13, 2026");
    expect(formatDateOnly(iso)).toBe("Oct 13, 2026");
    expect(typeof formatTimeOnly(iso)).toBe("string");
  });

  it("formats datetime-local input string", () => {
    const d = new Date(2026, 9, 13, 10, 30);
    const formatted = toInputDateTime(d);
    expect(formatted).toBe("2026-10-13T10:30");
  });
});
