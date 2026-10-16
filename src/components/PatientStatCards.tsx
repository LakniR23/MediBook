"use client";

import React from "react";
import { Users, Activity, HeartPulse, UserCheck } from "lucide-react";

interface PatientStatCardsProps {
  totalCount: number;
  activeCount: number;
  chronicCount: number;
  dischargedCount: number;
  isLoading: boolean;
}

export function PatientStatCards({
  totalCount,
  activeCount,
  chronicCount,
  dischargedCount,
  isLoading,
}: PatientStatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Registered */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Registered
          </span>
          <Users className="w-4 h-4 text-sky-600" />
        </div>
        <div className="my-1">
          <span className="text-3xl font-bold tracking-tight text-slate-900">
            {isLoading ? "..." : totalCount}
          </span>
        </div>
        <span className="text-xs text-sky-600 font-semibold">Active in Sri Lanka</span>
      </div>

      {/* Routine / Active Care */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Care
          </span>
          <Activity className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="my-1">
          <span className="text-3xl font-bold tracking-tight text-emerald-600">
            {isLoading ? "..." : activeCount}
          </span>
        </div>
        <span className="text-xs text-slate-500">Regular clinic consultations</span>
      </div>

      {/* Chronic Care Management */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Chronic Care
          </span>
          <HeartPulse className="w-4 h-4 text-amber-600" />
        </div>
        <div className="my-1">
          <span className="text-3xl font-bold tracking-tight text-amber-600">
            {isLoading ? "..." : chronicCount}
          </span>
        </div>
        <span className="text-xs text-slate-500">Active monitoring &amp; alerts</span>
      </div>

      {/* Discharged / Inactive */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Discharged
          </span>
          <UserCheck className="w-4 h-4 text-slate-400" />
        </div>
        <div className="my-1">
          <span className="text-3xl font-bold tracking-tight text-slate-700">
            {isLoading ? "..." : dischargedCount}
          </span>
        </div>
        <span className="text-xs text-slate-500">Care cycle concluded</span>
      </div>
    </div>
  );
}
