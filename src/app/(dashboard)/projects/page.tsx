"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { LeadWorkspace } from "@/components/leads/lead-workspace";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { ExportButton } from "@/components/reports/export-button";
import { FilterSelect } from "@/components/ui/filter-select";
import {
  Search,
  LayoutGrid,
  Plus,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Clock,
  Eye,
  Edit2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  X,
  IndianRupee,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PROJECT_STAGES, PROJECT_PRIORITIES, PROJECT_STATUSES } from "@/validators/project.schema";

import { clientCache } from "@/lib/client-cache";

function ProjectsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialStage = searchParams.get("stage") || "";
  const initialStatus = searchParams.get("status") || "";
  const initialPriority = searchParams.get("priority") || "";
  const initialHealth = searchParams.get("delayHealth") || searchParams.get("health") || "";

  // Filters & Search
  const [search, setSearch] = useState(initialSearch);
  const [stageFilter, setStageFilter] = useState(initialStage);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [priorityFilter, setPriorityFilter] = useState(initialPriority);
  const [healthFilter, setHealthFilter] = useState(initialHealth);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const projectsCacheKey = `/api/v1/projects?page=${page}&limit=20${search ? `&search=${search}` : ""}${stageFilter ? `&stage=${stageFilter}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}${priorityFilter ? `&priority=${priorityFilter}` : ""}${healthFilter ? `&delayHealth=${healthFilter}` : ""}`;
  const initialProjectsCached = clientCache.getImmediate<any>(projectsCacheKey);
  const initialMetricsCached = clientCache.getImmediate<any>("/api/v1/projects/metrics");

  const [projects, setProjects] = useState<any[]>(() => initialProjectsCached?.data || []);
  const [metrics, setMetrics] = useState<any>(() => initialMetricsCached?.data || null);
  const [isLoading, setIsLoading] = useState(!initialProjectsCached);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const isMountedRef = useRef(false);

  // Modals & Drawers
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isLeadWorkspaceOpen, setIsLeadWorkspaceOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Synchronize active filters & pagination to URL without page reloads
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (search) url.searchParams.set("search", search);
    else url.searchParams.delete("search");
    if (stageFilter) url.searchParams.set("stage", stageFilter);
    else url.searchParams.delete("stage");
    if (statusFilter) url.searchParams.set("status", statusFilter);
    else url.searchParams.delete("status");
    if (priorityFilter) url.searchParams.set("priority", priorityFilter);
    else url.searchParams.delete("priority");
    if (healthFilter) url.searchParams.set("delayHealth", healthFilter);
    else url.searchParams.delete("delayHealth");
    if (page > 1) url.searchParams.set("page", String(page));
    else url.searchParams.delete("page");

    window.history.replaceState(null, "", url.toString());
  }, [search, stageFilter, statusFilter, priorityFilter, healthFilter, page]);

  // Deep-linking from query parameters
  useEffect(() => {
    const id = searchParams.get("id");
    const leadId = searchParams.get("leadId");
    const action = searchParams.get("action");

    if (id) {
      setSelectedProjectId(id);
      setIsWorkspaceOpen(true);
    }
    if (leadId) {
      setSelectedLeadId(leadId);
      setIsLeadWorkspaceOpen(true);
    }
    if (action === "create") {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const fetchProjects = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(search ? { search } : {}),
        ...(stageFilter ? { stage: stageFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(priorityFilter ? { priority: priorityFilter } : {}),
        ...(healthFilter ? { delayHealth: healthFilter } : {}),
      });

      const url = `/api/v1/projects?${queryParams.toString()}`;
      const json = await clientCache.fetchWithCache<any>(url, {
        onBackgroundUpdate: (data) => {
          if (data?.success) {
            setProjects(data.data);
            if (data.meta) setTotalPages(data.meta.totalPages);
          }
        },
      });

      if (json?.success) {
        setProjects(json.data);
        if (json.meta) setTotalPages(json.meta.totalPages);
      }
    } catch {
      // quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const json = await clientCache.fetchWithCache<any>("/api/v1/projects/metrics", {
        onBackgroundUpdate: (data) => {
          if (data?.success) setMetrics(data.data);
        },
      });
      if (json?.success) setMetrics(json.data);
    } catch {
      // quiet handling
    }
  };

  useEffect(() => {
    fetchMetrics();
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      fetchProjects(!!initialProjectsCached);
      return;
    }
    fetchProjects(false);
  }, [page, stageFilter, statusFilter, priorityFilter, healthFilter]);

  useEffect(() => {
    if (!isMountedRef.current) return;
    const timer = setTimeout(() => {
      setPage(1);
      fetchProjects(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRowClick = (proj: any) => {
    setSelectedProjectId(proj.id);
    setIsWorkspaceOpen(true);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("id", proj.id);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStageFilter("");
    setStatusFilter("");
    setPriorityFilter("");
    setHealthFilter("");
    setPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedProjectIds.length === projects.length && projects.length > 0) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(projects.map((p) => p.id));
    }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const totalProjectsCount = metrics?.totalProjects ?? projects.length;
  const startItemIndex = projects.length > 0 ? (page - 1) * 20 + 1 : 0;
  const endItemIndex = projects.length > 0 ? (page - 1) * 20 + projects.length : 0;

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          checked={projects.length > 0 && selectedProjectIds.length === projects.length}
          onChange={toggleSelectAll}
          aria-label="Select all projects"
          className="rounded-sm border-[#E8E2D8] text-[#9B7950] focus:ring-[#9B7950] cursor-pointer"
        />
      ),
      accessorKey: "selection" as const,
      cell: (row: any) => (
        <input
          type="checkbox"
          checked={selectedProjectIds.includes(row.id)}
          onClick={(e) => toggleSelectRow(row.id, e)}
          onChange={() => {}}
          aria-label={`Select project ${row.referenceNo}`}
          className="rounded-sm border-[#E8E2D8] text-[#9B7950] focus:ring-[#9B7950] cursor-pointer"
        />
      ),
    },
    {
      header: "PROJECT ID",
      accessorKey: "referenceNo" as const,
      cell: (row: any) => (
        <span className="font-mono text-xs font-semibold text-[#262421]">
          {row.referenceNo}
        </span>
      ),
    },
    {
      header: "PROJECT TITLE",
      accessorKey: "title" as const,
      cell: (row: any) => (
        <div className="min-w-[180px]">
          <span className="font-semibold text-[#262421] text-xs block leading-tight hover:text-[#9B7950] transition-colors">
            {row.title}
          </span>
          <span className="text-[10px] text-[#77716A] block mt-0.5">
            {row.client?.fullName || "Client"} • {row.city || row.location || "Hyderabad"}
          </span>
        </div>
      ),
    },
    {
      header: "CLIENT",
      accessorKey: "client" as const,
      cell: (row: any) => (
        <div className="min-w-[130px]">
          <span className="font-medium text-[#262421] text-xs block">
            {row.client?.fullName || row.lead?.clientName || "—"}
          </span>
          {(row.client?.phone || row.lead?.phone) && (
            <span className="text-[10px] font-mono text-[#77716A] block mt-0.5">
              {row.client?.phone || row.lead?.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "EXECUTION STAGE",
      accessorKey: "stage" as const,
      cell: (row: any) => {
        const stageStr = row.stage || "CONFIRMATION_FEE_PAID";
        const isCompleted = stageStr === "PROJECT_COMPLETED" || stageStr === "DELIVERED";
        return (
          <div className="flex flex-col gap-0.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide border uppercase select-none w-fit ${
                isCompleted
                  ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
                  : "bg-[#F8EBD5] text-[#89652D] border-[#EAD6B2]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? "bg-[#166534]" : "bg-[#89652D]"}`} />
              {stageStr.replace(/_/g, " ")}
            </span>
            <span className="text-[9px] text-[#77716A] font-mono pl-0.5">
              {row.progressPct || 0}% complete
            </span>
          </div>
        );
      },
    },
    {
      header: "PRIORITY",
      accessorKey: "priority" as const,
      cell: (row: any) => (
        <PriorityBadge priority={row.priority} size="sm" />
      ),
    },
    {
      header: "SCHEDULE HEALTH",
      accessorKey: "delayHealth" as const,
      cell: (row: any) => {
        const health = row.delayHealth || "ON_TRACK";
        const isDelayed = health === "DELAYED";
        const isRisk = health === "AT_RISK";
        return (
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide border select-none ${
                isDelayed
                  ? "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]"
                  : isRisk
                  ? "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]"
                  : "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDelayed ? "bg-[#DC2626]" : isRisk ? "bg-[#D97706]" : "bg-[#16A34A]"
                }`}
              />
              {health === "ON_TRACK" ? "On Time" : health.replace(/_/g, " ")}
            </span>
            {row.daysDelayed > 0 && (
              <span className="text-[9px] text-rose-600 block font-mono pl-0.5 mt-0.5">
                +{row.daysDelayed}d past target
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "CONTRACT VALUE",
      accessorKey: "totalBudget" as const,
      isNumeric: true,
      cell: (row: any) => (
        <span className="font-mono tabular-nums font-semibold text-[#262421] text-xs">
          {row.contractValue !== null && row.contractValue !== undefined
            ? formatCurrency(row.revisedBudget || row.contractValue)
            : "—"}
        </span>
      ),
    },
    {
      header: "TARGET COMPLETION",
      accessorKey: "targetDate" as const,
      cell: (row: any) => (
        <span className="text-[11px] text-[#77716A] font-mono">
          {row.targetCompletionDate || row.targetDate
            ? formatDate(row.targetCompletionDate || row.targetDate)
            : "TBD"}
        </span>
      ),
    },
    {
      header: "ACTIONS",
      accessorKey: "actions" as const,
      cell: (row: any) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleRowClick(row)}
            className="p-1 rounded text-[#77716A] hover:text-[#262421] hover:bg-[#F3EEE5] transition cursor-pointer"
            title="Open Project Workspace"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedProjectId(row.id);
              setIsWorkspaceOpen(true);
            }}
            className="p-1 rounded text-[#77716A] hover:text-[#262421] hover:bg-[#F3EEE5] transition cursor-pointer"
            title="Edit Project"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleRowClick(row)}
            className="p-1 rounded text-[#77716A] hover:text-[#262421] hover:bg-[#F3EEE5] transition cursor-pointer"
            title="More Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto select-none">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#262421] tracking-tight">
              Project Operations
            </h1>
            <p className="text-xs text-[#77716A] mt-0.5">
              Production 13-stage execution ledger, milestone controls &amp; project workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ExportButton
            reportKey="project_status"
            label="Export Projects"
            size="xs"
          />
          <Link href="/projects/pipeline">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E8E2D8] text-[#262421] bg-[#FFFEFC] hover:bg-[#F5F2EC] hover:border-[#DCD5C9] transition cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#77716A]" />
              <span>Pipeline Board</span>
            </button>
          </Link>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#9B7950] hover:bg-[#886943] text-white shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* 2. TOP KPI METRICS CARDS (6 CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Projects */}
        <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              TOTAL PROJECTS
            </span>
            <span className="text-base font-bold text-[#262421] font-mono tabular-nums leading-tight block">
              {metrics?.totalProjects ?? 0}
            </span>
            <span className="text-[9px] text-[#77716A] block truncate mt-0.5">
              All interior projects created
            </span>
          </div>
        </div>

        {/* Active Executing */}
        <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              ACTIVE EXECUTING
            </span>
            <span className="text-base font-bold text-[#262421] font-mono tabular-nums leading-tight block">
              {metrics?.activeProjects ?? 0}
            </span>
            <span className="text-[9px] text-[#77716A] block truncate mt-0.5">
              Currently in execution
            </span>
          </div>
        </div>

        {/* Delayed / Overdue */}
        <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              DELAYED / OVERDUE
            </span>
            <span
              className={`text-base font-bold font-mono tabular-nums leading-tight block ${
                metrics?.delayedProjects > 0 ? "text-rose-600" : "text-[#262421]"
              }`}
            >
              {metrics?.delayedProjects ?? 0}
            </span>
            <span className="text-[9px] text-[#77716A] block truncate mt-0.5">
              Past scheduled timeline
            </span>
          </div>
        </div>

        {/* QC In Progress */}
        <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              QC IN PROGRESS
            </span>
            <span className="text-base font-bold text-[#262421] font-mono tabular-nums leading-tight block">
              {metrics?.qualityPendingProjects ?? 0}
            </span>
            <span className="text-[9px] text-[#77716A] block truncate mt-0.5">
              Under quality inspection
            </span>
          </div>
        </div>

        {/* In Warranty */}
        <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              IN WARRANTY
            </span>
            <span className="text-base font-bold text-[#262421] font-mono tabular-nums leading-tight block">
              {metrics?.warrantyProjects ?? 0}
            </span>
            <span className="text-[9px] text-[#77716A] block truncate mt-0.5">
              Under warranty period
            </span>
          </div>
        </div>

        {/* Total Contract Value */}
        <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              TOTAL VALUE
            </span>
            <span className="text-xs font-bold text-[#262421] font-mono tabular-nums leading-tight block truncate">
              {metrics?.totalContractValue !== null && metrics?.totalContractValue !== undefined
                ? formatCurrency(metrics.totalContractValue)
                : "—"}
            </span>
            <span className="text-[9px] text-[#77716A] block truncate mt-0.5">
              Total value of all projects
            </span>
          </div>
        </div>
      </div>

      {/* 3. FILTER TOOLBAR */}
      <div className="p-2.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-[#77716A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Project ID, Title, Client, Location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-9 pr-8 text-xs bg-transparent border-none text-[#262421] placeholder-[#77716A] focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#77716A] hover:text-[#262421]"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <FilterSelect
            label="Execution Stage"
            placeholder="All Execution Stages"
            value={stageFilter}
            onChange={(val) => {
              setStageFilter(val);
              setPage(1);
            }}
            options={PROJECT_STAGES.map((st) => ({
              value: st,
              label: st.replace(/_/g, " "),
            }))}
            variant="beige"
            size="sm"
          />

          <FilterSelect
            label="Status"
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={PROJECT_STATUSES.map((s) => ({
              value: s,
              label: s,
            }))}
            variant="beige"
            size="sm"
          />

          <FilterSelect
            label="Priority"
            placeholder="All Priorities"
            value={priorityFilter}
            onChange={(val) => {
              setPriorityFilter(val);
              setPage(1);
            }}
            options={PROJECT_PRIORITIES.map((p) => ({
              value: p,
              label: p,
            }))}
            variant="beige"
            size="sm"
          />

          <FilterSelect
            label="Health"
            placeholder="All Health States"
            value={healthFilter}
            onChange={(val) => {
              setHealthFilter(val);
              setPage(1);
            }}
            options={[
              { value: "ON_TRACK", label: "On Track" },
              { value: "AT_RISK", label: "At Risk" },
              { value: "DELAYED", label: "Delayed" },
            ]}
            variant="beige"
            size="sm"
          />

          {(search || stageFilter || statusFilter || priorityFilter || healthFilter) && (
            <button
              onClick={resetFilters}
              className="px-2.5 py-1.5 text-xs text-[#77716A] hover:text-[#262421] bg-white border border-[#E8E2D8] rounded-md transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 4. PROJECTS DATA TABLE */}
      <DataTable
        columns={columns}
        data={projects}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />

      {/* 5. PAGINATION & RECORD STATS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-2 text-xs text-[#77716A]">
        <div>
          Showing {startItemIndex} to {endItemIndex} of {totalProjectsCount} projects
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-md border border-[#E8E2D8] bg-[#FFFEFC] hover:bg-[#F5F2EC] disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-[#262421]" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;

                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-[#77716A]">…</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`min-w-7 h-7 px-2 text-xs font-semibold rounded-md border transition ${
                        page === p
                          ? "bg-[#9B7950] text-white border-[#9B7950]"
                          : "bg-[#FFFEFC] border-[#E8E2D8] text-[#262421] hover:bg-[#F5F2EC]"
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-md border border-[#E8E2D8] bg-[#FFFEFC] hover:bg-[#F5F2EC] disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5 text-[#262421]" />
            </button>
          </div>
        )}
      </div>

      {/* Project Workspace Drawer */}
      <ProjectWorkspace
        projectId={selectedProjectId}
        isOpen={isWorkspaceOpen}
        onClose={() => {
          setIsWorkspaceOpen(false);
          setSelectedProjectId(null);
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("id");
            window.history.replaceState(null, "", url.toString());
          }
        }}
        onUpdate={() => {
          fetchProjects();
          fetchMetrics();
        }}
        onOpenLead={(leadId) => {
          setSelectedLeadId(leadId);
          setIsLeadWorkspaceOpen(true);
          setIsWorkspaceOpen(false);
        }}
      />

      {/* Lead Workspace Drawer for Bidirectional Navigation */}
      <LeadWorkspace
        leadId={selectedLeadId}
        isOpen={isLeadWorkspaceOpen}
        onClose={() => {
          setIsLeadWorkspaceOpen(false);
          setSelectedLeadId(null);
        }}
        onUpdate={() => {
          fetchProjects();
          fetchMetrics();
        }}
        onOpenProject={(projId) => {
          setSelectedProjectId(projId);
          setIsWorkspaceOpen(true);
          setIsLeadWorkspaceOpen(false);
        }}
      />

      {/* Create Project Modal */}
      <ProjectFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchProjects();
          fetchMetrics();
        }}
      />
    </div>
  );
}

export default function ProjectsDatabasePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#77716A]">Loading Project Operations...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}
