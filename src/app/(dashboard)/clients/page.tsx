"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientFormModal } from "@/components/clients/client-form-modal";
import { ClientWorkspace } from "@/components/clients/client-workspace";
import { FilterSelect } from "@/components/ui/filter-select";
import {
  AlertCircle,
  Building,
  CheckCircle,
  CreditCard,
  Filter,
  FolderGit2,
  Phone,
  Plus,
  Search,
  Tag,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

function ClientsContent() {
  const [clients, setClients] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canViewFinancials, setCanViewFinancials] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("");
  const [hasActiveProjFilter, setHasActiveProjFilter] = useState<string>("ALL");
  const [hasOutstandingFilter, setHasOutstandingFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal / Workspace State
  const searchParams = useSearchParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  // Deep-linking from query parameters
  useEffect(() => {
    const id = searchParams.get("id");
    const action = searchParams.get("action");
    if (id) {
      setSelectedClientId(id);
      setIsWorkspaceOpen(true);
    }
    if (action === "create") {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/v1/clients/metrics");
      const json = await res.json();
      if (json.success) {
        setMetrics(json.data);
        if (json.data.canViewFinancials) {
          setCanViewFinancials(true);
        }
      }
    } catch {
      // Ignore metrics fetch error
    }
  };

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });

      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("clientType", typeFilter);
      if (cityFilter.trim()) params.set("city", cityFilter.trim());
      if (hasActiveProjFilter === "true") params.set("hasActiveProject", "true");
      if (hasActiveProjFilter === "false") params.set("hasActiveProject", "false");
      if (hasOutstandingFilter === "true") params.set("hasOutstanding", "true");
      if (hasOutstandingFilter === "false") params.set("hasOutstanding", "false");

      const res = await fetch(`/api/v1/clients?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setClients(json.data || []);
        setTotalPages(json.meta?.totalPages || 1);
        if (json.meta?.canViewFinancials !== undefined) {
          setCanViewFinancials(json.meta.canViewFinancials);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, typeFilter, cityFilter, hasActiveProjFilter, hasOutstandingFilter, page]);

  const handleRowClick = (client: any) => {
    setSelectedClientId(client.id);
    setIsWorkspaceOpen(true);
  };

  const columns = [
    {
      header: "Client ID",
      accessorKey: "referenceNo" as const,
      cell: (row: any) => (
        <span className="font-mono text-xs font-bold text-[#262421]">{row.referenceNo}</span>
      ),
    },
    {
      header: "Client & Company",
      accessorKey: "fullName" as const,
      cell: (row: any) => (
        <div>
          <span className="font-semibold text-[#262421] block leading-tight">{row.fullName}</span>
          {row.companyName && (
            <span className="text-[11px] text-[#77716A] font-medium">{row.companyName}</span>
          )}
        </div>
      ),
    },
    {
      header: "Contact",
      accessorKey: "phone" as const,
      cell: (row: any) => (
        <div>
          <span className="font-mono text-xs text-[#262421] block leading-tight">{row.phone}</span>
          {row.email && <span className="text-[10px] text-[#77716A]">{row.email}</span>}
        </div>
      ),
    },
    {
      header: "Type",
      accessorKey: "clientType" as const,
      cell: (row: any) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8]">
          {row.clientType}
        </span>
      ),
    },
    {
      header: "Location",
      accessorKey: "city" as const,
      cell: (row: any) => (
        <span className="text-xs text-[#77716A]">
          {row.city ? `${row.city}${row.state ? `, ${row.state}` : ""}` : "N/A"}
        </span>
      ),
    },
    {
      header: "Projects",
      accessorKey: "projectCount" as const,
      isNumeric: true,
      cell: (row: any) => (
        <div className="text-center font-mono">
          <span className="font-bold text-[#262421]">{row.projectCount}</span>
          {row.activeProjectsCount > 0 && (
            <span className="text-[10px] text-[#536B4E] block font-sans">({row.activeProjectsCount} active)</span>
          )}
        </div>
      ),
    },
    ...(canViewFinancials
      ? [
          {
            header: "Total Value",
            accessorKey: "totalProjectValue" as const,
            isNumeric: true,
            cell: (row: any) => (
              <span className="tabular-nums font-bold text-[#262421] text-xs">
                {row.totalProjectValue !== null ? formatCurrency(row.totalProjectValue) : "—"}
              </span>
            ),
          },
          {
            header: "Received",
            accessorKey: "totalReceived" as const,
            isNumeric: true,
            cell: (row: any) => (
              <span className="tabular-nums font-bold text-[#536B4E] text-xs">
                {row.totalReceived !== null ? formatCurrency(row.totalReceived) : "—"}
              </span>
            ),
          },
          {
            header: "Outstanding",
            accessorKey: "totalOutstanding" as const,
            isNumeric: true,
            cell: (row: any) => (
              <span
                className={`tabular-nums font-bold text-xs ${
                  (row.totalOutstanding || 0) > 0 ? "text-[#A45435]" : "text-[#77716A]"
                }`}
              >
                {row.totalOutstanding !== null ? formatCurrency(row.totalOutstanding) : "—"}
              </span>
            ),
          },
        ]
      : []),
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (row: any) => {
        const variant =
          row.status === "ACTIVE"
            ? "active"
            : row.status === "CUSTOMER"
            ? "completed"
            : row.status === "INACTIVE"
            ? "danger"
            : "neutral";
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
              <Users className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-[#262421] tracking-tight">Clients Directory & 360°</h1>
          </div>
          <p className="text-xs text-[#77716A] mt-1 ml-10">
            Central repository of client contacts, corporate details, active projects, and financial ledger
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs py-1.5 h-8.5 bg-[#242321] text-[#FAF8F5] hover:bg-[#383633] border border-[#242321] font-bold shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Client
          </Button>
        </div>
      </div>

      {/* 2. TOP KPI METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Clients */}
        <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              TOTAL CLIENTS
            </span>
            <span className="text-lg font-bold text-[#262421] font-mono tabular-nums leading-tight block">
              {metrics?.totalClients || 0}
            </span>
          </div>
        </div>

        {/* Active Clients */}
        <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              ACTIVE CLIENTS
            </span>
            <span className="text-lg font-bold text-[#262421] font-mono tabular-nums leading-tight block">
              {metrics?.activeClients || 0}
            </span>
          </div>
        </div>

        {/* New This Month */}
        <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              NEW THIS MONTH
            </span>
            <span className="text-lg font-bold text-[#262421] font-mono tabular-nums leading-tight block">
              {metrics?.newThisMonth || 0}
            </span>
          </div>
        </div>

        {/* Active Projects */}
        <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              ACTIVE PROJECTS
            </span>
            <span className="text-lg font-bold text-[#262421] font-mono tabular-nums leading-tight block">
              {metrics?.clientsWithActiveProjects || 0}
            </span>
          </div>
        </div>

        {/* With Outstanding */}
        {canViewFinancials && (
          <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-[#F8E4D9] border border-[#EBCDBD] flex items-center justify-center text-[#A45435] shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
                WITH OUTSTANDING
              </span>
              <span className="text-lg font-bold text-[#A45435] font-mono tabular-nums leading-tight block">
                {metrics?.clientsWithOutstandingCount ?? "—"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. FILTER & SEARCH TOOLBAR */}
      <div className="p-2.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-[#77716A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by Client Name, Phone, Email, GSTIN, Company..."
            className="w-full h-8 pl-9 pr-8 text-xs bg-transparent border-none text-[#262421] placeholder-[#77716A] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <FilterSelect
            label="Status"
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val || "ALL");
              setPage(1);
            }}
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "CUSTOMER", label: "Customer" },
              { value: "PROSPECT", label: "Prospect" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
            variant="beige"
            size="sm"
          />

          <FilterSelect
            label="Type"
            placeholder="All Client Types"
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val || "ALL");
              setPage(1);
            }}
            options={[
              { value: "INDIVIDUAL", label: "Individual" },
              { value: "BUSINESS", label: "Business" },
              { value: "COMMERCIAL", label: "Commercial" },
              { value: "RESIDENTIAL", label: "Residential" },
            ]}
            variant="beige"
            size="sm"
          />

          <FilterSelect
            label="Projects"
            placeholder="All Projects"
            value={hasActiveProjFilter}
            onChange={(val) => {
              setHasActiveProjFilter(val || "ALL");
              setPage(1);
            }}
            options={[
              { value: "true", label: "Has Active Project" },
              { value: "false", label: "No Active Project" },
            ]}
            variant="beige"
            size="sm"
          />

          {canViewFinancials && (
            <FilterSelect
              label="Balance"
              placeholder="All Balances"
              value={hasOutstandingFilter}
              onChange={(val) => {
                setHasOutstandingFilter(val || "ALL");
                setPage(1);
              }}
              options={[
                { value: "true", label: "Has Outstanding Balance" },
                { value: "false", label: "Fully Settled" },
              ]}
              variant="beige"
              size="sm"
            />
          )}
        </div>
      </div>

      {/* 4. CLIENTS DATA TABLE */}
      <DataTable
        columns={columns as any}
        data={clients}
        keyExtractor={(row: any) => row.id}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        emptyText="No clients found matching your search or filters."
      />

      {/* 5. PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2 text-xs text-[#77716A]">
          <span>Page <strong className="text-[#262421] font-mono">{page}</strong> of <strong className="text-[#262421] font-mono">{totalPages}</strong></span>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs h-7.5 bg-[#FFFEFC] border-[#E8E2D8] text-[#262421] hover:bg-[#F3EEE5] shadow-2xs font-semibold"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs h-7.5 bg-[#FFFEFC] border-[#E8E2D8] text-[#262421] hover:bg-[#F3EEE5] shadow-2xs font-semibold"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* CREATE CLIENT MODAL */}
      <ClientFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchClients();
          fetchMetrics();
        }}
      />

      {/* CLIENT 360° WORKSPACE DRAWER */}
      <ClientWorkspace
        clientId={selectedClientId}
        isOpen={isWorkspaceOpen}
        onClose={() => {
          setIsWorkspaceOpen(false);
          setSelectedClientId(null);
        }}
        onUpdate={() => {
          fetchClients();
          fetchMetrics();
        }}
      />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#77716A]">Loading Clients Directory...</div>}>
      <ClientsContent />
    </Suspense>
  );
}

