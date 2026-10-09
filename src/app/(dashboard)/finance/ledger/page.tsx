"use client";

import React, { useState, useEffect } from "react";
import { Receipt, Search, ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { FilterSelect } from "@/components/ui/filter-select";

export default function FinancialLedgerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [direction, setDirection] = useState<"" | "INFLOW" | "OUTFLOW">("");
  const [sourceType, setSourceType] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchLedger();
  }, [direction, sourceType, search, page]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (direction) params.append("direction", direction);
      if (sourceType) params.append("sourceType", sourceType);
      if (search) params.append("search", search);
      params.append("page", page.toString());
      params.append("limit", "25");

      const res = await fetch(`/api/v1/finance/ledger?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEntries(data.data.entries || []);
        setPagination(data.data.pagination || { page: 1, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#89652D]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#262421] tracking-tight">Unified Financial Transaction Ledger</h1>
              <p className="text-xs text-[#77716A]">
                Authoritative financial audit trail (`LED-YYYY-XXXX`) for every inflow, outflow, and account movement
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FFFEFC] p-3 rounded-xl border border-[#E8E2D8] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#77716A]" />
          <input
            type="text"
            placeholder="Search entry no, party, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#262421] placeholder-[#77716A] focus:outline-hidden focus:ring-2 focus:ring-[#89652D]/20 focus:border-[#89652D]"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <FilterSelect
            label="Direction"
            placeholder="All Directions"
            value={direction}
            onChange={(val) => setDirection(val as any || "")}
            options={[
              { value: "INFLOW", label: "INFLOW (Money Received)" },
              { value: "OUTFLOW", label: "OUTFLOW (Money Paid)" },
            ]}
            variant="beige"
            size="sm"
          />

          <FilterSelect
            label="Source Type"
            placeholder="All Source Types"
            value={sourceType}
            onChange={(val) => setSourceType(val || "")}
            options={[
              { value: "CLIENT_PAYMENT", label: "Client Payment" },
              { value: "VENDOR_PAYMENT", label: "Vendor Payment" },
              { value: "EXPENSE", label: "Expense" },
              { value: "PETTY_CASH_ADVANCE", label: "Petty Cash Advance" },
              { value: "PETTY_CASH_RETURN", label: "Petty Cash Return" },
            ]}
            variant="beige"
            size="sm"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8F6F1] text-[#77716A] text-[11px] font-bold uppercase tracking-wider border-b border-[#E8E2D8]">
                <th className="px-4 py-3">Entry No</th>
                <th className="px-4 py-3">Direction</th>
                <th className="px-4 py-3">Source & Party</th>
                <th className="px-4 py-3">Financial Account</th>
                <th className="px-4 py-3">Payment Mode / Ref</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-[#77716A]">
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-[#89652D] border-t-transparent rounded-full mb-2"></div>
                    <p>Loading financial ledger...</p>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-xs text-[#77716A]">
                    No financial ledger entries found
                  </td>
                </tr>
              ) : (
                entries.map((l) => (
                  <tr key={l.id} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#262421]">{l.entryNo}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          l.direction === "INFLOW"
                            ? "bg-[#F4F7F3] text-[#536B4E] border border-[#D1E0CD]"
                            : "bg-[#FAF0ED] text-[#A45435] border border-[#EACDC4]"
                        }`}
                      >
                        {l.direction === "INFLOW" ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        {l.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#262421]">{l.sourceType}</div>
                      <div className="text-[11px] text-[#77716A]">
                        {l.client?.fullName || l.vendor?.name || l.notes || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#77716A]">{l.financialAccount?.name || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#262421]">{l.paymentMethod}</div>
                      {l.referenceNoExt && <div className="text-[10px] text-[#77716A] font-mono">{l.referenceNoExt}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold font-mono tabular-nums">
                      <span className={l.direction === "INFLOW" ? "text-[#536B4E]" : "text-[#A45435]"}>
                        {l.direction === "INFLOW" ? "+" : "-"}₹{(l.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          l.status === "RECORDED"
                            ? "bg-[#F4F7F3] text-[#536B4E] border border-[#D1E0CD]"
                            : "bg-[#FAF0ED] text-[#A45435] border border-[#EACDC4]"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#77716A] text-[11px] whitespace-nowrap">
                      {new Date(l.transactionDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-[#E8E2D8] flex items-center justify-between bg-[#F8F6F1] text-xs">
          <span className="text-[#77716A]">
            Page <strong className="text-[#262421] font-bold">{pagination.page}</strong> of{" "}
            <strong className="text-[#262421] font-bold">{pagination.totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-xl border border-[#E8E2D8] bg-[#FFFEFC] hover:bg-[#F3EEE5] text-[#262421] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-xl border border-[#E8E2D8] bg-[#FFFEFC] hover:bg-[#F3EEE5] text-[#262421] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
