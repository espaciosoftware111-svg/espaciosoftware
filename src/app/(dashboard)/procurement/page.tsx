"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CreateMaterialRequestModal } from "@/components/procurement/create-material-request-modal";
import { CreatePurchaseOrderModal } from "@/components/procurement/create-purchase-order-modal";

interface SummaryData {
  openMaterialRequests: number;
  pendingMRApprovals: number;
  openPurchaseOrders: number;
  ordersAwaitingDelivery: number;
  overdueDeliveries: number;
  committedSpend: number;
}

export default function ProcurementHubPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const [isMRModalOpen, setIsMRModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  async function fetchSummary() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/procurement/dashboard");
      if (res.ok) {
        const data = await res.json();
        setSummary(data.data);
      }
    } catch (e) {
      console.error("Failed to load procurement summary", e);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(val: number) {
    return `₹${(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E8E2D8]">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-[#89652D]">
            <span>Procurement Subsystem</span>
            <span>•</span>
            <span className="text-[#536B4E]">Material Requests &amp; Purchase Orders</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#262421] mt-0.5">
            Procurement Operations Hub
          </h1>
          <p className="text-xs text-[#77716A] mt-0.5">
            Controlled bridge connecting project material requirements, supplier purchase orders, and goods receiving.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsMRModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#262421] bg-[#FFFEFC] hover:bg-[#F3EEE5] border border-[#E8E2D8] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            + New Material Request
          </button>
          <button
            onClick={() => setIsPOModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#FAF8F5] bg-[#242321] hover:bg-[#383633] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            + Issue Purchase Order
          </button>
        </div>
      </div>

      {/* Summary Operational Metric Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-[#E8E2D8] bg-[#FFFEFC] p-4 shadow-2xs hover:border-[#B99558]/60 transition-all flex flex-col justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">
            Open Material Requests
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#262421] tabular-nums">
              {summary?.openMaterialRequests || 0}
            </span>
            <span className="text-xs font-bold text-[#89652D] bg-[#F8EBD5] px-2 py-0.5 rounded-md border border-[#DFD4C3]">
              {summary?.pendingMRApprovals || 0} Pending Approval
            </span>
          </div>
          <div className="mt-3 border-t border-[#E8E2D8]/60 pt-2 flex justify-between items-center text-xs">
            <span className="text-[#77716A]">Site requisitions in workflow</span>
            <Link href="/procurement/material-requests" className="font-bold text-[#89652D] hover:text-[#262421] hover:underline">
              View Requisitions →
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-[#E8E2D8] bg-[#FFFEFC] p-4 shadow-2xs hover:border-[#B99558]/60 transition-all flex flex-col justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">
            Confirmed Project Materials
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#262421] tabular-nums">
              {summary?.openPurchaseOrders || 0}
            </span>
            <span className="text-xs font-bold text-[#262421] bg-[#F3EEE5] px-2 py-0.5 rounded-md border border-[#E8E2D8]">
              {summary?.ordersAwaitingDelivery || 0} Awaiting Delivery
            </span>
          </div>
          <div className="mt-3 border-t border-[#E8E2D8]/60 pt-2 flex justify-between items-center text-xs">
            <span className="text-[#77716A]">Confirmed project orders</span>
            <Link href="/procurement/project-materials" className="font-bold text-[#89652D] hover:text-[#262421] hover:underline">
              View Project Materials →
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-[#E8E2D8] bg-[#FFFEFC] p-4 shadow-2xs hover:border-[#B99558]/60 transition-all flex flex-col justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">
            Committed Procurement Spend
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#536B4E] tabular-nums">
            {formatCurrency(summary?.committedSpend || 0)}
          </div>
          <div className="mt-3 border-t border-[#E8E2D8]/60 pt-2 flex justify-between items-center text-xs">
            <span className="text-[#77716A]">Total approved PO commitments</span>
            <Link href="/procurement/receipts" className="font-bold text-[#89652D] hover:text-[#262421] hover:underline">
              View Goods Receipts →
            </Link>
          </div>
        </div>
      </div>

      {/* Module Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
        <Link
          href="/procurement/material-requests"
          className="rounded-xl border border-[#E8E2D8] bg-[#FFFEFC] p-4 shadow-2xs hover:border-[#B99558] hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#262421] group-hover:text-[#89652D] transition-colors">
              1. Material Requests (MR)
            </h3>
            <span className="text-[#77716A] font-bold group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
          <p className="text-xs text-[#77716A] leading-relaxed">
            Requisitions created by Site Engineers and Project Managers. Track material requirements, approvals, and ordering status (`MR-YYYY-XXXX`).
          </p>
        </Link>

        <Link
          href="/procurement/project-materials"
          className="rounded-xl border border-[#E8E2D8] bg-[#FFFEFC] p-4 shadow-2xs hover:border-[#B99558] hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#262421] group-hover:text-[#89652D] transition-colors">
              2. Project Materials
            </h3>
            <span className="text-[#77716A] font-bold group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
          <p className="text-xs text-[#77716A] leading-relaxed">
            Confirmed project material orders, agreed manual order amounts, site receiving verification, and automated pipeline progression.
          </p>
        </Link>

        <Link
          href="/procurement/materials-order"
          className="rounded-xl border border-[#E8E2D8] bg-[#FFFEFC] p-4 shadow-2xs hover:border-[#B99558] hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#262421] group-hover:text-[#89652D] transition-colors">
              3. Materials Order
            </h3>
            <span className="text-[#77716A] font-bold group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
          <p className="text-xs text-[#77716A] leading-relaxed">
            Confirmed material orders for Materials Required Leads / Material-only customers. Super Admin agreed amounts and receiving (no Project Pipeline).
          </p>
        </Link>

        <Link
          href="/procurement/receipts"
          className="rounded-xl border border-[#E8E2D8] bg-[#FFFEFC] p-4 shadow-2xs hover:border-[#B99558] hover:shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#262421] group-hover:text-[#89652D] transition-colors">
              4. Goods Receipts (GRN)
            </h3>
            <span className="text-[#77716A] font-bold group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
          <p className="text-xs text-[#77716A] leading-relaxed">
            Material delivery notes and site inspections. Record accepted, rejected, damaged, and short quantities against PO line items (`GRN-YYYY-XXXX`).
          </p>
        </Link>
      </div>

      {/* Modals */}
      <CreateMaterialRequestModal
        isOpen={isMRModalOpen}
        onClose={() => setIsMRModalOpen(false)}
        onSuccess={fetchSummary}
      />
      <CreatePurchaseOrderModal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        onSuccess={fetchSummary}
      />
    </div>
  );
}
