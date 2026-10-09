"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Boxes,
  Warehouse,
  ArrowRightLeft,
  AlertTriangle,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";
import { CreateMaterialModal } from "@/components/inventory/create-material-modal";
import { CreateWarehouseModal } from "@/components/inventory/create-warehouse-modal";
import { IssueMaterialModal } from "@/components/inventory/issue-material-modal";
import { AdjustStockModal } from "@/components/inventory/adjust-stock-modal";

export default function InventoryOverviewPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/inventory/dashboard");
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch inventory dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E8E2D8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-[#F3EEE5] text-[#89652D] font-bold text-[10px] uppercase tracking-wider border border-[#E8E2D8]">
              INVENTORY SUBSYSTEM
            </span>
            <h1 className="text-xl font-bold text-[#262421] tracking-tight">Material &amp; Stock Operations Hub</h1>
          </div>
          <p className="text-xs text-[#77716A] mt-0.5">
            Authoritative material master, physical stock ledgers, warehouses, and project site material dispatch
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchMetrics()}
            className="p-2 rounded-xl border border-[#E8E2D8] bg-[#FFFEFC] hover:bg-[#F3EEE5] text-[#77716A] hover:text-[#262421] transition-colors shadow-2xs cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#262421] bg-[#FFFEFC] hover:bg-[#F3EEE5] border border-[#E8E2D8] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#89652D]" />
            <span>Issue Stock to Site</span>
          </button>

          <button
            onClick={() => setIsMaterialModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#FAF8F5] bg-[#242321] hover:bg-[#383633] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Material</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-1.5 hover:border-[#B99558]/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">Total Materials</span>
            <div className="w-7 h-7 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#536B4E]">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#262421] tabular-nums">
              {loading ? "..." : metrics?.totalMaterials ?? 0}
            </span>
            <span className="text-[11px] text-[#77716A] font-medium">Distinct SKUs</span>
          </div>
          <p className="text-[11px] text-[#77716A] border-t border-[#E8E2D8]/60 pt-2 mt-1">Active Material Master items</p>
        </div>

        <div className="bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-1.5 hover:border-[#B99558]/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">Stock Asset Valuation</span>
            <div className="w-7 h-7 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#89652D]">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#262421] tabular-nums">
              ₹{loading ? "..." : (metrics?.totalPhysicalStockValue ?? 0).toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-[#77716A] font-medium">Standard Valuation</span>
          </div>
          <p className="text-[11px] text-[#77716A] border-t border-[#E8E2D8]/60 pt-2 mt-1">Physical inventory asset value</p>
        </div>

        <div className="bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-1.5 hover:border-[#B99558]/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">Low / Out of Stock</span>
            <div className="w-7 h-7 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#A45435]">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#A45435] tabular-nums">
              {loading ? "..." : (metrics?.lowStockItemsCount ?? 0) + (metrics?.outOfStockItemsCount ?? 0)}
            </span>
            <span className="text-xs font-bold text-[#A45435] bg-[#A45435]/10 px-2 py-0.5 rounded-md border border-[#A45435]/20">
              {metrics?.outOfStockItemsCount ?? 0} Out of Stock
            </span>
          </div>
          <p className="text-[11px] text-[#77716A] border-t border-[#E8E2D8]/60 pt-2 mt-1">Items below reorder threshold</p>
        </div>

        <div className="bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-1.5 hover:border-[#B99558]/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77716A]">Active Warehouses</span>
            <div className="w-7 h-7 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#262421]">
              <Warehouse className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#262421] tabular-nums">
              {loading ? "..." : metrics?.totalWarehouses ?? 0}
            </span>
            <span className="text-[11px] text-[#77716A] font-medium">Godowns &amp; Sites</span>
          </div>
          <p className="text-[11px] text-[#77716A] border-t border-[#E8E2D8]/60 pt-2 mt-1">Physical storage facilities</p>
        </div>
      </div>

      {/* Quick Navigation Hub */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Link
          href="/inventory/materials"
          className="p-3.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl hover:border-[#B99558] hover:shadow-2xs transition-all group flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8] flex items-center justify-center font-bold group-hover:bg-[#242321] group-hover:text-[#FAF8F5] transition-colors">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[#262421] text-xs sm:text-sm group-hover:text-[#89652D] transition-colors">Material Master</h3>
            <p className="text-[10px] text-[#77716A]">Browse &amp; edit items</p>
          </div>
        </Link>

        <Link
          href="/inventory/warehouses"
          className="p-3.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl hover:border-[#B99558] hover:shadow-2xs transition-all group flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8] flex items-center justify-center font-bold group-hover:bg-[#242321] group-hover:text-[#FAF8F5] transition-colors">
            <Warehouse className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[#262421] text-xs sm:text-sm group-hover:text-[#89652D] transition-colors">Warehouses</h3>
            <p className="text-[10px] text-[#77716A]">Central &amp; site stores</p>
          </div>
        </Link>

        <Link
          href="/inventory/movements"
          className="p-3.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl hover:border-[#B99558] hover:shadow-2xs transition-all group flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8] flex items-center justify-center font-bold group-hover:bg-[#242321] group-hover:text-[#FAF8F5] transition-colors">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[#262421] text-xs sm:text-sm group-hover:text-[#89652D] transition-colors">Stock Ledger</h3>
            <p className="text-[10px] text-[#77716A]">Movement audit trail</p>
          </div>
        </Link>

        <Link
          href="/inventory/transfers"
          className="p-3.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl hover:border-[#B99558] hover:shadow-2xs transition-all group flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8] flex items-center justify-center font-bold group-hover:bg-[#242321] group-hover:text-[#FAF8F5] transition-colors">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[#262421] text-xs sm:text-sm group-hover:text-[#89652D] transition-colors">Stock Transfers</h3>
            <p className="text-[10px] text-[#77716A]">Warehouse transfers</p>
          </div>
        </Link>

        <button
          onClick={() => setIsAdjustModalOpen(true)}
          className="p-3.5 bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl hover:border-[#B99558] hover:shadow-2xs transition-all group flex items-center gap-3 text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8] flex items-center justify-center font-bold group-hover:bg-[#242321] group-hover:text-[#FAF8F5] transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[#262421] text-xs sm:text-sm group-hover:text-[#89652D] transition-colors">Stock Adjust</h3>
            <p className="text-[10px] text-[#77716A]">Audit corrections</p>
          </div>
        </button>
      </div>

      {/* Recent Movements Table */}
      <div className="bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E2D8] flex items-center justify-between bg-[#F8F6F1]">
          <div>
            <h2 className="font-bold text-[#262421] text-sm">Recent Stock Movements</h2>
            <p className="text-[#77716A] text-[11px]">Real-time transactional audit trail across all warehouses</p>
          </div>
          <Link
            href="/inventory/movements"
            className="text-xs font-bold text-[#89652D] hover:text-[#262421] flex items-center gap-1"
          >
            <span>View Full Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F6F1] text-[#77716A] text-[10px] font-bold uppercase tracking-wider border-b border-[#E8E2D8]">
                <th className="px-4 py-3">Movement No</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Balance After</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#77716A]">
                    Loading recent movements...
                  </td>
                </tr>
              ) : !metrics?.recentMovements || metrics.recentMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#77716A]">
                    No movements recorded yet
                  </td>
                </tr>
              ) : (
                metrics.recentMovements.map((m: any) => {
                  const isPositive = ["OPENING", "RECEIPT", "RETURN_IN", "TRANSFER_IN", "ADJUSTMENT_IN"].includes(
                    m.movementType
                  );

                  return (
                    <tr key={m.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#262421]">{m.movementNo}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                            isPositive
                              ? "bg-[#536B4E]/10 text-[#536B4E] border-[#536B4E]/20"
                              : "bg-[#89652D]/10 text-[#89652D] border-[#89652D]/20"
                          }`}
                        >
                          {m.movementType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#262421]">{m.material?.name}</td>
                      <td className="px-4 py-3 text-[#77716A]">{m.warehouse?.name}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">
                        <span className={isPositive ? "text-[#536B4E]" : "text-[#89652D]"}>
                          {isPositive ? "+" : "-"}
                          {m.quantity} {m.unitKey}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#262421] tabular-nums font-mono">
                        {m.runningBalance} {m.unitKey}
                      </td>
                      <td className="px-4 py-3 text-[#77716A] text-[11px]">
                        {new Date(m.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateMaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        onSuccess={() => fetchMetrics()}
      />
      <CreateWarehouseModal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        onSuccess={() => fetchMetrics()}
      />
      <IssueMaterialModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={() => fetchMetrics()}
      />
      <AdjustStockModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onSuccess={() => fetchMetrics()}
      />
    </div>
  );
}
