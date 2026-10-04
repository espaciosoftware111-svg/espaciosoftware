"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { IssueAdvanceModal } from "@/components/petty-cash/issue-advance-modal";
import { RecordPettyExpenseModal } from "@/components/petty-cash/record-petty-expense-modal";
import { SettleAdvanceModal } from "@/components/petty-cash/settle-advance-modal";
import { ExportButton } from "@/components/reports/export-button";
import { FilterSelect } from "@/components/ui/filter-select";
import {
  Coins,
  ArrowLeft,
  Eye,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Receipt,
  Building2,
  Calendar,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Search,
} from "lucide-react";

interface PettyCashKpi {
  totalAllocated: number;
  totalSpent: number;
  totalReturned: number;
  availableBalance?: number;
  totalOutstanding: number;
  totalAdvanceCount: number;
  activeEmployeeCount: number;
  thisMonthExpenses: number;
  thisMonthExpenseCount: number;
  prevMonthExpenses: number;
  monthDeltaPct: number;
}

interface EmployeeSummaryItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  department?: string;
  designation?: string;
  totalCashReceived: number;
  totalCashSpent: number;
  totalCashReturned: number;
  currentBalance: number;
  advanceCount: number;
  expenseCount: number;
  hasActivity: boolean;
  lastTransactionDate: string | null;
}

interface EmployeeAdvanceItem {
  id: string;
  referenceNo: string;
  employeeId: string;
  employee: { id: string; fullName: string; email: string };
  amount: number;
  totalSpent: number;
  cashReturned: number;
  outstandingBalance: number;
  issuedDate: string;
  dueDate?: string | null;
  purpose: string;
  status: string;
  project?: { referenceNo: string; title: string } | null;
}

interface PettyExpenseItem {
  id: string;
  referenceNo: string;
  advance: { referenceNo: string };
  expenseDate: string;
  amount: number;
  purpose: string;
  categoryKey: string;
  paymentMethod: string;
  referenceNoExternal?: string | null;
  status: string;
  project?: { referenceNo: string; title: string } | null;
}

interface SettlementItem {
  id: string;
  referenceNo: string;
  advance: { referenceNo: string; amount: number };
  settlementDate: string;
  totalAdvance: number;
  totalSpent: number;
  cashReturned: number;
  difference: number;
  status: string;
}

interface LedgerEntry {
  id: string;
  date: string;
  transactionType: "CASH_ADVANCE" | "EXPENSE" | "CASH_RETURN";
  description: string;
  referenceNo: string;
  credit: number;
  debit: number;
  runningBalance: number;
  categoryKey?: string;
  paymentMethod?: string;
  projectRef?: string;
}

interface EmployeeDetailData {
  employee: {
    id: string;
    employeeMasterId: string | null;
    employeeNo: string | null;
    fullName: string;
    email: string | null;
    phone: string | null;
    department: string;
    designation: string;
    status: string;
  };
  kpis: {
    totalCashReceived: number;
    totalExpenses: number;
    currentAvailableBalance: number;
    totalTransactions: number;
  };
  ledger: LedgerEntry[];
  advances: any[];
  expenses: any[];
}

import { clientCache } from "@/lib/client-cache";

function PettyCashContent() {
  const searchParams = useSearchParams();

  // Navigation tabs: employees summary is default & prominent
  const [activeTab, setActiveTab] = useState<"employees" | "advances" | "expenses" | "settlements">("employees");

  // Selected Employee for in-page Detail View (NO sidebar, opens in main content area)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeDetail, setEmployeeDetail] = useState<EmployeeDetailData | null>(null);
  const [loadingEmployeeDetail, setLoadingEmployeeDetail] = useState(false);
  const [employeeDetailTab, setEmployeeDetailTab] = useState<"ledger" | "expenses" | "advances">("ledger");

  // Deep-linking from query parameters
  useEffect(() => {
    const empId = searchParams.get("employeeId") || searchParams.get("id");
    if (empId) {
      setSelectedEmployeeId(empId);
      setActiveTab("employees");
    }
  }, [searchParams]);

  const initialKpiCached = clientCache.getImmediate<any>("/api/v1/petty-cash/kpi");
  const initialEmployeesCached = clientCache.getImmediate<any>("/api/v1/petty-cash/employees");

  // Data state
  const [employees, setEmployees] = useState<EmployeeSummaryItem[]>(() => initialEmployeesCached?.data || []);
  const [advances, setAdvances] = useState<EmployeeAdvanceItem[]>([]);
  const [expenses, setExpenses] = useState<PettyExpenseItem[]>([]);
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState(!initialEmployeesCached);
  const [kpi, setKpi] = useState<PettyCashKpi | null>(() => initialKpiCached?.data || null);

  // Modals state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isRecordExpenseModalOpen, setIsRecordExpenseModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [preselectedEmployeeId, setPreselectedEmployeeId] = useState<string | undefined>(undefined);
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<string | undefined>(undefined);

  // Search and filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [employeeFilterType, setEmployeeFilterType] = useState<"ALL" | "WITH_BALANCE" | "ACTIVE">("ALL");

  const fetchKpi = useCallback(async () => {
    try {
      const json = await clientCache.fetchWithCache<any>("/api/v1/petty-cash/kpi", {
        onBackgroundUpdate: (data) => {
          if (data?.success) setKpi(data.data);
        },
      });
      if (json?.success) setKpi(json.data);
    } catch {
      // quiet handling
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const json = await clientCache.fetchWithCache<any>("/api/v1/petty-cash/employees", {
        onBackgroundUpdate: (data) => {
          if (data?.success && Array.isArray(data.data)) {
            setEmployees(data.data);
          }
        },
      });
      if (json?.success && Array.isArray(json.data)) {
        setEmployees(json.data);
      }
    } catch {
      // quiet handling
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "employees") {
        await fetchEmployees();
      } else if (activeTab === "advances") {
        let url = `/api/v1/petty-cash/advances?search=${encodeURIComponent(search)}`;
        if (statusFilter) url += `&status=${statusFilter}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setAdvances(data.data || []);
        }
      } else if (activeTab === "expenses") {
        const url = `/api/v1/petty-cash/expenses?search=${encodeURIComponent(search)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setExpenses(data.data || []);
        }
      } else if (activeTab === "settlements") {
        const res = await fetch("/api/v1/petty-cash/settlements");
        if (res.ok) {
          const data = await res.json();
          setSettlements(data.data || []);
        }
      }
    } catch (e) {
      console.error("Failed to load petty cash data", e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, statusFilter, fetchEmployees]);

  const loadEmployeeDetail = useCallback(async (empId: string) => {
    setLoadingEmployeeDetail(true);
    try {
      const res = await fetch(`/api/v1/petty-cash/employees/${empId}`);
      const json = await res.json();
      if (json.success) {
        setEmployeeDetail(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch employee petty cash details", err);
    } finally {
      setLoadingEmployeeDetail(false);
    }
  }, []);

  useEffect(() => {
    fetchKpi();
    fetchEmployees();
  }, [fetchKpi, fetchEmployees]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedEmployeeId) {
      loadEmployeeDetail(selectedEmployeeId);
    }
  }, [selectedEmployeeId, loadEmployeeDetail]);

  const handleRefreshAll = () => {
    fetchKpi();
    fetchEmployees();
    fetchData();
    if (selectedEmployeeId) {
      loadEmployeeDetail(selectedEmployeeId);
    }
  };

  function formatCurrency(val: number) {
    return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatDate(dStr?: string | null) {
    if (!dStr) return "—";
    return new Date(dStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "ISSUED":
      case "RECORDED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
            <Clock className="w-3 h-3" /> ISSUED
          </span>
        );
      case "SETTLED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="w-3 h-3" /> SETTLED
          </span>
        );
      case "PARTIALLY_SETTLED":
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            PARTIAL
          </span>
        );
      case "DISCREPANCY":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
            <AlertCircle className="w-3 h-3" /> DISCREPANCY
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
            OVERDUE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            {status}
          </span>
        );
    }
  }

  // Filter employees based on search query and KPI click filter
  const filteredEmployees = employees.filter((emp) => {
    if (employeeFilterType === "WITH_BALANCE" && emp.currentBalance <= 0) return false;
    if (employeeFilterType === "ACTIVE" && !(emp.hasActivity || emp.currentBalance > 0)) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      (emp.email && emp.email.toLowerCase().includes(q)) ||
      (emp.phone && emp.phone.includes(q)) ||
      (emp.role && emp.role.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CASE 1: DETAILED EMPLOYEE RECORD VIEW (IN-PAGE CONTENT AREA)       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedEmployeeId && employeeDetail ? (
        <div className="space-y-5">
          {/* Back Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <button
              onClick={() => setSelectedEmployeeId(null)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Petty Cash Management</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPreselectedEmployeeId(employeeDetail.employee.id);
                  setIsIssueModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#C89B3C] hover:bg-[#B38728] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Allocate Float</span>
              </button>
              <button
                onClick={() => {
                  setPreselectedEmployeeId(employeeDetail.employee.id);
                  setIsRecordExpenseModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Spend</span>
              </button>
            </div>
          </div>

          {/* Employee Header Profile */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-base text-slate-700 shrink-0">
                  {employeeDetail.employee.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                      {employeeDetail.employee.fullName}
                    </h1>
                    {employeeDetail.employee.employeeNo && (
                      <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-600">
                        {employeeDetail.employee.employeeNo}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                      Active Custodian
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {employeeDetail.employee.department} • {employeeDetail.employee.designation}
                    </span>
                    {employeeDetail.employee.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {employeeDetail.employee.phone}
                      </span>
                    )}
                    {employeeDetail.employee.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {employeeDetail.employee.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Float Available Badge */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-right shrink-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Available Petty Cash Balance
                </div>
                <div className={`text-2xl font-bold tracking-tight tabular-nums mt-1 ${employeeDetail.kpis.currentAvailableBalance > 0 ? "text-emerald-700" : "text-slate-900"}`}>
                  {formatCurrency(employeeDetail.kpis.currentAvailableBalance)}
                </div>
              </div>
            </div>
          </div>

          {/* 4 Employee KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Cash Received */}
            <div
              onClick={() => setEmployeeDetailTab("advances")}
              className={`bg-white border rounded-xl p-4 shadow-xs hover:shadow-sm transition cursor-pointer group flex flex-col justify-between ${
                employeeDetailTab === "advances" ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Received</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ArrowDownLeft className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-bold text-emerald-700 mt-2.5 tabular-nums">
                {formatCurrency(employeeDetail.kpis.totalCashReceived)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Sum of float allocations
              </div>
            </div>

            {/* 2. Total Petty Cash Spent */}
            <div
              onClick={() => setEmployeeDetailTab("expenses")}
              className={`bg-white border rounded-xl p-4 shadow-xs hover:shadow-sm transition cursor-pointer group flex flex-col justify-between ${
                employeeDetailTab === "expenses" ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Spent</span>
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-bold text-rose-700 mt-2.5 tabular-nums">
                {formatCurrency(employeeDetail.kpis.totalExpenses)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Sum of petty cash expenses
              </div>
            </div>

            {/* 3. Current Available Balance */}
            <div
              onClick={() => setEmployeeDetailTab("ledger")}
              className={`bg-white border rounded-xl p-4 shadow-xs hover:shadow-sm transition cursor-pointer group flex flex-col justify-between ${
                employeeDetailTab === "ledger" ? "border-amber-500 ring-1 ring-amber-500/20" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Available Balance</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  <Coins className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-2.5 tabular-nums">
                {formatCurrency(employeeDetail.kpis.currentAvailableBalance)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Received − Spent
              </div>
            </div>

            {/* 4. Total Transactions */}
            <div
              onClick={() => setEmployeeDetailTab("ledger")}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-sm transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Transactions</span>
                <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                  <Receipt className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-2.5 tabular-nums">
                {employeeDetail.kpis.totalTransactions}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Allocations + Expenses
              </div>
            </div>
          </div>

          {/* Sub-view Segmented Tabs */}
          <div className="flex space-x-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200 w-fit">
            <button
              onClick={() => setEmployeeDetailTab("ledger")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                employeeDetailTab === "ledger"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Petty Cash Ledger ({employeeDetail.ledger.length})
            </button>
            <button
              onClick={() => setEmployeeDetailTab("expenses")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                employeeDetailTab === "expenses"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Expense History ({employeeDetail.expenses.length})
            </button>
            <button
              onClick={() => setEmployeeDetailTab("advances")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                employeeDetailTab === "advances"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Float Allocations ({employeeDetail.advances.length})
            </button>
          </div>

          {/* Tab 1: Financial Running Balance Ledger */}
          {employeeDetailTab === "ledger" && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Employee Financial Running Ledger
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Real running balance ledger — Cash Given (Credit), Expenses (Debit), and Continuous Balance.
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {employeeDetail.ledger.length} total entries
                </span>
              </div>

              {employeeDetail.ledger.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No ledger entries recorded yet. Allocate float or record expenses to generate ledger entries.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <tr>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Reference</th>
                        <th className="px-4 py-2.5">Description</th>
                        <th className="px-4 py-2.5 text-right">Credit (₹)</th>
                        <th className="px-4 py-2.5 text-right">Debit (₹)</th>
                        <th className="px-4 py-2.5 text-right">Running Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                      {employeeDetail.ledger.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-4 py-2.5 text-slate-500">{formatDate(entry.date)}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                entry.transactionType === "CASH_ADVANCE"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : entry.transactionType === "EXPENSE"
                                  ? "bg-rose-50 text-rose-700 border border-rose-100"
                                  : "bg-blue-50 text-blue-700 border border-blue-100"
                              }`}
                            >
                              {entry.transactionType.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono font-medium text-slate-800">{entry.referenceNo}</td>
                          <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate">{entry.description}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-medium text-emerald-700">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-medium text-rose-700">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-900">
                            {formatCurrency(entry.runningBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Itemized Expenses */}
          {employeeDetailTab === "expenses" && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Itemized Petty Cash Expenses</h3>
                  <p className="text-[11px] text-slate-500">History of all expenses recorded by this custodian.</p>
                </div>
                <button
                  onClick={() => {
                    setPreselectedEmployeeId(employeeDetail.employee.id);
                    setIsRecordExpenseModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#C89B3C] hover:bg-[#B38728] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Record Spend
                </button>
              </div>

              {employeeDetail.expenses.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">No expenses recorded yet for this employee.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <tr>
                        <th className="px-4 py-2.5">Expense Ref</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5">Purpose</th>
                        <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                        <th className="px-4 py-2.5">Mode</th>
                        <th className="px-4 py-2.5">Project</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                      {employeeDetail.expenses.map((exp: any) => (
                        <tr key={exp.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-4 py-2.5 font-mono font-medium text-slate-800">{exp.referenceNo}</td>
                          <td className="px-4 py-2.5 text-slate-500">{formatDate(exp.expenseDate)}</td>
                          <td className="px-4 py-2.5">
                            <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[10px] text-slate-700">
                              {exp.categoryKey}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-700 max-w-xs truncate">{exp.purpose}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-rose-700">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">{exp.paymentMethod}</td>
                          <td className="px-4 py-2.5 text-slate-500">
                            {exp.project ? exp.project.referenceNo : "General Float"}
                          </td>
                          <td className="px-4 py-2.5">{getStatusBadge(exp.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Float Allocations (Advances) */}
          {employeeDetailTab === "advances" && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Cash Float Allocations Issued</h3>
                  <p className="text-[11px] text-slate-500">All petty cash advances issued by the company to this custodian.</p>
                </div>
                <button
                  onClick={() => {
                    setPreselectedEmployeeId(employeeDetail.employee.id);
                    setIsIssueModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#C89B3C] hover:bg-[#B38728] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Issue Float Advance
                </button>
              </div>

              {employeeDetail.advances.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">No float allocations issued yet for this employee.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <tr>
                        <th className="px-4 py-2.5">Advance Ref</th>
                        <th className="px-4 py-2.5">Issued Date</th>
                        <th className="px-4 py-2.5 text-right">Float Given (₹)</th>
                        <th className="px-4 py-2.5 text-right">Spent (₹)</th>
                        <th className="px-4 py-2.5 text-right">Returned (₹)</th>
                        <th className="px-4 py-2.5 text-right">Balance (₹)</th>
                        <th className="px-4 py-2.5">Purpose</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                      {employeeDetail.advances.map((adv: any) => (
                        <tr key={adv.id} className="hover:bg-slate-50/60 transition">
                          <td className="px-4 py-2.5 font-mono font-medium text-slate-800">{adv.referenceNo}</td>
                          <td className="px-4 py-2.5 text-slate-500">{formatDate(adv.issuedDate)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-emerald-700">
                            {formatCurrency(adv.amount)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-rose-700">
                            {formatCurrency(adv.totalSpent || 0)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-blue-700">
                            {formatCurrency(adv.cashReturned || 0)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-amber-700">
                            {formatCurrency(adv.outstandingBalance || 0)}
                          </td>
                          <td className="px-4 py-2.5 max-w-xs truncate text-slate-600">{adv.purpose}</td>
                          <td className="px-4 py-2.5">{getStatusBadge(adv.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────────── */
        /* CASE 2: MAIN PETTY CASH MANAGEMENT SECTION                          */
        /* ─────────────────────────────────────────────────────────────────── */
        <>
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Petty Cash Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic employee ledger, real running balance reconciliation &amp; float synchronization
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ExportButton
                reportKey="petty_cash_advances"
                label="Export Petty Cash"
                size="sm"
              />
              <button
                onClick={() => {
                  setPreselectedEmployeeId(undefined);
                  setIsIssueModalOpen(true);
                }}
                className="rounded-lg bg-[#C89B3C] hover:bg-[#B38728] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Issue Advance</span>
              </button>
              <button
                onClick={() => {
                  setSelectedAdvanceId(undefined);
                  setPreselectedEmployeeId(undefined);
                  setIsRecordExpenseModalOpen(true);
                }}
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Record Spend</span>
              </button>
              <button
                onClick={() => {
                  setSelectedAdvanceId(undefined);
                  setIsSettleModalOpen(true);
                }}
                className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reconcile Float</span>
              </button>
            </div>
          </div>

          {/* ─── MAIN PETTY CASH 4 KPI CARDS ─────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. TOTAL PETTY CASH GIVEN */}
            <div
              onClick={() => {
                setActiveTab("advances");
                setStatusFilter("");
                setSearch("");
              }}
              className={`rounded-xl border bg-white p-4 shadow-xs hover:shadow-sm transition cursor-pointer group flex flex-col justify-between ${
                activeTab === "advances" ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-slate-200/90"
              }`}
              title="Click to view all petty cash allocation transactions"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Total Cash Given</span>
                <span className="p-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-2.5 text-2xl font-bold tracking-tight tabular-nums text-emerald-700">
                {kpi ? formatCurrency(kpi.totalAllocated) : "—"}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Total money allocated to staff
              </div>
            </div>

            {/* 2. TOTAL PETTY CASH SPENT */}
            <div
              onClick={() => {
                setActiveTab("expenses");
                setStatusFilter("");
                setSearch("");
              }}
              className={`rounded-xl border bg-white p-4 shadow-xs hover:shadow-sm transition cursor-pointer group flex flex-col justify-between ${
                activeTab === "expenses" ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200/90"
              }`}
              title="Click to view all employee petty cash expenses"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Total Cash Spent</span>
                <span className="p-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-2.5 text-2xl font-bold tracking-tight tabular-nums text-rose-700">
                {kpi ? formatCurrency(kpi.totalSpent) : "—"}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Recorded petty expenses
              </div>
            </div>

            {/* 3. AVAILABLE PETTY CASH BALANCE */}
            <div
              onClick={() => {
                setActiveTab("employees");
                setEmployeeFilterType("WITH_BALANCE");
                setSearch("");
              }}
              className={`rounded-xl border bg-white p-4 shadow-xs hover:shadow-sm transition cursor-pointer group flex flex-col justify-between ${
                employeeFilterType === "WITH_BALANCE" && activeTab === "employees" ? "border-amber-500 ring-1 ring-amber-500/20" : "border-slate-200/90"
              }`}
              title="Click to show employees with positive available balance"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 flex items-center justify-between">
                <span>Available Balance</span>
                <span className="p-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  <Coins className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-2.5 text-2xl font-bold tracking-tight tabular-nums text-slate-900">
                {kpi
                  ? formatCurrency(kpi.availableBalance ?? Math.max(0, kpi.totalAllocated - kpi.totalSpent - kpi.totalReturned))
                  : "—"}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Total Given − Total Spent
              </div>
            </div>

            {/* 4. ACTIVE EMPLOYEES */}
            <div
              onClick={() => {
                setActiveTab("employees");
                setEmployeeFilterType("ACTIVE");
                setSearch("");
              }}
              className={`rounded-xl border bg-white p-4 shadow-xs hover:shadow-sm transition cursor-pointer group flex flex-col justify-between ${
                employeeFilterType === "ACTIVE" && activeTab === "employees" ? "border-[#C89B3C] ring-1 ring-amber-500/20" : "border-slate-200/90"
              }`}
              title="Click to show all active employees with petty cash records"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Active Custodians</span>
                <span className="p-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  <User className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-2.5 text-2xl font-bold tracking-tight tabular-nums text-slate-900">
                {kpi?.activeEmployeeCount ||
                  employees.filter((e) => e.hasActivity || e.currentBalance > 0).length ||
                  0}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Staff with active float records
              </div>
            </div>
          </div>

          {/* Segmented Controls & Search Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex space-x-1 rounded-xl bg-slate-100/80 border border-slate-200 p-1">
              <button
                onClick={() => setActiveTab("employees")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeTab === "employees"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Employees Ledger ({employees.length})
              </button>
              <button
                onClick={() => setActiveTab("advances")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeTab === "advances"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Advances ({advances.length})
              </button>
              <button
                onClick={() => setActiveTab("expenses")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeTab === "expenses"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Expenses ({expenses.length})
              </button>
              <button
                onClick={() => setActiveTab("settlements")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeTab === "settlements"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Settlements ({settlements.length})
              </button>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employee, ref, notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchData()}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 focus:outline-none placeholder:text-slate-400 transition"
                />
              </div>

              {activeTab === "advances" && (
                <FilterSelect
                  label="Status"
                  placeholder="All Statuses"
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  options={[
                    { value: "ISSUED", label: "ISSUED" },
                    { value: "SETTLED", label: "SETTLED" },
                    { value: "PARTIALLY_SETTLED", label: "PARTIAL" },
                    { value: "OVERDUE", label: "OVERDUE" },
                  ]}
                  variant="slate"
                  size="md"
                />
              )}
            </div>
          </div>

          {/* Active Filter Notification Banner */}
          {employeeFilterType !== "ALL" && activeTab === "employees" && (
            <div className="flex items-center justify-between px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 animate-in fade-in duration-200">
              <span className="flex items-center gap-2 font-medium">
                <Filter className="w-3.5 h-3.5 text-amber-700" />
                Filtered by: <strong className="font-semibold">{employeeFilterType === "WITH_BALANCE" ? "Custodians with Positive Available Balance" : "Active Employees with Petty Cash History"}</strong> ({filteredEmployees.length} custodians)
              </span>
              <button
                onClick={() => setEmployeeFilterType("ALL")}
                className="text-amber-800 hover:text-amber-950 font-semibold hover:underline cursor-pointer text-xs"
              >
                Clear Filter ×
              </button>
            </div>
          )}

          {/* ─── MAIN TABLE CONTENT ────────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden relative">
            {/* Subtle background refresh bar */}
            {loading && employees.length > 0 && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-100 overflow-hidden z-20">
                <div className="h-full bg-amber-500 animate-pulse w-full" />
              </div>
            )}

            {loading && employees.length === 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Employee Name</th>
                      <th className="px-4 py-3">Department / Role</th>
                      <th className="px-4 py-3 text-right">Cash Received</th>
                      <th className="px-4 py-3 text-right">Cash Spent</th>
                      <th className="px-4 py-3 text-right">Current Balance</th>
                      <th className="px-4 py-3 text-center">Open Floats</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap min-w-[210px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 animate-pulse">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <tr key={`skel-pc-${i}`}>
                        <td className="px-4 py-3"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                        <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                        <td className="px-4 py-3 text-right"><div className="h-4 w-16 bg-slate-200 rounded ml-auto" /></td>
                        <td className="px-4 py-3 text-right"><div className="h-4 w-16 bg-slate-200 rounded ml-auto" /></td>
                        <td className="px-4 py-3 text-right"><div className="h-4 w-16 bg-slate-200 rounded ml-auto" /></td>
                        <td className="px-4 py-3 text-center"><div className="h-4 w-12 bg-slate-200 rounded mx-auto" /></td>
                        <td className="px-4 py-3 text-right"><div className="h-4 w-20 bg-slate-200 rounded ml-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : activeTab === "employees" ? (
              /* ─── EMPLOYEES PETTY CASH SUMMARY TABLE ────────────────────── */
              filteredEmployees.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No employees found matching your query.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Employee Name</th>
                        <th className="px-4 py-3">Department / Role</th>
                        <th className="px-4 py-3 text-right">Cash Received</th>
                        <th className="px-4 py-3 text-right">Cash Spent</th>
                        <th className="px-4 py-3 text-right">Current Balance</th>
                        <th className="px-4 py-3 text-center">Open Floats</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap min-w-[210px]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
                      {filteredEmployees.map((emp) => (
                        <tr
                          key={emp.id}
                          className="hover:bg-slate-50/70 transition cursor-pointer"
                          onClick={() => setSelectedEmployeeId(emp.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-xs text-slate-700 shrink-0">
                                {emp.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 hover:text-amber-700 transition">
                                  {emp.name}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {emp.email || emp.phone || "Employee"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {emp.department || "Operations"} • {emp.designation || emp.role}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {emp.totalCashReceived > 0 ? (
                              <span className="font-semibold text-emerald-700">{formatCurrency(emp.totalCashReceived)}</span>
                            ) : (
                              <span className="text-slate-400 font-normal">₹0.00</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {emp.totalCashSpent > 0 ? (
                              <span className="font-medium text-slate-800">{formatCurrency(emp.totalCashSpent)}</span>
                            ) : (
                              <span className="text-slate-400 font-normal">₹0.00</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {emp.currentBalance > 0 ? (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
                                {formatCurrency(emp.currentBalance)}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">₹0.00</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {emp.advanceCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
                                {emp.advanceCount} active
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td
                            className="px-4 py-2.5 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedEmployeeId(emp.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-xs transition cursor-pointer border border-transparent hover:border-slate-200"
                                title="View Full Custodian Ledger"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>Ledger</span>
                              </button>
                              <button
                                onClick={() => {
                                  setPreselectedEmployeeId(emp.id);
                                  setIsIssueModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 font-semibold text-xs transition cursor-pointer shadow-2xs"
                                title="Allocate Cash Float"
                              >
                                <Coins className="w-3.5 h-3.5 text-amber-600" />
                                <span>Float</span>
                              </button>
                              <button
                                onClick={() => {
                                  setPreselectedEmployeeId(emp.id);
                                  setIsRecordExpenseModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-xs transition cursor-pointer shadow-2xs"
                                title="Record Petty Spend"
                              >
                                <Plus className="w-3.5 h-3.5 text-slate-400" />
                                <span>Spend</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : activeTab === "advances" ? (
              /* ─── ALL ADVANCES TABLE ────────────────────────────────────── */
              advances.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No employee advances recorded yet. Click <strong>Issue Advance</strong> above to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Advance Ref</th>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Issued Date</th>
                        <th className="px-4 py-3 text-right">Advance (₹)</th>
                        <th className="px-4 py-3 text-right">Spent (₹)</th>
                        <th className="px-4 py-3 text-right">Returned (₹)</th>
                        <th className="px-4 py-3 text-right">Balance (₹)</th>
                        <th className="px-4 py-3">Project Link</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap min-w-[160px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
                      {advances.map((adv) => (
                        <tr key={adv.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 font-mono font-medium text-slate-900">
                            {adv.referenceNo}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedEmployeeId(adv.employeeId)}
                              className="font-semibold text-slate-900 hover:text-amber-700 transition underline underline-offset-2"
                            >
                              {adv.employee.fullName}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{formatDate(adv.issuedDate)}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-700">
                            {formatCurrency(adv.amount)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-rose-700">
                            {formatCurrency(adv.totalSpent || 0)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-blue-700">
                            {formatCurrency(adv.cashReturned || 0)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold text-amber-700">
                            {formatCurrency(adv.outstandingBalance || 0)}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {adv.project ? adv.project.referenceNo : "General Float"}
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(adv.status)}</td>
                          <td className="px-4 py-2.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setSelectedAdvanceId(adv.id);
                                  setIsRecordExpenseModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-xs cursor-pointer shadow-2xs transition"
                              >
                                <Plus className="w-3.5 h-3.5 text-slate-400" />
                                <span>Spend</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedAdvanceId(adv.id);
                                  setIsSettleModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-semibold text-xs cursor-pointer shadow-2xs transition"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Settle</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : activeTab === "expenses" ? (
              /* ─── ALL EXPENSES TABLE ────────────────────────────────────── */
              expenses.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No petty cash expenses logged yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Expense Entry</th>
                        <th className="px-4 py-3">Advance Float</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Purpose</th>
                        <th className="px-4 py-3 text-right">Amount (₹)</th>
                        <th className="px-4 py-3">Mode</th>
                        <th className="px-4 py-3">Project</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 font-mono font-medium text-slate-900">{exp.referenceNo}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{exp.advance.referenceNo}</td>
                          <td className="px-4 py-3 text-slate-500">{formatDate(exp.expenseDate)}</td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[10px] text-slate-700">
                              {exp.categoryKey}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{exp.purpose}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold text-rose-700">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{exp.paymentMethod}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {exp.project ? exp.project.referenceNo : "Overhead"}
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(exp.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              /* ─── SETTLEMENTS TABLE ─────────────────────────────────────── */
              settlements.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No settlement records yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Settlement Ref</th>
                        <th className="px-4 py-3">Advance Ref</th>
                        <th className="px-4 py-3">Settled Date</th>
                        <th className="px-4 py-3 text-right">Advance (₹)</th>
                        <th className="px-4 py-3 text-right">Spent (₹)</th>
                        <th className="px-4 py-3 text-right">Returned (₹)</th>
                        <th className="px-4 py-3 text-right">Difference (₹)</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
                      {settlements.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 font-mono font-medium text-slate-900">{s.referenceNo}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{s.advance.referenceNo}</td>
                          <td className="px-4 py-3 text-slate-500">{formatDate(s.settlementDate)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(s.totalAdvance)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-rose-700">{formatCurrency(s.totalSpent)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-blue-700">{formatCurrency(s.cashReturned)}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{formatCurrency(s.difference)}</td>
                          <td className="px-4 py-3">{getStatusBadge(s.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <IssueAdvanceModal
        isOpen={isIssueModalOpen}
        onClose={() => {
          setIsIssueModalOpen(false);
          setPreselectedEmployeeId(undefined);
        }}
        onSuccess={handleRefreshAll}
        preselectedEmployeeId={preselectedEmployeeId}
      />
      <RecordPettyExpenseModal
        isOpen={isRecordExpenseModalOpen}
        onClose={() => {
          setIsRecordExpenseModalOpen(false);
          setSelectedAdvanceId(undefined);
          setPreselectedEmployeeId(undefined);
        }}
        onSuccess={handleRefreshAll}
        preselectedAdvanceId={selectedAdvanceId}
        preselectedEmployeeId={preselectedEmployeeId}
      />
      <SettleAdvanceModal
        isOpen={isSettleModalOpen}
        onClose={() => {
          setIsSettleModalOpen(false);
          setSelectedAdvanceId(undefined);
        }}
        onSuccess={handleRefreshAll}
        preselectedAdvanceId={selectedAdvanceId}
      />
    </div>
  );
}

export default function PettyCashPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Petty Cash & Employee Ledger...</div>}>
      <PettyCashContent />
    </Suspense>
  );
}
