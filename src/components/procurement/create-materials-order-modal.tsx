"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Truck, AlertCircle, CheckCircle } from "lucide-react";

interface VendorOption {
  id: string;
  name: string;
  categoryKey?: string;
  phone: string;
}

interface LeadOption {
  id: string;
  referenceNo: string;
  clientName: string;
  phone: string;
  email?: string | null;
  location?: string | null;
  requirement?: string | null;
}

interface MaterialRow {
  materialName: string;
  category: string;
  quantity: number;
  unitKey: string;
  referencePrice: number;
  notes?: string;
}

interface CreateMaterialsOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export const CreateMaterialsOrderModal: React.FC<CreateMaterialsOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  // Step tracking: 1: Lead & Customer, 2: Vendor Selection, 3: Materials & Reference Prices, 4: Vendor Acceptance & Manual Final Amount
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Leads
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("NEW_LEAD");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Vendors
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [isOtherVendor, setIsOtherVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");
  const [newVendorCategory, setNewVendorCategory] = useState("PLYWOOD");

  // Materials
  const [materials, setMaterials] = useState<MaterialRow[]>([
    { materialName: "18mm Marine Plywood", category: "RAW_MATERIAL", quantity: 10, unitKey: "SQFT", referencePrice: 2000, notes: "" },
    { materialName: "1mm Matte Laminate", category: "RAW_MATERIAL", quantity: 5, unitKey: "SHEET", referencePrice: 1500, notes: "" },
  ]);

  // Vendor Acceptance flow
  const [vendorResponse, setVendorResponse] = useState<"ACCEPTED" | "REJECTED" | null>("ACCEPTED");
  const [finalVendorOrderAmount, setFinalVendorOrderAmount] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMasterData();
    }
  }, [isOpen]);

  const fetchMasterData = async () => {
    try {
      const [leadsRes, vendorsRes] = await Promise.all([
        fetch("/api/v1/leads?limit=50"),
        fetch("/api/v1/procurement/vendors"),
      ]);
      if (leadsRes.ok) {
        const lData = await leadsRes.json();
        setLeads(lData.data || []);
      }
      if (vendorsRes.ok) {
        const vData = await vendorsRes.json();
        const vList = vData.data || [];
        setVendors(vList);
        if (vList.length > 0 && !selectedVendorId) {
          setSelectedVendorId(vList[0].id);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleLeadSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedLeadId(val);
    if (val === "NEW_LEAD") {
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setCustomerAddress("");
    } else {
      const found = leads.find((l) => l.id === val);
      if (found) {
        setCustomerName(found.clientName);
        setCustomerPhone(found.phone);
        setCustomerEmail(found.email || "");
        setCustomerAddress(found.location || "");
      }
    }
  };

  const addMaterialRow = () => {
    setMaterials([
      ...materials,
      { materialName: "", category: "RAW_MATERIAL", quantity: 1, unitKey: "NOS", referencePrice: 0, notes: "" },
    ]);
  };

  const removeMaterialRow = (idx: number) => {
    if (materials.length <= 1) return;
    setMaterials(materials.filter((_, i) => i !== idx));
  };

  const updateMaterialRow = (idx: number, field: keyof MaterialRow, val: any) => {
    const next = [...materials];
    next[idx] = { ...next[idx], [field]: val };
    setMaterials(next);
  };

  const calculateReferenceTotal = () => {
    return materials.reduce((acc, m) => acc + (m.referencePrice || 0) * (m.quantity || 0), 0);
  };

  const handleCreateNewVendor = async (): Promise<string> => {
    const res = await fetch("/api/v1/procurement/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newVendorName.trim(),
        phone: newVendorPhone.trim(),
        categoryKey: newVendorCategory,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to create new vendor");
    }
    const created = await res.json();
    return created.data.id;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Please provide customer name and phone.");
      return;
    }

    if (materials.some((m) => !m.materialName.trim() || m.quantity <= 0)) {
      setError("Please provide a valid material name and positive quantity for all items.");
      return;
    }

    if (vendorResponse === "REJECTED") {
      setError("Vendor rejected the request. Confirmed orders can only be created upon vendor acceptance.");
      return;
    }

    const finalAmount = parseFloat(finalVendorOrderAmount);
    if (!finalAmount || finalAmount <= 0) {
      setError("Super Admin must manually enter a valid Final Vendor Order Amount.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let finalVendorId = selectedVendorId;
      if (isOtherVendor) {
        if (!newVendorName.trim() || !newVendorPhone.trim()) {
          throw new Error("Please provide name and phone for the new vendor.");
        }
        finalVendorId = await handleCreateNewVendor();
      }

      const payload = {
        leadId: selectedLeadId === "NEW_LEAD" ? null : selectedLeadId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || null,
        customerAddress: customerAddress.trim() || null,
        vendorId: finalVendorId,
        materials: materials.map((m) => ({
          materialName: m.materialName.trim(),
          category: m.category,
          quantity: m.quantity,
          unitKey: m.unitKey,
          referencePrice: m.referencePrice || 0,
          notes: m.notes?.trim() || null,
        })),
        finalVendorOrderAmount: finalAmount,
        notes: notes.trim() || undefined,
      };

      const res = await fetch("/api/v1/procurement/materials-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to confirm materials order");
      }

      onOrderCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error confirming materials order");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-charcoal/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full border border-walnut/20 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-walnut/15 pb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gold/20 text-charcoal">
                Materials Required Lead Flow
              </span>
            </div>
            <h3 className="text-base font-bold text-charcoal mt-1">
              New Materials Order Procurement
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-walnut hover:bg-cream hover:text-charcoal cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-1.5 rounded-lg transition ${
              step === 1 ? "bg-gold text-charcoal font-bold" : "bg-cream/40 text-walnut"
            }`}
          >
            1. Customer
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`py-1.5 rounded-lg transition ${
              step === 2 ? "bg-gold text-charcoal font-bold" : "bg-cream/40 text-walnut"
            }`}
          >
            2. Vendor
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`py-1.5 rounded-lg transition ${
              step === 3 ? "bg-gold text-charcoal font-bold" : "bg-cream/40 text-walnut"
            }`}
          >
            3. Materials
          </button>
          <button
            type="button"
            onClick={() => setStep(4)}
            className={`py-1.5 rounded-lg transition ${
              step === 4 ? "bg-gold text-charcoal font-bold" : "bg-cream/40 text-walnut"
            }`}
          >
            4. Confirm
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 shrink-0">
            {error}
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* STEP 1: CUSTOMER / LEAD SELECTION */}
          {step === 1 && (
            <div className="space-y-3">
              <h4 className="font-bold text-charcoal uppercase tracking-wider text-[11px]">
                Customer / Materials Required Lead Source
              </h4>

              <div>
                <label className="block text-walnut font-medium mb-1">
                  Select Existing Lead or Add Direct Customer
                </label>
                <select
                  value={selectedLeadId}
                  onChange={handleLeadSelect}
                  className="w-full px-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:outline-none focus:border-gold"
                >
                  <option value="NEW_LEAD">+ Manually Add Customer Details</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.referenceNo} — {l.clientName} ({l.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-walnut font-medium mb-1">
                    Customer Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Kumar"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-walnut font-medium mb-1">
                    Customer Phone <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 98480 12345"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-walnut font-medium mb-1">Email ID</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-walnut font-medium mb-1">Delivery Address</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Site delivery address"
                    className="w-full px-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:outline-none focus:border-gold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: VENDOR SELECTION */}
          {step === 2 && (
            <div className="space-y-4">
              <h4 className="font-bold text-charcoal uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-walnut" />
                Select Vendor / Supplier
              </h4>

              <div className="flex gap-4 p-2 bg-cream/30 rounded-lg border border-walnut/10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="vendorChoice"
                    checked={!isOtherVendor}
                    onChange={() => setIsOtherVendor(false)}
                  />
                  <span className="font-semibold text-charcoal">Existing Vendor</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="vendorChoice"
                    checked={isOtherVendor}
                    onChange={() => setIsOtherVendor(true)}
                  />
                  <span className="font-semibold text-charcoal">Others (Add New Vendor)</span>
                </label>
              </div>

              {!isOtherVendor ? (
                <div>
                  <label className="block text-walnut font-medium mb-1">
                    Select From Approved Vendors
                  </label>
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:outline-none focus:border-gold"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.categoryKey || "GENERAL"}) — {v.phone}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-4 bg-cream/40 rounded-xl border border-walnut/20 space-y-3">
                  <span className="font-bold text-charcoal block">
                    Add New Vendor (Automatically Saved in Vendor Management)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-walnut font-medium mb-1">Vendor Name *</label>
                      <input
                        type="text"
                        value={newVendorName}
                        onChange={(e) => setNewVendorName(e.target.value)}
                        placeholder="e.g. Apex Hardware Supplies"
                        className="w-full px-3 py-2 rounded-lg border border-walnut/20 bg-white text-charcoal"
                      />
                    </div>
                    <div>
                      <label className="block text-walnut font-medium mb-1">Vendor Phone *</label>
                      <input
                        type="text"
                        value={newVendorPhone}
                        onChange={(e) => setNewVendorPhone(e.target.value)}
                        placeholder="e.g. +91 98480 99999"
                        className="w-full px-3 py-2 rounded-lg border border-walnut/20 bg-white text-charcoal"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-walnut font-medium mb-1">Category</label>
                    <select
                      value={newVendorCategory}
                      onChange={(e) => setNewVendorCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-walnut/20 bg-white text-charcoal"
                    >
                      <option value="PLYWOOD">Plywood & Boards</option>
                      <option value="LAMINATE">Laminates & Veneers</option>
                      <option value="HARDWARE">Hardware & Fittings</option>
                      <option value="PAINT">Paint & Finishes</option>
                      <option value="GLASS">Glass & Mirrors</option>
                      <option value="OTHER">Other Materials</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: MATERIAL SELECTION & ADVISORY REFERENCE PRICES */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-charcoal uppercase tracking-wider text-[11px]">
                    Required Materials
                  </h4>
                  <p className="text-[11px] text-walnut">
                    Reference prices are for guidance only and are never used to auto-calculate the final order amount.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addMaterialRow}
                  className="px-2.5 py-1 text-xs font-bold rounded bg-cream border border-walnut/20 text-walnut hover:bg-walnut/10 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Material
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {materials.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-cream/20 rounded-lg border border-walnut/15 grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={m.materialName}
                        onChange={(e) => updateMaterialRow(idx, "materialName", e.target.value)}
                        placeholder="Material name *"
                        className="w-full px-2 py-1.5 rounded border border-walnut/20 bg-white text-charcoal text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={m.quantity || ""}
                        onChange={(e) => updateMaterialRow(idx, "quantity", parseFloat(e.target.value) || 0)}
                        placeholder="Qty"
                        className="w-full px-2 py-1.5 rounded border border-walnut/20 bg-white text-charcoal text-xs font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={m.unitKey}
                        onChange={(e) => updateMaterialRow(idx, "unitKey", e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-walnut/20 bg-white text-charcoal text-xs"
                      >
                        <option value="NOS">Nos</option>
                        <option value="SQFT">SqFt</option>
                        <option value="SHEET">Sheets</option>
                        <option value="SET">Sets</option>
                        <option value="KG">Kg</option>
                        <option value="LTR">Ltr</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={m.referencePrice || ""}
                        onChange={(e) => updateMaterialRow(idx, "referencePrice", parseFloat(e.target.value) || 0)}
                        placeholder="Ref Rate ₹"
                        className="w-full px-2 py-1.5 rounded border border-walnut/20 bg-white text-walnut text-xs font-mono"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeMaterialRow(idx)}
                        disabled={materials.length <= 1}
                        className="text-walnut/60 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-cream/40 rounded-lg border border-walnut/10 flex justify-between items-center text-xs">
                <span className="text-walnut">Informational Reference Total:</span>
                <span className="font-mono font-bold text-walnut">
                  ₹{calculateReferenceTotal().toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: VENDOR ACCEPTANCE & SUPER ADMIN MANUAL FINAL AMOUNT */}
          {step === 4 && (
            <div className="space-y-4">
              <h4 className="font-bold text-charcoal uppercase tracking-wider text-[11px]">
                Vendor Request Status & Agreed Final Order Amount
              </h4>

              {/* Vendor Accept / Reject Toggle */}
              <div>
                <label className="block text-walnut font-medium mb-1">
                  Vendor Request Response
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVendorResponse("ACCEPTED")}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                      vendorResponse === "ACCEPTED"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                        : "bg-cream/30 border-walnut/20 text-walnut"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Vendor Accepts Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setVendorResponse("REJECTED")}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                      vendorResponse === "REJECTED"
                        ? "bg-rose-50 border-rose-500 text-rose-800 shadow-xs"
                        : "bg-cream/30 border-walnut/20 text-walnut"
                    }`}
                  >
                    <X className="w-4 h-4 text-rose-600" />
                    Vendor Rejects Request
                  </button>
                </div>
              </div>

              {vendorResponse === "REJECTED" ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Request Rejected by Vendor
                  </div>
                  <p>
                    Per business rules, rejected requests do not create any confirmed order, do not record any financial value, and do not appear in MATERIALS ORDER. Please go back to Step 2 to select another vendor or renegotiate.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Strict Rule Banner */}
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                    <span className="font-bold">Strict Rule — Manual Final Vendor Order Amount:</span>
                    <p>
                      Reference prices (Total: ₹{calculateReferenceTotal().toLocaleString("en-IN")}) are only for information. Do NOT auto-calculate price × quantity. The Super Admin must manually enter the final negotiated order amount agreed with the vendor.
                    </p>
                  </div>

                  <div>
                    <label className="block text-walnut font-bold mb-1">
                      Final Vendor Order Amount (₹) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={finalVendorOrderAmount}
                      onChange={(e) => setFinalVendorOrderAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      required
                      className="w-full px-3 py-2 rounded-lg border-2 border-gold bg-white text-base font-mono font-bold text-charcoal focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-walnut font-medium mb-1">Remarks / Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Bulk discount negotiated with ABC Plywood"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center border-t border-walnut/15 pt-3 shrink-0">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-walnut hover:bg-cream/60 cursor-pointer"
              >
                ← Back
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-walnut hover:bg-cream/60 cursor-pointer"
            >
              Cancel
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as any)}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-gold text-charcoal hover:bg-gold-hover transition shadow-gold cursor-pointer"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting || vendorResponse === "REJECTED"}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-gold text-charcoal hover:bg-gold-hover transition shadow-gold disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Confirming Order..." : "Confirm & Place Order"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
