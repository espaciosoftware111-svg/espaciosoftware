"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  X,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Tag,
  Plus,
  FileText,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  History,
  Package,
  Boxes,
  Layers,
  Globe,
  ShoppingBag,
  User,
  Truck,
  Check,
  RotateCw,
  Send,
  ShoppingCart,
} from "lucide-react";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { MATERIAL_LEAD_STATUSES, MATERIAL_LEAD_SOURCES, MaterialRequirementItem } from "@/validators/material-lead.schema";
import { MaterialLeadPipelineTracker } from "./material-lead-pipeline-tracker";
import { PlaceMaterialOrderModal } from "./place-material-order-modal";
import { VendorResponseModal } from "./vendor-response-modal";
import { ContactStatusModal } from "./contact-status-modal";

interface MaterialLeadWorkspaceProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const MaterialLeadWorkspace: React.FC<MaterialLeadWorkspaceProps> = ({
  leadId,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "timeline" | "followups" | "requirements" | "quotations" | "orders"
  >("overview");

  // Status Change State
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Pipeline Modals State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactModalInitialStatus, setContactModalInitialStatus] = useState<"CONTACTED" | "NOT_CONTACTED">("CONTACTED");
  const [isPlaceOrderModalOpen, setIsPlaceOrderModalOpen] = useState(false);
  const [isVendorResponseModalOpen, setIsVendorResponseModalOpen] = useState(false);
  const [vendorResponseMode, setVendorResponseMode] = useState<"ACCEPTED" | "REJECTED" | "NEW_VENDOR">("ACCEPTED");

  // Material Requirement Modal State
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [reqName, setReqName] = useState("");
  const [reqCategory, setReqCategory] = useState("Plywood");
  const [customReqCategory, setCustomReqCategory] = useState("");
  const [reqQuantity, setReqQuantity] = useState(1);
  const [reqUnit, setReqUnit] = useState("Sheets");
  const [customReqUnit, setCustomReqUnit] = useState("");
  const [reqAdditional, setReqAdditional] = useState("");
  const [reqNotes, setReqNotes] = useState("");
  const [isSavingReq, setIsSavingReq] = useState(false);

  // Follow-Up Modal State
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("10:00");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);

  // Complete Follow-Up Modal State
  const [completingFollowUpId, setCompletingFollowUpId] = useState<string | null>(null);
  const [followUpOutcomeNotes, setFollowUpOutcomeNotes] = useState("");
  const [isCompletingFollowUp, setIsCompletingFollowUp] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!leadId) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/material-leads/${leadId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to load Material Lead details");
      }
      const json = await res.json();
      const payload = json.data;
      setData(payload);
      setSelectedStatus(payload.materialLead?.status || payload.status || "NEW");
    } catch (e: any) {
      setError(e.message || "Error fetching details");
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (isOpen && leadId) {
      fetchDetails();
    } else {
      setData(null);
    }
  }, [isOpen, leadId, fetchDetails]);

  if (!isOpen) return null;

  const lead = data?.materialLead || data;
  const timeline = data?.timeline || [];

  const handleStatusChange = async (newStatus: string) => {
    if (!lead?.id || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/v1/material-leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update status");
      }
      setSelectedStatus(newStatus);
      toast.success("Status Updated", `Material Lead status updated to ${newStatus}`);
      fetchDetails();
      onUpdate();
    } catch (e: any) {
      toast.error("Update Failed", e.message || "Could not update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenAddRequirement = () => {
    setEditingReqId(null);
    setReqName("");
    setReqCategory("Plywood");
    setCustomReqCategory("");
    setReqQuantity(1);
    setReqUnit("Sheets");
    setCustomReqUnit("");
    setReqAdditional("");
    setReqNotes("");
    setIsReqModalOpen(true);
  };

  const handleOpenEditRequirement = (item: MaterialRequirementItem) => {
    setEditingReqId(item.id || null);
    setReqName(item.materialName);
    const standardCats = ["Plywood", "Laminates", "Hardware", "Veneer", "Glass", "Sanitaryware", "Electrical", "General"];
    if (standardCats.includes(item.category)) {
      setReqCategory(item.category);
      setCustomReqCategory("");
    } else {
      setReqCategory("OTHER");
      setCustomReqCategory(item.category);
    }

    const standardUnits = ["Sheets", "Sqft", "Nos", "Kg", "Boxes", "Meters", "Units"];
    if (standardUnits.includes(item.unit)) {
      setReqUnit(item.unit);
      setCustomReqUnit("");
    } else {
      setReqUnit("OTHER");
      setCustomReqUnit(item.unit);
    }

    setReqQuantity(item.quantity || 1);
    setReqAdditional(item.additionalRequirements || "");
    setReqNotes(item.notes || "");
    setIsReqModalOpen(true);
  };

  const handleSaveRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead?.id || !reqName.trim()) return;

    const finalCategory = reqCategory === "OTHER" && customReqCategory.trim() ? customReqCategory.trim() : reqCategory;
    const finalUnit = reqUnit === "OTHER" && customReqUnit.trim() ? customReqUnit.trim() : reqUnit;

    setIsSavingReq(true);
    try {
      const payload: Partial<MaterialRequirementItem> = {
        materialName: reqName.trim(),
        category: finalCategory,
        quantity: Number(reqQuantity) || 1,
        unit: finalUnit,
        additionalRequirements: reqAdditional.trim() || null,
        notes: reqNotes.trim() || null,
      };

      let url = `/api/v1/material-leads/${lead.id}/requirements`;
      let method = "POST";
      if (editingReqId) {
        url = `/api/v1/material-leads/${lead.id}/requirements/${editingReqId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save requirement");
      }

      toast.success("Requirements Updated", "Material requirement saved successfully");
      setIsReqModalOpen(false);
      fetchDetails();
      onUpdate();
    } catch (e: any) {
      toast.error("Save Failed", e.message || "Could not save requirement");
    } finally {
      setIsSavingReq(false);
    }
  };

  const handleDeleteRequirement = async (reqId: string) => {
    if (!lead?.id || !confirm("Are you sure you want to remove this material requirement?")) return;
    try {
      const res = await fetch(`/api/v1/material-leads/${lead.id}/requirements/${reqId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete requirement");
      }
      toast.success("Requirement Removed", "Material item removed successfully");
      fetchDetails();
      onUpdate();
    } catch (e: any) {
      toast.error("Delete Failed", e.message || "Could not remove requirement");
    }
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead?.id || !followUpDate || !followUpNotes.trim()) return;

    setIsSchedulingFollowUp(true);
    try {
      const res = await fetch(`/api/v1/material-leads/${lead.id}/follow-ups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followUpDate,
          followUpTime,
          notes: followUpNotes.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to schedule follow-up");
      }
      toast.success("Follow-up Scheduled", "CRM reminder registered successfully");
      setIsFollowUpModalOpen(false);
      setFollowUpNotes("");
      fetchDetails();
      onUpdate();
    } catch (e: any) {
      toast.error("Scheduling Failed", e.message || "Could not schedule follow-up");
    } finally {
      setIsSchedulingFollowUp(false);
    }
  };

  const handleCompleteFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead?.id || !completingFollowUpId) return;

    setIsCompletingFollowUp(true);
    try {
      const res = await fetch(`/api/v1/material-leads/${lead.id}/follow-ups/${completingFollowUpId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcomeNotes: followUpOutcomeNotes.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to complete follow-up");
      }
      toast.success("Follow-up Completed", "Outcome notes recorded in timeline");
      setCompletingFollowUpId(null);
      setFollowUpOutcomeNotes("");
      fetchDetails();
      onUpdate();
    } catch (e: any) {
      toast.error("Completion Failed", e.message || "Could not complete follow-up");
    } finally {
      setIsCompletingFollowUp(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "NEW").toUpperCase();
    if (s === "NEW") return <Badge variant="pending" className="text-xs uppercase px-2.5 py-1">New Lead</Badge>;
    if (s === "CONTACTED") return <Badge variant="neutral" className="text-xs uppercase px-2.5 py-1">Contacted</Badge>;
    if (s === "REQUIREMENT_DISCUSSED") return <Badge variant="pending" className="text-xs uppercase px-2.5 py-1">Requirement Discussed</Badge>;
    if (s === "QUOTATION_IN_PROGRESS") return <Badge variant="neutral" className="text-xs uppercase px-2.5 py-1">Quotation In Progress</Badge>;
    if (s === "QUOTATION_SENT") return <Badge variant="warning" className="text-xs uppercase px-2.5 py-1">Quotation Sent</Badge>;
    if (s === "ORDER_CONFIRMED") return <Badge variant="completed" className="text-xs uppercase px-2.5 py-1">Order Confirmed</Badge>;
    if (s === "ORDER_COMPLETED") return <Badge variant="completed" className="text-xs uppercase px-2.5 py-1">Order Completed</Badge>;
    if (s === "ON_HOLD") return <Badge variant="neutral" className="text-xs uppercase px-2.5 py-1">On Hold</Badge>;
    if (s === "LOST" || s === "CANCELLED") return <Badge variant="danger" className="text-xs uppercase px-2.5 py-1">{s}</Badge>;
    return <Badge variant="neutral" className="text-xs uppercase px-2.5 py-1">{status}</Badge>;
  };

  const getSourceBadge = (src?: string) => {
    const s = (src || "WEBSITE").toUpperCase();
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-cream text-walnut border border-walnut/20">
        <Globe className="w-3.5 h-3.5 text-gold" />
        {s}
      </span>
    );
  };

  const requirementsList: MaterialRequirementItem[] = lead?.requirements || [];
  const followUpsList = lead?.followUps || [];
  const quotationsList = lead?.quotations || [];
  const ordersList = lead?.orders || [];
  const websiteData = lead?.websiteData || null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-charcoal/40 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Half-screen Drawer (55%–60% width) */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[60%] lg:w-[55%] bg-[#FAF8F5] border-l border-walnut/20 shadow-2xl z-50 flex flex-col transition-all transform duration-300 ease-in-out">
        {/* Top Sticky Header */}
        <div className="px-6 py-5 bg-white border-b border-walnut/15 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cream border border-walnut/20 text-charcoal">
                  {lead?.materialLeadId || lead?.referenceNo || "MAT-LEAD-2026-XXXX"}
                </span>
                {getSourceBadge(lead?.source || lead?.sourceKey)}
                {getStatusBadge(lead?.status || lead?.stage || "NEW")}
              </div>
              <h2 className="text-xl font-bold text-charcoal tracking-tight">
                {lead?.customerName || lead?.clientName || "Material Lead Profile"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-walnut hover:text-charcoal hover:bg-cream/60 transition"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contact Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-walnut pt-1 border-t border-walnut/10">
            <div className="flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-gold" />
              <span>Primary: <strong className="text-charcoal font-mono">{lead?.primaryContact || lead?.phone || "N/A"}</strong></span>
            </div>
            {lead?.secondaryContact && (
              <div className="flex items-center gap-1.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-walnut/60" />
                <span>Sec: <strong className="text-charcoal font-mono">{lead.secondaryContact}</strong></span>
              </div>
            )}
            {lead?.email && (
              <div className="flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-gold" />
                <span className="text-charcoal">{lead.email}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-gold" />
              <span>{lead?.location || lead?.projectLocation || "Hyderabad"}</span>
            </div>
          </div>

          {/* Status Pipeline Transition Selector */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-walnut">Update Stage:</span>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdatingStatus}
                className="h-8 px-2.5 text-xs font-medium bg-white border border-walnut/20 rounded-lg text-charcoal focus:ring-1 focus:ring-gold outline-none"
              >
                {MATERIAL_LEAD_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <Link
              href={`/quotations/new?type=MATERIAL&materialLeadId=${lead?.id || ""}&leadId=${lead?.id || ""}`}
            >
              <Button size="sm" variant="primary" className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" />
                + Create Material Quotation
              </Button>
            </Link>
          </div>

          {/* Pipeline Tracker */}
          <div className="pt-2 border-t border-walnut/10">
            <MaterialLeadPipelineTracker
              currentStage={lead?.status || lead?.stage || "NEW"}
              onAdvanceStage={handleStatusChange}
              onOpenContactModal={(st) => {
                setContactModalInitialStatus(st);
                setIsContactModalOpen(true);
              }}
              onOpenPlaceOrderModal={() => setIsPlaceOrderModalOpen(true)}
              onOpenVendorResponseModal={(resp) => {
                setVendorResponseMode(resp);
                setIsVendorResponseModalOpen(true);
              }}
              onOpenNewVendorRequestModal={() => {
                setVendorResponseMode("NEW_VENDOR");
                setIsVendorResponseModalOpen(true);
              }}
              hasRequirements={requirementsList.length > 0}
              hasQuotations={quotationsList.length > 0}
              hasOrders={ordersList.length > 0 || !!lead?.linkedOrderId}
              latestVendorRequestStatus={
                lead?.vendorRequests?.[0]?.status ||
                data?.vendorRequests?.[0]?.status ||
                null
              }
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-walnut/15 bg-white overflow-x-auto">
          {[
            { id: "overview", label: "Overview & Details", icon: User },
            { id: "requirements", label: `Requirements (${requirementsList.length})`, icon: Boxes },
            { id: "followups", label: `Follow-ups (${followUpsList.length})`, icon: Clock },
            { id: "quotations", label: `Quotations (${quotationsList.length})`, icon: FileText },
            {
              id: "orders",
              label: `Material Orders (${(ordersList.length || (lead?.linkedOrderId ? 1 : 0))})`,
              icon: ShoppingBag,
            },
            { id: "timeline", label: "Timeline", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? "border-gold text-charcoal bg-cream/30"
                    : "border-transparent text-walnut hover:text-charcoal hover:bg-cream/10"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-gold" : "text-walnut"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-walnut flex flex-col items-center gap-2">
              <RotateCw className="w-5 h-5 animate-spin text-gold" />
              Loading Material Lead data...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & DETAILS */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  {/* Card A: Customer Information */}
                  <div className="p-5 bg-white rounded-xl border border-walnut/15 shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gold" />
                      Card A: Customer Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-walnut/80 block">Customer Name</span>
                        <strong className="text-charcoal font-semibold text-sm">
                          {lead?.customerName || lead?.clientName || "N/A"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-walnut/80 block">Primary Contact Number</span>
                        <strong className="text-charcoal font-mono font-semibold">
                          {lead?.primaryContact || lead?.phone || "N/A"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-walnut/80 block">Secondary Contact Number</span>
                        <strong className="text-charcoal font-mono font-semibold">
                          {lead?.secondaryContact || "Not Provided"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-walnut/80 block">Email Address</span>
                        <span className="text-charcoal font-medium">
                          {lead?.email || "Not Provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card B: Location Information */}
                  <div className="p-5 bg-white rounded-xl border border-walnut/15 shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gold" />
                      Card B: Location Information
                    </h3>
                    <div className="text-xs">
                      <span className="text-walnut/80 block">Project Location</span>
                      <strong className="text-charcoal font-semibold text-sm">
                        {lead?.location || lead?.projectLocation || "Hyderabad"}
                      </strong>
                    </div>
                  </div>

                  {/* Card C: Lead Management Information */}
                  <div className="p-5 bg-white rounded-xl border border-walnut/15 shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-gold" />
                      Card C: Lead Management Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-walnut/80 block">Material Lead ID</span>
                        <strong className="text-charcoal font-mono">
                          {lead?.materialLeadId || lead?.referenceNo}
                        </strong>
                      </div>
                      <div>
                        <span className="text-walnut/80 block">Source</span>
                        <div className="mt-0.5">{getSourceBadge(lead?.source || lead?.sourceKey)}</div>
                      </div>
                      <div>
                        <span className="text-walnut/80 block">Pipeline Status</span>
                        <div className="mt-0.5">{getStatusBadge(lead?.status || lead?.stage || "NEW")}</div>
                      </div>
                      <div>
                        <span className="text-walnut/80 block">Created Date</span>
                        <span className="text-charcoal font-mono">
                          {formatDate(lead?.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-walnut/80 block">Created Time</span>
                        <span className="text-charcoal font-mono">
                          {lead?.createdAt ? new Date(lead.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-walnut/80 block">Assigned Staff</span>
                        <span className="text-charcoal font-semibold">
                          {lead?.assignedTo?.fullName || "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card D: Original Website Enquiry Data */}
                  <div className="p-5 bg-white rounded-xl border border-walnut/15 shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-gold" />
                      Card D: Original Website Request Snapshot
                    </h3>
                    {websiteData ? (
                      <div className="p-3.5 rounded-lg bg-cream/40 border border-walnut/15 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-walnut/80">Submitted Name:</span>{" "}
                            <strong className="text-charcoal">{websiteData.customerName}</strong>
                          </div>
                          <div>
                            <span className="text-walnut/80">Contact 1:</span>{" "}
                            <span className="text-charcoal font-mono">{websiteData.contactNumber1}</span>
                          </div>
                          <div>
                            <span className="text-walnut/80">Contact 2:</span>{" "}
                            <span className="text-charcoal font-mono">{websiteData.contactNumber2 || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-walnut/80">Location:</span>{" "}
                            <span className="text-charcoal">{websiteData.projectLocation}</span>
                          </div>
                        </div>
                        {websiteData.materialPreferences && (
                          <div className="pt-2 border-t border-walnut/10">
                            <span className="text-walnut/80 block">Material Preferences:</span>
                            <p className="text-charcoal italic mt-0.5">{websiteData.materialPreferences}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-walnut italic">
                        No direct website form payload found. Registered via manual creation.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: MATERIAL REQUIREMENTS */}
              {activeTab === "requirements" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-charcoal">Required Material Items</h3>
                      <p className="text-xs text-walnut">Manage specifications, quantities, and categories.</p>
                    </div>
                    <Button size="sm" variant="primary" onClick={handleOpenAddRequirement} className="gap-1.5 text-xs">
                      <Plus className="w-3.5 h-3.5" />
                      Add Material
                    </Button>
                  </div>

                  {requirementsList.length === 0 ? (
                    <div className="p-12 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15 flex flex-col items-center gap-3">
                      <Boxes className="w-8 h-8 text-gold/60" />
                      <p>No material requirements added yet.</p>
                      <Button size="sm" variant="primary" onClick={handleOpenAddRequirement}>
                        + Add First Material Item
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {requirementsList.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="p-4 bg-white rounded-xl border border-walnut/15 shadow-2xs hover:border-gold/40 transition flex items-start justify-between gap-4"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-charcoal">{item.materialName}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cream border border-walnut/20 text-walnut">
                                {item.category}
                              </span>
                              <span className="text-xs font-mono font-bold text-gold">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                            {item.additionalRequirements && (
                              <p className="text-xs text-walnut">{item.additionalRequirements}</p>
                            )}
                            {item.notes && (
                              <p className="text-[11px] text-walnut/70 italic">Note: {item.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditRequirement(item)}
                              className="p-1.5 rounded hover:bg-cream text-walnut hover:text-charcoal transition"
                              title="Edit Requirement"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => item.id && handleDeleteRequirement(item.id)}
                              className="p-1.5 rounded hover:bg-rose-50 text-walnut hover:text-rose-600 transition"
                              title="Delete Requirement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: FOLLOW-UPS */}
              {activeTab === "followups" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-charcoal">Scheduled CRM Follow-Ups</h3>
                      <p className="text-xs text-walnut">Track client discussions, calls, and next steps.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setIsFollowUpModalOpen(true)}
                      className="gap-1.5 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Follow-Up
                    </Button>
                  </div>

                  {followUpsList.length === 0 ? (
                    <div className="p-12 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15 flex flex-col items-center gap-3">
                      <Clock className="w-8 h-8 text-gold/60" />
                      <p>No follow-ups recorded yet.</p>
                      <Button size="sm" variant="primary" onClick={() => setIsFollowUpModalOpen(true)}>
                        + Schedule Follow-Up
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {followUpsList.map((f: any) => (
                        <div
                          key={f.id}
                          className="p-4 bg-white rounded-xl border border-walnut/15 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-charcoal">
                                {formatDate(f.followUpDate)}
                              </span>
                              <Badge
                                variant={f.status === "COMPLETED" ? "completed" : "pending"}
                                className="text-[10px] uppercase"
                              >
                                {f.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-charcoal font-medium">{f.notes}</p>
                            {f.outcomeNotes && (
                              <p className="text-xs text-emerald-700 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                                <strong>Outcome:</strong> {f.outcomeNotes}
                              </p>
                            )}
                          </div>
                          {f.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCompletingFollowUpId(f.id);
                                setFollowUpOutcomeNotes("");
                              }}
                              className="text-xs gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: MATERIAL QUOTATIONS */}
              {activeTab === "quotations" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-charcoal">Linked Material Quotations</h3>
                      <p className="text-xs text-walnut">Commercial proposals generated for this lead.</p>
                    </div>
                    <Link
                      href={`/quotations/new?type=MATERIAL&materialLeadId=${lead?.id || ""}&leadId=${lead?.id || ""}`}
                    >
                      <Button size="sm" variant="primary" className="gap-1.5 text-xs">
                        <Plus className="w-3.5 h-3.5" />
                        + Create Material Quotation
                      </Button>
                    </Link>
                  </div>

                  {quotationsList.length === 0 ? (
                    <div className="p-12 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15 flex flex-col items-center gap-3">
                      <FileText className="w-8 h-8 text-gold/60" />
                      <p>No material quotation generated yet.</p>
                      <Link
                        href={`/quotations/new?type=MATERIAL&materialLeadId=${lead?.id || ""}&leadId=${lead?.id || ""}`}
                      >
                        <Button size="sm" variant="primary">
                          + Generate First Quotation
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quotationsList.map((q: any) => (
                        <div
                          key={q.id}
                          className="p-4 bg-white rounded-xl border border-walnut/15 shadow-2xs flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-charcoal">
                                {q.referenceNo}
                              </span>
                              <Badge variant="pending" className="text-[10px] uppercase">
                                {q.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-walnut">
                              Created on {formatDate(q.createdAt)}
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <span className="text-[10px] text-walnut block">Total Amount</span>
                              <strong className="text-sm font-bold text-charcoal font-mono">
                                {formatCurrency(q.totalAmount)}
                              </strong>
                            </div>
                            <Link href={`/quotations`}>
                              <Button size="sm" variant="ghost" className="p-1.5" title="View Quotation">
                                <ExternalLink className="w-4 h-4 text-walnut hover:text-charcoal" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: MATERIAL ORDERS & VENDOR REQUESTS */}
              {activeTab === "orders" && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-charcoal">Material Orders & Vendor Requests</h3>
                      <p className="text-xs text-walnut">Track order placement, supplier dispatch, and fulfillment history.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(lead?.status === "WON" || lead?.stage === "WON") && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setIsPlaceOrderModalOpen(true)}
                          className="gap-1.5 text-xs font-bold"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          + Place Material Order
                        </Button>
                      )}
                      <Link href="/procurement/materials-order">
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Open Materials Order
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Active Orders List */}
                  {ordersList.length === 0 && !lead?.linkedOrderId ? (
                    <div className="p-10 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15 flex flex-col items-center gap-3">
                      <ShoppingBag className="w-8 h-8 text-gold/60" />
                      <p className="font-semibold text-charcoal">No materials orders placed for this lead yet.</p>
                      <p className="text-[11px] text-walnut/70 max-w-sm">
                        Once quotation is approved and lead is marked WON, place a material order to dispatch requests to suppliers.
                      </p>
                      {(lead?.status === "WON" || lead?.stage === "WON") && (
                        <Button size="sm" variant="primary" onClick={() => setIsPlaceOrderModalOpen(true)}>
                          + Place Order Now
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(ordersList.length > 0 ? ordersList : [{
                        id: lead.linkedOrderId,
                        referenceNo: lead.linkedOrderRef || "MAT-ORD-2026-XXXX",
                        status: lead.status === "ORDER_CONFIRMED" || lead.status === "VENDOR_ACCEPTED" ? "CONFIRMED" : "PENDING",
                        vendor: lead.vendorRequests?.[0] ? { name: lead.vendorRequests[0].vendorName, phone: lead.vendorRequests[0].vendorPhone } : null,
                        grandTotal: lead.vendorRequests?.[0]?.finalAmount || lead.quotations?.[0]?.totalAmount || 0,
                        createdAt: lead.updatedAt,
                      }]).map((ord: any) => {
                        const currentVendorReq = lead?.vendorRequests?.[0] || null;
                        const vStatus = currentVendorReq?.status || (ord.status === "CONFIRMED" ? "ACCEPTED" : "PENDING");

                        return (
                          <div
                            key={ord.id}
                            className="p-4 bg-white rounded-xl border border-walnut/15 shadow-2xs space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-bold text-charcoal">
                                    {ord.referenceNo}
                                  </span>
                                  <Badge
                                    variant={ord.status === "CONFIRMED" ? "success" : "pending"}
                                    className="text-[10px] uppercase font-bold"
                                  >
                                    Order: {ord.status}
                                  </Badge>
                                  <Badge
                                    variant={
                                      vStatus === "ACCEPTED"
                                        ? "success"
                                        : vStatus === "REJECTED"
                                        ? "danger"
                                        : "pending"
                                    }
                                    className="text-[10px] uppercase"
                                  >
                                    Vendor: {vStatus}
                                  </Badge>
                                </div>
                                <div className="text-xs text-walnut flex items-center gap-2">
                                  <Truck className="w-3.5 h-3.5 text-gold" />
                                  <span>
                                    Vendor: <strong>{ord.vendor?.name || currentVendorReq?.vendorName || "Direct Supplier"}</strong>
                                  </span>
                                  {ord.vendor?.phone && (
                                    <span className="font-mono text-walnut/70">({ord.vendor.phone})</span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] text-walnut block">Order Value</span>
                                <strong className="text-sm font-bold text-charcoal font-mono">
                                  {formatCurrency(ord.grandTotal)}
                                </strong>
                              </div>
                            </div>

                            {/* Quick Stage Actions for this Order */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-walnut/10">
                              <div className="text-[11px] text-walnut">
                                {vStatus === "PENDING" && "Awaiting response from supplier..."}
                                {vStatus === "ACCEPTED" && (
                                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Order confirmed & active in Materials Order
                                  </span>
                                )}
                                {vStatus === "REJECTED" && (
                                  <span className="text-rose-700 font-medium">
                                    Supplier rejected order. Select another supplier.
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {vStatus === "PENDING" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setVendorResponseMode("REJECTED");
                                        setIsVendorResponseModalOpen(true);
                                      }}
                                      className="text-xs h-7 gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                                    >
                                      <X className="w-3 h-3" />
                                      Vendor Rejects
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => {
                                        setVendorResponseMode("ACCEPTED");
                                        setIsVendorResponseModalOpen(true);
                                      }}
                                      className="text-xs h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                                    >
                                      <Check className="w-3 h-3" />
                                      Vendor Accepts
                                    </Button>
                                  </>
                                )}

                                {vStatus === "REJECTED" && (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => {
                                      setVendorResponseMode("NEW_VENDOR");
                                      setIsVendorResponseModalOpen(true);
                                    }}
                                    className="text-xs h-7 gap-1"
                                  >
                                    <RotateCw className="w-3 h-3" />
                                    + Select Another Vendor
                                  </Button>
                                )}

                                {vStatus === "ACCEPTED" && (
                                  <Link href="/procurement/materials-order">
                                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                                      <ExternalLink className="w-3 h-3" />
                                      View in Materials Order
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Complete Vendor Request History Table */}
                  {lead?.vendorRequests && lead.vendorRequests.length > 0 && (
                    <div className="bg-white rounded-xl border border-walnut/15 shadow-2xs p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-gold" />
                          Vendor Request History
                        </h4>
                        <span className="text-[10px] text-walnut">
                          {lead.vendorRequests.length} request record(s)
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-walnut/15 text-[11px] text-walnut uppercase font-semibold">
                              <th className="py-2 px-2">Vendor Name</th>
                              <th className="py-2 px-2">Request Date</th>
                              <th className="py-2 px-2 text-center">Response</th>
                              <th className="py-2 px-2">Response Date</th>
                              <th className="py-2 px-2">Notes / Reason</th>
                              <th className="py-2 px-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-walnut/10 font-mono">
                            {lead.vendorRequests.map((vr: any, idx: number) => (
                              <tr key={vr.id || idx} className="hover:bg-cream/30">
                                <td className="py-2 px-2 font-sans font-semibold text-charcoal">
                                  {vr.vendorName}
                                  {vr.vendorPhone && (
                                    <span className="block text-[10px] font-mono text-walnut/70">
                                      {vr.vendorPhone}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-2 text-walnut">
                                  {formatDate(vr.requestedAt)}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                      vr.status === "ACCEPTED"
                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                        : vr.status === "REJECTED"
                                        ? "bg-rose-50 text-rose-800 border border-rose-200"
                                        : "bg-amber-50 text-amber-800 border border-amber-200"
                                    }`}
                                  >
                                    {vr.status}
                                  </span>
                                </td>
                                <td className="py-2 px-2 text-walnut">
                                  {vr.respondedAt ? formatDate(vr.respondedAt) : "—"}
                                </td>
                                <td className="py-2 px-2 font-sans text-walnut text-[11px]">
                                  {vr.rejectionReason ? (
                                    <span className="text-rose-700 font-medium">Reason: {vr.rejectionReason}</span>
                                  ) : (
                                    vr.notes || "—"
                                  )}
                                </td>
                                <td className="py-2 px-2 text-right font-sans">
                                  {vr.status === "PENDING" && (
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => {
                                          setVendorResponseMode("ACCEPTED");
                                          setIsVendorResponseModalOpen(true);
                                        }}
                                        className="p-1 rounded text-emerald-700 hover:bg-emerald-50"
                                        title="Accept"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setVendorResponseMode("REJECTED");
                                          setIsVendorResponseModalOpen(true);
                                        }}
                                        className="p-1 rounded text-rose-700 hover:bg-rose-50"
                                        title="Reject"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                  {vr.status === "REJECTED" && (
                                    <button
                                      onClick={() => {
                                        setVendorResponseMode("NEW_VENDOR");
                                        setIsVendorResponseModalOpen(true);
                                      }}
                                      className="text-[10px] text-gold font-bold hover:underline"
                                    >
                                      Re-Select
                                    </button>
                                  )}
                                  {vr.status === "ACCEPTED" && (
                                    <span className="text-[10px] text-emerald-700 font-bold">Confirmed</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: TIMELINE */}
              {activeTab === "timeline" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-charcoal">Real-Time Lead Timeline</h3>
                  {timeline.length === 0 ? (
                    <div className="p-12 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15">
                      No activity events recorded yet.
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-walnut/20">
                      {timeline.map((act: any) => (
                        <div key={act.id} className="relative space-y-1">
                          <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-gold ring-4 ring-[#FAF8F5]" />
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-charcoal">{act.title}</span>
                            <span className="text-[10px] text-walnut font-mono">
                              {formatRelativeTime(act.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-walnut">{act.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL 1: CONTACT STATUS MODAL */}
      <ContactStatusModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        materialLead={lead}
        initialStatus={contactModalInitialStatus}
        onStatusUpdated={() => {
          toast.success("Contact Status Updated", "Customer contact status recorded");
          fetchDetails();
          onUpdate();
        }}
      />

      {/* MODAL 2: PLACE MATERIAL ORDER MODAL */}
      <PlaceMaterialOrderModal
        isOpen={isPlaceOrderModalOpen}
        onClose={() => setIsPlaceOrderModalOpen(false)}
        materialLead={lead}
        onOrderPlaced={(result) => {
          toast.success("Order Placed", "Material Order placed and vendor request dispatched");
          fetchDetails();
          onUpdate();
        }}
      />

      {/* MODAL 3: VENDOR RESPONSE MODAL */}
      <VendorResponseModal
        isOpen={isVendorResponseModalOpen}
        onClose={() => setIsVendorResponseModalOpen(false)}
        materialLead={lead}
        mode={vendorResponseMode}
        onResponseSubmitted={() => {
          toast.success(
            "Vendor Status Updated",
            vendorResponseMode === "ACCEPTED"
              ? "Order confirmed and live in Materials Order"
              : vendorResponseMode === "REJECTED"
              ? "Vendor rejection recorded. You can select another vendor."
              : "New vendor request dispatched"
          );
          fetchDetails();
          onUpdate();
        }}
      />

      {/* MODAL: ADD / EDIT MATERIAL REQUIREMENT */}
      <Modal
        isOpen={isReqModalOpen}
        onClose={() => setIsReqModalOpen(false)}
        title={editingReqId ? "Edit Material Requirement" : "Add Material Requirement"}
      >
        <form onSubmit={handleSaveRequirement} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">
              Material Name *
            </label>
            <Input
              value={reqName}
              onChange={(e) => setReqName(e.target.value)}
              placeholder="e.g. 18mm BWP Marine Plywood, Charcoal Louvers, Hettich Hinges"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">Category</label>
              <select
                value={reqCategory}
                onChange={(e) => setReqCategory(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="Plywood">Plywood</option>
                <option value="Laminates">Laminates</option>
                <option value="Hardware">Hardware & Fittings</option>
                <option value="Veneer">Veneer</option>
                <option value="Glass">Glass & Mirrors</option>
                <option value="Sanitaryware">Sanitaryware</option>
                <option value="Electrical">Electrical</option>
                <option value="General">General Materials</option>
                <option value="OTHER">Other (Custom Category)</option>
              </select>

              {reqCategory === "OTHER" && (
                <Input
                  value={customReqCategory}
                  onChange={(e) => setCustomReqCategory(e.target.value)}
                  placeholder="Enter custom category..."
                  className="mt-2 text-xs"
                  required
                />
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">Unit</label>
              <select
                value={reqUnit}
                onChange={(e) => setReqUnit(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="Sheets">Sheets</option>
                <option value="Sqft">Sqft</option>
                <option value="Nos">Nos</option>
                <option value="Kg">Kg</option>
                <option value="Boxes">Boxes</option>
                <option value="Meters">Meters</option>
                <option value="Units">Units</option>
                <option value="OTHER">Other (Custom Unit)</option>
              </select>

              {reqUnit === "OTHER" && (
                <Input
                  value={customReqUnit}
                  onChange={(e) => setCustomReqUnit(e.target.value)}
                  placeholder="Enter custom unit..."
                  className="mt-2 text-xs"
                  required
                />
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">Quantity</label>
            <Input
              type="number"
              min="0.1"
              step="any"
              value={reqQuantity}
              onChange={(e) => setReqQuantity(parseFloat(e.target.value) || 1)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">
              Additional Specifications
            </label>
            <Input
              value={reqAdditional}
              onChange={(e) => setReqAdditional(e.target.value)}
              placeholder="e.g. Century Club Prime 710, Merino 1mm High Gloss"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">Notes</label>
            <textarea
              value={reqNotes}
              onChange={(e) => setReqNotes(e.target.value)}
              placeholder="Special instructions or customer preferences..."
              rows={2}
              className="w-full p-2.5 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-walnut/10">
            <Button type="button" variant="ghost" onClick={() => setIsReqModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSavingReq}>
              {isSavingReq ? "Saving..." : "Save Requirement"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: SCHEDULE FOLLOW-UP */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Schedule Follow-Up"
      >
        <form onSubmit={handleScheduleFollowUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">Date *</label>
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">Time</label>
              <Input
                type="time"
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">Follow-up Notes *</label>
            <textarea
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              placeholder="e.g. Call client to discuss veneer catalog selection and quote pricing"
              rows={3}
              required
              className="w-full p-2.5 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-walnut/10">
            <Button type="button" variant="ghost" onClick={() => setIsFollowUpModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSchedulingFollowUp}>
              {isSchedulingFollowUp ? "Scheduling..." : "Schedule Follow-up"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: COMPLETE FOLLOW-UP */}
      <Modal
        isOpen={!!completingFollowUpId}
        onClose={() => setCompletingFollowUpId(null)}
        title="Complete Follow-Up"
      >
        <form onSubmit={handleCompleteFollowUp} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">
              Outcome & Discussion Notes *
            </label>
            <textarea
              value={followUpOutcomeNotes}
              onChange={(e) => setFollowUpOutcomeNotes(e.target.value)}
              placeholder="e.g. Client requested revised material quote with 10% discount on plywood"
              rows={3}
              required
              className="w-full p-2.5 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-walnut/10">
            <Button type="button" variant="ghost" onClick={() => setCompletingFollowUpId(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isCompletingFollowUp}>
              {isCompletingFollowUp ? "Recording..." : "Mark as Completed"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
