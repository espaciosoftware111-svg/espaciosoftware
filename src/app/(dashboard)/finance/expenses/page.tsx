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

function ExpensesContent() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<{ accessLevel: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kpi, setKpi] = useState<ExpenseKpi | null>(null);

  // Tabs & Filters
  const [activeTypeTab, setActiveTypeTab] = useState<"" | "PROJECT" | "MATERIAL" | "BUSINESS">("");
  const [isCurrentMonthFilter, setIsCurrentMonthFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
      const res = await fetch("/api/v1/auth/me");
      const json = await res.json();
      if (json.success && json.data) {
        setCurrentUser({ accessLevel: json.data.accessLevel });
      }
    } catch {
      // quiet handling
    }
  };

  const fetchKpi = async () => {
    try {
      const res = await fetch("/api/v1/expenses/kpi");
      const json = await res.json();
      if (json.success) setKpi(json.data);
    } catch {
      // quiet handling
    }
  };

  const fetchConfigs = async () => {
    try {
      fetchCurrentUser();
      fetchKpi();
      const [catRes, pmRes] = await Promise.all([
        fetch("/api/v1/config/expenses"),
        fetch("/api/v1/config/payments"),
      ]);
      const catJson = await catRes.json();
      const pmJson = await pmRes.json();
      if (catJson.success) setCategories(catJson.data.categories || []);
      if (pmJson.success) setPaymentMethods(pmJson.data.paymentMethods || []);
    } catch {
      // quiet handling
    }
  };

  const fetchExpenses = async () => {
    setIsLoading(true);
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

      const res = await fetch(`/api/v1/expenses?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
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
    fetchExpenses();
  }, [page, activeTypeTab, categoryFilter, methodFilter, statusFilter, isCurrentMonthFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchExpenses();
    }, 300);
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
    <div className="space-y-5 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Expense Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Authoritative financial outgoing ledger, project cost control & material expense tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            reportKey="finance_expenses"
            label="Export Expenses"
            size="sm"
          />
          <Link href="/finance/expenses/cost-sheets">
            <Button variant="outline" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />}>
              Project Cost Sheets
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Briefcase className="w-3.5 h-3.5 text-violet-600" />}
            onClick={() => {
              setAddModalInitialType("BUSINESS");
              setIsAddModalOpen(true);
            }}
            className="border-violet-300 text-violet-800 hover:bg-violet-50 bg-white shadow-2xs"
          >
            + Add Business Expense
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              setAddModalInitialType("PROJECT");
              setIsAddModalOpen(true);
            }}
          >
            Record Expense
          </Button>
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
          className={`rounded-lg border bg-white p-4 shadow-sm cursor-pointer transition-all hover:shadow hover:border-slate-300 ${
            activeTypeTab === "" && !isCurrentMonthFilter && !statusFilter
              ? "border-slate-400 ring-2 ring-slate-400/20"
              : "border-slate-200"
          }`}
          title="Click to view all expenses"
        >
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">TOTAL EXPENSES</p>
            <span className="rounded-md bg-slate-100 p-1.5 text-slate-500">
              <FileText className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-slate-900">
            {kpi ? formatCurrency(kpi.totalAllExpenses) : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
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
          className={`rounded-lg border bg-blue-50/60 p-4 shadow-sm cursor-pointer transition-all hover:shadow hover:border-blue-300 ${
            activeTypeTab === "PROJECT" && !isCurrentMonthFilter
              ? "border-blue-400 ring-2 ring-blue-400/25"
              : "border-blue-100"
          }`}
          title="Click to filter Project expenses"
        >
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">PROJECT EXPENSES</p>
            <span className="rounded-md bg-blue-100/60 p-1.5 text-blue-600">
              <Building2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-blue-900">
            {kpi ? formatCurrency(kpi.totalProjectExpenses) : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-blue-400">
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
          className={`rounded-lg border bg-amber-50/60 p-4 shadow-sm cursor-pointer transition-all hover:shadow hover:border-amber-300 ${
            activeTypeTab === "MATERIAL" && !isCurrentMonthFilter
              ? "border-amber-400 ring-2 ring-amber-400/25"
              : "border-amber-100"
          }`}
          title="Click to filter Material expenses"
        >
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">MATERIAL EXPENSES</p>
            <span className="rounded-md bg-amber-100/60 p-1.5 text-amber-700">
              <User className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-amber-900">
            {kpi ? formatCurrency(kpi.totalMaterialExpenses) : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-amber-500">
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
          className={`rounded-lg border bg-violet-50/60 p-4 shadow-sm cursor-pointer transition-all hover:shadow hover:border-violet-300 ${
            activeTypeTab === "BUSINESS" && !isCurrentMonthFilter
              ? "border-violet-400 ring-2 ring-violet-400/25"
              : "border-violet-100"
          }`}
          title="Click to filter Business Overhead expenses"
        >
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-700">BUSINESS EXPENSES</p>
            <span className="rounded-md bg-violet-100/60 p-1.5 text-violet-700">
              <Briefcase className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-violet-900">
            {kpi ? formatCurrency(kpi.totalBusinessExpenses) : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-violet-400">
            {kpi ? `${kpi.businessExpenseCount} business vouchers` : "—"}
          </p>
        </div>

        {/* KPI CARD 5 — THIS MONTH'S EXPENSES */}
        <div
          onClick={() => {
            setIsCurrentMonthFilter((prev) => !prev);
            setPage(1);
          }}
          className={`rounded-lg border bg-emerald-50/60 p-4 shadow-sm cursor-pointer transition-all hover:shadow hover:border-emerald-300 ${
            isCurrentMonthFilter
              ? "border-emerald-500 ring-2 ring-emerald-500/25"
              : "border-emerald-100"
          }`}
          title="Click to filter expenses for the current month"
        >
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">THIS MONTH&apos;S EXPENSES</p>
            <span className="rounded-md bg-emerald-100/60 p-1.5 text-emerald-700">
              <Calendar className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-emerald-900">
            {kpi ? formatCurrency(kpi.thisMonthTotal) : "—"}
          </p>
          {kpi && (
            <div className="mt-0.5 flex items-center gap-1 text-[11px]">
              {kpi.monthDeltaPct > 0 ? (
                <TrendingUp className="w-3 h-3 text-rose-500" />
              ) : kpi.monthDeltaPct < 0 ? (
                <TrendingDown className="w-3 h-3 text-emerald-500" />
              ) : (
                <Minus className="w-3 h-3 text-slate-400" />
              )}
              <span className={kpi.monthDeltaPct > 0 ? "text-rose-600 font-semibold" : kpi.monthDeltaPct < 0 ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                {kpi.monthDeltaPct > 0 ? "+" : ""}{kpi.monthDeltaPct}% vs last month
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
          className={`rounded-lg border bg-orange-50/60 p-4 shadow-sm cursor-pointer transition-all hover:shadow hover:border-orange-300 ${
            statusFilter === "SUBMITTED" ? "border-orange-400 ring-2 ring-orange-400/25" : "border-orange-100"
          }`}
          title="Click to toggle Pending Approval filter or view total records"
        >
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-700">TOTAL EXPENSE RECORDS</p>
            <span className="rounded-md bg-orange-100/60 p-1.5 text-orange-700">
              <Receipt className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-orange-900">
            {kpi !== null ? kpi.totalExpenseCount : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-orange-600 font-medium">
            {kpi && kpi.pendingApprovalCount > 0 ? `${kpi.pendingApprovalCount} pending review` : "All unique records"}
          </p>
        </div>
      </div>

      {/* Segmented Type Filter Tabs & Active Current Month Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg w-fit border border-slate-200 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTypeTab("");
              setIsCurrentMonthFilter(false);
            }}
            className={`px-4 py-1.5 rounded-md transition-colors ${
              activeTypeTab === "" && !isCurrentMonthFilter ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Expenses
          </button>
          <button
            onClick={() => setActiveTypeTab("PROJECT")}
            className={`px-4 py-1.5 rounded-md transition-colors ${
              activeTypeTab === "PROJECT" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Project Expenses
          </button>
          <button
            onClick={() => setActiveTypeTab("MATERIAL")}
            className={`px-4 py-1.5 rounded-md transition-colors ${
              activeTypeTab === "MATERIAL" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Material / Person
          </button>
          <button
            onClick={() => setActiveTypeTab("BUSINESS")}
            className={`px-4 py-1.5 rounded-md transition-colors ${
              activeTypeTab === "BUSINESS" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Business Overhead
          </button>
        </div>

        {isCurrentMonthFilter && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Filtered by: Current Month</span>
            <button
              onClick={() => setIsCurrentMonthFilter(false)}
              className="ml-1 text-emerald-900 font-bold hover:underline cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Category-Wise Breakdown for Business Expenses */}
      {activeTypeTab === "BUSINESS" && kpi?.businessCategoryBreakdown && kpi.businessCategoryBreakdown.length > 0 && (
        <div className="p-4 bg-white border border-violet-200/80 rounded-xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-violet-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Business Expenses by Category
              </h3>
              <span className="text-[11px] text-slate-400">
                ({kpi.businessCategoryBreakdown.length} active categories)
              </span>
            </div>
            {categoryFilter && (
              <button
                onClick={() => setCategoryFilter("")}
                className="text-xs text-violet-600 hover:text-violet-800 font-medium underline cursor-pointer"
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
                      ? "bg-violet-50 border-violet-400 ring-1 ring-violet-400 shadow-xs"
                      : "bg-slate-50/80 border-slate-200/80 hover:bg-violet-50/50 hover:border-violet-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold text-slate-700 truncate" title={cat.categoryKey.replace(/_/g, " ")}>
                      {cat.categoryKey.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                      {cat.count}
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-900 tabular-nums">
                      {formatCurrency(cat.amount)}
                    </span>
                    <span className="text-[10px] font-semibold text-violet-600 tabular-nums">
                      {cat.percentage}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all duration-300"
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
      <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-subtle flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Expense ID, Description, Vendor, Bill Ref, Project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
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
            variant="slate"
            size="sm"
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
            variant="slate"
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
            options={[
              { value: "APPROVED", label: "Approved" },
              { value: "SUBMITTED", label: "Submitted (Pending)" },
              { value: "REJECTED", label: "Rejected" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
            variant="slate"
            size="sm"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <DataTable
        columns={columns}
        data={expenses}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        emptyText="No expense records match criteria."
        emptySubtext="Use 'Record Expense' button to log financial outgoing entries."
      />

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>Showing Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          >
            Next
          </Button>
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
