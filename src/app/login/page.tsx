"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ConfirmationResult } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    loginWithEmail,
    setupRecaptcha,
    sendPhoneOtp,
    verifyPhoneOtp,
    loginDemo,
    isFirebaseConfigured,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone Auth state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  // Handle Email Login
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await loginWithEmail(email, password);
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in with email.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!phoneNumber.startsWith("+")) {
      setErrorMsg("Please include international country code (e.g., +1 555 123 4567 or +94 77 123 4567).");
      return;
    }

    setIsLoading(true);

    try {
      const verifier = setupRecaptcha("recaptcha-container");
      if (!verifier) {
        throw new Error("Unable to initialize reCAPTCHA verifier. Check Firebase configuration.");
      }
      const confirmation = await sendPhoneOtp(phoneNumber, verifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send SMS OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!confirmationResult || !otpCode) {
      setErrorMsg("Please enter the 6-digit OTP code sent to your phone.");
      return;
    }

    setIsLoading(true);

    try {
      await verifyPhoneOtp(confirmationResult, otpCode);
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid OTP code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Container for invisible reCAPTCHA */}
      <div id="recaptcha-container" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Activity className="w-7 h-7 stroke-[2.2]" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign In to <span className="text-sky-600">MediBook</span>
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Clinical Appointment & Scheduling Staff Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-200 sm:rounded-2xl sm:px-10">
          {/* Auth Tab Selector */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab("email");
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === "email"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email & Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("phone");
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === "phone"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Phone SMS OTP</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: EMAIL LOGIN */}
          {activeTab === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@medibook.fictional"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-medium shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Sign In with Email</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: PHONE LOGIN */}
          {activeTab === "phone" && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Phone Number (with country code)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 (555) 234-5678"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      We will send an SMS with a 6-digit verification code.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading && (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>Send SMS Verification Code</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Enter 6-Digit OTP Code
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm tracking-widest text-center font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading && (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>Verify Code & Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
                  >
                    Change phone number
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Quick 1-Click Demo Login */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="relative flex justify-center text-xs mb-3">
              <span className="bg-white px-2 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                Instant Evaluation Demo
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                loginDemo("receptionist");
                router.push("/");
              }}
              className="w-full py-2 px-3 border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>1-Click Receptionist Demo Login</span>
            </button>
          </div>

          {/* Register Link */}
          <div className="mt-5 text-center text-xs text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-sky-600 hover:text-sky-700 underline"
            >
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
