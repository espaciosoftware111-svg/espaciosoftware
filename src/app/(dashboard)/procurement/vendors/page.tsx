"use client";

import React, { useState, useEffect } from "react";
import { AddVendorModal } from "@/components/vendors/add-vendor-modal";
import { VendorDetailModal } from "@/components/vendors/vendor-detail-modal";
import { ExportButton } from "@/components/reports/export-button";
import { FilterSelect } from "@/components/ui/filter-select";

interface VendorItem {
  id: string;
  referenceNo: string;
  name: string;
  legalName?: string | null;
  categoryKey: string;
  phone: string;
  email?: string | null;
  status: string;
  contactPerson?: string | null;
  primaryContact?: { name: string; designation?: string } | null;
  totalOrders: number;
  totalOrderValue: number;
  totalPaid: number;
  remainingBalance: number;
  totalPurchases?: number;
  totalOutstanding?: number;
  qualityRating?: number;
}

interface CategoryOption {
  key: string;
  name: string;
}

interface SummaryKPIs {
  totalVendors: number;
  totalOrderValue: number;
  totalPaid: number;
  totalPayableBalance: number;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Summary KPIs
  const [globalSummary, setGlobalSummary] = useState<SummaryKPIs>({
    totalVendors: 0,
    totalOrderValue: 0,
    totalPaid: 0,
    totalPayableBalance: 0,
  });

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  // Modal & Drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [categoryFilter, statusFilter]);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/v1/config/vendors");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data?.categories || []);
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  }

  async function fetchVendors() {
    setLoading(true);
    try {
      let url = `/api/v1/procurement/vendors?search=${encodeURIComponent(search)}`;
      if (categoryFilter) url += `&categoryKey=${categoryFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVendors(data.data || []);
        if (data.meta?.summary) {
          setGlobalSummary(data.meta.summary as SummaryKPIs);
        } else {
          // Fallback calculation from items
          const list: VendorItem[] = data.data || [];
          const activeCount = list.filter((v) => v.status === "ACTIVE").length;
          const orderSum = list.reduce((acc, v) => acc + (v.totalOrderValue || 0), 0);
          const paidSum = list.reduce((acc, v) => acc + (v.totalPaid || 0), 0);
          setGlobalSummary({
            totalVendors: activeCount || list.length,
            totalOrderValue: orderSum,
            totalPaid: paidSum,
            totalPayableBalance: Math.max(0, orderSum - paidSum),
          });
        }
      }
    } catch (e) {
      console.error("Failed to load vendors", e);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(val: number) {
    return `₹${(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
            ACTIVE
          </span>
        );
      case "BLOCKED":
        return (
          <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
            BLOCKED
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 border border-slate-200">
            INACTIVE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
            {status}
          </span>
        );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Procurement &amp; Supplier Management</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">Directory</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal mt-1">
            Vendor &amp; Supplier Management
          </h1>
          <p className="text-xs text-walnut mt-0.5">
            Registered material &amp; service vendors, connected project orders, pricing reference, and money management.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 text-xs">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 rounded font-semibold transition cursor-pointer ${
                viewMode === "cards"
                  ? "bg-cream text-charcoal font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded font-semibold transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-cream text-charcoal font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Table
            </button>
          </div>

          <ExportButton
            reportKey="procurement_vendors"
            label="Export Vendors"
            size="sm"
          />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-md bg-gold px-4 py-2 text-xs font-bold text-charcoal shadow-gold hover:bg-gold-hover transition cursor-pointer"
          >
            + Add Vendor
          </button>
        </div>
      </div>

      {/* Section 6: Main Global Vendor Management KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: TOTAL VENDORS */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            1. Total Vendors
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {globalSummary.totalVendors}
          </div>
          <div className="mt-1 text-xs text-slate-500">Active registered suppliers</div>
        </div>

        {/* KPI 2: TOTAL ORDER VALUE */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            2. Total Order Value
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {formatCurrency(globalSummary.totalOrderValue)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Sum of confirmed vendor orders</div>
        </div>

        {/* KPI 3: TOTAL PAID TO VENDORS */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            3. Total Paid to Vendors
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700">
            {formatCurrency(globalSummary.totalPaid)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Sum of recorded vendor payments</div>
        </div>

        {/* KPI 4: TOTAL PAYABLE BALANCE */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            4. Total Payable Balance
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-700">
            {formatCurrency(globalSummary.totalPayableBalance)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Total Orders − Total Paid</div>
        </div>
      </div>

      {/* Toolbar / Search & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search vendor name, ID, phone, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchVendors()}
            className="w-full sm:w-80 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-gold focus:outline-none"
          />

          <FilterSelect
            label="Category"
            placeholder="All Categories"
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
            options={categories.map((c) => ({
              value: c.key,
              label: c.name,
            }))}
            variant="slate"
            size="sm"
          />

          <FilterSelect
            label="Status"
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: "ACTIVE", label: "ACTIVE" },
              { value: "BLOCKED", label: "BLOCKED" },
              { value: "INACTIVE", label: "INACTIVE" },
            ]}
            variant="slate"
            size="sm"
          />
        </div>

        <div className="text-xs text-walnut">
          Showing <strong>{vendors.length}</strong> suppliers
        </div>
      </div>

      {/* Section 1: Professional Vendor Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-lg border border-slate-200">
          Loading vendor directory...
        </div>
      ) : vendors.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-lg border border-slate-200">
          No vendors found. Click <strong>+ Add Vendor</strong> above to create one.
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => {
            const contactName = v.contactPerson || v.primaryContact?.name || "Primary Contact";
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVendorId(v.id)}
                className="group rounded-xl border border-walnut/15 bg-white p-5 shadow-xs hover:shadow-md hover:border-gold/50 transition-all cursor-pointer flex flex-col justify-between"
              >
                {/* Card Top: Name, ID, Category & Status */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2 text-[11px] font-mono text-walnut font-bold">
                        <span>{v.referenceNo}</span>
                        <span>•</span>
                        <span className="rounded bg-cream px-1.5 py-0.2 font-sans font-semibold text-charcoal uppercase text-[10px]">
                          {v.categoryKey}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-charcoal group-hover:text-gold-hover transition mt-1 line-clamp-1">
                        {v.name}
                      </h3>
                    </div>
                    {getStatusBadge(v.status)}
                  </div>

                  {/* Contact Person & Phone */}
                  <div className="mt-3 space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Contact Person:</span>
                      <span className="font-semibold text-charcoal">{contactName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-mono font-medium text-charcoal">{v.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Financial Summary: Orders, Value, Remaining Balance */}
                <div className="mt-4 pt-3 border-t border-walnut/10 bg-cream/30 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-walnut uppercase">Total Orders</div>
                      <div className="font-mono font-bold text-charcoal mt-0.5">
                        {v.totalOrders || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-walnut uppercase">Order Value</div>
                      <div className="font-mono font-bold text-charcoal mt-0.5">
                        {formatCurrency(v.totalOrderValue || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-walnut uppercase">Balance</div>
                      <div className="font-mono font-bold text-amber-700 mt-0.5">
                        {formatCurrency(v.remainingBalance || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Alternative Table View */
        <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Vendor Code</th>
                <th className="px-4 py-3">Vendor Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Contact Person</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-center">Total Orders</th>
                <th className="px-4 py-3 text-right">Order Value (₹)</th>
                <th className="px-4 py-3 text-right">Balance (₹)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{v.referenceNo}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{v.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                      {v.categoryKey}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {v.contactPerson || v.primaryContact?.name || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono">{v.phone}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                    {v.totalOrders || 0}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(v.totalOrderValue || 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                    {formatCurrency(v.remainingBalance || 0)}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(v.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedVendorId(v.id)}
                      className="text-emerald-700 hover:text-emerald-900 font-bold"
                    >
                      View Profile →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals & Profile Drawer */}
      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchVendors}
      />

      <VendorDetailModal
        isOpen={selectedVendorId !== null}
        vendorId={selectedVendorId}
        onClose={() => setSelectedVendorId(null)}
        onRefresh={fetchVendors}
      />
    </div>
  );
}
