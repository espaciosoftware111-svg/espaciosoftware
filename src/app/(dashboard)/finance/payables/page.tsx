"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Search, Plus, TrendingDown, ArrowDownRight, AlertTriangle } from "lucide-react";
import { RecordVendorPaymentModal } from "@/components/finance/record-vendor-payment-modal";
import { FilterSelect } from "@/components/ui/filter-select";

export default function PayablesDirectoryPage() {
  const [payables, setPayables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchPayables();
  }, [search, status]);

  const fetchPayables = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status) params.append("status", status);

      const res = await fetch(`/api/v1/finance/payables?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPayables(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPayable = payables.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalPaid = payables.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalOutstanding = payables.reduce((sum, p) => sum + (p.outstandingAmount || 0), 0);

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
              <h1 className="text-xl font-bold text-[#262421] tracking-tight">Vendor Payables & Outstanding Bills</h1>
              <p className="text-xs text-[#77716A]">
                Authoritative tracking of money owed to suppliers, purchase order bills, payments, and outstanding balances
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="px-4 py-2 bg-[#242321] hover:bg-[#383633] text-[#FAF8F5] text-xs font-bold rounded-xl shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          <span>Record Vendor Payment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-[#FFFEFC] border border-[#E8E2D8] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716A]">Total Billed</span>
            <TrendingDown className="w-4 h-4 text-[#89652D]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#262421] font-mono tabular-nums">
            ₹{totalPayable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-[#77716A]">Total PO and vendor bills</p>
        </div>

        <div className="p-4 rounded-xl bg-[#FFFEFC] border border-[#E8E2D8] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716A]">Total Disbursed</span>
            <ArrowDownRight className="w-4 h-4 text-[#536B4E]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#536B4E] font-mono tabular-nums">
            ₹{totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-[#77716A]">Payments executed to vendors</p>
        </div>

        <div className="p-4 rounded-xl bg-[#FFFEFC] border border-[#E8E2D8] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716A]">Outstanding Due</span>
            <AlertTriangle className="w-4 h-4 text-[#A45435]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#A45435] font-mono tabular-nums">
            ₹{totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-[#77716A]">Remaining payable liability</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FFFEFC] p-3 rounded-xl border border-[#E8E2D8] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#77716A]" />
          <input
            type="text"
            placeholder="Search payable no, vendor, PO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#262421] placeholder-[#77716A] focus:outline-hidden focus:ring-2 focus:ring-[#89652D]/20 focus:border-[#89652D]"
          />
        </div>

        <FilterSelect
          label="Status"
          placeholder="All Statuses"
          value={status}
          onChange={(val) => setStatus(val || "")}
          options={[
            { value: "OPEN", label: "OPEN" },
            { value: "PARTIALLY_PAID", label: "PARTIALLY PAID" },
            { value: "PAID", label: "PAID" },
            { value: "OVERDUE", label: "OVERDUE" },
          ]}
          variant="beige"
          size="sm"
        />
      </div>

      {/* Payables Table */}
      <div className="bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F6F1] text-[#77716A] text-[11px] font-bold uppercase tracking-wider border-b border-[#E8E2D8]">
                <th className="px-4 py-3">Payable No</th>
                <th className="px-4 py-3">Vendor / Supplier</th>
                <th className="px-4 py-3">PO / Invoice Ref</th>
                <th className="px-4 py-3 text-right">Total Payable</th>
                <th className="px-4 py-3 text-right">Paid Amount</th>
                <th className="px-4 py-3 text-right">Outstanding Balance</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-[#77716A]">
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-[#89652D] border-t-transparent rounded-full mb-2"></div>
                    <p>Loading payables...</p>
                  </td>
                </tr>
              ) : payables.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-[#77716A]">
                    No payable records found
                  </td>
                </tr>
              ) : (
                payables.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#262421]">
                      {p.referenceNo || p.payableNo}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#262421]">
                      {p.vendor?.name || p.vendorName || "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#77716A] text-[11px]">
                      {p.purchaseOrder?.referenceNo || p.poRef || p.invoiceNo || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#262421] tabular-nums">
                      ₹{(p.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#536B4E] tabular-nums font-semibold">
                      ₹{(p.paidAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#A45435] tabular-nums font-bold">
                      ₹{(p.outstandingAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.status === "PAID"
                            ? "bg-[#F4F7F3] text-[#536B4E] border border-[#D1E0CD]"
                            : p.status === "OVERDUE"
                            ? "bg-[#FAF0ED] text-[#A45435] border border-[#EACDC4]"
                            : "bg-[#F8EBD5] text-[#89652D] border border-[#DFD4C3]"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#77716A] text-[11px]">
                      {p.dueDate ? new Date(p.dueDate).toLocaleDateString("en-IN") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RecordVendorPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => fetchPayables()}
      />
    </div>
  );
}
