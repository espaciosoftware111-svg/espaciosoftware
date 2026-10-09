"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Package,
  FileText,
  ArrowRight,
  ChevronLeft,
  CreditCard,
  ShieldCheck,
  Building,
  Receipt,
  ExternalLink,
  Calendar,
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

const INSTALLMENT_PRESETS = [
  "Booking Confirmation Fee",
  "1st Installment (Booking Advance)",
  "2nd Installment (Woodwork & Carcass Production)",
  "3rd Installment (Laminates & Hardware Fitting)",
  "4th Installment (Quality Check & Site Finishing)",
  "Final Project Handover Balance",
];

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
  const router = useRouter();
  const toast = useToast();

  // Workflow steps: 'CATEGORY_SELECT' (only if opened with no context) or 'PAYMENT_FORM'
  const [step, setStep] = useState<"CATEGORY_SELECT" | "PAYMENT_FORM">("PAYMENT_FORM");
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
  const [paymentTitle, setPaymentTitle] = useState<string>("1st Installment (Booking Advance)");

  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentType, setPaymentType] = useState<string>("BANK_TRANSFER");
  const [transactionReference, setTransactionReference] = useState<string>("");
  const [invoiceNumberInput, setInvoiceNumberInput] = useState<string>("");
  const [handoverDate, setHandoverDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [isLoadingEntity, setIsLoadingEntity] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);

  // Reset or initialize modal
  useEffect(() => {
    if (isOpen) {
      setShowDiscardPrompt(false);
      setError("");
      setIsSubmitting(false);

      if (initialQuotationId) {
        setStep("PAYMENT_FORM");
        setSelectedQuotationId(initialQuotationId);
        if (initialProjectId) setSelectedProjectId(initialProjectId);
        if (initialLeadId) setSelectedLeadId(initialLeadId);
        if (initialClientId) setSelectedClientId(initialClientId);
        if (initialAmount !== undefined) setAmount(String(initialAmount));
        if (initialPaymentType) setPaymentType(initialPaymentType);
        fetchQuotationDetails(initialQuotationId);
      } else if (initialProjectId) {
        setStep("PAYMENT_FORM");
        setPaymentCategory("PROJECT");
        setSelectedProjectId(initialProjectId);
        if (initialClientId) setSelectedClientId(initialClientId);
        handleSelectProject(initialProjectId);
      } else if (initialLeadId) {
        setStep("PAYMENT_FORM");
        setPaymentCategory("MATERIALS");
        setSelectedLeadId(initialLeadId);
        handleSelectMaterialLead(initialLeadId);
      } else {
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
    setInvoiceNumberInput("");
    setHandoverDate("");
    setNotes("");
    setPaymentTitle("1st Installment (Booking Advance)");
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
      const [leadsRes, quotesRes] = await Promise.all([
        fetch("/api/v1/leads?limit=100"),
        fetch("/api/v1/quotations?type=MATERIAL&limit=100"),
      ]);
      const leadsJson = await leadsRes.json();
      const quotesJson = await quotesRes.json();

      if (leadsJson.success && leadsJson.data) {
        setMaterialLeads(leadsJson.data);
      }

      if (quotesJson.success && quotesJson.data) {
        setMaterialQuotations(quotesJson.data);
      }
    } catch {
      // quiet error handling
    }
  };

  // When a project is selected
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
      const projRes = await fetch(`/api/v1/projects/${projId}`);
      const projJson = await projRes.json();
      if (projJson.success && projJson.data?.project) {
        const proj = projJson.data.project;
        setLinkedProject(proj);
        setSelectedClientId(proj.clientId || "");

        // Fetch Linked Project Quotation
        const quoteRes = await fetch(`/api/v1/quotations?projectId=${projId}&limit=1`);
        const quoteJson = await quoteRes.json();
        const quotes = quoteJson.data || [];
        const activeQuote = quotes[0] || proj.quotations?.[0] || null;

        if (activeQuote) {
          setSelectedQuotationId(activeQuote.id);
          setLinkedQuotation(activeQuote);
          const quoteBalance = activeQuote.balanceDue !== undefined ? activeQuote.balanceDue : activeQuote.totalAmount;
          setAmount(String(quoteBalance > 0 ? quoteBalance : activeQuote.totalAmount || ""));
        } else {
          const totalBudget = proj.revisedBudget || proj.contractValue || 0;
          const verifiedPaid = (proj.payments || [])
            .filter((p: any) => p.status === "VERIFIED" || p.status === "RECORDED")
            .reduce((acc: number, p: any) => acc + p.amount, 0);
          const remaining = Math.max(0, totalBudget - verifiedPaid);
          setAmount(String(remaining > 0 ? remaining : totalBudget || ""));
        }
      }
    } catch {
      setError("Failed to load project details.");
    } finally {
      setIsLoadingEntity(false);
    }
  };

  // When a material lead is selected
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

        const alreadyPaid = (q.project?.payments || q.payments || [])
          .filter((p: any) => p.status !== "CANCELLED" && p.status !== "REVERSED")
          .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
        const remainingDue = Math.max(0, (Number(q.totalAmount) || 0) - alreadyPaid);
        const quoteBalance = q.balanceDue !== undefined && q.balanceDue > 0 ? q.balanceDue : remainingDue;

        // Automatically default amount to remaining balance due so the user immediately pays the balance, not full contract total
        if (!amount || amount === "0" || (alreadyPaid > 0 && (Number(amount) === Number(q.totalAmount) || !initialAmount))) {
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
  const finalTitle = paymentTitle.trim() || "1st Installment (Booking Advance)";

  // Financial calculations for display
  const totalDealValue = linkedQuotation?.totalAmount || linkedProject?.contractValue || 0;
  const pMap = new Map<string, any>();
  [...(linkedProject?.payments || []), ...(linkedQuotation?.payments || []), ...(linkedLead?.payments || [])].forEach((p: any) => {
    if (p && p.id && p.status !== "CANCELLED" && p.status !== "REVERSED") {
      pMap.set(p.id, p);
    }
  });
  const alreadyPaid = Array.from(pMap.values()).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  const remainingDue = Math.max(0, totalDealValue - alreadyPaid);

  // ACTION 1: Open in the Quotation Section Invoice Generator Studio (Exact same behavior as Confirmation Fee)
  const handleOpenInQuotationStudio = () => {
    if (!amount || enteredAmount <= 0) {
      setError("Please enter a valid positive payment amount.");
      return;
    }

    const targetQuoteId = selectedQuotationId || linkedQuotation?.id || linkedProject?.quotations?.[0]?.id;
    const targetProjId = selectedProjectId || initialProjectId || linkedProject?.id;
    const targetLeadId = selectedLeadId || initialLeadId || linkedLead?.id;
    const targetClientId = selectedClientId || initialClientId || linkedProject?.clientId;
    const invNo = invoiceNumberInput.trim() || undefined;

    const titleStr = `${finalTitle.toUpperCase()} TAX INVOICE`;

    if (targetQuoteId) {
      const studioUrl = `/quotations/${targetQuoteId}?mode=INVOICE&amount=${encodeURIComponent(
        amount
      )}&previousPayments=${encodeURIComponent(
        alreadyPaid
      )}&paymentType=${encodeURIComponent(finalTitle)}&title=${encodeURIComponent(titleStr)}${
        invNo ? `&ref=${encodeURIComponent(invNo)}` : ""
      }&notes=${encodeURIComponent(notes)}&paymentDate=${encodeURIComponent(
        paymentDate
      )}&paymentMode=${encodeURIComponent(paymentType)}${
        handoverDate ? `&handoverDate=${encodeURIComponent(handoverDate)}` : ""
      }${
        targetProjId ? `&projectId=${targetProjId}&returnToProject=${targetProjId}` : ""
      }${targetLeadId ? `&leadId=${targetLeadId}&returnToLead=${targetLeadId}` : ""}${
        targetClientId ? `&clientId=${targetClientId}` : ""
      }&gst=0`;

      onClose();
      router.push(studioUrl);
    } else {
      const studioUrl = `/quotations/new?mode=INVOICE&type=MATERIAL&amount=${encodeURIComponent(
        amount
      )}&previousPayments=${encodeURIComponent(
        alreadyPaid
      )}&paymentType=${encodeURIComponent(finalTitle)}&title=${encodeURIComponent(titleStr)}${
        invNo ? `&ref=${encodeURIComponent(invNo)}` : ""
      }&notes=${encodeURIComponent(notes)}&paymentDate=${encodeURIComponent(
        paymentDate
      )}&paymentMode=${encodeURIComponent(paymentType)}${
        handoverDate ? `&handoverDate=${encodeURIComponent(handoverDate)}` : ""
      }${
        targetProjId ? `&projectId=${targetProjId}&returnToProject=${targetProjId}` : ""
      }${targetLeadId ? `&leadId=${targetLeadId}&returnToLead=${targetLeadId}` : ""}${
        targetClientId ? `&clientId=${targetClientId}` : ""
      }&gst=0`;

      onClose();
      router.push(studioUrl);
    }
  };

  // ACTION 2: Direct Quick Record & Generate Invoice
  const handleQuickRecord = async (e: React.FormEvent) => {
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
      const targetQuotationId = selectedQuotationId || linkedQuotation?.id || linkedProject?.quotations?.[0]?.id;

      if (targetQuotationId) {
        const invRes = await fetch("/api/v1/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quotationId: targetQuotationId,
            projectId: selectedProjectId || undefined,
            clientId: selectedClientId || undefined,
            paymentType: finalTitle,
            amountPaid: enteredAmount,
            paymentDate,
            paymentMode: paymentType,
            invoiceNo: invoiceNumberInput.trim() || undefined,
            transactionReference: transactionReference.trim() || undefined,
            paymentNotes: notes.trim() || undefined,
            handoverDate: handoverDate || undefined,
            allowOverpayment: true,
          }),
        });

        const invJson = await invRes.json();
        if (!invRes.ok || !invJson.success) {
          throw new Error(invJson.error?.message || "Failed to generate tax invoice.");
        }

        const createdInv = invJson.data?.invoice || invJson.data;
        const invId = createdInv?.id;

        toast.success(
          "Payment & Tax Invoice Generated",
          `Payment of ${formatCurrency(enteredAmount)} recorded and Invoice #${createdInv?.invoiceNo || ""} generated.`
        );

        if (invId) {
          window.open(`/api/v1/invoices/${invId}/pdf`, "_blank");
        }

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 500);
        return;
      }

      // Direct payment fallback
      const payload = {
        quotationId: selectedQuotationId || undefined,
        projectId: selectedProjectId || undefined,
        leadId: selectedLeadId || undefined,
        clientId: selectedClientId || undefined,
        milestoneId: selectedMilestoneId || undefined,
        amount: enteredAmount,
        paymentDate,
        paymentMethod: paymentType,
        paymentType: finalTitle,
        transactionReference: transactionReference.trim() || undefined,
        handoverDate: handoverDate || undefined,
        notes: notes.trim() ? `${finalTitle} | ${notes.trim()}` : finalTitle,
      };

      const res = await fetch("/api/v1/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to record payment.");
      }

      toast.success(
        "Payment Recorded Successfully",
        `Payment of ${formatCurrency(enteredAmount)} recorded with reference ${json.data?.referenceNo || ""}`
      );
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1A1612]/60 backdrop-blur-xs animate-fadeIn select-none">
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
        <div className="px-6 py-4 bg-[#F5EFEB] border-b border-[#E2D9CE] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 flex items-center justify-center text-[#6A4A2D]">
              <CreditCard className="w-5 h-5 text-[#6A4A2D]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A1612] tracking-tight">Record Payment &amp; Generate Invoice</h2>
              <p className="text-xs text-[#7A7064]">
                {linkedProject
                  ? `${linkedProject.referenceNo} — ${linkedProject.title}`
                  : linkedQuotation
                  ? `Linked to Quotation ${linkedQuotation.referenceNo}`
                  : "Specify payment amount and installment title"}
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
        <div className="p-6 overflow-y-auto space-y-4.5 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Validation Error: </span>
                {error}
              </div>
            </div>
          )}

          {/* STEP 1: CATEGORY SELECTION (Only shown if launched with zero initial context) */}
          {step === "CATEGORY_SELECT" && !initialProjectId && !initialQuotationId && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C89B3C]">Select Flow</span>
                <h3 className="text-lg font-bold text-[#1A1612]">What is this payment for?</h3>
                <p className="text-xs text-[#7A7064] max-w-sm mx-auto">
                  Choose the commercial entity receiving this client payment.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
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

          {/* STEP 2: PAYMENT & INVOICE DETAILS FORM */}
          {step === "PAYMENT_FORM" && (
            <form onSubmit={handleQuickRecord} className="space-y-4">
              {!initialProjectId && !initialQuotationId && (
                <div className="flex items-center justify-between pb-2 border-b border-[#E2D9CE]">
                  <button
                    type="button"
                    onClick={() => setStep("CATEGORY_SELECT")}
                    className="flex items-center gap-1 text-xs font-semibold text-[#7A7064] hover:text-[#1A1612] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back to Category</span>
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#C89B3C]/15 text-[#6A4A2D]">
                    {paymentCategory} Flow
                  </span>
                </div>
              )}

              {/* PROJECT SELECTOR IF NOT PRE-SET */}
              {!initialProjectId && !initialQuotationId && paymentCategory === "PROJECT" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1612] flex items-center justify-between">
                    <span>Select Project <span className="text-rose-600">*</span></span>
                    {isLoadingEntity && <span className="text-[10px] text-[#C89B3C] font-normal">Loading...</span>}
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

              {/* FINANCIAL CONTEXT BANNER */}
              {(totalDealValue > 0 || linkedProject || linkedQuotation) && (
                <div className="p-3 bg-white border border-[#E2D9CE] rounded-xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#E2D9CE]/60 pb-1.5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C89B3C] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                      Project Commercial Position
                    </span>
                    <span className="font-mono text-xs font-bold text-[#1A1612]">
                      {linkedQuotation?.referenceNo || (linkedProject ? `${linkedProject.referenceNo}` : "Direct Account")}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#7A7064] block">Approved Value:</span>
                      <span className="font-mono font-bold text-xs text-[#1A1612]">
                        {formatCurrency(totalDealValue)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7A7064] block">Total Paid:</span>
                      <span className="font-mono font-bold text-xs text-emerald-700">
                        {formatCurrency(alreadyPaid)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#7A7064] block">Remaining Due:</span>
                      <span className="font-mono font-bold text-xs text-amber-900">
                        {formatCurrency(remainingDue)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* FIELD 1: PAYMENT TITLE / INSTALLMENT PURPOSE */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1612]">
                  Payment Title / Installment Milestone <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="payment-installment-presets"
                    required
                    placeholder="e.g. 1st Installment (Booking Advance), Milestone Payment, etc."
                    value={paymentTitle}
                    onChange={(e) => setPaymentTitle(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-[#E2D9CE] rounded-lg focus:outline-none focus:border-[#C89B3C] text-[#1A1612] font-semibold placeholder:text-[#9C8E7D]"
                  />
                  <datalist id="payment-installment-presets">
                    {INSTALLMENT_PRESETS.map((preset) => (
                      <option key={preset} value={preset} />
                    ))}
                    <option value="Booking Confirmation Fee" />
                    <option value="1st Installment (Booking Advance)" />
                    <option value="2nd Installment (Civil & MEP Execution)" />
                    <option value="3rd Installment (Woodwork & Carpentry)" />
                    <option value="4th Installment (Laminates & Finishes)" />
                    <option value="5th Installment (Final Handover)" />
                    <option value="Material Supply Advance" />
                    <option value="Milestone Payment" />
                  </datalist>
                </div>
              </div>

              {/* FIELD 2: AMOUNT PAYING THIS TIME & PAYMENT DATE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#1A1612]">
                      Amount Paying This Time (₹) <span className="text-rose-600">*</span>
                    </label>
                    {remainingDue > 0 && (
                      <button
                        type="button"
                        onClick={() => setAmount(String(remainingDue))}
                        className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                        title="Set full remaining balance"
                      >
                        Full Due ({formatCurrency(remainingDue)})
                      </button>
                    )}
                  </div>
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

              {/* FIELD 3: PAYMENT METHOD & TRANSACTION REF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1612]">
                    Payment Mode <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-[#E2D9CE] rounded-lg focus:outline-none focus:border-[#C89B3C] text-[#1A1612] font-semibold"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                    <option value="CASH">Cash Payment</option>
                    <option value="CREDIT_CARD">Credit / Debit Card</option>
                    <option value="OTHER">Other Payment Method</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1A1612]">
                    Transaction Ref / UTR / Cheque No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-928374 / CHQ-00123"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-[#E2D9CE] rounded-lg focus:outline-none focus:border-[#C89B3C] font-mono text-[#1A1612]"
                  />
                </div>
              </div>

              {/* FIELD 4: EXPECTED HANDOVER / DELIVERY TARGET DATE */}
              <div className="p-3 bg-[#FAF4E6] border border-[#E5D2A8] rounded-xl space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#5A3E1B] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#B88728]" />
                    Expected Handover / Target Delivery Date
                  </label>
                  <span className="text-[10px] font-bold text-[#8C6214] bg-[#F3E3BE] px-2 py-0.5 rounded-full flex items-center gap-1">
                    📅 Auto-links to Operations Calendar
                  </span>
                </div>
                <input
                  type="date"
                  value={handoverDate}
                  onChange={(e) => setHandoverDate(e.target.value)}
                  className="w-full h-8 px-3 text-xs bg-white border border-[#E2D9CE] rounded-lg focus:outline-none focus:border-[#C89B3C] text-[#1A1612] font-semibold"
                />
                <p className="text-[10px] text-[#7A5B28]">
                  Setting this date locks the project delivery milestone and schedules it on the Operations Calendar under Project Milestones.
                </p>
              </div>

              {/* FIELD 5: PAYMENT NOTES */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1612]">
                  Payment Remarks &amp; Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Add optional notes, bank details, or client handover remarks for this installment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-[#E2D9CE] rounded-lg focus:outline-none focus:border-[#C89B3C] text-[#1A1612] resize-none"
                />
              </div>

              {/* MODAL FOOTER WITH TWO COMPREHENSIVE ACTIONS */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#E2D9CE]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAttemptClose}
                  disabled={isSubmitting}
                  className="text-xs py-1.5 h-8 text-[#7A7064]"
                >
                  Cancel
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="text-xs py-1.5 h-8 border-[#E2D9CE] text-[#1A1612] hover:bg-[#FAF7F2] font-semibold flex items-center gap-1.5 cursor-pointer"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Quick Record &amp; Generate</span>
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleOpenInQuotationStudio}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 h-8 flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-white" />
                    <span>Open in Invoice Generator Studio →</span>
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
