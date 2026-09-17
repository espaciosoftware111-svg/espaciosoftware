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

  // Data state
  const [employees, setEmployees] = useState<EmployeeSummaryItem[]>([]);
  const [advances, setAdvances] = useState<EmployeeAdvanceItem[]>([]);
  const [expenses, setExpenses] = useState<PettyExpenseItem[]>([]);
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState<PettyCashKpi | null>(null);

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
      const res = await fetch("/api/v1/petty-cash/kpi");
      const json = await res.json();
      if (json.success) setKpi(json.data);
    } catch {
      // quiet handling
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/petty-cash/employees");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
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
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-bold text-blue-700">
            <Clock className="w-3 h-3" /> ISSUED
          </span>
        );
      case "SETTLED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            <CheckCircle2 className="w-3 h-3" /> SETTLED
          </span>
        );
      case "PARTIALLY_SETTLED":
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-700">
            PARTIAL
          </span>
        );
      case "DISCREPANCY":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700">
            <AlertCircle className="w-3 h-3" /> DISCREPANCY
          </span>
        );
      case "OVERDUE":
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-[11px] font-bold text-red-800">
            OVERDUE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-cream border border-walnut/20 px-2 py-0.5 text-[11px] font-semibold text-charcoal">
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
    <div className="min-h-screen bg-[#FCFBF9] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CASE 1: DETAILED EMPLOYEE RECORD VIEW (IN-PAGE CONTENT AREA)       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedEmployeeId && employeeDetail ? (
        <div className="space-y-6">
          {/* Back Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-walnut/15">
            <button
              onClick={() => setSelectedEmployeeId(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-walnut hover:text-charcoal transition cursor-pointer"
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gold hover:bg-gold-hover text-charcoal text-xs font-bold shadow-gold transition cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>+ Allocate Float</span>
              </button>
              <button
                onClick={() => {
                  setPreselectedEmployeeId(employeeDetail.employee.id);
                  setIsRecordExpenseModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-walnut/20 bg-cream/40 hover:bg-cream text-walnut text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Record Spend</span>
              </button>
            </div>
          </div>

          {/* Employee Header Profile */}
          <div className="bg-white border border-walnut/20 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-bold text-xl text-amber-900 shrink-0">
                  {employeeDetail.employee.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-charcoal tracking-tight">
                      {employeeDetail.employee.fullName}
                    </h1>
                    {employeeDetail.employee.employeeNo && (
                      <span className="font-mono text-xs px-2 py-0.5 bg-cream rounded-md border border-walnut/20 text-walnut">
                        {employeeDetail.employee.employeeNo}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                      ACTIVE CUSTODIAN
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-walnut pt-1">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gold" />
                      {employeeDetail.employee.department} • {employeeDetail.employee.designation}
                    </span>
                    {employeeDetail.employee.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gold" />
                        {employeeDetail.employee.phone}
                      </span>
                    )}
                    {employeeDetail.employee.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gold" />
                        {employeeDetail.employee.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Float Available Badge */}
              <div className="bg-[#FAF8F5] border border-walnut/20 rounded-xl p-4 text-right shrink-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-walnut">
                  Available Petty Cash Balance
                </div>
                <div className={`text-2xl font-bold font-mono mt-1 ${employeeDetail.kpis.currentAvailableBalance > 0 ? "text-emerald-700" : "text-charcoal"}`}>
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
              className={`bg-white border rounded-xl p-4 shadow-sm hover:border-gold/60 hover:shadow-md transition cursor-pointer group ${
                employeeDetailTab === "advances" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-walnut/20"
              }`}
              title="Click to view all float allocations issued to this employee"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-walnut uppercase tracking-wider group-hover:text-charcoal transition">Total Cash Received</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ArrowDownLeft className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
                {formatCurrency(employeeDetail.kpis.totalCashReceived)}
              </div>
              <div className="text-[11px] text-walnut mt-1 flex items-center justify-between">
                <span>Sum of all petty cash allocations</span>
                <span className="text-[10px] text-gold font-bold opacity-0 group-hover:opacity-100 transition">View Floats →</span>
              </div>
            </div>

            {/* 2. Total Petty Cash Spent */}
            <div
              onClick={() => setEmployeeDetailTab("expenses")}
              className={`bg-white border rounded-xl p-4 shadow-sm hover:border-gold/60 hover:shadow-md transition cursor-pointer group ${
                employeeDetailTab === "expenses" ? "border-rose-500 ring-2 ring-rose-500/20" : "border-walnut/20"
              }`}
              title="Click to view itemized petty cash expenses recorded by this employee"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-walnut uppercase tracking-wider group-hover:text-charcoal transition">Total Petty Cash Spent</span>
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-rose-700 mt-2">
                {formatCurrency(employeeDetail.kpis.totalExpenses)}
              </div>
              <div className="text-[11px] text-walnut mt-1 flex items-center justify-between">
                <span>Sum of all petty cash expenses</span>
                <span className="text-[10px] text-gold font-bold opacity-0 group-hover:opacity-100 transition">View Expenses →</span>
              </div>
            </div>

            {/* 3. Current Available Balance */}
            <div
              onClick={() => setEmployeeDetailTab("ledger")}
              className={`bg-white border rounded-xl p-4 shadow-sm hover:border-gold/60 hover:shadow-md transition cursor-pointer group ${
                employeeDetailTab === "ledger" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-walnut/20"
              }`}
              title="Click to view running ledger transactions"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-walnut uppercase tracking-wider group-hover:text-charcoal transition">Current Available Balance</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  <Coins className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-amber-700 mt-2">
                {formatCurrency(employeeDetail.kpis.currentAvailableBalance)}
              </div>
              <div className="text-[11px] text-walnut mt-1 flex items-center justify-between">
                <span>Formula: Received − Spent</span>
                <span className="text-[10px] text-gold font-bold opacity-0 group-hover:opacity-100 transition">View Ledger →</span>
              </div>
            </div>

            {/* 4. Total Transactions */}
            <div
              onClick={() => setEmployeeDetailTab("ledger")}
              className="bg-white border border-walnut/20 rounded-xl p-4 shadow-sm hover:border-gold/60 hover:shadow-md transition cursor-pointer group"
              title="Click to view all ledger transactions"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-walnut uppercase tracking-wider group-hover:text-charcoal transition">Total Transactions</span>
                <span className="p-1.5 rounded-lg bg-cream text-charcoal border border-walnut/20">
                  <Receipt className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-charcoal mt-2">
                {employeeDetail.kpis.totalTransactions}
              </div>
              <div className="text-[11px] text-walnut mt-1 flex items-center justify-between">
                <span>Allocations + Expenses logged</span>
                <span className="text-[10px] text-gold font-bold opacity-0 group-hover:opacity-100 transition">View History →</span>
              </div>
            </div>
          </div>

          {/* Sub-view Segmented Tabs */}
          <div className="flex space-x-2 border-b border-walnut/15 pb-2">
            <button
              onClick={() => setEmployeeDetailTab("ledger")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                employeeDetailTab === "ledger"
                  ? "bg-charcoal text-white shadow-sm"
                  : "bg-white border border-walnut/20 text-walnut hover:bg-cream"
              }`}
            >
              Petty Cash Ledger ({employeeDetail.ledger.length})
            </button>
            <button
              onClick={() => setEmployeeDetailTab("expenses")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                employeeDetailTab === "expenses"
                  ? "bg-charcoal text-white shadow-sm"
                  : "bg-white border border-walnut/20 text-walnut hover:bg-cream"
              }`}
            >
              Expense History ({employeeDetail.expenses.length})
            </button>
            <button
              onClick={() => setEmployeeDetailTab("advances")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                employeeDetailTab === "advances"
                  ? "bg-charcoal text-white shadow-sm"
                  : "bg-white border border-walnut/20 text-walnut hover:bg-cream"
              }`}
            >
              Float Allocations ({employeeDetail.advances.length})
            </button>
          </div>

          {/* Tab 1: Financial Running Balance Ledger */}
          {employeeDetailTab === "ledger" && (
            <div className="bg-white border border-walnut/20 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-cream/30 border-b border-walnut/15 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-charcoal">
                    Employee Financial Running Ledger
                  </h3>
                  <p className="text-xs text-walnut">
                    Real running balance ledger — Cash Given (Credit), Expenses (Debit), and Continuous Balance.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-walnut">
                  {employeeDetail.ledger.length} total entries
                </span>
              </div>

              {employeeDetail.ledger.length === 0 ? (
                <div className="p-12 text-center text-xs text-walnut">
                  No ledger entries recorded yet. Allocate float or record expenses to generate ledger entries.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-walnut/15 text-walnut uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Transaction Type</th>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Credit (₹)</th>
                        <th className="px-4 py-3 text-right">Debit (₹)</th>
                        <th className="px-4 py-3 text-right">Running Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-walnut/10 font-medium text-charcoal">
                      {employeeDetail.ledger.map((entry) => (
                        <tr key={entry.id} className="hover:bg-cream/20 transition">
                          <td className="px-4 py-3 font-mono text-walnut">{formatDate(entry.date)}</td>
                          <td className="px-4 py-3">
                            {entry.transactionType === "CASH_ADVANCE" ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                <ArrowDownLeft className="w-3 h-3" /> CASH GIVEN
                              </span>
                            ) : entry.transactionType === "EXPENSE" ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                                <ArrowUpRight className="w-3 h-3" /> EXPENSE RECORDED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                                <RotateCcw className="w-3 h-3" /> CASH RETURNED
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold">{entry.referenceNo}</td>
                          <td className="px-4 py-3 max-w-sm truncate text-charcoal">
                            {entry.description}
                            {entry.projectRef && (
                              <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 bg-cream rounded border border-walnut/20 text-walnut">
                                {entry.projectRef}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-charcoal bg-cream/30">
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

          {/* Tab 2: Itemized Expense History */}
          {employeeDetailTab === "expenses" && (
            <div className="bg-white border border-walnut/20 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-cream/30 border-b border-walnut/15 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-charcoal">Itemized Expenses Logged by Employee</h3>
                  <p className="text-xs text-walnut">All verified field receipts and expenses debited against petty cash float.</p>
                </div>
                <button
                  onClick={() => {
                    setPreselectedEmployeeId(employeeDetail.employee.id);
                    setIsRecordExpenseModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gold hover:bg-gold-hover text-charcoal text-xs font-bold transition shadow-gold cursor-pointer"
                >
                  + Log New Expense
                </button>
              </div>

              {employeeDetail.expenses.length === 0 ? (
                <div className="p-12 text-center text-xs text-walnut">No itemized expenses logged yet for this employee.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-walnut/15 text-walnut uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3">Expense Ref</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Purpose</th>
                        <th className="px-4 py-3 text-right">Amount (₹)</th>
                        <th className="px-4 py-3">Payment Mode</th>
                        <th className="px-4 py-3">Project Link</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-walnut/10 font-medium text-charcoal">
                      {employeeDetail.expenses.map((exp: any) => (
                        <tr key={exp.id} className="hover:bg-cream/20 transition">
                          <td className="px-4 py-3 font-mono font-bold">{exp.referenceNo}</td>
                          <td className="px-4 py-3 font-mono text-walnut">{formatDate(exp.expenseDate)}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-[11px] px-2 py-0.5 bg-cream rounded border border-walnut/20 text-walnut">
                              {exp.categoryKey}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate">{exp.purpose}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="px-4 py-3">{exp.paymentMethod}</td>
                          <td className="px-4 py-3 text-walnut">
                            {exp.project ? exp.project.referenceNo : "General Float"}
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(exp.status)}</td>
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
            <div className="bg-white border border-walnut/20 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-cream/30 border-b border-walnut/15 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-charcoal">Cash Float Allocations Issued</h3>
                  <p className="text-xs text-walnut">All petty cash advances issued by the company to this custodian.</p>
                </div>
                <button
                  onClick={() => {
                    setPreselectedEmployeeId(employeeDetail.employee.id);
                    setIsIssueModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gold hover:bg-gold-hover text-charcoal text-xs font-bold transition shadow-gold cursor-pointer"
                >
                  + Issue Float Advance
                </button>
              </div>

              {employeeDetail.advances.length === 0 ? (
                <div className="p-12 text-center text-xs text-walnut">No float allocations issued yet for this employee.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-walnut/15 text-walnut uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3">Advance Ref</th>
                        <th className="px-4 py-3">Issued Date</th>
                        <th className="px-4 py-3 text-right">Float Given (₹)</th>
                        <th className="px-4 py-3 text-right">Spent (₹)</th>
                        <th className="px-4 py-3 text-right">Returned (₹)</th>
                        <th className="px-4 py-3 text-right">Balance (₹)</th>
                        <th className="px-4 py-3">Purpose</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-walnut/10 font-medium text-charcoal">
                      {employeeDetail.advances.map((adv: any) => (
                        <tr key={adv.id} className="hover:bg-cream/20 transition">
                          <td className="px-4 py-3 font-mono font-bold">{adv.referenceNo}</td>
                          <td className="px-4 py-3 font-mono text-walnut">{formatDate(adv.issuedDate)}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                            {formatCurrency(adv.amount)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-rose-700">
                            {formatCurrency(adv.totalSpent || 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-blue-700">
                            {formatCurrency(adv.cashReturned || 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                            {formatCurrency(adv.outstandingBalance || 0)}
                          </td>
                          <td className="px-4 py-3 max-w-xs truncate">{adv.purpose}</td>
                          <td className="px-4 py-3">{getStatusBadge(adv.status)}</td>
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-walnut/15 pb-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-walnut">
                <span>Finance Management</span>
                <span>•</span>
                <span className="text-amber-800">Petty Cash & Employee Ledger</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-charcoal mt-1">
                Petty Cash Management
              </h1>
              <p className="text-xs text-walnut mt-0.5">
                Dynamic employee ledger, real running balance reconciliation, and business expense synchronization.
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
                className="rounded-xl bg-gold px-4 py-2 text-xs font-bold text-charcoal shadow-gold hover:bg-gold-hover transition cursor-pointer flex items-center gap-1.5"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>+ Issue Advance</span>
              </button>
              <button
                onClick={() => {
                  setSelectedAdvanceId(undefined);
                  setPreselectedEmployeeId(undefined);
                  setIsRecordExpenseModalOpen(true);
                }}
                className="rounded-xl border border-walnut/20 bg-cream/40 px-4 py-2 text-xs font-bold text-walnut shadow-sm hover:bg-cream transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Record Petty Expense</span>
              </button>
              <button
                onClick={() => {
                  setSelectedAdvanceId(undefined);
                  setIsSettleModalOpen(true);
                }}
                className="rounded-xl border border-walnut/20 bg-cream/40 px-4 py-2 text-xs font-bold text-walnut shadow-sm hover:bg-cream transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reconcile Float</span>
              </button>
            </div>
          </div>

          {/* ─── MAIN PETTY CASH 4 KPI CARDS (USER MANDATED) ────────────────── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. TOTAL PETTY CASH GIVEN */}
            <div
              onClick={() => {
                setActiveTab("advances");
                setStatusFilter("");
                setSearch("");
              }}
              className={`rounded-2xl border bg-white p-5 shadow-sm hover:border-gold/60 hover:shadow-md transition cursor-pointer group ${
                activeTab === "advances" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-walnut/20"
              }`}
              title="Click to view all petty cash allocation transactions"
            >
              <div className="text-xs font-bold uppercase tracking-wider text-walnut flex items-center justify-between">
                <span className="group-hover:text-charcoal transition">Total Petty Cash Given</span>
                <span className="p-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-emerald-700">
                {kpi ? formatCurrency(kpi.totalAllocated) : "—"}
              </div>
              <div className="mt-1 text-[11px] text-walnut flex items-center justify-between">
                <span>Total money allocated to employees</span>
                <span className="text-[10px] text-gold font-bold opacity-0 group-hover:opacity-100 transition">View Allocations →</span>
              </div>
            </div>

            {/* 2. TOTAL PETTY CASH SPENT */}
            <div
              onClick={() => {
                setActiveTab("expenses");
                setStatusFilter("");
                setSearch("");
              }}
              className={`rounded-2xl border bg-white p-5 shadow-sm hover:border-gold/60 hover:shadow-md transition cursor-pointer group ${
                activeTab === "expenses" ? "border-rose-500 ring-2 ring-rose-500/20" : "border-walnut/20"
              }`}
              title="Click to view all employee petty cash expenses"
            >
              <div className="text-xs font-bold uppercase tracking-wider text-walnut flex items-center justify-between">
                <span className="group-hover:text-charcoal transition">Total Petty Cash Spent</span>
                <span className="p-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-rose-700">
                {kpi ? formatCurrency(kpi.totalSpent) : "—"}
              </div>
              <div className="mt-1 text-[11px] text-walnut flex items-center justify-between">
                <span>Total expenses recorded by employees</span>
                <span className="text-[10px] text-gold font-bold opacity-0 group-hover:opacity-100 transition">View Expenses →</span>
              </div>
            </div>

            {/* 3. AVAILABLE PETTY CASH BALANCE */}
            <div
              onClick={() => {
                setActiveTab("employees");
                setEmployeeFilterType("WITH_BALANCE");
                setSearch("");
              }}
              className={`rounded-2xl border bg-white p-5 shadow-sm hover:border-gold/60 hover:shadow-md transition cursor-pointer group ${
                employeeFilterType === "WITH_BALANCE" && activeTab === "employees" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-walnut/20"
              }`}
              title="Click to show employees with positive available balance"
            >
              <div className="text-xs font-bold uppercase tracking-wider text-walnut flex items-center justify-between">
                <span className="group-hover:text-charcoal transition">Available Petty Cash Balance</span>
                <span className="p-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  <Coins className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-amber-700">
                {kpi
                  ? formatCurrency(kpi.availableBalance ?? Math.max(0, kpi.totalAllocated - kpi.totalSpent - kpi.totalReturned))
                  : "—"}
              </div>
              <div className="mt-1 text-[11px] text-walnut flex items-center justify-between">
                <span>Formula: Total Given − Total Spent</span>
                <span className="text-[10px] text-gold font-bold opacity-0 group-hover:opacity-100 transition">Filter Balances →</span>
              </div>
            </div>

            {/* 4. ACTIVE EMPLOYEES */}
            <div
              onClick={() => {
                setActiveTab("employees");
                setEmployeeFilterType("ACTIVE");
                setSearch("");
              }}
              className={`rounded-2xl border bg-white p-5 shadow-sm hover:border-gold/60 hover:shadow-md transition cursor-pointer group ${
                employeeFilterType === "ACTIVE" && activeTab === "employees" ? "border-gold ring-2 ring-gold/20" : "border-walnut/20"
              }`}
              title="Click to show all active employees with petty cash records"
            >
              <div className="text-xs font-bold uppercase tracking-wider text-walnut flex items-center justify-between">
                <span className="group-hover:text-charcoal transition">Active Employees</span>
                <span className="p-1 rounded-md bg-cream text-charcoal border border-walnut/20">
                  <User className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-charcoal">
                {kpi?.activeEmployeeCount ||
                  employees.filter((e) => e.hasActivity || e.currentBalance > 0).length ||
                  0}
              </div>
              <div className="mt-1 text-[11px] text-walnut flex items-center justify-between">
                <span>Employees with Petty Cash records</span>
                <span className="text-[10px] text-gold font-bold opacity-0 group-hover:opacity-100 transition">View Employees →</span>
              </div>
            </div>
          </div>

          {/* Segmented Controls & Search Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-walnut/15 pb-3">
            <div className="flex space-x-1 rounded-xl bg-cream/40 border border-walnut/20 p-1">
              <button
                onClick={() => setActiveTab("employees")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  activeTab === "employees"
                    ? "bg-charcoal text-white shadow-sm"
                    : "text-walnut hover:text-charcoal"
                }`}
              >
                Employees Ledger ({employees.length})
              </button>
              <button
                onClick={() => setActiveTab("advances")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  activeTab === "advances"
                    ? "bg-charcoal text-white shadow-sm"
                    : "text-walnut hover:text-charcoal"
                }`}
              >
                All Advances ({advances.length})
              </button>
              <button
                onClick={() => setActiveTab("expenses")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  activeTab === "expenses"
                    ? "bg-charcoal text-white shadow-sm"
                    : "text-walnut hover:text-charcoal"
                }`}
              >
                All Expenses ({expenses.length})
              </button>
              <button
                onClick={() => setActiveTab("settlements")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  activeTab === "settlements"
                    ? "bg-charcoal text-white shadow-sm"
                    : "text-walnut hover:text-charcoal"
                }`}
              >
                Settlements ({settlements.length})
              </button>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search employee, ref, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchData()}
                className="w-full sm:w-64 rounded-xl border border-walnut/20 bg-white px-3 py-1.5 text-xs text-charcoal focus:border-gold focus:outline-none placeholder:text-walnut/50"
              />

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
                  size="sm"
                />
              )}
            </div>
          </div>

          {/* Active Filter Notification Banner */}
          {employeeFilterType !== "ALL" && activeTab === "employees" && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 animate-in fade-in duration-200">
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
          <div className="rounded-2xl border border-walnut/20 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-walnut">
                Loading petty cash records...
              </div>
            ) : activeTab === "employees" ? (
              /* ─── EMPLOYEES PETTY CASH SUMMARY TABLE ────────────────────── */
              filteredEmployees.length === 0 ? (
                <div className="p-12 text-center text-xs text-walnut">
                  No employees found matching your query.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-walnut/15 bg-[#FAF8F5] text-walnut uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3">Employee Name</th>
                        <th className="px-4 py-3">Department / Role</th>
                        <th className="px-4 py-3 text-right">Total Cash Received</th>
                        <th className="px-4 py-3 text-right">Total Cash Spent</th>
                        <th className="px-4 py-3 text-right">Current Balance</th>
                        <th className="px-4 py-3 text-center">Open Floats</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-walnut/10 font-medium text-charcoal">
                      {filteredEmployees.map((emp) => (
                        <tr
                          key={emp.id}
                          className="hover:bg-cream/20 transition cursor-pointer"
                          onClick={() => setSelectedEmployeeId(emp.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-xs text-amber-900 shrink-0">
                                {emp.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-charcoal hover:text-amber-800 transition">
                                  {emp.name}
                                </div>
                                <div className="text-[11px] text-walnut">
                                  {emp.email || emp.phone || "Employee"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-walnut">
                            {emp.department || "Operations"} • {emp.designation || emp.role}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                            {formatCurrency(emp.totalCashReceived)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                            {formatCurrency(emp.totalCashSpent)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-md ${
                                emp.currentBalance > 0
                                  ? "bg-amber-50 border border-amber-200 text-amber-800 font-bold"
                                  : "text-walnut"
                              }`}
                            >
                              {formatCurrency(emp.currentBalance)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono">
                            <span className="px-2 py-0.5 rounded-md bg-cream border border-walnut/20 text-walnut text-[11px] font-bold">
                              {emp.advanceCount} issued
                            </span>
                          </td>
                          <td
                            className="px-4 py-3 text-right space-x-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setSelectedEmployeeId(emp.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cream/60 hover:bg-cream border border-walnut/20 text-charcoal font-bold text-[11px] transition"
                            >
                              <Eye className="w-3.5 h-3.5 text-gold" />
                              <span>View Ledger</span>
                            </button>
                            <button
                              onClick={() => {
                                setPreselectedEmployeeId(emp.id);
                                setIsIssueModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gold hover:bg-gold-hover text-charcoal font-bold text-[11px] transition"
                            >
                              <Coins className="w-3 h-3" />
                              <span>+ Float</span>
                            </button>
                            <button
                              onClick={() => {
                                setPreselectedEmployeeId(emp.id);
                                setIsRecordExpenseModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cream hover:bg-cream/80 border border-walnut/20 text-walnut font-bold text-[11px] transition"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Spend</span>
                            </button>
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
                <div className="p-12 text-center text-xs text-walnut">
                  No employee advances recorded yet. Click <strong>+ Issue Advance</strong> above to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-walnut/15 bg-[#FAF8F5] text-walnut uppercase tracking-wider font-bold">
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
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-walnut/10 font-medium text-charcoal">
                      {advances.map((adv) => (
                        <tr key={adv.id} className="hover:bg-cream/20 transition">
                          <td className="px-4 py-3 font-mono font-bold text-charcoal">
                            {adv.referenceNo}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedEmployeeId(adv.employeeId)}
                              className="font-bold text-charcoal hover:text-amber-800 transition underline underline-offset-2"
                            >
                              {adv.employee.fullName}
                            </button>
                          </td>
                          <td className="px-4 py-3 font-mono text-walnut">{formatDate(adv.issuedDate)}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                            {formatCurrency(adv.amount)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-rose-700">
                            {formatCurrency(adv.totalSpent || 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-blue-700">
                            {formatCurrency(adv.cashReturned || 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                            {formatCurrency(adv.outstandingBalance || 0)}
                          </td>
                          <td className="px-4 py-3 text-walnut">
                            {adv.project ? adv.project.referenceNo : "General Float"}
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(adv.status)}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setSelectedAdvanceId(adv.id);
                                setIsRecordExpenseModalOpen(true);
                              }}
                              className="text-amber-800 hover:text-charcoal font-bold text-[11px]"
                            >
                              + Spend
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAdvanceId(adv.id);
                                setIsSettleModalOpen(true);
                              }}
                              className="text-walnut hover:text-charcoal font-bold text-[11px]"
                            >
                              Settle
                            </button>
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
                <div className="p-12 text-center text-xs text-walnut">
                  No petty cash expenses logged yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-walnut/15 bg-[#FAF8F5] text-walnut uppercase tracking-wider font-bold">
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
                    <tbody className="divide-y divide-walnut/10 font-medium text-charcoal">
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-cream/20 transition">
                          <td className="px-4 py-3 font-mono font-bold text-charcoal">{exp.referenceNo}</td>
                          <td className="px-4 py-3 font-mono text-walnut">{exp.advance.referenceNo}</td>
                          <td className="px-4 py-3 font-mono text-walnut">{formatDate(exp.expenseDate)}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-md bg-cream border border-walnut/20 px-2 py-0.5 font-mono text-[11px] text-charcoal">
                              {exp.categoryKey}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-charcoal max-w-xs truncate">{exp.purpose}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="px-4 py-3 text-walnut">{exp.paymentMethod}</td>
                          <td className="px-4 py-3 text-walnut">
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
                <div className="p-12 text-center text-xs text-walnut">
                  No settlement records yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-walnut/15 bg-[#FAF8F5] text-walnut uppercase tracking-wider font-bold">
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
                    <tbody className="divide-y divide-walnut/10 font-medium text-charcoal">
                      {settlements.map((s) => (
                        <tr key={s.id} className="hover:bg-cream/20 transition">
                          <td className="px-4 py-3 font-mono font-bold text-charcoal">{s.referenceNo}</td>
                          <td className="px-4 py-3 font-mono text-walnut">{s.advance.referenceNo}</td>
                          <td className="px-4 py-3 font-mono text-walnut">{formatDate(s.settlementDate)}</td>
                          <td className="px-4 py-3 text-right font-mono">{formatCurrency(s.totalAdvance)}</td>
                          <td className="px-4 py-3 text-right font-mono text-rose-700">{formatCurrency(s.totalSpent)}</td>
                          <td className="px-4 py-3 text-right font-mono text-blue-700">{formatCurrency(s.cashReturned)}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-charcoal">{formatCurrency(s.difference)}</td>
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-walnut">Loading Petty Cash & Employee Ledger...</div>}>
      <PettyCashContent />
    </Suspense>
  );
}
