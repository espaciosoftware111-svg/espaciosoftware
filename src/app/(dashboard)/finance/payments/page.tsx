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
  Clock,
  DollarSign,
  Eye,
  AlertTriangle,
  TrendingUp,
  Building,
  Package,
  User,
  FolderOpen,
  Filter,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

function PaymentsContent() {
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<{ accessLevel: string } | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      const res = await fetch("/api/v1/auth/me");
      const json = await res.json();
      if (json.success && json.data) {
        setCurrentUser({ accessLevel: json.data.accessLevel });
      }
    } catch {
      // quiet error handling
    }
  };

  const fetchConfigs = async () => {
    try {
      const res = await fetch("/api/v1/config/payments");
      const json = await res.json();
      if (json.success && json.data?.paymentMethods) {
        setPaymentMethods(json.data.paymentMethods);
      }
    } catch {
      // quiet error handling
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/v1/payments/summary");
      const json = await res.json();
      if (json.success && json.data) {
        setSummary(json.data);
      }
    } catch {
      // quiet error handling
    }
  };

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(search ? { search } : {}),
        ...(typeFilter && typeFilter !== "ALL" ? { relatedType: typeFilter } : {}),
        ...(methodFilter ? { paymentMethod: methodFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });

      const res = await fetch(`/api/v1/payments?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
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
    fetchPayments();
  }, [page, typeFilter, methodFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchPayments();
    }, 300);
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
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
          <Package className="w-3 h-3 text-teal-600" />
          Materials
        </span>
      );
    }
    if (type === "PROJECT") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
          <FolderOpen className="w-3 h-3 text-purple-600" />
          Project
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
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
          className="font-mono text-xs font-bold text-[#1A1612] hover:text-[#C89B3C] transition-colors underline decoration-[#C89B3C]/40 text-left"
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
          <div className="space-y-0.5">
            {row.clientId ? (
              <Link
                href={`/clients?id=${row.clientId}`}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-[#1A1612] hover:text-[#C89B3C] hover:underline block leading-tight truncate max-w-[200px]"
                title={clientName}
              >
                {clientName} ↗
              </Link>
            ) : row.leadId ? (
              <Link
                href={`/leads?id=${row.leadId}`}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-[#1A1612] hover:text-[#C89B3C] hover:underline block leading-tight truncate max-w-[200px]"
                title={clientName}
              >
                {clientName} ↗
              </Link>
            ) : (
              <span className="font-semibold text-[#1A1612] block leading-tight truncate max-w-[200px]" title={clientName}>
                {clientName}
              </span>
            )}
            <div className="text-[10px] text-[#7A7064] truncate max-w-[200px]">
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
        <span className="tabular-nums font-mono font-bold text-[#1A1612] text-xs">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      header: "Payment Type",
      accessorKey: "paymentMethod" as const,
      cell: (row: any) => (
        <div>
          <span className="text-xs font-semibold text-[#1A1612] block">
            {(row.paymentMethod || "OTHER").replace(/_/g, " ")}
          </span>
          {row.referenceNoExt && (
            <span className="text-[10px] font-mono text-[#7A7064] block truncate max-w-[120px]" title={row.referenceNoExt}>
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
        <span className="text-xs text-[#7A7064] font-medium whitespace-nowrap">
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
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="text-[#7A7064] hover:text-[#1A1612] p-1 h-7"
            onClick={() => setSelectedDetailId(row.id)}
            title="View Payment Details"
          >
            <Eye className="w-3.5 h-3.5 text-[#C89B3C]" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-[#7A7064] hover:text-[#1A1612] p-1 h-7"
            onClick={() => setSelectedReceiptId(row.id)}
            title="Print Official Payment Voucher"
          >
            <Receipt className="w-3.5 h-3.5 text-[#6A4A2D]" />
          </Button>

          {row.quotationId && (
            <Button
              size="sm"
              variant="ghost"
              className="text-[#7A7064] hover:text-[#1A1612] p-1 h-7"
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
              className="text-[#7A7064] hover:text-[#1A1612] p-1 h-7"
              onClick={() => router.push(`/projects?id=${row.projectId}`)}
              title="View Related Project & Pipeline"
            >
              <FolderOpen className="w-3.5 h-3.5 text-purple-600" />
            </Button>
          )}

          {isAdmin && row.status === "RECORDED" && (
            <Button
              size="sm"
              variant="primary"
              className="h-7 text-xs px-2 bg-[#10B981] hover:bg-[#059669] text-white"
              onClick={() => handleVerify(row.id)}
            >
              Confirm
            </Button>
          )}

          {isAdmin && row.status === "VERIFIED" && (
            <Button
              size="sm"
              variant="outline"
              className="text-rose-700 border-rose-300 hover:bg-rose-50 h-7 text-xs px-2"
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
    <div className="space-y-5 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2D9CE]">
        <div>
          <h1 className="text-xl font-bold text-[#1A1612] tracking-tight">Client Payment Management</h1>
          <p className="text-xs text-[#7A7064] mt-0.5">
            Central global payment ledger, linked quotations, project pipeline tracking &amp; financial summaries
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
            className="bg-[#C89B3C] hover:bg-[#B38728] text-white font-bold"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsRecordModalOpen(true)}
          >
            + RECORD PAYMENT
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* GLOBAL FINANCIAL SUMMARY (3 DYNAMIC KPI CARDS)               */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD 1 — TOTAL FINALIZED AMOUNT */}
        <div className="p-4.5 bg-white rounded-2xl border border-[#E2D9CE] shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A7064]">
              TOTAL FINALIZED AMOUNT
            </span>
            <div className="text-2xl font-bold font-mono text-[#1A1612] tabular-nums">
              {summary ? formatCurrency(summary.totalFinalizedAmount || summary.totalProjectValue || 0) : "₹0"}
            </div>
            <span className="text-[10px] text-[#7A7064]">
              Finalized quotations &amp; commercial contracts
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E2D9CE] flex items-center justify-center text-[#6A4A2D]">
            <DollarSign className="w-6 h-6 text-[#6A4A2D]" />
          </div>
        </div>

        {/* CARD 2 — TOTAL PAID AMOUNT */}
        <div className="p-4.5 bg-white rounded-2xl border border-[#E2D9CE] shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              TOTAL PAID AMOUNT
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
              {summary ? formatCurrency(summary.totalPaidAmount || summary.totalVerifiedPaid || 0) : "₹0"}
            </div>
            <span className="text-[10px] text-emerald-800 font-medium">
              {summary?.verifiedCount || 0} confirmed • {summary?.recordedCount || 0} recorded
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* CARD 3 — TOTAL REMAINING BALANCE */}
        <div className="p-4.5 bg-white rounded-2xl border border-[#E2D9CE] shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6A4A2D]">
              TOTAL REMAINING BALANCE
            </span>
            <div className="text-2xl font-bold font-mono text-[#1A1612] tabular-nums">
              {summary ? formatCurrency(summary.totalRemainingBalance || summary.totalOutstandingReceivables || 0) : "₹0"}
            </div>
            <span className="text-[10px] text-[#7A7064]">
              Total Finalized − Total Paid
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E2D9CE] flex items-center justify-center text-[#C89B3C]">
            <TrendingUp className="w-6 h-6 text-[#C89B3C]" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-white border border-[#E2D9CE] rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#7A7064] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Payment ID, Client Name, Project, Quotation, Ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8.5 pl-8 pr-3 text-xs bg-[#FAF7F2] border border-[#E2D9CE] rounded-lg focus:outline-none focus:border-[#C89B3C] text-[#1A1612]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          {/* Related Type Filter */}
          <FilterSelect
            label="Related Type"
            placeholder="All Related Types"
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
            variant="beige"
            size="md"
          />

          {/* Payment Method Filter */}
          <FilterSelect
            label="Payment Method"
            placeholder="All Payment Methods"
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
            variant="beige"
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
            variant="beige"
            size="md"
          />
        </div>
      </div>

      {/* Payments Table */}
      <DataTable
        columns={columns}
        data={payments}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        emptyText="No client payment records match criteria."
        emptySubtext="Use '+ RECORD PAYMENT' button to record client money receipts."
      />

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-[#7A7064] pt-1">
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
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#1A1612]/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FAF7F2] rounded-2xl shadow-2xl border border-[#E2D9CE] w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-[#1A1612]">Execute Payment Reversal</h3>
            <p className="text-xs text-[#7A7064]">
              Provide a mandatory reason for reversing this financial payment. Reversals preserve audit history and restore project/quotation balances atomically.
            </p>
            <textarea
              placeholder="e.g. Bank cheque bounced on clearance / duplicate entry / wrong project allocation..."
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              className="w-full h-24 p-3 text-xs bg-white border border-[#E2D9CE] rounded-lg focus:outline-none focus:border-rose-500 text-[#1A1612]"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2D9CE]">
              <Button size="sm" variant="outline" onClick={() => setReversingPaymentId(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#7A7064]">Loading Payments Operations...</div>}>
      <PaymentsContent />
    </Suspense>
  );
}
