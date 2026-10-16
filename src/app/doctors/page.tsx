"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Plus,
  FilterX,
  ChevronDown,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { ShiftType, SHIFTS, getShiftProgress } from "@/lib/shifts";
import { cleanDoctorName, getInitials } from "@/lib/formatters";
import { DoctorModal, DoctorModalModel } from "@/components/DoctorModal";
import { DoctorDeleteModal } from "@/components/DoctorDeleteModal";
import { DoctorStatCards } from "@/components/DoctorStatCards";

interface DoctorRoster {
  id: string;
  name: string;
  specialty: string;
  room: string;
  phone: string;
  email: string;
  status: "ON_DUTY" | "ON_CALL" | "OFF_DUTY";
  shift: ShiftType;
  activePatients: number;
  maxPatients: number;
}

export default function DoctorsShiftsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [roster, setRoster] = useState<DoctorRoster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [activeShiftTab, setActiveShiftTab] = useState<"All" | "Current" | ShiftType>("All");

  // Real-time auto-updating clock for shift tracking
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const shiftInfo = useMemo(() => {
    return getShiftProgress(currentTime);
  }, [currentTime]);

  const currentShift = shiftInfo.currentShift;

  // Protected route check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Modals & form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorModalModel | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<DoctorRoster | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setIsToastVisible(false), 3000);
  };

  // Fetch real doctors from Database API
  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/doctors");
      if (res.ok) {
        const json = await res.json();
        if (json.doctors) {
          const shiftRotations: ShiftType[] = ["Morning", "Afternoon", "Evening", "Night"];
          const mapped: DoctorRoster[] = json.doctors.map((d: any, idx: number) => {
            const assignedShift: ShiftType =
              (d.shift as ShiftType) || shiftRotations[idx % 4];
            const assignedRoom = d.room || `Suite ${101 + idx}`;
            const apptCount = d._count?.appointments ?? (d.appointments?.length || 0);

            let docStatus: DoctorRoster["status"] = "ON_DUTY";
            if (apptCount === 0) docStatus = "ON_CALL";

            const cleanedName = cleanDoctorName(d.name);

            return {
              id: d.id,
              name: cleanedName,
              specialty: d.specialty,
              room: assignedRoom,
              phone: d.phone || "0771234567",
              email: d.email || `${cleanedName.toLowerCase().replace(/[^a-z]/g, "")}@gmail.com`,
              status: docStatus,
              shift: assignedShift,
              activePatients: apptCount,
              maxPatients: 8,
            };
          });
          setRoster(mapped);
        }
      }
    } catch (err) {
      console.error("[DoctorsShiftsPage] Error loading roster:", err);
      showToast("Error loading doctors from database");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredRoster = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return roster.filter((doc) => {
      if (q && !doc.name.toLowerCase().includes(q) && !doc.specialty.toLowerCase().includes(q)) {
        return false;
      }
      if (selectedSpecialty && doc.specialty !== selectedSpecialty) return false;
      if (selectedStatus && doc.status !== selectedStatus) return false;
      if (activeShiftTab === "Current" && doc.shift !== currentShift.id) return false;
      if (activeShiftTab !== "All" && activeShiftTab !== "Current" && doc.shift !== activeShiftTab) return false;
      return true;
    });
  }, [roster, searchTerm, selectedSpecialty, selectedStatus, activeShiftTab, currentShift.id]);

  // Statistics for Stat Cards
  const totalDoctorsCount = roster.length;
  const activeShiftDoctors = roster.filter((d) => d.shift === currentShift.id);
  const onDutyCount = roster.filter((d) => d.status === "ON_DUTY").length;
  const onCallCount = roster.filter((d) => d.status === "ON_CALL").length;
  const activeShiftCaseload = activeShiftDoctors.reduce((acc, d) => acc + d.activePatients, 0);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedSpecialty("");
    setSelectedStatus("");
    setActiveShiftTab("All");
    showToast("Roster filters reset to all staff");
  };

  // Voice AI Action Listener (Siri / Alexa integration)
  useEffect(() => {
    const handleVoiceAction = (e: any) => {
      const action = e.detail;
      if (!action) return;

      if (action.intent === "OPEN_MODAL" && action.modalName === "new_doctor") {
        setEditingDoctor(null);
        setIsModalOpen(true);
      } else if (action.intent === "RESET_FILTERS") {
        handleResetFilters();
      } else if (action.intent === "FILTER_DOCTORS") {
        if (action.filters?.shift) {
          setActiveShiftTab(action.filters.shift as any);
        }
        if (action.filters?.searchTerm) {
          setSearchTerm(action.filters.searchTerm);
        }
      }
    };

    window.addEventListener("medibook:voice-action", handleVoiceAction);
    return () => window.removeEventListener("medibook:voice-action", handleVoiceAction);
  }, []);

  // Add or Edit Doctor Save Handler
  const handleSaveDoctor = async (docData: DoctorModalModel) => {
    if (docData.id) {
      // Edit existing doctor
      const res = await fetch(`/api/doctors/${docData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docData),
      });

      if (!res.ok) {
        throw new Error("Failed to update doctor profile");
      }
      showToast(`${docData.name} updated successfully`);
    } else {
      // Add new doctor
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docData),
      });

      if (!res.ok) {
        throw new Error("Failed to save doctor to database");
      }
      showToast(`${docData.name} saved to database`);
    }
    fetchDoctors();
  };

  // Delete Doctor Handler
  const handleDeleteDoctor = async () => {
    if (!deletingDoctor) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/doctors/${deletingDoctor.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast(`${deletingDoctor.name} removed from roster`);
        setDeletingDoctor(null);
        fetchDoctors();
      } else {
        showToast("Failed to delete doctor");
      }
    } catch (err) {
      showToast("Error deleting doctor");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: DoctorRoster["status"]) => {
    switch (status) {
      case "ON_DUTY":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            On Duty
          </span>
        );
      case "ON_CALL":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            On Call
          </span>
        );
      case "OFF_DUTY":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Off Duty
          </span>
        );
    }
  };

  const getShiftBadge = (shift: ShiftType, isCurrent: boolean) => {
    const info = SHIFTS[shift];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${
          isCurrent
            ? "bg-sky-50 text-sky-700 border-sky-300 ring-1 ring-sky-200"
            : `${info.badgeBg} ${info.badgeText} ${info.badgeBorder}`
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isCurrent ? "bg-emerald-500 animate-pulse" : info.dotColor
          }`}
        />
        <span>{shift}</span>
        {isCurrent && <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Active</span>}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
      <Header activePath="doctors" />

      {/* Floating Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 pointer-events-none flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white shadow-xl ${
          isToastVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
        }`}
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium">{toastMessage}</span>
      </div>

      <main className="w-full pt-20 pb-12 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Doctors &amp; Shifts Roster
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-Shift Active
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage attending medical staff, real-time shift rotations, and clinical duty coverage.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingDoctor(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Roster Physician</span>
              </button>
            </div>
          </div>

          {/* 5 Dynamic Stat Cards with Auto Current Shift (Encapsulated) */}
          <DoctorStatCards
            currentShift={currentShift}
            shiftInfo={shiftInfo}
            isLoading={isLoading}
            activeShiftStaffCount={activeShiftDoctors.length}
            onDutyCount={onDutyCount}
            onCallCount={onCallCount}
            totalDoctorsCount={totalDoctorsCount}
            activeShiftCaseload={activeShiftCaseload}
          />

          {/* Shift Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2.5">
            <button
              type="button"
              onClick={() => setActiveShiftTab("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeShiftTab === "All"
                  ? "bg-sky-500 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Staff ({totalDoctorsCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveShiftTab("Current")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeShiftTab === "Current"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Current Shift ({currentShift.id})</span>
            </button>

            {(["Morning", "Afternoon", "Evening", "Night"] as const).map((tab) => {
              const isCurrent = currentShift.id === tab;
              const shiftDef = SHIFTS[tab];
              const countInShift = roster.filter((d) => d.shift === tab).length;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveShiftTab(tab)}
                  title={`${tab} Shift: ${shiftDef.timeRange}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeShiftTab === tab
                      ? "bg-sky-500 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                  <span>{tab}</span>
                  <span className="hidden sm:inline text-[11px] opacity-75 font-normal">
                    ({shiftDef.timeRange})
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeShiftTab === tab ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    {countInShift}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filter Toolbar */}
          <div className="w-full bg-white rounded-xl border border-slate-200 shadow-xs p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search doctor name or specialty..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                />
              </div>

              <div className="md:col-span-3">
                <div className="relative">
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer border border-slate-200 transition-colors"
                  >
                    <option value="">All Specialties</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Neurology">Neurology</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="md:col-span-3">
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer border border-slate-200 transition-colors"
                  >
                    <option value="">All Duty Statuses</option>
                    <option value="ON_DUTY">On Duty</option>
                    <option value="ON_CALL">On Call</option>
                    <option value="OFF_DUTY">Off Duty</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="md:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  title="Clear filters"
                  className="w-full inline-flex items-center justify-center p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs transition-colors"
                >
                  <FilterX className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Doctors Roster Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoster.map((doc) => {
              const loadPercentage = Math.round((doc.activePatients / doc.maxPatients) * 100);
              const isCurrentDocShift = doc.shift === currentShift.id;
              const shiftDef = SHIFTS[doc.shift];

              return (
                <div
                  key={doc.id}
                  className={`p-5 rounded-xl bg-white border shadow-xs hover:shadow-sm transition-all flex flex-col justify-between gap-4 ${
                    isCurrentDocShift ? "border-sky-300 ring-1 ring-sky-100" : "border-slate-200"
                  }`}
                >
                  <div>
                    {/* Top Header with Doctor Name */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs ring-1 ring-sky-100 flex-shrink-0">
                          {getInitials(doc.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 leading-tight">
                            {doc.name}
                          </h3>
                          <span className="text-xs font-medium text-sky-600 block mt-0.5">
                            {doc.specialty}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(doc.status)}
                        {getShiftBadge(doc.shift, isCurrentDocShift)}
                      </div>
                    </div>

                    {/* Room & Contact Details */}
                    <div className="p-3 rounded-lg bg-slate-50 text-xs text-slate-600 border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{doc.room}</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {shiftDef.timeRange}
                        </span>
                      </div>
                      <div className="text-sky-700 font-medium truncate">{doc.email}</div>
                      <div className="text-slate-500 text-[11px] font-mono">{doc.phone}</div>
                    </div>
                  </div>

                  {/* Workload Progress & Actions */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Caseload Allocation</span>
                      <span className="font-bold text-slate-900">
                        {doc.activePatients} / {doc.maxPatients} patients ({loadPercentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all duration-500"
                        style={{ width: `${loadPercentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Link
                        href={`/appointments?doctor=${encodeURIComponent(doc.name)}`}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                        title="View filtered appointments for this doctor"
                      >
                        View Shift Appointments
                      </Link>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDoctor(doc);
                            setIsModalOpen(true);
                          }}
                          title="Edit Physician"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingDoctor(doc)}
                          title="Delete Physician"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredRoster.length === 0 && (
            <div className="py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              <p className="font-semibold text-sm">No physicians match the current filter selection.</p>
              <button
                onClick={handleResetFilters}
                className="mt-2 text-xs text-sky-600 font-semibold hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}

          {/* Modal: Add or Edit Doctor (Encapsulated Component) */}
          <DoctorModal
            isOpen={isModalOpen}
            doctor={editingDoctor}
            defaultShift={currentShift.id}
            onClose={() => {
              setIsModalOpen(false);
              setEditingDoctor(null);
            }}
            onSave={handleSaveDoctor}
          />

          {/* Modal: Delete Doctor Confirmation (Encapsulated Component) */}
          <DoctorDeleteModal
            doctor={deletingDoctor}
            isDeleting={isDeleting}
            onClose={() => setDeletingDoctor(null)}
            onConfirm={handleDeleteDoctor}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
