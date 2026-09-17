"use client";

import React, { useState } from "react";
import { X, DollarSign } from "lucide-react";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderRef: string;
  vendorName: string;
  remainingBalance: number;
  onPaymentRecorded: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderRef,
  vendorName,
  remainingBalance,
  onPaymentRecorded,
}) => {
  const [amount, setAmount] = useState(remainingBalance > 0 ? remainingBalance.toString() : "");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [referenceNoExt, setReferenceNoExt] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid payment amount greater than 0.");
      return;
    }

    if (numAmount > remainingBalance + 0.01) {
      setError(`Payment amount cannot exceed remaining balance of ₹${remainingBalance.toLocaleString("en-IN")}`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/procurement/materials-order/${orderId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          paymentMethod,
          paymentDate,
          referenceNoExt: referenceNoExt.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to record payment");
      }

      onPaymentRecorded();
    } catch (err: any) {
      setError(err.message || "Error recording payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-charcoal/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-walnut/20 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-walnut/15 pb-3">
          <div>
            <span className="text-[10px] font-bold text-walnut uppercase tracking-wider font-mono">
              {orderRef}
            </span>
            <h3 className="text-base font-bold text-charcoal flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-walnut" />
              Record Vendor Payment
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-walnut hover:bg-cream hover:text-charcoal cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-cream/40 rounded-lg border border-walnut/10 space-y-1">
            <div className="flex justify-between">
              <span className="text-walnut">Vendor:</span>
              <span className="font-bold text-charcoal">{vendorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-walnut">Remaining Balance:</span>
              <span className="font-mono font-bold text-amber-800">
                ₹{remainingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-walnut font-medium mb-1">
              Payment Amount (₹) <span className="text-rose-600">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 25000"
              required
              className="w-full px-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 font-mono font-bold text-charcoal focus:outline-none focus:border-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-walnut font-medium mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:outline-none focus:border-gold"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
                <option value="CREDIT_CARD">Credit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-walnut font-medium mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:outline-none focus:border-gold"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block text-walnut font-medium mb-1">UTR / Cheque / Ref Number</label>
            <input
              type="text"
              value={referenceNoExt}
              onChange={(e) => setReferenceNoExt(e.target.value)}
              placeholder="e.g. UTR12345678"
              className="w-full px-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-walnut font-medium mb-1">Notes / Remarks</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional remarks"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:outline-none focus:border-gold"
            />
          </div>

          <div className="text-[11px] text-walnut italic bg-amber-50/70 p-2 rounded border border-amber-200/60">
            Notice: Recording this payment automatically registers a linked expense voucher in Expense Management. Zero double-counting guaranteed.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-walnut hover:bg-cream/60 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-gold text-charcoal hover:bg-gold-hover transition shadow-gold cursor-pointer"
            >
              {submitting ? "Recording..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
