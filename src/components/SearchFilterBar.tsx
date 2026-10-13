"use client";

import React, { useState } from "react";
import {
  Search,
  Sparkles,
  Filter,
  X,
  Calendar,
  User,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";
import { Doctor } from "@/lib/types";

interface SearchFilterBarProps {
  doctors: Doctor[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  selectedDoctor: string;
  onDoctorChange: (doctorId: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onResetFilters: () => void;
  isSearching: boolean;
  searchExplanation?: string | null;
  searchSource?: "ai-service" | "local-fallback" | "direct" | null;
}

export function SearchFilterBar({
  doctors,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedDoctor,
  onDoctorChange,
  selectedStatus,
  onStatusChange,
  selectedType,
  onTypeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onResetFilters,
  isSearching,
  searchExplanation,
  searchSource,
}: SearchFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const sampleQueries = [
    "cancelled appointments with Dr. Perera next week",
    "checkup with Dr. Jenkins today",
    "confirmed consultations",
    "follow-up with Dr. Vance",
  ];

  const hasActiveFilters =
    searchQuery ||
    selectedDoctor !== "all" ||
    selectedStatus !== "all" ||
    selectedType !== "all" ||
    startDate ||
    endDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(searchQuery);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-6">
      {/* Search Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Sparkles className="w-5 h-5 text-sky-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Type anything in plain English (e.g. 'cancelled appointments with Dr. Perera next week')..."
            className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition placeholder:text-slate-400 text-slate-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                onSearchSubmit("");
              }}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-medium transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSearching ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Search</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium transition flex items-center gap-1.5 ${
              showAdvanced
                ? "bg-slate-100 border-slate-300 text-slate-800"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              title="Reset all filters"
              className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Suggested Natural Language Prompts */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 text-xs">
        <span className="text-slate-400 font-medium mr-1">Try asking:</span>
        {sampleQueries.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onSearchChange(prompt);
              onSearchSubmit(prompt);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 border border-transparent text-slate-600 transition"
          >
            &ldquo;{prompt}&rdquo;
          </button>
        ))}
      </div>

      {/* Natural Language Interpretation Banner */}
      {searchExplanation && (
        <div className="mt-3 px-3.5 py-2 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-between text-xs text-sky-900">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider text-[10px] ${
                searchSource === "ai-service"
                  ? "bg-teal-600 text-white"
                  : "bg-sky-600 text-white"
              }`}
            >
              {searchSource === "ai-service" ? "AI Parsed" : "Local Parsed"}
            </span>
            <span className="font-medium">{searchExplanation}</span>
          </div>
          <button
            onClick={() => {
              onSearchChange("");
              onSearchSubmit("");
            }}
            className="text-sky-600 hover:text-sky-900 underline font-medium ml-2"
          >
            Clear
          </button>
        </div>
      )}

      {/* Advanced Filter Controls */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-150">
          {/* Doctor Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Doctor
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => onDoctorChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Doctors</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.specialty})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No-Show</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Appointment Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Types</option>
              <option value="CHECKUP">Checkup</option>
              <option value="CONSULTATION">Consultation</option>
              <option value="FOLLOW_UP">Follow-Up</option>
              <option value="ROUTINE_EXAM">Routine Exam</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="SPECIALIST_VISIT">Specialist Visit</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
