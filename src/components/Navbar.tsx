"use client";

import React from "react";
import Link from "next/link";
import { Plus, Activity, Sparkles, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onNewAppointment: () => void;
  aiConnected: boolean;
}

export function Navbar({ onNewAppointment, aiConnected }: NavbarProps) {
  const { user, logout, isFirebaseConfigured } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition">
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
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* AI Status Badge */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
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
            <span>{aiConnected ? "AI Service" : "Local Engine"}</span>
          </div>

          {/* Swagger Link */}
          <Link
            href="/docs"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            title="Open Interactive Swagger UI documentation"
          >
            <span>Swagger Docs</span>
          </Link>

          {/* New Appointment Button */}
          <button
            onClick={onNewAppointment}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium text-xs sm:text-sm shadow-sm shadow-sky-600/30 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Appointment</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* User Auth Info & Controls */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user.displayName || "Staff"}
                </span>
                <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                  {user.email || user.phoneNumber}
                </span>
              </div>

              <div
                className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center border border-sky-200"
                title={user.email || user.phoneNumber || "User"}
              >
                {user.displayName ? user.displayName[0].toUpperCase() : "U"}
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link
                href="/login"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition border border-sky-200"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
