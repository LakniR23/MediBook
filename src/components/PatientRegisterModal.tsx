"use client";

import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { isValidEmail, isValidSriLankanPhone, formatSriLankanPhone } from "@/lib/formatters";

export interface DoctorOptionItem {
  id: string;
  name: string;
  specialty: string;
}

interface PatientRegisterModalProps {
  isOpen: boolean;
  doctors: DoctorOptionItem[];
  onClose: () => void;
  onSuccess: (patient: any) => void;
}

export function PatientRegisterModal({
  isOpen,
  doctors,
  onClose,
  onSuccess,
}: PatientRegisterModalProps) {
  const [formName, setFormName] = useState("");
  const [formAge, setFormAge] = useState("35");
  const [formGender, setFormGender] = useState<"Male" | "Female" | "Other">("Male");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formBlood, setFormBlood] = useState("O+");
  const [formDoctor, setFormDoctor] = useState(doctors[0]?.name || "Dr. Nimal Perera");
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "CHRONIC_CARE" | "DISCHARGED">("ACTIVE");
  const [formAlert, setFormAlert] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation 1: Legal Name
    if (formName.trim().length < 2) {
      setFormError("Patient name must be at least 2 characters.");
      return;
    }

    // Validation 2: 10-Digit Sri Lankan Phone
    const cleanPhone = formatSriLankanPhone(formPhone);
    if (!isValidSriLankanPhone(cleanPhone)) {
      setFormError("Phone number must be exactly 10 digits (e.g. 0771234567).");
      return;
    }

    // Validation 3: Valid Email
    const cleanEmail = formEmail.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setFormError("Please enter a valid email address with '@' and domain (e.g. patient@gmail.com).");
      return;
    }

    // Validation 4: Address
    if (!formAddress.trim()) {
      setFormError("Please enter the patient's Sri Lankan residential address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          age: parseInt(formAge) || 30,
          gender: formGender,
          phone: cleanPhone,
          email: cleanEmail,
          address: formAddress.trim(),
          bloodGroup: formBlood,
          primaryDoctor: formDoctor,
          status: formStatus,
          alertNote: formAlert.trim() || null,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to register patient profile");
      }

      const created = await res.json();
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Failed to register patient profile.");
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
            <h2 className="font-bold text-base text-slate-900">Register New Patient</h2>
            <p className="text-xs text-slate-500">
              Create an EHR profile with Sri Lankan contact details and clinical alerts.
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

        {formError && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="pt-4 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Kasun Chamara"
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                required
                min={0}
                max={130}
                value={formAge}
                onChange={(e) => setFormAge(e.target.value)}
                placeholder="35"
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={formGender}
                onChange={(e) => setFormGender(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                10-Digit Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="0771234567"
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>10 digits</span>
                <span className={formPhone.length === 10 ? "text-emerald-600 font-semibold" : ""}>
                  {formPhone.length}/10
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="patient@gmail.com"
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Valid @ &amp; domain</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sri Lankan Residential Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              placeholder="e.g. 102 Galle Road, Colombo 03"
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={formBlood}
                onChange={(e) => setFormBlood(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors cursor-pointer"
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Doctor</label>
              <select
                value={formDoctor}
                onChange={(e) => setFormDoctor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors cursor-pointer"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.name}>
                    {doc.name} ({doc.specialty})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Alerts / Adverse Allergies (Optional)
            </label>
            <input
              type="text"
              value={formAlert}
              onChange={(e) => setFormAlert(e.target.value)}
              placeholder="e.g. Penicillin allergy, Type 2 Diabetic"
              className="w-full px-3 py-2 bg-slate-50 focus:bg-white text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
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
              {isSubmitting ? "Registering..." : "Register Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
