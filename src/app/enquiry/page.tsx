"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Home,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Building,
  Layers,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function PublicEnquiryPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdLead, setCreatedLead] = useState<any>(null);

  const [formData, setFormData] = useState({
    requirementType: "Turnkey Interiors",
    customRequirement: "",
    propertyType: "Apartment",
    customPropertyType: "",
    spaces: ["Full Home"] as string[],
    customSpace: "",
    projectLocation: "",
    propertySize: "",
    customerStage: "Ready To Start",
    specificRequirements: "",
    fullName: "",
    mobileNumber: "",
    emailAddress: "",
  });

  const toggleSpace = (space: string) => {
    setFormData((prev) => {
      const exists = prev.spaces.includes(space);
      if (exists) {
        return { ...prev, spaces: prev.spaces.filter((s) => s !== space) };
      } else {
        return { ...prev, spaces: [...prev.spaces, space] };
      }
    });
  };

  const handleNextStep = () => {
    setError("");
    if (step === 1) {
      if (formData.requirementType === "Something Else" && !formData.customRequirement.trim()) {
        setError("Please describe your custom requirement.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (formData.propertyType === "Others" && !formData.customPropertyType.trim()) {
        setError("Please enter your custom property type.");
        return;
      }
      if (formData.spaces.length === 0 && !formData.customSpace.trim()) {
        setError("Please select at least one space.");
        return;
      }
      if (formData.spaces.includes("Others") && !formData.customSpace.trim()) {
        setError("Please specify the custom space name.");
        return;
      }
      if (!formData.projectLocation.trim()) {
        setError("Project Location is mandatory.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      setError("Please enter a valid full name.");
      return;
    }
    if (!formData.mobileNumber.trim() || formData.mobileNumber.trim().length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!formData.emailAddress.trim() || !formData.emailAddress.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/leads/website-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to submit enquiry.");
        return;
      }

      setCreatedLead(json.data);
    } catch {
      setError("An unexpected network error occurred while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#423C36] flex flex-col justify-between select-none">
      {/* Top Header */}
      <header className="border-b border-[#C5A880]/20 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              E
            </div>
            <div>
              <span className="font-bold text-sm text-[#111827] tracking-tight block">ESPACIO INTERIORS</span>
              <span className="text-[10px] text-[#64748B] tracking-wider uppercase">Project Consultation & Enquiry</span>
            </div>
          </div>
          <Link href="/leads">
            <Button variant="outline" size="sm" className="text-xs">
              Go to CRM Leads ↗
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-2xl border border-[#C5A880]/25 shadow-xl p-6 sm:p-8 space-y-6">
          
          {/* Header */}
          <div className="space-y-1.5 text-center">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Transform Your Space
            </span>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Design & Interior Consultation</h1>
            <p className="text-xs text-[#64748B]">
              Complete this 4-step enquiry to receive a personalized scope assessment and preliminary quotation.
            </p>
          </div>

          {/* Stepper Progress Bar */}
          {!createdLead && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <span className={step >= 1 ? "text-emerald-700" : ""}>1. Requirement</span>
                <span className={step >= 2 ? "text-emerald-700" : ""}>2. Property Info</span>
                <span className={step >= 3 ? "text-emerald-700" : ""}>3. Timeline</span>
                <span className={step >= 4 ? "text-emerald-700" : ""}>4. Contact</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SUCCESS SCREEN */}
          {createdLead ? (
            <div className="p-6 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto ring-4 ring-emerald-50">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[#111827]">Enquiry Received Successfully!</h2>
                <p className="text-xs text-[#64748B]">
                  Thank you, <strong className="text-[#111827]">{createdLead.clientName}</strong>. Our senior design consultant will review your specifications and contact you shortly.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-emerald-200 inline-flex flex-col items-center gap-1 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Your Unique Lead Reference</span>
                <span className="font-mono text-lg font-bold text-emerald-800">{createdLead.referenceNo}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left text-xs bg-white p-4 rounded-xl border border-[#C5A880]/20 shadow-2xs">
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase tracking-wider block">Requirement</span>
                  <span className="font-bold text-[#111827]">{formData.customRequirement || formData.requirementType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase tracking-wider block">Location</span>
                  <span className="font-bold text-[#111827]">{formData.projectLocation}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase tracking-wider block">Property Type</span>
                  <span className="text-[#111827]">{formData.customPropertyType || formData.propertyType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase tracking-wider block">Selected Spaces</span>
                  <span className="text-[#111827]">{formData.spaces.join(", ")}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <Link href="/leads">
                  <Button variant="primary" size="sm" className="bg-emerald-600 text-white font-bold">
                    View in CRM Leads Table ↗
                  </Button>
                </Link>
              </div>
            </div>
          ) : /* STEP 1 */
          step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#111827] block">
                  Step 1 — What is your requirement?
                </label>
                <p className="text-xs text-[#64748B]">Select the service type best suited to your requirements.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: "Turnkey Interiors", desc: "Complete end-to-end design, woodwork & site execution" },
                  { key: "Design Only", desc: "2D layouts, 3D renders, mood boards & material specs" },
                  { key: "Renovation", desc: "Civil remodeling, kitchen upgrade & modern revamping" },
                  { key: "Materials", desc: "Factory manufactured modular units & hardware fittings" },
                  { key: "Something Else", desc: "Bespoke requirement or customized commercial project" },
                ].map((item) => {
                  const isSelected = formData.requirementType === item.key;
                  return (
                    <div
                      key={item.key}
                      onClick={() => setFormData({ ...formData, requirementType: item.key })}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer space-y-1 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? "text-emerald-900" : "text-[#111827]"}`}>
                          {item.key}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-[#64748B]">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              {formData.requirementType === "Something Else" && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-[#111827] block">Specify Custom Requirement *</label>
                  <input
                    type="text"
                    placeholder="e.g. Acoustic Home Theatre, Office Partitions, Cafe Interior..."
                    value={formData.customRequirement}
                    onChange={(e) => setFormData({ ...formData, customRequirement: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 font-medium text-[#111827]"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <Button variant="primary" size="sm" onClick={handleNextStep} className="bg-emerald-600 text-white font-bold">
                  Next Step <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          ) : /* STEP 2 */
          step === 2 ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#111827] block">
                  Step 2 — Property & Space Scope
                </label>
                <p className="text-xs text-[#64748B]">Tell us about the property and spaces you want designed.</p>
              </div>

              {/* Property Type Radio */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#111827] uppercase tracking-wider">Property Type:</span>
                <div className="flex flex-wrap gap-2">
                  {["Apartment", "Villa", "Independent House", "Commercial", "Office", "Others"].map((p) => {
                    const isSelected = formData.propertyType === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, propertyType: p })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                            : "bg-white text-[#111827] border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                {formData.propertyType === "Others" && (
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Enter custom property type (e.g. Duplex Penthouse, Farmhouse, Clinic)..."
                      value={formData.customPropertyType}
                      onChange={(e) => setFormData({ ...formData, customPropertyType: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Which Spaces? Multi-select */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#111827] uppercase tracking-wider">Which Space(s)? (Select Multiple):</span>
                <div className="flex flex-wrap gap-2">
                  {["Full Home", "Kitchen", "Bedroom", "Living Room", "Office", "Multiple Spaces", "Others"].map((sp) => {
                    const isSelected = formData.spaces.includes(sp);
                    return (
                      <button
                        key={sp}
                        type="button"
                        onClick={() => toggleSpace(sp)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                            : "bg-white text-[#111827] border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {isSelected && "✓"} {sp}
                      </button>
                    );
                  })}
                </div>

                {formData.spaces.includes("Others") && (
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Specify custom spaces (e.g. Home Theatre, Pooja Room, Balcony Bar)..."
                      value={formData.customSpace}
                      onChange={(e) => setFormData({ ...formData, customSpace: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Location & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1">
                    Project Location * <span className="text-[#64748B] font-normal">(City / Area)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jubilee Hills, Hyderabad"
                    value={formData.projectLocation}
                    onChange={(e) => setFormData({ ...formData, projectLocation: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1">
                    Property Size <span className="text-[#64748B] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3200 sq ft / 3 BHK"
                    value={formData.propertySize}
                    onChange={(e) => setFormData({ ...formData, propertySize: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back
                </Button>
                <Button variant="primary" size="sm" onClick={handleNextStep} className="bg-emerald-600 text-white font-bold">
                  Next Step <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          ) : /* STEP 3 */
          step === 3 ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#111827] block">
                  Step 3 — What stage are you at?
                </label>
                <p className="text-xs text-[#64748B]">Let us know your target start date and timeline.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { key: "Just Exploring", desc: "Comparing designs, estimates, and ideas" },
                  { key: "Ready To Start", desc: "Possession received; ready to begin immediately" },
                  { key: "Have A Timeline In Mind", desc: "Planning execution in next 1 to 3 months" },
                ].map((st) => {
                  const isSelected = formData.customerStage === st.key;
                  return (
                    <div
                      key={st.key}
                      onClick={() => setFormData({ ...formData, customerStage: st.key })}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer space-y-1 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? "text-emerald-900" : "text-[#111827]"}`}>
                          {st.key}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-[10px] text-[#64748B]">{st.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-[#111827]">
                  Specific Requirements <span className="text-[#64748B] font-normal">(Optional)</span>
                </label>
                <textarea
                  placeholder="Share design themes, color preferences, wooden finish choices, appliances, or particular timelines..."
                  value={formData.specificRequirements}
                  onChange={(e) => setFormData({ ...formData, specificRequirements: e.target.value })}
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-between pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back
                </Button>
                <Button variant="primary" size="sm" onClick={handleNextStep} className="bg-emerald-600 text-white font-bold">
                  Next Step <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            /* STEP 4 */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#111827] block">
                  Step 4 — Your Details
                </label>
                <p className="text-xs text-[#64748B]">Provide your contact details so our team can send your proposal.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#111827] mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Rohan Verma"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 font-medium text-[#111827]"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#111827] mb-1">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 font-mono text-[#111827]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111827] mb-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="rohan@example.com"
                        value={formData.emailAddress}
                        onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 text-[#111827]"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Preview */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-[#64748B] space-y-1">
                <span className="font-bold text-[#111827] block">Consultation Summary:</span>
                <div>
                  • <strong>Requirement:</strong> {formData.customRequirement || formData.requirementType} ({formData.propertyType})
                </div>
                <div>
                  • <strong>Spaces:</strong> {formData.spaces.join(", ")} {formData.customSpace ? `(${formData.customSpace})` : ""}
                </div>
                <div>
                  • <strong>Location:</strong> {formData.projectLocation} {formData.propertySize ? `• ${formData.propertySize}` : ""}
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setStep(3)} disabled={isSubmitting}>
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-emerald-600 text-white font-bold"
                >
                  Submit & Request Consultation ↗
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#C5A880]/20 py-4 text-center text-xs text-[#64748B]">
        <div className="flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secure Multi-Step Ingestion & ERP Integration • Powered by ESPACIO</span>
        </div>
      </footer>
    </div>
  );
}
