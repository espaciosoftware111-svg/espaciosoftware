"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LeadFormModal } from "@/components/leads/lead-form-modal";
import { WebsiteEnquiryModal } from "@/components/leads/website-enquiry-modal";
import { LeadWorkspace } from "@/components/leads/lead-workspace";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { FilterSelect } from "@/components/ui/filter-select";
import { ExportButton } from "@/components/reports/export-button";
import {
  Plus,
  Search,
  LayoutGrid,
  Users,
  TrendingUp,
  Clock,
  Compass,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Percent,
  Globe,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

function LeadsContent() {
  const [leads, setLeads] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Config states
  const [pipelineStages, setPipelineStages] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Search Params & Context Preservation
  const searchParams = useSearchParams();

  // Filter & Search states (initialized from searchParams to preserve context)
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") || "");
  const [sourceFilter, setSourceFilter] = useState(() => searchParams.get("source") || "");
  const [priorityFilter, setPriorityFilter] = useState(() => searchParams.get("priority") || "");
  const [assignedFilter, setAssignedFilter] = useState(() => searchParams.get("assignedToId") || "");
  const [page, setPage] = useState(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [totalPages, setTotalPages] = useState(1);

  // ROI Modal state
  const [isRoiModalOpen, setIsRoiModalOpen] = useState(false);
  const [roiData, setRoiData] = useState<any>(null);
  const [isRoiLoading, setIsRoiLoading] = useState(false);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isProjectWorkspaceOpen, setIsProjectWorkspaceOpen] = useState(false);

  // Synchronize active filters & pagination to URL without page reloads
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (search) url.searchParams.set("search", search);
    else url.searchParams.delete("search");
    if (statusFilter) url.searchParams.set("status", statusFilter);
    else url.searchParams.delete("status");
    if (sourceFilter) url.searchParams.set("source", sourceFilter);
    else url.searchParams.delete("source");
    if (priorityFilter) url.searchParams.set("priority", priorityFilter);
    else url.searchParams.delete("priority");
    if (assignedFilter) url.searchParams.set("assignedToId", assignedFilter);
    else url.searchParams.delete("assignedToId");
    if (page > 1) url.searchParams.set("page", String(page));
    else url.searchParams.delete("page");

    window.history.replaceState(null, "", url.toString());
  }, [search, statusFilter, sourceFilter, priorityFilter, assignedFilter, page]);

  // Deep-linking from query parameters
  useEffect(() => {
    const id = searchParams.get("id");
    const projId = searchParams.get("projectId");
    const action = searchParams.get("action");

    if (id) {
      setSelectedLeadId(id);
      setIsWorkspaceOpen(true);
    }
    if (projId) {
      setSelectedProjectId(projId);
      setIsProjectWorkspaceOpen(true);
    }
    if (action === "create") {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  const fetchCrmConfig = async () => {
    try {
      const res = await fetch("/api/v1/config/crm");
      const json = await res.json();
      if (json.success) {
        setPipelineStages(json.data.pipelineStages || []);
        setLeadSources(json.data.leadSources || []);
        setUsers(json.data.users || []);
      }
    } catch {
      // quiet handling
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/v1/leads/metrics");
      const json = await res.json();
      if (json.success) {
        setMetrics(json.data);
      }
    } catch {
      // quiet handling
    }
  };

  const fetchRoi = async () => {
    setIsRoiLoading(true);
    try {
      const res = await fetch("/api/v1/leads/roi");
      const json = await res.json();
      if (json.success) {
        setRoiData(json.data);
      }
    } catch {
      // quiet handling
    } finally {
      setIsRoiLoading(false);
    }
  };

  const openRoiModal = () => {
    setIsRoiModalOpen(true);
    fetchRoi();
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(sourceFilter ? { source: sourceFilter } : {}),
        ...(priorityFilter ? { priority: priorityFilter } : {}),
        ...(assignedFilter ? { assignedToId: assignedFilter } : {}),
      });

      const res = await fetch(`/api/v1/leads?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLeads(json.data);
        if (json.meta) setTotalPages(json.meta.totalPages);
      }
    } catch {
      // quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCrmConfig();
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter, sourceFilter, priorityFilter, assignedFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLeads();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRowClick = (lead: any) => {
    setSelectedLeadId(lead.id);
    setIsWorkspaceOpen(true);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("id", lead.id);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const getSourceBadgeClass = (source?: string) => {
    const s = (source || "WEBSITE").toUpperCase();
    if (s.includes("WEBSITE")) return "bg-emerald-50 text-emerald-800 border-emerald-200";
    if (s.includes("INSTAGRAM")) return "bg-pink-50 text-pink-800 border-pink-200";
    if (s.includes("WHATSAPP")) return "bg-teal-50 text-teal-800 border-teal-200";
    if (s.includes("REFERRAL")) return "bg-purple-50 text-purple-800 border-purple-200";
    if (s.includes("WALK") || s.includes("VISIT")) return "bg-blue-50 text-blue-800 border-blue-200";
    if (s.includes("PHONE") || s.includes("CALL")) return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-stone-50 text-stone-800 border-stone-200";
  };

  const getStageBadgeClass = (stage?: string) => {
    switch (stage) {
      case "NEW":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "CONTACTED":
        return "bg-teal-50 text-teal-800 border-teal-200";
      case "NOT_CONTACTED":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "FOLLOW_UP_SCHEDULED":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "SITE_VISIT_SCHEDULED":
      case "SITE_VISIT_COMPLETED":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "QUOTATION_IN_PROGRESS":
      case "QUOTATION_SENT":
      case "ESTIMATE_SENT":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "NEGOTIATION":
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "WON":
      case "PROJECT_CREATED":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "LOST":
        return "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Section 7: Exactly 6 Core Columns (Clean, Fast, Scannable)
  const columns = [
    {
      header: "LEAD ID",
      accessorKey: "referenceNo" as const,
      cell: (row: any) => (
        <span className="font-mono text-xs font-bold text-slate-900 tracking-tight">
          {row.referenceNo}
        </span>
      ),
    },
    {
      header: "CUSTOMER",
      accessorKey: "clientName" as const,
      cell: (row: any) => (
        <div>
          <span className="font-semibold text-slate-900 block leading-tight text-xs">
            {row.clientName}
          </span>
          <span className="text-[11px] text-slate-500 font-mono tracking-tight">
            {row.phone}
          </span>
        </div>
      ),
    },
    {
      header: "SOURCE",
      accessorKey: "sourceKey" as const,
      cell: (row: any) => {
        const sourceName = (row.sourceKey || "WEBSITE").replace(/^OTHER:/i, "").replace(/_/g, " ");
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider inline-block ${getSourceBadgeClass(
              row.sourceKey
            )}`}
          >
            {sourceName}
          </span>
        );
      },
    },
    {
      header: "LOCATION",
      accessorKey: "location" as const,
      cell: (row: any) => (
        <span className="text-xs font-medium text-slate-800 truncate max-w-[180px] block">
          {row.location || "N/A"}
        </span>
      ),
    },
    {
      header: "REQUIREMENT",
      accessorKey: "requirement" as const,
      cell: (row: any) => (
        <div>
          <span className="text-xs font-medium text-slate-900 block leading-tight truncate max-w-[200px]">
            {row.requirement || "Turnkey Interiors"}
          </span>
          {row.propertyTypeKey && (
            <span className="text-[10px] text-slate-400 capitalize">
              {row.propertyTypeKey.replace(/^OTHER:/i, "").replace(/_/g, " ")}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "STATUS",
      accessorKey: "stage" as const,
      cell: (row: any) => {
        const stage = row.stage || "NEW";
        const displayStage = stage === "NEW" ? "New" : stage.replace(/_/g, " ");
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap capitalize ${getStageBadgeClass(
              stage
            )}`}
          >
            ● {displayStage}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto select-none">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-2 border-b border-walnut/15">
        <div>
          <h1 className="text-xl font-bold text-charcoal tracking-tight">Leads & CRM Pipeline</h1>
          <p className="text-xs text-walnut mt-0.5">Enterprise lead directory, website inbound qualification, and conversions</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            reportKey="sales_leads"
            label="Export Leads"
            size="xs"
          />
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Globe className="w-3.5 h-3.5 text-emerald-700" />}
            onClick={() => setIsWebsiteModalOpen(true)}
            className="border-emerald-200 text-emerald-900 bg-emerald-50/50 hover:bg-emerald-100 font-bold"
          >
            Website Form
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<BarChart3 className="w-3.5 h-3.5 text-gold" />} onClick={openRoiModal}>
            Source ROI
          </Button>
          <Link href="/leads/pipeline">
            <Button variant="secondary" size="sm" leftIcon={<LayoutGrid className="w-3.5 h-3.5 text-walnut" />}>
              Pipeline Board
            </Button>
          </Link>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5 text-charcoal" />} onClick={() => setIsAddModalOpen(true)}>
            Add Lead
          </Button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Leads</span>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-slate-900 font-mono">{metrics.totalLeads}</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Active Pipeline</span>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-blue-700 font-mono">{metrics.activeLeads}</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
          </div>

          <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Follow-ups Due</span>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-indigo-700 font-mono">{metrics.followUpsDue}</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
          </div>

          <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Site Visits</span>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-purple-700 font-mono">{metrics.siteVisitsScheduled}</span>
              <Compass className="w-4 h-4 text-purple-500" />
            </div>
          </div>

          <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Pipeline Value</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 font-mono truncate">
                {formatCurrency(metrics.pipelineExpectedValue)}
              </span>
              <FileCheck className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Won Conversion</span>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-emerald-700 font-mono">{metrics.conversionRate}%</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Reference, Customer Name, Phone, Email, Location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
          </div>
        </div>

        {/* Dynamic Filters */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <FilterSelect
            label="Stage"
            placeholder="All Stages"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={[
              { value: "ALL_ACTIVE", label: "All Active Leads" },
              ...pipelineStages.map((st) => ({
                value: st.systemKey || st.id,
                label: st.name || st.displayName,
              })),
            ]}
            variant="slate"
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
            options={[
              { value: "URGENT", label: "Urgent" },
              { value: "HIGH", label: "High" },
              { value: "MEDIUM", label: "Medium" },
              { value: "LOW", label: "Low" },
            ]}
            variant="slate"
            size="sm"
          />

          <FilterSelect
            label="Source"
            placeholder="All Sources"
            value={sourceFilter}
            onChange={(val) => {
              setSourceFilter(val);
              setPage(1);
            }}
            options={leadSources.map((s) => ({
              value: s.key || s.id,
              label: s.name,
            }))}
            variant="slate"
            size="sm"
          />

          <FilterSelect
            label="Assignee"
            placeholder="All Assignees"
            value={assignedFilter}
            onChange={(val) => {
              setAssignedFilter(val);
              setPage(1);
            }}
            options={users.map((u) => ({
              value: u.id,
              label: u.fullName,
            }))}
            variant="slate"
            size="sm"
          />
        </div>
      </div>

      {/* DATA TABLE */}
      <DataTable
        columns={columns as any}
        data={leads}
        keyExtractor={(row: any) => row.id}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        emptyText="No leads found matching your criteria."
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2 text-xs text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* CREATE LEAD MODAL */}
      <LeadFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchLeads();
          fetchMetrics();
        }}
      />

      {/* WEBSITE INBOUND ENQUIRY SIMULATOR MODAL */}
      <WebsiteEnquiryModal
        isOpen={isWebsiteModalOpen}
        onClose={() => setIsWebsiteModalOpen(false)}
        onSuccess={() => {
          fetchLeads();
          fetchMetrics();
        }}
      />

      {/* LEAD PROFILE / WORKSPACE DRAWER */}
      <LeadWorkspace
        leadId={selectedLeadId}
        isOpen={isWorkspaceOpen}
        onClose={() => {
          setIsWorkspaceOpen(false);
          setSelectedLeadId(null);
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("id");
            window.history.replaceState(null, "", url.toString());
          }
        }}
        onUpdate={() => {
          fetchLeads();
          fetchMetrics();
        }}
        onOpenProject={(projId) => {
          setSelectedProjectId(projId);
          setIsProjectWorkspaceOpen(true);
          setIsWorkspaceOpen(false);
        }}
      />

      {/* PROJECT WORKSPACE DRAWER (Bidirectional Integration) */}
      <ProjectWorkspace
        projectId={selectedProjectId}
        isOpen={isProjectWorkspaceOpen}
        onClose={() => {
          setIsProjectWorkspaceOpen(false);
          setSelectedProjectId(null);
        }}
        onUpdate={() => {
          fetchLeads();
          fetchMetrics();
        }}
        onOpenLead={(leadId) => {
          setSelectedLeadId(leadId);
          setIsWorkspaceOpen(true);
          setIsProjectWorkspaceOpen(false);
        }}
      />

      {/* LEAD SOURCE ROI MODAL */}
      <Modal
        isOpen={isRoiModalOpen}
        onClose={() => setIsRoiModalOpen(false)}
        title="Lead Source ROI & Acquisition Performance"
        description="Comprehensive analysis of marketing spend vs. pipeline conversion & revenue"
        maxWidth="2xl"
      >
        <div className="space-y-4 select-none">
          {isRoiLoading ? (
            <div className="py-12 text-center text-xs text-walnut">Loading Lead Source ROI telemetry...</div>
          ) : roiData ? (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-cream/50 rounded-lg border border-walnut/15 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-walnut">Total Leads</span>
                  <p className="text-base font-bold text-charcoal font-mono">{roiData.summary.totalLeads}</p>
                </div>
                <div className="p-3 bg-cream/50 rounded-lg border border-walnut/15 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-walnut">Won Leads</span>
                  <p className="text-base font-bold text-charcoal font-mono">
                    {roiData.summary.totalWon} ({roiData.summary.overallConversionPct}%)
                  </p>
                </div>
                <div className="p-3 bg-cream/50 rounded-lg border border-walnut/15 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-walnut">Won Revenue</span>
                  <p className="text-base font-bold text-charcoal font-mono">{formatCurrency(roiData.summary.totalRevenue)}</p>
                </div>
                <div className="p-3 bg-gold-soft rounded-lg border border-gold/40 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal">Marketing ROI</span>
                  <p className="text-base font-bold text-charcoal font-mono">
                    {roiData.summary.overallRoiPct !== null ? `${roiData.summary.overallRoiPct}%` : "Organic (0 Spend)"}
                  </p>
                </div>
              </div>

              {/* Source Breakdown Table */}
              <div className="overflow-x-auto border border-walnut/15 rounded-lg bg-offwhite">
                <table className="w-full text-xs text-left">
                  <thead className="bg-cream/70 border-b border-walnut/15 text-[11px] font-bold text-walnut uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Lead Source</th>
                      <th className="py-2.5 px-3 text-right">Leads</th>
                      <th className="py-2.5 px-3 text-right">Won</th>
                      <th className="py-2.5 px-3 text-right">Conv %</th>
                      <th className="py-2.5 px-3 text-right">Revenue (₹)</th>
                      <th className="py-2.5 px-3 text-right">Spend (₹)</th>
                      <th className="py-2.5 px-3 text-right">CPL (₹)</th>
                      <th className="py-2.5 px-3 text-right">ROI %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-walnut/10">
                    {roiData.sources.map((s: any) => (
                      <tr key={s.sourceKey} className="hover:bg-cream/40 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-charcoal">{s.sourceName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-charcoal">{s.totalLeads}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-charcoal">{s.wonLeads}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-charcoal">{s.conversionRatePct}%</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-charcoal">{formatCurrency(s.wonRevenue)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-walnut">{formatCurrency(s.spend)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-walnut">{formatCurrency(s.costPerLead)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {s.roiPct !== null ? (
                            <span className={s.roiPct >= 0 ? "text-semantic-success" : "text-semantic-danger"}>
                              {s.roiPct}%
                            </span>
                          ) : (
                            <span className="text-walnut/60 font-normal">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {roiData.sources.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-xs text-walnut">
                          No lead source records configured.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-walnut">Failed to load ROI telemetry data.</div>
          )}

          <div className="flex justify-end pt-2 border-t border-walnut/15">
            <Button variant="secondary" size="sm" onClick={() => setIsRoiModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function LeadsDatabasePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-walnut">Loading Leads Operations...</div>}>
      <LeadsContent />
    </Suspense>
  );
}
