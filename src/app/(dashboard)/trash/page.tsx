"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import {
  Trash2,
  RotateCcw,
  Search,
  Users,
  FileText,
  Receipt,
  CreditCard,
  Wallet,
  FolderKanban,
  Building2,
  RefreshCw,
  AlertTriangle,
  Clock,
  Eye,
  CheckCircle2,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface TrashItem {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  subtitle?: string | null;
  category: string;
  amount?: number | null;
  deletedAt: string;
  reason?: string | null;
  deletedBy?: { id: string; fullName: string; email: string } | null;
  payload: string;
}

const CATEGORIES = [
  { key: "ALL", label: "All Deleted Items", icon: Layers },
  { key: "LEAD", label: "Leads", icon: Users },
  { key: "QUOTATION", label: "Quotations", icon: FileText },
  { key: "INVOICE", label: "Invoices", icon: Receipt },
  { key: "PAYMENT", label: "Payments", icon: CreditCard },
  { key: "EXPENSE", label: "Expenses", icon: Wallet },
  { key: "PROJECT", label: "Projects", icon: FolderKanban },
  { key: "CLIENT", label: "Clients", icon: Building2 },
];

export default function TrashPage() {
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<TrashItem[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<TrashItem | null>(null);
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/trash/stats");
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.warn("Could not fetch trash stats:", err);
    }
  }, []);

  const fetchTrashItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("page", String(page));
      params.set("limit", "25");

      const res = await fetch(`/api/v1/trash?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data.items || []);
        setTotalPages(json.data.pagination?.totalPages || 1);
        setTotalCount(json.data.pagination?.total || 0);
      }
    } catch (err) {
      toast.error("Failed to Load Trash", "Could not load deleted items.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, page, toast]);

  useEffect(() => {
    fetchStats();
    fetchTrashItems();
  }, [fetchStats, fetchTrashItems]);

  const handleRestore = async (item: TrashItem) => {
    setRestoringId(item.id);
    try {
      const res = await fetch(`/api/v1/trash/${item.id}/restore`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Restore failed");
      }

      toast.success("Restored Successfully", `${item.title} has been restored back to active software records.`);
      await fetchStats();
      await fetchTrashItems();
    } catch (err: any) {
      toast.error("Restore Failed", err.message || "Failed to restore record");
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    if (!confirm(`Are you sure you want to permanently purge "${item.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/v1/trash/${item.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Delete failed");
      }

      toast.success("Purged Permanently", "Item removed permanently from recycle bin.");
      await fetchStats();
      await fetchTrashItems();
    } catch (err: any) {
      toast.error("Delete Failed", err.message || "Failed to purge item");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEmptyTrash = async () => {
    setIsEmptyingTrash(true);
    try {
      const url = selectedCategory === "ALL" ? "/api/v1/trash" : `/api/v1/trash?category=${selectedCategory}`;
      const res = await fetch(url, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Empty trash failed");
      }

      toast.success("Trash Emptied", json.data?.message || "Trash cleared.");
      setShowEmptyModal(false);
      await fetchStats();
      await fetchTrashItems();
    } catch (err: any) {
      toast.error("Empty Trash Failed", err.message || "Failed to empty trash");
    } finally {
      setIsEmptyingTrash(false);
    }
  };

  const getCategoryCount = (key: string) => {
    if (key === "ALL") return stats.all || 0;
    return (stats as any)[key.toLowerCase()] || 0;
  };

  const getEntityTypeBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case "LEAD":
        return <Badge variant="active" className="font-bold text-[10px]">LEAD</Badge>;
      case "QUOTATION":
        return <Badge variant="pending" className="font-bold text-[10px]">QUOTATION</Badge>;
      case "INVOICE":
        return <Badge variant="completed" className="font-bold text-[10px]">INVOICE</Badge>;
      case "PAYMENT":
        return <Badge variant="completed" className="font-bold text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300">PAYMENT</Badge>;
      case "EXPENSE":
        return <Badge variant="warning" className="font-bold text-[10px]">EXPENSE</Badge>;
      case "PROJECT":
        return <Badge variant="neutral" className="font-bold text-[10px]">PROJECT</Badge>;
      default:
        return <Badge variant="neutral" className="font-bold text-[10px]">{type}</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1700px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
              <Trash2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Trash &amp; Recycle Bin</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {stats.all || 0} items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centrally view, recover, or permanently purge deleted records across Leads, Quotations, Invoices, Payments, and Expenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { fetchStats(); fetchTrashItems(); }}
            className="text-xs h-8 gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          {totalCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEmptyModal(true)}
              className="text-xs h-8 gap-1.5 bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 font-bold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Empty {selectedCategory === "ALL" ? "All Trash" : selectedCategory}
            </Button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.key;
          const count = getCategoryCount(cat.key);
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.key);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deleted records by reference, title, client name, reason..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full h-9 pl-9 pr-4 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 text-slate-900 shadow-2xs"
          />
        </div>
      </div>

      {/* Trash Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="text-xs font-medium">Loading deleted records...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
              <Trash2 className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recycle Bin is Empty</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedCategory === "ALL"
                  ? "No deleted items in the software. Everything is clean!"
                  : `No deleted items found under ${selectedCategory}.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Deleted Date</th>
                  <th className="py-3 px-3">Deleted By / Reason</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-[11px] text-slate-500 truncate max-w-md">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {getEntityTypeBadge(item.entityType)}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {item.amount !== null && item.amount !== undefined && item.amount > 0 ? (
                        formatCurrency(item.amount)
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-[11px] font-medium text-slate-700">
                        {formatDate(item.deletedAt)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatRelativeTime(item.deletedAt)}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-[11px] font-medium text-slate-700">
                        {item.deletedBy?.fullName || "System Admin"}
                      </div>
                      {item.reason && (
                        <div className="text-[10px] text-slate-500 truncate max-w-xs italic">
                          "{item.reason}"
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingItem(item)}
                          className="text-[11px] py-1 h-7 bg-white text-slate-700 border-slate-300 hover:bg-slate-50 font-medium cursor-pointer"
                          title="View Snapshot"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>

                        <Button
                          size="sm"
                          variant="primary"
                          disabled={restoringId === item.id}
                          onClick={() => handleRestore(item)}
                          className="text-[11px] py-1 h-7 bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1 cursor-pointer shadow-2xs"
                          title="Restore back to active software records"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${restoringId === item.id ? "animate-spin" : ""}`} />
                          {restoringId === item.id ? "Restoring..." : "Restore"}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={deletingId === item.id}
                          onClick={() => handlePermanentDelete(item)}
                          className="text-[11px] py-1 h-7 bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-400 font-bold cursor-pointer"
                          title="Permanently Purge"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-600">
            <div>
              Showing page <strong className="text-slate-900">{page}</strong> of <strong className="text-slate-900">{totalPages}</strong> ({totalCount} total items)
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="text-xs h-7 gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="text-xs h-7 gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Snapshot Modal */}
      {viewingItem && (
        <Modal
          isOpen={!!viewingItem}
          onClose={() => setViewingItem(null)}
          title={`Archived Snapshot: ${viewingItem.title}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Entity Type</span>
                <span className="font-bold text-slate-800">{viewingItem.entityType}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Amount</span>
                <span className="font-bold font-mono text-emerald-700">
                  {viewingItem.amount ? formatCurrency(viewingItem.amount) : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Deleted Date</span>
                <span className="font-medium text-slate-800">{formatDate(viewingItem.deletedAt)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Deleted By</span>
                <span className="font-medium text-slate-800">{viewingItem.deletedBy?.fullName || "System Admin"}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-700 block mb-1">Archived JSON Payload:</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto max-h-72 border border-slate-800">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(viewingItem.payload), null, 2);
                  } catch {
                    return viewingItem.payload;
                  }
                })()}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button size="sm" variant="outline" onClick={() => setViewingItem(null)}>
                Close
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={async () => {
                  await handleRestore(viewingItem);
                  setViewingItem(null);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore This Record
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Empty Trash Confirmation Modal */}
      {showEmptyModal && (
        <Modal
          isOpen={showEmptyModal}
          onClose={() => setShowEmptyModal(false)}
          title="Empty Recycle Bin"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-900">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block">Irreversible Permanent Purge</strong>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Are you sure you want to permanently clear all items from{" "}
                  <strong>{selectedCategory === "ALL" ? "the entire Recycle Bin" : `category: ${selectedCategory}`}</strong>?
                  Once emptied, these snapshots cannot be restored.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button size="sm" variant="ghost" onClick={() => setShowEmptyModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={isEmptyingTrash}
                onClick={handleEmptyTrash}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isEmptyingTrash ? "Purging..." : "Permanently Empty Trash"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
