"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LeadFormModal } from "@/components/leads/lead-form-modal";
import { WebsiteEnquiryModal } from "@/components/leads/website-enquiry-modal";
import { DeleteLeadModal } from "@/components/leads/delete-lead-modal";
import { LeadWorkspace } from "@/components/leads/lead-workspace";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { FilterSelect } from "@/components/ui/filter-select";
import { ExportButton } from "@/components/reports/export-button";
import {
  Plus,
  Search,
  Users,
  TrendingUp,
  Clock,
  Compass,
  FileCheck,
  CheckCircle2,
  Trash2,
  Edit2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Target,
  X,
} from "lucide-react";

import { formatCurrency, formatDate } from "@/lib/utils";

import { clientCache } from "@/lib/client-cache";

function LeadsContent() {
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

  const leadsCacheKey = `/api/v1/leads?page=${page}&limit=20${search ? `&search=${search}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}${sourceFilter ? `&source=${sourceFilter}` : ""}${priorityFilter ? `&priority=${priorityFilter}` : ""}${assignedFilter ? `&assignedToId=${assignedFilter}` : ""}`;
  const initialLeadsCached = clientCache.getImmediate<any>(leadsCacheKey);
  const initialMetricsCached = clientCache.getImmediate<any>("/api/v1/leads/metrics");
  const initialConfigCached = clientCache.getImmediate<any>("/api/v1/config/crm");

  const [leads, setLeads] = useState<any[]>(() => initialLeadsCached?.data || []);
  const [metrics, setMetrics] = useState<any>(() => initialMetricsCached?.data || null);
  const [isLoading, setIsLoading] = useState(!initialLeadsCached);

  // Dynamic Config states
  const [pipelineStages, setPipelineStages] = useState<any[]>(() => initialConfigCached?.data?.pipelineStages || []);
  const [leadSources, setLeadSources] = useState<any[]>(() => initialConfigCached?.data?.leadSources || []);
  const [users, setUsers] = useState<any[]>(() => initialConfigCached?.data?.users || []);

  const isMountedRef = useRef(false);

  // ROI Modal state
  const [isRoiModalOpen, setIsRoiModalOpen] = useState(false);
  const [roiData, setRoiData] = useState<any>(null);
  const [isRoiLoading, setIsRoiLoading] = useState(false);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetLeadIds, setDeleteTargetLeadIds] = useState<string[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
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
      const json = await clientCache.fetchWithCache<any>("/api/v1/config/crm", {
        onBackgroundUpdate: (data) => {
          if (data?.success) {
            setPipelineStages(data.data.pipelineStages || []);
            setLeadSources(data.data.leadSources || []);
            setUsers(data.data.users || []);
          }
        },
      });
      if (json?.success) {
        setPipelineStages(json.data.pipelineStages || []);
        setLeadSources(json.data.leadSources || []);
        setUsers(json.data.users || []);
      }
    } catch {
      // quiet handling
    }
  };

  const fetchMetrics = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        clientCache.invalidate("/api/v1/leads/metrics");
      }
      const json = await clientCache.fetchWithCache<any>("/api/v1/leads/metrics", {
        forceRefresh,
        onBackgroundUpdate: (data) => {
          if (data?.success) setMetrics(data.data);
        },
      });
      if (json?.success) {
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

  const fetchLeads = async (isBackground = false, forceRefresh = false) => {
    if (!isBackground) setIsLoading(true);
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

      const url = `/api/v1/leads?${queryParams.toString()}`;
      if (forceRefresh) {
        clientCache.invalidate("/api/v1/leads");
      }
      const json = await clientCache.fetchWithCache<any>(url, {
        forceRefresh,
        onBackgroundUpdate: (data) => {
          if (data?.success) {
            setLeads(data.data);
            if (data.meta) setTotalPages(data.meta.totalPages);
          }
        },
      });

      if (json?.success) {
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
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      fetchLeads(!!initialLeadsCached);
      return;
    }
    fetchLeads(false);
  }, [page, statusFilter, sourceFilter, priorityFilter, assignedFilter]);

  // Debounced search (only after initial mount)
  useEffect(() => {
    if (!isMountedRef.current) return;
    const timer = setTimeout(() => {
      setPage(1);
      fetchLeads(false);
    }, 250);
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

  // Section 8: Status Design - Plain text with small emoji, no pill background, no neon, no dots
  const getStageDisplay = (stage?: string) => {
    switch (stage) {
      case "NEW":
        return { emoji: "🆕", label: "New Lead" };
      case "CONTACTED":
        return { emoji: "💬", label: "Contacted" };
      case "NOT_CONTACTED":
        return { emoji: "⏳", label: "Not Contacted" };
      case "FOLLOW_UP_SCHEDULED":
        return { emoji: "📅", label: "Follow-up Scheduled" };
      case "SITE_VISIT_SCHEDULED":
        return { emoji: "📍", label: "Site Visit Scheduled" };
      case "SITE_VISIT_COMPLETED":
        return { emoji: "📐", label: "Site Visit Completed" };
      case "QUOTATION_IN_PROGRESS":
        return { emoji: "🛠️", label: "Quotation In Progress" };
      case "QUOTATION_SENT":
      case "ESTIMATE_SENT":
        return { emoji: "📨", label: "Quotation Sent" };
      case "NEGOTIATION":
        return { emoji: "🤝", label: "Negotiation" };
      case "WON":
        return { emoji: "🎉", label: "Won" };
      case "PROJECT_CREATED":
        return { emoji: "📄", label: "Project Created" };
      case "LOST":
        return { emoji: "🛑", label: "Lost" };
      default:
        return { emoji: "📋", label: stage ? stage.replace(/_/g, " ") : "Pending" };
    }
  };

  const totalLeadsCount = metrics?.totalLeads ?? leads.length;
  const startItemIndex = leads.length > 0 ? (page - 1) * 20 + 1 : 0;
  const endItemIndex = leads.length > 0 ? (page - 1) * 20 + leads.length : 0;

  return (
    <div className="space-y-4 max-w-7xl mx-auto select-none">
      {/* 1. PAGE HEADING & TOP ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl font-bold text-[#262421] tracking-tight">
            Leads & Sales Pipeline
          </h1>
          <p className="text-xs text-[#77716A] mt-0.5">
            Track client inquiries, manage follow-ups, and convert opportunities into active projects.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ExportButton
            reportKey="sales_leads"
            label="Export Leads"
            size="xs"
          />

          <button
            type="button"
            onClick={() => {
              setDeleteTargetLeadIds(selectedLeadIds.length > 0 ? selectedLeadIds : []);
              setIsDeleteModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E8E2D8] text-[#B8594D] bg-[#FFFEFC] hover:bg-[#FDF2F0] hover:border-[#F2C0B8] transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#B8594D]" />
            <span>
              {selectedLeadIds.length > 0
                ? `Delete Selected (${selectedLeadIds.length})`
                : "Delete Lead"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#9B7950] hover:bg-[#886943] text-white shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* 2. KPI METRIC CARDS (4 CARDS IN HORIZONTAL ROW) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Leads */}
        <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              TOTAL LEADS
            </span>
            <span className="text-lg font-bold text-[#262421] font-mono tabular-nums leading-tight block">
              {metrics?.totalLeads ?? 0}
            </span>
          </div>
        </div>

        {/* Active Pipeline */}
        <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              ACTIVE PIPELINE
            </span>
            <span className="text-lg font-bold text-[#262421] font-mono tabular-nums leading-tight block">
              {metrics?.activeLeads ?? 0}
            </span>
          </div>
        </div>

        {/* Follow-ups Due */}
        <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              FOLLOW-UPS DUE
            </span>
            <span className="text-lg font-bold text-[#262421] font-mono tabular-nums leading-tight block">
              {metrics?.followUpsDue ?? 0}
            </span>
          </div>
        </div>

        {/* Site Visits */}
        <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              SITE VISITS
            </span>
            <span className="text-lg font-bold text-[#262421] font-mono tabular-nums leading-tight block">
              {metrics?.siteVisitsScheduled ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS TOOLBAR */}
      <div className="p-2.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex flex-wrap items-center justify-between gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-[#77716A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Reference, Customer Name, Phone, Email, Location..."
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
        <div className="flex items-center gap-2 flex-wrap text-xs">
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
            variant="beige"
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
            variant="beige"
            size="sm"
          />
        </div>
      </div>

      {/* 4. LEADS DATA TABLE */}
      <div className="w-full bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E8E2D8] bg-transparent text-[#77716A] text-[11px] font-bold uppercase tracking-wider select-none">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.length === leads.length && leads.length > 0}
                    onChange={() => {
                      if (selectedLeadIds.length === leads.length) {
                        setSelectedLeadIds([]);
                      } else {
                        setSelectedLeadIds(leads.map((l) => l.id));
                      }
                    }}
                    className="w-3.5 h-3.5 rounded border-[#E8E2D8] text-[#9B7950] focus:ring-[#9B7950] cursor-pointer accent-[#9B7950]"
                  />
                </th>
                <th className="py-3.5 px-4">LEAD ID</th>
                <th className="py-3.5 px-4">CUSTOMER</th>
                <th className="py-3.5 px-4">SOURCE</th>
                <th className="py-3.5 px-4">LOCATION</th>
                <th className="py-3.5 px-4">REQUIREMENT</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-right">
                  <MoreHorizontal className="w-4 h-4 text-[#77716A] inline-block" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]/60">
              {isLoading && leads.length === 0 ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="animate-pulse">
                    <td className="py-3.5 px-4 text-center">
                      <div className="w-3.5 h-3.5 bg-[#F3EEE5] rounded mx-auto" />
                    </td>
                    <td className="py-3.5 px-4"><div className="w-24 h-4 bg-[#F3EEE5] rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-32 h-4 bg-[#F3EEE5] rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-4 bg-[#F3EEE5] rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-4 bg-[#F3EEE5] rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-28 h-4 bg-[#F3EEE5] rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-24 h-4 bg-[#F3EEE5] rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-12 h-4 bg-[#F3EEE5] rounded ml-auto" /></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center text-[#77716A]">
                    <p className="font-semibold text-xs text-[#262421]">No leads found</p>
                    <p className="text-[11px] text-[#77716A] mt-0.5">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                leads.map((row) => {
                  const isSelected = selectedLeadIds.includes(row.id);
                  const statusInfo = getStageDisplay(row.stage);
                  const sourceName = (row.sourceKey || "WEBSITE").replace(/^OTHER:/i, "").replace(/_/g, " ");

                  return (
                    <tr
                      key={row.id}
                      onClick={() => handleRowClick(row)}
                      className={`transition-colors hover:bg-[#FAF7F2] cursor-pointer ${
                        isSelected ? "bg-[#FAF7F2]" : ""
                      }`}
                    >
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedLeadIds((prev) =>
                              prev.includes(row.id)
                                ? prev.filter((id) => id !== row.id)
                                : [...prev, row.id]
                            );
                          }}
                          className="w-3.5 h-3.5 rounded border-[#E8E2D8] text-[#9B7950] focus:ring-[#9B7950] cursor-pointer accent-[#9B7950]"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-semibold text-[#262421]">
                          {row.referenceNo}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-semibold text-xs text-[#262421] block leading-tight">
                            {row.clientName}
                          </span>
                          {row.phone && (
                            <span className="text-[11px] font-mono text-[#77716A]">
                              {row.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-[#262421] uppercase">
                          {sourceName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs text-[#262421]">
                          {row.location || "—"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span className="text-xs font-medium text-[#262421] block leading-tight">
                            {row.requirement || "Turnkey Interiors"}
                          </span>
                          {row.propertyTypeKey && (
                            <span className="text-[11px] text-[#77716A] capitalize">
                              {row.propertyTypeKey.replace(/^OTHER:/i, "").replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#262421] whitespace-nowrap select-none">
                          <span className="text-[13px] leading-none">{statusInfo.emoji}</span>
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Edit Lead Details"
                            onClick={() => {
                              setEditingLead(row);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1 rounded text-[#77716A] hover:text-[#262421] hover:bg-[#F3EEE5] transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete Lead"
                            onClick={() => {
                              setDeleteTargetLeadIds([row.id]);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1 rounded text-[#77716A] hover:text-[#B8594D] hover:bg-[#FDF2F0] transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Open Lead Workspace"
                            onClick={() => handleRowClick(row)}
                            className="p-1 rounded text-[#77716A] hover:text-[#262421] hover:bg-[#F3EEE5] transition cursor-pointer"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE LEAD MODAL */}
      <LeadFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchLeads(false, true);
          fetchMetrics(true);
        }}
      />

      {/* EDIT LEAD MODAL */}
      <LeadFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLead(null);
        }}
        initialLead={editingLead}
        onSuccess={() => {
          fetchLeads(false, true);
          fetchMetrics(true);
        }}
      />

      {/* WEBSITE INBOUND ENQUIRY SIMULATOR MODAL */}
      <WebsiteEnquiryModal
        isOpen={isWebsiteModalOpen}
        onClose={() => setIsWebsiteModalOpen(false)}
        onSuccess={() => {
          fetchLeads(false, true);
          fetchMetrics(true);
        }}
      />

      {/* DELETE LEAD MODAL (Admin Password Protected) */}
      <DeleteLeadModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTargetLeadIds([]);
        }}
        onSuccess={() => {
          setSelectedLeadIds([]);
          setDeleteTargetLeadIds([]);
          fetchLeads(false, true);
          fetchMetrics(true);
        }}
        initialLeadIds={deleteTargetLeadIds}
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
          fetchLeads(false, true);
          fetchMetrics(true);
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
          fetchLeads(false, true);
          fetchMetrics(true);
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
