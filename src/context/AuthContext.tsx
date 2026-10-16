"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

export interface AuthUser {
  uid: string;
  email: string;
  phoneNumber: string;
  displayName: string;
  address?: string;
  role?: string;
  slmcReg?: string;
  hospital?: string;
  bio?: string;
  isDemo?: boolean;
}

export interface StoredAccount extends AuthUser {
  passwordHash: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithPhone: (phone: string, pass?: string) => Promise<void>;
  registerWithEmail: (data: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    password: string;
    role?: string;
  }) => Promise<void>;
  updateUserProfile: (updates: Partial<AuthUser>) => Promise<void>;
  loginDemo: (role?: "doctor" | "nurse" | "receptionist") => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_SESSION_KEY = "medibook_active_session";
const ACCOUNTS_STORAGE_KEY = "medibook_registered_accounts";

const DEFAULT_DOCTOR_ACCOUNT: StoredAccount = {
  uid: "usr-nimal-01",
  displayName: "Dr. Nimal Perera",
  email: "dr.nimal.perera@gmail.com",
  phoneNumber: "0771234567",
  address: "No. 42, Galle Road, Colombo 03",
  role: "Consultant Physician & Clinical Lead",
  slmcReg: "SLMC-38491",
  hospital: "National Hospital of Sri Lanka",
  bio: "Senior Consultant in Internal Medicine with extensive clinical leadership in primary and urgent healthcare.",
  isDemo: false,
  passwordHash: "medibook123",
};

const DEFAULT_NURSE_ACCOUNT: StoredAccount = {
  uid: "usr-sanduni-03",
  displayName: "Nurse Sanduni Fernando",
  email: "nurse.sanduni@gmail.com",
  phoneNumber: "0712345678",
  address: "18 Kandy Road, Colombo",
  role: "Charge Nurse (Ward & Triage)",
  slmcReg: "SLNC-19402",
  hospital: "National Hospital of Sri Lanka",
  bio: "Supervising staff nurse in charge of patient vital monitoring, clinical triage, and medicine administration.",
  isDemo: false,
  passwordHash: "medibook123",
};

const DEFAULT_RECEPTION_ACCOUNT: StoredAccount = {
  uid: "usr-chathuri-02",
  displayName: "Chathuri Alwis",
  email: "chathuri.alwis@gmail.com",
  phoneNumber: "0725678901",
  address: "74 Flower Road, Colombo 07",
  role: "Chief Clinical Registrar",
  slmcReg: "STAFF-9021",
  hospital: "National Hospital of Sri Lanka",
  bio: "Clinical front-desk coordinator and patient scheduling supervisor.",
  isDemo: false,
  passwordHash: "medibook123",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize accounts & restore session from LocalStorage
  useEffect(() => {
    try {
      const storedAccounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (!storedAccounts) {
        const initial = [DEFAULT_DOCTOR_ACCOUNT, DEFAULT_RECEPTION_ACCOUNT];
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(initial));
      }

      const activeSession = localStorage.getItem(AUTH_SESSION_KEY);
      if (activeSession) {
        try {
          const parsed = JSON.parse(activeSession);
          setUser(parsed);
        } catch {
          setUser(null);
          localStorage.removeItem(AUTH_SESSION_KEY);
        }
      } else {
        setUser(null);
      }

      // Sync with Firebase Auth state if user is logged into Firebase
      const auth = getFirebaseAuth();
      let unsubscribe: (() => void) | undefined;
      if (auth && isFirebaseConfigured) {
        unsubscribe = onAuthStateChanged(auth, (fbUser) => {
          if (fbUser && fbUser.email) {
            const accounts = getAccounts();
            const matched = accounts.find(
              (a) => a.uid === fbUser.uid || a.email.toLowerCase() === fbUser.email!.toLowerCase()
            );
            if (matched) {
              const { passwordHash: _, ...cleanUser } = matched;
              setUser(cleanUser);
              localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(cleanUser));
            }
          }
        });
      }

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (err) {
      console.error("Failed to restore auth session:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccounts = (): StoredAccount[] => {
    try {
      const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return [DEFAULT_DOCTOR_ACCOUNT, DEFAULT_RECEPTION_ACCOUNT];
  };

  const saveAccounts = (accounts: StoredAccount[]) => {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  };

  // 1. Email Login (PostgreSQL User Table + Firebase Auth)
  const loginWithEmail = async (emailInput: string, passInput: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const accounts = getAccounts();
    const auth = getFirebaseAuth();

    let authenticatedUser: AuthUser | null = null;

    // A. Attempt authentication via PostgreSQL User table API
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: passInput }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        authenticatedUser = {
          uid: data.user.id,
          displayName: data.user.name,
          email: data.user.email,
          phoneNumber: data.user.phoneNumber || "0771234567",
          role: data.user.role || "Nurse",
          address: data.user.station || "Colombo, Sri Lanka",
          slmcReg: data.user.slmcReg || "SLNC-19402",
          hospital: data.user.hospital || "National Hospital of Sri Lanka",
          bio: data.user.bio || "Clinical staff member.",
          isDemo: false,
        };
      } else if (res.status === 401) {
        throw new Error("Incorrect password. Please verify and try again.");
      }
    } catch (err: any) {
      if (err.message?.includes("Incorrect password")) {
        throw err;
      }
      console.warn("PostgreSQL auth API notice:", err);
    }

    // B. Attempt Firebase Auth if configured
    if (auth && isFirebaseConfigured) {
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, passInput);
      } catch (fbErr: any) {
        console.warn("Firebase signIn notice:", fbErr.code, fbErr.message);
      }
    }

    // C. Fallback to local accounts if not yet found
    if (!authenticatedUser) {
      const localMatch = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
      if (localMatch) {
        if (localMatch.passwordHash && localMatch.passwordHash !== passInput) {
          throw new Error("Incorrect password. Please verify and try again.");
        }
        const { passwordHash: _, ...cleanUser } = localMatch;
        authenticatedUser = cleanUser;
      } else {
        throw new Error("No account found with this email address. Please check your spelling or sign up.");
      }
    }

    setUser(authenticatedUser);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(authenticatedUser));
    if (typeof window !== "undefined") {
      sessionStorage.setItem("medibook_login_greeting_pending", authenticatedUser.displayName || "Clinical Staff");
      window.dispatchEvent(new CustomEvent("medibook:user-logged-in", { detail: authenticatedUser }));
    }
  };

  // 2. Phone Login (PostgreSQL User Table + Local Fallback)
  const loginWithPhone = async (phoneInput: string, passInput?: string) => {
    const cleanPhone = phoneInput.replace(/[\s-]/g, "");
    const accounts = getAccounts();
    let authenticatedUser: AuthUser | null = null;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, password: passInput || "medibook123" }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        authenticatedUser = {
          uid: data.user.id,
          displayName: data.user.name,
          email: data.user.email,
          phoneNumber: data.user.phoneNumber,
          role: data.user.role || "Nurse",
          address: data.user.station || "Colombo, Sri Lanka",
          slmcReg: data.user.slmcReg,
          hospital: data.user.hospital,
          bio: data.user.bio,
          isDemo: false,
        };
      }
    } catch {}

    if (!authenticatedUser) {
      const localMatch = accounts.find((a) => a.phoneNumber.replace(/[\s-]/g, "") === cleanPhone);
      if (!localMatch) {
        throw new Error("No account registered with this 10-digit phone number. Please sign up.");
      }
      if (passInput && localMatch.passwordHash && localMatch.passwordHash !== passInput) {
        throw new Error("Incorrect password.");
      }
      const { passwordHash: _, ...cleanUser } = localMatch;
      authenticatedUser = cleanUser;
    }

    setUser(authenticatedUser);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(authenticatedUser));
    if (typeof window !== "undefined") {
      sessionStorage.setItem("medibook_login_greeting_pending", authenticatedUser.displayName || "Clinical Staff");
      window.dispatchEvent(new CustomEvent("medibook:user-logged-in", { detail: authenticatedUser }));
    }
  };

  // 3. Register New Account (Saved to PostgreSQL User Table + Firebase Auth)
  const registerWithEmail = async (data: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    password: string;
    role?: string;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.replace(/[\s-]/g, "");
    const accounts = getAccounts();
    const auth = getFirebaseAuth();

    let createdUser: AuthUser | null = null;

    // A. Create record in PostgreSQL User table with bcrypt password hash
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: cleanEmail,
          phone: cleanPhone,
          password: data.password,
          role: data.role || "Nurse",
          address: data.address,
        }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to register account.");
      }
      if (resData.success && resData.user) {
        createdUser = {
          uid: resData.user.id,
          displayName: resData.user.name,
          email: resData.user.email,
          phoneNumber: resData.user.phoneNumber,
          role: resData.user.role,
          address: resData.user.station || data.address || "Colombo, Sri Lanka",
          slmcReg: resData.user.slmcReg,
          hospital: resData.user.hospital,
          bio: resData.user.bio,
          isDemo: false,
        };
      }
    } catch (err: any) {
      if (err.message && !err.message.includes("fetch")) {
        throw err;
      }
    }

    // B. Also register in Firebase Auth for cloud sync
    if (auth && isFirebaseConfigured) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
        await updateFirebaseProfile(userCred.user, { displayName: data.name.trim() });
        if (createdUser) {
          createdUser.uid = userCred.user.uid;
        }
      } catch (fbErr: any) {
        console.warn("Firebase registration notice:", fbErr.code, fbErr.message);
      }
    }

    if (!createdUser) {
      createdUser = {
        uid: `usr-${Date.now()}`,
        displayName: data.name.trim(),
        email: cleanEmail,
        phoneNumber: cleanPhone,
        address: data.address?.trim() || "Colombo, Sri Lanka",
        role: data.role || "Nurse",
        slmcReg: `SLNC-${Math.floor(10000 + Math.random() * 90000)}`,
        hospital: "National Hospital of Sri Lanka",
        bio: "Registered clinical staff member at MediBook Sri Lanka.",
        isDemo: false,
      };
    }

    const newStoredAccount: StoredAccount = {
      ...createdUser,
      passwordHash: data.password,
    };

    const existingIdx = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);
    if (existingIdx >= 0) {
      accounts[existingIdx] = newStoredAccount;
    } else {
      accounts.push(newStoredAccount);
    }
    saveAccounts(accounts);

    setUser(createdUser);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(createdUser));
    if (typeof window !== "undefined") {
      sessionStorage.setItem("medibook_login_greeting_pending", createdUser.displayName || "Clinical Staff");
      window.dispatchEvent(new CustomEvent("medibook:user-logged-in", { detail: createdUser }));
    }
  };

  // 4. Update Profile
  const updateUserProfile = async (updates: Partial<AuthUser>) => {
    if (!user) throw new Error("No user currently logged in.");

    const accounts = getAccounts();
    const updatedUser: AuthUser = {
      ...user,
      ...updates,
    };

    const updatedAccounts = accounts.map((acc) => {
      if (acc.uid === user.uid) {
        return {
          ...acc,
          ...updates,
        };
      }
      return acc;
    });

    saveAccounts(updatedAccounts);
    setUser(updatedUser);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedUser));
  };

  // 5. Demo Login (Doctor, Nurse, or Receptionist)
  const loginDemo = (role: "doctor" | "nurse" | "receptionist" = "doctor") => {
    let demo = DEFAULT_DOCTOR_ACCOUNT;
    if (role === "nurse") demo = DEFAULT_NURSE_ACCOUNT;
    if (role === "receptionist") demo = DEFAULT_RECEPTION_ACCOUNT;

    const { passwordHash: _, ...cleanUser } = demo;
    setUser(cleanUser);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(cleanUser));
    if (typeof window !== "undefined") {
      sessionStorage.setItem("medibook_login_greeting_pending", cleanUser.displayName || "Clinical Staff");
      window.dispatchEvent(new CustomEvent("medibook:user-logged-in", { detail: cleanUser }));
    }
  };

  // 6. Logout with Firebase Auth & Silence AI Immediately
  const logout = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("medibook_login_greeting_pending");
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      window.dispatchEvent(new CustomEvent("medibook:user-logged-out"));
    }

    const auth = getFirebaseAuth();
    if (auth && isFirebaseConfigured) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn("Firebase signOut notice:", err);
      }
    }
    localStorage.removeItem(AUTH_SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        loginWithPhone,
        registerWithEmail,
        updateUserProfile,
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
