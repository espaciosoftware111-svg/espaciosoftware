"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckCircle2,
  FileText,
  User,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  X,
  Calendar,
  CreditCard,
  Building,
  Loader2,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FinalisedQuotation {
  id: string;
  referenceNo: string;
  title: string;
  customTitle?: string;
  quotationType?: "LEAD" | "PROJECT" | "MATERIAL";
  revision: number;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  advancePaid?: number;
  balanceDue?: number;
  validityDate: string | null;
  approvedAt?: string | null;
  createdAt: string;
  client: { id: string; referenceNo: string; fullName: string; phone: string; address?: string } | null;
  lead: { id: string; referenceNo: string; clientName: string; phone: string; stage: string; location?: string } | null;
  project: { id: string; referenceNo: string; title: string; stage: string; siteAddress?: string } | null;
  _count?: { items: number };
}

interface SelectFinalisedQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuotation?: (quotation: FinalisedQuotation) => void;
}

export function SelectFinalisedQuotationModal({
  isOpen,
  onClose,
  onSelectQuotation,
}: SelectFinalisedQuotationModalProps) {
  const router = useRouter();
  const [quotations, setQuotations] = useState<FinalisedQuotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "LEAD" | "MATERIAL">("ALL");

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchApprovedQuotations = async () => {
      setLoading(true);
      try {
        // Fetch approved / finalised quotations
        const res = await fetch("/api/v1/quotations?status=APPROVED&limit=100");
        const json = await res.json();
        if (json?.success && isMounted) {
          const list = json.data?.quotations || [];
          setQuotations(list);
        }
      } catch (err) {
        console.error("Failed to fetch finalised quotations:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchApprovedQuotations();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const qType = q.quotationType || "LEAD";
      if (typeFilter !== "ALL") {
        if (typeFilter === "LEAD" && qType === "MATERIAL") return false;
        if (typeFilter === "MATERIAL" && qType !== "MATERIAL") return false;
      }

      if (!search.trim()) return true;
      const term = search.toLowerCase();
      const clientName = (q.client?.fullName || q.lead?.clientName || "").toLowerCase();
      const phone = (q.client?.phone || q.lead?.phone || "").toLowerCase();
      const ref = (q.referenceNo || "").toLowerCase();
      const title = (q.customTitle || q.title || "").toLowerCase();
      const projTitle = (q.project?.title || "").toLowerCase();

      return (
        ref.includes(term) ||
        clientName.includes(term) ||
        phone.includes(term) ||
        title.includes(term) ||
        projTitle.includes(term)
      );
    });
  }, [quotations, search, typeFilter]);

  if (!isOpen) return null;

  const handleSelect = (q: FinalisedQuotation) => {
    if (onSelectQuotation) {
      onSelectQuotation(q);
    } else {
      router.push(`/quotations/${q.id}?mode=INVOICE`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white uppercase">
                  SELECT FINALISED QUOTATION
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                  Source of Truth
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Choose an approved / finalised Complete Interiors or Materials Quotation to generate a payment invoice.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search quotation #, client name, phone, project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Quotation Type Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-lg w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setTypeFilter("ALL")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  typeFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Finalised ({quotations.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("LEAD")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  typeFilter === "LEAD"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <User className="w-3 h-3" />
                Complete Interiors
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("MATERIAL")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  typeFilter === "MATERIAL"
                    ? "bg-teal-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Package className="w-3 h-3" />
                Materials Quotation
              </button>
            </div>
          </div>
        </div>

        {/* Quotation Selection List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-500">Loading finalised quotations...</p>
            </div>
          ) : filteredQuotations.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Finalised Quotations Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {search || typeFilter !== "ALL"
                  ? "No finalised quotations match your current search criteria. Try a different query."
                  : "Invoices can only be generated from Approved / Finalised Quotations. Please finalise a quotation in the Complete Interiors or Materials section first."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredQuotations.map((q) => {
                const clientName = q.client?.fullName || q.lead?.clientName || "Direct Client";
                const clientPhone = q.client?.phone || q.lead?.phone || "";
                const isMaterial = q.quotationType === "MATERIAL";
                const totalAmount = q.totalAmount || 0;
                const paidAmount = q.advancePaid || 0;
                const remainingBalance = q.balanceDue !== undefined ? q.balanceDue : Math.max(0, totalAmount - paidAmount);
                const approvedDateStr = q.approvedAt
                  ? new Date(q.approvedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                  : new Date(q.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

                return (
                  <div
                    key={q.id}
                    onClick={() => handleSelect(q)}
                    className="group relative bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Quotation Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                          {q.referenceNo}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          v{q.revision}
                        </span>

                        {isMaterial ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                            <Package className="w-3 h-3 text-teal-600" />
                            Materials Quotation
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <User className="w-3 h-3 text-emerald-600" />
                            Complete Interiors
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Finalised
                        </span>
                      </div>

                      <div className="text-xs text-slate-800 font-semibold flex items-center gap-1.5">
                        <span>Client:</span>
                        <span className="text-slate-900 font-bold">{clientName}</span>
                        {clientPhone && <span className="text-slate-400 font-mono text-2xs">({clientPhone})</span>}
                      </div>

                      <div className="text-2xs text-slate-500 flex items-center gap-4 flex-wrap">
                        {q.project ? (
                          <span>Project: <strong className="text-slate-700">{q.project.title}</strong></span>
                        ) : q.lead ? (
                          <span>Lead: <strong className="text-slate-700">{q.lead.referenceNo}</strong> ({q.lead.location || "Location N/A"})</span>
                        ) : (
                          <span className="italic">Direct Quotation</span>
                        )}
                        <span>Finalised: <strong className="text-slate-700">{approvedDateStr}</strong></span>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="flex items-center gap-4 md:border-l md:border-slate-200 md:pl-6 shrink-0">
                      <div className="text-right space-y-0.5">
                        <div className="text-2xs uppercase tracking-wider text-slate-400 font-semibold">Grand Total</div>
                        <div className="text-sm font-bold font-mono text-slate-900">
                          ₹{totalAmount.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[11px] font-mono flex items-center gap-2 justify-end">
                          <span className="text-emerald-700">Paid: ₹{paidAmount.toLocaleString("en-IN")}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-700 font-semibold">Bal: ₹{remainingBalance.toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(q);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 h-9 shadow-sm group-hover:scale-105 transition-transform"
                      >
                        <span>SELECT</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-600" />
            <span>Draft quotations are strictly excluded. Only approved quotations can generate invoices.</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-8">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
