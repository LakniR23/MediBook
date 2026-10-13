"use client";

import React from "react";
import { Plus, Calendar, Activity, Sparkles } from "lucide-react";

interface NavbarProps {
  onNewAppointment: () => void;
  aiConnected: boolean;
}

export function Navbar({ onNewAppointment, aiConnected }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Activity className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Medi<span className="text-sky-600">Book</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                Clinic Ops
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Clinical Appointment & Schedule Management
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* AI Status Badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              aiConnected
                ? "bg-teal-50 text-teal-700 border-teal-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
            title={
              aiConnected
                ? "FastAPI Natural Language Service is active"
                : "Running in local resilient parsing mode"
            }
          >
            <Sparkles
              className={`w-3.5 h-3.5 ${
                aiConnected ? "text-teal-600 animate-pulse" : "text-slate-400"
              }`}
            />
            <span>{aiConnected ? "AI Service Connected" : "Local Engine"}</span>
          </div>

          {/* New Appointment Button */}
          <button
            onClick={onNewAppointment}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium text-sm shadow-sm shadow-sky-600/30 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>
    </header>
  );
}
