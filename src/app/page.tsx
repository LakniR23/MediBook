"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { StatsSummary } from "@/components/StatsSummary";
import { SearchFilterBar } from "@/components/SearchFilterBar";
import { AppointmentTable } from "@/components/AppointmentTable";
import { AppointmentModal } from "@/components/AppointmentModal";
import { DeleteModal } from "@/components/DeleteModal";
import { Toast, ToastProps } from "@/components/Toast";
import {
  Appointment,
  Doctor,
  AppointmentStats,
  AppointmentStatus,
  ParsedSearchFilters,
} from "@/lib/types";
import { startOfDay, endOfDay } from "date-fns";

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [aiConnected, setAiConnected] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchExplanation, setSearchExplanation] = useState<string | null>(null);
  const [searchSource, setSearchSource] = useState<"ai-service" | "local-fallback" | "direct" | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);

  // Notifications
  const [toasts, setToasts] = useState<Omit<ToastProps, "onClose">[]>([]);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch doctors on mount
  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await fetch("/api/doctors");
        const data = await res.json();
        if (data.success) {
          setDoctors(data.doctors);
        }
      } catch (err) {
        console.error("Failed to load doctors", err);
      }
    }
    loadDoctors();
  }, []);

  // Check AI service status
  useEffect(() => {
    async function checkAiHealth() {
      try {
        const res = await fetch("/api/parse-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "healthcheck", referenceDate: new Date().toISOString() }),
        });
        const data = await res.json();
        setAiConnected(data.source === "ai-service");
      } catch {
        setAiConnected(false);
      }
    }
    checkAiHealth();
  }, []);

  // Fetch appointments based on active parameters
  const loadAppointments = useCallback(
    async (overrideParams?: {
      search?: string;
      doctorId?: string;
      doctorName?: string;
      status?: string;
      appointmentType?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();

        const searchVal = overrideParams?.search ?? searchQuery;
        const doctorIdVal = overrideParams?.doctorId ?? selectedDoctor;
        const statusVal = overrideParams?.status ?? selectedStatus;
        const typeVal = overrideParams?.appointmentType ?? selectedType;
        const startVal = overrideParams?.startDate ?? startDate;
        const endVal = overrideParams?.endDate ?? endDate;

        if (searchVal) params.set("search", searchVal);
        if (doctorIdVal && doctorIdVal !== "all") params.set("doctorId", doctorIdVal);
        if (overrideParams?.doctorName) params.set("doctorName", overrideParams.doctorName);
        if (statusVal && statusVal !== "all") params.set("status", statusVal);
        if (typeVal && typeVal !== "all") params.set("appointmentType", typeVal);
        if (startVal) params.set("startDate", startVal);
        if (endVal) params.set("endDate", endVal);

        const res = await fetch(`/api/appointments?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          setAppointments(data.appointments);
          setStats(data.stats);
        } else {
          addToast("error", data.error || "Failed to load appointments");
        }
      } catch (err: any) {
        addToast("error", "Error connecting to server");
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, selectedDoctor, selectedStatus, selectedType, startDate, endDate]
  );

  // Initial load
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Handle Natural Language Search via AI / Fallback parser
  const handleNaturalLanguageSearch = async (query: string) => {
    if (!query.trim()) {
      handleResetFilters();
      return;
    }

    try {
      setIsSearching(true);
      const res = await fetch("/api/parse-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          referenceDate: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to parse query");
      }

      const filters: ParsedSearchFilters = data.filters || {};
      setSearchExplanation(data.explanation || null);
      setSearchSource(data.source);
      if (data.source === "ai-service") {
        setAiConnected(true);
      }

      // Match extracted doctor to local doctor ID if possible
      let matchedDoctorId = "all";
      if (filters.doctorName) {
        const found = doctors.find((d) =>
          d.name.toLowerCase().includes(filters.doctorName!.toLowerCase().replace(/^dr\.?\s*/i, ""))
        );
        if (found) {
          matchedDoctorId = found.id;
        }
      }

      // Sync UI filter inputs to parsed values
      if (filters.status) setSelectedStatus(filters.status);
      if (filters.appointmentType) setSelectedType(filters.appointmentType);
      if (matchedDoctorId !== "all") setSelectedDoctor(matchedDoctorId);
      if (filters.startDate) setStartDate(filters.startDate.split("T")[0]);
      if (filters.endDate) setEndDate(filters.endDate.split("T")[0]);

      // Execute query with parsed filters
      await loadAppointments({
        search: filters.patientName || filters.rawSearchTerm || undefined,
        doctorId: matchedDoctorId !== "all" ? matchedDoctorId : undefined,
        doctorName: matchedDoctorId === "all" ? filters.doctorName || undefined : undefined,
        status: filters.status || undefined,
        appointmentType: filters.appointmentType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });

      addToast(
        "info",
        `Parsed via ${data.source === "ai-service" ? "AI Model" : "Local Engine"}: ${data.explanation}`
      );
    } catch (err: any) {
      addToast("error", err.message || "Search failed");
      // Fall back to direct text search
      loadAppointments({ search: query });
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDoctor("all");
    setSelectedStatus("all");
    setSelectedType("all");
    setStartDate("");
    setEndDate("");
    setSearchExplanation(null);
    setSearchSource(null);
    loadAppointments({
      search: "",
      doctorId: "all",
      status: "all",
      appointmentType: "all",
      startDate: "",
      endDate: "",
    });
  };

  // Quick stats card filter click
  const handleFilterStatusFromStats = (statusKey: string) => {
    if (statusKey === "all") {
      handleResetFilters();
    } else if (statusKey === "today") {
      const now = new Date();
      const start = startOfDay(now).toISOString();
      const end = endOfDay(now).toISOString();
      setStartDate(start.split("T")[0]);
      setEndDate(end.split("T")[0]);
      loadAppointments({ startDate: start, endDate: end });
    } else {
      setSelectedStatus(statusKey);
      loadAppointments({ status: statusKey });
    }
  };

  // Create or Update Appointment
  const handleSaveAppointment = async (payload: any): Promise<boolean> => {
    try {
      const isEditing = Boolean(editingAppointment);
      const url = isEditing
        ? `/api/appointments/${editingAppointment!.id}`
        : "/api/appointments";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save appointment");
      }

      addToast(
        "success",
        isEditing
          ? "Appointment updated successfully."
          : "New appointment scheduled."
      );
      loadAppointments();
      return true;
    } catch (err: any) {
      addToast("error", err.message || "Failed to save appointment");
      return false;
    }
  };

  // Delete Appointment
  const handleDeleteAppointment = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete appointment");
      }

      addToast("success", "Appointment deleted successfully.");
      loadAppointments();
      return true;
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete appointment");
      return false;
    }
  };

  // Quick status update
  const handleQuickStatusChange = async (
    id: string,
    newStatus: AppointmentStatus
  ) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update status");
      }
      addToast("success", `Appointment status updated to ${newStatus}.`);
      loadAppointments();
    } catch (err: any) {
      addToast("error", err.message || "Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast Notification Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              type={toast.type}
              message={toast.message}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <Navbar
        onNewAppointment={() => {
          setEditingAppointment(null);
          setIsModalOpen(true);
        }}
        aiConnected={aiConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI / Stats Summary Cards */}
        <StatsSummary
          stats={stats}
          onFilterStatus={handleFilterStatusFromStats}
        />

        {/* Natural Language Search & Filter Bar */}
        <SearchFilterBar
          doctors={doctors}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleNaturalLanguageSearch}
          selectedDoctor={selectedDoctor}
          onDoctorChange={(doc) => {
            setSelectedDoctor(doc);
            loadAppointments({ doctorId: doc });
          }}
          selectedStatus={selectedStatus}
          onStatusChange={(st) => {
            setSelectedStatus(st);
            loadAppointments({ status: st });
          }}
          selectedType={selectedType}
          onTypeChange={(tp) => {
            setSelectedType(tp);
            loadAppointments({ appointmentType: tp });
          }}
          startDate={startDate}
          onStartDateChange={(d) => {
            setStartDate(d);
            loadAppointments({ startDate: d ? new Date(d).toISOString() : "" });
          }}
          endDate={endDate}
          onEndDateChange={(d) => {
            setEndDate(d);
            loadAppointments({ endDate: d ? new Date(d).toISOString() : "" });
          }}
          onResetFilters={handleResetFilters}
          isSearching={isSearching}
          searchExplanation={searchExplanation}
          searchSource={searchSource}
        />

        {/* Appointment Table / Cards */}
        <AppointmentTable
          appointments={appointments}
          isLoading={isLoading}
          onEdit={(appt) => {
            setEditingAppointment(appt);
            setIsModalOpen(true);
          }}
          onDelete={(appt) => {
            setDeletingAppointment(appt);
          }}
          onStatusChange={handleQuickStatusChange}
        />
      </main>

      {/* Create / Edit Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAppointment(null);
        }}
        onSave={handleSaveAppointment}
        doctors={doctors}
        initialData={editingAppointment}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={Boolean(deletingAppointment)}
        appointment={deletingAppointment}
        onClose={() => setDeletingAppointment(null)}
        onConfirm={handleDeleteAppointment}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          MediBook Appointment Management • Next.js TypeScript Core with FastAPI AI Query Parser
        </div>
      </footer>
    </div>
  );
}
