"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, Search, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, TrendingUp } from "lucide-react";
import { FilterSelect } from "@/components/ui/filter-select";

export default function ReceivablesDirectoryPage() {
  const [receivables, setReceivables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  useEffect(() => {
    fetchReceivables();
  }, [search, status, overdueOnly]);

  const fetchReceivables = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status) params.append("status", status);
      if (overdueOnly) params.append("overdueOnly", "true");

      const res = await fetch(`/api/v1/finance/receivables?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReceivables(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalReceivable = receivables.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const totalPaid = receivables.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
  const totalOutstanding = receivables.reduce((sum, r) => sum + (r.outstandingAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#89652D]">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#262421] tracking-tight">Client Receivables & Due Tracking</h1>
              <p className="text-xs text-[#77716A]">
                Authoritative tracking of project milestones, invoices, paid amounts, and remaining receivables balance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-[#FFFEFC] border border-[#E8E2D8] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716A]">Total Invoiced</span>
            <TrendingUp className="w-4 h-4 text-[#89652D]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#262421] font-mono tabular-nums">
            ₹{totalReceivable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-[#77716A]">Total billed to clients</p>
        </div>

        <div className="p-4 rounded-xl bg-[#FFFEFC] border border-[#E8E2D8] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716A]">Total Collected</span>
            <CheckCircle2 className="w-4 h-4 text-[#536B4E]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#536B4E] font-mono tabular-nums">
            ₹{totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-[#77716A]">Cleared client receipts</p>
        </div>

        <div className="p-4 rounded-xl bg-[#FFFEFC] border border-[#E8E2D8] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716A]">Outstanding Due</span>
            <ArrowUpRight className="w-4 h-4 text-[#A45435]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#A45435] font-mono tabular-nums">
            ₹{totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-[#77716A]">Remaining unpaid balance</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FFFEFC] p-3 rounded-xl border border-[#E8E2D8] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#77716A]" />
          <input
            type="text"
            placeholder="Search receivable no, client, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#262421] placeholder-[#77716A] focus:outline-hidden focus:ring-2 focus:ring-[#89652D]/20 focus:border-[#89652D]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
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

          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
              overdueOnly
                ? "bg-[#FAF0ED] border-[#EACDC4] text-[#A45435]"
                : "bg-[#FFFEFC] border-[#E8E2D8] text-[#77716A] hover:bg-[#F3EEE5]"
            }`}
          >
            Overdue Only
          </button>
        </div>
      </div>

      {/* Receivables Table */}
      <div className="bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F6F1] text-[#77716A] text-[11px] font-bold uppercase tracking-wider border-b border-[#E8E2D8]">
                <th className="px-4 py-3">Receivable No</th>
                <th className="px-4 py-3">Client / Customer</th>
                <th className="px-4 py-3">Project / Milestone</th>
                <th className="px-4 py-3 text-right">Total Receivable</th>
                <th className="px-4 py-3 text-right">Paid Amount</th>
                <th className="px-4 py-3 text-right">Outstanding Due</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-[#77716A]">
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-[#89652D] border-t-transparent rounded-full mb-2"></div>
                    <p>Loading receivables...</p>
                  </td>
                </tr>
              ) : receivables.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-[#77716A]">
                    No receivables records found
                  </td>
                </tr>
              ) : (
                receivables.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#262421]">
                      {r.referenceNo || r.receivableNo}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#262421]">
                      {r.client?.fullName || r.clientName || "-"}
                    </td>
                    <td className="px-4 py-3 text-[#77716A]">
                      {r.project?.title || r.projectTitle || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#262421] tabular-nums">
                      ₹{(r.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#536B4E] tabular-nums font-semibold">
                      ₹{(r.paidAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#A45435] tabular-nums font-bold">
                      ₹{(r.outstandingAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          r.status === "PAID"
                            ? "bg-[#F4F7F3] text-[#536B4E] border border-[#D1E0CD]"
                            : r.status === "OVERDUE"
                            ? "bg-[#FAF0ED] text-[#A45435] border border-[#EACDC4]"
                            : "bg-[#F8EBD5] text-[#89652D] border border-[#DFD4C3]"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#77716A] text-[11px]">
                      {r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
