"use client";

import React from "react";
import { Clock, Users, Activity, Sparkles } from "lucide-react";
import { ShiftInfo } from "@/lib/shifts";

interface DoctorStatCardsProps {
  currentShift: ShiftInfo;
  shiftInfo: {
    timeRemainingStr: string;
    progressPercent: number;
  };
  isLoading: boolean;
  activeShiftStaffCount: number;
  onDutyCount: number;
  onCallCount: number;
  totalDoctorsCount: number;
  activeShiftCaseload: number;
}

export function DoctorStatCards({
  currentShift,
  shiftInfo,
  isLoading,
  activeShiftStaffCount,
  onDutyCount,
  onCallCount,
  totalDoctorsCount,
  activeShiftCaseload,
}: DoctorStatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Card 1: Live Current Shift (Auto-changing) */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-white to-sky-50/50 border border-sky-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            Current Shift (Auto)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        </div>
        <div>
          <div className="text-xl font-bold tracking-tight text-slate-900">
            {currentShift.name}
          </div>
          <div className="text-xs text-sky-700 font-medium mt-0.5">
            {currentShift.timeRange}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-sky-100 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Shift Progress</span>
            <span className="font-semibold text-slate-700">{shiftInfo.timeRemainingStr}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-1000"
              style={{ width: `${shiftInfo.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card 2: Current Shift Staff Coverage */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {currentShift.id} Staff
          </span>
          <Users className="w-4 h-4 text-sky-600" />
        </div>
        <div className="my-1">
          <span className="text-3xl font-bold tracking-tight text-slate-900">
            {isLoading ? "..." : activeShiftStaffCount}
          </span>
        </div>
        <span className="text-xs text-sky-600 font-semibold">
          Covering active shift
        </span>
      </div>

      {/* Card 3: Active On Duty */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active On Duty
          </span>
          <Activity className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="my-1">
          <span className="text-3xl font-bold tracking-tight text-emerald-600">
            {isLoading ? "..." : onDutyCount}
          </span>
        </div>
        <span className="text-xs text-slate-500">
          <strong className="text-amber-600 font-semibold">{onCallCount}</strong> on standby call
        </span>
      </div>

      {/* Card 4: Total Rostered Staff */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Staff
          </span>
          <Sparkles className="w-4 h-4 text-slate-400" />
        </div>
        <div className="my-1">
          <span className="text-3xl font-bold tracking-tight text-slate-900">
            {isLoading ? "..." : totalDoctorsCount}
          </span>
        </div>
        <span className="text-xs text-slate-500">
          Across 4 clinical shifts
        </span>
      </div>

      {/* Card 5: Active Shift Caseload */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Shift Caseload
          </span>
          <span className="text-xs font-bold text-sky-600">Queue</span>
        </div>
        <div className="my-1">
          <span className="text-3xl font-bold tracking-tight text-sky-600">
            {isLoading ? "..." : activeShiftCaseload}
          </span>
        </div>
        <span className="text-xs text-slate-500">
          Patients in shift queue
        </span>
      </div>
    </div>
  );
}
