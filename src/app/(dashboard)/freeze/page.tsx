"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import {
  Snowflake,
  RotateCcw,
  Search,
  Users,
  PackageCheck,
  FileText,
  Receipt,
  CreditCard,
  Wallet,
  FolderKanban,
  Building2,
  Truck,
  FileCheck,
  RefreshCw,
  AlertTriangle,
  Clock,
  Eye,
  CheckCircle2,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Code2,
  Copy,
  Check,
  Calendar,
  Link2,
  ExternalLink,
  Trash2,
} from "lucide-react";

interface FreezeItem {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  subtitle?: string | null;
  category: string;
  amount?: number | null;
  deletedAt: string;
  reason?: string | null;
  deletedBy?: { id: string; fullName: string; email: string } | null;
  payload: string;
}

export const FREEZE_SECTIONS = [
  { key: "ALL", label: "All Frozen Items", icon: Layers, href: "/freeze" },
  { key: "LEAD", label: "Leads (CRM)", icon: Users, href: "/leads" },
  { key: "MATERIAL_LEAD", label: "Material Leads", icon: PackageCheck, href: "/material-leads" },
  { key: "PROJECT", label: "Projects", icon: FolderKanban, href: "/projects" },
  { key: "QUOTATION", label: "Quotations", icon: FileText, href: "/quotations" },
  { key: "INVOICE", label: "Invoices", icon: Receipt, href: "/quotations?tab=invoices" },
  { key: "PAYMENT", label: "Payments", icon: CreditCard, href: "/finance/payments" },
  { key: "EXPENSE", label: "Expenses & Petty Cash", icon: Wallet, href: "/finance/expenses" },
  { key: "DOCUMENT", label: "Documents", icon: FileCheck, href: "/documents" },
  { key: "VENDOR", label: "Vendors", icon: Truck, href: "/procurement/vendors" },
  { key: "CLIENT", label: "Clients", icon: Building2, href: "/crm/clients" },
];

function getSectionInfo(entityType: string, parsedPayload?: any) {
  const type = (entityType || "").toUpperCase();
  if (type === "MATERIAL_LEAD" || (type === "LEAD" && parsedPayload?.isMaterialLead)) {
    return {
      name: "Material Leads",
      href: "/material-leads",
      badgeVariant: "warning" as const,
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold text-[10px]",
      tagLabel: "MATERIAL LEAD",
    };
  }
  switch (type) {
    case "LEAD":
      return {
        name: "Leads",
        href: "/leads",
        badgeVariant: "active" as const,
        badgeClass: "bg-blue-100 text-blue-900 border-blue-300 font-bold text-[10px]",
        tagLabel: "LEAD (CRM)",
      };
    case "PROJECT":
      return {
        name: "Projects",
        href: "/projects",
        badgeVariant: "neutral" as const,
        badgeClass: "bg-indigo-100 text-indigo-900 border-indigo-300 font-bold text-[10px]",
        tagLabel: "PROJECT",
      };
    case "QUOTATION":
      return {
        name: "Quotations",
        href: "/quotations",
        badgeVariant: "pending" as const,
        badgeClass: "bg-purple-100 text-purple-900 border-purple-300 font-bold text-[10px]",
        tagLabel: "QUOTATION",
      };
    case "INVOICE":
      return {
        name: "Invoices",
        href: "/quotations?tab=invoices",
        badgeVariant: "completed" as const,
        badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold text-[10px]",
        tagLabel: "INVOICE",
      };
    case "PAYMENT":
      return {
        name: "Payments",
        href: "/finance/payments",
        badgeVariant: "completed" as const,
        badgeClass: "bg-teal-100 text-teal-900 border-teal-300 font-bold text-[10px]",
        tagLabel: "PAYMENT",
      };
    case "EXPENSE":
      return {
        name: "Expenses",
        href: "/finance/expenses",
        badgeVariant: "warning" as const,
        badgeClass: "bg-rose-100 text-rose-900 border-rose-300 font-bold text-[10px]",
        tagLabel: "EXPENSE",
      };
    case "DOCUMENT":
      return {
        name: "Documents",
        href: "/documents",
        badgeVariant: "neutral" as const,
        badgeClass: "bg-cyan-100 text-cyan-900 border-cyan-300 font-bold text-[10px]",
        tagLabel: "DOCUMENT",
      };
    case "VENDOR":
      return {
        name: "Vendors",
        href: "/procurement/vendors",
        badgeVariant: "neutral" as const,
        badgeClass: "bg-orange-100 text-orange-900 border-orange-300 font-bold text-[10px]",
        tagLabel: "VENDOR",
      };
    case "CLIENT":
      return {
        name: "Clients",
        href: "/crm/clients",
        badgeVariant: "neutral" as const,
        badgeClass: "bg-slate-100 text-slate-800 border-slate-300 font-bold text-[10px]",
        tagLabel: "CLIENT",
      };
    default:
      return {
        name: type,
        href: "/dashboard",
        badgeVariant: "neutral" as const,
        badgeClass: "bg-slate-100 text-slate-800 border-slate-300 font-bold text-[10px]",
        tagLabel: type,
      };
  }
}

function formatFieldLabel(key: string): string {
  const overrides: Record<string, string> = {
    referenceNo: "Reference Number",
    referenceNoExt: "External / Receipt Ref",
    paymentDate: "Payment Date",
    paymentMethod: "Payment Method",
    gstInvoiceId: "Linked GST Invoice",
    quotationId: "Linked Quotation",
    leadId: "Linked Lead",
    projectId: "Linked Project",
    clientId: "Linked Client",
    receivableId: "Linked Receivable",
    milestoneId: "Linked Milestone",
    financialAccountId: "Financial Account",
    clientName: "Client Name",
    clientPhone: "Client Phone",
    clientEmail: "Client Email",
    dueDate: "Due Date",
    invoiceDate: "Invoice Date",
    totalAmount: "Total Amount",
    taxAmount: "GST / Tax Amount",
    subTotal: "Sub Total",
    netAmount: "Net Amount",
    stage: "Pipeline Stage",
    status: "Record Status",
    priority: "Priority",
    notes: "Notes & Remarks",
    description: "Description",
    createdAt: "Created Date",
    updatedAt: "Last Updated",
    deletedAt: "Frozen Date",
    bankName: "Bank Name",
    category: "Category",
    source: "Lead Source",
    location: "Location / Property Address",
    requirement: "Client Requirement",
    estimatedBudget: "Estimated Budget",
    contractValue: "Contract Value",
  };
  if (overrides[key]) return overrides[key];

  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    BANK_TRANSFER: "Bank Transfer (NEFT/RTGS)",
    UPI: "UPI Payment",
    CHEQUE: "Bank Cheque",
    CASH: "Cash",
    CREDIT_CARD: "Credit Card",
    DEBIT_CARD: "Debit Card",
    ONLINE: "Online Gateway",
  };
  return map[method] || method.replace(/_/g, " ");
}

function formatValueDisplay(key: string, val: any): React.ReactNode {
  if (val === null || val === undefined || val === "") {
    return <span className="text-slate-400 italic">None</span>;
  }

  if (typeof val === "boolean") {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
          val
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-slate-100 text-slate-600 border border-slate-200"
        }`}
      >
        {val ? "Yes" : "No"}
      </span>
    );
  }

  if (typeof val === "number") {
    const isCurrency = /(amount|value|total|price|cost|budget|balance|subtotal|tax)/i.test(key);
    if (isCurrency) {
      return (
        <span className="font-mono font-bold text-emerald-700 tabular-nums">
          {formatCurrency(val)}
        </span>
      );
    }
    return <span className="font-mono font-semibold text-slate-800">{val}</span>;
  }

  if (typeof val === "string") {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      return (
        <span className="font-medium text-slate-800 inline-flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {formatDate(val)}
        </span>
      );
    }

    if (key === "paymentMethod") {
      return (
        <span className="font-semibold text-slate-800 inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded text-[11px]">
          <CreditCard className="w-3.5 h-3.5 text-amber-600" />
          {formatPaymentMethod(val)}
        </span>
      );
    }

    if (key === "status" || key === "stage") {
      const isGreen = /^(RECORDED|PAID|ACTIVE|APPROVED|WON|COMPLETED)$/i.test(val);
      const isAmber = /^(PENDING|IN_PROGRESS|DRAFT|SCHEDULED|NEW)$/i.test(val);
      const isRed = /^(CANCELLED|VOIDED|LOST|OVERDUE|REJECTED)$/i.test(val);

      const colorClass = isGreen
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : isAmber
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : isRed
        ? "bg-rose-50 text-rose-800 border-rose-200"
        : "bg-slate-100 text-slate-800 border-slate-200";

      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${colorClass}`}>
          ✓ {val.replace(/_/g, " ")}
        </span>
      );
    }

    return <span className="font-medium text-slate-800">{val}</span>;
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-slate-400 italic">Empty List</span>;
    if (val.every((item) => typeof item === "string" || typeof item === "number")) {
      return (
        <div className="flex flex-wrap gap-1">
          {val.map((item, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-700 font-mono"
            >
              {String(item)}
            </span>
          ))}
        </div>
      );
    }
    return (
      <span className="text-slate-500 font-mono text-[11px]">
        [{val.length} items recorded]
      </span>
    );
  }

  if (typeof val === "object") {
    return (
      <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] space-y-1">
        {Object.entries(val).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">{formatFieldLabel(k)}:</span>
            <span className="font-semibold text-slate-800">{String(v)}</span>
          </div>
        ))}
      </div>
    );
  }

  return <span className="font-medium text-slate-800">{String(val)}</span>;
}

function HumanReadablePayload({ payload }: { payload: string }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showBlankFields, setShowBlankFields] = useState(false);

  let data: Record<string, any> = {};
  try {
    data = JSON.parse(payload);
  } catch {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
        Corrupted snapshot data.
      </div>
    );
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const idFields: [string, any][] = [];
  const primaryFields: [string, any][] = [];
  const blankFields: [string, any][] = [];
  const nestedArrays: [string, any[]][] = [];

  const priorityOrder = [
    "referenceNo",
    "referenceNoExt",
    "title",
    "clientName",
    "phone",
    "email",
    "amount",
    "totalAmount",
    "grandTotal",
    "subTotal",
    "status",
    "stage",
    "paymentMethod",
    "paymentDate",
    "invoiceDate",
    "location",
    "requirement",
    "notes",
  ];

  const sortedKeys = Object.keys(data).sort((a, b) => {
    const idxA = priorityOrder.indexOf(a);
    const idxB = priorityOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  for (const key of sortedKeys) {
    const val = data[key];

    if (/password|secret|salt|hash/i.test(key)) continue;

    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
      nestedArrays.push([key, val]);
      continue;
    }

    if (/id$/i.test(key) && typeof val === "string" && val.length > 10) {
      idFields.push([key, val]);
      continue;
    }

    if (val === null || val === undefined || val === "") {
      blankFields.push([key, val]);
      continue;
    }

    primaryFields.push([key, val]);
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* 1. Primary Attributes */}
      {primaryFields.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              Active Attributes at Freeze Snapshot
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {primaryFields.length} attributes recorded
            </span>
          </div>

          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {primaryFields.map(([key, val]) => (
              <div
                key={key}
                className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between gap-1 hover:bg-slate-50 transition"
              >
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {formatFieldLabel(key)}
                </span>
                <div className="text-xs break-words">
                  {formatValueDisplay(key, val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* 2. Nested Line Items */}
      {nestedArrays.map(([arrKey, items]) => (
        <div
          key={arrKey}
          className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden"
        >
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              {formatFieldLabel(arrKey)} ({items.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200">
                <tr>
                  {Object.keys(items[0] || {})
                    .slice(0, 6)
                    .map((col) => (
                      <th key={col} className="px-3 py-2">
                        {formatFieldLabel(col)}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50">
                    {Object.keys(items[0] || {})
                      .slice(0, 6)
                      .map((col) => (
                        <td key={col} className="px-3 py-2 text-slate-700">
                          {formatValueDisplay(col, row[col])}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* 3. Linked System Identifiers */}
      {idFields.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-slate-500" />
              Linked Database Identifiers
            </span>
            <span className="text-[10px] text-slate-500">Foreign key references</span>
          </div>

          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {idFields.map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 gap-2"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-slate-500 block truncate">
                    {formatFieldLabel(key)}
                  </span>
                  <span className="font-mono text-[11px] text-slate-700 truncate block">
                    {String(val)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(String(val), key)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition shrink-0 cursor-pointer"
                  title="Copy ID"
                >
                  {copiedKey === key ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Collapsible Blank Fields */}
      {blankFields.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowBlankFields(!showBlankFields)}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition flex items-center gap-1 cursor-pointer"
          >
            <span>
              {showBlankFields ? "Hide" : "Show"} unpopulated fields ({blankFields.length})
            </span>
          </button>

          {showBlankFields && (
            <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-500">
              {blankFields.map(([key]) => (
                <div key={key} className="truncate">
                  <span className="text-slate-400 font-medium">
                    {formatFieldLabel(key)}:
                  </span>{" "}
                  <span className="italic">Not set</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FreezePage() {
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<FreezeItem[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [unfreezingId, setUnfreezingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<FreezeItem | null>(null);
  const [snapshotViewMode, setSnapshotViewMode] = useState<"FORMATTED" | "RAW">("FORMATTED");
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/trash/stats");
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  const fetchFreezeItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(selectedCategory !== "ALL" ? { category: selectedCategory } : {}),
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      });

      const res = await fetch(`/api/v1/trash?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        setItems(json.data.items || []);
        setTotalPages(json.data.pagination?.totalPages || 1);
        setTotalCount(json.data.pagination?.total || 0);
      } else {
        setItems([]);
      }
    } catch {
      toast.error("Failed to Load Freeze Vault", "Could not load frozen items.");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedCategory, searchQuery, toast]);

  useEffect(() => {
    fetchStats();
    fetchFreezeItems();
  }, [fetchStats, fetchFreezeItems]);

  const handleUnfreeze = async (item: FreezeItem) => {
    let parsedPayload: any = null;
    try {
      parsedPayload = JSON.parse(item.payload);
    } catch {
      parsedPayload = null;
    }
    const sectionInfo = getSectionInfo(item.entityType, parsedPayload);

    setUnfreezingId(item.id);
    try {
      const res = await fetch(`/api/v1/trash/${item.id}/restore`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Unfreeze failed");
      }

      toast.success(
        "Record Unfrozen",
        `${item.title} has been successfully unfrozen and restored to active ${sectionInfo.name}.`
      );
      await fetchStats();
      await fetchFreezeItems();
    } catch (err: any) {
      toast.error("Unfreeze Failed", err.message || "Failed to unfreeze record");
    } finally {
      setUnfreezingId(null);
    }
  };

  const handlePermanentPurge = async (item: FreezeItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently purge "${item.title}"? This cannot be restored.`
    );
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/v1/trash/${item.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Purge failed");
      }

      toast.success("Purged Permanently", "Record purged permanently from Freeze Vault.");
      await fetchStats();
      await fetchFreezeItems();
    } catch (err: any) {
      toast.error("Purge Failed", err.message || "Failed to purge record");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    setIsClearingAll(true);
    try {
      const url =
        selectedCategory === "ALL"
          ? "/api/v1/trash"
          : `/api/v1/trash?category=${selectedCategory}`;
      const res = await fetch(url, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Purge failed");
      }

      toast.success("Vault Cleared", json.data?.message || "Freeze vault cleared.");
      setShowClearModal(false);
      await fetchStats();
      await fetchFreezeItems();
    } catch (err: any) {
      toast.error("Clear Failed", err.message || "Failed to clear records");
    } finally {
      setIsClearingAll(false);
    }
  };

  const getCategoryCount = (key: string) => {
    if (key === "ALL") return stats.all || 0;
    if (key === "MATERIAL_LEAD") return stats.material_lead || 0;
    return (stats as any)[key.toLowerCase()] || 0;
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1700px] mx-auto space-y-5">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-2xs">
              <Snowflake className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Freeze Vault</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200 tabular-nums">
              {stats.all || 0} frozen
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centrally view, inspect, and unfreeze records across all linked software sections: Leads, Material Leads, Projects, Quotations, Invoices, Payments, Expenses, and Documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              fetchStats();
              fetchFreezeItems();
            }}
            className="text-xs h-8 gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          {totalCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowClearModal(true)}
              className="text-xs h-8 gap-1.5 bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 font-bold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purge {selectedCategory === "ALL" ? "All Frozen" : selectedCategory}
            </Button>
          )}
        </div>
      </div>

      {/* 2. Linked ERP Sections - Quick Access Banner */}
      <div className="p-3 bg-gradient-to-r from-sky-50/60 via-slate-50 to-amber-50/40 rounded-xl border border-sky-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link2 className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800">Linked Software Sections:</span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Records frozen from any section appear here and can be jumped to directly:
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {FREEZE_SECTIONS.filter((s) => s.key !== "ALL").map((sec) => (
            <Link
              key={sec.key}
              href={sec.href}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50/50 transition cursor-pointer shadow-2xs"
              title={`Jump to active ${sec.label}`}
            >
              <span>{sec.label}</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Section Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 no-scrollbar">
        {FREEZE_SECTIONS.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.key;
          const count = getCategoryCount(cat.key);
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.key);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                  isSelected ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search frozen records by reference ID, title, client name, notes, or reason..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 pl-9 pr-4 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-sky-500 text-slate-900 shadow-2xs"
          />
        </div>
      </div>

      {/* 5. Freeze Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
            <p className="text-xs font-medium">Loading frozen records...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-500">
              <Snowflake className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Freeze Vault is Clear</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedCategory === "ALL"
                  ? "No records are currently frozen in the software. All modules are operating with active data."
                  : `No frozen records found under ${selectedCategory}.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-3">Linked Section</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Frozen Date</th>
                  <th className="py-3 px-3">Frozen By / Reason</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {items.map((item) => {
                  let parsedPayload: any = null;
                  try {
                    parsedPayload = JSON.parse(item.payload);
                  } catch {
                    parsedPayload = null;
                  }
                  const sectionInfo = getSectionInfo(item.entityType, parsedPayload);

                  return (
                    <tr key={item.id} className="hover:bg-sky-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[11px] text-slate-500 truncate max-w-md">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${sectionInfo.badgeClass}`}
                          >
                            {sectionInfo.tagLabel}
                          </span>
                          <Link
                            href={sectionInfo.href}
                            className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-500 hover:text-sky-700 hover:underline transition"
                            title={`Jump to active ${sectionInfo.name}`}
                          >
                            <span>Open</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {item.amount !== null && item.amount !== undefined && item.amount > 0 ? (
                          formatCurrency(item.amount)
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-[11px] font-medium text-slate-700">
                          {formatDate(item.deletedAt)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatRelativeTime(item.deletedAt)}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-[11px] font-medium text-slate-700">
                          {item.deletedBy?.fullName || "System Admin"}
                        </div>
                        {item.reason && (
                          <div className="text-[10px] text-slate-500 truncate max-w-xs italic">
                            "{item.reason}"
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSnapshotViewMode("FORMATTED");
                              setViewingItem(item);
                            }}
                            className="text-[11px] py-1 h-7 bg-white text-slate-700 border-slate-300 hover:bg-slate-50 font-medium cursor-pointer"
                            title="View Snapshot"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </Button>

                          <Button
                            size="sm"
                            variant="primary"
                            disabled={unfreezingId === item.id}
                            onClick={() => handleUnfreeze(item)}
                            className="text-[11px] py-1 h-7 bg-sky-600 hover:bg-sky-700 text-white font-bold gap-1 cursor-pointer shadow-2xs"
                            title={`Unfreeze and restore to active ${sectionInfo.name}`}
                          >
                            <Snowflake
                              className={`w-3.5 h-3.5 ${unfreezingId === item.id ? "animate-spin" : ""}`}
                            />
                            {unfreezingId === item.id ? "Unfreezing..." : "Unfreeze"}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deletingId === item.id}
                            onClick={() => handlePermanentPurge(item)}
                            className="text-[11px] py-1 h-7 bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-400 font-bold cursor-pointer"
                            title="Permanently Purge Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-600">
            <div>
              Showing page <strong className="text-slate-900">{page}</strong> of{" "}
              <strong className="text-slate-900">{totalPages}</strong> ({totalCount} total items)
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="text-xs h-7 gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="text-xs h-7 gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Snapshot Modal */}
      {viewingItem && (
        <Modal
          isOpen={!!viewingItem}
          onClose={() => setViewingItem(null)}
          title={`Frozen Snapshot: ${viewingItem.title}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {(() => {
              let parsed: any = null;
              try {
                parsed = JSON.parse(viewingItem.payload);
              } catch {
                parsed = null;
              }
              const secInfo = getSectionInfo(viewingItem.entityType, parsed);

              return (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Origin Section
                    </span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      {secInfo.name}
                      <Link
                        href={secInfo.href}
                        className="text-sky-600 hover:text-sky-800 inline-flex items-center"
                        title="Jump to section"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Amount
                    </span>
                    <span className="font-bold font-mono text-emerald-700">
                      {viewingItem.amount ? formatCurrency(viewingItem.amount) : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Frozen Date
                    </span>
                    <span className="font-medium text-slate-800">
                      {formatDate(viewingItem.deletedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                      Frozen By
                    </span>
                    <span className="font-medium text-slate-800">
                      {viewingItem.deletedBy?.fullName || "System Admin"}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* View Mode Switcher */}
            <div className="flex items-center justify-between pb-1 pt-1">
              <span className="text-[11px] font-bold text-slate-700">
                Frozen Record Attributes &amp; Line Items:
              </span>
              <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSnapshotViewMode("FORMATTED")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer flex items-center gap-1 ${
                    snapshotViewMode === "FORMATTED"
                      ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileText className="w-3 h-3 text-sky-600" />
                  <span>Structured View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSnapshotViewMode("RAW")}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer flex items-center gap-1 ${
                    snapshotViewMode === "RAW"
                      ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Code2 className="w-3 h-3 text-slate-500" />
                  <span>Raw JSON</span>
                </button>
              </div>
            </div>

            {snapshotViewMode === "FORMATTED" ? (
              <HumanReadablePayload payload={viewingItem.payload} />
            ) : (
              <div>
                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto max-h-72 border border-slate-800">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(viewingItem.payload), null, 2);
                    } catch {
                      return viewingItem.payload;
                    }
                  })()}
                </pre>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button size="sm" variant="outline" onClick={() => setViewingItem(null)}>
                Close
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={async () => {
                  await handleUnfreeze(viewingItem);
                  setViewingItem(null);
                }}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold gap-1 cursor-pointer"
              >
                <Snowflake className="w-3.5 h-3.5" />
                Unfreeze This Record
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Clear Freeze Vault Confirmation Modal */}
      {showClearModal && (
        <Modal
          isOpen={showClearModal}
          onClose={() => setShowClearModal(false)}
          title="Clear Freeze Vault"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-900">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block">Irreversible Permanent Purge</strong>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Are you sure you want to permanently clear all frozen items from{" "}
                  <strong>
                    {selectedCategory === "ALL"
                      ? "the entire Freeze Vault"
                      : `category: ${selectedCategory}`}
                  </strong>
                  ? Once purged, these snapshots cannot be unfrozen.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button size="sm" variant="ghost" onClick={() => setShowClearModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={isClearingAll}
                onClick={handleClearAll}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isClearingAll ? "Purging..." : "Permanently Purge Records"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
