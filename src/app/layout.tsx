import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { VoiceAssistantProvider } from "@/context/VoiceAssistantContext";
import { VoiceAssistantWidget } from "@/components/VoiceAssistantWidget";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediBook - Clinical Practice Suite",
  description: "Real-time clinical appointments, provider schedules, and patient management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} bg-background text-on-surface antialiased min-h-screen flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900`}>
        <AuthProvider>
          <VoiceAssistantProvider>
            {children}
            <VoiceAssistantWidget />
          </VoiceAssistantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
