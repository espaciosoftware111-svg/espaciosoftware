"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  FolderOpen,
  Package,
  FileText,
  User,
  ArrowRight,
  ChevronLeft,
  CreditCard,
  ShieldCheck,
  Building,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialQuotationId?: string;
  initialQuotationRef?: string;
  initialQuotationTitle?: string;
  initialAmount?: number;
  initialProjectId?: string;
  initialLeadId?: string;
  initialClientId?: string;
  initialPaymentType?: string;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialQuotationId,
  initialQuotationRef,
  initialQuotationTitle,
  initialAmount,
  initialProjectId,
  initialLeadId,
  initialClientId,
  initialPaymentType,
}) => {
  const toast = useToast();
  // Step navigation: 'CATEGORY_SELECT' (for direct payments) or 'PAYMENT_FORM'
  const [step, setStep] = useState<"CATEGORY_SELECT" | "PAYMENT_FORM">("CATEGORY_SELECT");
  const [paymentCategory, setPaymentCategory] = useState<"PROJECT" | "MATERIALS">("PROJECT");

  // Selection state
  const [projects, setProjects] = useState<any[]>([]);
  const [materialLeads, setMaterialLeads] = useState<any[]>([]);
  const [materialQuotations, setMaterialQuotations] = useState<any[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("");

  // Linked Entity & Quotation Details
  const [linkedQuotation, setLinkedQuotation] = useState<any>(null);
  const [linkedProject, setLinkedProject] = useState<any>(null);
  const [linkedLead, setLinkedLead] = useState<any>(null);

  // Form Fields
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentType, setPaymentType] = useState<string>("BANK_TRANSFER");
  const [transactionReference, setTransactionReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [isLoadingEntity, setIsLoadingEntity] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);

  // Reset or initialize modal
  useEffect(() => {
    if (isOpen) {
      setShowDiscardPrompt(false);
      setError("");
      setSuccessMessage("");
      setIsSubmitting(false);

      if (initialQuotationId) {
        // Method 1: Launched directly from Quotation Studio / View
        setStep("PAYMENT_FORM");
        setSelectedQuotationId(initialQuotationId);
        if (initialProjectId) setSelectedProjectId(initialProjectId);
        if (initialLeadId) setSelectedLeadId(initialLeadId);
        if (initialClientId) setSelectedClientId(initialClientId);
        if (initialAmount !== undefined) setAmount(String(initialAmount));
        if (initialPaymentType) setPaymentType(initialPaymentType);
        fetchQuotationDetails(initialQuotationId);
      } else {
        // Method 2: Launched from Payments Section
        setStep("CATEGORY_SELECT");
        resetSelections();
        fetchProjectsList();
        fetchMaterialLeadsList();
      }
    }
  }, [isOpen, initialQuotationId, initialProjectId, initialLeadId, initialAmount]);

  const resetSelections = () => {
    setSelectedProjectId("");
    setSelectedLeadId("");
    setSelectedQuotationId("");
    setSelectedClientId("");
    setSelectedMilestoneId("");
    setLinkedQuotation(null);
    setLinkedProject(null);
    setLinkedLead(null);
    setAmount("");
    setTransactionReference("");
    setNotes("Payment received successfully from the client.");
  };

  const fetchProjectsList = async () => {
    try {
      const res = await fetch("/api/v1/projects?limit=100");
      const json = await res.json();
      if (json.success && json.data) {
        setProjects(json.data);
      }
    } catch {
      // quiet error handling
    }
  };

  const fetchMaterialLeadsList = async () => {
    try {
      // Fetch material requirement leads and quotations
      const [leadsRes, quotesRes] = await Promise.all([
        fetch("/api/v1/leads?limit=100"),
        fetch("/api/v1/quotations?type=MATERIAL&limit=100"),
      ]);
      const leadsJson = await leadsRes.json();
      const quotesJson = await quotesRes.json();

      if (leadsJson.success && leadsJson.data) {
        // Prioritize leads with "MATERIALS REQUIRED"
        const filtered = leadsJson.data.filter(
          (l: any) =>
            l.requirement?.toUpperCase()?.includes("MATERIAL") ||
            l.tags?.toUpperCase()?.includes("MATERIAL") ||
            true // Allow selecting any lead requiring materials
        );
        setMaterialLeads(filtered);
      }

      if (quotesJson.success && quotesJson.data) {
        setMaterialQuotations(quotesJson.data);
      }
    } catch {
      // quiet error handling
    }
  };

  // When a project is selected in Project Flow
  const handleSelectProject = async (projId: string) => {
    setSelectedProjectId(projId);
    setError("");
    if (!projId) {
      setLinkedProject(null);
      setLinkedQuotation(null);
      setAmount("");
      return;
    }

    setIsLoadingEntity(true);
    try {
      // 1. Fetch Project
      const projRes = await fetch(`/api/v1/projects/${projId}`);
      const projJson = await projRes.json();
      if (projJson.success && projJson.data?.project) {
        const proj = projJson.data.project;
        setLinkedProject(proj);
        setSelectedClientId(proj.clientId || "");

        // 2. Fetch Linked Project Quotation
        const quoteRes = await fetch(`/api/v1/quotations?projectId=${projId}&limit=1`);
        const quoteJson = await quoteRes.json();
        const quotes = quoteJson.data || [];
        const activeQuote = quotes[0] || proj.quotations?.[0] || null;

        if (activeQuote) {
          setSelectedQuotationId(activeQuote.id);
          setLinkedQuotation(activeQuote);
          const quoteAmount = activeQuote.balanceDue !== undefined ? activeQuote.balanceDue : activeQuote.totalAmount;
          setAmount(String(quoteAmount > 0 ? quoteAmount : activeQuote.totalAmount || ""));
        } else {
          // If no specific quotation, fall back to project remaining budget
          const totalBudget = proj.revisedBudget || proj.contractValue || 0;
          const verifiedPaid = (proj.payments || [])
            .filter((p: any) => p.status === "VERIFIED" || p.status === "RECORDED")
            .reduce((acc: number, p: any) => acc + p.amount, 0);
          const remaining = Math.max(0, totalBudget - verifiedPaid);
          setAmount(String(remaining > 0 ? remaining : totalBudget || ""));
        }
      }
    } catch (err: any) {
      setError("Failed to load project details.");
    } finally {
      setIsLoadingEntity(false);
    }
  };

  // When a material lead/person is selected in Materials Flow
  const handleSelectMaterialLead = async (leadIdOrQuoteId: string) => {
    setError("");
    if (!leadIdOrQuoteId) {
      setSelectedLeadId("");
      setSelectedQuotationId("");
      setLinkedLead(null);
      setLinkedQuotation(null);
      setAmount("");
      return;
    }

    setIsLoadingEntity(true);
    try {
      // Check if ID is a quotation or lead
      const matchedQuote = materialQuotations.find((q) => q.id === leadIdOrQuoteId);
      if (matchedQuote) {
        setSelectedQuotationId(matchedQuote.id);
        setLinkedQuotation(matchedQuote);
        setSelectedLeadId(matchedQuote.leadId || "");
        setSelectedClientId(matchedQuote.clientId || "");
        setLinkedLead(matchedQuote.lead || null);
        const quoteAmount = matchedQuote.balanceDue !== undefined ? matchedQuote.balanceDue : matchedQuote.totalAmount;
        setAmount(String(quoteAmount > 0 ? quoteAmount : matchedQuote.totalAmount || ""));
      } else {
        // Fetch Lead & its linked quotation
        const leadRes = await fetch(`/api/v1/leads/${leadIdOrQuoteId}`);
        const leadJson = await leadRes.json();
        if (leadJson.success && leadJson.data) {
          const lead = leadJson.data;
          setSelectedLeadId(lead.id);
          setLinkedLead(lead);
          setSelectedClientId(lead.clientId || "");

          const quoteRes = await fetch(`/api/v1/quotations?leadId=${lead.id}&limit=1`);
          const quoteJson = await quoteRes.json();
          const quotes = quoteJson.data || [];
          const activeQuote = quotes[0] || null;

          if (activeQuote) {
            setSelectedQuotationId(activeQuote.id);
            setLinkedQuotation(activeQuote);
            const quoteAmount = activeQuote.balanceDue !== undefined ? activeQuote.balanceDue : activeQuote.totalAmount;
            setAmount(String(quoteAmount > 0 ? quoteAmount : activeQuote.totalAmount || ""));
          } else {
            setAmount(String(lead.estimatedBudget || ""));
          }
        }
      }
    } catch {
      setError("Failed to load material requirements.");
    } finally {
      setIsLoadingEntity(false);
    }
  };

  // Fetch full details for pre-bound quotation
  const fetchQuotationDetails = async (quoteId: string) => {
    setIsLoadingEntity(true);
    try {
      const res = await fetch(`/api/v1/quotations/${quoteId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const q = json.data;
        setLinkedQuotation(q);
        if (q.projectId) setSelectedProjectId(q.projectId);
        if (q.project) setLinkedProject(q.project);
        if (q.leadId) setSelectedLeadId(q.leadId);
        if (q.lead) setLinkedLead(q.lead);
        if (q.clientId) setSelectedClientId(q.clientId);

        const quoteBalance = q.balanceDue !== undefined ? q.balanceDue : q.totalAmount;
        if (!amount || amount === "0") {
          setAmount(String(quoteBalance > 0 ? quoteBalance : q.totalAmount));
        }
      }
    } catch {
      // quiet error handling
    } finally {
      setIsLoadingEntity(false);
    }
  };

  if (!isOpen) return null;

  const enteredAmount = parseFloat(amount || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!amount || enteredAmount <= 0) {
      setError("Please enter a valid positive payment amount.");
      return;
    }

    if (!selectedProjectId && !selectedQuotationId && !selectedLeadId) {
      setError("Payment must be linked to a Quotation, Project, or Material Requirement.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        quotationId: selectedQuotationId || undefined,
        projectId: selectedProjectId || undefined,
        leadId: selectedLeadId || undefined,
        clientId: selectedClientId || undefined,
        milestoneId: selectedMilestoneId || undefined,
        amount: enteredAmount,
        paymentDate,
        paymentMethod: paymentType,
        paymentType,
        transactionReference: transactionReference.trim() || undefined,
        externalReference: transactionReference.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await fetch("/api/v1/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to record payment.");
        setIsSubmitting(false);
        return;
      }

      toast.success(
        "Payment Recorded Successfully",
        `Payment of ${formatCurrency(enteredAmount)} recorded with reference ${json.data?.referenceNo || ""}`
      );
      setSuccessMessage(`Payment recorded successfully! Reference: ${json.data?.referenceNo || "PAY-RECORDED"}`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err.message || "Network error occurred while recording payment.");
      setIsSubmitting(false);
    }
  };

  const hasUnsavedChanges = Boolean(enteredAmount > 0 || transactionReference.trim() || notes.trim());

  const handleAttemptClose = () => {
    if (hasUnsavedChanges) {
      setShowDiscardPrompt(true);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#1A1612]/60 backdrop-blur-xs animate-fadeIn select-none">
      <div className="bg-[#FAF7F2] rounded-2xl shadow-2xl border border-[#E2D9CE] w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Unsaved Changes Warning Banner */}
        {showDiscardPrompt && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 animate-in slide-in-from-top duration-150 z-20">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>You have entered payment details. Discard and close?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowDiscardPrompt(false)}
                className="px-2.5 py-1 text-xs font-semibold bg-white border border-amber-300 rounded-md text-amber-900 hover:bg-amber-100/50 cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardPrompt(false);
                  onClose();
                }}
                className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-md cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Modal Luxury Header */}
        <div className="px-6 py-4.5 bg-[#F5EFEB] border-b border-[#E2D9CE] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 flex items-center justify-center text-[#6A4A2D]">
              <CreditCard className="w-5 h-5 text-[#6A4A2D]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A1612] tracking-tight">Record Client Payment</h2>
              <p className="text-xs text-[#7A7064]">
                {step === "CATEGORY_SELECT"
                  ? "Select commercial classification"
                  : selectedQuotationId
                  ? `Linked to Quotation ${linkedQuotation?.referenceNo || initialQuotationRef || selectedQuotationId}`
                  : "Authoritative financial money receipt"}
              </p>
            </div>
          </div>
          <button
            onClick={handleAttemptClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7A7064] hover:bg-[#E2D9CE]/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Validation Error: </span>
                {error}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="font-bold">{successMessage}</div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: CATEGORY SELECTION ("WHAT IS THIS PAYMENT FOR?")    */}
          {/* ============================================================ */}
          {step === "CATEGORY_SELECT" && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C89B3C]">Step 1 of 2</span>
                <h3 className="text-lg font-bold text-[#1A1612]">What is this payment for?</h3>
                <p className="text-xs text-[#7A7064] max-w-sm mx-auto">
                  Choose the commercial entity receiving this client payment.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                {/* 1. PROJECT CATEGORY */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentCategory("PROJECT");
                    setStep("PAYMENT_FORM");
                  }}
                  className="p-5 rounded-xl border-2 border-[#E2D9CE] bg-white hover:border-[#C89B3C] hover:shadow-md hover:bg-[#FDFBF7] transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E2D9CE] text-[#6A4A2D] w-fit group-hover:bg-[#C89B3C] group-hover:text-white transition-colors">
                    <Building className="w-6 h-6" />
                  </div>
                  <div className="mt-4">
                    <span className="text-sm font-bold text-[#1A1612] block group-hover:text-[#6A4A2D] transition-colors">
                      PROJECT
                    </span>
                    <p className="text-[11px] text-[#7A7064] mt-1 leading-relaxed">
                      Interior execution, turnkey site work &amp; project milestones
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#C89B3C] group-hover:translate-x-1 transition-transform">
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* 2. MATERIALS CATEGORY */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentCategory("MATERIALS");
                    setStep("PAYMENT_FORM");
                  }}
                  className="p-5 rounded-xl border-2 border-[#E2D9CE] bg-white hover:border-[#C89B3C] hover:shadow-md hover:bg-[#FDFBF7] transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E2D9CE] text-[#6A4A2D] w-fit group-hover:bg-[#C89B3C] group-hover:text-white transition-colors">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="mt-4">
                    <span className="text-sm font-bold text-[#1A1612] block group-hover:text-[#6A4A2D] transition-colors">
                      MATERIALS
                    </span>
                    <p className="text-[11px] text-[#7A7064] mt-1 leading-relaxed">
                      Hardware, ply boards, laminates &amp; material requirement leads
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#C89B3C] group-hover:translate-x-1 transition-transform">
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: PAYMENT FORM (PROJECT, MATERIALS, OR DIRECT QUOTATION) */}
          {/* ============================================================ */}
          {step === "PAYMENT_FORM" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!initialQuotationId && (
                <div className="flex items-center justify-between pb-2 border-b border-[#E2D9CE]">
                  <button
                    type="button"
                    onClick={() => setStep("CATEGORY_SELECT")}
                    className="flex items-center gap-1 text-xs font-semibold text-[#7A7064] hover:text-[#1A1612] transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back to Category</span>
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#C89B3C]/15 text-[#6A4A2D]">
                    {paymentCategory} Flow
                  </span>
                </div>
              )}

              {/* PROJECT FLOW SELECTOR */}
              {!initialQuotationId && paymentCategory === "PROJECT" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1612] flex items-center justify-between">
                    <span>Select Project <span className="text-rose-600">*</span></span>
                    {isLoadingEntity && <span className="text-[10px] text-[#C89B3C] font-normal">Loading quotation...</span>}
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => handleSelectProject(e.target.value)}
                    required
                    className="w-full h-9 px-3 text-xs bg-white border border-[#E2D9CE] rounded-lg focus:outline-none focus:border-[#C89B3C] text-[#1A1612] font-medium"
                  >
                    <option value="">-- Choose Active Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.referenceNo} — {p.title} ({p.client?.fullName || "Client"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* MATERIALS FLOW SELECTOR */}
              {!initialQuotationId && paymentCategory === "MATERIALS" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1612] flex items-center justify-between">
                    <span>Select Material Person / Lead <span className="text-rose-600">*</span></span>
                    {isLoadingEntity && <span className="text-[10px] text-[#C89B3C] font-normal">Loading quotation...</span>}
                  </label>
                  <select
                    value={selectedQuotationId || selectedLeadId}
                    onChange={(e) => handleSelectMaterialLead(e.target.value)}
                    required
                    className="w-full h-9 px-3 text-xs bg-white border border-[#E2D9CE] rounded-lg focus:outline-none focus:border-[#C89B3C] text-[#1A1612] font-medium"
                  >
                    <option value="">-- Choose Material Requirement Person / Quote --</option>
                    {materialQuotations.length > 0 && (
                      <optgroup label="Material Quotations">
                        {materialQuotations.map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.referenceNo} — {q.lead?.clientName || q.client?.fullName || "Buyer"} (₹{(q.totalAmount || 0).toLocaleString("en-IN")})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {materialLeads.length > 0 && (
                      <optgroup label="Material Requirement Leads">
                        {materialLeads.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.referenceNo} — {l.clientName} ({l.phone}) {l.requirement ? `• ${l.requirement}` : ""}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}

              {/* LINKED QUOTATION & CLIENT CONTEXT CARD */}
              {(linkedQuotation || initialQuotationRef || linkedProject || linkedLead) && (
                <div className="p-3.5 bg-white border border-[#E2D9CE] rounded-xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#E2D9CE]/60 pb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C89B3C] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                      Commercial Quotation Attribution
                    </span>
                    <span className="font-mono text-xs font-bold text-[#1A1612]">
                      {linkedQuotation?.referenceNo || initialQuotationRef || (selectedQuotationId ? `QT-${selectedQuotationId.slice(0, 8)}` : "Direct Entry")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#7A7064]">Client / Payer:</span>
                      <div className="font-semibold text-[#1A1612] truncate">
                        {linkedQuotation?.client?.fullName ||
                          linkedQuotation?.lead?.clientName ||
                          linkedProject?.client?.fullName ||
                          linkedLead?.clientName ||
                          "Client"}
                      </div>
                      <div className="text-[10px] text-[#7A7064]">
                        {linkedQuotation?.client?.phone || linkedQuotation?.lead?.phone || linkedProject?.client?.phone || linkedLead?.phone || ""}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#7A7064]">Quotation Total / Balance:</span>
                      <div className="font-mono font-bold text-xs text-[#1A1612]">
                        {linkedQuotation ? formatCurrency(linkedQuotation.totalAmount) : formatCurrency(enteredAmount)}
                      </div>
                      {linkedQuotation?.balanceDue !== undefined && (
                        <div className="text-[10px] font-mono text-[#10B981] font-semibold">
                          Balance Due: {formatCurrency(linkedQuotation.balanceDue)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* AMOUNT & DATE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1612]">
                    Payment Amount (₹) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A7064]">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      placeholder="e.g. 50000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full h-9 pl-7 pr-3 text-xs bg-white border border-[#E2D9CE] rounded-lg focus:outline-none focus:border-[#C89B3C] font-mono font-bold text-[#1A1612]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1612]">
                    Payment Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-[#E2D9CE] rounded-lg focus:outline-none focus:border-[#C89B3C] text-[#1A1612] font-medium"
                  />
                </div>
              </div>

              {/* PAYMENT TYPE & TRANSACTION REFERENCE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1612]">
                    Payment Type <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-[#E2D9CE] rounded-lg focus:outline-none focus:border-[#C89B3C] text-[#1A1612] font-semibold"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="CASH">Cash Payment</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                    <option value="CREDIT_CARD">Credit / Debit Card</option>
                    <option value="OTHER">Other Payment Method</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1612]">
                    Transaction Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-458921 / UPI-928374 / CHQ-001"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-[#E2D9CE] rounded-lg focus:outline-none focus:border-[#C89B3C] font-mono text-[#1A1612]"
                  />
                </div>
              </div>

              {/* PAYMENT NOTES */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1612]">
                  Payment Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Payment received successfully from the client towards agreed milestone."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-[#E2D9CE] rounded-lg focus:outline-none focus:border-[#C89B3C] text-[#1A1612] resize-none"
                />
              </div>

              {/* MODAL FOOTER */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2D9CE]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAttemptClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-[#C89B3C] hover:bg-[#B38728] text-white font-bold px-5"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Record Payment
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
