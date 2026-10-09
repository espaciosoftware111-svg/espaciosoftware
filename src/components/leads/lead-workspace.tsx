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
import { PriorityBadge } from "@/components/ui/priority-badge";

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
  Users,
  Handshake,
  Layers,
  Globe,
  ArrowLeft,
  Printer,
  CheckSquare,
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

  const getStageDisplay = (stage?: string) => {
    switch (stage) {
      case "NEW":
        return { emoji: "🆕", label: "New Lead" };
      case "NOT_CONTACTED":
        return { emoji: "⏳", label: "Not Contacted" };
      case "CONTACTED":
        return { emoji: "💬", label: "Contacted" };
      case "FOLLOW_UP_SCHEDULED":
        return { emoji: "📅", label: "Follow-up" };
      case "SITE_VISIT_SCHEDULED":
        return { emoji: "📍", label: "Visit Scheduled" };
      case "SITE_VISIT_COMPLETED":
        return { emoji: "✅", label: "Visit Completed" };
      case "QUOTATION_IN_PROGRESS":
        return { emoji: "📝", label: "Quotation in Progress" };
      case "QUOTATION_SENT":
      case "ESTIMATE_SENT":
        return { emoji: "📤", label: "Quotation Sent" };
      case "NEGOTIATION":
        return { emoji: "🤝", label: "Negotiation" };
      case "WON":
        return { emoji: "🎉", label: "Won" };
      case "PROJECT_CREATED":
        return { emoji: "📄", label: "Project Created" };
      case "LOST":
        return { emoji: "❌", label: "Lost" };
      default:
        return { emoji: "🏷️", label: stage ? stage.replace(/_/g, " ") : "Active" };
    }
  };

  const getSourceBadge = (source?: string) => {
    const s = (source || "WEBSITE").replace(/^OTHER:/i, "").replace(/_/g, " ").toUpperCase();
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F3EEE5] text-[#77716A] border border-[#E8E2D8] tracking-wider uppercase select-none">
        {s}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end select-none">
      {/* Subtle Darkened Overlay */}
      <div
        className="fixed inset-0 bg-[#242321]/35 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Large Desktop Side Drawer Panel */}
      <div className={`relative w-full ${isQuotationStudioOpen ? "sm:w-[98vw] md:w-[95vw] lg:w-[92vw] max-w-[1700px]" : "sm:w-[85vw] md:w-[68vw] lg:w-[58vw] max-w-6xl"} bg-[#FAF8F5] shadow-2xl border-l border-[#E8E2D8] z-50 flex flex-col h-full min-h-0 animate-in slide-in-from-right duration-250 ease-out transition-all`}>
        
        {/* ========================================================= */}
        {/* 1. LEAD DETAILS PANEL HEADER (Redesigned)                 */}
        {/* ========================================================= */}
        <div className="px-6 py-4.5 border-b border-[#E8E2D8] bg-[#FAF8F5] shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              {/* Row 1: Customer Name + Prominent Lead ID */}
              <div className="flex items-baseline gap-3">
                <h2 className="text-xl font-bold text-[#262421] tracking-tight">
                  {lead?.clientName || "Lead Details"}
                </h2>
                <span className="font-mono text-xs text-[#77716A]">
                  {lead?.referenceNo || "LEAD-..."}
                </span>
              </div>

              {/* Row 2: Source Badge + Priority Badge + Status */}
              <div className="flex items-center gap-2">
                {getSourceBadge(lead?.sourceKey)}
                <PriorityBadge priority={lead?.priority} size="sm" />
                {(() => {
                  const statusInfo = getStageDisplay(lead?.stage);
                  return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#262421]">
                      <span className="text-[13px] leading-none">{statusInfo.emoji}</span>
                      <span>{statusInfo.label}</span>
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Top-Right Close Button */}
            <button
              onClick={onClose}
              className="p-1 -mr-1 rounded-md text-[#77716A] hover:text-[#262421] hover:bg-[#E8E2D8]/50 transition-colors cursor-pointer"
              title="Close panel (Esc)"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Subtle Divider */}
          <div className="my-3.5 border-b border-[#E8E2D8]" />

          {/* Row 3: Direct Contact Icons & Coordinates */}
          <div className="flex flex-wrap items-center gap-5 text-xs text-[#262421]">
            {lead?.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-1.5 font-mono text-[#262421] hover:text-[#89652D] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#77716A]" /> {lead.phone}
              </a>
            )}
            {lead?.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-1.5 text-[#262421] hover:text-[#89652D] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#77716A]" /> {lead.email}
              </a>
            )}
            {lead?.location && (
              <span className="flex items-center gap-1.5 text-[#262421]">
                <MapPin className="w-3.5 h-3.5 text-[#77716A]" /> {lead.location}
              </span>
            )}
            {lead?.clientId && (
              <Link
                href={`/clients?id=${lead.clientId}`}
                className="flex items-center gap-1 text-[#89652D] hover:text-[#6E4F20] font-medium transition-colors ml-auto"
              >
                <UserCheck className="w-3.5 h-3.5" /> Client 360 Profile ↗
              </Link>
            )}
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
        <div className="flex-1 min-h-0 overflow-y-auto p-7 space-y-6 scroll-smooth bg-[#FAF8F5]">
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
                  <div className="space-y-5">
                    {/* CARD A — CUSTOMER INFORMATION */}
                    <div className="bg-[#FFFEFC] p-6 sm:p-7 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-5 hover:border-[#DCD5C9] transition-all">
                      <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EBE1]">
                        <h3 className="text-xs font-bold text-[#262421] uppercase tracking-wider flex items-center gap-2.5">
                          <User className="w-4 h-4 text-[#B18A4D]" /> Section A — Customer Information
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openEditModal}
                          className="h-7 px-3 text-xs font-medium text-[#77716A] bg-[#FAF8F5] border border-[#E8E2D8] hover:text-[#262421] hover:bg-[#F3EEE5] rounded-md transition-colors"
                        >
                          <Edit2 className="w-3 h-3 mr-1 text-[#77716A]" /> Edit Details
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1 text-xs">
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#77716A] font-semibold uppercase tracking-wider">Customer Full Name</div>
                          <div className="text-sm font-bold text-[#262421]">{lead?.clientName || "N/A"}</div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#77716A] font-semibold uppercase tracking-wider">Phone Number</div>
                          <a
                            href={`tel:${lead?.phone}`}
                            className="font-mono font-bold text-sm text-[#262421] block hover:text-[#B18A4D] transition-colors"
                          >
                            {lead?.phone || "N/A"}
                          </a>
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#77716A] font-semibold uppercase tracking-wider">Email Address</div>
                          {lead?.email ? (
                            <a
                              href={`mailto:${lead?.email}`}
                              className="font-medium text-xs text-[#262421] block hover:text-[#B18A4D] transition-colors truncate"
                            >
                              {lead?.email}
                            </a>
                          ) : (
                            <span className="text-[#A09A90] italic text-xs block">None provided</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CARD B — REQUIREMENT INFORMATION */}
                    <div className="bg-[#FFFEFC] p-6 sm:p-7 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-5 hover:border-[#DCD5C9] transition-all">
                      <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EBE1]">
                        <h3 className="text-xs font-bold text-[#262421] uppercase tracking-wider flex items-center gap-2.5">
                          <Layers className="w-4 h-4 text-[#B18A4D]" /> Section B — Requirement Information
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openEditModal}
                          className="h-7 px-3 text-xs font-medium text-[#77716A] bg-[#FAF8F5] border border-[#E8E2D8] hover:text-[#262421] hover:bg-[#F3EEE5] rounded-md transition-colors"
                        >
                          <Edit2 className="w-3 h-3 mr-1 text-[#77716A]" /> Edit Requirement
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1 text-xs">
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#77716A] font-semibold uppercase tracking-wider">Requirement Type</div>
                          <div className="text-xs font-semibold text-[#262421]">
                            {web?.requirementType || lead?.requirement || "Turnkey Interiors"}
                          </div>
                          {web?.customRequirement && (
                            <span className="text-[10px] text-[#77716A] block font-medium">
                              Custom: {web.customRequirement}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#77716A] font-semibold uppercase tracking-wider">Customer Stage</div>
                          <div className="text-xs font-semibold text-[#B18A4D]">
                            {web?.customerStage || "Ready To Start"}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#77716A] font-semibold uppercase tracking-wider">Budget Target</div>
                          <div className="text-sm font-bold text-[#262421] font-mono">
                            {lead?.estimatedBudget ? formatCurrency(lead.estimatedBudget) : "TBD / Consultation"}
                          </div>
                        </div>
                      </div>

                      {/* Specific Requirements Detail Text */}
                      {(web?.specificRequirements || lead?.notes) && (
                        <div className="pt-4 border-t border-[#F0EBE1] space-y-2">
                          <span className="text-[11px] text-[#77716A] font-semibold uppercase tracking-wider block">
                            Specific Requirements &amp; Design Preferences:
                          </span>
                          <div className="p-4 bg-[#FAF8F5] rounded-lg border border-[#E8E2D8] text-xs text-[#262421] leading-relaxed whitespace-pre-wrap">
                            {web?.specificRequirements || lead?.notes}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CARD C — PROPERTY INFORMATION */}
                    <div className="bg-[#FFFEFC] p-6 sm:p-7 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-5 hover:border-[#DCD5C9] transition-all">
                      <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EBE1]">
                        <h3 className="text-xs font-bold text-[#262421] uppercase tracking-wider flex items-center gap-2.5">
                          <Building2 className="w-4 h-4 text-[#B18A4D]" /> Section C — Property Information
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openEditModal}
                          className="h-7 px-3 text-xs font-medium text-[#77716A] bg-[#FAF8F5] border border-[#E8E2D8] hover:text-[#262421] hover:bg-[#F3EEE5] rounded-md transition-colors"
                        >
                          <Edit2 className="w-3 h-3 mr-1 text-[#77716A]" /> Edit Property
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1 text-xs">
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#77716A] font-semibold uppercase tracking-wider">Property Type</div>
                          <div className="text-xs font-semibold text-[#262421]">
                            {web?.customPropertyType || web?.propertyType || lead?.propertyTypeKey || "Apartment"}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#77716A] font-semibold uppercase tracking-wider">Project Location</div>
                          <div className="text-xs font-semibold text-[#262421] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#B18A4D]" />
                            {lead?.location || web?.projectLocation || "N/A"}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#77716A] font-semibold uppercase tracking-wider">Property Size</div>
                          <div className="text-xs font-semibold text-[#262421]">
                            {web?.propertySize || "Not Specified"}
                          </div>
                        </div>
                      </div>

                      {/* Selected Spaces Badges */}
                      <div className="pt-4 border-t border-[#F0EBE1] space-y-2.5">
                        <span className="text-[11px] text-[#77716A] font-semibold uppercase tracking-wider block">Selected Spaces Scope:</span>
                        <div className="flex flex-wrap gap-2">
                          {spacesList.map((sp: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-3 py-1 rounded-md text-xs font-medium bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8] shadow-2xs"
                            >
                              ✓ {sp}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* CARD D — LEAD MANAGEMENT INFORMATION */}
                    <div className="bg-[#FFFEFC] p-6 sm:p-7 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-5 hover:border-[#DCD5C9] transition-all">
                      <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EBE1]">
                        <h3 className="text-xs font-bold text-[#262421] uppercase tracking-wider flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-[#B18A4D]" /> Section D — Lead Management Information
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openEditModal}
                          className="h-7 px-3 text-xs font-medium text-[#77716A] bg-[#FAF8F5] border border-[#E8E2D8] hover:text-[#262421] hover:bg-[#F3EEE5] rounded-md transition-colors"
                        >
                          <Edit2 className="w-3 h-3 mr-1 text-[#77716A]" /> Edit Assignment
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-1 text-xs">
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#77716A] font-semibold uppercase tracking-wider">Lead ID</div>
                          <div className="font-mono font-semibold text-[#262421] text-xs">{lead?.referenceNo}</div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#77716A] font-semibold uppercase tracking-wider">Lead Source</div>
                          <div>{getSourceBadge(lead?.sourceKey)}</div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#77716A] font-semibold uppercase tracking-wider">Created Date &amp; Time</div>
                          <div className="font-mono text-xs text-[#262421]">
                            {formatDate(lead?.createdAt)}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[11px] text-[#77716A] font-semibold uppercase tracking-wider">Assigned Staff</div>
                          <div className="text-xs font-semibold text-[#262421]">
                            {lead?.assignedTo?.fullName || "Unassigned"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CARD E — ORIGINAL WEBSITE ENQUIRY DATA (Section 13) */}
                    {web && (
                      <div className="bg-[#FAF8F5] p-6 sm:p-7 rounded-xl border border-[#E8E2D8] space-y-4">
                        <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D8]">
                          <h3 className="text-xs font-bold text-[#262421] uppercase tracking-wider flex items-center gap-2.5">
                            <Globe className="w-4 h-4 text-[#B18A4D]" /> Section E — Original Inbound Website Form Data
                          </h3>
                          <span className="text-[10px] font-mono font-semibold text-[#77716A] bg-[#FFFEFC] px-2.5 py-0.5 rounded border border-[#E8E2D8]">
                            Permanent Record
                          </span>
                        </div>
                        <p className="text-xs text-[#77716A]">
                          Original multi-step questionnaire responses captured at the moment of website submission.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs bg-[#FFFEFC] p-5 sm:p-6 rounded-xl border border-[#E8E2D8]">
                          <div className="space-y-1">
                            <span className="text-[10px] text-[#77716A] uppercase tracking-wider block font-bold">Step 1 — Requirement</span>
                            <span className="font-semibold text-xs text-[#262421]">{web.customRequirement || web.requirementType}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-[#77716A] uppercase tracking-wider block font-bold">Step 2 — Property Type</span>
                            <span className="font-semibold text-xs text-[#262421]">{web.customPropertyType || web.propertyType}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-[#77716A] uppercase tracking-wider block font-bold">Step 2 — Location &amp; Size</span>
                            <span className="font-semibold text-xs text-[#262421]">{web.projectLocation} {web.propertySize ? `(${web.propertySize})` : ""}</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-[#77716A] uppercase tracking-wider block font-bold">Step 3 — Customer Stage</span>
                            <span className="font-semibold text-xs text-[#B18A4D]">{web.customerStage}</span>
                          </div>
                          <div className="sm:col-span-2 space-y-1">
                            <span className="text-[10px] text-[#77716A] uppercase tracking-wider block font-bold">Step 4 — Inbound Visitor</span>
                            <span className="font-semibold text-xs text-[#262421]">{lead?.clientName} ({lead?.phone} • {lead?.email || "No Email"})</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CARD F — INTERNAL NOTES & COMPOSER */}
                    <div className="bg-[#FFFEFC] p-6 sm:p-7 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-4 hover:border-[#DCD5C9] transition-all">
                      <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EBE1]">
                        <h3 className="text-xs font-bold text-[#262421] uppercase tracking-wider flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-[#B18A4D]" /> Internal CRM Notes
                        </h3>
                        <button
                          onClick={() => setActiveNoteStage("GENERAL")}
                          className="text-xs font-semibold text-[#B18A4D] hover:text-[#9A7B44] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Note
                        </button>
                      </div>

                      {/* Inline Note Composer */}
                      {activeNoteStage === "GENERAL" && (
                        <div className="p-4 bg-[#FAF8F5] border border-[#B18A4D]/40 rounded-lg space-y-3">
                          <textarea
                            placeholder="Write a private staff note or client update..."
                            value={inlineNoteText}
                            onChange={(e) => setInlineNoteText(e.target.value)}
                            className="w-full text-xs p-3 bg-[#FFFEFC] border border-[#E8E2D8] rounded-lg focus:ring-1 focus:ring-[#B18A4D] focus:border-[#B18A4D] outline-hidden"
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setActiveNoteStage(null)} className="text-xs py-1 h-7.5 bg-[#FFFEFC] border-[#E8E2D8]">
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleAddInlineNote("GENERAL")}
                              disabled={isSubmittingNote || !inlineNoteText.trim()}
                              className="text-xs py-1 h-7.5 bg-[#262421] text-[#FAF8F5] hover:bg-[#383633] font-semibold"
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

                // Helper for date + time display
                const formatDateTime = (dateStr?: string | Date | null): string => {
                  if (!dateStr) return "-";
                  try {
                    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
                    if (isNaN(d.getTime())) return "-";
                    const dateFormatted = new Intl.DateTimeFormat("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(d);
                    const timeFormatted = new Intl.DateTimeFormat("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }).format(d);
                    return `${dateFormatted}, ${timeFormatted}`;
                  } catch {
                    return "-";
                  }
                };

                // Determine stage progression & completion for Standard Leads (6 Stages)
                const hasRecordedPaymentsLead = (lead?.payments && lead.payments.length > 0) || isFeePaid;

                // Stage 1: Lead Created (always completed)
                const isStep1Done = true;

                // Stage 2: Contacted
                const isStep2Done = lead?.stage !== "NEW" && lead?.stage !== "NOT_CONTACTED";

                // Stage 3: Follow-Up
                const isStep3Done =
                  (lead?.followUps && lead.followUps.some((f: any) => f.status === "COMPLETED" || f.status === "SKIPPED")) ||
                  ["SITE_VISIT_SCHEDULED", "SITE_VISIT_COMPLETED", "QUOTATION_IN_PROGRESS", "QUOTATION_SENT", "ESTIMATE_SENT", "NEGOTIATION", "WON", "PROJECT_CREATED"].includes(lead?.stage);

                // Stage 4: Site Visit
                const isStep4Done =
                  (lead?.siteVisits && lead.siteVisits.some((v: any) => v.status === "COMPLETED")) ||
                  ["QUOTATION_IN_PROGRESS", "QUOTATION_SENT", "ESTIMATE_SENT", "NEGOTIATION", "WON", "PROJECT_CREATED"].includes(lead?.stage);

                // Stage 5: Quotation
                const isStep5Done =
                  (lead?.quotations && lead.quotations.some((q: any) => q.status === "SENT" || q.status === "APPROVED" || q.status === "ACCEPTED")) ||
                  ["QUOTATION_SENT", "ESTIMATE_SENT", "NEGOTIATION", "WON", "PROJECT_CREATED"].includes(lead?.stage);

                // Stage 6: Won / Converted
                const isStep6Done = ["WON", "PROJECT_CREATED"].includes(lead?.stage) || !!lead?.project || hasRecordedPaymentsLead;

                // Determine the exact current active stage index (1 to 6)
                let currentStageIndex = 2;
                if (!isStep2Done) {
                  currentStageIndex = 2;
                } else if (!isStep3Done) {
                  currentStageIndex = 3;
                } else if (!isStep4Done) {
                  currentStageIndex = 4;
                } else if (!isStep5Done) {
                  currentStageIndex = 5;
                } else if (!isStep6Done) {
                  currentStageIndex = 6;
                } else {
                  currentStageIndex = 6;
                }

                // Data references for metadata
                const completedSiteVisits = lead?.siteVisits?.filter((v: any) => v.status === "COMPLETED") || [];
                const scheduledSiteVisits = lead?.siteVisits?.filter((v: any) => v.status === "SCHEDULED") || [];
                const latestFollowUp = lead?.followUps && lead.followUps.length > 0 ? lead.followUps[lead.followUps.length - 1] : null;
                const latestSiteVisit = lead?.siteVisits && lead.siteVisits.length > 0 ? lead.siteVisits[lead.siteVisits.length - 1] : null;
                const latestQuotation = lead?.quotations && lead.quotations.length > 0 ? lead.quotations[lead.quotations.length - 1] : null;

                return (
                  <div className="space-y-4">
                    {/* Connected Process Timeline Container */}
                    <div className="relative space-y-4 sm:space-y-5">
                      {/* Continuous Taupe Vertical Connecting Line */}
                      <div className="absolute left-4 top-4 bottom-6 w-[4px] bg-[#C9BBA6] -translate-x-1/2 rounded-full pointer-events-none" />

                      {/* 1. LEAD CREATED */}
                      {(() => {
                        const isDone = isStep1Done;
                        const isCurrent = currentStageIndex === 1 && !isStep2Done;
                        return (
                          <div className="relative flex items-start gap-4 group">
                            {/* Marker */}
                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ring-4 ring-[#F8F6F1] transition-all ${
                              isDone && !isCurrent
                                ? "bg-[#A98955] text-white shadow-2xs"
                                : isCurrent
                                ? "bg-[#A98955] text-white shadow-xs"
                                : "bg-[#EFE9DF] text-[#8C8275] border border-[#DDD5C7]"
                            }`}>
                              {isDone && !isCurrent ? (
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              ) : (
                                <span>1</span>
                              )}
                            </div>

                            {/* Card */}
                            <div className={`flex-1 rounded-xl p-4 sm:p-5 border transition-all ${
                              isCurrent
                                ? "bg-[#F0E7D8] border-[#DFD4C3] shadow-2xs"
                                : "bg-[#FFFEFC] border-[#E8E2D8] shadow-2xs"
                            }`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={`mt-0.5 shrink-0 ${isCurrent ? "text-[#8C6D3B]" : "text-[#77716A]"}`}>
                                    <FileText className="w-5 h-5 stroke-[1.75]" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-[#262421] tracking-wide uppercase">
                                      LEAD CREATED
                                    </h4>
                                    <p className="text-xs text-[#77716A] mt-0.5 leading-relaxed">
                                      Lead registered in the system via <span className="font-semibold text-[#262421]">{lead?.sourceKey || "WEBSITE"}</span> with estimated budget <span className="font-semibold font-mono text-[#262421]">{lead?.estimatedBudget ? formatCurrency(lead.estimatedBudget) : "TBD"}</span>
                                    </p>
                                  </div>
                                </div>

                                {isCurrent && (
                                  <span className="bg-[#A98955] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase shrink-0">
                                    CURRENT STAGE
                                  </span>
                                )}
                              </div>

                              {/* Metadata Row */}
                              <div className="flex flex-wrap items-center gap-4 text-xs text-[#77716A] mt-3 pt-2.5 border-t border-[#E8E2D8]/60">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-[#77716A]" />
                                  <span>{formatDateTime(lead?.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-[#77716A]" />
                                  <span>{lead?.createdByUser?.name || lead?.creator?.name || "System Admin"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 2. CONTACTED */}
                      {(() => {
                        const isDone = isStep2Done;
                        const isCurrent = currentStageIndex === 2;
                        return (
                          <div className="relative flex items-start gap-4 group">
                            {/* Marker */}
                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ring-4 ring-[#F8F6F1] transition-all ${
                              isDone && !isCurrent
                                ? "bg-[#A98955] text-white shadow-2xs"
                                : isCurrent
                                ? "bg-[#A98955] text-white shadow-xs"
                                : "bg-[#EFE9DF] text-[#8C8275] border border-[#DDD5C7]"
                            }`}>
                              {isDone && !isCurrent ? (
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              ) : (
                                <span>2</span>
                              )}
                            </div>

                            {/* Card */}
                            <div className={`flex-1 rounded-xl p-4 sm:p-5 border transition-all ${
                              isCurrent
                                ? "bg-[#F0E7D8] border-[#DFD4C3] shadow-2xs"
                                : "bg-[#FFFEFC] border-[#E8E2D8] shadow-2xs"
                            }`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={`mt-0.5 shrink-0 ${isCurrent ? "text-[#8C6D3B]" : "text-[#77716A]"}`}>
                                    <Phone className="w-5 h-5 stroke-[1.75]" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-[#262421] tracking-wide uppercase">
                                      CONTACTED
                                    </h4>
                                    <p className="text-xs text-[#77716A] mt-0.5 leading-relaxed">
                                      {isDone
                                        ? "Client contacted for initial discussion and discovery."
                                        : "Initial discovery call and requirement discussion pending."}
                                    </p>
                                  </div>
                                </div>

                                {isCurrent && (
                                  <span className="bg-[#A98955] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase shrink-0">
                                    CURRENT STAGE
                                  </span>
                                )}
                              </div>

                              {/* Metadata Row & Actions */}
                              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#77716A] mt-3 pt-2.5 border-t border-[#E8E2D8]/60">
                                <div className="flex flex-wrap items-center gap-4">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-[#77716A]" />
                                    <span>{lead?.contactedAt ? formatDateTime(lead.contactedAt) : isDone && lead?.updatedAt ? formatDateTime(lead.updatedAt) : "-"}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-[#77716A]" />
                                    <span>{lead?.assignedTo?.name || (isDone ? "Akshay" : "-")}</span>
                                  </div>
                                </div>

                                {!isDone && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStageChange("CONTACTED")}
                                    className="text-xs py-1 h-7 px-3 bg-white hover:bg-[#F3EEE5] text-[#262421] border border-[#DFD4C3] font-semibold cursor-pointer shadow-2xs"
                                  >
                                    Mark Contacted
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 3. FOLLOW-UP */}
                      {(() => {
                        const isDone = isStep3Done;
                        const isCurrent = currentStageIndex === 3;
                        return (
                          <div className="relative flex items-start gap-4 group">
                            {/* Marker */}
                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ring-4 ring-[#F8F6F1] transition-all ${
                              isDone && !isCurrent
                                ? "bg-[#A98955] text-white shadow-2xs"
                                : isCurrent
                                ? "bg-[#A98955] text-white shadow-xs"
                                : "bg-[#EFE9DF] text-[#8C8275] border border-[#DDD5C7]"
                            }`}>
                              {isDone && !isCurrent ? (
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              ) : (
                                <span>3</span>
                              )}
                            </div>

                            {/* Card */}
                            <div className={`flex-1 rounded-xl p-4 sm:p-5 border transition-all ${
                              isCurrent
                                ? "bg-[#F0E7D8] border-[#DFD4C3] shadow-2xs"
                                : "bg-[#FFFEFC] border-[#E8E2D8] shadow-2xs"
                            }`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={`mt-0.5 shrink-0 ${isCurrent ? "text-[#8C6D3B]" : "text-[#77716A]"}`}>
                                    <Users className="w-5 h-5 stroke-[1.75]" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-[#262421] tracking-wide uppercase">
                                      FOLLOW-UP
                                    </h4>
                                    <p className="text-xs text-[#77716A] mt-0.5 leading-relaxed">
                                      Client follow-up and requirement discussion
                                    </p>
                                  </div>
                                </div>

                                {isCurrent && (
                                  <span className="bg-[#A98955] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase shrink-0">
                                    CURRENT STAGE
                                  </span>
                                )}
                              </div>

                              {/* Follow-ups list if present */}
                              {lead?.followUps && lead.followUps.length > 0 && (
                                <div className="space-y-2 mt-3 pt-2.5 border-t border-[#E8E2D8]/60">
                                  {lead.followUps.map((f: any) => (
                                    <div key={f.id} className="p-3 bg-white/80 rounded-lg border border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                      <div>
                                        <div className="font-semibold text-[#262421] flex items-center gap-2">
                                          <span>{formatDate(f.followUpDate)}</span>
                                          <Badge variant={f.status === "COMPLETED" ? "completed" : f.status === "SKIPPED" ? "neutral" : "active"}>
                                            {f.status}
                                          </Badge>
                                        </div>
                                        <div className="text-[#77716A] mt-0.5">{f.notes}</div>
                                        {f.outcomeNotes && (
                                          <div className="text-[#262421] mt-0.5 font-medium">Outcome: {f.outcomeNotes}</div>
                                        )}
                                      </div>
                                      {f.status === "PENDING" && (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSkipFollowUp(f.id)}
                                            className="text-xs py-1 h-6 text-[#77716A] border-[#E8E2D8] hover:bg-[#F3EEE5]"
                                          >
                                            ↷ Skip
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setCompletingFollowUpId(f.id)}
                                            className="text-xs py-1 h-6 bg-white hover:bg-[#F8F6F1] text-[#262421] border border-[#E8E2D8] font-semibold"
                                          >
                                            ✓ Done
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Metadata Row & Action Buttons */}
                              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#77716A] mt-3 pt-2.5 border-t border-[#E8E2D8]/60">
                                <div className="flex flex-wrap items-center gap-4">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-[#77716A]" />
                                    <span>{latestFollowUp ? formatDateTime(latestFollowUp.followUpDate) : "-"}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-[#77716A]" />
                                    <span>{latestFollowUp?.assignedTo?.name || lead?.assignedTo?.name || "-"}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsFollowUpModalOpen(true)}
                                    className="text-xs py-1 h-7 px-3 bg-white hover:bg-[#F3EEE5] text-[#262421] border border-[#DFD4C3] font-semibold cursor-pointer shadow-2xs"
                                  >
                                    <Plus className="w-3 h-3 mr-1 text-[#A98955]" /> Schedule
                                  </Button>
                                  {isCurrent && !isStep4Done && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleSkipFollowUpStage}
                                      className="text-xs py-1 h-7 bg-white hover:bg-[#F3EEE5] text-[#77716A] border border-[#DFD4C3] font-medium cursor-pointer"
                                    >
                                      ↷ Skip
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 4. SITE VISIT */}
                      {(() => {
                        const isDone = isStep4Done;
                        const isCurrent = currentStageIndex === 4;
                        return (
                          <div className="relative flex items-start gap-4 group">
                            {/* Marker */}
                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ring-4 ring-[#F8F6F1] transition-all ${
                              isDone && !isCurrent
                                ? "bg-[#A98955] text-white shadow-2xs"
                                : isCurrent
                                ? "bg-[#A98955] text-white shadow-xs"
                                : "bg-[#EFE9DF] text-[#8C8275] border border-[#DDD5C7]"
                            }`}>
                              {isDone && !isCurrent ? (
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              ) : (
                                <span>4</span>
                              )}
                            </div>

                            {/* Card */}
                            <div className={`flex-1 rounded-xl p-4 sm:p-5 border transition-all ${
                              isCurrent
                                ? "bg-[#F0E7D8] border-[#DFD4C3] shadow-2xs"
                                : "bg-[#FFFEFC] border-[#E8E2D8] shadow-2xs"
                            }`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={`mt-0.5 shrink-0 ${isCurrent ? "text-[#8C6D3B]" : "text-[#77716A]"}`}>
                                    <MapPin className="w-5 h-5 stroke-[1.75]" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-[#262421] tracking-wide uppercase">
                                      SITE VISIT
                                    </h4>
                                    <p className="text-xs text-[#77716A] mt-0.5 leading-relaxed">
                                      Site visit scheduled and completed
                                    </p>
                                  </div>
                                </div>

                                {isCurrent && (
                                  <span className="bg-[#A98955] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase shrink-0">
                                    CURRENT STAGE
                                  </span>
                                )}
                              </div>

                              {/* Site visits list if present */}
                              {lead?.siteVisits && lead.siteVisits.length > 0 && (
                                <div className="space-y-2 mt-3 pt-2.5 border-t border-[#E8E2D8]/60">
                                  {lead.siteVisits.map((v: any) => (
                                    <div key={v.id} className="p-3 bg-white/80 rounded-lg border border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                      <div>
                                        <div className="font-semibold text-[#262421] flex items-center gap-2">
                                          <span>{formatDate(v.visitDate || v.scheduledDate)}</span>
                                          <Badge variant={v.status === "COMPLETED" ? "completed" : "active"}>
                                            {v.status}
                                          </Badge>
                                        </div>
                                        <div className="text-[#77716A] mt-0.5">{v.location || "Site Location"} {v.notes ? `— ${v.notes}` : ""}</div>
                                        {v.outcomeNotes && (
                                          <div className="text-[#262421] mt-0.5 font-medium">Outcome: {v.outcomeNotes}</div>
                                        )}
                                      </div>
                                      {v.status === "SCHEDULED" && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setCompletingSiteVisitId(v.id)}
                                          className="text-xs py-1 h-6 bg-white hover:bg-[#F8F6F1] text-[#262421] border border-[#E8E2D8] font-semibold shrink-0 cursor-pointer"
                                        >
                                          ✓ Complete Visit
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Metadata Row & Actions */}
                              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#77716A] mt-3 pt-2.5 border-t border-[#E8E2D8]/60">
                                <div className="flex flex-wrap items-center gap-4">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-[#77716A]" />
                                    <span>{latestSiteVisit ? formatDateTime(latestSiteVisit.visitDate || latestSiteVisit.scheduledDate) : "-"}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-[#77716A]" />
                                    <span>{latestSiteVisit?.assignedTo?.name || lead?.assignedTo?.name || "-"}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsSiteVisitModalOpen(true)}
                                    className="text-xs py-1 h-7 px-3 bg-white hover:bg-[#F3EEE5] text-[#262421] border border-[#DFD4C3] font-semibold cursor-pointer shadow-2xs"
                                  >
                                    <Plus className="w-3 h-3 mr-1 text-[#A98955]" /> Schedule Visit
                                  </Button>
                                  {isCurrent && !isDone && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const pendingVisit = lead?.siteVisits?.find((v: any) => v.status === "SCHEDULED");
                                        setCompletingSiteVisitId(pendingVisit?.id || "DIRECT");
                                      }}
                                      className="text-xs py-1 h-7 px-2.5 bg-white hover:bg-[#F3EEE5] text-[#262421] border border-[#DFD4C3] font-semibold cursor-pointer"
                                    >
                                      Mark Completed
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 5. QUOTATION */}
                      {(() => {
                        const isDone = isStep5Done;
                        const isCurrent = currentStageIndex === 5;
                        return (
                          <div className="relative flex items-start gap-4 group">
                            {/* Marker */}
                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ring-4 ring-[#F8F6F1] transition-all ${
                              isDone && !isCurrent
                                ? "bg-[#A98955] text-white shadow-2xs"
                                : isCurrent
                                ? "bg-[#A98955] text-white shadow-xs"
                                : "bg-[#EFE9DF] text-[#8C8275] border border-[#DDD5C7]"
                            }`}>
                              {isDone && !isCurrent ? (
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              ) : (
                                <span>5</span>
                              )}
                            </div>

                            {/* Card */}
                            <div className={`flex-1 rounded-xl p-4 sm:p-5 border transition-all ${
                              isCurrent
                                ? "bg-[#F0E7D8] border-[#DFD4C3] shadow-2xs"
                                : "bg-[#FFFEFC] border-[#E8E2D8] shadow-2xs"
                            }`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={`mt-0.5 shrink-0 ${isCurrent ? "text-[#8C6D3B]" : "text-[#77716A]"}`}>
                                    <FileText className="w-5 h-5 stroke-[1.75]" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-[#262421] tracking-wide uppercase">
                                      QUOTATION
                                    </h4>
                                    <p className="text-xs text-[#77716A] mt-0.5 leading-relaxed">
                                      Quotation shared with client
                                    </p>
                                  </div>
                                </div>

                                {isCurrent && (
                                  <span className="bg-[#A98955] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase shrink-0">
                                    CURRENT STAGE
                                  </span>
                                )}
                              </div>

                              {/* Quotations list if present */}
                              {lead?.quotations && lead.quotations.length > 0 && (
                                <div className="space-y-2.5 mt-3 pt-2.5 border-t border-[#E8E2D8]/60">
                                  {lead.quotations.map((q: any) => {
                                    const isWonLead = lead?.stage === "WON" || lead?.stage === "PROJECT_CREATED" || !!lead?.project;
                                    return (
                                      <div key={q.id} className="p-3.5 rounded-lg border border-[#E8E2D8] bg-white/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2.5 flex-wrap">
                                            <span className="text-sm font-bold text-[#262421] font-mono">
                                              {q.referenceNo} (Rev {q.revision || 1})
                                            </span>
                                            <span className="text-sm font-bold text-[#262421] font-mono">
                                              {formatCurrency(q.totalAmount)}
                                            </span>
                                            <Badge variant={q.status === "APPROVED" || q.status === "ACCEPTED" ? "completed" : q.status === "SENT" ? "active" : "neutral"} className="text-[10px] py-0.5 px-2 font-bold">
                                              {q.status}
                                            </Badge>
                                          </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => router.push(`/quotations/${q.id}?${isWonLead ? 'readOnly=true&' : ''}leadId=${lead.id}&step=5`)}
                                            className="text-xs py-1 h-7 bg-white text-[#262421] border border-[#E8E2D8] hover:bg-[#F3EEE5] font-semibold cursor-pointer"
                                          >
                                            <Eye className="w-3 h-3 mr-1 text-[#77716A]" />
                                            {isWonLead ? "View" : "Edit"}
                                          </Button>
                                          <a
                                            href={`/api/v1/quotations/${q.id}/pdf`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs py-1 h-7 px-2.5 rounded-md border border-[#E8E2D8] bg-white text-[#262421] hover:bg-[#F3EEE5] flex items-center gap-1 font-semibold cursor-pointer"
                                          >
                                            <Printer className="w-3 h-3 text-[#77716A]" />
                                            PDF
                                          </a>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSendWhatsApp(`QUOTE_${q.id}`, `Quotation ${q.referenceNo} for ${formatCurrency(q.totalAmount)}`)}
                                            className="text-xs py-1 h-7 bg-white text-[#262421] border border-[#E8E2D8] hover:bg-[#F3EEE5] font-semibold"
                                          >
                                            <MessageCircle className="w-3 h-3 mr-1 text-[#77716A]" />
                                            {whatsAppSentStates[`QUOTE_${q.id}`] ? "Sent" : "WhatsApp"}
                                          </Button>
                                          {!isWonLead && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleDeleteQuotation(q.id, q.referenceNo)}
                                              disabled={isDeletingQuotation === q.id}
                                              className="text-xs py-1 h-7 text-rose-600 border border-rose-200 bg-white hover:bg-rose-50 px-2 font-semibold cursor-pointer"
                                            >
                                              <Trash2 className="w-3 h-3 text-rose-600" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Metadata Row & Actions */}
                              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#77716A] mt-3 pt-2.5 border-t border-[#E8E2D8]/60">
                                <div className="flex flex-wrap items-center gap-4">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-[#77716A]" />
                                    <span>{latestQuotation ? formatDateTime(latestQuotation.createdAt || latestQuotation.updatedAt) : "-"}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-[#77716A]" />
                                    <span>{latestQuotation?.creator?.name || lead?.assignedTo?.name || "-"}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
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
                                    className="text-xs py-1 h-7 px-3 bg-white hover:bg-[#F3EEE5] text-[#262421] border border-[#DFD4C3] font-semibold cursor-pointer shadow-2xs"
                                  >
                                    <Plus className="w-3 h-3 mr-1 text-[#A98955]" /> {lead?.quotations && lead.quotations.length > 0 ? "Quotation Studio" : "Create Quotation"}
                                  </Button>
                                  {isCurrent && !isDone && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStageChange("QUOTATION_SENT")}
                                      className="text-xs py-1 h-7 bg-white hover:bg-[#F3EEE5] text-[#77716A] border border-[#DFD4C3] font-medium cursor-pointer"
                                    >
                                      Mark Sent
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 6. WON */}
                      {(() => {
                        const isDone = isStep6Done;
                        const isCurrent = currentStageIndex === 6;
                        const allQuotes = lead?.quotations || [];
                        const finalizedQuotation =
                          (attachedQuotationId ? allQuotes.find((q: any) => q.id === attachedQuotationId) : null) ||
                          allQuotes.find((q: any) => q.status === "APPROVED" || q.status === "ACCEPTED" || q.status === "SENT") ||
                          (allQuotes.length > 0 ? allQuotes[0] : null);
                        const totalDealAmount = finalizedQuotation
                          ? Number(finalizedQuotation.totalAmount || 0)
                          : Number(lead?.estimatedBudget || 0);

                        const allRecordedPayments = lead?.payments || [];
                        const recordedPaidAmount = allRecordedPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
                        const hasRecordedPayments = allRecordedPayments.length > 0 || isFeePaid || hasRecordedPaymentsLead;
                        const enteringPaymentAmount = hasRecordedPayments ? 0 : Math.max(0, parseFloat(confirmationFeeAmount) || 0);
                        const displayPaidAmount = hasRecordedPayments ? (recordedPaidAmount || (isFeePaid ? totalDealAmount : 0)) : (recordedPaidAmount + enteringPaymentAmount);
                        const displayRemainingBalance = Math.max(0, totalDealAmount - displayPaidAmount);

                        return (
                          <div className="relative flex items-start gap-4 group">
                            {/* Marker */}
                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ring-4 ring-[#F8F6F1] transition-all ${
                              isDone
                                ? "bg-[#A98955] text-white shadow-2xs"
                                : isCurrent
                                ? "bg-[#A98955] text-white shadow-xs"
                                : "bg-[#EFE9DF] text-[#8C8275] border border-[#DDD5C7]"
                            }`}>
                              {isDone ? (
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              ) : (
                                <span>6</span>
                              )}
                            </div>

                            {/* Card */}
                            <div className={`flex-1 rounded-xl p-4 sm:p-5 border transition-all ${
                              isCurrent && !isDone
                                ? "bg-[#F0E7D8] border-[#DFD4C3] shadow-2xs"
                                : "bg-[#FFFEFC] border-[#E8E2D8] shadow-2xs"
                            }`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={`mt-0.5 shrink-0 ${isCurrent && !isDone ? "text-[#8C6D3B]" : "text-[#77716A]"}`}>
                                    <Handshake className="w-5 h-5 stroke-[1.75]" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-[#262421] tracking-wide uppercase">
                                      WON
                                    </h4>
                                    <p className="text-xs text-[#77716A] mt-0.5 leading-relaxed">
                                      {lead?.stage === "LOST"
                                        ? `Lead marked as Lost. Reason: ${lead?.lossReason || "Not specified"}`
                                        : isDone
                                        ? "Lead converted to project and quotation terms locked"
                                        : "Lead conversion, negotiation agreement & project kickoff"}
                                    </p>
                                  </div>
                                </div>

                                {isCurrent && !isDone && (
                                  <span className="bg-[#A98955] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase shrink-0">
                                    CURRENT STAGE
                                  </span>
                                )}
                              </div>

                              {/* Project Conversion CTA / Linked Project Card */}
                              {isDone && (
                                <div className="mt-3.5 space-y-3 pt-3 border-t border-[#E8E2D8]/60">
                                  {!lead?.project ? (
                                    <div className="p-3.5 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                                      <div className="space-y-0.5">
                                        <h5 className="text-xs font-bold text-[#262421] flex items-center gap-1.5">
                                          <FolderKanban className="w-3.5 h-3.5 text-[#A98955]" />
                                          Convert Lead into Execution Project
                                        </h5>
                                        <p className="text-[11px] text-[#77716A]">
                                          Initialize execution workspace with contract value <span className="font-mono font-bold text-[#262421]">{formatCurrency(totalDealAmount)}</span>.
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={handleConvertToProject}
                                        disabled={isConverting}
                                        className="bg-[#262421] hover:bg-[#111] text-white font-bold px-3.5 py-1.5 h-8 shrink-0 text-xs cursor-pointer flex items-center gap-1.5"
                                      >
                                        <FolderKanban className="w-3.5 h-3.5 text-[#A98955]" />
                                        {isConverting ? "Creating..." : "Convert to Project →"}
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center shrink-0">
                                          <FolderKanban className="w-4 h-4 text-[#A98955]" />
                                        </div>
                                        <div>
                                          <div className="text-xs font-bold text-[#262421]">
                                            Project: {lead.project.referenceNo} — {lead.project.title}
                                          </div>
                                          <div className="text-[11px] text-[#77716A]">
                                            Contract value: <span className="font-mono font-semibold text-[#262421]">{formatCurrency(lead.project.contractValue || totalDealAmount)}</span>
                                          </div>
                                        </div>
                                      </div>
                                      {onOpenProject ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => onOpenProject(lead.project.id)}
                                          className="text-xs py-1 h-7 bg-white hover:bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8] font-semibold gap-1 cursor-pointer shrink-0"
                                        >
                                          <ExternalLink className="w-3 h-3 text-[#77716A]" /> Open Project
                                        </Button>
                                      ) : (
                                        <Link href={`/projects?id=${lead.project.id}`}>
                                          <Button size="sm" variant="outline" className="text-xs py-1 h-7 bg-white hover:bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8] font-semibold gap-1 cursor-pointer shrink-0">
                                            <ExternalLink className="w-3 h-3 text-[#77716A]" /> Open Project
                                          </Button>
                                        </Link>
                                      )}
                                    </div>
                                  )}

                                  {/* Fee & Invoice Quick Management */}
                                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] space-y-2.5 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-[#262421] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                        <Receipt className="w-3.5 h-3.5 text-[#A98955]" /> Booking Confirmation Fee
                                      </span>
                                      <span className="font-mono font-bold text-[#262421]">
                                        {formatCurrency(displayPaidAmount)} / {formatCurrency(totalDealAmount)}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <input
                                        type="number"
                                        placeholder="Amount (₹)"
                                        value={confirmationFeeAmount}
                                        onChange={(e) => setConfirmationFeeAmount(e.target.value)}
                                        className="h-7 px-2.5 text-xs font-mono font-semibold bg-white border border-[#E8E2D8] rounded-md w-32 focus:ring-1 focus:ring-[#A98955] text-[#262421]"
                                      />
                                      <select
                                        value={confirmationFeeType}
                                        onChange={(e) => setConfirmationFeeType(e.target.value)}
                                        className="h-7 px-2 text-xs font-semibold bg-white border border-[#E8E2D8] rounded-md focus:ring-1 focus:ring-[#A98955] text-[#262421] cursor-pointer"
                                      >
                                        <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                                        <option value="UPI">UPI / GPay / PhonePe</option>
                                        <option value="CHEQUE">Cheque</option>
                                        <option value="CASH">Cash</option>
                                      </select>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleRecordConfirmationFeePayment}
                                        disabled={isRecordingFee || !confirmationFeeAmount || parseFloat(confirmationFeeAmount) <= 0}
                                        className="text-xs py-1 h-7 bg-white hover:bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8] font-semibold cursor-pointer"
                                      >
                                        {isRecordingFee ? "Recording..." : "Record Fee"}
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
                                        className="text-xs py-1 h-7 bg-[#262421] hover:bg-[#111] text-white font-bold cursor-pointer"
                                      >
                                        Studio Invoice ↗
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Metadata Row & Actions */}
                              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#77716A] mt-3 pt-2.5 border-t border-[#E8E2D8]/60">
                                <div className="flex flex-wrap items-center gap-4">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-[#77716A]" />
                                    <span>{isDone ? formatDateTime(lead?.updatedAt) : "-"}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-[#77716A]" />
                                    <span>{lead?.assignedTo?.name || (isDone ? "Akshay" : "-")}</span>
                                  </div>
                                </div>

                                {!isDone && (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStageChange("NEGOTIATION")}
                                      className="text-xs py-1 h-7 px-3 bg-white hover:bg-[#F3EEE5] text-[#262421] border border-[#DFD4C3] font-semibold cursor-pointer"
                                    >
                                      Negotiation
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={async () => {
                                        await handleStageChange("WON");
                                      }}
                                      className="text-xs py-1 h-7 px-3.5 bg-[#262421] hover:bg-[#111] text-white font-bold cursor-pointer shadow-2xs"
                                    >
                                      ✓ Won
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setIsLostModalOpen(true)}
                                      className="text-xs py-1 h-7 px-2.5 text-rose-600 border border-rose-200 bg-white hover:bg-rose-50 cursor-pointer font-semibold"
                                    >
                                      ✕ Lost
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Bottom Subtle Continuation Indicator */}
                      <div className="relative flex items-center gap-4 pl-0">
                        <div className="w-8 flex flex-col items-center gap-1.5 py-1 shrink-0">
                          <span className="w-1 h-1 rounded-full bg-[#C9BBA6]" />
                          <span className="w-1 h-1 rounded-full bg-[#C9BBA6]" />
                          <span className="w-1 h-1 rounded-full bg-[#C9BBA6]" />
                          <span className="w-1 h-1 rounded-full bg-[#C9BBA6]" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAB 3: FOLLOW-UPS */}
              {activeTab === "followups" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E8E2D8]">
                    <h3 className="text-xs font-bold text-[#77716A] uppercase tracking-wider">Scheduled Follow-ups</h3>
                    <Button size="sm" variant="outline" onClick={() => setIsFollowUpModalOpen(true)} className="text-xs py-1 h-7.5 px-3 bg-white hover:bg-[#F8F6F1] text-[#262421] border border-[#E8E2D8] font-semibold">
                      <Plus className="w-3 h-3 mr-1 text-[#B18A4D]" /> New Follow-up
                    </Button>
                  </div>
                  {lead?.followUps && lead.followUps.length > 0 ? (
                    <div className="space-y-3">
                      {lead.followUps.map((f: any) => (
                        <div key={f.id} className="p-5 bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-[#262421] flex items-center gap-2">
                              <span>{formatDate(f.followUpDate)}</span>
                              <Badge variant={f.status === "COMPLETED" ? "completed" : f.status === "SKIPPED" ? "neutral" : "active"}>
                                {f.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-[#77716A]">{f.notes}</div>
                            {f.outcomeNotes && (
                              <div className="text-xs text-[#262421] font-medium">Outcome: {f.outcomeNotes}</div>
                            )}
                          </div>
                          {f.status === "PENDING" && (
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSkipFollowUp(f.id)}
                                className="text-xs py-1 h-7.5 px-2.5 text-[#77716A] border-[#E8E2D8] hover:bg-[#F3EEE5]"
                                title="Skip this follow-up"
                              >
                                ↷ Skip
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCompletingFollowUpId(f.id)}
                                className="text-xs py-1 h-7.5 px-3 bg-white hover:bg-[#F8F6F1] text-[#262421] border border-[#E8E2D8] font-semibold"
                              >
                                Mark Done
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center text-xs text-[#77716A] bg-[#FFFEFC] rounded-xl border border-[#E8E2D8]">
                      No follow-ups recorded.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SITE VISITS */}
              {activeTab === "sitevisits" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E8E2D8]">
                    <h3 className="text-xs font-bold text-[#77716A] uppercase tracking-wider">Site Visits</h3>
                    <Button size="sm" variant="outline" onClick={() => setIsSiteVisitModalOpen(true)} className="text-xs py-1 h-7.5 px-3 bg-white hover:bg-[#F8F6F1] text-[#262421] border border-[#E8E2D8] font-semibold">
                      <Plus className="w-3 h-3 mr-1 text-[#B18A4D]" /> New Site Visit
                    </Button>
                  </div>
                  {lead?.siteVisits && lead.siteVisits.length > 0 ? (
                    <div className="space-y-3">
                      {lead.siteVisits.map((v: any) => (
                        <div key={v.id} className="p-5 bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-[#262421] flex items-center gap-2">
                              <span>{formatDate(v.visitDate)}</span>
                              <Badge variant={v.status === "COMPLETED" ? "completed" : "active"}>{v.status}</Badge>
                            </div>
                            <div className="text-xs text-[#77716A]">{v.location} — {v.notes}</div>
                            {v.outcomeNotes && (
                              <div className="text-xs text-[#262421] font-medium">Notes: {v.outcomeNotes}</div>
                            )}
                          </div>
                          {v.status === "SCHEDULED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setCompletingSiteVisitId(v.id)}
                              className="text-xs py-1 h-7.5 px-3 bg-white hover:bg-[#F8F6F1] text-[#262421] border border-[#E8E2D8] font-semibold"
                            >
                              Mark Completed
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center text-xs text-[#77716A] bg-[#FFFEFC] rounded-xl border border-[#E8E2D8]">
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
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsQuotationStudioOpen(false);
                              setActiveQuotationId(null);
                              fetchLeadDetails();
                            }}
                            className="text-xs py-1.5 h-8 gap-1.5 font-semibold bg-white hover:bg-[#F8F6F1] text-[#262421] border border-[#E8E2D8]"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Quotation List
                          </Button>
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#F3EEE5] text-[#77716A] border border-[#E8E2D8]">
                            {quotationStudioType === 'MATERIAL' ? 'Material Quotation Studio' : 'Lead Interior Quotation Studio'}
                          </span>
                          <span className="text-[#77716A]/40 hidden sm:inline">•</span>
                          <span className="text-[#262421] hidden sm:inline font-mono text-xs font-semibold">
                            {lead?.clientName || "Lead"} ({lead?.referenceNo || leadId})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleCompleteQuotationAndLink()}
                            className="text-xs py-1.5 h-8 bg-[#262421] hover:bg-[#111] text-white font-bold gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3] text-[#B18A4D]" /> Complete &amp; Link to Lead (Step 7)
                          </Button>
                        </div>
                      </div>

                      {/* Full Embedded Quotation Generator Studio */}
                      <div className="bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-xs p-3 sm:p-5 overflow-hidden">
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
                      <div className="flex justify-between items-center flex-wrap gap-2 pb-2 border-b border-[#E8E2D8]">
                        <div>
                          <h3 className="text-xs font-bold text-[#77716A] uppercase tracking-wider">
                            Generated Quotations ({lead?.quotations?.length || 0})
                          </h3>
                          <p className="text-xs text-[#77716A] mt-0.5">
                            Select any generated quotation to view and edit in Studio, export PDF, or dispatch via WhatsApp.
                          </p>
                        </div>
                        {(!lead?.stage || (lead.stage !== "WON" && lead.stage !== "PROJECT_CREATED" && !lead.project)) && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/quotations/new?type=MATERIAL&leadId=${leadId}&step=7`)}
                              className="text-xs py-1 h-7.5 px-3 bg-white hover:bg-[#F8F6F1] text-[#262421] border border-[#E8E2D8] font-semibold cursor-pointer"
                            >
                              <Plus className="w-3 h-3 mr-1 text-[#B18A4D]" /> Material Quotation
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => router.push(`/quotations/new?type=LEAD&leadId=${leadId}&step=7`)}
                              className="text-xs py-1 h-7.5 px-3 bg-[#262421] hover:bg-[#111] text-white font-bold shadow-2xs cursor-pointer"
                            >
                              <Plus className="w-3 h-3 mr-1 text-[#B18A4D]" /> Lead Quotation
                            </Button>
                          </div>
                        )}
                      </div>

                      {lead?.quotations && lead.quotations.length > 0 ? (
                        <div className="space-y-3.5">
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
                                className="p-5 rounded-xl border border-[#E8E2D8] bg-[#FFFEFC] hover:border-[#B18A4D]/60 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                              >
                                <div className="space-y-1.5">
                                  <div className="text-xs font-bold text-[#262421] font-mono flex items-center gap-2 flex-wrap">
                                    <span className="group-hover:text-[#B18A4D] transition-colors">{q.referenceNo} (Rev {q.revision || 1})</span>
                                    {isWonLead ? (
                                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#F3EEE5] text-[#77716A] border border-[#E8E2D8] flex items-center gap-1">
                                        🔒 FINALIZED &amp; LOCKED
                                      </span>
                                    ) : (
                                      <Badge variant={q.status === "APPROVED" || q.status === "ACCEPTED" ? "completed" : q.status === "SENT" ? "active" : "neutral"}>
                                        {q.status}
                                      </Badge>
                                    )}
                                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-[#F3EEE5] text-[#77716A] border border-[#E8E2D8]">
                                      {isMat ? 'Material Quote' : 'Lead Quote'}
                                    </span>
                                  </div>
                                  <div className="text-base font-bold text-[#262421] font-mono">
                                    {formatCurrency(q.totalAmount)}
                                  </div>
                                  <div className="text-xs text-[#77716A] flex items-center gap-3">
                                    <span>{q.customTitle || q.title || "Quotation Estimation"}</span>
                                    {q.createdAt && <span>• Created: {formatDate(q.createdAt)}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={handleShareWhatsApp}
                                    title="Send Quotation via WhatsApp"
                                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#E8E2D8] bg-white text-[#262421] hover:bg-[#F3EEE5] flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 text-[#77716A]" />
                                    WhatsApp
                                  </button>
                                  <a
                                    href={`/api/v1/quotations/${q.id}/pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#E8E2D8] bg-white text-[#262421] hover:bg-[#F3EEE5] flex items-center gap-1.5 transition-colors"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-[#77716A]" />
                                    PDF
                                  </a>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleOpenQuotation}
                                    className="text-xs py-1.5 h-8 font-semibold bg-white hover:bg-[#F8F6F1] text-[#262421] border border-[#E8E2D8] cursor-pointer"
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
                                      className="text-xs py-1.5 h-8 text-rose-600 border border-rose-200 bg-white hover:bg-rose-50 px-2.5 font-semibold cursor-pointer"
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
                        <div className="p-10 text-center text-xs text-[#77716A] bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] space-y-3">
                          <p>No quotations generated for this lead yet.</p>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setQuotationStudioType("LEAD");
                              setActiveQuotationId(null);
                              setIsQuotationStudioOpen(true);
                            }}
                            className="text-xs bg-[#262421] hover:bg-[#111] text-white font-bold cursor-pointer"
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
                    <div className="bg-[#FFFEFC] p-6 sm:p-7 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-5">
                      <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3.5">
                        <div>
                          <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider">Execution Project</span>
                          <h3 className="text-base font-bold text-[#262421] mt-0.5">{lead.project.title}</h3>
                          <span className="font-mono text-xs text-[#77716A]">{lead.project.referenceNo}</span>
                        </div>
                        <Badge variant="active">{lead.project.stage}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-6 text-xs">
                        <div className="space-y-1">
                          <div className="text-[#77716A] text-[11px] font-semibold uppercase tracking-wider">Contract Value</div>
                          <div className="font-bold text-[#262421] font-mono text-base">
                            {formatCurrency(lead.project.contractValue || 0)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[#77716A] text-[11px] font-semibold uppercase tracking-wider">Client Linked</div>
                          <div className="font-bold text-[#262421] text-sm">
                            {lead.client?.fullName || lead.clientName}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        {onOpenProject ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenProject(lead.project.id)}
                            className="w-full text-xs py-2 h-9 bg-white hover:bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8] font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-[#77716A]" /> Open Project Details ({lead.project.referenceNo})
                          </Button>
                        ) : (
                          <Link href={`/projects?id=${lead.project.id}`}>
                            <Button variant="outline" size="sm" className="w-full text-xs py-2 h-9 bg-white hover:bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8] font-semibold">
                              <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-[#77716A]" /> Open in Project Workspace
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#FFFEFC] p-10 rounded-xl border border-[#E8E2D8] text-center space-y-3">
                      <FolderKanban className="w-8 h-8 text-[#77716A]/40 mx-auto" />
                      <h4 className="text-xs font-bold text-[#262421]">Project Not Created Yet</h4>
                      <p className="text-xs text-[#77716A] max-w-sm mx-auto">
                        Once the lead is won and confirmation fee is collected, you can convert it into an active project.
                      </p>
                      {lead?.stage === "WON" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleConvertToProject}
                          disabled={isConverting}
                          className="text-xs bg-[#262421] hover:bg-[#111] text-white font-bold"
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
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#E8E2D8]">
                      <div>
                        <h3 className="text-sm font-bold text-[#262421] flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-[#B18A4D]" /> Material / Personal Expense Operations
                        </h3>
                        <p className="text-[11px] text-[#77716A] mt-0.5">
                          Dedicated cost tracking dynamically linked to {lead?.clientName || "Lead"} (
                          {lead?.requirement || "Material Requirements"}) &amp; synchronized with Global Expenses
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="text-xs py-1.5 h-8 bg-[#262421] hover:bg-[#111] text-white font-bold shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1 text-[#B18A4D]" /> Add Expense
                      </Button>
                    </div>

                    {/* Person / Lead & Material Requirement Context Card */}
                    <div className="bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-2.5">
                      <span className="text-xs font-bold text-[#77716A] uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-[#B18A4D]" /> Material Requirement Person / Lead Details
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <div className="text-[#77716A] text-[11px]">Person / Lead Name</div>
                          <div className="font-bold text-[#262421] mt-0.5">{lead?.clientName || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-[#77716A] text-[11px]">Lead ID</div>
                          <div className="font-bold text-[#262421] mt-0.5 font-mono">{lead?.referenceNo || lead?.id}</div>
                        </div>
                        <div>
                          <div className="text-[#77716A] text-[11px]">Phone Number</div>
                          <div className="font-bold text-[#262421] mt-0.5 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#77716A]" />
                            {lead?.phone || "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[#77716A] text-[11px]">Material Requirement</div>
                          <div className="font-semibold text-[#262421] mt-0.5 truncate" title={lead?.requirement || "Materials Required"}>
                            {lead?.requirement || "Materials Required"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="p-4 bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs">
                        <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block">
                          Total Person Expenses
                        </span>
                        <div className="text-lg font-bold text-[#262421] font-mono mt-1">
                          {formatCurrency(totalExpenses)}
                        </div>
                        <span className="text-[10px] text-[#77716A] mt-0.5 block font-mono">
                          {activeExpenses.length} active entries
                        </span>
                      </div>

                      <div className="p-4 bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs">
                        <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block">
                          Total Vouchers
                        </span>
                        <div className="text-lg font-bold text-[#262421] font-mono mt-1">
                          {expensesList.length}
                        </div>
                        <span className="text-[10px] text-[#77716A] mt-0.5 block font-mono">
                          Recorded in history
                        </span>
                      </div>

                      <div className="p-4 bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs">
                        <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block">
                          Top Category
                        </span>
                        <div className="text-sm font-bold text-[#262421] truncate mt-1">
                          {topCategory ? topCategory.categoryKey.replace(/_/g, " ") : "None"}
                        </div>
                        <span className="text-[10px] text-[#77716A] mt-0.5 block font-mono">
                          {topCategory ? formatCurrency(topCategory.amount) : "₹0"}
                        </span>
                      </div>

                      <div className="p-4 bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs">
                        <span className="text-[10px] font-bold text-[#77716A] uppercase tracking-wider block">
                          Avg per Voucher
                        </span>
                        <div className="text-lg font-bold text-[#262421] font-mono mt-1">
                          {formatCurrency(avgExpense)}
                        </div>
                        <span className="text-[10px] text-[#77716A] mt-0.5 block font-mono">
                          Average expenditure
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Category-Wise Expense Breakdown */}
                    <div className="bg-[#FFFEFC] p-5 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#77716A] uppercase tracking-wider flex items-center gap-1.5">
                          <PieChart className="w-3.5 h-3.5 text-[#B18A4D]" /> Category-Wise Expense Breakdown
                        </h4>
                        <span className="text-[11px] font-mono text-[#77716A]">
                          {categoryBreakdown.length} Categories Active
                        </span>
                      </div>

                      {categoryBreakdown.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {categoryBreakdown.map((cat: any) => (
                            <div
                              key={cat.categoryKey}
                              className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-[#262421]">{cat.categoryKey.replace(/_/g, " ")}</span>
                                <span className="font-mono font-bold text-[#262421]">
                                  {formatCurrency(cat.amount)}
                                </span>
                              </div>

                              <div className="w-full bg-[#E8E2D8] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#B18A4D] h-full rounded-full transition-all duration-300"
                                  style={{ width: `${cat.percentage}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-[#77716A] font-mono">
                                <span>{cat.count} {cat.count === 1 ? "voucher" : "vouchers"}</span>
                                <span>{cat.percentage}% of total</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#77716A] italic py-2">
                          No category expenditure logged yet. Record an expense to see breakdown.
                        </p>
                      )}
                    </div>

                    {/* Complete Material Expense History Table */}
                    <div className="bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs overflow-hidden">
                      <div className="p-4 bg-[#FAF8F5] border-b border-[#E8E2D8] flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#77716A] uppercase tracking-wider flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-[#B18A4D]" /> Complete Expense History
                        </h4>
                        <span className="text-[11px] font-mono text-[#77716A]">
                          {expensesList.length} total records
                        </span>
                      </div>

                      {expensesList.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-[#E8E2D8] bg-[#FAF8F5] text-[#77716A] text-[11px] font-bold">
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
                            <tbody className="divide-y divide-[#E8E2D8]/60">
                              {expensesList.map((exp: any) => {
                                const statusVariant =
                                  exp.status === "APPROVED" || exp.status === "PAID"
                                    ? "completed"
                                    : exp.status === "SUBMITTED" || exp.status === "DRAFT"
                                    ? "pending"
                                    : "danger";

                                return (
                                  <tr key={exp.id} className="hover:bg-[#F8F6F1] transition-colors">
                                    <td className="p-3 font-mono text-[11px] text-[#77716A] whitespace-nowrap">
                                      {formatDate(exp.expenseDate || exp.createdAt)}
                                    </td>
                                    <td className="p-3 font-mono font-bold text-[#262421] whitespace-nowrap">
                                      {exp.referenceNo}
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F3EEE5] text-[#77716A] border border-[#E8E2D8]">
                                        {(exp.categoryKey || exp.category || "GENERAL").replace(/_/g, " ")}
                                      </span>
                                    </td>
                                    <td className="p-3 max-w-[180px]">
                                      <div className="font-medium text-[#262421] truncate" title={exp.description}>
                                        {exp.description}
                                      </div>
                                      {exp.referenceNoExternal && (
                                        <div className="text-[10px] text-[#77716A] font-mono">
                                          Ref: {exp.referenceNoExternal}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3 text-[#77716A] whitespace-nowrap">
                                      {exp.vendorName || "Direct Supplier / Contractor"}
                                    </td>
                                    <td className="p-3 font-mono text-[11px] text-[#77716A] whitespace-nowrap">
                                      {(exp.paymentMethod || "BANK_TRANSFER").replace(/_/g, " ")}
                                    </td>
                                    <td className="p-3 text-right font-mono font-bold text-[#262421] whitespace-nowrap">
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
                                          className="p-1 text-[#77716A] hover:text-[#262421] hover:bg-[#F3EEE5] rounded cursor-pointer transition-colors"
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
                          <Receipt className="w-8 h-8 text-[#77716A]/30 mx-auto" />
                          <p className="text-xs text-[#77716A]">No expenses recorded for this person yet.</p>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setIsExpenseModalOpen(true)}
                            className="text-xs bg-[#262421] hover:bg-[#111] text-white font-bold mt-2"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1 text-[#B18A4D]" /> Record First Expense
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
            <label className="block text-xs font-semibold text-[#262421] mb-1">Follow-up Date *</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full text-xs p-2 border border-[#E8E2D8] rounded-md bg-white text-[#262421] focus:ring-1 focus:ring-[#B18A4D]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#262421] mb-1">Time</label>
            <ClockTimePicker
              value={followUpTime}
              onChange={(val) => setFollowUpTime(val)}
              placeholder="Select follow-up time"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#262421] mb-1">Communication Channel</label>
            <select
              value={followUpType}
              onChange={(e) => setFollowUpType(e.target.value)}
              className="w-full text-xs p-2 border border-[#E8E2D8] rounded-md bg-white text-[#262421] focus:ring-1 focus:ring-[#B18A4D] cursor-pointer"
            >
              <option value="CALL">Phone Call</option>
              <option value="WHATSAPP">WhatsApp Message</option>
              <option value="EMAIL">Email</option>
              <option value="MEETING">In-Person Meeting</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#262421] mb-1">Notes / Agenda *</label>
            <textarea
              placeholder="e.g. Discuss revised 3D quotation..."
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              className="w-full text-xs p-2 border border-[#E8E2D8] rounded-md bg-white text-[#262421] focus:ring-1 focus:ring-[#B18A4D]"
              rows={2}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsFollowUpModalOpen(false)} className="bg-white hover:bg-[#F8F6F1] text-[#77716A] border-[#E8E2D8]">
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" isLoading={isSchedulingFollowUp} className="bg-[#262421] hover:bg-[#111] text-white font-bold">
              Save Follow-up
            </Button>
          </div>
        </form>
      </Modal>

      {/* Complete Follow-up Modal */}
      <Modal isOpen={!!completingFollowUpId} onClose={() => setCompletingFollowUpId(null)} title="Record Follow-up Outcome" maxWidth="sm">
        <form onSubmit={handleCompleteFollowUp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#262421] mb-1">Outcome / Discussion Notes *</label>
            <textarea
              placeholder="What was discussed with the client?"
              value={followUpOutcomeNotes}
              onChange={(e) => setFollowUpOutcomeNotes(e.target.value)}
              className="w-full text-xs p-2 border border-[#E8E2D8] rounded-md bg-white text-[#262421] focus:ring-1 focus:ring-[#B18A4D]"
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" type="button" onClick={() => setCompletingFollowUpId(null)} className="bg-white hover:bg-[#F8F6F1] text-[#77716A] border-[#E8E2D8]">
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" isLoading={isCompletingFollowUp} className="bg-[#262421] hover:bg-[#111] text-white font-bold">
              Mark Completed
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schedule Site Visit Modal */}
      <Modal isOpen={isSiteVisitModalOpen} onClose={() => setIsSiteVisitModalOpen(false)} title="Schedule Site Measurement Visit" maxWidth="sm">
        <form onSubmit={handleScheduleSiteVisit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#262421] mb-1">Visit Date *</label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full text-xs p-2 border border-[#E8E2D8] rounded-md bg-white text-[#262421] focus:ring-1 focus:ring-[#B18A4D]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#262421] mb-1">Time</label>
            <ClockTimePicker
              value={visitTime}
              onChange={(val) => setVisitTime(val)}
              placeholder="Select visit time"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#262421] mb-1">Site Location / Address</label>
            <input
              type="text"
              value={visitLocation}
              onChange={(e) => setVisitLocation(e.target.value)}
              placeholder="e.g. Palm Meadows Villa 42, Bangalore"
              className="w-full text-xs p-2 border border-[#E8E2D8] rounded-md bg-white text-[#262421] focus:ring-1 focus:ring-[#B18A4D]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#262421] mb-1">Notes</label>
            <textarea
              placeholder="Initial site measurement and space assessment"
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              className="w-full text-xs p-2 border border-[#E8E2D8] rounded-md bg-white text-[#262421] focus:ring-1 focus:ring-[#B18A4D]"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsSiteVisitModalOpen(false)} className="bg-white hover:bg-[#F8F6F1] text-[#77716A] border-[#E8E2D8]">
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" isLoading={isSchedulingSiteVisit} className="bg-[#262421] hover:bg-[#111] text-white font-bold">
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
            <label className="block text-xs font-bold text-[#262421] mb-1">
              Site Measurement &amp; Assessment Notes <span className="text-rose-600 font-bold">* (Mandatory)</span>
            </label>
            <p className="text-[11px] text-[#77716A] mb-2">
              Record spatial dimensions, civil checks, material specifications discussed, or client design preferences.
            </p>
            <textarea
              placeholder="e.g. 3BHK spatial measurements recorded: Living 18x14, Kitchen 12x10. Client requested modular acrylic finish with false ceiling cove lighting. Civil work is ready for execution."
              value={visitOutcomeNotes}
              onChange={(e) => setVisitOutcomeNotes(e.target.value)}
              className="w-full text-xs p-3 border border-[#E8E2D8] rounded-md bg-white text-[#262421] focus:ring-2 focus:ring-[#B18A4D] min-h-[110px]"
              rows={4}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D8]">
            <Button size="sm" variant="outline" type="button" onClick={() => setCompletingSiteVisitId(null)} className="bg-white hover:bg-[#F8F6F1] text-[#77716A] border-[#E8E2D8]">
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              isLoading={isCompletingSiteVisit}
              disabled={!visitOutcomeNotes.trim()}
              className="bg-[#262421] hover:bg-[#111] text-white font-bold"
            >
              ✓ Complete Site Visit &amp; Save Notes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lost Reason Modal */}
      <Modal isOpen={isLostModalOpen} onClose={() => setIsLostModalOpen(false)} title="Mark Lead as Lost" maxWidth="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#262421] mb-1">Primary Lost Reason *</label>
            <select
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
              className="w-full text-xs p-2 border border-[#E8E2D8] rounded-md bg-white text-[#262421] cursor-pointer"
            >
              <option value="BUDGET">Budget Issue</option>
              <option value="COMPETITOR">Client Chose Another Company</option>
              <option value="UNREACHABLE">No Response / Unreachable</option>
              <option value="PROJECT_CANCELLED">Project Cancelled by Client</option>
              <option value="OTHER">Other Reason</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#262421] mb-1">Lost Details / Feedback</label>
            <textarea
              placeholder="Add client feedback or reason..."
              value={lossNotes}
              onChange={(e) => setLossNotes(e.target.value)}
              className="w-full text-xs p-2 border border-[#E8E2D8] rounded-md bg-white text-[#262421]"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => setIsLostModalOpen(false)} className="bg-white hover:bg-[#F8F6F1] text-[#77716A] border-[#E8E2D8]">
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
