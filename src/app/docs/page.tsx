"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, ExternalLink, Sparkles } from "lucide-react";

export default function SwaggerDocsPage() {
  const [selectedSpec, setSelectedSpec] = useState<"nextjs" | "fastapi">("nextjs");

  useEffect(() => {
    // Dynamically inject Swagger UI CSS and JS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js";
    script.async = true;

    script.onload = () => {
      initSwagger(selectedSpec);
    };

    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).SwaggerUIBundle) {
      initSwagger(selectedSpec);
    }
  }, [selectedSpec]);

  const initSwagger = (specType: "nextjs" | "fastapi") => {
    const specUrl =
      specType === "nextjs"
        ? "/api/openapi.json"
        : "http://127.0.0.1:8000/openapi.json";

    const ui = (window as any).SwaggerUIBundle({
      url: specUrl,
      dom_id: "#swagger-ui",
      deepLinking: true,
      presets: [
        (window as any).SwaggerUIBundle.presets.apis,
        (window as any).SwaggerUIBundle.SwaggerUIStandalonePreset,
      ],
      layout: "BaseLayout",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 transition px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="h-5 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base text-slate-900">
                  Medi<span className="text-sky-600">Book</span>
                </span>
                <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Swagger UI
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Spec Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setSelectedSpec("nextjs")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedSpec === "nextjs"
                    ? "bg-white text-slate-900 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Core Web API (Next.js)
              </button>
              <button
                onClick={() => setSelectedSpec("fastapi")}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  selectedSpec === "fastapi"
                    ? "bg-white text-slate-900 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3 h-3 text-teal-600" />
                <span>AI Service (FastAPI)</span>
              </button>
            </div>

            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-sky-600 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              title="Open standalone FastAPI Swagger UI"
            >
              <span>FastAPI Direct /docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Swagger UI Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 overflow-hidden">
          <div className="mb-4 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {selectedSpec === "nextjs"
                  ? "MediBook Core REST API Specification"
                  : "FastAPI AI Query Parser Microservice Specification"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Interactive OpenAPI 3.0 documentation. Click &ldquo;Try it out&rdquo; to execute live test requests against the system.
              </p>
            </div>
            <a
              href={selectedSpec === "nextjs" ? "/api/openapi.json" : "http://127.0.0.1:8000/openapi.json"}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-sky-600 hover:underline font-medium"
            >
              Raw openapi.json
            </a>
          </div>

          <div id="swagger-ui" className="prose max-w-none" />
        </div>
      </main>
    </div>
  );
}

