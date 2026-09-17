"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePermissions } from "@/components/providers/permissions-provider";
import { ExportButton } from "@/components/reports/export-button";
import { FilterSelect } from "@/components/ui/filter-select";

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

interface Metrics {
  totalQuotations: number;
  totalDraft: number;
  totalApproved: number;
  totalActivePipeline: number;
}

export default function QuotationsPage() {
  const router = useRouter();
  const { can, isSuperAdmin, isAdmin } = usePermissions();

  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalQuotations: 0,
    totalDraft: 0,
    totalApproved: 0,
    totalActivePipeline: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // New Quotation Dropdown State
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNewMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      params.set("page", page.toString());
      params.set("limit", "25");

      const res = await fetch(`/api/v1/quotations?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setQuotations(json.data.quotations);
        setMetrics(json.data.metrics);
        setTotalPages(json.data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to load quotations:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, page]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchQuotations();
    }, 250);
    return () => clearTimeout(handler);
  }, [fetchQuotations]);

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case "APPROVED":
        return "completed";
      case "SENT":
      case "READY_TO_SEND":
        return "active";
      case "INTERNAL_REVIEW":
      case "NEGOTIATION":
        return "pending";
      case "REJECTED":
      case "CANCELLED":
        return "danger";
      case "DRAFT":
      case "SUPERSEDED":
      default:
        return "neutral";
    }
  };

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case "PROJECT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
            <FolderOpen className="w-3 h-3 text-purple-600 shrink-0" />
            Project Quote
          </span>
        );
      case "MATERIAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 whitespace-nowrap">
            <Package className="w-3 h-3 text-teal-600 shrink-0" />
            Material Quote
          </span>
        );
      case "LEAD":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
            <User className="w-3 h-3 text-amber-600 shrink-0" />
            Lead Quote
          </span>
        );
    }
  };

  const statusPills = [
    { label: "All Statuses", value: "ALL" },
    { label: "Drafts", value: "DRAFT" },
    { label: "In Review", value: "INTERNAL_REVIEW" },
    { label: "Sent / Pipeline", value: "SENT" },
    { label: "Negotiation", value: "NEGOTIATION" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  const typePills = [
    { label: "All Types", value: "ALL" },
    { label: "Lead Quotations", value: "LEAD" },
    { label: "Project Quotations", value: "PROJECT" },
    { label: "Material Quotations", value: "MATERIAL" },
  ];

  return (
    <div className="p-4 sm:p-6 w-full space-y-5">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Quotation Management</h1>
              <p className="text-xs text-slate-500">
                Centralized commercial estimations, luxury BOQ, material quotes, and approval tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton
            reportKey="sales_quotations"
            label="Export Quotations"
            size="sm"
          />

          {/* + NEW QUOTATION 3-Option Interactive Dropdown */}
          <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ NEW QUOTATION</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isNewMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isNewMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                  Select Quotation Type
                </span>
              </div>

              {/* 1. Lead Quotation */}
              <Link
                href="/quotations/new?type=LEAD"
                onClick={() => setIsNewMenuOpen(false)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-amber-50/70 transition-colors group"
              >
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg group-hover:bg-amber-200 transition-colors mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-amber-900 flex items-center gap-1">
                    1. Lead Quotation
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Initial client proposal, requirements & preliminary estimation
                  </p>
                </div>
              </Link>

              {/* 2. Project Quotation */}
              <Link
                href="/quotations/new?type=PROJECT"
                onClick={() => setIsNewMenuOpen(false)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-purple-50/70 transition-colors group"
              >
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg group-hover:bg-purple-200 transition-colors mt-0.5">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-purple-900 flex items-center gap-1">
                    2. Project Quotation
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Detailed BOQ estimation linked to active project site
                  </p>
                </div>
              </Link>

              {/* 3. Material Quotation */}
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
                    3. Material Quotation
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hardware, boards, laminates & direct supply estimation
                  </p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Total Quotations</p>
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
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Approved Quotations</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-0.5 font-mono">{metrics.totalApproved}</h3>
              <p className="text-2xs text-emerald-600 mt-0.5">Ready for project execution</p>
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
              <p className="text-2xs text-amber-600 mt-0.5">In preparation</p>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        {/* Search Bar & Type Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search quote #, client, lead, or project..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Quotation Type Filters & Others Dropdown */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <FilterSelect
              label="Type"
              placeholder="All Types"
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val || "ALL");
                setPage(1);
              }}
              options={[
                { value: "LEAD", label: "Lead Quotations" },
                { value: "PROJECT", label: "Project Quotations" },
                { value: "MATERIAL", label: "Material Quotations" },
              ]}
              variant="slate"
              size="sm"
            />

            <FilterSelect
              label="Status"
              placeholder="All Statuses"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val || "ALL");
                setPage(1);
              }}
              options={[
                { value: "DRAFT", label: "Drafts" },
                { value: "INTERNAL_REVIEW", label: "In Review" },
                { value: "SENT", label: "Sent / Pipeline" },
                { value: "NEGOTIATION", label: "Negotiation" },
                { value: "APPROVED", label: "Approved" },
                { value: "REJECTED", label: "Rejected" },
              ]}
              variant="slate"
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Central Quotations Table - 100% Width Responsive */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden w-full">
        {loading ? (
          <div className="p-10 text-center text-slate-500">
            <div className="animate-spin w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-xs font-medium">Loading quotations directory...</p>
          </div>
        ) : quotations.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-2">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No Quotations Found</h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-md mx-auto">
              {search || statusFilter !== "ALL" || typeFilter !== "ALL"
                ? "No quotations match your current search or filter criteria. Try adjusting your query."
                : "No quotations have been created yet. Generate your first quotation to get started."}
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <Link href="/quotations/new?type=LEAD">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 gap-1.5">
                  <Plus className="w-3 h-3" />
                  Create First Quotation
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left text-xs border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3 w-[11%]">Type</th>
                  <th className="py-2.5 px-3 w-[16%]">Quotation ID / Title</th>
                  <th className="py-2.5 px-3 w-[14%]">Client Name</th>
                  <th className="py-2.5 px-3 w-[15%]">Related Entity</th>
                  <th className="py-2.5 px-3 w-[12%] text-right">Amount</th>
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

                  return (
                    <tr
                      key={q.id}
                      onClick={() => router.push(`/quotations/${q.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* 1. Quotation Type Column */}
                      <td className="py-2.5 px-3 whitespace-nowrap overflow-hidden">
                        {getTypeBadge(q.quotationType)}
                      </td>

                      {/* 2. Quotation ID / Title */}
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
                        {q.client ? (
                          <Link
                            href={`/clients?id=${q.client.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline text-xs truncate block"
                            title={clientName}
                          >
                            {clientName} ↗
                          </Link>
                        ) : q.lead ? (
                          <Link
                            href={`/leads?id=${q.lead.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline text-xs truncate block"
                            title={clientName}
                          >
                            {clientName} ↗
                          </Link>
                        ) : (
                          <div className="font-semibold text-slate-900 text-xs truncate" title={clientName}>{clientName}</div>
                        )}
                        {phone && <div className="text-2xs text-slate-400 font-mono mt-0.5 truncate">{phone}</div>}
                      </td>

                      {/* 4. Related Lead / Project */}
                      <td className="py-2.5 px-3 overflow-hidden">
                        {q.project ? (
                          <div className="space-y-0.5">
                            <Link
                              href={`/projects?id=${q.project.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-2xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium border border-purple-200 whitespace-nowrap transition-colors"
                            >
                              <FolderOpen className="w-2.5 h-2.5 text-purple-500 shrink-0" />
                              PROJ: {q.project.referenceNo} ↗
                            </Link>
                            <div className="text-2xs text-slate-400 truncate" title={q.project.title}>
                              {q.project.title}
                            </div>
                          </div>
                        ) : q.lead ? (
                          <div className="space-y-0.5">
                            <Link
                              href={`/leads?id=${q.lead.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-2xs bg-amber-50 hover:bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium border border-amber-200 whitespace-nowrap transition-colors"
                            >
                              <User className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                              LEAD: {q.lead.referenceNo} ↗
                            </Link>
                            <div className="text-2xs text-slate-400 truncate">
                              Stage: <span className="font-medium text-slate-600">{q.lead.stage}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-2xs text-slate-400 italic">Direct Quotation</span>
                        )}
                      </td>

                      {/* 5. Amount (Grand Total) */}
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
                            Adv: ₹{q.advancePaid.toLocaleString("en-IN")}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 whitespace-nowrap">No Advance</div>
                        )}
                      </td>

                      {/* 7. Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap overflow-hidden">
                        <Badge variant={getStatusBadgeVariant(q.status)} className="text-[10px] px-1.5 py-0.2">
                          {q.status}
                        </Badge>
                      </td>

                      {/* 8. Created Date */}
                      <td className="py-2.5 px-3 text-2xs text-slate-500 whitespace-nowrap overflow-hidden">
                        <div className="font-medium text-slate-700">{new Date(q.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>
                        {q.validityDate && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Due: {new Date(q.validityDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          </div>
                        )}
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

        {/* Pagination Bar */}
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
    </div>
  );
}
