"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { RecordPaymentModal } from "@/components/payments/record-payment-modal";
import { AddExpenseModal } from "@/components/expenses/add-expense-modal";
import { ExpenseDetailsModal } from "@/components/expenses/expense-details-modal";
import { MaterialOrderWorkflowModal } from "./material-order-workflow-modal";
import { StartAnotherProjectModal } from "./start-another-project-modal";
import { EntityAuditSection } from "@/components/audit/entity-audit-section";
import {
  X,
  Users,
  FileText,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  MessageSquare,
  Clock,
  Briefcase,
  Layers,
  CheckSquare,
  Award,
  Phone,
  Mail,
  MapPin,
  Building2,
  Check,
  ExternalLink,
  Edit2,
  Trash2,
  ShoppingBag,
  Truck,
  Receipt,
  RotateCcw,
  Target,
  UserCheck,
  RefreshCw,
  Eye,
  TrendingUp,
  PieChart,
  Printer,
  Download,
  Send,
  Star,
  Unlink,
  Link2,
  CheckCircle,
  Package,
} from "lucide-react";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { CANONICAL_STAGE_DEFINITIONS } from "@/modules/projects/project-stage.service";

interface ProjectWorkspaceProps {
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onOpenLead?: (leadId: string) => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  projectId,
  isOpen,
  onClose,
  onUpdate,
  onOpenLead,
}) => {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "pipeline"
    | "quotations"
    | "expenses"
    | "materials"
    | "vendors"
    | "payments"
    | "timeline"
    | "audit"
    | "client"
  >("overview");

  // Quotation Management States
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppRecipient, setWhatsAppRecipient] = useState("");
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isLinkQuotationModalOpen, setIsLinkQuotationModalOpen] = useState(false);
  const [availableQuotations, setAvailableQuotations] = useState<any[]>([]);
  const [isLoadingAvailableQuotes, setIsLoadingAvailableQuotes] = useState(false);
  const [isLinkingQuote, setIsLinkingQuote] = useState(false);
  const [quoteSearchTerm, setQuoteSearchTerm] = useState("");
  const [isDeletingQuotation, setIsDeletingQuotation] = useState<string | null>(null);

  // Stage change state
  const [selectedStage, setSelectedStage] = useState("");
  const [delayReason, setDelayReason] = useState("CLIENT_DECISION");
  const [stageNotes, setStageNotes] = useState("");
  const [isChangingStage, setIsChangingStage] = useState(false);
  const [advanceModalStage, setAdvanceModalStage] = useState<any>(null);
  const [advanceModalNotes, setAdvanceModalNotes] = useState("");
  const [activeStageTransitionNotes, setActiveStageTransitionNotes] = useState("");

  // Inline Note Form per stage/card
  const [activeNoteStage, setActiveNoteStage] = useState<string | null>(null);
  const [inlineNoteText, setInlineNoteText] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Material Selection Mandatory Notes State
  const [materialNotesText, setMaterialNotesText] = useState("");
  const [isSavingMaterialNotes, setIsSavingMaterialNotes] = useState(false);
  const [isMaterialPromptModalOpen, setIsMaterialPromptModalOpen] = useState(false);
  const [pendingNextStage, setPendingNextStage] = useState<string | null>(null);
  const [isEditingExistingMaterialNotes, setIsEditingExistingMaterialNotes] = useState(false);

  // Expense modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [isExpenseDetailsModalOpen, setIsExpenseDetailsModalOpen] = useState(false);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  // Material / PO workflow modal state
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialOrderType, setMaterialOrderType] = useState<"Raw Material Order" | "Laminate Order" | "General Material Order">("Raw Material Order");

  // Edit Project Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    propertyType: "RESIDENTIAL",
    location: "",
    contractValue: "",
    status: "IN_PROGRESS",
    targetDate: "",
    notes: "",
  });

  // Delete Project Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Payment modal
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);

  // Start Another Project Modal
  const [isStartAnotherProjectOpen, setIsStartAnotherProjectOpen] = useState(false);

  // Keyboard Escape listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        isOpen &&
        !isEditModalOpen &&
        !isDeleteModalOpen &&
        !isExpenseModalOpen &&
        !isMaterialModalOpen &&
        !isRecordPaymentModalOpen &&
        !isMaterialPromptModalOpen
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
    isExpenseModalOpen,
    isMaterialModalOpen,
    isRecordPaymentModalOpen,
    isMaterialPromptModalOpen,
    onClose,
  ]);

  const fetchProjectDetails = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/projects/${projectId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load project details");
      }
      setData(json.data);
      setSelectedStage(json.data.project.stage);
    } catch (err: any) {
      setError(err.message || "Failed to load project");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectDetails();
    }
  }, [isOpen, projectId, fetchProjectDetails]);

  const project = data?.project;
  const timeline = data?.timeline || [];
  const delayHealth = data?.delayHealth || { status: "ON_TIME", text: "On Schedule" };

  // Check existing Material Selection notes from history
  const materialHistoryEntry = project?.stageHistory?.find(
    (sh: any) =>
      (sh.toStage === "MATERIAL_SELECTION" || sh.fromStage === "MATERIAL_SELECTION") &&
      sh.notes &&
      sh.notes.trim().length >= 3 &&
      !sh.notes.trim().toLowerCase().startsWith("stage advanced to") &&
      !sh.notes.trim().toLowerCase().startsWith("converted to project")
  );

  const rawMatNotes = materialHistoryEntry?.notes || "";
  const cleanedMaterialNotes = rawMatNotes
    .replace(/\[WEBSITE_ENQUIRY_METADATA\]:[\s\S]*/gi, "")
    .replace(/^Material Selection Confirmed:\s*/i, "")
    .trim();

  const savedMaterialSelectionNotes = cleanedMaterialNotes || (materialNotesText ? materialNotesText.trim() : "");
  const hasMaterialSelectionNotes = Boolean(
    savedMaterialSelectionNotes && savedMaterialSelectionNotes.length >= 3
  );

  // Stage Change Handler with Optional Stage Notes and Mandatory Material Selection Precondition
  const handleStageChange = async (newStage: string, overrideNotes?: string) => {
    if (!projectId) return;

    // Check if moving past MATERIAL_SELECTION without notes
    const currentNorm = project?.stage || "CONFIRMATION_FEE_PAID";
    const currentDef = CANONICAL_STAGE_DEFINITIONS.find((s) => s.key === currentNorm);
    const targetDef = CANONICAL_STAGE_DEFINITIONS.find((s) => s.key === newStage);

    const currentOrder = currentDef ? currentDef.order : 0;
    const targetOrder = targetDef ? targetDef.order : 0;

    const providedNote = (overrideNotes || advanceModalNotes || activeStageTransitionNotes || "").trim();

    const hasNotesNow = Boolean(
      (providedNote && providedNote.length >= 3) ||
      (materialNotesText && materialNotesText.trim().length >= 3) ||
      hasMaterialSelectionNotes
    );

    if (
      ((currentNorm === "MATERIAL_SELECTION" && targetOrder > currentOrder) ||
       (currentOrder < 4 && targetOrder > 4)) &&
      !hasNotesNow
    ) {
      setPendingNextStage(newStage);
      setIsMaterialPromptModalOpen(true);
      return;
    }

    setIsChangingStage(true);
    setError("");

    try {
      const finalNotes =
        providedNote ||
        (newStage === "RAW_MATERIAL_ORDERED" && materialNotesText ? materialNotesText : undefined) ||
        (newStage === "RAW_MATERIAL_ORDERED" && currentNorm === "MATERIAL_SELECTION" && hasMaterialSelectionNotes
          ? `Material Selection Confirmed: ${savedMaterialSelectionNotes}`
          : undefined);

      const res = await fetch(`/api/v1/projects/${projectId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: newStage,
          toStage: newStage,
          notes: finalNotes || undefined,
          delayReason: delayHealth?.status === "DELAYED" ? delayReason : undefined,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const msg = json?.error?.message || json?.message || "Failed to update execution stage";
        setError(msg);
        toast.error("Stage Transition Failed", msg);
        return;
      }

      setSuccessMsg(`Project stage advanced to ${newStage.replace(/_/g, " ")}`);
      toast.success("Project Stage Advanced", `Moved to ${newStage.replace(/_/g, " ")}`);
      setSelectedStage(newStage);
      setIsMaterialPromptModalOpen(false);
      setPendingNextStage(null);
      setMaterialNotesText("");
      setAdvanceModalStage(null);
      setAdvanceModalNotes("");
      setActiveStageTransitionNotes("");
      await fetchProjectDetails();
      onUpdate();
    } catch (err: any) {
      const msg = err?.message || "Network error advancing stage";
      setError(msg);
      toast.error("Stage Transition Failed", msg);
    } finally {
      setIsChangingStage(false);
    }
  };

  // Complete & Finish All Stages Handler
  const [isCompletingProject, setIsCompletingProject] = useState(false);

  const handleCompleteProject = async (notes?: string) => {
    if (!projectId) return;
    setIsCompletingProject(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          stage: "PROJECT_COMPLETED",
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error("Failed to complete project", json?.error?.message || "Could not complete project");
        return;
      }

      // Record completion remark in stage history
      const finalNote = (notes || activeStageTransitionNotes || "").trim() || "Project execution successfully completed, quality sign-off confirmed, and handed over.";
      await handleSaveStageNote("PROJECT_COMPLETED", finalNote).catch(() => {});

      setActiveStageTransitionNotes("");
      toast.success("🎉 Project Completed!", "All stages finished. The entire project is marked as 100% completed and green.");
      await fetchProjectDetails();
      onUpdate();
    } catch {
      toast.error("Network Error", "Could not complete project");
    } finally {
      setIsCompletingProject(false);
    }
  };

  const handleReopenProject = async () => {
    if (!projectId) return;
    setIsCompletingProject(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ACTIVE",
          stage: "PROJECT_COMPLETED",
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error("Failed to re-open project", json?.error?.message || "Could not re-open project");
        return;
      }
      toast.success("Project Re-opened", "Project status set back to Active / In Execution.");
      await fetchProjectDetails();
      onUpdate();
    } catch {
      toast.error("Network Error", "Could not re-open project");
    } finally {
      setIsCompletingProject(false);
    }
  };

  // Save Material Selection Notes Directly
  const handleSaveMaterialNotes = async () => {
    if (!materialNotesText.trim() || !projectId) return;
    setIsSavingMaterialNotes(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: `[Material Selection] ${materialNotesText.trim()}`,
          stage: "MATERIAL_SELECTION",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Failed to Save Notes", json.error?.message || "Could not save material selection notes");
        return;
      }

      // Also persist to project notes
      await fetch(`/api/v1/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: materialNotesText.trim(),
        }),
      });

      toast.success("Material Notes Recorded", "Material specifications saved. Next step is unlocked.");
      setIsEditingExistingMaterialNotes(false);
      await fetchProjectDetails();
      onUpdate();
    } catch {
      toast.error("Network Error", "Could not save material selection notes.");
    } finally {
      setIsSavingMaterialNotes(false);
    }
  };

  // Save Optional Note for Any Project Stage
  const handleSaveStageNote = async (stageKey: string, noteText: string) => {
    if (!noteText.trim() || !projectId) return;
    setIsSubmittingNote(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: `[Stage: ${stageKey.replace(/_/g, " ")}] ${noteText.trim()}`,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Failed to Save Note", json.error?.message || "Could not save stage note");
        return;
      }

      toast.success("Stage Note Saved", "Note recorded and added to project history.");
      setActiveNoteStage(null);
      setInlineNoteText("");
      await fetchProjectDetails();
      onUpdate();
    } catch {
      toast.error("Network Error", "Could not save stage note.");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Add Inline Note
  const handleAddInlineNote = async (stageKey?: string) => {
    if (!inlineNoteText.trim() || !projectId) return;
    setIsSubmittingNote(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: inlineNoteText.trim(),
          stage: stageKey || project?.stage,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setInlineNoteText("");
        setActiveNoteStage(null);
        toast.success("Note Added", "Note recorded on project timeline");
        await fetchProjectDetails();
        onUpdate();
      }
    } catch {
      setError("Failed to add project note");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Delete Expense Handler
  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    setIsDeletingExpense(true);
    try {
      const res = await fetch(`/api/v1/expenses/${expenseId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to delete expense");
        return;
      }
      setSuccessMsg("Expense deleted successfully");
      await fetchProjectDetails();
      onUpdate();
    } catch {
      setError("Network error deleting expense");
    } finally {
      setIsDeletingExpense(false);
    }
  };

  // Edit Project Handler
  const openEditModal = () => {
    if (!project) return;
    setEditForm({
      title: project.title || "",
      propertyType: project.propertyType || "RESIDENTIAL",
      location: project.location || "",
      contractValue: project.contractValue ? String(project.contractValue) : "",
      status: project.status || "IN_PROGRESS",
      targetDate: project.targetCompletionDate ? project.targetCompletionDate.substring(0, 10) : "",
      notes: project.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setIsUpdatingProject(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          contractValue: editForm.contractValue ? parseFloat(editForm.contractValue) : undefined,
          targetCompletionDate: editForm.targetDate ? new Date(editForm.targetDate) : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to update project");
        return;
      }

      setIsEditModalOpen(false);
      setSuccessMsg("Project details updated successfully");
      await fetchProjectDetails();
      onUpdate();
    } catch {
      setError("Network error updating project");
    } finally {
      setIsUpdatingProject(false);
    }
  };

  // Delete Project Handler
  const handleDeleteProject = async () => {
    if (!projectId) return;
    setIsDeletingProject(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to delete project");
        setIsDeleteModalOpen(false);
        return;
      }

      setIsDeleteModalOpen(false);
      toast.success("Project Deleted", "Project record has been removed");
      onClose();
      onUpdate();
    } catch {
      setError("Network error deleting project");
    } finally {
      setIsDeletingProject(false);
    }
  };

  // --- QUOTATION ACTIONS ---
  const handleOpenWhatsApp = (quote: any) => {
    setSelectedQuotation(quote);
    const phone = project?.client?.phone?.replace(/[^0-9]/g, "") || quote.client?.phone?.replace(/[^0-9]/g, "") || "";
    const clientName = project?.client?.fullName || quote.client?.fullName || "Client";
    const amountStr = (quote.totalAmount || 0).toLocaleString("en-IN");
    const quoteRef = quote.referenceNo || "QT-REF";
    const projTitle = project?.title || "Project";

    setWhatsAppRecipient(phone);
    setWhatsAppMessage(
      `Dear ${clientName},\n\n` +
      `Please find your official quotation (${quoteRef}) for "${projTitle}" from Espacio Interiors.\n\n` +
      `• Total Amount: ₹${amountStr}\n` +
      `• Status: ${quote.status}\n` +
      `• Rooms / BOQ Items: ${quote.items?.length || 0} items\n\n` +
      `Please review and let us know if you would like to proceed.\n\n` +
      `Thank you,\nEspacio Interiors & Architecture Team`
    );
    setIsWhatsAppModalOpen(true);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = whatsAppRecipient.replace(/[^0-9]/g, "");
    const encoded = encodeURIComponent(whatsAppMessage);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, "_blank");
    setIsWhatsAppModalOpen(false);
    toast.success("WhatsApp Dispatched", "Opened WhatsApp chat with quotation summary.");
  };

  const handleOpenPrintModal = (quote: any) => {
    setSelectedQuotation(quote);
    setIsPrintModalOpen(true);
  };

  const handleSetApprovedQuotation = async (quoteId: string) => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SET_APPROVED", quotationId: quoteId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Failed to approve quotation", json.error?.message || "Could not set approved quotation");
        return;
      }
      toast.success("Approved Quotation Set", "Project contract value synchronized with approved quotation.");
      await fetchProjectDetails();
      onUpdate();
    } catch {
      toast.error("Network Error", "Could not set approved quotation.");
    }
  };

  const handleUnlinkQuotation = async (quoteId: string) => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/quotations?quotationId=${quoteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Failed to unlink quotation", json.error?.message || "Could not unlink quotation");
        return;
      }
      toast.success("Quotation Unlinked", "Quotation removed from project.");
      await fetchProjectDetails();
      onUpdate();
    } catch {
      toast.error("Network Error", "Could not unlink quotation.");
    }
  };

  const handleDeleteQuotation = async (quoteId: string, quoteRef?: string) => {
    const confirmMsg = quoteRef
      ? `Are you sure you want to delete quotation ${quoteRef}? This action will permanently remove it.`
      : "Are you sure you want to delete this quotation?";
    if (!confirm(confirmMsg)) return;

    setIsDeletingQuotation(quoteId);
    try {
      const res = await fetch(`/api/v1/quotations/${quoteId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Failed to delete quotation", json.error?.message || "Could not delete quotation");
        return;
      }
      toast.success("Quotation Deleted", `Quotation ${quoteRef || ""} has been deleted.`);
      await fetchProjectDetails();
      onUpdate();
    } catch (err: any) {
      toast.error("Network Error", err.message || "Failed to delete quotation");
    } finally {
      setIsDeletingQuotation(null);
    }
  };

  const handleFetchAvailableQuotations = async () => {
    setIsLoadingAvailableQuotes(true);
    try {
      const res = await fetch(`/api/v1/quotations?limit=50`);
      const json = await res.json();
      if (json.success && json.data) {
        const list = json.data.quotations || json.data || [];
        setAvailableQuotations(list);
      }
    } catch {
      toast.error("Failed to load quotations");
    } finally {
      setIsLoadingAvailableQuotes(false);
    }
  };

  const handleLinkQuotation = async (quoteId: string) => {
    if (!projectId) return;
    setIsLinkingQuote(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "LINK", quotationId: quoteId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Linking Failed", json.error?.message || "Could not link quotation");
        return;
      }
      toast.success("Quotation Linked", "Quotation successfully linked to this project.");
      setIsLinkQuotationModalOpen(false);
      await fetchProjectDetails();
      onUpdate();
    } catch {
      toast.error("Network Error", "Could not link quotation.");
    } finally {
      setIsLinkingQuote(false);
    }
  };

  if (!isOpen || !projectId) return null;

  // Compute Active Index for 13-Stage Execution Progression
  const isProjectFullyCompleted = project?.status === "COMPLETED";
  const currentStageIndex = CANONICAL_STAGE_DEFINITIONS.findIndex(
    (s) => s.key === project?.stage
  );
  const activeIdx = isProjectFullyCompleted
    ? CANONICAL_STAGE_DEFINITIONS.length
    : currentStageIndex >= 0
    ? currentStageIndex
    : 0;
  const progressPercent = isProjectFullyCompleted
    ? 100
    : Math.round(((activeIdx + 1) / CANONICAL_STAGE_DEFINITIONS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end select-none">
      {/* Subtle Darkened Overlay - Keeps Left ~40% of Background Table Visible */}
      <div
        className="fixed inset-0 bg-charcoal/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Large Desktop Side Drawer Panel (Takes ~60% Width, Smooth Slide-in) */}
      <div className="relative w-full sm:w-[85vw] md:w-[68vw] lg:w-[60vw] max-w-6xl bg-[#FCFBF9] shadow-2xl border-l border-walnut/20 z-50 flex flex-col h-full animate-in slide-in-from-right duration-250 ease-out">
        
        {/* ========================================================= */}
        {/* 1. PROJECT DETAILS PANEL HEADER                           */}
        {/* ========================================================= */}
        <div className="px-6 py-4 border-b border-walnut/15 bg-cream/70 shrink-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-charcoal">
                  {project?.title || "Project Operations"}
                </h2>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-white text-walnut rounded-full border border-walnut/20">
                  {project?.referenceNo || "PRJ-..."}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  {project?.status?.replace(/_/g, " ") || "IN PROGRESS"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ● {project?.stage?.replace(/_/g, " ")}
                </span>
              </div>

              {/* Client & Linked Lead Line */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-walnut mt-1">
                {project?.clientId ? (
                  <Link
                    href={`/clients?id=${project.clientId}`}
                    className="flex items-center gap-1 font-semibold text-charcoal hover:text-gold hover:underline"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-gold" /> {project?.client?.fullName || "Client"} ↗
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 font-semibold text-charcoal">
                    <UserCheck className="w-3.5 h-3.5 text-gold" /> {project?.client?.fullName || "Client"}
                  </span>
                )}
                {project?.client?.phone && (
                  <a
                    href={`tel:${project.client.phone}`}
                    className="flex items-center gap-1 font-mono hover:text-charcoal hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5 text-walnut/70" /> {project.client.phone}
                  </a>
                )}
                {project?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-walnut/70" /> {project.location}
                  </span>
                )}
                {project?.lead && (
                  <button
                    onClick={() => {
                      if (onOpenLead && project?.leadId) {
                        onOpenLead(project.leadId);
                      } else if (project?.leadId) {
                        onClose();
                        router.push(`/leads?id=${project.leadId}`);
                      }
                    }}
                    className="flex items-center gap-1 font-mono font-bold text-gold hover:underline cursor-pointer bg-white px-2 py-0.5 rounded border border-gold/30"
                    title="View Origin Lead"
                  >
                    <Target className="w-3 h-3 text-gold" /> Origin: {project.lead.referenceNo} ↗
                  </button>
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
          {/* 2. PROJECT ACTION BAR                                     */}
          {/* ========================================================= */}
          <div className="mt-4 pt-3 border-t border-walnut/10 flex flex-wrap items-center justify-between gap-3">
            {/* Stage Quick Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-walnut uppercase tracking-wider">Execution Stage:</span>
              <select
                value={selectedStage}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStage(val);
                  handleStageChange(val);
                }}
                disabled={isChangingStage}
                className="text-xs font-bold bg-white text-charcoal border border-walnut/20 rounded-md px-3 py-1.5 shadow-2xs focus:ring-1 focus:ring-gold cursor-pointer"
              >
                {CANONICAL_STAGE_DEFINITIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.order}. {s.title} ({s.progressWeightPct}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsStartAnotherProjectOpen(true)}
                className="text-xs py-1 h-7 bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs flex items-center gap-1"
                title="Start another project or modular order for this client"
              >
                <Building2 className="w-3.5 h-3.5 text-yellow-300" /> Start Another Project
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
                onClick={() => {
                  onClose();
                  router.push(`/quotations/new?projectId=${projectId}&clientId=${project?.clientId || ""}&type=MATERIAL`);
                }}
                className="text-xs py-1 h-7 border-teal-300 text-teal-900 bg-teal-50 hover:bg-teal-100 font-semibold"
                title="Create Materials & Services Quotation for this Project"
              >
                <Package className="w-3 h-3 mr-1 text-teal-700" /> + Materials Quote
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpenseModalOpen(true)}
                className="text-xs py-1 h-7 border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 font-semibold"
              >
                <DollarSign className="w-3 h-3 mr-1" /> + Add Expense
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMaterialModalOpen(true)}
                className="text-xs py-1 h-7 border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100"
              >
                <ShoppingBag className="w-3 h-3 mr-1" /> + Order Material
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsRecordPaymentModalOpen(true)}
                className="text-xs py-1 h-7 bg-gold text-charcoal font-bold hover:bg-gold/90"
              >
                <Receipt className="w-3 h-3 mr-1" /> Record Payment
              </Button>
              {project?.leadId && onOpenLead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenLead(project.leadId)}
                  className="text-xs py-1 h-7 border-walnut/30 text-walnut hover:bg-cream/40"
                >
                  <Target className="w-3 h-3 mr-1 text-gold" /> View Lead
                </Button>
              )}
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
        {/* 3. PROJECT DETAILS TABS                                   */}
        {/* ========================================================= */}
        <div className="flex border-b border-walnut/15 px-6 bg-white overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: "overview", label: "Overview & Details" },
            { id: "pipeline", label: "Pipeline Stepper (16)" },
            { id: "quotations", label: `Quotations & Invoices (${(project?.quotations?.length || 0) + (project?.gstInvoices?.length || 0)})` },
            { id: "expenses", label: `Expenses (${project?.expenses?.length || 0})` },
            { id: "materials", label: `Materials (${project?.purchaseOrders?.length || 0})` },
            { id: "vendors", label: `Vendors (${project?.purchaseOrders?.length || 0})` },
            { id: "payments", label: `Payments (${project?.payments?.length || 0})` },
            { id: "timeline", label: `Timeline (${timeline.length})` },
            { id: "audit", label: "Audit Trail" },
            { id: "client", label: "Client & Lead Dossier" },
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
              <p className="text-xs">Loading project details...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & DETAILS */}
              {activeTab === "overview" && (() => {
                const recordedPaymentsList = project?.payments || [];
                const totalPaymentsReceived = recordedPaymentsList.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
                const approvedQuote = (project?.quotations || []).find((q: any) => q.id === project?.approvedQuotationId || q.status === "APPROVED");
                const contractTotal = project?.contractValue || approvedQuote?.totalAmount || 0;
                const balanceRemainingDue = Math.max(0, contractTotal - totalPaymentsReceived);
                const resolvedSiteAddress = project?.siteAddress || project?.location || project?.lead?.location || project?.client?.address || "Site address to be updated";
                const resolvedPropertyType = (project?.propertyTypeKey || project?.lead?.propertyTypeKey || "APARTMENT_INTERIOR").replace(/_/g, " ");
                const netMargin = (project?.netProfit !== undefined && project?.netProfit !== null)
                  ? project.netProfit
                  : Math.max(0, contractTotal - (project?.totalExpenses || 0));

                return (
                  <div className="space-y-4">
                    {/* Card 1: Project & Site Information */}
                    <div className="bg-white p-5 rounded-xl border border-walnut/20 shadow-2xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <h3 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-gold" /> Project & Site Information
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="active" className="text-[10px] font-bold uppercase">
                            {project?.stage?.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant="neutral" className="text-[10px] font-bold uppercase">
                            {resolvedPropertyType}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-[11px] text-walnut/80">Project ID / Reference</div>
                          <div className="text-xs font-bold text-charcoal font-mono mt-0.5">{project?.referenceNo}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80">Project Title</div>
                          <div className="text-xs font-bold text-charcoal mt-0.5">{project?.title}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80">Property Type</div>
                          <div className="text-xs font-bold text-charcoal mt-0.5 capitalize">{resolvedPropertyType.toLowerCase()}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80">Site Location & City</div>
                          <div className="text-xs font-bold text-charcoal flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{resolvedSiteAddress}</span>
                          </div>
                        </div>
                      </div>

                      {(project?.description || project?.notes || project?.lead?.requirement) && (
                        <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 text-xs">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Scope & Requirements
                          </span>
                          <p className="text-slate-800 leading-relaxed">
                            {project?.description || project?.notes || project?.lead?.requirement}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card 2: Client Profile & Primary Contact */}
                    <div className="bg-white p-5 rounded-xl border border-walnut/20 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-emerald-600" /> Client Profile & Primary Contact
                        </h3>
                        {project?.client?.referenceNo && (
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {project.client.referenceNo}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-[11px] text-walnut/80">Client Name</div>
                          <div className="text-xs font-bold text-charcoal mt-0.5">
                            {project?.client?.fullName || project?.lead?.clientName || "Valued Client"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80">Phone Number</div>
                          <div className="text-xs font-bold text-charcoal font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <a
                              href={`tel:${project?.client?.phone || project?.lead?.phone}`}
                              className="hover:text-emerald-700 hover:underline"
                            >
                              {project?.client?.phone || project?.lead?.phone || "N/A"}
                            </a>
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80">Email Address</div>
                          <div className="text-xs font-bold text-charcoal font-mono mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-blue-600" />
                            <a
                              href={`mailto:${project?.client?.email || project?.lead?.email}`}
                              className="hover:text-blue-700 hover:underline truncate max-w-[180px]"
                            >
                              {project?.client?.email || project?.lead?.email || "N/A"}
                            </a>
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80">Billing Address</div>
                          <div className="text-xs font-medium text-charcoal mt-0.5 truncate">
                            {project?.client?.address || resolvedSiteAddress}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Commercial & Financial Ledger */}
                    <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                        <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-600" /> Commercial &amp; Financial Ledger
                        </h3>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {recordedPaymentsList.length} Payment(s) Recorded
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        <div>
                          <div className="text-[11px] text-walnut/80">Contract Value</div>
                          <div className="text-sm font-bold text-charcoal font-mono mt-0.5">
                            {formatCurrency(contractTotal)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80">Total Paid (Advance)</div>
                          <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                            {formatCurrency(totalPaymentsReceived)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80">Balance Remaining</div>
                          <div className="text-sm font-bold text-amber-800 font-mono mt-0.5">
                            {formatCurrency(balanceRemainingDue)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80">Incurred Expenses</div>
                          <div className="text-sm font-bold text-rose-700 font-mono mt-0.5">
                            {formatCurrency(project?.totalExpenses || 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80">Est. Net Margin</div>
                          <div className="text-sm font-bold text-emerald-800 font-mono mt-0.5">
                            {formatCurrency(netMargin)} <span className="text-[11px] font-normal">({project?.profitMarginPct || "45.0"}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Origin Lead Connection & Lifecycle */}
                    {project?.lead && (
                      <div className="bg-white p-5 rounded-xl border border-gold/30 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-gold/20 pb-3">
                          <h3 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-gold" /> Origin Lead Discovery &amp; Lifecycle
                          </h3>
                          {onOpenLead && (
                            <button
                              onClick={() => onOpenLead(project.leadId)}
                              className="text-xs font-bold text-gold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              Open Lead Details ↗
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                          <div>
                            <div className="text-walnut/80 text-[11px]">Lead Reference</div>
                            <div className="font-bold text-charcoal font-mono mt-0.5">{project.lead.referenceNo}</div>
                          </div>
                          <div>
                            <div className="text-walnut/80 text-[11px]">Lead Source</div>
                            <div className="font-bold text-charcoal mt-0.5 uppercase">{project.lead.sourceKey || "DIRECT"}</div>
                          </div>
                          <div>
                            <div className="text-walnut/80 text-[11px]">Initial Estimated Budget</div>
                            <div className="font-bold text-emerald-800 font-mono mt-0.5">
                              {project.lead.estimatedBudget ? formatCurrency(project.lead.estimatedBudget) : "TBD"}
                            </div>
                          </div>
                          <div>
                            <div className="text-walnut/80 text-[11px]">Assigned Designer / Lead Rep</div>
                            <div className="font-bold text-charcoal mt-0.5">
                              {project.lead.assignedTo?.fullName || "Assigned Team"}
                            </div>
                          </div>
                        </div>

                        {project.lead.siteVisits && project.lead.siteVisits.length > 0 && (
                          <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                                Origin Site Visit Assessment
                              </span>
                              <p className="text-purple-950 mt-0.5">
                                {project.lead.siteVisits[0].outcomeNotes || "Measurements taken and space inspected on site."}
                              </p>
                            </div>
                            <span className="text-[11px] font-mono text-purple-700 font-bold shrink-0">
                              {formatDate(project.lead.siteVisits[0].visitDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card 5: Execution Timeline & Key Dates */}
                    <div className="bg-white p-5 rounded-xl border border-walnut/20 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-indigo-600" /> Execution Timeline &amp; Handover
                        </h3>
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {project?.warrantyDurationMonths || 12} Months Warranty
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-[11px] text-walnut/80">Project Kickoff Date</div>
                          <div className="text-xs font-bold text-charcoal font-mono mt-0.5">
                            {formatDate(project?.createdAt || new Date())}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80">Target Completion</div>
                          <div className="text-xs font-bold text-charcoal font-mono mt-0.5">
                            {project?.targetCompletionDate ? formatDate(project.targetCompletionDate) : "Milestone Tracked"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80">Handover Status</div>
                          <div className="text-xs font-bold text-charcoal mt-0.5 capitalize">
                            {project?.handoverStatus || "PENDING"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-walnut/80">Project Members</div>
                          <div className="text-xs font-bold text-charcoal mt-0.5">
                            {project?.members && project.members.length > 0
                              ? project.members.map((m: any) => m.user?.fullName).filter(Boolean).join(", ")
                              : "Espacio Execution Team"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAB 2: PIPELINE (Execution Tracking Stepper) */}
              {activeTab === "pipeline" && (
                <div className="space-y-6">
                  {/* Top Order Progress Bar / Completed Banner */}
                  {isProjectFullyCompleted ? (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 shadow-2xs space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            ✓
                          </span>
                          <div>
                            <span className="font-extrabold text-emerald-950 text-sm">
                              🎉 Project Finished &amp; Successfully Handed Over!
                            </span>
                            <p className="text-xs text-emerald-800">
                              All {CANONICAL_STAGE_DEFINITIONS.length} execution stages are 100% completed, verified, and signed off.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setIsStartAnotherProjectOpen(true)}
                            className="text-xs py-1 h-7 bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs flex items-center gap-1"
                          >
                            <Building2 className="w-3.5 h-3.5 text-yellow-300" /> Start Another Project
                          </Button>
                          <span className="text-xs font-mono font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-emerald-300">
                            100% Finished
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleReopenProject}
                            disabled={isCompletingProject}
                            isLoading={isCompletingProject}
                            className="text-xs py-1 h-7 text-emerald-800 border-emerald-300 hover:bg-emerald-100 bg-white font-semibold"
                            title="Re-open project to active execution if adjustments are needed"
                          >
                            Re-open Stages
                          </Button>
                        </div>
                      </div>

                      <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full w-full rounded-full" />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-charcoal flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-emerald-600" /> Execution Progression (Step {Math.min(activeIdx + 1, CANONICAL_STAGE_DEFINITIONS.length)} of {CANONICAL_STAGE_DEFINITIONS.length})
                          </span>
                          <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {progressPercent}% Complete
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-walnut font-medium">
                            Active: <strong className="text-charcoal">{project?.stage?.replace(/_/g, " ")}</strong>
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompleteProject(activeStageTransitionNotes)}
                            disabled={isCompletingProject}
                            isLoading={isCompletingProject}
                            className="text-xs py-0.5 h-6.5 text-emerald-700 border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 font-bold flex items-center gap-1 cursor-pointer"
                            title="Complete all stages and turn entire pipeline green"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Finish All Stages
                          </Button>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500 ease-out rounded-full shadow-xs"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Vertical Connected Green Tracking Order Stepper */}
                  <div className="relative pl-10 space-y-6">
                    {CANONICAL_STAGE_DEFINITIONS.map((stageDef, idx) => {
                      const isCompleted = isProjectFullyCompleted || idx < activeIdx;
                      const isActive = !isProjectFullyCompleted && idx === activeIdx;
                      const isFuture = !isProjectFullyCompleted && idx > activeIdx;
                      const isLast = idx === CANONICAL_STAGE_DEFINITIONS.length - 1;
                      const nextStageDef = idx < CANONICAL_STAGE_DEFINITIONS.length - 1 ? CANONICAL_STAGE_DEFINITIONS[activeIdx + 1] : null;

                      // Extract historical note specifically for this stage (keep only ONE note per card)
                      const matchingHistoryEntries = (project?.stageHistory || []).filter(
                        (sh: any) =>
                          sh.toStage === stageDef.key &&
                          sh.notes &&
                          sh.notes.trim().length >= 2 &&
                          !sh.notes.trim().toLowerCase().startsWith("stage advanced to") &&
                          (stageDef.key === "MATERIAL_SELECTION" || !sh.notes.trim().toLowerCase().startsWith("material selection confirmed"))
                      );
                      const singleStageNote = matchingHistoryEntries[0] || null;
                      const stageHistoryEntries = matchingHistoryEntries;

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
                          {/* Connected Green Vertical Line to Next Step */}
                          {!isLast && (
                            <div
                              className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${
                                isCompleted || isProjectFullyCompleted ? "bg-emerald-500" : "bg-slate-200"
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
                              {stageDef.key === "RAW_MATERIAL_ORDERED" && !isProjectFullyCompleted && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => {
                                    setMaterialOrderType("Raw Material Order");
                                    setIsMaterialModalOpen(true);
                                  }}
                                  className="text-xs py-0.5 h-6 bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <ShoppingBag className="w-3 h-3" /> Order Raw Materials
                                </Button>
                              )}
                              {stageDef.key === "LAMINATE_ORDERED" && !isProjectFullyCompleted && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => {
                                    setMaterialOrderType("Laminate Order");
                                    setIsMaterialModalOpen(true);
                                  }}
                                  className="text-xs py-0.5 h-6 bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <ShoppingBag className="w-3 h-3" /> Order Laminates
                                </Button>
                              )}
                              {isCompleted ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveNoteStage(activeNoteStage === stageDef.key ? null : stageDef.key);
                                      setInlineNoteText("");
                                    }}
                                    className="text-[11px] font-medium text-walnut hover:text-charcoal hover:underline flex items-center gap-1 cursor-pointer"
                                    title="Add or edit stage note"
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
                                  onClick={() => {
                                    setAdvanceModalStage(stageDef);
                                    setAdvanceModalNotes("");
                                  }}
                                  className="text-xs py-0.5 h-6 text-slate-700 border-slate-300 hover:bg-slate-50 font-semibold cursor-pointer"
                                >
                                  Advance to Here
                                </Button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-walnut">{stageDef.description}</p>

                          {/* Single Stage Note Display (Keep only 1 note for each card) */}
                          {singleStageNote && (
                            <div className="pt-2 border-t border-walnut/10">
                              <div className="p-2.5 bg-slate-50/90 rounded-lg border border-slate-200 text-xs flex items-start gap-2">
                                <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                                    <span className="font-bold uppercase tracking-wider text-slate-600">
                                      Stage Note / Remark
                                    </span>
                                    <span>{formatDate(singleStageNote.createdAt)}</span>
                                  </div>
                                  <p className="text-slate-800 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                                    {singleStageNote.notes}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Inline Note Add/Edit Box for Completed Stages */}
                          {isCompleted && activeNoteStage === stageDef.key && (
                            <div className="pt-2 border-t border-walnut/10 space-y-2">
                              <label className="text-[11px] font-bold text-charcoal flex items-center gap-1">
                                <FileText className="w-3 h-3 text-gold" /> Add / Update Note for {stageDef.title} (Optional)
                              </label>
                              <textarea
                                rows={2}
                                value={inlineNoteText}
                                onChange={(e) => setInlineNoteText(e.target.value)}
                                placeholder="Add notes, client sign-offs, measurements, or remarks for this completed stage..."
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
                                  onClick={() => handleSaveStageNote(stageDef.key, inlineNoteText)}
                                  disabled={!inlineNoteText.trim() || isSubmittingNote}
                                  isLoading={isSubmittingNote}
                                  className="text-xs py-0.5 h-6 bg-gold text-charcoal font-bold hover:bg-gold/90"
                                >
                                  Save Stage Note
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* ACTIVE STAGE: NEXT STEP ADVANCEMENT BOX WITH OPTIONAL NOTES */}
                          {isActive && (
                            <div className="mt-3.5 p-3.5 bg-white/95 rounded-xl border border-amber-300 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                                  {nextStageDef
                                    ? `Ready to Advance: Step ${nextStageDef.order} • ${nextStageDef.title}`
                                    : "Final Project Execution Stage"}
                                </span>
                                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                  Current Step: {stageDef.order} of {CANONICAL_STAGE_DEFINITIONS.length}
                                </span>
                              </div>

                              {/* Optional Stage Transition Notes Input */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px]">
                                  <label className="font-semibold text-charcoal flex items-center gap-1">
                                    <FileText className="w-3 h-3 text-gold" />
                                    Stage Notes &amp; Handover Remarks{" "}
                                    <span className="text-walnut font-normal">(Optional)</span>
                                  </label>
                                  {activeStageTransitionNotes.trim() && (
                                    <span className="text-[10px] text-emerald-700 font-semibold">
                                      Will be saved when advancing
                                    </span>
                                  )}
                                </div>
                                <textarea
                                  rows={2}
                                  value={activeStageTransitionNotes}
                                  onChange={(e) => setActiveStageTransitionNotes(e.target.value)}
                                  placeholder="Add optional notes, client feedback, design approvals, site observations, or handover remarks for this stage..."
                                  className="w-full text-xs p-2.5 bg-white border border-walnut/25 rounded-lg text-charcoal focus:ring-1 focus:ring-amber-500 focus:outline-none placeholder:text-walnut/50 resize-y"
                                />
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    if (!activeStageTransitionNotes.trim()) return;
                                    await handleSaveStageNote(stageDef.key, activeStageTransitionNotes.trim());
                                    setActiveStageTransitionNotes("");
                                  }}
                                  disabled={!activeStageTransitionNotes.trim() || isSubmittingNote}
                                  isLoading={isSubmittingNote}
                                  className="text-xs py-1 h-7 border-walnut/30 text-charcoal hover:bg-cream/40"
                                >
                                  Save Note on Current Step
                                </Button>

                                {nextStageDef ? (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() =>
                                      handleStageChange(
                                        nextStageDef.key,
                                        activeStageTransitionNotes.trim() || undefined
                                      )
                                    }
                                    disabled={isChangingStage}
                                    isLoading={isChangingStage}
                                    className="text-xs py-1.5 h-8 bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto"
                                  >
                                    Advance to Step {nextStageDef.order}. {nextStageDef.title} →
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleCompleteProject(activeStageTransitionNotes)}
                                    disabled={isCompletingProject}
                                    isLoading={isCompletingProject}
                                    className="text-xs py-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto"
                                  >
                                    <Check className="w-4 h-4 stroke-[3]" /> Complete Project &amp; Finish All Stages ✓
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* MANDATORY MATERIAL SELECTION NOTES SECTION */}
                          {stageDef.key === "MATERIAL_SELECTION" && (
                            <div className="mt-3 pt-3 border-t border-walnut/15 space-y-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-charcoal flex items-center gap-1">
                                    <FileText className="w-3.5 h-3.5 text-gold" /> Material Selection Specifications
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                                    * Mandatory Before Next Step
                                  </span>
                                </div>
                                {hasMaterialSelectionNotes && !isEditingExistingMaterialNotes && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Notes Recorded
                                  </span>
                                )}
                              </div>

                              {hasMaterialSelectionNotes && !isEditingExistingMaterialNotes ? (
                                <div className="p-3 bg-cream/40 rounded-lg border border-walnut/20 space-y-2 text-xs">
                                  <p className="text-charcoal leading-relaxed whitespace-pre-wrap font-mono text-[11px]">
                                    {savedMaterialSelectionNotes}
                                  </p>
                                  <div className="flex items-center justify-between pt-1.5 border-t border-walnut/15 text-[10px] text-walnut">
                                    <span>
                                      {materialHistoryEntry?.createdAt
                                        ? `Recorded on ${formatDate(materialHistoryEntry.createdAt)}`
                                        : "Recorded in Project Ledger"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMaterialNotesText(savedMaterialSelectionNotes);
                                        setIsEditingExistingMaterialNotes(true);
                                      }}
                                      className="text-gold font-bold hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" /> Edit Specifications
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <textarea
                                    rows={3}
                                    value={materialNotesText}
                                    onChange={(e) => setMaterialNotesText(e.target.value)}
                                    placeholder="Enter material selection specifications (laminate codes/brands, veneer selections, hardware finish, glass/stone choices, client approvals)..."
                                    className="w-full text-xs p-2.5 bg-white border border-walnut/25 rounded-lg text-charcoal focus:ring-1 focus:ring-gold focus:outline-none placeholder:text-walnut/50 resize-y"
                                  />
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                    <span className="text-amber-800 font-medium">
                                      Next step (&ldquo;Raw Material Ordered&rdquo;) requires these material selection specifications to be recorded.
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setMaterialNotesText("");
                                          setIsEditingExistingMaterialNotes(false);
                                        }}
                                        className="text-xs py-1 h-7 text-walnut cursor-pointer"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={handleSaveMaterialNotes}
                                        isLoading={isSavingMaterialNotes}
                                        disabled={!materialNotesText.trim()}
                                        className="text-xs py-1 h-7 bg-gold text-charcoal font-bold hover:bg-gold/90 shadow-2xs cursor-pointer"
                                      >
                                        Save Material Notes
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: QUOTATIONS & INVOICES (Complete Project Quotation Studio, Invoices & Dispatch) */}
              {activeTab === "quotations" && (() => {
                const quotationsList = project?.quotations || [];
                const invoicesList = project?.gstInvoices || [];
                const paymentsList = project?.payments || [];

                const approvedQuote = quotationsList.find((q: any) => q.id === project?.approvedQuotationId || q.status === "APPROVED");
                const contractTotal = project?.contractValue || approvedQuote?.totalAmount || 0;
                const totalQuotationsValue = quotationsList.reduce((sum: number, q: any) => sum + (q.totalAmount || 0), 0);

                const totalInvoicedAmount = invoicesList.reduce((sum: number, inv: any) => sum + (inv.grandTotal || inv.amountPaid || 0), 0);
                const totalPaidAmount = paymentsList.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
                const remainingDue = Math.max(0, contractTotal - totalPaidAmount);
                const paidPct = contractTotal > 0 ? Math.min(100, Math.round((totalPaidAmount / contractTotal) * 100)) : 0;

                const handleShareInvoiceWhatsApp = (inv: any) => {
                  const phone = project?.client?.phone?.replace(/[^0-9]/g, "") || project?.lead?.phone?.replace(/[^0-9]/g, "") || "";
                  const clientName = project?.client?.fullName || project?.lead?.clientName || "Client";
                  const amountStr = (inv.grandTotal || inv.amountPaid || 0).toLocaleString("en-IN");
                  const invNo = inv.invoiceNo || "INV-CONFIRMED";
                  const projTitle = project?.title || "Project";

                  setWhatsAppRecipient(phone);
                  setWhatsAppMessage(
                    `Dear ${clientName},\n\n` +
                    `Please find your official GST Tax Invoice (${invNo}) for "${projTitle}" from Espacio Interiors.\n\n` +
                    `• Invoice Amount: ₹${amountStr}\n` +
                    `• Status: ${inv.paymentStatus || "PAID"}\n` +
                    `• Date: ${formatDate(inv.invoiceDate || inv.createdAt)}\n\n` +
                    `Thank you for your business.\nEspacio Interiors & Architecture Team`
                  );
                  setIsWhatsAppModalOpen(true);
                };

                return (
                  <div className="space-y-6">
                    {/* Header with Title & Direct Creation Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-walnut/15">
                      <div>
                        <h3 className="text-sm font-bold text-charcoal flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gold" /> Project Quotations &amp; Tax Invoices Studio
                        </h3>
                        <p className="text-[11px] text-walnut mt-0.5">
                          Manage official BOQ quotations, generate GST invoices, track payments received, and dispatch via WhatsApp / PDF
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleFetchAvailableQuotations();
                            setIsLinkQuotationModalOpen(true);
                          }}
                          className="text-xs py-1.5 h-8 border-walnut/30 text-charcoal hover:bg-cream/40"
                        >
                          <Link2 className="w-3.5 h-3.5 mr-1 text-walnut" /> Link Existing Quote
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            onClose();
                            router.push(`/quotations/new?projectId=${projectId}&clientId=${project?.clientId || ""}&type=MATERIAL`);
                          }}
                          className="text-xs py-1.5 h-8 bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> + Materials &amp; Services Quote
                        </Button>
                      </div>
                    </div>

                    {/* Summary KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Card 1: Approved Contract Value */}
                      <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
                        <div className="text-[11px] font-bold text-walnut uppercase tracking-wider">Approved Contract Value</div>
                        <div className="text-lg font-bold text-charcoal font-mono mt-1">
                          {formatCurrency(contractTotal)}
                        </div>
                        <div className="text-[11px] text-walnut mt-0.5 flex items-center gap-1">
                          {approvedQuote ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1 truncate">
                              <CheckCircle className="w-3 h-3 shrink-0" /> {approvedQuote.referenceNo}
                            </span>
                          ) : (
                            <span className="text-slate-500">{quotationsList.length} Quote(s) Linked</span>
                          )}
                        </div>
                      </div>

                      {/* Card 2: Total Invoiced */}
                      <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
                        <div className="text-[11px] font-bold text-walnut uppercase tracking-wider">Invoiced Amount</div>
                        <div className="text-lg font-bold text-charcoal font-mono mt-1">
                          {formatCurrency(totalInvoicedAmount || totalPaidAmount)}
                        </div>
                        <div className="text-[11px] text-walnut mt-0.5">
                          <strong className="text-emerald-800 font-mono">{invoicesList.length}</strong> Tax Invoice(s)
                        </div>
                      </div>

                      {/* Card 3: Total Amount Paid */}
                      <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
                        <div className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider">Amount Paid (Advance)</div>
                        <div className="text-lg font-bold text-emerald-800 font-mono mt-1">
                          {formatCurrency(totalPaidAmount)}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          {paidPct}% Settled • {paymentsList.length} Receipt(s)
                        </div>
                      </div>

                      {/* Card 4: Amount Remaining */}
                      <div className="p-4 bg-white rounded-xl border border-amber-200 shadow-2xs bg-amber-50/20">
                        <div className="text-[11px] font-bold text-amber-950 uppercase tracking-wider">Amount Remaining Due</div>
                        <div className="text-lg font-bold text-amber-800 font-mono mt-1">
                          {formatCurrency(remainingDue)}
                        </div>
                        <div className="text-[11px] text-amber-900/80 font-medium mt-0.5">
                          Pending Milestone Balance
                        </div>
                      </div>
                    </div>

                    {/* SECTION 1: PROJECT QUOTATIONS */}
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between border-b border-walnut/10 pb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gold" />
                          <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                            Project Quotations &amp; BOQ Specifications ({quotationsList.length})
                          </h4>
                        </div>
                        <span className="text-[11px] text-walnut">
                          Cumulative Value: <strong className="font-mono text-charcoal">{formatCurrency(totalQuotationsValue)}</strong>
                        </span>
                      </div>

                      {quotationsList && quotationsList.length > 0 ? (
                        <div className="space-y-3.5">
                          {quotationsList.map((q: any) => {
                            const isApproved = project?.approvedQuotationId === q.id || q.status === "APPROVED";
                            const totalItems = q.items?.length || 0;
                            const roomGroups = Array.from(new Set(q.items?.map((i: any) => i.room || "General") || []));

                            return (
                              <div
                                key={q.id}
                                className={`p-5 bg-white rounded-xl border transition-all ${
                                  isApproved
                                    ? "border-gold shadow-md bg-gradient-to-r from-white via-cream/10 to-gold/5 ring-1 ring-gold/40"
                                    : "border-walnut/20 shadow-2xs hover:border-walnut/40"
                                }`}
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-walnut/10">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-cream/70 text-charcoal rounded border border-walnut/20">
                                        {q.referenceNo || "QT-..."}
                                      </span>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                        Rev {q.revision || 1}
                                      </span>
                                      <Badge
                                        variant={
                                          q.status === "APPROVED"
                                            ? "completed"
                                            : q.status === "SENT"
                                            ? "active"
                                            : q.status === "REJECTED"
                                            ? "danger"
                                            : "neutral"
                                        }
                                      >
                                        {q.status || "DRAFT"}
                                      </Badge>
                                      {isApproved && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold/20 text-charcoal border border-gold/40 flex items-center gap-1">
                                          <Star className="w-3 h-3 fill-gold text-gold" /> Official Project Quote
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="text-sm font-bold text-charcoal mt-1.5">
                                      {q.title || "Interior Design & Execution Quotation"}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-walnut mt-1">
                                      <span>Created: <strong className="text-charcoal">{formatDate(q.createdAt)}</strong></span>
                                      {q.createdBy?.fullName && (
                                        <span>By: <strong className="text-charcoal">{q.createdBy.fullName}</strong></span>
                                      )}
                                      {q.validityDate && (
                                        <span>Valid Until: <strong className="text-charcoal">{formatDate(q.validityDate)}</strong></span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="text-base font-bold text-charcoal font-mono">
                                      {formatCurrency(q.totalAmount || 0)}
                                    </div>
                                    <div className="text-[10px] text-walnut font-mono mt-0.5">
                                      Subtotal: {formatCurrency(q.subtotal || q.totalAmount || 0)}
                                      {q.taxAmount ? ` + GST ${formatCurrency(q.taxAmount)}` : ""}
                                      {q.discountAmount ? ` - Disc ${formatCurrency(q.discountAmount)}` : ""}
                                    </div>
                                  </div>
                                </div>

                                {/* BOQ Summary line */}
                                <div className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-walnut">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-charcoal">{totalItems} Line Items</span>
                                    {roomGroups.length > 0 && (
                                      <span className="text-[11px] text-walnut/70">
                                        ({roomGroups.slice(0, 3).join(", ")}{roomGroups.length > 3 ? ` +${roomGroups.length - 3} more` : ""})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Action Buttons Toolbar */}
                                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-walnut/10">
                                  {/* 1. WhatsApp Dispatch */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenWhatsApp(q)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                                    title="Send Quotation to Client via WhatsApp"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Share WhatsApp
                                  </button>

                                  {/* 2. Print / PDF Modal */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPrintModal(q)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100 transition-colors cursor-pointer"
                                    title="Print or Save Quotation as PDF"
                                  >
                                    <Printer className="w-3.5 h-3.5 text-blue-600" /> Print / PDF
                                  </button>

                                  {/* 3. Open in Studio */}
                                  <Link
                                    href={`/quotations/${q.id}`}
                                    onClick={onClose}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                                    title="Open in Quotation Studio"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-amber-700" /> Open Studio
                                  </Link>

                                  {/* 4. Set as Approved */}
                                  {!isApproved && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetApprovedQuotation(q.id)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gold/15 text-charcoal border border-gold/40 hover:bg-gold/30 transition-colors cursor-pointer"
                                      title="Set as Project's Official Approved Quotation"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5 text-gold" /> Set as Approved
                                    </button>
                                  )}

                                  <div className="flex items-center gap-2 ml-auto">
                                    {/* 5. Unlink Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleUnlinkQuotation(q.id)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-walnut hover:text-charcoal hover:bg-cream/40 rounded-lg border border-walnut/20 transition-colors cursor-pointer"
                                      title="Unlink quotation from this project"
                                    >
                                      <Unlink className="w-3.5 h-3.5" /> Unlink
                                    </button>

                                    {/* 6. Delete Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteQuotation(q.id, q.referenceNo)}
                                      disabled={isDeletingQuotation === q.id}
                                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer font-semibold"
                                      title="Permanently delete quotation"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> {isDeletingQuotation === q.id ? "Deleting..." : "Delete"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15 space-y-3">
                          <FileText className="w-8 h-8 mx-auto text-gold/60" />
                          <div>
                            <p className="font-bold text-sm text-charcoal">No Quotations Linked to this Project</p>
                            <p className="text-[11px] text-walnut/70 mt-1 max-w-md mx-auto">
                              Generate a formal room-wise BOQ quotation for this project or link an existing quotation.
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                onClose();
                                router.push(`/quotations/new?projectId=${projectId}&clientId=${project?.clientId || ""}&type=MATERIAL`);
                              }}
                              className="bg-teal-600 text-white font-bold hover:bg-teal-700"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> + Materials &amp; Services Quote
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                handleFetchAvailableQuotations();
                                setIsLinkQuotationModalOpen(true);
                              }}
                            >
                              <Link2 className="w-3.5 h-3.5 mr-1" /> Link Existing
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: GENERATED TAX INVOICES & PAYMENT RECEIPTS */}
                    <div className="space-y-3.5 pt-4 border-t border-walnut/15">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-emerald-700" />
                          <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                            Generated Tax Invoices &amp; Payment Receipts ({invoicesList.length})
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {invoicesList.length} Generated
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Official GST tax invoices generated for milestone payments and advance confirmation
                        </span>
                      </div>

                      {invoicesList && invoicesList.length > 0 ? (
                        <div className="space-y-3">
                          {invoicesList.map((inv: any, index: number) => {
                            const invAmount = inv.grandTotal || inv.amountPaid || 0;
                            const invDateStr = inv.invoiceDate || inv.createdAt;
                            const statusVariant = inv.paymentStatus === "PAID" || inv.status === "PAID" ? "completed" : "active";

                            return (
                              <div
                                key={inv.id || index}
                                className="p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs hover:border-emerald-300 transition-colors space-y-3"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center font-mono">
                                      #{index + 1}
                                    </span>
                                    <span className="font-mono font-bold text-sm text-emerald-950">
                                      {inv.invoiceNo}
                                    </span>
                                    <Badge variant={statusVariant} className="text-[10px] py-0 px-2 font-bold uppercase">
                                      ✓ {inv.paymentStatus || inv.status || "PAID"}
                                    </Badge>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      Issued: <strong className="text-slate-800">{formatDate(invDateStr)}</strong>
                                    </span>
                                  </div>

                                  <div className="text-right">
                                    <div className="font-mono font-bold text-base text-emerald-800">
                                      {formatCurrency(invAmount)}
                                    </div>
                                    {inv.totalTaxable ? (
                                      <div className="text-[10px] text-slate-500 font-mono">
                                        Taxable: {formatCurrency(inv.totalTaxable)} | GST: {formatCurrency(inv.totalTax || 0)}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-3 text-slate-600 flex-wrap">
                                    {inv.quotation?.referenceNo && (
                                      <span>Against Quotation: <strong className="font-mono text-slate-900">{inv.quotation.referenceNo}</strong></span>
                                    )}
                                    <span>Mode: <strong className="text-slate-800">{inv.paymentMode || inv.paymentType || "UPI"}</strong></span>
                                    {inv.transactionReference && (
                                      <span>Ref / UTR: <strong className="font-mono text-slate-800">{inv.transactionReference}</strong></span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* View Invoice in Studio */}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        onClose();
                                        const projectQuotes = project?.quotations || [];
                                        const targetQuoteId = inv.quotationId || inv.quotation?.id || project?.approvedQuotationId || (projectQuotes.length > 0 ? projectQuotes[0].id : null);
                                        const invTitle = inv.notes?.split('|')?.[0]?.trim() || inv.paymentType || (inv.invoiceNo?.startsWith('TXI-') ? 'TAX INVOICE' : 'MILESTONE PAYMENT');
                                        if (targetQuoteId) {
                                          router.push(`/quotations/${targetQuoteId}?invoiceId=${inv.id}&mode=INVOICE&amount=${encodeURIComponent(invAmount)}&paymentType=${encodeURIComponent(invTitle)}&paymentMode=${encodeURIComponent(inv.paymentMode || inv.paymentType || 'UPI')}&ref=${encodeURIComponent(inv.invoiceNo)}&title=${encodeURIComponent(invTitle)}&projectId=${projectId}&readOnly=true`);
                                        } else {
                                          router.push(`/quotations/new?mode=INVOICE&invoiceId=${inv.id}&amount=${encodeURIComponent(invAmount)}&paymentType=${encodeURIComponent(invTitle)}&paymentMode=${encodeURIComponent(inv.paymentMode || inv.paymentType || 'UPI')}&ref=${encodeURIComponent(inv.invoiceNo)}&title=${encodeURIComponent(invTitle)}&projectId=${projectId}&readOnly=true`);
                                        }
                                      }}
                                      className="text-xs py-1 h-7 bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-bold gap-1 cursor-pointer"
                                      title="Open Tax Invoice in Quotation Studio"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-amber-700" />
                                      View Invoice
                                    </Button>

                                    {/* View PDF */}
                                    </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-500 bg-slate-50/70 rounded-xl border border-dashed border-slate-300 space-y-2">
                          <Receipt className="w-7 h-7 mx-auto text-slate-400" />
                          <p className="font-semibold text-slate-700">No GST Tax Invoices Generated Yet</p>
                          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                            Invoices generated from booking confirmation payments or milestone billing will automatically appear here with PDF viewing and WhatsApp dispatch.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* TAB 3: EXPENSES (Complete Project Expense Management Area) */}
              {activeTab === "expenses" && (() => {
                const expensesList = project?.expenses || [];
                const activeProjectExpenses = expensesList.filter(
                  (e: any) => e.status !== "CANCELLED" && e.status !== "REJECTED"
                );
                const totalProjectExpenses = activeProjectExpenses.reduce(
                  (sum: number, e: any) => sum + (e.amount || 0),
                  0
                );
                const contractBudget = project?.revisedBudget || project?.contractValue || 0;
                const remainingBudget = contractBudget - totalProjectExpenses;
                const grossMarginPct =
                  contractBudget > 0
                    ? Number(((remainingBudget / contractBudget) * 100).toFixed(1))
                    : 0;

                // Category breakdown map
                const categoryMap: Record<string, { key: string; name: string; amount: number; count: number }> = {};
                for (const exp of activeProjectExpenses) {
                  const key = exp.categoryKey || exp.category || "OTHER";
                  if (!categoryMap[key]) {
                    categoryMap[key] = { key, name: key.replace(/_/g, " "), amount: 0, count: 0 };
                  }
                  categoryMap[key].amount += exp.amount || 0;
                  categoryMap[key].count += 1;
                }
                const categoryBreakdown = Object.values(categoryMap)
                  .map((c) => ({
                    ...c,
                    percentage: totalProjectExpenses > 0 ? Math.round((c.amount / totalProjectExpenses) * 100) : 0,
                  }))
                  .sort((a, b) => b.amount - a.amount);

                return (
                  <div className="space-y-6">
                    {/* Header with Title and Add Expense Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-walnut/15">
                      <div>
                        <h3 className="text-sm font-bold text-charcoal flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-gold" /> Project Expense Operations
                        </h3>
                        <p className="text-[11px] text-walnut mt-0.5">
                          Live project outgoing cost tracking synchronized with Global Financial Ledger
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

                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
                        <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
                          Total Project Expenses
                        </span>
                        <div className="text-lg font-bold text-rose-700 font-mono mt-1">
                          {formatCurrency(totalProjectExpenses)}
                        </div>
                        <span className="text-[10px] text-walnut/80 mt-0.5 block font-mono">
                          {activeProjectExpenses.length} active entries
                        </span>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
                        <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
                          Contract Budget
                        </span>
                        <div className="text-lg font-bold text-charcoal font-mono mt-1">
                          {formatCurrency(contractBudget)}
                        </div>
                        <span className="text-[10px] text-walnut/80 mt-0.5 block font-mono">
                          Total approved quote
                        </span>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
                        <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
                          Net Gross Margin
                        </span>
                        <div className={`text-lg font-bold font-mono mt-1 ${remainingBudget >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {formatCurrency(remainingBudget)}
                        </div>
                        <span className="text-[10px] text-walnut/80 mt-0.5 block font-mono">
                          {grossMarginPct}% estimated margin
                        </span>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
                        <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
                          Logged Expenses
                        </span>
                        <div className="text-lg font-bold text-charcoal font-mono mt-1">
                          {expensesList.length}
                        </div>
                        <span className="text-[10px] text-walnut/80 mt-0.5 block font-mono">
                          Total records in history
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
                          {categoryBreakdown.map((cat) => (
                            <div
                              key={cat.key}
                              className="p-3 bg-cream/30 rounded-xl border border-walnut/15 space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-charcoal">{cat.name}</span>
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

                    {/* Complete Project Expense History Table */}
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
                                      {exp.vendorName || "Direct Site / Subcontractor"}
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
                                          onClick={() => {
                                            setSelectedExpenseId(exp.id);
                                            setIsExpenseDetailsModalOpen(true);
                                          }}
                                          className="p-1.5 text-gold hover:text-charcoal hover:bg-gold/15 rounded-md transition-colors cursor-pointer"
                                          title="View Expense Details"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteExpense(exp.id)}
                                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
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
                        <div className="p-8 text-center text-xs text-walnut">
                          <Receipt className="w-6 h-6 mx-auto mb-2 text-gold/60" />
                          <p className="font-semibold">No expenses recorded for this project yet.</p>
                          <p className="text-[11px] text-walnut/70 mt-0.5">
                            Click &quot;+ Add Expense&quot; above to record material, labour, or site costs.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* TAB 4: MATERIALS */}
              {activeTab === "materials" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-walnut uppercase tracking-wider">Materials & Purchase Orders</h3>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setMaterialOrderType("General Material Order");
                        setIsMaterialModalOpen(true);
                      }}
                      className="text-xs py-1 h-7 bg-purple-600 text-white font-bold cursor-pointer"
                    >
                      <ShoppingBag className="w-3 h-3 mr-1" /> Order Material
                    </Button>
                  </div>

                  {project?.purchaseOrders && project.purchaseOrders.length > 0 ? (
                    <div className="space-y-2">
                      {project.purchaseOrders.map((po: any) => {
                        const supplierName = po.vendor?.name || po.vendorName || "Approved Supplier";
                        const amount = po.grandTotal !== undefined ? po.grandTotal : po.totalAmount || 0;
                        const itemsSummary = po.items?.map((i: any) => `${i.materialName} (${i.quantity} ${i.unitKey || "NOS"})`).join(", ");

                        return (
                          <div key={po.id} className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-charcoal font-mono flex items-center gap-2">
                                <span>{po.referenceNo || "PO-..."}</span>
                                <Badge variant={po.status === "DELIVERED" ? "completed" : "active"}>{po.status}</Badge>
                              </div>
                              <div className="text-xs text-walnut mt-0.5">Supplier: <strong className="text-charcoal">{supplierName}</strong></div>
                              {itemsSummary && (
                                <div className="text-[11px] text-walnut mt-0.5 font-medium">{itemsSummary}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-charcoal font-mono">
                                {formatCurrency(amount)}
                              </div>
                              <div className="text-[10px] text-walnut font-mono">
                                {formatDate(po.poDate || po.createdAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15">
                      No material purchase orders issued yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: VENDORS */}
              {activeTab === "vendors" && (() => {
                const purchaseOrders = project?.purchaseOrders || [];
                const expensesList = project?.expenses || [];
                const vendorExpenses = expensesList.filter((e: any) => e.vendorId || e.vendorName || e.payee);

                // Aggregate data per vendor
                const vendorMap: Record<string, {
                  id?: string;
                  name: string;
                  category?: string;
                  totalCommitted: number;
                  totalPaid: number;
                  poCount: number;
                  expenseCount: number;
                  itemsSummary: string[];
                  latestStatus?: string;
                  lastOrderDate?: string;
                }> = {};

                // 1. Process purchase orders
                for (const po of purchaseOrders) {
                  const vName = po.vendor?.name || po.vendorName || "Approved Supplier";
                  const vCat = po.vendor?.categoryKey || po.vendor?.category || "Primary Supplier";
                  const amount = Number(po.grandTotal !== undefined ? po.grandTotal : po.totalAmount || 0);
                  const paid = Number(po.paidAmount || (po.status === "DELIVERED" || po.status === "PAID" ? amount : 0));

                  const currentPoDate = po.poDate || po.createdAt;
                  if (!vendorMap[vName]) {
                    vendorMap[vName] = {
                      id: po.vendor?.id,
                      name: vName,
                      category: vCat,
                      totalCommitted: 0,
                      totalPaid: 0,
                      poCount: 0,
                      expenseCount: 0,
                      itemsSummary: [],
                      latestStatus: po.status,
                      lastOrderDate: currentPoDate
                    };
                  } else if (currentPoDate) {
                    if (!vendorMap[vName].lastOrderDate || new Date(currentPoDate) > new Date(vendorMap[vName].lastOrderDate!)) {
                      vendorMap[vName].lastOrderDate = currentPoDate;
                    }
                  }

                  vendorMap[vName].totalCommitted += amount;
                  vendorMap[vName].totalPaid += paid;
                  vendorMap[vName].poCount += 1;
                  if (po.status) vendorMap[vName].latestStatus = po.status;
                  if (po.items && Array.isArray(po.items)) {
                    for (const it of po.items) {
                      if (it.materialName && !vendorMap[vName].itemsSummary.includes(it.materialName)) {
                        vendorMap[vName].itemsSummary.push(it.materialName);
                      }
                    }
                  }
                }

                // 2. Process vendor expenses
                for (const exp of vendorExpenses) {
                  const vName = exp.vendorName || exp.payee || "Subcontractor / Trade Vendor";
                  const vCat = exp.categoryKey || "Trade Contractor";
                  const amount = Number(exp.amount || 0);
                  const paid = (exp.status === "PAID" || exp.status === "APPROVED") ? amount : 0;

                  const currentExpDate = exp.expenseDate || exp.createdAt;
                  if (!vendorMap[vName]) {
                    vendorMap[vName] = {
                      name: vName,
                      category: vCat,
                      totalCommitted: 0,
                      totalPaid: 0,
                      poCount: 0,
                      expenseCount: 0,
                      itemsSummary: [],
                      latestStatus: exp.status || "CONFIRMED",
                      lastOrderDate: currentExpDate
                    };
                  } else if (currentExpDate) {
                    if (!vendorMap[vName].lastOrderDate || new Date(currentExpDate) > new Date(vendorMap[vName].lastOrderDate!)) {
                      vendorMap[vName].lastOrderDate = currentExpDate;
                    }
                  }

                  vendorMap[vName].totalCommitted += amount;
                  vendorMap[vName].totalPaid += paid;
                  vendorMap[vName].expenseCount += 1;
                  if (exp.description && !vendorMap[vName].itemsSummary.includes(exp.description)) {
                    vendorMap[vName].itemsSummary.push(exp.description);
                  }
                }

                const vendorList = Object.values(vendorMap);
                const totalVendorCommitted = vendorList.reduce((sum, v) => sum + v.totalCommitted, 0);
                const totalVendorPaid = vendorList.reduce((sum, v) => sum + v.totalPaid, 0);
                const totalVendorPending = Math.max(0, totalVendorCommitted - totalVendorPaid);
                const totalPOsCount = purchaseOrders.length;
                const deliveredPOsCount = purchaseOrders.filter((po: any) => po.status === "DELIVERED").length;

                return (
                  <div className="space-y-6">
                    {/* Header with Title and Order Material Action */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-walnut/15">
                      <div>
                        <h3 className="text-sm font-bold text-charcoal flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gold" /> Vendor & Subcontractor Operations
                        </h3>
                        <p className="text-[11px] text-walnut mt-0.5">
                          Dedicated vendor commitments, purchase order fulfillment, and trade contractor allocations
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setMaterialOrderType("General Material Order");
                          setIsMaterialModalOpen(true);
                        }}
                        className="text-xs py-1.5 h-8 bg-purple-700 text-white font-bold hover:bg-purple-800 shadow-2xs cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 mr-1" /> + Create Material PO
                      </Button>
                    </div>

                    {/* Global Vendor KPI Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
                        <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
                          Total Vendor Committed
                        </span>
                        <div className="text-lg font-bold text-charcoal font-mono mt-1">
                          {formatCurrency(totalVendorCommitted)}
                        </div>
                        <span className="text-[10px] text-walnut/80 mt-0.5 block font-mono">
                          {totalPOsCount} POs &bull; {vendorExpenses.length} Expenses
                        </span>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
                        <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
                          Total Paid to Vendors
                        </span>
                        <div className="text-lg font-bold text-emerald-700 font-mono mt-1">
                          {formatCurrency(totalVendorPaid)}
                        </div>
                        <span className="text-[10px] text-walnut/80 mt-0.5 block font-mono">
                          Realized vendor payouts
                        </span>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
                        <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
                          Pending Vendor Payables
                        </span>
                        <div className={`text-lg font-bold font-mono mt-1 ${totalVendorPending > 0 ? "text-amber-700" : "text-charcoal"}`}>
                          {formatCurrency(totalVendorPending)}
                        </div>
                        <span className="text-[10px] text-walnut/80 mt-0.5 block font-mono">
                          Outstanding balance
                        </span>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs">
                        <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">
                          Active Suppliers & Teams
                        </span>
                        <div className="text-lg font-bold text-charcoal font-mono mt-1">
                          {vendorList.length > 0 ? vendorList.length : "5 Active"}
                        </div>
                        <span className="text-[10px] text-walnut/80 mt-0.5 block font-mono">
                          {deliveredPOsCount}/{totalPOsCount || 1} Delivered
                        </span>
                      </div>
                    </div>

                    {/* Individual Vendor KPI Cards */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gold" /> Dedicated Vendor Breakdown
                        </h4>
                        <span className="text-[11px] font-mono text-walnut">
                          {vendorList.length} {vendorList.length === 1 ? "Vendor" : "Vendors"} with Allocated Funds
                        </span>
                      </div>

                      {vendorList.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {vendorList.map((v, vIdx) => (
                            <div
                              key={vIdx}
                              className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs space-y-3 hover:border-gold/50 transition-all"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-bold text-xs text-charcoal">{v.name}</div>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cream/80 text-charcoal border border-walnut/20 inline-block mt-1">
                                    {v.category?.replace(/_/g, " ") || "Primary Supplier"}
                                  </span>
                                </div>
                                <Badge variant={v.latestStatus === "DELIVERED" || v.latestStatus === "PAID" ? "completed" : "active"}>
                                  {v.latestStatus || "CONFIRMED"}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-walnut/10 text-xs">
                                <div>
                                  <span className="text-[10px] text-walnut block">Committed</span>
                                  <span className="font-mono font-bold text-charcoal">{formatCurrency(v.totalCommitted)}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-walnut block">Pending Balance</span>
                                  <span className="font-mono font-bold text-amber-700">{formatCurrency(Math.max(0, v.totalCommitted - v.totalPaid))}</span>
                                </div>
                              </div>

                              {v.itemsSummary.length > 0 && (
                                <div className="text-[11px] text-walnut bg-cream/30 p-2 rounded-lg border border-walnut/10 truncate" title={v.itemsSummary.join(", ")}>
                                  <span className="font-medium text-charcoal">Items: </span>
                                  {v.itemsSummary.join(", ")}
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[10px] text-walnut font-mono pt-1">
                                <span>{v.poCount} POs &bull; {v.expenseCount} Vouchers</span>
                                {v.lastOrderDate && <span>{formatDate(v.lastOrderDate)}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Default Directory Overview if no PO is generated yet */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs space-y-2">
                            <div className="text-xs font-bold text-charcoal flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-gold" /> Active Trade Contractors
                            </div>
                            <div className="text-xs text-walnut">
                              Modular Carcass Fabricators, Laminate Pressing Team, Edge Banding Unit
                            </div>
                            <div className="text-[10px] text-emerald-700 font-medium">Ready for project task dispatch &amp; labor billing</div>
                          </div>

                          <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs space-y-2">
                            <div className="text-xs font-bold text-charcoal flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-gold" /> Primary Material Suppliers
                            </div>
                            <div className="text-xs text-walnut">
                              Century Ply (IS:710 Marine), Greenlam Laminates (1mm High-Gloss), Hafele Hardware (Blum Hinges)
                            </div>
                            <div className="text-[10px] text-purple-700 font-medium">Verified rate card &amp; delivery SLA active</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Trade Contractors & Suppliers Overview Card */}
                    <div className="p-5 bg-cream/40 rounded-xl border border-walnut/20 space-y-2">
                      <h4 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-gold" /> Assigned Subcontractor &amp; Supplier Directory
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                        <div>
                          <span className="text-walnut font-semibold">Active Trade Contractors &amp; Teams:</span>
                          <div className="font-bold text-charcoal mt-0.5">
                            {vendorList.filter(v => (v.category || "").toLowerCase().includes("contractor") || (v.category || "").toLowerCase().includes("trade") || (v.category || "").toLowerCase().includes("fabricat")).map(v => v.name).join(", ") || (vendorList.length > 0 ? vendorList.map(v => v.name).join(", ") : "Modular Carcass Fabricators, Laminate Pressing Team")}
                          </div>
                        </div>
                        <div>
                          <span className="text-walnut font-semibold">Primary Material Suppliers:</span>
                          <div className="font-bold text-charcoal mt-0.5">
                            {vendorList.map(v => v.name).join(", ") || "Century Ply, Greenlam Laminates, Hafele Hardware"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAB 6: PAYMENTS */}
              {activeTab === "payments" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-walnut uppercase tracking-wider">Client Inflows & Collections</h3>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setIsRecordPaymentModalOpen(true)}
                      className="text-xs py-1 h-7 bg-gold text-charcoal font-bold"
                    >
                      <Receipt className="w-3 h-3 mr-1" /> Record Client Payment
                    </Button>
                  </div>

                  {project?.payments && project.payments.length > 0 ? (
                    <div className="space-y-2">
                      {project.payments.map((pm: any) => (
                        <div key={pm.id} className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-charcoal font-mono flex items-center gap-2">
                              <Link
                                href={`/finance/payments?id=${pm.id}`}
                                className="hover:text-gold hover:underline"
                              >
                                {pm.referenceNo || "PAY-..."} ↗
                              </Link>
                              <Badge variant={pm.status === "VERIFIED" ? "completed" : pm.status === "RECORDED" ? "warning" : "neutral"}>
                                {pm.status || "RECORDED"}
                              </Badge>
                            </div>
                            <div className="text-xs text-walnut mt-0.5">{pm.paymentMethod} — {formatDate(pm.createdAt)}</div>
                          </div>
                          <div className="text-sm font-bold text-emerald-700 font-mono">
                            {formatCurrency(pm.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15">
                      No milestone payments logged yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: TIMELINE */}
              {activeTab === "timeline" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-walnut uppercase tracking-wider">Audit & Activity Log</h3>
                  {timeline && timeline.length > 0 ? (
                    <div className="space-y-2">
                      {timeline.map((item: any) => (
                        <div key={item.id} className="p-3.5 bg-white rounded-xl border border-walnut/15 flex items-start gap-3">
                          <Clock className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-xs font-bold text-charcoal">{item.title}</div>
                            <div className="text-xs text-walnut mt-0.5">{item.description}</div>
                            <div className="text-[10px] text-walnut/60 font-mono mt-1">{formatDate(item.createdAt)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15">
                      No activity records found.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: CLIENT & LEAD DOSSIER */}
              {activeTab === "client" && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-walnut/20 shadow-2xs space-y-4">
                    <h3 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-gold" /> Client & Origin Lead Dossier
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-walnut">Client Name:</div>
                        <div className="font-bold text-charcoal text-sm mt-0.5">{project?.client?.fullName}</div>
                      </div>
                      <div>
                        <div className="text-walnut">Phone Number:</div>
                        <div className="font-bold text-charcoal font-mono mt-0.5">{project?.client?.phone}</div>
                      </div>
                      <div>
                        <div className="text-walnut">Email Address:</div>
                        <div className="font-bold text-charcoal mt-0.5">{project?.client?.email || "N/A"}</div>
                      </div>
                      <div>
                        <div className="text-walnut">Site Location:</div>
                        <div className="font-bold text-charcoal mt-0.5">{project?.location || "N/A"}</div>
                      </div>
                    </div>

                    {project?.lead && (
                      <div className="pt-3 border-t border-walnut/10 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-walnut">Converted from Lead:</span>
                          <span className="font-mono text-xs font-bold text-charcoal ml-2">{project.lead.referenceNo}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (onOpenLead && project.leadId) {
                              onOpenLead(project.leadId);
                            } else if (project.leadId) {
                              onClose();
                              router.push(`/leads?id=${project.leadId}`);
                            }
                          }}
                          className="text-xs py-1 h-7 border-gold/40 text-gold hover:bg-cream/40"
                        >
                          <Target className="w-3.5 h-3.5 mr-1" /> Open Lead Workspace ↗
                        </Button>
                      </div>
                    )}

                    {project?.clientId && (
                      <div className="pt-3 border-t border-walnut/10 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-walnut">Client 360 Profile:</span>
                          <span className="font-semibold text-xs text-charcoal ml-2">{project.client?.fullName}</span>
                        </div>
                        <Link href={`/clients?id=${project.clientId}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs py-1 h-7 border-walnut/20 text-charcoal hover:bg-cream/40"
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1 text-gold" /> View Client Profile ↗
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: AUDIT TRAIL */}
              {activeTab === "audit" && (
                <EntityAuditSection
                  entityType="Project"
                  entityId={projectId}
                  entityReferenceNo={project?.referenceNo}
                  entityTitle={project?.title}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODALS: Expense, Material, Edit, Delete, Payment          */}
      {/* ========================================================= */}

      {/* Record Project Expense Modal */}
      {isExpenseModalOpen && project && (
        <AddExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={() => {
            setIsExpenseModalOpen(false);
            setSuccessMsg("Project expense recorded successfully");
            fetchProjectDetails();
            onUpdate();
          }}
          initialProjectId={project.id}
          initialProjectTitle={`${project.referenceNo} — ${project.title}`}
        />
      )}

      {/* View Expense Details Modal */}
      {isExpenseDetailsModalOpen && selectedExpenseId && (
        <ExpenseDetailsModal
          isOpen={isExpenseDetailsModalOpen}
          expenseId={selectedExpenseId}
          onClose={() => {
            setIsExpenseDetailsModalOpen(false);
            setSelectedExpenseId(null);
          }}
          onUpdate={() => {
            fetchProjectDetails();
            onUpdate();
          }}
        />
      )}

      {/* Dynamic Material Order Workflow Modal (Rules 8-12, 26) */}
      <MaterialOrderWorkflowModal
        isOpen={isMaterialModalOpen}
        projectId={project?.id || projectId || ""}
        projectReferenceNo={project?.referenceNo}
        projectTitle={project?.title}
        orderType={materialOrderType}
        onClose={() => setIsMaterialModalOpen(false)}
        onSuccess={async () => {
          setSuccessMsg(`${materialOrderType} confirmed and purchase order recorded successfully`);
          await fetchProjectDetails();
          onUpdate();
        }}
      />

      {/* Edit Project Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Project Details" maxWidth="md">
        <form onSubmit={handleUpdateProject} className="space-y-3">
          <Input
            label="Project Title"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Location"
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
            />
            <Input
              label="Contract Value (₹)"
              type="number"
              value={editForm.contractValue}
              onChange={(e) => setEditForm({ ...editForm, contractValue: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full text-xs p-2 border border-walnut/20 rounded-md bg-white"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <Input
              label="Target Completion Date"
              type="date"
              value={editForm.targetDate}
              onChange={(e) => setEditForm({ ...editForm, targetDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" isLoading={isUpdatingProject} className="bg-gold text-charcoal font-bold">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Project Record" maxWidth="sm">
        <div className="space-y-3">
          <p className="text-xs text-charcoal">
            Are you sure you want to delete project <strong className="text-rose-700">{project?.referenceNo}</strong> ({project?.title})?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="outline" onClick={handleDeleteProject} isLoading={isDeletingProject} className="bg-rose-600 text-white border-rose-600 font-bold hover:bg-rose-700">
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Record Payment Modal Integration */}
      {isRecordPaymentModalOpen && project && (
        <RecordPaymentModal
          isOpen={isRecordPaymentModalOpen}
          onClose={() => setIsRecordPaymentModalOpen(false)}
          onSuccess={() => {
            setIsRecordPaymentModalOpen(false);
            setSuccessMsg("Payment recorded successfully");
            fetchProjectDetails();
            onUpdate();
          }}
          initialProjectId={project.id}
          initialClientId={project.clientId}
        />
      )}

      {/* Add Project Expense Modal Integration */}
      {isExpenseModalOpen && project && (
        <AddExpenseModal
          isOpen={isExpenseModalOpen}
          initialProjectId={project.id}
          initialProjectTitle={project.title}
          initialExpenseType="PROJECT"
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={() => {
            setIsExpenseModalOpen(false);
            setSuccessMsg("Expense recorded successfully");
            fetchProjectDetails();
            onUpdate();
          }}
        />
      )}

      {/* Expense Details Modal */}
      {isExpenseDetailsModalOpen && selectedExpenseId && (
        <ExpenseDetailsModal
          isOpen={isExpenseDetailsModalOpen}
          expenseId={selectedExpenseId}
          onClose={() => {
            setIsExpenseDetailsModalOpen(false);
            setSelectedExpenseId(null);
          }}
          onUpdate={() => {
            fetchProjectDetails();
            onUpdate();
          }}
        />
      )}

      {/* ========================================================= */}
      {/* 5. QUOTATION ACTION MODALS                                */}
      {/* ========================================================= */}

      {/* Modal 1: WhatsApp Share Modal */}
      {isWhatsAppModalOpen && selectedQuotation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs select-none">
          <div className="bg-[#FCFBF9] rounded-2xl shadow-2xl border border-walnut/20 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            <div className="px-6 py-4 bg-cream/70 border-b border-walnut/15 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal">Send via WhatsApp</h3>
                  <p className="text-xs text-walnut font-mono">{selectedQuotation.referenceNo} — {formatCurrency(selectedQuotation.totalAmount)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="p-1 rounded-lg text-walnut hover:text-charcoal hover:bg-walnut/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-charcoal mb-1">Recipient WhatsApp Number (with country code)</label>
                <input
                  type="text"
                  value={whatsAppRecipient}
                  onChange={(e) => setWhatsAppRecipient(e.target.value)}
                  placeholder="e.g. 919876543210"
                  className="w-full px-3 py-2 bg-white border border-walnut/20 rounded-lg text-charcoal font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal mb-1">Message Preview</label>
                <textarea
                  rows={7}
                  value={whatsAppMessage}
                  onChange={(e) => setWhatsAppMessage(e.target.value)}
                  className="w-full p-3 bg-white border border-walnut/20 rounded-lg text-charcoal leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="px-6 py-3 bg-cream/30 border-t border-walnut/10 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsWhatsAppModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Send className="w-3.5 h-3.5 mr-1" /> Open WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Printable & PDF Quotation Modal */}
      {isPrintModalOpen && selectedQuotation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-walnut/20 w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
            {/* Top Bar with Print and Close buttons */}
            <div className="px-6 py-3.5 bg-cream/70 border-b border-walnut/15 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gold" />
                <h3 className="text-sm font-bold text-charcoal">
                  Official Quotation — <span className="font-mono">{selectedQuotation.referenceNo}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => window.print()}
                  className="bg-gold text-charcoal font-bold hover:bg-gold/90 h-8"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" /> Print / Save PDF
                </Button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 rounded-lg text-walnut hover:text-charcoal hover:bg-walnut/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-xs text-charcoal print:p-0" id="printable-quotation-view">
              {/* Document Header */}
              <div className="flex justify-between items-start pb-6 border-b border-walnut/20">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-charcoal uppercase">ESPACIO INTERIORS & ARCHITECTS</h1>
                  <p className="text-[11px] text-walnut mt-0.5">Premium Interior Design, Execution & Turnkey Architecture</p>
                  <p className="text-[10px] text-walnut font-mono mt-1">GSTIN: 36ABCDE1234F1Z5 • info@espacio.in • +91 98765 43210</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-charcoal uppercase px-2.5 py-1 bg-cream rounded border border-walnut/20 inline-block">
                    {selectedQuotation.referenceNo}
                  </div>
                  <div className="text-[11px] text-walnut mt-1">Date: <strong>{formatDate(selectedQuotation.createdAt)}</strong></div>
                  {selectedQuotation.validityDate && (
                    <div className="text-[11px] text-walnut">Valid Until: <strong>{formatDate(selectedQuotation.validityDate)}</strong></div>
                  )}
                </div>
              </div>

              {/* Client & Project Details */}
              <div className="grid grid-cols-2 gap-6 p-4 bg-cream/30 rounded-xl border border-walnut/15 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-walnut tracking-wider">Client Details:</span>
                  <div className="font-bold text-sm text-charcoal mt-1">{project?.client?.fullName || selectedQuotation.client?.fullName || "Client"}</div>
                  <div className="text-walnut font-mono mt-0.5">{project?.client?.phone || selectedQuotation.client?.phone || ""}</div>
                  <div className="text-walnut mt-0.5">{project?.client?.email || selectedQuotation.client?.email || ""}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-walnut tracking-wider">Project / Site Location:</span>
                  <div className="font-bold text-sm text-charcoal mt-1">{project?.title || "Project Space"}</div>
                  <div className="text-walnut mt-0.5">{project?.siteAddress || project?.location || "Site Address"}</div>
                  <div className="text-walnut font-mono text-[11px] mt-0.5">Project Ref: {project?.referenceNo}</div>
                </div>
              </div>

              {/* BOQ Line Items Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-walnut mb-2">Room-wise BOQ Line Items</h4>
                <div className="border border-walnut/20 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-cream/70 border-b border-walnut/20 text-[11px] font-bold text-charcoal">
                        <th className="p-2.5 w-10 text-center">#</th>
                        <th className="p-2.5">Room / Section</th>
                        <th className="p-2.5">Category & Description</th>
                        <th className="p-2.5 text-right">Qty</th>
                        <th className="p-2.5 text-right">Unit Rate</th>
                        <th className="p-2.5 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-walnut/10">
                      {selectedQuotation.items && selectedQuotation.items.length > 0 ? (
                        selectedQuotation.items.map((item: any, idx: number) => (
                          <tr key={item.id || idx} className="hover:bg-cream/10">
                            <td className="p-2.5 text-center text-walnut font-mono">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-charcoal">{item.room || "General"}</td>
                            <td className="p-2.5">
                              <div className="font-semibold text-charcoal">{item.itemDescription || item.category}</div>
                              {item.specifications && (
                                <div className="text-[10px] text-walnut mt-0.5">{item.specifications}</div>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-mono">{item.quantity} {item.unitKey || "NOS"}</td>
                            <td className="p-2.5 text-right font-mono">{formatCurrency(item.unitRate || 0)}</td>
                            <td className="p-2.5 text-right font-bold text-charcoal font-mono">{formatCurrency(item.totalAmount || 0)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-walnut">No detailed BOQ items attached.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-72 p-4 bg-cream/40 rounded-xl border border-walnut/20 space-y-2 text-xs">
                  <div className="flex justify-between text-walnut">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold text-charcoal">{formatCurrency(selectedQuotation.subtotal || selectedQuotation.totalAmount)}</span>
                  </div>
                  {selectedQuotation.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-mono font-bold">- {formatCurrency(selectedQuotation.discountAmount)}</span>
                    </div>
                  )}
                  {selectedQuotation.taxAmount > 0 && (
                    <div className="flex justify-between text-walnut">
                      <span>GST / Taxes:</span>
                      <span className="font-mono font-bold text-charcoal">+ {formatCurrency(selectedQuotation.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-charcoal pt-2 border-t border-walnut/20">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base text-gold font-extrabold">{formatCurrency(selectedQuotation.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Terms & Notes */}
              {selectedQuotation.termsAndConditions && (
                <div className="p-4 bg-white rounded-xl border border-walnut/15 text-[11px] text-walnut space-y-1">
                  <strong className="text-charcoal block">Terms & Conditions:</strong>
                  <p className="whitespace-pre-line leading-relaxed">{selectedQuotation.termsAndConditions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Link Existing Quotation Modal */}
      {isLinkQuotationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs select-none">
          <div className="bg-[#FCFBF9] rounded-2xl shadow-2xl border border-walnut/20 w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-cream/70 border-b border-walnut/15 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-gold" />
                <h3 className="text-base font-bold text-charcoal">Link Quotation to Project</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkQuotationModalOpen(false)}
                className="p-1 rounded-lg text-walnut hover:text-charcoal hover:bg-walnut/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <input
                type="text"
                placeholder="Search quotations by reference, title, or client..."
                value={quoteSearchTerm}
                onChange={(e) => setQuoteSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-walnut/20 rounded-lg text-charcoal focus:outline-none focus:ring-1 focus:ring-gold"
              />

              {isLoadingAvailableQuotes ? (
                <div className="p-8 text-center text-walnut">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-gold mb-2" />
                  <p>Loading quotations...</p>
                </div>
              ) : availableQuotations.length > 0 ? (
                <div className="space-y-2">
                  {availableQuotations
                    .filter((q: any) => {
                      if (!quoteSearchTerm.trim()) return true;
                      const s = quoteSearchTerm.toLowerCase();
                      return (
                        q.referenceNo?.toLowerCase().includes(s) ||
                        q.title?.toLowerCase().includes(s) ||
                        q.client?.fullName?.toLowerCase().includes(s)
                      );
                    })
                    .map((q: any) => {
                      const isAlreadyLinked = q.projectId === projectId;
                      return (
                        <div
                          key={q.id}
                          className="p-3.5 bg-white rounded-xl border border-walnut/20 flex items-center justify-between gap-3 hover:border-walnut/40 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-charcoal">{q.referenceNo}</span>
                              <Badge variant={q.status === "APPROVED" ? "completed" : "neutral"}>{q.status}</Badge>
                            </div>
                            <div className="font-medium text-charcoal mt-0.5">{q.title}</div>
                            <div className="text-[10px] text-walnut mt-0.5">
                              {q.client?.fullName ? `Client: ${q.client.fullName}` : "No Client"} • {formatDate(q.createdAt)}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-sm text-charcoal">{formatCurrency(q.totalAmount)}</div>
                            {isAlreadyLinked ? (
                              <span className="text-[10px] text-emerald-700 font-bold mt-1 block">Already Linked</span>
                            ) : (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleLinkQuotation(q.id)}
                                isLoading={isLinkingQuote}
                                className="text-xs py-1 h-7 bg-gold text-charcoal font-bold hover:bg-gold/90 mt-1"
                              >
                                Link to Project
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="p-8 text-center text-walnut">
                  <FileText className="w-6 h-6 mx-auto mb-1 text-gold/60" />
                  <p>No existing quotations found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal 4: Mandatory Material Selection Notes Prompt Modal */}
      {isMaterialPromptModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div className="bg-[#FCFBF9] rounded-2xl shadow-2xl border border-walnut/25 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-cream/80 border-b border-walnut/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-charcoal">Material Selection Notes Required</h3>
                  <p className="text-[10px] text-walnut">Mandatory step before starting execution of next stage</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMaterialPromptModalOpen(false);
                  setPendingNextStage(null);
                }}
                className="p-1 rounded-lg text-walnut hover:text-charcoal hover:bg-walnut/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  Material specifications must be recorded:
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Before transitioning the project to{" "}
                  <strong>{pendingNextStage?.replace(/_/g, " ") || "the next stage"}</strong>, you must enter the material selection notes (laminates, veneers, hardware brands, finishes, or client approval specs).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-charcoal text-xs">
                  Material Selection Notes / Specifications <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={materialNotesText}
                  onChange={(e) => setMaterialNotesText(e.target.value)}
                  placeholder="e.g. Royal Touche 1.25mm Laminate (#4056 Suede finish) selected for master bedroom wardrobes. Hettich soft-close hinges and hydraulic channels approved by client on 24-Sep."
                  className="w-full p-3 bg-white border border-walnut/30 rounded-xl text-charcoal focus:ring-1 focus:ring-gold focus:outline-none placeholder:text-walnut/50 resize-y"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-walnut/15">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsMaterialPromptModalOpen(false);
                    setPendingNextStage(null);
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!materialNotesText.trim() || isChangingStage}
                  isLoading={isChangingStage}
                  onClick={async () => {
                    if (!materialNotesText.trim() || !pendingNextStage) return;
                    await handleStageChange(pendingNextStage, materialNotesText.trim());
                  }}
                  className="bg-gold text-charcoal font-bold hover:bg-gold/90 shadow-2xs text-xs"
                >
                  Save Notes & Advance to {pendingNextStage?.replace(/_/g, " ") || "Next Stage"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Advance Project Stage Modal with Optional Notes */}
      {advanceModalStage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div className="bg-[#FCFBF9] rounded-2xl shadow-2xl border border-walnut/25 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-cream/80 border-b border-walnut/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-charcoal">
                    Advance Stage to {advanceModalStage.order}. {advanceModalStage.title}
                  </h3>
                  <p className="text-[10px] text-walnut">
                    Current stage: {project?.stage?.replace(/_/g, " ")} ({CANONICAL_STAGE_DEFINITIONS.find((s) => s.key === project?.stage)?.order || 1}/16)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdvanceModalStage(null);
                  setAdvanceModalNotes("");
                }}
                className="p-1 rounded-lg text-walnut hover:text-charcoal hover:bg-walnut/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-700">
                <div className="font-bold text-charcoal">Target Execution Phase:</div>
                <p className="text-[11px] leading-relaxed">
                  {advanceModalStage.description}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-charcoal text-xs">
                    Stage Notes / Transition Remarks <span className="text-walnut font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] text-walnut">Recorded to project audit trail</span>
                </div>
                <textarea
                  rows={4}
                  value={advanceModalNotes}
                  onChange={(e) => setAdvanceModalNotes(e.target.value)}
                  placeholder="Add optional transition remarks, client approvals, handover notes, design links, or inspection observations for this stage..."
                  className="w-full p-3 bg-white border border-walnut/30 rounded-xl text-charcoal focus:ring-1 focus:ring-gold focus:outline-none placeholder:text-walnut/50 resize-y"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-walnut/15">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAdvanceModalStage(null);
                    setAdvanceModalNotes("");
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isChangingStage}
                  isLoading={isChangingStage}
                  onClick={async () => {
                    if (!advanceModalStage) return;
                    await handleStageChange(advanceModalStage.key, advanceModalNotes.trim() || undefined);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs text-xs"
                >
                  Confirm &amp; Advance to Step {advanceModalStage.order}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Start Another Project Modal */}
      {isStartAnotherProjectOpen && (
        <StartAnotherProjectModal
          isOpen={isStartAnotherProjectOpen}
          onClose={() => setIsStartAnotherProjectOpen(false)}
          project={project}
          onSuccess={() => {
            setIsStartAnotherProjectOpen(false);
          }}
        />
      )}
    </div>
  );
};
