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
  Sparkles,
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
    | "expenses"
    | "materials"
    | "vendors"
    | "payments"
    | "timeline"
    | "client"
  >("overview");

  // Stage change state
  const [selectedStage, setSelectedStage] = useState("");
  const [delayReason, setDelayReason] = useState("CLIENT_DECISION");
  const [stageNotes, setStageNotes] = useState("");
  const [isChangingStage, setIsChangingStage] = useState(false);

  // Inline Note Form per stage/card
  const [activeNoteStage, setActiveNoteStage] = useState<string | null>(null);
  const [inlineNoteText, setInlineNoteText] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

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
        !isRecordPaymentModalOpen
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

  // Stage Change Handler
  const handleStageChange = async (newStage: string) => {
    if (!projectId) return;
    setIsChangingStage(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toStage: newStage,
          notes: stageNotes || `Stage advanced to ${newStage.replace(/_/g, " ")}`,
          delayReason: delayHealth?.status === "DELAYED" ? delayReason : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to update execution stage");
        return;
      }

      setSuccessMsg(`Project stage advanced to ${newStage.replace(/_/g, " ")}`);
      toast.success("Project Stage Advanced", `Moved to ${newStage.replace(/_/g, " ")}`);
      setSelectedStage(newStage);
      await fetchProjectDetails();
      onUpdate();
    } catch {
      setError("Network error advancing stage");
    } finally {
      setIsChangingStage(false);
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

  if (!isOpen || !projectId) return null;

  // Compute Active Index for 16-Stage Flipkart Progression
  const currentStageIndex = CANONICAL_STAGE_DEFINITIONS.findIndex(
    (s) => s.key === project?.stage
  );
  const activeIdx = currentStageIndex >= 0 ? currentStageIndex : 0;
  const progressPercent = Math.round(((activeIdx + 1) / CANONICAL_STAGE_DEFINITIONS.length) * 100);

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
            { id: "expenses", label: `Expenses (${project?.expenses?.length || 0})` },
            { id: "materials", label: `Materials (${project?.purchaseOrders?.length || 0})` },
            { id: "vendors", label: `Vendors (${project?.purchaseOrders?.length || 0})` },
            { id: "payments", label: `Payments (${project?.payments?.length || 0})` },
            { id: "timeline", label: `Timeline (${timeline.length})` },
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
              {activeTab === "overview" && (
                <div className="space-y-4">
                  {/* Card 1: Project Information */}
                  <div className="bg-white p-5 rounded-xl border border-walnut/20 shadow-2xs">
                    <h3 className="text-xs font-bold text-walnut uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-gold" /> Project Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <div className="text-[11px] text-walnut/80">Project ID</div>
                        <div className="text-xs font-bold text-charcoal font-mono mt-0.5">{project?.referenceNo}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-walnut/80">Project Title</div>
                        <div className="text-xs font-bold text-charcoal mt-0.5">{project?.title}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-walnut/80">Location</div>
                        <div className="text-xs font-bold text-charcoal mt-0.5">{project?.location || "N/A"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Commercial Information */}
                  <div className="bg-white p-5 rounded-xl border border-walnut/20 shadow-2xs">
                    <h3 className="text-xs font-bold text-walnut uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" /> Commercial & Financial Ledger
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <div className="text-[11px] text-walnut/80">Contract Value</div>
                        <div className="text-sm font-bold text-charcoal font-mono mt-0.5">
                          {formatCurrency(project?.contractValue || 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-walnut/80">Incurred Expenses</div>
                        <div className="text-sm font-bold text-rose-700 font-mono mt-0.5">
                          {formatCurrency(project?.totalExpenses || 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-walnut/80">Net Gross Margin</div>
                        <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                          {formatCurrency(project?.netProfit || (project?.contractValue || 0) - (project?.totalExpenses || 0))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-walnut/80">Gross Margin %</div>
                        <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                          {project?.profitMarginPct || "45.0"}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Linked Lead Connection */}
                  {project?.lead && (
                    <div className="bg-white p-5 rounded-xl border border-gold/30 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-walnut uppercase tracking-wider flex items-center gap-1.5">
                          <Target className="w-4 h-4 text-gold" /> Origin Lead Connection
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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-walnut/80">Lead Reference</div>
                          <div className="font-bold text-charcoal font-mono mt-0.5">{project.lead.referenceNo}</div>
                        </div>
                        <div>
                          <div className="text-walnut/80">Lead Source</div>
                          <div className="font-bold text-charcoal mt-0.5">{project.lead.sourceKey || "WEBSITE"}</div>
                        </div>
                        <div>
                          <div className="text-walnut/80">Lead Contact</div>
                          <div className="font-bold text-charcoal mt-0.5">{project.lead.phone || project.client?.phone}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PIPELINE (16-Stage Flipkart-Style Green Tracking Stepper) */}
              {activeTab === "pipeline" && (
                <div className="space-y-6">
                  {/* Top Mini Order Progress Bar */}
                  <div className="p-4 bg-white rounded-xl border border-walnut/20 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-charcoal flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-600" /> 16-Stage Execution Progression
                        </span>
                        <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {progressPercent}% Complete
                        </span>
                      </div>
                      <span className="text-[11px] text-walnut font-medium">
                        Active Stage: <strong className="text-charcoal">{project?.stage?.replace(/_/g, " ")}</strong>
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500 ease-out rounded-full shadow-xs"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Vertical Connected Green Tracking Order Stepper */}
                  <div className="relative pl-10 space-y-6">
                    {CANONICAL_STAGE_DEFINITIONS.map((stageDef, idx) => {
                      const isCompleted = idx < activeIdx;
                      const isActive = idx === activeIdx;
                      const isFuture = idx > activeIdx;
                      const isLast = idx === CANONICAL_STAGE_DEFINITIONS.length - 1;

                      return (
                        <div
                          key={stageDef.key}
                          className={`relative p-4 rounded-xl border transition-all shadow-2xs space-y-2 ${
                            isCompleted
                              ? "bg-white border-emerald-200"
                              : isActive
                              ? "bg-emerald-50/40 border-emerald-400 ring-1 ring-emerald-200"
                              : "bg-white border-walnut/15 opacity-70"
                          }`}
                        >
                          {/* Connected Green Vertical Line to Next Step */}
                          {!isLast && (
                            <div
                              className={`absolute -left-7 top-7 bottom-0 w-1 transition-colors duration-300 ${
                                isCompleted ? "bg-emerald-500" : "bg-slate-200"
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
                                ? "bg-emerald-600 text-white ring-4 ring-emerald-200 animate-pulse"
                                : "bg-white border-2 border-slate-300 text-slate-400"
                            }`}
                          >
                            {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stageDef.order}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isCompleted
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : isActive
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold"
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
                              {stageDef.key === "RAW_MATERIAL_ORDERED" && (
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
                              {stageDef.key === "LAMINATE_ORDERED" && (
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
                              {!isCompleted && !isActive && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStageChange(stageDef.key)}
                                  className="text-xs py-0.5 h-6 text-walnut hover:bg-cream/40"
                                >
                                  Advance to Here
                                </Button>
                              )}
                              {isActive && (
                                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  <Sparkles className="w-3 h-3" /> In Execution
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-walnut">{stageDef.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                                {new Date(po.poDate || po.createdAt).toLocaleDateString()}
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
              {activeTab === "vendors" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-walnut uppercase tracking-wider">Assigned Subcontractors & Vendors</h3>
                  <div className="p-6 bg-white rounded-xl border border-walnut/15 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-walnut">Active Trade Contractors:</span>
                        <div className="font-bold text-charcoal mt-1">Modular Carcass Fabricators, Laminate Pressing Team</div>
                      </div>
                      <div>
                        <span className="text-walnut">Primary Suppliers:</span>
                        <div className="font-bold text-charcoal mt-1">Century Ply, Greenlam Laminates, Hafele Hardware</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
    </div>
  );
};
