"use client";

import React, { useState, useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
  CreditCard,
  Percent,
  Plus,
  Trash2,
  QrCode,
  ShieldCheck,
  Receipt,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvoiceSettingsPage() {
  const [formData, setFormData] = useState({
    // General
    invoicePrefix: "INV",
    invoiceFormat: "INV-{YYYY}-{0000}",
    
    // Payment Types
    paymentTypes: [
      { id: "pt-1", name: "Confirmation Fee", enabled: true },
      { id: "pt-2", name: "Advance Payment", enabled: true },
      { id: "pt-3", name: "Instalment 1", enabled: true },
      { id: "pt-4", name: "Instalment 2", enabled: true },
      { id: "pt-5", name: "Instalment 3", enabled: true },
      { id: "pt-6", name: "Instalment 4", enabled: true },
      { id: "pt-7", name: "Material Payment", enabled: true },
      { id: "pt-8", name: "Installation Payment", enabled: true },
      { id: "pt-9", name: "Final Payment", enabled: true },
      { id: "pt-10", name: "Other", enabled: true },
    ],
    newPaymentType: "",

    // Payment Modes
    paymentModes: [
      { id: "pm-1", name: "Cash", enabled: true },
      { id: "pm-2", name: "UPI", enabled: true },
      { id: "pm-3", name: "Bank Transfer", enabled: true },
      { id: "pm-4", name: "Cheque", enabled: true },
      { id: "pm-5", name: "Card", enabled: true },
      { id: "pm-6", name: "Other", enabled: true },
    ],

    // GST Configuration
    enableGst: true,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,

    // Discount Configuration
    enableDiscount: true,
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    defaultDiscountValue: 0,

    // Invoice Content
    defaultNotes: "Thank you for partnering with ESPACIO Interiors. All modular woodwork and interior execution follow strict quality assurance standards.",
    termsAndConditions: "1. All payments made are non-refundable once site execution/procurement commences.\n2. Invoices are generated against verified milestone completions or stage advances.\n3. Cheques/Transfers are subject to bank clearance.\n4. Disputes are subject to local jurisdiction.",

    // Banking Details
    bankName: "HDFC Bank",
    accountHolder: "ESPACIO INTERIORS PRIVATE LIMITED",
    accountNumber: "50200088991122",
    ifsc: "HDFC0001234",
    branch: "Banjara Hills, Hyderabad",
    upiId: "espaciointeriors@hdfcbank",
    qrCodeUrl: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchInvoiceSettings();
  }, []);

  const fetchInvoiceSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings/invoices");
      const json = await res.json();
      if (json.success && json.data) {
        setFormData((prev) => ({
          ...prev,
          ...json.data,
          paymentTypes: json.data.paymentTypes || prev.paymentTypes,
          paymentModes: json.data.paymentModes || prev.paymentModes,
        }));
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const togglePaymentType = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentTypes: prev.paymentTypes.map((pt) =>
        pt.id === id ? { ...pt, enabled: !pt.enabled } : pt
      ),
    }));
    setHasChanges(true);
  };

  const addPaymentType = () => {
    if (!formData.newPaymentType.trim()) return;
    const newPt = {
      id: `pt-${Date.now()}`,
      name: formData.newPaymentType.trim(),
      enabled: true,
    };
    setFormData((prev) => ({
      ...prev,
      paymentTypes: [...prev.paymentTypes, newPt],
      newPaymentType: "",
    }));
    setHasChanges(true);
  };

  const removePaymentType = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentTypes: prev.paymentTypes.filter((pt) => pt.id !== id),
    }));
    setHasChanges(true);
  };

  const togglePaymentMode = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentModes: prev.paymentModes.map((pm) =>
        pm.id === id ? { ...pm, enabled: !pm.enabled } : pm
      ),
    }));
    setHasChanges(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/settings/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (json.success) {
        setMessage({ type: "success", text: "Invoice settings updated successfully." });
        setHasChanges(false);
      } else {
        setMessage({ type: "error", text: json.error?.message || "Failed to update settings" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred while saving invoice settings" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#FDFBF7]">
      <SettingsSidebar />

      <main className="flex-1 p-6 md:p-8 max-w-5xl">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C5A880]/20 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#111827] tracking-tight">Invoice Settings</h1>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Configure invoice numbering, GST rates, payment types, modes, banking, and document terms
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSaving || !hasChanges}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 h-9 shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Settings"}</span>
            </Button>
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* 1. GENERAL CONFIGURATION */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              1. General Invoice Configuration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Number Prefix
                </label>
                <input
                  type="text"
                  value={formData.invoicePrefix}
                  onChange={(e) => handleInputChange("invoicePrefix", e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="e.g. INV"
                />
                <p className="text-[10px] text-slate-400 mt-1">Leading identifier for all generated invoices.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Number Format Structure
                </label>
                <input
                  type="text"
                  value={formData.invoiceFormat}
                  onChange={(e) => handleInputChange("invoiceFormat", e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  placeholder="INV-{YYYY}-{0000}"
                />
                <p className="text-[10px] text-slate-400 mt-1">Example: INV-2026-0001</p>
              </div>
            </div>
          </div>

          {/* 2. PAYMENT TYPES CONFIGURATION */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                2. Configurable Payment Types
              </h2>
              <span className="text-[10px] text-slate-400">Used during invoice creation dropdown</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {formData.paymentTypes.map((pt) => (
                <div
                  key={pt.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                    pt.enabled
                      ? "bg-slate-50 border-slate-200 text-slate-900"
                      : "bg-slate-100/50 border-slate-200 text-slate-400"
                  }`}
                >
                  <span className="font-semibold truncate">{pt.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePaymentType(pt.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                        pt.enabled
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {pt.enabled ? "Active" : "Disabled"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removePaymentType(pt.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Delete payment type"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Payment Type */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={formData.newPaymentType}
                onChange={(e) => handleInputChange("newPaymentType", e.target.value)}
                placeholder="Enter new payment type (e.g. Milestone 5, Handover Fee)..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPaymentType();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addPaymentType}
                size="sm"
                className="bg-slate-900 hover:bg-black text-white text-xs h-8 px-3 gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Type
              </Button>
            </div>
          </div>

          {/* 3. PAYMENT MODES CONFIGURATION */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              3. Payment Modes
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {formData.paymentModes.map((pm) => (
                <div
                  key={pm.id}
                  onClick={() => togglePaymentMode(pm.id)}
                  className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                    pm.enabled
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                      : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                  }`}
                >
                  <div className="text-xs font-bold">{pm.name}</div>
                  <div className="text-[10px] mt-1 font-semibold text-emerald-700">
                    {pm.enabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. GST CONFIGURATION */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                4. GST Configuration
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableGst}
                  onChange={(e) => handleInputChange("enableGst", e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800">Enable GST on Invoices</span>
              </label>
            </div>

            {formData.enableGst ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CGST Rate (%)
                  </label>
                  <input
                    type="number"
                    value={formData.cgstRate}
                    onChange={(e) => handleInputChange("cgstRate", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SGST Rate (%)
                  </label>
                  <input
                    type="number"
                    value={formData.sgstRate}
                    onChange={(e) => handleInputChange("sgstRate", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IGST Rate (Inter-State %)
                  </label>
                  <input
                    type="number"
                    value={formData.igstRate}
                    onChange={(e) => handleInputChange("igstRate", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                GST is disabled. No GST components or taxes will be added during invoice generation.
              </p>
            )}
          </div>

          {/* 5. DISCOUNT CONFIGURATION */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                5. Discount Configuration
              </h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableDiscount}
                  onChange={(e) => handleInputChange("enableDiscount", e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800">Enable Discounting</span>
              </label>
            </div>

            {formData.enableDiscount && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => handleInputChange("discountType", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 6. BANKING DETAILS */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              6. Official Banking Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange("bankName", e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder</label>
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => handleInputChange("accountHolder", e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifsc}
                  onChange={(e) => handleInputChange("ifsc", e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => handleInputChange("branch", e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official UPI ID</label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => handleInputChange("upiId", e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 7. INVOICE CONTENT & TERMS */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              7. Default Invoice Notes & Terms
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Notes</label>
                <textarea
                  rows={3}
                  value={formData.defaultNotes}
                  onChange={(e) => handleInputChange("defaultNotes", e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Terms & Conditions</label>
                <textarea
                  rows={4}
                  value={formData.termsAndConditions}
                  onChange={(e) => handleInputChange("termsAndConditions", e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
