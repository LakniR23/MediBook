"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut, UserCircle } from "lucide-react";
import { getCurrentShift, ShiftInfo } from "@/lib/shifts";

interface HeaderProps {
  activePath?: "dashboard" | "appointments" | "patients" | "doctors" | "profile" | string;
}

export function Header({ activePath = "dashboard" }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [currentShift, setCurrentShift] = useState<ShiftInfo>(getCurrentShift());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentShift(getCurrentShift());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const userName = user?.displayName || "Dr. Nimal Perera";
  const userRole = user?.role || "Consultant Physician";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navLinks = [
    { id: "dashboard", label: "Dashboard", href: "/" },
    { id: "appointments", label: "Appointments", href: "/appointments" },
    { id: "patients", label: "Patients", href: "/patients" },
    { id: "doctors", label: "Doctors & Shifts", href: "/doctors" },
  ];

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-8">
          <Link
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-lg"
            href="/"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
              +
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                MediBook
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                Clinical Suite
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = activePath === link.id;
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? "bg-sky-50 text-sky-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Shift Status & User profile */}
        <div className="flex items-center gap-3">
          <Link
            href="/doctors"
            title="Current Clinical Shift • Auto-updating"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100/80 border border-sky-200/80 transition-colors shadow-2xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{currentShift.name}</span>
            <span className="text-slate-400 font-normal">({currentShift.timeRange})</span>
          </Link>

          {user ? (
            <>
              <Link
                href="/profile"
                title="View & Edit Profile"
                className={`flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition-colors ${
                  activePath === "profile" ? "ring-2 ring-sky-500/20 bg-sky-50/60" : ""
                }`}
              >
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 leading-tight">
                    {userName}
                  </span>
                  <span className="text-[11px] text-slate-500">{userRole}</span>
                </div>

                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold ring-1 ring-sky-200">
                  {initials}
                </div>
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto">
        {navLinks.map((link) => {
          const isActive = activePath === link.id;
          return (
            <Link
              key={link.id}
              href={link.href}
              className={`px-3 py-1 rounded-md text-xs whitespace-nowrap font-medium transition-colors ${
                isActive
                  ? "bg-sky-500 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/profile"
          className={`px-3 py-1 rounded-md text-xs whitespace-nowrap font-medium transition-colors ${
            activePath === "profile"
              ? "bg-sky-500 text-white font-semibold"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          Profile
        </Link>
      </div>
    </header>
  );
}
