"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Plus, ArrowRight } from "lucide-react";
import { getCurrentShift, ShiftInfo } from "@/lib/shifts";

interface ApiAppointment {
  id: string;
  patientName: string;
  patientContact?: string;
  doctorId: string;
  doctor?: {
    id: string;
    name: string;
    specialty: string;
  };
  appointmentDate: string;
  appointmentType: string;
  status: string;
  notes?: string;
}

interface ApiDoctor {
  id: string;
  name: string;
  specialty: string;
  _count?: {
    appointments: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [currentDateStr, setCurrentDateStr] = useState("Today, Oct 24, 2026");
  const [currentShift, setCurrentShift] = useState<ShiftInfo>(getCurrentShift());
  const [syncSeconds, setSyncSeconds] = useState(15);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Protected route: Redirect to /login if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch real data from database
  const fetchData = async () => {
    try {
      const [apptRes, docRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/doctors"),
      ]);

      if (apptRes.ok) {
        const apptData = await apptRes.json();
        if (apptData.appointments) {
          setAppointments(apptData.appointments);
        }
      }

      if (docRes.ok) {
        const docData = await docRes.json();
        if (docData.doctors) {
          setDoctors(docData.doctors);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard data from database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const dateFormatted = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    setCurrentDateStr(`Today, ${dateFormatted}`);
    fetchData();

    const interval = setInterval(() => {
      setCurrentShift(getCurrentShift());
      setSyncSeconds((prev) => {
        if (prev <= 1) {
          fetchData();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Compute live statistics from DB appointments
  const totalEncounters = appointments.length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const scheduledCount = appointments.filter((a) => a.status === "SCHEDULED" || a.status === "CONFIRMED").length;
  const cancelledCount = appointments.filter((a) => a.status === "CANCELLED").length;
  const noShowCount = appointments.filter((a) => a.status === "NO_SHOW").length;

  const now = new Date();
  const todayDateStr = now.toISOString().split("T")[0];

  const todaySchedule = appointments.filter((a) => {
    return a.appointmentDate && a.appointmentDate.startsWith(todayDateStr);
  });

  const displaySchedule = todaySchedule.length > 0 ? todaySchedule : appointments.slice(0, 5);

  const formatTimeStr = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return "09:00 AM";
    }
  };

  const formatDateStr = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return iso;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "PT";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
      case "CONFIRMED":
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

  // Status donut math
  const totalForChart = Math.max(1, totalEncounters);
  const scheduledCirc = (scheduledCount / totalForChart) * 389.5;
  const completedCirc = (completedCount / totalForChart) * 389.5;
  const cancelledCirc = (cancelledCount / totalForChart) * 389.5;
  const noShowCirc = (noShowCount / totalForChart) * 389.5;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
      <Header activePath="dashboard" />

      <main className="w-full pt-20 pb-12 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Top Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Clinic Overview
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Real-time patient appointments, clinical schedule, and daily practice metrics.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-start lg:justify-end flex-shrink-0">
              <div className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium shadow-xs whitespace-nowrap flex-shrink-0">
                {currentDateStr}
              </div>

              <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium shadow-xs whitespace-nowrap flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto-sync {syncSeconds}s</span>
              </div>

              <Link
                href="/appointments"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Appointment</span>
              </Link>
            </div>
          </div>

          {/* 5 Clean Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Encounters
              </span>
              <div className="my-3">
                <span className="text-3xl font-bold tracking-tight text-slate-900">{totalEncounters}</span>
              </div>
              <div className="text-xs text-slate-500">
                <span className="text-sky-600 font-semibold">+8.4%</span> vs last week
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Scheduled
              </span>
              <div className="my-3">
                <span className="text-3xl font-bold tracking-tight text-slate-900">{scheduledCount}</span>
              </div>
              <div className="text-xs text-slate-500">
                <span className="text-slate-800 font-semibold">Active queue</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Completed
              </span>
              <div className="my-3">
                <span className="text-3xl font-bold tracking-tight text-emerald-600">{completedCount}</span>
              </div>
              <div className="text-xs text-slate-500">
                <span className="text-emerald-600 font-semibold">Discharged</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cancelled / No-Show
              </span>
              <div className="my-3">
                <span className="text-3xl font-bold tracking-tight text-red-600">
                  {cancelledCount + noShowCount}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                <span className="text-red-600 font-semibold">
                  {totalEncounters > 0
                    ? Math.round(((cancelledCount + noShowCount) / totalEncounters) * 100)
                    : 0}%
                </span>{" "}
                attrition rate
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Clinicians
              </span>
              <div className="my-3">
                <span className="text-3xl font-bold tracking-tight text-slate-900">{doctors.length}</span>
              </div>
              <div className="text-xs text-slate-500">
                <span className="text-sky-600 font-semibold">On roster</span>
              </div>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols */}
            <div className="lg:col-span-8 space-y-6">
              {/* Card: Today's Schedule */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Today&apos;s Schedule</h2>
                    <p className="text-xs text-slate-500">
                      Chronological agenda for active {currentShift.name} ({currentShift.timeRange})
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                    {displaySchedule.length} appointments
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {displaySchedule.map((item) => (
                    <div
                      key={item.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-lg px-2 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Time without icon */}
                        <div className="w-16 py-1 text-center rounded-lg bg-slate-100 text-slate-900 text-xs font-bold leading-tight flex-shrink-0">
                          <div>{formatTimeStr(item.appointmentDate)}</div>
                        </div>

                        <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {getInitials(item.patientName)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 truncate">
                              {item.patientName}
                            </span>
                            {item.patientContact && (
                              <span className="text-xs text-slate-500">{item.patientContact}</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            <span className="font-medium text-slate-700">
                              {item.doctor?.name || "Attending Physician"}
                            </span>
                            <span className="mx-1.5 text-slate-300">•</span>
                            <span>{item.appointmentType}</span>
                          </div>
                        </div>
                      </div>

                      <div className="self-end sm:self-center flex-shrink-0">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  ))}

                  {displaySchedule.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-500">
                      No appointments currently scheduled.
                    </div>
                  )}
                </div>
              </div>

              {/* Card: Upcoming Consultations */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Upcoming Consultations</h2>
                    <p className="text-xs text-slate-500">Confirmed patient consultations from database</p>
                  </div>
                  <Link
                    href="/appointments"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-3">Patient</th>
                        <th className="py-2.5 px-3">Physician</th>
                        <th className="py-2.5 px-3">Date &amp; Time</th>
                        <th className="py-2.5 px-3">Encounter</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {appointments.slice(0, 6).map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{row.patientName}</div>
                            {row.patientContact && (
                              <div className="text-[11px] text-slate-500">{row.patientContact}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700">
                            {row.doctor?.name || "Dr. Silva"}
                          </td>
                          {/* Date & Time with NO icon */}
                          <td className="py-3 px-3 text-slate-600">
                            <div className="font-medium text-slate-800">
                              {formatDateStr(row.appointmentDate)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {formatTimeStr(row.appointmentDate)}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {row.appointmentType}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {getStatusBadge(row.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right 4 Cols */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: Status Distribution */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Status Distribution</h3>
                  <p className="text-xs text-slate-500">{totalEncounters} cumulative patient encounters</p>
                </div>

                {/* SVG Donut Chart */}
                <div className="relative flex items-center justify-center py-2">
                  <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                    <circle
                      className="text-slate-100 stroke-current"
                      cx="80"
                      cy="80"
                      fill="transparent"
                      r="62"
                      strokeWidth="14"
                    />
                    {/* Scheduled */}
                    <circle
                      className="text-sky-500 stroke-current"
                      cx="80"
                      cy="80"
                      fill="transparent"
                      r="62"
                      strokeDasharray={`${scheduledCirc} 389.5`}
                      strokeDashoffset="0"
                      strokeWidth="14"
                    />
                    {/* Completed */}
                    <circle
                      className="text-emerald-500 stroke-current"
                      cx="80"
                      cy="80"
                      fill="transparent"
                      r="62"
                      strokeDasharray={`${completedCirc} 389.5`}
                      strokeDashoffset={String(-scheduledCirc)}
                      strokeWidth="14"
                    />
                    {/* Cancelled */}
                    <circle
                      className="text-red-500 stroke-current"
                      cx="80"
                      cy="80"
                      fill="transparent"
                      r="62"
                      strokeDasharray={`${cancelledCirc} 389.5`}
                      strokeDashoffset={String(-(scheduledCirc + completedCirc))}
                      strokeWidth="14"
                    />
                    {/* No Show */}
                    <circle
                      className="text-slate-400 stroke-current"
                      cx="80"
                      cy="80"
                      fill="transparent"
                      r="62"
                      strokeDasharray={`${noShowCirc} 389.5`}
                      strokeDashoffset={String(-(scheduledCirc + completedCirc + cancelledCirc))}
                      strokeWidth="14"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-900">{totalEncounters}</span>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                      Total
                    </span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      <span className="text-slate-700 font-medium">Scheduled</span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {scheduledCount} ({Math.round((scheduledCount / totalForChart) * 100)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-700 font-medium">Completed</span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {completedCount} ({Math.round((completedCount / totalForChart) * 100)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="text-slate-700 font-medium">Cancelled</span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {cancelledCount} ({Math.round((cancelledCount / totalForChart) * 100)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span className="text-slate-700 font-medium">No-Show</span>
                    </div>
                    <span className="font-semibold text-slate-900">
                      {noShowCount} ({Math.round((noShowCount / totalForChart) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Physician Workload */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Physician Caseload</h3>
                  <p className="text-xs text-slate-500">Live active caseload from database</p>
                </div>

                <div className="space-y-3 pt-1">
                  {doctors.slice(0, 5).map((doc) => {
                    const count = doc._count?.appointments ?? 0;
                    const max = 8;
                    const pct = Math.min(100, Math.round((count / max) * 100));

                    return (
                      <div key={doc.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{doc.name}</span>
                          <span className="font-semibold text-slate-600">{count} patients</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-sky-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/70 rounded-lg p-2.5">
                  Standard physician capacity: 8 encounters / shift.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
