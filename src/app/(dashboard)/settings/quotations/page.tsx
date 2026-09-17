"use client";

import React, { useState, useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Stamp,
  PenTool,
  Printer,
  MessageCircle,
  Percent,
  Calendar,
  Upload,
  Trash2,
  DollarSign,
  ShieldCheck,
  Plus,
  X,
} from "lucide-react";

export default function QuotationSettingsPage() {
  const [formData, setFormData] = useState({
    prefix: "QT",
    numberFormat: "{PREFIX}-{YEAR}-{SEQ}",
    currency: "INR",
    currencySymbol: "₹",
    enableGst: true,
    defaultGstRate: 18,
    defaultDiscountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    defaultDiscountValue: 0,
    defaultValidityDays: 30,
    defaultTermsAndConditions: `1. 50% Advance on signing BOQ.\n2. 40% before dispatch of materials.\n3. 10% on handover sign-off.\n4. Design modifications post-approval will incur revision charges.\n5. Site readiness is client responsibility.`,
    defaultFooter: "ESPACIO Turnkey Interiors • Validity 30 Days from date of issuance.",
    templateName: "DETAILED_BOQ",
    enableStamp: true,
    stampImageUrl: "/brand/espacio-stamp.png",
    enableSignature: true,
    signatureImageUrl: "/brand/espacio-signature.png",
    printIncludeSignature: false,
    whatsappIncludeSignature: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchQuotationSettings();
  }, []);

  const fetchQuotationSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings/quotations");
      const json = await res.json();
      if (json.success && json.data) {
        setFormData({
          prefix: json.data.prefix || "QT",
          numberFormat: json.data.numberFormat || "{PREFIX}-{YEAR}-{SEQ}",
          currency: json.data.currency || "INR",
          currencySymbol: json.data.currencySymbol || "₹",
          enableGst: json.data.enableGst ?? true,
          defaultGstRate: json.data.defaultGstRate ?? 18,
          defaultDiscountType: json.data.defaultDiscountType || "PERCENTAGE",
          defaultDiscountValue: json.data.defaultDiscountValue ?? 0,
          defaultValidityDays: json.data.defaultValidityDays ?? 30,
          defaultTermsAndConditions: json.data.defaultTermsAndConditions || "",
          defaultFooter: json.data.defaultFooter || "",
          templateName: json.data.templateName || "DETAILED_BOQ",
          enableStamp: json.data.enableStamp ?? true,
          stampImageUrl: json.data.stampImageUrl || "",
          enableSignature: json.data.enableSignature ?? true,
          signatureImageUrl: json.data.signatureImageUrl || "",
          printIncludeSignature: json.data.printIncludeSignature ?? false,
          whatsappIncludeSignature: json.data.whatsappIncludeSignature ?? true,
        });
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

  const handleFileUpload = (field: "stampImageUrl" | "signatureImageUrl", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: "error", text: "Uploaded file must be smaller than 2MB" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        handleInputChange(field, base64Url);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/settings/quotations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Quotation settings updated successfully" });
        setHasChanges(false);
      } else {
        setMessage({ type: "error", text: json.error?.message || "Failed to update quotation settings" });
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
                Sales &amp; Estimations
              </span>
              {hasChanges && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  Unsaved Changes
                </span>
              )}
            </div>
            <h1 className="text-xl font-black text-[#423C36] tracking-tight mt-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C5A880]" /> Quotation Settings
            </h1>
            <p className="text-xs text-[#423C36]/70 mt-0.5">
              Configure quotation numbering, GST defaults, terms &amp; conditions, official company stamp, signature, and dispatch rules.
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
            Loading quotation settings...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Numbering & Currency */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#C5A880]" /> Numbering &amp; Operating Currency
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Quotation ID Prefix</label>
                  <input
                    type="text"
                    required
                    value={formData.prefix}
                    onChange={(e) => handleInputChange("prefix", e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="QT"
                  />
                  <span className="text-[10px] text-[#423C36]/60 mt-1 block">Example: QT-2026-0001</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Default Operating Currency</label>
                  <input
                    type="text"
                    disabled
                    value={`${formData.currency} (${formData.currencySymbol})`}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/80 border border-[#C5A880]/30 rounded-xl text-[#423C36] font-semibold opacity-80 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-[#423C36]/60 mt-1 block">Indian Rupee (INR ₹)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Default Quotation Validity</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={formData.defaultValidityDays}
                      onChange={(e) => handleInputChange("defaultValidityDays", parseInt(e.target.value) || 30)}
                      className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#423C36]/50">Days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. GST & Tax Calculation */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#C5A880]/15 pb-2">
                <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider flex items-center gap-2">
                  <Percent className="w-4 h-4 text-[#C5A880]" /> GST &amp; Discount Configuration
                </h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableGst}
                    onChange={(e) => handleInputChange("enableGst", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#10B981]"></div>
                  <span className="ml-2 text-xs font-bold text-[#423C36]">
                    {formData.enableGst ? "GST Enabled (ON)" : "GST Disabled (OFF)"}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Default GST Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!formData.enableGst}
                    value={formData.defaultGstRate}
                    onChange={(e) => handleInputChange("defaultGstRate", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40 disabled:opacity-50"
                  />
                  <span className="text-[10px] text-[#423C36]/60 mt-1 block">Default rate applied when creating BOQ items</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Default Discount Mode</label>
                  <select
                    value={formData.defaultDiscountType}
                    onChange={(e) => handleInputChange("defaultDiscountType", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Default Discount Value</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.defaultDiscountValue}
                    onChange={(e) => handleInputChange("defaultDiscountValue", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  />
                </div>
              </div>
            </div>

            {/* 3. Company Stamp & Custom Signature */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-6">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2 flex items-center gap-2">
                <Stamp className="w-4 h-4 text-[#C5A880]" /> Company Stamp &amp; Signature Settings
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Stamp Card */}
                <div className="p-4 bg-[#FAF6EF] rounded-xl border border-[#C5A880]/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#423C36] flex items-center gap-1.5">
                      <Stamp className="w-4 h-4 text-[#C5A880]" /> Official Stamp
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enableStamp}
                        onChange={(e) => handleInputChange("enableStamp", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#10B981]"></div>
                      <span className="ml-1.5 text-[11px] font-bold text-[#423C36]">
                        {formData.enableStamp ? "STAMP ON" : "STAMP OFF"}
                      </span>
                    </label>
                  </div>

                  <div className="h-24 bg-[#FFFFFF] rounded-lg border border-[#C5A880]/30 flex items-center justify-center p-2">
                    {formData.stampImageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={formData.stampImageUrl} alt="Company Stamp" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[11px] text-[#423C36]/50 italic">No stamp image uploaded</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1 bg-[#423C36] hover:bg-[#2F2B26] text-[#FAF6EF] rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3 h-3 text-[#C5A880]" />
                      <span>Upload Stamp</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload("stampImageUrl", e)} className="hidden" />
                    </label>
                    {formData.stampImageUrl && (
                      <button
                        type="button"
                        onClick={() => handleInputChange("stampImageUrl", "")}
                        className="px-2 py-1 text-rose-700 hover:bg-rose-50 rounded-lg text-[11px] font-semibold border border-rose-200 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Signature Card */}
                <div className="p-4 bg-[#FAF6EF] rounded-xl border border-[#C5A880]/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#423C36] flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-[#C5A880]" /> Authorized Signature
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enableSignature}
                        onChange={(e) => handleInputChange("enableSignature", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#10B981]"></div>
                      <span className="ml-1.5 text-[11px] font-bold text-[#423C36]">
                        {formData.enableSignature ? "CUSTOM SIGNATURE" : "NO SIGNATURE"}
                      </span>
                    </label>
                  </div>

                  <div className="h-24 bg-[#FFFFFF] rounded-lg border border-[#C5A880]/30 flex items-center justify-center p-2">
                    {formData.signatureImageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={formData.signatureImageUrl} alt="Authorized Signature" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[11px] text-[#423C36]/50 italic">No signature image uploaded</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1 bg-[#423C36] hover:bg-[#2F2B26] text-[#FAF6EF] rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3 h-3 text-[#C5A880]" />
                      <span>Upload Signature</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload("signatureImageUrl", e)} className="hidden" />
                    </label>
                    {formData.signatureImageUrl && (
                      <button
                        type="button"
                        onClick={() => handleInputChange("signatureImageUrl", "")}
                        className="px-2 py-1 text-rose-700 hover:bg-rose-50 rounded-lg text-[11px] font-semibold border border-rose-200 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quotation Print & WhatsApp Rules (Rule 29) */}
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#C5A880]/20 space-y-3">
                <h3 className="text-xs font-bold text-[#423C36]">Quotation Print &amp; WhatsApp Signature Rules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.printIncludeSignature}
                      onChange={(e) => handleInputChange("printIncludeSignature", e.target.checked)}
                      className="mt-0.5 rounded border-[#C5A880] text-[#C5A880] focus:ring-[#C5A880]"
                    />
                    <div>
                      <span className="font-bold text-[#423C36] flex items-center gap-1">
                        <Printer className="w-3.5 h-3.5 text-[#C5A880]" /> Print Rule (Default: Off)
                      </span>
                      <p className="text-[11px] text-[#423C36]/70 mt-0.5">
                        When printing a quotation, signature is omitted by default so it can be signed physically.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.whatsappIncludeSignature}
                      onChange={(e) => handleInputChange("whatsappIncludeSignature", e.target.checked)}
                      className="mt-0.5 rounded border-[#C5A880] text-[#C5A880] focus:ring-[#C5A880]"
                    />
                    <div>
                      <span className="font-bold text-[#423C36] flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-[#C5A880]" /> WhatsApp Dispatch Rule (Default: On)
                      </span>
                      <p className="text-[11px] text-[#423C36]/70 mt-0.5">
                        Include authorized signature and stamp when sending digital PDF quotes via WhatsApp.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 4. Default Terms & Conditions */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2">
                Default Standard Terms &amp; Conditions
              </h2>
              <p className="text-[11px] text-[#423C36]/70">
                These terms load automatically into new quotations. You can still modify or add custom clauses on individual quotations in the Quotation Generator Studio.
              </p>

              <textarea
                rows={6}
                value={formData.defaultTermsAndConditions}
                onChange={(e) => handleInputChange("defaultTermsAndConditions", e.target.value)}
                className="w-full p-3 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40 font-mono leading-relaxed"
                placeholder="1. 50% Advance on signing..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-bold text-[#423C36] bg-[#C5A880] hover:bg-[#B39366] rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Quotation Settings"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
