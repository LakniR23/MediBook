/**
 * Voice Intent Domain Service.
 * Follows Single Responsibility and Command Pattern principles.
 * Parses spoken voice transcripts into validated clinical actions, queries, and navigations.
 * Strictly adheres to clinical assistant guidelines for "Medi".
 */

export type VoiceIntentType =
  | "WAKE_GREETING"
  | "QUERY_DOCTOR_APPOINTMENTS"
  | "QUERY_PATIENT_APPOINTMENT"
  | "QUERY_PATIENT_INFO"
  | "QUERY_PATIENTS_LIST"
  | "QUERY_DOCTOR_INFO"
  | "QUERY_TODAY_SCHEDULE"
  | "QUERY_DOCTORS_ON_DUTY"
  | "QUERY_SHIFT"
  | "QUERY_STATS"
  | "NAVIGATE"
  | "OPEN_MODAL"
  | "FILTER_APPOINTMENTS"
  | "FILTER_DOCTORS"
  | "FILTER_PATIENTS"
  | "RESET_FILTERS"
  | "HELP"
  | "UNKNOWN";

export interface VoiceAction {
  intent: VoiceIntentType;
  spokenResponse: string;
  targetPath?: string;
  modalName?: "new_appointment" | "new_patient" | "new_doctor";
  filters?: {
    searchTerm?: string;
    doctorName?: string;
    shift?: "Morning" | "Afternoon" | "Evening" | "Night" | "All";
    status?: string;
    appointmentType?: string;
    bloodGroup?: string;
  };
  queryData?: {
    doctorQuery?: string;
    patientQuery?: string;
    aspect?:
      | "blood_group"
      | "allergy"
      | "doctor"
      | "phone"
      | "email"
      | "address"
      | "age"
      | "mrn"
      | "status"
      | "general";
    date?: string;
  };
}

export class VoiceIntentService {
  /**
   * Cleans transcript by removing wake words ("hey medi", "medi", "hello medi")
   */
  stripWakeWord(transcript: string): { cleanText: string; hadWakeWord: boolean } {
    const raw = transcript.trim();
    const wakeRegex = /^(?:hey\s+medi|hello\s+medi|hi\s+medi|medi)[,\s]*/i;
    if (wakeRegex.test(raw)) {
      const stripped = raw.replace(wakeRegex, "").trim();
      return { cleanText: stripped, hadWakeWord: true };
    }
    return { cleanText: raw, hadWakeWord: false };
  }

  /**
   * Parses natural language speech into a structured VoiceAction.
   */
  parseTranscript(rawTranscript: string): VoiceAction {
    const { cleanText, hadWakeWord } = this.stripWakeWord(rawTranscript);
    const text = cleanText.toLowerCase().trim();

    // 1. PURE WAKE WORD INQUIRY (e.g. "Medi", "Hey Medi", "Hello Medi")
    if (hadWakeWord && (!text || text === "are you there" || text === "hello" || text === "hi")) {
      return {
        intent: "WAKE_GREETING",
        spokenResponse: "Yes, I am Medi. How can I help you today?",
      };
    }

    // 2. PATIENT-SPECIFIC QUERIES (Blood group, allergies, doctor, contact, MRN, appointment)
    const knownPatients = [
      "kavindu", "senanayake", "kasun", "kalhara", "nuwan", "pradeep",
      "kavindi", "rodrigo", "tharindu", "fernando", "sachini", "jayawardena",
      "saman", "wickramasinghe", "manel", "lokuge", "chathuri", "alwis",
      "dinesh", "kumar", "nadeesha"
    ];

    let patientCandidate: string | null = null;
    let patientAspect:
      | "blood_group"
      | "allergy"
      | "doctor"
      | "phone"
      | "email"
      | "address"
      | "age"
      | "mrn"
      | "status"
      | "general" = "general";

    if (text.includes("blood") || text.includes("type") || text.includes("group") || text.includes("rh")) {
      patientAspect = "blood_group";
    } else if (text.includes("allerg") || text.includes("reaction") || text.includes("alert") || text.includes("adverse")) {
      patientAspect = "allergy";
    } else if (text.includes("doctor") || text.includes("physician") || text.includes("who is seeing")) {
      patientAspect = "doctor";
    } else if (text.includes("phone") || text.includes("mobile") || text.includes("contact") || text.includes("call") || text.includes("telephone")) {
      patientAspect = "phone";
    } else if (text.includes("address") || text.includes("live") || text.includes("residence") || text.includes("where does") || text.includes("location")) {
      patientAspect = "address";
    } else if (text.includes("email") || text.includes("mail")) {
      patientAspect = "email";
    } else if (text.includes("age") || text.includes("old") || text.includes("gender") || text.includes("dob")) {
      patientAspect = "age";
    } else if (text.includes("mrn") || text.includes("medical record")) {
      patientAspect = "mrn";
    } else if (text.includes("status") || text.includes("discharged") || text.includes("active") || text.includes("chronic")) {
      patientAspect = "status";
    }

    // Patient name extraction
    const patPrefixMatch = cleanText.match(/(?:patient)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
    const patPossessiveMatch = cleanText.match(/([a-zA-Z]+(?:\s+[a-zA-Z]+)?)(?:'s|s)\s+(?:blood|type|group|allerg|doctor|physician|phone|contact|address|email|age|mrn|status|detail|record|appointment|visit)/i);
    const patOfMatch = cleanText.match(/(?:blood\s+(?:type|group)|allerg(?:y|ies)|doctor|phone|address|contact|detail|info|status|appointment)\s+(?:of|for)\s+(?:patient\s+)?([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);

    if (patPrefixMatch) {
      patientCandidate = patPrefixMatch[1]
        .replace(/\b(blood|type|group|allergy|allergies|doctor|phone|address|email|age|today|tomorrow|now|please|details?)\b/gi, "")
        .trim();
    } else if (patPossessiveMatch) {
      patientCandidate = patPossessiveMatch[1]
        .replace(/\b(what|tell|show|get|the|patient|is|are)\b/gi, "")
        .trim();
    } else if (patOfMatch) {
      patientCandidate = patOfMatch[1]
        .replace(/\b(today|tomorrow|now|please|the)\b/gi, "")
        .trim();
    } else {
      for (const kp of knownPatients) {
        if (new RegExp(`\\b${kp}\\b`, "i").test(text)) {
          patientCandidate = kp.charAt(0).toUpperCase() + kp.slice(1);
          break;
        }
      }
    }

    const isExplicitSearch =
      (text.startsWith("search for") ||
        text.startsWith("find patient") ||
        text.startsWith("search ") ||
        text.startsWith("find ")) &&
      patientAspect === "general";

    if (patientCandidate && patientCandidate.length >= 2 && !isExplicitSearch) {
      const isApptQuery =
        text.includes("appointment") ||
        text.includes("visit") ||
        text.includes("booking") ||
        text.includes("when is");

      if (isApptQuery) {
        return {
          intent: "QUERY_PATIENT_APPOINTMENT",
          targetPath: "/appointments",
          queryData: { patientQuery: patientCandidate },
          filters: { searchTerm: patientCandidate },
          spokenResponse: `Checking appointments for patient ${patientCandidate}.`,
        };
      }

      return {
        intent: "QUERY_PATIENT_INFO",
        targetPath: "/patients",
        queryData: {
          patientQuery: patientCandidate,
          aspect: patientAspect,
        },
        filters: { searchTerm: patientCandidate },
        spokenResponse: `Looking up clinical records for patient ${patientCandidate}.`,
      };
    }

    // 3. PATIENTS REGISTRY / LIST QUERIES
    const bloodMatch = text.match(/(?:blood\s+(?:type|group)\s+([a-zA-Z0-9+-]+)|patients?\s+with\s+(?:blood\s+)?(?:group\s+|type\s+)?([a-zA-Z0-9+-]+))/i);
    if (bloodMatch) {
      const bg = (bloodMatch[1] || bloodMatch[2]).toUpperCase();
      return {
        intent: "QUERY_PATIENTS_LIST",
        targetPath: "/patients",
        filters: { bloodGroup: bg },
        spokenResponse: `Checking patients with blood group ${bg}.`,
      };
    }

    if (
      text.includes("how many patients") ||
      text.includes("total patients") ||
      text.includes("patient count") ||
      text.includes("list patients") ||
      text.includes("all patients")
    ) {
      return {
        intent: "QUERY_PATIENTS_LIST",
        targetPath: "/patients",
        spokenResponse: "Retrieving patient registry records.",
      };
    }

    // 4. DOCTOR-SPECIFIC APPOINTMENTS & INFO QUERY
    const knownClinicians = [
      "nimal", "perera", "anusha", "silva", "roshan", "jayasinghe", 
      "dilini", "senanayake", "chaminda", "bandara", "kusal", "mendis",
      "sarah", "jenkins", "aisha", "patel", "marcus", "vance", "elena", "rostova", "david", "kim"
    ];

    let foundClinician: string | null = null;
    for (const kc of knownClinicians) {
      if (new RegExp(`\\b${kc}\\b`, "i").test(text)) {
        foundClinician = kc.charAt(0).toUpperCase() + kc.slice(1);
        break;
      }
    }

    const docPrefixMatch = cleanText.match(/(?:dr\.?|doctor)\s+([a-zA-Z]+)/i);
    const hasDocPrefix = Boolean(docPrefixMatch);
    if (!foundClinician && docPrefixMatch) {
      const candidate = docPrefixMatch[1].replace(/\b(today|tomorrow|now|please|schedule|shift)\b/gi, "").trim();
      if (candidate) {
        foundClinician = candidate.charAt(0).toUpperCase() + candidate.slice(1);
      }
    }

    // Doctor info query (room, specialty, contact)
    if (foundClinician && (text.includes("room") || text.includes("specialty") || text.includes("specialize") || text.includes("phone") || text.includes("contact") || text.includes("where is"))) {
      return {
        intent: "QUERY_DOCTOR_INFO",
        targetPath: "/doctors",
        queryData: { doctorQuery: foundClinician },
        spokenResponse: `Checking clinical staff records for Dr. ${foundClinician}.`,
      };
    }

    const isApptRelated =
      text.includes("appointment") ||
      text.includes("schedule") ||
      text.includes("booking") ||
      text.includes("visit") ||
      text.includes("consultation") ||
      text.includes("how many") ||
      text.includes("who is seeing") ||
      text.includes("who does");

    if (foundClinician && (isApptRelated || hasDocPrefix)) {
      return {
        intent: "QUERY_DOCTOR_APPOINTMENTS",
        targetPath: "/appointments",
        queryData: {
          doctorQuery: foundClinician,
          date: "today",
        },
        filters: { doctorName: foundClinician },
        spokenResponse: `Checking today's appointments for Dr. ${foundClinician}.`,
      };
    }

    // 3. TODAY'S CLINICAL SCHEDULE & NEXT PATIENT QUERIES
    if (
      text.includes("who is the next patient") ||
      text.includes("who is next") ||
      text.includes("next appointment") ||
      text.includes("next patient")
    ) {
      return {
        intent: "QUERY_TODAY_SCHEDULE",
        targetPath: "/appointments",
        spokenResponse: "Checking next upcoming patient consultation.",
      };
    }

    if (
      text.includes("what are the appointments today") ||
      text.includes("today's appointments") ||
      text.includes("appointments for today") ||
      text.includes("today's schedule") ||
      text.includes("how many appointments today")
    ) {
      return {
        intent: "QUERY_TODAY_SCHEDULE",
        targetPath: "/appointments",
        spokenResponse: "Retrieving all clinic appointments scheduled for today.",
      };
    }

    // 4. DOCTORS ON DUTY / STAFF ROSTER
    if (
      (text.includes("on duty") && (text.includes("doctor") || text.includes("who") || text.includes("staff") || text.includes("working"))) ||
      text.includes("which doctors are working") ||
      text.includes("active doctors") ||
      text.includes("who is working today") ||
      text.includes("doctors on shift")
    ) {
      return {
        intent: "QUERY_DOCTORS_ON_DUTY",
        targetPath: "/doctors",
        spokenResponse: "Retrieving active doctors currently on duty.",
      };
    }

    // 5. QUERY CURRENT SHIFT
    if (
      text.includes("current shift") ||
      text.includes("what shift") ||
      text.includes("who is on shift") ||
      text.includes("what is the shift") ||
      text.includes("shift time") ||
      text.includes("active shift")
    ) {
      return {
        intent: "QUERY_SHIFT",
        targetPath: "/doctors",
        spokenResponse: "Checking the active clinical hospital shift.",
      };
    }

    // 6. CLINICAL STATISTICS & METRICS
    if (
      text.includes("how many appointments") ||
      text.includes("clinic summary") ||
      text.includes("how many doctors") ||
      text.includes("total patients") ||
      text.includes("clinic metrics") ||
      text.includes("show stats") ||
      text.includes("clinic stats")
    ) {
      return {
        intent: "QUERY_STATS",
        targetPath: "/",
        spokenResponse: "Retrieving live clinical metrics and caseload statistics.",
      };
    }

    // 7. ACTIONS: OPEN CLINICAL MODALS
    if (
      text.includes("schedule appointment") ||
      text.includes("new appointment") ||
      text.includes("book appointment") ||
      text.includes("book visit") ||
      text.includes("create appointment")
    ) {
      return {
        intent: "OPEN_MODAL",
        modalName: "new_appointment",
        targetPath: "/appointments",
        spokenResponse: "Opening appointment scheduling form.",
      };
    }

    if (
      text.includes("register patient") ||
      text.includes("new patient") ||
      text.includes("add patient") ||
      text.includes("enroll patient")
    ) {
      return {
        intent: "OPEN_MODAL",
        modalName: "new_patient",
        targetPath: "/patients",
        spokenResponse: "Opening patient registration form.",
      };
    }

    if (
      text.includes("add doctor") ||
      text.includes("new doctor") ||
      text.includes("roster physician") ||
      text.includes("roster doctor")
    ) {
      return {
        intent: "OPEN_MODAL",
        modalName: "new_doctor",
        targetPath: "/doctors",
        spokenResponse: "Opening physician roster form.",
      };
    }

    // 8. ACTION: RESET FILTERS
    if (
      text.includes("clear filters") ||
      text.includes("reset filters") ||
      text.includes("show all") ||
      text.includes("reset search") ||
      text.includes("clear search")
    ) {
      return {
        intent: "RESET_FILTERS",
        spokenResponse: "Filters and search cleared.",
      };
    }

    // 9. NAVIGATION COMMANDS (With robust natural speech matching)
    if (
      text.includes("patient") &&
      (text.includes("page") || text.includes("directory") || text.includes("list") || text.includes("records") || text.includes("go") || text.includes("open") || text.includes("view"))
    ) {
      return {
        intent: "NAVIGATE",
        targetPath: "/patients",
        spokenResponse: "Navigating to Patient directory.",
      };
    }

    if (
      text.includes("doctor") &&
      (text.includes("page") || text.includes("roster") || text.includes("shifts") || text.includes("go") || text.includes("open") || text.includes("view"))
    ) {
      return {
        intent: "NAVIGATE",
        targetPath: "/doctors",
        spokenResponse: "Navigating to Doctors and Shifts roster.",
      };
    }

    if (
      text.includes("appointment") &&
      (text.includes("page") || text.includes("go to") || text.includes("open") || text.includes("view") || text.includes("list"))
    ) {
      return {
        intent: "NAVIGATE",
        targetPath: "/appointments",
        spokenResponse: "Navigating to Appointments management.",
      };
    }

    if (
      text.includes("dashboard") ||
      text.includes("home") ||
      text.includes("clinic overview")
    ) {
      return {
        intent: "NAVIGATE",
        targetPath: "/",
        spokenResponse: "Returning to Clinic Overview dashboard.",
      };
    }

    if (
      text.includes("profile") ||
      text.includes("my account") ||
      text.includes("doctor profile")
    ) {
      return {
        intent: "NAVIGATE",
        targetPath: "/profile",
        spokenResponse: "Opening your clinical profile.",
      };
    }

    // 10. SHIFT FILTERING
    if (text.includes("morning shift")) {
      return {
        intent: "FILTER_DOCTORS",
        targetPath: "/doctors",
        filters: { shift: "Morning" },
        spokenResponse: "Filtering for Morning shift clinicians.",
      };
    }
    if (text.includes("afternoon shift")) {
      return {
        intent: "FILTER_DOCTORS",
        targetPath: "/doctors",
        filters: { shift: "Afternoon" },
        spokenResponse: "Filtering for Afternoon shift clinicians.",
      };
    }
    if (text.includes("evening shift")) {
      return {
        intent: "FILTER_DOCTORS",
        targetPath: "/doctors",
        filters: { shift: "Evening" },
        spokenResponse: "Filtering for Evening shift clinicians.",
      };
    }
    if (text.includes("night shift")) {
      return {
        intent: "FILTER_DOCTORS",
        targetPath: "/doctors",
        filters: { shift: "Night" },
        spokenResponse: "Filtering for Night shift emergency clinicians.",
      };
    }

    // 11. STATUS FILTERING
    if (text.includes("cancelled appointments") || text.includes("show cancelled")) {
      return {
        intent: "FILTER_APPOINTMENTS",
        targetPath: "/appointments",
        filters: { status: "CANCELLED" },
        spokenResponse: "Filtering for cancelled appointments.",
      };
    }
    if (text.includes("completed appointments") || text.includes("show completed")) {
      return {
        intent: "FILTER_APPOINTMENTS",
        targetPath: "/appointments",
        filters: { status: "COMPLETED" },
        spokenResponse: "Filtering for completed consultations.",
      };
    }
    if (text.includes("scheduled appointments") || text.includes("upcoming appointments")) {
      return {
        intent: "FILTER_APPOINTMENTS",
        targetPath: "/appointments",
        filters: { status: "SCHEDULED" },
        spokenResponse: "Displaying scheduled patient encounters.",
      };
    }

    // 12. GENERAL DOCTOR FILTERING (e.g. "Dr. Nimal", "Dr. Anusha")
    const docMatch = cleanText.match(/(?:dr\.?|doctor)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
    if (docMatch) {
      const docName = docMatch[0].trim();
      return {
        intent: "FILTER_APPOINTMENTS",
        targetPath: "/appointments",
        filters: { doctorName: docName },
        spokenResponse: `Filtering appointments for ${docName}.`,
      };
    }

    // 13. SEARCH PATIENT / GENERAL SEARCH
    const searchMatch = cleanText.match(/(?:search\s+for|find\s+patient|find|search)\s+([^.]+)/i);
    if (searchMatch) {
      const queryTerm = searchMatch[1].trim();
      return {
        intent: "FILTER_APPOINTMENTS",
        targetPath: "/appointments",
        filters: { searchTerm: queryTerm },
        spokenResponse: `Searching records for ${queryTerm}.`,
      };
    }

    // 14. HELP / CAPABILITIES
    if (
      text.includes("what can you do") ||
      text.includes("help") ||
      text.includes("how to use") ||
      text.includes("commands")
    ) {
      return {
        intent: "HELP",
        spokenResponse:
          "I am Medi, your clinical assistant. You can ask for any doctor's appointments, today's schedule, doctors on duty, active shifts, or say 'schedule appointment'.",
      };
    }

    // 15. CLINICAL FALLBACK (Never repeat the login introduction)
    return {
      intent: "UNKNOWN",
      spokenResponse:
        "I couldn't find matching clinical records for that request. Please specify a doctor's name, today's schedule, or active shifts.",
    };
  }
}

export const voiceIntentService = new VoiceIntentService();
