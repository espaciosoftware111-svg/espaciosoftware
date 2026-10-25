"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  PackageCheck,
  Globe,
  Phone,
  Mail,
  MapPin,
  Eye,
  FileText,
  ShoppingBag,
  RotateCw,
  AlertCircle,
  TrendingUp,
  Clock,
  Layers,
  Trash2,
  CheckSquare,
  Square,
  MoreHorizontal,
  Edit2,
  Instagram,
  UserPlus,
  PhoneCall,
  MessageCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/reports/export-button";
import { FilterSelect } from "@/components/ui/filter-select";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MaterialLeadWorkspace } from "@/components/material-leads/material-lead-workspace";
import { MaterialLeadFormModal } from "@/components/material-leads/material-lead-form-modal";
import { FreezeMaterialLeadModal } from "@/components/material-leads/freeze-material-lead-modal";
import { Snowflake, RotateCcw, Archive, FileSpreadsheet, CheckCircle2, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface MaterialLeadItem {
  id: string;
  materialLeadId: string;
  referenceNo: string;
  customerName: string;
  clientName: string;
  primaryContact: string;
  phone: string;
  secondaryContact?: string | null;
  email?: string | null;
  location: string;
  projectLocation: string;
  source: string;
  sourceKey: string;
  requirement: string;
  status: string;
  stage: string;
  priority: string;
  notes?: string | null;
  requirements?: any[];
  quotationsCount?: number;
  tags?: string | null;
  createdAt: string;
}

interface MaterialLeadKPI {
  totalMaterialLeads: number;
  activeMaterialLeads: number;
  quotationsSent: number;
  convertedOrdered: number;
}

import { clientCache } from "@/lib/client-cache";

function MaterialLeadsContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [customStatusInput, setCustomStatusInput] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [customSourceInput, setCustomSourceInput] = useState("");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [customLocationInput, setCustomLocationInput] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const cacheKey = `/api/v1/material-leads?page=${page}&limit=20&search=${searchQuery}&status=${statusFilter}&source=${sourceFilter}&location=${locationFilter}`;
  const initialCached = clientCache.getImmediate<any>(cacheKey);

  const [leads, setLeads] = useState<MaterialLeadItem[]>(() => initialCached?.data || []);
  const [kpi, setKpi] = useState<MaterialLeadKPI>(() => {
    const kpiData = initialCached?.meta?.pagination?.kpi || initialCached?.meta?.kpi || initialCached?.kpi;
    return kpiData ? {
      totalMaterialLeads: Number(kpiData.totalMaterialLeads || 0),
      activeMaterialLeads: Number(kpiData.activeMaterialLeads || 0),
      quotationsSent: Number(kpiData.quotationsSent || 0),
      convertedOrdered: Number(kpiData.convertedOrdered || 0),
    } : {
      totalMaterialLeads: 0,
      activeMaterialLeads: 0,
      quotationsSent: 0,
      convertedOrdered: 0,
    };
  });
  const [loading, setLoading] = useState(!initialCached);
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawer State
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialId || null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(!!initialId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [freezeTargetLeadIds, setFreezeTargetLeadIds] = useState<string[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Google Sheets Sync State
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const runGoogleSheetsSync = async (isBackground = false) => {
    if (!isBackground) setIsSyncingSheets(true);
    try {
      const res = await fetch("/api/v1/integrations/google-sheets/sync", { method: "POST" });
      const json = await res.json();
      if (json?.success) {
        const count = json.data?.materialLeadsImported ?? 0;
        clientCache.invalidate("/api/v1/material-leads");
        await fetchLeads(false, true);
        if (count > 0) {
          setSyncToast(`Google Sheets Sync: ${count} new material lead(s) imported.`);
        } else if (!isBackground) {
          setSyncToast(`Google Sheets Sync: All material leads are up to date.`);
        }
        setTimeout(() => setSyncToast(null), 5000);
      } else {
        if (!isBackground) {
          setSyncToast(`Google Sheets Sync notice: ${json?.error?.message || "Sync completed with warnings."}`);
          setTimeout(() => setSyncToast(null), 5000);
        }
      }
    } catch (err: any) {
      console.warn("Google Sheets auto-sync notice:", err);
      if (!isBackground) {
        setSyncToast(`Sync error: ${err?.message || "Failed to sync"}`);
        setTimeout(() => setSyncToast(null), 5000);
      }
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Automatic Google Sheets Sync on section open & on every refresh
  useEffect(() => {
    runGoogleSheetsSync();

    // Keep continuously in sync in the background every 60s
    const timer = setInterval(() => {
      runGoogleSheetsSync(true);
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const fetchLeads = useCallback(async (isBackground = false, forceRefresh = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "20");
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      // Filter: Status (with Global OTHERS -> manual input)
      if (statusFilter === "OTHER" && customStatusInput.trim()) {
        params.append("status", customStatusInput.trim());
      } else if (statusFilter !== "ALL" && statusFilter !== "OTHER") {
        params.append("status", statusFilter);
      }

      // Filter: Source (with Global OTHERS -> manual input)
      if (sourceFilter === "OTHER" && customSourceInput.trim()) {
        params.append("source", customSourceInput.trim());
      } else if (sourceFilter !== "ALL" && sourceFilter !== "OTHER") {
        params.append("source", sourceFilter);
      }

      // Filter: Location (with Global OTHERS -> manual input)
      if (locationFilter === "OTHER" && customLocationInput.trim()) {
        params.append("location", customLocationInput.trim());
      } else if (locationFilter !== "ALL" && locationFilter !== "OTHER") {
        params.append("location", locationFilter);
      }

      const url = `/api/v1/material-leads?${params.toString()}`;
      if (forceRefresh) {
        clientCache.invalidate("/api/v1/material-leads");
      }
      const json = await clientCache.fetchWithCache<any>(url, {
        forceRefresh,
        onBackgroundUpdate: (freshJson) => {
          if (freshJson) {
            const rawLeads = freshJson.data || (Array.isArray(freshJson) ? freshJson : []);
            setLeads(rawLeads);
            const kpiData = freshJson.meta?.pagination?.kpi || freshJson.meta?.kpi || freshJson.kpi;
            if (kpiData) {
              setKpi({
                totalMaterialLeads: Number(kpiData.totalMaterialLeads || 0),
                activeMaterialLeads: Number(kpiData.activeMaterialLeads || 0),
                quotationsSent: Number(kpiData.quotationsSent || 0),
                convertedOrdered: Number(kpiData.convertedOrdered || 0),
              });
            }
          }
        },
      });

      const rawLeads = json?.data || (Array.isArray(json) ? json : []);
      setLeads(rawLeads);

      const kpiData =
        json?.meta?.pagination?.kpi ||
        json?.meta?.kpi ||
        json?.pagination?.kpi ||
        json?.kpi;
      if (kpiData) {
        setKpi({
          totalMaterialLeads: Number(kpiData.totalMaterialLeads || 0),
          activeMaterialLeads: Number(kpiData.activeMaterialLeads || 0),
          quotationsSent: Number(kpiData.quotationsSent || 0),
          convertedOrdered: Number(kpiData.convertedOrdered || 0),
        });
      }

      if (json?.meta?.pagination) {
        setTotalPages(json.meta.pagination.totalPages || 1);
        setTotalCount(json.meta.pagination.total || rawLeads.length);
      } else if (json?.meta?.total) {
        setTotalCount(json.meta.total);
        setTotalPages(Math.ceil(json.meta.total / 20) || 1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load Material Leads");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    searchQuery,
    statusFilter,
    customStatusInput,
    sourceFilter,
    customSourceInput,
    locationFilter,
    customLocationInput,
  ]);

  useEffect(() => {
    fetchLeads(!!initialCached);
  }, [fetchLeads]);

  useEffect(() => {
    if (initialId) {
      setSelectedLeadId(initialId);
      setIsDrawerOpen(true);
    }
  }, [initialId]);

  const handleOpenLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setIsDrawerOpen(true);
  };

  const getMaterialStatusDisplay = (status?: string) => {
    const s = (status || "NEW").toUpperCase();
    switch (s) {
      case "NEW":
      case "NOT_CONTACTED":
        return { emoji: "🆕", label: "New Lead" };
      case "CONTACTED":
        return { emoji: "💬", label: "Contacted" };
      case "REQUIREMENT_DISCUSSED":
      case "MATERIAL_REQUIRED":
        return { emoji: "📦", label: "Requirement Discussed" };
      case "QUOTATION_IN_PROGRESS":
        return { emoji: "🛠️", label: "Quotation In Progress" };
      case "QUOTATION_GENERATED":
      case "QUOTATION_SENT":
        return { emoji: "📨", label: "Quotation Sent" };
      case "WON":
      case "CONFIRMATION_FEE":
      case "CONFIRMATION_FEE_PAID":
      case "BOOKING_CONFIRMED":
        return { emoji: "🎉", label: "Won" };
      case "ORDER_PLACED":
      case "VENDOR_REQUEST":
      case "VENDOR_ACCEPTED":
      case "ORDER_CONFIRMED":
      case "MATERIALS_ORDER":
        return { emoji: "🏭", label: "Order Placed" };
      case "ORDER_DELIVERED":
      case "ORDER_COMPLETED":
        return { emoji: "✅", label: "Completed" };
      case "LOST":
      case "CANCELLED":
      case "VENDOR_REJECTED":
        return { emoji: "🛑", label: "Lost" };
      case "ON_HOLD":
        return { emoji: "⏸️", label: "On Hold" };
      default:
        return { emoji: "📋", label: s.replace(/_/g, " ") };
    }
  };

  const getMaterialLeadProgressPct = (statusOrStage?: string) => {
    const s = (statusOrStage || "").toUpperCase();
    if (s.includes("DELIVERED") || s.includes("COMPLETED")) {
      return { pct: 100, isCompleted: true, isLost: false };
    }
    if (s.includes("LOST") || s.includes("CANCEL") || s.includes("REJECT") || s.includes("DROPPED")) {
      return { pct: 0, isCompleted: false, isLost: true };
    }
    if (s.includes("ORDER") || s.includes("CONVERT") || s.includes("WON")) {
      return { pct: 90, isCompleted: false, isLost: false };
    }
    if (s.includes("NEGOTIAT")) {
      return { pct: 80, isCompleted: false, isLost: false };
    }
    if (s.includes("QUOTE") || s.includes("QUOTATION") || s.includes("SENT")) {
      return { pct: 70, isCompleted: false, isLost: false };
    }
    if (s.includes("ESTIMATE") || s.includes("PROGRESS")) {
      return { pct: 55, isCompleted: false, isLost: false };
    }
    if (s.includes("VISIT") || s.includes("REQUIREMENT")) {
      return { pct: 40, isCompleted: false, isLost: false };
    }
    if (s.includes("CONTACT")) {
      return { pct: 25, isCompleted: false, isLost: false };
    }
    return { pct: 15, isCompleted: false, isLost: false };
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
              <Boxes className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-[#262421] tracking-tight">Material Leads & Catalog Enquiries</h1>
            {isSyncingSheets && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-in fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Auto-Syncing Sheets...
              </span>
            )}
          </div>
          <p className="text-xs text-[#77716A] mt-1 ml-10">
            Manage inbound material catalog unlock requests, commercial quotes, and verified supplier orders
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runGoogleSheetsSync(false)}
            disabled={isSyncingSheets}
            className="text-xs py-1.5 h-8.5 bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Sync Material Leads from Google Sheets"
          >
            {isSyncingSheets ? (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            )}
            {isSyncingSheets ? "Syncing Google Sheets..." : "Sync Google Sheets"}
          </Button>

          <ExportButton
            reportKey="sales_leads"
            label="Export"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFreezeTargetLeadIds(selectedLeadIds.length > 0 ? selectedLeadIds : []);
              setIsFreezeModalOpen(true);
            }}
            className="text-xs py-1.5 h-8.5 bg-[#FFFEFC] border-[#E8E2D8] text-[#0284C7] hover:bg-[#F0F9FF] hover:border-[#BAE6FD] font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5"
            title="Freeze / Archive Selected Material Leads"
          >
            <Snowflake className="w-3.5 h-3.5 text-[#0284C7]" />
            {selectedLeadIds.length > 0
              ? `Freeze Selected (${selectedLeadIds.length})`
              : "Freeze / Archive"}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs py-1.5 h-8.5 bg-[#242321] text-[#FAF8F5] hover:bg-[#383633] border border-[#242321] font-bold shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New Material Lead
          </Button>
        </div>
      </div>

      {/* Sync Feedback Toast */}
      {syncToast && (
        <div className="p-2.5 px-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{syncToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncToast(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. 4 Dynamic KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* KPI 1: Total Material Leads */}
        <div
          onClick={() => {
            setStatusFilter("ALL");
            setPage(1);
          }}
          className={`p-3 bg-[#FFFEFC] border rounded-xl flex items-center gap-3 shadow-2xs cursor-pointer transition ${
            statusFilter === "ALL" ? "border-[#B99558] ring-1 ring-[#B99558]/30" : "border-[#E8E2D8]"
          }`}
          title="Click to show all Material Leads"
        >
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              TOTAL LEADS
            </span>
            <span className="text-lg font-bold text-[#262421] font-mono tabular-nums leading-tight block">
              {kpi.totalMaterialLeads}
            </span>
          </div>
        </div>

        {/* KPI 2: Active Material Leads */}
        <div
          onClick={() => {
            setStatusFilter("NEW");
            setPage(1);
          }}
          className={`p-3 bg-[#FFFEFC] border rounded-xl flex items-center gap-3 shadow-2xs cursor-pointer transition ${
            statusFilter === "NEW" ? "border-[#B99558] ring-1 ring-[#B99558]/30" : "border-[#E8E2D8]"
          }`}
          title="Click to filter new active leads"
        >
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              ACTIVE PIPELINE
            </span>
            <span className="text-lg font-bold text-[#262421] font-mono tabular-nums leading-tight block">
              {kpi.activeMaterialLeads}
            </span>
          </div>
        </div>

        {/* KPI 3: Material Quotations Sent */}
        <div
          onClick={() => {
            setStatusFilter("QUOTATION_SENT");
            setPage(1);
          }}
          className={`p-3 bg-[#FFFEFC] border rounded-xl flex items-center gap-3 shadow-2xs cursor-pointer transition ${
            statusFilter === "QUOTATION_SENT" ? "border-[#B99558] ring-1 ring-[#B99558]/30" : "border-[#E8E2D8]"
          }`}
          title="Click to filter quotations sent"
        >
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A18D70] shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              QUOTATIONS SENT
            </span>
            <span className="text-lg font-bold text-[#262421] font-mono tabular-nums leading-tight block">
              {kpi.quotationsSent}
            </span>
          </div>
        </div>

        {/* KPI 4: Converted / Ordered */}
        <div
          onClick={() => {
            setStatusFilter("ORDER_CONFIRMED");
            setPage(1);
          }}
          className={`p-3 bg-[#FFFEFC] border rounded-xl flex items-center gap-3 shadow-2xs cursor-pointer transition ${
            statusFilter === "ORDER_CONFIRMED" ? "border-[#536B4E] ring-1 ring-[#536B4E]/30" : "border-[#E8E2D8]"
          }`}
          title="Click to filter confirmed orders"
        >
          <div className="w-9 h-9 rounded-lg bg-[#E8EFE5] border border-[#D7E3D2] flex items-center justify-center text-[#536B4E] shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block truncate">
              CONVERTED / ORDERED
            </span>
            <span className="text-lg font-bold text-[#536B4E] font-mono tabular-nums leading-tight block">
              {kpi.convertedOrdered}
            </span>
          </div>
        </div>
      </div>

      {/* 3. DIRECT SOURCE QUICK FILTER BAR */}
      <div className="flex items-center gap-1.5 flex-wrap p-1.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl shadow-2xs">
        <span className="text-[11px] font-bold text-[#77716A] uppercase tracking-wider px-2 py-1 flex items-center gap-1 select-none">
          <Layers className="w-3.5 h-3.5 text-[#9B7950]" />
          Source:
        </span>
        {[
          { key: "ALL", label: "All Material Leads", icon: <Layers className="w-3.5 h-3.5" /> },
          { key: "WEBSITE", label: "Website", icon: <Globe className="w-3.5 h-3.5" /> },
          { key: "MANUAL", label: "Manual / Walk-in", icon: <UserPlus className="w-3.5 h-3.5" /> },
          { key: "INSTAGRAM", label: "Instagram", icon: <Instagram className="w-3.5 h-3.5" /> },
          { key: "WHATSAPP", label: "WhatsApp", icon: <MessageCircle className="w-3.5 h-3.5" /> },
          { key: "REFERRAL", label: "Referral", icon: <Users className="w-3.5 h-3.5" /> },
          { key: "PHONE_CALL", label: "Phone Call", icon: <PhoneCall className="w-3.5 h-3.5" /> },
        ].map((item) => {
          const isSelected =
            (sourceFilter === "ALL" && item.key === "ALL") ||
            (Boolean(sourceFilter) && (
              sourceFilter.toUpperCase() === item.key ||
              (item.key === "MANUAL" && (sourceFilter.toUpperCase() === "WALK_IN" || sourceFilter.toUpperCase() === "DIRECT" || sourceFilter.toUpperCase() === "DIRECT_VISIT"))
            ));
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setSourceFilter(item.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                isSelected
                  ? "bg-[#89652D] text-white shadow-2xs font-bold ring-1 ring-[#89652D]"
                  : "bg-[#F3EEE5]/40 text-[#524E48] hover:bg-[#F3EEE5] hover:text-[#262421] border border-[#E8E2D8]/80"
              }`}
            >
              <span className={isSelected ? "text-white" : "text-[#9B7950]"}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Search & Filter Bar */}
      <div className="p-2.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-[#77716A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, phone, email, location..."
            className="w-full h-8 pl-9 pr-8 text-xs bg-transparent border-none text-[#262421] placeholder-[#77716A] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <FilterSelect
            label="Stage"
            placeholder="All Stages"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val || "ALL");
              setPage(1);
            }}
            options={[
              { value: "NEW", label: "New Lead" },
              { value: "CONTACTED", label: "Contacted" },
              { value: "REQUIREMENT_DISCUSSED", label: "Requirement Discussed" },
              { value: "QUOTATION_IN_PROGRESS", label: "Quotation In Progress" },
              { value: "QUOTATION_SENT", label: "Quotation Sent" },
              { value: "ORDER_CONFIRMED", label: "Order Confirmed" },
              { value: "ORDER_COMPLETED", label: "Order Completed" },
              { value: "ON_HOLD", label: "On Hold" },
              { value: "LOST", label: "Lost" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
            variant="beige"
            size="sm"
          />

          <FilterSelect
            label="Source"
            placeholder="All Sources"
            value={sourceFilter}
            onChange={(val) => {
              setSourceFilter(val || "ALL");
              setPage(1);
            }}
            options={[
              { value: "Website", label: "Website" },
              { value: "Instagram", label: "Instagram" },
              { value: "WhatsApp", label: "WhatsApp" },
              { value: "Referral", label: "Referral" },
              { value: "Walk_In", label: "Walk-In" },
              { value: "Phone_Call", label: "Phone Call" },
            ]}
            variant="beige"
            size="sm"
          />

          {/* Location Filter */}
          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="ALL">All Locations</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Jubilee Hills">Jubilee Hills</option>
              <option value="Banjara Hills">Banjara Hills</option>
              <option value="Gachibowli">Gachibowli</option>
              <option value="Madhapur">Madhapur</option>
              <option value="OTHER">Other (Custom Location)</option>
            </select>
            {locationFilter === "OTHER" && (
              <Input
                value={customLocationInput}
                onChange={(e) => setCustomLocationInput(e.target.value)}
                placeholder="Enter custom location..."
                className="mt-2 text-xs"
              />
            )}
          </div>
        </div>
      </div>

      {/* 4. MATERIAL LEADS DATA TABLE */}
      <div className="w-full bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs relative">
        {/* Progress bar during background refresh */}
        {loading && leads.length > 0 && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#B18A4D]/30 overflow-hidden z-20">
            <div className="h-full bg-[#B18A4D] animate-pulse w-full" />
          </div>
        )}

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
                <th className="py-3.5 px-4">CREATED DATE</th>
                <th className="py-3.5 px-4 text-right">
                  <MoreHorizontal className="w-4 h-4 text-[#77716A] inline-block" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]/60">
              {loading && leads.length === 0 ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`skel-ml-${idx}`} className="animate-pulse">
                    <td className="py-3.5 px-4 text-center">
                      <div className="w-3.5 h-3.5 bg-[#F3EEE5] rounded mx-auto" />
                    </td>
                    <td className="py-3.5 px-4"><div className="w-28 h-4 bg-[#F3EEE5] rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-32 h-4 bg-[#F3EEE5] rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-4 bg-[#F3EEE5] rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-4 bg-[#F3EEE5] rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-36 h-4 bg-[#F3EEE5] rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-24 h-4 bg-[#F3EEE5] rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-4 bg-[#F3EEE5] rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-12 h-4 bg-[#F3EEE5] rounded ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center text-rose-600">
                    <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                    <p className="font-semibold text-xs">{error}</p>
                    <Button size="sm" variant="outline" onClick={() => fetchLeads(false)} className="mt-2 text-xs">
                      Retry
                    </Button>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center text-[#77716A]">
                    <p className="font-semibold text-xs text-[#262421]">No material leads found</p>
                    <p className="text-[11px] text-[#77716A] mt-0.5">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const isRowSelected = selectedLeadIds.includes(lead.id);
                  const statusInfo = getMaterialStatusDisplay(lead.status || lead.stage);
                  const sourceName = (lead.source || lead.sourceKey || "WEBSITE").replace(/^OTHER:/i, "").replace(/_/g, " ");

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => handleOpenLead(lead.id)}
                      className={`transition-colors hover:bg-[#FAF7F2] cursor-pointer ${
                        isRowSelected ? "bg-[#FAF7F2]" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => {
                            setSelectedLeadIds((prev) =>
                              prev.includes(lead.id)
                                ? prev.filter((id) => id !== lead.id)
                                : [...prev, lead.id]
                            );
                          }}
                          className="w-3.5 h-3.5 rounded border-[#E8E2D8] text-[#9B7950] focus:ring-[#9B7950] cursor-pointer accent-[#9B7950]"
                        />
                      </td>

                      {/* Material Lead ID */}
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#262421]">
                        {lead.materialLeadId || lead.referenceNo}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-semibold text-xs text-[#262421] block leading-tight">
                            {lead.customerName || lead.clientName}
                          </span>
                          {(lead.primaryContact || lead.phone) && (
                            <span className="text-[11px] font-mono text-[#77716A]">
                              {lead.primaryContact || lead.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-[#262421] uppercase">
                          {sourceName}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-[#262421]">
                          {lead.location || lead.projectLocation || "—"}
                        </span>
                      </td>

                      {/* Requirement */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="text-xs font-medium text-[#262421] block leading-tight">
                            {lead.requirement || "Materials Order & Supply"}
                          </span>
                          {lead.requirements && lead.requirements.length > 0 && (
                            <span className="text-[11px] text-[#77716A]">
                              ({lead.requirements.length} items specified)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status with Progress Bar */}
                      <td className="py-3.5 px-4 min-w-[140px] max-w-[180px]">
                        {(() => {
                          const matProg = getMaterialLeadProgressPct(lead.status || lead.stage);
                          return (
                            <div className="flex flex-col gap-1.5">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#262421] whitespace-nowrap select-none">
                                <span className="text-[13px] leading-none">{statusInfo.emoji}</span>
                                <span>{statusInfo.label}</span>
                              </span>
                              {!matProg.isLost ? (
                                <div className="w-full space-y-1">
                                  <ProgressBar
                                    value={matProg.pct}
                                    size="xs"
                                    variant={matProg.isCompleted ? "emerald" : "auto"}
                                  />
                                  <span className="text-[9px] text-[#77716A] font-mono pl-0.5 block leading-none tabular-nums font-medium">
                                    {matProg.pct}% pipeline
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-rose-600 font-mono font-medium pl-0.5">
                                  Closed / Dropped
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 font-mono text-xs text-[#77716A] whitespace-nowrap">
                        {formatDate(lead.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Open Material Lead Workspace"
                            onClick={() => handleOpenLead(lead.id)}
                            className="p-1 rounded text-[#77716A] hover:text-[#262421] hover:bg-[#F3EEE5] transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title={lead.tags?.includes("[FROZEN_ARCHIVED]") ? "Unfreeze / Restore Material Lead" : "Freeze / Archive Material Lead"}
                            onClick={() => {
                              setFreezeTargetLeadIds([lead.id]);
                              setIsFreezeModalOpen(true);
                            }}
                            className="p-1 rounded text-[#77716A] hover:text-[#0284C7] hover:bg-[#F0F9FF] transition cursor-pointer"
                          >
                            {lead.tags?.includes("[FROZEN_ARCHIVED]") ? (
                              <RotateCcw className="w-3.5 h-3.5 text-[#16A34A]" />
                            ) : (
                              <Snowflake className="w-3.5 h-3.5 text-[#0284C7]" />
                            )}
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E2D8] bg-[#FAF7F2] text-xs text-[#77716A]">
            <div>
              Showing page <strong className="text-[#262421] font-mono font-bold">{page}</strong> of{" "}
              <strong className="text-[#262421] font-mono font-bold">{totalPages}</strong> (
              <span className="font-mono">{totalCount}</span> total material leads)
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs h-7 px-3 bg-white border border-[#E8E2D8] text-[#262421] hover:bg-[#F3EEE5]"
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="text-xs h-7 px-3 bg-white border border-[#E8E2D8] text-[#262421] hover:bg-[#F3EEE5]"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Half-Screen Workspace Drawer */}
      <MaterialLeadWorkspace
        leadId={selectedLeadId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedLeadId(null);
        }}
        onUpdate={fetchLeads}
      />

      {/* Create Modal */}
      <MaterialLeadFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchLeads}
      />

      {/* Freeze / Archive Material Lead Modal */}
      <FreezeMaterialLeadModal
        isOpen={isFreezeModalOpen}
        onClose={() => {
          setIsFreezeModalOpen(false);
          setFreezeTargetLeadIds([]);
        }}
        onSuccess={() => {
          setSelectedLeadIds([]);
          setFreezeTargetLeadIds([]);
          fetchLeads(false);
        }}
        initialLeadIds={freezeTargetLeadIds}
      />
    </div>
  );
}

export default function MaterialLeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-xs text-walnut flex flex-col items-center gap-2">
          <RotateCw className="w-5 h-5 animate-spin text-gold" />
          Loading Material Leads section...
        </div>
      }
    >
      <MaterialLeadsContent />
    </Suspense>
  );
}
