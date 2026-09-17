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

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [executiveData, setExecutiveData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [collectionData, setCollectionData] = useState<any>(null);
  const [expenseData, setExpenseData] = useState<any>(null);
  const [profitabilityData, setProfitabilityData] = useState<any>(null);
  const [leadData, setLeadData] = useState<any>(null);
  const [procurementData, setProcurementData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [taxData, setTaxData] = useState<any>(null);

  // Catalog Report generation state
  const [catalogList, setCatalogList] = useState<any[]>([]);
  const [selectedCatalogKey, setSelectedCatalogKey] = useState<string>("sales_leads");
  const [catalogReportData, setCatalogReportData] = useState<any>(null);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  const fetchCatalogReport = useCallback(async (reportKey: string) => {
    setIsCatalogLoading(true);
    try {
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
      if (json.success) {
        setCatalogReportData(json.data);
      } else {
        setError(json.error?.message || "Failed to generate catalog report");
      }
    } catch (err: any) {
      setError(err.message || "Error generating report");
    } finally {
      setIsCatalogLoading(false);
    }
  }, [period, customStart, customEnd]);

  // Fetch report data according to active tab and period
  const fetchTabData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("period", period);
      if (period === "custom" && customStart && customEnd) {
        params.set("startDate", customStart);
        params.set("endDate", customEnd);
      }

      if (activeTab === "overview") {
        const res = await fetch(`/api/v1/analytics/dashboard?${params.toString()}`);
        const json = await res.json();
        if (json.success) setExecutiveData(json.data);
      } else if (activeTab === "sales") {
        const res = await fetch(`/api/v1/analytics/sales?${params.toString()}`);
        const json = await res.json();
        if (json.success) setLeadData(json.data);
      } else if (activeTab === "finance") {
        const [revRes, colRes] = await Promise.all([
          fetch(`/api/v1/analytics/revenue?${params.toString()}`),
          fetch(`/api/v1/analytics/collections?${params.toString()}`),
        ]);
        const revJson = await revRes.json();
        const colJson = await colRes.json();
        if (revJson.success) setRevenueData(revJson.data);
        if (colJson.success) setCollectionData(colJson.data);
      } else if (activeTab === "expenses") {
        const res = await fetch(`/api/v1/analytics/expenses?${params.toString()}`);
        const json = await res.json();
        if (json.success) setExpenseData(json.data);
      } else if (activeTab === "projects") {
        const res = await fetch(`/api/v1/analytics/profitability?${params.toString()}`);
        const json = await res.json();
        if (json.success) setProfitabilityData(json.data);
      } else if (activeTab === "procurement") {
        const res = await fetch(`/api/v1/analytics/procurement?${params.toString()}`);
        const json = await res.json();
        if (json.success) setProcurementData(json.data);
      } else if (activeTab === "inventory") {
        const res = await fetch(`/api/v1/analytics/inventory`);
        const json = await res.json();
        if (json.success) setInventoryData(json.data);
      } else if (activeTab === "tax") {
        const res = await fetch(`/api/v1/analytics/gst?${params.toString()}`);
        const json = await res.json();
        if (json.success) setTaxData(json.data);
      } else if (activeTab === "catalog") {
        fetchCatalogReport(selectedCatalogKey);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load report analytics");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, period, customStart, customEnd, selectedCatalogKey, fetchCatalogReport]);

  const fetchCatalogList = async () => {
    try {
      const res = await fetch("/api/v1/reports/catalog");
      const json = await res.json();
      if (json.success) {
        setCatalogList(json.data || []);
      }
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
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2 print:hidden scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs font-semibold"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-900">Computing real-time analytics...</p>
          <p className="text-xs text-slate-500 mt-1">Aggregating transactional records and financial summaries</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <h3 className="text-sm font-bold">Analytics Calculation Error</h3>
          <p className="text-xs mt-1 text-red-600">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchTabData()} className="mt-4">
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
                <Card className="p-4 border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Billed Revenue</span>
                    <Receipt className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
                    {formatCurrency(executiveData.kpis?.revenue?.current || 0)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] mt-2 text-emerald-600 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Invoiced GST Sales</span>
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Cash Collections</span>
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
                    {formatCurrency(executiveData.kpis?.collections?.current || 0)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] mt-2 text-blue-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Realized Inflows</span>
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-amber-500">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Total Expenses</span>
                    <Wallet className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
                    {formatCurrency(executiveData.kpis?.expenses?.current || 0)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] mt-2 text-amber-600 font-semibold">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Project & Operational Outflows</span>
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-purple-500">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Net Profit & Margin</span>
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
                    {formatCurrency(executiveData.kpis?.profit?.current || 0)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] mt-2 text-purple-600 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Margin: {executiveData.kpis?.profitMargin || "0.0%"}</span>
                  </div>
                </Card>
              </div>

              {/* KPI Ownership Section (Roadmap requirement) */}
              <Card className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
                      Leadership KPI Ownership Matrix
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">ESPACIO Governance Standards</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                    <div className="text-[11px] text-emerald-400 font-bold uppercase">Lead Conversion Target</div>
                    <div className="text-lg font-bold mt-1 text-white">Raju (Sales Head)</div>
                    <div className="text-xs text-slate-300 mt-1">
                      Current: <span className="font-bold text-emerald-300">{executiveData.salesSummary?.winRate || "0%"}</span> conversion rate
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                    <div className="text-[11px] text-blue-400 font-bold uppercase">Marketing ROI & Channel Efficiency</div>
                    <div className="text-lg font-bold mt-1 text-white">Soheb (Growth Lead)</div>
                    <div className="text-xs text-slate-300 mt-1">
                      Targeting <span className="font-bold text-blue-300">5x+</span> closed value on paid channels
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                    <div className="text-[11px] text-purple-400 font-bold uppercase">Project Net Gross Margin</div>
                    <div className="text-lg font-bold mt-1 text-white">Aahil & Hassan (Finance)</div>
                    <div className="text-xs text-slate-300 mt-1">
                      Active Margin: <span className="font-bold text-purple-300">{executiveData.kpis?.profitMargin || "0.0%"}</span>
                    </div>
                  </div>
                </div>
              </Card>

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
                            <span className="text-slate-500 font-mono">
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
                    Active Project Execution & Receivables
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">Active Executing Projects</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {executiveData.projectSummary?.activeProjects || 0}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">Completed Projects</span>
                      <span className="text-sm font-bold text-emerald-600 font-mono">
                        {executiveData.projectSummary?.completedProjects || 0}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">Total Outstanding Client Receivables</span>
                      <span className="text-sm font-bold text-amber-600 font-mono">
                        {formatCurrency(executiveData.financialSummary?.totalOutstanding || 0)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">Overdue Balances</span>
                      <span className="text-sm font-bold text-red-600 font-mono">
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
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Total Leads</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                    {leadData.totalLeads || 0}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Won Projects</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                    {leadData.wonLeads || 0}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Win Conversion Rate</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">
                    {leadData.conversionRate || "0%"}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Total Pipeline Value</div>
                  <div className="text-2xl font-bold text-purple-600 mt-1 font-mono">
                    {formatCurrency(leadData.pipelineValue || 0)}
                  </div>
                </Card>
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
                            <td className="p-3 text-right font-mono">{src.total || src.count || 0}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-600">
                              {src.won || 0}
                            </td>
                            <td className="p-3 text-right font-mono">{winRate}%</td>
                            <td className="p-3 text-right font-mono">{formatCurrency(src.estimatedValue || 0)}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
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
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Total Invoiced (GST)</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                    {formatCurrency(revenueData?.totalInvoiced || 0)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Realized Collections</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                    {formatCurrency(collectionData?.totalCollected || 0)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Total Outstanding</div>
                  <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
                    {formatCurrency(collectionData?.totalOutstanding || 0)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Collection Efficiency</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">
                    {collectionData?.collectionEfficiency || "0%"}
                  </div>
                </Card>
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
                        <div className="text-base font-bold text-slate-900 mt-1 font-mono">
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
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Total Expenses Incurred</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                    {formatCurrency(expenseData.totalExpenses || 0)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Project Direct Expenses</div>
                  <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
                    {formatCurrency(expenseData.projectExpenses || 0)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Business / Operational Expenses</div>
                  <div className="text-2xl font-bold text-purple-600 mt-1 font-mono">
                    {formatCurrency(expenseData.businessExpenses || 0)}
                  </div>
                </Card>
              </div>

              {/* 8 Category Expense Breakdown (Roadmap Requirement) */}
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
                      <div className="text-base font-bold text-slate-900 mt-1 font-mono">
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
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Total Contract Value</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                    {formatCurrency(profitabilityData.totalContractValue || 0)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Direct Execution Cost</div>
                  <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
                    {formatCurrency(profitabilityData.totalCost || 0)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Overall Gross Profit</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                    {formatCurrency(profitabilityData.totalProfit || 0)}
                  </div>
                </Card>
              </div>

              {/* Project Profitability Table */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Project Gross Profit & Margin Matrix</h3>
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
                            <td className="p-3 text-right font-mono font-medium">{formatCurrency(p.contractValue || 0)}</td>
                            <td className="p-3 text-right font-mono text-amber-700">{formatCurrency(p.totalExpenses || p.cost || 0)}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(p.netProfit || 0)}</td>
                            <td className="p-3 text-right font-mono font-bold">
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
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Total Purchase Orders</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                    {procurementData.totalOrders || 0}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Total Procurement Spend</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1 font-mono">
                    {formatCurrency(procurementData.totalSpend || 0)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Pending Vendor Payables</div>
                  <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
                    {formatCurrency(procurementData.totalPayables || 0)}
                  </div>
                </Card>
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
                          <td className="p-3 text-right font-mono">{v.poCount || 0}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(v.totalSpend || 0)}
                          </td>
                          <td className="p-3 text-right font-mono text-amber-600">
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
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Active Catalog Materials</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                    {inventoryData.totalMaterials || 0}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Estimated Stock Valuation</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                    {formatCurrency(inventoryData.totalValuation || 0)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-slate-500 font-medium">Reorder Alert Items</div>
                  <div className="text-2xl font-bold text-red-600 mt-1 font-mono">
                    {inventoryData.reorderItemsCount || 0}
                  </div>
                </Card>
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
