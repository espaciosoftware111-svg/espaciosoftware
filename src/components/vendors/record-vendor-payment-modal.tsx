"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface RecordVendorPaymentModalProps {
  isOpen: boolean;
  vendorId: string | null;
  vendorName: string;
  totalOrderValue: number;
  totalPaid: number;
  remainingBalance: number;
  orders?: Array<{ id: string; referenceNo: string; grandTotal: number }>;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecordVendorPaymentModal({
  isOpen,
  vendorId,
  vendorName,
  totalOrderValue,
  totalPaid,
  remainingBalance,
  orders = [],
  onClose,
  onSuccess,
}: RecordVendorPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [referenceNoExt, setReferenceNoExt] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState<Array<{ id: string; referenceNo: string; title: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setPaymentMethod("BANK_TRANSFER");
      setReferenceNoExt("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setSelectedOrderId("");
      setSelectedProjectId("");
      setNotes("");
      setError("");
      fetchProjects();
    }
  }, [isOpen]);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/v1/projects?limit=50");
      if (res.ok) {
        const json = await res.json();
        setProjects(json.data?.projects || json.data || []);
      }
    } catch {
      // Ignore background failure
    }
  }

  function formatCurrency(val: number) {
    return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      setError("Please enter a valid payment amount greater than 0");
      return;
    }

    if (!vendorId) {
      setError("Vendor ID is missing");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, any> = {
        vendorId,
        amount: payAmount,
        paymentMethod,
        paymentDate: new Date(paymentDate).toISOString(),
        referenceNoExt: referenceNoExt.trim() || undefined,
        purchaseOrderId: selectedOrderId || undefined,
        projectId: selectedProjectId || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await fetch("/api/v1/procurement/vendor-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to record vendor payment");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Network error recording payment. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Vendor Payment" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Vendor Financial Summary Bar */}
        <div className="rounded-lg border border-walnut/20 bg-cream/60 p-4">
          <div className="text-xs font-bold text-walnut uppercase tracking-wider mb-2">
            Vendor: <span className="text-charcoal font-bold">{vendorName}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white/80 p-2 rounded border border-walnut/10">
              <div className="text-[10px] uppercase font-bold text-walnut">Total Orders</div>
              <div className="text-sm font-bold font-mono text-charcoal">{formatCurrency(totalOrderValue)}</div>
            </div>
            <div className="bg-white/80 p-2 rounded border border-walnut/10">
              <div className="text-[10px] uppercase font-bold text-walnut">Total Paid</div>
              <div className="text-sm font-bold font-mono text-emerald-700">{formatCurrency(totalPaid)}</div>
            </div>
            <div className="bg-white/80 p-2 rounded border border-walnut/10">
              <div className="text-[10px] uppercase font-bold text-walnut">Remaining Balance</div>
              <div className="text-sm font-bold font-mono text-amber-700">{formatCurrency(remainingBalance)}</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-semantic-danger-bg text-semantic-danger border border-semantic-danger-border rounded text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Payment Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 25000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs font-mono font-bold text-charcoal focus:border-gold focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal font-semibold focus:border-gold focus:outline-none"
            >
              <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="UPI">UPI / GooglePay / PhonePe</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT_CARD">Credit Card</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal focus:border-gold focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">
              Transaction Reference / UTR
            </label>
            <input
              type="text"
              placeholder="e.g. UTR-982138921"
              value={referenceNoExt}
              onChange={(e) => setReferenceNoExt(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs font-mono text-charcoal focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">
              Link to Project (Optional)
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal focus:border-gold focus:outline-none"
            >
              <option value="">-- No specific project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.referenceNo} — {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-walnut uppercase mb-1">
              Link to Order (Optional)
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal focus:border-gold focus:outline-none"
            >
              <option value="">-- No specific order --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.referenceNo} ({formatCurrency(o.grandTotal)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-walnut uppercase mb-1">Notes / Description</label>
          <textarea
            rows={2}
            placeholder="Payment details, voucher reference, material batch..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded border border-walnut/20 bg-white p-2 text-xs text-charcoal focus:border-gold focus:outline-none"
          />
        </div>

        {/* Sync Info Note */}
        <div className="text-[11px] text-walnut bg-amber-50/70 border border-amber-200/60 p-2.5 rounded text-amber-900 leading-relaxed">
          <strong>Automatic Financial Linkage:</strong> Recording this payment creates a single payment record, automatically logs an Expense in Expense Management, and dynamically updates Vendor Total Paid and Remaining Balance.
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            {loading ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
