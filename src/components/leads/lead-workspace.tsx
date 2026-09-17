"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { AddExpenseModal } from "@/components/expenses/add-expense-modal";
import { ExpenseDetailsModal } from "@/components/expenses/expense-details-modal";
import {
  X,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Tag,
  FolderKanban,
  Plus,
  Compass,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit2,
  Trash2,
  Share2,
  MessageCircle,
  TrendingUp,
  DollarSign,
  Send,
  Building2,
  Check,
  XCircle,
  ExternalLink,
  History,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Receipt,
  PieChart,
  Eye,
  Package,
  User,
  Layers,
  Globe,
} from "lucide-react";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { LOSS_REASONS, FOLLOW_UP_TYPES } from "@/validators/lead.schema";

interface LeadWorkspaceProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onOpenProject?: (projectId: string) => void;
}

export const LeadWorkspace: React.FC<LeadWorkspaceProps> = ({
  leadId,
  isOpen,
  onClose,
  onUpdate,
  onOpenProject,
}) => {
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "timeline" | "followups" | "sitevisits" | "quotation" | "project" | "expenses"
  >("overview");

  // Expense Management state
  const [expensesSummary, setExpensesSummary] = useState<any>(null);
  const [isExpensesLoading, setIsExpensesLoading] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [isExpenseDetailsModalOpen, setIsExpenseDetailsModalOpen] = useState(false);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  // Inline Note Form per stage/card
  const [activeNoteStage, setActiveNoteStage] = useState<string | null>(null);
  const [inlineNoteText, setInlineNoteText] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Follow-up modal state
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("10:00");
  const [followUpType, setFollowUpType] = useState("CALL");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);

  // Complete follow-up modal state
  const [completingFollowUpId, setCompletingFollowUpId] = useState<string | null>(null);
  const [followUpOutcomeNotes, setFollowUpOutcomeNotes] = useState("");
  const [isCompletingFollowUp, setIsCompletingFollowUp] = useState(false);

  // Site visit modal state
  const [isSiteVisitModalOpen, setIsSiteVisitModalOpen] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("11:00");
  const [visitLocation, setVisitLocation] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [isSchedulingSiteVisit, setIsSchedulingSiteVisit] = useState(false);

  // Complete site visit modal state
  const [completingSiteVisitId, setCompletingSiteVisitId] = useState<string | null>(null);
  const [visitOutcomeNotes, setVisitOutcomeNotes] = useState("");
  const [isCompletingSiteVisit, setIsCompletingSiteVisit] = useState(false);

  // Status Change state
  const [selectedStatus, setSelectedStatus] = useState("");
  const [lossReason, setLossReason] = useState("BUDGET");
  const [lossNotes, setLossNotes] = useState("");
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Confirmation Fee state
  const [confirmationFeeAmount, setConfirmationFeeAmount] = useState("50000");
  const [confirmationFeeType, setConfirmationFeeType] = useState("UPI");
  const [confirmationFeeRef, setConfirmationFeeRef] = useState("");
  const [isFeePaid, setIsFeePaid] = useState(false);
  const [isRecordingFee, setIsRecordingFee] = useState(false);
  const [whatsAppSentStates, setWhatsAppSentStates] = useState<Record<string, boolean>>({});

  // Edit Lead state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdatingLead, setIsUpdatingLead] = useState(false);
  const [editForm, setEditForm] = useState({
    clientName: "",
    phone: "",
    email: "",
    location: "",
    propertyTypeKey: "",
    budget: "",
    priority: "MEDIUM",
    sourceKey: "",
    tags: "",
    notes: "",
    requirement: "",
  });

  // Delete Lead state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingLead, setIsDeletingLead] = useState(false);

  // Conversion state
  const [isConverting, setIsConverting] = useState(false);

  // Keyboard Escape listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        isOpen &&
        !isEditModalOpen &&
        !isDeleteModalOpen &&
        !isLostModalOpen &&
        !isFollowUpModalOpen &&
        !isSiteVisitModalOpen &&
        !isExpenseModalOpen &&
        !isExpenseDetailsModalOpen
      ) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    isLostModalOpen,
    isFollowUpModalOpen,
    isSiteVisitModalOpen,
    isExpenseModalOpen,
    isExpenseDetailsModalOpen,
    onClose,
  ]);

  const fetchLeadDetails = useCallback(async () => {
    if (!leadId) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/leads/${leadId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to fetch lead details");
      }
      setData(json.data);
      setSelectedStatus(json.data.lead?.stage || "NEW");
    } catch (err: any) {
      setError(err.message || "Failed to load lead");
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  const fetchExpensesSummary = useCallback(async () => {
    if (!leadId) return;
    setIsExpensesLoading(true);
    try {
      const res = await fetch(`/api/v1/leads/${leadId}/expenses`);
      const json = await res.json();
      if (json.success && json.data) {
        setExpensesSummary(json.data);
      }
    } catch {
      // quiet handling
    } finally {
      setIsExpensesLoading(false);
    }
  }, [leadId]);

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    setIsDeletingExpense(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/finance/expenses/${expenseId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to delete expense");
        return;
      }
      setSuccessMsg("Expense record deleted successfully");
      toast.success("Expense Record Deleted", "Expense removed from lead budget");
      fetchExpensesSummary();
      fetchLeadDetails();
      onUpdate();
    } catch {
      setError("Network error deleting expense");
    } finally {
      setIsDeletingExpense(false);
    }
  };

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadDetails();
      fetchExpensesSummary();
    }
  }, [isOpen, leadId, fetchLeadDetails, fetchExpensesSummary]);

  const lead = data?.lead;
  const timeline = data?.timeline || [];

  // Stage / Status Transition Handler
  const handleStageChange = async (newStage: string, customLossReason?: string, customNotes?: string) => {
    if (!leadId) return;
    setIsChangingStatus(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/leads/${leadId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStage,
          lossReason: newStage === "LOST" ? customLossReason || lossReason : undefined,
          notes: customNotes || undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to change lead status");
        return;
      }

      setSuccessMsg(`Status updated to ${newStage.replace(/_/g, " ")}`);
      toast.success("Lead Status Updated", `Stage changed to ${newStage.replace(/_/g, " ")}`);
      setIsLostModalOpen(false);
      await fetchLeadDetails();
      onUpdate();
    } catch {
      setError("Network error updating status");
    } finally {
      setIsChangingStatus(false);
    }
  };

  // Add Inline Note to Lead / Stage
  const handleAddInlineNote = async (stageKey?: string) => {
    if (!inlineNoteText.trim() || !leadId) return;
    setIsSubmittingNote(true);
    try {
      const res = await fetch(`/api/v1/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: inlineNoteText.trim(),
          stage: stageKey || lead?.stage,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setInlineNoteText("");
        setActiveNoteStage(null);
        toast.success("Note Added", "Note saved to lead timeline");
        await fetchLeadDetails();
        onUpdate();
      }
    } catch {
      setError("Failed to add note");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Follow Up Handlers
  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate || !leadId) return;
    setIsSchedulingFollowUp(true);
    setError("");

    try {
      const fullDateTime = followUpTime ? `${followUpDate}T${followUpTime}:00` : followUpDate;
      const res = await fetch(`/api/v1/leads/${leadId}/follow-ups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followUpDate: fullDateTime,
          type: followUpType,
          notes: followUpNotes || "Scheduled Follow-up",
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to schedule follow up");
        return;
      }

      setIsFollowUpModalOpen(false);
      setFollowUpNotes("");
      toast.success("Follow-up Scheduled", `Activity logged for ${followUpDate}`);
      await fetchLeadDetails();
      onUpdate();
    } catch {
      setError("Network error scheduling follow-up");
    } finally {
      setIsSchedulingFollowUp(false);
    }
  };

  const handleCompleteFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingFollowUpId || !followUpOutcomeNotes || !leadId) return;
    setIsCompletingFollowUp(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/leads/${leadId}/follow-ups/${completingFollowUpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcomeNotes: followUpOutcomeNotes }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to complete follow up");
        return;
      }

      setIsCompletingFollowUp(false);
      setCompletingFollowUpId(null);
      setFollowUpOutcomeNotes("");
      toast.success("Follow-up Completed", "Outcome notes recorded");
      await fetchLeadDetails();
      onUpdate();
    } catch {
      setError("Network error completing follow-up");
    } finally {
      setIsCompletingFollowUp(false);
    }
  };

  // Site Visit Handlers
  const handleScheduleSiteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDate || !leadId) return;
    setIsSchedulingSiteVisit(true);
    setError("");

    try {
      const fullDateTime = visitTime ? `${visitDate}T${visitTime}:00` : visitDate;
      const res = await fetch(`/api/v1/leads/${leadId}/site-visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitDate: fullDateTime,
          location: visitLocation || lead?.location || "Site Location",
          notes: visitNotes || "Site measurement & design assessment",
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to schedule site visit");
        return;
      }

      setIsSiteVisitModalOpen(false);
      setVisitNotes("");
      toast.success("Site Visit Scheduled", `Visit set for ${visitDate}`);
      await fetchLeadDetails();
      onUpdate();
    } catch {
      setError("Network error scheduling site visit");
    } finally {
      setIsSchedulingSiteVisit(false);
    }
  };

  const handleCompleteSiteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingSiteVisitId || !visitOutcomeNotes || !leadId) return;
    setIsCompletingSiteVisit(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/leads/${leadId}/site-visits/${completingSiteVisitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcomeNotes: visitOutcomeNotes }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to complete site visit");
        return;
      }

      setIsCompletingSiteVisit(false);
      setCompletingSiteVisitId(null);
      setVisitOutcomeNotes("");
      toast.success("Site Visit Completed", "Measurement & assessment notes recorded");
      await fetchLeadDetails();
      onUpdate();
    } catch {
      setError("Network error completing site visit");
    } finally {
      setIsCompletingSiteVisit(false);
    }
  };

  // WhatsApp Action Simulation
  const handleSendWhatsApp = (actionKey: string, messagePreview: string) => {
    setWhatsAppSentStates((prev) => ({ ...prev, [actionKey]: true }));
    // Also record an activity note
    if (leadId) {
      fetch(`/api/v1/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: `WhatsApp message dispatched: "${messagePreview}" to ${lead?.phone}`,
          type: "WHATSAPP",
          stage: lead?.stage,
        }),
      }).then(() => fetchLeadDetails());
    }
  };

  // Convert to Project Handler
  const handleConvertToProject = async () => {
    if (!leadId) return;
    if (!confirm(`Confirm creating execution Project for ${lead?.clientName} (${lead?.referenceNo})?`)) return;
    setIsConverting(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/leads/${leadId}/convert`, { method: "POST" });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Lead conversion failed.");
        return;
      }

      setSuccessMsg("Project created successfully!");
      await fetchLeadDetails();
      onUpdate();
    } catch {
      setError("Network error during project conversion");
    } finally {
      setIsConverting(false);
    }
  };

  // Edit Lead Modal Handler
  const openEditModal = () => {
    if (!lead) return;
    setEditForm({
      clientName: lead.clientName || "",
      phone: lead.phone || "",
      email: lead.email || "",
      location: lead.location || "",
      propertyTypeKey: lead.propertyTypeKey || "",
      budget: lead.estimatedBudget ? String(lead.estimatedBudget) : "",
      priority: lead.priority || "MEDIUM",
      sourceKey: lead.sourceKey || "WEBSITE",
      tags: lead.tags || "",
      notes: lead.notes || "",
      requirement: lead.requirement || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return;
    setIsUpdatingLead(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          estimatedBudget: editForm.budget ? parseFloat(editForm.budget) : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to update lead");
        return;
      }

      setIsEditModalOpen(false);
      setSuccessMsg("Lead updated successfully");
      toast.success("Lead Profile Updated", "Customer and requirement details saved");
      await fetchLeadDetails();
      onUpdate();
    } catch {
      setError("Network error updating lead");
    } finally {
      setIsUpdatingLead(false);
    }
  };

  // Delete Lead Handler
  const handleDeleteLead = async () => {
    if (!leadId) return;
    setIsDeletingLead(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to delete lead");
        setIsDeleteModalOpen(false);
        return;
      }

      setIsDeleteModalOpen(false);
      toast.success("Lead Deleted", "Lead record has been removed");
      onClose();
      onUpdate();
    } catch {
      setError("Network error deleting lead");
    } finally {
      setIsDeletingLead(false);
    }
  };

  if (!isOpen) return null;

  // Soft Pastel Stage Badges matching Reference Design
  const getStageBadge = (stage?: string) => {
    switch (stage) {
      case "NEW":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">● NEW</span>;
      case "CONTACTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">● CONTACTED</span>;
      case "NOT_CONTACTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">● NOT CONTACTED</span>;
      case "FOLLOW_UP_SCHEDULED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">● FOLLOW-UP</span>;
      case "SITE_VISIT_SCHEDULED":
      case "SITE_VISIT_COMPLETED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">● SITE VISIT</span>;
      case "QUOTATION_IN_PROGRESS":
      case "QUOTATION_SENT":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">● QUOTATION_SENT</span>;
      case "NEGOTIATION":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">● NEGOTIATION</span>;
      case "WON":
      case "PROJECT_CREATED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">● WON</span>;
      case "LOST":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">● LOST</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">● {stage}</span>;
    }
  };

  const getSourceBadge = (source?: string) => {
    const s = (source || "WEBSITE").toUpperCase();
    if (s.includes("WEBSITE")) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
          WEBSITE
        </span>
      );
    }
    if (s.includes("INSTAGRAM")) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-800 border border-pink-300 shadow-2xs">
          INSTAGRAM
        </span>
      );
    }
    if (s.includes("WHATSAPP")) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-300 shadow-2xs">
          WHATSAPP
        </span>
      );
    }
    if (s.includes("REFERRAL")) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-300 shadow-2xs">
          REFERRAL
        </span>
      );
    }
    if (s.includes("WALK") || s.includes("VISIT")) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300 shadow-2xs">
          WALK-IN
        </span>
      );
    }
    if (s.includes("PHONE") || s.includes("CALL")) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
          PHONE CALL
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-300 shadow-2xs">
        {(source || "MANUAL").replace(/^OTHER:/i, "").toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (p?: string) => {
    switch (p) {
      case "URGENT":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">URGENT</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">HIGH</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">LOW</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end select-none">
      {/* Subtle Darkened Overlay - Keeps Left 40% of Background Table Visible */}
      <div
        className="fixed inset-0 bg-charcoal/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Large Desktop Side Drawer Panel (Takes ~55% to 60% Width, Smooth Slide-in) */}
      <div className="relative w-full sm:w-[85vw] md:w-[68vw] lg:w-[58vw] max-w-6xl bg-[#FCFBF9] shadow-2xl border-l border-walnut/20 z-50 flex flex-col h-full animate-in slide-in-from-right duration-250 ease-out">
        
        {/* ========================================================= */}
        {/* 1. LEAD DETAILS PANEL HEADER (Section 10)                 */}
        {/* ========================================================= */}
        <div className="px-6 py-4 border-b border-walnut/15 bg-cream/70 shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              {/* Row 1: Customer Name + Prominent Lead ID + Source Badge */}
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-charcoal tracking-tight">
                  {lead?.clientName || "Lead Details"}
                </h2>
                <span className="font-mono text-xs font-bold px-3 py-0.5 bg-white text-slate-900 rounded-md border border-slate-300 shadow-2xs">
                  {lead?.referenceNo || "LEAD-..."}
                </span>
                {getSourceBadge(lead?.sourceKey)}
                {getPriorityBadge(lead?.priority)}
                {getStageBadge(lead?.stage)}
              </div>

              {/* Row 2: Direct Contact Icons & Coordinates */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-walnut mt-1">
                <a
                  href={`tel:${lead?.phone}`}
                  className="flex items-center gap-1 font-mono font-medium hover:text-charcoal hover:underline"
                >
                  <Phone className="w-3.5 h-3.5 text-walnut/70" /> {lead?.phone}
                </a>
                {lead?.email && (
                  <a
                    href={`mailto:${lead?.email}`}
                    className="flex items-center gap-1 hover:text-charcoal hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5 text-walnut/70" /> {lead?.email}
                  </a>
                )}
                {lead?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-walnut/70" /> {lead?.location}
                  </span>
                )}
                {lead?.clientId && (
                  <Link
                    href={`/clients?id=${lead.clientId}`}
                    className="flex items-center gap-1 text-gold hover:underline font-semibold"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-gold" /> Client 360 Profile ↗
                  </Link>
                )}
              </div>
            </div>

            {/* Top-Right Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-walnut hover:text-charcoal hover:bg-walnut/10 transition-colors cursor-pointer"
              title="Close panel (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ========================================================= */}
          {/* 2. LEAD ACTION BAR                                        */}
          {/* ========================================================= */}
          <div className="mt-4 pt-3 border-t border-walnut/10 flex flex-wrap items-center justify-between gap-3">
            {/* Pipeline Stage Quick Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-walnut uppercase tracking-wider">Pipeline Stage:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStatus(val);
                  if (val === "LOST") {
                    setIsLostModalOpen(true);
                  } else {
                    handleStageChange(val);
                  }
                }}
                disabled={isChangingStatus}
                className="text-xs font-bold bg-white text-charcoal border border-walnut/20 rounded-md px-3 py-1.5 shadow-2xs focus:ring-1 focus:ring-gold cursor-pointer"
              >
                <option value="NEW">New Lead</option>
                <option value="NOT_CONTACTED">Non Contacted</option>
                <option value="CONTACTED">Contacted</option>
                <option value="FOLLOW_UP_SCHEDULED">Follow-up Scheduled</option>
                <option value="SITE_VISIT_SCHEDULED">Site Visit Scheduled</option>
                <option value="SITE_VISIT_COMPLETED">Site Visit Completed</option>
                <option value="QUOTATION_IN_PROGRESS">Quotation In Progress</option>
                <option value="QUOTATION_SENT">Quotation Sent</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStageChange("CONTACTED")}
                className="text-xs py-1 h-7 border-teal-200 text-teal-700 bg-teal-50/50 hover:bg-teal-100"
              >
                Contacted
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStageChange("NOT_CONTACTED")}
                className="text-xs py-1 h-7 border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-100"
              >
                Non Contacted
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openEditModal}
                className="text-xs py-1 h-7"
              >
                <Edit2 className="w-3 h-3 mr-1" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSiteVisitModalOpen(true)}
                className="text-xs py-1 h-7 border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100"
              >
                <Compass className="w-3 h-3 mr-1" /> Site Visit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFollowUpModalOpen(true)}
                className="text-xs py-1 h-7 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100"
              >
                <Clock className="w-3 h-3 mr-1" /> Follow-up
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpenseModalOpen(true)}
                className="text-xs py-1 h-7 border-amber-300 text-amber-900 bg-amber-50/50 hover:bg-amber-100 font-bold"
              >
                <Plus className="w-3 h-3 mr-1" /> Expense
              </Button>
              <Link href={`/quotations/new?type=LEAD&leadId=${leadId}`}>
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs py-1 h-7 bg-gold text-charcoal hover:bg-gold/90 font-bold"
                >
                  <Plus className="w-3 h-3 mr-1" /> Quotation
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-xs py-1 h-7 text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. LEAD DETAILS TABS                                      */}
        {/* ========================================================= */}
        <div className="flex border-b border-walnut/15 px-6 bg-white overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: "overview", label: "Overview & Details" },
            { id: "timeline", label: `Timeline & Pipeline (${timeline.length})` },
            { id: "followups", label: `Follow-ups (${lead?.followUps?.length || 0})` },
            { id: "sitevisits", label: `Site Visits (${lead?.siteVisits?.length || 0})` },
            { id: "quotation", label: `Quotations (${lead?.quotations?.length || 0})` },
            { id: "project", label: lead?.project ? `Project (${lead.project.referenceNo})` : "Project & Client" },
            { id: "expenses", label: `Expenses (${expensesSummary?.expenseCount || 0})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? "border-gold text-charcoal font-bold bg-cream/20"
                    : "border-transparent text-walnut hover:text-charcoal hover:bg-cream/10"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-semibold flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. INDEPENDENTLY SCROLLABLE DRAWER CONTENT               */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="p-12 text-center text-walnut">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold" />
              <p className="text-xs">Loading lead details...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & DETAILS (Section 12: Cards A, B, C, D, E) */}
              {activeTab === "overview" && (() => {
                const web = lead?.websiteEnquiry;
                const spacesList: string[] = Array.isArray(web?.spaces)
                  ? web.spaces
                  : web?.spaces
                  ? [web.spaces]
                  : ["Full Home"];

                return (
                  <div className="space-y-4">
                    {/* CARD A — CUSTOMER INFORMATION */}
                    <div className="bg-white p-5 rounded-xl border border-walnut/20 shadow-2xs space-y-3">
                      <h3 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-gold" /> Section A — Customer Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-[11px] text-walnut/80 font-medium">Customer Full Name</div>
                          <div className="text-sm font-bold text-charcoal mt-0.5">{lead?.clientName || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80 font-medium">Phone Number</div>
                          <a
                            href={`tel:${lead?.phone}`}
                            className="font-mono font-bold text-emerald-800 mt-0.5 block hover:underline"
                          >
                            {lead?.phone || "N/A"}
                          </a>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80 font-medium">Email Address</div>
                          {lead?.email ? (
                            <a
                              href={`mailto:${lead?.email}`}
                              className="font-medium text-blue-700 mt-0.5 block hover:underline truncate"
                            >
                              {lead?.email}
                            </a>
                          ) : (
                            <span className="text-walnut/60 italic mt-0.5 block">None provided</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CARD B — REQUIREMENT INFORMATION */}
                    <div className="bg-white p-5 rounded-xl border border-walnut/20 shadow-2xs space-y-3">
                      <h3 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-blue-600" /> Section B — Requirement Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-[11px] text-walnut/80 font-medium">Requirement Type</div>
                          <div className="text-xs font-bold text-charcoal mt-0.5">
                            {web?.requirementType || lead?.requirement || "Turnkey Interiors"}
                          </div>
                          {web?.customRequirement && (
                            <span className="text-[10px] text-blue-700 block mt-0.5 font-medium">
                              Custom: {web.customRequirement}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80 font-medium">Customer Stage</div>
                          <div className="text-xs font-bold text-emerald-800 mt-0.5">
                            {web?.customerStage || "Ready To Start"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80 font-medium">Budget Target</div>
                          <div className="text-xs font-bold text-charcoal font-mono mt-0.5">
                            {lead?.estimatedBudget ? formatCurrency(lead.estimatedBudget) : "TBD / Consultation"}
                          </div>
                        </div>
                      </div>

                      {/* Specific Requirements Detail Text */}
                      {(web?.specificRequirements || lead?.notes) && (
                        <div className="pt-2 border-t border-walnut/10">
                          <span className="text-[11px] text-walnut/80 font-medium block mb-1">
                            Specific Requirements & Design Preferences:
                          </span>
                          <div className="p-3 bg-cream/30 rounded-lg border border-walnut/15 text-xs text-charcoal leading-relaxed whitespace-pre-wrap">
                            {web?.specificRequirements || lead?.notes}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CARD C — PROPERTY INFORMATION */}
                    <div className="bg-white p-5 rounded-xl border border-walnut/20 shadow-2xs space-y-3">
                      <h3 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-gold" /> Section C — Property Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-[11px] text-walnut/80 font-medium">Property Type</div>
                          <div className="text-xs font-bold text-charcoal mt-0.5">
                            {web?.customPropertyType || web?.propertyType || lead?.propertyTypeKey || "Apartment"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80 font-medium">Project Location</div>
                          <div className="text-xs font-bold text-charcoal mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-walnut/70" />
                            {lead?.location || web?.projectLocation || "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80 font-medium">Property Size</div>
                          <div className="text-xs font-bold text-charcoal mt-0.5">
                            {web?.propertySize || "Not Specified"}
                          </div>
                        </div>
                      </div>

                      {/* Selected Spaces Badges */}
                      <div className="pt-2 border-t border-walnut/10 space-y-1.5">
                        <span className="text-[11px] text-walnut/80 font-medium block">Selected Spaces Scope:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {spacesList.map((sp: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs"
                            >
                              ✓ {sp}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* CARD D — LEAD MANAGEMENT INFORMATION */}
                    <div className="bg-white p-5 rounded-xl border border-walnut/20 shadow-2xs space-y-3">
                      <h3 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" /> Section D — Lead Management Information
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-[11px] text-walnut/80 font-medium">Lead ID</div>
                          <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">{lead?.referenceNo}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80 font-medium">Lead Source</div>
                          <div className="mt-0.5">{getSourceBadge(lead?.sourceKey)}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80 font-medium">Created Date & Time</div>
                          <div className="font-mono text-xs text-charcoal mt-0.5">
                            {formatDate(lead?.createdAt)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80 font-medium">Assigned Staff</div>
                          <div className="text-xs font-bold text-charcoal mt-0.5">
                            {lead?.assignedTo?.fullName || "Unassigned"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CARD E — ORIGINAL WEBSITE ENQUIRY DATA (Section 13) */}
                    {web && (
                      <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Globe className="w-4 h-4 text-emerald-700" /> Section E — Original Inbound Website Form Data
                          </h3>
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                            Permanent Record
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-950/80">
                          Original multi-step questionnaire responses captured at the moment of website submission.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white p-3.5 rounded-lg border border-emerald-200/80">
                          <div>
                            <span className="text-[10px] text-walnut uppercase tracking-wider block">Step 1 — Requirement</span>
                            <span className="font-bold text-charcoal">{web.customRequirement || web.requirementType}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-walnut uppercase tracking-wider block">Step 2 — Property Type</span>
                            <span className="font-bold text-charcoal">{web.customPropertyType || web.propertyType}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-walnut uppercase tracking-wider block">Step 2 — Location & Size</span>
                            <span className="font-bold text-charcoal">{web.projectLocation} {web.propertySize ? `(${web.propertySize})` : ""}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-walnut uppercase tracking-wider block">Step 3 — Customer Stage</span>
                            <span className="font-bold text-emerald-800">{web.customerStage}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[10px] text-walnut uppercase tracking-wider block">Step 4 — Inbound Visitor</span>
                            <span className="font-bold text-charcoal">{lead?.clientName} ({lead?.phone} • {lead?.email || "No Email"})</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CARD F — INTERNAL NOTES & COMPOSER */}
                    <div className="bg-white p-5 rounded-xl border border-walnut/20 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-gold" /> Internal CRM Notes
                        </h3>
                        <button
                          onClick={() => setActiveNoteStage("GENERAL")}
                          className="text-xs font-bold text-gold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Note
                        </button>
                      </div>

                      {/* Inline Note Composer */}
                      {activeNoteStage === "GENERAL" && (
                        <div className="p-3 bg-white border border-gold/40 rounded-lg space-y-2">
                          <textarea
                            placeholder="Write a private staff note or client update..."
                            value={inlineNoteText}
                            onChange={(e) => setInlineNoteText(e.target.value)}
                            className="w-full text-xs p-2 border border-walnut/20 rounded-md focus:ring-1 focus:ring-gold"
                            rows={2}
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setActiveNoteStage(null)} className="text-xs py-1 h-7">
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleAddInlineNote("GENERAL")}
                              disabled={isSubmittingNote || !inlineNoteText.trim()}
                              className="text-xs py-1 h-7 bg-gold text-charcoal font-bold"
                            >
                              Save Note
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* TAB 2: TIMELINE & PIPELINE (Flipkart-Style Order Tracking Progression) */}
              {activeTab === "timeline" && (() => {
                // Determine stage progression index (0 to 6)
                const isStep1Done = true; // Lead Created is always done
                const isStep2Done = lead?.stage !== "NEW" && lead?.stage !== "NOT_CONTACTED";
                const isStep3Done =
                  (lead?.followUps && lead.followUps.some((f: any) => f.status === "COMPLETED")) ||
                  ["SITE_VISIT_SCHEDULED", "SITE_VISIT_COMPLETED", "QUOTATION_IN_PROGRESS", "QUOTATION_SENT", "NEGOTIATION", "WON", "PROJECT_CREATED"].includes(lead?.stage);
                const isStep4Done =
                  (lead?.siteVisits && lead.siteVisits.some((v: any) => v.status === "COMPLETED")) ||
                  ["QUOTATION_IN_PROGRESS", "QUOTATION_SENT", "NEGOTIATION", "WON", "PROJECT_CREATED"].includes(lead?.stage);
                const isStep5Done =
                  (lead?.quotations && lead.quotations.length > 0) ||
                  ["QUOTATION_SENT", "NEGOTIATION", "WON", "PROJECT_CREATED"].includes(lead?.stage);
                const isStep6Done = ["WON", "PROJECT_CREATED", "LOST"].includes(lead?.stage);
                const isStep7Done = !!lead?.project || isFeePaid;

                // Active step determination
                const isStep1Active = false;
                const isStep2Active = lead?.stage === "NEW" || lead?.stage === "NOT_CONTACTED";
                const isStep3Active = lead?.stage === "FOLLOW_UP_SCHEDULED";
                const isStep4Active = lead?.stage === "SITE_VISIT_SCHEDULED" || lead?.stage === "SITE_VISIT_COMPLETED";
                const isStep5Active = lead?.stage === "QUOTATION_IN_PROGRESS" || lead?.stage === "QUOTATION_SENT";
                const isStep6Active = lead?.stage === "NEGOTIATION";
                const isStep7Active = lead?.stage === "WON" && !lead?.project;

                // Completed count calculation for top progress tracker
                const completedCount = [isStep1Done, isStep2Done, isStep3Done, isStep4Done, isStep5Done, isStep6Done, isStep7Done].filter(Boolean).length;
                const progressPercent = Math.round((completedCount / 7) * 100);

                return (
                  <div className="space-y-6">
                    {/* Top Flipkart-Style Mini Order Tracker Banner */}
                    <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-charcoal flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-600" /> Pipeline Progression
                          </span>
                          <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {progressPercent}% Completed
                          </span>
                        </div>
                        <span className="text-[11px] text-walnut font-medium">
                          Current Stage: <strong className="text-charcoal">{lead?.stage?.replace(/_/g, " ")}</strong>
                        </span>
                      </div>

                      {/* Continuous Top Progress Bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500 ease-out rounded-full shadow-xs"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      {/* Horizontal Step Labels */}
                      <div className="grid grid-cols-5 text-center text-[10px] font-semibold text-walnut pt-1">
                        <span className={isStep1Done ? "text-emerald-700 font-bold" : ""}>Created</span>
                        <span className={isStep2Done ? "text-emerald-700 font-bold" : isStep2Active ? "text-teal-700 font-bold" : ""}>Contacted</span>
                        <span className={isStep4Done ? "text-emerald-700 font-bold" : isStep4Active ? "text-purple-700 font-bold" : ""}>Site Visit</span>
                        <span className={isStep5Done ? "text-emerald-700 font-bold" : isStep5Active ? "text-amber-700 font-bold" : ""}>Quotation</span>
                        <span className={isStep6Done ? "text-emerald-700 font-bold" : isStep6Active ? "text-emerald-700 font-bold" : ""}>Won & Project</span>
                      </div>
                    </div>

                    {/* Vertical Connected Order Tracking Line Container */}
                    <div className="relative pl-10 space-y-6">

                      {/* 1. LEAD CREATED */}
                      <div className={`relative p-4 rounded-xl border transition-all shadow-2xs space-y-2 ${isStep1Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : "bg-white border-walnut/20"}`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${isStep2Done || isStep2Active ? "bg-emerald-500" : "bg-slate-200"}`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className="absolute -left-[35px] top-4 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-emerald-100 shadow-sm z-10">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              ✓ 1. LEAD CREATED
                            </span>
                            <span className="text-xs font-bold text-charcoal">{lead?.clientName}</span>
                          </div>
                          <span className="text-[11px] text-walnut/70 font-mono">
                            {lead?.createdAt ? formatDate(lead.createdAt) : ""}
                          </span>
                        </div>
                        <p className="text-xs text-walnut">
                          Lead registered via <strong className="text-charcoal">{lead?.sourceKey || "WEBSITE"}</strong> with initial estimated budget{" "}
                          <strong className="text-emerald-700 font-mono">{lead?.estimatedBudget ? formatCurrency(lead.estimatedBudget) : "TBD"}</strong>.
                        </p>
                      </div>

                      {/* 2. CONTACTED */}
                      <div className={`relative p-4 rounded-xl border transition-all shadow-2xs space-y-2 ${isStep2Done ? "bg-white border-emerald-200" : isStep2Active ? "bg-teal-50/40 border-teal-300 ring-1 ring-teal-200" : "bg-white border-walnut/15 opacity-80"}`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${isStep3Done || isStep3Active ? "bg-emerald-500" : "bg-slate-200"}`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 ${isStep2Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep2Active ? "bg-teal-600 text-white ring-4 ring-teal-200 animate-pulse" : "bg-white border-2 border-slate-300 text-slate-400"}`}>
                          {isStep2Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "2"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isStep2Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-teal-50 text-teal-700 border-teal-200"}`}>
                              {isStep2Done ? "✓ " : ""}2. CONTACTED
                            </span>
                            <span className="text-xs font-bold text-charcoal">Initial Outreach & Qualification</span>
                          </div>
                          {!isStep2Done ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStageChange("CONTACTED")}
                              className="text-xs py-1 h-6 border-teal-300 text-teal-800 bg-teal-50 hover:bg-teal-100"
                            >
                              Mark Contacted
                            </Button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Completed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 3. FOLLOW-UP SCHEDULED */}
                      <div className={`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 ${isStep3Done ? "bg-white border-emerald-200" : isStep3Active ? "bg-blue-50/40 border-blue-300 ring-1 ring-blue-200" : "bg-white border-walnut/15 opacity-80"}`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${isStep4Done || isStep4Active ? "bg-emerald-500" : "bg-slate-200"}`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 ${isStep3Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep3Active ? "bg-blue-600 text-white ring-4 ring-blue-200 animate-pulse" : "bg-white border-2 border-slate-300 text-slate-400"}`}>
                          {isStep3Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "3"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isStep3Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                              {isStep3Done ? "✓ " : ""}3. FOLLOW-UP SCHEDULED
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsFollowUpModalOpen(true)}
                            className="text-xs py-1 h-6 text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100"
                          >
                            <Plus className="w-3 h-3 mr-1" /> Schedule
                          </Button>
                        </div>

                        {lead?.followUps && lead.followUps.length > 0 ? (
                          <div className="space-y-2">
                            {lead.followUps.map((f: any) => (
                              <div key={f.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                    <span>{formatDate(f.followUpDate)}</span>
                                    <Badge variant={f.status === "COMPLETED" ? "completed" : "active"}>{f.status}</Badge>
                                  </div>
                                  <div className="text-xs text-slate-600 mt-1">{f.notes}</div>
                                </div>
                                {f.status === "PENDING" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setCompletingFollowUpId(f.id)}
                                    className="text-xs py-1 h-6 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  >
                                    ✓ Done
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-walnut/70 italic">No follow-ups scheduled yet.</p>
                        )}
                      </div>

                      {/* 4. SITE VISIT SCHEDULED */}
                      <div className={`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 ${isStep4Done ? "bg-white border-emerald-200" : isStep4Active ? "bg-purple-50/40 border-purple-300 ring-1 ring-purple-200" : "bg-white border-walnut/15 opacity-80"}`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${isStep5Done || isStep5Active ? "bg-emerald-500" : "bg-slate-200"}`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 ${isStep4Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep4Active ? "bg-purple-600 text-white ring-4 ring-purple-200 animate-pulse" : "bg-white border-2 border-slate-300 text-slate-400"}`}>
                          {isStep4Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "4"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isStep4Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                              {isStep4Done ? "✓ " : ""}4. SITE VISIT SCHEDULED
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsSiteVisitModalOpen(true)}
                            className="text-xs py-1 h-6 text-purple-700 border-purple-200 bg-purple-50/50 hover:bg-purple-100"
                          >
                            <Plus className="w-3 h-3 mr-1" /> Schedule Visit
                          </Button>
                        </div>

                        {lead?.siteVisits && lead.siteVisits.length > 0 ? (
                          <div className="space-y-2">
                            {lead.siteVisits.map((v: any) => (
                              <div key={v.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                    <span>{formatDate(v.visitDate)}</span>
                                    <Badge variant={v.status === "COMPLETED" ? "completed" : "active"}>{v.status}</Badge>
                                  </div>
                                  <div className="text-xs text-slate-600 mt-1">{v.location} - {v.notes}</div>
                                </div>
                                {v.status === "SCHEDULED" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setCompletingSiteVisitId(v.id)}
                                    className="text-xs py-1 h-6 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  >
                                    ✓ Done
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-walnut/70 italic">No site visits scheduled.</p>
                        )}
                      </div>

                      {/* 5. QUOTATION SENT & WHATSAPP ACTION */}
                      <div className={`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 ${isStep5Done ? "bg-white border-emerald-200" : isStep5Active ? "bg-amber-50/40 border-amber-300 ring-1 ring-amber-200" : "bg-white border-walnut/15 opacity-80"}`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${isStep6Done || isStep6Active ? "bg-emerald-500" : "bg-slate-200"}`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 ${isStep5Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep5Active ? "bg-amber-600 text-white ring-4 ring-amber-200 animate-pulse" : "bg-white border-2 border-slate-300 text-slate-400"}`}>
                          {isStep5Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "5"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isStep5Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                              {isStep5Done ? "✓ " : ""}5. QUOTATION SENT
                            </span>
                          </div>
                          <Link href={`/quotations?leadId=${leadId}`}>
                            <Button size="sm" variant="outline" className="text-xs py-1 h-6">
                              + Create Quotation
                            </Button>
                          </Link>
                        </div>

                        {lead?.quotations && lead.quotations.length > 0 ? (
                          <div className="space-y-2">
                            {lead.quotations.map((q: any) => (
                              <div key={q.id} className="p-3 bg-amber-50/40 rounded-lg border border-amber-200 flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-bold text-slate-900 font-mono">
                                    {q.referenceNo} (Rev {q.revision || 1}) — {formatCurrency(q.totalAmount)}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">Status: {q.status}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link href={`/quotations/${q.id}`}>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs py-1 h-6 text-charcoal border-walnut/20 hover:bg-cream/60"
                                    >
                                      View / Edit ↗
                                    </Button>
                                  </Link>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSendWhatsApp(`QUOTE_${q.id}`, `Quotation ${q.referenceNo} for ${formatCurrency(q.totalAmount)}`)}
                                    className="text-xs py-1 h-6 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                  >
                                    <MessageCircle className="w-3 h-3 mr-1" />
                                    {whatsAppSentStates[`QUOTE_${q.id}`] ? "✓ Sent via WhatsApp" : "Send WhatsApp"}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-walnut/70 italic">No quotation generated yet.</p>
                        )}
                      </div>

                      {/* 6. NEGOTIATION & FINALIZATION */}
                      <div className={`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 ${isStep6Done ? "bg-white border-emerald-200" : isStep6Active ? "bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-200" : "bg-white border-walnut/15 opacity-80"}`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${isStep7Done || isStep7Active ? "bg-emerald-500" : "bg-slate-200"}`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 ${isStep6Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep6Active ? "bg-indigo-600 text-white ring-4 ring-indigo-200 animate-pulse" : "bg-white border-2 border-slate-300 text-slate-400"}`}>
                          {isStep6Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "6"}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isStep6Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                            {isStep6Done ? "✓ " : ""}6. NEGOTIATION & DECISION
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleStageChange("WON")}
                              className="text-xs py-1 h-6 bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                            >
                              ✓ WON
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsLostModalOpen(true)}
                              className="text-xs py-1 h-6 text-rose-600 border-rose-300 bg-rose-50 hover:bg-rose-100"
                            >
                              ✕ LOST
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* 7. CONFIRMATION FEE & PROJECT CREATION (When Won) */}
                      {lead?.stage === "WON" && (
                        <div className={`relative p-5 rounded-xl border transition-all shadow-2xs space-y-4 ${isStep7Done ? "bg-emerald-50/90 border-emerald-400" : "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200"}`}>
                          {/* Step Node Dot */}
                          <div className="absolute -left-[35px] top-4 w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center ring-4 ring-emerald-200 shadow-sm z-10">
                            {isStep7Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "7"}
                          </div>

                          <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-700" />
                              <h4 className="text-xs font-bold text-emerald-900 uppercase">
                                7. CONFIRMATION FEE & PROJECT CREATION
                              </h4>
                            </div>
                            <Badge variant="completed">LEAD WON</Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div>
                              <div className="text-emerald-700 font-medium">Confirmation Fee</div>
                              <div className="font-bold text-emerald-950 font-mono text-sm mt-0.5">
                                {formatCurrency(parseFloat(confirmationFeeAmount) || 50000)}
                              </div>
                            </div>
                            <div>
                              <div className="text-emerald-700 font-medium">Payment Mode</div>
                              <div className="font-bold text-emerald-950 mt-0.5">{confirmationFeeType}</div>
                            </div>
                            <div>
                              <div className="text-emerald-700 font-medium">Payment Status</div>
                              <div className="font-bold text-emerald-950 mt-0.5">
                                {isFeePaid ? "✓ Verified Paid" : "Pending Confirmation"}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            {!isFeePaid && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setIsFeePaid(true);
                                  setSuccessMsg("Confirmation fee verified as Paid.");
                                }}
                                className="text-xs py-1 h-7 bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                              >
                                ✓ Mark as Paid
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendWhatsApp("CONFIRMATION_FEE", `Confirmation fee payment receipt for ${lead?.clientName}`)}
                              className="text-xs py-1 h-7 bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-1" />
                              {whatsAppSentStates["CONFIRMATION_FEE"] ? "✓ WhatsApp Receipt Sent" : "Send WhatsApp Receipt"}
                            </Button>

                            {!lead?.project ? (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={handleConvertToProject}
                                disabled={isConverting}
                                className="text-xs py-1 h-7 bg-emerald-700 hover:bg-emerald-800 text-white font-bold ml-auto"
                              >
                                <FolderKanban className="w-3.5 h-3.5 mr-1" />
                                {isConverting ? "Creating Project..." : "Create Project"}
                              </Button>
                            ) : (
                              <div className="ml-auto flex items-center gap-2">
                                {onOpenProject ? (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => onOpenProject(lead.project.id)}
                                    className="text-xs py-1 h-7 bg-emerald-800 text-white font-bold"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Project {lead.project.referenceNo}
                                  </Button>
                                ) : (
                                  <Link href={`/projects?id=${lead.project.id}`}>
                                    <Button size="sm" variant="primary" className="text-xs py-1 h-7 bg-emerald-800 text-white font-bold">
                                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Project {lead.project.referenceNo}
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })()}

              {/* TAB 3: FOLLOW-UPS */}
              {activeTab === "followups" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-walnut uppercase tracking-wider">Scheduled Follow-ups</h3>
                    <Button size="sm" variant="outline" onClick={() => setIsFollowUpModalOpen(true)} className="text-xs py-1 h-7">
                      <Plus className="w-3 h-3 mr-1" /> New Follow-up
                    </Button>
                  </div>
                  {lead?.followUps && lead.followUps.length > 0 ? (
                    <div className="space-y-2">
                      {lead.followUps.map((f: any) => (
                        <div key={f.id} className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-charcoal flex items-center gap-2">
                              <span>{formatDate(f.followUpDate)}</span>
                              <Badge variant={f.status === "COMPLETED" ? "completed" : "active"}>{f.status}</Badge>
                            </div>
                            <div className="text-xs text-walnut mt-1">{f.notes}</div>
                            {f.outcomeNotes && (
                              <div className="text-[11px] text-emerald-700 mt-1 font-medium">Outcome: {f.outcomeNotes}</div>
                            )}
                          </div>
                          {f.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCompletingFollowUpId(f.id)}
                              className="text-xs py-1 h-7 bg-emerald-50 text-emerald-700 border-emerald-300"
                            >
                              Mark Done
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15">
                      No follow-ups recorded.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SITE VISITS */}
              {activeTab === "sitevisits" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-walnut uppercase tracking-wider">Site Visits</h3>
                    <Button size="sm" variant="outline" onClick={() => setIsSiteVisitModalOpen(true)} className="text-xs py-1 h-7">
                      <Plus className="w-3 h-3 mr-1" /> New Site Visit
                    </Button>
                  </div>
                  {lead?.siteVisits && lead.siteVisits.length > 0 ? (
                    <div className="space-y-2">
                      {lead.siteVisits.map((v: any) => (
                        <div key={v.id} className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-charcoal flex items-center gap-2">
                              <span>{formatDate(v.visitDate)}</span>
                              <Badge variant={v.status === "COMPLETED" ? "completed" : "active"}>{v.status}</Badge>
                            </div>
                            <div className="text-xs text-walnut mt-1">{v.location} — {v.notes}</div>
                            {v.outcomeNotes && (
                              <div className="text-[11px] text-emerald-700 mt-1 font-medium">Notes: {v.outcomeNotes}</div>
                            )}
                          </div>
                          {v.status === "SCHEDULED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCompletingSiteVisitId(v.id)}
                              className="text-xs py-1 h-7 bg-emerald-50 text-emerald-700 border-emerald-300"
                            >
                              Mark Completed
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15">
                      No site visits recorded.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: QUOTATIONS */}
              {activeTab === "quotation" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="text-xs font-bold text-walnut uppercase tracking-wider">Associated Quotations</h3>
                    <div className="flex items-center gap-2">
                      <Link href={`/quotations/new?type=MATERIAL&leadId=${leadId}`}>
                        <Button size="sm" variant="outline" className="text-xs py-1 h-7 border-gold text-charcoal hover:bg-gold/10 font-bold">
                          <Plus className="w-3 h-3 mr-1" /> Material Quotation
                        </Button>
                      </Link>
                      <Link href={`/quotations/new?type=LEAD&leadId=${leadId}`}>
                        <Button size="sm" variant="primary" className="text-xs py-1 h-7 bg-gold text-charcoal font-bold">
                          <Plus className="w-3 h-3 mr-1" /> Lead Quotation
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {lead?.quotations && lead.quotations.length > 0 ? (
                    <div className="space-y-2">
                      {lead.quotations.map((q: any) => {
                        const qType = q.quotationType || (q.notes?.toLowerCase().includes('material') || q.title?.toLowerCase().includes('material') ? 'MATERIAL' : 'LEAD');
                        const isMat = qType === 'MATERIAL';

                        const handleShareWhatsApp = () => {
                          const rawPhone = lead?.phone || '';
                          const cleanPhone = rawPhone.replace(/\D/g, '');
                          if (!cleanPhone) {
                            alert('No valid phone number for client WhatsApp sharing.');
                            return;
                          }
                          const phone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                          const docTitle = q.customTitle || q.title || (isMat ? 'MATERIAL QUOTATION' : 'INTERIOR QUOTATION');
                          const msg = `*ESPACIO — Timeless Interiors*\n` +
                            `━━━━━━━━━━━━━━━━━━━━\n` +
                            `*Document:* ${docTitle}\n` +
                            `*Reference No:* ${q.referenceNo}\n` +
                            `*Client / Lead:* ${lead?.clientName || ''}\n` +
                            `*Total Amount:* ₹${Number(q.totalAmount || 0).toLocaleString('en-IN')}\n` +
                            `*Status:* ${q.status || 'Pending'}\n` +
                            `━━━━━━━━━━━━━━━━━━━━\n` +
                            `Thank you for trusting Espacio. Please reach out if you have any questions.`;
                          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                        };

                        return (
                          <div key={q.id} className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-charcoal font-mono flex items-center gap-2">
                                <span>{q.referenceNo} (Rev {q.revision || 1})</span>
                                <Badge variant={q.status === "APPROVED" ? "completed" : "active"}>{q.status}</Badge>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${isMat ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-300'}`}>
                                  {isMat ? 'Material Quote' : 'Lead Quote'}
                                </span>
                              </div>
                              <div className="text-sm font-bold text-emerald-700 font-mono mt-1">
                                {formatCurrency(q.totalAmount)}
                              </div>
                              {q.title && <div className="text-[11px] text-walnut mt-0.5">{q.title}</div>}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleShareWhatsApp}
                                title="Send Quotation via WhatsApp"
                                className="px-2.5 py-1 text-xs font-medium rounded-md border border-emerald-400 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                WhatsApp
                              </button>
                              <Link href={`/quotations/${q.id}`}>
                                <Button size="sm" variant="outline" className="text-xs py-1 h-7">
                                  View / Edit
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15">
                      No quotations attached to this lead yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: PROJECT & CLIENT */}
              {activeTab === "project" && (
                <div className="space-y-4">
                  {lead?.project ? (
                    <div className="bg-white p-5 rounded-xl border border-emerald-300 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-walnut/10 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">Execution Project</span>
                          <h3 className="text-base font-bold text-charcoal">{lead.project.title}</h3>
                          <span className="font-mono text-xs text-walnut">{lead.project.referenceNo}</span>
                        </div>
                        <Badge variant="active">{lead.project.stage}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="text-walnut">Contract Value</div>
                          <div className="font-bold text-charcoal font-mono text-sm mt-0.5">
                            {formatCurrency(lead.project.contractValue || 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-walnut">Client Linked</div>
                          <div className="font-bold text-charcoal mt-0.5">
                            {lead.client?.fullName || lead.clientName}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        {onOpenProject ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onOpenProject(lead.project.id)}
                            className="w-full text-xs py-1.5 h-8 bg-gold text-charcoal font-bold"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open Project Details ({lead.project.referenceNo})
                          </Button>
                        ) : (
                          <Link href={`/projects?id=${lead.project.id}`}>
                            <Button variant="primary" size="sm" className="w-full text-xs py-1.5 h-8 bg-gold text-charcoal font-bold">
                              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open in Project Workspace
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-xl border border-walnut/15 text-center space-y-3">
                      <FolderKanban className="w-8 h-8 text-walnut/40 mx-auto" />
                      <h4 className="text-xs font-bold text-charcoal">Project Not Created Yet</h4>
                      <p className="text-xs text-walnut max-w-sm mx-auto">
                        Once the lead is won and confirmation fee is collected, you can convert it into an active project.
                      </p>
                      {lead?.stage === "WON" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleConvertToProject}
                          disabled={isConverting}
                          className="text-xs bg-emerald-600 text-white font-bold"
                        >
                          Create Project Now
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: MATERIAL / PERSONAL EXPENSES */}
              {activeTab === "expenses" && (() => {
                const expensesList = expensesSummary?.expenses || [];
                const activeExpenses = expensesList.filter(
                  (e: any) => e.status !== "CANCELLED" && e.status !== "REJECTED"
                );
                const totalExpenses = expensesSummary?.totalExpenses || 0;
                const categoryBreakdown = expensesSummary?.categoryBreakdown || [];
                const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;
                const avgExpense = activeExpenses.length > 0 ? Math.round(totalExpenses / activeExpenses.length) : 0;

                return (
                  <div className="space-y-6">
                    {/* Header with Title and Add Expense Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-walnut/15">
                      <div>
                        <h3 className="text-sm font-bold text-charcoal flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-gold" /> Material / Personal Expense Operations
                        </h3>
                        <p className="text-[11px] text-walnut mt-0.5">
                          Dedicated cost tracking dynamically linked to {lead?.clientName || "Lead"} (
                          {lead?.requirement || "Material Requirements"}) & synchronized with Global Expenses
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="text-xs py-1.5 h-8 bg-gold text-charcoal font-bold hover:bg-gold/90 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> + Add Expense
                      </Button>
                    </div>

                    {/* Person / Lead & Material Requirement Context Card */}
                    <div className="bg-white p-4 rounded-xl border border-gold/30 shadow-2xs space-y-2.5">
                      <span className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-gold" /> Material Requirement Person / Lead Details
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <div className="text-walnut/70 text-[11px]">Person / Lead Name</div>
                          <div className="font-bold text-charcoal mt-0.5">{lead?.clientName || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-walnut/70 text-[11px]">Lead ID</div>
                          <div className="font-bold text-charcoal mt-0.5 font-mono">{lead?.referenceNo || lead?.id}</div>
                        </div>
                        <div>
                          <div className="text-walnut/70 text-[11px]">Phone Number</div>
                          <div className="font-bold text-charcoal mt-0.5 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-walnut/70" />
                            {lead?.phone || "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-walnut/70 text-[11px]">Material Requirement</div>
                          <div className="font-semibold text-charcoal mt-0.5 truncate" title={lead?.requirement || "Materials Required"}>
                            {lead?.requirement || "Materials Required"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
                        <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
                          Total Person Expenses
                        </span>
                        <div className="text-lg font-bold text-rose-700 font-mono mt-1">
                          {formatCurrency(totalExpenses)}
                        </div>
                        <span className="text-[10px] text-walnut/80 mt-0.5 block font-mono">
                          {activeExpenses.length} active entries
                        </span>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
                        <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
                          Total Vouchers
                        </span>
                        <div className="text-lg font-bold text-charcoal font-mono mt-1">
                          {expensesList.length}
                        </div>
                        <span className="text-[10px] text-walnut/80 mt-0.5 block font-mono">
                          Recorded in history
                        </span>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
                        <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
                          Top Category
                        </span>
                        <div className="text-sm font-bold text-charcoal truncate mt-1">
                          {topCategory ? topCategory.categoryKey.replace(/_/g, " ") : "None"}
                        </div>
                        <span className="text-[10px] text-walnut/80 mt-0.5 block font-mono">
                          {topCategory ? formatCurrency(topCategory.amount) : "₹0"}
                        </span>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
                        <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
                          Avg per Voucher
                        </span>
                        <div className="text-lg font-bold text-charcoal font-mono mt-1">
                          {formatCurrency(avgExpense)}
                        </div>
                        <span className="text-[10px] text-walnut/80 mt-0.5 block font-mono">
                          Average expenditure
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Category-Wise Expense Breakdown */}
                    <div className="bg-white p-5 rounded-xl border border-walnut/20 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                          <PieChart className="w-3.5 h-3.5 text-gold" /> Category-Wise Expense Breakdown
                        </h4>
                        <span className="text-[11px] font-mono text-walnut">
                          {categoryBreakdown.length} Categories Active
                        </span>
                      </div>

                      {categoryBreakdown.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {categoryBreakdown.map((cat: any) => (
                            <div
                              key={cat.categoryKey}
                              className="p-3 bg-cream/30 rounded-xl border border-walnut/15 space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-charcoal">{cat.categoryKey.replace(/_/g, " ")}</span>
                                <span className="font-mono font-bold text-rose-700">
                                  {formatCurrency(cat.amount)}
                                </span>
                              </div>

                              <div className="w-full bg-walnut/10 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-gold h-full rounded-full transition-all duration-300"
                                  style={{ width: `${cat.percentage}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-walnut font-mono">
                                <span>{cat.count} {cat.count === 1 ? "voucher" : "vouchers"}</span>
                                <span>{cat.percentage}% of total</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-walnut italic py-2">
                          No category expenditure logged yet. Record an expense to see breakdown.
                        </p>
                      )}
                    </div>

                    {/* Complete Material Expense History Table */}
                    <div className="bg-white rounded-xl border border-walnut/20 shadow-2xs overflow-hidden">
                      <div className="p-4 bg-cream/40 border-b border-walnut/15 flex items-center justify-between">
                        <h4 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-gold" /> Complete Expense History
                        </h4>
                        <span className="text-[11px] font-mono text-walnut">
                          {expensesList.length} total records
                        </span>
                      </div>

                      {expensesList.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-walnut/15 bg-cream/20 text-walnut text-[11px] font-bold">
                                <th className="p-3">Date</th>
                                <th className="p-3">Expense ID</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">Description</th>
                                <th className="p-3">Vendor / Payee</th>
                                <th className="p-3">Payment Type</th>
                                <th className="p-3 text-right">Amount</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-walnut/10">
                              {expensesList.map((exp: any) => {
                                const statusVariant =
                                  exp.status === "APPROVED" || exp.status === "PAID"
                                    ? "completed"
                                    : exp.status === "SUBMITTED" || exp.status === "DRAFT"
                                    ? "pending"
                                    : "danger";

                                return (
                                  <tr key={exp.id} className="hover:bg-cream/20 transition-colors">
                                    <td className="p-3 font-mono text-[11px] text-walnut whitespace-nowrap">
                                      {formatDate(exp.expenseDate || exp.createdAt)}
                                    </td>
                                    <td className="p-3 font-mono font-bold text-charcoal whitespace-nowrap">
                                      {exp.referenceNo}
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cream/80 text-charcoal border border-walnut/20">
                                        {(exp.categoryKey || exp.category || "GENERAL").replace(/_/g, " ")}
                                      </span>
                                    </td>
                                    <td className="p-3 max-w-[180px]">
                                      <div className="font-medium text-charcoal truncate" title={exp.description}>
                                        {exp.description}
                                      </div>
                                      {exp.referenceNoExternal && (
                                        <div className="text-[10px] text-walnut/70 font-mono">
                                          Ref: {exp.referenceNoExternal}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3 text-walnut whitespace-nowrap">
                                      {exp.vendorName || "Direct Supplier / Contractor"}
                                    </td>
                                    <td className="p-3 font-mono text-[11px] text-walnut whitespace-nowrap">
                                      {(exp.paymentMethod || "BANK_TRANSFER").replace(/_/g, " ")}
                                    </td>
                                    <td className="p-3 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                                      {formatCurrency(exp.amount)}
                                    </td>
                                    <td className="p-3 text-center whitespace-nowrap">
                                      <Badge variant={statusVariant}>
                                        {exp.status === "SUBMITTED" ? "Pending" : (exp.status || "APPROVED").replace(/_/g, " ")}
                                      </Badge>
                                    </td>
                                    <td className="p-3 text-right whitespace-nowrap">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedExpenseId(exp.id);
                                            setIsExpenseDetailsModalOpen(true);
                                          }}
                                          className="p-1 text-walnut hover:text-charcoal hover:bg-cream rounded cursor-pointer transition-colors"
                                          title="View Voucher"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteExpense(exp.id)}
                                          disabled={isDeletingExpense}
                                          className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                          title="Delete Expense"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center space-y-2">
                          <Receipt className="w-8 h-8 text-walnut/30 mx-auto" />
                          <p className="text-xs text-walnut">No expenses recorded for this person yet.</p>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setIsExpenseModalOpen(true)}
                            className="text-xs bg-gold text-charcoal font-bold mt-2"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Record First Expense
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODALS: Schedule Follow-up, Site Visit, Edit, Lost Reason */}
      {/* ========================================================= */}

      {/* Schedule Follow-up Modal */}
      <Modal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} title="Schedule Client Follow-up" maxWidth="sm">
        <form onSubmit={handleScheduleFollowUp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Follow-up Date *</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full text-xs p-2 border border-walnut/20 rounded-md bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Time</label>
            <input
              type="time"
              value={followUpTime}
              onChange={(e) => setFollowUpTime(e.target.value)}
              className="w-full text-xs p-2 border border-walnut/20 rounded-md bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Communication Channel</label>
            <select
              value={followUpType}
              onChange={(e) => setFollowUpType(e.target.value)}
              className="w-full text-xs p-2 border border-walnut/20 rounded-md bg-white"
            >
              <option value="CALL">Phone Call</option>
              <option value="WHATSAPP">WhatsApp Message</option>
              <option value="EMAIL">Email</option>
              <option value="MEETING">In-Person Meeting</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Notes / Agenda *</label>
            <textarea
              placeholder="e.g. Discuss revised 3D quotation..."
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              className="w-full text-xs p-2 border border-walnut/20 rounded-md bg-white"
              rows={2}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsFollowUpModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" isLoading={isSchedulingFollowUp} className="bg-gold text-charcoal font-bold">
              Save Follow-up
            </Button>
          </div>
        </form>
      </Modal>

      {/* Complete Follow-up Modal */}
      <Modal isOpen={!!completingFollowUpId} onClose={() => setCompletingFollowUpId(null)} title="Record Follow-up Outcome" maxWidth="sm">
        <form onSubmit={handleCompleteFollowUp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Outcome / Discussion Notes *</label>
            <textarea
              placeholder="What was discussed with the client?"
              value={followUpOutcomeNotes}
              onChange={(e) => setFollowUpOutcomeNotes(e.target.value)}
              className="w-full text-xs p-2 border border-walnut/20 rounded-md bg-white"
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" type="button" onClick={() => setCompletingFollowUpId(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" isLoading={isCompletingFollowUp} className="bg-emerald-600 text-white font-bold">
              Mark Completed
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Site Visit Modal */}
      <Modal isOpen={isSiteVisitModalOpen} onClose={() => setIsSiteVisitModalOpen(false)} title="Schedule Site Measurement Visit" maxWidth="sm">
        <form onSubmit={handleScheduleSiteVisit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Visit Date *</label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full text-xs p-2 border border-walnut/20 rounded-md bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Time</label>
            <input
              type="time"
              value={visitTime}
              onChange={(e) => setVisitTime(e.target.value)}
              className="w-full text-xs p-2 border border-walnut/20 rounded-md bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Site Location / Address</label>
            <input
              type="text"
              value={visitLocation}
              onChange={(e) => setVisitLocation(e.target.value)}
              placeholder="e.g. Palm Meadows Villa 42, Bangalore"
              className="w-full text-xs p-2 border border-walnut/20 rounded-md bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Notes</label>
            <textarea
              placeholder="Initial site measurement and space assessment"
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              className="w-full text-xs p-2 border border-walnut/20 rounded-md bg-white"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsSiteVisitModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" isLoading={isSchedulingSiteVisit} className="bg-purple-600 text-white font-bold">
              Schedule Visit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Complete Site Visit Modal */}
      <Modal isOpen={!!completingSiteVisitId} onClose={() => setCompletingSiteVisitId(null)} title="Record Site Visit Outcome" maxWidth="sm">
        <form onSubmit={handleCompleteSiteVisit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Site Measurement & Assessment Notes *</label>
            <textarea
              placeholder="Measurements taken, civil checks, client requirements..."
              value={visitOutcomeNotes}
              onChange={(e) => setVisitOutcomeNotes(e.target.value)}
              className="w-full text-xs p-2 border border-walnut/20 rounded-md bg-white"
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" type="button" onClick={() => setCompletingSiteVisitId(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" isLoading={isCompletingSiteVisit} className="bg-emerald-600 text-white font-bold">
              Mark Completed
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lost Reason Modal */}
      <Modal isOpen={isLostModalOpen} onClose={() => setIsLostModalOpen(false)} title="Mark Lead as Lost" maxWidth="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Primary Lost Reason *</label>
            <select
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
              className="w-full text-xs p-2 border border-walnut/20 rounded-md bg-white"
            >
              <option value="BUDGET">Budget Issue</option>
              <option value="COMPETITOR">Client Chose Another Company</option>
              <option value="UNREACHABLE">No Response / Unreachable</option>
              <option value="PROJECT_CANCELLED">Project Cancelled by Client</option>
              <option value="OTHER">Other Reason</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Lost Details / Feedback</label>
            <textarea
              placeholder="Add client feedback or reason..."
              value={lossNotes}
              onChange={(e) => setLossNotes(e.target.value)}
              className="w-full text-xs p-2 border border-walnut/20 rounded-md bg-white"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => setIsLostModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStageChange("LOST", lossReason, lossNotes)}
              disabled={isChangingStatus}
              className="bg-rose-600 text-white border-rose-600 font-bold hover:bg-rose-700"
            >
              Confirm Lost
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Lead Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Lead Details" maxWidth="md">
        <form onSubmit={handleUpdateLead} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Customer Name"
              value={editForm.clientName}
              onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            <Input
              label="Location"
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Budget (₹)"
              type="number"
              value={editForm.budget}
              onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
            />
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Priority</label>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                className="w-full text-xs p-2 border border-walnut/20 rounded-md bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Requirement & Scope</label>
            <textarea
              value={editForm.requirement}
              onChange={(e) => setEditForm({ ...editForm, requirement: e.target.value })}
              className="w-full text-xs p-2 border border-walnut/20 rounded-md bg-white"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" isLoading={isUpdatingLead} className="bg-gold text-charcoal font-bold">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Lead Record" maxWidth="sm">
        <div className="space-y-3">
          <p className="text-xs text-charcoal">
            Are you sure you want to delete lead <strong className="text-rose-700">{lead?.referenceNo}</strong> ({lead?.clientName})?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="outline" onClick={handleDeleteLead} isLoading={isDeletingLead} className="bg-rose-600 text-white border-rose-600 font-bold hover:bg-rose-700">
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Material / Person Expense Modal */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={() => {
          fetchExpensesSummary();
          fetchLeadDetails();
          onUpdate();
        }}
        initialLeadId={lead?.id}
        initialLeadName={lead?.clientName}
        initialLeadRequirement={lead?.requirement}
      />

      {/* Expense Details Voucher Modal */}
      <ExpenseDetailsModal
        isOpen={isExpenseDetailsModalOpen}
        expenseId={selectedExpenseId}
        onClose={() => {
          setIsExpenseDetailsModalOpen(false);
          setSelectedExpenseId(null);
        }}
        onUpdate={() => {
          fetchExpensesSummary();
          fetchLeadDetails();
          onUpdate();
        }}
        onOpenProject={onOpenProject}
      />
    </div>
  );
};
