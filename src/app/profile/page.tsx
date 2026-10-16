"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  ShieldCheck,
  Stethoscope,
  Save,
  LogOut,
  CheckCircle2,
  AlertCircle,
  FileText,
  BadgeCheck,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, updateUserProfile, logout } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("");
  const [hospital, setHospital] = useState("");
  const [slmcReg, setSlmcReg] = useState("");
  const [bio, setBio] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setIsToastVisible(false), 3000);
  };

  useEffect(() => {
    if (user) {
      setName(user.displayName || "Dr. Nimal Perera");
      setEmail(user.email || "dr.nimal.perera@gmail.com");
      setPhone(user.phoneNumber || "0771234567");
      setAddress(user.address || "No. 42, Galle Road, Colombo 03");
      setRole(user.role || "Consultant Physician");
      setHospital(user.hospital || "National Hospital of Sri Lanka");
      setSlmcReg(user.slmcReg || "SLMC-38491");
      setBio(
        user.bio ||
          "Senior Consultant Physician dedicated to high-quality clinical healthcare and clinical decision making."
      );
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading clinical profile...</p>
        </div>
      </div>
    );
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Name validation
    if (name.trim().length < 3) {
      setFormError("Full legal name must be at least 3 characters.");
      return;
    }

    // 2. 10-digit Sri Lankan phone number validation
    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (!/^\d{10}$/.test(cleanPhone)) {
      setFormError("Phone number must be exactly 10 digits (e.g. 0771234567).");
      return;
    }

    // 3. Email validation
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
      setFormError("Please enter a valid email address with '@' and domain (e.g. user@gmail.com).");
      return;
    }

    // 4. Address validation
    if (!address.trim()) {
      setFormError("Please enter your clinic or residential address in Sri Lanka.");
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile({
        displayName: name.trim(),
        email: cleanEmail,
        phoneNumber: cleanPhone,
        address: address.trim(),
        role: role.trim(),
        hospital: hospital.trim(),
        slmcReg: slmcReg.trim(),
        bio: bio.trim(),
      });
      showToast("Profile details successfully updated!");
    } catch (err: any) {
      setFormError(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (text: string) => {
    const parts = text.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
      <Header activePath="profile" />

      {/* Floating Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 pointer-events-none flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white shadow-xl ${
          isToastVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
        }`}
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium">{toastMessage}</span>
      </div>

      <main className="w-full pt-20 pb-12 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Page Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Staff Profile &amp; Settings
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage your clinical accreditation, contact channels, and duty credentials.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200/80 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Profile Hero Header Card */}
          <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-400 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-sky-500/20 ring-4 ring-sky-100">
                {getInitials(name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{name}</h2>
                  <BadgeCheck className="w-5 h-5 text-sky-500" />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-600">
                  <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/60">
                    {role}
                  </span>
                  <span>•</span>
                  <span>{hospital}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-500">{slmcReg}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Practitioner
              </span>
            </div>
          </div>

          {/* Grid Layout: Left Overview & Right Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Quick Stats & Accreditation */}
            <div className="lg:col-span-4 space-y-5">
              {/* Clinical Accreditation Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  Accreditation &amp; Practice
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Building className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[11px] text-slate-500 font-semibold uppercase">Hospital Affiliation</span>
                      <span className="font-medium text-slate-800">{hospital}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[11px] text-slate-500 font-semibold uppercase">SLMC Medical Council</span>
                      <span className="font-medium font-mono text-slate-800">{slmcReg}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[11px] text-slate-500 font-semibold uppercase">Practice Station</span>
                      <span className="font-medium text-slate-800">{address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Snapshot Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-4 h-4 text-sky-600" />
                  Direct Channels
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Phone (10-Digit)</span>
                    <span className="font-mono font-semibold text-slate-800">{phone}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium text-slate-800 truncate max-w-[180px]">{email}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-500">Duty Region</span>
                    <span className="font-semibold text-sky-700">Sri Lanka (Western)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Edit Profile Form */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <div className="pb-4 border-b border-slate-100 mb-5">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-600" />
                  Edit Profile Information
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your contact phone, email, and clinic address in Sri Lanka
                </p>
              </div>

              {formError && (
                <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {/* Full Legal Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Legal Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Nimal Perera, MD"
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                  />
                </div>

                {/* Phone & Email with 10 digits and @gmail.com */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      10-Digit Sri Lankan Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="0771234567"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                      <span>Must be exactly 10 digits</span>
                      <span className={`font-semibold ${phone.length === 10 ? "text-emerald-600" : "text-slate-600"}`}>
                        {phone.length}/10 digits
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. dr.nimal.perera@gmail.com"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Proper email with '@' and domain (e.g. @gmail.com)
                    </p>
                  </div>
                </div>

                {/* Sri Lankan Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sri Lankan Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. No. 42, Galle Road, Colombo 03"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                    />
                  </div>
                </div>

                {/* Role & Hospital */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Clinical Designation / Role
                    </label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Consultant Physician"
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hospital / Clinic Branch
                    </label>
                    <input
                      type="text"
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      placeholder="e.g. National Hospital of Sri Lanka"
                      className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                    />
                  </div>
                </div>

                {/* SLMC Registration & Professional Bio */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SLMC Registration Number
                  </label>
                  <input
                    type="text"
                    value={slmcReg}
                    onChange={(e) => setSlmcReg(e.target.value)}
                    placeholder="e.g. SLMC-38491"
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Professional Statement / Bio
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short summary of medical qualifications and clinical experience..."
                    className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors resize-none"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? "Saving..." : "Save Profile Changes"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
