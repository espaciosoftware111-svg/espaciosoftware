"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddExpenseModal } from "@/components/expenses/add-expense-modal";
import { ExpenseDetailsModal } from "@/components/expenses/expense-details-modal";
import { ExportButton } from "@/components/reports/export-button";
import { FilterSelect } from "@/components/ui/filter-select";
import { Search, Plus, FileText, Eye, TrendingUp, TrendingDown, Minus, Briefcase, Building2, User, Calendar, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ExpenseKpi {
  totalAllExpenses: number;
  totalExpenseCount: number;
  totalProjectExpenses: number;
  projectExpenseCount: number;
  totalMaterialExpenses: number;
  materialExpenseCount: number;
  totalBusinessExpenses: number;
  businessExpenseCount: number;
  thisMonthTotal: number;
  thisMonthCount: number;
  prevMonthTotal: number;
  monthDeltaPct: number;
  pendingApprovalCount: number;
  businessCategoryBreakdown?: {
    categoryKey: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
}

import { clientCache } from "@/lib/client-cache";

function ExpensesContent() {
  // Tabs & Filters
  const [activeTypeTab, setActiveTypeTab] = useState<"" | "PROJECT" | "MATERIAL" | "BUSINESS">("");
  const [isCurrentMonthFilter, setIsCurrentMonthFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const expensesCacheKey = `/api/v1/expenses?page=${page}&limit=20${activeTypeTab ? `&expenseType=${activeTypeTab}` : ""}${search ? `&search=${search}` : ""}${categoryFilter ? `&categoryKey=${categoryFilter}` : ""}${methodFilter ? `&paymentMethod=${methodFilter}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`;
  const initialExpensesCached = clientCache.getImmediate<any>(expensesCacheKey);
  const initialKpiCached = clientCache.getImmediate<any>("/api/v1/expenses/kpi");
  const initialCatCached = clientCache.getImmediate<any>("/api/v1/config/expenses");
  const initialPmCached = clientCache.getImmediate<any>("/api/v1/config/payments");

  const [expenses, setExpenses] = useState<any[]>(() => initialExpensesCached?.data || []);
  const [currentUser, setCurrentUser] = useState<{ accessLevel: string } | null>(null);
  const [kpi, setKpi] = useState<ExpenseKpi | null>(() => initialKpiCached?.data || null);
  const [categories, setCategories] = useState<any[]>(() => initialCatCached?.data?.categories || []);
  const [paymentMethods, setPaymentMethods] = useState<any[]>(() => initialPmCached?.data?.paymentMethods || []);
  const [isLoading, setIsLoading] = useState(!initialExpensesCached);
  const isMountedRef = React.useRef(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialType, setAddModalInitialType] = useState<"PROJECT" | "BUSINESS" | "MATERIAL" | "PERSONAL">("PROJECT");
  const [addModalProjectId, setAddModalProjectId] = useState<string | undefined>(undefined);
  const [addModalLeadId, setAddModalLeadId] = useState<string | undefined>(undefined);
  const searchParams = useSearchParams();
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Deep-linking from query parameters
  useEffect(() => {
    const id = searchParams.get("id");
    const action = searchParams.get("action");
    const projectId = searchParams.get("projectId");
    const leadId = searchParams.get("leadId");
    const type = searchParams.get("type");

    if (id) {
      setSelectedExpenseId(id);
      setIsDetailsModalOpen(true);
    }
    if (projectId) {
      setAddModalProjectId(projectId);
    }
    if (leadId) {
      setAddModalLeadId(leadId);
    }
    if (type && ["PROJECT", "BUSINESS", "MATERIAL", "PERSONAL"].includes(type)) {
      setAddModalInitialType(type as any);
    }
    if (action === "create") {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  const fetchCurrentUser = async () => {
    try {
      const json = await clientCache.fetchWithCache<any>("/api/v1/auth/me");
      if (json?.success && json.data) {
        setCurrentUser({ accessLevel: json.data.accessLevel });
      }
    } catch {
      // quiet handling
    }
  };

  const fetchKpi = async () => {
    try {
      const json = await clientCache.fetchWithCache<any>("/api/v1/expenses/kpi", {
        onBackgroundUpdate: (data) => {
          if (data?.success) setKpi(data.data);
        },
      });
      if (json?.success) setKpi(json.data);
    } catch {
      // quiet handling
    }
  };

  const fetchConfigs = async () => {
    try {
      fetchCurrentUser();
      fetchKpi();
      const [catJson, pmJson] = await Promise.all([
        clientCache.fetchWithCache<any>("/api/v1/config/expenses", {
          onBackgroundUpdate: (data) => {
            if (data?.success) setCategories(data.data.categories || []);
          },
        }),
        clientCache.fetchWithCache<any>("/api/v1/config/payments", {
          onBackgroundUpdate: (data) => {
            if (data?.success) setPaymentMethods(data.data.paymentMethods || []);
          },
        }),
      ]);
      if (catJson?.success) setCategories(catJson.data.categories || []);
      if (pmJson?.success) setPaymentMethods(pmJson.data.paymentMethods || []);
    } catch {
      // quiet handling
    }
  };

  const fetchExpenses = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(activeTypeTab ? { expenseType: activeTypeTab } : {}),
        ...(search ? { search } : {}),
        ...(categoryFilter ? { categoryKey: categoryFilter } : {}),
        ...(methodFilter ? { paymentMethod: methodFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(isCurrentMonthFilter ? { startDate: currentMonthStart, endDate: currentMonthEnd } : {}),
      });

      const url = `/api/v1/expenses?${queryParams.toString()}`;
      const json = await clientCache.fetchWithCache<any>(url, {
        onBackgroundUpdate: (data) => {
          if (data?.success) {
            setExpenses(data.data);
            if (data.meta) setTotalPages(data.meta.totalPages);
          }
        },
      });

      if (json?.success) {
        setExpenses(json.data);
        if (json.meta) setTotalPages(json.meta.totalPages);
      }
    } catch {
      // quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      fetchExpenses(!!initialExpensesCached);
      return;
    }
    fetchExpenses(false);
  }, [page, activeTypeTab, categoryFilter, methodFilter, statusFilter, isCurrentMonthFilter]);

  useEffect(() => {
    if (!isMountedRef.current) return;
    const timer = setTimeout(() => {
      setPage(1);
      fetchExpenses(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleApprove = async (expenseId: string) => {
    try {
      const res = await fetch(`/api/v1/expenses/${expenseId}/approve`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        fetchExpenses();
        fetchKpi();
      }
    } catch {
      // quiet handling
    }
  };

  const columns = [
    {
      header: "Expense ID",
      accessorKey: "referenceNo" as const,
      cell: (row: any) => (
        <button
          onClick={() => {
            setSelectedExpenseId(row.id);
            setIsDetailsModalOpen(true);
          }}
          className="font-mono text-xs font-bold text-slate-900 hover:text-emerald-700 hover:underline cursor-pointer text-left"
        >
          {row.referenceNo}
        </button>
      ),
    },
    {
      header: "Type & Category",
      accessorKey: "categoryKey" as const,
      cell: (row: any) => (
        <div>
          <span className="font-semibold text-slate-900 block leading-tight">{(row.categoryKey || "GENERAL").replace(/_/g, " ")}</span>
          <Badge variant={row.expenseType === "PROJECT" ? "active" : row.expenseType === "MATERIAL" || row.expenseType === "PERSONAL" ? "completed" : "pending"}>
            {row.expenseType === "MATERIAL" ? "MATERIAL / PERSON" : row.expenseType}
          </Badge>
        </div>
      ),
    },
    {
      header: "Description / Linked Entity",
      accessorKey: "description" as const,
      cell: (row: any) => (
        <div>
          <span className="font-semibold text-slate-900 block leading-tight">{row.description}</span>
          {row.lead ? (
            <Link
              href={`/leads?id=${row.lead.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-amber-900 font-semibold bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1 mt-0.5 hover:underline transition-colors"
            >
              Person: {row.lead.clientName} ({row.lead.referenceNo}) ↗
            </Link>
          ) : row.project ? (
            <Link
              href={`/projects?id=${row.project.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-purple-900 font-semibold bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 inline-flex items-center gap-1 mt-0.5 hover:underline transition-colors font-mono"
            >
              {row.project.referenceNo} — {row.project.title} ↗
            </Link>
          ) : row.employee ? (
            <Link
              href={`/finance/petty-cash?employeeId=${row.employee.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-violet-800 font-semibold bg-violet-50 hover:bg-violet-100 px-1.5 py-0.5 rounded border border-violet-200 inline-flex items-center gap-1 mt-0.5 hover:underline transition-colors"
            >
              Custodian: {row.employee.fullName} ↗
            </Link>
          ) : (
            <span className="text-[10px] text-slate-400 block mt-0.5">Business Overhead</span>
          )}
        </div>
      ),
    },
    {
      header: "Vendor & Ref",
      accessorKey: "vendorName" as const,
      cell: (row: any) => (
        <div>
          <span className="text-xs text-slate-800 block">{row.vendorName || "N/A"}</span>
          {row.referenceNoExternal && <span className="text-[10px] text-slate-400 font-mono">Ref: {row.referenceNoExternal}</span>}
        </div>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount" as const,
      isNumeric: true,
      cell: (row: any) => (
        <span className="tabular-nums font-bold text-slate-900 text-xs">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (row: any) => {
        const statusStr = row.status || "DRAFT";
        const variant =
          statusStr === "APPROVED" || statusStr === "PAID"
            ? "completed"
            : statusStr === "SUBMITTED" || statusStr === "DRAFT"
            ? "pending"
            : "danger";
        return <Badge variant={variant}>{statusStr === "SUBMITTED" ? "Pending Approval" : statusStr.replace(/_/g, " ")}</Badge>;
      },
    },
    {
      header: "Actions",
      accessorKey: "id" as const,
      cell: (row: any) => {
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => {
                setSelectedExpenseId(row.id);
                setIsDetailsModalOpen(true);
              }}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              title="View Expense Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            {currentUser?.accessLevel === "ADMIN" && row.status === "SUBMITTED" && (
              <Button size="sm" variant="primary" onClick={() => handleApprove(row.id)}>
                Approve
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E8E2D8]">
        <div>
          <h1 className="text-xl font-bold text-[#262421] tracking-tight">Expense Management</h1>
          <p className="text-xs text-[#77716A] mt-0.5">Authoritative financial outgoing ledger, project cost control & material expense tracking</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExportButton
            reportKey="finance_expenses"
            label="Export Expenses"
            size="sm"
          />
          <Link href="/finance/expenses/cost-sheets">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#262421] bg-[#FFFEFC] hover:bg-[#F3EEE5] border border-[#E8E2D8] rounded-xl transition-all shadow-2xs cursor-pointer">
              <FileText className="w-3.5 h-3.5 text-[#77716A]" />
              <span>Project Cost Sheets</span>
            </button>
          </Link>
          <button
            onClick={() => {
              setAddModalInitialType("BUSINESS");
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#89652D] bg-[#F8EBD5]/60 hover:bg-[#F8EBD5] border border-[#DFD4C3] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5 text-[#89652D]" />
            <span>Add Business Expense</span>
          </button>
          <button
            onClick={() => {
              setAddModalInitialType("PROJECT");
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#FAF8F5] bg-[#242321] hover:bg-[#383633] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards — Dynamic Expense Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI CARD 1 — TOTAL EXPENSES */}
        <div
          onClick={() => {
            setActiveTypeTab("");
            setIsCurrentMonthFilter(false);
            setCategoryFilter("");
            setStatusFilter("");
            setPage(1);
          }}
          className={`rounded-xl border bg-[#FFFEFC] p-3.5 shadow-2xs cursor-pointer transition-all hover:border-[#B99558]/60 ${
            activeTypeTab === "" && !isCurrentMonthFilter && !statusFilter
              ? "border-[#B99558] ring-2 ring-[#B99558]/20 bg-[#FAF7F2]"
              : "border-[#E8E2D8]"
          }`}
          title="Click to view all expenses"
        >
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">TOTAL EXPENSES</p>
            <span className="rounded-lg bg-[#F3EEE5] p-1.5 text-[#77716A] border border-[#E8E2D8]">
              <FileText className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="mt-1 text-lg font-bold font-mono tabular-nums text-[#262421]">
            {kpi ? formatCurrency(kpi.totalAllExpenses) : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-[#77716A]">
            {kpi ? `${kpi.totalExpenseCount} total vouchers` : "Loading..."}
          </p>
        </div>

        {/* KPI CARD 2 — PROJECT EXPENSES */}
        <div
          onClick={() => {
            setActiveTypeTab("PROJECT");
            setIsCurrentMonthFilter(false);
            setPage(1);
          }}
          className={`rounded-xl border bg-[#FFFEFC] p-3.5 shadow-2xs cursor-pointer transition-all hover:border-[#B99558]/60 ${
            activeTypeTab === "PROJECT" && !isCurrentMonthFilter
              ? "border-[#B99558] ring-2 ring-[#B99558]/20 bg-[#FAF7F2]"
              : "border-[#E8E2D8]"
          }`}
          title="Click to filter Project expenses"
        >
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">PROJECT EXPENSES</p>
            <span className="rounded-lg bg-[#F3EEE5] p-1.5 text-[#89652D] border border-[#E8E2D8]">
              <Building2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="mt-1 text-lg font-bold font-mono tabular-nums text-[#262421]">
            {kpi ? formatCurrency(kpi.totalProjectExpenses) : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-[#77716A]">
            {kpi ? `${kpi.projectExpenseCount} project vouchers` : "—"}
          </p>
        </div>

        {/* KPI CARD 3 — MATERIAL / PERSONAL EXPENSES */}
        <div
          onClick={() => {
            setActiveTypeTab("MATERIAL");
            setIsCurrentMonthFilter(false);
            setPage(1);
          }}
          className={`rounded-xl border bg-[#FFFEFC] p-3.5 shadow-2xs cursor-pointer transition-all hover:border-[#B99558]/60 ${
            activeTypeTab === "MATERIAL" && !isCurrentMonthFilter
              ? "border-[#B99558] ring-2 ring-[#B99558]/20 bg-[#FAF7F2]"
              : "border-[#E8E2D8]"
          }`}
          title="Click to filter Material expenses"
        >
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">MATERIAL EXPENSES</p>
            <span className="rounded-lg bg-[#F3EEE5] p-1.5 text-[#89652D] border border-[#E8E2D8]">
              <User className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="mt-1 text-lg font-bold font-mono tabular-nums text-[#262421]">
            {kpi ? formatCurrency(kpi.totalMaterialExpenses) : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-[#77716A]">
            {kpi ? `${kpi.materialExpenseCount} material vouchers` : "—"}
          </p>
        </div>

        {/* KPI CARD 4 — BUSINESS EXPENSES */}
        <div
          onClick={() => {
            setActiveTypeTab("BUSINESS");
            setIsCurrentMonthFilter(false);
            setPage(1);
          }}
          className={`rounded-xl border bg-[#FFFEFC] p-3.5 shadow-2xs cursor-pointer transition-all hover:border-[#B99558]/60 ${
            activeTypeTab === "BUSINESS" && !isCurrentMonthFilter
              ? "border-[#B99558] ring-2 ring-[#B99558]/20 bg-[#FAF7F2]"
              : "border-[#E8E2D8]"
          }`}
          title="Click to filter Business Overhead expenses"
        >
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">BUSINESS EXPENSES</p>
            <span className="rounded-lg bg-[#F3EEE5] p-1.5 text-[#262421] border border-[#E8E2D8]">
              <Briefcase className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="mt-1 text-lg font-bold font-mono tabular-nums text-[#262421]">
            {kpi ? formatCurrency(kpi.totalBusinessExpenses) : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-[#77716A]">
            {kpi ? `${kpi.businessExpenseCount} business vouchers` : "—"}
          </p>
        </div>

        {/* KPI CARD 5 — THIS MONTH'S EXPENSES */}
        <div
          onClick={() => {
            setIsCurrentMonthFilter((prev) => !prev);
            setPage(1);
          }}
          className={`rounded-xl border bg-[#FFFEFC] p-3.5 shadow-2xs cursor-pointer transition-all hover:border-[#B99558]/60 ${
            isCurrentMonthFilter
              ? "border-[#536B4E] ring-2 ring-[#536B4E]/20 bg-[#FAF7F2]"
              : "border-[#E8E2D8]"
          }`}
          title="Click to filter expenses for the current month"
        >
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">THIS MONTH</p>
            <span className="rounded-lg bg-[#F3EEE5] p-1.5 text-[#536B4E] border border-[#E8E2D8]">
              <Calendar className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="mt-1 text-lg font-bold font-mono tabular-nums text-[#262421]">
            {kpi ? formatCurrency(kpi.thisMonthTotal) : "—"}
          </p>
          {kpi && (
            <div className="mt-0.5 flex items-center gap-1 text-[11px]">
              {kpi.monthDeltaPct > 0 ? (
                <TrendingUp className="w-3 h-3 text-[#A45435]" />
              ) : kpi.monthDeltaPct < 0 ? (
                <TrendingDown className="w-3 h-3 text-[#536B4E]" />
              ) : (
                <Minus className="w-3 h-3 text-[#77716A]" />
              )}
              <span className={kpi.monthDeltaPct > 0 ? "text-[#A45435] font-semibold" : kpi.monthDeltaPct < 0 ? "text-[#536B4E] font-semibold" : "text-[#77716A]"}>
                {kpi.monthDeltaPct > 0 ? "+" : ""}{kpi.monthDeltaPct}% vs last mo
              </span>
            </div>
          )}
        </div>

        {/* OPTIONAL KPI CARD 6 — TOTAL EXPENSE RECORDS */}
        <div
          onClick={() => {
            setActiveTypeTab("");
            setIsCurrentMonthFilter(false);
            setCategoryFilter("");
            setStatusFilter(statusFilter === "SUBMITTED" ? "" : "SUBMITTED");
            setPage(1);
          }}
          className={`rounded-xl border bg-[#FFFEFC] p-3.5 shadow-2xs cursor-pointer transition-all hover:border-[#B99558]/60 ${
            statusFilter === "SUBMITTED" ? "border-[#89652D] ring-2 ring-[#89652D]/20 bg-[#FAF7F2]" : "border-[#E8E2D8]"
          }`}
          title="Click to toggle Pending Approval filter or view total records"
        >
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">RECORDS</p>
            <span className="rounded-lg bg-[#F3EEE5] p-1.5 text-[#89652D] border border-[#E8E2D8]">
              <Receipt className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="mt-1 text-lg font-bold font-mono tabular-nums text-[#262421]">
            {kpi !== null ? kpi.totalExpenseCount : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-[#89652D] font-medium">
            {kpi && kpi.pendingApprovalCount > 0 ? `${kpi.pendingApprovalCount} pending review` : "All vouchers"}
          </p>
        </div>
      </div>

      {/* Segmented Type Filter Tabs & Active Current Month Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#F3EEE5] rounded-xl border border-[#E8E2D8] text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTypeTab("");
              setIsCurrentMonthFilter(false);
            }}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTypeTab === "" && !isCurrentMonthFilter ? "bg-[#FFFEFC] text-[#262421] font-bold shadow-2xs" : "text-[#77716A] hover:text-[#262421]"
            }`}
          >
            All Expenses
          </button>
          <button
            onClick={() => setActiveTypeTab("PROJECT")}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTypeTab === "PROJECT" ? "bg-[#FFFEFC] text-[#262421] font-bold shadow-2xs" : "text-[#77716A] hover:text-[#262421]"
            }`}
          >
            Project Expenses
          </button>
          <button
            onClick={() => setActiveTypeTab("MATERIAL")}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTypeTab === "MATERIAL" ? "bg-[#FFFEFC] text-[#262421] font-bold shadow-2xs" : "text-[#77716A] hover:text-[#262421]"
            }`}
          >
            Material / Person
          </button>
          <button
            onClick={() => setActiveTypeTab("BUSINESS")}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTypeTab === "BUSINESS" ? "bg-[#FFFEFC] text-[#262421] font-bold shadow-2xs" : "text-[#77716A] hover:text-[#262421]"
            }`}
          >
            Business Overhead
          </button>
        </div>

        {isCurrentMonthFilter && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#F8EBD5] border border-[#DFD4C3] text-xs font-semibold text-[#89652D]">
            <Calendar className="w-3.5 h-3.5 text-[#89652D]" />
            <span>Filtered by: Current Month</span>
            <button
              onClick={() => setIsCurrentMonthFilter(false)}
              className="ml-1 text-[#262421] font-bold hover:underline cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Category-Wise Breakdown for Business Expenses */}
      {activeTypeTab === "BUSINESS" && kpi?.businessCategoryBreakdown && kpi.businessCategoryBreakdown.length > 0 && (
        <div className="p-4 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#89652D]" />
              <h3 className="text-xs font-bold text-[#262421] uppercase tracking-wider">
                Business Expenses by Category
              </h3>
              <span className="text-[11px] text-[#77716A]">
                ({kpi.businessCategoryBreakdown.length} active categories)
              </span>
            </div>
            {categoryFilter && (
              <button
                onClick={() => setCategoryFilter("")}
                className="text-xs text-[#89652D] hover:text-[#262421] font-medium underline cursor-pointer"
              >
                Clear Category Filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {kpi.businessCategoryBreakdown.map((cat) => {
              const isSelected = categoryFilter === cat.categoryKey;
              return (
                <div
                  key={cat.categoryKey}
                  onClick={() => {
                    setCategoryFilter(isSelected ? "" : cat.categoryKey);
                    setPage(1);
                  }}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#FAF7F2] border-[#B99558] ring-1 ring-[#B99558] shadow-2xs"
                      : "bg-[#F8F6F1] border-[#E8E2D8] hover:bg-[#FAF7F2] hover:border-[#DFD4C3]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold text-[#262421] truncate" title={cat.categoryKey.replace(/_/g, " ")}>
                      {cat.categoryKey.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-[#77716A] tabular-nums shrink-0">
                      {cat.count}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xs font-bold text-[#262421] font-mono tabular-nums">
                      {formatCurrency(cat.amount)}
                    </span>
                    <span className="text-[10px] font-semibold text-[#89652D] tabular-nums">
                      {cat.percentage}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full bg-[#E8E2D8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#89652D] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#77716A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Expense ID, Description, Vendor, Bill Ref, Project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-[#F8F6F1] border border-[#E8E2D8] rounded-lg focus:outline-none focus:border-[#B99558] focus:bg-[#FFFEFC] text-[#262421] placeholder:text-[#77716A]/70 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <FilterSelect
            label="Category"
            placeholder="All Categories"
            value={categoryFilter}
            onChange={(val) => {
              setCategoryFilter(val);
              setPage(1);
            }}
            options={categories.map((c) => ({
              value: c.key,
              label: c.name,
            }))}
            variant="beige"
            size="md"
          />

          <FilterSelect
            label="Payment Method"
            placeholder="All Payment Methods"
            value={methodFilter}
            onChange={(val) => {
              setMethodFilter(val);
              setPage(1);
            }}
            options={paymentMethods.map((pm) => ({
              value: pm.key,
              label: pm.name,
            }))}
            variant="beige"
            size="md"
          />

          <FilterSelect
            label="Status"
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={[
              { value: "APPROVED", label: "Approved" },
              { value: "SUBMITTED", label: "Submitted (Pending)" },
              { value: "REJECTED", label: "Rejected" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
            variant="beige"
            size="md"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl overflow-hidden shadow-2xs">
        <DataTable
          columns={columns}
          data={expenses}
          keyExtractor={(r) => r.id}
          isLoading={isLoading}
          emptyText="No expense records match criteria."
          emptySubtext="Use 'Record Expense' button to log financial outgoing entries."
        />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-[#77716A] pt-1">
        <span>Showing Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="px-3 py-1.5 text-xs font-semibold text-[#262421] bg-[#FFFEFC] hover:bg-[#F3EEE5] border border-[#E8E2D8] rounded-lg transition-all shadow-2xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="px-3 py-1.5 text-xs font-semibold text-[#262421] bg-[#FFFEFC] hover:bg-[#F3EEE5] border border-[#E8E2D8] rounded-lg transition-all shadow-2xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        initialExpenseType={addModalInitialType}
        initialProjectId={addModalProjectId}
        initialLeadId={addModalLeadId}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddModalInitialType("PROJECT");
          setAddModalProjectId(undefined);
          setAddModalLeadId(undefined);
        }}
        onSuccess={() => {
          fetchExpenses();
          fetchKpi();
        }}
      />

      {/* Expense Details Modal */}
      {isDetailsModalOpen && selectedExpenseId && (
        <ExpenseDetailsModal
          isOpen={isDetailsModalOpen}
          expenseId={selectedExpenseId}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedExpenseId(null);
          }}
          onUpdate={() => {
            fetchExpenses();
            fetchKpi();
          }}
        />
      )}
    </div>
  );
}

export default function ExpensesDatabasePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Expense Operations...</div>}>
      <ExpensesContent />
    </Suspense>
  );
}
