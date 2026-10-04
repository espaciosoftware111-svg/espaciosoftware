"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { FilterSelect } from "@/components/ui/filter-select";
import { ExportButton } from "@/components/reports/export-button";
import { ExportModal } from "@/components/reports/export-modal";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Receipt,
  Users,
  FolderKanban,
  Truck,
  Package,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Layers,
  Building2,
  FileText,
  ShieldCheck,
  Target,
  Sparkles,
  Database,
} from "lucide-react";

import { clientCache } from "@/lib/client-cache";

type ReportTab =
  | "overview"
  | "sales"
  | "finance"
  | "expenses"
  | "projects"
  | "procurement"
  | "inventory"
  | "tax"
  | "catalog";

type DatePeriod =
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_year"
  | "custom";

export function ReportsClient() {
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [period, setPeriod] = useState<DatePeriod>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Synchronous cache hydration
  const initialCacheKey = `reports_tab_overview_this_month`;
  const cachedInitial = clientCache.getImmediate<any>(initialCacheKey);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(!cachedInitial);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [executiveData, setExecutiveData] = useState<any>(cachedInitial || null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [collectionData, setCollectionData] = useState<any>(null);
  const [expenseData, setExpenseData] = useState<any>(null);
  const [profitabilityData, setProfitabilityData] = useState<any>(null);
  const [leadData, setLeadData] = useState<any>(null);
  const [procurementData, setProcurementData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [taxData, setTaxData] = useState<any>(null);

  // Catalog Report generation state
  const [catalogList, setCatalogList] = useState<any[]>(clientCache.getImmediate<any[]>("reports_catalog_list") || []);
  const [selectedCatalogKey, setSelectedCatalogKey] = useState<string>("sales_leads");
  const [catalogReportData, setCatalogReportData] = useState<any>(null);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  const fetchCatalogReport = useCallback(async (reportKey: string, force = false) => {
    const cacheKey = `reports_catalog_${reportKey}_${period}_${customStart}_${customEnd}`;
    const cached = clientCache.getImmediate<any>(cacheKey);
    if (cached && !force) {
      setCatalogReportData(cached);
    } else {
      setIsCatalogLoading(true);
    }
    try {
      const data = await clientCache.fetchWithCache(cacheKey, async () => {
        const res = await fetch("/api/v1/reports/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportKey,
            filter: {
              period,
              startDate: customStart || undefined,
              endDate: customEnd || undefined,
            },
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || "Failed to generate catalog report");
        return json.data;
      }, { ttlMs: 120000, forceRefresh: force });
      setCatalogReportData(data);
    } catch (err: any) {
      setError(err.message || "Error generating report");
    } finally {
      setIsCatalogLoading(false);
    }
  }, [period, customStart, customEnd]);

  // Fetch report data according to active tab and period with SWR
  const fetchTabData = useCallback(async (force = false) => {
    const tabCacheKey = `reports_tab_${activeTab}_${period}_${customStart}_${customEnd}`;
    const cached = clientCache.getImmediate<any>(tabCacheKey);
    if (cached && !force) {
      if (activeTab === "overview") setExecutiveData(cached);
      else if (activeTab === "sales") setLeadData(cached);
      else if (activeTab === "finance") {
        setRevenueData(cached.rev);
        setCollectionData(cached.col);
      } else if (activeTab === "expenses") setExpenseData(cached);
      else if (activeTab === "projects") setProfitabilityData(cached);
      else if (activeTab === "procurement") setProcurementData(cached);
      else if (activeTab === "inventory") setInventoryData(cached);
      else if (activeTab === "tax") setTaxData(cached);
      setIsLoading(false);
      setIsBackgroundRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("period", period);
      if (period === "custom" && customStart && customEnd) {
        params.set("startDate", customStart);
        params.set("endDate", customEnd);
      }

      if (activeTab === "overview") {
        const data = await clientCache.fetchWithCache<any>(tabCacheKey, async () => {
          const res = await fetch(`/api/v1/analytics/dashboard?${params.toString()}`);
          const json = await res.json();
          if (!json.success) throw new Error(json.error?.message || "Failed to fetch overview");
          return json.data;
        }, { ttlMs: 60000, forceRefresh: force });
        setExecutiveData(data);
      } else if (activeTab === "sales") {
        const data = await clientCache.fetchWithCache<any>(tabCacheKey, async () => {
          const res = await fetch(`/api/v1/analytics/sales?${params.toString()}`);
          const json = await res.json();
          if (!json.success) throw new Error(json.error?.message || "Failed to fetch sales");
          return json.data;
        }, { ttlMs: 60000, forceRefresh: force });
        setLeadData(data);
      } else if (activeTab === "finance") {
        const data = await clientCache.fetchWithCache<{ rev: any; col: any }>(tabCacheKey, async () => {
          const [revRes, colRes] = await Promise.all([
            fetch(`/api/v1/analytics/revenue?${params.toString()}`),
            fetch(`/api/v1/analytics/collections?${params.toString()}`),
          ]);
          const revJson = await revRes.json();
          const colJson = await colRes.json();
          return { rev: revJson.data, col: colJson.data };
        }, { ttlMs: 60000, forceRefresh: force });
        setRevenueData(data.rev);
        setCollectionData(data.col);
      } else if (activeTab === "expenses") {
        const data = await clientCache.fetchWithCache<any>(tabCacheKey, async () => {
          const res = await fetch(`/api/v1/analytics/expenses?${params.toString()}`);
          const json = await res.json();
          if (!json.success) throw new Error(json.error?.message || "Failed to fetch expenses");
          return json.data;
        }, { ttlMs: 60000, forceRefresh: force });
        setExpenseData(data);
      } else if (activeTab === "projects") {
        const data = await clientCache.fetchWithCache<any>(tabCacheKey, async () => {
          const res = await fetch(`/api/v1/analytics/profitability?${params.toString()}`);
          const json = await res.json();
          if (!json.success) throw new Error(json.error?.message || "Failed to fetch project margins");
          return json.data;
        }, { ttlMs: 60000, forceRefresh: force });
        setProfitabilityData(data);
      } else if (activeTab === "procurement") {
        const data = await clientCache.fetchWithCache<any>(tabCacheKey, async () => {
          const res = await fetch(`/api/v1/analytics/procurement?${params.toString()}`);
          const json = await res.json();
          if (!json.success) throw new Error(json.error?.message || "Failed to fetch procurement");
          return json.data;
        }, { ttlMs: 60000, forceRefresh: force });
        setProcurementData(data);
      } else if (activeTab === "inventory") {
        const data = await clientCache.fetchWithCache<any>(tabCacheKey, async () => {
          const res = await fetch(`/api/v1/analytics/inventory`);
          const json = await res.json();
          if (!json.success) throw new Error(json.error?.message || "Failed to fetch inventory");
          return json.data;
        }, { ttlMs: 60000, forceRefresh: force });
        setInventoryData(data);
      } else if (activeTab === "tax") {
        const data = await clientCache.fetchWithCache<any>(tabCacheKey, async () => {
          const res = await fetch(`/api/v1/analytics/gst?${params.toString()}`);
          const json = await res.json();
          if (!json.success) throw new Error(json.error?.message || "Failed to fetch GST tax");
          return json.data;
        }, { ttlMs: 60000, forceRefresh: force });
        setTaxData(data);
      } else if (activeTab === "catalog") {
        fetchCatalogReport(selectedCatalogKey, force);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load report analytics");
    } finally {
      setIsLoading(false);
      setIsBackgroundRefreshing(false);
    }
  }, [activeTab, period, customStart, customEnd, selectedCatalogKey, fetchCatalogReport]);

  const fetchCatalogList = async () => {
    try {
      const data = await clientCache.fetchWithCache<any[]>("reports_catalog_list", async () => {
        const res = await fetch("/api/v1/reports/catalog");
        const json = await res.json();
        return json.data || [];
      }, { ttlMs: 300000 });
      setCatalogList(data);
    } catch {
      // quiet handling
    }
  };

  useEffect(() => {
    fetchCatalogList();
  }, []);

  useEffect(() => {
    fetchTabData();
  }, [fetchTabData]);

  // Export handler (CSV or JSON)
  const handleExport = async (format: "CSV" | "JSON", customKey?: string) => {
    const keyToExport = customKey || (activeTab === "catalog" ? selectedCatalogKey : getExportKeyForTab(activeTab));
    if (!keyToExport) return;

    setIsExporting(true);
    try {
      const res = await fetch("/api/v1/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportKey: keyToExport,
          format,
          filter: {
            period,
            startDate: customStart || undefined,
            endDate: customEnd || undefined,
          },
        }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${keyToExport}_${new Date().toISOString().slice(0, 10)}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const getExportKeyForTab = (tab: ReportTab): string => {
    switch (tab) {
      case "overview":
      case "finance":
        return "finance_revenue";
      case "sales":
        return "sales_leads";
      case "expenses":
        return "finance_expenses";
      case "projects":
        return "project_status";
      case "procurement":
        return "procurement_pos";
      case "inventory":
        return "inventory_stock";
      case "tax":
        return "tax_gst";
      default:
        return "sales_leads";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePdfReport = async () => {
    const reportKey = activeTab === "catalog" ? selectedCatalogKey : getExportKeyForTab(activeTab);
    if (!reportKey) return;
    setIsExporting(true);
    try {
      const res = await fetch("/api/v1/reports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportKey,
          filter: { period, startDate: customStart || undefined, endDate: customEnd || undefined },
        }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err: any) {
      alert(err.message || "Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const tabs: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Executive Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "sales", label: "Sales & CRM", icon: <Users className="w-4 h-4" /> },
    { id: "finance", label: "Revenue & Collections", icon: <Receipt className="w-4 h-4" /> },
    { id: "expenses", label: "Expenses & Cost", icon: <Wallet className="w-4 h-4" /> },
    { id: "projects", label: "Project Profitability", icon: <FolderKanban className="w-4 h-4" /> },
    { id: "procurement", label: "Procurement", icon: <Truck className="w-4 h-4" /> },
    { id: "inventory", label: "Inventory Valuation", icon: <Package className="w-4 h-4" /> },
    { id: "tax", label: "GST & Tax Summary", icon: <FileText className="w-4 h-4" /> },
    { id: "catalog", label: "Official Reports Catalog", icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 pb-12 print:space-y-4 print:pb-0">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs print:border-none print:shadow-none print:p-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Reports &amp; Exports
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Financial P&L statements, lead conversion ROI, project margins — generate PDF or CSV exports
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter & Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          {/* Period Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            {(["this_month", "last_month", "this_quarter", "this_year", "custom"] as DatePeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  if (p === "custom") setShowCustomModal(true);
                }}
                className={`px-3 py-1.5 rounded-md transition-all capitalize ${
                  period === p
                    ? "bg-white text-slate-900 font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {p.replace("_", " ")}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTabData()}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* Section export dropdown — exports active tab's report */}
          <ExportButton
            reportKey={activeTab === "catalog" ? selectedCatalogKey : getExportKeyForTab(activeTab)}
            label="Export Section"
            filter={{
              period,
              startDate: customStart || undefined,
              endDate: customEnd || undefined,
            }}
          />

          {/* PDF report for active section */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePdfReport}
            disabled={isExporting}
            className="text-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            {isExporting ? "Generating..." : "Print PDF"}
          </Button>

          {/* Complete software data export */}
          <Button
            size="sm"
            onClick={() => setShowExportModal(true)}
            className="text-xs bg-slate-900 text-white hover:bg-slate-800 border-slate-900 flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5" />
            Complete Export
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 flex items-center gap-1 overflow-x-auto scrollbar-none print:hidden">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Background Revalidation Indicator */}
      {isBackgroundRefreshing && (
        <div className="w-full bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs text-emerald-700 animate-pulse">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Updating real-time analytics in background...</span>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          {/* Top KPI Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 bg-slate-200 rounded"></div>
                  <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
                </div>
                <div className="h-7 w-32 bg-slate-200 rounded"></div>
                <div className="h-3 w-20 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>

          {/* Charts Row Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <div className="h-5 w-48 bg-slate-200 rounded"></div>
              <div className="h-64 bg-slate-100 rounded-lg"></div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <div className="h-5 w-36 bg-slate-200 rounded"></div>
              <div className="h-64 bg-slate-100 rounded-lg"></div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
          <h3 className="text-sm font-bold">Analytics Calculation Error</h3>
          <p className="text-xs mt-1 text-rose-600">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchTabData(true)} className="mt-4">
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === "overview" && executiveData && (
            <div className="space-y-6">
              {/* Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Billed Revenue
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <Receipt className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
                      {formatCurrency(executiveData.kpis?.revenue?.current || 0)}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] mt-1 text-emerald-700 font-medium">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Invoiced GST Sales</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Cash Collections
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
                      {formatCurrency(executiveData.kpis?.collections?.current || 0)}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] mt-1 text-blue-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Verified Realized Inflows</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Total Expenses
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
                      {formatCurrency(executiveData.kpis?.expenses?.current || 0)}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] mt-1 text-amber-700 font-medium">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      <span>Project &amp; Operational Outflows</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Net Profit &amp; Margin
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
                      {formatCurrency(executiveData.kpis?.profit?.current || 0)}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] mt-1 text-purple-700 font-medium">
                      <span>Margin: {executiveData.kpis?.profitMargin || "0.0%"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Ownership Section (Refined Executive Matrix) */}
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold tracking-wider uppercase text-slate-800">
                      Leadership KPI Ownership Matrix
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    ESPACIO Governance Standards
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Lead Conversion Target</div>
                    <div className="text-sm font-bold mt-1 text-slate-900">Raju (Sales Head)</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Current: <strong className="text-emerald-700">{executiveData.salesSummary?.winRate || "0%"}</strong> conversion rate
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Marketing ROI &amp; Channel Efficiency</div>
                    <div className="text-sm font-bold mt-1 text-slate-900">Soheb (Growth Lead)</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Targeting <strong className="text-blue-700">5x+</strong> closed value on paid channels
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Project Net Gross Margin</div>
                    <div className="text-sm font-bold mt-1 text-slate-900">Aahil &amp; Hassan (Finance)</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Active Margin: <strong className="text-purple-700">{executiveData.kpis?.profitMargin || "0.0%"}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Trend Visual Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Monthly Inflow vs Outflow Trends
                  </h3>
                  <div className="space-y-4">
                    {(executiveData.monthlyTrends || []).slice(-6).map((month: any, idx: number) => {
                      const maxVal = Math.max(
                        ...executiveData.monthlyTrends.map((m: any) => Math.max(m.revenue || 0, m.expenses || 0)),
                        1
                      );
                      const revPct = Math.min(100, Math.round(((month.revenue || 0) / maxVal) * 100));
                      const expPct = Math.min(100, Math.round(((month.expenses || 0) / maxVal) * 100));

                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-700 font-semibold">{month.month}</span>
                            <span className="text-slate-500 tabular-nums">
                              Rev: {formatCurrency(month.revenue || 0)} | Exp: {formatCurrency(month.expenses || 0)}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${revPct}%` }}
                              />
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${expPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-blue-600" />
                    Active Project Execution &amp; Receivables
                  </h3>
                  <div className="space-y-2.5">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">Active Executing Projects</span>
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        {executiveData.projectSummary?.activeProjects || 0}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">Completed Projects</span>
                      <span className="text-sm font-bold text-emerald-600 tabular-nums">
                        {executiveData.projectSummary?.completedProjects || 0}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">Total Outstanding Client Receivables</span>
                      <span className="text-sm font-bold text-amber-600 tabular-nums">
                        {formatCurrency(executiveData.financialSummary?.totalOutstanding || 0)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">Overdue Balances</span>
                      <span className="text-sm font-bold text-rose-600 tabular-nums">
                        {formatCurrency(executiveData.financialSummary?.totalOverdue || 0)}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: SALES & CRM (Includes Lead Source ROI Tracking) */}
          {activeTab === "sales" && leadData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Leads</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                    {leadData.totalLeads || 0}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Won Projects</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-2 tabular-nums">
                    {leadData.wonLeads || 0}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Win Conversion Rate</div>
                  <div className="text-2xl font-bold text-blue-600 mt-2 tabular-nums">
                    {leadData.conversionRate || "0%"}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Pipeline Value</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                    {formatCurrency(leadData.pipelineValue || 0)}
                  </div>
                </div>
              </div>

              {/* Lead Source ROI Matrix */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Lead Source ROI Tracking (Marketing Spend vs Closed Value)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Analyzes channel effectiveness, cost per lead, and revenue multiplier
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport("CSV", "sales_leads")}
                    className="text-xs"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Download CSV
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase">
                      <tr>
                        <th className="p-3">Source Channel</th>
                        <th className="p-3 text-right">Total Leads</th>
                        <th className="p-3 text-right">Won Leads</th>
                        <th className="p-3 text-right">Conversion %</th>
                        <th className="p-3 text-right">Est. Pipeline Value</th>
                        <th className="p-3 text-right">Closed Revenue</th>
                        <th className="p-3 text-right">ROI Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(leadData.sourceRoi || leadData.sourceBreakdown || []).map((src: any, idx: number) => {
                        const winRate = src.total > 0 ? ((src.won / src.total) * 100).toFixed(1) : "0.0";
                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-semibold text-slate-800">{src.source || src.name}</td>
                            <td className="p-3 text-right tabular-nums">{src.total || src.count || 0}</td>
                            <td className="p-3 text-right tabular-nums font-bold text-emerald-600">
                              {src.won || 0}
                            </td>
                            <td className="p-3 text-right tabular-nums">{winRate}%</td>
                            <td className="p-3 text-right tabular-nums">{formatCurrency(src.estimatedValue || 0)}</td>
                            <td className="p-3 text-right tabular-nums font-bold text-slate-900">
                              {formatCurrency(src.closedRevenue || 0)}
                            </td>
                            <td className="p-3 text-right">
                              <Badge variant={Number(winRate) >= 20 ? "success" : "neutral"}>
                                {Number(winRate) >= 20 ? "High Yield" : "Standard"}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: REVENUE & COLLECTIONS */}
          {activeTab === "finance" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced (GST)</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                    {formatCurrency(revenueData?.totalInvoiced || 0)}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Realized Collections</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-2 tabular-nums">
                    {formatCurrency(collectionData?.totalCollected || 0)}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Total Outstanding</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                    {formatCurrency(collectionData?.totalOutstanding || 0)}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Collection Efficiency</div>
                  <div className="text-2xl font-bold text-blue-600 mt-2 tabular-nums">
                    {collectionData?.collectionEfficiency || "0%"}
                  </div>
                </div>
              </div>

              {/* Aging Buckets Breakdown */}
              {collectionData?.agingBuckets && (
                <Card className="p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Receivable Aging Buckets
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {collectionData.agingBuckets.map((b: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[11px] text-slate-500 font-semibold">{b.label}</div>
                        <div className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                          {formatCurrency(b.amount || 0)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{b.count || 0} invoices</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* TAB 4: EXPENSES & COST ANALYSIS */}
          {activeTab === "expenses" && expenseData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Expenses Incurred</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                    {formatCurrency(expenseData.totalExpenses || 0)}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Project Direct Expenses</div>
                  <div className="text-2xl font-bold text-amber-600 mt-2 tabular-nums">
                    {formatCurrency(expenseData.projectExpenses || 0)}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Business / Operational Expenses</div>
                  <div className="text-2xl font-bold text-purple-600 mt-2 tabular-nums">
                    {formatCurrency(expenseData.businessExpenses || 0)}
                  </div>
                </div>
              </div>

              {/* 8 Category Expense Breakdown */}
              <Card className="p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  Category Breakdown (Labour, Material, Fuel, Transport, Marketing, Office, Salary, Misc)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(expenseData.categoryBreakdown || []).map((cat: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-xs font-semibold text-slate-700 capitalize">
                        {cat.category || cat.categoryKey}
                      </div>
                      <div className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                        {formatCurrency(cat.amount || 0)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {cat.percentage ? `${cat.percentage}% of total` : `${cat.count || 0} entries`}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 5: PROJECT PROFITABILITY */}
          {activeTab === "projects" && profitabilityData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Contract Value</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                    {formatCurrency(profitabilityData.totalContractValue || 0)}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Direct Execution Cost</div>
                  <div className="text-2xl font-bold text-amber-600 mt-2 tabular-nums">
                    {formatCurrency(profitabilityData.totalCost || 0)}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Overall Gross Profit</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-2 tabular-nums">
                    {formatCurrency(profitabilityData.totalProfit || 0)}
                  </div>
                </div>
              </div>

              {/* Project Profitability Table */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Project Gross Profit &amp; Margin Matrix</h3>
                    <p className="text-xs text-slate-500">Contract value vs direct material/labour expenses</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport("CSV", "project_profitability")}
                    className="text-xs"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Export CSV
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase">
                      <tr>
                        <th className="p-3">Ref No</th>
                        <th className="p-3">Project Title</th>
                        <th className="p-3">Stage</th>
                        <th className="p-3 text-right">Contract Value</th>
                        <th className="p-3 text-right">Total Incurred Cost</th>
                        <th className="p-3 text-right">Net Profit</th>
                        <th className="p-3 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(profitabilityData.projects || []).map((p: any, idx: number) => {
                        const margin = p.profitMarginPct || (p.contractValue > 0 ? ((p.netProfit / p.contractValue) * 100).toFixed(1) : "0.0");
                        return (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="p-3 font-mono font-semibold text-slate-700">{p.referenceNo}</td>
                            <td className="p-3 font-medium text-slate-900">{p.title}</td>
                            <td className="p-3">
                              <Badge variant="neutral">{p.stage?.replace(/_/g, " ")}</Badge>
                            </td>
                            <td className="p-3 text-right tabular-nums font-medium">{formatCurrency(p.contractValue || 0)}</td>
                            <td className="p-3 text-right tabular-nums text-amber-700">{formatCurrency(p.totalExpenses || p.cost || 0)}</td>
                            <td className="p-3 text-right tabular-nums font-bold text-emerald-700">{formatCurrency(p.netProfit || 0)}</td>
                            <td className="p-3 text-right tabular-nums font-bold">
                              <span className={Number(margin) >= 25 ? "text-emerald-600" : "text-amber-600"}>
                                {margin}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 6: PROCUREMENT */}
          {activeTab === "procurement" && procurementData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Purchase Orders</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                    {procurementData.totalOrders || 0}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Total Procurement Spend</div>
                  <div className="text-2xl font-bold text-blue-600 mt-2 tabular-nums">
                    {formatCurrency(procurementData.totalSpend || 0)}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Pending Vendor Payables</div>
                  <div className="text-2xl font-bold text-amber-600 mt-2 tabular-nums">
                    {formatCurrency(procurementData.totalPayables || 0)}
                  </div>
                </div>
              </div>

              {/* Vendor Spend Table */}
              <Card className="p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Top Suppliers by Procurement Volume</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase">
                      <tr>
                        <th className="p-3">Vendor Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">PO Count</th>
                        <th className="p-3 text-right">Committed Value</th>
                        <th className="p-3 text-right">Outstanding Payable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(procurementData.topVendors || []).map((v: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="p-3 font-semibold text-slate-800">{v.name}</td>
                          <td className="p-3 text-slate-600">{v.categoryKey || "General Supplier"}</td>
                          <td className="p-3 text-right tabular-nums">{v.poCount || 0}</td>
                          <td className="p-3 text-right tabular-nums font-bold text-slate-900">
                            {formatCurrency(v.totalSpend || 0)}
                          </td>
                          <td className="p-3 text-right tabular-nums text-amber-600">
                            {formatCurrency(v.payable || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 7: INVENTORY VALUATION */}
          {activeTab === "inventory" && inventoryData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Catalog Materials</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
                    {inventoryData.totalMaterials || 0}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Estimated Stock Valuation</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-2 tabular-nums">
                    {formatCurrency(inventoryData.totalValuation || 0)}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                  <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Reorder Alert Items</div>
                  <div className="text-2xl font-bold text-rose-600 mt-2 tabular-nums">
                    {inventoryData.reorderItemsCount || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: GST & TAX SUMMARY */}
          {activeTab === "tax" && taxData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Taxable Sales Value</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                    {formatCurrency(taxData.taxableAmount || 0)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">CGST Total (9%)</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">
                    {formatCurrency(taxData.cgstAmount || 0)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">SGST Total (9%)</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">
                    {formatCurrency(taxData.sgstAmount || 0)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Total GST Tax Liability</div>
                  <div className="text-2xl font-bold text-purple-600 mt-1 font-mono">
                    {formatCurrency(taxData.totalTax || 0)}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 9: RAW CATALOG REPORT BROWSER */}
          {activeTab === "catalog" && (
            <div className="space-y-6">
              {/* Catalog selector bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <div className="text-xs font-semibold text-slate-900">Select Official Report:</div>
                  <FilterSelect
                    label="Official Report"
                    placeholder="Select Official Report"
                    value={selectedCatalogKey}
                    onChange={(val) => {
                      setSelectedCatalogKey(val);
                      if (val && val !== "__OTHERS__") fetchCatalogReport(val);
                    }}
                    options={catalogList.map((cat) => ({
                      value: cat.key,
                      label: `[${cat.category}] ${cat.name}`,
                    }))}
                    variant="slate"
                    size="sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search within report..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="text-xs bg-white border border-slate-300 rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900 w-48"
                    />
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport("CSV", selectedCatalogKey)}
                    disabled={isExporting}
                    className="text-xs"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport("JSON", selectedCatalogKey)}
                    disabled={isExporting}
                    className="text-xs"
                  >
                    JSON
                  </Button>
                </div>
              </div>

              {/* Live Rendered Table */}
              {isCatalogLoading ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-600">Generating live report table...</p>
                </div>
              ) : catalogReportData ? (
                <Card className="overflow-hidden">
                  <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{catalogReportData.reportName}</h3>
                      <p className="text-[11px] text-slate-500">
                        Period: {catalogReportData.period} • Total Records: {catalogReportData.totalRows}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 uppercase tracking-wider">
                        <tr>
                          {catalogReportData.columns.map((col: any) => (
                            <th key={col.key} className={`p-3 ${col.type === "currency" || col.type === "number" ? "text-right" : ""}`}>
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {catalogReportData.rows
                          .filter((row: any) => {
                            if (!catalogSearch) return true;
                            return Object.values(row).some((val) =>
                              String(val).toLowerCase().includes(catalogSearch.toLowerCase())
                            );
                          })
                          .map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              {catalogReportData.columns.map((col: any) => {
                                const val = row[col.key];
                                return (
                                  <td
                                    key={col.key}
                                    className={`p-3 font-medium ${
                                      col.type === "currency"
                                        ? "text-right font-mono text-slate-900"
                                        : col.type === "date"
                                        ? "font-mono text-slate-600"
                                        : "text-slate-800"
                                    }`}
                                  >
                                    {col.type === "currency" && typeof val === "number"
                                      ? formatCurrency(val)
                                      : val !== undefined && val !== null
                                      ? String(val)
                                      : "—"}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : null}
            </div>
          )}
        </>
      )}

      {/* Custom Date Range Modal */}
      <Modal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        title="Select Custom Analytics Date Range"
        maxWidth="sm"
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-md"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowCustomModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowCustomModal(false);
                fetchTabData();
              }}
              disabled={!customStart || !customEnd}
            >
              Apply Filter
            </Button>
          </div>
        </div>
      </Modal>

      {/* Complete Software Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
}
