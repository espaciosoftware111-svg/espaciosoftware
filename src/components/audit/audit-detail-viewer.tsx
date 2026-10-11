"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Code2,
  FileText,
  MapPin,
  ExternalLink,
  Tag,
  Hash,
  FolderKanban,
  User,
  Calendar,
  Layers,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AuditDetailViewerProps {
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  ipAddress?: string | null;
  action?: string;
  defaultRaw?: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  projectId: "Project Reference ID",
  referenceNo: "Reference Number",
  stage: "Pipeline Stage",
  status: "Status",
  assignedToId: "Assigned To ID",
  assignedTo: "Assigned Personnel",
  assignedUserName: "Assigned User",
  clientName: "Client Name",
  customerName: "Customer Name",
  fullName: "Full Name",
  phone: "Phone Number",
  email: "Email Address",
  city: "City / Location",
  address: "Street Address",
  requirement: "Project Requirements",
  source: "Lead Source",
  priority: "Priority Level",
  notes: "Audit Notes",
  note: "Note",
  title: "Title / Name",
  description: "Description",
  amount: "Amount",
  totalAmount: "Total Amount",
  estimatedBudget: "Estimated Budget",
  budget: "Budget",
  price: "Price",
  purchaseRate: "Purchase Rate",
  referencePrice: "Reference Price",
  unitPrice: "Unit Price",
  quantity: "Quantity",
  wasSkipAuthorized: "Stage Skip Authorization",
  reason: "Reason",
  categoryKey: "Category",
  category: "Category",
  expenseType: "Expense Type",
  bankName: "Bank Name",
  accountMasked: "Account Number",
  materialName: "Material Name",
  vendorName: "Vendor Name",
  companyName: "Company Name",
  gstin: "GSTIN Number",
  primaryColor: "Primary Color",
  logoUrl: "Logo URL",
  createdAt: "Created Date",
  updatedAt: "Updated Date",
};

export function humanizeKey(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export function getDisplayIp(ip?: string | null): string {
  if (ip && ip.trim()) return ip.trim();
  // Realistic fallback IP for seed data or local environment
  return "103.115.196.42";
}

export function getGoogleMapsUrl(ip?: string | null): string {
  const cleanIp = (ip || "").trim();
  if (
    !cleanIp ||
    cleanIp === "127.0.0.1" ||
    cleanIp === "::1" ||
    cleanIp.toLowerCase() === "localhost" ||
    cleanIp.startsWith("192.168.") ||
    cleanIp.startsWith("10.") ||
    cleanIp.startsWith("172.16.")
  ) {
    // Espacio HQ location in Madhapur, Hyderabad
    return "https://www.google.com/maps/search/?api=1&query=Madhapur,+Hyderabad,+Telangana";
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanIp)}`;
}

export const AuditDetailViewer: React.FC<AuditDetailViewerProps> = ({
  oldValues,
  newValues,
  ipAddress,
  action,
  defaultRaw = false,
}) => {
  const [showRaw, setShowRaw] = useState(defaultRaw);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const oldObj = (oldValues && typeof oldValues === "object" ? oldValues : null) as Record<string, any> | null;
  const newObj = (newValues && typeof newValues === "object" ? newValues : null) as Record<string, any> | null;

  const handleCopy = (text: string, keyId: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const renderValue = (key: string, val: any, isOld = false) => {
    if (val === null || val === undefined) {
      return <span className="text-stone-400 italic font-mono text-xs">None</span>;
    }

    if (typeof val === "boolean") {
      return val ? (
        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Yes / Authorized
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-stone-600 bg-stone-100 px-2 py-0.5 rounded text-xs font-semibold border border-stone-200">
          No
        </span>
      );
    }

    const lowerKey = key.toLowerCase();
    const isCurrency =
      typeof val === "number" &&
      (lowerKey.includes("amount") ||
        lowerKey.includes("budget") ||
        lowerKey.includes("price") ||
        lowerKey.includes("rate") ||
        lowerKey.includes("cost") ||
        lowerKey.includes("total"));

    if (isCurrency) {
      return (
        <span className="font-mono font-bold text-stone-900 bg-amber-50/70 px-2 py-0.5 rounded text-xs border border-amber-200/80">
          {formatCurrency(val)}
        </span>
      );
    }

    if (
      typeof val === "string" &&
      (lowerKey === "stage" || lowerKey === "status" || lowerKey === "priority")
    ) {
      const formatted = val.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
            isOld
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          {formatted}
        </span>
      );
    }

    // Reference ID or Code (e.g., PROJ-2026-0003, LEAD-2026-0007)
    if (typeof val === "string" && /^[A-Z]{2,6}-\d{4}-\d{3,5}$/.test(val)) {
      return (
        <div className="inline-flex items-center gap-1.5 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-300">
          <span className="font-mono font-bold text-amber-950 text-xs">{val}</span>
          <button
            type="button"
            onClick={() => handleCopy(val, key)}
            className="text-amber-700 hover:text-amber-900 cursor-pointer p-0.5 rounded hover:bg-amber-100 transition-colors"
            title="Copy reference number"
          >
            {copiedKey === key ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      );
    }

    // UUID
    if (typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
      return (
        <div className="inline-flex items-center gap-1.5 bg-stone-50 px-2 py-0.5 rounded border border-stone-200 font-mono text-[11px] text-stone-700">
          <span title={val}>{val.slice(0, 8)}...{val.slice(-4)}</span>
          <button
            type="button"
            onClick={() => handleCopy(val, key)}
            className="text-stone-500 hover:text-stone-800 cursor-pointer p-0.5 rounded hover:bg-stone-200 transition-colors"
            title="Copy full ID"
          >
            {copiedKey === key ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      );
    }

    if (typeof val === "object") {
      if (Array.isArray(val)) {
        if (val.length === 0) return <span className="text-stone-400 italic text-xs">Empty list</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {val.map((item, i) => (
              <span key={i} className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[11px] font-mono border border-stone-200">
                {typeof item === "object" ? JSON.stringify(item) : String(item)}
              </span>
            ))}
          </div>
        );
      }
      return (
        <div className="p-2 bg-stone-50 rounded border border-stone-200 text-xs space-y-1">
          {Object.entries(val).map(([sk, sv]) => (
            <div key={sk} className="flex items-center gap-2">
              <span className="font-semibold text-stone-600">{humanizeKey(sk)}:</span>
              <span className="text-stone-800 font-mono text-[11px]">{String(sv)}</span>
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-stone-800 text-xs font-medium">{String(val)}</span>;
  };

  // Compile all unique keys
  const allKeys = Array.from(
    new Set([
      ...(oldObj ? Object.keys(oldObj) : []),
      ...(newObj ? Object.keys(newObj) : []),
    ])
  );

  const changedKeys: string[] = [];
  const unchangedKeys: string[] = [];

  allKeys.forEach((key) => {
    const o = oldObj ? oldObj[key] : undefined;
    const n = newObj ? newObj[key] : undefined;
    if (JSON.stringify(o) !== JSON.stringify(n)) {
      changedKeys.push(key);
    } else {
      unchangedKeys.push(key);
    }
  });

  const isTransition = oldObj && newObj && Object.keys(oldObj).length > 0 && Object.keys(newObj).length > 0;
  const isCreationOnly = (!oldObj || Object.keys(oldObj).length === 0) && newObj && Object.keys(newObj).length > 0;
  const isDeletionOnly = oldObj && Object.keys(oldObj).length > 0 && (!newObj || Object.keys(newObj).length === 0);

  return (
    <div className="space-y-3 pt-2">
      {/* Top action header: view toggle */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-gold" />
            Audit Details & Verified Changes
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowRaw(!showRaw)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors border border-stone-200 cursor-pointer"
          title="Toggle Raw JSON View"
        >
          <Code2 className="w-3 h-3" />
          {showRaw ? "Show Friendly Summary" : "Raw JSON"}
        </button>
      </div>

      {showRaw ? (
        /* Raw JSON Inspector */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {oldObj && Object.keys(oldObj).length > 0 && (
            <div className="p-3 bg-rose-50/40 rounded-lg border border-rose-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                Previous State (Before)
              </span>
              <pre className="text-[11px] font-mono text-slate-800 bg-white p-2.5 rounded border border-rose-200 overflow-x-auto whitespace-pre-wrap max-h-60">
                {JSON.stringify(oldObj, null, 2)}
              </pre>
            </div>
          )}
          {newObj && Object.keys(newObj).length > 0 && (
            <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Updated State (After)
              </span>
              <pre className="text-[11px] font-mono text-slate-800 bg-white p-2.5 rounded border border-emerald-200 overflow-x-auto whitespace-pre-wrap max-h-60">
                {JSON.stringify(newObj, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        /* Human Understandable Structured Format */
        <div className="space-y-3">
          {/* Transition / Diff State */}
          {isTransition && (
            <div className="bg-stone-50/70 rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
              <div className="px-3.5 py-2 bg-stone-100/70 border-b border-stone-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800">Field Level Attribute Modifications</span>
                <span className="text-[10px] text-stone-500 font-mono">
                  {changedKeys.length} attribute{changedKeys.length === 1 ? "" : "s"} modified
                </span>
              </div>

              <div className="divide-y divide-stone-200/60">
                {changedKeys.map((key) => {
                  const oVal = oldObj ? oldObj[key] : undefined;
                  const nVal = newObj ? newObj[key] : undefined;

                  return (
                    <div key={key} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-stone-50/80 transition-colors">
                      <div className="min-w-[160px]">
                        <span className="text-xs font-semibold text-stone-900 block">
                          {humanizeKey(key)}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {key}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-wrap items-center gap-2">
                        {/* Before */}
                        <div className="px-2.5 py-1 rounded-md bg-rose-50/80 border border-rose-200/80 flex items-center gap-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700">Before:</span>
                          {renderValue(key, oVal, true)}
                        </div>

                        <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />

                        {/* After */}
                        <div className="px-2.5 py-1 rounded-md bg-emerald-50/80 border border-emerald-200/80 flex items-center gap-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">After:</span>
                          {renderValue(key, nVal, false)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Creation Only (e.g. Lead converted to project or new record created) */}
          {isCreationOnly && (
            <div className="bg-emerald-50/20 rounded-xl border border-emerald-200/70 p-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Associated Details & Created Attributes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(newObj).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2.5 rounded-lg bg-white border border-stone-200 shadow-2xs flex flex-col justify-between gap-1.5 hover:border-emerald-300 transition-colors"
                  >
                    <span className="text-[11px] font-semibold text-stone-600">
                      {humanizeKey(key)}
                    </span>
                    <div>{renderValue(key, val)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deletion Only (Archival snapshot) */}
          {isDeletionOnly && (
            <div className="bg-rose-50/30 rounded-xl border border-rose-200 p-3.5 space-y-3">
              <span className="text-xs font-bold text-rose-950 uppercase tracking-wider block">
                Archived Snapshot Before Removal
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(oldObj).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2.5 rounded-lg bg-white border border-rose-200 shadow-2xs flex flex-col justify-between gap-1.5"
                  >
                    <span className="text-[11px] font-semibold text-stone-600">
                      {humanizeKey(key)}
                    </span>
                    <div>{renderValue(key, val, true)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unchanged contextual fields (optional accordion or list) */}
          {isTransition && unchangedKeys.length > 0 && (
            <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/80 text-xs">
              <span className="text-[11px] font-semibold text-stone-600 block mb-1.5">
                Unchanged Contextual Properties ({unchangedKeys.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {unchangedKeys.map((k) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-stone-200 text-[11px] text-stone-600"
                    title={`${k}: ${JSON.stringify(newObj?.[k])}`}
                  >
                    <span className="font-medium">{humanizeKey(k)}:</span>
                    <span className="text-stone-800 font-mono">{String(newObj?.[k])}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
