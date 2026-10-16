"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";

export interface AppointmentFormModel {
  id?: string;
  name: string;
  contact?: string;
  date: string;
  time: string;
  doctorId: string;
  type: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  note?: string;
}

export interface FormDoctorOption {
  id: string;
  name: string;
  specialty: string;
}

export interface RegisteredPatientItem {
  id: string;
  mrn: string;
  name: string;
  phone?: string;
  email?: string;
  primaryDoctor?: string;
}

interface AppointmentFormModalProps {
  isOpen: boolean;
  appointment: AppointmentFormModel | null;
  doctors: FormDoctorOption[];
  registeredPatients: RegisteredPatientItem[];
  onClose: () => void;
  onSave: (formData: AppointmentFormModel) => Promise<void>;
}

const TIME_SLOTS = [
  // Morning (06:00 AM – 12:00 PM)
  "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  // Afternoon (12:00 PM – 05:00 PM)
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  // Evening (05:00 PM – 10:00 PM)
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM",
  // Night (10:00 PM – 06:00 AM)
  "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM", "12:00 AM", "01:00 AM", "02:00 AM", "03:00 AM", "04:00 AM", "05:00 AM",
];

export function AppointmentFormModal({
  isOpen,
  appointment,
  doctors,
  registeredPatients,
  onClose,
  onSave,
}: AppointmentFormModalProps) {
  const [formName, setFormName] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("09:00 AM");
  const [formDoctorId, setFormDoctorId] = useState("");
  const [formType, setFormType] = useState("CONSULTATION");
  const [formStatus, setFormStatus] = useState<AppointmentFormModel["status"]>("SCHEDULED");
  const [formNotes, setFormNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (appointment) {
      setFormName(appointment.name);
      setFormContact(appointment.contact || "");
      setFormDate(appointment.date);
      setFormTime(appointment.time);
      setFormDoctorId(appointment.doctorId || (doctors[0]?.id || ""));
      setFormType(appointment.type);
      setFormStatus(appointment.status);
      setFormNotes(appointment.note || "");
    } else {
      setFormName("");
      setFormContact("");
      setFormDate(new Date().toISOString().split("T")[0]);
      setFormTime("09:00 AM");
      if (doctors.length > 0) setFormDoctorId(doctors[0].id);
      setFormType("CONSULTATION");
      setFormStatus("SCHEDULED");
      setFormNotes("");
    }
    setErrorMsg(null);
  }, [appointment, doctors, isOpen]);

  if (!isOpen) return null;

  // Patient directory autocomplete
  const handlePatientNameChange = (val: string) => {
    setFormName(val);
    const matched = registeredPatients.find(
      (p) => p.name.toLowerCase() === val.trim().toLowerCase()
    );
    if (matched) {
      if (matched.phone) setFormContact(matched.phone);
      else if (matched.email) setFormContact(matched.email);

      if (matched.primaryDoctor) {
        const foundDoc = doctors.find((d) =>
          d.name.toLowerCase().includes(matched.primaryDoctor!.replace(/^Dr\.?\s*/i, "").toLowerCase())
        );
        if (foundDoc) setFormDoctorId(foundDoc.id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formName.trim()) {
      setErrorMsg("Patient name is required");
      return;
    }

    if (!formDoctorId) {
      setErrorMsg("Please select an attending doctor");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: appointment?.id,
        name: formName.trim(),
        contact: formContact.trim() || undefined,
        date: formDate,
        time: formTime,
        doctorId: formDoctorId,
        type: formType,
        status: formStatus,
        note: formNotes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 my-auto border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-base text-slate-900">
              {appointment ? "Edit Appointment" : "Schedule New Appointment"}
            </h2>
            <p className="text-xs text-slate-500">
              {appointment
                ? "Update patient encounter slot and clinical assignment"
                : "Enter patient details to automatically enroll into patient directory"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="pt-4 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              list="patient-names-datalist"
              value={formName}
              onChange={(e) => handlePatientNameChange(e.target.value)}
              placeholder="e.g. Priyantha Silva"
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
            />
            <datalist id="patient-names-datalist">
              {registeredPatients.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.mrn} • {p.phone || p.email}
                </option>
              ))}
            </datalist>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Auto-registers new patients into the Patients Directory automatically
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Contact (10-Digit Phone or Email)
            </label>
            <input
              type="text"
              value={formContact}
              onChange={(e) => setFormContact(e.target.value)}
              placeholder="0771234567 or patient@gmail.com"
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              10-digit Sri Lankan phone or email
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attending Doctor <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formDoctorId}
                onChange={(e) => setFormDoctorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors cursor-pointer"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialty})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Encounter Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors cursor-pointer"
              >
                <option value="CONSULTATION">Consultation</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="CHECKUP">Checkup</option>
                <option value="ROUTINE_EXAM">Routine Exam</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="SPECIALIST_VISIT">Specialist Visit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Appointment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Time Slot <span className="text-red-500">*</span>
              </label>
              <select
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors cursor-pointer"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Duty Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors cursor-pointer"
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes (Optional)</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g. Routine hypertension checkup, review fasting blood sugar"
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-sky-500 text-white rounded-lg text-xs font-semibold hover:bg-sky-600 shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : appointment ? "Save Changes" : "Schedule Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
