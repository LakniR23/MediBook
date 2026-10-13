"use client";

import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Appointment } from "@/lib/types";
import { formatDateTime } from "@/lib/date-utils";

interface DeleteModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<boolean>;
}

export function DeleteModal({
  isOpen,
  appointment,
  onClose,
  onConfirm,
}: DeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      const success = await onConfirm(appointment.id);
      if (success) {
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Delete Appointment?
              </h3>
              <p className="text-xs text-slate-500">
                This action cannot be undone.
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1.5 mb-5">
            <div>
              <span className="font-semibold text-slate-500">Patient: </span>
              <span className="font-medium text-slate-900">
                {appointment.patientName}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Doctor: </span>
              <span className="font-medium text-slate-900">
                {appointment.doctor?.name} ({appointment.doctor?.specialty})
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Scheduled: </span>
              <span className="font-medium text-slate-900">
                {formatDateTime(appointment.appointmentDate)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition"
            >
              Keep Appointment
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>Delete Appointment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
