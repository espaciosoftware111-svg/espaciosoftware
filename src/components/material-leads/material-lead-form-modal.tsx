"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { MATERIAL_LEAD_SOURCES, MATERIAL_LEAD_STATUSES } from "@/validators/material-lead.schema";

interface MaterialLeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MaterialLeadFormModal: React.FC<MaterialLeadFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !primaryContact.trim() || !location.trim()) {
      toast.error("Missing Fields", "Please complete all mandatory fields (*)");
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

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create Material Lead");
      }

      const json = await res.json();
      toast.success("Lead Registered", `Material Lead created successfully`);
      onSuccess();
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
    } catch (err: any) {
      toast.error("Creation Failed", err.message || "Could not register material lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Material Lead">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Name */}
        <div>
          <label className="text-xs font-bold text-charcoal block mb-1">
            Customer Name *
          </label>
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Rohan Verma"
            required
          />
        </div>

        {/* Contact Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">
              Primary Contact (Contact 1) *
            </label>
            <Input
              value={primaryContact}
              onChange={(e) => setPrimaryContact(e.target.value)}
              placeholder="e.g. +91 9778898310"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">
              Secondary Contact (Contact 2)
            </label>
            <Input
              value={secondaryContact}
              onChange={(e) => setSecondaryContact(e.target.value)}
              placeholder="e.g. +91 9887766554 (Optional)"
            />
          </div>
        </div>

        {/* Email & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rohan@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">Project Location *</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Jubilee Hills, Hyderabad"
              required
            />
          </div>
        </div>

        {/* Source with Global Others Rule */}
        <div>
          <label className="text-xs font-bold text-charcoal block mb-1">Lead Source *</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full h-9 px-3 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
          >
            {MATERIAL_LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          {source === "OTHER" && (
            <div className="mt-2">
              <label className="text-[11px] font-semibold text-walnut block mb-1">
                Enter Custom Source *
              </label>
              <Input
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                placeholder="e.g. Google Material Ads, Trade Expo, Architect Recommendation"
                required
              />
            </div>
          )}
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
            >
              {MATERIAL_LEAD_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full h-9 px-3 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-bold text-charcoal block mb-1">Initial Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Customer material requirements or special requests..."
            rows={2}
            className="w-full p-2.5 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-walnut/10">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Material Lead"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
