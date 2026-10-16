import { describe, it, expect } from "vitest";
import { getCurrentShift, getShiftProgress, SHIFTS } from "../lib/shifts";

describe("Shift Timing & Automation Logic", () => {
  it("has exactly 4 distinct hospital shifts dividing the 24-hour cycle", () => {
    expect(Object.keys(SHIFTS)).toEqual(["Morning", "Afternoon", "Evening", "Night"]);
  });

  describe("getCurrentShift", () => {
    it("identifies Morning shift between 06:00 and 11:59", () => {
      const d1 = new Date("2026-10-16T06:00:00");
      expect(getCurrentShift(d1).id).toBe("Morning");

      const d2 = new Date("2026-10-16T09:30:00");
      expect(getCurrentShift(d2).id).toBe("Morning");

      const d3 = new Date("2026-10-16T11:59:00");
      expect(getCurrentShift(d3).id).toBe("Morning");
    });

    it("identifies Afternoon shift between 12:00 and 16:59", () => {
      const d1 = new Date("2026-10-16T12:00:00");
      expect(getCurrentShift(d1).id).toBe("Afternoon");

      const d2 = new Date("2026-10-16T14:30:00");
      expect(getCurrentShift(d2).id).toBe("Afternoon");

      const d3 = new Date("2026-10-16T16:59:00");
      expect(getCurrentShift(d3).id).toBe("Afternoon");
    });

    it("identifies Evening shift between 17:00 and 21:59", () => {
      const d1 = new Date("2026-10-16T17:00:00");
      expect(getCurrentShift(d1).id).toBe("Evening");

      const d2 = new Date("2026-10-16T20:15:00");
      expect(getCurrentShift(d2).id).toBe("Evening");

      const d3 = new Date("2026-10-16T21:59:00");
      expect(getCurrentShift(d3).id).toBe("Evening");
    });

    it("identifies Night shift between 22:00 and 05:59", () => {
      const d1 = new Date("2026-10-16T22:00:00");
      expect(getCurrentShift(d1).id).toBe("Night");

      const d2 = new Date("2026-10-16T02:00:00");
      expect(getCurrentShift(d2).id).toBe("Night");

      const d3 = new Date("2026-10-16T05:59:00");
      expect(getCurrentShift(d3).id).toBe("Night");
    });
  });

  describe("getShiftProgress", () => {
    it("calculates progress percentage and time left", () => {
      // 09:00 is exactly halfway through Morning (06:00 to 12:00 = 6 hours = 360 mins; 180 mins elapsed = 50%)
      const date = new Date("2026-10-16T09:00:00");
      const progress = getShiftProgress(date);
      expect(progress.progressPercent).toBe(50);
      expect(progress.timeRemainingStr).toBe("3h 0m left");
    });
  });
});
