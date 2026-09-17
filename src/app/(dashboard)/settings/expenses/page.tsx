"use client";

import React, { useState, useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  Receipt,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck,
  FolderKanban,
  Building,
  Layers,
} from "lucide-react";

interface ExpenseCategoryItem {
  key: string;
  name: string;
  type: "PROJECT" | "BUSINESS" | "BOTH";
  isActive: boolean;
  displayOrder?: number;
}

export default function ExpenseSettingsPage() {
  const [categories, setCategories] = useState<ExpenseCategoryItem[]>([]);
  const [requireReceiptAbove, setRequireReceiptAbove] = useState(2000);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"PROJECT" | "BUSINESS" | "BOTH">("PROJECT");

  useEffect(() => {
    fetchExpenseSettings();
  }, []);

  const fetchExpenseSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings/expenses");
      const json = await res.json();
      if (json.success && json.data) {
        setCategories(json.data.categories || []);
        setRequireReceiptAbove(json.data.requireReceiptAbove ?? 2000);
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategoryActive = (index: number) => {
    const updated = [...categories];
    updated[index].isActive = !updated[index].isActive;
    setCategories(updated);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const key = newCatName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
    if (categories.some((c) => c.key === key)) {
      setMessage({ type: "error", text: "An expense category with this name already exists" });
      return;
    }

    setCategories([
      ...categories,
      {
        key,
        name: newCatName.trim(),
        type: newCatType,
        isActive: true,
        displayOrder: categories.length + 1,
      },
    ]);
    setNewCatName("");
    setMessage({ type: "success", text: "Added category. Click Save to persist." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/settings/expenses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories, requireReceiptAbove }),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Expense settings saved successfully" });
      } else {
        setMessage({ type: "error", text: json.error?.message || "Failed to save expense settings" });
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
                Cost &amp; Expense Management
              </span>
            </div>
            <h1 className="text-xl font-black text-[#423C36] tracking-tight mt-1 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#C5A880]" /> Expense Settings
            </h1>
            <p className="text-xs text-[#423C36]/70 mt-0.5">
              Manage Project and Business expense categories, receipt compliance limits, and active status.
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
            Loading expense settings...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Categories List */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#C5A880]/15 pb-2">
                <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#C5A880]" /> Configured Expense Categories ({categories.length})
                </h2>
              </div>

              <div className="space-y-2.5">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.key}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                      cat.isActive
                        ? "bg-[#FAF6EF]/40 border-[#C5A880]/20"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FAF6EF] border border-[#C5A880]/30 flex items-center justify-center shrink-0">
                        {cat.type === "PROJECT" ? (
                          <FolderKanban className="w-4 h-4 text-[#C5A880]" />
                        ) : cat.type === "BUSINESS" ? (
                          <Building className="w-4 h-4 text-[#423C36]" />
                        ) : (
                          <Receipt className="w-4 h-4 text-emerald-700" />
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-[#423C36] flex items-center gap-2">
                          <span>{cat.name}</span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                              cat.type === "PROJECT"
                                ? "bg-blue-50 text-blue-800 border border-blue-200"
                                : cat.type === "BUSINESS"
                                ? "bg-purple-50 text-purple-800 border border-purple-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {cat.type}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#423C36]/50">{cat.key}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCategoryActive(idx)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                        cat.isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {cat.isActive ? "ACTIVE" : "DEACTIVATED"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Category Form */}
              <div className="pt-4 border-t border-[#C5A880]/15 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New expense category name (e.g. Architectural Licensing)..."
                  className="w-full sm:flex-1 px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                />

                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as any)}
                  className="w-full sm:w-auto px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                >
                  <option value="PROJECT">PROJECT EXPENSE</option>
                  <option value="BUSINESS">BUSINESS OVERHEAD</option>
                  <option value="BOTH">BOTH / SHARED</option>
                </select>

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

            {/* 2. Policy Limits */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2">
                Compliance &amp; Receipt Policy
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">
                    Require Receipt Attachment Above (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={requireReceiptAbove}
                    onChange={(e) => setRequireReceiptAbove(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  />
                  <span className="text-[10px] text-[#423C36]/60 mt-1 block">
                    Expenses above this amount trigger receipt attachment prompt
                  </span>
                </div>
              </div>
            </div>

            {/* Safety Guarantee */}
            <div className="bg-[#FAF6EF] p-4 rounded-xl border border-[#C5A880]/20 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
              <div className="text-xs text-[#423C36]/80 leading-relaxed">
                <strong>Data Safety Rule (Rules 19 &amp; 60):</strong> Deactivation is enforced instead of permanent deletion. Historical expense ledger records preserve their original category names even if a category is subsequently deactivated.
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-bold text-[#423C36] bg-[#C5A880] hover:bg-[#B39366] rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Expense Settings"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
