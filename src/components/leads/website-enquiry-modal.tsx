"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  Sparkles,
  Home,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Building,
  Layers,
  MapPin,
  Maximize2,
  Clock,
  FileText,
  User,
  Phone,
  Mail,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";

interface WebsiteEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (lead: any) => void;
}

export const WebsiteEnquiryModal: React.FC<WebsiteEnquiryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdLead, setCreatedLead] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Requirement
    requirementType: "Turnkey Interiors",
    customRequirement: "",

    // Step 2: Property
    propertyType: "Apartment",
    customPropertyType: "",
    spaces: ["Full Home"] as string[],
    customSpace: "",
    projectLocation: "",
    propertySize: "",

    // Step 3: Stage & Specifics
    customerStage: "Ready To Start",
    specificRequirements: "",

    // Step 4: Details
    fullName: "",
    mobileNumber: "",
    emailAddress: "",
  });

  const resetForm = () => {
    setStep(1);
    setError("");
    setCreatedLead(null);
    setFormData({
      requirementType: "Turnkey Interiors",
      customRequirement: "",
      propertyType: "Apartment",
      customPropertyType: "",
      spaces: ["Full Home"],
      customSpace: "",
      projectLocation: "",
      propertySize: "",
      customerStage: "Ready To Start",
      specificRequirements: "",
      fullName: "",
      mobileNumber: "",
      emailAddress: "",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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

  // Validation per step
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
      toast.success(
        "Website Lead Created",
        `Assigned unique Reference ${json.data.referenceNo} in Leads Pipeline.`
      );
      if (onSuccess) onSuccess(json.data);
    } catch {
      setError("An unexpected network error occurred while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdLead ? "Website Enquiry Submitted" : "Inbound Website Enquiry Form"}
      description={
        createdLead
          ? "Lead record generated and permanently integrated with ESPACIO CRM."
          : `Step ${step} of 4 — Multi-step visitor qualification wizard`
      }
      maxWidth="lg"
    >
      <div className="space-y-5 select-none">
        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEPPER PROGRESS BAR (Only if not submitted) */}
        {!createdLead && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-walnut uppercase tracking-wider">
              <span className={step >= 1 ? "text-emerald-700" : ""}>1. Requirement</span>
              <span className={step >= 2 ? "text-emerald-700" : ""}>2. Property Info</span>
              <span className={step >= 3 ? "text-emerald-700" : ""}>3. Stage & Scope</span>
              <span className={step >= 4 ? "text-emerald-700" : ""}>4. Contact Details</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 ease-out rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUCCESS CONFIRMATION RECEIPT                              */}
        {/* ========================================================= */}
        {createdLead ? (
          <div className="p-6 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto ring-4 ring-emerald-50">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-charcoal">Enquiry Successfully Converted to Lead!</h3>
              <p className="text-xs text-walnut">
                The visitor&apos;s multi-step questionnaire has been logged with all technical attributes.
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-emerald-200/80 inline-flex flex-col items-center gap-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-walnut">Generated Unique Lead ID</span>
              <span className="font-mono text-base font-bold text-emerald-800">{createdLead.referenceNo}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left text-xs bg-white p-4 rounded-lg border border-walnut/15">
              <div>
                <span className="text-[10px] text-walnut uppercase tracking-wider block">Customer</span>
                <span className="font-bold text-charcoal">{createdLead.clientName}</span>
              </div>
              <div>
                <span className="text-[10px] text-walnut uppercase tracking-wider block">Initial Pipeline Stage</span>
                <span className="font-bold text-emerald-700">● {createdLead.status || "NEW LEAD"}</span>
              </div>
              <div>
                <span className="text-[10px] text-walnut uppercase tracking-wider block">Requirement</span>
                <span className="text-charcoal font-medium">{formData.customRequirement || formData.requirementType}</span>
              </div>
              <div>
                <span className="text-[10px] text-walnut uppercase tracking-wider block">Location</span>
                <span className="text-charcoal font-medium">{formData.projectLocation}</span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleClose}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 text-white font-bold"
                onClick={() => {
                  handleClose();
                  if (typeof window !== "undefined") {
                    window.location.href = `/leads?id=${createdLead.leadId}`;
                  }
                }}
              >
                Open Lead in CRM ↗
              </Button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* STEP 1: REQUIREMENT                                       */
          /* ========================================================= */
          step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                  Step 1 — What is your requirement?
                </label>
                <p className="text-xs text-walnut">Select the primary service package required for this project.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: "Turnkey Interiors", desc: "Complete end-to-end interior execution & project management" },
                  { key: "Design Only", desc: "Architectural 2D plans, 3D renders, and design concepts" },
                  { key: "Renovation", desc: "Civil modifications, remodeling, and modern transformation" },
                  { key: "Materials", desc: "Direct raw materials, modular cabinetry, and hardware supply" },
                  { key: "Something Else", desc: "Custom requirement or specialized commercial request" },
                ].map((item) => {
                  const isSelected = formData.requirementType === item.key;
                  return (
                    <div
                      key={item.key}
                      onClick={() => setFormData({ ...formData, requirementType: item.key })}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer space-y-1 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                          : "border-walnut/20 bg-white hover:border-walnut/40 hover:bg-cream/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? "text-emerald-900" : "text-charcoal"}`}>
                          {item.key}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-walnut">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Custom Requirement Input (Global Others Rule) */}
              {formData.requirementType === "Something Else" && (
                <div className="p-3 bg-cream/40 rounded-xl border border-walnut/20 space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-charcoal block">Enter Custom Requirement *</label>
                  <input
                    type="text"
                    placeholder="e.g. Acoustic Studio Setup, Modular Office Partitions..."
                    value={formData.customRequirement}
                    onChange={(e) => setFormData({ ...formData, customRequirement: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-walnut/20 rounded-md focus:ring-2 focus:ring-emerald-500 text-charcoal font-medium"
                    autoFocus
                  />
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-walnut/15">
                <Button variant="primary" size="sm" onClick={handleNextStep} className="bg-emerald-600 text-white font-bold">
                  Next Step <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          ) : /* ========================================================= */
          /* STEP 2: PROPERTY INFORMATION                              */
          /* ========================================================= */
          step === 2 ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                  Step 2 — Property & Space Information
                </label>
                <p className="text-xs text-walnut">Specify the property type, space scope, location, and dimensions.</p>
              </div>

              {/* Property Type Radio Pills */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-charcoal uppercase tracking-wider">Property Type:</span>
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
                            : "bg-white text-charcoal border-walnut/20 hover:border-walnut/40"
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
                      placeholder="Enter custom property type (e.g. Penthouse, Farmhouse, Clinic)..."
                      value={formData.customPropertyType}
                      onChange={(e) => setFormData({ ...formData, customPropertyType: e.target.value })}
                      className="w-full text-xs p-2 bg-white border border-walnut/20 rounded-md focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Which Space(s)? Multi-select */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-charcoal uppercase tracking-wider">Which Space(s)? (Select Multiple):</span>
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
                            : "bg-white text-charcoal border-walnut/20 hover:border-walnut/40"
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
                      className="w-full text-xs p-2 bg-white border border-walnut/20 rounded-md focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Project Location & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">
                    Project Location * <span className="text-walnut font-normal">(City / Area)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jubilee Hills, Hyderabad"
                    value={formData.projectLocation}
                    onChange={(e) => setFormData({ ...formData, projectLocation: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-walnut/20 rounded-md focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">
                    Property Size <span className="text-walnut font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3200 sq ft / 3 BHK"
                    value={formData.propertySize}
                    onChange={(e) => setFormData({ ...formData, propertySize: e.target.value })}
                    className="w-full text-xs p-2.5 bg-white border border-walnut/20 rounded-md focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t border-walnut/15">
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back
                </Button>
                <Button variant="primary" size="sm" onClick={handleNextStep} className="bg-emerald-600 text-white font-bold">
                  Next Step <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          ) : /* ========================================================= */
          /* STEP 3: STAGE & SPECIFICS                                 */
          /* ========================================================= */
          step === 3 ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                  Step 3 — What stage are you at?
                </label>
                <p className="text-xs text-walnut">Help us understand project readiness and timelines.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { key: "Just Exploring", desc: "Gathering ideas, estimates, and design options" },
                  { key: "Ready To Start", desc: "Possession received or ready to initiate immediately" },
                  { key: "Have A Timeline In Mind", desc: "Targeting project start within 1-3 months" },
                ].map((st) => {
                  const isSelected = formData.customerStage === st.key;
                  return (
                    <div
                      key={st.key}
                      onClick={() => setFormData({ ...formData, customerStage: st.key })}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer space-y-1 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                          : "border-walnut/20 bg-white hover:border-walnut/40 hover:bg-cream/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? "text-emerald-900" : "text-charcoal"}`}>
                          {st.key}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-[10px] text-walnut">{st.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-charcoal">
                  Specific Requirements <span className="text-walnut font-normal">(Optional)</span>
                </label>
                <textarea
                  placeholder="Describe your design preferences, color styles, material requirements, or target timeline..."
                  value={formData.specificRequirements}
                  onChange={(e) => setFormData({ ...formData, specificRequirements: e.target.value })}
                  className="w-full text-xs p-3 bg-white border border-walnut/20 rounded-md focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-between pt-3 border-t border-walnut/15">
                <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back
                </Button>
                <Button variant="primary" size="sm" onClick={handleNextStep} className="bg-emerald-600 text-white font-bold">
                  Next Step <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* STEP 4: CONTACT DETAILS & SUBMIT                          */
            /* ========================================================= */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-charcoal block">
                  Step 4 — Your Details
                </label>
                <p className="text-xs text-walnut">Enter contact information for quotation and site consultation dispatch.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-walnut/60 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Rohan Verma"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-walnut/20 rounded-md focus:ring-2 focus:ring-emerald-500 font-medium text-charcoal"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-charcoal mb-1">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-walnut/60 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-walnut/20 rounded-md focus:ring-2 focus:ring-emerald-500 font-mono text-charcoal"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal mb-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-walnut/60 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="rohan@example.com"
                        value={formData.emailAddress}
                        onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-walnut/20 rounded-md focus:ring-2 focus:ring-emerald-500 text-charcoal"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Pill Preview */}
              <div className="p-3 bg-cream/30 rounded-lg border border-walnut/15 text-[11px] text-walnut space-y-1">
                <span className="font-bold text-charcoal block">Enquiry Preview:</span>
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

              <div className="flex justify-between pt-3 border-t border-walnut/15">
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
                  Submit Enquiry & Register Lead
                </Button>
              </div>
            </form>
          )
        )}
      </div>
    </Modal>
  );
};
