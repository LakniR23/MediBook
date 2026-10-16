"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { getInitials } from "@/lib/formatters";

export interface PatientDetailModel {
  id: string;
  mrn: string;
  name: string;
  age: number;
  gender: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  bloodGroup: string;
  primaryDoctor: string;
  status: "ACTIVE" | "CHRONIC_CARE" | "DISCHARGED" | string;
  alertNote?: string | null;
}

interface PatientMedicalModalProps {
  patient: PatientDetailModel | null;
  onClose: () => void;
}

export function PatientMedicalModal({ patient, onClose }: PatientMedicalModalProps) {
  if (!patient) return null;

  const getStatusPill = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        );
      case "CHRONIC_CARE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Chronic Care
          </span>
        );
      case "DISCHARGED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Discharged
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 my-auto border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-base shadow-xs">
              {getInitials(patient.name)}
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 leading-tight">
                {patient.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs text-slate-500 font-semibold">
                  {patient.mrn}
                </span>
                <span>•</span>
                {getStatusPill(patient.status)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          {/* Prominent Clinical Alerts Banner */}
          {patient.alertNote ? (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  Clinical Alert / Adverse Reaction
                </span>
                <p className="text-xs font-semibold text-rose-900 mt-0.5">
                  {patient.alertNote}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>No known adverse allergies or critical clinical alerts recorded.</span>
            </div>
          )}

          {/* Core Medical Profile Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="text-[11px] text-slate-500 font-semibold uppercase block">Demographics</span>
              <span className="font-semibold text-slate-800 text-sm">
                {patient.age} yrs • {patient.gender}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-semibold uppercase block">Blood Profile</span>
              <div className="mt-0.5">
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-sky-700 font-mono font-bold text-xs">
                  {patient.bloodGroup}
                </span>
              </div>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-200/60">
              <span className="text-[11px] text-slate-500 font-semibold uppercase block">Attending Physician</span>
              <span className="font-semibold text-slate-800">
                {patient.primaryDoctor}
              </span>
            </div>
          </div>

          {/* Contact & Sri Lankan Location */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                10-Digit Mobile:
              </span>
              <span className="font-mono font-bold text-slate-900">
                {patient.phone || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address:
              </span>
              <span className="font-semibold text-slate-800">
                {patient.email || "—"}
              </span>
            </div>
            <div className="flex items-start justify-between py-1">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium flex-shrink-0">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                Sri Lankan Address:
              </span>
              <span className="font-medium text-slate-800 text-right max-w-[240px]">
                {patient.address || "Western Province, Sri Lanka"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
          <Link
            href="/appointments"
            className="inline-flex items-center gap-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Schedule Appointment</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
