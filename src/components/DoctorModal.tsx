"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { ShiftType } from "@/lib/shifts";
import { cleanDoctorName, formatSriLankanPhone, isValidEmail, isValidSriLankanPhone } from "@/lib/formatters";

export interface DoctorModalModel {
  id?: string;
  name: string;
  specialty: string;
  room: string;
  phone: string;
  email: string;
  status: "ON_DUTY" | "ON_CALL" | "OFF_DUTY";
  shift: ShiftType;
}

interface DoctorModalProps {
  isOpen: boolean;
  doctor: DoctorModalModel | null;
  defaultShift?: ShiftType;
  onClose: () => void;
  onSave: (docData: DoctorModalModel) => Promise<void>;
}

export function DoctorModal({
  isOpen,
  doctor,
  defaultShift = "Morning",
  onClose,
  onSave,
}: DoctorModalProps) {
  const [formName, setFormName] = useState("");
  const [formSpecialty, setFormSpecialty] = useState("General Medicine");
  const [formRoom, setFormRoom] = useState("Consult Room 03");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formShift, setFormShift] = useState<ShiftType>(defaultShift);
  const [formStatus, setFormStatus] = useState<"ON_DUTY" | "ON_CALL" | "OFF_DUTY">("ON_DUTY");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (doctor) {
      setFormName(doctor.name);
      setFormSpecialty(doctor.specialty);
      setFormRoom(doctor.room);
      setFormPhone(doctor.phone);
      setFormEmail(doctor.email);
      setFormShift(doctor.shift);
      setFormStatus(doctor.status);
    } else {
      setFormName("");
      setFormSpecialty("General Medicine");
      setFormRoom("Consult Room 03");
      setFormPhone("");
      setFormEmail("");
      setFormShift(defaultShift);
      setFormStatus("ON_DUTY");
    }
    setErrorMsg(null);
  }, [doctor, defaultShift, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formName.trim()) {
      setErrorMsg("Doctor name is required.");
      return;
    }

    const cleanPhone = formatSriLankanPhone(formPhone);
    if (cleanPhone && !isValidSriLankanPhone(cleanPhone)) {
      setErrorMsg("Phone number must be exactly 10 digits (e.g. 0771234567).");
      return;
    }

    const cleanEmail = formEmail.trim().toLowerCase();
    if (cleanEmail && !isValidEmail(cleanEmail)) {
      setErrorMsg("Email must be valid with '@' and domain (e.g. doctor@gmail.com).");
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitizedName = cleanDoctorName(formName);
      await onSave({
        id: doctor?.id,
        name: sanitizedName,
        specialty: formSpecialty,
        room: formRoom,
        shift: formShift,
        phone: cleanPhone,
        email: cleanEmail,
        status: formStatus,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save doctor");
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
              {doctor ? "Edit Physician Profile" : "Roster Physician Shift"}
            </h2>
            <p className="text-xs text-slate-500">
              {doctor
                ? "Update attending physician credentials and shift coverage"
                : "Assign attending physician to clinical room & database roster"}
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
              Doctor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Dr. Priyantha Silva"
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Name only (no educational degrees like MD, FAAOS)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty</label>
              <select
                value={formSpecialty}
                onChange={(e) => setFormSpecialty(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors cursor-pointer"
              >
                <option value="Cardiology">Cardiology</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Neurology">Neurology</option>
                <option value="Dermatology">Dermatology</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room Assignment</label>
              <input
                type="text"
                required
                value={formRoom}
                onChange={(e) => setFormRoom(e.target.value)}
                placeholder="e.g. Suite 204"
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Rotation</label>
              <select
                value={formShift}
                onChange={(e) => setFormShift(e.target.value as ShiftType)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors cursor-pointer"
              >
                <option value="Morning">Morning (06:00 AM – 12:00 PM)</option>
                <option value="Afternoon">Afternoon (12:00 PM – 05:00 PM)</option>
                <option value="Evening">Evening (05:00 PM – 10:00 PM)</option>
                <option value="Night">Night (10:00 PM – 06:00 AM)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duty Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors cursor-pointer"
              >
                <option value="ON_DUTY">On Duty</option>
                <option value="ON_CALL">On Call</option>
                <option value="OFF_DUTY">Off Duty</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                10-Digit Phone
              </label>
              <input
                type="tel"
                maxLength={10}
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="0771234567"
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">10-digit Sri Lankan phone</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Email
              </label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="doctor@gmail.com"
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Valid '@' &amp; domain</span>
            </div>
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
              {isSubmitting ? "Saving..." : doctor ? "Save Changes" : "Save Physician"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
