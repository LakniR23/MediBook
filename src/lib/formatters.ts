/**
 * Domain formatters and validation utilities for MediBook.
 * Follows Single Responsibility and DRY principles.
 */

// Educational suffixes to strip from doctor names (MD, FAAOS, MBBS, etc.)
const DEGREE_SUFFIX_REGEX =
  /,\s*(MD|MBBS|MS|FAAOS|FAAP|FACC|FAAD|PhD|FRCS|MRCP)(\s*,\s*(MD|MBBS|MS|FAAOS|FAAP|FACC|FAAD|PhD|FRCS|MRCP))*/gi;

/**
 * Sanitizes doctor names by removing educational credentials.
 * Example: "Dr. Priyantha Silva, MD, FAAOS" -> "Dr. Priyantha Silva"
 */
export function cleanDoctorName(rawName: string): string {
  if (!rawName) return "";
  const withoutDegrees = rawName.replace(DEGREE_SUFFIX_REGEX, "").trim();
  if (withoutDegrees.toLowerCase().startsWith("dr.")) {
    return withoutDegrees;
  }
  return `Dr. ${withoutDegrees}`;
}

/**
 * Validates Sri Lankan 10-digit phone number format (e.g. 0771234567).
 */
export function isValidSriLankanPhone(phone?: string | null): boolean {
  if (!phone) return false;
  const digits = phone.replace(/[\s-]/g, "");
  return /^\d{10}$/.test(digits);
}

/**
 * Formats a phone number cleanly into standard 10-digit format.
 */
export function formatSriLankanPhone(phone?: string | null): string {
  if (!phone) return "";
  return phone.replace(/[\s-]/g, "");
}

/**
 * Validates standard email address with '@' and valid domain.
 */
export function isValidEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(clean);
}

/**
 * Extracts 2-letter uppercase initials from person's name.
 */
export function getInitials(name?: string | null, fallback = "PT"): string {
  if (!name) return fallback;
  const clean = cleanDoctorName(name).replace(/^Dr\.?\s*/i, "");
  const parts = clean.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format ISO string to localized time (e.g. "09:30 AM")
 */
export function formatLocalTime(isoString: string | Date, fallback = "09:00 AM"): string {
  try {
    const d = typeof isoString === "string" ? new Date(isoString) : isoString;
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return fallback;
  }
}

/**
 * Format ISO string to localized date (e.g. "Oct 16, 2026")
 */
export function formatLocalDate(isoString: string | Date, fallback = ""): string {
  try {
    const d = typeof isoString === "string" ? new Date(isoString) : isoString;
    if (isNaN(d.getTime())) return fallback || String(isoString);
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return fallback || String(isoString);
  }
}
