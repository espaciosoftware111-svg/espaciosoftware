"use client";

import React, { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ProjectMaterialDetailDrawerProps {
  isOpen: boolean;
  order: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProjectMaterialDetailDrawer({
  isOpen,
  order,
  onClose,
  onSuccess,
}: ProjectMaterialDetailDrawerProps) {
  const [receiving, setReceiving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const isPending = order.materialStatus === "Pending" || order.status !== "RECEIVED";

  async function handleConfirmReceive() {
    setReceiving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/procurement/project-materials/${order.id}/receive`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error?.message || "Failed to mark material as received");
        return;
      }

      setShowConfirmModal(false);
      onSuccess();
      onClose();
    } catch {
      setError("Network error while marking material as received.");
    } finally {
      setReceiving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/50 backdrop-blur-xs">
        <div className="w-full max-w-2xl bg-offwhite shadow-2xl h-full flex flex-col border-l border-walnut/20">
          {/* Header */}
          <div className="border-b border-walnut/20 px-6 py-4 flex items-center justify-between bg-[#36302B] text-white">
            <div>
              <div className="flex items-center space-x-2 text-xs text-gold font-mono font-bold">
                <span>{order.referenceNo}</span>
                <span>•</span>
                <span className="uppercase">{order.orderType || "PROJECT MATERIAL"}</span>
                <span>•</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    order.materialStatus === "Received"
                      ? "bg-emerald-900/60 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-900/60 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {order.materialStatus === "Received" ? "MATERIAL RECEIVED" : "MATERIAL PENDING"}
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-cream mt-1">
                {order.project?.title || "Project Material Order"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-walnut hover:text-cream text-lg font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {error && (
              <div className="p-3 bg-semantic-danger-bg text-semantic-danger border border-semantic-danger-border rounded font-semibold">
                {error}
              </div>
            )}

            {/* A. MATERIAL ORDER INFORMATION */}
            <div className="bg-white p-4 rounded-xl border border-walnut/15 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                A. Material Order Information
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-walnut text-[11px] block">Order ID</span>
                  <span className="font-mono font-bold text-charcoal">{order.referenceNo}</span>
                </div>
                <div>
                  <span className="text-walnut text-[11px] block">Order Type</span>
                  <span className="font-bold text-charcoal">{order.orderType}</span>
                </div>
                <div>
                  <span className="text-walnut text-[11px] block">Order Date</span>
                  <span className="font-mono text-charcoal">
                    {formatDate(order.poDate)}
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

            {/* B. PROJECT INFORMATION */}
            <div className="bg-white p-4 rounded-xl border border-walnut/15 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                B. Project Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-walnut text-[11px] block">Project Name</span>
                  <span className="font-bold text-charcoal">{order.project?.title || "—"}</span>
                </div>
                <div>
                  <span className="text-walnut text-[11px] block">Project ID</span>
                  <span className="font-mono font-bold text-charcoal">
                    {order.project?.referenceNo || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-walnut text-[11px] block">Client Name</span>
                  <span className="font-semibold text-charcoal">
                    {order.project?.client?.name || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-walnut text-[11px] block">Client Contact</span>
                  <span className="font-mono text-charcoal">
                    {order.project?.client?.phone || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* C. VENDOR INFORMATION */}
            <div className="bg-white p-4 rounded-xl border border-walnut/15 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                C. Vendor Information
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-walnut text-[11px] block">Vendor Name</span>
                  <span className="font-bold text-charcoal">{order.vendor?.name || "—"}</span>
                </div>
                <div>
                  <span className="text-walnut text-[11px] block">Vendor ID</span>
                  <span className="font-mono text-charcoal">
                    {order.vendor?.referenceNo || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-walnut text-[11px] block">Contact Person</span>
                  <span className="font-semibold text-charcoal">
                    {order.vendor?.contactPerson || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-walnut text-[11px] block">Phone</span>
                  <span className="font-mono text-charcoal">
                    {order.vendor?.phone || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* D. MATERIALS ORDERED */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                  D. Materials Ordered ({order.items?.length || 0})
                </h3>
                <span className="text-[10px] text-walnut italic">
                  *Reference rates are advisory only
                </span>
              </div>
              <div className="rounded-xl border border-walnut/15 bg-white shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-walnut/15 bg-cream/60 text-walnut uppercase font-bold text-[11px]">
                    <tr>
                      <th className="px-4 py-2.5">Material Name</th>
                      <th className="px-4 py-2.5 text-center">Quantity</th>
                      <th className="px-4 py-2.5 text-center">Unit</th>
                      <th className="px-4 py-2.5 text-right">Ref. Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-walnut/10 text-charcoal font-medium">
                    {(order.items || []).map((item: any) => (
                      <tr key={item.id} className="hover:bg-cream/20">
                        <td className="px-4 py-2.5 font-bold text-charcoal">
                          {item.materialName}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-charcoal">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono text-walnut">
                          {item.unitKey || "NOS"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-walnut">
                          {item.referencePrice ? formatCurrency(item.referencePrice) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* E. FINANCIAL INFORMATION */}
            <div className="bg-white p-5 rounded-xl border border-walnut/15 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-walnut/10 pb-3">
                <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                  E. Financial Information
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                    order.paymentStatus === "Paid"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : order.paymentStatus === "Partial"
                      ? "bg-blue-50 text-blue-800 border border-blue-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {order.paymentStatus === "Paid"
                    ? "PAID IN FULL"
                    : order.paymentStatus === "Partial"
                    ? "PARTIAL PAYMENT"
                    : "UNPAID"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-lg border border-walnut/10 bg-cream/30 p-3">
                  <span className="text-[10px] uppercase font-bold text-walnut block">
                    Final Order Amount
                  </span>
                  <span className="text-base font-bold font-mono text-charcoal mt-1 block">
                    {formatCurrency(order.finalOrderAmount)}
                  </span>
                  <span className="text-[10px] text-walnut/70 italic">Manually entered by Super Admin</span>
                </div>

                <div className="rounded-lg border border-walnut/10 bg-cream/30 p-3">
                  <span className="text-[10px] uppercase font-bold text-walnut block">
                    Total Paid
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-700 mt-1 block">
                    {formatCurrency(order.totalPaid)}
                  </span>
                  <span className="text-[10px] text-emerald-600/80">From verified payments</span>
                </div>

                <div className="rounded-lg border border-walnut/10 bg-cream/30 p-3">
                  <span className="text-[10px] uppercase font-bold text-walnut block">
                    Remaining Balance
                  </span>
                  <span className="text-base font-bold font-mono text-amber-700 mt-1 block">
                    {formatCurrency(order.remainingBalance)}
                  </span>
                  <span className="text-[10px] text-amber-700/80">Final Amount − Total Paid</span>
                </div>
              </div>

              {/* Connected Payments list */}
              {order.payments && order.payments.length > 0 && (
                <div className="border-t border-walnut/10 pt-3 space-y-2">
                  <span className="text-[11px] font-bold text-walnut uppercase tracking-wider block">
                    Disbursement Transactions ({order.payments.length})
                  </span>
                  <div className="space-y-1.5">
                    {order.payments.map((p: any) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded bg-cream/20 border border-walnut/10 text-xs font-medium"
                      >
                        <span className="font-mono font-bold text-charcoal">{p.paymentNo || "VPAY"}</span>
                        <span className="text-walnut">{formatDate(p.paymentDate)}</span>
                        <span className="text-walnut">{(p.paymentMethod || "BANK_TRANSFER").replace(/_/g, " ")}</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {formatCurrency(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* F. MATERIAL RECEIVED STATUS & PIPELINE ADVANCEMENT */}
            <div className="bg-white p-5 rounded-xl border border-walnut/15 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                F. Material Delivery &amp; Pipeline Status
              </h3>

              {order.materialStatus === "Received" ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                    <span className="text-base">✓</span>
                    <span>Materials marked as RECEIVED on site</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    This material order is fulfilled. The relevant Project Pipeline stage has been completed, advancing execution to the next stage.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 leading-relaxed space-y-1">
                    <div className="font-bold flex items-center space-x-1.5">
                      <span>⏳</span>
                      <span>Delivery Pending (Site Execution On Hold)</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      As per Rule 20, the project pipeline remains in this material order stage until physical delivery is confirmed. Once materials arrive, click below to mark as received.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 text-xs tracking-wider uppercase transition shadow-md cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <span>✓ Mark Material as Received</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-walnut/20 px-6 py-3 bg-cream/40 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-md border border-walnut/20 bg-white px-4 py-1.5 text-xs text-charcoal font-bold hover:bg-cream cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-charcoal/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-offwhite border border-walnut/20 p-6 space-y-4 shadow-modal">
            <h3 className="text-base font-bold text-charcoal">Confirm Material Receipt</h3>
            <p className="text-xs text-walnut leading-relaxed">
              Are you sure you want to mark <strong>{order.referenceNo}</strong> as <strong>RECEIVED</strong>?
              <br /><br />
              <strong>Automated Action:</strong>
              <br />
              • Material Status will be updated to <strong>RECEIVED</strong>.
              <br />
              • The corresponding Project Pipeline stage will complete.
              <br />
              • The Project Pipeline will automatically advance to the next execution stage.
            </p>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-md border border-walnut/20 px-3 py-1.5 text-xs text-charcoal font-semibold hover:bg-cream cursor-pointer"
                disabled={receiving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReceive}
                disabled={receiving}
                className="rounded-md bg-emerald-700 hover:bg-emerald-800 px-4 py-1.5 text-xs font-bold text-white transition cursor-pointer"
              >
                {receiving ? "Updating..." : "Yes, Mark as Received"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
