"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

export interface AuthUser {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  isDemo?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  setupRecaptcha: (containerId: string) => RecaptchaVerifier | null;
  sendPhoneOtp: (phone: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyPhoneOtp: (confirmationResult: ConfirmationResult, code: string) => Promise<void>;
  loginDemo: (role?: "receptionist" | "admin") => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = "medibook_demo_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Monitor Firebase auth state or restore demo session
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    if (isFirebaseConfigured && auth) {
      unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            phoneNumber: fbUser.phoneNumber,
            displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Clinic Staff",
            isDemo: false,
          });
        } else {
          // Check local storage for demo user session
          const stored = localStorage.getItem(DEMO_USER_STORAGE_KEY);
          if (stored) {
            try {
              setUser(JSON.parse(stored));
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });
    } else {
      // Firebase not configured yet: check local demo user
      const stored = localStorage.getItem(DEMO_USER_STORAGE_KEY);
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // 1. Email Login
  const loginWithEmail = async (email: string, pass: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        "Firebase is not configured in .env. Use Demo Mode or set your NEXT_PUBLIC_FIREBASE_* credentials."
      );
    }
    await signInWithEmailAndPassword(auth, email, pass);
  };

  // 2. Email Register
  const registerWithEmail = async (email: string, pass: string, name: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        "Firebase is not configured in .env. Use Demo Mode or set your NEXT_PUBLIC_FIREBASE_* credentials."
      );
    }
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
    }
  };

  // 3. Setup reCAPTCHA for Phone Auth
  const setupRecaptcha = (containerId: string): RecaptchaVerifier | null => {
    if (!isFirebaseConfigured || !auth) {
      return null;
    }
    return new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      },
    });
  };

  // 4. Send Phone OTP
  const sendPhoneOtp = async (
    phone: string,
    appVerifier: RecaptchaVerifier
  ): Promise<ConfirmationResult> => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        "Firebase Phone Auth requires active NEXT_PUBLIC_FIREBASE_* credentials."
      );
    }
    return await signInWithPhoneNumber(auth, phone, appVerifier);
  };

  // 5. Confirm Phone OTP
  const verifyPhoneOtp = async (
    confirmationResult: ConfirmationResult,
    code: string
  ) => {
    await confirmationResult.confirm(code);
  };

  // 6. Demo Mode Login (Frictionless testing without Firebase account)
  const loginDemo = (role: "receptionist" | "admin" = "receptionist") => {
    const demoUser: AuthUser = {
      uid: "demo-staff-101",
      email: role === "admin" ? "admin@medibook.fictional" : "receptionist@medibook.fictional",
      phoneNumber: "+1 (555) 019-2834",
      displayName: role === "admin" ? "Dr. Clinic Admin" : "Sarah (Receptionist)",
      isDemo: true,
    };
    setUser(demoUser);
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser));
  };

  // 7. Logout
  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseConfigured,
        loginWithEmail,
        registerWithEmail,
        setupRecaptcha,
        sendPhoneOtp,
        verifyPhoneOtp,
        loginDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
