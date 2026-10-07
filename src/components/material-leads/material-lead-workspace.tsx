"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ClockTimePicker } from "@/components/ui/clock-time-picker";
import {
  X,
  Calendar,
  Phone,
  PhoneOff,
  PhoneCall,
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
  Sparkles,
  Trophy,
  XCircle,
  DollarSign,
  Receipt,
  Target,
  Building2,
  ShieldCheck,
  PackageCheck,
  UserCheck,
  CreditCard,
  Calculator,
  Link2,
  MessageCircle,
  Eye,
  Share2,
  Download,
} from "lucide-react";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { MATERIAL_LEAD_STATUSES, MATERIAL_LEAD_SOURCES, MaterialRequirementItem } from "@/validators/material-lead.schema";
import { PlaceMaterialOrderModal } from "./place-material-order-modal";
import { VendorResponseModal } from "./vendor-response-modal";
import { ContactStatusModal } from "./contact-status-modal";
import { DeleteMaterialLeadModal } from "./delete-material-lead-modal";
import { MaterialOrderWorkflowModal } from "@/components/projects/material-order-workflow-modal";
import { VendorDetailModal } from "@/components/vendors/vendor-detail-modal";
import { AddExpenseModal } from "@/components/expenses/add-expense-modal";
import { RecordPaymentModal } from "@/components/payments/record-payment-modal";

export const CANONICAL_MATERIAL_STAGES = [
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

export const getMaterialStageIdx = (st?: string) => {
  const s = (st || "NEW").toUpperCase();
  switch (s) {
    case "NEW":
    case "NOT_CONTACTED":
      return 0;
    case "CONTACTED":
    case "REQUIREMENT_DISCUSSED":
      return 1;
    case "MATERIAL_REQUIRED":
    case "MATERIALS_REQUIRED":
      return 2;
    case "QUOTATION_IN_PROGRESS":
    case "QUOTATION_GENERATED":
      return 3;
    case "QUOTATION_SENT":
    case "ESTIMATE_SENT":
      return 4;
    case "WON":
    case "CONFIRMATION_FEE":
    case "CONFIRMATION_FEE_PAID":
    case "BOOKING_CONFIRMED":
    case "FEE_PAID":
      return 5;
    case "ORDER_PLACED":
      return 6;
    case "VENDOR_REQUEST":
    case "VENDOR_REJECTED":
      return 7;
    case "VENDOR_ACCEPTED":
    case "ORDER_CONFIRMED":
    case "MATERIALS_ORDER":
      return 8;
    case "ORDER_DELIVERED":
    case "ORDER_COMPLETED":
    case "DELIVERED":
      return 9;
    default:
      return 0;
  }
};

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
  const router = useRouter();
  const confirmationFeeStepRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "pipeline" | "quotations" | "expenses" | "requirements" | "vendors" | "orders" | "payments" | "timeline" | "followups"
  >("overview");

  // Status Change State
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Stage Notes State
  const [inlineNoteText, setInlineNoteText] = useState("");
  const [activeNoteStage, setActiveNoteStage] = useState<string | null>(null);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Pipeline Modals State
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactModalInitialStatus, setContactModalInitialStatus] = useState<"CONTACTED" | "NOT_CONTACTED">("CONTACTED");
  const [isPlaceOrderModalOpen, setIsPlaceOrderModalOpen] = useState(false);
  const [isVendorResponseModalOpen, setIsVendorResponseModalOpen] = useState(false);
  const [vendorResponseMode, setVendorResponseMode] = useState<"ACCEPTED" | "REJECTED" | "NEW_VENDOR">("ACCEPTED");
  const [selectedVendorIdForModal, setSelectedVendorIdForModal] = useState<string | null>(null);

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
  const [attachedQuotationId, setAttachedQuotationId] = useState<string | null>(null);
  const [isManualQuoteInputOpen, setIsManualQuoteInputOpen] = useState(false);
  const [isDeletingPaymentId, setIsDeletingPaymentId] = useState<string | null>(null);

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

  // Delete Material Lead Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit Material Lead Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: "",
    phone: "",
    secondaryContact: "",
    email: "",
    location: "",
    priority: "MEDIUM",
    requirement: "",
    notes: "",
  });
  const [isUpdatingLead, setIsUpdatingLead] = useState(false);

  // Add Expense & Record Payment Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);

  const handleOpenEditLead = () => {
    const l = data?.materialLead || data;
    setEditForm({
      customerName: l?.customerName || l?.clientName || "",
      phone: l?.primaryContact || l?.phone || "",
      secondaryContact: l?.secondaryContact || "",
      email: l?.email || "",
      location: l?.location || l?.projectLocation || "",
      priority: l?.priority || "MEDIUM",
      requirement: l?.requirement || "",
      notes: l?.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const l = data?.materialLead || data;
    if (!l?.id || isUpdatingLead) return;
    setIsUpdatingLead(true);
    try {
      const res = await fetch(`/api/v1/material-leads/${l.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editForm.customerName.trim(),
          primaryContact: editForm.phone.trim(),
          secondaryContact: editForm.secondaryContact.trim() || undefined,
          email: editForm.email.trim() || undefined,
          location: editForm.location.trim() || undefined,
          priority: editForm.priority,
          requirement: editForm.requirement.trim() || undefined,
          notes: editForm.notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update lead details");
      }
      toast.success("Lead Updated", "Material Lead details updated successfully.");
      setIsEditModalOpen(false);
      fetchDetails();
      onUpdate();
    } catch (e: any) {
      toast.error("Update Failed", e.message || "Could not update lead");
    } finally {
      setIsUpdatingLead(false);
    }
  };

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

  const handleStatusChange = async (newStatus: string, transitionNotes?: string) => {
    if (!lead?.id || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const payload: any = { status: newStatus };
      if (transitionNotes && transitionNotes.trim()) {
        payload.notes = transitionNotes.trim();
      }
      const res = await fetch(`/api/v1/material-leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update status");
      }
      setSelectedStatus(newStatus);
      toast.success("Stage Updated", `Material Lead updated to ${newStatus.replace(/_/g, " ")}`);
      fetchDetails();
      onUpdate();
    } catch (e: any) {
      toast.error("Update Failed", e.message || "Could not update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddInlineNote = async (stageKey?: string) => {
    if (!inlineNoteText.trim() || !lead?.id) return;
    setIsSubmittingNote(true);
    try {
      const res = await fetch(`/api/v1/material-leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: inlineNoteText.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save note");
      }
      setInlineNoteText("");
      setActiveNoteStage(null);
      toast.success("Note Saved", "Stage note recorded successfully");
      fetchDetails();
      onUpdate();
    } catch (e: any) {
      toast.error("Save Failed", e.message || "Could not save stage note");
    } finally {
      setIsSubmittingNote(false);
    }
  };

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
            paymentNotes: confirmationFeeNotes.trim() || `Booking confirmation payment for ${lead?.customerName || lead?.clientName || "Material Lead"}`,
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
            leadId: lead?.id || undefined,
            clientId: lead?.clientId || undefined,
            amount: fee,
            paymentDate: confirmationFeeDate || new Date().toISOString().split("T")[0],
            paymentMethod: confirmationFeeType,
            paymentType: confirmationFeeType,
            transactionReference: confirmationFeeRef.trim() || undefined,
            handoverDate: confirmationFeeHandoverDate || undefined,
            notes: `[Invoice: ${invNumberToAttach}] ${confirmationFeeNotes.trim() || `Booking confirmation payment for ${lead?.customerName || lead?.clientName || "Material Lead"}`}`
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

      // Automatically advance to Confirmation Fee Paid stage if in an earlier stage
      if (activeMatIdx <= 5) {
        await handleStatusChange("CONFIRMATION_FEE_PAID", `Confirmation fee paid: ${formatCurrency(fee)} (${invRef})`);
      }

      toast.success(
        "Payment Recorded & Invoice Generated",
        `Payment of ${formatCurrency(fee)} confirmed (${pRef}). Generated Invoice ${invRef}.`
      );

      if (invId && invId.length > 10) {
        window.open(`/api/v1/invoices/${invId}/pdf`, '_blank');
      }

      await fetchDetails();
      onUpdate();
    } catch (err: any) {
      toast.error("Payment Failed", err.message || "Failed to record payment");
    } finally {
      setIsRecordingFee(false);
    }
  };

  const handleDeleteRecordedPayment = async (paymentId: string, invoiceId?: string, paymentRef?: string) => {
    if (!confirm(`Are you sure you want to delete this payment (${paymentRef || 'Payment'})? The recorded payment and attached invoice will be deleted, and the quotation deal balance will be restored.`)) {
      return;
    }

    setIsDeletingPaymentId(paymentId);
    try {
      const res = await fetch(`/api/v1/payments/${paymentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Payment deleted by user from Material Lead Workspace" })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        if (invoiceId) {
          await fetch(`/api/v1/invoices/${invoiceId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: "Invoice deleted from Material Lead Workspace" })
          });
        } else {
          throw new Error(json.error?.message || "Failed to delete payment");
        }
      }

      toast.success("Payment & Invoice Deleted", "Payment record removed and material quotation balance restored.");
      setIsFeePaid(false);
      setGeneratedInvoiceRef(null);
      setGeneratedInvoiceId(null);
      await fetchDetails();
      onUpdate();
    } catch (err: any) {
      toast.error("Delete Failed", err.message || "Could not delete payment record");
    } finally {
      setIsDeletingPaymentId(null);
    }
  };

  const handleSendWhatsApp = (paymentId: string, messageText: string) => {
    const clientPhone = lead?.primaryContact || lead?.phone;
    if (!clientPhone) {
      toast.error("No Phone", "Client phone number is not available.");
      return;
    }
    const cleanPhone = clientPhone.replace(/\D/g, "");
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, "_blank");
  };

  const handleDeleteLead = async () => {
    if (!lead?.id) return;
    if (!confirm(`Are you sure you want to delete Material Lead ${lead.customerName || lead.materialLeadId || ""}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/v1/material-leads/${lead.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete lead");
      toast.success("Lead Deleted", "Material Lead removed successfully");
      onClose();
      onUpdate();
    } catch (e: any) {
      toast.error("Delete Failed", e.message || "Could not delete lead");
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

  const handleQuickAddRequirementInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead?.id || !reqName.trim()) {
      toast.error("Material Name Required", "Please enter the material name.");
      return;
    }
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

      const res = await fetch(`/api/v1/material-leads/${lead.id}/requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save requirement");
      }

      toast.success("Material Item Added", `${reqName} (${reqQuantity} ${finalUnit}) added.`);
      setReqName("");
      setReqAdditional("");
      setReqNotes("");
      setReqQuantity(1);
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
  const invoicesList: any[] = [
    ...(lead?.invoices || []),
    ...(lead?.quotations?.flatMap((q: any) => q.gstInvoices || []) || []),
    ...(lead?.payments?.map((p: any) => p.gstInvoice).filter(Boolean) || []),
  ].filter(
    (inv: any, index: number, self: any[]) =>
      inv && (inv.id || inv.invoiceNo) && index === self.findIndex((t: any) => t && (t.id === inv.id || t.invoiceNo === inv.invoiceNo))
  );
  const ordersList = lead?.orders || [];
  const paymentsList = lead?.payments || [];
  // 1. Build map of vendors consolidating orders, requests, and linked supplier
  const vendorsMap = new Map<string, any>();

  // Ingest purchase orders first (Ground truth for confirmed procurement orders)
  (ordersList || []).forEach((o: any) => {
    const vId = o.vendorId || o.vendor?.id || o.vendor?.name || `vendor-ord-${o.id}`;
    const vName = o.vendor?.name || "Procurement Supplier";
    const vKey = (vName || vId).trim().toLowerCase();

    const poPayments = (o.vendorPayments || [])
      .filter((p: any) => p.status !== "CANCELLED" && p.status !== "REVERSED")
      .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);

    const existing = vendorsMap.get(vKey) || {
      id: o.vendor?.id || o.vendorId || vId,
      name: vName,
      phone: o.vendor?.phone || "N/A",
      category: o.vendor?.categoryKey || "Material Supplier",
      status: "CONFIRMED_ORDER",
      finalAmount: 0,
      paidAmount: 0,
      requestedAt: o.poDate || o.createdAt,
      notes: o.referenceNo ? `Purchase Order: ${o.referenceNo}` : o.notes,
      orders: [],
    };

    existing.finalAmount += Number(o.grandTotal) || 0;
    existing.paidAmount += poPayments;
    existing.status = "CONFIRMED_ORDER";
    if (o.vendor?.phone && existing.phone === "N/A") {
      existing.phone = o.vendor.phone;
    }
    existing.orders.push(o);
    vendorsMap.set(vKey, existing);
  });

  // Ingest vendor requests (enquiries & quotes)
  (lead?.vendorRequests || []).forEach((vr: any) => {
    const vId = vr.vendorId || vr.id || vr.vendorName || `vr-${vr.id}`;
    const vName = vr.vendorName || vr.name || "Assigned Supplier";
    const vKey = (vName || vId).trim().toLowerCase();

    const existing = vendorsMap.get(vKey);
    if (existing) {
      if (vr.vendorPhone && existing.phone === "N/A") existing.phone = vr.vendorPhone;
      if (!existing.finalAmount && vr.finalAmount) existing.finalAmount = Number(vr.finalAmount) || 0;
      if (vr.notes && !existing.notes) existing.notes = vr.notes;
      if (vr.rejectionReason) existing.rejectionReason = vr.rejectionReason;
    } else {
      vendorsMap.set(vKey, {
        id: vr.vendorId || vr.id || vId,
        name: vName,
        phone: vr.vendorPhone || vr.phone || "N/A",
        category: vr.vendorCategory || "Material Supplier",
        status: vr.status || "REQUEST_SENT",
        finalAmount: Number(vr.finalAmount) || 0,
        paidAmount: 0,
        requestedAt: vr.requestedAt || vr.createdAt,
        notes: vr.notes,
        rejectionReason: vr.rejectionReason,
        orders: [],
      });
    }
  });

  // Ingest linkedVendor if not present
  if (lead?.linkedVendor) {
    const lv = lead.linkedVendor;
    const vKey = (lv.name || lv.id || "linked-vendor").trim().toLowerCase();
    if (!vendorsMap.has(vKey)) {
      vendorsMap.set(vKey, {
        id: lv.id,
        name: lv.name,
        phone: lv.phone || "N/A",
        category: lv.categoryKey || "Material Supplier",
        status: "LINKED",
        finalAmount: 0,
        paidAmount: 0,
        requestedAt: lead.updatedAt,
        orders: [],
      });
    }
  }

  const vendorsList = Array.from(vendorsMap.values());

  // Fallback: If only 1 vendor and 1 or more orders exist but amount was 0, link order total to vendor
  if (vendorsList.length === 1 && ordersList.length > 0 && vendorsList[0].finalAmount === 0) {
    const totalOrderVal = ordersList.reduce((sum: number, o: any) => sum + (Number(o.grandTotal) || 0), 0);
    vendorsList[0].finalAmount = totalOrderVal;
    vendorsList[0].status = "CONFIRMED_ORDER";
  }

  const websiteData = lead?.websiteData || null;

  // Global Vendor Financial KPIs for this Material Lead
  const totalVendorOrdersValue = vendorsList.reduce((sum: number, v: any) => sum + (Number(v.finalAmount) || 0), 0)
    || ordersList.reduce((sum: number, o: any) => sum + (Number(o.grandTotal) || 0), 0);

  const totalVendorMoneyPaid = vendorsList.reduce((sum: number, v: any) => sum + (Number(v.paidAmount) || 0), 0)
    || (lead?.vendorPaidAmount || 0);

  const totalVendorRemainingBalance = Math.max(0, totalVendorOrdersValue - totalVendorMoneyPaid);

  const rawNormStage = (lead?.status || lead?.stage || selectedStatus || "NEW").toUpperCase();
  let activeMatIdx = getMaterialStageIdx(rawNormStage);

  // Auto-heal / dynamic stage resolution based on business state
  if (ordersList.length > 0 || lead?.linkedOrderId) {
    if (activeMatIdx < 6) activeMatIdx = 6; // At least ORDER_PLACED (Step 7)
  } else if ((paymentsList.length > 0 || invoicesList.length > 0 || isFeePaid) && activeMatIdx < 5) {
    activeMatIdx = 5; // At least CONFIRMATION_FEE_PAID (Step 6)
  }
  const normStage = CANONICAL_MATERIAL_STAGES[activeMatIdx]?.key || rawNormStage;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-charcoal/40 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Half-screen Drawer (55%–60% width) */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[60%] lg:w-[55%] bg-[#FAF8F5] border-l border-walnut/20 shadow-2xl z-50 flex flex-col transition-all transform duration-300 ease-in-out">
        {/* Top Sticky Header (Project Workspace Style) */}
        <div className="px-6 py-4 bg-white border-b border-walnut/15 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-charcoal tracking-tight">
                  {lead?.customerName || lead?.clientName || "Material Lead"} - Material Supply
                </h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cream border border-walnut/20 text-charcoal">
                  {lead?.materialLeadId || lead?.referenceNo || "MAT-LEAD-2026-XXXX"}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-blue-50 text-blue-800 border border-blue-200">
                  ACTIVE
                </span>
                <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {CANONICAL_MATERIAL_STAGES[activeMatIdx]?.title.toUpperCase() || normStage.replace(/_/g, " ")}
                </span>
              </div>

              {/* Subtitle Row */}
              <div className="flex flex-wrap items-center gap-3.5 text-xs text-walnut">
                <span className="flex items-center gap-1 font-semibold text-charcoal">
                  <User className="w-3.5 h-3.5 text-gold" /> {lead?.customerName || lead?.clientName || "Client"} ↗
                </span>
                <span className="flex items-center gap-1 font-mono font-medium">
                  <Phone className="w-3.5 h-3.5 text-gold" /> {lead?.primaryContact || lead?.phone || "N/A"}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gold" /> {lead?.location || lead?.projectLocation || "Hyderabad"}
                </span>
                <span className="flex items-center gap-1 font-mono font-bold text-gold bg-cream px-2 py-0.5 rounded border border-gold/30">
                  <Target className="w-3 h-3 text-gold" /> Origin: {lead?.source || lead?.sourceKey || "DIRECT"} ↗
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-walnut hover:text-charcoal hover:bg-cream/60 transition cursor-pointer"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar (Project Workspace Style) */}
          <div className="pt-3 border-t border-walnut/10 flex flex-wrap items-center justify-between gap-3">
            {/* Stage Quick Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-walnut uppercase tracking-wider">
                EXECUTION STAGE:
              </span>
              <select
                value={normStage}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdatingStatus}
                className="text-xs font-bold bg-white text-charcoal border border-walnut/20 rounded-md px-3 py-1.5 shadow-2xs focus:ring-1 focus:ring-gold cursor-pointer outline-none"
              >
                {CANONICAL_MATERIAL_STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.order}. {s.title} ({s.progressWeightPct}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEditLead}
                className="text-xs py-1 h-7 font-semibold"
              >
                <Edit2 className="w-3 h-3 mr-1" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push(`/quotations/new?type=MATERIAL&materialLeadId=${lead?.id || ""}&leadId=${lead?.id || ""}`);
                }}
                className="text-xs py-1 h-7 border-teal-300 text-teal-900 bg-teal-50 hover:bg-teal-100 font-semibold gap-1 cursor-pointer"
                title="Create Material Quotation"
              >
                <Package className="w-3 h-3 text-teal-700" /> + Materials Quote
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpenseModalOpen(true)}
                className="text-xs py-1 h-7 border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 font-semibold gap-1 cursor-pointer"
              >
                <DollarSign className="w-3 h-3 mr-1" /> + Add Expense
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaceOrderModalOpen(true)}
                className="text-xs py-1 h-7 border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100 font-semibold gap-1 cursor-pointer"
              >
                <ShoppingBag className="w-3 h-3 mr-1" /> + Order Material
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsRecordPaymentModalOpen(true)}
                className="text-xs py-1 h-7 bg-gold text-charcoal font-bold hover:bg-gold/90 gap-1 cursor-pointer"
              >
                <Receipt className="w-3 h-3 mr-1" /> Record Payment
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("requirements")}
                className="text-xs py-1 h-7 border-walnut/30 text-walnut hover:bg-cream/40 gap-1 cursor-pointer"
              >
                <Boxes className="w-3 h-3 mr-1 text-gold" /> View Requirements
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-xs py-1 h-7 text-rose-600 border-rose-200 hover:bg-rose-50 gap-1 cursor-pointer"
                title="Delete Material Lead (Admin Password Protected)"
              >
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Project Workspace Style) */}
        <div className="flex items-center px-6 border-b border-walnut/15 bg-white overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: "overview", label: "Overview & Details" },
            { id: "pipeline", label: `Pipeline Stepper (${CANONICAL_MATERIAL_STAGES.length})` },
            { id: "quotations", label: `Quotations & Invoices (${quotationsList.length + invoicesList.length})` },
            { id: "expenses", label: `Expenses (${(lead?.expenses || []).length})` },
            { id: "requirements", label: `Materials (${requirementsList.length})` },
            { id: "vendors", label: `Vendors (${vendorsList.length})` },
            { id: "orders", label: `Orders (${ordersList.length || (lead?.linkedOrderId ? 1 : 0)})` },
            { id: "payments", label: `Payments (${paymentsList.length})` },
            { id: "timeline", label: `Timeline (${timeline.length})` },
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
              {/* TAB: PIPELINE STEPPER (PROJECT PIPELINE STYLE) */}
              {activeTab === "pipeline" && (() => {
                const isMaterialLeadFullyCompleted = normStage === "ORDER_DELIVERED" || normStage === "ORDER_COMPLETED" || normStage === "DELIVERED";
                const progressPercent = isMaterialLeadFullyCompleted ? 100 : Math.round(((activeMatIdx) / (CANONICAL_MATERIAL_STAGES.length - 1)) * 100);

                return (
                  <div className="space-y-6">
                    {/* Top Execution Progression Banner */}
                    <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-charcoal flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-600" /> Execution Progression (Step {Math.min(activeMatIdx + 1, CANONICAL_MATERIAL_STAGES.length)} of {CANONICAL_MATERIAL_STAGES.length})
                          </span>
                          <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {progressPercent}% Complete
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-walnut font-medium">
                            Active: <strong className="text-charcoal">{CANONICAL_MATERIAL_STAGES[activeMatIdx]?.title.toUpperCase() || normStage.replace(/_/g, " ")}</strong>
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange("ORDER_DELIVERED")}
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

                    {/* Vertical Connected Stepper */}
                    <div className="relative pl-10 space-y-6">
                      {CANONICAL_MATERIAL_STAGES.map((stageDef, idx) => {
                        const isCompleted = isMaterialLeadFullyCompleted || idx < activeMatIdx;
                        const isActive = !isMaterialLeadFullyCompleted && idx === activeMatIdx;
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
                                  <span className="text-xs text-amber-900 font-bold flex items-center gap-1 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> In Execution
                                  </span>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(stageDef.key)}
                                    className="text-xs py-0.5 h-6 text-slate-700 border-slate-300 hover:bg-slate-50 font-semibold cursor-pointer"
                                  >
                                    Advance to Here
                                  </Button>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-walnut">{stageDef.description}</p>

                            {/* Completed Stage Note Display */}
                            {((stageDef.key === "NEW" && lead?.notes) || (stageDef.key === "NEW" && lead?.requirement)) && (
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
                                    {lead.notes || lead.requirement}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Completed Material Requirements Summary */}
                            {stageDef.key === "MATERIAL_REQUIRED" && isCompleted && requirementsList.length > 0 && (
                              <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950 uppercase tracking-wider">
                                  <span className="flex items-center gap-1.5">
                                    <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                                    Specified Materials ({requirementsList.length} Items)
                                  </span>
                                </div>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                  {requirementsList.map((item, rIdx) => (
                                    <div
                                      key={item.id || rIdx}
                                      className="p-2 bg-white rounded border border-emerald-100 flex items-center justify-between gap-2 shadow-2xs"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                          <strong className="text-charcoal font-semibold">{item.materialName}</strong>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cream border border-walnut/20 text-walnut">
                                            {item.category}
                                          </span>
                                        </div>
                                        {item.additionalRequirements && (
                                          <p className="text-[11px] text-walnut/80 truncate">
                                            Specs: {item.additionalRequirements}
                                          </p>
                                        )}
                                      </div>
                                      <span className="font-mono font-bold text-emerald-800 text-xs shrink-0">
                                        {item.quantity} {item.unit}
                                      </span>
                                    </div>
                                  ))}
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
                              <div className="mt-3.5 p-3.5 bg-white/95 rounded-xl border border-amber-300 shadow-2xs space-y-3.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
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

                                {/* STEP 3 INLINE MATERIAL BUILDER & VALIDATION */}
                                {stageDef.key === "MATERIAL_REQUIRED" && (
                                  <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-300/80 shadow-2xs space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Boxes className="w-4 h-4 text-amber-700" />
                                        <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                                          Required Materials &amp; Specifications
                                        </h4>
                                      </div>
                                      <span
                                        className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                                          requirementsList.length > 0
                                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                            : "bg-rose-100 text-rose-900 border-rose-300 animate-pulse"
                                        }`}
                                      >
                                        {requirementsList.length} Item(s) Entered{" "}
                                        {requirementsList.length === 0 ? "(Required to Advance)" : "✓"}
                                      </span>
                                    </div>

                                    {/* Existing Items List */}
                                    {requirementsList.length > 0 ? (
                                      <div className="space-y-1.5">
                                        <span className="text-[11px] font-bold text-slate-700 block">
                                          Entered Material Requirements:
                                        </span>
                                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                          {requirementsList.map((item, rIdx) => (
                                            <div
                                              key={item.id || rIdx}
                                              className="p-2.5 bg-white rounded-lg border border-walnut/20 shadow-2xs flex items-center justify-between gap-3 text-xs"
                                            >
                                              <div className="space-y-0.5 flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <strong className="text-charcoal font-bold">
                                                    {item.materialName}
                                                  </strong>
                                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cream border border-walnut/20 text-walnut">
                                                    {item.category}
                                                  </span>
                                                  <span className="font-mono font-bold text-amber-800 text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                    {item.quantity} {item.unit}
                                                  </span>
                                                </div>
                                                {item.additionalRequirements && (
                                                  <p className="text-[11px] text-walnut truncate">
                                                    <span className="font-medium text-slate-600">Specs:</span>{" "}
                                                    {item.additionalRequirements}
                                                  </p>
                                                )}
                                                {item.notes && (
                                                  <p className="text-[10px] text-slate-500 italic truncate">
                                                    Note: {item.notes}
                                                  </p>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                  type="button"
                                                  onClick={() => handleOpenEditRequirement(item)}
                                                  className="p-1 rounded text-slate-600 hover:text-charcoal hover:bg-slate-100"
                                                  title="Edit Material"
                                                >
                                                  <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => item.id && handleDeleteRequirement(item.id)}
                                                  className="p-1 rounded text-rose-600 hover:bg-rose-50"
                                                  title="Remove Material"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-3 bg-rose-50/90 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2.5">
                                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                        <div>
                                          <strong className="font-bold block">
                                            Entry Required Before Advancing to Step 4:
                                          </strong>
                                          <span>
                                            Please enter the material name, quantity, category, and specifications
                                            below. At least 1 material requirement is required.
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Inline Add Material Item Form */}
                                    <div className="pt-2.5 border-t border-amber-200/80 space-y-2.5">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-charcoal flex items-center gap-1">
                                          <Plus className="w-3.5 h-3.5 text-amber-700" /> Enter Material
                                          Specification
                                        </span>
                                        <button
                                          type="button"
                                          onClick={handleOpenAddRequirement}
                                          className="text-[11px] text-amber-900 font-bold hover:underline"
                                        >
                                          Open Full Modal ↗
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                                            Material Name *
                                          </label>
                                          <Input
                                            value={reqName}
                                            onChange={(e) => setReqName(e.target.value)}
                                            placeholder="e.g. 18mm BWP Marine Plywood"
                                            className="h-8 text-xs bg-white border-walnut/25"
                                          />
                                        </div>

                                        <div>
                                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                                            Category
                                          </label>
                                          <select
                                            value={reqCategory}
                                            onChange={(e) => setReqCategory(e.target.value)}
                                            className="w-full h-8 px-2.5 text-xs bg-white border border-walnut/25 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-amber-500"
                                          >
                                            <option value="Plywood">Plywood</option>
                                            <option value="Laminates">Laminates</option>
                                            <option value="Hardware">Hardware &amp; Fittings</option>
                                            <option value="Veneer">Veneer</option>
                                            <option value="Glass">Glass &amp; Mirrors</option>
                                            <option value="Sanitaryware">Sanitaryware</option>
                                            <option value="Electrical">Electrical</option>
                                            <option value="General">General Materials</option>
                                            <option value="OTHER">Other Category</option>
                                          </select>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                        <div>
                                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                                            Quantity *
                                          </label>
                                          <Input
                                            type="number"
                                            min="0.1"
                                            step="any"
                                            value={reqQuantity}
                                            onChange={(e) => setReqQuantity(parseFloat(e.target.value) || 1)}
                                            className="h-8 text-xs bg-white border-walnut/25"
                                          />
                                        </div>

                                        <div>
                                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                                            Unit
                                          </label>
                                          <select
                                            value={reqUnit}
                                            onChange={(e) => setReqUnit(e.target.value)}
                                            className="w-full h-8 px-2.5 text-xs bg-white border border-walnut/25 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-amber-500"
                                          >
                                            <option value="Sheets">Sheets</option>
                                            <option value="Sqft">Sqft</option>
                                            <option value="Nos">Nos</option>
                                            <option value="Kg">Kg</option>
                                            <option value="Boxes">Boxes</option>
                                            <option value="Meters">Meters</option>
                                            <option value="Units">Units</option>
                                          </select>
                                        </div>

                                        <div>
                                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                                            Specs / Brand
                                          </label>
                                          <Input
                                            value={reqAdditional}
                                            onChange={(e) => setReqAdditional(e.target.value)}
                                            placeholder="e.g. Century 710, 8x4 ft"
                                            className="h-8 text-xs bg-white border-walnut/25"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={reqNotes}
                                          onChange={(e) => setReqNotes(e.target.value)}
                                          placeholder="Optional notes / grade preferences..."
                                          className="h-8 text-xs bg-white border-walnut/25 flex-1"
                                        />
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="primary"
                                          onClick={handleQuickAddRequirementInline}
                                          disabled={!reqName.trim() || isSavingReq}
                                          className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1 shrink-0 cursor-pointer"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                          {isSavingReq ? "Saving..." : "+ Add Material Item"}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}

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
                                      onClick={() => {
                                        setContactModalInitialStatus("CONTACTED");
                                        setIsContactModalOpen(true);
                                      }}
                                      className="text-xs h-7 gap-1 text-teal-700 border-teal-300 bg-teal-50 hover:bg-teal-100 font-bold"
                                    >
                                      <PhoneCall className="w-3 h-3 text-teal-600" />
                                      Mark Contacted
                                    </Button>
                                  </div>
                                )}

                                {stageDef.key === "CONTACTED" && (
                                  <div className="flex items-center gap-2 pt-1 border-t border-walnut/10">
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={handleOpenAddRequirement}
                                      className="text-xs h-7 gap-1 bg-gold text-charcoal font-bold"
                                    >
                                      <Boxes className="w-3 h-3" />
                                      + Add Material Requirement
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStatusChange("MATERIAL_REQUIRED", inlineNoteText || undefined)}
                                      className="text-xs h-7 gap-1"
                                    >
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      Requirements Identified
                                    </Button>
                                  </div>
                                )}

                                {stageDef.key === "MATERIAL_REQUIRED" && (
                                  <div className="flex items-center gap-2 pt-1 border-t border-walnut/10">
                                    <Link
                                      href={`/quotations/new?type=MATERIAL&materialLeadId=${lead?.id || ""}&leadId=${lead?.id || ""}`}
                                    >
                                      <Button
                                        size="sm"
                                        variant="primary"
                                        className="text-xs h-7 gap-1 bg-gold text-charcoal font-bold"
                                      >
                                        <FileText className="w-3 h-3" />
                                        + Create Material Quotation
                                      </Button>
                                    </Link>
                                  </div>
                                )}

                                {stageDef.key === "QUOTATION_GENERATED" && (
                                  <div className="flex items-center gap-2 pt-1 border-t border-walnut/10">
                                    <Link
                                      href={`/quotations/new?type=MATERIAL&materialLeadId=${lead?.id || ""}&leadId=${lead?.id || ""}`}
                                    >
                                      <Button
                                        size="sm"
                                        variant="primary"
                                        className="text-xs h-7 bg-gold text-charcoal font-bold gap-1"
                                      >
                                        <FileText className="w-3 h-3" />
                                        {quotationsList.length > 0 ? "Edit Material Quotation" : "+ Create Material Quotation"}
                                      </Button>
                                    </Link>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStatusChange("QUOTATION_SENT", inlineNoteText || undefined)}
                                      className="text-xs h-7 gap-1 text-blue-700 border-blue-200 hover:bg-blue-50"
                                    >
                                      <Send className="w-3 h-3" />
                                      Mark Quotation Sent
                                    </Button>
                                  </div>
                                )}

                                {stageDef.key === "QUOTATION_SENT" && (
                                  <div className="flex items-center gap-3 pt-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStatusChange("LOST")}
                                      className="text-xs h-8 px-4 gap-1.5 text-rose-600 border-rose-300 hover:bg-rose-50 font-bold cursor-pointer"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Mark Lost
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => handleStatusChange("CONFIRMATION_FEE_PAID")}
                                      className="text-xs h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 cursor-pointer shadow-xs"
                                    >
                                      <Trophy className="w-4 h-4" />
                                      Mark Won &amp; Proceed to Advance Fee →
                                    </Button>
                                  </div>
                                )}

                                {/* STEP 7: CONFIRMATION FEE & PAYMENT INVOICE MANAGEMENT */}
                                {stageDef.key === "CONFIRMATION_FEE_PAID" && (() => {
                                  const isWon = activeMatIdx >= 5;
                                  const allQuotes = quotationsList;
                                  const finalizedQuotation =
                                    (attachedQuotationId ? allQuotes.find((q: any) => q.id === attachedQuotationId) : null) ||
                                    allQuotes.find((q: any) => q.status === "APPROVED" || q.status === "ACCEPTED" || q.status === "SENT") ||
                                    (allQuotes.length > 0 ? allQuotes[0] : null);

                                  const totalDealAmount = finalizedQuotation
                                    ? Number(finalizedQuotation.totalAmount || 0)
                                    : Number(lead?.estimatedBudget || 0);

                                  const allRecordedPayments = paymentsList;
                                  const recordedPaidAmount = allRecordedPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
                                  const hasRecordedPayments = allRecordedPayments.length > 0 || isFeePaid;

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
                                      <div className="p-3.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                        <div className="space-y-0.5">
                                          <div className="font-bold text-slate-800">
                                            {finalizedQuotation
                                              ? `Material Deal Baseline: ${finalizedQuotation.referenceNo} (${formatCurrency(totalDealAmount)})`
                                              : "No material quotation finalized yet"}
                                          </div>
                                          <p className="text-[11px] text-slate-500">
                                            Booking confirmation advance, official GST tax invoices, and supplier order placement will unlock when the lead is marked as Won in Step 6 above.
                                          </p>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="primary"
                                          onClick={async () => {
                                            await handleStatusChange("WON");
                                          }}
                                          className="text-xs py-1.5 h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0 cursor-pointer"
                                        >
                                          ✓ Mark Won &amp; Unlock Step 7
                                        </Button>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="space-y-3 pt-1 border-t border-walnut/10">
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
                                            {finalizedQuotation ? (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  router.push(`/quotations/${finalizedQuotation.id}?type=MATERIAL&materialLeadId=${lead?.id || ""}&leadId=${lead?.id || ""}`);
                                                }}
                                                className="text-[11px] py-1 h-6 bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-bold gap-1 cursor-pointer"
                                              >
                                                <Eye className="w-3 h-3" /> View Master Quotation
                                              </Button>
                                            ) : (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  router.push(`/quotations/new?type=MATERIAL&materialLeadId=${lead?.id || ""}&leadId=${lead?.id || ""}`);
                                                }}
                                                className="text-[11px] py-1 h-6 bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-bold gap-1 cursor-pointer"
                                              >
                                                <Package className="w-3 h-3 text-emerald-600" /> + Materials Quote
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
                                              Select Master Quotation Baseline ({quotationsList.length})
                                            </label>
                                            <div className="flex items-center gap-2">
                                              {quotationsList.length > 0 ? (
                                                <select
                                                  value={finalizedQuotation?.id || ""}
                                                  onChange={(e) => {
                                                    const qId = e.target.value;
                                                    setAttachedQuotationId(qId);
                                                    const found = quotationsList.find((q: any) => q.id === qId);
                                                    if (found) {
                                                      toast.success("Quotation Selected", `Switched to quotation ${found.referenceNo} (${formatCurrency(found.totalAmount)})`);
                                                    }
                                                  }}
                                                  className="flex-1 h-8 px-2 text-xs font-medium bg-white border border-indigo-300 rounded-md focus:ring-1 focus:ring-indigo-500 text-slate-900 cursor-pointer"
                                                >
                                                  {quotationsList.map((q: any) => (
                                                    <option key={q.id} value={q.id}>
                                                      {q.referenceNo} (Rev {q.revision || 1}) • {q.title || "Quotation"} • {formatCurrency(q.totalAmount)} • [{q.status}]
                                                    </option>
                                                  ))}
                                                </select>
                                              ) : (
                                                <span className="text-[11px] text-slate-500 italic">No quotations available for this material lead yet.</span>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Financial Summary */}
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
                                              : "Pending material order balance"}
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
                                                Attached Generated Invoices &amp; Payment Receipts
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
                                                                  router.push(`/quotations/${targetQuoteId}?type=MATERIAL&invoiceId=${invoiceId}&mode=INVOICE&amount=${encodeURIComponent(payment.amount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(payment.paymentMethod || 'UPI')}&ref=${encodeURIComponent(displayedInvRef)}&notes=${encodeURIComponent(cleanNotes || payment.notes || '')}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}&materialLeadId=${lead?.id || ''}&leadId=${lead?.id || ''}&step=7&readOnly=true`);
                                                                } else {
                                                                  router.push(`/quotations/new?type=MATERIAL&mode=INVOICE&invoiceId=${invoiceId}&materialLeadId=${lead?.id || ''}&leadId=${lead?.id || ''}&amount=${encodeURIComponent(payment.amount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(payment.paymentMethod || 'UPI')}&ref=${encodeURIComponent(displayedInvRef)}&notes=${encodeURIComponent(cleanNotes || payment.notes || '')}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}&readOnly=true`);
                                                                }
                                                              }}
                                                              className="text-[11px] py-1 h-7 bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-bold gap-1 cursor-pointer"
                                                              title="Open Generated Tax Invoice in Quotation Studio"
                                                            >
                                                              <Eye className="w-3.5 h-3.5 text-amber-700" />
                                                              View Invoice
                                                            </Button>
                                                            <Button
                                                              size="sm"
                                                              variant="outline"
                                                              onClick={() => window.open(`/api/v1/invoices/${invoiceId}/pdf`, '_blank')}
                                                              className="text-[11px] py-1 h-7 bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 font-bold gap-1 cursor-pointer"
                                                              title="Open Official Tax Invoice PDF"
                                                            >
                                                              <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                                              PDF ↗
                                                            </Button>
                                                          </>
                                                        ) : (
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                              const targetQuoteId = finalizedQuotation?.id || (allQuotes[0]?.id);
                                                              if (targetQuoteId) {
                                                                router.push(`/quotations/${targetQuoteId}?type=MATERIAL&mode=INVOICE&amount=${encodeURIComponent(payment.amount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(payment.paymentMethod || 'UPI')}&ref=${encodeURIComponent(displayedInvRef)}&notes=${encodeURIComponent(cleanNotes || payment.notes || '')}&title=${encodeURIComponent('TAX INVOICE / PAYMENT RECEIPT')}`);
                                                              } else {
                                                                router.push(`/quotations/new?type=MATERIAL&mode=INVOICE&materialLeadId=${lead?.id || ''}&leadId=${lead?.id || ''}&amount=${encodeURIComponent(payment.amount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(payment.paymentMethod || 'UPI')}&ref=${encodeURIComponent(displayedInvRef)}&notes=${encodeURIComponent(cleanNotes || payment.notes || '')}&title=${encodeURIComponent('TAX INVOICE / PAYMENT RECEIPT')}`);
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
                                                          onClick={() => handleSendWhatsApp(payment.id || "CONFIRMATION_FEE", `Material Supply Payment Invoice Receipt ${displayedInvRef} of ${formatCurrency(payment.amount)} for ${lead?.customerName || lead?.clientName}`)}
                                                          className="text-[11px] py-1 h-7 bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 font-bold cursor-pointer"
                                                          title="Share on WhatsApp"
                                                        >
                                                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                        </Button>
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
                                                          router.push(`/quotations/${finalizedQuotation.id}?type=MATERIAL&mode=INVOICE&amount=${encodeURIComponent(totalPaidAmount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(confirmationFeeType)}&ref=${encodeURIComponent(generatedInvoiceRef || confirmationFeeRef || 'INV-CONFIRMED')}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}`);
                                                        } else {
                                                          router.push(`/quotations/new?type=MATERIAL&mode=INVOICE&materialLeadId=${lead?.id || ''}&leadId=${lead?.id || ''}&amount=${encodeURIComponent(totalPaidAmount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(confirmationFeeType)}&ref=${encodeURIComponent(generatedInvoiceRef || confirmationFeeRef || 'INV-CONFIRMED')}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}`);
                                                        }
                                                      }}
                                                      className="text-[11px] py-1 h-7 bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 font-bold gap-1 cursor-pointer"
                                                    >
                                                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                                      👁 View Invoice
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
                                                Booking confirmation advance secured. Advance to Step 7 to order materials from suppliers.
                                              </span>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="primary"
                                              onClick={() => handleStatusChange("ORDER_PLACED", "Booking confirmation fee confirmed. Advancing to Order Materials.")}
                                              className="text-xs h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 cursor-pointer shadow-2xs"
                                            >
                                              <ShoppingCart className="w-3.5 h-3.5" />
                                              Proceed to Step 7: Order Materials →
                                            </Button>
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
                                              Material Quotation deal balance will be confirmed and unlocked for supplier procurement
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
                                                title="Leave blank to automatically assign next sequential invoice number"
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
                                                  📅 Handover / Target Delivery Date
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
                                                  ? `/quotations/${targetQuoteId}?type=MATERIAL&mode=INVOICE&amount=${encodeURIComponent(confirmationFeeAmount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(confirmationFeeType)}${invNo ? `&ref=${encodeURIComponent(invNo)}` : ''}&notes=${encodeURIComponent(confirmationFeeNotes)}&materialLeadId=${lead?.id || ''}&leadId=${lead?.id || ''}&returnToLead=${lead?.id || ''}&paymentDate=${encodeURIComponent(confirmationFeeDate)}${hDateParam}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}`
                                                  : `/quotations/new?type=MATERIAL&mode=INVOICE&materialLeadId=${lead?.id || ''}&leadId=${lead?.id || ''}&returnToLead=${lead?.id || ''}&amount=${encodeURIComponent(confirmationFeeAmount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(confirmationFeeType)}${invNo ? `&ref=${encodeURIComponent(invNo)}` : ''}&notes=${encodeURIComponent(confirmationFeeNotes)}&paymentDate=${encodeURIComponent(confirmationFeeDate)}${hDateParam}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}`;
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

                                {stageDef.key === "ORDER_PLACED" && (
                                  <div className="bg-white p-4 rounded-xl border border-cyan-200 shadow-2xs space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                      <div className="flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4 text-cyan-700" />
                                        <span className="text-xs font-bold text-cyan-950 uppercase tracking-wider">
                                          Admin Material Procurement &amp; Supplier Order
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-slate-500 font-medium">
                                        {requirementsList.length} Material item(s) configured for procurement
                                      </span>
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
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setVendorResponseMode("NEW_VENDOR");
                                          setIsVendorResponseModalOpen(true);
                                        }}
                                        className="text-xs h-8 px-3 gap-1.5 text-slate-700 border-slate-300 hover:bg-slate-50 font-bold cursor-pointer"
                                      >
                                        <Truck className="w-3.5 h-3.5 text-gold" />
                                        Send Direct Vendor Request
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {stageDef.key === "VENDOR_REQUEST" && (
                                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-walnut/10">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setVendorResponseMode("REJECTED");
                                        setIsVendorResponseModalOpen(true);
                                      }}
                                      className="text-xs h-8 gap-1 text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      Vendor Rejects
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => {
                                        setVendorResponseMode("ACCEPTED");
                                        setIsVendorResponseModalOpen(true);
                                      }}
                                      className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 cursor-pointer shadow-xs"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Vendor Accepts → Confirm &amp; Advance to Step 9
                                    </Button>
                                  </div>
                                )}

                                {stageDef.key === "ORDER_CONFIRMED" && (
                                  <div className="flex items-center gap-2 pt-1 border-t border-walnut/10">
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => handleStatusChange("ORDER_DELIVERED", inlineNoteText || undefined)}
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
                                  <div className="flex flex-col gap-1 pt-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          if (inlineNoteText.trim()) {
                                            handleAddInlineNote(stageDef.key);
                                          }
                                        }}
                                        disabled={!inlineNoteText.trim() || isSubmittingNote}
                                        className="text-xs py-1 h-7 text-charcoal bg-white border-walnut/20 font-semibold cursor-pointer"
                                      >
                                        Save Note on Current Step
                                      </Button>
                                      {nextStageDef && (() => {
                                        const isMissingMaterials = stageDef.key === "MATERIAL_REQUIRED" && requirementsList.length === 0;

                                        return (
                                          <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => {
                                              if (isMissingMaterials) {
                                                toast.error(
                                                  "Material Required",
                                                  "Please enter at least 1 material requirement with quantity and specifications before advancing to Step 4."
                                                );
                                                return;
                                              }
                                              handleStatusChange(nextStageDef.key, inlineNoteText || undefined);
                                              setInlineNoteText("");
                                            }}
                                            disabled={isMissingMaterials}
                                            className={`text-xs py-1 h-7 font-bold transition-all ${
                                              isMissingMaterials
                                                ? "bg-slate-300 text-slate-500 cursor-not-allowed border-slate-300 shadow-none hover:bg-slate-300"
                                                : "bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                                            }`}
                                            title={isMissingMaterials ? "Please enter at least 1 material item above to unlock Step 4" : undefined}
                                          >
                                            Advance to Step {nextStageDef.order}. {nextStageDef.title} →
                                          </Button>
                                        );
                                      })()}
                                    </div>
                                    {stageDef.key === "MATERIAL_REQUIRED" && requirementsList.length === 0 && (
                                      <p className="text-right text-[10px] text-rose-600 font-semibold mt-0.5">
                                        ⚠️ Please enter at least 1 material specification above to unlock Step 4
                                      </p>
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
              })()}
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

              {/* TAB 4: MATERIAL QUOTATIONS & GENERATED INVOICES */}
              {activeTab === "quotations" && (
                <div className="space-y-6">
                  {/* QUOTATIONS SECTION */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-charcoal flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gold" />
                          Linked Material Quotations ({quotationsList.length})
                        </h3>
                        <p className="text-xs text-walnut">Commercial proposals generated for this material lead.</p>
                      </div>
                      <Link
                        href={`/quotations/new?type=MATERIAL&materialLeadId=${lead?.id || ""}&leadId=${lead?.id || ""}`}
                      >
                        <Button size="sm" variant="primary" className="gap-1.5 text-xs font-bold">
                          <Plus className="w-3.5 h-3.5" />
                          + Create Material Quotation
                        </Button>
                      </Link>
                    </div>

                    {quotationsList.length === 0 ? (
                      <div className="p-8 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15 flex flex-col items-center gap-2.5">
                        <FileText className="w-7 h-7 text-gold/60" />
                        <p className="font-semibold text-charcoal">No material quotation generated yet.</p>
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
                            className="p-4 bg-white rounded-xl border border-walnut/15 shadow-2xs flex items-center justify-between gap-4 hover:border-gold/40 transition"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-charcoal">
                                  {q.referenceNo}
                                </span>
                                <Badge variant={q.status === "APPROVED" || q.status === "ACCEPTED" ? "active" : "pending"} className="text-[10px] uppercase">
                                  {q.status}
                                </Badge>
                              </div>
                              <div className="text-xs text-walnut">
                                Created on {formatDate(q.createdAt)} {q.title ? `• ${q.title}` : ""}
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <div>
                                <span className="text-[10px] text-walnut block">Total Amount</span>
                                <strong className="text-sm font-bold text-charcoal font-mono">
                                  {formatCurrency(q.totalAmount)}
                                </strong>
                              </div>
                              <Link href={`/quotations/${q.id}?type=MATERIAL&leadId=${lead?.id || ""}`}>
                                <Button size="sm" variant="ghost" className="p-1.5" title="View & Edit Quotation">
                                  <ExternalLink className="w-4 h-4 text-walnut hover:text-charcoal" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* GENERATED TAX INVOICES & BOOKING RECEIPTS SECTION */}
                  <div className="space-y-4 pt-4 border-t border-walnut/15">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-charcoal flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-emerald-600" />
                          Generated Tax Invoices &amp; Milestone Invoices ({invoicesList.length})
                        </h3>
                        <p className="text-xs text-walnut">Official GST tax invoices, booking confirmation receipts, and payments.</p>
                      </div>
                      <Link
                        href={`/quotations/${quotationsList[0]?.id || 'new'}?type=MATERIAL&mode=INVOICE&leadId=${lead?.id || ""}&returnToLead=${lead?.id || ""}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}`}
                      >
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-bold">
                          <Receipt className="w-3.5 h-3.5" />
                          + Generate Tax Invoice in Studio
                        </Button>
                      </Link>
                    </div>

                    {invoicesList.length === 0 ? (
                      <div className="p-8 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15 flex flex-col items-center gap-2">
                        <Receipt className="w-7 h-7 text-emerald-600/50" />
                        <p className="font-semibold text-charcoal">No tax invoices generated yet.</p>
                        <p className="text-[11px] text-walnut">Tax invoices created during Confirmation Fee or converted from quotations will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {invoicesList.map((inv: any) => {
                          const paid = inv.paidAmount || 0;
                          const total = inv.grandTotal || 0;
                          const outstanding = inv.outstandingAmount ?? Math.max(0, total - paid);
                          const isFullyPaid = inv.status === "PAID" || outstanding === 0;

                          return (
                            <div
                              key={inv.id || inv.invoiceNo}
                              className="p-4 bg-white rounded-xl border border-emerald-200/80 shadow-2xs space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-emerald-600" />
                                    <span className="font-mono text-xs font-bold text-charcoal">
                                      {inv.invoiceNo || "TAX INVOICE"}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                        isFullyPaid
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                          : inv.status === "PARTIALLY_PAID"
                                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                                          : "bg-amber-100 text-amber-800 border border-amber-200"
                                      }`}
                                    >
                                      {isFullyPaid ? "PAID" : inv.status || "ISSUED"}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    Invoice Date: {formatDate(inv.invoiceDate || inv.createdAt)}
                                    {inv.notes ? ` • ${inv.notes}` : ""}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/quotations/${inv.quotationId || quotationsList[0]?.id || ""}?type=MATERIAL&mode=INVOICE&invoiceId=${inv.id}&leadId=${lead?.id || ""}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}`}
                                  >
                                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1 font-semibold">
                                      <ExternalLink className="w-3 h-3" />
                                      View in Studio
                                    </Button>
                                  </Link>
                                  <a
                                    href={`/api/v1/invoices/${inv.id}/pdf`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Button size="sm" variant="ghost" className="text-xs h-7 gap-1 text-slate-700 hover:text-slate-900">
                                      <Download className="w-3 h-3" />
                                      PDF
                                    </Button>
                                  </a>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                                <div>
                                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Grand Total</span>
                                  <span className="font-mono text-xs font-bold text-slate-900">
                                    {formatCurrency(total)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-emerald-700 block uppercase font-bold">Amount Paid</span>
                                  <span className="font-mono text-xs font-bold text-emerald-700">
                                    {formatCurrency(paid)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Outstanding</span>
                                  <span className={`font-mono text-xs font-bold ${outstanding > 0 ? "text-amber-700" : "text-slate-600"}`}>
                                    {formatCurrency(outstanding)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: VENDORS & PROCUREMENT SUPPLIERS */}
              {activeTab === "vendors" && (
                <div className="space-y-5">
                  {/* Header & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-charcoal flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gold" />
                        Suppliers &amp; Procurement Vendors ({vendorsList.length})
                      </h3>
                      <p className="text-xs text-walnut">
                        Track registered vendors, supplier requests, material dispatches, and financial balances for this lead.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setIsPlaceOrderModalOpen(true)}
                        className="gap-1.5 text-xs font-bold shadow-2xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        + Order Materials / Dispatch
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setVendorResponseMode("NEW_VENDOR");
                          setIsVendorResponseModalOpen(true);
                        }}
                        className="gap-1.5 text-xs text-slate-700 font-semibold"
                      >
                        <Truck className="w-3.5 h-3.5 text-gold" />
                        + Direct Vendor Request
                      </Button>
                    </div>
                  </div>

                  {/* GLOBAL VENDOR FINANCIAL KPI CARDS FOR THIS MATERIAL LEAD */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-white border border-walnut/15 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Total Vendor Orders
                        </span>
                        <div className="p-1.5 rounded-md bg-amber-50 text-amber-700">
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="text-base sm:text-lg font-bold font-mono text-charcoal tabular-nums">
                        {formatCurrency(totalVendorOrdersValue)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {ordersList.length} Order(s) placed across {vendorsList.length} vendor(s)
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-walnut/15 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Money Paid to Vendors
                        </span>
                        <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
                          <DollarSign className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="text-base sm:text-lg font-bold font-mono text-emerald-700 tabular-nums">
                        {formatCurrency(totalVendorMoneyPaid)}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">
                        {totalVendorOrdersValue > 0
                          ? `${Math.round((totalVendorMoneyPaid / totalVendorOrdersValue) * 100)}% of total order value disbursed`
                          : "No disbursements recorded"}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-walnut/15 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Remaining Vendor Balance
                        </span>
                        <div className={`p-1.5 rounded-md ${totalVendorRemainingBalance > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                          <Receipt className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className={`text-base sm:text-lg font-bold font-mono tabular-nums ${totalVendorRemainingBalance > 0 ? "text-amber-800" : "text-emerald-700"}`}>
                        {formatCurrency(totalVendorRemainingBalance)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {totalVendorRemainingBalance > 0 ? "Pending payable balance" : "All vendor dues cleared"}
                      </div>
                    </div>
                  </div>

                  {/* VENDORS LIST & CARDS WITH INDIVIDUAL KPIS */}
                  {vendorsList.length === 0 ? (
                    <div className="p-10 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15 flex flex-col items-center gap-3">
                      <Truck className="w-8 h-8 text-gold/60" />
                      <p className="font-semibold text-charcoal">No suppliers or procurement vendors assigned yet.</p>
                      <p className="text-[11px] text-walnut max-w-sm">
                        Select a certified vendor to order required materials, request bulk price quotes, or dispatch orders.
                      </p>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setIsPlaceOrderModalOpen(true)}
                        className="gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        + Select Vendor &amp; Order Materials
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {vendorsList.map((v: any) => {
                        const vendorOrderVal = Number(v.finalAmount) || 0;
                        const vendorPaid = Number(v.paidAmount) || 0;
                        const vendorBal = Math.max(0, vendorOrderVal - vendorPaid);

                        return (
                          <div
                            key={v.id || v.name}
                            className="p-4 bg-white rounded-xl border border-walnut/15 shadow-2xs space-y-3.5 hover:border-gold/30 transition"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => v.id && setSelectedVendorIdForModal(v.id)}
                                    className="font-bold text-sm text-charcoal hover:text-gold transition text-left cursor-pointer flex items-center gap-1.5"
                                  >
                                    <span>{v.name}</span>
                                    <ExternalLink className="w-3 h-3 text-walnut/60" />
                                  </button>
                                  <span className="text-xs text-slate-500 font-medium">
                                    ({v.category})
                                  </span>
                                  <Badge
                                    variant={
                                      v.status === "ACCEPTED" || v.status === "CONFIRMED_ORDER"
                                        ? "active"
                                        : v.status === "REJECTED"
                                        ? "pending"
                                        : "pending"
                                    }
                                    className="text-[10px] uppercase font-bold"
                                  >
                                    {v.status === "CONFIRMED_ORDER"
                                      ? "CONFIRMED ORDER"
                                      : v.status === "ACCEPTED"
                                      ? "ACCEPTED"
                                      : v.status === "REJECTED"
                                      ? "REJECTED"
                                      : "REQUEST SENT"}
                                  </Badge>
                                </div>
                                <div className="text-xs text-walnut flex items-center gap-3">
                                  {v.phone && v.phone !== "N/A" && (
                                    <a
                                      href={`tel:${v.phone}`}
                                      className="flex items-center gap-1 text-slate-700 hover:text-gold font-mono font-medium"
                                    >
                                      <Phone className="w-3 h-3 text-gold" />
                                      {v.phone}
                                    </a>
                                  )}
                                  {v.requestedAt && (
                                    <span>• Requested on {formatDate(v.requestedAt)}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => v.id && setSelectedVendorIdForModal(v.id)}
                                  className="text-xs h-7 font-bold text-slate-700 border-slate-300 hover:bg-slate-50 gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3 text-gold" />
                                  View Vendor Profile &amp; KPIs ↗
                                </Button>
                                {v.status === "REQUEST_SENT" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setVendorResponseMode("ACCEPTED");
                                      setIsVendorResponseModalOpen(true);
                                    }}
                                    className="text-xs h-7 font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                  >
                                    Record Response
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => setIsPlaceOrderModalOpen(true)}
                                  className="text-xs h-7 font-bold gap-1"
                                >
                                  <ShoppingCart className="w-3 h-3" />
                                  + Create Order
                                </Button>
                              </div>
                            </div>

                            {/* VENDOR SPECIFIC FINANCIAL KPI STRIP */}
                            <div className="grid grid-cols-3 gap-2 text-center bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                                  Total Order Value
                                </span>
                                <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                                  {formatCurrency(vendorOrderVal)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                                  Amount Paid
                                </span>
                                <span className="font-mono text-xs font-bold text-emerald-700 tabular-nums">
                                  {formatCurrency(vendorPaid)}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                                  Remaining Balance
                                </span>
                                <span className={`font-mono text-xs font-bold tabular-nums ${vendorBal > 0 ? "text-amber-700" : "text-slate-600"}`}>
                                  {formatCurrency(vendorBal)}
                                </span>
                              </div>
                            </div>

                            {(v.notes || v.rejectionReason) && (
                              <div className="text-xs space-y-1 bg-amber-50/40 p-2 rounded border border-amber-100">
                                {v.notes ? (
                                  <div className="text-slate-700 text-[11px]">
                                    <span className="font-semibold text-charcoal">Notes: </span>
                                    {v.notes}
                                  </div>
                                ) : null}

                                {v.rejectionReason ? (
                                  <div className="text-rose-700 text-[11px] font-medium">
                                    <span className="font-bold">Rejection Note: </span>
                                    {v.rejectionReason}
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                  {(() => {
                    const displayVendorRequests = (lead?.vendorRequests || []).filter(
                      (vr: any, index: number, self: any[]) =>
                        index === self.findIndex((t: any) => t.id === vr.id || (t.vendorId === vr.vendorId && (t.requestedAt === vr.requestedAt || (t.status === "PENDING" && vr.status === "PENDING"))))
                    );
                    if (displayVendorRequests.length === 0) return null;

                    return (
                      <div className="bg-white rounded-xl border border-walnut/15 shadow-2xs p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-gold" />
                            Vendor Request History
                          </h4>
                          <span className="text-[10px] text-walnut">
                            {displayVendorRequests.length} request record(s)
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
                              {displayVendorRequests.map((vr: any, idx: number) => (
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
                    );
                  })()}
                </div>
              )}

              {/* TAB: EXPENSES */}
              {activeTab === "expenses" && (() => {
                const expensesList = lead?.expenses || [];
                const totalExpenses = expensesList.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

                return (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-charcoal">Expenses &amp; Outflow</h3>
                        <p className="text-xs text-walnut">Recorded supply and procurement expenses for this lead.</p>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="gap-1.5 text-xs font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        + Add Expense
                      </Button>
                    </div>

                    {/* Summary KPI */}
                    {expensesList.length > 0 && (
                      <div className="p-3.5 bg-white rounded-xl border border-walnut/15 shadow-2xs flex items-center justify-between">
                        <span className="text-xs font-bold text-charcoal uppercase tracking-wider">Total Recorded Expenses</span>
                        <span className="text-base font-bold font-mono text-rose-700">{formatCurrency(totalExpenses)}</span>
                      </div>
                    )}

                    {expensesList.length === 0 ? (
                      <div className="p-12 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15 flex flex-col items-center gap-3">
                        <DollarSign className="w-8 h-8 text-gold/60" />
                        <p className="font-semibold text-charcoal">No expenses recorded for this material supply lead yet.</p>
                        <Button size="sm" variant="outline" onClick={() => setIsExpenseModalOpen(true)} className="text-xs">
                          + Record First Expense
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-walnut/15 shadow-2xs overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-walnut/15 text-[11px] text-walnut uppercase font-semibold bg-slate-50/70">
                              <th className="py-2.5 px-3">Expense Item / Title</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-walnut/10 font-mono">
                            {expensesList.map((exp: any) => (
                              <tr key={exp.id} className="hover:bg-cream/30">
                                <td className="py-2.5 px-3 font-sans font-semibold text-charcoal">
                                  {exp.description || exp.notes || "Material Expense"}
                                </td>
                                <td className="py-2.5 px-3 font-sans text-walnut">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-700">
                                    {exp.category?.name || exp.categoryKey || "MATERIAL"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-walnut">
                                  {formatDate(exp.expenseDate || exp.createdAt)}
                                </td>
                                <td className="py-2.5 px-3">
                                  <Badge variant={exp.status === "APPROVED" || exp.status === "PAID" ? "completed" : "pending"} className="text-[10px]">
                                    {exp.status || "PENDING"}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                                  {formatCurrency(exp.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* TAB: PAYMENTS */}
              {activeTab === "payments" && (() => {
                const allQuotes = quotationsList;
                const finalizedQuotation =
                  allQuotes.find((q: any) => q.status === "APPROVED" || q.status === "ACCEPTED" || q.status === "SENT") ||
                  (allQuotes.length > 0 ? allQuotes[0] : null);

                const totalDealAmount = finalizedQuotation
                  ? Number(finalizedQuotation.totalAmount || 0)
                  : Number(lead?.estimatedBudget || 0);

                const recordedPaidAmount = paymentsList.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
                const remainingBalance = Math.max(0, totalDealAmount - recordedPaidAmount);
                const paidPct = totalDealAmount > 0 ? ((recordedPaidAmount / totalDealAmount) * 100).toFixed(1) : "0.0";

                return (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-charcoal">Customer Payments &amp; Receipts</h3>
                        <p className="text-xs text-walnut">Booking advances, confirmation fees, and official GST tax invoices.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/quotations/new?type=MATERIAL&materialLeadId=${lead?.id || ""}&leadId=${lead?.id || ""}`}>
                          <Button size="sm" variant="outline" className="text-xs gap-1 border-teal-300 text-teal-900 bg-teal-50 hover:bg-teal-100 font-semibold">
                            <Package className="w-3.5 h-3.5 text-teal-700" />
                            + Materials Quote
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setActiveTab("pipeline");
                          }}
                          className="text-xs gap-1 bg-gold text-charcoal font-bold hover:bg-gold/90"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Record Confirmation Fee
                        </Button>
                      </div>
                    </div>

                    {/* Financial Summary KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3.5 rounded-xl border border-walnut/15 shadow-2xs">
                        <span className="text-[11px] font-bold text-walnut uppercase tracking-wider block">Total Material Deal</span>
                        <div className="text-base font-bold font-mono text-charcoal mt-1">{formatCurrency(totalDealAmount)}</div>
                        <span className="text-[10px] text-walnut mt-0.5 block">{finalizedQuotation ? finalizedQuotation.referenceNo : "Estimated Budget"}</span>
                      </div>
                      <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Received</span>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">{paidPct}%</span>
                        </div>
                        <div className="text-base font-bold font-mono text-emerald-700 mt-1">{formatCurrency(recordedPaidAmount)}</div>
                        <span className="text-[10px] text-emerald-700 mt-0.5 block">{paymentsList.length} receipt(s) recorded</span>
                      </div>
                      <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
                        <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider block">Remaining Due</span>
                        <div className="text-base font-bold font-mono text-amber-900 mt-1">{formatCurrency(remainingBalance)}</div>
                        <span className="text-[10px] text-amber-800 mt-0.5 block">{remainingBalance === 0 && totalDealAmount > 0 ? "✓ Fully Settled" : "Pending collection"}</span>
                      </div>
                    </div>

                    {paymentsList.length === 0 ? (
                      <div className="p-12 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15 flex flex-col items-center gap-3">
                        <Receipt className="w-8 h-8 text-gold/60" />
                        <p className="font-semibold text-charcoal">No customer payments recorded for this material lead yet.</p>
                        <p className="text-[11px] text-walnut/70 max-w-sm">
                          Once the lead is won, record booking confirmation fees or stage payments in the pipeline stepper.
                        </p>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setActiveTab("pipeline")}
                          className="bg-gold text-charcoal font-bold"
                        >
                          + Record Advance Payment in Stepper
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {paymentsList.map((payment: any, index: number) => {
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
                              className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-walnut/15 shadow-2xs text-xs"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0 font-bold text-xs mt-0.5">
                                  #{index + 1}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-charcoal text-xs">
                                      {displayedInvRef}
                                    </span>
                                    <Badge variant="completed" className="text-[10px] py-0 px-1.5 font-bold">
                                      ✓ {payment.status || "PAID"}
                                    </Badge>
                                    <span className="text-[11px] text-walnut font-medium">
                                      • {paymentDateFormatted}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-walnut">
                                    <span className="font-medium">Mode: <strong className="text-charcoal">{payment.paymentMethod || "UPI"}</strong></span>
                                    {payment.referenceNoExt && (
                                      <span>(Ref: <code className="font-mono text-charcoal">{payment.referenceNoExt}</code>)</span>
                                    )}
                                    {cleanNotes && (
                                      <span className="text-walnut/80 italic">• {cleanNotes}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-walnut/10">
                                <div className="text-right">
                                  <div className="text-[10px] text-walnut uppercase font-semibold">Payment Amount</div>
                                  <div className="font-mono font-bold text-sm text-emerald-700">
                                    {formatCurrency(payment.amount)}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {invoiceId && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const targetQuoteId = payment.quotationId || finalizedQuotation?.id || (allQuotes.length > 0 ? allQuotes[0].id : null);
                                          if (targetQuoteId) {
                                            router.push(`/quotations/${targetQuoteId}?type=MATERIAL&invoiceId=${invoiceId}&mode=INVOICE&amount=${encodeURIComponent(payment.amount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(payment.paymentMethod || 'UPI')}&ref=${encodeURIComponent(displayedInvRef)}&notes=${encodeURIComponent(cleanNotes || payment.notes || '')}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}&materialLeadId=${lead?.id || ''}&leadId=${lead?.id || ''}&step=7&readOnly=true`);
                                          } else {
                                            router.push(`/quotations/new?type=MATERIAL&mode=INVOICE&invoiceId=${invoiceId}&materialLeadId=${lead?.id || ''}&leadId=${lead?.id || ''}&amount=${encodeURIComponent(payment.amount)}&paymentType=${encodeURIComponent('Booking Confirmation Fee')}&paymentMode=${encodeURIComponent(payment.paymentMethod || 'UPI')}&ref=${encodeURIComponent(displayedInvRef)}&notes=${encodeURIComponent(cleanNotes || payment.notes || '')}&title=${encodeURIComponent('BOOKING CONFIRMATION TAX INVOICE')}&readOnly=true`);
                                          }
                                        }}
                                        className="text-[11px] py-1 h-7 bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-bold gap-1 cursor-pointer"
                                        title="Open Generated Tax Invoice in Quotation Studio"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-amber-700" />
                                        View
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(`/api/v1/invoices/${invoiceId}/pdf`, '_blank')}
                                        className="text-[11px] py-1 h-7 bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 font-bold gap-1 cursor-pointer"
                                        title="Open Official Tax Invoice PDF"
                                      >
                                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                        PDF ↗
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSendWhatsApp(payment.id || "CONFIRMATION_FEE", `Material Supply Payment Invoice Receipt ${displayedInvRef} of ${formatCurrency(payment.amount)} for ${lead?.customerName || lead?.clientName}`)}
                                    className="text-[11px] py-1 h-7 bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 font-bold cursor-pointer"
                                    title="Share on WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isDeletingPaymentId === payment.id}
                                    onClick={() => handleDeleteRecordedPayment(payment.id, invoiceId, displayedInvRef)}
                                    className="text-[11px] py-1 h-7 bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-400 font-bold cursor-pointer transition-colors"
                                    title="Delete this payment record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* TAB: TIMELINE */}
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
        onResponseSubmitted={async () => {
          toast.success(
            "Vendor Status Updated",
            vendorResponseMode === "ACCEPTED"
              ? "Order confirmed and advanced to Step 9: Confirmed Order & Invoicing"
              : vendorResponseMode === "REJECTED"
              ? "Vendor rejection recorded. You can select another vendor."
              : "New vendor request dispatched"
          );
          if (vendorResponseMode === "ACCEPTED") {
            await handleStatusChange("ORDER_CONFIRMED", "Vendor accepted material order. Advanced to Step 9 Confirmed Order.");
          }
          await fetchDetails();
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
              <ClockTimePicker
                value={followUpTime}
                onChange={(val) => setFollowUpTime(val)}
                placeholder="Select follow-up time"
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

      {/* MODAL: DELETE MATERIAL LEAD AUTHORIZATION */}
      <DeleteMaterialLeadModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => {
          setIsDeleteModalOpen(false);
          onClose();
          onUpdate();
        }}
        initialLeadId={lead?.id}
      />

      {/* 4-STEP VENDOR SELECTION & MATERIAL PROCUREMENT ORDER MODAL */}
      <MaterialOrderWorkflowModal
        isOpen={isPlaceOrderModalOpen}
        onClose={() => setIsPlaceOrderModalOpen(false)}
        materialLeadId={lead?.id}
        projectTitle={lead?.customerName ? `${lead?.customerName}'s Material Project` : undefined}
        orderType="Material Procurement Order"
        initialMaterials={
          (lead?.requirements || data?.requirements || []).map((r: any) => ({
            materialName: r.materialName || "Material Item",
            quantity: Number(r.quantity) || 1,
            unitKey: r.unitKey || r.unit || "NOS",
            referencePrice: r.proposedRate || r.referencePrice || undefined,
          }))
        }
        onSuccess={() => {
          setIsPlaceOrderModalOpen(false);
          fetchDetails();
          onUpdate();
        }}
      />

      {/* VENDOR DETAIL MODAL WITH FULL KPIS, ORDER HISTORY & MATERIALS */}
      <VendorDetailModal
        isOpen={Boolean(selectedVendorIdForModal)}
        vendorId={selectedVendorIdForModal}
        onClose={() => setSelectedVendorIdForModal(null)}
        onRefresh={() => {
          fetchDetails();
          onUpdate();
        }}
      />

      {/* MODAL: EDIT MATERIAL LEAD DETAILS */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Material Lead Details"
        maxWidth="md"
      >
        <form onSubmit={handleSaveEditLead} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">Customer Name *</label>
              <Input
                value={editForm.customerName}
                onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">Primary Phone *</label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">Secondary Contact</label>
              <Input
                value={editForm.secondaryContact}
                onChange={(e) => setEditForm({ ...editForm, secondaryContact: e.target.value })}
                placeholder="Optional second phone"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">Email Address</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="client@example.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">Location / Site City</label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="e.g. Hyderabad, Telangana"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">Priority</label>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                className="w-full h-9 px-2.5 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">Requirement &amp; Scope Summary</label>
            <textarea
              value={editForm.requirement}
              onChange={(e) => setEditForm({ ...editForm, requirement: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">Internal Notes</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
              rows={2}
              placeholder="Additional lead background or handover notes..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-walnut/10">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" disabled={isUpdatingLead} className="bg-gold text-charcoal font-bold">
              {isUpdatingLead ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD MATERIAL EXPENSE */}
      {isExpenseModalOpen && lead && (
        <AddExpenseModal
          isOpen={isExpenseModalOpen}
          initialLeadId={lead.id}
          initialLeadName={lead.customerName || lead.clientName}
          initialLeadRequirement={lead.requirement}
          initialExpenseType="MATERIAL"
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={() => {
            setIsExpenseModalOpen(false);
            toast.success("Expense Recorded", "Expense added to material supply lead.");
            fetchDetails();
            onUpdate();
          }}
        />
      )}

      {/* MODAL: RECORD PAYMENT & GENERATE INVOICE */}
      {isRecordPaymentModalOpen && lead && (
        <RecordPaymentModal
          isOpen={isRecordPaymentModalOpen}
          onClose={() => setIsRecordPaymentModalOpen(false)}
          onSuccess={() => {
            setIsRecordPaymentModalOpen(false);
            toast.success("Payment Recorded", "Payment recorded and invoice generated.");
            fetchDetails();
            onUpdate();
          }}
          initialLeadId={lead.id}
          initialClientId={lead.clientId}
          initialPaymentType="Booking Confirmation Fee"
        />
      )}
    </>
  );
};
