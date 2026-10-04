"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DataTable } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, IndianRupee, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ClientReceivablesPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchReceivables = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/payments/receivables/clients");
      const json = await res.json();
      if (json.success) setClients(json.data || []);
    } catch {
      // quiet error handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

  const filteredClients = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.clientName || "").toLowerCase().includes(q) ||
      (c.clientReferenceNo || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
    );
  });

  const totalContract = clients.reduce((acc, c) => acc + (c.totalContractValue || 0), 0);
  const totalVerified = clients.reduce((acc, c) => acc + (c.totalVerifiedPaid || 0), 0);
  const totalOutstanding = clients.reduce((acc, c) => acc + (c.totalPendingBalance || 0), 0);

  const columns = [
    {
      header: "Client Ref & Name",
      accessorKey: "clientReferenceNo" as const,
      cell: (row: any) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-semibold text-slate-700 block">{row.clientReferenceNo}</span>
          <span className="font-medium text-slate-900 leading-tight block text-xs">{row.clientName}</span>
          <span className="text-[11px] text-slate-400">{row.phone}</span>
        </div>
      ),
    },
    {
      header: "Active Projects",
      accessorKey: "activeProjectsCount" as const,
      isNumeric: true,
      cell: (row: any) => (
        <span className="font-medium text-xs text-slate-700">{row.activeProjectsCount}</span>
      ),
    },
    {
      header: "Total Project Value",
      accessorKey: "totalContractValue" as const,
      isNumeric: true,
      cell: (row: any) => (
        <span className="tabular-nums font-semibold text-slate-900 text-xs">
          {formatCurrency(row.totalContractValue)}
        </span>
      ),
    },
    {
      header: "Verified Receipts",
      accessorKey: "totalVerifiedPaid" as const,
      isNumeric: true,
      cell: (row: any) => (
        <span className="tabular-nums font-semibold text-emerald-600 text-xs">
          {formatCurrency(row.totalVerifiedPaid)}
        </span>
      ),
    },
    {
      header: "Outstanding Balance",
      accessorKey: "totalPendingBalance" as const,
      isNumeric: true,
      cell: (row: any) => (
        <span className="tabular-nums font-semibold text-amber-600 text-xs">
          {formatCurrency(row.totalPendingBalance)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Client Aggregate Receivables</h1>
          <p className="text-xs text-slate-500 mt-0.5">Authoritative client balance summary across active commercial interior projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/finance/payments">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Payments Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Value Across Clients</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
              {formatCurrency(totalContract)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{clients.length} active client accounts</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Total Collected Receipts</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-emerald-600 tabular-nums tracking-tight">
              {formatCurrency(totalVerified)}
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium">Verified in bank ledger</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Total Pending Receivables</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
              {formatCurrency(totalOutstanding)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Cumulative uncollected dues</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by Client Name, Phone, or Reference Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-colors"
          />
        </div>
      </div>

      {/* Receivables Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <DataTable
          columns={columns}
          data={filteredClients}
          keyExtractor={(r) => r.clientId}
          isLoading={isLoading}
          emptyText="No client receivables records."
          emptySubtext="Client receivables are calculated dynamically from project commercial values and verified payment receipts."
        />
      </div>
    </div>
  );
}

