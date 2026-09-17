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
  const leadId = searchParams.get("leadId") || undefined;
  const projectId = searchParams.get("projectId") || undefined;
  const clientId = searchParams.get("clientId") || undefined;

  const initialQuotationType: QuotationType =
    rawType === "PROJECT" ? "PROJECT" : rawType === "MATERIAL" ? "MATERIAL" : "LEAD";

  const backHref = leadId
    ? `/leads?id=${leadId}`
    : projectId
    ? `/projects?id=${projectId}`
    : clientId
    ? `/clients?id=${clientId}`
    : `/quotations`;

  const backLabel = leadId
    ? "Back to Lead Workspace"
    : projectId
    ? "Back to Project Workspace"
    : clientId
    ? "Back to Client 360"
    : "Back to Quotation Management";

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

      {/* Dynamic Quotation Studio */}
      <QuotationGeneratorStudio
        leadId={leadId}
        initialQuotationType={initialQuotationType}
        initialInvoice={{
          ...(projectId ? { projectId } : {}),
          ...(leadId ? { leadId } : {}),
          ...(clientId ? { clientId } : {}),
        }}
        onBack={() => router.push(backHref)}
        onSaveComplete={() => {
          router.push(backHref);
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
