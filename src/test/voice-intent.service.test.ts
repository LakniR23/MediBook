import { describe, it, expect } from "vitest";
import { VoiceIntentService } from "../services/voice-intent.service";

describe("VoiceIntentService Unit Tests", () => {
  const service = new VoiceIntentService();

  describe("Wake Word & Greeting", () => {
    it("recognizes pure wake word 'Hey Medi'", () => {
      const action = service.parseTranscript("Hey Medi");
      expect(action.intent).toBe("WAKE_GREETING");
      expect(action.spokenResponse).toContain("I am Medi");
    });

    it("strips wake word and processes command", () => {
      const action = service.parseTranscript("Medi, go to doctors");
      expect(action.intent).toBe("NAVIGATE");
      expect(action.targetPath).toBe("/doctors");
    });
  });

  describe("Doctor Appointments & Clinical Queries", () => {
    it("parses query for doctor's appointments today with count and details", () => {
      const action = service.parseTranscript("what are the appointments for dr nimal today");
      expect(action.intent).toBe("QUERY_DOCTOR_APPOINTMENTS");
      expect(action.queryData?.doctorQuery?.toLowerCase()).toContain("nimal");
      expect(action.targetPath).toBe("/appointments");
    });

    it("parses query for today's schedule / next patient", () => {
      const action = service.parseTranscript("who is the next patient?");
      expect(action.intent).toBe("QUERY_TODAY_SCHEDULE");
    });

    it("parses query for doctors on duty", () => {
      const action = service.parseTranscript("which doctors are on duty?");
      expect(action.intent).toBe("QUERY_DOCTORS_ON_DUTY");
    });
  });

  describe("Navigation commands", () => {
    it("parses request to go to appointments", () => {
      const action = service.parseTranscript("open appointments");
      expect(action.intent).toBe("NAVIGATE");
      expect(action.targetPath).toBe("/appointments");
      expect(action.spokenResponse).toContain("Appointments");
    });

    it("parses request to go to doctors roster", () => {
      const action = service.parseTranscript("go to doctors");
      expect(action.intent).toBe("NAVIGATE");
      expect(action.targetPath).toBe("/doctors");
    });

    it("parses request to go to patient directory ('when the patient's page')", () => {
      const action = service.parseTranscript("when the patient's page");
      expect(action.intent).toBe("NAVIGATE");
      expect(action.targetPath).toBe("/patients");
    });

    it("parses request to go home/dashboard", () => {
      const action = service.parseTranscript("go to dashboard");
      expect(action.intent).toBe("NAVIGATE");
      expect(action.targetPath).toBe("/");
    });
  });

  describe("Action & Modal commands", () => {
    it("parses request to schedule an appointment", () => {
      const action = service.parseTranscript("schedule appointment");
      expect(action.intent).toBe("OPEN_MODAL");
      expect(action.modalName).toBe("new_appointment");
      expect(action.targetPath).toBe("/appointments");
    });

    it("parses request to register new patient", () => {
      const action = service.parseTranscript("register patient");
      expect(action.intent).toBe("OPEN_MODAL");
      expect(action.modalName).toBe("new_patient");
      expect(action.targetPath).toBe("/patients");
    });

    it("parses request to add a doctor", () => {
      const action = service.parseTranscript("add doctor");
      expect(action.intent).toBe("OPEN_MODAL");
      expect(action.modalName).toBe("new_doctor");
      expect(action.targetPath).toBe("/doctors");
    });

    it("parses request to clear/reset filters", () => {
      const action = service.parseTranscript("clear filters");
      expect(action.intent).toBe("RESET_FILTERS");
    });
  });

  describe("Shift and search filtering", () => {
    it("parses request to filter morning shift", () => {
      const action = service.parseTranscript("show morning shift");
      expect(action.intent).toBe("FILTER_DOCTORS");
      expect(action.filters?.shift).toBe("Morning");
    });

    it("parses search query for a patient name", () => {
      const action = service.parseTranscript("search for Kasun");
      expect(action.intent).toBe("FILTER_APPOINTMENTS");
      expect(action.filters?.searchTerm).toBe("Kasun");
    });

    it("parses query for cancelled appointments", () => {
      const action = service.parseTranscript("show cancelled appointments");
      expect(action.intent).toBe("FILTER_APPOINTMENTS");
      expect(action.filters?.status).toBe("CANCELLED");
    });
  });

  describe("Patient & Doctor Clinical Queries", () => {
    it("parses request for patient Kavindu's blood type", () => {
      const action = service.parseTranscript("patient kavindu's blood type");
      expect(action.intent).toBe("QUERY_PATIENT_INFO");
      expect(action.queryData?.patientQuery?.toLowerCase()).toContain("kavindu");
      expect(action.queryData?.aspect).toBe("blood_group");
      expect(action.targetPath).toBe("/patients");
    });

    it("parses query for patient Kavindu's allergies", () => {
      const action = service.parseTranscript("does patient kavindu have any allergies?");
      expect(action.intent).toBe("QUERY_PATIENT_INFO");
      expect(action.queryData?.patientQuery?.toLowerCase()).toContain("kavindu");
      expect(action.queryData?.aspect).toBe("allergy");
    });

    it("parses query for patient Kavindu's attending doctor", () => {
      const action = service.parseTranscript("who is patient kavindu's doctor?");
      expect(action.intent).toBe("QUERY_PATIENT_INFO");
      expect(action.queryData?.patientQuery?.toLowerCase()).toContain("kavindu");
      expect(action.queryData?.aspect).toBe("doctor");
    });

    it("parses query for patient Kavindu's appointment", () => {
      const action = service.parseTranscript("when is patient kavindu's appointment?");
      expect(action.intent).toBe("QUERY_PATIENT_APPOINTMENT");
      expect(action.queryData?.patientQuery?.toLowerCase()).toContain("kavindu");
      expect(action.targetPath).toBe("/appointments");
    });

    it("parses query for doctor room/station", () => {
      const action = service.parseTranscript("what room is Dr. Nimal in?");
      expect(action.intent).toBe("QUERY_DOCTOR_INFO");
      expect(action.queryData?.doctorQuery?.toLowerCase()).toContain("nimal");
      expect(action.targetPath).toBe("/doctors");
    });

    it("parses query for patients with blood group B+", () => {
      const action = service.parseTranscript("how many patients with blood group B+?");
      expect(action.intent).toBe("QUERY_PATIENTS_LIST");
      expect(action.filters?.bloodGroup).toBe("B+");
      expect(action.targetPath).toBe("/patients");
    });
  });

  describe("Query and Help commands", () => {
    it("parses request for current shift", () => {
      const action = service.parseTranscript("what is the current shift?");
      expect(action.intent).toBe("QUERY_SHIFT");
    });

    it("parses help request", () => {
      const action = service.parseTranscript("what can you do?");
      expect(action.intent).toBe("HELP");
      expect(action.spokenResponse).toContain("Medi");
    });

    it("provides clean clinical fallback without robotic example text or repeating login intro", () => {
      const action = service.parseTranscript("random unknown clinical statement");
      expect(action.intent).toBe("UNKNOWN");
      expect(action.spokenResponse).not.toContain("I heard:");
      expect(action.spokenResponse).toContain("couldn't find matching clinical records");
    });
  });
});
