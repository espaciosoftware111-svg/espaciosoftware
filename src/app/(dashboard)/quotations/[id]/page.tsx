"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuotationGeneratorStudio from "@/components/quotations/quotation-generator-studio";

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  return (
    <div className="p-2 sm:p-4 max-w-[1700px] mx-auto space-y-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between px-2">
        <Link href="/quotations">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-700 hover:text-slate-900 font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Quotation Management
          </Button>
        </Link>
      </div>

      {/* Dynamic Quotation Studio */}
      <QuotationGeneratorStudio
        quotationId={quoteId}
        onBack={() => router.push("/quotations")}
        onSaveComplete={() => {
          router.push("/quotations");
        }}
      />
    </div>
  );
}
