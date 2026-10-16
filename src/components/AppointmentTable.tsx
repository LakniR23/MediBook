"use client";

import React from "react";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Phone,
} from "lucide-react";
import { Appointment, AppointmentStatus, AppointmentType } from "@/lib/types";
import { formatDateTime, formatDateOnly, formatTimeOnly } from "@/lib/date-utils";

interface AppointmentTableProps {
  appointments: Appointment[];
  isLoading: boolean;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
  onStatusChange: (id: string, newStatus: AppointmentStatus) => void;
}

export function AppointmentTable({
  appointments,
  isLoading,
  onEdit,
  onDelete,
  onStatusChange,
}: AppointmentTableProps) {
  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Confirmed
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            Scheduled
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
            Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Cancelled
          </span>
        );
      case "NO_SHOW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            No-Show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  const getTypeBadge = (type: AppointmentType) => {
    const labels: Record<AppointmentType, string> = {
      CHECKUP: "Checkup",
      CONSULTATION: "Consultation",
      FOLLOW_UP: "Follow-Up",
      ROUTINE_EXAM: "Routine Exam",
      EMERGENCY: "Emergency",
      SPECIALIST_VISIT: "Specialist Visit",
    };
    return (
      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {labels[type] || type}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="inline-block w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-slate-500 font-medium text-sm">
          Loading appointments...
        </p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          No appointments found
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          No appointments match your active search and filter criteria. Try clearing filters or creating a new appointment.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-6">Patient</th>
              <th className="py-3.5 px-6">Date & Time</th>
              <th className="py-3.5 px-6">Doctor</th>
              <th className="py-3.5 px-6">Type</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {appointments.map((appt) => (
              <tr
                key={appt.id}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Patient Name & Contact */}
                <td className="py-4 px-6">
                  <div className="font-semibold text-slate-900">
                    {appt.patientName}
                  </div>
                  {appt.patientContact && (
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{appt.patientContact}</span>
                    </div>
                  )}
                </td>

                {/* Date & Time */}
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="font-medium text-slate-900">
                    {formatDateOnly(appt.appointmentDate)}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {formatTimeOnly(appt.appointmentDate)}
                  </div>
                </td>

                {/* Doctor */}
                <td className="py-4 px-6">
                  <div className="font-medium text-slate-900">
                    {appt.doctor?.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {appt.doctor?.specialty}
                  </div>
                </td>

                {/* Appointment Type */}
                <td className="py-4 px-6 whitespace-nowrap">
                  {getTypeBadge(appt.appointmentType)}
                </td>

                {/* Status */}
                <td className="py-4 px-6 whitespace-nowrap">
                  {getStatusBadge(appt.status)}
                </td>

                {/* Actions */}
                <td className="py-4 px-6 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {appt.status !== "CONFIRMED" && appt.status !== "COMPLETED" && (
                      <button
                        onClick={() => onStatusChange(appt.id, "CONFIRMED")}
                        title="Mark Confirmed"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {appt.status !== "CANCELLED" && (
                      <button
                        onClick={() => onStatusChange(appt.id, "CANCELLED")}
                        title="Mark Cancelled"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(appt)}
                      title="Edit appointment"
                      className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(appt)}
                      title="Delete appointment"
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile / Tablet Responsive Cards */}
      <div className="lg:hidden divide-y divide-slate-100">
        {appointments.map((appt) => (
          <div key={appt.id} className="p-4 hover:bg-slate-50/70 transition">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="font-semibold text-slate-900 text-base">
                  {appt.patientName}
                </h4>
                {appt.patientContact && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{appt.patientContact}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {getStatusBadge(appt.status)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 my-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Date & Time
                </span>
                <span className="font-medium text-slate-800">
                  {formatDateTime(appt.appointmentDate)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Doctor
                </span>
                <span className="font-medium text-slate-800">
                  {appt.doctor?.name}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Type
                </span>
                <span className="mt-0.5 inline-block">
                  {getTypeBadge(appt.appointmentType)}
                </span>
              </div>
              {appt.notes && (
                <div className="col-span-2 text-slate-500 italic">
                  Note: {appt.notes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                onClick={() => onEdit(appt)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => onDelete(appt)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
