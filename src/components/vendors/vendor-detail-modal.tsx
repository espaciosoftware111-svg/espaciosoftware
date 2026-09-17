"use client";

import React, { useState, useEffect } from "react";
import { LogRatingModal } from "./log-rating-modal";
import { RecordVendorPaymentModal } from "./record-vendor-payment-modal";
import { AddVendorMaterialModal } from "./add-vendor-material-modal";
import { EditVendorModal } from "./edit-vendor-modal";

interface VendorDetailProps {
  isOpen: boolean;
  vendorId: string | null;
  onClose: () => void;
  onRefresh: () => void;
}

export function VendorDetailModal({ isOpen, vendorId, onClose, onRefresh }: VendorDetailProps) {
  const [vendor, setVendor] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "materials" | "orders" | "money" | "payments" | "ratings"
  >("overview");

  // Modals state
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState<any | null>(null);
  const [selectedPaymentForView, setSelectedPaymentForView] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen && vendorId) {
      fetchVendor();
      fetchMaterials();
    }
  }, [isOpen, vendorId]);

  async function fetchVendor() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/procurement/vendors/${vendorId}`);
      if (res.ok) {
        const data = await res.json();
        setVendor(data.data);
      }
    } catch (e) {
      console.error("Failed to load vendor profile", e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMaterials() {
    if (!vendorId) return;
    setMaterialsLoading(true);
    try {
      const res = await fetch(`/api/v1/procurement/vendors/${vendorId}/materials`);
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.data || []);
      }
    } catch (e) {
      console.error("Failed to load vendor materials", e);
    } finally {
      setMaterialsLoading(false);
    }
  }

  async function handleDeleteMaterial(materialId: string) {
    if (!confirm("Are you sure you want to remove this material from the vendor catalog?")) return;
    try {
      const res = await fetch(
        `/api/v1/procurement/vendors/${vendorId}/materials?vendorMaterialId=${materialId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        fetchMaterials();
      }
    } catch (e) {
      console.error("Failed to delete material", e);
    }
  }

  if (!isOpen || !vendorId) return null;

  function formatCurrency(val: number) {
    return `₹${(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Dynamic KPI Cards Calculations
  const kpis = vendor?.kpis || {
    totalOrders: vendor?.pos?.filter((p: any) => p.status !== "DRAFT" && p.status !== "CANCELLED")?.length || 0,
    totalOrderValue: vendor?.pos
      ?.filter((p: any) => p.status !== "DRAFT" && p.status !== "CANCELLED")
      ?.reduce((acc: number, p: any) => acc + (p.grandTotal || 0), 0) || 0,
    totalPaid: vendor?.vendorPayments?.reduce((acc: number, p: any) => acc + (p.amount || 0), 0) || 0,
    remainingBalance: 0,
  };
  kpis.remainingBalance = Math.max(0, kpis.totalOrderValue - kpis.totalPaid);

  // Confirmed orders list (Strictly confirmed/ordered POs)
  const confirmedOrders = (vendor?.pos || []).filter(
    (p: any) => p.status !== "CANCELLED" && p.status !== "DRAFT" && p.status !== "REJECTED"
  );

  // Payments list
  const payments = vendor?.vendorPayments || [];

  // Order payment lookup map
  const orderPaidMap: Record<string, number> = {};
  for (const pay of payments) {
    if (pay.purchaseOrderId) {
      orderPaidMap[pay.purchaseOrderId] = (orderPaidMap[pay.purchaseOrderId] || 0) + (pay.amount || 0);
    }
  }

  async function handleBlockVendor(e: React.FormEvent) {
    e.preventDefault();
    setBlocking(true);
    try {
      const res = await fetch(`/api/v1/procurement/vendors/${vendorId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: blockReason }),
      });

      if (res.ok) {
        setIsBlockModalOpen(false);
        fetchVendor();
        onRefresh();
      }
    } catch (e) {
      console.error("Failed to block vendor", e);
    } finally {
      setBlocking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/50 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-offwhite shadow-2xl h-full flex flex-col border-l border-walnut/20">
        {/* Top Header */}
        <div className="border-b border-walnut/20 px-6 py-4 flex items-center justify-between bg-[#36302B] text-white">
          <div>
            <div className="flex items-center space-x-2 text-xs text-gold font-mono font-bold">
              <span>{vendor?.referenceNo || "VEN-..."}</span>
              <span>•</span>
              <span className="uppercase">{vendor?.categoryKey || "GENERAL"}</span>
              <span>•</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  vendor?.status === "ACTIVE"
                    ? "bg-emerald-900/60 text-emerald-300 border border-emerald-500/40"
                    : "bg-rose-900/60 text-rose-300 border border-rose-500/40"
                }`}
              >
                {vendor?.status || "ACTIVE"}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-cream mt-0.5">
              {vendor?.name || "Loading Vendor..."}
            </h2>
            {vendor?.legalName && <p className="text-xs text-[#A8917D]">{vendor.legalName}</p>}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsEditVendorOpen(true)}
              className="rounded bg-gold/90 px-3 py-1.5 text-xs font-bold text-charcoal hover:bg-gold transition shadow-gold cursor-pointer"
            >
              ✎ Edit Vendor
            </button>
            {vendor?.status === "ACTIVE" && (
              <button
                onClick={() => setIsBlockModalOpen(true)}
                className="rounded border border-semantic-danger-border bg-semantic-danger-bg px-2.5 py-1.5 text-xs font-bold text-semantic-danger hover:bg-semantic-danger-bg/80 cursor-pointer"
              >
                Block
              </button>
            )}
            <button onClick={onClose} className="text-walnut hover:text-cream text-lg cursor-pointer ml-2">
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-walnut flex-1 flex items-center justify-center">
            Loading supplier profile...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section 5: Dynamic Vendor KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-walnut/15 bg-white p-4 text-center shadow-xs">
                <div className="text-[10px] font-bold text-walnut uppercase tracking-wider">
                  Total Orders
                </div>
                <div className="mt-1 text-2xl font-bold font-mono text-charcoal">
                  {kpis.totalOrders}
                </div>
                <div className="text-[10px] text-walnut/70 mt-0.5">Confirmed POs</div>
              </div>

              <div className="rounded-lg border border-walnut/15 bg-white p-4 text-center shadow-xs">
                <div className="text-[10px] font-bold text-walnut uppercase tracking-wider">
                  Total Order Value
                </div>
                <div className="mt-1 text-lg font-bold font-mono text-charcoal">
                  {formatCurrency(kpis.totalOrderValue)}
                </div>
                <div className="text-[10px] text-walnut/70 mt-0.5">Agreed order amounts</div>
              </div>

              <div className="rounded-lg border border-walnut/15 bg-white p-4 text-center shadow-xs">
                <div className="text-[10px] font-bold text-walnut uppercase tracking-wider">
                  Total Paid
                </div>
                <div className="mt-1 text-lg font-bold font-mono text-emerald-700">
                  {formatCurrency(kpis.totalPaid)}
                </div>
                <div className="text-[10px] text-emerald-600/80 mt-0.5">Recorded payments</div>
              </div>

              <div className="rounded-lg border border-walnut/15 bg-white p-4 text-center shadow-xs">
                <div className="text-[10px] font-bold text-walnut uppercase tracking-wider">
                  Remaining Balance
                </div>
                <div className="mt-1 text-lg font-bold font-mono text-amber-700">
                  {formatCurrency(kpis.remainingBalance)}
                </div>
                <div className="text-[10px] text-amber-700/80 mt-0.5">Orders − Paid</div>
              </div>
            </div>

            {/* Navigation Tabs (Strictly 5 tabs, NO separate Vendor Requests section) */}
            <div className="flex border-b border-walnut/15 space-x-6 text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "overview"
                    ? "border-gold text-charcoal font-bold"
                    : "border-transparent text-walnut hover:text-charcoal"
                }`}
              >
                1. Vendor Overview
              </button>

              <button
                onClick={() => setActiveTab("materials")}
                className={`pb-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "materials"
                    ? "border-gold text-charcoal font-bold"
                    : "border-transparent text-walnut hover:text-charcoal"
                }`}
              >
                2. Materials &amp; Pricing ({materials.length})
              </button>

              <button
                onClick={() => setActiveTab("orders")}
                className={`pb-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "orders"
                    ? "border-gold text-charcoal font-bold"
                    : "border-transparent text-walnut hover:text-charcoal"
                }`}
              >
                3. Orders ({confirmedOrders.length})
              </button>

              <button
                onClick={() => setActiveTab("money")}
                className={`pb-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "money"
                    ? "border-gold text-charcoal font-bold"
                    : "border-transparent text-walnut hover:text-charcoal"
                }`}
              >
                4. Money Management
              </button>

              <button
                onClick={() => setActiveTab("payments")}
                className={`pb-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "payments"
                    ? "border-gold text-charcoal font-bold"
                    : "border-transparent text-walnut hover:text-charcoal"
                }`}
              >
                5. Payment History ({payments.length})
              </button>

              <button
                onClick={() => setActiveTab("ratings")}
                className={`pb-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === "ratings"
                    ? "border-gold text-charcoal font-bold"
                    : "border-transparent text-walnut hover:text-charcoal"
                }`}
              >
                Ratings ({vendor?.ratings?.length || 0})
              </button>
            </div>

            {/* TAB 1: VENDOR OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-walnut/15 pb-6">
                  <div className="space-y-3 bg-white p-4 rounded-lg border border-walnut/15">
                    <h4 className="font-bold text-charcoal uppercase tracking-wider">
                      Contact &amp; Basic Details
                    </h4>
                    <div className="space-y-2 text-charcoal">
                      <div className="flex justify-between">
                        <span className="text-walnut font-semibold">Vendor ID:</span>
                        <span className="font-mono font-bold text-charcoal">{vendor.referenceNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-walnut font-semibold">Category:</span>
                        <span className="rounded bg-cream px-2 py-0.5 font-semibold text-charcoal">
                          {vendor.categoryKey}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-walnut font-semibold">Contact Person:</span>
                        <span className="font-semibold text-charcoal">
                          {vendor.contactPerson || vendor.contacts?.[0]?.name || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-walnut font-semibold">Phone:</span>
                        <span className="font-mono font-bold text-charcoal">{vendor.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-walnut font-semibold">Email:</span>
                        <span>{vendor.email || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-walnut font-semibold">Created Date:</span>
                        <span>{new Date(vendor.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 bg-white p-4 rounded-lg border border-walnut/15">
                    <h4 className="font-bold text-charcoal uppercase tracking-wider">
                      Commercial, Tax &amp; Bank Info
                    </h4>
                    <div className="space-y-2 text-charcoal">
                      <div className="flex justify-between">
                        <span className="text-walnut font-semibold">GSTIN:</span>
                        <span className="font-mono font-bold">{vendor.gstin || "Not Registered"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-walnut font-semibold">PAN:</span>
                        <span className="font-mono">{vendor.pan || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-walnut font-semibold">Payment Terms:</span>
                        <span className="font-bold">{vendor.paymentTermsKey}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-walnut font-semibold">Bank Name:</span>
                        <span>{vendor.bankName || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-walnut font-semibold">Account No:</span>
                        <span className="font-mono">{vendor.bankAccountNo || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-walnut font-semibold">IFSC Code:</span>
                        <span className="font-mono uppercase">{vendor.bankIfsc || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-walnut/15">
                  <h4 className="font-bold text-charcoal uppercase tracking-wider mb-2">
                    Address &amp; Notes
                  </h4>
                  <p className="text-charcoal mb-2">
                    <span className="text-walnut font-semibold">Address: </span>
                    {vendor.address || "No street address recorded."}
                    {vendor.city && `, ${vendor.city}`}
                    {vendor.state && `, ${vendor.state}`}
                    {vendor.postalCode && ` - ${vendor.postalCode}`}
                  </p>
                  {vendor.notes && (
                    <p className="text-walnut">
                      <span className="font-semibold text-charcoal">Notes: </span>
                      {vendor.notes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MATERIALS & PRICING */}
            {activeTab === "materials" && (
              <div className="space-y-4">
                {/* Rule Notice */}
                <div className="rounded border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start space-x-2">
                  <span className="text-base leading-none">ℹ</span>
                  <div className="leading-relaxed">
                    <strong>Reference Pricing Rule:</strong> Vendor Material Prices are strictly reference information for estimation. They do <strong>NOT</strong> automatically calculate final order amounts (Price × Quantity). The Super Admin manually enters the Final Total Order Amount after vendor acceptance.
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                    Materials Catalog &amp; Reference Rates
                  </h4>
                  <button
                    onClick={() => {
                      setEditingMaterial(null);
                      setIsAddMaterialOpen(true);
                    }}
                    className="rounded bg-gold px-3 py-1.5 text-xs font-bold text-charcoal hover:bg-gold-hover transition shadow-gold cursor-pointer"
                  >
                    + Add Material
                  </button>
                </div>

                <div className="rounded-lg border border-walnut/15 bg-white shadow-xs overflow-hidden">
                  {materialsLoading ? (
                    <div className="p-8 text-center text-xs text-walnut">Loading materials...</div>
                  ) : materials.length === 0 ? (
                    <div className="p-8 text-center text-xs text-walnut">
                      No materials added for this vendor yet. Click <strong>+ Add Material</strong> above to record materials and reference prices.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-walnut/15 bg-cream/70 text-walnut font-bold uppercase">
                        <tr>
                          <th className="px-4 py-2.5">Material Name</th>
                          <th className="px-4 py-2.5">Category</th>
                          <th className="px-4 py-2.5">Unit</th>
                          <th className="px-4 py-2.5 text-right">Reference Price (₹)</th>
                          <th className="px-4 py-2.5">Notes</th>
                          <th className="px-4 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-walnut/10 font-medium text-charcoal">
                        {materials.map((m) => (
                          <tr key={m.id} className="hover:bg-cream/30">
                            <td className="px-4 py-2.5 font-bold text-charcoal">{m.materialName}</td>
                            <td className="px-4 py-2.5">
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                {m.categoryKey}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono">{m.unitKey}</td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-charcoal">
                              {formatCurrency(m.referencePrice)}
                            </td>
                            <td className="px-4 py-2.5 text-walnut">{m.notes || "—"}</td>
                            <td className="px-4 py-2.5 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setEditingMaterial(m);
                                  setIsAddMaterialOpen(true);
                                }}
                                className="text-emerald-700 hover:text-emerald-900 font-bold"
                              >
                                Edit Rate
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(m.id)}
                                className="text-rose-600 hover:text-rose-800 font-bold"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ORDERS */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                      Confirmed Orders ({confirmedOrders.length})
                    </h4>
                    <p className="text-[11px] text-walnut">
                      Multi-project confirmed material orders with agreed manual order amounts.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-walnut/15 bg-white shadow-xs overflow-hidden">
                  {confirmedOrders.length === 0 ? (
                    <div className="p-8 text-center text-xs text-walnut">
                      No confirmed purchase orders issued to this vendor yet. Orders will appear here once confirmed in the Project Material Ordering workflow.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-walnut/15 bg-cream/70 text-walnut font-bold uppercase">
                        <tr>
                          <th className="px-4 py-2.5">Order ID</th>
                          <th className="px-4 py-2.5">Project</th>
                          <th className="px-4 py-2.5">Order Type</th>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Ordered Materials</th>
                          <th className="px-4 py-2.5 text-right">Order Amount (₹)</th>
                          <th className="px-4 py-2.5 text-right">Paid Amount (₹)</th>
                          <th className="px-4 py-2.5 text-right">Balance (₹)</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-walnut/10 font-medium text-charcoal">
                        {confirmedOrders.map((o: any) => {
                          const orderPaid = orderPaidMap[o.id] || 0;
                          const orderBal = Math.max(0, (o.grandTotal || 0) - orderPaid);
                          const orderType = o.notes?.includes("Raw Material Order")
                            ? "Raw Material Order"
                            : o.notes?.includes("Laminate Order")
                            ? "Laminate Order"
                            : "Material Order";

                          return (
                            <tr key={o.id} className="hover:bg-cream/30">
                              <td className="px-4 py-2.5 font-mono font-bold text-charcoal">
                                {o.referenceNo}
                              </td>
                              <td className="px-4 py-2.5">
                                {o.project ? (
                                  <div>
                                    <span className="font-bold text-charcoal">{o.project.referenceNo}</span>
                                    <span className="text-walnut text-[11px] block">{o.project.title}</span>
                                  </div>
                                ) : (
                                  <span className="text-walnut italic">General / Store</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="rounded bg-cream px-2 py-0.5 text-[11px] font-semibold text-charcoal">
                                  {orderType}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-mono">
                                {new Date(o.poDate || o.createdAt).toLocaleDateString()}
                              </td>
                              <td
                                className="px-4 py-2.5 text-walnut max-w-[150px] truncate"
                                title={o.items?.map((i: any) => i.materialName).join(", ")}
                              >
                                {o.items?.map((i: any) => i.materialName).join(", ") || "Materials"}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono font-bold text-charcoal">
                                {formatCurrency(o.grandTotal)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">
                                {formatCurrency(orderPaid)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-700">
                                {formatCurrency(orderBal)}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                                  {o.status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <button
                                  onClick={() =>
                                    setSelectedOrderForView({
                                      ...o,
                                      orderPaid,
                                      orderBal,
                                      orderType,
                                    })
                                  }
                                  className="text-gold hover:text-gold-hover font-bold hover:underline cursor-pointer"
                                >
                                  View →
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: MONEY MANAGEMENT */}
            {activeTab === "money" && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-lg border border-walnut/15 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-charcoal uppercase tracking-wider">
                        Vendor Financial Balance
                      </h4>
                      <p className="text-xs text-walnut">
                        Total confirmed orders sum minus total verified vendor payments.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsRecordPaymentOpen(true)}
                      className="rounded bg-gold px-4 py-2 text-xs font-bold text-charcoal hover:bg-gold-hover transition shadow-gold cursor-pointer"
                    >
                      + Record Payment
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="rounded border border-walnut/15 bg-cream/30 p-4 text-center">
                      <div className="text-xs font-bold text-walnut uppercase">Total Order Value</div>
                      <div className="mt-1 text-2xl font-bold font-mono text-charcoal">
                        {formatCurrency(kpis.totalOrderValue)}
                      </div>
                      <div className="text-[11px] text-walnut mt-1">Sum of confirmed orders</div>
                    </div>

                    <div className="rounded border border-walnut/15 bg-cream/30 p-4 text-center">
                      <div className="text-xs font-bold text-walnut uppercase">Total Paid</div>
                      <div className="mt-1 text-2xl font-bold font-mono text-emerald-700">
                        {formatCurrency(kpis.totalPaid)}
                      </div>
                      <div className="text-[11px] text-walnut mt-1">Sum of vendor payments</div>
                    </div>

                    <div className="rounded border border-walnut/15 bg-cream/30 p-4 text-center">
                      <div className="text-xs font-bold text-walnut uppercase">Remaining Balance</div>
                      <div className="mt-1 text-2xl font-bold font-mono text-amber-700">
                        {formatCurrency(kpis.remainingBalance)}
                      </div>
                      <div className="text-[11px] text-walnut mt-1">TOTAL ORDER VALUE − TOTAL PAID</div>
                    </div>
                  </div>

                  {/* Financial Formula Notice */}
                  <div className="rounded border border-walnut/15 bg-cream/20 p-3 text-xs text-charcoal flex items-center justify-between">
                    <div>
                      <span className="font-bold">Dynamic Balance Formula:</span>{" "}
                      <span className="font-mono text-charcoal font-semibold">
                        {formatCurrency(kpis.totalOrderValue)} (Orders) − {formatCurrency(kpis.totalPaid)} (Paid) ={" "}
                        <strong className="text-amber-800">{formatCurrency(kpis.remainingBalance)}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] text-walnut">Zero Double-Counting Guaranteed</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: PAYMENT HISTORY */}
            {activeTab === "payments" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                      Payment History ({payments.length})
                    </h4>
                    <p className="text-[11px] text-walnut">
                      All verified disbursements linked to this vendor, connected projects, and expense accounts.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsRecordPaymentOpen(true)}
                    className="rounded bg-gold px-3 py-1.5 text-xs font-bold text-charcoal hover:bg-gold-hover transition shadow-gold cursor-pointer"
                  >
                    + Record Payment
                  </button>
                </div>

                <div className="rounded-lg border border-walnut/15 bg-white shadow-xs overflow-hidden">
                  {payments.length === 0 ? (
                    <div className="p-8 text-center text-xs text-walnut">
                      No payments recorded for this vendor yet. Click <strong>+ Record Payment</strong> above to record a transaction.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-walnut/15 bg-cream/70 text-walnut font-bold uppercase">
                        <tr>
                          <th className="px-4 py-2.5">Payment ID</th>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Project / Order</th>
                          <th className="px-4 py-2.5">Method</th>
                          <th className="px-4 py-2.5">Reference / UTR</th>
                          <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-walnut/10 font-medium text-charcoal">
                        {payments.map((p: any) => (
                          <tr key={p.id} className="hover:bg-cream/30">
                            <td className="px-4 py-2.5 font-mono font-bold text-charcoal">{p.paymentNo}</td>
                            <td className="px-4 py-2.5 font-mono">
                              {new Date(p.paymentDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2.5 text-walnut">
                              {p.project?.referenceNo || p.purchaseOrder?.referenceNo || "General"}
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-charcoal">
                              {p.paymentMethod.replace("_", " ")}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-walnut">
                              {p.referenceNoExt || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">
                              {formatCurrency(p.amount)}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                                {p.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <button
                                onClick={() => setSelectedPaymentForView(p)}
                                className="text-gold hover:text-gold-hover font-bold hover:underline cursor-pointer"
                              >
                                View →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: RATINGS */}
            {activeTab === "ratings" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                    Historical Rating Logs
                  </h4>
                  <button
                    onClick={() => setIsRatingModalOpen(true)}
                    className="rounded bg-gold px-3 py-1.5 text-xs font-bold text-charcoal hover:bg-gold-hover transition shadow-gold cursor-pointer"
                  >
                    + Log Quality Rating
                  </button>
                </div>
                <div className="space-y-3">
                  {(vendor.ratings || []).map((r: any) => (
                    <div key={r.id} className="rounded-md border border-walnut/15 bg-white p-3 text-xs space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-charcoal font-bold">
                          <span className="text-gold">★</span> {r.qualityRating} / 5.0 Rating
                        </span>
                        <span className="text-walnut font-mono text-[11px]">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {r.notes && <p className="text-walnut">{r.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODALS */}
        <RecordVendorPaymentModal
          isOpen={isRecordPaymentOpen}
          vendorId={vendor?.id}
          vendorName={vendor?.name || ""}
          totalOrderValue={kpis.totalOrderValue}
          totalPaid={kpis.totalPaid}
          remainingBalance={kpis.remainingBalance}
          orders={confirmedOrders}
          onClose={() => setIsRecordPaymentOpen(false)}
          onSuccess={() => {
            fetchVendor();
            onRefresh();
          }}
        />

        <AddVendorMaterialModal
          isOpen={isAddMaterialOpen}
          vendorId={vendor?.id}
          vendorName={vendor?.name || ""}
          initialMaterial={editingMaterial}
          onClose={() => {
            setIsAddMaterialOpen(false);
            setEditingMaterial(null);
          }}
          onSuccess={fetchMaterials}
        />

        <EditVendorModal
          isOpen={isEditVendorOpen}
          vendor={vendor}
          onClose={() => setIsEditVendorOpen(false)}
          onSuccess={() => {
            fetchVendor();
            onRefresh();
          }}
        />

        <LogRatingModal
          isOpen={isRatingModalOpen}
          vendorId={vendor?.id}
          vendorName={vendor?.name || ""}
          onClose={() => setIsRatingModalOpen(false)}
          onSuccess={() => {
            fetchVendor();
            onRefresh();
          }}
        />

        {/* Block Vendor Modal */}
        {isBlockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-xl bg-offwhite border border-walnut/20 p-6 space-y-4 shadow-modal">
              <h3 className="text-base font-bold text-semantic-danger">Block Vendor ({vendor?.name})</h3>
              <p className="text-xs text-walnut">
                Blocking a vendor prevents them from being selected for new procurement orders.
              </p>
              <form onSubmit={handleBlockVendor} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-walnut uppercase mb-1">
                    Reason for Blocking *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Quality non-conformance or material delay..."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full rounded-md border border-walnut/20 bg-cream/40 p-2 text-xs text-charcoal focus:border-gold focus:outline-none"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsBlockModalOpen(false)}
                    className="rounded-md border border-walnut/20 px-3 py-1.5 text-xs text-walnut hover:bg-cream cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={blocking}
                    className="rounded-md bg-semantic-danger px-3 py-1.5 text-xs font-bold text-white hover:bg-semantic-danger/90 cursor-pointer"
                  >
                    {blocking ? "Blocking..." : "Confirm Block"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Order Details View Modal */}
        {selectedOrderForView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-2xl rounded-xl bg-offwhite border border-walnut/20 p-6 space-y-4 shadow-modal">
              <div className="flex justify-between items-center border-b border-walnut/15 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-walnut uppercase tracking-wider font-mono">
                    {selectedOrderForView.referenceNo}
                  </span>
                  <h3 className="text-base font-bold text-charcoal">
                    {selectedOrderForView.orderType || "Material Purchase Order"}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOrderForView(null)}
                  className="text-walnut hover:text-charcoal text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-cream/40 p-3 rounded-lg border border-walnut/10">
                <div>
                  <span className="text-walnut text-[11px] block">Project</span>
                  <span className="font-bold text-charcoal">
                    {selectedOrderForView.project?.referenceNo || "General / Store"}
                  </span>
                </div>
                <div>
                  <span className="text-walnut text-[11px] block">Order Date</span>
                  <span className="font-mono font-bold text-charcoal">
                    {new Date(selectedOrderForView.poDate || selectedOrderForView.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-walnut text-[11px] block">Status</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {selectedOrderForView.status}
                  </span>
                </div>
                <div>
                  <span className="text-walnut text-[11px] block">Vendor</span>
                  <span className="font-bold text-charcoal">{vendor?.name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-walnut uppercase tracking-wider">Ordered Materials</h4>
                <div className="rounded border border-walnut/15 bg-white overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-cream/60 border-b border-walnut/15 text-walnut uppercase font-bold">
                      <tr>
                        <th className="px-3 py-2">Material</th>
                        <th className="px-3 py-2 text-center">Quantity</th>
                        <th className="px-3 py-2 text-center">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-walnut/10">
                      {(selectedOrderForView.items || []).map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-semibold text-charcoal">{item.materialName}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-charcoal">{item.quantity}</td>
                          <td className="px-3 py-2 text-center font-mono text-walnut">{item.unitKey || "NOS"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="bg-white p-3 rounded-lg border border-walnut/15">
                  <span className="text-[10px] uppercase font-bold text-walnut block">Final Order Amount</span>
                  <span className="text-base font-bold font-mono text-charcoal mt-1 block">
                    {formatCurrency(selectedOrderForView.grandTotal)}
                  </span>
                  <span className="text-[10px] text-walnut/70 italic">Manually entered by Super Admin</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-walnut/15">
                  <span className="text-[10px] uppercase font-bold text-walnut block">Paid Amount</span>
                  <span className="text-base font-bold font-mono text-emerald-700 mt-1 block">
                    {formatCurrency(selectedOrderForView.orderPaid || 0)}
                  </span>
                  <span className="text-[10px] text-emerald-600/80">From vendor payments</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-walnut/15">
                  <span className="text-[10px] uppercase font-bold text-walnut block">Remaining Balance</span>
                  <span className="text-base font-bold font-mono text-amber-700 mt-1 block">
                    {formatCurrency(selectedOrderForView.orderBal || 0)}
                  </span>
                  <span className="text-[10px] text-amber-700/80">Order Amount − Paid</span>
                </div>
              </div>

              {selectedOrderForView.notes && (
                <div className="text-xs bg-cream/30 p-2.5 rounded border border-walnut/10">
                  <span className="font-bold text-walnut uppercase text-[10px] block mb-0.5">Notes:</span>
                  <p className="text-charcoal">{selectedOrderForView.notes}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForView(null)}
                  className="rounded-md border border-walnut/20 px-4 py-1.5 text-xs text-charcoal font-bold hover:bg-cream cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details View Modal */}
        {selectedPaymentForView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-xl bg-offwhite border border-walnut/20 p-6 space-y-4 shadow-modal">
              <div className="flex justify-between items-center border-b border-walnut/15 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-walnut uppercase tracking-wider font-mono">
                    {selectedPaymentForView.paymentNo}
                  </span>
                  <h3 className="text-base font-bold text-charcoal">Vendor Payment Record</h3>
                </div>
                <button
                  onClick={() => setSelectedPaymentForView(null)}
                  className="text-walnut hover:text-charcoal text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 text-xs bg-white p-4 rounded-lg border border-walnut/15">
                <div className="flex justify-between">
                  <span className="text-walnut font-semibold">Vendor:</span>
                  <span className="font-bold text-charcoal">{vendor?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-walnut font-semibold">Payment Date:</span>
                  <span className="font-mono font-bold text-charcoal">
                    {new Date(selectedPaymentForView.paymentDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-walnut font-semibold">Payment Method:</span>
                  <span className="font-semibold text-charcoal">
                    {(selectedPaymentForView.paymentMethod || "BANK_TRANSFER").replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-walnut font-semibold">Reference / UTR:</span>
                  <span className="font-mono text-charcoal">
                    {selectedPaymentForView.referenceNoExt || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-walnut font-semibold">Related Project:</span>
                  <span className="font-semibold text-charcoal">
                    {selectedPaymentForView.project
                      ? `${selectedPaymentForView.project.referenceNo} — ${selectedPaymentForView.project.title}`
                      : "General Business"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-walnut font-semibold">Related Order:</span>
                  <span className="font-mono font-bold text-charcoal">
                    {selectedPaymentForView.purchaseOrder?.referenceNo || "General / Unlinked"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-walnut font-semibold">Status:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {selectedPaymentForView.status}
                  </span>
                </div>
                <div className="flex justify-between border-t border-walnut/10 pt-2 text-sm">
                  <span className="font-bold text-charcoal">Amount Paid:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatCurrency(selectedPaymentForView.amount)}
                  </span>
                </div>
              </div>

              <div className="rounded border border-emerald-200 bg-emerald-50/70 p-2.5 text-[11px] text-emerald-900 leading-relaxed">
                <strong>Expense Synchronization:</strong> This single payment record is also connected to Expense Management (under Ref <code>{selectedPaymentForView.paymentNo}</code>) with zero double-counting.
              </div>

              {selectedPaymentForView.notes && (
                <div className="text-xs bg-cream/30 p-2.5 rounded border border-walnut/10">
                  <span className="font-bold text-walnut uppercase text-[10px] block mb-0.5">Notes:</span>
                  <p className="text-charcoal">{selectedPaymentForView.notes}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentForView(null)}
                  className="rounded-md border border-walnut/20 px-4 py-1.5 text-xs text-charcoal font-bold hover:bg-cream cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
