"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface MaterialItemInput {
  materialName: string;
  quantity: number;
  unitKey: string;
  referencePrice?: number;
}

interface MaterialOrderWorkflowModalProps {
  isOpen: boolean;
  projectId: string;
  projectReferenceNo?: string;
  projectTitle?: string;
  orderType?: "Raw Material Order" | "Laminate Order" | "General Material Order";
  onClose: () => void;
  onSuccess: () => void;
}

type WorkflowStep = "select_vendor" | "create_vendor_inline" | "add_materials" | "vendor_review" | "enter_final_amount" | "rejected";

export function MaterialOrderWorkflowModal({
  isOpen,
  projectId,
  projectReferenceNo,
  projectTitle,
  orderType = "Raw Material Order",
  onClose,
  onSuccess,
}: MaterialOrderWorkflowModalProps) {
  // Workflow Step
  const [step, setStep] = useState<WorkflowStep>("select_vendor");

  // Vendors list
  const [vendors, setVendors] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);

  // Inline "OTHERS" vendor creation state
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorCategory, setNewVendorCategory] = useState("PLYWOOD");
  const [newVendorContact, setNewVendorContact] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");
  const [newVendorEmail, setNewVendorEmail] = useState("");
  const [newVendorAddress, setNewVendorAddress] = useState("");
  const [newVendorNotes, setNewVendorNotes] = useState("");
  const [creatingVendor, setCreatingVendor] = useState(false);

  // Materials state
  const [vendorMaterialsCatalog, setVendorMaterialsCatalog] = useState<any[]>([]);
  const [items, setItems] = useState<MaterialItemInput[]>([
    { materialName: "", quantity: 1, unitKey: "NOS" },
  ]);

  // Order Review & Confirmation
  const [finalTotalOrderAmount, setFinalTotalOrderAmount] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStep("select_vendor");
      setSelectedVendorId("");
      setSelectedVendor(null);
      setItems([{ materialName: "", quantity: 1, unitKey: "NOS" }]);
      setFinalTotalOrderAmount("");
      setOrderNotes("");
      setError("");
      fetchVendors();
    }
  }, [isOpen]);

  async function fetchVendors() {
    setLoadingVendors(true);
    try {
      const res = await fetch("/api/v1/procurement/vendors?limit=100");
      if (res.ok) {
        const json = await res.json();
        setVendors(json.data || []);
      }
    } catch {
      // Ignore background fetch error
    } finally {
      setLoadingVendors(false);
    }
  }

  async function handleSelectVendor(vId: string) {
    if (vId === "OTHERS") {
      setStep("create_vendor_inline");
      return;
    }

    const found = vendors.find((v) => v.id === vId);
    setSelectedVendorId(vId);
    setSelectedVendor(found || null);

    // Fetch vendor materials for reference pricing
    if (vId) {
      try {
        const res = await fetch(`/api/v1/procurement/vendors/${vId}/materials`);
        if (res.ok) {
          const json = await res.json();
          setVendorMaterialsCatalog(json.data || []);
        }
      } catch {
        setVendorMaterialsCatalog([]);
      }
    }

    setStep("add_materials");
  }

  async function handleCreateInlineVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!newVendorName.trim() || !newVendorPhone.trim()) {
      setError("Vendor name and phone number are required");
      return;
    }

    setCreatingVendor(true);
    setError("");

    try {
      const res = await fetch("/api/v1/procurement/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newVendorName.trim(),
          categoryKey: newVendorCategory,
          contactPerson: newVendorContact.trim() || undefined,
          phone: newVendorPhone.trim(),
          email: newVendorEmail.trim() || undefined,
          address: newVendorAddress.trim() || undefined,
          notes: newVendorNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to create vendor");
        return;
      }

      const created = json.data;
      setVendors((prev) => [created, ...prev]);
      setSelectedVendorId(created.id);
      setSelectedVendor(created);
      setVendorMaterialsCatalog([]);
      setStep("add_materials");
    } catch {
      setError("Network error creating vendor. Please try again.");
    } finally {
      setCreatingVendor(false);
    }
  }

  function handleAddItem() {
    setItems((prev) => [...prev, { materialName: "", quantity: 1, unitKey: "NOS" }]);
  }

  function handleRemoveItem(idx: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleItemChange(idx: number, field: keyof MaterialItemInput, val: any) {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };

      // Look up reference price if changing material name
      if (field === "materialName") {
        const match = vendorMaterialsCatalog.find(
          (m) => m.materialName.toLowerCase() === String(val).trim().toLowerCase()
        );
        copy[idx].referencePrice = match ? match.referencePrice : undefined;
      }
      return copy;
    });
  }

  function handleSendMaterialRequest(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter((i) => i.materialName.trim().length > 0 && i.quantity > 0);
    if (validItems.length === 0) {
      setError("Please add at least one material with a valid quantity");
      return;
    }
    setError("");
    // Move to Vendor Review step
    setStep("vendor_review");
  }

  function handleVendorRejects() {
    setStep("rejected");
  }

  function handleVendorAccepts() {
    setStep("enter_final_amount");
  }

  async function handleConfirmOrder(e: React.FormEvent) {
    e.preventDefault();
    const finalAmount = parseFloat(finalTotalOrderAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      setError("Please enter a valid Final Total Order Amount greater than 0");
      return;
    }

    setSubmittingOrder(true);
    setError("");

    try {
      const validItems = items.filter((i) => i.materialName.trim().length > 0);
      const res = await fetch("/api/v1/procurement/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: selectedVendorId,
          projectId,
          finalAmount,
          status: "CONFIRMED",
          notes: orderNotes.trim()
            ? `${orderType}: ${orderNotes.trim()}`
            : `${orderType} confirmed for project ${projectReferenceNo || ""}`,
          items: validItems.map((item) => ({
            materialName: item.materialName.trim(),
            quantity: item.quantity,
            unitKey: item.unitKey,
            rate: 0, // Explicitly zero rate; total is manually determined by Super Admin
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to confirm and create purchase order");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Network error confirming order. Please try again.");
    } finally {
      setSubmittingOrder(false);
    }
  }

  function formatCurrency(val: number) {
    return `₹${(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${orderType}: ${projectReferenceNo || "Project"}`}
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Progress Stepper Indicator */}
        <div className="flex items-center justify-between border-b border-walnut/15 pb-3">
          <div className="flex items-center space-x-2 text-[11px] font-bold">
            <span
              className={`px-2 py-0.5 rounded ${
                step === "select_vendor" || step === "create_vendor_inline"
                  ? "bg-gold text-charcoal"
                  : "bg-cream text-walnut"
              }`}
            >
              1. Select Vendor
            </span>
            <span className="text-walnut/40">→</span>
            <span
              className={`px-2 py-0.5 rounded ${
                step === "add_materials" ? "bg-gold text-charcoal" : "bg-cream text-walnut"
              }`}
            >
              2. Add Materials
            </span>
            <span className="text-walnut/40">→</span>
            <span
              className={`px-2 py-0.5 rounded ${
                step === "vendor_review" ? "bg-gold text-charcoal" : "bg-cream text-walnut"
              }`}
            >
              3. Vendor Decision
            </span>
            <span className="text-walnut/40">→</span>
            <span
              className={`px-2 py-0.5 rounded ${
                step === "enter_final_amount" ? "bg-gold text-charcoal" : "bg-cream text-walnut"
              }`}
            >
              4. Final Amount
            </span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-semantic-danger-bg text-semantic-danger border border-semantic-danger-border rounded font-semibold">
            {error}
          </div>
        )}

        {/* STEP 1: SELECT VENDOR */}
        {step === "select_vendor" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-walnut uppercase mb-1">
                Select Vendor *
              </label>
              <p className="text-[11px] text-walnut mb-2">
                Choose an existing registered vendor or select <strong>+ OTHERS</strong> to create a new permanent vendor record.
              </p>

              {loadingVendors ? (
                <div className="p-4 text-center text-walnut">Loading vendors...</div>
              ) : (
                <select
                  value={selectedVendorId}
                  onChange={(e) => handleSelectVendor(e.target.value)}
                  className="w-full rounded border border-walnut/20 bg-white p-2 text-xs font-semibold text-charcoal focus:border-gold focus:outline-none"
                >
                  <option value="">-- Choose a Supplier / Vendor --</option>
                  <optgroup label="Existing Vendors">
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.referenceNo} — {v.categoryKey})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Add New">
                    <option value="OTHERS">+ OTHERS (Create New Vendor)</option>
                  </optgroup>
                </select>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* STEP 1.B: INLINE CREATE VENDOR (OTHERS) */}
        {step === "create_vendor_inline" && (
          <form onSubmit={handleCreateInlineVendor} className="space-y-3">
            <div className="rounded border border-amber-200 bg-amber-50/70 p-2 text-[11px] text-amber-900 font-medium">
              <strong>Permanent Record:</strong> This new vendor will be permanently saved into Vendor Management and will be immediately available for all future projects.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-walnut uppercase mb-1">Vendor Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sree Balaji Plywood"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="w-full rounded border border-walnut/20 bg-white p-1.5 text-xs text-charcoal font-semibold focus:border-gold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-walnut uppercase mb-1">Category *</label>
                <select
                  value={newVendorCategory}
                  onChange={(e) => setNewVendorCategory(e.target.value)}
                  className="w-full rounded border border-walnut/20 bg-white p-1.5 text-xs text-charcoal font-semibold focus:border-gold focus:outline-none"
                >
                  <option value="PLYWOOD">Plywood &amp; Boards</option>
                  <option value="LAMINATE">Laminates &amp; Veneers</option>
                  <option value="HARDWARE">Hardware &amp; Fittings</option>
                  <option value="PAINT">Paint &amp; Finishes</option>
                  <option value="ELECTRICAL">Electrical &amp; Lighting</option>
                  <option value="GLASS">Glass &amp; Mirrors</option>
                  <option value="GENERAL">General / Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-walnut uppercase mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={newVendorContact}
                  onChange={(e) => setNewVendorContact(e.target.value)}
                  className="w-full rounded border border-walnut/20 bg-white p-1.5 text-xs text-charcoal focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-walnut uppercase mb-1">Phone Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 9848012345"
                  value={newVendorPhone}
                  onChange={(e) => setNewVendorPhone(e.target.value)}
                  className="w-full rounded border border-walnut/20 bg-white p-1.5 text-xs font-mono text-charcoal focus:border-gold focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-walnut uppercase mb-1">Email</label>
                <input
                  type="email"
                  placeholder="vendor@domain.com"
                  value={newVendorEmail}
                  onChange={(e) => setNewVendorEmail(e.target.value)}
                  className="w-full rounded border border-walnut/20 bg-white p-1.5 text-xs text-charcoal focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-walnut uppercase mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Store / Godown location"
                  value={newVendorAddress}
                  onChange={(e) => setNewVendorAddress(e.target.value)}
                  className="w-full rounded border border-walnut/20 bg-white p-1.5 text-xs text-charcoal focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep("select_vendor")}
                disabled={creatingVendor}
              >
                Back
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={creatingVendor}>
                {creatingVendor ? "Creating Vendor..." : "Save Vendor & Continue"}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: ADD MATERIALS */}
        {step === "add_materials" && (
          <form onSubmit={handleSendMaterialRequest} className="space-y-4">
            {/* Vendor Banner */}
            <div className="flex items-center justify-between rounded-lg border border-walnut/20 bg-cream/50 p-3">
              <div>
                <div className="text-[10px] uppercase font-bold text-walnut">Selected Vendor</div>
                <div className="text-sm font-bold text-charcoal">{selectedVendor?.name}</div>
                <div className="text-[11px] text-walnut font-mono">
                  {selectedVendor?.referenceNo} • {selectedVendor?.phone}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep("select_vendor")}
                className="text-xs text-gold-hover hover:underline font-semibold"
              >
                Change Vendor
              </button>
            </div>

            {/* Reference Price Reminder Notice */}
            <div className="rounded border border-amber-200 bg-amber-50/70 p-2.5 text-[11px] text-amber-900 leading-relaxed">
              <strong>Important Rule:</strong> Material Reference Prices are displayed strictly for estimation reference. They do <strong>NOT</strong> calculate the final order amount. Final Total Order Amount is manually entered after vendor acceptance.
            </div>

            {/* Item Rows */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-walnut uppercase">Required Materials</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
                >
                  + Add Item
                </button>
              </div>

              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded border border-walnut/15 bg-white space-y-2"
                >
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Material name (e.g. 19mm Plywood)"
                        value={item.materialName}
                        onChange={(e) => handleItemChange(idx, "materialName", e.target.value)}
                        className="w-full rounded border border-walnut/20 bg-white p-1.5 text-xs text-charcoal font-semibold focus:border-gold focus:outline-none"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 1)}
                        className="w-full rounded border border-walnut/20 bg-white p-1.5 text-xs font-mono font-bold text-charcoal focus:border-gold focus:outline-none"
                        required
                      />
                    </div>

                    <div className="col-span-3">
                      <select
                        value={item.unitKey}
                        onChange={(e) => handleItemChange(idx, "unitKey", e.target.value)}
                        className="w-full rounded border border-walnut/20 bg-white p-1.5 text-xs text-charcoal focus:border-gold focus:outline-none"
                      >
                        <option value="NOS">NOS</option>
                        <option value="SHEET">Sheet</option>
                        <option value="SQFT">Sqft</option>
                        <option value="RFT">Rft</option>
                        <option value="KG">Kg</option>
                        <option value="BOX">Box</option>
                        <option value="BUNDLE">Bundle</option>
                      </select>
                    </div>

                    <div className="col-span-1 text-right">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-500 hover:text-rose-700 font-bold text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reference Price Badge if found */}
                  {item.referencePrice !== undefined && (
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <span className="font-semibold text-charcoal">Catalog Reference Rate:</span>
                      <span className="font-mono font-bold text-charcoal">{formatCurrency(item.referencePrice)}</span>
                      <span className="text-[10px] text-walnut italic">(Reference only)</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep("select_vendor")}
              >
                Back
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Send Material Request →
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: VENDOR REVIEW & DECISION */}
        {step === "vendor_review" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-walnut/20 bg-cream/40 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-walnut uppercase">Material Request Status</span>
                <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                  PENDING REVIEW
                </span>
              </div>
              <div className="text-sm font-bold text-charcoal">Vendor: {selectedVendor?.name}</div>
              <div className="text-xs text-walnut">
                Materials Requested ({items.length}):{" "}
                <span className="text-charcoal font-semibold">
                  {items.map((i) => `${i.materialName} (${i.quantity} ${i.unitKey})`).join(", ")}
                </span>
              </div>
            </div>

            <div className="rounded border border-slate-200 bg-white p-3 text-xs space-y-2">
              <div className="font-bold text-charcoal uppercase">Record Vendor Response:</div>
              <p className="text-walnut text-[11px]">
                Has the vendor reviewed and agreed to fulfill this material order?
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleVendorRejects}
                  className="rounded border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer text-center"
                >
                  ✕ Vendor Rejects Request
                </button>
                <button
                  type="button"
                  onClick={handleVendorAccepts}
                  className="rounded border border-emerald-400 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer text-center"
                >
                  ✓ Vendor Accepts Request
                </button>
              </div>
            </div>

            <div className="flex justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep("add_materials")}
              >
                Back to Materials
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3.A: IF VENDOR REJECTS */}
        {step === "rejected" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center space-y-2">
              <div className="text-base font-bold text-rose-800">Request Rejected by Vendor</div>
              <p className="text-xs text-rose-700 leading-relaxed">
                As per rules, since the vendor rejected the request:
                <br />
                • No confirmed order has been created.
                <br />
                • No financial amount is recorded.
                <br />
                • Vendor total order value and balance remain unaffected.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setStep("select_vendor")}
              >
                Select Another Vendor
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: IF VENDOR ACCEPTS -> ENTER FINAL TOTAL ORDER AMOUNT */}
        {step === "enter_final_amount" && (
          <form onSubmit={handleConfirmOrder} className="space-y-4">
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/70 p-3 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center space-x-1 font-bold">
                <span>✓ Request Accepted by {selectedVendor?.name}</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Now enter the agreed <strong>Final Total Order Amount</strong> negotiated with the vendor.
              </p>
            </div>

            {/* Final Order Amount Field */}
            <div className="bg-white p-4 rounded-lg border border-walnut/20 space-y-3">
              <div>
                <label className="block text-xs font-bold text-walnut uppercase mb-1">
                  Final Total Order Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 20000"
                  value={finalTotalOrderAmount}
                  onChange={(e) => setFinalTotalOrderAmount(e.target.value)}
                  className="w-full rounded border border-walnut/20 bg-cream/20 p-2.5 text-base font-mono font-bold text-charcoal focus:border-gold focus:outline-none"
                  required
                />
                <p className="text-[11px] text-walnut mt-1">
                  Manually entered by Super Admin. Do not use automatic price × quantity.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-walnut uppercase mb-1">Order Notes</label>
                <textarea
                  rows={2}
                  placeholder="Delivery terms, site instructions, payment schedule notes..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep("vendor_review")}
                disabled={submittingOrder}
              >
                Back
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={submittingOrder}>
                {submittingOrder ? "Confirming Order..." : "Confirm Order & Create Record"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
