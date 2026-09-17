"use client";

import React, { useState, useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  CreditCard,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck,
  Coins,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";

export default function PaymentSettingsPage() {
  const [formData, setFormData] = useState({
    paymentTypes: [
      { key: "ADVANCE", label: "Advance Payment", description: "Initial commitment advance before project kick-off", isActive: true },
      { key: "MILESTONE", label: "Milestone Stage Payment", description: "Payment against completed project stage / milestone", isActive: true },
      { key: "PARTIAL", label: "Partial Payment", description: "Interim instalment towards outstanding balance", isActive: true },
      { key: "FINAL", label: "Final Payment", description: "Final settlement on project handover", isActive: true },
      { key: "RETENTION", label: "Retention / Warranty Holdback", description: "Security retention payable post warranty period", isActive: true },
    ],
    paymentMethods: [
      { key: "UPI", label: "UPI / QR Code", isSystem: true, isActive: true },
      { key: "BANK_TRANSFER", label: "Bank Transfer (NEFT / RTGS / IMPS)", isSystem: true, isActive: true },
      { key: "CHEQUE", label: "Bank Cheque / DD", isSystem: true, isActive: true },
      { key: "CASH", label: "Cash Payment", isSystem: true, isActive: true },
      { key: "CARD", label: "Debit / Credit Card", isSystem: true, isActive: true },
      { key: "OTHER", label: "Other (Manual Input)", isSystem: true, isActive: true },
    ],
    allowCustomMethods: true,
    defaultMethodKey: "BANK_TRANSFER",
    requireTransactionReference: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newMethodLabel, setNewMethodLabel] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings/payments");
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

  const toggleMethodActive = (index: number) => {
    const updated = [...formData.paymentMethods];
    updated[index].isActive = !updated[index].isActive;
    setFormData({ ...formData, paymentMethods: updated });
  };

  const toggleTypeActive = (index: number) => {
    const updated = [...formData.paymentTypes];
    updated[index].isActive = !updated[index].isActive;
    setFormData({ ...formData, paymentTypes: updated });
  };

  const handleAddCustomMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMethodLabel.trim()) return;

    const key = newMethodLabel.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
    if (formData.paymentMethods.some((m) => m.key === key)) {
      setMessage({ type: "error", text: "A payment method with this name already exists" });
      return;
    }

    setFormData({
      ...formData,
      paymentMethods: [
        ...formData.paymentMethods,
        { key, label: newMethodLabel.trim(), isSystem: false, isActive: true },
      ],
    });
    setNewMethodLabel("");
    setMessage({ type: "success", text: "Added custom payment method. Click Save to persist." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/settings/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Payment settings saved successfully" });
      } else {
        setMessage({ type: "error", text: json.error?.message || "Failed to save payment settings" });
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
                Financial Configuration
              </span>
            </div>
            <h1 className="text-xl font-black text-[#423C36] tracking-tight mt-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#C5A880]" /> Payment Settings
            </h1>
            <p className="text-xs text-[#423C36]/70 mt-0.5">
              Manage client payment methods, classification types, and transaction reference rules.
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
            Loading payment settings...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Payment Methods */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#C5A880]/15 pb-2">
                <div>
                  <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[#C5A880]" /> Accepted Payment Methods
                  </h2>
                  <p className="text-[11px] text-[#423C36]/70 mt-0.5">
                    Deactivate options to remove them from future payment forms. Historical records remain unaffected.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.paymentMethods.map((method, idx) => (
                  <div
                    key={method.key}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      method.isActive
                        ? "bg-[#FAF6EF]/60 border-[#C5A880]/30"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#423C36] flex items-center gap-1.5">
                        <span>{method.label}</span>
                        {method.isSystem && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#C5A880]/20 text-[#423C36]">
                            System
                          </span>
                        )}
                        {method.key === "OTHER" && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            Manual Input
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#423C36]/50">{method.key}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleMethodActive(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        method.isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {method.isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Payment Method */}
              <div className="pt-3 border-t border-[#C5A880]/15 flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={newMethodLabel}
                  onChange={(e) => setNewMethodLabel(e.target.value)}
                  placeholder="Enter custom payment method name (e.g. Escrow Account)..."
                  className="w-full sm:flex-1 px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                />
                <button
                  type="button"
                  onClick={handleAddCustomMethod}
                  className="w-full sm:w-auto px-4 py-2 bg-[#423C36] hover:bg-[#2F2B26] text-[#FAF6EF] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Add Method</span>
                </button>
              </div>
            </div>

            {/* 2. Payment Classification Types */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2">
                Payment Stage &amp; Classification Types
              </h2>

              <div className="space-y-2.5">
                {formData.paymentTypes.map((type, idx) => (
                  <div
                    key={type.key}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 ${
                      type.isActive
                        ? "bg-[#FAF6EF]/40 border-[#C5A880]/20"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#423C36]">{type.label}</div>
                      <p className="text-[11px] text-[#423C36]/70 mt-0.5">{type.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleTypeActive(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                        type.isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {type.isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Guarantee */}
            <div className="bg-[#FAF6EF] p-4 rounded-xl border border-[#C5A880]/20 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
              <div className="text-xs text-[#423C36]/80 leading-relaxed">
                <strong>Financial Calculation Guarantee (Rule 21):</strong> Modifying payment options or methods will never alter existing payment records, collected amounts, client receivables, or quotation financial calculations.
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-bold text-[#423C36] bg-[#C5A880] hover:bg-[#B39366] rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Payment Settings"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
