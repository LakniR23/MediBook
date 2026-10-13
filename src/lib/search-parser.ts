import { AppointmentStatus, AppointmentType, ParsedSearchFilters } from "./types";
import { startOfDay, endOfDay, addDays, startOfWeek, endOfWeek } from "date-fns";

const KNOWN_DOCTORS = [
  "Dr. Nimal Perera",
  "Dr. Sarah Jenkins",
  "Dr. Aisha Patel",
  "Dr. Marcus Vance",
  "Dr. Elena Rostova",
  "Dr. David Kim",
];

const STATUS_MAP: Record<string, AppointmentStatus> = {
  cancelled: "CANCELLED",
  canceled: "CANCELLED",
  confirmed: "CONFIRMED",
  completed: "COMPLETED",
  scheduled: "SCHEDULED",
  upcoming: "SCHEDULED",
  pending: "SCHEDULED",
  "no-show": "NO_SHOW",
  "no show": "NO_SHOW",
};

const TYPE_MAP: Record<string, AppointmentType> = {
  checkup: "CHECKUP",
  "check-up": "CHECKUP",
  "check up": "CHECKUP",
  consultation: "CONSULTATION",
  consult: "CONSULTATION",
  "follow-up": "FOLLOW_UP",
  "follow up": "FOLLOW_UP",
  followup: "FOLLOW_UP",
  routine: "ROUTINE_EXAM",
  "routine exam": "ROUTINE_EXAM",
  exam: "ROUTINE_EXAM",
  emergency: "EMERGENCY",
  specialist: "SPECIALIST_VISIT",
};

export interface LocalParsedResult {
  filters: ParsedSearchFilters;
  explanation: string;
  source: "local-fallback" | "ai-service";
}

export function parseSearchQueryLocal(
  rawQuery: string,
  referenceDate: Date = new Date()
): LocalParsedResult {
  let remaining = rawQuery.trim();
  const filters: ParsedSearchFilters = {};
  const explanations: string[] = [];

  if (!remaining) {
    return {
      filters: {},
      explanation: "Showing all appointments",
      source: "local-fallback",
    };
  }

  // 1. Detect relative dates
  const lower = remaining.toLowerCase();
  if (/\btoday\b/i.test(lower)) {
    filters.startDate = startOfDay(referenceDate).toISOString();
    filters.endDate = endOfDay(referenceDate).toISOString();
    remaining = remaining.replace(/\btoday\b/gi, "").trim();
    explanations.push("Date: Today");
  } else if (/\btomorrow\b/i.test(lower)) {
    const tmrw = addDays(referenceDate, 1);
    filters.startDate = startOfDay(tmrw).toISOString();
    filters.endDate = endOfDay(tmrw).toISOString();
    remaining = remaining.replace(/\btomorrow\b/gi, "").trim();
    explanations.push("Date: Tomorrow");
  } else if (/\bnext week\b/i.test(lower)) {
    // Next week Monday to Sunday
    const nextWeekStart = startOfWeek(addDays(referenceDate, 7), { weekStartsOn: 1 });
    const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 });
    filters.startDate = nextWeekStart.toISOString();
    filters.endDate = nextWeekEnd.toISOString();
    remaining = remaining.replace(/\bnext week\b/gi, "").trim();
    explanations.push("Date: Next week");
  } else if (/\bthis week\b/i.test(lower)) {
    const thisWeekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
    filters.startDate = thisWeekStart.toISOString();
    filters.endDate = thisWeekEnd.toISOString();
    remaining = remaining.replace(/\bthis week\b/gi, "").trim();
    explanations.push("Date: This week");
  }

  // 2. Detect Doctor
  for (const doc of KNOWN_DOCTORS) {
    const surname = doc.split(" ").slice(-1)[0];
    const docRegex = new RegExp(`\\b(?:dr\\.?|doctor)?\\s*${surname}\\b`, "i");
    if (docRegex.test(remaining)) {
      filters.doctorName = doc;
      remaining = remaining.replace(docRegex, "").trim();
      explanations.push(`Doctor: ${doc}`);
      break;
    }
  }

  if (!filters.doctorName) {
    const genericDoc = remaining.match(/\b(?:dr\.?|doctor)\s+([a-zA-Z]+)\b/i);
    if (genericDoc) {
      const surname = genericDoc[1];
      filters.doctorName = `Dr. ${surname[0].toUpperCase() + surname.slice(1)}`;
      remaining = remaining.replace(genericDoc[0], "").trim();
      explanations.push(`Doctor: ${filters.doctorName}`);
    }
  }

  // 3. Detect Status
  for (const [kw, statusVal] of Object.entries(STATUS_MAP)) {
    const statusRegex = new RegExp(`\\b${kw}\\b`, "i");
    if (statusRegex.test(remaining)) {
      filters.status = statusVal;
      remaining = remaining.replace(statusRegex, "").trim();
      explanations.push(`Status: ${statusVal}`);
      break;
    }
  }

  // 4. Detect Appointment Type
  for (const [kw, typeVal] of Object.entries(TYPE_MAP)) {
    const typeRegex = new RegExp(`\\b${kw}\\b`, "i");
    if (typeRegex.test(remaining)) {
      filters.appointmentType = typeVal;
      remaining = remaining.replace(typeRegex, "").trim();
      explanations.push(`Type: ${typeVal}`);
      break;
    }
  }

  // 5. Clean noise words
  const noiseRegex = /\b(?:appointments?|patients?|with|for|on|in|at|all|the|my|show|find|list|get)\b/gi;
  remaining = remaining.replace(noiseRegex, "").replace(/\s+/g, " ").trim();

  if (remaining.length > 0) {
    filters.patientName = remaining;
    filters.rawSearchTerm = remaining;
    explanations.push(`Matching text: "${remaining}"`);
  }

  return {
    filters,
    explanation: explanations.length > 0 ? explanations.join(" • ") : `Searching for "${rawQuery}"`,
    source: "local-fallback",
  };
}
