"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { MATERIAL_LEAD_SOURCES, MATERIAL_LEAD_STATUSES } from "@/validators/material-lead.schema";
import {
  User,
  MapPin,
  FileText,
  Loader2,
  X,
} from "lucide-react";

interface MaterialLeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdLead?: any) => void;
  initialData?: {
    customerName?: string;
    primaryContact?: string;
    secondaryContact?: string;
    email?: string;
    location?: string;
    source?: string;
    notes?: string;
  };
}

export const MaterialLeadFormModal: React.FC<MaterialLeadFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const toast = useToast();
  const [customerName, setCustomerName] = useState("");
  const [primaryContact, setPrimaryContact] = useState("");
  const [secondaryContact, setSecondaryContact] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState("WEBSITE");
  const [customSource, setCustomSource] = useState("");
  const [status, setStatus] = useState("NEW");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCustomerName(initialData?.customerName || "");
      setPrimaryContact(initialData?.primaryContact || "");
      setSecondaryContact(initialData?.secondaryContact || "");
      setEmail(initialData?.email || "");
      setLocation(initialData?.location || "");
      setSource(initialData?.source || "WEBSITE");
      setCustomSource("");
      setStatus("NEW");
      setPriority("MEDIUM");
      setNotes(initialData?.notes || "");
      setError("");
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerName.trim() || !primaryContact.trim() || !location.trim()) {
      setError("Please complete all mandatory fields (*)");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        primaryContact: primaryContact.trim(),
        secondaryContact: secondaryContact.trim() || null,
        email: email.trim() || null,
        location: location.trim(),
        source,
        customSource: source === "OTHER" && customSource.trim() ? customSource.trim() : null,
        status,
        priority,
        notes: notes.trim() || null,
      };

      const res = await fetch("/api/v1/material-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json?.error?.message || json?.message || "Failed to create Material Lead");
        return;
      }

      toast.success("Lead Registered", `Material Lead ${customerName.trim()} created successfully`);
      onSuccess(json.data);
      onClose();

      // Reset form
      setCustomerName("");
      setPrimaryContact("");
      setSecondaryContact("");
      setEmail("");
      setLocation("");
      setSource("WEBSITE");
      setCustomSource("");
      setStatus("NEW");
      setPriority("MEDIUM");
      setNotes("");
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasUnsavedChanges = Boolean(
    customerName.trim() ||
    primaryContact.trim() ||
    email.trim() ||
    location.trim() ||
    notes.trim()
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Material Lead"
      description="Register an inbound inquiry or material catalog procurement lead"
      maxWidth="3xl"
      hasUnsavedChanges={hasUnsavedChanges}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-[#292722] bg-white border border-[#E2DBD1] rounded-md hover:bg-[#F5F1E9] hover:border-[#D5CDC0] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="material-lead-registration-form"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-white bg-[#302D29] hover:bg-[#1E1D1A] border border-[#302D29] rounded-md transition-all shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isSubmitting ? "Creating..." : "Create Material Lead"}
          </button>
        </>
      }
    >
      <form id="material-lead-registration-form" onSubmit={handleSubmit} className="space-y-6 select-none">
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
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
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
                placeholder="+91 97788 98310"
                value={primaryContact}
                onChange={(e) => setPrimaryContact(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Secondary Contact (Optional)
              </label>
              <input
                type="tel"
                placeholder="+91 98877 66554"
                value={secondaryContact}
                onChange={(e) => setSecondaryContact(e.target.value)}
                className="w-full h-10 px-3 text-xs font-mono bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
              />
            </div>
          </div>
        </div>

        {/* SECTION B — SOURCE & LOCATION */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EAE5DD]">
            <MapPin className="w-3.5 h-3.5 text-[#A99477]" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#292722]">
              Section B — Source &amp; Location
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Project Location <span className="text-rose-600 font-bold">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Jubilee Hills, Hyderabad"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Lead Source <span className="text-rose-600 font-bold">*</span>
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors cursor-pointer font-medium"
              >
                {MATERIAL_LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Source Input */}
          {source === "OTHER" && (
            <div className="p-3.5 bg-[#FAF8F5] rounded-md border border-[#E2DBD1] space-y-1 animate-in fade-in duration-150">
              <label className="text-xs font-semibold text-[#292722] block">
                Enter Custom Source <span className="text-rose-600 font-bold">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Google Material Ads, Trade Expo, Architect Recommendation"
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                required
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90]"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors cursor-pointer font-medium"
              >
                {MATERIAL_LEAD_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#292722] block">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full h-10 px-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors cursor-pointer font-medium"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION C — REQUIREMENTS & NOTES */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EAE5DD]">
            <FileText className="w-3.5 h-3.5 text-[#A99477]" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#292722]">
              Section C — Requirements &amp; Notes
            </h4>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#292722] block">
              Initial Notes / Material Specifications
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Customer material requirements, specific brand preferences, BOQ line items, or special requests..."
              rows={3}
              className="w-full p-3 text-xs bg-white text-[#292722] border border-[#E2DBD1] rounded-md focus:ring-1 focus:ring-[#A99477] focus:border-[#A99477] hover:border-[#D5CDC0] outline-hidden transition-colors placeholder:text-[#A09A90] resize-y"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
