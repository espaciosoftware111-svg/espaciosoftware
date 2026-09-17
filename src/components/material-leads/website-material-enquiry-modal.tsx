"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Globe, CheckCircle2, Lock, Sparkles, Building2, PackageCheck } from "lucide-react";

interface WebsiteMaterialEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WebsiteMaterialEnquiryModal: React.FC<WebsiteMaterialEnquiryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [customerName, setCustomerName] = useState("");
  const [contactNumber1, setContactNumber1] = useState("");
  const [contactNumber2, setContactNumber2] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [materialPreferences, setMaterialPreferences] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !contactNumber1.trim() || !projectLocation.trim()) {
      toast.error("Required Fields", "Please complete customer name, primary contact, and location");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        contactNumber1: contactNumber1.trim(),
        contactNumber2: contactNumber2.trim() || null,
        emailAddress: emailAddress.trim() || null,
        projectLocation: projectLocation.trim(),
        materialPreferences: materialPreferences.trim() || null,
        source: "Website",
      };

      const res = await fetch("/api/v1/material-leads/website-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit material request form");
      }

      const json = await res.json();
      const generatedRef = json.data?.referenceNo || "MAT-LEAD-2026-XXXX";
      setSubmittedLeadId(generatedRef);
      toast.success("Enquiry Ingested", `Generated Material Lead: ${generatedRef}`);
      onSuccess();
    } catch (err: any) {
      toast.error("Submission Failed", err.message || "Error submitting form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedLeadId(null);
    setCustomerName("");
    setContactNumber1("");
    setContactNumber2("");
    setEmailAddress("");
    setProjectLocation("");
    setMaterialPreferences("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title="Website Material Request / Unlock Catalog Form"
    >
      {submittedLeadId ? (
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-charcoal">Catalog Unlocked & Lead Created!</h3>
            <p className="text-xs text-walnut">
              The website enquiry was successfully ingested into the Material Leads system.
            </p>
          </div>

          <div className="p-3 bg-cream/50 rounded-xl border border-walnut/20 inline-block font-mono text-xs font-bold text-charcoal">
            Material Lead ID: <span className="text-gold">{submittedLeadId}</span>
          </div>

          <div>
            <Button variant="primary" onClick={handleResetAndClose} className="w-full text-xs">
              Done & View in Material Leads Table
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header Card */}
          <div className="p-3.5 rounded-xl bg-cream/40 border border-walnut/15 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold/15 text-gold flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-charcoal">Material Catalog Access Form</h4>
              <p className="text-[11px] text-walnut">
                Simulate an inbound customer enquiry from the website material catalog page.
              </p>
            </div>
          </div>

          {/* 1. Customer Name */}
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">
              1. Customer Name *
            </label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Vikram Reddy"
              required
            />
          </div>

          {/* 2 & 3. Contacts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">
                2. Contact Number 1 (Primary) *
              </label>
              <Input
                value={contactNumber1}
                onChange={(e) => setContactNumber1(e.target.value)}
                placeholder="e.g. +91 9876543210"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">
                3. Contact Number 2 (Optional)
              </label>
              <Input
                value={contactNumber2}
                onChange={(e) => setContactNumber2(e.target.value)}
                placeholder="e.g. +91 9123456780"
              />
            </div>
          </div>

          {/* 4. Email Address */}
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">
              4. Email Address
            </label>
            <Input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="e.g. vikram@example.com"
            />
          </div>

          {/* 5. Project Location */}
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">
              5. Project Location *
            </label>
            <Input
              value={projectLocation}
              onChange={(e) => setProjectLocation(e.target.value)}
              placeholder="e.g. Gachibowli, Hyderabad"
              required
            />
          </div>

          {/* Material Preferences / Requirements */}
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">
              Material Requirements / Preferences
            </label>
            <textarea
              value={materialPreferences}
              onChange={(e) => setMaterialPreferences(e.target.value)}
              placeholder="e.g. Looking for BWR Plywood & Charcoal Louvers for 3 BHK flat"
              rows={2}
              className="w-full p-2.5 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-walnut/10">
            <Button type="button" variant="ghost" onClick={handleResetAndClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} className="gap-1.5 text-xs">
              <Globe className="w-3.5 h-3.5" />
              {isSubmitting ? "Submitting Form..." : "Submit Material Request"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
