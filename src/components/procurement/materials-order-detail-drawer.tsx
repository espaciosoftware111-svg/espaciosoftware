"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle, Clock, Truck, User, Info, DollarSign } from "lucide-react";
import { RecordPaymentModal } from "./record-payment-modal";

export interface MaterialsOrderDetail {
  id: string;
  referenceNo: string;
  poDate: string;
  expectedDeliveryDate?: string | null;
  finalVendorOrderAmount: number;
  subtotal: number;
  status: string;
  materialStatus: "Pending" | "Received";
  paymentStatus: "Unpaid" | "Partial" | "Paid";
  totalPaid: number;
  remainingBalance: number;
  notes?: string | null;
  customer: {
    leadId?: string | null;
    leadRef?: string | null;
    leadStatus?: string | null;
    customerName: string;
    phone: string;
    secondaryContact?: string | null;
    email: string;
    address: string;
    requirement: string;
  };
  relatedQuotation?: {
    id: string;
    referenceNo: string;
    totalAmount: number;
    createdAt: string;
    status: string;
  } | null;
  vendorRequests?: Array<{
    id: string;
    vendorName: string;
    vendorPhone?: string | null;
    requestedAt: string;
    respondedAt?: string | null;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    rejectionReason?: string | null;
    finalAmount?: number | null;
    notes?: string | null;
  }>;
  vendor: {
    id: string;
    referenceNo: string;
    name: string;
    contactPerson?: string | null;
    phone: string;
    email?: string | null;
    address?: string | null;
    categoryKey?: string | null;
    vendorStatus?: "PENDING" | "ACCEPTED" | "REJECTED";
  };
  items: Array<{
    id: string;
    materialName: string;
    category?: string;
    quantity: number;
    unitKey: string;
    referencePrice: number;
    notes?: string | null;
  }>;
  payments: Array<{
    id: string;
    paymentNo?: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNoExt?: string | null;
    notes?: string | null;
  }>;
}

interface MaterialsOrderDetailDrawerProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
}

export const MaterialsOrderDetailDrawer: React.FC<MaterialsOrderDetailDrawerProps> = ({
  orderId,
  isOpen,
  onClose,
  onOrderUpdated,
}) => {
  const [order, setOrder] = useState<MaterialsOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);
  const [showConfirmReceive, setShowConfirmReceive] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    } else {
      setOrder(null);
      setError(null);
      setShowConfirmReceive(false);
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/procurement/materials-order/${orderId}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to load materials order details");
      }
      const data = await res.json();
      setOrder(data.data);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading order details");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReceived = async () => {
    if (!orderId) return;
    setIsReceiving(true);
    try {
      const res = await fetch(`/api/v1/procurement/materials-order/${orderId}/receive`, {
        method: "POST",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to mark order as received");
      }
      setShowConfirmReceive(false);
      await fetchOrderDetails();
      onOrderUpdated();
    } catch (err: any) {
      alert(err.message || "Error marking material as received");
    } finally {
      setIsReceiving(false);
    }
  };

  if (!isOpen) return null;

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
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-charcoal/40 backdrop-blur-xs flex justify-end animate-fadeIn">
        <div className="w-full max-w-2xl bg-cream border-l border-walnut/20 shadow-2xl flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-cream/90 border-b border-walnut/15 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-walnut/10 text-walnut">
                  Materials Required Lead Order
                </span>
                <span className="text-xs text-walnut/70">
                  {order?.customer.leadRef || "MRL"}
                </span>
              </div>
              <h2 className="text-lg font-bold text-charcoal flex items-center gap-2 mt-0.5">
                {order ? order.referenceNo : "Loading Order..."}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-walnut hover:bg-walnut/10 hover:text-charcoal transition cursor-pointer"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading && (
              <div className="py-20 text-center text-sm text-walnut">
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading Materials Order Details...
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {error}
              </div>
            )}

            {!loading && order && (
              <>
                {/* Notice banner: Strict Separation */}
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Materials Order (Lead Scope): </span>
                    This material order is dedicated to customer materials fulfillment for{" "}
                    <span className="font-semibold">{order.customer.customerName}</span>. It is strictly separate from Project Materials and does not move any Project Pipeline.
                  </div>
                </div>

                {/* A. ORDER INFORMATION */}
                <div className="bg-white p-4 rounded-xl border border-walnut/15 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                    A. Order Information
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-walnut text-[11px] block">Material Order ID</span>
                      <span className="font-mono font-bold text-charcoal">{order.referenceNo}</span>
                    </div>
                    <div>
                      <span className="text-walnut text-[11px] block">Order Date</span>
                      <span className="font-mono text-charcoal">{formatDate(order.poDate)}</span>
                    </div>
                    <div>
                      <span className="text-walnut text-[11px] block">Order Status</span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {order.status === "DRAFT" ? "PENDING VENDOR" : order.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-walnut text-[11px] block">Material Status</span>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.materialStatus === "Received"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {order.materialStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* B. CUSTOMER INFORMATION */}
                <div className="bg-white p-4 rounded-xl border border-walnut/15 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-walnut" />
                    B. Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-walnut text-[11px] block">Customer Name</span>
                      <span className="font-bold text-charcoal">{order.customer.customerName}</span>
                    </div>
                    <div>
                      <span className="text-walnut text-[11px] block">Primary Contact</span>
                      <span className="font-mono font-bold text-charcoal">{order.customer.phone}</span>
                    </div>
                    {order.customer.secondaryContact && (
                      <div>
                        <span className="text-walnut text-[11px] block">Secondary Contact</span>
                        <span className="font-mono text-charcoal">{order.customer.secondaryContact}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-walnut text-[11px] block">Email ID</span>
                      <span className="font-mono text-charcoal truncate block">
                        {order.customer.email || "—"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-walnut text-[11px] block">Project / Delivery Location</span>
                      <span className="text-charcoal font-medium">{order.customer.address || "Hyderabad"}</span>
                    </div>
                  </div>
                </div>

                {/* C. RELATED MATERIAL LEAD & QUOTATION */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Related Material Lead */}
                  <div className="bg-white p-4 rounded-xl border border-walnut/15 shadow-xs space-y-2 text-xs">
                    <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                      Related Material Lead
                    </h3>
                    <div>
                      <span className="text-walnut text-[11px] block">Material Lead ID</span>
                      <span className="font-mono font-bold text-charcoal text-sm">
                        {order.customer.leadRef || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-walnut text-[11px] block">Current Lead Status</span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-cream text-charcoal border border-walnut/20">
                        {order.customer.leadStatus || "CONFIRMED"}
                      </span>
                    </div>
                  </div>

                  {/* Related Quotation */}
                  <div className="bg-white p-4 rounded-xl border border-walnut/15 shadow-xs space-y-2 text-xs">
                    <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                      Related Quotation
                    </h3>
                    {order.relatedQuotation ? (
                      <>
                        <div>
                          <span className="text-walnut text-[11px] block">Quotation Number</span>
                          <span className="font-mono font-bold text-charcoal">
                            {order.relatedQuotation.referenceNo}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-walnut text-[11px] block">Quotation Date</span>
                            <span className="font-mono text-charcoal">
                              {formatDate(order.relatedQuotation.createdAt)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-walnut text-[11px] block">Quotation Amount</span>
                            <span className="font-mono font-bold text-charcoal">
                              {formatCurrency(order.relatedQuotation.totalAmount)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-walnut text-xs italic">No quotation linked to this lead.</p>
                    )}
                  </div>
                </div>

                {/* D. VENDOR INFORMATION */}
                <div className="bg-white p-4 rounded-xl border border-walnut/15 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-walnut" />
                    D. Vendor Information
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-walnut text-[11px] block">Selected Vendor</span>
                      <span className="font-bold text-charcoal">{order.vendor?.name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-walnut text-[11px] block">Vendor Status</span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                        {order.vendor?.vendorStatus || "ACCEPTED"}
                      </span>
                    </div>
                    <div>
                      <span className="text-walnut text-[11px] block">Vendor Request Date</span>
                      <span className="font-mono text-charcoal">{formatDate(order.poDate)}</span>
                    </div>
                    <div>
                      <span className="text-walnut text-[11px] block">Phone / Contact</span>
                      <span className="font-mono text-charcoal">{order.vendor?.phone || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* E. VENDOR REQUEST HISTORY */}
                {order.vendorRequests && order.vendorRequests.length > 0 && (
                  <div className="bg-white p-4 rounded-xl border border-walnut/15 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                      E. Vendor Request History
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-walnut/15 text-[11px] text-walnut uppercase font-semibold">
                            <th className="py-2 px-2">Vendor Name</th>
                            <th className="py-2 px-2">Request Date</th>
                            <th className="py-2 px-2 text-center">Response</th>
                            <th className="py-2 px-2">Response Date</th>
                            <th className="py-2 px-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-walnut/10 font-mono">
                          {order.vendorRequests.map((vr, idx) => (
                            <tr key={vr.id || idx} className="hover:bg-cream/30">
                              <td className="py-2 px-2 font-sans font-medium text-charcoal">
                                {vr.vendorName}
                              </td>
                              <td className="py-2 px-2 text-walnut">
                                {formatDate(vr.requestedAt)}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                    vr.status === "ACCEPTED"
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                      : vr.status === "REJECTED"
                                      ? "bg-rose-50 text-rose-800 border border-rose-200"
                                      : "bg-amber-50 text-amber-800 border border-amber-200"
                                  }`}
                                >
                                  {vr.status}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-walnut">
                                {vr.respondedAt ? formatDate(vr.respondedAt) : "—"}
                              </td>
                              <td className="py-2 px-2 font-sans text-walnut text-[11px]">
                                {vr.rejectionReason ? (
                                  <span className="text-rose-700">Reason: {vr.rejectionReason}</span>
                                ) : (
                                  vr.notes || "—"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* F. MATERIAL DETAILS */}
                <div className="bg-white p-4 rounded-xl border border-walnut/15 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                      F. Material Details
                    </h3>
                    <span className="text-[10px] text-walnut italic">
                      *Reference prices only
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-walnut/15 text-[11px] text-walnut uppercase font-semibold">
                          <th className="py-2 px-2">Material Name</th>
                          <th className="py-2 px-2">Quantity</th>
                          <th className="py-2 px-2 text-right">Reference Price</th>
                          <th className="py-2 px-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-walnut/10 font-mono">
                        {order.items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-cream/30">
                            <td className="py-2 px-2 font-sans font-medium text-charcoal">
                              {item.materialName}
                            </td>
                            <td className="py-2 px-2 text-charcoal">
                              {item.quantity} {item.unitKey}
                            </td>
                            <td className="py-2 px-2 text-right text-walnut">
                              {item.referencePrice ? formatCurrency(item.referencePrice) : "—"}
                            </td>
                            <td className="py-2 px-2 font-sans text-walnut text-[11px]">
                              {item.notes || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* E. FINANCIAL INFORMATION */}
                <div className="bg-white p-4 rounded-xl border border-walnut/15 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-walnut" />
                      E. Financial Information
                    </h3>
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="px-2.5 py-1 text-xs font-bold rounded-md bg-walnut text-cream hover:bg-charcoal transition cursor-pointer"
                    >
                      + Record Vendor Payment
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-cream/40 rounded-lg border border-walnut/10">
                      <span className="text-[11px] text-walnut block font-medium">
                        Final Vendor Order Amount
                      </span>
                      <span className="text-base font-bold font-mono text-charcoal">
                        {formatCurrency(order.finalVendorOrderAmount)}
                      </span>
                      <span className="text-[10px] text-walnut/70 block mt-0.5">
                        Agreed with vendor
                      </span>
                    </div>

                    <div className="p-3 bg-cream/40 rounded-lg border border-walnut/10">
                      <span className="text-[11px] text-walnut block font-medium">Total Paid</span>
                      <span className="text-base font-bold font-mono text-emerald-700">
                        {formatCurrency(order.totalPaid)}
                      </span>
                      <span className="text-[10px] text-walnut/70 block mt-0.5">
                        {order.payments.length} verified payment(s)
                      </span>
                    </div>

                    <div className="p-3 bg-cream/40 rounded-lg border border-walnut/10">
                      <span className="text-[11px] text-walnut block font-medium">
                        Remaining Balance
                      </span>
                      <span
                        className={`text-base font-bold font-mono ${
                          order.remainingBalance > 0 ? "text-amber-700" : "text-emerald-700"
                        }`}
                      >
                        {formatCurrency(order.remainingBalance)}
                      </span>
                      <span className="text-[10px] text-walnut/70 block mt-0.5">
                        Status:{" "}
                        <span className="font-bold uppercase tracking-wider">
                          {order.paymentStatus}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Payment History List */}
                  {order.payments && order.payments.length > 0 && (
                    <div className="pt-3 border-t border-walnut/10">
                      <span className="text-xs font-bold text-charcoal block mb-2">
                        Vendor Payment History
                      </span>
                      <div className="space-y-1.5 text-xs">
                        {order.payments.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-2 bg-cream/20 rounded border border-walnut/10"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-charcoal">
                                {p.paymentNo || "VPAY"}
                              </span>
                              <span className="text-walnut text-[11px]">
                                {formatDate(p.paymentDate)}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-walnut/10 text-walnut">
                                {p.paymentMethod}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-charcoal">
                              {formatCurrency(p.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* F. MATERIAL RECEIVED STATUS */}
                <div className="bg-white p-4 rounded-xl border border-walnut/15 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                        F. Material Received Status
                      </h3>
                      <p className="text-[11px] text-walnut mt-0.5">
                        Track material arrival for customer delivery. Does not affect any project pipeline.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.materialStatus === "Received" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Materials Received
                        </span>
                      ) : (
                        <button
                          onClick={() => setShowConfirmReceive(true)}
                          className="px-4 py-2 rounded-lg bg-gold text-charcoal font-bold text-xs shadow-gold hover:bg-gold-hover transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Clock className="w-4 h-4 text-charcoal" />
                          Mark as Received
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Mark as Received */}
      {showConfirmReceive && (
        <div className="fixed inset-0 z-60 bg-charcoal/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-walnut/20 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-charcoal">Confirm Material Receipt</h3>
            <p className="text-xs text-walnut leading-relaxed">
              Are you sure you want to mark Materials Order{" "}
              <span className="font-mono font-bold text-charcoal">{order?.referenceNo}</span> for customer{" "}
              <span className="font-bold text-charcoal">{order?.customer.customerName}</span> as{" "}
              <span className="font-bold text-emerald-700">RECEIVED</span>?
            </p>
            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-[11px] text-amber-900">
              Note: This is a Materials Required Lead order. Marking it as received updates the materials order and lead status, with zero effect on any Project Pipeline.
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmReceive(false)}
                disabled={isReceiving}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-walnut hover:bg-cream/60 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsReceived}
                disabled={isReceiving}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-sm"
              >
                {isReceiving ? "Confirming..." : "Confirm & Mark Received"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Vendor Payment Modal */}
      {order && isPaymentModalOpen && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          orderId={order.id}
          orderRef={order.referenceNo}
          vendorName={order.vendor?.name || "Vendor"}
          remainingBalance={order.remainingBalance}
          onPaymentRecorded={async () => {
            setIsPaymentModalOpen(false);
            await fetchOrderDetails();
            onOrderUpdated();
          }}
        />
      )}
    </>
  );
};
