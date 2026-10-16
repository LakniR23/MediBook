"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Mic, Volume2, VolumeX, Sparkles } from "lucide-react";
import { useVoiceAssistant } from "@/context/VoiceAssistantContext";

export function VoiceAssistantWidget() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  const {
    isListening,
    isSpeaking,
    transcript,
    lastResponse,
    isMuted,
    startListening,
    stopListening,
    toggleListening,
    toggleMute,
    processVoiceCommand,
  } = useVoiceAssistant();

  const [isMounted, setIsMounted] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // When on login or register, immediately silence any speech and stop listening
  useEffect(() => {
    if (isAuthPage) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      stopListening();
      setShowSubtitle(false);
    }
  }, [isAuthPage, stopListening]);

  // Show floating Siri-style spoken response subtitle whenever the assistant speaks
  useEffect(() => {
    if (isSpeaking || lastResponse) {
      setShowSubtitle(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

      if (!isSpeaking && lastResponse) {
        // Auto-dismiss the spoken response subtitle 5 seconds after speech completes
        hideTimerRef.current = setTimeout(() => {
          setShowSubtitle(false);
        }, 5000);
      }
    }
  }, [isSpeaking, lastResponse]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Tap 3D ball to toggle voice conversation
  const handleBallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleListening();
  };

  if (!isMounted || isAuthPage) {
    return null;
  }

  return (
    <div
      data-voice-widget="true"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none pointer-events-none"
    >
      {/* Siri / Alexa Voice HUD Subtitle Bubble (NO CHAT WINDOW, Pure Spoken Voice Dialogue) */}
      {(isListening || (showSubtitle && (isSpeaking || lastResponse))) && (
        <div
          data-voice-hud="true"
          className="pointer-events-auto mb-3 w-[calc(100vw-3rem)] max-w-sm sm:max-w-md md:max-w-lg px-4 py-3.5 rounded-2xl bg-slate-900/95 text-white backdrop-blur-md shadow-2xl border border-slate-700/60 flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
        >
          {isListening ? (
            <>
              {/* Dynamic Animated Sound Waves while User is Speaking */}
              <div className="flex items-center gap-1 h-5 mt-0.5 flex-shrink-0">
                <span className="w-1 bg-rose-400 rounded-full animate-bounce h-3" />
                <span className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:150ms] h-5" />
                <span className="w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:300ms] h-6" />
                <span className="w-1 bg-rose-400 rounded-full animate-bounce [animation-delay:450ms] h-4" />
                <span className="w-1 bg-sky-400 rounded-full animate-bounce [animation-delay:600ms] h-2" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400 block mb-0.5">
                  Medi is listening...
                </span>
                <p className="text-xs text-slate-100 font-medium italic leading-relaxed break-words whitespace-normal">
                  {transcript || "Listening... Speak your question or command"}
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Spoken Response from Voice Assistant */}
              <div className="w-6 h-6 rounded-full bg-sky-500/25 text-sky-400 flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-sky-400/40">
                {isSpeaking ? (
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                    Medi
                  </span>
                  {isSpeaking && (
                    <span className="text-[9px] text-sky-300 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                      Speaking...
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-100 font-medium leading-relaxed break-words whitespace-normal">
                  {lastResponse}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating 3D Siri / Alexa Voice Ball (Photorealistic Sphere) */}
      <div className="relative group cursor-pointer pointer-events-auto">
        {/* Floor Contact Shadow */}
        <div
          className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-16 h-3.5 rounded-full blur-md pointer-events-none transition-all duration-300 ${
            isListening
              ? "bg-rose-950/50 w-18 scale-110"
              : isSpeaking
              ? "bg-sky-950/50 w-18 scale-110"
              : "bg-sky-950/35 group-hover:scale-115 group-hover:bg-sky-950/50"
          }`}
        />

        {/* Outer Radiant Glow Rings */}
        <span
          className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-500 ${
            isListening
              ? "bg-rose-500/50 animate-ping scale-135"
              : isSpeaking
              ? "bg-sky-400/50 animate-ping scale-120"
              : "bg-sky-400/25 group-hover:scale-125 group-hover:bg-sky-400/35 animate-pulse"
          }`}
        />

        {/* Ambient Ring Light */}
        <span
          className={`absolute -inset-1 rounded-full pointer-events-none transition-all duration-300 ${
            isListening
              ? "ring-4 ring-rose-400/70"
              : isSpeaking
              ? "ring-4 ring-sky-400/70"
              : "ring-2 ring-sky-300/40 group-hover:ring-sky-400/70"
          }`}
        />

        {/* Audio Mute/Unmute Quick Toggle Pill */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          title={isMuted ? "Unmute Spoken Audio" : "Mute Spoken Audio"}
          className="absolute -top-1 -left-1 z-20 w-6 h-6 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-md border border-slate-700/80 transition-all opacity-80 group-hover:opacity-100 scale-90 hover:scale-110"
        >
          {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-sky-400" />}
        </button>

        {/* Large 3D Spherical Ball (80px x 80px: w-20 h-20) */}
        <button
          type="button"
          data-voice-ball="true"
          data-hydrated={isMounted ? "true" : "false"}
          data-listening={isListening ? "true" : "false"}
          data-speaking={isSpeaking ? "true" : "false"}
          onClick={handleBallClick}
          aria-label="Voice Assistant Microphone"
          title={
            isListening
              ? "Listening... Tap to stop"
              : isSpeaking
              ? "Voice AI speaking... Tap to interrupt"
              : "MediBook Voice AI • Tap to speak"
          }
          style={{
            background: isListening
              ? "radial-gradient(circle at 35% 28%, #fb7185 0%, #f43f5e 25%, #e11d48 55%, #be123c 80%, #881337 100%)"
              : isSpeaking
              ? "radial-gradient(circle at 35% 28%, #67e8f9 0%, #06b6d4 25%, #0284c7 60%, #1e40af 85%, #172554 100%)"
              : "radial-gradient(circle at 35% 28%, #7dd3fc 0%, #38bdf8 22%, #0284c7 55%, #0369a1 80%, #075985 100%)",
            boxShadow: isListening
              ? "inset 0 3px 6px rgba(255, 255, 255, 0.75), inset -5px -8px 16px rgba(113, 10, 40, 0.8), 0 12px 30px rgba(225, 29, 72, 0.55), 0 4px 10px rgba(0, 0, 0, 0.25)"
              : isSpeaking
              ? "inset 0 3px 6px rgba(255, 255, 255, 0.75), inset -5px -8px 16px rgba(15, 23, 42, 0.8), 0 12px 30px rgba(14, 165, 233, 0.55), 0 4px 10px rgba(0, 0, 0, 0.25)"
              : "inset 0 3px 6px rgba(255, 255, 255, 0.8), inset -5px -8px 16px rgba(3, 40, 75, 0.75), 0 12px 28px rgba(2, 132, 199, 0.45), 0 4px 10px rgba(0, 0, 0, 0.2)",
          }}
          className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform group-hover:scale-108 group-hover:-translate-y-1 active:scale-95 cursor-pointer overflow-hidden border border-white/40"
        >
          {/* Top-Left 3D Specular Highlight (Simulates Glass Sphere Light Glint) */}
          <span
            style={{
              background:
                "radial-gradient(ellipse at 50% 25%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.3) 40%, rgba(255, 255, 255, 0) 75%)",
            }}
            className="absolute -top-1 left-3 w-12 h-8 rounded-full pointer-events-none rotate-[-15deg]"
          />

          {/* Bottom Rim Light Reflection */}
          <span
            style={{
              background:
                "radial-gradient(ellipse at bottom, rgba(186, 230, 253, 0.5) 0%, rgba(186, 230, 253, 0) 70%)",
            }}
            className="absolute bottom-0 inset-x-3 h-5 rounded-full pointer-events-none"
          />

          {/* Centered Embossed Microphone Icon */}
          <div className="relative z-10 flex items-center justify-center">
            {isListening ? (
              <Mic className="w-9 h-9 text-white animate-bounce filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]" />
            ) : isSpeaking ? (
              <Volume2 className="w-9 h-9 text-white animate-pulse filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]" />
            ) : (
              <Mic className="w-9 h-9 text-white transition-transform group-hover:scale-110 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
