"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileText,
  CreditCard,
  Building2,
  Calendar,
  Lock,
  Unlock,
  RefreshCw,
  Plus,
} from "lucide-react";
import { RecordVendorPaymentModal } from "@/components/finance/record-vendor-payment-modal";
import { CreateInvoiceModal } from "@/components/finance/create-invoice-modal";

export default function FinanceOverviewPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // Modals
  const [isVendorPaymentModalOpen, setIsVendorPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, [year, month]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/finance/overview?year=${year}&month=${month}`);
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E8E2D8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-[#F3EEE5] text-[#89652D] font-bold text-[10px] uppercase tracking-wider border border-[#E8E2D8]">
              AUTHORITATIVE FINANCIAL CONTROL
            </span>
            <h1 className="text-xl font-bold text-[#262421] tracking-tight">Financial Overview</h1>
          </div>
          <p className="text-xs text-[#77716A] mt-0.5">
            Authoritative company-wide income, expenses, gross/net profit, cash flow, and financial account balances
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl p-1 shadow-2xs">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="h-8 px-2 bg-transparent text-[#262421] font-bold text-xs focus:outline-none cursor-pointer"
            >
              {monthNames.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="h-8 px-2 bg-transparent text-[#262421] font-bold text-xs focus:outline-none border-l border-[#E8E2D8] cursor-pointer"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <button
            onClick={() => fetchOverview()}
            className="p-2 rounded-xl border border-[#E8E2D8] bg-[#FFFEFC] hover:bg-[#F3EEE5] text-[#77716A] hover:text-[#262421] transition-colors shadow-2xs cursor-pointer"
            title="Refresh Financial Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsVendorPaymentModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#262421] bg-[#FFFEFC] hover:bg-[#F3EEE5] border border-[#E8E2D8] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#89652D]" />
            <span>Pay Vendor</span>
          </button>

          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#FAF8F5] bg-[#242321] hover:bg-[#383633] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate GST Invoice</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Recognized Revenue */}
        <div className="bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-1.5 hover:border-[#B99558]/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">Recognized Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#536B4E]">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#262421] font-mono tabular-nums">
              ₹{loading ? "..." : (metrics?.totalRevenue ?? 0).toLocaleString("en-IN")}
            </span>
            {metrics?.momRevenueGrowthPct !== null && (
              <span
                className={`text-xs font-bold flex items-center gap-0.5 ${
                  metrics?.momRevenueGrowthPct >= 0 ? "text-[#536B4E]" : "text-[#A45435]"
                }`}
              >
                {metrics?.momRevenueGrowthPct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(metrics?.momRevenueGrowthPct)}% MoM
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#77716A] border-t border-[#E8E2D8]/60 pt-2 mt-1">Verified Client Payments in month</p>
        </div>

        {/* Gross Profit & Margin */}
        <div className="bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-1.5 hover:border-[#B99558]/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">Gross Profit</span>
            <div className="w-7 h-7 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#89652D]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#262421] font-mono tabular-nums">
              ₹{loading ? "..." : (metrics?.grossProfit ?? 0).toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-bold bg-[#F3EEE5] text-[#89652D] px-2 py-0.5 rounded-md border border-[#E8E2D8]">
              {metrics?.grossProfitMarginPct ?? 0}% Margin
            </span>
          </div>
          <p className="text-[11px] text-[#77716A] border-t border-[#E8E2D8]/60 pt-2 mt-1">
            Revenue − Direct Costs (₹{(metrics?.directCosts ?? 0).toLocaleString("en-IN")})
          </p>
        </div>

        {/* Net Profit & Margin */}
        <div className="bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-1.5 hover:border-[#B99558]/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">Net Operating Profit</span>
            <div className="w-7 h-7 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#262421]">
              <PieChart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#262421] font-mono tabular-nums">
              ₹{loading ? "..." : (metrics?.netProfit ?? 0).toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-bold bg-[#F8EBD5] text-[#89652D] px-2 py-0.5 rounded-md border border-[#DFD4C3]">
              {metrics?.netProfitMarginPct ?? 0}% Net Margin
            </span>
          </div>
          <p className="text-[11px] text-[#77716A] border-t border-[#E8E2D8]/60 pt-2 mt-1">
            Gross Profit − Overheads (₹{(metrics?.businessOverheads ?? 0).toLocaleString("en-IN")})
          </p>
        </div>

        {/* Net Cash Flow */}
        <div className="bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-1.5 hover:border-[#B99558]/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">Net Cash Flow</span>
            <div className="w-7 h-7 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#536B4E]">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                (metrics?.netCashFlow ?? 0) >= 0 ? "text-[#536B4E]" : "text-[#A45435]"
              }`}
            >
              ₹{loading ? "..." : (metrics?.netCashFlow ?? 0).toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-[#77716A] font-medium">In − Out</span>
          </div>
          <p className="text-[11px] text-[#77716A] border-t border-[#E8E2D8]/60 pt-2 mt-1">
            In ₹{(metrics?.totalCashInflow ?? 0).toLocaleString("en-IN")} • Out ₹{(metrics?.totalCashOutflow ?? 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Cash & Bank Balances Strip */}
      <div className="bg-[#242321] text-[#FAF8F5] rounded-xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#383633]">
        <div>
          <h3 className="font-bold text-sm text-[#FAF8F5]">Combined Liquid Cash & Bank Position</h3>
          <p className="text-[#A7A199] text-xs mt-0.5">Authoritative balances across operating bank accounts, cash lockers, and UPI</p>
        </div>

        <div className="flex items-center gap-6 overflow-x-auto w-full md:w-auto">
          {metrics?.accountsBalance?.map((acc: any) => (
            <div key={acc.id} className="border-l border-[#45423E] pl-4 space-y-0.5 shrink-0">
              <div className="text-[10px] font-semibold text-[#A7A199] uppercase tracking-wider">{acc.name}</div>
              <div className="text-base font-bold text-[#FAF8F5] font-mono tabular-nums">
                ₹{acc.currentBalance.toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Hub */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Link
          href="/finance/receivables"
          className="p-3.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl hover:border-[#B99558] hover:shadow-2xs transition-all group"
        >
          <div className="text-[10px] font-bold uppercase text-[#77716A]">Client Receivables</div>
          <div className="font-bold text-[#262421] text-xs sm:text-sm mt-1 group-hover:text-[#89652D] transition-colors">Receivables Directory</div>
        </Link>

        <Link
          href="/finance/payables"
          className="p-3.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl hover:border-[#B99558] hover:shadow-2xs transition-all group"
        >
          <div className="text-[10px] font-bold uppercase text-[#77716A]">Vendor Payables</div>
          <div className="font-bold text-[#262421] text-xs sm:text-sm mt-1 group-hover:text-[#89652D] transition-colors">Payables Directory</div>
        </Link>

        <Link
          href="/finance/vendor-payments"
          className="p-3.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl hover:border-[#B99558] hover:shadow-2xs transition-all group"
        >
          <div className="text-[10px] font-bold uppercase text-[#77716A]">Vendor Payments</div>
          <div className="font-bold text-[#262421] text-xs sm:text-sm mt-1 group-hover:text-[#89652D] transition-colors">Payments & Reversals</div>
        </Link>

        <Link
          href="/finance/invoices"
          className="p-3.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl hover:border-[#B99558] hover:shadow-2xs transition-all group"
        >
          <div className="text-[10px] font-bold uppercase text-[#77716A]">GST Invoices</div>
          <div className="font-bold text-[#262421] text-xs sm:text-sm mt-1 group-hover:text-[#89652D] transition-colors">Tax Invoicing Engine</div>
        </Link>

        <Link
          href="/finance/accounts"
          className="p-3.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl hover:border-[#B99558] hover:shadow-2xs transition-all group"
        >
          <div className="text-[10px] font-bold uppercase text-[#77716A]">Financial Accounts</div>
          <div className="font-bold text-[#262421] text-xs sm:text-sm mt-1 group-hover:text-[#89652D] transition-colors">Bank & Cash Hub</div>
        </Link>

        <Link
          href="/finance/ledger"
          className="p-3.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl hover:border-[#B99558] hover:shadow-2xs transition-all group"
        >
          <div className="text-[10px] font-bold uppercase text-[#77716A]">Financial Ledger</div>
          <div className="font-bold text-[#262421] text-xs sm:text-sm mt-1 group-hover:text-[#89652D] transition-colors">Transaction Trail</div>
        </Link>
      </div>

      {/* Modals */}
      <RecordVendorPaymentModal
        isOpen={isVendorPaymentModalOpen}
        onClose={() => setIsVendorPaymentModalOpen(false)}
        onSuccess={() => fetchOverview()}
      />
      <CreateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSuccess={() => fetchOverview()}
      />
    </div>
  );
}
