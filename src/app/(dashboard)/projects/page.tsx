"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Sparkles,
  DollarSign,
  Filter,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PROJECT_STAGES, PROJECT_PRIORITIES, PROJECT_STATUSES } from "@/validators/project.schema";

function ProjectsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialStage = searchParams.get("stage") || "";
  const initialStatus = searchParams.get("status") || "";
  const initialPriority = searchParams.get("priority") || "";
  const initialHealth = searchParams.get("delayHealth") || searchParams.get("health") || "";

  const [projects, setProjects] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState(initialSearch);
  const [stageFilter, setStageFilter] = useState(initialStage);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [priorityFilter, setPriorityFilter] = useState(initialPriority);
  const [healthFilter, setHealthFilter] = useState(initialHealth);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const fetchProjects = async () => {
    setIsLoading(true);
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

      const res = await fetch(`/api/v1/projects?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
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
      const res = await fetch("/api/v1/projects/metrics");
      const json = await res.json();
      if (json.success) setMetrics(json.data);
    } catch {
      // quiet handling
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchMetrics();
  }, [page, stageFilter, statusFilter, priorityFilter, healthFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchProjects();
    }, 300);
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

  const columns = [
    {
      header: "Project ID",
      accessorKey: "referenceNo" as const,
      cell: (row: any) => (
        <span className="font-mono text-xs font-bold text-[#6F5642]">{row.referenceNo}</span>
      ),
    },
    {
      header: "Project Title",
      accessorKey: "title" as const,
      cell: (row: any) => (
        <div>
          <span className="font-semibold text-[#4A433D] block leading-tight">{row.title}</span>
          <span className="text-[10px] text-[#6F5642]">
            {row.client?.fullName || "—"} • {row.city || "Hyderabad"}
          </span>
        </div>
      ),
    },
    {
      header: "Execution Stage",
      accessorKey: "stage" as const,
      cell: (row: any) => {
        const stageStr = row.stage || "CONFIRMATION_FEE_PAID";
        return (
          <div className="flex flex-col">
            <Badge variant={stageStr === "PROJECT_COMPLETED" ? "completed" : "active"}>
              {stageStr.replace(/_/g, " ")}
            </Badge>
            <span className="text-[9px] text-[#6F5642] font-mono mt-0.5">{row.progressPct || 0}% complete</span>
          </div>
        );
      },
    },
    {
      header: "Priority",
      accessorKey: "priority" as const,
      cell: (row: any) => {
        const priority = row.priority || "MEDIUM";
        const variant =
          priority === "URGENT" || priority === "HIGH"
            ? "danger"
            : priority === "LOW"
            ? "neutral"
            : "pending";
        return <Badge variant={variant}>{priority}</Badge>;
      },
    },
    {
      header: "Schedule Health",
      accessorKey: "delayHealth" as const,
      cell: (row: any) => {
        const health = row.delayHealth || "ON_TRACK";
        const variant =
          health === "DELAYED"
            ? "danger"
            : health === "AT_RISK"
            ? "pending"
            : "completed";
        return (
          <div>
            <Badge variant={variant}>{health.replace(/_/g, " ")}</Badge>
            {row.daysDelayed > 0 && (
              <span className="text-[9px] text-rose-600 block font-mono">+{row.daysDelayed}d past target</span>
            )}
          </div>
        );
      },
    },
    {
      header: "Contract Value",
      accessorKey: "totalBudget" as const,
      isNumeric: true,
      cell: (row: any) => (
        <span className="font-mono tabular-nums font-bold text-[#4A433D] text-xs">
          {row.contractValue !== null && row.contractValue !== undefined
            ? formatCurrency(row.revisedBudget || row.contractValue)
            : "—"}
        </span>
      ),
    },
    {
      header: "Target Completion",
      accessorKey: "targetDate" as const,
      cell: (row: any) => (
        <span className="text-[11px] text-[#6F5642] font-mono">
          {row.targetCompletionDate || row.targetDate ? formatDate(row.targetCompletionDate || row.targetDate) : "TBD"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto select-none">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#6F5642]/20">
        <div>
          <h1 className="text-xl font-bold text-[#4A433D] tracking-tight">Project Operations</h1>
          <p className="text-xs text-[#6F5642] mt-0.5">
            Production 13-stage execution ledger, milestone controls & project workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            reportKey="project_status"
            label="Export Projects"
            size="sm"
          />
          <Link href="/projects/pipeline">
            <Button variant="outline" size="sm" leftIcon={<LayoutGrid className="w-3.5 h-3.5" />} className="border-[#6F5642]/30 text-[#4A433D]">
              Pipeline Board
            </Button>
          </Link>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />} className="bg-[#6F5642] hover:bg-[#4A433D] text-white">
            New Project
          </Button>
        </div>
      </div>

      {/* Top KPI Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="p-3.5 bg-white border border-[#6F5642]/20 rounded-xl shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F5642]">Total Projects</span>
            <div className="text-lg font-bold text-[#4A433D] font-mono tabular-nums mt-1">{metrics.totalProjects}</div>
          </div>

          <div className="p-3.5 bg-white border border-[#6F5642]/20 rounded-xl shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Active Executing</span>
            <div className="text-lg font-bold text-emerald-700 font-mono tabular-nums mt-1">{metrics.activeProjects}</div>
          </div>

          <div className="p-3.5 bg-white border border-[#6F5642]/20 rounded-xl shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Delayed / Overdue</span>
            <div className={`text-lg font-bold font-mono tabular-nums mt-1 ${metrics.delayedProjects > 0 ? "text-rose-600" : "text-[#4A433D]"}`}>
              {metrics.delayedProjects}
            </div>
          </div>

          <div className="p-3.5 bg-white border border-[#6F5642]/20 rounded-xl shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2B455]">QC In Progress</span>
            <div className="text-lg font-bold text-[#6F5642] font-mono tabular-nums mt-1">{metrics.qualityPendingProjects}</div>
          </div>

          <div className="p-3.5 bg-white border border-[#6F5642]/20 rounded-xl shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F5642]">In Warranty</span>
            <div className="text-lg font-bold text-[#4A433D] font-mono tabular-nums mt-1">{metrics.warrantyProjects}</div>
          </div>

          <div className="p-3.5 bg-white border border-[#6F5642]/20 rounded-xl shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F5642]">Total Contract Value</span>
            <div className="text-sm font-bold text-[#4A433D] font-mono tabular-nums mt-1 truncate">
              {metrics.totalContractValue !== null ? formatCurrency(metrics.totalContractValue) : "Restricted"}
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-3 bg-white border border-[#6F5642]/20 rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#6F5642] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Project ID, Title, Client, Location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-[#ECF4F0] border border-[#6F5642]/20 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F2B455] text-[#4A433D]"
            />
          </div>
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
            <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs border-[#6F5642]/30">
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Project Table */}
      <DataTable
        columns={columns}
        data={projects}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-2 text-xs text-[#6F5642]">
          <span className="font-mono">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs border-[#6F5642]/30"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs border-[#6F5642]/30"
            >
              Next
            </Button>
          </div>
        </div>
      )}

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
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#6F5642]">Loading Project Operations...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}
