"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastProps {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  onClose: (id: string) => void;
}

export function Toast({ id, type, message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
  };

  const borders = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-rose-200 bg-rose-50 text-rose-900",
    info: "border-sky-200 bg-sky-50 text-sky-900",
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all animate-in slide-in-from-top-2 duration-200 ${borders[type]}`}
      role="alert"
    >
      {icons[type]}
      <p className="text-sm font-medium pr-2">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="ml-auto text-slate-400 hover:text-slate-700 transition p-1"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
