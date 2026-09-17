"use client";

import React, { useState, useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  FolderKanban,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck,
  Layers,
  Clock,
  LayoutGrid,
} from "lucide-react";

interface ProjectCategoryItem {
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export default function ProjectSettingsPage() {
  const [formData, setFormData] = useState({
    prefix: "PRJ",
    numberFormat: "{PREFIX}-{YEAR}-{SEQ}",
    categories: [] as ProjectCategoryItem[],
    defaultCategory: "RESIDENTIAL_TURNKEY",
    defaultTimelineDays: 45,
  });

  const [stages, setStages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  useEffect(() => {
    fetchProjectSettings();
  }, []);

  const fetchProjectSettings = async () => {
    setIsLoading(true);
    try {
      const [projRes, stagesRes] = await Promise.all([
        fetch("/api/v1/settings/projects"),
        fetch("/api/v1/settings/stages"),
      ]);

      const projJson = await projRes.json();
      if (projJson.success && projJson.data) {
        setFormData(projJson.data);
      }

      const stagesJson = await stagesRes.json();
      if (stagesJson.success && stagesJson.data) {
        setStages(stagesJson.data);
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategoryActive = (index: number) => {
    const updated = [...formData.categories];
    updated[index].isActive = !updated[index].isActive;
    setFormData({ ...formData, categories: updated });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const key = newCatName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
    if (formData.categories.some((c) => c.key === key)) {
      setMessage({ type: "error", text: "A project category with this name already exists" });
      return;
    }

    setFormData({
      ...formData,
      categories: [
        ...formData.categories,
        { key, name: newCatName.trim(), description: newCatDesc.trim() || undefined, isActive: true },
      ],
    });
    setNewCatName("");
    setNewCatDesc("");
    setMessage({ type: "success", text: "Added project category. Click Save to persist." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/settings/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Project settings saved successfully" });
      } else {
        setMessage({ type: "error", text: json.error?.message || "Failed to save project settings" });
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
                Operations Configuration
              </span>
            </div>
            <h1 className="text-xl font-black text-[#423C36] tracking-tight mt-1 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-[#C5A880]" /> Project Settings
            </h1>
            <p className="text-xs text-[#423C36]/70 mt-0.5">
              Configure project classifications, numbering prefixes, execution timeline defaults, and stage workflows.
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
            Loading project settings...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Project ID Format (Rule 30 & 31) */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2">
                Project Identification &amp; Numbering Format (Rule 31)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Project ID Prefix</label>
                  <input
                    type="text"
                    required
                    value={formData.prefix}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="PRJ"
                  />
                  <span className="text-[10px] text-[#423C36]/60 mt-1 block">
                    Example: {formData.prefix}-2026-0001
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Default Execution Timeline</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={formData.defaultTimelineDays}
                      onChange={(e) => setFormData({ ...formData, defaultTimelineDays: parseInt(e.target.value) || 45 })}
                      className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#423C36]/50">Days</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Default Scope Category</label>
                  <select
                    value={formData.defaultCategory}
                    onChange={(e) => setFormData({ ...formData, defaultCategory: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  >
                    {formData.categories.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Project Categories */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2">
                Project Scope Categories
              </h2>

              <div className="space-y-2.5">
                {formData.categories.map((cat, idx) => (
                  <div
                    key={cat.key}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 ${
                      cat.isActive
                        ? "bg-[#FAF6EF]/40 border-[#C5A880]/20"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#423C36]">{cat.name}</div>
                      {cat.description && (
                        <p className="text-[11px] text-[#423C36]/70 mt-0.5">{cat.description}</p>
                      )}
                      <span className="text-[10px] font-mono text-[#423C36]/50">{cat.key}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCategoryActive(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                        cat.isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {cat.isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Category */}
              <div className="pt-3 border-t border-[#C5A880]/15 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New project category (e.g. Retail Kiosk Fitout)..."
                  className="w-full sm:w-1/2 px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                />
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Short description..."
                  className="w-full sm:w-1/2 px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="w-full sm:w-auto px-4 py-2 bg-[#423C36] hover:bg-[#2F2B26] text-[#FAF6EF] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Add Category</span>
                </button>
              </div>
            </div>

            {/* 3. Execution Pipeline Stages Preview */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#C5A880]/15 pb-2">
                <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#C5A880]" /> 13-Stage Project Execution Workflow
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Standard Turnkey Pipeline Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {[
                  "1. Confirmation Fee Paid",
                  "2. Designing Phase",
                  "3. Design Sign-off",
                  "4. Material Selection",
                  "5. Raw Materials Ordered",
                  "6. Wood Work Execution",
                  "7. Wood Work Inspection",
                  "8. Laminates Ordered",
                  "9. Laminate Pasting",
                  "10. Hardware & Fitting Work",
                  "11. Quality Audit & Checks",
                  "12. Handover Sign-off",
                  "13. Project Completed",
                ].map((st, i) => (
                  <div key={i} className="p-2.5 bg-[#FAF6EF]/40 rounded-xl border border-[#C5A880]/20 text-xs font-medium text-[#423C36] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#C5A880]/20 text-[#423C36] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="truncate">{st.split(". ")[1]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Guarantee */}
            <div className="bg-[#FAF6EF] p-4 rounded-xl border border-[#C5A880]/20 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
              <div className="text-xs text-[#423C36]/80 leading-relaxed">
                <strong>Pipeline &amp; Historical Safety (Rule 30 &amp; 31):</strong> Adjusting category or ID formatting settings will not modify existing Project IDs, stage logs, payment milestones, or financial balances.
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-bold text-[#423C36] bg-[#C5A880] hover:bg-[#B39366] rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Project Settings"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
