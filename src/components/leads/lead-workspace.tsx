"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { LeadFormModal } from "@/components/leads/lead-form-modal";
import { DeleteLeadModal } from "@/components/leads/delete-lead-modal";
import { AddExpenseModal } from "@/components/expenses/add-expense-modal";
import { ExpenseDetailsModal } from "@/components/expenses/expense-details-modal";
import { EntityAuditSection } from "@/components/audit/entity-audit-section";
import { ClockTimePicker } from "@/components/ui/clock-time-picker";

import {
  X,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Tag,
  Activity,
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
  Shield,
  Lock,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  Receipt,
  PieChart,
  Eye,
  Package,
  User,
  Layers,
  Globe,
  ArrowLeft,
  Printer,
  Calculator,
  CreditCard,
  ArrowRight,
  Link2,
  Boxes,
  Truck,
  ShoppingCart,
  PackageCheck,
  PhoneCall,
  PhoneOff,
  RotateCcw,
  Trophy,
} from "lucide-react";
import QuotationGeneratorStudio from "@/components/quotations/quotation-generator-studio";
import { QuotationType } from "@/components/quotations/types";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { LOSS_REASONS, FOLLOW_UP_TYPES } from "@/validators/lead.schema";
import { MaterialLeadPipelineTracker } from "@/components/material-leads/material-lead-pipeline-tracker";
import { PlaceMaterialOrderModal } from "@/components/material-leads/place-material-order-modal";
import { VendorResponseModal } from "@/components/material-leads/vendor-response-modal";
import { ContactStatusModal } from "@/components/material-leads/contact-status-modal";

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
  const router = useRouter();
  const toast = useToast();
  const step9Ref = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "timeline" | "followups" | "sitevisits" | "quotation" | "project" | "expenses" | "audit"
  >("overview");

  // Quotation Studio Inline State
  const [isQuotationStudioOpen, setIsQuotationStudioOpen] = useState(false);
  const [activeQuotationId, setActiveQuotationId] = useState<string | null>(null);
  const [quotationStudioType, setQuotationStudioType] = useState<QuotationType>("LEAD");
  const [isDeletingQuotation, setIsDeletingQuotation] = useState<string | null>(null);


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

  // Material Lead Pipeline Modals State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactModalInitialStatus, setContactModalInitialStatus] = useState<"CONTACTED" | "NOT_CONTACTED">("CONTACTED");
  const [isPlaceOrderModalOpen, setIsPlaceOrderModalOpen] = useState(false);
  const [isVendorResponseModalOpen, setIsVendorResponseModalOpen] = useState(false);
  const [vendorResponseMode, setVendorResponseMode] = useState<"ACCEPTED" | "REJECTED" | "NEW_VENDOR">("ACCEPTED");

  // Confirmation Fee and Payment Invoice State
  const [confirmationFeeAmount, setConfirmationFeeAmount] = useState("");
  const [confirmationFeeType, setConfirmationFeeType] = useState("UPI");
  const [confirmationFeeRef, setConfirmationFeeRef] = useState("");
  const [confirmationFeeInvoiceNo, setConfirmationFeeInvoiceNo] = useState("");
  const [confirmationFeeDate, setConfirmationFeeDate] = useState(new Date().toISOString().split("T")[0]);
  const [confirmationFeeHandoverDate, setConfirmationFeeHandoverDate] = useState("");
  const [confirmationFeeNotes, setConfirmationFeeNotes] = useState("");
  const [isFeePaid, setIsFeePaid] = useState(false);
  const [isRecordingFee, setIsRecordingFee] = useState(false);
  const [generatedInvoiceRef, setGeneratedInvoiceRef] = useState<string | null>(null);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<string | null>(null);
  const [whatsAppSentStates, setWhatsAppSentStates] = useState<Record<string, boolean>>({});

  // Quotation attachment & link state for Confirmation Fee & Payments
  const [attachedQuotationId, setAttachedQuotationId] = useState<string | null>(null);
  const [isManualQuoteInputOpen, setIsManualQuoteInputOpen] = useState(false);

  const handleRecordConfirmationFeePayment = async () => {
    const fee = parseFloat(confirmationFeeAmount);
    if (!fee || fee <= 0) {
      toast.error("Invalid Amount", "Please enter a valid payment amount.");
      return;
    }

    const allQuotes = lead?.quotations || [];
    const targetQuote =
      (attachedQuotationId ? allQuotes.find((q: any) => q.id === attachedQuotationId) : null) ||
      allQuotes.find((q: any) => q.status === "APPROVED" || q.status === "ACCEPTED") ||
      allQuotes.find((q: any) => q.status === "SENT" || q.status === "REVIEW") ||
      (allQuotes.length > 0 ? allQuotes[0] : null);

    const invNumberToAttach = confirmationFeeInvoiceNo.trim() || undefined;

    setIsRecordingFee(true);
    try {
      let pRef = `PAY-${Date.now().toString().slice(-4)}`;
      let invRef = invNumberToAttach || `INV-${new Date().getFullYear()}-0001`;
      let invId: string | undefined = targetQuote?.id;

      if (targetQuote?.id) {
        // Record payment & generate official GST invoice through backend service
        const res = await fetch("/api/v1/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quotationId: targetQuote.id,
            paymentType: confirmationFeeNotes.trim() || "Booking Confirmation Fee",
            amountPaid: fee,
            paymentDate: confirmationFeeDate || new Date().toISOString(),
            paymentMode: confirmationFeeType,
            invoiceNo: invNumberToAttach,
            transactionReference: confirmationFeeRef.trim() || undefined,
            paymentNotes: confirmationFeeNotes.trim() || `Booking confirmation payment for ${lead?.clientName || "Lead"}`,
            handoverDate: confirmationFeeHandoverDate || undefined,
          })
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to record payment and create invoice");
        }

        pRef = json.data?.payment?.referenceNo || pRef;
        invRef = json.data?.invoice?.invoiceNo || invRef;
        invId = json.data?.invoice?.id || targetQuote.id;
      } else {
        // Fallback for leads without an existing quotation
        const res = await fetch("/api/v1/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: leadId || undefined,
            clientId: lead?.clientId || undefined,
            amount: fee,
            paymentDate: confirmationFeeDate || new Date().toISOString().split("T")[0],
            paymentMethod: confirmationFeeType,
            paymentType: confirmationFeeType,
            transactionReference: confirmationFeeRef.trim() || undefined,
            handoverDate: confirmationFeeHandoverDate || undefined,
            notes: `[Invoice: ${invNumberToAttach}] ${confirmationFeeNotes.trim() || `Booking confirmation payment for ${lead?.clientName || "Lead"}`}`
          })
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to record payment");
        }

        pRef = json.data?.referenceNo || pRef;
      }

      setIsFeePaid(true);
      setGeneratedInvoiceRef(invRef);
      setGeneratedInvoiceId(invId || null);
      setConfirmationFeeAmount("");
      setConfirmationFeeRef("");
      setConfirmationFeeNotes("");
      setConfirmationFeeInvoiceNo("");
      setConfirmationFeeHandoverDate("");

      toast.success(
        "Payment Recorded & Invoice Generated",
        `Payment of ${formatCurrency(fee)} confirmed (${pRef}). Generated Invoice ${invRef}.`
      );

      if (invId && invId.length > 10) {
        window.open(`/api/v1/invoices/${invId}/pdf`, '_blank');
      }

      // Ensure stage is advanced to WON on the backend
      if (leadId && lead?.stage !== "WON" && lead?.stage !== "PROJECT_CREATED") {
        await fetch(`/api/v1/leads/${leadId}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "WON" }),
        }).catch(() => {});
      }

      await fetchLeadDetails();
      onUpdate();
    } catch (err: any) {
      toast.error("Payment Failed", err.message || "Failed to record payment");
    } finally {
      setIsRecordingFee(false);
    }
  };

  const [isDeletingPaymentId, setIsDeletingPaymentId] = useState<string | null>(null);

  const handleDeleteRecordedPayment = async (paymentId: string, invoiceId?: string, paymentRef?: string) => {
    if (!confirm(`Are you sure you want to delete this payment (${paymentRef || 'Payment'})? The recorded payment and attached invoice will be deleted, and the quotation deal balance will be restored.`)) {
      return;
    }

    setIsDeletingPaymentId(paymentId);
    try {
      // 1. Delete payment record (which also cleans up the linked GST invoice)
      const res = await fetch(`/api/v1/payments/${paymentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Payment deleted by user from Lead Workspace" })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        // Fallback: If invoice exists, also attempt deleting/voiding invoice directly
        if (invoiceId) {
          await fetch(`/api/v1/invoices/${invoiceId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: "Invoice deleted from Lead Workspace" })
          });
        } else {
          throw new Error(json.error?.message || "Failed to delete payment");
        }
      }

      toast.success("Payment & Invoice Deleted", "Payment record removed and quotation deal balance restored.");
      setIsFeePaid(false);
      setGeneratedInvoiceRef(null);
      setGeneratedInvoiceId(null);
      await fetchLeadDetails();
      onUpdate();
    } catch (err: any) {
      toast.error("Delete Failed", err.message || "Could not delete payment record");
    } finally {
      setIsDeletingPaymentId(null);
    }
  };

  // Edit Lead state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
      if (json.data.lead?.payments && json.data.lead.payments.length > 0) {
        const lastPay = json.data.lead.payments[0];
        setConfirmationFeeAmount(String(lastPay.amount));
        setConfirmationFeeType(lastPay.paymentMethod || lastPay.paymentType || "UPI");
        setConfirmationFeeRef(lastPay.transactionReference || lastPay.referenceNo || "");
        setIsFeePaid(true);
      }
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

  const handleDeleteQuotation = async (quotationId: string, quoteRef?: string) => {
    const confirmMsg = quoteRef
      ? `Are you sure you want to delete quotation ${quoteRef}? This action cannot be undone.`
      : "Are you sure you want to delete this quotation?";
    if (!confirm(confirmMsg)) return;

    setIsDeletingQuotation(quotationId);
    setError("");
    try {
      const res = await fetch(`/api/v1/quotations/${quotationId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const msg = json?.error?.message || "Could not delete quotation";
        setError(msg);
        toast.error("Failed to delete quotation", msg);
        return;
      }

      setSuccessMsg(`Quotation ${quoteRef || ""} deleted successfully`);
      toast.success("Quotation Deleted", `Quotation ${quoteRef || ""} has been removed.`);
      await fetchLeadDetails();
      onUpdate();
    } catch (err: any) {
      const msg = err?.message || "Failed to delete quotation";
      setError(msg);
      toast.error("Network Error", msg);
    } finally {
      setIsDeletingQuotation(null);
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

  const isMaterialLead = Boolean(
    lead?.leadType === "MATERIAL" ||
    lead?.propertyTypeKey === "MATERIAL" ||
    lead?.propertyType === "MATERIAL" ||
    lead?.referenceNo?.startsWith("MAT-LEAD") ||
    lead?.source === "MATERIAL_CATALOG" ||
    (typeof lead?.requirement === "string" && lead?.requirement?.toLowerCase()?.includes("material"))
  );

  // Auto-scroll timeline to Step 9 when Won or Project Created
  useEffect(() => {
    if (activeTab === "timeline" && (lead?.stage === "WON" || lead?.stage === "PROJECT_CREATED" || lead?.project)) {
      const timer = setTimeout(() => {
        step9Ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activeTab, lead?.stage, lead?.project]);

  const STAGE_ORDER_MAP: Record<string, number> = {
    NEW: 0,
    NOT_CONTACTED: 0,
    CONTACTED: 1,
    FOLLOW_UP_SCHEDULED: 2,
    SITE_VISIT_SCHEDULED: 3,
    SITE_VISIT_COMPLETED: 4,
    QUOTATION_IN_PROGRESS: 5,
    QUOTATION_SENT: 6,
    ESTIMATE_SENT: 6,
    NEGOTIATION: 7,
    WON: 8,
    PROJECT_CREATED: 8,
  };

  // Stage / Status Transition Handler
  const handleStageChange = async (
    newStage: string,
    customLossReason?: string,
    customNotes?: string,
    adminPassword?: string
  ) => {
    if (!leadId) return;

    setIsChangingStatus(true);
    setError("");

    // Optimistically update stage so Step 8 turns completed and Step 9 unlocks instantly
    setData((prev: any) => prev ? { ...prev, lead: { ...prev.lead, stage: newStage } } : prev);

    try {
      const res = await fetch(`/api/v1/leads/${leadId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStage,
          lossReason: newStage === "LOST" ? customLossReason || lossReason : undefined,
          notes: customNotes || undefined,
          adminPassword: adminPassword || undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        const errMsg = json.error?.message || "Failed to change lead status";
        setError(errMsg);
        return;
      }

      setSuccessMsg(`Status updated to ${newStage.replace(/_/g, " ")}`);
      toast.success("Lead Status Updated", `Stage changed to ${newStage.replace(/_/g, " ")}`);
      setIsLostModalOpen(false);
      await fetchLeadDetails();
      onUpdate();
      if (newStage === "WON" || newStage === "PROJECT_CREATED") {
        setTimeout(() => {
          step9Ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 250);
      }
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

  const handleSkipFollowUp = async (followUpId: string) => {
    if (!leadId) return;
    const reason = prompt("Reason for skipping follow-up (optional):", "Follow-up skipped by user / direct stage progression");
    if (reason === null) return; // User pressed Cancel in prompt

    try {
      const res = await fetch(`/api/v1/leads/${leadId}/follow-ups/${followUpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "skip", reason: reason || "Follow-up skipped by user" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Failed to skip follow-up", json.error?.message || "Could not skip follow-up");
        return;
      }

      toast.success("Follow-up Skipped", "Follow-up status marked as skipped.");
      await fetchLeadDetails();
      onUpdate();
    } catch {
      toast.error("Network Error", "Could not skip follow-up");
    }
  };

  const handleSkipFollowUpStage = async () => {
    if (!leadId) return;
    if (!confirm("Are you sure you want to skip the Follow-up stage and proceed to Site Visit Scheduled?")) return;

    try {
      // Advance stage to SITE_VISIT_SCHEDULED with note
      await handleStageChange("SITE_VISIT_SCHEDULED", "Follow-up step skipped by user — moving directly to site visit");

      // Mark any pending follow-ups as skipped
      const pendingFollowUps = lead?.followUps?.filter((f: any) => f.status === "PENDING") || [];
      for (const f of pendingFollowUps) {
        await fetch(`/api/v1/leads/${leadId}/follow-ups/${f.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "skip", reason: "Follow-up stage bypassed" }),
        });
      }

      toast.success("Follow-up Step Skipped", "Advanced lead directly to Site Visit stage.");
      await fetchLeadDetails();
      onUpdate();
    } catch {
      toast.error("Network Error", "Could not skip follow-up stage");
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
    if (!visitOutcomeNotes.trim()) {
      toast.error("Mandatory Field Required", "Site measurement & assessment notes are mandatory to complete the visit.");
      return;
    }
    if (!leadId) return;
    setIsCompletingSiteVisit(true);
    setError("");

    try {
      if (completingSiteVisitId && completingSiteVisitId !== "DIRECT") {
        const res = await fetch(`/api/v1/leads/${leadId}/site-visits/${completingSiteVisitId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outcomeNotes: visitOutcomeNotes.trim() }),
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error?.message || "Failed to complete site visit");
          return;
        }
      } else {
        // Direct site visit completion: check if any pending scheduled visit exists
        const pendingVisit = lead?.siteVisits?.find((v: any) => v.status === "SCHEDULED");
        if (pendingVisit) {
          const res = await fetch(`/api/v1/leads/${leadId}/site-visits/${pendingVisit.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ outcomeNotes: visitOutcomeNotes.trim() }),
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            setError(json.error?.message || "Failed to complete site visit");
            return;
          }
        } else {
          // Schedule and immediately complete site visit with mandatory notes
          const createRes = await fetch(`/api/v1/leads/${leadId}/site-visits`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              visitDate: new Date().toISOString(),
              location: lead?.location || "Client Site",
              notes: "On-site visit completed",
            }),
          });
          const createJson = await createRes.json();
          if (createJson.success && createJson.data?.id) {
            await fetch(`/api/v1/leads/${leadId}/site-visits/${createJson.data.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ outcomeNotes: visitOutcomeNotes.trim() }),
            });
          } else {
            // Fallback status change with mandatory notes
            await handleStageChange("SITE_VISIT_COMPLETED", undefined, visitOutcomeNotes.trim());
          }
        }
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
      const json = await res.json().catch(() => null);

      if (!res.ok || !json || !json.success) {
        const errMsg = json?.error?.message || `Lead conversion failed (HTTP ${res.status})`;
        setError(errMsg);
        toast.error("Conversion Failed", errMsg);
        return;
      }

      setSuccessMsg("Project created successfully!");
      toast.success("Lead Converted to Project", `Active execution project ${json.data?.project?.referenceNo || ""} generated successfully.`);
      await fetchLeadDetails();
      onUpdate();
      setTimeout(() => {
        step9Ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 250);
    } catch (err: any) {
      const errMsg = err?.message || "Network error during project conversion";
      setError(errMsg);
      toast.error("Conversion Error", errMsg);
    } finally {
      setIsConverting(false);
    }
  };

  // Edit Lead Modal Handler
  const openEditModal = () => {
    setIsEditModalOpen(true);
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

  const handleCompleteQuotationAndLink = async () => {
    try {
      setIsQuotationStudioOpen(false);
      setActiveQuotationId(null);
      await fetchLeadDetails();

      // Automatically advance pipeline to step 7 (QUOTATION_SENT)
      if (
        lead?.stage === "QUOTATION_IN_PROGRESS" ||
        lead?.stage === "SITE_VISIT_COMPLETED" ||
        lead?.stage === "CONTACTED" ||
        lead?.stage === "NEW" ||
        lead?.stage === "NOT_CONTACTED" ||
        lead?.stage === "FOLLOW_UP_SCHEDULED" ||
        lead?.stage === "SITE_VISIT_SCHEDULED"
      ) {
        await handleStageChange("QUOTATION_SENT");
      }

      onUpdate();
      setActiveTab("timeline");
      toast.success(
        "Quotation Completed & Linked",
        `Quotation generated, attached to ${lead?.clientName || "Lead"}, and advanced to Step 7 (Quotation Sent).`
      );
    } catch (err: any) {
      console.error("Error completing quotation:", err);
    }
  };

  if (!isOpen) return null;

  // Soft Pastel Stage Badges matching Luxury Architectural Reference Design
  const getStageBadge = (stage?: string) => {
    switch (stage) {
      case "NEW":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F4F7F4] text-[#2D5A3F] border border-[#D5E5D8]">● NEW</span>;
      case "CONTACTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F2F6FA] text-[#2C5282] border border-[#D0DFEF]">● CONTACTED</span>;
      case "NOT_CONTACTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF6F0] text-[#8C5D23] border border-[#EADBCA]">● NOT CONTACTED</span>;
      case "FOLLOW_UP_SCHEDULED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F3F4F6] text-[#4A5568] border border-[#E2E8F0]">● FOLLOW-UP</span>;
      case "SITE_VISIT_SCHEDULED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF5FF] text-[#6B46C1] border border-[#E9D8FD]">● VISIT SCHEDULED</span>;
      case "SITE_VISIT_COMPLETED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">● VISIT COMPLETED</span>;
      case "QUOTATION_IN_PROGRESS":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">● QUOTATION IN PROGRESS</span>;
      case "QUOTATION_SENT":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">● QUOTATION SENT</span>;
      case "NEGOTIATION":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE]">● NEGOTIATION</span>;
      case "WON":
      case "PROJECT_CREATED":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0FDF4] text-[#166534] border border-[#86EFAC]">● WON</span>;
      case "LOST":
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">● LOST</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F8F7F4] text-[#55524C] border border-[#E6E2D8]">● {stage}</span>;
    }
  };

  const getSourceBadge = (source?: string) => {
    const s = (source || "WEBSITE").toUpperCase();
    if (s.includes("WEBSITE")) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F8F6] text-[#285A43] border border-[#D6E6DC] tracking-wider uppercase">
          WEBSITE
        </span>
      );
    }
    if (s.includes("INSTAGRAM")) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF3F5] text-[#8C3A5A] border border-[#ECD1DC] tracking-wider uppercase">
          INSTAGRAM
        </span>
      );
    }
    if (s.includes("WHATSAPP")) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F2F8F5] text-[#23684B] border border-[#CEE5DA] tracking-wider uppercase">
          WHATSAPP
        </span>
      );
    }
    if (s.includes("REFERRAL")) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F7F4F9] text-[#684382] border border-[#E4D8ED] tracking-wider uppercase">
          REFERRAL
        </span>
      );
    }
    if (s.includes("WALK") || s.includes("VISIT")) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F2F5F8] text-[#345275] border border-[#D2DFED] tracking-wider uppercase">
          WALK-IN
        </span>
      );
    }
    if (s.includes("PHONE") || s.includes("CALL")) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F8F5F0] text-[#7A5B2E] border border-[#E7DDCE] tracking-wider uppercase">
          PHONE CALL
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F3EF] text-[#55514B] border border-[#E3DFD7] tracking-wider uppercase">
        {(source || "MANUAL").replace(/^OTHER:/i, "").toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (p?: string) => {
    switch (p) {
      case "URGENT":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] uppercase">URGENT</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] uppercase">HIGH</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F0F9FF] text-[#0369A1] border border-[#BAE6FD] uppercase">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F8F7F4] text-[#645F56] border border-[#E6E2D8] uppercase">LOW</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end select-none">
      {/* Subtle Darkened Overlay - Keeps Left 40% of Background Table Visible */}
      <div
        className="fixed inset-0 bg-[#242321]/35 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Large Desktop Side Drawer Panel (Takes ~55% to 60% Width normally, expands to ~92% when Studio is open) */}
      <div className={`relative w-full ${isQuotationStudioOpen ? "sm:w-[98vw] md:w-[95vw] lg:w-[92vw] max-w-[1700px]" : "sm:w-[85vw] md:w-[68vw] lg:w-[58vw] max-w-6xl"} bg-[#FAF8F5] shadow-2xl border-l border-[#EAE5DD] z-50 flex flex-col h-full min-h-0 animate-in slide-in-from-right duration-250 ease-out transition-all`}>
        
        {/* ========================================================= */}
        {/* 1. LEAD DETAILS PANEL HEADER (Section 10)                 */}
        {/* ========================================================= */}
        <div className="px-7 py-5 border-b border-[#EAE5DD] bg-[#FAF8F5] shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              {/* Row 1: Customer Name + Prominent Lead ID + Source Badge */}
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-[#242321] tracking-tight">
                  {lead?.clientName || "Lead Details"}
                </h2>
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 bg-[#FFFEFC] text-[#55524C] rounded-md border border-[#EAE5DD] shadow-2xs">
                  {lead?.referenceNo || "LEAD-..."}
                </span>
                {getSourceBadge(lead?.sourceKey)}
                {getPriorityBadge(lead?.priority)}
                {getStageBadge(lead?.stage)}
              </div>

              {/* Row 2: Direct Contact Icons & Coordinates */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#77736C]">
                <a
                  href={`tel:${lead?.phone}`}
                  className="flex items-center gap-1.5 font-mono font-medium text-[#242321] hover:text-[#B99558] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#9E988F]" /> {lead?.phone}
                </a>
                {lead?.email && (
                  <a
                    href={`mailto:${lead?.email}`}
                    className="flex items-center gap-1.5 hover:text-[#242321] transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#9E988F]" /> {lead?.email}
                  </a>
                )}
                {lead?.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#9E988F]" /> {lead?.location}
                  </span>
                )}
                {lead?.clientId && (
                  <Link
                    href={`/clients?id=${lead.clientId}`}
                    className="flex items-center gap-1 text-[#B99558] hover:text-[#9A7B44] font-medium transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Client 360 Profile ↗
                  </Link>
                )}
              </div>
            </div>

            {/* Top-Right Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#77736C] hover:text-[#242321] hover:bg-[#EAE5DD]/60 transition-colors cursor-pointer"
              title="Close panel (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ========================================================= */}
          {/* 2. LEAD ACTION BAR                                        */}
          {/* ========================================================= */}
          <div className="mt-4 pt-3.5 border-t border-[#EAE5DD] flex flex-wrap items-center justify-between gap-3">
            {/* Pipeline Stage Quick Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#8C867E] uppercase tracking-wider">Pipeline Stage:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStatus(val);
                  if (val === "LOST") {
                    setIsLostModalOpen(true);
                  } else if (val === "SITE_VISIT_COMPLETED") {
                    const pendingVisit = lead?.siteVisits?.find((v: any) => v.status === "SCHEDULED");
                    setCompletingSiteVisitId(pendingVisit?.id || "DIRECT");
                  } else {
                    handleStageChange(val);
                  }
                }}
                disabled={isChangingStatus}
                className="text-xs font-semibold bg-[#FFFEFC] text-[#242321] border border-[#EAE5DD] rounded-lg px-3 py-1.5 shadow-2xs focus:ring-1 focus:ring-[#B99558] focus:border-[#B99558] outline-hidden cursor-pointer"
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
                className="text-xs py-1 h-7.5 bg-[#FFFEFC] border-[#EAE5DD] text-[#242321] hover:bg-[#F5F2EC] hover:border-[#DCD5C9] shadow-2xs font-medium"
              >
                Contacted
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStageChange("NOT_CONTACTED")}
                className="text-xs py-1 h-7.5 bg-[#FFFEFC] border-[#EAE5DD] text-[#242321] hover:bg-[#F5F2EC] hover:border-[#DCD5C9] shadow-2xs font-medium"
              >
                Non Contacted
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openEditModal}
                className="text-xs py-1 h-7.5 bg-[#FFFEFC] border-[#EAE5DD] text-[#242321] hover:bg-[#F5F2EC] hover:border-[#DCD5C9] shadow-2xs font-medium"
              >
                <Edit2 className="w-3 h-3 mr-1 text-[#8C867E]" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSiteVisitModalOpen(true)}
                className="text-xs py-1 h-7.5 bg-[#FFFEFC] border-[#EAE5DD] text-[#242321] hover:bg-[#F5F2EC] hover:border-[#DCD5C9] shadow-2xs font-medium"
              >
                <Compass className="w-3 h-3 mr-1 text-[#8C867E]" /> Site Visit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFollowUpModalOpen(true)}
                className="text-xs py-1 h-7.5 bg-[#FFFEFC] border-[#EAE5DD] text-[#242321] hover:bg-[#F5F2EC] hover:border-[#DCD5C9] shadow-2xs font-medium"
              >
                <Clock className="w-3 h-3 mr-1 text-[#8C867E]" /> Follow-up
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpenseModalOpen(true)}
                className="text-xs py-1 h-7.5 bg-[#FFFEFC] border-[#EAE5DD] text-[#242321] hover:bg-[#F5F2EC] hover:border-[#DCD5C9] shadow-2xs font-medium"
              >
                <Plus className="w-3 h-3 mr-1 text-[#8C867E]" /> Expense
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActiveTab("quotation");
                  setIsQuotationStudioOpen(false);
                  setActiveQuotationId(null);
                }}
                className="text-xs py-1 h-7.5 bg-[#242321] text-[#FAF8F5] hover:bg-[#383633] border border-[#242321] font-semibold shadow-2xs"
              >
                <FileText className="w-3 h-3 mr-1.5" /> Quotations
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-xs py-1 h-7.5 text-[#991B1B] bg-[#FFFEFC] border-[#EAE5DD] hover:bg-[#FEF2F2] hover:border-[#FECACA] shadow-2xs"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. LEAD DETAILS TABS                                      */}
        {/* ========================================================= */}
        <div className="flex border-b border-[#EAE5DD] px-7 bg-[#FAF8F5] overflow-x-auto shrink-0 scrollbar-none gap-6">
          {[
            { id: "overview", label: "Overview & Details" },
            { id: "timeline", label: `Timeline & Pipeline (${timeline.length})` },
            { id: "followups", label: `Follow-ups (${lead?.followUps?.length || 0})` },
            { id: "sitevisits", label: `Site Visits (${lead?.siteVisits?.length || 0})` },
            { id: "quotation", label: `Quotations (${lead?.quotations?.length || 0})` },
            { id: "project", label: lead?.project ? `Project (${lead.project.referenceNo})` : "Project & Client" },
            { id: "expenses", label: `Expenses (${expensesSummary?.expenseCount || 0})` },
            { id: "audit", label: "Audit Trail" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === "quotation") {
                    setIsQuotationStudioOpen(false);
                    setActiveQuotationId(null);
                  }
                }}
                className={`py-3 px-1 text-xs font-medium whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? "border-[#B99558] text-[#242321] font-bold"
                    : "border-transparent text-[#77736C] hover:text-[#242321] hover:border-[#DCD5C9]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="mx-7 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {successMsg && (
          <div className="mx-7 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-semibold flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. INDEPENDENTLY SCROLLABLE DRAWER CONTENT               */}
        {/* ========================================================= */}
        <div className="flex-1 min-h-0 overflow-y-auto p-7 space-y-5 scroll-smooth bg-[#FAF8F5]">
          {isLoading ? (
            <div className="p-12 text-center text-[#77736C]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B99558]" />
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
                    <div className="bg-[#FFFEFC] p-5.5 rounded-xl border border-[#EAE5DD] shadow-2xs space-y-4 hover:border-[#DCD5C9] transition-all">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[#242321] uppercase tracking-wider flex items-center gap-2">
                          <User className="w-4 h-4 text-[#B99558]" /> Section A — Customer Information
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openEditModal}
                          className="h-6.5 px-2.5 text-[11px] font-medium text-[#77736C] bg-[#FAF8F5] border border-[#EAE5DD] hover:text-[#242321] hover:bg-[#F2ECE2] rounded-md transition-colors"
                        >
                          <Edit2 className="w-3 h-3 mr-1 text-[#8C867E]" /> Edit Details
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-[11px] text-[#8C867E] font-medium tracking-wide">Customer Full Name</div>
                          <div className="text-sm font-bold text-[#242321] mt-0.5">{lead?.clientName || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#8C867E] font-medium tracking-wide">Phone Number</div>
                          <a
                            href={`tel:${lead?.phone}`}
                            className="font-mono font-bold text-[#242321] mt-0.5 block hover:text-[#B99558] transition-colors"
                          >
                            {lead?.phone || "N/A"}
                          </a>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#8C867E] font-medium tracking-wide">Email Address</div>
                          {lead?.email ? (
                            <a
                              href={`mailto:${lead?.email}`}
                              className="font-medium text-[#242321] mt-0.5 block hover:text-[#B99558] transition-colors truncate"
                            >
                              {lead?.email}
                            </a>
                          ) : (
                            <span className="text-[#A09A90] italic mt-0.5 block">None provided</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CARD B — REQUIREMENT INFORMATION */}
                    <div className="bg-[#FFFEFC] p-5.5 rounded-xl border border-[#EAE5DD] shadow-2xs space-y-4 hover:border-[#DCD5C9] transition-all">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[#242321] uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#B99558]" /> Section B — Requirement Information
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openEditModal}
                          className="h-6.5 px-2.5 text-[11px] font-medium text-[#77736C] bg-[#FAF8F5] border border-[#EAE5DD] hover:text-[#242321] hover:bg-[#F2ECE2] rounded-md transition-colors"
                        >
                          <Edit2 className="w-3 h-3 mr-1 text-[#8C867E]" /> Edit Requirement
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-[11px] text-[#8C867E] font-medium tracking-wide">Requirement Type</div>
                          <div className="text-xs font-semibold text-[#242321] mt-0.5">
                            {web?.requirementType || lead?.requirement || "Turnkey Interiors"}
                          </div>
                          {web?.customRequirement && (
                            <span className="text-[10px] text-[#8C867E] block mt-0.5 font-medium">
                              Custom: {web.customRequirement}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-[11px] text-[#8C867E] font-medium tracking-wide">Customer Stage</div>
                          <div className="text-xs font-semibold text-[#2D5A3F] mt-0.5">
                            {web?.customerStage || "Ready To Start"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#8C867E] font-medium tracking-wide">Budget Target</div>
                          <div className="text-xs font-bold text-[#242321] font-mono mt-0.5">
                            {lead?.estimatedBudget ? formatCurrency(lead.estimatedBudget) : "TBD / Consultation"}
                          </div>
                        </div>
                      </div>

                      {/* Specific Requirements Detail Text */}
                      {(web?.specificRequirements || lead?.notes) && (
                        <div className="pt-3 border-t border-[#EAE5DD]">
                          <span className="text-[11px] text-[#8C867E] font-medium block mb-1.5">
                            Specific Requirements & Design Preferences:
                          </span>
                          <div className="p-3.5 bg-[#FAF8F5] rounded-lg border border-[#EAE5DD] text-xs text-[#242321] leading-relaxed whitespace-pre-wrap">
                            {web?.specificRequirements || lead?.notes}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CARD C — PROPERTY INFORMATION */}
                    <div className="bg-[#FFFEFC] p-5.5 rounded-xl border border-[#EAE5DD] shadow-2xs space-y-4 hover:border-[#DCD5C9] transition-all">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[#242321] uppercase tracking-wider flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#B99558]" /> Section C — Property Information
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openEditModal}
                          className="h-6.5 px-2.5 text-[11px] font-medium text-[#77736C] bg-[#FAF8F5] border border-[#EAE5DD] hover:text-[#242321] hover:bg-[#F2ECE2] rounded-md transition-colors"
                        >
                          <Edit2 className="w-3 h-3 mr-1 text-[#8C867E]" /> Edit Property
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-[11px] text-[#8C867E] font-medium tracking-wide">Property Type</div>
                          <div className="text-xs font-semibold text-[#242321] mt-0.5">
                            {web?.customPropertyType || web?.propertyType || lead?.propertyTypeKey || "Apartment"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#8C867E] font-medium tracking-wide">Project Location</div>
                          <div className="text-xs font-semibold text-[#242321] mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#9E988F]" />
                            {lead?.location || web?.projectLocation || "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#8C867E] font-medium tracking-wide">Property Size</div>
                          <div className="text-xs font-semibold text-[#242321] mt-0.5">
                            {web?.propertySize || "Not Specified"}
                          </div>
                        </div>
                      </div>

                      {/* Selected Spaces Badges */}
                      <div className="pt-3 border-t border-[#EAE5DD] space-y-2">
                        <span className="text-[11px] text-[#8C867E] font-medium block">Selected Spaces Scope:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {spacesList.map((sp: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#F5F2EC] text-[#3D3A36] border border-[#E5E0D6] shadow-2xs"
                            >
                              ✓ {sp}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* CARD D — LEAD MANAGEMENT INFORMATION */}
                    <div className="bg-[#FFFEFC] p-5.5 rounded-xl border border-[#EAE5DD] shadow-2xs space-y-4 hover:border-[#DCD5C9] transition-all">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[#242321] uppercase tracking-wider flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#B99558]" /> Section D — Lead Management Information
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openEditModal}
                          className="h-6.5 px-2.5 text-[11px] font-medium text-[#77736C] bg-[#FAF8F5] border border-[#EAE5DD] hover:text-[#242321] hover:bg-[#F2ECE2] rounded-md transition-colors"
                        >
                          <Edit2 className="w-3 h-3 mr-1 text-[#8C867E]" /> Edit Assignment
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-[11px] text-[#8C867E] font-medium tracking-wide">Lead ID</div>
                          <div className="font-mono font-semibold text-[#242321] text-xs mt-0.5">{lead?.referenceNo}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#8C867E] font-medium tracking-wide">Lead Source</div>
                          <div className="mt-0.5">{getSourceBadge(lead?.sourceKey)}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#8C867E] font-medium tracking-wide">Created Date & Time</div>
                          <div className="font-mono text-xs text-[#242321] mt-0.5">
                            {formatDate(lead?.createdAt)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-[#8C867E] font-medium tracking-wide">Assigned Staff</div>
                          <div className="text-xs font-semibold text-[#242321] mt-0.5">
                            {lead?.assignedTo?.fullName || "Unassigned"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CARD E — ORIGINAL WEBSITE ENQUIRY DATA (Section 13) */}
                    {web && (
                      <div className="bg-[#FAF8F5] p-5.5 rounded-xl border border-[#EAE5DD] space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-[#242321] uppercase tracking-wider flex items-center gap-2">
                            <Globe className="w-4 h-4 text-[#B99558]" /> Section E — Original Inbound Website Form Data
                          </h3>
                          <span className="text-[10px] font-mono font-semibold text-[#77736C] bg-[#FFFEFC] px-2.5 py-0.5 rounded border border-[#EAE5DD]">
                            Permanent Record
                          </span>
                        </div>
                        <p className="text-[11px] text-[#77736C]">
                          Original multi-step questionnaire responses captured at the moment of website submission.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#FFFEFC] p-4 rounded-lg border border-[#EAE5DD]">
                          <div>
                            <span className="text-[10px] text-[#8C867E] uppercase tracking-wider block font-medium">Step 1 — Requirement</span>
                            <span className="font-semibold text-[#242321]">{web.customRequirement || web.requirementType}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#8C867E] uppercase tracking-wider block font-medium">Step 2 — Property Type</span>
                            <span className="font-semibold text-[#242321]">{web.customPropertyType || web.propertyType}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#8C867E] uppercase tracking-wider block font-medium">Step 2 — Location & Size</span>
                            <span className="font-semibold text-[#242321]">{web.projectLocation} {web.propertySize ? `(${web.propertySize})` : ""}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#8C867E] uppercase tracking-wider block font-medium">Step 3 — Customer Stage</span>
                            <span className="font-semibold text-[#2D5A3F]">{web.customerStage}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[10px] text-[#8C867E] uppercase tracking-wider block font-medium">Step 4 — Inbound Visitor</span>
                            <span className="font-semibold text-[#242321]">{lead?.clientName} ({lead?.phone} • {lead?.email || "No Email"})</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CARD F — INTERNAL NOTES & COMPOSER */}
                    <div className="bg-[#FFFEFC] p-5.5 rounded-xl border border-[#EAE5DD] shadow-2xs space-y-3 hover:border-[#DCD5C9] transition-all">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[#242321] uppercase tracking-wider flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#B99558]" /> Internal CRM Notes
                        </h3>
                        <button
                          onClick={() => setActiveNoteStage("GENERAL")}
                          className="text-xs font-semibold text-[#B99558] hover:text-[#9A7B44] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Note
                        </button>
                      </div>

                      {/* Inline Note Composer */}
                      {activeNoteStage === "GENERAL" && (
                        <div className="p-3.5 bg-[#FAF8F5] border border-[#B99558]/40 rounded-lg space-y-2.5">
                          <textarea
                            placeholder="Write a private staff note or client update..."
                            value={inlineNoteText}
                            onChange={(e) => setInlineNoteText(e.target.value)}
                            className="w-full text-xs p-2.5 bg-[#FFFEFC] border border-[#EAE5DD] rounded-lg focus:ring-1 focus:ring-[#B99558] focus:border-[#B99558] outline-hidden"
                            rows={2}
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setActiveNoteStage(null)} className="text-xs py-1 h-7.5 bg-[#FFFEFC] border-[#EAE5DD]">
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleAddInlineNote("GENERAL")}
                              disabled={isSubmittingNote || !inlineNoteText.trim()}
                              className="text-xs py-1 h-7.5 bg-[#242321] text-[#FAF8F5] hover:bg-[#383633] font-semibold"
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

              {/* TAB 2: TIMELINE & PIPELINE */}
              {activeTab === "timeline" && (() => {
                // Specialized 9-Stage Pipeline for Material Leads (Project Pipeline Format)
                if (isMaterialLead) {
                  const CANONICAL_MATERIAL_STAGES = [
                    {
                      order: 1,
                      key: "NEW",
                      title: "Lead Created",
                      progressWeightPct: 10,
                      description: "Initial booking and material supply enquiry registered",
                      icon: Clock,
                    },
                    {
                      order: 2,
                      key: "CONTACTED",
                      title: "Customer Contacted",
                      progressWeightPct: 10,
                      description: "Outreach verification and requirements qualification",
                      icon: PhoneCall,
                    },
                    {
                      order: 3,
                      key: "MATERIAL_REQUIRED",
                      title: "Materials Required",
                      progressWeightPct: 10,
                      description: "Material specifications, categories, quantities & units",
                      icon: Boxes,
                    },
                    {
                      order: 4,
                      key: "QUOTATION_GENERATED",
                      title: "Quotation Generated",
                      progressWeightPct: 10,
                      description: "Material Quotation Studio, GST taxes & itemized pricing",
                      icon: FileText,
                    },
                    {
                      order: 5,
                      key: "QUOTATION_SENT",
                      title: "Quotation Sent",
                      progressWeightPct: 10,
                      description: "Quotation dispatch via WhatsApp / PDF and client review",
                      icon: Send,
                    },
                    {
                      order: 6,
                      key: "CONFIRMATION_FEE_PAID",
                      title: "Confirmation Fee & Payments",
                      progressWeightPct: 10,
                      description: "Booking confirmation advance, GST tax invoices & payment receipts",
                      icon: ShieldCheck,
                    },
                    {
                      order: 7,
                      key: "ORDER_PLACED",
                      title: "Order Materials",
                      progressWeightPct: 10,
                      description: "Admin procurement: Select suppliers, generate purchase orders & place material orders",
                      icon: ShoppingCart,
                    },
                    {
                      order: 8,
                      key: "VENDOR_REQUEST",
                      title: "Vendor Request",
                      progressWeightPct: 10,
                      description: "Vendor confirmation, dispatch timelines & logistics",
                      icon: Truck,
                    },
                    {
                      order: 9,
                      key: "ORDER_CONFIRMED",
                      title: "Confirmed Order & Invoicing",
                      progressWeightPct: 10,
                      description: "Tax Invoices, customer payments & dispatch verification",
                      icon: PackageCheck,
                    },
                    {
                      order: 10,
                      key: "ORDER_DELIVERED",
                      title: "Order Delivered",
                      progressWeightPct: 10,
                      description: "Site delivery completed, materials received & signed handover",
                      icon: CheckCircle2,
                    },
                  ];

                  const normStage = (lead?.stage || lead?.status || "NEW").toUpperCase().replace(/\s+/g, "_");
                  const getMatStageIdx = (st: string) => {
                    switch (st) {
                      case "NEW": return 0;
                      case "NOT_CONTACTED":
                      case "CONTACTED": return 1;
                      case "MATERIAL_REQUIRED":
                      case "REQUIREMENT_DISCUSSED": return 2;
                      case "QUOTATION_IN_PROGRESS":
                      case "QUOTATION_GENERATED": return 3;
                      case "QUOTATION_SENT": return 4;
                      case "WON":
                      case "CONFIRMATION_FEE":
                      case "CONFIRMATION_FEE_PAID":
                      case "BOOKING_CONFIRMED": return 5;
                      case "ORDER_PLACED": return 6;
                      case "VENDOR_REQUEST":
                      case "VENDOR_REJECTED": return 7;
                      case "VENDOR_ACCEPTED":
                      case "ORDER_CONFIRMED":
                      case "MATERIALS_ORDER": return 8;
                      case "ORDER_DELIVERED":
                      case "ORDER_COMPLETED":
                      case "DELIVERED": return 9;
                      default: return 0;
                    }
                  };
                  const activeMatIdx = getMatStageIdx(normStage);
                  const isMaterialLeadFullyCompleted = normStage === "ORDER_DELIVERED" || normStage === "ORDER_COMPLETED" || normStage === "DELIVERED";
                  const progressPercent = isMaterialLeadFullyCompleted ? 100 : Math.round(((activeMatIdx) / (CANONICAL_MATERIAL_STAGES.length - 1)) * 100);

                  return (
                    <div className="space-y-6">
                      {/* Top Execution Progression Banner (Project Pipeline Style) */}
                      <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-charcoal flex items-center gap-1.5">
                              <Layers className="w-4 h-4 text-emerald-600" /> Execution Progression (Step {Math.min(activeMatIdx + 1, CANONICAL_MATERIAL_STAGES.length)} of {CANONICAL_MATERIAL_STAGES.length})
                            </span>
                            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {progressPercent}% Complete
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-walnut font-medium">
                              Active: <strong className="text-charcoal">{normStage.replace(/_/g, " ")}</strong>
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStageChange("ORDER_DELIVERED")}
                              className="text-xs py-0.5 h-6.5 text-emerald-700 border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 font-bold flex items-center gap-1 cursor-pointer"
                              title="Complete all material supply stages"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Finish All Stages
                            </Button>
                          </div>
                        </div>

                        {/* Continuous Progress Bar */}
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-500 ease-out rounded-full shadow-xs"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Vertical Connected Stepper (Project Pipeline Style) */}
                      <div className="relative pl-10 space-y-6">
                        {CANONICAL_MATERIAL_STAGES.map((stageDef, idx) => {
                          const isCompleted = isMaterialLeadFullyCompleted || idx < activeMatIdx;
                          const isActive = !isMaterialLeadFullyCompleted && idx === activeMatIdx;
                          const isFuture = !isMaterialLeadFullyCompleted && idx > activeMatIdx;
                          const isLast = idx === CANONICAL_MATERIAL_STAGES.length - 1;
                          const nextStageDef = idx < CANONICAL_MATERIAL_STAGES.length - 1 ? CANONICAL_MATERIAL_STAGES[activeMatIdx + 1] : null;

                          return (
                            <div
                              key={stageDef.key}
                              className={`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 ${
                                isCompleted
                                  ? "bg-white border-emerald-200"
                                  : isActive
                                  ? "bg-amber-50/50 border-amber-400 ring-1 ring-amber-300 shadow-xs"
                                  : "bg-white border-walnut/15 opacity-70"
                              }`}
                            >
                              {/* Connected Green Line to Next Step */}
                              {!isLast && (
                                <div
                                  className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${
                                    isCompleted || isMaterialLeadFullyCompleted ? "bg-emerald-500" : "bg-slate-200"
                                  }`}
                                  style={{ height: "calc(100% + 24px)" }}
                                />
                              )}

                              {/* Step Node Dot */}
                              <div
                                className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 ${
                                  isCompleted
                                    ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                                    : isActive
                                    ? "bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse"
                                    : "bg-white border-2 border-slate-300 text-slate-400"
                                }`}
                              >
                                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stageDef.order}
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      isCompleted
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : isActive
                                        ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold"
                                        : "bg-slate-100 text-slate-600 border-slate-200"
                                    }`}
                                  >
                                    {isCompleted ? "✓ " : ""}
                                    {stageDef.order}. {stageDef.title}
                                  </span>
                                  <span className="text-[11px] font-mono text-walnut/70">
                                    ({stageDef.progressWeightPct}% Weight)
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {isCompleted ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveNoteStage(activeNoteStage === stageDef.key ? null : stageDef.key);
                                          setInlineNoteText("");
                                        }}
                                        className="text-[11px] font-medium text-walnut hover:text-charcoal hover:underline flex items-center gap-1 cursor-pointer"
                                      >
                                        <Edit2 className="w-2.5 h-2.5" /> Note
                                      </button>
                                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Completed
                                      </span>
                                    </div>
                                  ) : isActive ? (
                                    <span className="text-xs text-amber-900 font-bold flex items-center gap-1.5 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                                      <Activity className="w-3.5 h-3.5 text-amber-600" /> In Execution
                                    </span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStageChange(stageDef.key)}
                                      className="text-xs py-0.5 h-6 text-slate-700 border-slate-300 hover:bg-slate-50 font-semibold cursor-pointer"
                                    >
                                      Advance to Here
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <p className="text-xs text-walnut">{stageDef.description}</p>

                              {/* Completed Stage Note Display */}
                              {stageDef.key === "NEW" && lead?.requirement && (
                                <div className="p-2.5 bg-slate-50/90 rounded-lg border border-slate-200 text-xs flex items-start gap-2">
                                  <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                                      <span className="font-bold uppercase tracking-wider text-slate-600">
                                        STAGE NOTE / REMARK
                                      </span>
                                      <span>{formatDate(lead.createdAt)}</span>
                                    </div>
                                    <p className="text-slate-800 font-sans text-xs leading-relaxed">
                                      {lead.requirement}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Inline Note Add/Edit Box for Completed Stages */}
                              {isCompleted && activeNoteStage === stageDef.key && (
                                <div className="pt-2 border-t border-walnut/10 space-y-2">
                                  <label className="text-[11px] font-bold text-charcoal flex items-center gap-1">
                                    <FileText className="w-3 h-3 text-gold" /> Add / Update Note for {stageDef.title}
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={inlineNoteText}
                                    onChange={(e) => setInlineNoteText(e.target.value)}
                                    placeholder="Add notes, client feedback, or remarks for this completed stage..."
                                    className="w-full text-xs p-2.5 bg-white border border-walnut/25 rounded-lg text-charcoal focus:ring-1 focus:ring-gold focus:outline-none placeholder:text-walnut/50 resize-y"
                                    autoFocus
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setActiveNoteStage(null);
                                        setInlineNoteText("");
                                      }}
                                      className="text-xs py-0.5 h-6 text-walnut"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => {
                                        handleAddInlineNote(stageDef.key);
                                        setActiveNoteStage(null);
                                      }}
                                      disabled={!inlineNoteText.trim() || isSubmittingNote}
                                      className="text-xs py-0.5 h-6 bg-gold text-charcoal font-bold hover:bg-gold/90"
                                    >
                                      Save Stage Note
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* ACTIVE STAGE: NEXT STEP ADVANCEMENT BOX */}
                              {isActive && (
                                <div className="mt-3.5 p-3.5 bg-white/95 rounded-xl border border-amber-300 shadow-2xs space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                      <Activity className="w-3.5 h-3.5 text-amber-600" />
                                      {stageDef.key === "QUOTATION_SENT"
                                        ? "Select Deal Outcome: Mark Won or Lost"
                                        : stageDef.key === "VENDOR_REQUEST"
                                        ? "Awaiting Supplier Response: Vendor Confirmation Required"
                                        : nextStageDef
                                        ? `Ready to Advance: Step ${nextStageDef.order} • ${nextStageDef.title}`
                                        : "Final Material Supply Execution Stage"}
                                    </span>
                                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                      Current Step: {stageDef.order} of {CANONICAL_MATERIAL_STAGES.length}
                                    </span>
                                  </div>

                                  {/* Optional Stage Transition Notes Input */}
                                  {stageDef.key !== "QUOTATION_SENT" && (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between text-[11px]">
                                        <label className="font-semibold text-charcoal flex items-center gap-1">
                                          <FileText className="w-3 h-3 text-gold" />
                                          Stage Notes &amp; Handover Remarks{" "}
                                          <span className="text-walnut font-normal">(Optional)</span>
                                        </label>
                                        {inlineNoteText.trim() && (
                                          <span className="text-[10px] text-emerald-700 font-semibold">
                                            Will be saved when advancing
                                          </span>
                                        )}
                                      </div>
                                      <textarea
                                        rows={2}
                                        value={inlineNoteText}
                                        onChange={(e) => setInlineNoteText(e.target.value)}
                                        placeholder="Add optional notes, client feedback, material specs, site observations, or handover remarks for this stage..."
                                        className="w-full text-xs p-2.5 bg-white border border-walnut/25 rounded-lg text-charcoal focus:ring-1 focus:ring-amber-500 focus:outline-none placeholder:text-walnut/50 resize-y"
                                      />
                                    </div>
                                  )}

                                  {/* Stage specific quick buttons */}
                                  {stageDef.key === "NEW" && (
                                    <div className="flex items-center gap-2 pt-1 border-t border-walnut/10">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setContactModalInitialStatus("NOT_CONTACTED");
                                          setIsContactModalOpen(true);
                                        }}
                                        className="text-xs h-7 gap-1 text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100"
                                      >
                                        <PhoneOff className="w-3 h-3 text-amber-600" />
                                        Mark Not Contacted
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStageChange("CONTACTED", undefined, inlineNoteText || undefined)}
                                        className="text-xs h-7 gap-1 text-teal-700 border-teal-300 bg-teal-50 hover:bg-teal-100 font-bold"
                                      >
                                        <PhoneCall className="w-3 h-3 text-teal-600" />
                                        Mark Contacted
                                      </Button>
                                    </div>
                                  )}

                                  {stageDef.key === "MATERIAL_REQUIRED" && (
                                    <div className="flex items-center gap-2 pt-1 border-t border-walnut/10">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStageChange("QUOTATION_GENERATED")}
                                        className="text-xs h-7 gap-1"
                                      >
                                        <FileText className="w-3 h-3 text-gold" />
                                        Open Material Quotation Studio
                                      </Button>
                                    </div>
                                  )}

                                  {stageDef.key === "QUOTATION_GENERATED" && (
                                    <div className="flex items-center gap-2 pt-1 border-t border-walnut/10">
                                      <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => {
                                          setActiveQuotationId(lead?.quotations?.[0]?.id || null);
                                          setQuotationStudioType("MATERIAL");
                                          setIsQuotationStudioOpen(true);
                                        }}
                                        className="text-xs h-7 bg-gold text-charcoal font-bold gap-1"
                                      >
                                        <FileText className="w-3 h-3" />
                                        {lead?.quotations?.length > 0 ? "Open Material Studio" : "+ Create Material Quotation"}
                                      </Button>
                                    </div>
                                  )}

                                  {stageDef.key === "QUOTATION_SENT" && (
                                    <div className="flex items-center gap-3 pt-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStageChange("LOST")}
                                        className="text-xs h-8 px-4 gap-1.5 text-rose-600 border-rose-300 hover:bg-rose-50 font-bold cursor-pointer"
                                      >
                                        <XCircle className="w-4 h-4" />
                                        Mark Lost
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => handleStageChange("CONFIRMATION_FEE_PAID", undefined, inlineNoteText || undefined)}
                                        className="text-xs h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 cursor-pointer shadow-xs"
                                      >
                                        <Trophy className="w-4 h-4" />
                                        Mark Won &amp; Proceed to Advance Fee →
                                      </Button>
                                    </div>
                                  )}

                                  {stageDef.key === "CONFIRMATION_FEE_PAID" && (
                                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-walnut/10">
                                      <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => {
                                          const targetQuoteId = lead?.quotations?.[0]?.id;
                                          if (targetQuoteId) {
                                            router.push(`/quotations/${targetQuoteId}?type=MATERIAL&mode=INVOICE&leadId=${leadId}&returnToLead=${leadId}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}`);
                                          } else {
                                            router.push(`/quotations/new?type=MATERIAL&mode=INVOICE&leadId=${leadId}&returnToLead=${leadId}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}`);
                                          }
                                        }}
                                        className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
                                      >
                                        <Receipt className="w-3 h-3" />
                                        Generate Tax Invoice in Material Studio ↗
                                      </Button>
                                    </div>
                                  )}

                                  {stageDef.key === "ORDER_PLACED" && (
                                    <div className="bg-white p-4 rounded-xl border border-cyan-200 shadow-2xs space-y-3">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                        <div className="flex items-center gap-2">
                                          <ShoppingCart className="w-4 h-4 text-cyan-700" />
                                          <span className="text-xs font-bold text-cyan-950 uppercase tracking-wider">
                                            Admin Material Procurement &amp; Supplier Order
                                          </span>
                                        </div>
                                      </div>
                                      <p className="text-xs text-slate-600">
                                        As Admin, select certified suppliers, generate purchase orders with delivery timelines, and dispatch procurement requests directly to vendors.
                                      </p>
                                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                        <Button
                                          size="sm"
                                          variant="primary"
                                          onClick={() => setIsPlaceOrderModalOpen(true)}
                                          className="text-xs h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 cursor-pointer shadow-2xs"
                                        >
                                          <ShoppingCart className="w-3.5 h-3.5" />
                                          + Order Materials / Create Purchase Order
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {stageDef.key === "VENDOR_REQUEST" && (
                                    <div className="flex items-center gap-2 pt-1 border-t border-walnut/10">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setVendorResponseMode("REJECTED");
                                          setIsVendorResponseModalOpen(true);
                                        }}
                                        className="text-xs h-7 gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                                      >
                                        <XCircle className="w-3 h-3" />
                                        Vendor Rejects
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => {
                                          setVendorResponseMode("ACCEPTED");
                                          setIsVendorResponseModalOpen(true);
                                        }}
                                        className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                      >
                                        <CheckCircle2 className="w-3 h-3" />
                                        Vendor Accepts → Confirm
                                      </Button>
                                    </div>
                                  )}

                                  {stageDef.key === "ORDER_CONFIRMED" && (
                                    <div className="flex items-center gap-2 pt-1 border-t border-walnut/10">
                                      <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => handleStageChange("ORDER_DELIVERED", undefined, inlineNoteText || undefined)}
                                        className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 cursor-pointer"
                                      >
                                        <PackageCheck className="w-3 h-3" />
                                        Mark Order Delivered
                                      </Button>
                                    </div>
                                  )}

                                  {stageDef.key === "ORDER_DELIVERED" && (
                                    <div className="flex items-center gap-2 pt-1 border-t border-walnut/10">
                                      <span className="text-xs text-emerald-800 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                                        <Check className="w-3.5 h-3.5 stroke-[3]" /> All Material Supply Stages Completed Successfully
                                      </span>
                                    </div>
                                  )}

                                  {/* Bottom Advancement Row */}
                                  {stageDef.key !== "QUOTATION_SENT" && stageDef.key !== "VENDOR_REQUEST" && (
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          if (inlineNoteText.trim()) {
                                            handleAddInlineNote(stageDef.key);
                                            setInlineNoteText("");
                                          }
                                        }}
                                        disabled={!inlineNoteText.trim() || isSubmittingNote}
                                        className="text-xs py-1 h-7 text-charcoal bg-white border-walnut/20 font-semibold"
                                      >
                                        Save Note on Current Step
                                      </Button>
                                      {nextStageDef && (
                                        <Button
                                          size="sm"
                                          variant="primary"
                                          onClick={() => {
                                            handleStageChange(nextStageDef.key, undefined, inlineNoteText || undefined);
                                            setInlineNoteText("");
                                          }}
                                          className="text-xs py-1 h-7 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                        >
                                          Advance to Step {nextStageDef.order}. {nextStageDef.title} →
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Determine stage progression index (0 to 8) for Standard Leads
                const hasRecordedPaymentsLead = (lead?.payments && lead.payments.length > 0) || isFeePaid;
                const isStep1Done = true; // Lead Created is always done
                const isStep2Done = lead?.stage !== "NEW" && lead?.stage !== "NOT_CONTACTED";
                const isStep3Done =
                  (lead?.followUps && lead.followUps.some((f: any) => f.status === "COMPLETED")) ||
                  ["SITE_VISIT_SCHEDULED", "SITE_VISIT_COMPLETED", "QUOTATION_IN_PROGRESS", "QUOTATION_SENT", "NEGOTIATION", "WON", "PROJECT_CREATED"].includes(lead?.stage);
                const isStep4Done =
                  (lead?.siteVisits && lead.siteVisits.some((v: any) => v.status === "SCHEDULED" || v.status === "COMPLETED")) ||
                  ["SITE_VISIT_SCHEDULED", "SITE_VISIT_COMPLETED", "QUOTATION_IN_PROGRESS", "QUOTATION_SENT", "NEGOTIATION", "WON", "PROJECT_CREATED"].includes(lead?.stage);
                const isStep5Done =
                  (lead?.siteVisits && lead.siteVisits.some((v: any) => v.status === "COMPLETED")) ||
                  ["SITE_VISIT_COMPLETED", "QUOTATION_IN_PROGRESS", "QUOTATION_SENT", "NEGOTIATION", "WON", "PROJECT_CREATED"].includes(lead?.stage);
                const isStep6Done =
                  (lead?.quotations && lead.quotations.length > 0) ||
                  ["QUOTATION_IN_PROGRESS", "QUOTATION_SENT", "NEGOTIATION", "WON", "PROJECT_CREATED"].includes(lead?.stage);
                const isStep7Done =
                  (lead?.quotations && lead.quotations.some((q: any) => q.status === "SENT" || q.status === "APPROVED" || q.status === "ACCEPTED")) ||
                  ["QUOTATION_SENT", "NEGOTIATION", "WON", "PROJECT_CREATED"].includes(lead?.stage);
                const isStep8Done = ["WON", "PROJECT_CREATED", "LOST"].includes(lead?.stage) || !!lead?.project || hasRecordedPaymentsLead;
                const isStep9Done = !!lead?.project || hasRecordedPaymentsLead;

                // Active step determination: Automatically shifts the active YELLOW focus to the exact next incomplete step
                const isStep1Active = false;
                const isStep2Active = !isStep2Done;
                const isStep3Active = isStep2Done && !isStep3Done;
                const isStep4Active = isStep2Done && isStep3Done && !isStep4Done;
                const isStep5Active = isStep2Done && isStep3Done && isStep4Done && !isStep5Done;
                const isStep6Active = isStep2Done && isStep3Done && isStep4Done && isStep5Done && !isStep6Done;
                const isStep7Active = isStep2Done && isStep3Done && isStep4Done && isStep5Done && isStep6Done && !isStep7Done;
                const isStep8Active = isStep2Done && isStep3Done && isStep4Done && isStep5Done && isStep6Done && isStep7Done && !isStep8Done;
                const isStep9Active = isStep2Done && isStep3Done && isStep4Done && isStep5Done && isStep6Done && isStep7Done && isStep8Done && !isStep9Done;

                // Completed count calculation for top progress tracker
                const isWonOrProject = lead?.stage === "WON" || lead?.stage === "PROJECT_CREATED" || !!lead?.project || hasRecordedPaymentsLead;
                const completedCount = [isStep1Done, isStep2Done, isStep3Done, isStep4Done, isStep5Done, isStep6Done, isStep7Done, isStep8Done, isStep9Done].filter(Boolean).length;
                const totalPossible = isWonOrProject ? 9 : 8;
                const progressPercent = Math.min(100, Math.round((completedCount / totalPossible) * 100));

                const completedSiteVisits = lead?.siteVisits?.filter((v: any) => v.status === "COMPLETED") || [];
                const scheduledSiteVisits = lead?.siteVisits?.filter((v: any) => v.status === "SCHEDULED") || [];

                return (
                  <div className="space-y-6">
                    {/* Top Flipkart-Style Mini Order Tracker Banner */}
                    <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-charcoal flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-emerald-600" /> Pipeline Progression
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
                      <div className={`grid ${isWonOrProject ? "grid-cols-9" : "grid-cols-8"} text-center text-[10px] font-semibold text-walnut pt-1 gap-1`}>
                        <span className={isStep1Done ? "text-emerald-700 font-bold" : "text-walnut/60"}>Created</span>
                        <span className={isStep2Done ? "text-emerald-700 font-bold" : isStep2Active ? "text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded shadow-2xs" : "text-walnut/60"}>Contacted</span>
                        <span className={isStep3Done ? "text-emerald-700 font-bold" : isStep3Active ? "text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded shadow-2xs" : "text-walnut/60"}>Follow-up</span>
                        <span className={isStep4Done ? "text-emerald-700 font-bold" : isStep4Active ? "text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded shadow-2xs" : "text-walnut/60"}>Visit Sched.</span>
                        <span className={isStep5Done ? "text-emerald-700 font-bold" : isStep5Active ? "text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded shadow-2xs" : "text-walnut/60"}>Visit Done</span>
                        <span className={isStep6Done ? "text-emerald-700 font-bold" : isStep6Active ? "text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded shadow-2xs" : "text-walnut/60"}>Quote Prep</span>
                        <span className={isStep7Done ? "text-emerald-700 font-bold" : isStep7Active ? "text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded shadow-2xs" : "text-walnut/60"}>Quote Sent</span>
                        <span className={isStep8Done ? "text-emerald-700 font-bold" : isStep8Active ? "text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded shadow-2xs" : "text-walnut/60"}>Won / Close</span>
                        {isWonOrProject && (
                          <span className={isStep9Done ? "text-emerald-700 font-bold" : isStep9Active ? "text-amber-900 font-extrabold bg-amber-100 border border-amber-300 px-1 py-0.5 rounded shadow-2xs" : "text-walnut/60"}>Project</span>
                        )}
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
                      <div className={`relative p-4 rounded-xl border transition-all shadow-2xs space-y-2 ${isStep2Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : isStep2Active ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs" : "bg-white border-walnut/15 opacity-80"}`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${isStep3Done || isStep3Active ? "bg-emerald-500" : "bg-slate-200"}`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 ${isStep2Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep2Active ? "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold" : "bg-white border-2 border-slate-300 text-slate-400"}`}>
                          {isStep2Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "2"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isStep2Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isStep2Active ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                              {isStep2Done ? "✓ " : ""}2. CONTACTED
                            </span>
                            <span className="text-xs font-bold text-charcoal">Initial Outreach &amp; Qualification</span>
                          </div>
                          {!isStep2Done ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStageChange("CONTACTED")}
                              className="text-xs py-1 h-6 border-amber-400 text-amber-900 bg-amber-100 hover:bg-amber-200 font-bold"
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
                      <div className={`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 ${isStep3Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : isStep3Active ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs" : "bg-white border-walnut/15 opacity-80"}`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${isStep4Done || isStep4Active ? "bg-emerald-500" : "bg-slate-200"}`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 ${isStep3Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep3Active ? "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold" : "bg-white border-2 border-slate-300 text-slate-400"}`}>
                          {isStep3Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "3"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isStep3Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isStep3Active ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                              {isStep3Done ? "✓ " : ""}3. FOLLOW-UP SCHEDULED
                            </span>
                          </div>
                          {isStep3Done && !isStep3Active ? (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Completed
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsFollowUpModalOpen(true)}
                                className="text-xs py-1 h-6 text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100 font-bold"
                              >
                                <Plus className="w-3 h-3 mr-1" /> Schedule
                              </Button>
                              {!isStep4Done && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleSkipFollowUpStage}
                                  className="text-xs py-1 h-6 text-slate-700 border-slate-300 hover:bg-slate-100 font-semibold"
                                  title="Skip follow-up and advance to next step"
                                >
                                  ↷ Skip Step
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        {lead?.followUps && lead.followUps.length > 0 ? (
                          <div className="space-y-2">
                            {lead.followUps.map((f: any) => (
                              <div key={f.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                    <span>{formatDate(f.followUpDate)}</span>
                                    <Badge variant={f.status === "COMPLETED" ? "completed" : f.status === "SKIPPED" ? "neutral" : "active"}>
                                      {f.status}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-slate-600 mt-1">{f.notes}</div>
                                  {f.outcomeNotes && (
                                    <div className="text-[11px] text-slate-500 mt-1 italic">
                                      Note: {f.outcomeNotes}
                                    </div>
                                  )}
                                </div>
                                {f.status === "PENDING" && (
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSkipFollowUp(f.id)}
                                      className="text-xs py-1 h-6 text-slate-600 border-slate-300 hover:bg-slate-100"
                                      title="Skip this follow-up"
                                    >
                                      ↷ Skip
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setCompletingFollowUpId(f.id)}
                                      className="text-xs py-1 h-6 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold"
                                    >
                                      ✓ Done
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-walnut/70">
                            {isStep3Done ? "Client follow-up stage completed." : "No follow-ups scheduled yet."}
                          </p>
                        )}
                      </div>

                      {/* 4. SITE VISIT SCHEDULED */}
                      <div className={`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 ${isStep4Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : isStep4Active ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs" : "bg-white border-walnut/15 opacity-80"}`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${isStep5Done || isStep5Active ? "bg-emerald-500" : "bg-slate-200"}`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 ${isStep4Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep4Active ? "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold" : "bg-white border-2 border-slate-300 text-slate-400"}`}>
                          {isStep4Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "4"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isStep4Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isStep4Active ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                              {isStep4Done ? "✓ " : ""}4. SITE VISIT SCHEDULED
                            </span>
                          </div>
                          {isStep4Done && !isStep4Active ? (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Completed
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsSiteVisitModalOpen(true)}
                                className="text-xs py-1 h-6 text-purple-700 border-purple-200 bg-purple-50/50 hover:bg-purple-100"
                              >
                                <Plus className="w-3 h-3 mr-1" /> Schedule Visit
                              </Button>
                              {!isStep5Done && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStageChange("SITE_VISIT_SCHEDULED")}
                                  className="text-xs py-1 h-6 text-purple-800 border-purple-300 bg-purple-50 hover:bg-purple-100"
                                >
                                  Set Scheduled Stage
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        {scheduledSiteVisits.length > 0 ? (
                          <div className="space-y-2">
                            {scheduledSiteVisits.map((v: any) => (
                              <div key={v.id} className="p-3 bg-purple-50/30 rounded-lg border border-purple-200 flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                    <span>{formatDate(v.visitDate)}</span>
                                    <Badge variant="active">{v.status}</Badge>
                                  </div>
                                  <div className="text-xs text-slate-600 mt-1">{v.location || "Site Location"} - {v.notes || "Measurements & site analysis"}</div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setCompletingSiteVisitId(v.id)}
                                  className="text-xs py-1 h-6 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold"
                                >
                                  ✓ Complete Visit
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-walnut/70">
                            {isStep4Done ? "Site visit scheduling stage completed." : "No pending scheduled visits."}
                          </p>
                        )}
                      </div>

                      {/* 5. SITE VISIT COMPLETED */}
                      <div className={`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 ${isStep5Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : isStep5Active ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs" : "bg-white border-walnut/15 opacity-80"}`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${isStep6Done || isStep6Active ? "bg-emerald-500" : "bg-slate-200"}`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 ${isStep5Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep5Active ? "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold" : "bg-white border-2 border-slate-300 text-slate-400"}`}>
                          {isStep5Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "5"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isStep5Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isStep5Active ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                              {isStep5Done ? "✓ " : ""}5. SITE VISIT COMPLETED
                            </span>
                            <span className="text-xs font-bold text-charcoal">On-Site Inspection &amp; Measurement</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isStep5Done && !isStep5Active ? (
                              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Completed
                              </span>
                            ) : !isStep5Done ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const pendingVisit = lead?.siteVisits?.find((v: any) => v.status === "SCHEDULED");
                                  setCompletingSiteVisitId(pendingVisit?.id || "DIRECT");
                                }}
                                className="text-xs py-1 h-6 border-cyan-300 text-cyan-800 bg-cyan-50 hover:bg-cyan-100 font-bold cursor-pointer"
                              >
                                Mark Visit Completed
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStageChange("QUOTATION_IN_PROGRESS")}
                                className="text-xs py-1 h-6 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold"
                              >
                                Start Quotation Prep →
                              </Button>
                            )}
                          </div>
                        </div>

                        {completedSiteVisits.length > 0 ? (
                          <div className="space-y-2">
                            {completedSiteVisits.map((v: any) => (
                              <div key={v.id} className="p-3 bg-cyan-50/20 rounded-lg border border-cyan-200 flex items-center justify-between">
                                <div>
                                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                    <span>{formatDate(v.visitDate)}</span>
                                    <Badge variant="completed">COMPLETED</Badge>
                                  </div>
                                  <div className="text-xs text-slate-700 mt-1">
                                    <strong>Outcome:</strong> {v.outcomeNotes || "Measurements taken & initial scope assessed"}
                                  </div>
                                </div>
                                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Verified
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-walnut/70">Site inspection and spatial measurements recorded on-site.</p>
                        )}
                      </div>

                      {/* 6. QUOTATION IN PROGRESS */}
                      <div className={`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 ${isStep6Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : isStep6Active ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs" : "bg-white border-walnut/15 opacity-80"}`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${isStep7Done || isStep7Active ? "bg-emerald-500" : "bg-slate-200"}`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 ${isStep6Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep6Active ? "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold" : "bg-white border-2 border-slate-300 text-slate-400"}`}>
                          {isStep6Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "6"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isStep6Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isStep6Active ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                              {isStep6Done ? "✓ " : ""}6. QUOTATION IN PROGRESS
                            </span>
                            <span className="text-xs font-bold text-charcoal">Cost Estimation &amp; BOQ Drafting</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isStep6Done && !isStep6Active ? (
                              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Completed
                              </span>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (lead?.quotations && lead.quotations.length > 0) {
                                      router.push(`/quotations/${lead.quotations[0].id}`);
                                    } else {
                                      router.push(`/quotations/new?type=LEAD&leadId=${leadId}`);
                                    }
                                  }}
                                  className="text-xs py-1 h-6 bg-gold/10 border-gold/40 text-charcoal font-bold hover:bg-gold/20 cursor-pointer"
                                >
                                  + Open Studio
                                </Button>
                                {!isStep7Done && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStageChange("QUOTATION_IN_PROGRESS")}
                                    className="text-xs py-1 h-6 border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 font-bold"
                                  >
                                    Mark In Progress
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-walnut">
                          Drafting room-wise Bill of Quantities (BOQ), material specifications, finish options, and margin calculation in the Quotation Studio.
                        </p>
                      </div>

                      {/* 7. QUOTATION SENT & WHATSAPP ACTION */}
                      <div className={`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 ${isStep7Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : isStep7Active ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs" : "bg-white border-walnut/15 opacity-80"}`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${isStep8Done || isStep8Active ? "bg-emerald-500" : "bg-slate-200"}`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 ${isStep7Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep7Active ? "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold" : "bg-white border-2 border-slate-300 text-slate-400"}`}>
                          {isStep7Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "7"}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isStep7Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isStep7Active ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                              {isStep7Done ? "✓ " : ""}7. QUOTATION SENT
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isStep7Done && !isStep7Active ? (
                              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Completed
                              </span>
                            ) : (
                              !isStep8Done && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStageChange("QUOTATION_SENT")}
                                  className="text-xs py-1 h-6 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold"
                                >
                                  Mark Quotation Sent
                                </Button>
                              )
                            )}
                          </div>
                        </div>

                        {lead?.quotations && lead.quotations.length > 0 ? (
                          <div className="space-y-2">
                            {lead.quotations.map((q: any) => {
                              const isWonLead = lead?.stage === "WON" || lead?.stage === "PROJECT_CREATED" || !!lead?.project;
                              return (
                                <div key={q.id} className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isWonLead ? "bg-emerald-50/70 border-emerald-300" : "bg-amber-50/40 border-amber-200"}`}>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-slate-900 font-mono">
                                        {q.referenceNo} (Rev {q.revision || 1})
                                      </span>
                                      <span className="text-xs font-bold text-emerald-700 font-mono">
                                        {formatCurrency(q.totalAmount)}
                                      </span>
                                      {isWonLead ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                          🔒 FINALIZED &amp; LOCKED
                                        </span>
                                      ) : (
                                        <Badge variant={q.status === "APPROVED" || q.status === "ACCEPTED" ? "completed" : q.status === "SENT" ? "active" : "neutral"} className="text-[10px] py-0 px-1.5">
                                          {q.status}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      {isWonLead
                                        ? "Finalized quotation value locked for project execution & financials."
                                        : "Edit quotation amounts and line items before marking lead as Won."}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {isWonLead ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => router.push(`/quotations/${q.id}?readOnly=true&leadId=${lead.id}&step=7`)}
                                        className="text-xs py-1 h-6 bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 font-bold cursor-pointer"
                                      >
                                        <Eye className="w-3 h-3 mr-1 text-emerald-700" />
                                        View Finalized Quotation
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => router.push(`/quotations/${q.id}?leadId=${lead.id}&step=7`)}
                                        className="text-xs py-1 h-6 text-charcoal border-walnut/20 hover:bg-gold/10 font-bold cursor-pointer"
                                      >
                                        <Edit2 className="w-3 h-3 mr-1 text-walnut" />
                                        Edit Quotation &amp; Amounts
                                      </Button>
                                    )}
                                    <a
                                      href={`/api/v1/quotations/${q.id}/pdf`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs py-1 h-6 px-2.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1 font-bold cursor-pointer"
                                    >
                                      <Printer className="w-3 h-3 text-slate-600" />
                                      PDF / Print
                                    </a>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSendWhatsApp(`QUOTE_${q.id}`, `Quotation ${q.referenceNo} for ${formatCurrency(q.totalAmount)}`)}
                                      className="text-xs py-1 h-6 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 font-bold"
                                    >
                                      <MessageCircle className="w-3 h-3 mr-1" />
                                      {whatsAppSentStates[`QUOTE_${q.id}`] ? "✓ Sent via WhatsApp" : "WhatsApp"}
                                    </Button>
                                    {!isWonLead && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeleteQuotation(q.id, q.referenceNo)}
                                        disabled={isDeletingQuotation === q.id}
                                        isLoading={isDeletingQuotation === q.id}
                                        title="Delete Quotation"
                                        className="text-xs py-1 h-6 text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 px-2 font-bold cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3 mr-1 text-rose-600" />
                                        Delete
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-2.5 bg-cream/30 rounded-lg border border-walnut/15">
                            <p className="text-xs text-walnut/70 italic">
                              {lead?.stage === "WON" || lead?.stage === "PROJECT_CREATED" || !!lead?.project
                                ? "No quotation generated before project win."
                                : "No quotation generated yet."}
                            </p>
                            {lead?.stage !== "WON" && lead?.stage !== "PROJECT_CREATED" && !lead?.project && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/quotations/new?type=LEAD&leadId=${lead.id}&step=7`)}
                                className="text-xs py-1 h-6 bg-gold/10 border-gold/40 text-charcoal font-bold hover:bg-gold/20 cursor-pointer"
                              >
                                + Open Quotation Studio
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 8. NEGOTIATION & FINALIZATION */}
                      <div className={`relative p-4 rounded-xl border transition-all shadow-2xs space-y-3 ${isStep8Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : isStep8Active ? "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs" : "bg-white border-walnut/15 opacity-80"}`}>
                        {/* Connected Green Vertical Line to Next Step */}
                        <div className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${isStep9Done || isStep9Active ? "bg-emerald-500" : "bg-slate-200"}`} style={{ height: "calc(100% + 24px)" }} />
                        {/* Step Node Dot */}
                        <div className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 ${isStep8Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : isStep8Active ? "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold" : "bg-white border-2 border-slate-300 text-slate-400"}`}>
                          {isStep8Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "8"}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isStep8Done ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isStep8Active ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                            {isStep8Done ? "✓ " : ""}8. NEGOTIATION &amp; DECISION
                          </span>
                          {(lead?.stage === "WON" || lead?.stage === "PROJECT_CREATED" || !!lead?.project || hasRecordedPaymentsLead) && lead?.stage !== "LOST" ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 stroke-[3]" /> Completed
                              </span>
                              <Badge variant="completed" className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 border-emerald-300">
                                ✓ LEAD WON
                              </Badge>
                            </div>
                          ) : lead?.stage === "LOST" ? (
                            <Badge variant="danger" className="px-2.5 py-0.5 text-[11px] font-bold">
                              ✕ LEAD LOST
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStageChange("NEGOTIATION")}
                                className="text-xs py-1 h-6 border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-bold"
                              >
                                In Negotiation
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={async () => {
                                  await handleStageChange("WON");
                                }}
                                className="text-xs py-1 h-6 bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
                              >
                                ✓ WON
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsLostModalOpen(true)}
                                className="text-xs py-1 h-6 text-rose-600 border-rose-300 bg-rose-50 hover:bg-rose-100 cursor-pointer"
                              >
                                ✕ LOST
                              </Button>
                            </div>
                          )}
                        </div>

                        {(lead?.stage === "WON" || lead?.stage === "PROJECT_CREATED" || !!lead?.project || hasRecordedPaymentsLead) && lead?.stage !== "LOST" ? (
                          <p className="text-xs text-emerald-700 font-medium">
                            Deal successfully marked as Won and quotation terms locked. Proceed to Step 9 below for Booking Confirmation Fee and Payment Invoices.
                          </p>
                        ) : lead?.stage === "LOST" ? (
                          <p className="text-xs text-rose-600 font-medium">
                            Lead marked as Lost. Reason: {lead?.lossReason || "Not specified"}.
                          </p>
                        ) : (
                          <p className="text-xs text-walnut">
                            Finalize client negotiation and mark the lead as <strong className="text-emerald-700 font-bold">Won</strong> to lock final amounts and unlock Step 9 Booking Confirmation Fee.
                          </p>
                        )}
                      </div>

                      {/* 9. CONFIRMATION FEE & PAYMENT INVOICE MANAGEMENT */}
                      {(() => {
                        const allRecordedPayments = lead?.payments || [];
                        const recordedPaidAmount = allRecordedPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
                        const hasRecordedPayments = allRecordedPayments.length > 0 || isFeePaid || hasRecordedPaymentsLead;
                        const isWon = (lead?.stage === "WON" || lead?.stage === "PROJECT_CREATED" || !!lead?.project || hasRecordedPayments) && lead?.stage !== "LOST";
                        const allQuotes = lead?.quotations || [];
                        const finalizedQuotation =
                          (attachedQuotationId ? allQuotes.find((q: any) => q.id === attachedQuotationId) : null) ||
                          allQuotes.find((q: any) => q.status === "APPROVED" || q.status === "ACCEPTED" || q.status === "SENT") ||
                          (allQuotes.length > 0 ? allQuotes[0] : null);

                        const totalDealAmount = finalizedQuotation
                          ? Number(finalizedQuotation.totalAmount || 0)
                          : Number(lead?.estimatedBudget || 0);

                        // When payment is already recorded, display exact realized amount without simulation bleed
                        const enteringPaymentAmount = hasRecordedPayments ? 0 : Math.max(0, parseFloat(confirmationFeeAmount) || 0);
                        const displayPaidAmount = hasRecordedPayments ? (recordedPaidAmount || (isFeePaid ? totalDealAmount : 0)) : (recordedPaidAmount + enteringPaymentAmount);
                        const displayRemainingBalance = Math.max(0, totalDealAmount - displayPaidAmount);
                        const totalPaidAmount = displayPaidAmount;
                        const remainingBalanceAmount = displayRemainingBalance;
                        const paidPercentage = totalDealAmount > 0
                          ? ((displayPaidAmount / totalDealAmount) * 100).toFixed(1)
                          : "0.0";

                        if (!isWon) {
                          return (
                            <div
                              ref={step9Ref}
                              className="relative p-5 rounded-xl border border-slate-200 bg-slate-50/60 shadow-2xs space-y-3 opacity-90"
                            >
                              {/* Step Node Dot */}
                              <div className="absolute -left-[35px] top-4 w-6 h-6 rounded-full border-2 border-slate-300 bg-white text-slate-400 flex items-center justify-center font-bold text-xs shadow-sm z-10">
                                9
                              </div>

                              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                                  <h4 className="text-xs font-bold text-slate-700 uppercase">
                                    9. CONFIRMATION FEE &amp; PAYMENT INVOICES
                                  </h4>
                                </div>
                                <Badge variant="neutral" className="text-[10px] font-bold">
                                  Awaiting Won Decision
                                </Badge>
                              </div>

                              <div className="p-3.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-0.5">
                                  <div className="text-xs font-bold text-slate-800">
                                    {finalizedQuotation
                                      ? `Deal Baseline: ${finalizedQuotation.referenceNo} (${formatCurrency(totalDealAmount)})`
                                      : "No quotation finalized yet"}
                                  </div>
                                  <p className="text-[11px] text-slate-500">
                                    Booking confirmation advance, official GST invoices, and execution project creation will unlock when the lead is marked as Won in Step 8 above.
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={async () => {
                                    await handleStageChange("WON");
                                    setTimeout(() => {
                                      step9Ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                                    }, 250);
                                  }}
                                  className="text-xs py-1.5 h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0 cursor-pointer"
                                >
                                  ✓ Mark Won &amp; Unlock Step 9
                                </Button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            ref={step9Ref}
                            className={`relative p-5 rounded-xl border transition-all shadow-2xs space-y-4 ${isStep9Done ? "bg-white border-emerald-200 shadow-emerald-500/5" : "bg-amber-50/60 border-amber-400 ring-2 ring-amber-300/60 shadow-xs"}`}
                          >
                            {/* Step Node Dot */}
                            <div className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10 ${isStep9Done ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : "bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse font-bold"}`}>
                              {isStep9Done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "9"}
                            </div>

                            <div className={`flex items-center justify-between border-b pb-2 ${isStep9Done ? "border-emerald-200" : "border-amber-300"}`}>
                              <div className="flex items-center gap-2">
                                <ShieldCheck className={`w-4 h-4 ${isStep9Done ? "text-emerald-700" : "text-amber-700"}`} />
                                <h4 className={`text-xs font-bold uppercase ${isStep9Done ? "text-emerald-900" : "text-amber-950"}`}>
                                  9. CONFIRMATION FEE &amp; PAYMENT INVOICES
                                </h4>
                              </div>
                              <div className="flex items-center gap-2">
                                {displayPaidAmount > 0 && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    ✓ {formatCurrency(displayPaidAmount)} Paid ({paidPercentage}%)
                                  </span>
                                )}
                                <Badge variant="completed">
                                  {lead?.project ? "PROJECT CREATED" : isStep9Done ? "FEE CONFIRMED" : "LEAD WON"}
                                </Badge>
                              </div>
                            </div>

                            {/* Direct Project Conversion Callout Banner */}
                            {hasRecordedPayments && (
                              !lead?.project ? (
                                <div className="p-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/40">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30 uppercase tracking-wider flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-amber-300" /> Confirmation Fee Secured
                                      </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-white">
                                      Convert Lead Directly into Execution Project
                                    </h4>
                                    <p className="text-xs text-emerald-100 leading-relaxed max-w-xl">
                                      Click below to create the active execution project with all customer details, linked quotations ({formatCurrency(totalDealAmount)}), and transferred payment receipts.
                                    </p>
                                  </div>
                                  <Button
                                    size="md"
                                    variant="primary"
                                    onClick={handleConvertToProject}
                                    disabled={isConverting}
                                    className="bg-white hover:bg-emerald-50 text-emerald-950 font-bold px-5 py-2.5 h-10 shrink-0 shadow-lg cursor-pointer flex items-center gap-2 border border-white transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                  >
                                    <FolderKanban className="w-4 h-4 text-emerald-800" />
                                    {isConverting ? "Creating Project..." : "Convert Lead to Project →"}
                                  </Button>
                                </div>
                              ) : (
                                <div className="p-3.5 bg-emerald-100 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0">
                                      <Check className="w-4 h-4 stroke-[3]" />
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold text-emerald-950">
                                        Project Created: {lead.project.referenceNo} — {lead.project.title}
                                      </div>
                                      <div className="text-[11px] text-emerald-800">
                                        Active Interior Execution Project linked with contract value {formatCurrency(lead.project.contractValue || totalDealAmount)}.
                                      </div>
                                    </div>
                                  </div>
                                  {onOpenProject ? (
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => onOpenProject(lead.project.id)}
                                      className="text-xs py-1.5 h-8 bg-emerald-800 hover:bg-emerald-900 text-white font-bold gap-1.5 cursor-pointer shrink-0"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" /> Open Project {lead.project.referenceNo}
                                    </Button>
                                  ) : (
                                    <Link href={`/projects?id=${lead.project.id}`}>
                                      <Button size="sm" variant="primary" className="text-xs py-1.5 h-8 bg-emerald-800 hover:bg-emerald-900 text-white font-bold gap-1.5 cursor-pointer shrink-0">
                                        <ExternalLink className="w-3.5 h-3.5" /> Open Project {lead.project.referenceNo}
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              )
                            )}

                            {/* Master Deal Quotation Baseline */}
                            <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <FileText className="w-4 h-4 text-emerald-700" />
                                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Master Deal Quotation:
                                  </span>
                                  {finalizedQuotation ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                      ✓ {finalizedQuotation.referenceNo} (Rev {finalizedQuotation.revision || 1}) • {formatCurrency(finalizedQuotation.totalAmount)}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                      ⚠️ No Master Quotation Linked
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {finalizedQuotation && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setActiveTab("quotation");
                                        setActiveQuotationId(finalizedQuotation.id);
                                        setQuotationStudioType((finalizedQuotation.quotationType as QuotationType) || "LEAD");
                                        setIsQuotationStudioOpen(true);
                                      }}
                                      className="text-[11px] py-1 h-6 bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-bold gap-1 cursor-pointer"
                                    >
                                      <Eye className="w-3 h-3" /> View Master Quotation
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setIsManualQuoteInputOpen(!isManualQuoteInputOpen)}
                                    className="text-[11px] py-1 h-6 text-indigo-700 hover:bg-indigo-50 font-bold gap-1 cursor-pointer"
                                  >
                                    <Link2 className="w-3 h-3" /> {isManualQuoteInputOpen ? "Close Switcher" : "Switch Quotation"}
                                  </Button>
                                </div>
                              </div>

                              {isManualQuoteInputOpen && (
                                <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-200 space-y-1.5 text-xs">
                                  <label className="text-[11px] font-bold text-indigo-950 block">
                                    Select Master Quotation Baseline ({lead?.quotations?.length || 0})
                                  </label>
                                  <div className="flex items-center gap-2">
                                    {lead?.quotations && lead.quotations.length > 0 ? (
                                      <select
                                        value={finalizedQuotation?.id || ""}
                                        onChange={(e) => {
                                          const qId = e.target.value;
                                          setAttachedQuotationId(qId);
                                          const found = lead.quotations.find((q: any) => q.id === qId);
                                          if (found) {
                                            toast.success("Quotation Selected", `Switched to quotation ${found.referenceNo} (${formatCurrency(found.totalAmount)})`);
                                          }
                                        }}
                                        className="flex-1 h-8 px-2 text-xs font-medium bg-white border border-indigo-300 rounded-md focus:ring-1 focus:ring-indigo-500 text-slate-900 cursor-pointer"
                                      >
                                        {lead.quotations.map((q: any) => (
                                          <option key={q.id} value={q.id}>
                                            {q.referenceNo} (Rev {q.revision || 1}) • {q.title || "Quotation"} • {formatCurrency(q.totalAmount)} • [{q.status}]
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span className="text-[11px] text-slate-500 italic">No quotations available for this lead yet.</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Financial Summary: Total Finalised Deal - Paid Amount Total = Remaining Balance Due */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* 1. Total Finalised Deal */}
                              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                      Total Finalised Deal
                                    </span>
                                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                                  </div>
                                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                                    {formatCurrency(totalDealAmount)}
                                  </div>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1 truncate font-medium border-t border-slate-100 pt-1">
                                  {finalizedQuotation
                                    ? `${finalizedQuotation.referenceNo} (Rev ${finalizedQuotation.revision || 1}) • Baseline`
                                    : "Based on estimated lead budget"}
                                </div>
                              </div>

                              {/* 2. Paid Amount Total */}
                              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                      {hasRecordedPayments ? "Paid Amount Total" : "Confirmed Payments"}
                                      {!hasRecordedPayments && enteringPaymentAmount > 0 && (
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold animate-pulse">
                                          LIVE
                                        </span>
                                      )}
                                    </span>
                                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                  </div>
                                  <div className="text-base font-bold font-mono text-emerald-700 mt-1 flex items-baseline gap-1.5">
                                    <span>{formatCurrency(displayPaidAmount)}</span>
                                    {displayPaidAmount > 0 && (
                                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                        {paidPercentage}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-[10px] text-slate-600 mt-1 font-medium border-t border-slate-100 pt-1 truncate">
                                  {hasRecordedPayments
                                    ? `✓ ${allRecordedPayments.length || 1} payment receipt(s) recorded`
                                    : enteringPaymentAmount > 0
                                    ? `Live: ${formatCurrency(enteringPaymentAmount)} entering now`
                                    : "No advance payment recorded yet"}
                                </div>
                              </div>

                              {/* 3. Remaining Balance Due */}
                              <div className="p-3.5 rounded-xl border shadow-2xs flex flex-col justify-between bg-gradient-to-br from-amber-50/60 to-amber-50/20 border-amber-200">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                                      Remaining Balance Due
                                    </span>
                                    <Calculator className="w-3.5 h-3.5 text-amber-700" />
                                  </div>
                                  <div className="text-base font-bold font-mono text-amber-900 mt-1">
                                    {formatCurrency(displayRemainingBalance)}
                                  </div>
                                </div>
                                <div className="text-[10px] text-amber-800/90 mt-1 font-medium border-t border-amber-200/60 pt-1 truncate">
                                  {displayRemainingBalance === 0 && totalDealAmount > 0
                                    ? "✓ Fully Settled (100%)"
                                    : "Pending project milestone balance"}
                                </div>
                              </div>
                            </div>

                            {/* Section A: Attached Payment Invoices & Receipts (When Payments are Recorded) */}
                            {hasRecordedPayments && (
                              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2.5">
                                  <div className="flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-emerald-700" />
                                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                                      Attached Generated Invoices & Payment Receipts
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      {allRecordedPayments.length || 1} Recorded
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-500">
                                    Invoices generated for each payment transaction recorded against the deal
                                  </span>
                                </div>

                                <div className="space-y-2.5">
                                  {allRecordedPayments.length > 0 ? (
                                    allRecordedPayments.map((payment: any, index: number) => {
                                      const invMatch = payment.notes?.match(/\[Invoice:\s*([^\]]+)\]/i);
                                      const displayedInvRef = payment.gstInvoice?.invoiceNo
                                        || (invMatch ? invMatch[1].trim() : null)
                                        || (payment.referenceNoExt && payment.referenceNoExt.startsWith("INV") ? payment.referenceNoExt : null)
                                        || payment.referenceNo
                                        || `INV-${index + 1}`;

                                      const paymentDateFormatted = payment.paymentDate
                                        ? new Date(payment.paymentDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })
                                        : "Recent";

                                      const cleanNotes = payment.notes ? payment.notes.replace(/\[Invoice:[^\]]+\]/g, "").trim() : "";
                                      const invoiceId = payment.gstInvoiceId || payment.gstInvoice?.id;

                                      return (
                                        <div
                                          key={payment.id || index}
                                          className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-slate-50/80 hover:bg-emerald-50/40 transition-colors rounded-xl border border-slate-200 text-xs"
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0 font-bold text-xs mt-0.5">
                                              #{index + 1}
                                            </div>
                                            <div className="space-y-0.5">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono font-bold text-emerald-950 text-xs">
                                                  {displayedInvRef}
                                                </span>
                                                <Badge variant="completed" className="text-[10px] py-0 px-1.5 font-bold">
                                                  ✓ {payment.status || "PAID"}
                                                </Badge>
                                                <span className="text-[11px] text-slate-500 font-medium">
                                                  • {paymentDateFormatted}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                                                <span className="font-medium">Mode: <strong className="text-slate-800">{payment.paymentMethod || "UPI"}</strong></span>
                                                {payment.referenceNoExt && (
                                                  <span>(Ref: <code className="font-mono text-slate-700">{payment.referenceNoExt}</code>)</span>
                                                )}
                                                {cleanNotes && (
                                                  <span className="text-slate-500 italic">• {cleanNotes}</span>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                                            <div className="text-right">
                                              <div className="text-[10px] text-slate-500 uppercase font-semibold">Payment Amount</div>
                                              <div className="font-mono font-bold text-sm text-emerald-700">
                                                {formatCurrency(payment.amount)}
                                              </div>
                                            </div>

                                             <div className="flex items-center gap-1.5">
                                               {invoiceId ? (
                                                 <>
                                                   <Button
                                                     size="sm"
                                                     variant="outline"
                                                     onClick={() => {
                                                       const targetQuoteId = payment.quotationId || finalizedQuotation?.id || (allQuotes.length > 0 ? allQuotes[0].id : null);
                                                        if (targetQuoteId) {
                                                          router.push(`/quotations/${targetQuoteId}?invoiceId=${invoiceId}&mode=INVOICE&amount=${encodeURIComponent(payment.amount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(payment.paymentMethod || 'UPI')}&ref=${encodeURIComponent(displayedInvRef)}&notes=${encodeURIComponent(cleanNotes || payment.notes || '')}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}&leadId=${leadId}&step=9&readOnly=true`);
                                                        } else {
                                                          router.push(`/quotations/new?mode=INVOICE&invoiceId=${invoiceId}&leadId=${leadId}&amount=${encodeURIComponent(payment.amount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(payment.paymentMethod || 'UPI')}&ref=${encodeURIComponent(displayedInvRef)}&notes=${encodeURIComponent(cleanNotes || payment.notes || '')}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}&readOnly=true`);
                                                        }
                                                     }}
                                                     className="text-[11px] py-1 h-7 bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-bold gap-1 cursor-pointer"
                                                     title="Open Generated Tax Invoice in Quotation Studio"
                                                   >
                                                     <Eye className="w-3.5 h-3.5 text-amber-700" />
                                                     View Invoice
                                                   </Button>
                                                   </>
                                               ) : (
                                                 <Button
                                                   size="sm"
                                                   variant="outline"
                                                   onClick={() => {
                                                     const targetQuoteId = finalizedQuotation?.id || (allQuotes[0]?.id);
                                                     if (targetQuoteId) {
                                                       router.push(`/quotations/${targetQuoteId}?mode=INVOICE&amount=${encodeURIComponent(payment.amount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(payment.paymentMethod || 'UPI')}&ref=${encodeURIComponent(displayedInvRef)}&notes=${encodeURIComponent(cleanNotes || payment.notes || '')}&title=${encodeURIComponent('TAX INVOICE / PAYMENT RECEIPT')}`);
                                                     } else {
                                                       router.push(`/quotations/new?mode=INVOICE&leadId=${leadId}&amount=${encodeURIComponent(payment.amount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(payment.paymentMethod || 'UPI')}&ref=${encodeURIComponent(displayedInvRef)}&notes=${encodeURIComponent(cleanNotes || payment.notes || '')}&title=${encodeURIComponent('TAX INVOICE / PAYMENT RECEIPT')}`);
                                                     }
                                                   }}
                                                   className="text-[11px] py-1 h-7 bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-bold gap-1 cursor-pointer"
                                                 >
                                                   <Eye className="w-3.5 h-3.5 text-amber-700" />
                                                   View Invoice
                                                 </Button>
                                               )}
                                               <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={isDeletingPaymentId === payment.id}
                                                onClick={() => handleDeleteRecordedPayment(payment.id, invoiceId, displayedInvRef)}
                                                className="text-[11px] py-1 h-7 bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-400 font-bold cursor-pointer transition-colors"
                                                title="Delete this payment record and restore deal balance"
                                              >
                                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    /* Single confirmation fee optimistic row */
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0 font-bold text-xs">
                                          #1
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-emerald-950 text-xs">
                                              {generatedInvoiceRef || "INV-CONFIRMED"}
                                            </span>
                                            <Badge variant="completed" className="text-[10px] py-0 px-1.5 font-bold">✓ PAID</Badge>
                                          </div>
                                          <div className="text-[11px] text-slate-600">
                                            {confirmationFeeType} {confirmationFeeRef ? `(${confirmationFeeRef})` : ""} • Booking Confirmation Advance
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                                        <div className="text-right">
                                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Payment Amount</div>
                                          <div className="font-mono font-bold text-sm text-emerald-700">
                                            {formatCurrency(totalPaidAmount)}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              if (generatedInvoiceId && generatedInvoiceId.length > 10) {
                                                window.open(`/api/v1/invoices/${generatedInvoiceId}/pdf`, '_blank');
                                              } else if (finalizedQuotation) {
                                                router.push(`/quotations/${finalizedQuotation.id}?mode=INVOICE&amount=${encodeURIComponent(totalPaidAmount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(confirmationFeeType)}&ref=${encodeURIComponent(generatedInvoiceRef || confirmationFeeRef || 'INV-CONFIRMED')}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}`);
                                              } else {
                                                router.push(`/quotations/new?mode=INVOICE&leadId=${leadId}&amount=${encodeURIComponent(totalPaidAmount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(confirmationFeeType)}&ref=${encodeURIComponent(generatedInvoiceRef || confirmationFeeRef || 'INV-CONFIRMED')}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}`);
                                              }
                                            }}
                                            className="text-[11px] py-1 h-7 bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 font-bold gap-1 cursor-pointer"
                                          >
                                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                            👁 View Invoice
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              setIsFeePaid(false);
                                              setGeneratedInvoiceRef(null);
                                              setGeneratedInvoiceId(null);
                                              toast.success("Payment Cleared", "Booking confirmation entry cleared.");
                                            }}
                                            className="text-[11px] py-1 h-7 bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-400 font-bold cursor-pointer transition-colors"
                                            title="Clear this unverified entry"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                                    <span className="text-xs font-semibold text-emerald-900">
                                      Booking confirmation secured. Ready to convert lead into active execution project.
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 ml-auto">
                                    {!lead?.project ? (
                                      <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={handleConvertToProject}
                                        disabled={isConverting}
                                        className="text-xs py-1.5 h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer gap-1.5 shadow-2xs"
                                      >
                                        <FolderKanban className="w-4 h-4" />
                                        {isConverting ? "Creating Project..." : "Convert to Project →"}
                                      </Button>
                                    ) : (
                                      onOpenProject ? (
                                        <Button
                                          size="sm"
                                          variant="primary"
                                          onClick={() => onOpenProject(lead.project.id)}
                                          className="text-xs py-1.5 h-8 bg-emerald-800 text-white font-bold gap-1.5"
                                        >
                                          <ExternalLink className="w-4 h-4" /> Open Project {lead.project.referenceNo}
                                        </Button>
                                      ) : (
                                        <Link href={`/projects?id=${lead.project.id}`}>
                                          <Button size="sm" variant="primary" className="text-xs py-1.5 h-8 bg-emerald-800 text-white font-bold gap-1.5">
                                            <ExternalLink className="w-4 h-4" /> Open Project {lead.project.referenceNo}
                                          </Button>
                                        </Link>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Section B: Payment Recording & Invoice Attachment Form (One-Time Booking Confirmation Fee) */}
                            {!hasRecordedPayments && (
                              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-3.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                                    Record Booking Confirmation Advance &amp; Generate Invoice
                                  </span>
                                  <span className="text-[11px] text-emerald-700 font-medium">
                                    Quotation deal balance will be locked and converted to active project
                                  </span>
                                </div>

                                {/* Quick Percentage Presets */}
                                {totalDealAmount > 0 && (
                                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
                                    <span className="text-[11px] font-bold text-slate-600 mr-1">Quick Presets:</span>
                                    {[
                                      { label: "10%", pct: 0.10 },
                                      { label: "20%", pct: 0.20 },
                                      { label: "25%", pct: 0.25 },
                                      { label: "50%", pct: 0.50 },
                                      { label: "Full Deal (100%)", pct: 1.00 },
                                    ].map((item) => {
                                      const calcVal = Math.round(totalDealAmount * item.pct);
                                      const isSelected = parseFloat(confirmationFeeAmount) === calcVal && calcVal > 0;
                                      return (
                                        <button
                                          key={item.label}
                                          type="button"
                                          onClick={() => {
                                            setConfirmationFeeAmount(String(calcVal));
                                          }}
                                          className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border transition-all cursor-pointer ${
                                            isSelected
                                              ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                              : "bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200 hover:border-emerald-300"
                                          }`}
                                        >
                                          {item.label} <span className="font-mono text-[10px] opacity-85">({formatCurrency(calcVal)})</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                      Payment Amount (₹) <span className="text-rose-600">*</span>
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max={remainingBalanceAmount > 0 ? remainingBalanceAmount : undefined}
                                      placeholder="e.g. 50000"
                                      value={confirmationFeeAmount}
                                      onChange={(e) => setConfirmationFeeAmount(e.target.value)}
                                      className="w-full h-8 px-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-900"
                                    />
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="text-[11px] font-bold text-slate-700">Invoice #</label>
                                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                        ⚡ Auto-generated on save
                                      </span>
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="Auto-assigned (e.g. INV-2026-0001)"
                                      value={confirmationFeeInvoiceNo}
                                      onChange={(e) => setConfirmationFeeInvoiceNo(e.target.value)}
                                      className="w-full h-8 px-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
                                      title="Leave blank to automatically assign the next sequential invoice number"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Payment Mode</label>
                                    <select
                                      value={confirmationFeeType}
                                      onChange={(e) => setConfirmationFeeType(e.target.value)}
                                      className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 text-slate-900 cursor-pointer"
                                    >
                                      <option value="UPI">UPI / GPay / PhonePe</option>
                                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                                      <option value="CREDIT_CARD">Credit / Debit Card</option>
                                      <option value="CHEQUE">Cheque</option>
                                      <option value="CASH">Cash</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Transaction Ref / UTR</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. UPI-9283748291"
                                      value={confirmationFeeRef}
                                      onChange={(e) => setConfirmationFeeRef(e.target.value)}
                                      className="w-full h-8 px-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-900"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Payment Date</label>
                                    <input
                                      type="date"
                                      value={confirmationFeeDate}
                                      onChange={(e) => setConfirmationFeeDate(e.target.value)}
                                      className="w-full h-8 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-900"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Notes / Milestone Name</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Booking Advance Payment"
                                      value={confirmationFeeNotes}
                                      onChange={(e) => setConfirmationFeeNotes(e.target.value)}
                                      className="w-full h-8 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-900"
                                    />
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                                        📅 Handover Target Date
                                      </label>
                                      <span className="text-[10px] text-emerald-600 font-semibold">
                                        Links to Calendar
                                      </span>
                                    </div>
                                    <input
                                      type="date"
                                      value={confirmationFeeHandoverDate}
                                      onChange={(e) => setConfirmationFeeHandoverDate(e.target.value)}
                                      className="w-full h-8 px-2.5 text-xs font-semibold bg-emerald-50/50 border border-emerald-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:bg-white text-emerald-950"
                                    />
                                  </div>
                                </div>

                                {enteringPaymentAmount > 0 && (
                                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-300 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                      <span className="text-slate-700 font-medium">
                                        Deal Total: <strong className="font-mono text-slate-900">{formatCurrency(totalDealAmount)}</strong>
                                        {recordedPaidAmount > 0 && (
                                          <span> − Prev: <strong className="font-mono text-emerald-800">{formatCurrency(recordedPaidAmount)}</strong></span>
                                        )}
                                        <span> − Payment: <strong className="font-mono text-emerald-700">{formatCurrency(enteringPaymentAmount)}</strong></span>
                                      </span>
                                    </div>
                                    <span className="font-bold text-amber-950 font-mono bg-amber-100/90 px-2.5 py-1 rounded-md border border-amber-300">
                                      = {formatCurrency(displayRemainingBalance)} Remaining Due
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleRecordConfirmationFeePayment}
                                    disabled={isRecordingFee || !confirmationFeeAmount || parseFloat(confirmationFeeAmount) <= 0}
                                    className="text-xs py-1.5 h-8 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 font-bold gap-1.5 cursor-pointer"
                                    title="Instantly generate and record payment without opening editor"
                                  >
                                    <Receipt className="w-3.5 h-3.5 text-slate-500" />
                                    {isRecordingFee ? "Generating..." : "Quick Record & Generate"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => {
                                      const targetQuoteId = finalizedQuotation?.id;
                                      const invNo = confirmationFeeInvoiceNo.trim() || undefined;
                                      const hDateParam = confirmationFeeHandoverDate ? `&handoverDate=${encodeURIComponent(confirmationFeeHandoverDate)}` : '';
                                      const studioUrl = targetQuoteId
                                        ? `/quotations/${targetQuoteId}?mode=INVOICE&amount=${encodeURIComponent(confirmationFeeAmount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(confirmationFeeType)}${invNo ? `&ref=${encodeURIComponent(invNo)}` : ''}&notes=${encodeURIComponent(confirmationFeeNotes)}&leadId=${leadId}&returnToLead=${leadId}&paymentDate=${encodeURIComponent(confirmationFeeDate)}${hDateParam}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}`
                                        : `/quotations/new?mode=INVOICE&leadId=${leadId}&returnToLead=${leadId}&amount=${encodeURIComponent(confirmationFeeAmount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(confirmationFeeType)}${invNo ? `&ref=${encodeURIComponent(invNo)}` : ''}&notes=${encodeURIComponent(confirmationFeeNotes)}&paymentDate=${encodeURIComponent(confirmationFeeDate)}${hDateParam}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}`;
                                      router.push(studioUrl);
                                    }}
                                    disabled={!confirmationFeeAmount || parseFloat(confirmationFeeAmount) <= 0}
                                    className="text-xs py-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-2xs cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    ⚡ Verify &amp; Generate Invoice in Studio ↗
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
                        <div key={f.id} className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold text-charcoal flex items-center gap-2">
                              <span>{formatDate(f.followUpDate)}</span>
                              <Badge variant={f.status === "COMPLETED" ? "completed" : f.status === "SKIPPED" ? "neutral" : "active"}>
                                {f.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-walnut mt-1">{f.notes}</div>
                            {f.outcomeNotes && (
                              <div className="text-[11px] text-emerald-700 mt-1 font-medium">Outcome: {f.outcomeNotes}</div>
                            )}
                          </div>
                          {f.status === "PENDING" && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSkipFollowUp(f.id)}
                                className="text-xs py-1 h-7 text-slate-600 border-slate-300 hover:bg-slate-100"
                                title="Skip this follow-up"
                              >
                                ↷ Skip
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCompletingFollowUpId(f.id)}
                                className="text-xs py-1 h-7 bg-emerald-50 text-emerald-700 border-emerald-300 font-bold"
                              >
                                Mark Done
                              </Button>
                            </div>
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
                  {isQuotationStudioOpen ? (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Top Action Bar for Studio Mode */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-walnut/20 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsQuotationStudioOpen(false);
                              setActiveQuotationId(null);
                              fetchLeadDetails();
                            }}
                            className="text-xs py-1.5 h-8 gap-1.5 font-bold hover:bg-gold/10 text-charcoal border-walnut/30"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Quotation List
                          </Button>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${quotationStudioType === 'MATERIAL' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-50 text-emerald-800 border border-emerald-300'}`}>
                            {quotationStudioType === 'MATERIAL' ? 'Material Quotation Studio' : 'Lead Interior Quotation Studio'}
                          </span>
                          <span className="text-walnut/40 hidden sm:inline">•</span>
                          <span className="text-charcoal hidden sm:inline font-mono text-xs">
                            {lead?.clientName || "Lead"} ({lead?.referenceNo || leadId})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleCompleteQuotationAndLink()}
                            className="text-xs py-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Complete &amp; Link to Lead (Step 7)
                          </Button>
                        </div>
                      </div>

                      {/* Full Embedded Quotation Generator Studio */}
                      <div className="bg-white rounded-xl border border-walnut/20 shadow-xs p-2 sm:p-4 overflow-hidden">
                        <QuotationGeneratorStudio
                          quotationId={activeQuotationId || undefined}
                          leadId={leadId || undefined}
                          initialQuotationType={quotationStudioType}
                          initialInvoice={{
                            ...(leadId ? { leadId } : {}),
                          }}
                          onSaveComplete={async () => {
                            await fetchLeadDetails();
                            onUpdate();
                            if (
                              lead?.stage === "QUOTATION_IN_PROGRESS" ||
                              lead?.stage === "SITE_VISIT_COMPLETED" ||
                              lead?.stage === "CONTACTED" ||
                              lead?.stage === "NEW" ||
                              lead?.stage === "NOT_CONTACTED" ||
                              lead?.stage === "FOLLOW_UP_SCHEDULED" ||
                              lead?.stage === "SITE_VISIT_SCHEDULED"
                            ) {
                              await handleStageChange("QUOTATION_SENT");
                            }
                            toast.success("Quotation Saved & Linked", "Quotation synchronized with Lead and linked to Step 7 (Quotation Sent).");
                          }}
                          onBack={() => {
                            setIsQuotationStudioOpen(false);
                            setActiveQuotationId(null);
                            fetchLeadDetails();
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-walnut uppercase tracking-wider">
                            Generated Quotations ({lead?.quotations?.length || 0})
                          </h3>
                          <p className="text-[11px] text-walnut/70">
                            Select any generated quotation to view and edit in Studio, export PDF, or dispatch via WhatsApp.
                          </p>
                        </div>
                        {(!lead?.stage || (lead.stage !== "WON" && lead.stage !== "PROJECT_CREATED" && !lead.project)) && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/quotations/new?type=MATERIAL&leadId=${leadId}&step=7`)}
                              className="text-xs py-1 h-7 border-gold text-charcoal hover:bg-gold/10 font-bold cursor-pointer"
                            >
                              <Plus className="w-3 h-3 mr-1" /> Material Quotation
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => router.push(`/quotations/new?type=LEAD&leadId=${leadId}&step=7`)}
                              className="text-xs py-1 h-7 bg-gold text-charcoal hover:bg-gold/90 font-bold shadow-2xs cursor-pointer"
                            >
                              <Plus className="w-3 h-3 mr-1" /> Lead Quotation
                            </Button>
                          </div>
                        )}
                      </div>

                      {lead?.quotations && lead.quotations.length > 0 ? (
                        <div className="space-y-3">
                          {lead.quotations.map((q: any) => {
                            const isWonLead = lead?.stage === "WON" || lead?.stage === "PROJECT_CREATED" || !!lead?.project;
                            const qType = q.quotationType || (q.notes?.toLowerCase().includes('material') || q.title?.toLowerCase().includes('material') ? 'MATERIAL' : 'LEAD');
                            const isMat = qType === 'MATERIAL';

                            const handleShareWhatsApp = (e: React.MouseEvent) => {
                              e.stopPropagation();
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

                            const handleOpenQuotation = () => {
                              if (isWonLead) {
                                router.push(`/quotations/${q.id}?readOnly=true&leadId=${lead.id}&step=7`);
                              } else {
                                router.push(`/quotations/${q.id}?leadId=${lead.id}&step=7`);
                              }
                            };

                            return (
                              <div
                                key={q.id}
                                onClick={handleOpenQuotation}
                                className={`p-4 rounded-xl border shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${isWonLead ? 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-500' : 'bg-white border-walnut/20 hover:border-gold/60'}`}
                              >
                                <div className="space-y-1">
                                  <div className="text-xs font-bold text-charcoal font-mono flex items-center gap-2 flex-wrap">
                                    <span className="group-hover:text-gold transition-colors">{q.referenceNo} (Rev {q.revision || 1})</span>
                                    {isWonLead ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                        🔒 FINALIZED &amp; LOCKED
                                      </span>
                                    ) : (
                                      <Badge variant={q.status === "APPROVED" || q.status === "ACCEPTED" ? "completed" : q.status === "SENT" ? "active" : "neutral"}>
                                        {q.status}
                                      </Badge>
                                    )}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${isMat ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-300'}`}>
                                      {isMat ? 'Material Quote' : 'Lead Quote'}
                                    </span>
                                  </div>
                                  <div className="text-sm font-bold text-emerald-700 font-mono">
                                    {formatCurrency(q.totalAmount)}
                                  </div>
                                  <div className="text-[11px] text-walnut flex items-center gap-3">
                                    <span>{q.customTitle || q.title || "Quotation Estimation"}</span>
                                    {q.createdAt && <span>• Created: {formatDate(q.createdAt)}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={handleShareWhatsApp}
                                    title="Send Quotation via WhatsApp"
                                    className="px-2.5 py-1 text-xs font-medium rounded-md border border-emerald-400 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    WhatsApp
                                  </button>
                                  <a
                                    href={`/api/v1/quotations/${q.id}/pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 text-xs font-medium rounded-md border border-walnut/30 text-charcoal hover:bg-cream/40 flex items-center gap-1 transition-colors"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-walnut" />
                                    PDF
                                  </a>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleOpenQuotation}
                                    className={`text-xs py-1 h-7 font-bold hover:bg-gold/10 text-charcoal border-walnut/30 cursor-pointer ${isWonLead ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white group-hover:border-gold'}`}
                                  >
                                    {isWonLead ? "👁 View Finalized Quotation" : "Open in Studio ↗"}
                                  </Button>
                                  {!isWonLead && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteQuotation(q.id, q.referenceNo)}
                                      disabled={isDeletingQuotation === q.id}
                                      isLoading={isDeletingQuotation === q.id}
                                      title="Delete Quotation"
                                      className="text-xs py-1 h-7 text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 px-2 font-bold cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-600" />
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15 space-y-3">
                          <p>No quotations generated for this lead yet.</p>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setQuotationStudioType("LEAD");
                              setActiveQuotationId(null);
                              setIsQuotationStudioOpen(true);
                            }}
                            className="text-xs bg-gold text-charcoal font-bold hover:bg-gold/90 cursor-pointer"
                          >
                            + Generate Quotation Now
                          </Button>
                        </div>
                      )}
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

              {/* TAB 8: AUDIT TRAIL */}
              {activeTab === "audit" && (
                <EntityAuditSection
                  entityType="Lead"
                  entityId={leadId}
                  entityReferenceNo={lead?.referenceNo}
                  entityTitle={lead?.clientName}
                />
              )}
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
            <ClockTimePicker
              value={followUpTime}
              onChange={(val) => setFollowUpTime(val)}
              placeholder="Select follow-up time"
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
            <ClockTimePicker
              value={visitTime}
              onChange={(val) => setVisitTime(val)}
              placeholder="Select visit time"
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
      <Modal
        isOpen={!!completingSiteVisitId}
        onClose={() => setCompletingSiteVisitId(null)}
        title="Record Site Visit Outcome & Measurements"
        description="Site measurement & assessment notes are mandatory to mark the site visit as completed."
        maxWidth="md"
      >
        <form onSubmit={handleCompleteSiteVisit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-charcoal mb-1">
              Site Measurement & Assessment Notes <span className="text-rose-600 font-bold">* (Mandatory)</span>
            </label>
            <p className="text-[11px] text-walnut/70 mb-2">
              Record spatial dimensions, civil checks, material specifications discussed, or client design preferences.
            </p>
            <textarea
              placeholder="e.g. 3BHK spatial measurements recorded: Living 18x14, Kitchen 12x10. Client requested modular acrylic finish with false ceiling cove lighting. Civil work is ready for execution."
              value={visitOutcomeNotes}
              onChange={(e) => setVisitOutcomeNotes(e.target.value)}
              className="w-full text-xs p-3 border border-walnut/20 rounded-md bg-white focus:ring-2 focus:ring-emerald-500 min-h-[110px]"
              rows={4}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-walnut/10">
            <Button size="sm" variant="outline" type="button" onClick={() => setCompletingSiteVisitId(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              isLoading={isCompletingSiteVisit}
              disabled={!visitOutcomeNotes.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              ✓ Complete Site Visit & Save Notes
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

      {/* Edit Lead Details Modal */}
      <LeadFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialLead={lead}
        onSuccess={() => {
          fetchLeadDetails();
          onUpdate();
        }}
      />

      {/* Delete Lead Authorization Modal */}
      <DeleteLeadModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => {
          setIsDeleteModalOpen(false);
          onClose();
          onUpdate();
        }}
        initialLeadId={lead?.id}
      />


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

      {/* Material Lead Pipeline Modals */}
      <ContactStatusModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        materialLead={lead}
        initialStatus={contactModalInitialStatus}
        onStatusUpdated={() => {
          fetchLeadDetails();
          onUpdate();
        }}
      />

      <PlaceMaterialOrderModal
        isOpen={isPlaceOrderModalOpen}
        onClose={() => setIsPlaceOrderModalOpen(false)}
        materialLead={lead}
        onOrderPlaced={() => {
          fetchLeadDetails();
          onUpdate();
        }}
      />

      <VendorResponseModal
        isOpen={isVendorResponseModalOpen}
        onClose={() => setIsVendorResponseModalOpen(false)}
        materialLead={lead}
        mode={vendorResponseMode}
        onResponseSubmitted={() => {
          fetchLeadDetails();
          onUpdate();
        }}
      />
    </div>
  );
};
