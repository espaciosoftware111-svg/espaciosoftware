"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  PackageCheck,
  Globe,
  Phone,
  Mail,
  MapPin,
  Eye,
  FileText,
  ShoppingBag,
  RotateCw,
  AlertCircle,
  TrendingUp,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/reports/export-button";
import { MaterialLeadWorkspace } from "@/components/material-leads/material-lead-workspace";
import { MaterialLeadFormModal } from "@/components/material-leads/material-lead-form-modal";
import { WebsiteMaterialEnquiryModal } from "@/components/material-leads/website-material-enquiry-modal";
import { formatDate } from "@/lib/utils";

interface MaterialLeadItem {
  id: string;
  materialLeadId: string;
  referenceNo: string;
  customerName: string;
  clientName: string;
  primaryContact: string;
  phone: string;
  secondaryContact?: string | null;
  email?: string | null;
  location: string;
  projectLocation: string;
  source: string;
  sourceKey: string;
  requirement: string;
  status: string;
  stage: string;
  priority: string;
  notes?: string | null;
  requirements?: any[];
  quotationsCount?: number;
  createdAt: string;
}

interface MaterialLeadKPI {
  totalMaterialLeads: number;
  activeMaterialLeads: number;
  quotationsSent: number;
  convertedOrdered: number;
}

function MaterialLeadsContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");

  const [leads, setLeads] = useState<MaterialLeadItem[]>([]);
  const [kpi, setKpi] = useState<MaterialLeadKPI>({
    totalMaterialLeads: 0,
    activeMaterialLeads: 0,
    quotationsSent: 0,
    convertedOrdered: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [customStatusInput, setCustomStatusInput] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [customSourceInput, setCustomSourceInput] = useState("");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [customLocationInput, setCustomLocationInput] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Drawer State
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialId || null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(!!initialId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "20");
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      // Filter: Status (with Global OTHERS -> manual input)
      if (statusFilter === "OTHER" && customStatusInput.trim()) {
        params.append("status", customStatusInput.trim());
      } else if (statusFilter !== "ALL" && statusFilter !== "OTHER") {
        params.append("status", statusFilter);
      }

      // Filter: Source (with Global OTHERS -> manual input)
      if (sourceFilter === "OTHER" && customSourceInput.trim()) {
        params.append("source", customSourceInput.trim());
      } else if (sourceFilter !== "ALL" && sourceFilter !== "OTHER") {
        params.append("source", sourceFilter);
      }

      // Filter: Location (with Global OTHERS -> manual input)
      if (locationFilter === "OTHER" && customLocationInput.trim()) {
        params.append("location", customLocationInput.trim());
      } else if (locationFilter !== "ALL" && locationFilter !== "OTHER") {
        params.append("location", locationFilter);
      }

      const res = await fetch(`/api/v1/material-leads?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to load Material Leads");
      }

      const json = await res.json();
      const rawLeads = json.data || (Array.isArray(json) ? json : []);
      setLeads(rawLeads);

      const kpiData =
        json.meta?.pagination?.kpi ||
        json.meta?.kpi ||
        json.pagination?.kpi ||
        json.kpi;
      if (kpiData) {
        setKpi({
          totalMaterialLeads: Number(kpiData.totalMaterialLeads || 0),
          activeMaterialLeads: Number(kpiData.activeMaterialLeads || 0),
          quotationsSent: Number(kpiData.quotationsSent || 0),
          convertedOrdered: Number(kpiData.convertedOrdered || 0),
        });
      }

      const pagination = json.meta?.pagination || json.meta || json.pagination;
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalCount(pagination.total || pagination.totalCount || rawLeads.length);
      }
    } catch (err: any) {
      setError(err.message || "Error loading Material Leads");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, customStatusInput, sourceFilter, customSourceInput, locationFilter, customLocationInput]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (initialId) {
      setSelectedLeadId(initialId);
      setIsDrawerOpen(true);
    }
  }, [initialId]);

  const handleOpenLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setIsDrawerOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "NEW").toUpperCase();
    if (s === "NEW") return <Badge variant="pending" className="text-xs uppercase px-2 py-0.5">New Lead</Badge>;
    if (s === "CONTACTED") return <Badge variant="neutral" className="text-xs uppercase px-2 py-0.5">Contacted</Badge>;
    if (s === "REQUIREMENT_DISCUSSED") return <Badge variant="pending" className="text-xs uppercase px-2 py-0.5">Req Discussed</Badge>;
    if (s === "QUOTATION_IN_PROGRESS") return <Badge variant="neutral" className="text-xs uppercase px-2 py-0.5">Quote In Progress</Badge>;
    if (s === "QUOTATION_SENT") return <Badge variant="warning" className="text-xs uppercase px-2 py-0.5">Quotation Sent</Badge>;
    if (s === "ORDER_CONFIRMED") return <Badge variant="completed" className="text-xs uppercase px-2 py-0.5">Order Confirmed</Badge>;
    if (s === "ORDER_COMPLETED") return <Badge variant="completed" className="text-xs uppercase px-2 py-0.5">Order Completed</Badge>;
    if (s === "ON_HOLD") return <Badge variant="neutral" className="text-xs uppercase px-2 py-0.5">On Hold</Badge>;
    if (s === "LOST" || s === "CANCELLED") return <Badge variant="danger" className="text-xs uppercase px-2 py-0.5">{s}</Badge>;
    return <Badge variant="neutral" className="text-xs uppercase px-2 py-0.5">{status}</Badge>;
  };

  const getSourceBadge = (src?: string) => {
    const s = (src || "WEBSITE").toUpperCase();
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-cream text-walnut border border-walnut/20">
        <Globe className="w-3 h-3 text-gold" />
        {s}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1700px] mx-auto space-y-6">
      {/* Top Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/20">
              <Boxes className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-charcoal tracking-tight">Material Leads</h1>
          </div>
          <p className="text-xs text-walnut mt-1">
            Manage inbound material catalog unlock requests, material quotations, and supplier orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <ExportButton
            reportKey="sales_leads"
            label="Export Material Leads"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWebsiteModalOpen(true)}
            className="gap-1.5 text-xs border-walnut/25 text-charcoal hover:bg-cream"
          >
            <Globe className="w-3.5 h-3.5 text-gold" />
            Website Catalog Form
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-1.5 text-xs shadow-sm"
          >
            <Plus className="w-4 h-4" />
            + New Material Lead
          </Button>
        </div>
      </div>

      {/* 4 Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Material Leads */}
        <div
          onClick={() => {
            setStatusFilter("ALL");
            setPage(1);
          }}
          className={`p-5 rounded-xl border bg-white shadow-2xs space-y-2 cursor-pointer transition hover:border-gold hover:shadow-md ${
            statusFilter === "ALL" ? "border-gold ring-1 ring-gold/30" : "border-walnut/15"
          }`}
          title="Click to show all Material Leads"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-walnut uppercase tracking-wider">
              Total Material Leads
            </span>
            <span className="p-1.5 rounded-lg bg-cream text-gold border border-walnut/15">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-charcoal font-mono tabular-nums">
            {kpi.totalMaterialLeads}
          </div>
          <p className="text-[11px] text-walnut">All registered material supply enquiries</p>
        </div>

        {/* KPI 2: Active Material Leads */}
        <div
          onClick={() => {
            setStatusFilter("NEW");
            setPage(1);
          }}
          className={`p-5 rounded-xl border bg-white shadow-2xs space-y-2 cursor-pointer transition hover:border-gold hover:shadow-md ${
            statusFilter === "NEW" ? "border-gold ring-1 ring-gold/30" : "border-walnut/15"
          }`}
          title="Click to filter new active leads"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-walnut uppercase tracking-wider">
              Active Material Leads
            </span>
            <span className="p-1.5 rounded-lg bg-cream text-gold border border-walnut/15">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-charcoal font-mono tabular-nums">
            {kpi.activeMaterialLeads}
          </div>
          <p className="text-[11px] text-walnut">Currently undergoing discovery or quoting</p>
        </div>

        {/* KPI 3: Material Quotations Sent */}
        <div
          onClick={() => {
            setStatusFilter("QUOTATION_SENT");
            setPage(1);
          }}
          className={`p-5 rounded-xl border bg-white shadow-2xs space-y-2 cursor-pointer transition hover:border-gold hover:shadow-md ${
            statusFilter === "QUOTATION_SENT" ? "border-gold ring-1 ring-gold/30" : "border-walnut/15"
          }`}
          title="Click to filter quotations sent"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-walnut uppercase tracking-wider">
              Material Quotations Sent
            </span>
            <span className="p-1.5 rounded-lg bg-cream text-gold border border-walnut/15">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-charcoal font-mono tabular-nums">
            {kpi.quotationsSent}
          </div>
          <p className="text-[11px] text-walnut">Commercial proposals submitted to clients</p>
        </div>

        {/* KPI 4: Converted / Ordered */}
        <div
          onClick={() => {
            setStatusFilter("ORDER_CONFIRMED");
            setPage(1);
          }}
          className={`p-5 rounded-xl border bg-white shadow-2xs space-y-2 cursor-pointer transition hover:border-emerald-500 hover:shadow-md ${
            statusFilter === "ORDER_CONFIRMED" ? "border-emerald-500 ring-1 ring-emerald-500/30" : "border-walnut/15"
          }`}
          title="Click to filter confirmed orders"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-walnut uppercase tracking-wider">
              Converted / Ordered
            </span>
            <span className="p-1.5 rounded-lg bg-cream text-emerald-600 border border-walnut/15">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-charcoal font-mono tabular-nums">
            {kpi.convertedOrdered}
          </div>
          <p className="text-[11px] text-walnut">Progressed to confirmed materials orders</p>
        </div>
      </div>

      {/* Search & Dynamic Filter Bar */}
      <div className="p-4 rounded-xl border border-walnut/15 bg-white shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-walnut/70" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, name, phone, email, location..."
              className="pl-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New Lead</option>
              <option value="CONTACTED">Contacted</option>
              <option value="REQUIREMENT_DISCUSSED">Requirement Discussed</option>
              <option value="QUOTATION_IN_PROGRESS">Quotation In Progress</option>
              <option value="QUOTATION_SENT">Quotation Sent</option>
              <option value="ORDER_CONFIRMED">Order Confirmed</option>
              <option value="ORDER_COMPLETED">Order Completed</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="LOST">Lost</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="OTHER">Other (Custom Status)</option>
            </select>
            {statusFilter === "OTHER" && (
              <Input
                value={customStatusInput}
                onChange={(e) => setCustomStatusInput(e.target.value)}
                placeholder="Enter custom status..."
                className="mt-2 text-xs"
              />
            )}
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="ALL">All Sources</option>
              <option value="Website">Website</option>
              <option value="Instagram">Instagram</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Referral">Referral</option>
              <option value="Walk_In">Walk-In</option>
              <option value="Phone_Call">Phone Call</option>
              <option value="OTHER">Other (Custom Source)</option>
            </select>
            {sourceFilter === "OTHER" && (
              <Input
                value={customSourceInput}
                onChange={(e) => setCustomSourceInput(e.target.value)}
                placeholder="Enter custom source..."
                className="mt-2 text-xs"
              />
            )}
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="ALL">All Locations</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Jubilee Hills">Jubilee Hills</option>
              <option value="Banjara Hills">Banjara Hills</option>
              <option value="Gachibowli">Gachibowli</option>
              <option value="Madhapur">Madhapur</option>
              <option value="OTHER">Other (Custom Location)</option>
            </select>
            {locationFilter === "OTHER" && (
              <Input
                value={customLocationInput}
                onChange={(e) => setCustomLocationInput(e.target.value)}
                placeholder="Enter custom location..."
                className="mt-2 text-xs"
              />
            )}
          </div>
        </div>
      </div>

      {/* Scannable Material Leads Table */}
      <div className="rounded-xl border border-walnut/15 bg-white shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-walnut flex flex-col items-center gap-3">
            <RotateCw className="w-6 h-6 animate-spin text-gold" />
            <span>Loading Material Leads dataset...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs flex flex-col items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={fetchLeads}>
              Retry
            </Button>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center text-xs text-walnut flex flex-col items-center gap-3">
            <Boxes className="w-10 h-10 text-gold/50" />
            <p className="text-sm font-semibold text-charcoal">No Material Leads found</p>
            <p className="text-xs text-walnut max-w-sm">
              Inbound customer enquiries from the website material catalog form or manual entries will appear here.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsWebsiteModalOpen(true)}>
                Submit Website Form
              </Button>
              <Button size="sm" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                + Create Material Lead
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-cream/50 border-b border-walnut/15 text-[11px] font-bold text-walnut uppercase tracking-wider">
                  <th className="py-3 px-4">Material Lead ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Requirement</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-walnut/10">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => handleOpenLead(lead.id)}
                    className="hover:bg-cream/20 cursor-pointer transition"
                  >
                    {/* Material Lead ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-charcoal whitespace-nowrap">
                      {lead.materialLeadId || lead.referenceNo}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <strong className="text-charcoal font-semibold block">
                        {lead.customerName || lead.clientName}
                      </strong>
                      <span className="text-[11px] text-walnut font-mono">
                        {lead.primaryContact || lead.phone}
                      </span>
                    </td>

                    {/* Contact (Primary & Secondary) */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-charcoal">
                      <div>{lead.primaryContact || lead.phone}</div>
                      {lead.secondaryContact && (
                        <div className="text-[10px] text-walnut">Sec: {lead.secondaryContact}</div>
                      )}
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getSourceBadge(lead.source || lead.sourceKey)}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-walnut">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gold shrink-0" />
                        <span className="truncate max-w-[140px]">
                          {lead.location || lead.projectLocation || "Hyderabad"}
                        </span>
                      </div>
                    </td>

                    {/* Requirement */}
                    <td className="py-3.5 px-4">
                      <span className="text-charcoal font-medium">
                        {lead.requirement || "Materials Order & Supply"}
                      </span>
                      {lead.requirements && lead.requirements.length > 0 && (
                        <span className="text-[10px] text-walnut block">
                          ({lead.requirements.length} items specified)
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(lead.status || lead.stage || "NEW")}
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 font-mono text-walnut whitespace-nowrap">
                      {formatDate(lead.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenLead(lead.id)}
                        className="p-1.5 h-8 w-8 text-walnut hover:text-charcoal hover:bg-cream"
                        title="View Material Lead Profile"
                      >
                        <Eye className="w-4 h-4 text-gold" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-walnut/15 bg-cream/30 text-xs text-walnut">
            <div>
              Showing page <strong className="text-charcoal font-mono font-bold">{page}</strong> of{" "}
              <strong className="text-charcoal font-mono font-bold">{totalPages}</strong> (
              <span className="font-mono">{totalCount}</span> total material leads)
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs h-7 px-3 bg-white"
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="text-xs h-7 px-3 bg-white"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Half-Screen Workspace Drawer */}
      <MaterialLeadWorkspace
        leadId={selectedLeadId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedLeadId(null);
        }}
        onUpdate={fetchLeads}
      />

      {/* Create Modal */}
      <MaterialLeadFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchLeads}
      />

      {/* Website Simulator Modal */}
      <WebsiteMaterialEnquiryModal
        isOpen={isWebsiteModalOpen}
        onClose={() => setIsWebsiteModalOpen(false)}
        onSuccess={fetchLeads}
      />
    </div>
  );
}

export default function MaterialLeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-xs text-walnut flex flex-col items-center gap-2">
          <RotateCw className="w-5 h-5 animate-spin text-gold" />
          Loading Material Leads section...
        </div>
      }
    >
      <MaterialLeadsContent />
    </Suspense>
  );
}
