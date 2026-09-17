"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Building2, RotateCcw, AlertCircle } from "lucide-react";

interface VendorResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialLead: any;
  mode: "ACCEPTED" | "REJECTED" | "NEW_VENDOR";
  onResponseSubmitted: (result: any) => void;
}

export const VendorResponseModal: React.FC<VendorResponseModalProps> = ({
  isOpen,
  onClose,
  materialLead,
  mode,
  onResponseSubmitted,
}) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [negotiatedAmount, setNegotiatedAmount] = useState<string | number>("");
  const [notes, setNotes] = useState("");

  // New Vendor state (when mode === "NEW_VENDOR")
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [isOtherVendor, setIsOtherVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");
  const [newVendorEmail, setNewVendorEmail] = useState("");
  const [newVendorAddress, setNewVendorAddress] = useState("");
  const [newVendorGstin, setNewVendorGstin] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setRejectionReason("");
      setNotes("");
      if (mode === "NEW_VENDOR") {
        fetchVendors();
      }
    }
  }, [isOpen, mode]);

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/v1/procurement/vendors");
      if (res.ok) {
        const json = await res.json();
        const list = json.data || [];
        setVendors(list);
        if (list.length > 0 && !selectedVendorId) {
          setSelectedVendorId(list[0].id);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleVendorSelect = (val: string) => {
    if (val === "OTHER") {
      setIsOtherVendor(true);
      setSelectedVendorId("");
    } else {
      setIsOtherVendor(false);
      setSelectedVendorId(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === "NEW_VENDOR") {
        if (isOtherVendor && (!newVendorName.trim() || !newVendorPhone.trim())) {
          setErrorMessage("Vendor Name and Phone Number are required");
          setIsSubmitting(false);
          return;
        }

        const payload = {
          orderId: materialLead?.linkedOrderId || null,
          vendorId: isOtherVendor ? null : selectedVendorId,
          isNewVendor: isOtherVendor,
          newVendorData: isOtherVendor
            ? {
                name: newVendorName.trim(),
                phone: newVendorPhone.trim(),
                email: newVendorEmail.trim() || null,
                address: newVendorAddress.trim() || null,
                gstin: newVendorGstin.trim() || null,
                categoryKey: "MATERIALS",
              }
            : null,
          notes: notes.trim() || null,
        };

        const res = await fetch(`/api/v1/material-leads/${materialLead.id}/vendor-request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to send vendor request");
        }

        const json = await res.json();
        onResponseSubmitted(json.data);
      } else {
        const payload = {
          response: mode,
          rejectionReason: mode === "REJECTED" ? rejectionReason.trim() : null,
          notes: notes.trim() || null,
          negotiatedAmount: negotiatedAmount ? Number(negotiatedAmount) : null,
        };

        const res = await fetch(`/api/v1/material-leads/${materialLead.id}/vendor-request`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to update vendor response");
        }

        const json = await res.json();
        onResponseSubmitted(json.data);
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (mode === "ACCEPTED") return "Vendor Accepted — Confirm Material Order";
    if (mode === "REJECTED") return "Record Vendor Rejection";
    return "Select Another Vendor & Send Request";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MODE 1: ACCEPTED */}
        {mode === "ACCEPTED" && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Vendor Accepted Material Order</span>
              </div>
              <p>
                Confirming will set the Material Order status to <strong>CONFIRMED</strong> and
                make it live in the <strong>Materials Order</strong> section.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">
                Final Negotiated Amount (₹) <span className="text-walnut/60 font-normal">(Optional)</span>
              </label>
              <Input
                type="number"
                min="1"
                step="any"
                value={negotiatedAmount}
                onChange={(e) => setNegotiatedAmount(e.target.value)}
                placeholder="Leave blank to retain initial order amount"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">
                Confirmation Notes / Fulfillment Agreement
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Vendor agreed to dispatch batch within 3 business days..."
                rows={2}
                className="w-full p-2.5 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>
        )}

        {/* MODE 2: REJECTED */}
        {mode === "REJECTED" && (
          <div className="space-y-3">
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Vendor Rejection</span>
              </div>
              <p>
                Record the reason for rejection. You will be able to select another vendor
                immediately while preserving the vendor request history.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Out of stock / Unable to meet delivery deadline"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific comments from the vendor..."
                rows={2}
                className="w-full p-2.5 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>
        )}

        {/* MODE 3: NEW_VENDOR (Re-request) */}
        {mode === "NEW_VENDOR" && (
          <div className="space-y-3">
            <div className="p-3 bg-cream/50 rounded-xl border border-walnut/15 text-xs text-walnut space-y-1">
              <div className="font-bold text-charcoal flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-gold" />
                <span>Send Request to New Vendor</span>
              </div>
              <p>
                Previous vendor response is preserved in history. Select an alternative supplier
                for this Material Order.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">
                Select Alternative Vendor <span className="text-rose-500">*</span>
              </label>
              <select
                value={isOtherVendor ? "OTHER" : selectedVendorId}
                onChange={(e) => handleVendorSelect(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.phone || "No phone"}) - {v.referenceNo}
                  </option>
                ))}
                <option value="OTHER">+ Other (Enter New Vendor)</option>
              </select>
            </div>

            {isOtherVendor && (
              <div className="p-3 bg-gold/5 rounded-xl border border-gold/30 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal mb-1">
                      Vendor Name *
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Century Ply Traders"
                      value={newVendorName}
                      onChange={(e) => setNewVendorName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal mb-1">
                      Phone Number *
                    </label>
                    <Input
                      type="tel"
                      required
                      placeholder="+91 9876500000"
                      value={newVendorPhone}
                      onChange={(e) => setNewVendorPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-charcoal mb-1">
                    Address
                  </label>
                  <Input
                    type="text"
                    placeholder="Banjara Hills, Hyderabad"
                    value={newVendorAddress}
                    onChange={(e) => setNewVendorAddress(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">
                Request Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes for the new vendor..."
                rows={2}
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
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className={`gap-1.5 text-xs ${
              mode === "ACCEPTED"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : mode === "REJECTED"
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : ""
            }`}
          >
            {mode === "ACCEPTED" && <CheckCircle2 className="w-3.5 h-3.5" />}
            {mode === "REJECTED" && <XCircle className="w-3.5 h-3.5" />}
            {mode === "NEW_VENDOR" && <RotateCcw className="w-3.5 h-3.5" />}
            {isSubmitting
              ? "Recording..."
              : mode === "ACCEPTED"
              ? "Confirm Vendor Acceptance"
              : mode === "REJECTED"
              ? "Record Rejection"
              : "Dispatch New Vendor Request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
