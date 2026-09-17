"use client";

import React, { useState, useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  Globe2,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Coins,
  Languages,
  LayoutGrid,
  ShieldCheck,
} from "lucide-react";

export default function SystemPreferencesPage() {
  const [formData, setFormData] = useState({
    dateFormat: "DD/MM/YYYY" as "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD",
    timeFormat: "12_HOUR" as "12_HOUR" | "24_HOUR",
    currency: "INR",
    currencySymbol: "₹",
    timezone: "Asia/Kolkata (IST)",
    language: "English",
    tableDensity: "normal" as "compact" | "normal" | "comfortable",
    recordsPerPage: 20,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings/preferences");
      const json = await res.json();
      if (json.success && json.data) {
        setFormData({
          dateFormat: json.data.dateFormat || "DD/MM/YYYY",
          timeFormat: json.data.timeFormat || "12_HOUR",
          currency: json.data.currency || "INR",
          currencySymbol: json.data.currencySymbol || "₹",
          timezone: json.data.timezone || "Asia/Kolkata (IST)",
          language: json.data.language || "English",
          tableDensity: json.data.tableDensity || "normal",
          recordsPerPage: json.data.recordsPerPage ?? 20,
        });
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/settings/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "System preferences saved successfully" });
      } else {
        setMessage({ type: "error", text: json.error?.message || "Failed to save preferences" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#FAF8F5]">
      <SettingsSidebar />

      <main className="flex-1 p-4 md:p-8 max-w-5xl space-y-6">
        {/* Header */}
        <div className="border-b border-[#C5A880]/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#423C36] uppercase tracking-wider">
                Regional &amp; Localization
              </span>
            </div>
            <h1 className="text-xl font-black text-[#423C36] tracking-tight mt-1 flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-[#C5A880]" /> System Preferences (Rule 50)
            </h1>
            <p className="text-xs text-[#423C36]/70 mt-0.5">
              Configure date and time display formats, operating currency, timezone, language, and table density.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {isLoading ? (
          <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#C5A880]/20 text-center text-xs text-[#423C36]/50">
            Loading system preferences...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Date & Time Settings (Rule 51 & 52) */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C5A880]" /> Date &amp; Time Formatting (Rule 51)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Date Format</label>
                  <select
                    value={formData.dateFormat}
                    onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 07/09/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/07/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Time Format</label>
                  <select
                    value={formData.timeFormat}
                    onChange={(e) => setFormData({ ...formData, timeFormat: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  >
                    <option value="12_HOUR">12-Hour (e.g. 02:30 PM)</option>
                    <option value="24_HOUR">24-Hour (e.g. 14:30)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Operating Timezone (Rule 52)</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  >
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST, UTC +05:30)</option>
                    <option value="UTC">Universal Coordinated Time (UTC)</option>
                    <option value="Asia/Dubai (GST)">Asia/Dubai (GST, UTC +04:00)</option>
                    <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT, UTC +08:00)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Currency & Language (Rule 24 & 53) */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2 flex items-center gap-2">
                <Languages className="w-4 h-4 text-[#C5A880]" /> Language &amp; Operating Currency
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Primary Operating Currency</label>
                  <input
                    type="text"
                    disabled
                    value={`${formData.currency} (${formData.currencySymbol}) — Indian Rupee`}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/80 border border-[#C5A880]/30 rounded-xl text-[#423C36] opacity-80 cursor-not-allowed font-semibold"
                  />
                  <span className="text-[10px] text-[#423C36]/60 mt-1 block">
                    All financial balances are maintained and calculated in Indian Rupees (₹).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Application Language (Rule 53)</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  >
                    <option value="English">English (United Kingdom / India)</option>
                    <option value="Hindi" disabled>Hindi (Coming in V2 localization)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Table Density & Pagination */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-[#C5A880]" /> UI Display &amp; Density
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Table Data Density</label>
                  <select
                    value={formData.tableDensity}
                    onChange={(e) => setFormData({ ...formData, tableDensity: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  >
                    <option value="compact">Compact (Higher row density)</option>
                    <option value="normal">Normal (Default balanced view)</option>
                    <option value="comfortable">Comfortable (Spacious touch-friendly)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Default Records Per Page</label>
                  <select
                    value={formData.recordsPerPage}
                    onChange={(e) => setFormData({ ...formData, recordsPerPage: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  >
                    <option value={10}>10 items</option>
                    <option value={20}>20 items</option>
                    <option value={50}>50 items</option>
                    <option value={100}>100 items</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Safety Guarantee */}
            <div className="bg-[#FAF6EF] p-4 rounded-xl border border-[#C5A880]/20 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
              <div className="text-xs text-[#423C36]/80 leading-relaxed">
                <strong>Display Preference Safety (Rule 51):</strong> Changing date or time formats strictly affects UI presentation and will never alter underlying stored database timestamps or historical audit logs.
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-bold text-[#423C36] bg-[#C5A880] hover:bg-[#B39366] rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
