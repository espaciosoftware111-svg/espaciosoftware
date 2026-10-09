"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  CreditCard,
  DollarSign,
  Building,
  Eye,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface InvoiceItem {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  customerGstin?: string | null;
  placeOfSupply: string;
  isInterState: boolean;
  taxableAmount: number;
  totalTax: number;
  grandTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  items?: any[];
}

export default function MasterGstInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Invoice Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("Karnataka");
  const [isInterState, setIsInterState] = useState(false);
  const [items, setItems] = useState([
    { description: "Turnkey Interior Design & Execution", quantity: 1, unitRate: 100000, discount: 0, gstRate: 18 },
  ]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/invoices");
      const json = await res.json();
      if (json.success) {
        setInvoices(json.data || []);
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitRate: 0, discount: 0, gstRate: 18 }]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || items.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerGstin,
          customerAddress,
          placeOfSupply,
          isInterState,
          notes,
          items,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        setCustomerName("");
        setCustomerGstin("");
        setCustomerAddress("");
        fetchInvoices();
      }
    } catch {
      // Quiet handling
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalTaxable = invoices.reduce((sum, inv) => sum + inv.taxableAmount, 0);
  const totalTax = invoices.reduce((sum, inv) => sum + inv.totalTax, 0);
  const totalGrand = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.outstandingAmount, 0);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E8E2D8]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#262421] tracking-tight">GST Invoices Workspace</h1>
          </div>
          <p className="text-xs text-[#77716A] mt-0.5">
            Compliant V1 GST invoicing engine with Place of Supply CGST/SGST/IGST calculation and downloadable Tax Invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#FAF8F5] bg-[#242321] hover:bg-[#383633] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create GST Invoice</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-1 hover:border-[#B99558]/60 transition-all">
          <span className="text-[11px] font-semibold text-[#77716A] uppercase tracking-wider">Total Invoices</span>
          <div className="text-2xl font-bold text-[#262421] font-mono tabular-nums">{invoices.length}</div>
          <p className="text-[11px] text-[#77716A]">Tax invoices generated</p>
        </div>

        <div className="bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-1 hover:border-[#B99558]/60 transition-all">
          <span className="text-[11px] font-semibold text-[#77716A] uppercase tracking-wider">Total Taxable Value</span>
          <div className="text-2xl font-bold text-[#262421] font-mono tabular-nums">₹{totalTaxable.toLocaleString("en-IN")}</div>
          <p className="text-[11px] text-[#77716A]">Base commercial value</p>
        </div>

        <div className="bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-1 hover:border-[#B99558]/60 transition-all">
          <span className="text-[11px] font-semibold text-[#536B4E] uppercase tracking-wider">Total GST Collected</span>
          <div className="text-2xl font-bold text-[#536B4E] font-mono tabular-nums">₹{totalTax.toLocaleString("en-IN")}</div>
          <p className="text-[11px] text-[#77716A]">Output tax liability</p>
        </div>

        <div className="bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs space-y-1 hover:border-[#B99558]/60 transition-all">
          <span className="text-[11px] font-semibold text-[#A45435] uppercase tracking-wider">Outstanding Invoices</span>
          <div className="text-2xl font-bold text-[#A45435] font-mono tabular-nums">₹{totalOutstanding.toLocaleString("en-IN")}</div>
          <p className="text-[11px] text-[#77716A]">Pending customer payments</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#FFFEFC] p-3 rounded-xl border border-[#E8E2D8] shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#77716A]" />
          <input
            type="text"
            placeholder="Search by invoice number or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-[#F8F6F1] border border-[#E8E2D8] rounded-lg focus:outline-none focus:border-[#B99558] focus:bg-[#FFFEFC] text-[#262421] placeholder:text-[#77716A]/70 transition-colors"
          />
        </div>

        <button
          onClick={fetchInvoices}
          className="p-2 text-[#77716A] hover:text-[#262421] hover:bg-[#F3EEE5] rounded-lg transition-colors border border-[#E8E2D8] cursor-pointer"
          title="Refresh Invoices"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E8E2D8] bg-[#F8F6F1]">
                <th className="py-3 px-4 font-bold text-[#77716A]">Invoice No</th>
                <th className="py-3 px-4 font-bold text-[#77716A]">Date</th>
                <th className="py-3 px-4 font-bold text-[#77716A]">Customer Name</th>
                <th className="py-3 px-4 font-bold text-[#77716A]">Place of Supply</th>
                <th className="py-3 px-4 font-bold text-[#77716A]">Tax Type</th>
                <th className="py-3 px-4 font-bold text-[#77716A]">Taxable</th>
                <th className="py-3 px-4 font-bold text-[#77716A]">GST</th>
                <th className="py-3 px-4 font-bold text-[#77716A]">Grand Total</th>
                <th className="py-3 px-4 font-bold text-[#77716A]">Status</th>
                <th className="py-3 px-4 font-bold text-[#77716A] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-[#77716A]">
                    Loading GST invoices...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-[#77716A]">
                    No GST invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const targetStudioUrl = `/quotations/${(inv as any).quotationId || (inv as any).quotation?.id || inv.id}?mode=INVOICE&invoiceId=${inv.id}&readOnly=true`;
                  return (
                    <tr key={inv.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#262421]">
                        <Link
                          href={targetStudioUrl}
                          className="text-[#89652D] hover:text-[#262421] hover:underline font-bold"
                          title="Open Invoice Studio"
                        >
                          {inv.invoiceNo} ↗
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-[#77716A]">{formatDate(inv.invoiceDate)}</td>
                      <td className="py-3 px-4 font-semibold text-[#262421]">{inv.customerName}</td>
                      <td className="py-3 px-4 text-[#77716A]">{inv.placeOfSupply}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8]">
                          {inv.isInterState ? "IGST" : "CGST + SGST"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#262421] tabular-nums">₹{inv.taxableAmount.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 font-mono text-[#536B4E] font-semibold tabular-nums">₹{inv.totalTax.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#262421] tabular-nums">₹{inv.grandTotal.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                            inv.status === "PAID"
                              ? "bg-[#536B4E]/10 text-[#536B4E] border-[#536B4E]/20"
                              : inv.status === "ISSUED"
                              ? "bg-[#F3EEE5] text-[#89652D] border-[#E8E2D8]"
                              : "bg-[#F8EBD5] text-[#89652D] border-[#DFD4C3]"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <a
                            href={`/api/v1/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#262421] bg-[#FFFEFC] hover:bg-[#F3EEE5] border border-[#E8E2D8] rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Download PDF"
                          >
                            <Download className="w-3 h-3 text-[#77716A]" /> PDF
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE GST INVOICE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-[#262421]/60 backdrop-blur-xs">
          <div className="bg-[#FFFEFC] rounded-2xl shadow-2xl border border-[#E8E2D8] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E8E2D8] flex items-center justify-between bg-[#F8F6F1]">
              <h3 className="text-sm font-bold text-[#262421] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#89652D]" /> Create GST Tax Invoice
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[#77716A] hover:text-[#262421] rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#262421] mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Rajesh Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E8E2D8] bg-[#F8F6F1] rounded-lg focus:outline-none focus:border-[#B99558] focus:bg-[#FFFEFC] text-[#262421]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#262421] mb-1">Customer GSTIN</label>
                  <input
                    type="text"
                    placeholder="29ABCDE1234F1ZH"
                    value={customerGstin}
                    onChange={(e) => setCustomerGstin(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#E8E2D8] bg-[#F8F6F1] rounded-lg focus:outline-none focus:border-[#B99558] focus:bg-[#FFFEFC] text-[#262421]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#262421] mb-1">Place of Supply</label>
                  <input
                    type="text"
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E8E2D8] bg-[#F8F6F1] rounded-lg focus:outline-none focus:border-[#B99558] focus:bg-[#FFFEFC] text-[#262421]"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#262421] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInterState}
                      onChange={(e) => setIsInterState(e.target.checked)}
                      className="w-4 h-4 text-[#89652D] rounded border-[#E8E2D8] focus:ring-[#89652D]"
                    />
                    Inter-State Supply (Apply IGST)
                  </label>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-1">
                  <h4 className="text-xs font-bold text-[#262421]">Invoice Line Items</h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-[#89652D] hover:text-[#262421] cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#F8F6F1] rounded-xl border border-[#E8E2D8] grid grid-cols-12 gap-2 text-xs">
                    <div className="col-span-5">
                      <input
                        type="text"
                        required
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-[#E8E2D8] rounded-lg bg-[#FFFEFC] text-[#262421]"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={1}
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-[#E8E2D8] rounded-lg bg-[#FFFEFC] text-[#262421]"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Unit Rate (₹)"
                        value={item.unitRate}
                        onChange={(e) => handleItemChange(idx, "unitRate", parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-[#E8E2D8] rounded-lg bg-[#FFFEFC] text-[#262421]"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="GST %"
                        value={item.gstRate}
                        onChange={(e) => handleItemChange(idx, "gstRate", parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-[#E8E2D8] rounded-lg bg-[#FFFEFC] text-[#262421]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#262421] hover:bg-[#F3EEE5] rounded-xl border border-[#E8E2D8] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-[#FAF8F5] bg-[#242321] hover:bg-[#383633] rounded-xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Create & Issue Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
