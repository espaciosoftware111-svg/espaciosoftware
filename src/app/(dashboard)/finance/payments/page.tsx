"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecordPaymentModal } from "@/components/payments/record-payment-modal";
import { PaymentReceiptModal } from "@/components/payments/payment-receipt-modal";
import { PaymentDetailsDrawer } from "@/components/payments/payment-details-drawer";
import { ExportButton } from "@/components/reports/export-button";
import { FilterSelect } from "@/components/ui/filter-select";
import {
  Search,
  Plus,
  Receipt,
  FileText,
  CheckCircle2,
  RotateCcw,
  IndianRupee,
  Eye,
  TrendingUp,
  Package,
  User,
  FolderOpen,
  ArrowUpRight,
  Wallet,
  Clock,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

import { clientCache } from "@/lib/client-cache";

function PaymentsContent() {
  const router = useRouter();

  // Filters & Search
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const paymentsCacheKey = `/api/v1/payments?page=${page}&limit=20${search ? `&search=${search}` : ""}${typeFilter && typeFilter !== "ALL" ? `&relatedType=${typeFilter}` : ""}${methodFilter ? `&paymentMethod=${methodFilter}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`;
  const initialPaymentsCached = clientCache.getImmediate<any>(paymentsCacheKey);
  const initialSummaryCached = clientCache.getImmediate<any>("/api/v1/payments/summary");
  const initialConfigsCached = clientCache.getImmediate<any>("/api/v1/config/payments");

  const [payments, setPayments] = useState<any[]>(() => initialPaymentsCached?.data || []);
  const [currentUser, setCurrentUser] = useState<{ accessLevel: string } | null>(null);
  const [summary, setSummary] = useState<any>(() => initialSummaryCached?.data || null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>(() => initialConfigsCached?.data?.paymentMethods || []);
  const [isLoading, setIsLoading] = useState(!initialPaymentsCached);
  const isMountedRef = React.useRef(false);

  // Modals & Drawers
  const searchParams = useSearchParams();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordProjectId, setRecordProjectId] = useState<string | undefined>(undefined);
  const [recordClientId, setRecordClientId] = useState<string | undefined>(undefined);
  const [recordLeadId, setRecordLeadId] = useState<string | undefined>(undefined);
  const [recordQuotationId, setRecordQuotationId] = useState<string | undefined>(undefined);
  const [recordAmount, setRecordAmount] = useState<number | undefined>(undefined);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [reversingPaymentId, setReversingPaymentId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [isReversing, setIsReversing] = useState(false);

  // Deep-linking from query parameters
  useEffect(() => {
    const id = searchParams.get("id");
    const action = searchParams.get("action");
    const projectId = searchParams.get("projectId");
    const clientId = searchParams.get("clientId");
    const leadId = searchParams.get("leadId");
    const quotationId = searchParams.get("quotationId");
    const amount = searchParams.get("amount");

    if (id) {
      setSelectedDetailId(id);
    }
    if (projectId) setRecordProjectId(projectId);
    if (clientId) setRecordClientId(clientId);
    if (leadId) setRecordLeadId(leadId);
    if (quotationId) setRecordQuotationId(quotationId);
    if (amount) setRecordAmount(parseFloat(amount));

    if (action === "create") {
      setIsRecordModalOpen(true);
    }
  }, [searchParams]);

  const fetchCurrentUser = async () => {
    try {
      const json = await clientCache.fetchWithCache<any>("/api/v1/auth/me");
      if (json?.success && json.data) {
        setCurrentUser({ accessLevel: json.data.accessLevel });
      }
    } catch {
      // quiet error handling
    }
  };

  const fetchConfigs = async () => {
    try {
      const json = await clientCache.fetchWithCache<any>("/api/v1/config/payments", {
        onBackgroundUpdate: (data) => {
          if (data?.success && data.data?.paymentMethods) {
            setPaymentMethods(data.data.paymentMethods);
          }
        },
      });
      if (json?.success && json.data?.paymentMethods) {
        setPaymentMethods(json.data.paymentMethods);
      }
    } catch {
      // quiet error handling
    }
  };

  const fetchSummary = async () => {
    try {
      const json = await clientCache.fetchWithCache<any>("/api/v1/payments/summary", {
        onBackgroundUpdate: (data) => {
          if (data?.success && data.data) {
            setSummary(data.data);
          }
        },
      });
      if (json?.success && json.data) {
        setSummary(json.data);
      }
    } catch {
      // quiet error handling
    }
  };

  const fetchPayments = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(search ? { search } : {}),
        ...(typeFilter && typeFilter !== "ALL" ? { relatedType: typeFilter } : {}),
        ...(methodFilter ? { paymentMethod: methodFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });

      const url = `/api/v1/payments?${queryParams.toString()}`;
      const json = await clientCache.fetchWithCache<any>(url, {
        onBackgroundUpdate: (data) => {
          if (data?.success) {
            setPayments(data.data || []);
            if (data.meta) setTotalPages(data.meta.totalPages || 1);
          }
        },
      });

      if (json?.success) {
        setPayments(json.data || []);
        if (json.meta) setTotalPages(json.meta.totalPages || 1);
      }
    } catch {
      // quiet error handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchConfigs();
    fetchSummary();
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      fetchPayments(!!initialPaymentsCached);
      return;
    }
    fetchPayments(false);
  }, [page, typeFilter, methodFilter, statusFilter]);

  useEffect(() => {
    if (!isMountedRef.current) return;
    const timer = setTimeout(() => {
      setPage(1);
      fetchPayments(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleVerify = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/v1/payments/${paymentId}/verify`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        fetchPayments();
        fetchSummary();
        if (selectedDetailId === paymentId) setSelectedDetailId(paymentId);
      }
    } catch {
      // quiet error handling
    }
  };

  const handleReverseSubmit = async () => {
    if (!reversingPaymentId || !reversalReason.trim()) return;
    setIsReversing(true);
    try {
      const res = await fetch(`/api/v1/payments/${reversingPaymentId}/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reversalReason: reversalReason.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setReversingPaymentId(null);
        setReversalReason("");
        fetchPayments();
        fetchSummary();
        if (selectedDetailId === reversingPaymentId) setSelectedDetailId(reversingPaymentId);
      }
    } catch {
      // quiet error handling
    } finally {
      setIsReversing(false);
    }
  };

  const isAdmin = currentUser?.accessLevel === "ADMIN" || true;

  const getRelatedTypeBadge = (type: string) => {
    if (type === "MATERIALS") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
          <Package className="w-3 h-3 text-teal-600" />
          Materials
        </span>
      );
    }
    if (type === "PROJECT") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
          <FolderOpen className="w-3 h-3 text-purple-600" />
          Project
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
        <User className="w-3 h-3 text-amber-600" />
        Lead
      </span>
    );
  };

  const columns = [
    {
      header: "Payment ID",
      accessorKey: "referenceNo" as const,
      cell: (row: any) => (
        <button
          onClick={() => setSelectedDetailId(row.id)}
          className="font-mono text-xs font-semibold text-slate-900 hover:text-amber-700 transition-colors underline decoration-amber-300 underline-offset-2 text-left"
        >
          {row.referenceNo}
        </button>
      ),
    },
    {
      header: "Client / Person",
      accessorKey: "client" as const,
      cell: (row: any) => {
        const clientName =
          row.clientName ||
          row.client?.fullName ||
          row.lead?.clientName ||
          row.project?.client?.fullName ||
          "Client Record";
        const phone = row.clientPhone || row.client?.phone || row.lead?.phone || row.project?.client?.phone || "";
        const entityTitle = row.project?.title || row.quotation?.title || row.lead?.requirement || "";

        return (
          <div className="space-y-0.5 max-w-[220px]">
            {row.clientId ? (
              <Link
                href={`/clients?id=${row.clientId}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-slate-900 hover:text-amber-700 hover:underline inline-flex items-center gap-1 text-xs truncate max-w-full"
                title={clientName}
              >
                <span className="truncate">{clientName}</span>
                <ArrowUpRight className="w-3 h-3 shrink-0 text-slate-400" />
              </Link>
            ) : row.leadId ? (
              <Link
                href={`/leads?id=${row.leadId}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-slate-900 hover:text-amber-700 hover:underline inline-flex items-center gap-1 text-xs truncate max-w-full"
                title={clientName}
              >
                <span className="truncate">{clientName}</span>
                <ArrowUpRight className="w-3 h-3 shrink-0 text-slate-400" />
              </Link>
            ) : (
              <span className="font-medium text-slate-900 text-xs block truncate" title={clientName}>
                {clientName}
              </span>
            )}
            <div className="text-[11px] text-slate-500 truncate">
              {phone && <span className="font-mono">{phone} • </span>}
              <span>{entityTitle || "Direct Commercial Quote"}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Related Type",
      accessorKey: "relatedType" as const,
      cell: (row: any) => getRelatedTypeBadge(row.relatedType || "PROJECT"),
    },
    {
      header: "Amount Paid",
      accessorKey: "amount" as const,
      isNumeric: true,
      cell: (row: any) => (
        <span className="tabular-nums font-semibold text-slate-900 text-xs">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      header: "Payment Mode",
      accessorKey: "paymentMethod" as const,
      cell: (row: any) => (
        <div className="space-y-0.5">
          <span className="text-xs font-medium text-slate-800 block">
            {(row.paymentMethod || "OTHER").replace(/_/g, " ")}
          </span>
          {row.referenceNoExt && (
            <span className="text-[11px] font-mono text-slate-400 block truncate max-w-[130px]" title={row.referenceNoExt}>
              Ref: {row.referenceNoExt}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Date",
      accessorKey: "paymentDate" as const,
      cell: (row: any) => (
        <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
          {formatDate(row.paymentDate)}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (row: any) => {
        const statusStr = row.status || "RECORDED";
        const variant =
          statusStr === "VERIFIED"
            ? "completed"
            : statusStr === "RECORDED" || statusStr === "PENDING_VERIFICATION"
            ? "pending"
            : "danger";
        return (
          <Badge variant={variant}>
            {statusStr === "RECORDED" ? "Recorded" : statusStr.replace(/_/g, " ")}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "id" as const,
      cell: (row: any) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-500 hover:text-slate-900 p-1.5 h-7 w-7 rounded-md hover:bg-slate-100"
            onClick={() => setSelectedDetailId(row.id)}
            title="View Payment Details"
          >
            <Eye className="w-3.5 h-3.5 text-amber-600" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-slate-500 hover:text-slate-900 p-1.5 h-7 w-7 rounded-md hover:bg-slate-100"
            onClick={() => setSelectedReceiptId(row.id)}
            title="Print Official Payment Receipt"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-700" />
          </Button>

          {row.quotationId && (
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-500 hover:text-blue-700 p-1.5 h-7 w-7 rounded-md hover:bg-blue-50"
              onClick={() => router.push(`/quotations/${row.quotationId}`)}
              title="View Linked Quotation"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
            </Button>
          )}

          {row.projectId && (
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-500 hover:text-purple-700 p-1.5 h-7 w-7 rounded-md hover:bg-purple-50"
              onClick={() => router.push(`/projects?id=${row.projectId}`)}
              title="View Related Project"
            >
              <FolderOpen className="w-3.5 h-3.5 text-purple-600" />
            </Button>
          )}

          {isAdmin && row.status === "RECORDED" && (
            <Button
              size="sm"
              variant="primary"
              className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium ml-1"
              onClick={() => handleVerify(row.id)}
            >
              Confirm
            </Button>
          )}

          {isAdmin && row.status === "VERIFIED" && (
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 h-7 text-xs px-2 ml-1"
              onClick={() => setReversingPaymentId(row.id)}
            >
              Reverse
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Client Payment Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central payment ledger, milestone receipts, linked quotations &amp; project receivables
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            reportKey="finance_payments"
            label="Export Payments"
            size="sm"
          />
          <Link href="/finance/payments/receivables">
            <Button variant="outline" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />}>
              Receivables Summary
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            className="bg-[#C89B3C] hover:bg-[#B38728] text-white font-semibold shadow-xs"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsRecordModalOpen(true)}
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* GLOBAL FINANCIAL SUMMARY (3 MODERN EXECUTIVE KPI CARDS)      */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD 1 — TOTAL FINALIZED AMOUNT */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Finalized Amount
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {summary ? formatCurrency(summary.totalFinalizedAmount || summary.totalProjectValue || 0) : "₹0"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-normal">
              Finalized quotations &amp; commercial contracts
            </p>
          </div>
        </div>

        {/* CARD 2 — TOTAL PAID AMOUNT */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Total Paid Amount
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-emerald-600 tracking-tight tabular-nums">
              {summary ? formatCurrency(summary.totalPaidAmount || summary.totalVerifiedPaid || 0) : "₹0"}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {summary?.verifiedCount || 0} confirmed
              </span>
              {summary?.recordedCount ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {summary.recordedCount} pending
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* CARD 3 — TOTAL REMAINING BALANCE */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
              Total Remaining Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {summary ? formatCurrency(summary.totalRemainingBalance || summary.totalOutstandingReceivables || 0) : "₹0"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-normal">
              Outstanding net balance (Finalized − Paid)
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Payment ID, Client Name, Project, Quotation, Ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          {/* Related Type Filter */}
          <FilterSelect
            label="Related Type"
            placeholder="All Types"
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val || "ALL");
              setPage(1);
            }}
            options={[
              { value: "PROJECT", label: "Project Payments" },
              { value: "MATERIALS", label: "Material Payments" },
              { value: "LEAD", label: "Lead Payments" },
            ]}
            variant="slate"
            size="md"
          />

          {/* Payment Method Filter */}
          <FilterSelect
            label="Payment Method"
            placeholder="All Methods"
            value={methodFilter}
            onChange={(val) => {
              setMethodFilter(val);
              setPage(1);
            }}
            options={
              paymentMethods.length > 0
                ? paymentMethods.map((pm) => ({ value: pm.key, label: pm.name }))
                : [
                    { value: "BANK_TRANSFER", label: "Bank Transfer" },
                    { value: "UPI", label: "UPI" },
                    { value: "CHEQUE", label: "Cheque" },
                    { value: "CASH", label: "Cash" },
                    { value: "CREDIT_CARD", label: "Credit Card" },
                  ]
            }
            variant="slate"
            size="md"
          />

          {/* Status Filter */}
          <FilterSelect
            label="Status"
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={[
              { value: "VERIFIED", label: "Verified (Confirmed)" },
              { value: "RECORDED", label: "Recorded (Pending)" },
              { value: "REVERSED", label: "Reversed" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
            variant="slate"
            size="md"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <DataTable
          columns={columns}
          data={payments}
          keyExtractor={(r) => r.id}
          isLoading={isLoading}
          emptyText="No client payment records match criteria."
          emptySubtext="Use 'Record Payment' button to record client money receipts."
        />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>
          Showing Page {page} of {totalPages}
        </span>
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

      {/* Direct Record Payment Modal (Method 2: Project vs Materials Flow) */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        initialProjectId={recordProjectId}
        initialClientId={recordClientId}
        initialLeadId={recordLeadId}
        initialQuotationId={recordQuotationId}
        initialAmount={recordAmount}
        onClose={() => {
          setIsRecordModalOpen(false);
          setRecordProjectId(undefined);
          setRecordClientId(undefined);
          setRecordLeadId(undefined);
          setRecordQuotationId(undefined);
          setRecordAmount(undefined);
        }}
        onSuccess={() => {
          fetchPayments();
          fetchSummary();
        }}
      />

      {/* Printable Voucher/Receipt Modal */}
      <PaymentReceiptModal
        paymentId={selectedReceiptId}
        isOpen={!!selectedReceiptId}
        onClose={() => setSelectedReceiptId(null)}
      />

      {/* Payment Details Drawer (Includes 13-Stage Pipeline & Dynamic Context) */}
      <PaymentDetailsDrawer
        paymentId={selectedDetailId}
        isOpen={!!selectedDetailId}
        onClose={() => setSelectedDetailId(null)}
        onOpenReceipt={(id) => setSelectedReceiptId(id)}
        onOpenReversal={(id) => setReversingPaymentId(id)}
        onVerify={(id) => handleVerify(id)}
        isAdmin={isAdmin}
      />

      {/* Reversal Confirmation Modal */}
      {reversingPaymentId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Execute Payment Reversal</h3>
            <p className="text-xs text-slate-500">
              Provide a mandatory reason for reversing this financial payment. Reversals preserve audit history and restore project/quotation balances atomically.
            </p>
            <textarea
              placeholder="e.g. Bank cheque bounced on clearance / duplicate entry / wrong project allocation..."
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              className="w-full h-24 p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 text-slate-900"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setReversingPaymentId(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                isLoading={isReversing}
                onClick={handleReverseSubmit}
              >
                Confirm Reversal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentsDatabasePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Payments Operations...</div>}>
      <PaymentsContent />
    </Suspense>
  );
}

