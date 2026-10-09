"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, RotateCcw, Search, CheckCircle2, ShieldAlert } from "lucide-react";
import { RecordVendorPaymentModal } from "@/components/finance/record-vendor-payment-modal";

export default function VendorPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/finance/vendor-payments");
      const data = await res.json();
      if (data.success) {
        setPayments(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReverse = async (id: string) => {
    const reason = prompt("Enter explicit reason for vendor payment reversal:");
    if (!reason || reason.trim() === "") return;

    try {
      const res = await fetch(`/api/v1/finance/vendor-payments/${id}/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPayments();
      } else {
        alert(data.error || "Failed to reverse payment");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalDisbursed = payments.reduce((sum, p) => p.status === "COMPLETED" ? sum + (p.amount || 0) : sum, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#89652D]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#262421] tracking-tight">Vendor Payments & Reversals Ledger</h1>
              <p className="text-xs text-[#77716A]">
                Authoritative supplier disbursement records (`VPAY-YYYY-XXXX`) and controlled audit reversals
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="px-4 py-2 bg-[#242321] hover:bg-[#383633] text-[#FAF8F5] text-xs font-bold rounded-xl shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          <span>Record Vendor Payment</span>
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="p-4 rounded-xl bg-[#FFFEFC] border border-[#E8E2D8] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716A]">Total Disbursed to Vendors</span>
          <div className="text-2xl font-bold text-[#262421] font-mono tabular-nums mt-1">
            ₹{totalDisbursed.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F7F3] border border-[#D1E0CD] text-xs font-semibold text-[#536B4E]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Immutable Audit Reversal Enabled
          </span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F6F1] text-[#77716A] text-[11px] font-bold uppercase tracking-wider border-b border-[#E8E2D8]">
                <th className="px-4 py-3">Payment No</th>
                <th className="px-4 py-3">Vendor / Supplier</th>
                <th className="px-4 py-3">Financial Account</th>
                <th className="px-4 py-3">Payment Mode / UTR</th>
                <th className="px-4 py-3 text-right">Amount Paid</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-[#77716A]">
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-[#89652D] border-t-transparent rounded-full mb-2"></div>
                    <p>Loading vendor payments...</p>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-[#77716A]">
                    No vendor payments recorded yet
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#262421]">
                      {p.referenceNo || p.paymentNo}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#262421]">
                      {p.vendor?.name || p.vendorName || "-"}
                    </td>
                    <td className="px-4 py-3 text-[#77716A]">
                      {p.account?.name || p.accountName || "Operating Account"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#77716A] text-[11px]">
                      {p.paymentMode} {p.referenceNoExternal ? `• ${p.referenceNoExternal}` : ""}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#262421] tabular-nums">
                      ₹{(p.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.status === "COMPLETED"
                            ? "bg-[#F4F7F3] text-[#536B4E] border border-[#D1E0CD]"
                            : p.status === "REVERSED"
                            ? "bg-[#FAF0ED] text-[#A45435] border border-[#EACDC4]"
                            : "bg-[#F8EBD5] text-[#89652D] border border-[#DFD4C3]"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#77716A] text-[11px]">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === "COMPLETED" && (
                        <button
                          onClick={() => handleReverse(p.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#A45435] bg-[#FAF0ED] hover:bg-[#F6E1DC] border border-[#EACDC4] rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RecordVendorPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={() => fetchPayments()}
      />
    </div>
  );
}
