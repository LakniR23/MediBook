import { describe, it, expect } from "vitest";
import {
  cleanDoctorName,
  isValidSriLankanPhone,
  formatSriLankanPhone,
  isValidEmail,
  getInitials,
} from "../lib/formatters";

describe("Domain Formatters & Validators", () => {
  describe("cleanDoctorName", () => {
    it("strips single educational suffix like MD", () => {
      expect(cleanDoctorName("Dr. Priyantha Silva, MD")).toBe("Dr. Priyantha Silva");
    });

    it("strips multiple educational suffixes like MD, FAAOS, MBBS", () => {
      expect(cleanDoctorName("Dr. Priyantha Silva, MD, FAAOS")).toBe("Dr. Priyantha Silva");
      expect(cleanDoctorName("Nimal Perera, MBBS, FRCS")).toBe("Dr. Nimal Perera");
    });

    it("ensures Dr. prefix is preserved or added", () => {
      expect(cleanDoctorName("Dr. Anoma Wijesinghe")).toBe("Dr. Anoma Wijesinghe");
      expect(cleanDoctorName("Anoma Wijesinghe")).toBe("Dr. Anoma Wijesinghe");
    });

    it("handles empty or whitespace strings safely", () => {
      expect(cleanDoctorName("")).toBe("");
    });
  });

  describe("isValidSriLankanPhone", () => {
    it("validates exact 10-digit Sri Lankan phone numbers", () => {
      expect(isValidSriLankanPhone("0771234567")).toBe(true);
      expect(isValidSriLankanPhone("0712345678")).toBe(true);
      expect(isValidSriLankanPhone("0112345678")).toBe(true);
    });

    it("handles numbers with dashes and spaces", () => {
      expect(isValidSriLankanPhone("077-123-4567")).toBe(true);
      expect(isValidSriLankanPhone("077 123 4567")).toBe(true);
    });

    it("rejects non-10-digit or invalid numbers", () => {
      expect(isValidSriLankanPhone("077123456")).toBe(false); // 9 digits
      expect(isValidSriLankanPhone("07712345678")).toBe(false); // 11 digits
      expect(isValidSriLankanPhone("invalid-text")).toBe(false);
      expect(isValidSriLankanPhone(null)).toBe(false);
    });
  });

  describe("formatSriLankanPhone", () => {
    it("strips out hyphens and spaces cleanly", () => {
      expect(formatSriLankanPhone("077-123 4567")).toBe("0771234567");
    });
  });

  describe("isValidEmail", () => {
    it("validates well-formed email addresses", () => {
      expect(isValidEmail("doctor.nimal@hospital.lk")).toBe(true);
      expect(isValidEmail("priyantha.silva@gmail.com")).toBe(true);
    });

    it("rejects invalid emails without @ or domain", () => {
      expect(isValidEmail("doctor.nimal")).toBe(false);
      expect(isValidEmail("doctor.nimal@")).toBe(false);
      expect(isValidEmail("@hospital.lk")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("getInitials", () => {
    it("extracts 2-letter uppercase initials from full name", () => {
      expect(getInitials("Kasun Kalhara")).toBe("KK");
      expect(getInitials("Dr. Priyantha Silva, MD")).toBe("PS");
      expect(getInitials("Anoma")).toBe("AN");
    });

    it("returns fallback for null or empty strings", () => {
      expect(getInitials(null)).toBe("PT");
      expect(getInitials("")).toBe("PT");
    });
  });
});

