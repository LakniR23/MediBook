"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { voiceIntentService, VoiceAction } from "@/services/voice-intent.service";
import { getCurrentShift, getShiftProgress } from "@/lib/shifts";

export interface VoiceMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface VoiceAssistantContextType {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  lastResponse: string | null;
  isSupported: boolean;
  isMuted: boolean;
  messages: VoiceMessage[];
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  toggleMute: () => void;
  speak: (text: string) => void;
  processVoiceCommand: (text: string) => Promise<VoiceAction>;
  clearHistory: () => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | undefined>(
  undefined
);

export function VoiceAssistantProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      id: "init-1",
      sender: "assistant",
      text: "Hello, I am Medi. How can I help you today?",
      timestamp: new Date(),
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;
  const currentTranscriptRef = useRef<string>("");

  // Audible Speech Synthesis (Medi Natural Voice Response)
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || isMutedRef.current) return;
    if (pathname === "/login" || pathname === "/register") {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      return;
    }
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")) &&
        v.lang.startsWith("en")
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [pathname]);

  // Format time utility for clinical appointments (e.g. 09:00 AM)
  const formatTimeStr = (iso: string): string => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return "09:00 AM";
    }
  };

  // Format date utility (e.g. Oct 16, 2026)
  const formatDateStr = (iso: string): string => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return iso;
    }
  };

  // Process and execute parsed voice actions
  const processVoiceCommand = useCallback(
    async (rawText: string): Promise<VoiceAction> => {
      const trimmed = rawText.trim();
      if (!trimmed) {
        return { intent: "UNKNOWN", spokenResponse: "Please say a command." };
      }

      // Add user message to history
      const userMsg: VoiceMessage = {
        id: `u-${Date.now()}`,
        sender: "user",
        text: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.slice(-15), userMsg]);

      // Parse intent via domain service
      const action = voiceIntentService.parseTranscript(trimmed);
      let responseSpeech = action.spokenResponse;

      // 1. QUERY_DOCTOR_APPOINTMENTS: Fetch database appointments and provide count & details
      if (action.intent === "QUERY_DOCTOR_APPOINTMENTS" && action.queryData?.doctorQuery) {
        const docQuery = action.queryData.doctorQuery.toLowerCase();
        try {
          const [apptsRes, docsRes] = await Promise.all([
            fetch("/api/appointments"),
            fetch("/api/doctors"),
          ]);

          const apptsData = await apptsRes.json();
          const docsData = await docsRes.json();

          const allDoctors: any[] = docsData.doctors || [];
          const matchedDoctor = allDoctors.find(
            (d) =>
              d.name.toLowerCase().includes(docQuery) ||
              docQuery.includes(d.name.toLowerCase().replace("dr. ", ""))
          );

          if (!matchedDoctor) {
            const rosterSample = allDoctors.slice(0, 4).map((d) => d.name).join(", ");
            responseSpeech = `I couldn't find Dr. ${action.queryData.doctorQuery} on our clinic roster. Available doctors include ${rosterSample}.`;
          } else {
            const targetDocName = matchedDoctor.name;
            const allAppts: any[] = apptsData.appointments || [];

            const docAppts = allAppts.filter((a) => a.doctorId === matchedDoctor.id);
            const count = docAppts.length;
            if (count === 0) {
              responseSpeech = `${targetDocName} has no appointments scheduled for today.`;
            } else {
              const briefDetails = docAppts
                .slice(0, 3)
                .map(
                  (a) =>
                    `${a.patientName} for ${a.appointmentType || "Consultation"} at ${formatTimeStr(
                      a.appointmentDate
                    )}`
                )
                .join(", and ");

              responseSpeech = `${targetDocName} has ${count} appointment${
                count > 1 ? "s" : ""
              } today: ${briefDetails}.`;
            }
          }

          action.spokenResponse = responseSpeech;
        } catch (err) {
          console.error("Failed to query doctor appointments from API:", err);
        }
      }

      // 2. QUERY_TODAY_SCHEDULE: Total count & next patient
      if (action.intent === "QUERY_TODAY_SCHEDULE") {
        try {
          const apptsRes = await fetch("/api/appointments");
          const apptsData = await apptsRes.json();
          const allAppts: any[] = apptsData.appointments || [];
          const count = allAppts.length;

          if (count === 0) {
            responseSpeech = "There are no appointments scheduled for today.";
          } else {
            const next = allAppts[0];
            responseSpeech = `There are ${count} appointments scheduled today across all doctors. Next is ${
              next.patientName
            } with ${next.doctor?.name || "the attending physician"} at ${formatTimeStr(
              next.appointmentDate
            )}.`;
          }
          action.spokenResponse = responseSpeech;
        } catch (err) {
          console.error("Failed to query today's appointments:", err);
        }
      }

      // 3. QUERY_DOCTORS_ON_DUTY: List active staff
      if (action.intent === "QUERY_DOCTORS_ON_DUTY") {
        try {
          const docsRes = await fetch("/api/doctors");
          const docsData = await docsRes.json();
          const allDocs: any[] = docsData.doctors || [];

          if (allDocs.length === 0) {
            responseSpeech = "No attending physicians found on the roster.";
          } else {
            const docNames = allDocs.slice(0, 4).map((d) => d.name).join(", ");
            responseSpeech = `There are ${allDocs.length} doctors on duty today, including ${docNames}.`;
          }
          action.spokenResponse = responseSpeech;
        } catch (err) {
          console.error("Failed to query doctors on duty:", err);
        }
      }

      // 4. QUERY_SHIFT: Live shift calculation
      if (action.intent === "QUERY_SHIFT") {
        const shiftProgress = getShiftProgress();
        responseSpeech = `Currently it is the ${shiftProgress.currentShift.name}, running from ${shiftProgress.currentShift.timeRange}, with ${shiftProgress.timeRemainingStr} remaining.`;
        action.spokenResponse = responseSpeech;
      }

      // 5. QUERY_STATS: Summary of encounters
      if (action.intent === "QUERY_STATS") {
        try {
          const [apptsRes, docsRes] = await Promise.all([
            fetch("/api/appointments"),
            fetch("/api/doctors"),
          ]);
          const apptsData = await apptsRes.json();
          const docsData = await docsRes.json();
          const apptCount = (apptsData.appointments || []).length;
          const docCount = (docsData.doctors || []).length;

          responseSpeech = `Clinic overview: ${apptCount} total encounters recorded, with ${docCount} doctors actively rostered.`;
          action.spokenResponse = responseSpeech;
        } catch (err) {
          console.error("Failed to query clinic stats:", err);
        }
      }

      // 6. QUERY_PATIENT_INFO: Answers blood type, allergies, doctor, phone, email, address, age, MRN
      if (action.intent === "QUERY_PATIENT_INFO" && action.queryData?.patientQuery) {
        const pQuery = action.queryData.patientQuery.toLowerCase().trim();
        const aspect = action.queryData.aspect || "general";
        try {
          const patRes = await fetch("/api/patients");
          const patData = await patRes.json();
          const allPatients: any[] = Array.isArray(patData) ? patData : (patData.patients || []);

          const targetPatient = allPatients.find((p) => {
            const fullName = p.name.toLowerCase();
            const firstWord = fullName.split(" ")[0];
            const pTokens = pQuery.split(" ");
            return (
              fullName.includes(pQuery) ||
              pQuery.includes(fullName) ||
              pQuery.includes(firstWord) ||
              pTokens.some((tok: string) => tok.length > 2 && fullName.includes(tok)) ||
              p.mrn.toLowerCase().replace("#", "").includes(pQuery)
            );
          });

          if (!targetPatient) {
            responseSpeech = `I couldn't find a registered patient matching "${action.queryData.patientQuery}".`;
          } else {
            const pName = targetPatient.name;
            if (aspect === "blood_group") {
              responseSpeech = `Patient ${pName}'s blood type is ${targetPatient.bloodGroup}.${
                targetPatient.alertNote ? ` Clinical alert: ${targetPatient.alertNote}.` : ""
              }`;
            } else if (aspect === "allergy") {
              responseSpeech = targetPatient.alertNote
                ? `Patient ${pName} has a clinical alert: ${targetPatient.alertNote}.`
                : `Patient ${pName} has no recorded adverse reactions or allergies.`;
            } else if (aspect === "doctor") {
              responseSpeech = `Patient ${pName}'s attending physician is ${
                targetPatient.primaryDoctor || "Dr. Nimal Perera"
              }.`;
            } else if (aspect === "phone") {
              responseSpeech = `Patient ${pName}'s contact number is ${
                targetPatient.phone || "not on record"
              }.`;
            } else if (aspect === "address") {
              responseSpeech = `Patient ${pName}'s address is ${
                targetPatient.address || "not on record"
              }.`;
            } else if (aspect === "email") {
              responseSpeech = `Patient ${pName}'s email address is ${
                targetPatient.email || "not on record"
              }.`;
            } else if (aspect === "age") {
              responseSpeech = `Patient ${pName} is ${targetPatient.age} years old (${targetPatient.gender}).`;
            } else if (aspect === "mrn") {
              responseSpeech = `Patient ${pName}'s Medical Record Number is ${targetPatient.mrn}.`;
            } else if (aspect === "status") {
              const statusStr =
                targetPatient.status === "ACTIVE"
                  ? "Active Care"
                  : targetPatient.status === "CHRONIC_CARE"
                  ? "Chronic Care"
                  : "Discharged";
              responseSpeech = `Patient ${pName}'s care status is ${statusStr}.`;
            } else {
              responseSpeech = `Patient ${pName}, ${targetPatient.age} years old, MRN ${
                targetPatient.mrn
              }. Blood type ${targetPatient.bloodGroup}, Attending: ${
                targetPatient.primaryDoctor || "Dr. Nimal Perera"
              }.${targetPatient.alertNote ? ` Alert: ${targetPatient.alertNote}.` : ""}`;
            }
          }
          action.spokenResponse = responseSpeech;
        } catch (err) {
          console.error("Failed to query patient info:", err);
        }
      }

      // 7. QUERY_PATIENT_APPOINTMENT: Appointments for specific patient
      if (action.intent === "QUERY_PATIENT_APPOINTMENT" && action.queryData?.patientQuery) {
        const pQuery = action.queryData.patientQuery.toLowerCase().trim();
        try {
          const apptsRes = await fetch("/api/appointments");
          const apptsData = await apptsRes.json();
          const allAppts: any[] = apptsData.appointments || [];

          const matchedAppts = allAppts.filter((a) => {
            const pName = a.patientName.toLowerCase();
            return pName.includes(pQuery) || pQuery.includes(pName.split(" ")[0]);
          });

          if (matchedAppts.length === 0) {
            responseSpeech = `There are no scheduled appointments found for patient ${action.queryData.patientQuery}.`;
          } else {
            const appt = matchedAppts[0];
            responseSpeech = `Patient ${appt.patientName} has an appointment scheduled on ${formatDateStr(
              appt.appointmentDate
            )} at ${formatTimeStr(appt.appointmentDate)} with ${
              appt.doctor?.name || "the attending physician"
            } (${appt.appointmentType || "Checkup"}).`;
          }
          action.spokenResponse = responseSpeech;
        } catch (err) {
          console.error("Failed to query patient appointments:", err);
        }
      }

      // 8. QUERY_PATIENTS_LIST: Count & list of patients by blood group or status
      if (action.intent === "QUERY_PATIENTS_LIST") {
        try {
          const patRes = await fetch("/api/patients");
          const patData = await patRes.json();
          const allPatients: any[] = Array.isArray(patData) ? patData : (patData.patients || []);

          if (action.filters?.bloodGroup) {
            const bg = action.filters.bloodGroup.toUpperCase();
            const matching = allPatients.filter((p) => p.bloodGroup.toUpperCase() === bg);
            if (matching.length === 0) {
              responseSpeech = `There are no patients currently registered with blood group ${bg}.`;
            } else {
              const sampleNames = matching.slice(0, 3).map((p) => p.name).join(", ");
              responseSpeech = `There ${matching.length === 1 ? "is" : "are"} ${matching.length} patient${
                matching.length === 1 ? "" : "s"
              } with blood group ${bg}: ${sampleNames}.`;
            }
          } else {
            const activeCount = allPatients.filter((p) => p.status === "ACTIVE").length;
            const chronicCount = allPatients.filter((p) => p.status === "CHRONIC_CARE").length;
            responseSpeech = `There are ${allPatients.length} total registered patients: ${activeCount} in active care and ${chronicCount} in chronic care.`;
          }
          action.spokenResponse = responseSpeech;
        } catch (err) {
          console.error("Failed to query patients list:", err);
        }
      }

      // 9. QUERY_DOCTOR_INFO: Doctor specialty, room, contact
      if (action.intent === "QUERY_DOCTOR_INFO" && action.queryData?.doctorQuery) {
        const docQuery = action.queryData.doctorQuery.toLowerCase().trim();
        try {
          const docsRes = await fetch("/api/doctors");
          const docsData = await docsRes.json();
          const allDocs: any[] = docsData.doctors || [];

          const matchedDoc = allDocs.find((d) => {
            const clean = d.name.toLowerCase().replace("dr. ", "").trim();
            return d.name.toLowerCase().includes(docQuery) || docQuery.includes(clean);
          });

          if (!matchedDoc) {
            responseSpeech = `I couldn't find Dr. ${action.queryData.doctorQuery} on our clinic roster.`;
          } else {
            const lower = trimmed.toLowerCase();
            if (lower.includes("room") || lower.includes("where")) {
              responseSpeech = `${matchedDoc.name} is stationed in ${
                matchedDoc.room || "Consult Room 01"
              }, specializing in ${matchedDoc.specialty}.`;
            } else if (lower.includes("specialty") || lower.includes("specialize")) {
              responseSpeech = `${matchedDoc.name} specializes in ${matchedDoc.specialty}.`;
            } else if (lower.includes("phone") || lower.includes("contact") || lower.includes("number")) {
              responseSpeech = `${matchedDoc.name}'s contact number is ${
                matchedDoc.phone || "not on record"
              }.`;
            } else {
              responseSpeech = `${matchedDoc.name}, ${matchedDoc.specialty}, stationed in ${
                matchedDoc.room || "Consult Room 01"
              }, active on the ${matchedDoc.shift || "Morning"} shift.`;
            }
          }
          action.spokenResponse = responseSpeech;
        } catch (err) {
          console.error("Failed to query doctor info:", err);
        }
      }

      // 10. SMART CLINICAL FALLBACK: If query was unclassified, check database directly for patient/doctor names
      if (action.intent === "UNKNOWN") {
        try {
          const [patRes, docRes] = await Promise.all([
            fetch("/api/patients"),
            fetch("/api/doctors"),
          ]);
          const patData = await patRes.json();
          const docData = await docRes.json();
          const allPatients: any[] = Array.isArray(patData) ? patData : (patData.patients || []);
          const allDoctors: any[] = docData.doctors || [];

          const lower = trimmed.toLowerCase();

          // A. Check if user mentioned any patient
          const matchedPatient = allPatients.find((p) => {
            const full = p.name.toLowerCase();
            const first = full.split(" ")[0];
            return lower.includes(full) || lower.includes(first);
          });

          if (matchedPatient) {
            if (lower.includes("blood") || lower.includes("type") || lower.includes("group") || lower.includes("rh")) {
              responseSpeech = `Patient ${matchedPatient.name}'s blood type is ${matchedPatient.bloodGroup}.${
                matchedPatient.alertNote ? ` Clinical alert: ${matchedPatient.alertNote}.` : ""
              }`;
            } else if (lower.includes("allerg") || lower.includes("alert") || lower.includes("reaction")) {
              responseSpeech = matchedPatient.alertNote
                ? `Patient ${matchedPatient.name} has a clinical alert: ${matchedPatient.alertNote}.`
                : `Patient ${matchedPatient.name} has no recorded adverse reactions or allergies.`;
            } else if (lower.includes("doctor") || lower.includes("physician") || lower.includes("seeing")) {
              responseSpeech = `Patient ${matchedPatient.name}'s attending physician is ${
                matchedPatient.primaryDoctor || "Dr. Nimal Perera"
              }.`;
            } else if (lower.includes("phone") || lower.includes("mobile") || lower.includes("contact") || lower.includes("call")) {
              responseSpeech = `Patient ${matchedPatient.name}'s contact number is ${
                matchedPatient.phone || "not on record"
              }.`;
            } else if (lower.includes("address") || lower.includes("live") || lower.includes("city")) {
              responseSpeech = `Patient ${matchedPatient.name}'s address is ${
                matchedPatient.address || "not on record"
              }.`;
            } else if (lower.includes("age") || lower.includes("old") || lower.includes("gender")) {
              responseSpeech = `Patient ${matchedPatient.name} is ${matchedPatient.age} years old (${matchedPatient.gender}).`;
            } else {
              responseSpeech = `Patient ${matchedPatient.name}, ${matchedPatient.age} years old, MRN ${
                matchedPatient.mrn
              }. Blood type ${matchedPatient.bloodGroup}, Attending: ${
                matchedPatient.primaryDoctor || "Dr. Nimal Perera"
              }.${matchedPatient.alertNote ? ` Alert: ${matchedPatient.alertNote}.` : ""}`;
            }
            action.spokenResponse = responseSpeech;
          } else {
            // B. Check if user mentioned any doctor
            const matchedDoc = allDoctors.find((d) => {
              const clean = d.name.toLowerCase().replace("dr. ", "").trim();
              return lower.includes(clean) || lower.includes(d.name.toLowerCase());
            });

            if (matchedDoc) {
              if (lower.includes("room") || lower.includes("where")) {
                responseSpeech = `${matchedDoc.name} is in ${
                  matchedDoc.room || "Consult Room 01"
                }, specialty ${matchedDoc.specialty}.`;
              } else if (lower.includes("specialty") || lower.includes("specialize")) {
                responseSpeech = `${matchedDoc.name} specializes in ${matchedDoc.specialty}.`;
              } else if (lower.includes("phone") || lower.includes("contact") || lower.includes("number")) {
                responseSpeech = `${matchedDoc.name}'s contact number is ${
                  matchedDoc.phone || "not on record"
                }.`;
              } else {
                responseSpeech = `${matchedDoc.name}, ${matchedDoc.specialty}, located in ${
                  matchedDoc.room || "Consult Room 01"
                }, on ${matchedDoc.shift || "Morning"} shift.`;
              }
              action.spokenResponse = responseSpeech;
            }
          }
        } catch (err) {
          console.error("Clinical fallback search failed:", err);
        }
      }

      // Execute Navigation if targeted
      if (action.targetPath && action.targetPath !== pathname) {
        router.push(action.targetPath);
      }

      // Dispatch global event for current page to react to (modals, filters, search)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("medibook:voice-action", {
            detail: action,
          })
        );
      }

      // Speak audible voice feedback
      speak(responseSpeech);
      setLastResponse(responseSpeech);

      // Add assistant message to transcript history
      const aiMsg: VoiceMessage = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        text: responseSpeech,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev.slice(-15), aiMsg]);

      return action;
    },
    [pathname, router, speak]
  );

  const initialTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speechPauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearInitialTimer = useCallback(() => {
    if (initialTimerRef.current) {
      clearTimeout(initialTimerRef.current);
      initialTimerRef.current = null;
    }
  }, []);

  const clearSpeechPauseTimer = useCallback(() => {
    if (speechPauseTimerRef.current) {
      clearTimeout(speechPauseTimerRef.current);
      speechPauseTimerRef.current = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    clearInitialTimer();
    clearSpeechPauseTimer();
  }, [clearInitialTimer, clearSpeechPauseTimer]);

  // Give user 10 full seconds to start speaking before gracefully timing out
  const startInitialTimer = useCallback(() => {
    clearAllTimers();
    initialTimerRef.current = setTimeout(() => {
      if (isListeningRef.current && !currentTranscriptRef.current.trim()) {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {}
        }
        setIsListening(false);
        setLastResponse("I didn't hear anything. Tap the microphone when you're ready to speak.");
      }
    }, 10000);
  }, [clearAllTimers]);

  // Once speech is detected, finalize 2.5s after the user stops speaking
  const resetSpeechPauseTimer = useCallback(() => {
    clearSpeechPauseTimer();
    speechPauseTimerRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        const textToProcess = currentTranscriptRef.current.trim();
        currentTranscriptRef.current = "";

        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {}
        }
        setIsListening(false);

        if (textToProcess) {
          processVoiceCommand(textToProcess);
        }
      }
    }, 2500);
  }, [clearSpeechPauseTimer, processVoiceCommand]);

  // Create a clean SpeechRecognition instance on demand
  const initRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        currentTranscriptRef.current = "";
        setTranscript("");
      };

      recognition.onresult = (event: any) => {
        // Words detected: clear initial 10s countdown
        clearInitialTimer();

        let accumulated = "";
        for (let i = 0; i < event.results.length; i++) {
          accumulated += event.results[i][0].transcript;
        }
        const text = accumulated.trim();
        setTranscript(text);
        currentTranscriptRef.current = text;

        // Reset pause timer to 2.5s after the latest spoken word
        resetSpeechPauseTimer();
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition notice:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setIsListening(false);
          clearAllTimers();
          const errText =
            "Microphone access was blocked. Please allow microphone permissions in your browser address bar.";
          setLastResponse(errText);
          speak(errText);
        } else if (event.error === "audio-capture") {
          setIsListening(false);
          clearAllTimers();
          const errText = "No microphone found. Please connect an audio input device.";
          setLastResponse(errText);
          speak(errText);
        } else if (event.error === "network") {
          setIsListening(false);
          clearAllTimers();
          setLastResponse("Speech recognition network error. Please check your internet connection.");
        } else if (event.error === "no-speech") {
          // Handled gracefully by initialTimerRef
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          const textToProcess = currentTranscriptRef.current.trim();
          currentTranscriptRef.current = "";
          setIsListening(false);
          clearAllTimers();
          if (textToProcess) {
            processVoiceCommand(textToProcess);
          }
        }
      };

      recognitionRef.current = recognition;
      return recognition;
    } catch (e) {
      console.warn("Voice speech recognition initialization notice:", e);
      setIsSupported(false);
      return null;
    }
  }, [clearAllTimers, clearInitialTimer, processVoiceCommand, resetSpeechPauseTimer, speak]);

  const startListening = useCallback(() => {
    if (pathname === "/login" || pathname === "/register") return;
    currentTranscriptRef.current = "";
    setTranscript("");
    setIsListening(true);

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    startInitialTimer();

    const recognition = initRecognition();
    if (recognition) {
      try {
        recognition.start();
      } catch (err) {
        console.warn("Start listening notice:", err);
      }
    }
  }, [pathname, startInitialTimer, initRecognition]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    clearAllTimers();
    const textToProcess = currentTranscriptRef.current.trim();
    currentTranscriptRef.current = "";

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Stop listening notice:", err);
      }
    }

    if (textToProcess) {
      processVoiceCommand(textToProcess);
    }
  }, [clearAllTimers, processVoiceCommand]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [clearAllTimers]);

  // Login Greeting & Logout Silence Handling
  useEffect(() => {
    if (typeof window === "undefined") return;

    // If navigated to /login or /register, immediately stop all speech, listening, and pending greeting
    if (pathname === "/login" || pathname === "/register") {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      sessionStorage.removeItem("medibook_login_greeting_pending");
      setLastResponse(null);
      setIsSpeaking(false);
      return;
    }

    const triggerGreeting = (staffName: string) => {
      if (pathname === "/login" || pathname === "/register") {
        sessionStorage.removeItem("medibook_login_greeting_pending");
        return;
      }
      const cleanName = staffName.trim();
      const greeting = `Hello ${cleanName}, I am Medi. How can I help you today? You can ask for any doctor's schedule, today's appointments, active shifts, or say 'schedule appointment'.`;
      speak(greeting);
      setLastResponse(greeting);
      sessionStorage.removeItem("medibook_login_greeting_pending");
    };

    // Check if user just logged in and is now on an internal application page
    const pendingGreeting = sessionStorage.getItem("medibook_login_greeting_pending");
    let timer: NodeJS.Timeout | null = null;
    if (pendingGreeting && pathname !== "/login" && pathname !== "/register") {
      timer = setTimeout(() => {
        triggerGreeting(pendingGreeting);
      }, 700);
    }

    const handleLoginEvent = (e: any) => {
      if (pathname !== "/login" && pathname !== "/register" && e.detail?.displayName) {
        triggerGreeting(e.detail.displayName);
      }
    };

    // Immediate silence and termination on sign-out
    const handleLogoutEvent = () => {
      sessionStorage.removeItem("medibook_login_greeting_pending");
      if (timer) clearTimeout(timer);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setLastResponse(null);
      setIsSpeaking(false);
      stopListening();
    };

    window.addEventListener("medibook:user-logged-in", handleLoginEvent);
    window.addEventListener("medibook:user-logged-out", handleLogoutEvent);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("medibook:user-logged-in", handleLoginEvent);
      window.removeEventListener("medibook:user-logged-out", handleLogoutEvent);
    };
  }, [pathname, speak, stopListening]);

  // Global window listeners for voice command execution and simulation
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__medibookVoiceCommand = (cmd: string) => processVoiceCommand(cmd);
      (window as any).__medibookStartListening = () => startListening();
      (window as any).__medibookStopListening = () => stopListening();
      (window as any).__medibookGreetLogin = (name: string) => {
        const cleanName = name.trim();
        const greeting = `Hello ${cleanName}, I am Medi. How can I help you today? You can ask for any doctor's schedule, today's appointments, active shifts, or say 'schedule appointment'.`;
        speak(greeting);
        setLastResponse(greeting);
      };

      const handleCustomInput = (e: any) => {
        if (e.detail) processVoiceCommand(e.detail);
      };
      window.addEventListener("medibook:voice-input", handleCustomInput);
      return () => {
        window.removeEventListener("medibook:voice-input", handleCustomInput);
      };
    }
  }, [processVoiceCommand, speak, startListening, stopListening]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next && typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setLastResponse(null);
    setTranscript("");
  }, []);

  return (
    <VoiceAssistantContext.Provider
      value={{
        isListening,
        isSpeaking,
        transcript,
        lastResponse,
        isSupported,
        isMuted,
        messages,
        isExpanded,
        setIsExpanded,
        startListening,
        stopListening,
        toggleListening,
        toggleMute,
        speak,
        processVoiceCommand,
        clearHistory,
      }}
    >
      {children}
    </VoiceAssistantContext.Provider>
  );
}

export function useVoiceAssistant() {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error(
      "useVoiceAssistant must be used within a VoiceAssistantProvider"
    );
  }
  return context;
}
