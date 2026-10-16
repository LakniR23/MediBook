"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isValidSriLankanPhone, isValidEmail } from "@/lib/formatters";

export default function RegisterPage() {
  const router = useRouter();
  const { user, registerWithEmail } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("Medical Officer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Validate Legal Name
    if (fullName.trim().length < 3) {
      setErrorMsg("Please enter your full legal name (at least 3 characters).");
      return;
    }

    // 2. Validate 10-digit Sri Lankan phone number via shared domain validator
    if (!isValidSriLankanPhone(phone)) {
      setErrorMsg("Phone number must be exactly 10 digits (e.g. 0771234567).");
      return;
    }

    // 3. Validate Email with @ and domain via shared domain validator
    if (!isValidEmail(email)) {
      setErrorMsg("Email must be properly formatted with '@' and domain (e.g. yourname@gmail.com).");
      return;
    }

    // 4. Validate Address
    if (address.trim().length < 5) {
      setErrorMsg("Please provide a valid residential or clinic station address.");
      return;
    }

    // 5. Validate Password
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await registerWithEmail({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address.trim(),
        password,
        role,
      });
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">
            MediBook
          </span>
        </div>
        <p className="text-center text-xs font-semibold tracking-wider uppercase text-sky-700">
          Sri Lanka Health Service Intake
        </p>
        <h2 className="mt-3 text-center text-2xl font-bold tracking-tight text-slate-900">
          Register Staff Profile
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Create clinical credentials for attending physicians, nurses, and medical officers
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/50 sm:rounded-2xl border border-slate-200/80">
          {/* Error notification */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name & Clinical Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Priyantha Silva"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Designation
                </label>
                <div className="relative">
                  <Stethoscope className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <option value="Staff Nurse">Staff Nurse / Nursing Officer</option>
                    <option value="Ward Sister / Charge Nurse">Ward Sister / Charge Nurse</option>
                    <option value="Registered Nurse">Registered Nurse</option>
                    <option value="Consultant Physician">Consultant Physician</option>
                    <option value="Medical Officer">Medical Officer</option>
                    <option value="Chief Clinical Registrar">Chief Clinical Registrar</option>
                    <option value="Hospital Administrator">Hospital Administrator</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 10-digit Phone & Email */}
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
                  <span>Starts with 0 (e.g. 077, 071)</span>
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
                    placeholder="e.g. priyantha.silva@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Must include '@' and domain
                </p>
              </div>
            </div>

            {/* Address */}
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
                  placeholder="e.g. No. 45, Galle Road, Colombo 03"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Residential or hospital clinic station address
              </p>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-2.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Registering Profile...</span>
              ) : (
                <>
                  <span>Create Account & Access Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Already have an account?</span>
            <Link
              href="/login"
              className="font-semibold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Sign In Instead →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
