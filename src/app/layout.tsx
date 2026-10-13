import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "MediBook | Medical Appointment Manager",
  description: "Intelligent medical appointment scheduling with AI natural language search.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-sky-100 selection:text-sky-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
