"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  AlertTriangle,
  Check,
  User,
  Layers,
  Building2,
  Briefcase,
  FileText,
  MapPin,
  Tag,
  Loader2,
  X,
} from "lucide-react";

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLead?: any) => void;
  initialLead?: any;
}

const DEFAULT_FORM_DATA = {
  clientName: "",
  phone: "",
  email: "",
  alternatePhone: "",
  requirementType: "Turnkey Interiors",
  customRequirement: "",
  propertyType: "Apartment",
  customPropertyType: "",
  propertyLocation: "",
  propertySize: "",
  spaces: ["Full Home"] as string[],
  customSpace: "",
  customerStage: "Ready To Start",
  specificRequirements: "",
  budget: "",
  source: "WEBSITE",
  customSource: "",
  priority: "MEDIUM",
  assignedToId: "",
  tags: "",
  notes: "",
};

const SPACES_OPTIONS = [
  "Full Home",
  "Kitchen",
  "Bedroom",
  "Living Room",
  "Office",
  "Multiple Spaces",
  "Others",
];

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialLead,
}) => {
  const toast = useToast();
  const isEditMode = Boolean(initialLead?.id);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Dynamic configuration options from API
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form data on open or when initialLead changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialLead) {
      const knownRequirements = ["Turnkey Interiors", "Design Only", "Renovation", "Materials"];
      const reqVal = initialLead.requirement || initialLead.requirementType || "Turnkey Interiors";
      const isKnownReq = knownRequirements.includes(reqVal);

      const knownProps = ["Apartment", "Villa", "Independent House", "Commercial", "Office"];
      const propVal = initialLead.propertyTypeKey || initialLead.propertyType || "Apartment";
      const isKnownProp = knownProps.includes(propVal);

      const knownSources = ["WEBSITE", "INSTAGRAM", "WHATSAPP", "REFERRAL", "WALK_IN", "PHONE_CALL", "MANUAL"];
      const srcVal = (initialLead.sourceKey || initialLead.source || "WEBSITE").toUpperCase();
      const isKnownSrc = knownSources.includes(srcVal);

      const web = initialLead.websiteEnquiry;
      const spacesArray = Array.isArray(web?.spaces)
        ? web.spaces
        : initialLead.spaces && Array.isArray(initialLead.spaces)
        ? initialLead.spaces
        : ["Full Home"];

      setFormData({
        clientName: initialLead.clientName || "",
        phone: initialLead.phone || "",
        email: initialLead.email || "",
        alternatePhone: initialLead.alternatePhone || "",
        requirementType: isKnownReq ? reqVal : "Something Else",
        customRequirement: isKnownReq ? "" : reqVal,
        propertyType: isKnownProp ? propVal : "Others",
        customPropertyType: isKnownProp ? "" : propVal,
        propertyLocation: initialLead.location || initialLead.propertyLocation || "",
        propertySize: web?.propertySize || initialLead.propertySize || "",
        spaces: spacesArray,
        customSpace: web?.customSpace || initialLead.customSpace || "",
        customerStage: web?.customerStage || initialLead.customerStage || "Ready To Start",
        specificRequirements: web?.specificRequirements || initialLead.specificRequirements || "",
        budget:
          initialLead.estimatedBudget != null
            ? String(initialLead.estimatedBudget)
            : initialLead.budget != null
            ? String(initialLead.budget)
            : "",
        source: isKnownSrc ? srcVal : "OTHER",
        customSource: isKnownSrc ? "" : (initialLead.sourceKey || initialLead.source || "").replace(/^OTHER:/i, ""),
        priority: initialLead.priority || "MEDIUM",
        assignedToId: initialLead.assignedToId || initialLead.assignedTo?.id || "",
        tags: initialLead.tags || "",
        notes: initialLead.notes || "",
      });
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [isOpen, initialLead]);

  // Fetch dynamic CRM configuration from backend API
  useEffect(() => {
    if (!isOpen) return;
    const fetchCrmConfig = async () => {
      setIsConfigLoading(true);
      try {
        const res = await fetch("/api/v1/config/crm");
        const json = await res.json();
        if (json.success) {
          const { leadSources: sources, propertyTypes: props, users: uList, customFields: cFields } = json.data;
          setLeadSources(sources || []);
          setPropertyTypes(props || []);
          setUsers(uList || []);
          setCustomFields(cFields || []);
        }
      } catch {
        // quiet handling
      } finally {
        setIsConfigLoading(false);
      }
    };

    fetchCrmConfig();
  }, [isOpen]);

  // Live duplicate check (only in create mode)
  useEffect(() => {
    if (isEditMode || !formData.phone || formData.phone.length < 10) {
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/v1/leads/check-duplicates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: formData.phone,
            email: formData.email,
            clientName: formData.clientName,
            propertyLocation: formData.propertyLocation,
          }),
        });
        const json = await res.json();
        if (json.success && json.data.isDuplicate) {
          setDuplicateWarning(json.data);
        } else {
          setDuplicateWarning(null);
        }
      } catch {
        // quiet handling
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.phone, formData.email, formData.clientName, formData.propertyLocation, isEditMode]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const resolvedReq =
        formData.requirementType === "Something Else"
          ? formData.customRequirement.trim()
          : formData.requirementType;
      const resolvedProp =
        formData.propertyType === "Others"
          ? formData.customPropertyType.trim()
          : formData.propertyType;
      const resolvedSrc =
        formData.source === "OTHER" || formData.source === "OTHERS"
          ? formData.customSource.trim()
          : formData.source;

      const payload: Record<string, any> = {
        clientName: formData.clientName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        alternatePhone: formData.alternatePhone.trim() || undefined,
        propertyLocation: formData.propertyLocation.trim() || undefined,
        location: formData.propertyLocation.trim() || undefined,
        propertySize: formData.propertySize.trim() || undefined,
        propertyType: resolvedProp,
        propertyTypeKey: resolvedProp,
        requirement: resolvedReq,
        requirementType: resolvedReq,
        customerStage: formData.customerStage,
        spaces: formData.spaces,
        customSpace: formData.customSpace.trim() || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        estimatedBudget: formData.budget ? parseFloat(formData.budget) : undefined,
        source: resolvedSrc,
        sourceKey: resolvedSrc,
        priority: formData.priority,
        assignedToId: formData.assignedToId || null,
        tags: formData.tags.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        customFields: customFieldValues,
      };

      if (isEditMode) {
        const res = await fetch(`/api/v1/leads/${initialLead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error?.message || "Failed to update lead");
          return;
        }

        toast.success("Lead Details Updated", `${formData.clientName} profile saved successfully`);
      } else {
        const res = await fetch("/api/v1/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error?.message || "Failed to create lead");
          return;
        }

        toast.success("Lead Registered Successfully", `${formData.clientName} added to pipeline`);
        onSuccess(json?.data);
        onClose();
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasUnsavedChanges = Boolean(
    formData.clientName.trim() ||
    formData.phone.trim() ||
    formData.email.trim() ||
    formData.notes.trim()
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Lead Details" : "Add New Lead"}
      description={
        isEditMode
          ? `Update profile and requirements for ${initialLead?.referenceNo || initialLead?.clientName || "lead"}`
          : "Register an inbound inquiry or qualified prospective customer"
      }
      maxWidth="4xl"
      hasUnsavedChanges={hasUnsavedChanges}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-[#292722] bg-white border border-[#E2DBD1] rounded-md hover:bg-[#F5F1E9] hover:border-[#D5CDC0] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="lead-registration-form"
            disabled={isLoading}
            className="px-5 py-2 text-xs font-bold text-white bg-[#302D29] hover:bg-[#1E1D1A] border border-[#302D29] rounded-md transition-all shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEditMode ? "Save Changes" : "Create Lead"}
          </button>
        </>
      }
    >
      <form id="lead-registration-form" onSubmit={handleSubmit} className="space-y-6 select-none">
        {/* Error Message */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-rose-500 hover:text-rose-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Duplicate Lead Alert Banner */}
        {duplicateWarning && (
          <div className="p-4 bg-[#FFF8F0] border border-[#E7DDCE] rounded-lg text-xs text-[#7A5B2E] space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#292722]">
              <AlertTriangle className="w-4 h-4 text-[#A99477] shrink-0" />
              Possible Duplicate Lead Found ({duplicateWarning.score}% Match Confidence)
            </div>
            <ul className="list-disc pl-5 text-[11px] text-[#777168] space-y-0.5">
              {duplicateWarning.matchSignals.map((sig: string, idx: number) => (
                <li key={idx}>{sig}</li>
              ))}
            </ul>
            <div className="pt-1 text-[11px] text-[#777168] font-medium border-t border-[#E7DDCE]/60">
              Matches existing Lead{" "}
              <span className="font-mono font-bold text-[#292722]">
                {duplicateWarning.matches[0]?.referenceNo}
              </span>{" "}
              ({duplicateWarning.matches[0]?.clientName}). You may still proceed if this is a legitimate new inquiry.
            </div>
          </div>
        )}

        {/* SECTION A — CUSTOMER DETAILS */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EAE5DD]">
            <User className="w-3.5 h-3.5 text-[#A99477]" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#292722]">
              Section A — Customer Details
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Customer Name <span className="text-rose-600 font-bold">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Rohan Verma"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Primary Mobile Phone <span className="text-rose-600 font-bold">*</span>
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full h-10 px-3 text-xs font-mono bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Email Address
              </label>
              <input
                type="email"
                placeholder="rohan@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Alternate Phone
              </label>
              <input
                type="tel"
                placeholder="+91 99887 76655"
                value={formData.alternatePhone}
                onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                className="w-full h-10 px-3 text-xs font-mono bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
              />
            </div>
          </div>
        </div>

        {/* SECTION B — REQUIREMENT & STAGE */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EAE5DD]">
            <Layers className="w-3.5 h-3.5 text-[#A99477]" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#292722]">
              Section B — Requirement &amp; Stage
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Requirement Type
              </label>
              <select
                value={formData.requirementType}
                onChange={(e) => setFormData({ ...formData, requirementType: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors cursor-pointer font-medium"
              >
                <option value="Turnkey Interiors">Turnkey Interiors</option>
                <option value="Design Only">Design Only</option>
                <option value="Renovation">Renovation</option>
                <option value="Materials">Materials</option>
                <option value="Something Else">Something Else (Custom)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Customer Stage
              </label>
              <select
                value={formData.customerStage}
                onChange={(e) => setFormData({ ...formData, customerStage: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors cursor-pointer font-medium"
              >
                <option value="Ready To Start">Ready To Start</option>
                <option value="Have A Timeline In Mind">Have A Timeline In Mind</option>
                <option value="Just Exploring">Just Exploring</option>
              </select>
            </div>
          </div>

          {/* Custom Requirement Input */}
          {formData.requirementType === "Something Else" && (
            <div className="p-3.5 bg-[#FAF8F5] rounded-md border border-[#E2DBD1] space-y-1 animate-in fade-in duration-150">
              <label className="text-xs font-semibold text-[#292722] block">
                Custom Requirement Description <span className="text-rose-600 font-bold">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Acoustic Studio, Luxury Walk-in Wardrobe, Office Partitions..."
                value={formData.customRequirement}
                onChange={(e) => setFormData({ ...formData, customRequirement: e.target.value })}
                required
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
              />
            </div>
          )}
        </div>

        {/* SECTION C — PROPERTY INFORMATION */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EAE5DD]">
            <Building2 className="w-3.5 h-3.5 text-[#A99477]" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#292722]">
              Section C — Property Information
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Property Type
              </label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors cursor-pointer font-medium"
              >
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="Independent House">Independent House</option>
                <option value="Commercial">Commercial</option>
                <option value="Office">Office</option>
                <option value="Others">Others (Custom)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Project Location <span className="text-rose-600 font-bold">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-[#A09A90] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Jubilee Hills, Hyderabad"
                  value={formData.propertyLocation}
                  onChange={(e) => setFormData({ ...formData, propertyLocation: e.target.value })}
                  required
                  className="w-full h-10 pl-9 pr-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Property Size / Area
              </label>
              <input
                type="text"
                placeholder="e.g. 3,200 sq.ft / 4BHK"
                value={formData.propertySize}
                onChange={(e) => setFormData({ ...formData, propertySize: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
              />
            </div>
          </div>

          {formData.propertyType === "Others" && (
            <div className="p-3.5 bg-[#FAF8F5] rounded-md border border-[#E2DBD1] space-y-1 animate-in fade-in duration-150">
              <label className="text-xs font-semibold text-[#292722] block">
                Custom Property Type <span className="text-rose-600 font-bold">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Duplex Penthouse, Farmhouse, Clinic..."
                value={formData.customPropertyType}
                onChange={(e) => setFormData({ ...formData, customPropertyType: e.target.value })}
                required
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
              />
            </div>
          )}

          {/* Spaces Scope Selection */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-[#292722] block">
              Spaces Scope (Select Multiple)
            </label>
            <div className="flex flex-wrap gap-2">
              {SPACES_OPTIONS.map((sp) => {
                const isSelected = formData.spaces.includes(sp);
                return (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => toggleSpace(sp)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#EAE1D4] text-[#292722] border-[#D5C9B8] shadow-2xs font-semibold"
                        : "bg-white text-[#777168] border-[#E2DBD1] hover:bg-[#F5F1E9] hover:text-[#292722] hover:border-[#D5CDC0]"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#292722] stroke-[2.5]" />}
                    {sp}
                  </button>
                );
              })}
            </div>

            {formData.spaces.includes("Others") && (
              <div className="pt-2 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="Specify custom spaces (e.g. Home Theatre, Balcony Bar, Terrace Garden)..."
                  value={formData.customSpace}
                  onChange={(e) => setFormData({ ...formData, customSpace: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
                />
              </div>
            )}
          </div>
        </div>

        {/* SECTION D — COMMERCIAL, SOURCE & ASSIGNMENT */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EAE5DD]">
            <Briefcase className="w-3.5 h-3.5 text-[#A99477]" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#292722]">
              Section D — Commercial, Source &amp; Assignment
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Estimated Budget (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#777168] pointer-events-none">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="3500000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full h-10 pl-7 pr-3 text-xs font-mono font-semibold bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors cursor-pointer font-medium"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Lead Source
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors cursor-pointer font-medium"
              >
                <option value="WEBSITE">Website</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="REFERRAL">Referral</option>
                <option value="WALK_IN">Walk-In</option>
                <option value="PHONE_CALL">Phone Call</option>
                <option value="MANUAL">Manual</option>
                <option value="OTHER">Other (Custom Source)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Assigned Owner
              </label>
              <select
                value={formData.assignedToId}
                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors cursor-pointer font-medium"
              >
                <option value="">-- Unassigned --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Source Input */}
          {(formData.source === "OTHER" || formData.source === "OTHERS") && (
            <div className="p-3.5 bg-[#FAF8F5] rounded-md border border-[#E2DBD1] space-y-1 animate-in fade-in duration-150">
              <label className="text-xs font-semibold text-[#292722] block">
                Custom Lead Source Name <span className="text-rose-600 font-bold">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Google Search Ads, Newspaper Feature, Exhibition Booth..."
                value={formData.customSource}
                onChange={(e) => setFormData({ ...formData, customSource: e.target.value })}
                required
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
              />
            </div>
          )}
        </div>

        {/* SECTION E — REQUIREMENTS & NOTES */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EAE5DD]">
            <FileText className="w-3.5 h-3.5 text-[#A99477]" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#292722]">
              Section E — Requirements &amp; Notes
            </h4>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#292722] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#777168]" />
              Tags (Comma-separated)
            </label>
            <input
              type="text"
              placeholder="Luxury, Modern, 4BHK, Urgent Handover"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#292722] block">
              Specific Requirements &amp; Notes
            </label>
            <textarea
              rows={3}
              placeholder="Design preferences, color palette, material choices, timeline constraints, client background..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors leading-relaxed placeholder:text-[#A09A90] resize-y min-h-[84px]"
            />
          </div>

          {/* Dynamic Custom Fields if configured */}
          {customFields.length > 0 && (
            <div className="pt-3 border-t border-[#EAE5DD] space-y-3">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#777168]">
                Additional CRM Custom Fields
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {customFields.map((cf) => (
                  <div key={cf.id} className="space-y-1">
                    <label className="text-xs font-semibold text-[#292722] block">
                      {cf.label} {cf.required && <span className="text-rose-600">*</span>}
                    </label>
                    <input
                      type={cf.type === "NUMBER" ? "number" : "text"}
                      placeholder={cf.placeholder || `Enter ${cf.label.toLowerCase()}`}
                      value={customFieldValues[cf.key] || ""}
                      onChange={(e) =>
                        setCustomFieldValues({
                          ...customFieldValues,
                          [cf.key]: e.target.value,
                        })
                      }
                      required={cf.required}
                      className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
