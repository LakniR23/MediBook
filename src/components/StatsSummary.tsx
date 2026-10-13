"use client";

import React from "react";
import { Calendar, Clock, CheckCircle2, XCircle, Award } from "lucide-react";
import { AppointmentStats } from "@/lib/types";

interface StatsSummaryProps {
  stats: AppointmentStats | null;
  onFilterStatus?: (status: string) => void;
}

export function StatsSummary({ stats, onFilterStatus }: StatsSummaryProps) {
  if (!stats) return null;

  const items = [
    {
      label: "Total Scheduled",
      value: stats.total,
      icon: <Calendar className="w-5 h-5 text-sky-600" />,
      bg: "bg-sky-50 border-sky-100",
      statusKey: "all",
    },
    {
      label: "Appointments Today",
      value: stats.todayCount,
      icon: <Clock className="w-5 h-5 text-indigo-600" />,
      bg: "bg-indigo-50 border-indigo-100",
      statusKey: "today",
    },
    {
      label: "Confirmed",
      value: stats.confirmedCount,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      bg: "bg-emerald-50 border-emerald-100",
      statusKey: "CONFIRMED",
    },
    {
      label: "Cancelled",
      value: stats.cancelledCount,
      icon: <XCircle className="w-5 h-5 text-rose-600" />,
      bg: "bg-rose-50 border-rose-100",
      statusKey: "CANCELLED",
    },
    {
      label: "Completed",
      value: stats.completedCount,
      icon: <Award className="w-5 h-5 text-teal-600" />,
      bg: "bg-teal-50 border-teal-100",
      statusKey: "COMPLETED",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {items.map((item, idx) => (
        <button
          key={idx}
          onClick={() => onFilterStatus && onFilterStatus(item.statusKey)}
          className={`flex flex-col p-4 rounded-xl border text-left transition hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] ${item.bg}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {item.label}
            </span>
            {item.icon}
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {item.value}
          </span>
        </button>
      ))}
    </div>
  );
}
