"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  Receipt,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertTriangle,
  Building,
  Calendar,
  DollarSign,
  ArrowRight,
  Eye,
  FolderOpen,
  User,
  Package,
  FileText,
  ShieldCheck,
  Layers,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PROJECT_PIPELINE_STAGES = [
  { key: "CONFIRMATION_FEE_PAID", order: 1, label: "Confirmation Fee Paid" },
  { key: "DESIGNING", order: 2, label: "Designing" },
  { key: "MATERIAL_SELECTION", order: 3, label: "Material Selection" },
  { key: "RAW_MATERIAL_ORDER", order: 4, label: "Raw Material Order" },
  { key: "RAW_MATERIAL_ORDERED", order: 5, label: "Raw Material Ordered" },
  { key: "WOOD_WORK", order: 6, label: "Wood Work" },
  { key: "WOOD_WORK_COMPLETED", order: 7, label: "Wood Work Completed" },
  { key: "LAMINATE_ORDERED", order: 8, label: "Laminate Ordered" },
  { key: "LAMINATE_PASTING", order: 9, label: "Laminate Pasting" },
  { key: "FITTING_WORK_COMPLETED", order: 10, label: "Fitting Work Completed" },
  { key: "QUALITY_CHECK", order: 11, label: "Quality Check" },
  { key: "PROJECT_HANDOVER", order: 12, label: "Project Handover" },
  { key: "PROJECT_COMPLETED", order: 13, label: "Project Completed" },
];

function normalizePipelineStage(currentStage?: string): number {
  if (!currentStage) return 1;
  const upper = currentStage.toUpperCase();

  if (upper.includes("COMPLET") && upper.includes("PROJECT")) return 13;
  if (upper.includes("HANDOVER")) return 12;
  if (upper.includes("QUALITY")) return 11;
  if (upper.includes("FITTING")) return 10;
  if (upper.includes("PASTING")) return 9;
  if (upper.includes("LAMINATE") && upper.includes("ORDER")) return 8;
  if (upper.includes("WOOD") && upper.includes("COMPLET")) return 7;
  if (upper.includes("WOOD")) return 6;
  if (upper.includes("RAW") && upper.includes("ORDERED")) return 5;
  if (upper.includes("RAW")) return 4;
  if (upper.includes("MATERIAL")) return 3;
  if (upper.includes("DESIGN")) return 2;
  return 1;
}

interface PaymentDetailsDrawerProps {
  paymentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReceipt: (paymentId: string) => void;
  onOpenReversal: (paymentId: string) => void;
  onVerify: (paymentId: string) => void;
  isAdmin: boolean;
}

export const PaymentDetailsDrawer: React.FC<PaymentDetailsDrawerProps> = ({
  paymentId,
  isOpen,
  onClose,
  onOpenReceipt,
  onOpenReversal,
  onVerify,
  isAdmin,
}) => {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "pipeline" | "timeline">("details");

  useEffect(() => {
    if (isOpen && paymentId) {
      fetchDetails();
    } else {
      setData(null);
      setTimelineData(null);
      setActiveTab("details");
    }
  }, [isOpen, paymentId]);

  const fetchDetails = async () => {
    if (!paymentId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/payments/${paymentId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.data.payment?.projectId) {
          fetchTimeline(json.data.payment.projectId);
        }
      }
    } catch {
      // quiet error handling
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeline = async (projectId: string) => {
    try {
      const res = await fetch(`/api/v1/payments/timeline?projectId=${projectId}`);
      const json = await res.json();
      if (json.success) {
        setTimelineData(json.data);
      }
    } catch {
      // quiet error handling
    }
  };

  if (!isOpen) return null;

  const payment = data?.payment;
  const financials = data?.financials;
  const isProjectPayment = payment?.relatedType === "PROJECT" || !!payment?.projectId;
  const isMaterialPayment = payment?.relatedType === "MATERIALS" || payment?.lead?.requirement?.toUpperCase()?.includes("MATERIAL");

  const currentStageIndex = normalizePipelineStage(payment?.project?.stage);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#1A1612]/50 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-xl bg-[#FAF7F2] h-full shadow-2xl flex flex-col border-l border-[#E2D9CE]">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E2D9CE] bg-[#F5EFEB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-[#E2D9CE] text-[#6A4A2D] shadow-2xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#1A1612]">
                  {payment?.referenceNo || "Payment Record"}
                </span>
                {payment && (
                  <Badge
                    variant={
                      payment.status === "VERIFIED"
                        ? "completed"
                        : payment.status === "RECORDED"
                        ? "pending"
                        : "danger"
                    }
                  >
                    {payment.status === "RECORDED" ? "Recorded" : payment.status.replace(/_/g, " ")}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#7A7064] mt-0.5">
                {payment?.project?.title || payment?.quotation?.title || "Commercial Payment Record"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {payment && (
              <Button size="sm" variant="outline" onClick={() => onOpenReceipt(payment.id)}>
                Print Voucher
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#7A7064] hover:bg-[#E2D9CE]/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-[#E2D9CE] px-5 bg-white">
          <button
            onClick={() => setActiveTab("details")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === "details"
                ? "border-[#C89B3C] text-[#1A1612]"
                : "border-transparent text-[#7A7064] hover:text-[#1A1612]"
            }`}
          >
            Payment Details
          </button>
          {isProjectPayment && (
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === "pipeline"
                  ? "border-[#C89B3C] text-[#1A1612]"
                  : "border-transparent text-[#7A7064] hover:text-[#1A1612]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Project Pipeline (13 Stages)</span>
            </button>
          )}
          {payment?.projectId && (
            <button
              onClick={() => setActiveTab("timeline")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
                activeTab === "timeline"
                  ? "border-[#C89B3C] text-[#1A1612]"
                  : "border-transparent text-[#7A7064] hover:text-[#1A1612]"
              }`}
            >
              Milestone Timeline ({timelineData?.events?.length || 0})
            </button>
          )}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-[#1A1612]">
          {isLoading ? (
            <div className="py-20 text-center text-[#7A7064]">Loading payment records...</div>
          ) : !payment ? (
            <div className="py-20 text-center text-[#7A7064]">Payment record not found.</div>
          ) : activeTab === "details" ? (
            <>
              {/* KEY RECEIPT DETAILS CARDS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white rounded-xl border border-[#E2D9CE] shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A7064]">
                    Receipt Amount
                  </span>
                  <div className="text-xl font-bold font-mono text-[#1A1612] tabular-nums mt-0.5">
                    {formatCurrency(payment.amount)}
                  </div>
                  <div className="text-[11px] font-semibold text-[#6A4A2D] mt-0.5">
                    {(payment.paymentMethod || "OTHER").replace(/_/g, " ")}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E2D9CE] shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A7064]">
                    Payment Date &amp; Ref
                  </span>
                  <div className="text-sm font-bold text-[#1A1612] mt-0.5">
                    {formatDate(payment.paymentDate)}
                  </div>
                  <div className="text-[10px] font-mono text-[#7A7064] mt-0.5 truncate" title={payment.referenceNoExt || "No reference"}>
                    Ref: {payment.referenceNoExt || "TXN-N/A"}
                  </div>
                </div>
              </div>

              {/* DYNAMIC RELATED ENTITY CARD */}
              {isProjectPayment && (
                <div className="p-4 bg-white rounded-xl border border-[#E2D9CE] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E2D9CE]/60 pb-2">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-[#C89B3C] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#6A4A2D]" />
                      Project Details
                    </span>
                    <span className="font-mono text-xs font-bold text-[#1A1612]">
                      {payment.project?.referenceNo || "PROJ-REF"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#7A7064]">Project Name:</span>
                      <div className="font-bold text-[#1A1612]">{payment.project?.title || "Active Project"}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7A7064]">Client Name &amp; Phone:</span>
                      <div className="font-semibold text-[#1A1612]">
                        {payment.client?.fullName || payment.project?.client?.fullName || "Client"}
                      </div>
                      <div className="text-[10px] text-[#7A7064]">
                        {payment.client?.phone || payment.project?.client?.phone || ""}
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS FOR PROJECT */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E2D9CE]/60">
                    {payment.quotationId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 text-[#1A1612] border-[#E2D9CE] hover:border-[#C89B3C]"
                        onClick={() => {
                          onClose();
                          router.push(`/quotations/${payment.quotationId}`);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C89B3C]" />
                        <span>👁 View Quotation</span>
                      </Button>
                    )}
                    {payment.projectId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 text-[#1A1612] border-[#E2D9CE] hover:border-[#C89B3C]"
                        onClick={() => {
                          onClose();
                          router.push(`/projects?id=${payment.projectId}`);
                        }}
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-[#6A4A2D]" />
                        <span>📁 View Project</span>
                      </Button>
                    )}
                    {(payment.clientId || payment.client?.id) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 text-[#1A1612] border-[#E2D9CE] hover:border-[#C89B3C]"
                        onClick={() => {
                          onClose();
                          router.push(`/clients?id=${payment.clientId || payment.client?.id}`);
                        }}
                      >
                        <User className="w-3.5 h-3.5 text-[#C89B3C]" />
                        <span>👤 View Client 360</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* IF MATERIAL QUOTATION */}
              {isMaterialPayment && (
                <div className="p-4 bg-white rounded-xl border border-[#E2D9CE] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E2D9CE]/60 pb-2">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-[#C89B3C] flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#6A4A2D]" />
                      Material Requirement Details
                    </span>
                    <span className="font-mono text-xs font-bold text-[#1A1612]">
                      {payment.lead?.referenceNo || payment.quotation?.referenceNo || "MAT-REF"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#7A7064]">Person / Lead Name:</span>
                      <div className="font-bold text-[#1A1612]">
                        {payment.lead?.clientName || payment.client?.fullName || "Buyer"}
                      </div>
                      <div className="text-[10px] text-[#7A7064]">{payment.lead?.phone || payment.client?.phone || ""}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7A7064]">Material Requirement:</span>
                      <div className="font-medium text-[#1A1612]">
                        {payment.lead?.requirement || payment.quotation?.title || "Materials Required"}
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS FOR MATERIAL */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E2D9CE]/60">
                    {payment.quotationId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 text-[#1A1612] border-[#E2D9CE] hover:border-[#C89B3C]"
                        onClick={() => {
                          onClose();
                          router.push(`/quotations/${payment.quotationId}`);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C89B3C]" />
                        <span>👁 View Quotation</span>
                      </Button>
                    )}
                    {payment.leadId && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 text-[#1A1612] border-[#E2D9CE] hover:border-[#C89B3C]"
                        onClick={() => {
                          onClose();
                          router.push(`/leads?id=${payment.leadId}`);
                        }}
                      >
                        <User className="w-3.5 h-3.5 text-[#6A4A2D]" />
                        <span>👤 View Lead Profile</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* FINANCIAL POSITION CARD */}
              <div className="p-4 bg-[#F5EFEB] rounded-xl border border-[#E2D9CE] shadow-2xs space-y-2.5">
                <div className="font-bold text-[11px] uppercase tracking-wider text-[#6A4A2D] border-b border-[#E2D9CE] pb-1.5 flex items-center justify-between">
                  <span>{isProjectPayment ? "Project Financial Position" : "Material Financial Position"}</span>
                  <span className="font-mono text-[10px] text-[#7A7064]">Authoritative Balance</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#7A7064]">
                    {isProjectPayment ? "Total Finalized Amount:" : "Material Quotation Amount:"}
                  </span>
                  <span className="font-mono font-bold text-[#1A1612] tabular-nums">
                    {financials ? formatCurrency(financials.contractBudget || financials.revisedProjectValue || payment.amount) : formatCurrency(payment.amount)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#7A7064]">Total Paid Amount:</span>
                  <span className="font-mono font-bold text-emerald-700 tabular-nums">
                    {financials ? formatCurrency(financials.totalVerifiedPaid || payment.amount) : formatCurrency(payment.amount)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-[#E2D9CE] font-bold">
                  <span className="text-[#1A1612]">Remaining Balance:</span>
                  <span className="font-mono text-[#1A1612] tabular-nums">
                    {financials ? formatCurrency(financials.remainingBalance || 0) : "₹0"}
                  </span>
                </div>
              </div>

              {/* PAYMENT NOTES & INTERNAL AUDIT */}
              <div className="p-4 bg-white rounded-xl border border-[#E2D9CE] shadow-2xs space-y-2.5">
                <div className="font-bold text-[11px] uppercase tracking-wider text-[#7A7064] flex items-center justify-between">
                  <span>Payment Notes &amp; Internal Audit</span>
                  <span className="text-[10px] text-[#7A7064] italic">Internal ERP Record</span>
                </div>

                <p className="text-[#1A1612] bg-[#FAF7F2] p-3 rounded-lg border border-[#E2D9CE]/70 leading-relaxed font-sans">
                  {payment.notes || "Payment received successfully from the client."}
                </p>

                {payment.reversedReason && (
                  <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-rose-800 text-[11px]">
                    <span className="font-bold">Reversal Reason:</span> {payment.reversedReason}
                  </div>
                )}

                <div className="text-[10px] text-[#7A7064] pt-1 flex justify-between border-t border-[#E2D9CE]/60">
                  <span>Recorded Date: {formatDate(payment.createdAt)}</span>
                  <span>Status: {payment.status}</span>
                </div>
              </div>
            </>
          ) : activeTab === "pipeline" ? (
            /* 13-STAGE PROJECT PIPELINE VIEW */
            <div className="space-y-4">
              <div className="p-3.5 bg-white rounded-xl border border-[#E2D9CE] text-xs text-[#7A7064]">
                Current Project Pipeline for <span className="font-bold text-[#1A1612]">{payment.project?.title}</span>.
                The highlighted step indicates the active site progress stage.
              </div>

              <div className="space-y-2">
                {PROJECT_PIPELINE_STAGES.map((st) => {
                  const isCompleted = st.order < currentStageIndex;
                  const isCurrent = st.order === currentStageIndex;
                  const isUpcoming = st.order > currentStageIndex;

                  return (
                    <div
                      key={st.key}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isCurrent
                          ? "bg-[#C89B3C]/15 border-[#C89B3C] shadow-xs"
                          : isCompleted
                          ? "bg-emerald-50/70 border-emerald-200"
                          : "bg-white border-[#E2D9CE]/70 opacity-75"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                            isCurrent
                              ? "bg-[#C89B3C] text-white"
                              : isCompleted
                              ? "bg-emerald-600 text-white"
                              : "bg-[#E2D9CE] text-[#7A7064]"
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : st.order}
                        </div>
                        <div>
                          <span
                            className={`font-semibold text-xs block ${
                              isCurrent
                                ? "text-[#1A1612] font-bold"
                                : isCompleted
                                ? "text-emerald-900"
                                : "text-[#7A7064]"
                            }`}
                          >
                            {st.label}
                          </span>
                        </div>
                      </div>

                      <div>
                        {isCurrent && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#C89B3C] text-white">
                            Active Stage
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] font-semibold text-emerald-700">Completed</span>
                        )}
                        {isUpcoming && (
                          <span className="text-[10px] text-[#7A7064]">Upcoming</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* TIMELINE TAB */
            <div className="space-y-4">
              <div className="p-3.5 bg-white rounded-xl border border-[#E2D9CE] text-xs text-[#7A7064]">
                Chronological sequence of payment milestones, recorded receipts, and confirmations for <span className="font-bold text-[#1A1612]">{timelineData?.project?.title}</span>.
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2D9CE]">
                {timelineData?.events?.map((ev: any) => {
                  const isVerified = ev.type === "PAYMENT_VERIFIED" || ev.type === "MILESTONE_SETTLED";
                  const isReversed = ev.type === "PAYMENT_REVERSED";
                  const isScheduled = ev.type === "MILESTONE_SCHEDULED";

                  return (
                    <div key={ev.id} className="relative">
                      <div
                        className={`absolute -left-[27px] top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                          isVerified
                            ? "border-emerald-600 text-emerald-600"
                            : isReversed
                            ? "border-rose-600 text-rose-600"
                            : isScheduled
                            ? "border-[#C89B3C] text-[#C89B3C]"
                            : "border-[#7A7064] text-[#7A7064]"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isVerified
                              ? "bg-emerald-600"
                              : isReversed
                              ? "bg-rose-600"
                              : isScheduled
                              ? "bg-[#C89B3C]"
                              : "bg-[#7A7064]"
                          }`}
                        />
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-[#E2D9CE] shadow-2xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#1A1612]">{ev.title}</span>
                          <span className="text-[10px] text-[#7A7064] font-medium">{formatDate(ev.date)}</span>
                        </div>
                        {ev.description && <p className="text-[11px] text-[#7A7064] leading-relaxed">{ev.description}</p>}
                        {ev.amount && (
                          <div className="font-mono font-bold text-xs text-[#1A1612] tabular-nums pt-1">
                            Amount: {formatCurrency(ev.amount)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        {payment && (
          <div className="p-4 border-t border-[#E2D9CE] bg-[#F5EFEB] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => onOpenReceipt(payment.id)}>
                Print Voucher
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && payment.status === "RECORDED" && (
                <Button size="sm" variant="primary" onClick={() => onVerify(payment.id)}>
                  Confirm Payment
                </Button>
              )}
              {isAdmin && payment.status === "VERIFIED" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-rose-700 border-rose-300 hover:bg-rose-50"
                  onClick={() => onOpenReversal(payment.id)}
                >
                  Reverse Payment
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
