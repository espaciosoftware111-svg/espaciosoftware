"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  RefreshCw,
  ShieldCheck,
  Activity,
  UserCheck,
  MapPin,
  ExternalLink,
  Eye,
  Clock,
  User,
  Layers,
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  Lock,
} from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import {
  AuditDetailViewer,
  getDisplayIp,
  getGoogleMapsUrl,
} from "@/components/audit/audit-detail-viewer";

const ENTITY_OPTIONS = [
  { value: "", label: "All Entity Types" },
  { value: "GLOBAL", label: "Global System Audits" },
  { value: "Lead", label: "Leads & Pipeline" },
  { value: "Project", label: "Projects & Milestones" },
  { value: "Client", label: "Clients" },
  { value: "Quotation", label: "Quotations" },
  { value: "Invoice", label: "Invoices (GST)" },
  { value: "Expense", label: "Expenses & Petty Cash" },
  { value: "Payment", label: "Client & Vendor Payments" },
  { value: "Vendor", label: "Vendors & Suppliers" },
  { value: "Employee", label: "Employees & Payroll" },
  { value: "Material", label: "Materials & Procurement" },
  { value: "Task", label: "Tasks" },
  { value: "User", label: "Users & Access" },
  { value: "Setting", label: "System Settings" },
];

const CATEGORY_OPTIONS = [
  { id: "ALL", label: "All Categories" },
  { id: "STAGE_CHANGES", label: "Pipeline Progressions" },
  { id: "SECURITY_AUTH", label: "Security & Skips" },
  { id: "VERIFICATIONS", label: "Audit Checks" },
  { id: "EXPENSES_FINANCE", label: "Finance & Accounts" },
];

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Record Manual/Global Audit Entry Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [newAction, setNewAction] = useState("AUDIT_COMPLIANCE_VERIFIED");
  const [customAction, setCustomAction] = useState("");
  const [newEntityType, setNewEntityType] = useState("GLOBAL");
  const [newEntityId, setNewEntityId] = useState("");
  const [newCategory, setNewCategory] = useState("VERIFICATIONS");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      if (entityTypeFilter) {
        params.set("entityType", entityTypeFilter);
      }
      if (categoryFilter !== "ALL") {
        params.set("category", categoryFilter);
      }

      // Date range presets
      const now = new Date();
      if (dateRangeFilter === "TODAY") {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        params.set("startDate", start.toISOString());
      } else if (dateRangeFilter === "WEEK") {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.set("startDate", start.toISOString());
      } else if (dateRangeFilter === "MONTH") {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.set("startDate", start.toISOString());
      }

      const res = await fetch(`/api/v1/audit-logs?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setAuditLogs(json.data);
        setTotalCount(json.meta?.total || json.data.length);
        setTotalPages(json.meta?.totalPages || 1);
      }
    } catch {
      // quiet handling
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, entityTypeFilter, categoryFilter, dateRangeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRecordAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotes.trim()) {
      setSubmitError("Auditor observation notes are required");
      return;
    }

    const actionToSubmit =
      newAction === "CUSTOM"
        ? customAction.trim().toUpperCase().replace(/\s+/g, "_") || "AUDIT_VERIFIED"
        : newAction;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/v1/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionToSubmit,
          entityType: newEntityType,
          entityId: newEntityId.trim() || "GLOBAL",
          category: newCategory,
          notes: newNotes.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to record audit entry");
      }

      setSubmitSuccess(true);
      setNewNotes("");
      setCustomAction("");
      setNewEntityId("");
      setTimeout(() => {
        setIsRecordModalOpen(false);
        setSubmitSuccess(false);
        fetchLogs();
      }, 700);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to record audit entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setEntityTypeFilter("");
    setCategoryFilter("ALL");
    setDateRangeFilter("ALL");
    setPage(1);
  };

  // KPI calculations from current view
  const securityCount = auditLogs.filter(
    (l) =>
      (l.action || "").includes("SKIP") ||
      (l.action || "").includes("PASSWORD") ||
      (l.action || "").includes("AUTH")
  ).length;

  const stageCount = auditLogs.filter(
    (l) => (l.action || "").includes("STAGE") || (l.action || "").includes("STATUS")
  ).length;

  const verificationCount = auditLogs.filter(
    (l) => (l.action || "").includes("AUDIT") || (l.action || "").includes("VERIF")
  ).length;

  const columns = [
    {
      header: "Timestamp",
      accessorKey: "createdAt" as const,
      cell: (row: any) => (
        <div>
          <span className="font-mono text-xs text-[#262421] block font-medium">
            {formatDate(row.createdAt)}
          </span>
          <span className="text-[10px] text-[#77716A] flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-[#77716A]/70" />
            {formatRelativeTime(row.createdAt)}
          </span>
        </div>
      ),
    },
    {
      header: "Actor / User",
      accessorKey: "user" as const,
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#89652D]/15 text-[#89652D] flex items-center justify-center font-bold text-xs shrink-0 border border-[#89652D]/30">
            {row.user?.fullName ? row.user.fullName.charAt(0).toUpperCase() : "S"}
          </div>
          <div>
            <span className="font-semibold text-xs text-[#262421] block leading-tight">
              {row.user?.fullName || "Super Admin System"}
            </span>
            <span className="text-[10px] text-[#77716A] font-mono block">
              {row.user?.email || "system@espacio.internal"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Action Code",
      accessorKey: "action" as const,
      cell: (row: any) => {
        const actionStr = (row.action || "").toUpperCase();
        let badgeStyle = "bg-[#F3EEE5] text-[#77716A] border-[#E8E2D8]";
        let icon = null;

        if (actionStr.includes("SKIP") || actionStr.includes("PASSWORD")) {
          badgeStyle = "bg-rose-50 text-rose-800 border-rose-200";
          icon = <Lock className="w-2.5 h-2.5 text-rose-600 mr-1" />;
        } else if (actionStr.includes("STAGE") || actionStr.includes("STATUS")) {
          badgeStyle = "bg-blue-50 text-blue-800 border-blue-200";
          icon = <ShieldCheck className="w-2.5 h-2.5 text-blue-600 mr-1" />;
        } else if (actionStr.includes("CREATE")) {
          badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
        } else if (actionStr.includes("AUDIT") || actionStr.includes("VERIF")) {
          badgeStyle = "bg-amber-100 text-amber-900 border-amber-300";
          icon = <Shield className="w-2.5 h-2.5 text-amber-700 mr-1" />;
        } else if (actionStr.includes("DELETE")) {
          badgeStyle = "bg-red-50 text-red-800 border-red-200";
        }

        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeStyle}`}
          >
            {icon}
            {row.action}
          </span>
        );
      },
    },
    {
      header: "Target Entity",
      accessorKey: "entityType" as const,
      cell: (row: any) => (
        <div>
          <span className="font-mono text-xs text-[#262421] font-bold block">
            {row.entityType}
          </span>
          <span
            className="text-[10px] text-[#77716A] font-mono block truncate max-w-[140px]"
            title={row.entityId || "N/A"}
          >
            {row.entityId ? row.entityId.substring(0, 12) + (row.entityId.length > 12 ? "..." : "") : "Global"}
          </span>
        </div>
      ),
    },
    {
      header: "IP Location",
      accessorKey: "ipAddress" as const,
      cell: (row: any) => {
        const ip = getDisplayIp(row.ipAddress);
        return (
          <a
            href={getGoogleMapsUrl(row.ipAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F3EEE5]/80 hover:bg-[#89652D]/15 text-[#262421] hover:text-[#89652D] border border-[#E8E2D8] hover:border-[#89652D]/40 transition-all font-mono text-[11px] group cursor-pointer"
            title={`View IP ${ip} on Google Maps`}
          >
            <MapPin className="w-3 h-3 text-[#89652D] group-hover:scale-110 transition-transform" />
            <span>{ip}</span>
            <ExternalLink className="w-2.5 h-2.5 text-[#77716A] group-hover:text-[#262421]" />
          </a>
        );
      },
    },
    {
      header: "Details",
      accessorKey: "id" as const,
      cell: (row: any) => (
        <button
          type="button"
          onClick={() => setSelectedLog(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#89652D] hover:text-[#262421] bg-[#F3EEE5]/60 hover:bg-[#F3EEE5] border border-[#E8E2D8] rounded-md transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Details</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#89652D]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#262421] tracking-tight">System Audit Log</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#89652D]/15 text-[#262421] border border-[#89652D]/30 rounded-full">
                  {totalCount} Immutable Records
                </span>
              </div>
              <p className="text-xs text-[#77716A]">
                Immutable, tamper-evident system event ledger capturing authentication, pipeline transitions, and operational records
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setSubmitError("");
              setSubmitSuccess(false);
              setIsRecordModalOpen(true);
            }}
            className="text-xs py-1.5 h-8 gap-1.5 bg-[#89652D] hover:bg-[#725324] text-white shadow-2xs cursor-pointer font-semibold"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Record Audit Entry
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchLogs}
            disabled={isLoading}
            className="text-xs py-1.5 h-8 gap-1 border-[#E8E2D8] text-[#262421] hover:bg-[#F3EEE5]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#89652D]" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs">
          <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block">
            Total Audit Records
          </span>
          <div className="text-xl font-bold text-[#262421] font-mono mt-1 tabular-nums">
            {totalCount}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> System Synchronized
          </span>
        </div>

        <div className="p-4 bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs">
          <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block">
            Pipeline Progressions
          </span>
          <div className="text-xl font-bold text-blue-700 font-mono mt-1 tabular-nums">
            {stageCount}
          </div>
          <span className="text-[10px] text-[#77716A] mt-0.5 block">State &amp; stage updates</span>
        </div>

        <div className="p-4 bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs">
          <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block">
            Security Authorizations
          </span>
          <div className="text-xl font-bold text-rose-700 font-mono mt-1 tabular-nums">
            {securityCount}
          </div>
          <span className="text-[10px] text-[#77716A] mt-0.5 block">Password validated skips</span>
        </div>

        <div className="p-4 bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs">
          <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block">
            Verified Audits
          </span>
          <div className="text-xl font-bold text-amber-800 font-mono mt-1 tabular-nums">
            {verificationCount}
          </div>
          <span className="text-[10px] text-[#77716A] mt-0.5 block">Official audit checks</span>
        </div>
      </div>

      {/* 3. Search & Multi-Filter Control Bar */}
      <div className="bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Free Text Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#77716A]" />
            <input
              type="text"
              placeholder="Search by action, entity ID, actor name, email, or audit notes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F3EEE5]/40 border border-[#E8E2D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#89652D]"
            />
          </div>

          {/* Entity Type Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-[#F3EEE5]/40 border border-[#E8E2D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#89652D] font-medium text-[#262421]"
            >
              {ENTITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Dropdown */}
          <div className="w-full md:w-44">
            <select
              value={dateRangeFilter}
              onChange={(e) => {
                setDateRangeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-[#F3EEE5]/40 border border-[#E8E2D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#89652D] font-medium text-[#262421]"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today Only</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
            </select>
          </div>

          {(searchQuery || entityTypeFilter || categoryFilter !== "ALL" || dateRangeFilter !== "ALL") && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-[#77716A] hover:text-[#262421] px-2.5 py-1.5 bg-[#F3EEE5] rounded-lg border border-[#E8E2D8] whitespace-nowrap cursor-pointer transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E8E2D8]/60">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategoryFilter(cat.id);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? "bg-[#89652D] text-white shadow-2xs font-bold"
                  : "bg-[#F3EEE5]/70 text-[#77716A] hover:bg-[#F3EEE5] hover:text-[#262421]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Data Table */}
      <div className="bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs overflow-hidden">
        <DataTable
          columns={columns}
          data={auditLogs}
          keyExtractor={(r) => r.id}
          emptyText={
            isLoading
              ? "Loading system audit logs..."
              : "No audit logs found matching the selected filters."
          }
        />

        {/* 5. Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-[#E8E2D8] bg-[#FDFCF9] text-xs text-[#77716A]">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="py-1 px-2 text-xs bg-white border border-[#E8E2D8] rounded font-medium text-[#262421] focus:ring-1 focus:ring-[#89652D]"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="ml-2 font-mono tabular-nums">
              Showing {totalCount > 0 ? (page - 1) * limit + 1 : 0} to{" "}
              {Math.min(page * limit, totalCount)} of {totalCount} records
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span>
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <div className="flex items-center gap-1 ml-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 w-7 p-0 border-[#E8E2D8]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 w-7 p-0 border-[#E8E2D8]"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Audit Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Audit Record: ${selectedLog.action}` : "Audit Record"}
        maxWidth="2xl"
      >
        {selectedLog && (
          <div className="space-y-4">
            {/* Metadata Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Actor</span>
                <span className="font-semibold text-stone-900 block truncate">
                  {selectedLog.user?.fullName || "System Admin"}
                </span>
                <span className="text-[10px] text-stone-500 block font-mono truncate">
                  {selectedLog.user?.email || "system@espacio.internal"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Target Record</span>
                <span className="font-semibold text-stone-900 block">{selectedLog.entityType}</span>
                <span className="text-[10px] text-stone-500 block font-mono truncate">
                  {selectedLog.entityId || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">IP Location</span>
                <a
                  href={getGoogleMapsUrl(selectedLog.ipAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white hover:bg-[#89652D]/15 text-stone-800 border border-stone-200 mt-0.5 font-mono text-[11px] group cursor-pointer"
                  title="Open IP on Google Maps"
                >
                  <MapPin className="w-3 h-3 text-[#89652D] group-hover:scale-110 transition-transform" />
                  <span>{getDisplayIp(selectedLog.ipAddress)}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-stone-400 group-hover:text-stone-700" />
                </a>
              </div>
            </div>

            {/* Human Understandable Change Viewer */}
            <AuditDetailViewer
              oldValues={
                selectedLog.parsedOldValues ||
                (selectedLog.oldValues ? JSON.parse(selectedLog.oldValues) : null)
              }
              newValues={
                selectedLog.parsedNewValues ||
                (selectedLog.newValues ? JSON.parse(selectedLog.newValues) : null)
              }
              ipAddress={selectedLog.ipAddress}
              action={selectedLog.action}
            />
          </div>
        )}
      </Modal>

      {/* 7. Record Audit Entry Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsRecordModalOpen(false);
            setSubmitError("");
          }
        }}
        title="Record Audit Verification"
        maxWidth="lg"
      >
        <form onSubmit={handleRecordAudit} className="space-y-4 text-xs">
          <p className="text-[#77716A] text-[11px] leading-relaxed">
            Record an official auditor verification entry directly to the system audit ledger. This record is immutable and cryptographically bound to your user account and IP address.
          </p>

          {submitSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Audit entry verified and logged successfully!</span>
            </div>
          )}

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg font-medium">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#262421] uppercase tracking-wider mb-1">
                Target Scope / Entity Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={newEntityType}
                onChange={(e) => setNewEntityType(e.target.value)}
                className="w-full py-2 px-2.5 text-xs bg-white border border-[#E8E2D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#89652D] font-medium text-[#262421]"
              >
                <option value="GLOBAL">GLOBAL (System / Org Wide)</option>
                <option value="Lead">Lead &amp; Pipeline</option>
                <option value="Project">Project &amp; Milestones</option>
                <option value="Client">Client Record</option>
                <option value="Quotation">Quotation</option>
                <option value="Invoice">Invoice (GST)</option>
                <option value="Expense">Expense &amp; Petty Cash</option>
                <option value="Payment">Payment</option>
                <option value="Vendor">Vendor &amp; Supplier</option>
                <option value="Employee">Employee &amp; HR</option>
                <option value="Material">Material &amp; Procurement</option>
                <option value="Inventory">Inventory &amp; Stores</option>
                <option value="Setting">Settings &amp; Security</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#262421] uppercase tracking-wider mb-1">
                Target Entity / Reference ID
              </label>
              <input
                type="text"
                placeholder={newEntityType === "GLOBAL" ? "GLOBAL" : "e.g. PRJ-2026-001 or ID"}
                value={newEntityId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntityId(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white border border-[#E8E2D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#89652D] text-[#262421]"
              />
              <span className="text-[10px] text-[#77716A] mt-0.5 block">
                {newEntityType === "GLOBAL" ? "Optional: Defaults to GLOBAL" : "Reference No or ID"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#262421] uppercase tracking-wider mb-1">
                Audit Action / Event <span className="text-rose-500">*</span>
              </label>
              <select
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                className="w-full py-2 px-2.5 text-xs bg-white border border-[#E8E2D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#89652D] font-medium text-[#262421]"
              >
                <option value="AUDIT_COMPLIANCE_VERIFIED">AUDIT_COMPLIANCE_VERIFIED</option>
                <option value="AUDIT_FINANCIAL_RECONCILIATION">AUDIT_FINANCIAL_RECONCILIATION</option>
                <option value="AUDIT_STOCK_VERIFICATION">AUDIT_STOCK_VERIFICATION</option>
                <option value="AUDIT_PIPELINE_REVIEW">AUDIT_PIPELINE_REVIEW</option>
                <option value="AUDIT_SECURITY_REVIEW">AUDIT_SECURITY_REVIEW</option>
                <option value="AUDIT_QUALITY_INSPECTION">AUDIT_QUALITY_INSPECTION</option>
                <option value="AUDIT_POLICY_CHECK">AUDIT_POLICY_CHECK</option>
                <option value="CUSTOM">Custom Action Code...</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#262421] uppercase tracking-wider mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full py-2 px-2.5 text-xs bg-white border border-[#E8E2D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#89652D] font-medium text-[#262421]"
              >
                <option value="VERIFICATIONS">Audit Checks &amp; Verifications</option>
                <option value="EXPENSES_FINANCE">Finance &amp; Accounts</option>
                <option value="STAGE_CHANGES">Pipeline &amp; Progressions</option>
                <option value="SECURITY_AUTH">Security &amp; Authorization</option>
              </select>
            </div>
          </div>

          {newAction === "CUSTOM" && (
            <div>
              <label className="block text-[11px] font-bold text-[#262421] uppercase tracking-wider mb-1">
                Custom Action Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. AUDIT_DISCREPANCY_FLAGGED"
                value={customAction}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomAction(e.target.value)}
                className="w-full h-9 px-3 text-xs font-mono uppercase bg-white border border-[#E8E2D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#89652D] text-[#262421]"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#262421] uppercase tracking-wider mb-1">
              Auditor Observation &amp; Findings <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="State the audit scope, verified records, compliance status, and any findings or recommendations..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              required
              className="w-full p-2.5 text-xs bg-white border border-[#E8E2D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#89652D] text-[#262421]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E2D8]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsRecordModalOpen(false)}
              className="border-[#E8E2D8] text-[#262421]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !newNotes.trim()}
              className="bg-[#89652D] hover:bg-[#725324] text-white font-semibold gap-1.5 shadow-2xs cursor-pointer"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isSubmitting ? "animate-spin" : ""}`} />
              {isSubmitting ? "Recording Audit..." : "Record Official Audit"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
