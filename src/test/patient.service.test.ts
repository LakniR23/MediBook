import { describe, it, expect } from "vitest";
import { PatientService } from "../services/patient.service";

describe("PatientService Domain Unit Tests", () => {
  const service = new PatientService();

  describe("generateMrn", () => {
    it("generates an MRN starting with #MRN- followed by 4 digits", () => {
      const mrn1 = service.generateMrn();
      const mrn2 = service.generateMrn();

      expect(mrn1).toMatch(/^#MRN-\d{4}$/);
      expect(mrn2).toMatch(/^#MRN-\d{4}$/);
    });
  });

  describe("normalizePhone", () => {
    it("normalizes phone numbers to clean digits without dashes or spaces", () => {
      expect(service.normalizePhone("077-123-4567")).toBe("0771234567");
      expect(service.normalizePhone("071 999 8888")).toBe("0719998888");
    });

    it("returns null for empty or undefined phone strings", () => {
      expect(service.normalizePhone(null)).toBeNull();
      expect(service.normalizePhone("   ")).toBeNull();
    });
  });

  describe("normalizeEmail", () => {
    it("lowercases and trims email addresses", () => {
      expect(service.normalizeEmail("  Doctor.Nimal@Hospital.LK  ")).toBe("doctor.nimal@hospital.lk");
    });

    it("returns null for null or empty strings", () => {
      expect(service.normalizeEmail(null)).toBeNull();
      expect(service.normalizeEmail("")).toBeNull();
    });
  });
});

