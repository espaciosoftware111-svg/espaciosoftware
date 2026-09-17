"use client";

import React, { useState, useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  Truck,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck,
  Package,
  Layers,
  Boxes,
} from "lucide-react";

interface ConfigOptionItem {
  key: string;
  name: string;
  isActive: boolean;
  displayOrder?: number;
}

export default function VendorSettingsPage() {
  const [formData, setFormData] = useState({
    categories: [] as ConfigOptionItem[],
    vendorTypes: [] as ConfigOptionItem[],
    materialCategories: [] as ConfigOptionItem[],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newCatName, setNewCatName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [newMaterialCatName, setNewMaterialCatName] = useState("");

  useEffect(() => {
    fetchVendorSettings();
  }, []);

  const fetchVendorSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings/vendors");
      const json = await res.json();
      if (json.success && json.data) {
        setFormData(json.data);
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

  const toggleTypeActive = (index: number) => {
    const updated = [...formData.vendorTypes];
    updated[index].isActive = !updated[index].isActive;
    setFormData({ ...formData, vendorTypes: updated });
  };

  const toggleMaterialCatActive = (index: number) => {
    const updated = [...formData.materialCategories];
    updated[index].isActive = !updated[index].isActive;
    setFormData({ ...formData, materialCategories: updated });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const key = newCatName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
    if (formData.categories.some((c) => c.key === key)) {
      setMessage({ type: "error", text: "A vendor category with this name already exists" });
      return;
    }

    setFormData({
      ...formData,
      categories: [
        ...formData.categories,
        { key, name: newCatName.trim(), isActive: true, displayOrder: formData.categories.length + 1 },
      ],
    });
    setNewCatName("");
    setMessage({ type: "success", text: "Added vendor category. Click Save to persist." });
  };

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    const key = newTypeName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
    if (formData.vendorTypes.some((t) => t.key === key)) {
      setMessage({ type: "error", text: "A vendor type with this name already exists" });
      return;
    }

    setFormData({
      ...formData,
      vendorTypes: [
        ...formData.vendorTypes,
        { key, name: newTypeName.trim(), isActive: true, displayOrder: formData.vendorTypes.length + 1 },
      ],
    });
    setNewTypeName("");
    setMessage({ type: "success", text: "Added vendor type. Click Save to persist." });
  };

  const handleAddMaterialCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialCatName.trim()) return;

    const key = newMaterialCatName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
    if (formData.materialCategories.some((m) => m.key === key)) {
      setMessage({ type: "error", text: "A material category with this name already exists" });
      return;
    }

    setFormData({
      ...formData,
      materialCategories: [
        ...formData.materialCategories,
        { key, name: newMaterialCatName.trim(), isActive: true, displayOrder: formData.materialCategories.length + 1 },
      ],
    });
    setNewMaterialCatName("");
    setMessage({ type: "success", text: "Added material category. Click Save to persist." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/settings/vendors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Vendor settings saved successfully" });
      } else {
        setMessage({ type: "error", text: json.error?.message || "Failed to save vendor settings" });
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
                Procurement &amp; Supply Chain
              </span>
            </div>
            <h1 className="text-xl font-black text-[#423C36] tracking-tight mt-1 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#C5A880]" /> Vendor &amp; Material Settings
            </h1>
            <p className="text-xs text-[#423C36]/70 mt-0.5">
              Configure vendor trade classifications, contractor engagement types, and raw material master categories.
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
            Loading vendor settings...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Vendor Trade Categories */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#C5A880]" /> Vendor Trade Categories ({formData.categories.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.categories.map((cat, idx) => (
                  <div
                    key={cat.key}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      cat.isActive
                        ? "bg-[#FAF6EF]/40 border-[#C5A880]/20"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#423C36]">{cat.name}</div>
                      <span className="text-[10px] font-mono text-[#423C36]/50">{cat.key}</span>
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
                      {cat.isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Trade Category */}
              <div className="pt-3 border-t border-[#C5A880]/15 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New vendor trade category (e.g. Marble & Granite)..."
                  className="w-full sm:flex-1 px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
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

            {/* 2. Raw Material Master Categories */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#C5A880]" /> Raw Material Categories (Rule 33)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.materialCategories.map((mat, idx) => (
                  <div
                    key={mat.key}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      mat.isActive
                        ? "bg-[#FAF6EF]/40 border-[#C5A880]/20"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#423C36]">{mat.name}</div>
                      <span className="text-[10px] font-mono text-[#423C36]/50">{mat.key}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleMaterialCatActive(idx)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                        mat.isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {mat.isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Material Category */}
              <div className="pt-3 border-t border-[#C5A880]/15 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={newMaterialCatName}
                  onChange={(e) => setNewMaterialCatName(e.target.value)}
                  placeholder="New material category (e.g. Solid Teak & Natural Wood)..."
                  className="w-full sm:flex-1 px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                />
                <button
                  type="button"
                  onClick={handleAddMaterialCategory}
                  className="w-full sm:w-auto px-4 py-2 bg-[#423C36] hover:bg-[#2F2B26] text-[#FAF6EF] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Add Material Category</span>
                </button>
              </div>
            </div>

            {/* 3. Vendor Types */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C5A880]" /> Contractor &amp; Supplier Types
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.vendorTypes.map((t, idx) => (
                  <div
                    key={t.key}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      t.isActive
                        ? "bg-[#FAF6EF]/40 border-[#C5A880]/20"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#423C36]">{t.name}</div>
                      <span className="text-[10px] font-mono text-[#423C36]/50">{t.key}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleTypeActive(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shrink-0 ${
                        t.isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {t.isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Type */}
              <div className="pt-3 border-t border-[#C5A880]/15 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="New vendor type..."
                  className="w-full sm:flex-1 px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                />
                <button
                  type="button"
                  onClick={handleAddType}
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
                <strong>Vendor History Safety (Rule 34):</strong> Categories already connected to existing Purchase Orders, Material Requests, or Goods Receipts will not be permanently deleted. Deactivation hides them from future forms while preserving vendor ledger integrity.
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-bold text-[#423C36] bg-[#C5A880] hover:bg-[#B39366] rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Vendor Settings"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
