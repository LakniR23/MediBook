"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export interface SidebarProps {
  activePath?: "dashboard" | "appointments" | "patients" | "doctors" | string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  activePath = "dashboard",
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const userName = user?.displayName || "Kasun Perera";
  const userRole = "Operational Lead";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "dashboard",
      href: "/",
      badge: null,
    },
    {
      id: "appointments",
      label: "Appointments",
      icon: "calendar_month",
      href: "/appointments",
      badge: "24",
    },
    {
      id: "patients",
      label: "Patients Directory",
      icon: "group",
      href: "/appointments",
      badge: null,
    },
    {
      id: "doctors",
      label: "Doctors & Shifts",
      icon: "stethoscope",
      href: "/",
      badge: "5 Active",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-on-surface/30 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Persistent Desktop / Slide-over Mobile Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 flex flex-col bg-surface-container-lowest border-r border-surface-container shadow-xs transition-transform duration-200 ease-in-out ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-surface-container">
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-xs">
              <span className="material-symbols-outlined text-[20px]">local_hospital</span>
            </div>
            <div className="flex flex-col">
              <span className="font-title-sm text-title-sm tracking-tight text-on-surface font-bold leading-tight">
                MediBook
              </span>
              <span className="text-[11px] text-outline font-medium tracking-wide">
                Clinical Suite
              </span>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-outline hover:text-on-surface hover:bg-surface-container rounded-lg focus:outline-none"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col justify-between">
          <div className="flex flex-col gap-1">
            <span className="px-3 py-1.5 text-[10px] font-bold text-outline uppercase tracking-wider">
              Clinical Operations
            </span>
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => {
                const isActive = activePath === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isActive
                        ? "bg-primary-container text-on-primary-container font-semibold shadow-xs"
                        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`material-symbols-outlined text-[19px] ${
                          isActive ? "text-on-primary-container" : "text-outline"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-primary-fixed text-on-primary-fixed"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Operational Shift Telemetry Card */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Shift Telemetry Active</span>
            </div>
            <p className="text-[11px] text-outline leading-snug">
              Desk 02 • 5 Doctors rostered on active shift.
            </p>
          </div>
        </div>

        {/* User Account Footer */}
        <div className="p-3 border-t border-surface-container bg-surface-container-lowest">
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-container transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed text-xs font-bold ring-1 ring-surface-container flex-shrink-0">
              <span>{initials}</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-on-surface truncate leading-tight">
                {userName}
              </span>
              <span className="text-[10px] text-outline truncate">{userRole}</span>
            </div>
            {user && (
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="p-1 text-outline hover:text-error hover:bg-error-container/40 rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
