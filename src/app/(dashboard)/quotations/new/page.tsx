"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuotationGeneratorStudio from "@/components/quotations/quotation-generator-studio";
import { QuotationType } from "@/components/quotations/types";

function NewQuotationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type")?.toUpperCase();
  const rawMode = searchParams.get("mode")?.toUpperCase();
  const leadId = searchParams.get("leadId") || undefined;
  const projectId = searchParams.get("projectId") || undefined;
  const clientId = searchParams.get("clientId") || undefined;
  const amountParam = searchParams.get("amount");
  const parsedAmount = amountParam ? parseFloat(amountParam) : undefined;
  const paymentTypeParam = searchParams.get("paymentType") || undefined;
  const paymentRefParam = searchParams.get("ref") || undefined;
  const paymentNotesParam = searchParams.get("notes") || undefined;
  const customTitleParam = searchParams.get("title") || undefined;

  const isInvoiceMode = rawMode === "INVOICE" || rawMode === "TAX INVOICE";

  const initialQuotationType: QuotationType =
    rawType === "MATERIAL" ? "MATERIAL" : "LEAD";

  const stepParam = searchParams.get("step") || "7";

  const isMaterial = initialQuotationType === "MATERIAL" || rawType === "MATERIAL" || Boolean(searchParams.get("materialLeadId"));

  const backHref = leadId
    ? (isMaterial ? `/material-leads?id=${leadId}&step=${stepParam}` : `/leads?id=${leadId}&step=${stepParam}`)
    : projectId
    ? `/projects?id=${projectId}`
    : clientId
    ? `/clients?id=${clientId}`
    : isMaterial
    ? `/quotations?tab=materials`
    : `/quotations`;

  const backLabel = leadId
    ? (isMaterial ? `Back to Material Lead Workspace` : `Back to Lead Workspace (Step ${stepParam})`)
    : projectId
    ? "Back to Project Workspace"
    : clientId
    ? "Back to Client 360"
    : "Back to Quotation Management";

  const initialInvoiceData: any = {
    ...(projectId ? { projectId } : {}),
    ...(leadId ? { leadId } : {}),
    ...(clientId ? { clientId } : {}),
  };

  if (isInvoiceMode) {
    initialInvoiceData.mode = "Tax Invoice";
    initialInvoiceData.status = searchParams.get("invoiceId") ? "Paid" : "Draft";
    initialInvoiceData.customTitle = customTitleParam || (isMaterial ? "BOOKING CONFIRMATION TAX INVOICE" : "BOOKING CONFIRMATION TAX INVOICE");
    if (parsedAmount !== undefined && !isNaN(parsedAmount)) {
      initialInvoiceData.currentPayment = parsedAmount;
      initialInvoiceData.advancePaid = parsedAmount;
      if (!leadId) {
        initialInvoiceData.items = [
          {
            id: "conf-fee-1",
            description: isMaterial
              ? "Booking & Order Confirmation Advance\nMaterial procurement and order allocation token"
              : "Booking & Design Confirmation Fee / Advance Payment\nClient token advance received for project initiation, 3D designs, and site planning",
            hsn: isMaterial ? "4412" : "998391",
            quantity: 1,
            unit: isMaterial ? "Lot" : "Job",
            rate: parsedAmount,
            discount: 0,
            gst: 0,
            amount: parsedAmount,
          },
        ];
      }
      initialInvoiceData.paymentMilestones = [
        {
          id: "ms-conf-1",
          name: isMaterial ? "Booking & Material Order Confirmation" : "Booking & Design Confirmation",
          percentage: 100,
          stage: "Phase 1",
          stageRef: "Phase 1",
        },
      ];
    }
    const prevPaymentsParam = searchParams.get("previousPayments") || searchParams.get("prevPayments");
    const parsedPrevPayments = prevPaymentsParam ? parseFloat(prevPaymentsParam) : undefined;
    if (parsedPrevPayments !== undefined && !isNaN(parsedPrevPayments)) {
      initialInvoiceData.previousPayments = parsedPrevPayments;
    }
    if (paymentTypeParam) {
      initialInvoiceData.paymentType = paymentTypeParam;
    }
    if (paymentRefParam) {
      initialInvoiceData.advanceReceiptRef = paymentRefParam;
    }
    if (paymentNotesParam) {
      initialInvoiceData.notes = paymentNotesParam;
    }
    const handoverDateParam = searchParams.get("handoverDate") || searchParams.get("targetDeliveryDate");
    if (handoverDateParam) {
      initialInvoiceData.handoverDate = handoverDateParam;
    }
    initialInvoiceData.enableRoundOff = true;
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1700px] mx-auto space-y-4">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Button>
        </Link>
      </div>

      {/* Dynamic Quotation / Invoice Studio */}
      <QuotationGeneratorStudio
        leadId={leadId}
        projectId={projectId}
        initialQuotationType={initialQuotationType}
        initialInvoice={initialInvoiceData}
        onBack={() => router.push(backHref)}
        onSaveComplete={() => {
          if (leadId) {
            if (isMaterial) {
              router.push(`/material-leads?id=${leadId}&step=${stepParam}&attached=true`);
            } else {
              router.push(`/leads?id=${leadId}&step=${stepParam}&attached=true`);
            }
          } else {
            router.push(backHref);
          }
        }}
      />
    </div>
  );
}

export default function NewQuotationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm">Initializing Quotation Studio...</p>
        </div>
      }
    >
      <NewQuotationContent />
    </Suspense>
  );
}
