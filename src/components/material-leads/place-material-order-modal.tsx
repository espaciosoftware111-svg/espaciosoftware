"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Building2, User, Phone, Mail, MapPin, AlertCircle, Plus } from "lucide-react";

interface PlaceMaterialOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialLead: any;
  onOrderPlaced: (orderResult: any) => void;
}

export const PlaceMaterialOrderModal: React.FC<PlaceMaterialOrderModalProps> = ({
  isOpen,
  onClose,
  materialLead,
  onOrderPlaced,
}) => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [isOtherVendor, setIsOtherVendor] = useState(false);

  // New Vendor Fields
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");
  const [newVendorEmail, setNewVendorEmail] = useState("");
  const [newVendorAddress, setNewVendorAddress] = useState("");
  const [newVendorGstin, setNewVendorGstin] = useState("");
  const [newVendorContactPerson, setNewVendorContactPerson] = useState("");

  // Order Details
  const defaultAmount = materialLead?.quotations?.[0]?.totalAmount || 0;
  const [orderAmount, setOrderAmount] = useState<number | string>(defaultAmount || "");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchVendors();
      if (materialLead?.quotations?.[0]?.totalAmount) {
        setOrderAmount(materialLead.quotations[0].totalAmount);
      }
    }
  }, [isOpen, materialLead]);

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/v1/procurement/vendors");
      if (res.ok) {
        const json = await res.json();
        const vendorList = json.data || [];
        setVendors(vendorList);
        if (vendorList.length > 0 && !selectedVendorId) {
          setSelectedVendorId(vendorList[0].id);
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

    const parsedAmount = Number(orderAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Please enter a valid Final Order Amount greater than 0");
      setIsSubmitting(false);
      return;
    }

    if (isOtherVendor && (!newVendorName.trim() || !newVendorPhone.trim())) {
      setErrorMessage("Vendor Name and Phone Number are required for new vendor");
      setIsSubmitting(false);
      return;
    }

    if (!isOtherVendor && !selectedVendorId) {
      setErrorMessage("Please select a vendor or choose Other to enter new vendor details");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        quotationId: materialLead?.quotations?.[0]?.id || null,
        vendorId: isOtherVendor ? null : selectedVendorId,
        isNewVendor: isOtherVendor,
        newVendorData: isOtherVendor
          ? {
              name: newVendorName.trim(),
              phone: newVendorPhone.trim(),
              email: newVendorEmail.trim() || null,
              address: newVendorAddress.trim() || null,
              gstin: newVendorGstin.trim() || null,
              contactPerson: newVendorContactPerson.trim() || null,
              categoryKey: "MATERIALS",
            }
          : null,
        finalVendorOrderAmount: parsedAmount,
        expectedDeliveryDate: expectedDeliveryDate || null,
        notes: orderNotes.trim() || null,
        materials: materialLead?.requirements || [],
      };

      const res = await fetch(`/api/v1/material-leads/${materialLead.id}/place-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to place material order");
      }

      const result = await res.json();
      onOrderPlaced(result.data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while placing the order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Place Material Order & Send Vendor Request"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Customer & Lead Summary Box */}
        <div className="p-3 bg-cream/50 rounded-xl border border-walnut/15 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-charcoal">{materialLead?.customerName || materialLead?.clientName}</span>
            <span className="font-mono text-[11px] font-bold text-gold">{materialLead?.materialLeadId || materialLead?.referenceNo}</span>
          </div>
          <div className="text-walnut text-[11px] flex flex-wrap gap-x-3">
            <span>Phone: {materialLead?.primaryContact || materialLead?.phone}</span>
            <span>Location: {materialLead?.projectLocation || materialLead?.location}</span>
          </div>
        </div>

        {/* Vendor Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-charcoal">
            Select Vendor <span className="text-rose-500">*</span>
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

        {/* New Vendor Dynamic Inputs (when OTHER is chosen) */}
        {isOtherVendor && (
          <div className="p-3 bg-gold/5 rounded-xl border border-gold/30 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-charcoal">
              <Building2 className="w-3.5 h-3.5 text-gold" />
              <span>New Vendor Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-charcoal mb-1">
                  Vendor Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Greenply Distributors"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-charcoal mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={newVendorPhone}
                  onChange={(e) => setNewVendorPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-charcoal mb-1">Email</label>
                <Input
                  type="email"
                  placeholder="orders@greenply.com"
                  value={newVendorEmail}
                  onChange={(e) => setNewVendorEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-charcoal mb-1">GSTIN</label>
                <Input
                  type="text"
                  placeholder="36AAAAA0000A1Z5"
                  value={newVendorGstin}
                  onChange={(e) => setNewVendorGstin(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-charcoal mb-1">Vendor Address</label>
              <Input
                type="text"
                placeholder="Industrial Area, Hyderabad"
                value={newVendorAddress}
                onChange={(e) => setNewVendorAddress(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Order Amount & Delivery Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-charcoal mb-1">
              Final Vendor Order Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              required
              min="1"
              step="any"
              value={orderAmount}
              onChange={(e) => setOrderAmount(e.target.value)}
              placeholder="e.g. 75000"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal mb-1">
              Expected Delivery Date
            </label>
            <Input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-charcoal mb-1">
            Order Notes / Procurement Instructions
          </label>
          <textarea
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Special instructions for the vendor regarding transport, quality or batch delivery..."
            rows={2}
            className="w-full p-2.5 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-walnut/10">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} className="gap-1.5 text-xs">
            <ShoppingCart className="w-3.5 h-3.5" />
            {isSubmitting ? "Placing Order..." : "Place Order & Send Vendor Request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
