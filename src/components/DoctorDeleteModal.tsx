"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface DoctorDeleteModalProps {
  doctor: { id: string; name: string } | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DoctorDeleteModal({
  doctor,
  isDeleting,
  onClose,
  onConfirm,
}: DoctorDeleteModalProps) {
  if (!doctor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Remove Physician</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to remove{" "}
              <strong className="text-slate-900 font-semibold">{doctor.name}</strong> from the
              clinical roster? This will cascade and delete their shift assignments.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Physician"}
          </button>
        </div>
      </div>
    </div>
  );
}
