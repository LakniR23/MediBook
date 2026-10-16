"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Phone,
  ArrowRight,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, loginWithEmail, loginWithPhone } = useAuth();

  const [activeTab, setActiveTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Handle Email Login
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate email format
    const cleanEmail = email.trim();
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
      setErrorMsg("Please enter a valid email address with '@' and domain (e.g. dr.nimal.perera@gmail.com).");
      return;
    }

    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      await loginWithEmail(cleanEmail, password);
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Phone Login
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (!/^\d{10}$/.test(cleanPhone)) {
      setErrorMsg("Please enter a valid 10-digit Sri Lankan phone number (e.g. 0771234567).");
      return;
    }

    setIsLoading(true);
    try {
      await loginWithPhone(cleanPhone);
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in with phone.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-900 antialiased font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-sky-500/20">
            +
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            MediBook
          </span>
        </div>
        <p className="text-center text-xs font-semibold tracking-wider uppercase text-sky-700">
          Sri Lanka Clinical Management Suite
        </p>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Enter your authorized clinical credentials to access patient charts
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl border border-slate-200/80">
          {/* Auth Tab Switcher */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("email");
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "email"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("phone");
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "phone"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>10-Digit Phone</span>
            </button>
          </div>

          {/* Error notification */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Email Login Form */}
          {activeTab === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
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
                  Must be a valid email (e.g. username@gmail.com)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-xs rounded-lg outline-none focus:ring-2 focus:ring-sky-500 border border-slate-200 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Phone Login Form */}
          {activeTab === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  10-Digit Sri Lankan Phone Number
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
                  <span>Standard 10-digit Sri Lankan mobile number</span>
                  <span className="font-semibold text-slate-700">{phone.length}/10 digits</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In with Phone</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Don't have an account?</span>
            <Link
              href="/register"
              className="font-semibold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Register New Profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
