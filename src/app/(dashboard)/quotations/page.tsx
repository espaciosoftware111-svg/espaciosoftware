"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  Printer,
  ChevronDown,
  Layers,
  User,
  FolderOpen,
  Package,
  Sparkles,
  ArrowRight,
  Receipt,
  Download,
  ShieldCheck,
  CreditCard,
  Building,
  Calendar,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePermissions } from "@/components/providers/permissions-provider";
import { ExportButton } from "@/components/reports/export-button";
import { FilterSelect } from "@/components/ui/filter-select";
import { SelectFinalisedQuotationModal } from "@/components/quotations/select-finalised-quotation-modal";
import { clientCache } from "@/lib/client-cache";

interface QuotationListItem {
  id: string;
  referenceNo: string;
  title: string;
  customTitle?: string;
  quotationType?: "LEAD" | "PROJECT" | "MATERIAL";
  revision: number;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  advancePaid?: number;
  balanceDue?: number;
  validityDate: string | null;
  createdAt: string;
  lead: { id: string; referenceNo: string; clientName: string; phone: string; stage: string } | null;
  client: { id: string; referenceNo: string; fullName: string; phone: string } | null;
  project: { id: string; referenceNo: string; title: string; stage: string } | null;
  createdBy: { id: string; fullName: string; email: string } | null;
  approvedBy: { id: string; fullName: string } | null;
  _count: { items: number; childRevisions: number };
}

interface InvoiceListItem {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate?: string;
  customerName: string;
  customerGstin?: string;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
  client?: { id: string; referenceNo: string; fullName: string; phone: string } | null;
  project?: { id: string; referenceNo: string; title: string } | null;
  quotation?: { id: string; referenceNo: string; totalAmount: number } | null;
  payments?: { id: string; referenceNo: string; amount: number; paymentDate: string; paymentMethod: string }[];
}

interface Metrics {
  totalQuotations: number;
  totalDraft: number;
  totalApproved: number;
  totalActivePipeline: number;
}

export default function QuotationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can, isSuperAdmin, isAdmin } = usePermissions();

  // Active Tab: "complete-interiors" | "materials" | "invoices"
  const tabParam = searchParams.get("tab") || searchParams.get("section");
  const typeParam = searchParams.get("type");

  const activeTab = useMemo(() => {
    if (tabParam === "invoices" || tabParam === "invoice") return "invoices";
    if (tabParam === "materials" || tabParam === "material" || typeParam === "MATERIAL") return "materials";
    return "complete-interiors";
  }, [tabParam, typeParam]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Quotation Data State
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalQuotations: 0,
    totalDraft: 0,
    totalApproved: 0,
    totalActivePipeline: 0,
  });
  const [loadingQuotations, setLoadingQuotations] = useState(true);

  // Invoices Data State
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Modal State for Generating Invoice
  const [isSelectQuotationModalOpen, setIsSelectQuotationModalOpen] = useState(false);

  // Dropdown for creating new quotation
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNewMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Quotations based on active tab
  const fetchQuotations = useCallback(async () => {
    try {
      setLoadingQuotations(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      if (activeTab === "materials") {
        params.set("type", "MATERIAL");
      } else if (activeTab === "complete-interiors") {
        params.set("type", "LEAD");
      }

      params.set("page", page.toString());
      params.set("limit", "25");

      const res = await fetch(`/api/v1/quotations?${params.toString()}`);
      const json = await res.json();

      if (json?.success) {
        setQuotations(json.data.quotations);
        setMetrics(json.data.metrics);
        setTotalPages(json.data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to load quotations:", err);
    } finally {
      setLoadingQuotations(false);
    }
  }, [search, statusFilter, activeTab, page]);

  // Fetch Invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setLoadingInvoices(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/v1/invoices?${params.toString()}`);
      const json = await res.json();

      if (json?.success) {
        setInvoices(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoadingInvoices(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    if (activeTab === "invoices") {
      fetchInvoices();
    } else {
      fetchQuotations();
    }
  }, [activeTab, fetchQuotations, fetchInvoices]);

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case "APPROVED":
      case "PAID":
      case "ISSUED":
        return "completed";
      case "SENT":
      case "READY_TO_SEND":
      case "PARTIALLY_PAID":
        return "active";
      case "INTERNAL_REVIEW":
      case "NEGOTIATION":
      case "PENDING_APPROVAL":
        return "pending";
      case "REJECTED":
      case "CANCELLED":
      case "VOID":
      case "OVERDUE":
        return "danger";
      case "DRAFT":
      case "SUPERSEDED":
      default:
        return "neutral";
    }
  };

  const invoiceMetrics = useMemo(() => {
    const totalInvoices = invoices.length;
    const totalBilled = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.outstandingAmount || 0), 0);
    return { totalInvoices, totalBilled, totalPaid, totalOutstanding };
  }, [invoices]);

  return (
    <div className="p-4 sm:p-6 w-full space-y-5">
      {/* 1. Master Header Section with Navigation Subsection Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Quotation & Invoice Hub</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ESPACIO Design System
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage Complete Interiors estimations, Standalone Materials & Services quotations, and generate immutable Invoices from finalised source records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <ExportButton
            reportKey="sales_quotations"
            label="Export Records"
            size="sm"
          />

          {activeTab === "invoices" ? (
            <Button
              onClick={() => setIsSelectQuotationModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Generate Invoice</span>
            </Button>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ NEW QUOTATION</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isNewMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isNewMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                      Select Quotation Type
                    </span>
                  </div>

                  {/* 1. Complete Interiors */}
                  <Link
                    href="/quotations/new?type=LEAD"
                    onClick={() => setIsNewMenuOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-emerald-50/70 transition-colors group border-b border-slate-100/60"
                  >
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg group-hover:bg-emerald-200 transition-colors mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-900 flex items-center gap-1">
                        1. Complete Interiors
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </div>
                      <div className="text-2xs font-semibold text-emerald-700 uppercase tracking-wide">Full Turnkey Project</div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Room-wise BOQ breakdown, finishes, inclusions, exclusions, and payment milestones.
                      </p>
                    </div>
                  </Link>

                  {/* 2. Materials Quotation */}
                  <Link
                    href="/quotations/new?type=MATERIAL"
                    onClick={() => setIsNewMenuOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-teal-50/70 transition-colors group"
                  >
                    <div className="p-2 bg-teal-100 text-teal-700 rounded-lg group-hover:bg-teal-200 transition-colors mt-0.5">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-teal-900 flex items-center gap-1">
                        2. Materials Quotation
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </div>
                      <div className="text-2xs font-semibold text-teal-700 uppercase tracking-wide">Standalone Material Supply</div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Standalone materials supply, hardware, loose fixtures, and labour packages.
                      </p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. THREE DEDICATED SUBSECTION TABS (QUOTATION MODULE STRUCTURE) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 overflow-x-auto">
        {/* Tab 1: Complete Interiors */}
        <Link
          href="/quotations?tab=complete-interiors"
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all ${
            activeTab === "complete-interiors"
              ? "bg-white text-emerald-900 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <User className={`w-4 h-4 ${activeTab === "complete-interiors" ? "text-emerald-600" : "text-slate-400"}`} />
          <span>Complete Interiors</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            activeTab === "complete-interiors" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
          }`}>
            {activeTab === "complete-interiors" ? metrics.totalQuotations : "Quote"}
          </span>
        </Link>

        {/* Tab 2: Materials Quotation */}
        <Link
          href="/quotations?tab=materials"
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all ${
            activeTab === "materials"
              ? "bg-white text-teal-900 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Package className={`w-4 h-4 ${activeTab === "materials" ? "text-teal-600" : "text-slate-400"}`} />
          <span>Materials Quotation</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            activeTab === "materials" ? "bg-teal-100 text-teal-800" : "bg-slate-200 text-slate-600"
          }`}>
            {activeTab === "materials" ? metrics.totalQuotations : "Materials"}
          </span>
        </Link>

        {/* Tab 3: Invoice */}
        <Link
          href="/quotations?tab=invoices"
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all ${
            activeTab === "invoices"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Receipt className={`w-4 h-4 ${activeTab === "invoices" ? "text-emerald-600" : "text-slate-400"}`} />
          <span>Invoice</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            activeTab === "invoices" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
          }`}>
            {activeTab === "invoices" ? invoices.length : "Invoices"}
          </span>
        </Link>
      </div>

      {/* 3. Metrics Overview Cards */}
      {activeTab === "invoices" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Total Invoices</p>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5 font-mono">{invoiceMetrics.totalInvoices}</h3>
                <p className="text-2xs text-slate-400 mt-0.5">Generated from Finalised Quotes</p>
              </div>
              <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
                <Receipt className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Total Invoiced Amount</p>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5 font-mono">₹{invoiceMetrics.totalBilled.toLocaleString("en-IN")}</h3>
                <p className="text-2xs text-slate-400 mt-0.5">Gross billed project value</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                <FileText className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Total Collected</p>
                <h3 className="text-xl font-bold text-emerald-700 mt-0.5 font-mono">₹{invoiceMetrics.totalPaid.toLocaleString("en-IN")}</h3>
                <p className="text-2xs text-emerald-600 mt-0.5">Realized bank receipts</p>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Pending Receivables</p>
                <h3 className="text-xl font-bold text-amber-700 mt-0.5 font-mono">₹{invoiceMetrics.totalOutstanding.toLocaleString("en-IN")}</h3>
                <p className="text-2xs text-amber-600 mt-0.5">Due across active projects</p>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                <Clock className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
                  {activeTab === "materials" ? "Total Materials Quotes" : "Total Complete Interior Quotes"}
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5 font-mono">{metrics.totalQuotations}</h3>
                <p className="text-2xs text-slate-400 mt-0.5">All versions & revisions</p>
              </div>
              <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Active Pipeline</p>
                <h3 className="text-xl font-bold text-blue-700 mt-0.5 font-mono">{metrics.totalActivePipeline}</h3>
                <p className="text-2xs text-blue-600 mt-0.5">Sent & Under Negotiation</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                <Send className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Finalised / Approved</p>
                <h3 className="text-xl font-bold text-emerald-700 mt-0.5 font-mono">{metrics.totalApproved}</h3>
                <p className="text-2xs text-emerald-600 mt-0.5">Locked & Ready for Invoices</p>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Draft Estimates</p>
                <h3 className="text-xl font-bold text-amber-700 mt-0.5 font-mono">{metrics.totalDraft}</h3>
                <p className="text-2xs text-amber-600 mt-0.5">Editable in preparation</p>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                <Clock className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === "invoices"
                  ? "Search invoice #, client, project, or quote #..."
                  : "Search quote #, client, lead, or project..."
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <FilterSelect
              label="Status"
              placeholder="All Statuses"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val || "ALL");
                setPage(1);
              }}
              options={
                activeTab === "invoices"
                  ? [
                      { value: "ALL", label: "All Statuses" },
                      { value: "ISSUED", label: "Issued" },
                      { value: "PAID", label: "Paid" },
                      { value: "PARTIALLY_PAID", label: "Partially Paid" },
                      { value: "CANCELLED", label: "Cancelled / Void" },
                    ]
                  : [
                      { value: "ALL", label: "All Statuses" },
                      { value: "DRAFT", label: "Drafts" },
                      { value: "INTERNAL_REVIEW", label: "In Review" },
                      { value: "SENT", label: "Sent / Pipeline" },
                      { value: "NEGOTIATION", label: "Negotiation" },
                      { value: "APPROVED", label: "Approved / Finalised" },
                      { value: "REJECTED", label: "Rejected" },
                    ]
              }
              variant="slate"
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* 5. Central Tables */}
      {activeTab === "invoices" ? (
        /* INVOICES TABLE */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden w-full relative">
          {loadingInvoices ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-2">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Invoices Generated Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Invoices are generated directly from Finalised Complete Interiors or Materials Quotations.
              </p>
              <div className="mt-4">
                <Button
                  onClick={() => setIsSelectQuotationModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 px-4 gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Generate First Invoice
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3 w-[15%]">Invoice #</th>
                    <th className="py-2.5 px-3 w-[16%]">Client</th>
                    <th className="py-2.5 px-3 w-[15%]">Project / Entity</th>
                    <th className="py-2.5 px-3 w-[14%]">Source Quotation</th>
                    <th className="py-2.5 px-3 w-[12%] text-right">Amount</th>
                    <th className="py-2.5 px-3 w-[10%] text-center">Status</th>
                    <th className="py-2.5 px-3 w-[8%]">Date</th>
                    <th className="py-2.5 px-3 w-[10%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => {
                    const clientName = inv.customerName || inv.client?.fullName || "N/A";
                    const projectTitle = inv.project?.title || "Direct Account";
                    const quoteRef = inv.quotation?.referenceNo || "Direct";
                    const invoiceDateStr = new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    });

                    const targetStudioUrl = `/quotations/${inv.quotation?.id || inv.id}?mode=INVOICE&invoiceId=${inv.id}`;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* 1. Invoice Number */}
                        <td className="py-2.5 px-3 whitespace-nowrap overflow-hidden">
                          <Link
                            href={targetStudioUrl}
                            className="font-bold font-mono text-emerald-700 hover:text-emerald-900 hover:underline text-xs flex items-center gap-1.5"
                            title="Open Invoice Studio"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{inv.invoiceNo} ↗</span>
                          </Link>
                        </td>

                        {/* 2. Client */}
                        <td className="py-2.5 px-3 overflow-hidden">
                          <div className="font-semibold text-slate-900 text-xs truncate" title={clientName}>
                            {clientName}
                          </div>
                          {inv.customerGstin && (
                            <div className="text-[10px] text-slate-400 font-mono">GST: {inv.customerGstin}</div>
                          )}
                        </td>

                        {/* 3. Project */}
                        <td className="py-2.5 px-3 overflow-hidden">
                          <div className="text-xs text-slate-700 font-medium truncate" title={projectTitle}>
                            {projectTitle}
                          </div>
                        </td>

                        {/* 4. Source Quotation */}
                        <td className="py-2.5 px-3 overflow-hidden">
                          {inv.quotation ? (
                            <Link
                              href={`/quotations/${inv.quotation.id}`}
                              className="inline-flex items-center gap-1 text-2xs font-mono font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                            >
                              <FileText className="w-3 h-3" />
                              {quoteRef} ↗
                            </Link>
                          ) : (
                            <span className="text-2xs text-slate-400 italic">Standalone</span>
                          )}
                        </td>

                        {/* 5. Amount */}
                        <td className="py-2.5 px-3 text-right tabular-nums overflow-hidden">
                          <div className="font-bold text-slate-900 font-mono text-xs">
                            ₹{inv.grandTotal.toLocaleString("en-IN")}
                          </div>
                          {inv.paidAmount > 0 && (
                            <div className="text-[10px] text-emerald-600 font-mono">
                              Paid: ₹{inv.paidAmount.toLocaleString("en-IN")}
                            </div>
                          )}
                        </td>

                        {/* 6. Status */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap overflow-hidden">
                          <Badge variant={getStatusBadgeVariant(inv.status)} className="text-[10px] px-1.5 py-0.2">
                            {inv.status}
                          </Badge>
                        </td>

                        {/* 7. Date */}
                        <td className="py-2.5 px-3 text-2xs text-slate-500 whitespace-nowrap overflow-hidden">
                          {invoiceDateStr}
                        </td>

                        {/* 8. Actions */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={`/api/v1/invoices/${inv.id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View & Download Invoice PDF"
                            >
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200">
                                <Printer className="w-3 h-3 mx-auto" />
                              </Button>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* QUOTATIONS TABLE (COMPLETE INTERIORS & MATERIALS) */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden w-full relative">
          {loadingQuotations && quotations.length > 0 && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-100 overflow-hidden z-20">
              <div className="h-full bg-emerald-600 animate-pulse w-full" />
            </div>
          )}

          {loadingQuotations && quotations.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading quotations...</div>
          ) : quotations.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No Quotations Found</h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-md mx-auto">
                {search || statusFilter !== "ALL"
                  ? "No quotations match your current search or filter criteria. Try adjusting your query."
                  : activeTab === "materials"
                  ? "No Materials Quotations created yet. Create a standalone materials quotation to get started."
                  : "No Complete Interior Quotations created yet. Create your first turnkey quotation."}
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <Link href={activeTab === "materials" ? "/quotations/new?type=MATERIAL" : "/quotations/new?type=LEAD"}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 gap-1.5 font-bold">
                    <Plus className="w-3 h-3" />
                    {activeTab === "materials" ? "Create Materials Quotation" : "Create Complete Interior Quotation"}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3 w-[11%]">Type</th>
                    <th className="py-2.5 px-3 w-[16%]">Quotation ID / Title</th>
                    <th className="py-2.5 px-3 w-[14%]">Client Name</th>
                    <th className="py-2.5 px-3 w-[15%]">Related Entity</th>
                    <th className="py-2.5 px-3 w-[12%] text-right">Grand Total</th>
                    <th className="py-2.5 px-3 w-[11%] text-right">Balance</th>
                    <th className="py-2.5 px-3 w-[9%] text-center">Status</th>
                    <th className="py-2.5 px-3 w-[6%]">Date</th>
                    <th className="py-2.5 px-3 w-[6%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotations.map((q) => {
                    const clientName = q.client?.fullName || q.lead?.clientName || "Direct Prospect";
                    const phone = q.client?.phone || q.lead?.phone || "";
                    const balanceDue = q.balanceDue !== undefined ? q.balanceDue : q.totalAmount;
                    const isMaterial = q.quotationType === "MATERIAL";

                    return (
                      <tr
                        key={q.id}
                        onClick={() => router.push(`/quotations/${q.id}`)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* 1. Type */}
                        <td className="py-2.5 px-3 whitespace-nowrap overflow-hidden">
                          {isMaterial ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 whitespace-nowrap">
                              <Package className="w-3 h-3 text-teal-600 shrink-0" />
                              Materials Quote
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                              <User className="w-3 h-3 text-emerald-600 shrink-0" />
                              Complete Interiors
                            </span>
                          )}
                        </td>

                        {/* 2. Quotation ID */}
                        <td className="py-2.5 px-3 overflow-hidden">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <span className="font-bold font-mono text-slate-900 group-hover:text-emerald-700 transition-colors text-xs truncate">
                              {q.referenceNo}
                            </span>
                            <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                              v{q.revision}
                            </span>
                          </div>
                          <div className="text-2xs text-slate-400 mt-0.5 truncate" title={q.customTitle || q.title}>
                            {q.customTitle || q.title}
                          </div>
                        </td>

                        {/* 3. Client Name */}
                        <td className="py-2.5 px-3 overflow-hidden">
                          <div className="font-semibold text-slate-900 text-xs truncate" title={clientName}>{clientName}</div>
                          {phone && <div className="text-2xs text-slate-400 font-mono mt-0.5 truncate">{phone}</div>}
                        </td>

                        {/* 4. Related Entity */}
                        <td className="py-2.5 px-3 overflow-hidden">
                          {q.project ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-2xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium border border-purple-200 whitespace-nowrap">
                                <FolderOpen className="w-2.5 h-2.5 text-purple-500 shrink-0" />
                                PROJ: {q.project.referenceNo}
                              </span>
                              <div className="text-2xs text-slate-400 truncate" title={q.project.title}>
                                {q.project.title}
                              </div>
                            </div>
                          ) : q.lead ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-2xs bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-medium border border-amber-200 whitespace-nowrap">
                                <User className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                LEAD: {q.lead.referenceNo}
                              </span>
                              <div className="text-2xs text-slate-400 truncate">
                                Stage: <span className="font-medium text-slate-600">{q.lead.stage}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-2xs text-slate-400 italic">Direct Quotation</span>
                          )}
                        </td>

                        {/* 5. Grand Total */}
                        <td className="py-2.5 px-3 text-right tabular-nums overflow-hidden">
                          <div className="font-bold text-slate-900 font-mono text-xs whitespace-nowrap">
                            ₹{q.totalAmount.toLocaleString("en-IN")}
                          </div>
                          {q.discountAmount > 0 && (
                            <div className="text-[10px] text-red-600 font-mono whitespace-nowrap">
                              Disc: -₹{q.discountAmount.toLocaleString("en-IN")}
                            </div>
                          )}
                        </td>

                        {/* 6. Remaining Balance */}
                        <td className="py-2.5 px-3 text-right tabular-nums overflow-hidden">
                          <div className="font-bold font-mono text-xs text-slate-800 whitespace-nowrap">
                            ₹{balanceDue.toLocaleString("en-IN")}
                          </div>
                          {q.advancePaid && q.advancePaid > 0 ? (
                            <div className="text-[10px] text-emerald-600 font-mono whitespace-nowrap">
                              Paid: ₹{q.advancePaid.toLocaleString("en-IN")}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 whitespace-nowrap">No Payments</div>
                          )}
                        </td>

                        {/* 7. Status */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap overflow-hidden">
                          <Badge variant={getStatusBadgeVariant(q.status)} className="text-[10px] px-1.5 py-0.2">
                            {q.status}
                          </Badge>
                        </td>

                        {/* 8. Date */}
                        <td className="py-2.5 px-3 text-2xs text-slate-500 whitespace-nowrap overflow-hidden">
                          <div className="font-medium text-slate-700">
                            {new Date(q.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </div>
                        </td>

                        {/* 9. Actions */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/quotations/${q.id}`}>
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200" title="Open Studio">
                                <Eye className="w-3 h-3 mx-auto" />
                              </Button>
                            </Link>
                            <a href={`/api/v1/quotations/${q.id}/pdf`} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200" title="Print / PDF">
                                <Printer className="w-3 h-3 mx-auto" />
                              </Button>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Select Finalised Quotation Modal */}
      <SelectFinalisedQuotationModal
        isOpen={isSelectQuotationModalOpen}
        onClose={() => setIsSelectQuotationModalOpen(false)}
      />
    </div>
  );
}
