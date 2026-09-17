"use client";

import React, { useState, useEffect } from "react";
import { Search, Eye, Filter, Plus, PackageCheck, AlertCircle, ShoppingCart } from "lucide-react";
import { MaterialsOrderDetailDrawer, MaterialsOrderDetail } from "@/components/procurement/materials-order-detail-drawer";
import { CreateMaterialsOrderModal } from "@/components/procurement/create-materials-order-modal";
import { ExportButton } from "@/components/reports/export-button";

interface MaterialsOrderKPI {
  totalMaterialOrders: number;
  totalOrderValue: number;
  materialsReceived: number;
  materialsPending: number;
  totalRemainingPayable: number;
}

export default function MaterialsOrderPage() {
  const [orders, setOrders] = useState<MaterialsOrderDetail[]>([]);
  const [kpi, setKpi] = useState<MaterialsOrderKPI>({
    totalMaterialOrders: 0,
    totalOrderValue: 0,
    materialsReceived: 0,
    materialsPending: 0,
    totalRemainingPayable: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [materialStatusFilter, setMaterialStatusFilter] = useState("ALL");
  const [customMaterialStatus, setCustomMaterialStatus] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [customPaymentStatus, setCustomPaymentStatus] = useState("");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState("ALL");
  const [customVendorInput, setCustomVendorInput] = useState("");

  // Drawer & Modal state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [searchQuery, materialStatusFilter, customMaterialStatus, paymentStatusFilter, customPaymentStatus, selectedVendorFilter, customVendorInput]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      // Filter: Material Status (with OTHERS -> manual input)
      if (materialStatusFilter === "OTHERS" && customMaterialStatus.trim()) {
        params.append("materialStatus", customMaterialStatus.trim());
      } else if (materialStatusFilter !== "ALL" && materialStatusFilter !== "OTHERS") {
        params.append("materialStatus", materialStatusFilter);
      }

      // Filter: Payment Status (with OTHERS -> manual input)
      if (paymentStatusFilter === "OTHERS" && customPaymentStatus.trim()) {
        params.append("paymentStatus", customPaymentStatus.trim());
      } else if (paymentStatusFilter !== "ALL" && paymentStatusFilter !== "OTHERS") {
        params.append("paymentStatus", paymentStatusFilter);
      }

      // Filter: Vendor (with OTHERS -> manual input)
      if (selectedVendorFilter === "OTHERS" && customVendorInput.trim()) {
        params.append("vendorId", customVendorInput.trim());
      } else if (selectedVendorFilter !== "ALL" && selectedVendorFilter !== "OTHERS") {
        params.append("vendorId", selectedVendorFilter);
      }

      const res = await fetch(`/api/v1/procurement/materials-order?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to load materials orders");
      }
      const data = await res.json();
      setOrders(data.data || []);
      const kpiData = data.meta?.kpi || data.meta?.pagination?.kpi || data.pagination?.kpi || data.kpi;
      if (kpiData) {
        setKpi({
          totalMaterialOrders: Number(kpiData.totalMaterialOrders || 0),
          totalOrderValue: Number(kpiData.totalOrderValue || 0),
          materialsReceived: Number(kpiData.materialsReceived || 0),
          materialsPending: Number(kpiData.materialsPending || 0),
          totalRemainingPayable: Number(kpiData.totalRemainingPayable || 0),
        });
      }
    } catch (err: any) {
      setError(err.message || "Error loading materials orders");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsDrawerOpen(true);
  };

  const formatCurrency = (val: number) =>
    `₹${(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-cream/30 p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-walnut/15 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-walnut">
            <span>Procurement Subsystem</span>
            <span>•</span>
            <span className="text-charcoal font-bold">Materials Required Lead Fulfillment</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">
            MATERIALS ORDER
          </h1>
          <p className="text-xs text-walnut mt-0.5">
            Confirmed material orders for Materials Required Leads / Material-only customers. (Separate from Project Materials).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExportButton
            reportKey="materials_order_summary"
            label="Export Materials Orders"
            size="sm"
          />
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-xs font-bold text-charcoal shadow-gold hover:bg-gold-hover transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + New Materials Order
          </button>
        </div>
      </div>

      {/* 5 Dynamic KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* KPI 1 — Total Material Orders */}
        <div className="bg-white rounded-xl border border-walnut/15 p-4 shadow-xs">
          <div className="text-[10px] font-bold text-walnut uppercase tracking-wider">
            Total Material Orders
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-charcoal">
            {kpi.totalMaterialOrders}
          </div>
          <div className="text-[10px] text-walnut mt-0.5">Confirmed Lead Orders</div>
        </div>

        {/* KPI 2 — Total Order Value */}
        <div className="bg-white rounded-xl border border-walnut/15 p-4 shadow-xs">
          <div className="text-[10px] font-bold text-walnut uppercase tracking-wider">
            Total Order Value
          </div>
          <div className="mt-1 text-lg font-bold font-mono text-charcoal truncate">
            {formatCurrency(kpi.totalOrderValue)}
          </div>
          <div className="text-[10px] text-walnut mt-0.5">Sum of agreed amounts</div>
        </div>

        {/* KPI 3 — Materials Received */}
        <div className="bg-white rounded-xl border border-walnut/15 p-4 shadow-xs">
          <div className="text-[10px] font-bold text-walnut uppercase tracking-wider">
            Materials Received
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-700">
            {kpi.materialsReceived}
          </div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">Delivered orders</div>
        </div>

        {/* KPI 4 — Materials Pending */}
        <div className="bg-white rounded-xl border border-walnut/15 p-4 shadow-xs">
          <div className="text-[10px] font-bold text-walnut uppercase tracking-wider">
            Materials Pending
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-amber-700">
            {kpi.materialsPending}
          </div>
          <div className="text-[10px] text-amber-700/80 mt-0.5">Awaiting delivery</div>
        </div>

        {/* KPI 5 — Total Remaining Payable */}
        <div className="bg-white rounded-xl border border-walnut/15 p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold text-walnut uppercase tracking-wider">
            Total Remaining Payable
          </div>
          <div className="mt-1 text-lg font-bold font-mono text-charcoal truncate">
            {formatCurrency(kpi.totalRemainingPayable)}
          </div>
          <div className="text-[10px] text-walnut mt-0.5">Order Value − Total Paid</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-walnut/15 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Fast Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-walnut" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, Lead ID, Customer Name, Vendor Name, Material Name..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 text-xs text-charcoal placeholder:text-walnut/60 focus:outline-none focus:border-gold"
            />
          </div>

          {/* Filter: Material Status */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={materialStatusFilter}
              onChange={(e) => setMaterialStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 text-xs text-charcoal focus:outline-none focus:border-gold"
            >
              <option value="ALL">All Material Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Received">Received</option>
              <option value="OTHERS">OTHERS (Custom Input)</option>
            </select>

            {materialStatusFilter === "OTHERS" && (
              <input
                type="text"
                value={customMaterialStatus}
                onChange={(e) => setCustomMaterialStatus(e.target.value)}
                placeholder="Type custom status..."
                className="px-3 py-2 rounded-lg border border-gold bg-white text-xs text-charcoal focus:outline-none"
              />
            )}
          </div>

          {/* Filter: Payment Status */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 text-xs text-charcoal focus:outline-none focus:border-gold"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
              <option value="OTHERS">OTHERS (Custom Input)</option>
            </select>

            {paymentStatusFilter === "OTHERS" && (
              <input
                type="text"
                value={customPaymentStatus}
                onChange={(e) => setCustomPaymentStatus(e.target.value)}
                placeholder="Type payment status..."
                className="px-3 py-2 rounded-lg border border-gold bg-white text-xs text-charcoal focus:outline-none"
              />
            )}
          </div>

          {/* Filter: Vendor */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedVendorFilter}
              onChange={(e) => setSelectedVendorFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-walnut/20 bg-cream/20 text-xs text-charcoal focus:outline-none focus:border-gold"
            >
              <option value="ALL">All Vendors</option>
              <option value="OTHERS">OTHERS (Type Vendor ID)</option>
            </select>

            {selectedVendorFilter === "OTHERS" && (
              <input
                type="text"
                value={customVendorInput}
                onChange={(e) => setCustomVendorInput(e.target.value)}
                placeholder="Type vendor ID or name..."
                className="px-3 py-2 rounded-lg border border-gold bg-white text-xs text-charcoal focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Confirmed Orders List Table */}
      <div className="bg-white rounded-xl border border-walnut/15 shadow-xs overflow-hidden">
        {loading && (
          <div className="p-12 text-center text-xs text-walnut">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading confirmed materials orders...
          </div>
        )}

        {error && (
          <div className="p-6 bg-rose-50 text-xs text-rose-800 text-center">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="p-12 text-center space-y-3">
            <ShoppingCart className="w-10 h-10 text-walnut/40 mx-auto" />
            <h3 className="text-sm font-bold text-charcoal">No Confirmed Materials Orders Found</h3>
            <p className="text-xs text-walnut max-w-md mx-auto">
              Only confirmed vendor material orders for Materials Required Leads appear in this section.
              Pending requests and rejected vendor quotes are strictly excluded.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-xs font-bold text-charcoal shadow-gold hover:bg-gold-hover cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Place First Materials Order
            </button>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-walnut/15 bg-cream/60 text-[11px] text-walnut uppercase font-semibold">
                  <th className="py-3 px-4">Material Order ID</th>
                  <th className="py-3 px-4">Lead ID</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Vendor Name</th>
                  <th className="py-3 px-4">Materials</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4 text-right">Final Vendor Amount</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-center">Material Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-walnut/10 font-mono">
                {orders.map((ord) => (
                  <tr
                    key={ord.id}
                    className="hover:bg-cream/20 transition cursor-pointer"
                    onClick={() => handleOpenOrder(ord.id)}
                  >
                    <td className="py-3 px-4 font-bold text-charcoal">
                      {ord.referenceNo}
                    </td>
                    <td className="py-3 px-4 text-walnut font-medium">
                      {ord.customer?.leadRef || "—"}
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-charcoal">
                      {ord.customer?.customerName || "—"}
                    </td>
                    <td className="py-3 px-4 font-sans text-charcoal">
                      {ord.vendor?.name || "—"}
                    </td>
                    <td className="py-3 px-4 font-sans text-walnut text-[11px] truncate max-w-xs">
                      {ord.items.map((i) => `${i.quantity} ${i.unitKey} ${i.materialName}`).join(", ") || "—"}
                    </td>
                    <td className="py-3 px-4 text-walnut text-[11px]">
                      {formatDate(ord.poDate)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-charcoal">
                      {formatCurrency(ord.finalVendorOrderAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.paymentStatus === "Paid"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : ord.paymentStatus === "Partial"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.materialStatus === "Received"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {ord.materialStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenOrder(ord.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-walnut/10 text-walnut hover:text-charcoal transition cursor-pointer"
                        title="View Materials Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedOrderId && (
        <MaterialsOrderDetailDrawer
          orderId={selectedOrderId}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedOrderId(null);
          }}
          onOrderUpdated={fetchOrders}
        />
      )}

      {/* Creation Modal */}
      {isCreateModalOpen && (
        <CreateMaterialsOrderModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onOrderCreated={fetchOrders}
        />
      )}
    </div>
  );
}
