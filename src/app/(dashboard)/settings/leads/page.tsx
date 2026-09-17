"use client";

import React, { useState, useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  UserPlus,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck,
  Globe,
  Share2,
  PhoneCall,
  UserCheck,
  Building,
  HelpCircle,
} from "lucide-react";

interface ConfigOptionItem {
  key: string;
  name: string;
  isActive: boolean;
  displayOrder?: number;
}

export default function LeadSettingsPage() {
  const [formData, setFormData] = useState({
    prefix: "LD",
    numberFormat: "{PREFIX}-{YEAR}-{SEQ}",
    sources: [] as ConfigOptionItem[],
    propertyTypes: [] as ConfigOptionItem[],
    lossReasons: [] as ConfigOptionItem[],
    allowOtherSources: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newSourceName, setNewSourceName] = useState("");
  const [newPropertyTypeName, setNewPropertyTypeName] = useState("");
  const [newLossReason, setNewLossReason] = useState("");

  useEffect(() => {
    fetchLeadSettings();
  }, []);

  const fetchLeadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings/leads");
      const json = await res.json();
      if (json.success && json.data) {
        setFormData({
          prefix: json.data.prefix || "LD",
          numberFormat: json.data.numberFormat || "{PREFIX}-{YEAR}-{SEQ}",
          sources: json.data.sources || [],
          propertyTypes: json.data.propertyTypes || [],
          lossReasons: json.data.lossReasons || [],
          allowOtherSources: json.data.allowOtherSources ?? true,
        });
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSourceActive = (index: number) => {
    const updated = [...formData.sources];
    updated[index].isActive = !updated[index].isActive;
    setFormData({ ...formData, sources: updated });
  };

  const togglePropertyTypeActive = (index: number) => {
    const updated = [...formData.propertyTypes];
    updated[index].isActive = !updated[index].isActive;
    setFormData({ ...formData, propertyTypes: updated });
  };

  const toggleLossReasonActive = (index: number) => {
    const updated = [...formData.lossReasons];
    updated[index].isActive = !updated[index].isActive;
    setFormData({ ...formData, lossReasons: updated });
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) return;

    const key = newSourceName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
    if (formData.sources.some((s) => s.key === key)) {
      setMessage({ type: "error", text: "A lead source with this name already exists" });
      return;
    }

    setFormData({
      ...formData,
      sources: [
        ...formData.sources,
        { key, name: newSourceName.trim(), isActive: true, displayOrder: formData.sources.length + 1 },
      ],
    });
    setNewSourceName("");
    setMessage({ type: "success", text: "Added lead source. Click Save to persist." });
  };

  const handleAddPropertyType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropertyTypeName.trim()) return;

    const key = newPropertyTypeName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
    if (formData.propertyTypes.some((p) => p.key === key)) {
      setMessage({ type: "error", text: "A property type with this name already exists" });
      return;
    }

    setFormData({
      ...formData,
      propertyTypes: [
        ...formData.propertyTypes,
        { key, name: newPropertyTypeName.trim(), isActive: true, displayOrder: formData.propertyTypes.length + 1 },
      ],
    });
    setNewPropertyTypeName("");
    setMessage({ type: "success", text: "Added property type. Click Save to persist." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/settings/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Lead settings saved successfully" });
      } else {
        setMessage({ type: "error", text: json.error?.message || "Failed to save lead settings" });
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
                CRM Configuration
              </span>
            </div>
            <h1 className="text-xl font-black text-[#423C36] tracking-tight mt-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#C5A880]" /> Lead Sources &amp; CRM Settings
            </h1>
            <p className="text-xs text-[#423C36]/70 mt-0.5">
              Configure lead acquisition channels, property classifications, loss reasons, and Lead ID format.
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
            Loading lead settings...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Lead ID Format (Rule 32) */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2">
                Lead Identification &amp; Numbering Format (Rule 32)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Lead ID Prefix</label>
                  <input
                    type="text"
                    required
                    value={formData.prefix}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="LD"
                  />
                  <span className="text-[10px] text-[#423C36]/60 mt-1 block">
                    Example: {formData.prefix}-2026-0001 (Existing Lead IDs remain unchanged)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Numbering Pattern</label>
                  <input
                    type="text"
                    disabled
                    value="{PREFIX}-{YEAR}-{SEQ}"
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF6EF]/80 border border-[#C5A880]/30 rounded-xl text-[#423C36] opacity-80 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-[#423C36]/60 mt-1 block">Guarantees sequential uniqueness</span>
                </div>
              </div>
            </div>

            {/* 2. Lead Sources (Rule 16 & 17) */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <div className="border-b border-[#C5A880]/15 pb-2">
                <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider">
                  Lead Acquisition Sources &amp; Global &ldquo;Others&rdquo; Rule (Rules 16 &amp; 17)
                </h2>
                <p className="text-[11px] text-[#423C36]/70 mt-0.5">
                  When &ldquo;Others&rdquo; is chosen in any form across the ERP, a manual input field automatically appears.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.sources.map((src, idx) => (
                  <div
                    key={src.key}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      src.isActive
                        ? "bg-[#FAF6EF]/40 border-[#C5A880]/20"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#423C36] flex items-center gap-1.5">
                        <span>{src.name}</span>
                        {src.key === "OTHER" && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            Global Others Rule
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#423C36]/50">{src.key}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSourceActive(idx)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                        src.isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {src.isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Source */}
              <div className="pt-3 border-t border-[#C5A880]/15 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder="New lead source (e.g. Architectural Expo 2026)..."
                  className="w-full sm:flex-1 px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                />
                <button
                  type="button"
                  onClick={handleAddSource}
                  className="w-full sm:w-auto px-4 py-2 bg-[#423C36] hover:bg-[#2F2B26] text-[#FAF6EF] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Add Source</span>
                </button>
              </div>
            </div>

            {/* 3. Property Types */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2">
                Property Classifications &amp; Requirements
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.propertyTypes.map((prop, idx) => (
                  <div
                    key={prop.key}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      prop.isActive
                        ? "bg-[#FAF6EF]/40 border-[#C5A880]/20"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#423C36]">{prop.name}</div>
                      <span className="text-[10px] font-mono text-[#423C36]/50">{prop.key}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => togglePropertyTypeActive(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shrink-0 ${
                        prop.isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {prop.isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Property Type */}
              <div className="pt-3 border-t border-[#C5A880]/15 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={newPropertyTypeName}
                  onChange={(e) => setNewPropertyTypeName(e.target.value)}
                  placeholder="New property type (e.g. Farmhouse / Studio)..."
                  className="w-full sm:flex-1 px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                />
                <button
                  type="button"
                  onClick={handleAddPropertyType}
                  className="w-full sm:w-auto px-4 py-2 bg-[#423C36] hover:bg-[#2F2B26] text-[#FAF6EF] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Add Type</span>
                </button>
              </div>
            </div>

            {/* Safety Guarantee */}
            <div className="bg-[#FAF6EF] p-4 rounded-xl border border-[#C5A880]/20 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
              <div className="text-xs text-[#423C36]/80 leading-relaxed">
                <strong>Historical Data Preservation (Rule 62):</strong> Changing or deactivating a lead source never removes or modifies existing leads. An old lead originally tagged as &ldquo;Referral&rdquo; will continue to display &ldquo;Referral&rdquo; accurately.
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-bold text-[#423C36] bg-[#C5A880] hover:bg-[#B39366] rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Lead Settings"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
