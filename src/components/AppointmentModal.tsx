"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, User, Stethoscope, FileText, Phone, AlertCircle } from "lucide-react";
import { Appointment, Doctor, AppointmentStatus, AppointmentType } from "@/lib/types";
import { toInputDateTime } from "@/lib/date-utils";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<boolean>;
  doctors: Doctor[];
  initialData?: Appointment | null;
}

export function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  doctors,
  initialData,
}: AppointmentModalProps) {
  const isEditing = Boolean(initialData);

  const [patientName, setPatientName] = useState("");
  const [patientContact, setPatientContact] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentType, setAppointmentType] = useState<AppointmentType>("CHECKUP");
  const [status, setStatus] = useState<AppointmentStatus>("SCHEDULED");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setPatientName(initialData.patientName);
      setPatientContact(initialData.patientContact || "");
      setDoctorId(initialData.doctorId);
      setAppointmentDate(toInputDateTime(initialData.appointmentDate));
      setAppointmentType(initialData.appointmentType);
      setStatus(initialData.status);
      setNotes(initialData.notes || "");
    } else {
      // Default to tomorrow 10:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      setPatientName("");
      setPatientContact("");
      setDoctorId(doctors.length > 0 ? doctors[0].id : "");
      setAppointmentDate(toInputDateTime(tomorrow));
      setAppointmentType("CHECKUP");
      setStatus("SCHEDULED");
      setNotes("");
    }
    setFormError(null);
  }, [initialData, doctors, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!patientName.trim()) {
      setFormError("Patient name is required.");
      return;
    }
    if (!doctorId) {
      setFormError("Please select a doctor.");
      return;
    }
    if (!appointmentDate) {
      setFormError("Please select appointment date and time.");
      return;
    }

    try {
      setIsSubmitting(true);
      const isoDate = new Date(appointmentDate).toISOString();
      const payload = {
        patientName: patientName.trim(),
        patientContact: patientContact.trim() || null,
        doctorId,
        appointmentDate: isoDate,
        appointmentType,
        status,
        notes: notes.trim() || null,
      };

      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? "Edit Appointment" : "Schedule New Appointment"}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditing
                ? "Update patient and scheduling details"
                : "Fill in the required fields to book an appointment"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {formError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Patient Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Arthur Dent"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Patient Contact */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Patient Contact Info (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={patientContact}
                onChange={(e) => setPatientContact(e.target.value)}
                placeholder="e.g. +1 (555) 234-5678 or patient@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Attending Doctor <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                required
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition text-slate-800"
              >
                <option value="" disabled>
                  Select Doctor
                </option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date and Time */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Appointment Date & Time <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="datetime-local"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Type & Status Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Appointment Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              >
                <option value="CHECKUP">Checkup</option>
                <option value="CONSULTATION">Consultation</option>
                <option value="FOLLOW_UP">Follow-Up</option>
                <option value="ROUTINE_EXAM">Routine Exam</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="SPECIALIST_VISIT">Specialist Visit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No-Show</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Clinical Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Reason for visit, patient symptoms, or special instructions..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-medium transition shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isEditing ? "Save Changes" : "Create Appointment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
