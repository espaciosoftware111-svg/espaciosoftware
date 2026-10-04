"use client";

import React, { useState, useEffect } from "react";
import { CreateMaterialRequestModal } from "@/components/procurement/create-material-request-modal";
import { MaterialRequestDetailModal } from "@/components/procurement/material-request-detail-modal";

import { clientCache } from "@/lib/client-cache";

interface MRItem {
  id: string;
  referenceNo: string;
  requester?: { fullName: string };
  project?: { referenceNo: string; title: string };
  requiredDate: string;
  priority: string;
  purposeKey: string;
  status: string;
  items?: any[];
  createdAt: string;
}

export default function MaterialRequestsPage() {
  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");

  const cacheKey = `/api/v1/procurement/material-requests?search=${encodeURIComponent(search)}${statusFilter ? `&status=${statusFilter}` : ""}${priorityFilter ? `&priority=${priorityFilter}` : ""}`;
  const initialCached = clientCache.getImmediate<any>(cacheKey);

  const [requests, setRequests] = useState<MRItem[]>(() => initialCached?.data || []);
  const [loading, setLoading] = useState(!initialCached);
  const isMountedRef = React.useRef(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMRId, setSelectedMRId] = useState<string | null>(null);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      fetchRequests(!!initialCached);
      return;
    }
    fetchRequests(false);
  }, [statusFilter, priorityFilter, search]);

  async function fetchRequests(isBackground = false) {
    if (!isBackground) setLoading(true);
    try {
      let url = `/api/v1/procurement/material-requests?search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (priorityFilter) url += `&priority=${priorityFilter}`;

      const json = await clientCache.fetchWithCache<any>(url, {
        onBackgroundUpdate: (freshJson) => {
          if (freshJson?.data) {
            setRequests(freshJson.data || []);
          }
        },
      });

      if (json?.data) {
        setRequests(json.data || []);
      }
    } catch (e) {
      console.error("Failed to load material requests", e);
    } finally {
      setLoading(false);
    }
  }

  function getPriorityBadge(p: string) {
    switch (p) {
      case "URGENT":
        return <span className="rounded bg-rose-100 px-2 py-0.5 font-bold text-rose-800 text-[10px]">URGENT</span>;
      case "HIGH":
        return <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-800 text-[10px]">HIGH</span>;
      case "MEDIUM":
        return <span className="rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-700 text-[10px]">MEDIUM</span>;
      default:
        return <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 text-[10px]">LOW</span>;
    }
  }

  function getStatusBadge(s: string) {
    switch (s) {
      case "APPROVED":
        return <span className="rounded bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700 text-xs">APPROVED</span>;
      case "ORDERED":
        return <span className="rounded bg-blue-50 px-2.5 py-0.5 font-bold text-blue-700 text-xs">ORDERED</span>;
      case "SUBMITTED":
        return <span className="rounded bg-amber-50 px-2.5 py-0.5 font-bold text-amber-700 text-xs">SUBMITTED</span>;
      case "REJECTED":
        return <span className="rounded bg-rose-50 px-2.5 py-0.5 font-bold text-rose-700 text-xs">REJECTED</span>;
      default:
        return <span className="rounded bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-600 text-xs">{s}</span>;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Procurement Subsystem</span>
            <span>•</span>
            <span className="text-emerald-600">Material Requisitions</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Material Requests Directory
          </h1>
          <p className="text-sm text-walnut">
            Site material requisitions, items count, priority flags, and approval workflow.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-md bg-gold px-4 py-2 text-xs font-bold text-charcoal shadow-gold hover:bg-gold-hover transition cursor-pointer"
        >
          + Create Material Request
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search MR number or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchRequests(false)}
            className="w-full sm:w-72 rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="ORDERED">ORDERED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">URGENT</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden relative">
        {/* Progress bar during background refresh */}
        {loading && requests.length > 0 && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-100 overflow-hidden z-20">
            <div className="h-full bg-emerald-600 animate-pulse w-full" />
          </div>
        )}

        {loading && requests.length === 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">MR Number</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Requester</th>
                  <th className="px-4 py-3">Project Reference</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3 text-center">Priority</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-mr-${i}`}>
                    <td className="px-4 py-3.5"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-4 w-16 bg-slate-200 rounded mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="h-4 w-16 bg-slate-200 rounded mx-auto" /></td>
                    <td className="px-4 py-3.5 text-right"><div className="h-4 w-12 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No material requests created yet. Click <strong>+ Create Material Request</strong> above.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">MR Number</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Required Date</th>
                <th className="px-4 py-3 text-center">Priority</th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {requests.map((mr) => (
                <tr key={mr.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{mr.referenceNo}</td>
                  <td className="px-4 py-3">{new Date(mr.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-900 font-bold">{mr.requester?.fullName || "Site User"}</td>
                  <td className="px-4 py-3 text-slate-700">{mr.project?.title || "General Stock"}</td>
                  <td className="px-4 py-3 font-mono">{new Date(mr.requiredDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center">{getPriorityBadge(mr.priority)}</td>
                  <td className="px-4 py-3 text-center font-bold font-mono">{mr.items?.length || 0}</td>
                  <td className="px-4 py-3">{getStatusBadge(mr.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedMRId(mr.id)}
                      className="text-emerald-600 hover:text-emerald-800 font-semibold"
                    >
                      View Requisition →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <CreateMaterialRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchRequests}
      />
      <MaterialRequestDetailModal
        isOpen={selectedMRId !== null}
        mrId={selectedMRId}
        onClose={() => setSelectedMRId(null)}
        onRefresh={fetchRequests}
      />
    </div>
  );
}
