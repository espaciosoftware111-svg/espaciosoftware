"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { AlertTriangle, Plus, Check } from "lucide-react";

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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
      maxWidth="lg"
      hasUnsavedChanges={hasUnsavedChanges}
    >
      <form onSubmit={handleSubmit} className="space-y-5 select-none">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Duplicate Lead Alert Banner */}
        {duplicateWarning && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Possible Duplicate Lead Found ({duplicateWarning.score}% Match Confidence)
            </div>
            <ul className="list-disc pl-5 text-[11px] text-amber-800 space-y-0.5">
              {duplicateWarning.matchSignals.map((sig: string, idx: number) => (
                <li key={idx}>{sig}</li>
              ))}
            </ul>
            <div className="pt-1 text-[11px] text-amber-700 font-medium">
              Matches existing Lead <span className="font-mono font-bold">{duplicateWarning.matches[0]?.referenceNo}</span> ({duplicateWarning.matches[0]?.clientName}). You may still proceed if this is a legitimate new inquiry.
            </div>
          </div>
        )}

        {/* SECTION A — CUSTOMER DETAILS */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
            Section A — Customer Details
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Customer Name *"
              placeholder="e.g. Rohan Verma"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              required
            />
            <Input
              label="Primary Mobile Phone *"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Address"
              type="email"
              placeholder="rohan@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Alternate Phone"
              placeholder="+91 99887 76655"
              value={formData.alternatePhone}
              onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
            />
          </div>
        </div>

        {/* SECTION B — REQUIREMENT & SCOPE */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
            Section B — Requirement & Stage (Global Others Rule)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Requirement Type</label>
              <select
                value={formData.requirementType}
                onChange={(e) => setFormData({ ...formData, requirementType: e.target.value })}
                className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Turnkey Interiors">Turnkey Interiors</option>
                <option value="Design Only">Design Only</option>
                <option value="Renovation">Renovation</option>
                <option value="Materials">Materials</option>
                <option value="Something Else">Something Else (Custom)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Customer Stage</label>
              <select
                value={formData.customerStage}
                onChange={(e) => setFormData({ ...formData, customerStage: e.target.value })}
                className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Ready To Start">Ready To Start</option>
                <option value="Have A Timeline In Mind">Have A Timeline In Mind</option>
                <option value="Just Exploring">Just Exploring</option>
              </select>
            </div>
          </div>

          {/* Custom Requirement Input */}
          {formData.requirementType === "Something Else" && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Input
                label="Custom Requirement Description *"
                placeholder="e.g. Acoustic Studio, Luxury Walk-in Wardrobe, Office Partitions..."
                value={formData.customRequirement}
                onChange={(e) => setFormData({ ...formData, customRequirement: e.target.value })}
                required
              />
            </div>
          )}
        </div>

        {/* SECTION C — PROPERTY INFORMATION */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
            Section C — Property Information
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Property Type</label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="Independent House">Independent House</option>
                <option value="Commercial">Commercial</option>
                <option value="Office">Office</option>
                <option value="Others">Others (Custom)</option>
              </select>
            </div>
            <Input
              label="Project Location *"
              placeholder="e.g. Jubilee Hills, Hyderabad"
              value={formData.propertyLocation}
              onChange={(e) => setFormData({ ...formData, propertyLocation: e.target.value })}
              required
            />
            <Input
              label="Property Size / Area"
              placeholder="e.g. 3,200 sq.ft / 4BHK"
              value={formData.propertySize}
              onChange={(e) => setFormData({ ...formData, propertySize: e.target.value })}
            />
          </div>

          {formData.propertyType === "Others" && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Input
                label="Custom Property Type *"
                placeholder="e.g. Duplex Penthouse, Farmhouse, Clinic..."
                value={formData.customPropertyType}
                onChange={(e) => setFormData({ ...formData, customPropertyType: e.target.value })}
                required
              />
            </div>
          )}

          {/* Spaces Scope Selection */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Spaces Scope (Select Multiple):
            </span>
            <div className="flex flex-wrap gap-2">
              {["Full Home", "Kitchen", "Bedroom", "Living Room", "Office", "Multiple Spaces", "Others"].map((sp) => {
                const isSelected = formData.spaces.includes(sp);
                return (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => toggleSpace(sp)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? "bg-teal-700 text-white border-teal-700"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />} {sp}
                  </button>
                );
              })}
            </div>

            {formData.spaces.includes("Others") && (
              <div className="pt-2">
                <Input
                  placeholder="Specify custom spaces (e.g. Home Theatre, Balcony Bar)..."
                  value={formData.customSpace}
                  onChange={(e) => setFormData({ ...formData, customSpace: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>

        {/* SECTION D — COMMERCIAL, SOURCE & ASSIGNMENT */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
            Section D — Commercial, Source & Assignment
          </h4>
          <div className="grid grid-cols-4 gap-3">
            <Input
              label="Estimated Budget (₹)"
              type="number"
              placeholder="3500000"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Lead Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500"
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Assigned Owner</label>
              <select
                value={formData.assignedToId}
                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500"
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

          {/* Custom Source Input (Global Others Rule) */}
          {(formData.source === "OTHER" || formData.source === "OTHERS") && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in duration-200">
              <Input
                label="Custom Lead Source Name *"
                placeholder="e.g. Google Search Ads, Newspaper Feature, Exhibition Booth..."
                value={formData.customSource}
                onChange={(e) => setFormData({ ...formData, customSource: e.target.value })}
                required
              />
            </div>
          )}
        </div>

        {/* SECTION E — SPECIFIC REQUIREMENTS & NOTES */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
            Section E — Requirements & Notes
          </h4>
          <Input
            label="Tags (Comma-separated)"
            placeholder="Luxury, Modern, 4BHK"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Specific Requirements & Notes
            </label>
            <textarea
              rows={3}
              placeholder="Design preferences, color palette, material choices, timeline constraints..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="p-3 text-xs bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            {isEditMode ? "Save Changes" : "Register Lead"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
