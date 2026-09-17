"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Globe,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CatalogEnquiryPage() {
  const [customerName, setCustomerName] = useState("");
  const [contactNumber1, setContactNumber1] = useState("");
  const [contactNumber2, setContactNumber2] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [materialPreferences, setMaterialPreferences] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerName.trim() || !contactNumber1.trim() || !projectLocation.trim()) {
      setError("Please complete all mandatory fields (*)");
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
        const json = await res.json();
        throw new Error(json.message || "Failed to submit material request form");
      }

      const json = await res.json();
      setSubmittedLeadId(json.data?.referenceNo || "MAT-LEAD-2026-XXXX");
    } catch (err: any) {
      setError(err.message || "Error submitting enquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-charcoal flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Brand Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-walnut/15">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gold/20 text-gold flex items-center justify-center font-bold">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wider text-charcoal block">ESPACIO</span>
            <span className="text-[10px] text-walnut uppercase tracking-widest block">Material Catalog & Supply</span>
          </div>
        </div>

        <Link
          href="/login"
          className="text-xs font-semibold text-walnut hover:text-charcoal transition"
        >
          Staff Portal &rarr;
        </Link>
      </header>

      {/* Main Form Container */}
      <main className="max-w-xl mx-auto w-full my-8">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-walnut/20 shadow-lg space-y-6">
          {submittedLeadId ? (
            <div className="text-center space-y-5 py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-charcoal">Catalog Unlocked & Request Sent!</h2>
                <p className="text-xs text-walnut max-w-md mx-auto">
                  Thank you, <strong>{customerName}</strong>. Our material specialist will contact you shortly with wholesale catalog pricing and sample deliveries.
                </p>
              </div>

              <div className="p-4 bg-cream/60 rounded-xl border border-walnut/20 inline-block font-mono text-xs font-bold text-charcoal">
                Material Request ID: <span className="text-gold font-bold">{submittedLeadId}</span>
              </div>

              <div className="pt-4">
                <Button
                  variant="primary"
                  onClick={() => {
                    setSubmittedLeadId(null);
                    setCustomerName("");
                    setContactNumber1("");
                    setContactNumber2("");
                    setEmailAddress("");
                    setProjectLocation("");
                    setMaterialPreferences("");
                  }}
                  className="w-full text-xs"
                >
                  Submit Another Material Request
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream text-gold border border-gold/20 text-[11px] font-semibold">
                  <Sparkles className="w-3 h-3" />
                  Premium Materials & Direct Supply
                </div>
                <h1 className="text-xl font-bold text-charcoal tracking-tight">
                  Unlock Wholesale Material Catalog
                </h1>
                <p className="text-xs text-walnut">
                  Fill in your project details to get instant access to verified commercial pricing.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              {/* 1. Customer Name */}
              <div>
                <label className="text-xs font-bold text-charcoal block mb-1">
                  1. Full Name *
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rohan Verma"
                  required
                />
              </div>

              {/* 2 & 3. Phone Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1">
                    2. Primary Contact Number *
                  </label>
                  <Input
                    value={contactNumber1}
                    onChange={(e) => setContactNumber1(e.target.value)}
                    placeholder="e.g. +91 9778898310"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1">
                    3. Secondary Contact (Optional)
                  </label>
                  <Input
                    value={contactNumber2}
                    onChange={(e) => setContactNumber2(e.target.value)}
                    placeholder="e.g. +91 9887766554"
                  />
                </div>
              </div>

              {/* 4. Email */}
              <div>
                <label className="text-xs font-bold text-charcoal block mb-1">
                  4. Email Address
                </label>
                <Input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="e.g. rohan@example.com"
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
                  placeholder="e.g. Jubilee Hills, Hyderabad"
                  required
                />
              </div>

              {/* Material Preferences */}
              <div>
                <label className="text-xs font-bold text-charcoal block mb-1">
                  Material Requirements (Optional)
                </label>
                <textarea
                  value={materialPreferences}
                  onChange={(e) => setMaterialPreferences(e.target.value)}
                  placeholder="e.g. Plywood, Charcoal Panels, Louvers, Hardware..."
                  rows={2}
                  className="w-full p-2.5 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full text-xs font-semibold py-2.5 shadow-sm gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                {isSubmitting ? "Unlocking Catalog..." : "Unlock Material Catalog & Request Quote"}
              </Button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-4 text-xs text-walnut border-t border-walnut/15">
        &copy; {new Date().getFullYear()} ESPACIO ERP. Direct Wholesale Interior Materials & Execution.
      </footer>
    </div>
  );
}
