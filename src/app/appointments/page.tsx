"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  Search,
  ChevronDown,
  FilterX,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export interface ClinicalAppointment {
  id: string;
  name: string;
  contact?: string;
  date: string;
  time: string;
  doctorId: string;
  doctor: string;
  type: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  note?: string;
}

export interface DoctorOption {
  id: string;
  name: string;
  specialty: string;
}

const PAGE_SIZE = 8;

const TIME_OPTIONS = [
  // Morning (06:00 AM – 12:00 PM)
  "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  // Afternoon (12:00 PM – 05:00 PM)
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  // Evening (05:00 PM – 10:00 PM)
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM",
  // Night (10:00 PM – 06:00 AM)
  "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM", "12:00 AM", "01:00 AM", "02:00 AM", "03:00 AM", "04:00 AM", "05:00 AM",
];

export interface RegisteredPatientOption {
  id: string;
  mrn: string;
  name: string;
  phone?: string;
  email?: string;
  primaryDoctor?: string;
}

function AppointmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [appointments, setAppointments] = useState<ClinicalAppointment[]>([]);
  const [doctorsList, setDoctorsList] = useState<DoctorOption[]>([]);
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatientOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Protected route check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<"ai-service" | "local-fallback" | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);

  const handleAiSearch = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : searchTerm).trim();
    if (!q) {
      setAiExplanation(null);
      setAiSource(null);
      return;
    }
    setIsAiSearching(true);
    try {
      const res = await fetch("/api/parse-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.filters) {
          if (data.filters.doctorName) {
            setSelectedDoctor(data.filters.doctorName);
          }
          if (data.filters.status) {
            setSelectedStatus(data.filters.status);
          }
          if (data.filters.appointmentType) {
            setSelectedType(data.filters.appointmentType);
          }
          if (data.filters.startDate) {
            setDateFrom(data.filters.startDate.split("T")[0]);
          }
          if (data.filters.endDate) {
            setDateTo(data.filters.endDate.split("T")[0]);
          }
        }
        setAiExplanation(data.explanation || `Filtered for "${q}"`);
        setAiSource(data.source === "ai-service" ? "ai-service" : "local-fallback");
        showToast(
          data.source === "ai-service"
            ? "FastAPI AI parsed query with LLaMA 3.3"
            : "Search parsed via local engine",
          "refresh"
        );
      }
    } catch (err) {
      console.error("AI search failed:", err);
    } finally {
      setIsAiSearching(false);
    }
  };

  // Sync doctor from URL query params (e.g. from "View Shift Appointments")
  useEffect(() => {
    const docQuery = searchParams.get("doctor");
    if (docQuery) {
      setSelectedDoctor(docQuery);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<ClinicalAppointment | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<ClinicalAppointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("09:00 AM");
  const [formDoctorId, setFormDoctorId] = useState("");
  const [formType, setFormType] = useState("CONSULTATION");
  const [formStatus, setFormStatus] = useState<ClinicalAppointment["status"]>("SCHEDULED");
  const [formNotes, setFormNotes] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "delete" | "refresh">("success");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string, type: "success" | "delete" | "refresh" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setIsToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setIsToastVisible(false), 3000);
  };

  // Fetch doctors, patients, and appointments from Database
  const fetchDbData = async () => {
    try {
      setIsLoading(true);
      const [apptRes, docRes, patRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/doctors"),
        fetch("/api/patients"),
      ]);

      if (patRes.ok) {
        const patData = await patRes.json();
        if (Array.isArray(patData)) {
          setRegisteredPatients(patData);
        }
      }

      if (docRes.ok) {
        const docJson = await docRes.json();
        if (docJson.doctors) {
          setDoctorsList(docJson.doctors);
          if (docJson.doctors.length > 0 && !formDoctorId) {
            setFormDoctorId(docJson.doctors[0].id);
          }
        }
      }

      if (apptRes.ok) {
        const apptJson = await apptRes.json();
        if (apptJson.appointments) {
          const mapped: ClinicalAppointment[] = apptJson.appointments.map((a: any) => {
            const d = new Date(a.appointmentDate);
            const dateStr = d.toISOString().split("T")[0];
            const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

            let normStatus: ClinicalAppointment["status"] = "SCHEDULED";
            if (a.status === "COMPLETED") normStatus = "COMPLETED";
            else if (a.status === "CANCELLED") normStatus = "CANCELLED";
            else if (a.status === "NO_SHOW") normStatus = "NO_SHOW";

            return {
              id: a.id,
              name: a.patientName,
              contact: a.patientContact || "",
              date: dateStr,
              time: timeStr,
              doctorId: a.doctorId,
              doctor: a.doctor?.name || "Dr. Staff",
              type: a.appointmentType || "CONSULTATION",
              status: normStatus,
              note: a.notes || "",
            };
          });
          setAppointments(mapped);
        }
      }
    } catch (err) {
      console.error("Failed to load appointments from database:", err);
      showToast("Error loading appointments from database", "delete");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDbData();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchesName = apt.name.toLowerCase().includes(q);
        const matchesNote = apt.note ? apt.note.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesNote) return false;
      }
      if (selectedDoctor) {
        const normFilter = selectedDoctor.toLowerCase().replace(/^dr\.?\s*/i, "").replace(/,\s*[A-Z,\s]+$/i, "").trim();
        const normAptDoc = apt.doctor.toLowerCase().replace(/^dr\.?\s*/i, "").replace(/,\s*[A-Z,\s]+$/i, "").trim();
        if (!normAptDoc.includes(normFilter) && !normFilter.includes(normAptDoc)) {
          return false;
        }
      }
      if (selectedStatus && apt.status !== selectedStatus) return false;
      if (selectedType && apt.type !== selectedType) return false;
      if (dateFrom && apt.date < dateFrom) return false;
      if (dateTo && apt.date > dateTo) return false;
      return true;
    });
  }, [appointments, debouncedSearch, selectedDoctor, selectedStatus, selectedType, dateFrom, dateTo]);

  const totalFiltered = filteredAppointments.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalFiltered);
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

  const handleResetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedDoctor("");
    setSelectedStatus("");
    setSelectedType("");
    setDateFrom("");
    setDateTo("");
    setAiExplanation(null);
    setAiSource(null);
    setCurrentPage(1);
    showToast("Filters reset to default view", "refresh");
  };

  const handleOpenNewModal = () => {
    setEditingAppointment(null);
    setFormName("");
    setFormContact("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormTime("09:00 AM");
    if (doctorsList.length > 0) setFormDoctorId(doctorsList[0].id);
    setFormType("CONSULTATION");
    setFormStatus("SCHEDULED");
    setFormNotes("");
    setIsFormModalOpen(true);
  };

  // Voice AI Action Listener (Siri / Alexa integration)
  useEffect(() => {
    const handleVoiceAction = (e: any) => {
      const action = e.detail;
      if (!action) return;

      if (action.intent === "OPEN_MODAL" && action.modalName === "new_appointment") {
        handleOpenNewModal();
      } else if (action.intent === "RESET_FILTERS") {
        handleResetFilters();
      } else if (action.intent === "FILTER_APPOINTMENTS") {
        if (action.filters?.searchTerm !== undefined) {
          setSearchTerm(action.filters.searchTerm);
        }
        if (action.filters?.doctorName !== undefined) {
          setSelectedDoctor(action.filters.doctorName);
        }
        if (action.filters?.status !== undefined) {
          setSelectedStatus(action.filters.status);
        }
        setCurrentPage(1);
      }
    };

    window.addEventListener("medibook:voice-action", handleVoiceAction);
    return () => window.removeEventListener("medibook:voice-action", handleVoiceAction);
  }, [doctorsList]);

  const handleOpenEditModal = (apt: ClinicalAppointment) => {
    setEditingAppointment(apt);
    setFormName(apt.name);
    setFormContact(apt.contact || "");
    setFormDate(apt.date);
    setFormTime(apt.time);
    setFormDoctorId(apt.doctorId || (doctorsList.find((d) => d.name === apt.doctor)?.id || ""));
    setFormType(apt.type);
    setFormStatus(apt.status);
    setFormNotes(apt.note || "");
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDate) return;

    if (formContact.trim()) {
      const cleanDigits = formContact.replace(/[\s-]/g, "");
      const is10Digits = /^\d{10}$/.test(cleanDigits);
      const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formContact.trim());
      if (!is10Digits && !isEmail) {
        showToast("Contact must be a 10-digit phone number (e.g. 0771234567) or valid email (e.g. name@gmail.com)", "delete");
        return;
      }
    }

    // Construct ISO appointmentDate
    const [time, period] = formTime.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    const combinedDate = new Date(`${formDate}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);

    const selectedDocObj = doctorsList.find((d) => d.id === formDoctorId) || doctorsList[0];

    if (editingAppointment) {
      try {
        const res = await fetch(`/api/appointments/${editingAppointment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientName: formName.trim(),
            patientContact: formContact.trim() || null,
            doctorId: selectedDocObj?.id,
            appointmentDate: combinedDate.toISOString(),
            appointmentType: formType,
            status: formStatus,
            notes: formNotes.trim() || null,
          }),
        });

        if (res.ok) {
          showToast(`Appointment updated for ${formName.trim()}`, "success");
          fetchDbData();
        } else {
          showToast("Failed to update appointment", "delete");
        }
      } catch (err) {
        showToast("Error updating appointment", "delete");
      }
    } else {
      try {
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientName: formName.trim(),
            patientContact: formContact.trim() || null,
            doctorId: selectedDocObj?.id,
            appointmentDate: combinedDate.toISOString(),
            appointmentType: formType,
            status: formStatus,
            notes: formNotes.trim() || null,
          }),
        });

        if (res.ok) {
          showToast(`Appointment scheduled for ${formName.trim()}`, "success");
          fetchDbData();
        } else {
          showToast("Failed to schedule appointment", "delete");
        }
      } catch (err) {
        showToast("Error scheduling appointment", "delete");
      }
    }
    setIsFormModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAppointment) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/appointments/${deletingAppointment.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast(`Appointment deleted`, "delete");
        fetchDbData();
      } else {
        showToast("Failed to delete appointment", "delete");
      }
    } catch {
      showToast("Error deleting appointment", "delete");
    } finally {
      setIsDeleting(false);
      setDeletingAppointment(null);
    }
  };

  const formatDateTime = (dateStr: string, timeStr: string) => {
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${formattedDate}, ${timeStr}`;
    } catch {
      return `${dateStr}, ${timeStr}`;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "PT";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getStatusBadge = (status: ClinicalAppointment["status"]) => {
    switch (status) {
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
            Scheduled
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/60">
            Cancelled
          </span>
        );
      case "NO_SHOW":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            No Show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
      <Header activePath="appointments" />

      {/* Toast Notification Container OUTSIDE space-y-6 to eliminate top gap */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 pointer-events-none flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white shadow-xl ${
          isToastVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
        }`}
      >
        {toastType === "delete" ? (
          <Trash2 className="w-4 h-4 text-red-400" />
        ) : toastType === "refresh" ? (
          <RotateCcw className="w-4 h-4 text-sky-400" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        )}
        <span className="text-sm font-medium">{toastMessage}</span>
      </div>

      <main className="w-full pt-20 pb-12 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Appointments Management
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Search, schedule, and manage clinic patient appointments.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleOpenNewModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Appointment</span>
              </button>
            </div>
          </div>

          {/* Filter Toolbar with AI Natural Language Search */}
          <div className="w-full bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
            {/* Top Row: AI Natural Language Search Input & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
              {/* Natural Language Search Input */}
              <div className="lg:col-span-5 relative flex items-center">
                <Sparkles className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sky-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAiSearch(searchTerm);
                    }
                  }}
                  placeholder="Search patient, doctor, status, or type natural query..."
                  className="w-full pl-9 pr-24 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                />
                <button
                  type="button"
                  disabled={isAiSearching}
                  onClick={() => handleAiSearch(searchTerm)}
                  title="Ask FastAPI AI service to parse query"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isAiSearching ? "Parsing..." : "AI Parse"}</span>
                </button>
              </div>

              {/* Doctor Filter */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <select
                    value={selectedDoctor}
                    onChange={(e) => {
                      setSelectedDoctor(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer border border-slate-200 transition-colors"
                  >
                    <option value="">All Doctors</option>
                    {doctorsList.map((doc) => (
                      <option key={doc.id} value={doc.name}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Status Filter */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer border border-slate-200 transition-colors"
                  >
                    <option value="">All Statuses</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="NO_SHOW">No Show</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Type Filter */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer border border-slate-200 transition-colors"
                  >
                    <option value="">All Types</option>
                    <option value="CONSULTATION">Consultation</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="CHECKUP">Checkup</option>
                    <option value="ROUTINE_EXAM">Routine Exam</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Clear */}
              <div className="lg:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  title="Reset filters"
                  className="w-full inline-flex items-center justify-center gap-1 p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium transition-colors"
                >
                  <FilterX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* AI Natural Language Interpretation Banner */}
            {aiExplanation && (
              <div className="px-3 py-2 rounded-lg bg-sky-50 border border-sky-200/70 flex items-center justify-between text-xs text-sky-900">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] ${
                      aiSource === "ai-service"
                        ? "bg-teal-600 text-white"
                        : "bg-sky-600 text-white"
                    }`}
                  >
                    {aiSource === "ai-service" ? "FastAPI AI Parsed" : "Local Parsed"}
                  </span>
                  <span className="font-medium text-slate-800">{aiExplanation}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAiExplanation(null);
                    setAiSource(null);
                    setSearchTerm("");
                  }}
                  className="text-sky-600 hover:text-sky-900 font-semibold underline ml-2"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Date range row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-700">Date Range:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 bg-slate-50 focus:bg-white text-slate-800 rounded-md border border-slate-200 outline-none text-xs"
                />
                <span>to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 bg-slate-50 focus:bg-white text-slate-800 rounded-md border border-slate-200 outline-none text-xs"
                />
              </div>

              <div className="text-slate-500">
                Showing {Math.min(PAGE_SIZE, totalFiltered)} of {totalFiltered} appointments
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="w-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Doctor</th>
                    <th className="py-3 px-4">Encounter Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Patient Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {getInitials(apt.name)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight">{apt.name}</span>
                            {apt.contact && (
                              <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                                {apt.contact}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date & Time with NO ICON */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 font-medium">
                        {formatDateTime(apt.date, apt.time)}
                      </td>

                      {/* Doctor */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {apt.doctor}
                      </td>

                      {/* Encounter Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {apt.type}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(apt.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(apt)}
                            title="Edit"
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingAppointment(apt)}
                            title="Delete"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {filteredAppointments.length === 0 && (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center">
                <p className="font-semibold text-sm">No appointments match the filter criteria.</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-2 text-xs text-sky-600 font-semibold hover:underline"
                >
                  Reset filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {filteredAppointments.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-500">
                <span>
                  Showing {startIndex + 1} to {endIndex} of {totalFiltered} appointments
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={safeCurrentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-semibold text-slate-800">
                    Page {safeCurrentPage} of {totalPages}
                  </span>
                  <button
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal: New / Edit Appointment */}
          {isFormModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
              <div
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 my-auto border border-slate-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="font-bold text-base text-slate-900">
                      {editingAppointment ? "Edit Appointment" : "New Appointment"}
                    </h2>
                    <p className="text-xs text-slate-500">Clinical consult registration &amp; triage slot</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-900 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="pt-4 flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Patient Full Name <span className="text-red-500">*</span>
                      </label>
                      {registeredPatients.length > 0 && !editingAppointment && (
                        <span className="text-[11px] text-sky-600 font-medium">
                          Auto-fill from directory
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      list="patients-datalist"
                      value={formName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormName(val);
                        const matched = registeredPatients.find(
                          (p) => p.name.toLowerCase() === val.toLowerCase()
                        );
                        if (matched) {
                          if (matched.phone) setFormContact(matched.phone);
                          else if (matched.email) setFormContact(matched.email);
                          if (matched.primaryDoctor) {
                            const docObj = doctorsList.find((d) =>
                              d.name.toLowerCase().includes(matched.primaryDoctor?.toLowerCase() || "")
                            );
                            if (docObj) setFormDoctorId(docObj.id);
                          }
                        }
                      }}
                      placeholder="e.g. Kasun Kalhara"
                      className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                    />
                    <datalist id="patients-datalist">
                      {registeredPatients.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.mrn} • {p.phone || p.email || "Directory Record"}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Patient Contact (10-Digit Phone or Email)
                    </label>
                    <input
                      type="text"
                      value={formContact}
                      onChange={(e) => setFormContact(e.target.value)}
                      placeholder="e.g. 0771234567 or kasun.kalhara@gmail.com"
                      className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Standard 10-digit Sri Lankan phone number (e.g. 0771234567) or valid email
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Time Slot <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formTime}
                        onChange={(e) => setFormTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors cursor-pointer"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Assigned</label>
                      <select
                        value={formDoctorId}
                        onChange={(e) => setFormDoctorId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors cursor-pointer"
                      >
                        {doctorsList.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name} ({doc.specialty})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Encounter Type</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <option value="CONSULTATION">Consultation</option>
                        <option value="FOLLOW_UP">Follow-up</option>
                        <option value="CHECKUP">Checkup</option>
                        <option value="ROUTINE_EXAM">Routine Exam</option>
                        <option value="EMERGENCY">Emergency</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="NO_SHOW">No Show</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes</label>
                    <textarea
                      rows={3}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Complaints, triage instructions..."
                      className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsFormModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-sky-500 text-white rounded-lg text-xs font-semibold hover:bg-sky-600 shadow-sm transition-colors"
                    >
                      Save Appointment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Delete Confirmation */}
          {deletingAppointment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
              <div
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Delete Appointment</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Are you sure you want to delete the appointment for{" "}
                      <strong className="text-slate-900 font-semibold">{deletingAppointment.name}</strong>? This
                      action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setDeletingAppointment(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete Appointment"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AppointmentsContent />
    </Suspense>
  );
}
