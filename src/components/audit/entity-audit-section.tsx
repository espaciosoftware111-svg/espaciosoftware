"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  ShieldCheck,
  Shield,
  Clock,
  User,
  Search,
  Filter,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Laptop,
  Check,
  Calendar,
  Receipt,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";

interface EntityAuditSectionProps {
  entityType: "Lead" | "Project";
  entityId: string | null;
  entityReferenceNo?: string;
  entityTitle?: string;
}

export const EntityAuditSection: React.FC<EntityAuditSectionProps> = ({
  entityType,
  entityId,
  entityReferenceNo,
  entityTitle,
}) => {
  const toast = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  // Manual Audit Verification Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [auditAction, setAuditAction] = useState("AUDIT_COMPLIANCE_VERIFIED");
  const [auditCategory, setAuditCategory] = useState("COMPLIANCE_CHECK");
  const [auditNotes, setAuditNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    if (!entityId) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/v1/audit-logs?entityType=${entityType}&entityId=${entityId}&limit=100`
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to fetch audit records");
      }
      setLogs(json.data || []);
      setTotalCount(json.meta?.total || (json.data || []).length);
    } catch (err: any) {
      setError(err.message || "Error loading audit records");
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogManualAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityId || !auditNotes.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          action: auditAction,
          category: auditCategory,
          notes: auditNotes.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to log audit entry");
      }

      toast.success("Audit Recorded", "Official verification entry logged to audit trail");
      setAuditNotes("");
      setIsAddModalOpen(false);
      fetchAuditLogs();
    } catch (err: any) {
      toast.error("Audit Logging Failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter logs by search and category
  const filteredLogs = logs.filter((log) => {
    const actionStr = (log.action || "").toUpperCase();
    const notesStr = JSON.stringify(log.newValues || {}).toLowerCase();
    const actorStr = (log.user?.fullName || log.user?.email || "").toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    if (query) {
      const match =
        actionStr.toLowerCase().includes(query) ||
        notesStr.includes(query) ||
        actorStr.includes(query) ||
        (log.entityType || "").toLowerCase().includes(query);
      if (!match) return false;
    }

    if (activeCategory === "STAGE_CHANGES") {
      return (
        actionStr.includes("STAGE") ||
        actionStr.includes("STATUS") ||
        actionStr.includes("PROGRESSION")
      );
    }
    if (activeCategory === "SECURITY_AUTH") {
      return (
        actionStr.includes("SKIP") ||
        actionStr.includes("PASSWORD") ||
        actionStr.includes("AUTH") ||
        actionStr.includes("PERMISSION")
      );
    }
    if (activeCategory === "QUOTATIONS") {
      return actionStr.includes("QUOTATION") || actionStr.includes("ESTIMATE");
    }
    if (activeCategory === "EXPENSES_FINANCE") {
      return (
        actionStr.includes("EXPENSE") ||
        actionStr.includes("PAYMENT") ||
        actionStr.includes("INVOICE") ||
        actionStr.includes("FINANCE")
      );
    }
    if (activeCategory === "VERIFICATIONS") {
      return (
        actionStr.includes("AUDIT") ||
        actionStr.includes("VERIF") ||
        actionStr.includes("COMPLIANCE") ||
        actionStr.includes("QUALITY")
      );
    }

    return true;
  });

  // Calculate Action Style
  const getActionBadge = (action: string) => {
    const act = (action || "").toUpperCase();
    if (act.includes("SKIP") || act.includes("PASSWORD")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1 shadow-2xs">
          <Lock className="w-3 h-3 text-rose-600" /> ADMIN AUTHORIZED SKIP
        </span>
      );
    }
    if (act.includes("STAGE") || act.includes("STATUS")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300 flex items-center gap-1 shadow-2xs">
          <ShieldCheck className="w-3 h-3 text-blue-600" /> PIPELINE PROGRESSION
        </span>
      );
    }
    if (act.includes("CREATED")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> CREATION EVENT
        </span>
      );
    }
    if (act.includes("QUOTATION")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-300 flex items-center gap-1 shadow-2xs">
          <FileText className="w-3 h-3 text-purple-600" /> ESTIMATION & BOQ
        </span>
      );
    }
    if (act.includes("AUDIT") || act.includes("VERIF")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-400 flex items-center gap-1 shadow-2xs">
          <Shield className="w-3 h-3 text-amber-700" /> AUDIT VERIFICATION
        </span>
      );
    }
    if (act.includes("EXPENSE") || act.includes("PAYMENT")) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-300 flex items-center gap-1 shadow-2xs">
          <Receipt className="w-3 h-3 text-teal-600" /> FINANCIAL EVENT
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
        {act.replace(/_/g, " ")}
      </span>
    );
  };

  const securityCount = logs.filter(
    (l) =>
      (l.action || "").includes("SKIP") ||
      (l.action || "").includes("PASSWORD") ||
      (l.action || "").includes("AUTH")
  ).length;

  const stageCount = logs.filter(
    (l) => (l.action || "").includes("STAGE") || (l.action || "").includes("STATUS")
  ).length;

  const verificationCount = logs.filter(
    (l) => (l.action || "").includes("AUDIT") || (l.action || "").includes("VERIF")
  ).length;

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-walnut/15">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-charcoal flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold" /> {entityType} Audit & Governance Trail
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-gold/15 text-charcoal border border-gold/30 rounded-full">
              {totalCount} Immutable Records
            </span>
          </div>
          <p className="text-[11px] text-walnut mt-0.5">
            Full tamper-evident compliance history, user actions, stage validations, and password verifications for {entityTitle || entityType} ({entityReferenceNo || entityId})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAuditLogs}
            disabled={isLoading}
            className="text-xs py-1.5 h-8 gap-1 border-walnut/30 text-charcoal hover:bg-gold/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-gold" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs py-1.5 h-8 bg-gold text-charcoal font-bold hover:bg-gold/90 shadow-2xs gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Log Audit Verification
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
          <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
            Total Audit Records
          </span>
          <div className="text-lg font-bold text-charcoal font-mono mt-1">{totalCount}</div>
          <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> System Synchronized
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
          <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
            Stage Progressions
          </span>
          <div className="text-lg font-bold text-blue-700 font-mono mt-1">{stageCount}</div>
          <span className="text-[10px] text-walnut/80 mt-0.5 block">Pipeline transitions</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
          <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
            Admin Authorizations
          </span>
          <div className="text-lg font-bold text-rose-700 font-mono mt-1">{securityCount}</div>
          <span className="text-[10px] text-walnut/80 mt-0.5 block">Password validated skips</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
          <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
            Audit Verifications
          </span>
          <div className="text-lg font-bold text-amber-800 font-mono mt-1">{verificationCount}</div>
          <span className="text-[10px] text-walnut/80 mt-0.5 block">Official audits logged</span>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="bg-white p-3.5 rounded-xl border border-walnut/20 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-walnut/60" />
            <input
              type="text"
              placeholder="Search audit actions, actors, notes, or modified fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-cream/30 border border-walnut/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-walnut hover:text-charcoal px-2 py-1 bg-cream/40 rounded border border-walnut/20 cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-walnut/10">
          {[
            { id: "ALL", label: `All Events (${logs.length})` },
            { id: "STAGE_CHANGES", label: `Stage Transitions (${stageCount})` },
            { id: "SECURITY_AUTH", label: `Security & Skips (${securityCount})` },
            { id: "VERIFICATIONS", label: `Audit Checks (${verificationCount})` },
            { id: "QUOTATIONS", label: "Quotations" },
            { id: "EXPENSES_FINANCE", label: "Finance & Expenses" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-gold text-charcoal font-bold shadow-2xs"
                  : "bg-cream/40 text-walnut hover:bg-cream/70 hover:text-charcoal"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Audit Log Timeline Entries */}
      <div className="space-y-3">
        {isLoading && logs.length === 0 ? (
          <div className="p-12 text-center text-walnut bg-white rounded-xl border border-walnut/20">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold" />
            <p className="text-xs font-semibold">Loading secure audit trail...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-700 bg-rose-50 rounded-xl border border-rose-200 text-xs font-semibold">
            {error}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-walnut bg-white rounded-xl border border-walnut/20 space-y-2">
            <Shield className="w-8 h-8 text-walnut/40 mx-auto" />
            <h4 className="text-xs font-bold text-charcoal">No Matching Audit Entries</h4>
            <p className="text-xs text-walnut max-w-sm mx-auto">
              {searchQuery
                ? "No audit records match your current search query."
                : "Audit trail will automatically populate as actions are performed on this record."}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = !!expandedLogIds[log.id];
            const oldVal = log.parsedOldValues || (log.oldValues ? JSON.parse(log.oldValues) : null);
            const newVal = log.parsedNewValues || (log.newValues ? JSON.parse(log.newValues) : null);
            const hasPayload = (oldVal && Object.keys(oldVal).length > 0) || (newVal && Object.keys(newVal).length > 0);

            return (
              <div
                key={log.id}
                className="bg-white p-4 rounded-xl border border-walnut/20 shadow-2xs space-y-3 hover:border-gold/50 transition-colors"
              >
                {/* Entry Top Row: Action Badge + Actor Info + Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getActionBadge(log.action)}
                    <span className="font-mono text-xs font-bold text-charcoal">
                      {log.action}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-walnut font-mono">
                    <span className="flex items-center gap-1" title={formatDate(log.createdAt)}>
                      <Clock className="w-3.5 h-3.5 text-walnut/70" />
                      {formatRelativeTime(log.createdAt)}
                    </span>
                    <span className="text-walnut/40 hidden sm:inline">•</span>
                    <span className="text-[11px] text-walnut/80 hidden sm:inline">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Entry Middle Row: Actor Details & Summary */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-walnut/10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-bold text-charcoal border border-gold/40">
                      {log.user?.fullName ? log.user.fullName.charAt(0).toUpperCase() : "S"}
                    </div>
                    <div>
                      <span className="font-semibold text-charcoal">
                        {log.user?.fullName || "Super Admin System"}
                      </span>
                      {log.user?.email && (
                        <span className="text-[11px] text-walnut ml-1.5 font-mono">
                          ({log.user.email})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-walnut font-mono">
                    {log.ipAddress && (
                      <span className="bg-cream/40 px-2 py-0.5 rounded border border-walnut/15">
                        IP: {log.ipAddress}
                      </span>
                    )}
                    {hasPayload && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(log.id)}
                        className="text-xs font-semibold text-gold-900 hover:text-charcoal flex items-center gap-1 cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronDown className="w-3.5 h-3.5 text-gold" /> Hide Changes
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-3.5 h-3.5 text-gold" /> View Details & Changes
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Human Summary Details */}
                {newVal?.notes && (
                  <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200 text-xs text-amber-900">
                    <strong>Audit Note:</strong> {newVal.notes}
                  </div>
                )}
                {newVal?.wasSkipAuthorized && (
                  <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-900 font-medium">
                    ⚠️ <strong>Stage Skip Authorized by Super Admin:</strong> Required admin password validation was successfully confirmed for skipping standard pipeline sequence.
                  </div>
                )}

                {/* Expandable Diff Viewer */}
                {isExpanded && hasPayload && (
                  <div className="pt-2 border-t border-walnut/15 space-y-3 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Old Values */}
                      {oldVal && Object.keys(oldVal).length > 0 && (
                        <div className="p-3 bg-rose-50/40 rounded-lg border border-rose-200 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                            Previous State (Before)
                          </span>
                          <pre className="text-[11px] font-mono text-slate-800 bg-white p-2 rounded border border-rose-200 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(oldVal, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* New Values */}
                      {newVal && Object.keys(newVal).length > 0 && (
                        <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-200 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                            Updated State (After)
                          </span>
                          <pre className="text-[11px] font-mono text-slate-800 bg-white p-2 rounded border border-emerald-200 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(newVal, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. Manual Audit Logging Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title={`Log Official ${entityType} Audit Verification`}
      >
        <form onSubmit={handleLogManualAudit} className="space-y-4">
          <p className="text-xs text-walnut">
            Record a formal inspection, financial compliance audit, or milestone verification to this {entityType}’s permanent audit trail.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-charcoal">Audit Verification Action</label>
            <select
              value={auditAction}
              onChange={(e) => setAuditAction(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-walnut/30 rounded-lg p-2.5 focus:ring-1 focus:ring-gold"
            >
              <option value="AUDIT_COMPLIANCE_VERIFIED">Site & Design Scope Verified</option>
              <option value="FINANCIAL_AUDIT_CHECK">Financial & Margin Audit Passed</option>
              <option value="CLIENT_SPECIFICATION_AUDITED">Client Material Specifications Audited</option>
              <option value="MILESTONE_INSPECTION_APPROVED">Milestone Site Inspection Confirmed</option>
              <option value="FIELD_GOVERNANCE_REVIEW">Field Governance Review Completed</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-charcoal">Audit Verification Notes / Findings *</label>
            <textarea
              required
              rows={4}
              placeholder="Provide exact verification findings, inspection details, approval references, or compliance comments..."
              value={auditNotes}
              onChange={(e) => setAuditNotes(e.target.value)}
              className="w-full text-xs bg-white border border-walnut/30 rounded-lg p-2.5 focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-walnut/15">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || !auditNotes.trim()}
              className="text-xs bg-gold text-charcoal font-bold hover:bg-gold/90"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              )}
              {isSubmitting ? "Recording Audit..." : "Record Official Audit"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
