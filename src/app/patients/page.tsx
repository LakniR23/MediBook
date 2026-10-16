"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Plus,
  FilterX,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { getInitials } from "@/lib/formatters";
import {
  PatientMedicalModal,
  PatientDetailModel,
} from "@/components/PatientMedicalModal";
import {
  PatientRegisterModal,
  DoctorOptionItem,
} from "@/components/PatientRegisterModal";
import { PatientStatCards } from "@/components/PatientStatCards";

const PAGE_SIZE = 8;

export default function PatientsDirectoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [patients, setPatients] = useState<PatientDetailModel[]>([]);
  const [doctorsList, setDoctorsList] = useState<DoctorOptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBlood, setSelectedBlood] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedDetailPatient, setSelectedDetailPatient] =
    useState<PatientDetailModel | null>(null);

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

  // Protected route check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch data from database
  const fetchDbData = async () => {
    try {
      setIsLoading(true);
      const [patRes, docRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/doctors"),
      ]);

      if (patRes.ok) {
        const patData = await patRes.json();
        if (Array.isArray(patData)) {
          setPatients(patData);
        }
      }

      if (docRes.ok) {
        const docJson = await docRes.json();
        if (docJson.doctors) {
          setDoctorsList(docJson.doctors);
        }
      }
    } catch (err) {
      console.error("[PatientsDirectory] Failed to load data:", err);
      showToast("Error loading patients from database");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDbData();
  }, []);

  // Filter patients
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = patient.name.toLowerCase().includes(q);
        const matchesMrn = patient.mrn.toLowerCase().includes(q);
        const matchesPhone = patient.phone
          ? patient.phone.toLowerCase().includes(q)
          : false;
        const matchesEmail = patient.email
          ? patient.email.toLowerCase().includes(q)
          : false;
        const matchesAddress = patient.address
          ? patient.address.toLowerCase().includes(q)
          : false;
        if (
          !matchesName &&
          !matchesMrn &&
          !matchesPhone &&
          !matchesEmail &&
          !matchesAddress
        ) {
          return false;
        }
      }

      if (selectedBlood && patient.bloodGroup !== selectedBlood) return false;
      if (selectedStatus && patient.status !== selectedStatus) return false;
      if (
        selectedDoctor &&
        !patient.primaryDoctor
          .toLowerCase()
          .includes(selectedDoctor.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [patients, searchTerm, selectedBlood, selectedStatus, selectedDoctor]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPatients.length / PAGE_SIZE)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedPatients = filteredPatients.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedBlood("");
    setSelectedStatus("");
    setSelectedDoctor("");
    setCurrentPage(1);
    showToast("Filters reset to default view");
  };

  // Voice AI Action Listener (Siri / Alexa integration)
  useEffect(() => {
    const handleVoiceAction = (e: any) => {
      const action = e.detail;
      if (!action) return;

      if (action.intent === "OPEN_MODAL" && action.modalName === "new_patient") {
        setIsRegisterModalOpen(true);
      } else if (action.intent === "RESET_FILTERS") {
        handleResetFilters();
      } else if (action.intent === "FILTER_PATIENTS" || action.intent === "FILTER_APPOINTMENTS") {
        if (action.filters?.searchTerm) {
          setSearchTerm(action.filters.searchTerm);
          setCurrentPage(1);
        }
      }
    };

    window.addEventListener("medibook:voice-action", handleVoiceAction);
    return () => window.removeEventListener("medibook:voice-action", handleVoiceAction);
  }, []);

  const getStatusPill = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Active
          </span>
        );
      case "CHRONIC_CARE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            Chronic Care
          </span>
        );
      case "DISCHARGED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Discharged
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

  // Dynamic statistics
  const totalCount = patients.length;
  const activeCount = patients.filter((p) => p.status === "ACTIVE").length;
  const chronicCount = patients.filter(
    (p) => p.status === "CHRONIC_CARE"
  ).length;
  const dischargedCount = patients.filter(
    (p) => p.status === "DISCHARGED"
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
      <Header activePath="patients" />

      {/* Floating Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 pointer-events-none flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white shadow-xl ${
          isToastVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-24 opacity-0"
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
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Patients Directory
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage registered patients, Sri Lankan addresses, 10-digit
                contacts, and attending physicians.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Patient</span>
              </button>
            </div>
          </div>

          {/* 4 Dynamic Stat Cards */}
          <PatientStatCards
            totalCount={totalCount}
            activeCount={activeCount}
            chronicCount={chronicCount}
            dischargedCount={dischargedCount}
            isLoading={isLoading}
          />

          {/* Filter Toolbar */}
          <div className="w-full bg-white rounded-xl border border-slate-200 shadow-xs p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-4 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search name, MRN, phone, address..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <div className="relative">
                  <select
                    value={selectedBlood}
                    onChange={(e) => {
                      setSelectedBlood(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer border border-slate-200 transition-colors"
                  >
                    <option value="">All Blood Groups</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="md:col-span-3">
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer border border-slate-200 transition-colors"
                  >
                    <option value="">All Care Statuses</option>
                    <option value="ACTIVE">Active Care</option>
                    <option value="CHRONIC_CARE">Chronic Care</option>
                    <option value="DISCHARGED">Discharged</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="relative">
                  <select
                    value={selectedDoctor}
                    onChange={(e) => {
                      setSelectedDoctor(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer border border-slate-200 transition-colors"
                  >
                    <option value="">All Clinicians</option>
                    {doctorsList.map((doc) => (
                      <option key={doc.id} value={doc.name}>
                        {doc.name}
                      </option>
                    ))}
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

          {/* Patients Data Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Patient &amp; MRN</th>
                    <th className="py-3 px-4">Demographics</th>
                    <th className="py-3 px-4">Contact &amp; Address</th>
                    <th className="py-3 px-4">Attending Physician</th>
                    <th className="py-3 px-4">Care Status</th>
                    <th className="py-3 px-4 text-right">Medical Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Name & MRN */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {getInitials(patient.name)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block truncate">
                              {patient.name}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {patient.mrn}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Demographics */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {patient.age} yrs • {patient.gender}
                      </td>

                      {/* Contact & Sri Lankan Address */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-800 font-medium">
                          {patient.phone || "—"}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {patient.address ||
                            patient.email ||
                            "Western Province, Sri Lanka"}
                        </div>
                      </td>

                      {/* Attending Physician */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {patient.primaryDoctor}
                      </td>

                      {/* Care Status */}
                      <td className="py-3.5 px-4">
                        {getStatusPill(patient.status)}
                      </td>

                      {/* Medical Details Eye Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailPatient(patient)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 transition-colors shadow-2xs"
                          title="View clinical alerts, blood group & medical details"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-600" />
                          <span>Medical Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginatedPatients.length === 0 && (
              <div className="py-12 text-center text-slate-500 bg-white">
                <p className="font-semibold text-sm">
                  No patients match the current filter selection.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-2 text-xs text-sky-600 font-semibold hover:underline"
                >
                  Reset filters
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredPatients.length > PAGE_SIZE && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
                <span>
                  Showing {startIndex + 1}–
                  {Math.min(startIndex + PAGE_SIZE, filteredPatients.length)} of{" "}
                  {filteredPatients.length} patients
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={safeCurrentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-medium">
                    {safeCurrentPage} / {totalPages}
                  </span>
                  <button
                    disabled={safeCurrentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal: Register Patient (Encapsulated) */}
          <PatientRegisterModal
            isOpen={isRegisterModalOpen}
            doctors={doctorsList}
            onClose={() => setIsRegisterModalOpen(false)}
            onSuccess={(created) => {
              showToast(`Patient ${created.name} registered (${created.mrn})`);
              fetchDbData();
            }}
          />

          {/* Modal: Patient Medical Details (Encapsulated) */}
          <PatientMedicalModal
            patient={selectedDetailPatient}
            onClose={() => setSelectedDetailPatient(null)}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
