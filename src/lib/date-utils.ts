import { format, parseISO, isToday as isDateToday, isPast, isFuture } from "date-fns";

export function formatDateTime(isoString: string | Date): string {
  try {
    const date = typeof isoString === "string" ? parseISO(isoString) : isoString;
    return format(date, "MMM d, yyyy 'at' h:mm a");
  } catch {
    return String(isoString);
  }
}

export function formatDateOnly(isoString: string | Date): string {
  try {
    const date = typeof isoString === "string" ? parseISO(isoString) : isoString;
    return format(date, "MMM d, yyyy");
  } catch {
    return String(isoString);
  }
}

export function formatTimeOnly(isoString: string | Date): string {
  try {
    const date = typeof isoString === "string" ? parseISO(isoString) : isoString;
    return format(date, "h:mm a");
  } catch {
    return String(isoString);
  }
}

export function isTodayAppointment(isoString: string | Date): boolean {
  try {
    const date = typeof isoString === "string" ? parseISO(isoString) : isoString;
    return isDateToday(date);
  } catch {
    return false;
  }
}

export function toInputDateTime(isoString: string | Date): string {
  try {
    const date = typeof isoString === "string" ? new Date(isoString) : isoString;
    // Format YYYY-MM-DDTHH:mm for datetime-local input
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}
