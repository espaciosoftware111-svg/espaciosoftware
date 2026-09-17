"use client";

import React, { useState, useEffect } from "react";
import { ProjectMaterialDetailDrawer } from "@/components/procurement/project-material-detail-drawer";
import { ExportButton } from "@/components/reports/export-button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SummaryKPIs {
  totalMaterialOrders: number;
  totalMaterialValue: number;
  materialsReceived: number;
  materialsPending: number;
  totalRemainingPayable: number;
  totalPaid: number;
}

export default function ProjectMaterialsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Summary KPIs (Rule 25)
  const [summary, setSummary] = useState<SummaryKPIs>({
    totalMaterialOrders: 0,
    totalMaterialValue: 0,
    materialsReceived: 0,
    materialsPending: 0,
    totalRemainingPayable: 0,
    totalPaid: 0,
  });

  // Search
  const [search, setSearch] = useState("");

  // Filters (Rule 28: with OTHERS -> Manual Input support)
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("");
  const [customProjectInput, setCustomProjectInput] = useState("");

  const [selectedVendorFilter, setSelectedVendorFilter] = useState("");
  const [customVendorInput, setCustomVendorInput] = useState("");

  const [selectedOrderTypeFilter, setSelectedOrderTypeFilter] = useState("");
  const [customOrderTypeInput, setCustomOrderTypeInput] = useState("");

  const [materialStatusFilter, setMaterialStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");

  // Lookup options loaded dynamically from active orders
  const [projectsList, setProjectsList] = useState<Array<{ id: string; title: string; referenceNo: string }>>([]);
  const [vendorsList, setVendorsList] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchOrders();
  }, [
    selectedProjectFilter,
    customProjectInput,
    selectedVendorFilter,
    customVendorInput,
    selectedOrderTypeFilter,
    customOrderTypeInput,
    materialStatusFilter,
    paymentStatusFilter,
  ]);

  async function fetchOrders() {
    setLoading(true);
    try {
      let url = `/api/v1/procurement/project-materials?search=${encodeURIComponent(search)}`;

      // Project filter resolution (Rule 28)
      if (selectedProjectFilter === "OTHERS") {
        if (customProjectInput.trim()) url += `&search=${encodeURIComponent(customProjectInput.trim())}`;
      } else if (selectedProjectFilter) {
        url += `&projectId=${selectedProjectFilter}`;
      }

      // Vendor filter resolution (Rule 28)
      if (selectedVendorFilter === "OTHERS") {
        if (customVendorInput.trim()) url += `&search=${encodeURIComponent(customVendorInput.trim())}`;
      } else if (selectedVendorFilter) {
        url += `&vendorId=${selectedVendorFilter}`;
      }

      // Order Type resolution (Rule 28)
      if (selectedOrderTypeFilter === "OTHERS") {
        if (customOrderTypeInput.trim()) url += `&orderType=${encodeURIComponent(customOrderTypeInput.trim())}`;
      } else if (selectedOrderTypeFilter) {
        url += `&orderType=${encodeURIComponent(selectedOrderTypeFilter)}`;
      }

      if (materialStatusFilter) url += `&materialStatus=${materialStatusFilter}`;
      if (paymentStatusFilter) url += `&paymentStatus=${paymentStatusFilter}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const dataList = json.data || [];
        setOrders(dataList);
        if (json.meta?.summary) {
          setSummary(json.meta.summary);
        }

        // Build distinct filter dropdown options
        const pMap = new Map();
        const vMap = new Map();
        dataList.forEach((o: any) => {
          if (o.project && !pMap.has(o.project.id)) {
            pMap.set(o.project.id, { id: o.project.id, title: o.project.title, referenceNo: o.project.referenceNo });
          }
          if (o.vendor && !vMap.has(o.vendor.id)) {
            vMap.set(o.vendor.id, { id: o.vendor.id, name: o.vendor.name });
          }
        });
        if (projectsList.length === 0) setProjectsList(Array.from(pMap.values()));
        if (vendorsList.length === 0) setVendorsList(Array.from(vMap.values()));
      }
    } catch (e) {
      console.error("Failed to load project materials", e);
    } finally {
      setLoading(false);
    }
  }

  function handleResetFilters() {
    setSearch("");
    setSelectedProjectFilter("");
    setCustomProjectInput("");
    setSelectedVendorFilter("");
    setCustomVendorInput("");
    setSelectedOrderTypeFilter("");
    setCustomOrderTypeInput("");
    setMaterialStatusFilter("");
    setPaymentStatusFilter("");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Procurement &amp; Materials</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">Project Materials</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal mt-1">
            Project Materials
          </h1>
          <p className="text-xs text-walnut mt-0.5">
            Confirmed project material orders, receiving verification, and automated project pipeline progression.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton
            reportKey="project_materials_summary"
            label="Export Project Materials"
            size="sm"
          />
        </div>
      </div>

      {/* 5 Dynamic KPI Cards (Rule 25) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* KPI 1: TOTAL MATERIAL ORDERS */}
        <div className="rounded-xl border border-walnut/15 bg-white p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-walnut">
            1. Total Material Orders
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-charcoal">
            {summary.totalMaterialOrders}
          </div>
          <div className="mt-1 text-[11px] text-walnut">Confirmed Project Orders</div>
        </div>

        {/* KPI 2: TOTAL MATERIAL VALUE */}
        <div className="rounded-xl border border-walnut/15 bg-white p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-walnut">
            2. Total Material Value
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-charcoal">
            {formatCurrency(summary.totalMaterialValue)}
          </div>
          <div className="mt-1 text-[11px] text-walnut">Sum of Final Order Amounts</div>
        </div>

        {/* KPI 3: MATERIALS RECEIVED */}
        <div className="rounded-xl border border-walnut/15 bg-white p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-walnut">
            3. Materials Received
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-700">
            {summary.materialsReceived}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold">Delivered &amp; Verified</div>
        </div>

        {/* KPI 4: MATERIALS PENDING */}
        <div className="rounded-xl border border-walnut/15 bg-white p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-walnut">
            4. Materials Pending
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-amber-700">
            {summary.materialsPending}
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-semibold">Pipeline Execution Waiting</div>
        </div>

        {/* KPI 5: TOTAL REMAINING PAYABLE */}
        <div className="rounded-xl border border-walnut/15 bg-white p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-walnut">
            5. Total Remaining Payable
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-charcoal">
            {formatCurrency(summary.totalRemainingPayable)}
          </div>
          <div className="mt-1 text-[11px] text-walnut">Order Value − Total Paid</div>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-walnut/15 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Search Input (Rule 27) */}
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Search Order ID, Project, Vendor, Material..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchOrders()}
              className="w-full rounded border border-walnut/20 bg-cream/20 px-3 py-1.5 text-xs text-charcoal font-medium focus:border-gold focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs text-walnut">
            <span>Showing <strong>{orders.length}</strong> confirmed orders</span>
            <button
              onClick={handleResetFilters}
              className="text-gold-hover hover:underline text-[11px] font-semibold ml-2 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Filter Row with OTHERS Rule (Rule 28) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2 border-t border-walnut/10 text-xs">
          {/* Filter 1: Project */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-walnut uppercase">Project</label>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-1.5 text-xs text-charcoal font-semibold focus:border-gold focus:outline-none"
            >
              <option value="">All Projects</option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.referenceNo} — {p.title}
                </option>
              ))}
              <option value="OTHERS">+ OTHERS (Custom Search)</option>
            </select>
            {selectedProjectFilter === "OTHERS" && (
              <input
                type="text"
                placeholder="Type custom project name/ID..."
                value={customProjectInput}
                onChange={(e) => setCustomProjectInput(e.target.value)}
                className="w-full rounded border border-gold bg-cream/30 p-1 text-[11px] text-charcoal mt-1 focus:outline-none"
              />
            )}
          </div>

          {/* Filter 2: Vendor */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-walnut uppercase">Vendor</label>
            <select
              value={selectedVendorFilter}
              onChange={(e) => setSelectedVendorFilter(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-1.5 text-xs text-charcoal font-semibold focus:border-gold focus:outline-none"
            >
              <option value="">All Vendors</option>
              {vendorsList.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
              <option value="OTHERS">+ OTHERS (Custom Search)</option>
            </select>
            {selectedVendorFilter === "OTHERS" && (
              <input
                type="text"
                placeholder="Type custom vendor name..."
                value={customVendorInput}
                onChange={(e) => setCustomVendorInput(e.target.value)}
                className="w-full rounded border border-gold bg-cream/30 p-1 text-[11px] text-charcoal mt-1 focus:outline-none"
              />
            )}
          </div>

          {/* Filter 3: Order Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-walnut uppercase">Order Type</label>
            <select
              value={selectedOrderTypeFilter}
              onChange={(e) => setSelectedOrderTypeFilter(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-1.5 text-xs text-charcoal font-semibold focus:border-gold focus:outline-none"
            >
              <option value="">All Order Types</option>
              <option value="Raw Material">Raw Material Order</option>
              <option value="Laminate">Laminate Order</option>
              <option value="Hardware">Hardware &amp; Fittings</option>
              <option value="OTHERS">+ OTHERS (Custom Type)</option>
            </select>
            {selectedOrderTypeFilter === "OTHERS" && (
              <input
                type="text"
                placeholder="Type custom order type..."
                value={customOrderTypeInput}
                onChange={(e) => setCustomOrderTypeInput(e.target.value)}
                className="w-full rounded border border-gold bg-cream/30 p-1 text-[11px] text-charcoal mt-1 focus:outline-none"
              />
            )}
          </div>

          {/* Filter 4: Material Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-walnut uppercase">Material Status</label>
            <select
              value={materialStatusFilter}
              onChange={(e) => setMaterialStatusFilter(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-1.5 text-xs text-charcoal font-semibold focus:border-gold focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending Delivery</option>
              <option value="Received">Received</option>
            </select>
          </div>

          {/* Filter 5: Payment Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-walnut uppercase">Payment Status</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full rounded border border-walnut/20 bg-white p-1.5 text-xs text-charcoal font-semibold focus:border-gold focus:outline-none"
            >
              <option value="">All Payments</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table: Confirmed Project Materials (Rules 9 & 10) */}
      <div className="rounded-xl border border-walnut/15 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-walnut">
            Loading confirmed project materials...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-walnut space-y-1">
            <div className="font-bold text-charcoal text-sm">No Confirmed Project Materials Found</div>
            <p className="text-[11px]">
              Material orders originate from the <strong>Project Pipeline</strong> upon Vendor Acceptance and manual order amount confirmation.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-walnut/15 bg-cream/70 text-walnut font-bold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3">Material Order ID</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Order Type</th>
                <th className="px-4 py-3">Order Date</th>
                <th className="px-4 py-3 text-right">Final Amount (₹)</th>
                <th className="px-4 py-3 text-center">Payment Status</th>
                <th className="px-4 py-3 text-center">Material Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-walnut/10 font-medium text-charcoal">
              {orders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className="hover:bg-cream/20 transition cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono font-bold text-charcoal">
                    {o.referenceNo}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-charcoal line-clamp-1">{o.project?.title || "—"}</div>
                    <div className="font-mono text-[10px] text-walnut">{o.project?.referenceNo || "—"}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-charcoal">
                    {o.vendor?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-cream px-2 py-0.5 text-[10px] font-bold text-charcoal uppercase">
                      {o.orderType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-walnut">
                    {formatDate(o.poDate)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-charcoal">
                    {formatCurrency(o.finalOrderAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.paymentStatus === "Paid"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : o.paymentStatus === "Partial"
                          ? "bg-blue-50 text-blue-800 border border-blue-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.materialStatus === "Received"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {o.materialStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(o);
                      }}
                      className="text-gold hover:text-gold-hover font-bold hover:underline cursor-pointer"
                    >
                      View ↗
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Project Material Details Drawer (Section 11, 12, 13, 14, 15, 16) */}
      <ProjectMaterialDetailDrawer
        isOpen={selectedOrder !== null}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onSuccess={() => {
          fetchOrders();
        }}
      />
    </div>
  );
}
