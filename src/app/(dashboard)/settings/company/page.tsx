"use client";

import React, { useState, useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { Building2, Save, CheckCircle2, AlertCircle, Upload, Trash2, Image as ImageIcon, FileCheck2, ExternalLink } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export default function CompanyInformationPage() {
  const [formData, setFormData] = useState({
    companyName: "",
    legalName: "",
    displayName: "",
    tagline: "",
    phone: "",
    whatsApp: "",
    email: "",
    website: "",
    addressLine: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    gstin: "",
    pan: "",
    logoUrl: "",
    description: "",
    openingTime: "09:00",
    closingTime: "19:00",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings/company");
      const json = await res.json();
      if (json.success && json.data) {
        setFormData({
          companyName: json.data.companyName || "ESPACIO INTERIORS",
          legalName: json.data.legalName || "ESPACIO INTERIOR SOLUTIONS PVT LTD",
          displayName: json.data.displayName || "ESPACIO ERP",
          tagline: json.data.tagline || "Turnkey Interior Solutions & Architecture",
          phone: json.data.phone || "+91 98765 43210",
          whatsApp: json.data.whatsApp || "+91 98765 43210",
          email: json.data.email || "contact@espacio.com",
          website: json.data.website || "https://espacio.com",
          addressLine: json.data.addressLine || "100 Feet Road, Indiranagar",
          city: json.data.city || "Bengaluru",
          state: json.data.state || "Karnataka",
          country: json.data.country || "India",
          postalCode: json.data.postalCode || "560038",
          gstin: json.data.gstin || "29ABCDE1234F1ZH",
          pan: json.data.pan || "ABCDE1234F",
          logoUrl: json.data.logoUrl || "/brand/espacio-logo.svg",
          description: json.data.description || "Premium turnkey interior execution and architecture studio.",
          openingTime: json.data.openingTime || "09:00",
          closingTime: json.data.closingTime || "19:00",
        });
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: "error", text: "Logo image must be smaller than 2MB" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        handleInputChange("logoUrl", base64Url);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    handleInputChange("logoUrl", "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Company information updated successfully" });
        setHasChanges(false);
      } else {
        setMessage({ type: "error", text: json.error?.message || "Failed to update company information" });
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
                Organization Settings
              </span>
              {hasChanges && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  Unsaved Changes
                </span>
              )}
            </div>
            <h1 className="text-xl font-black text-[#423C36] tracking-tight mt-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#C5A880]" /> Company Information
            </h1>
            <p className="text-xs text-[#423C36]/70 mt-0.5">
              Official legal details and branding automatically rendered on Quotations, Invoices, Reports, and Official PDFs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/quotations"
              className="text-xs font-semibold text-[#423C36]/80 hover:text-[#423C36] flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#C5A880]/30 hover:bg-[#FAF6EF] transition-colors"
            >
              <span>Preview in Quotations</span>
              <ExternalLink className="w-3 h-3 text-[#C5A880]" />
            </Link>
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
            Loading company information...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Company Logo & Branding */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <div className="border-b border-[#C5A880]/15 pb-2">
                <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider">
                  Company Logo &amp; Official Branding
                </h2>
                <p className="text-[11px] text-[#423C36]/60 mt-0.5">
                  This logo appears on all client-facing Quotation PDFs, GST Invoices, and Official Reports.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#FAF6EF] rounded-xl border border-[#C5A880]/20">
                <div className="w-48 h-24 bg-[#FFFFFF] rounded-xl border border-[#C5A880]/30 flex items-center justify-center p-3 overflow-hidden shrink-0 shadow-2xs">
                  {formData.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={formData.logoUrl}
                      alt="Company Logo Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <Logo size="md" subtitle="Default Brand Mark" />
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="text-xs font-bold text-[#423C36]">
                    {formData.logoUrl ? "Custom Logo Active" : "Using Default Brand Mark"}
                  </div>
                  <p className="text-[11px] text-[#423C36]/70 leading-relaxed">
                    Upload PNG, JPEG, SVG or WEBP format. Maximum size 2MB. Recommended dimensions: 400×120px transparent background.
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <label className="px-3 py-1.5 bg-[#423C36] hover:bg-[#2F2B26] text-[#FAF6EF] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Upload New Logo</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Logo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Business Identity */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2">
                Business Identity &amp; Registrations
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Company Display Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="e.g. ESPACIO INTERIORS"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Legal Registered Entity Name</label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => handleInputChange("legalName", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="e.g. ESPACIO INTERIOR SOLUTIONS PVT LTD"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Tagline / Business Motto</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => handleInputChange("tagline", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="e.g. Turnkey Interior Solutions & Architecture"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">GSTIN Number (15 Characters)</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => handleInputChange("gstin", e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="29ABCDE1234F1ZH"
                    maxLength={15}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">PAN Number (10 Characters)</label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => handleInputChange("pan", e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Website URL</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="https://espacio.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Company Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="Short description of company expertise and services..."
                  />
                </div>
              </div>
            </div>

            {/* 3. Contact & Communication */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2">
                Official Contact &amp; Communication
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Primary Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="contact@espacio.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Office Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">WhatsApp Business Number</label>
                  <input
                    type="text"
                    value={formData.whatsApp}
                    onChange={(e) => handleInputChange("whatsApp", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            {/* 4. Physical Location & Hours */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2">
                Physical Office Address &amp; Studio Hours
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Street Address</label>
                  <input
                    type="text"
                    value={formData.addressLine}
                    onChange={(e) => handleInputChange("addressLine", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="100 Feet Road, Indiranagar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="Bengaluru"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">State / Province</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="Karnataka"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Postal Code (PIN)</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="560038"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="India"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Opening Time</label>
                  <input
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) => handleInputChange("openingTime", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Closing Time</label>
                  <input
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) => handleInputChange("closingTime", e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  />
                </div>
              </div>
            </div>

            {/* Document Linkage Info */}
            <div className="bg-[#FAF6EF] p-4 rounded-xl border border-[#C5A880]/20 flex items-start gap-3">
              <FileCheck2 className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
              <div className="text-xs text-[#423C36]/80 leading-relaxed">
                <strong>Automatic Document Connection:</strong> When you save company details, they are referenced dynamically across all new Quotations, Invoices, and Reports. Your existing records preserve their historical data integrity.
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-bold text-[#423C36] bg-[#C5A880] hover:bg-[#B39366] rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Company Information"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
