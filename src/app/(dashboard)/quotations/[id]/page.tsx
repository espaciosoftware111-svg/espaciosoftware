"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuotationGeneratorStudio from "@/components/quotations/quotation-generator-studio";

function QuotationDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = params.id as string;

  const amountParam = searchParams.get("amount");
  const parsedAmount = amountParam ? parseFloat(amountParam) : undefined;
  const paymentTypeParam = searchParams.get("paymentType") || undefined;
  const paymentRefParam = searchParams.get("ref") || undefined;
  const paymentNotesParam = searchParams.get("notes") || undefined;
  const gstParam = searchParams.get("gst");
  const parsedGst = gstParam !== null ? parseFloat(gstParam) : 0;

  const modeParam = searchParams.get("mode")?.toUpperCase();
  const titleParam = searchParams.get("title");

  const leadIdParam = searchParams.get("leadId") || searchParams.get("returnToLead") || undefined;
  const projectIdParam = searchParams.get("projectId") || searchParams.get("returnToProject") || undefined;
  const clientIdParam = searchParams.get("clientId") || undefined;

  const invoiceIdParam = searchParams.get("invoiceId") || undefined;
  const targetLeadId = leadIdParam;
  const targetProjectId = projectIdParam;

  const initialInvoiceData: any = {};
  if (targetLeadId) {
    initialInvoiceData.leadId = targetLeadId;
  }
  if (targetProjectId) {
    initialInvoiceData.projectId = targetProjectId;
  }
  if (clientIdParam) {
    initialInvoiceData.clientId = clientIdParam;
  }
  if (modeParam === "INVOICE" || modeParam === "TAX INVOICE") {
    initialInvoiceData.mode = "Tax Invoice";
    initialInvoiceData.status = invoiceIdParam ? "Paid" : "Draft";
    initialInvoiceData.customTitle = titleParam || "BOOKING CONFIRMATION TAX INVOICE";
  }
  if (parsedAmount !== undefined && !isNaN(parsedAmount)) {
    initialInvoiceData.currentPayment = parsedAmount;
    initialInvoiceData.advancePaid = parsedAmount;
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
    initialInvoiceData.invoiceNumber = paymentRefParam;
  }
  if (paymentNotesParam) {
    initialInvoiceData.notes = paymentNotesParam;
  }
  const handoverDateParam = searchParams.get("handoverDate") || searchParams.get("targetDeliveryDate");
  if (handoverDateParam) {
    initialInvoiceData.handoverDate = handoverDateParam;
  }
  if (gstParam !== null && !isNaN(parsedGst)) {
    initialInvoiceData.taxRate = parsedGst;
  }

  const rawType = searchParams.get("type")?.toUpperCase();
  const materialLeadIdParam = searchParams.get("materialLeadId");
  const isMaterial = rawType === "MATERIAL" || Boolean(materialLeadIdParam);

  const stepParam = searchParams.get("step") || "7";
  const isReadOnly = searchParams.get("readOnly") === "true" || (Boolean(invoiceIdParam) && searchParams.get("edit") !== "true");

  const backUrl = targetProjectId
    ? `/projects?id=${targetProjectId}&tab=quotations`
    : targetLeadId
    ? (isMaterial ? `/material-leads?id=${targetLeadId}&step=${stepParam}` : `/leads?id=${targetLeadId}&step=${stepParam}`)
    : isMaterial
    ? "/quotations?tab=materials"
    : "/quotations";

  const backLabel = targetProjectId
    ? "Back to Project Workspace"
    : targetLeadId
    ? (isMaterial ? `Back to Material Lead Workspace` : `Back to Lead Workspace (Step ${stepParam})`)
    : "Back to Quotation Management";

  return (
    <div className="p-2 sm:p-4 max-w-[1700px] mx-auto space-y-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between px-2 no-print print:hidden">
        <Link href={backUrl}>
          <Button variant="ghost" size="sm" className="gap-2 text-slate-700 hover:text-slate-900 font-medium">
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Button>
        </Link>
      </div>

      {/* Dynamic Quotation Studio */}
      <QuotationGeneratorStudio
        quotationId={quoteId}
        invoiceId={invoiceIdParam}
        leadId={targetLeadId}
        projectId={targetProjectId}
        initialInvoice={initialInvoiceData}
        readOnly={isReadOnly}
        onBack={() => router.push(backUrl)}
        onSaveComplete={() => {
          if (targetProjectId) {
            router.push(`/projects?id=${targetProjectId}&tab=quotations&attached=true`);
          } else if (targetLeadId) {
            if (isMaterial) {
              router.push(`/material-leads?id=${targetLeadId}&step=${stepParam}&attached=true`);
            } else {
              router.push(`/leads?id=${targetLeadId}&step=${stepParam}&attached=true`);
            }
          } else {
            router.push(isMaterial ? "/quotations?tab=materials" : "/quotations");
          }
        }}
      />
    </div>
  );
}

export default function QuotationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <QuotationDetailContent />
    </Suspense>
  );
}
