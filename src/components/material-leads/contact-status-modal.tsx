"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneCall, PhoneOff, Clock, AlertCircle } from "lucide-react";

interface ContactStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialLead: any;
  initialStatus: "CONTACTED" | "NOT_CONTACTED";
  onStatusUpdated: (updatedLead: any) => void;
}

export const ContactStatusModal: React.FC<ContactStatusModalProps> = ({
  isOpen,
  onClose,
  materialLead,
  initialStatus,
  onStatusUpdated,
}) => {
  const [status, setStatus] = useState<"CONTACTED" | "NOT_CONTACTED">(initialStatus);
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStatus(initialStatus);
      setNotes("");
      setFollowUpDate("");
      setFollowUpTime("");
      setErrorMessage(null);
    }
  }, [isOpen, initialStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    if (status === "NOT_CONTACTED" && !followUpDate) {
      setErrorMessage("Follow-up date is required when customer is not contacted");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        status,
        notes: notes.trim() || null,
        followUpDate: status === "NOT_CONTACTED" ? followUpDate : null,
        followUpTime: status === "NOT_CONTACTED" ? followUpTime || null : null,
      };

      const res = await fetch(`/api/v1/material-leads/${materialLead.id}/contact-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update contact status");
      }

      const json = await res.json();
      onStatusUpdated(json.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={status === "CONTACTED" ? "Record Contact with Customer" : "Mark Customer Not Contacted"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Status Toggle buttons */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-cream/60 rounded-xl border border-walnut/15">
          <button
            type="button"
            onClick={() => setStatus("CONTACTED")}
            className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
              status === "CONTACTED"
                ? "bg-white text-emerald-800 shadow-2xs border border-emerald-200"
                : "text-walnut hover:text-charcoal"
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            CONTACTED
          </button>

          <button
            type="button"
            onClick={() => setStatus("NOT_CONTACTED")}
            className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
              status === "NOT_CONTACTED"
                ? "bg-white text-amber-800 shadow-2xs border border-amber-200"
                : "text-walnut hover:text-charcoal"
            }`}
          >
            <PhoneOff className="w-3.5 h-3.5 text-amber-600" />
            NOT CONTACTED
          </button>
        </div>

        {/* Fields for NOT_CONTACTED */}
        {status === "NOT_CONTACTED" && (
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
            <div className="text-xs text-amber-800 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Schedule Mandatory Follow-Up</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-charcoal mb-1">
                  Follow-up Date <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal mb-1">
                  Follow-up Time
                </label>
                <Input
                  type="time"
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-charcoal mb-1">
                Reason / Follow-up Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Call unanswered, scheduled call back for tomorrow morning..."
                rows={2}
                className="w-full p-2 text-xs bg-white border border-amber-200 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>
        )}

        {/* Fields for CONTACTED */}
        {status === "CONTACTED" && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
              <p>
                Customer has been reached. You can now discuss material requirements and proceed
                to <strong>Material Required</strong> stage.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">
                Discussion Notes / Conversation Summary
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Spoke with client, interested in 19mm Marine Plywood and Charcoal Louvers..."
                rows={3}
                className="w-full p-2.5 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-walnut/10">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Update Status"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
