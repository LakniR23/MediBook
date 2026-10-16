export type ShiftType = "Morning" | "Afternoon" | "Evening" | "Night";

export interface ShiftInfo {
  id: ShiftType;
  name: string;
  label: string;
  timeRange: string;
  startHour: number; // 0-23
  startMinute: number;
  endHour: number; // 0-23
  endMinute: number;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

export const SHIFTS: Record<ShiftType, ShiftInfo> = {
  Morning: {
    id: "Morning",
    name: "Morning Shift",
    label: "Morning (06:00 AM – 12:00 PM)",
    timeRange: "06:00 AM – 12:00 PM",
    startHour: 6,
    startMinute: 0,
    endHour: 12,
    endMinute: 0,
    description: "Clinical Rounds & Morning Outpatient Consultations",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200/80",
    dotColor: "bg-amber-500",
  },
  Afternoon: {
    id: "Afternoon",
    name: "Afternoon Shift",
    label: "Afternoon (12:00 PM – 05:00 PM)",
    timeRange: "12:00 PM – 05:00 PM",
    startHour: 12,
    startMinute: 0,
    endHour: 17,
    endMinute: 0,
    description: "Specialist Clinics & Midday Procedures",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700",
    badgeBorder: "border-sky-200/80",
    dotColor: "bg-sky-500",
  },
  Evening: {
    id: "Evening",
    name: "Evening Shift",
    label: "Evening (05:00 PM – 10:00 PM)",
    timeRange: "05:00 PM – 10:00 PM",
    startHour: 17,
    startMinute: 0,
    endHour: 22,
    endMinute: 0,
    description: "Evening Consultations & Follow-up Clinics",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700",
    badgeBorder: "border-indigo-200/80",
    dotColor: "bg-indigo-500",
  },
  Night: {
    id: "Night",
    name: "Night Shift",
    label: "Night (10:00 PM – 06:00 AM)",
    timeRange: "10:00 PM – 06:00 AM",
    startHour: 22,
    startMinute: 0,
    endHour: 6,
    endMinute: 0,
    description: "Emergency Admissions & Inpatient Monitoring",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    badgeBorder: "border-purple-200/80",
    dotColor: "bg-purple-500",
  },
};

export const SHIFT_LIST: ShiftInfo[] = [
  SHIFTS.Morning,
  SHIFTS.Afternoon,
  SHIFTS.Evening,
  SHIFTS.Night,
];

/**
 * Calculates current active shift based on current time.
 * - Morning: 06:00 AM – 12:00 PM
 * - Afternoon: 12:00 PM – 05:00 PM
 * - Evening: 05:00 PM – 10:00 PM
 * - Night: 10:00 PM – 06:00 AM
 */
export function getCurrentShift(date: Date = new Date()): ShiftInfo {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // 06:00 (360 mins) to 12:00 (720 mins)
  if (totalMinutes >= 6 * 60 && totalMinutes < 12 * 60) {
    return SHIFTS.Morning;
  }
  // 12:00 (720 mins) to 17:00 (1020 mins)
  if (totalMinutes >= 12 * 60 && totalMinutes < 17 * 60) {
    return SHIFTS.Afternoon;
  }
  // 17:00 (1020 mins) to 22:00 (1320 mins)
  if (totalMinutes >= 17 * 60 && totalMinutes < 22 * 60) {
    return SHIFTS.Evening;
  }
  // 22:00 (1320 mins) to 06:00 (360 mins next day)
  return SHIFTS.Night;
}

/**
 * Calculates progress percentage and remaining time for the current shift.
 */
export function getShiftProgress(date: Date = new Date()): {
  currentShift: ShiftInfo;
  progressPercent: number;
  timeRemainingStr: string;
  elapsedMinutes: number;
  totalDurationMinutes: number;
} {
  const currentShift = getCurrentShift(date);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  if (currentShift.id === "Night") {
    // Night: 22:00 (1320) to 06:00 (360) = 8 hours (480 mins)
    const duration = 8 * 60;
    let elapsed: number;
    if (totalMinutes >= 22 * 60) {
      elapsed = totalMinutes - 22 * 60;
    } else {
      elapsed = 2 * 60 + totalMinutes; // 120 mins from 22:00 to 00:00 + minutes into new day
    }
    const remaining = Math.max(0, duration - elapsed);
    const remH = Math.floor(remaining / 60);
    const remM = remaining % 60;
    return {
      currentShift,
      progressPercent: Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100))),
      timeRemainingStr: `${remH}h ${remM}m left`,
      elapsedMinutes: elapsed,
      totalDurationMinutes: duration,
    };
  } else {
    const startMins = currentShift.startHour * 60;
    const endMins = currentShift.endHour * 60;
    const duration = endMins - startMins;
    const elapsed = Math.max(0, totalMinutes - startMins);
    const remaining = Math.max(0, duration - elapsed);
    const remH = Math.floor(remaining / 60);
    const remM = remaining % 60;
    return {
      currentShift,
      progressPercent: Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100))),
      timeRemainingStr: `${remH}h ${remM}m left`,
      elapsedMinutes: elapsed,
      totalDurationMinutes: duration,
    };
  }
}

/**
 * Determine shift for a given appointment date string
 */
export function getShiftFromDateString(isoOrDate: string | Date): ShiftType {
  try {
    const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
    if (isNaN(d.getTime())) return "Morning";
    return getCurrentShift(d).id;
  } catch {
    return "Morning";
  }
}
