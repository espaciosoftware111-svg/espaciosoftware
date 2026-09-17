"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface EditVendorModalProps {
  isOpen: boolean;
  vendor: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditVendorModal({ isOpen, vendor, onClose, onSuccess }: EditVendorModalProps) {
  const [name, setName] = useState("");
  const [categoryKey, setCategoryKey] = useState("PLYWOOD");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [paymentTermsKey, setPaymentTermsKey] = useState("DAYS_30");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && vendor) {
      setName(vendor.name || "");
      setCategoryKey(vendor.categoryKey || "PLYWOOD");
      setContactPerson(vendor.contactPerson || vendor.primaryContact?.name || "");
      setPhone(vendor.phone || "");
      setEmail(vendor.email || "");
      setAddress(vendor.address || "");
      setCity(vendor.city || "");
      setGstin(vendor.gstin || "");
      setPan(vendor.pan || "");
      setPaymentTermsKey(vendor.paymentTermsKey || "DAYS_30");
      setNotes(vendor.notes || "");
      setError("");
    }
  }, [isOpen, vendor]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor?.id) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/procurement/vendors/${vendor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          categoryKey,
          contactPerson: contactPerson.trim() || undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          gstin: gstin.trim() || undefined,
          pan: pan.trim() || undefined,
          paymentTermsKey,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to update vendor details");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Network error updating vendor. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Vendor: ${vendor?.referenceNo}`} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 bg-semantic-danger-bg text-semantic-danger border border-semantic-danger-border rounded text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">Vendor Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs font-semibold text-charcoal focus:border-gold focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">Category *</label>
            <select
              value={categoryKey}
              onChange={(e) => setCategoryKey(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs font-semibold text-charcoal focus:border-gold focus:outline-none"
            >
              <option value="PLYWOOD">Plywood & Boards</option>
              <option value="LAMINATE">Laminates & Veneers</option>
              <option value="HARDWARE">Hardware & Fittings</option>
              <option value="PAINT">Paint & Finishes</option>
              <option value="ELECTRICAL">Electrical & Lighting</option>
              <option value="PLUMBING">Plumbing & Sanitary</option>
              <option value="GLASS">Glass & Mirrors</option>
              <option value="TILES">Tiles & Flooring</option>
              <option value="FABRIC">Fabric & Upholstery</option>
              <option value="SUBCONTRACTOR">Subcontractor</option>
              <option value="OTHER">Other / General</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">Contact Person</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">Phone Number *</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs font-mono text-charcoal focus:border-gold focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">Payment Terms</label>
            <select
              value={paymentTermsKey}
              onChange={(e) => setPaymentTermsKey(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal focus:border-gold focus:outline-none"
            >
              <option value="ADVANCE">100% Advance</option>
              <option value="COD">Cash On Delivery (COD)</option>
              <option value="DAYS_15">Net 15 Days</option>
              <option value="DAYS_30">Net 30 Days</option>
              <option value="DAYS_45">Net 45 Days</option>
              <option value="DAYS_60">Net 60 Days</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">GSTIN</label>
            <input
              type="text"
              placeholder="e.g. 36AABCE1234F1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs font-mono text-charcoal uppercase focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">PAN</label>
            <input
              type="text"
              placeholder="e.g. AABCE1234F"
              value={pan}
              onChange={(e) => setPan(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs font-mono text-charcoal uppercase focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-walnut uppercase mb-1">Address</label>
          <input
            type="text"
            placeholder="Shop / Warehouse address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-walnut uppercase mb-1">Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal focus:border-gold focus:outline-none"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
