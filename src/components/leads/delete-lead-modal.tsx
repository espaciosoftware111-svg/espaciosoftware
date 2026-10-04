"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Trash2,
  AlertTriangle,
  Lock,
  Search,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  CheckSquare,
  Square,
  X,
  Layers,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface DeleteLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLeadId?: string | null;
  initialLeadIds?: string[];
}

const DEFAULT_LEAD_IDS: string[] = [];

export const DeleteLeadModal: React.FC<DeleteLeadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialLeadId = null,
  initialLeadIds = DEFAULT_LEAD_IDS,
}) => {
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [availableLeads, setAvailableLeads] = useState<any[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<any[]>([]);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const initialLeadIdsKey = (initialLeadIds || []).join(",");

  // Fetch leads for the searchable list
  const fetchAvailableLeads = useCallback(async (query: string = "") => {
    setIsLoadingLeads(true);
    try {
      const params = new URLSearchParams({
        limit: "100",
        ...(query.trim() ? { search: query.trim() } : {}),
      });
      const res = await fetch(`/api/v1/leads?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAvailableLeads(json.data);
        return json.data;
      }
    } catch {
      // quiet fallback
    } finally {
      setIsLoadingLeads(false);
    }
    return [];
  }, []);

  // Initialize or reset state on open
  useEffect(() => {
    if (isOpen) {
      setAdminPassword("");
      setShowPassword(false);
      setErrorMessage("");
      setSearchQuery("");

      const idsToPreselect = new Set<string>();
      if (initialLeadId) idsToPreselect.add(initialLeadId);
      if (initialLeadIds && initialLeadIds.length > 0) {
        initialLeadIds.forEach((id) => idsToPreselect.add(id));
      }

      fetchAvailableLeads().then((leads) => {
        if (idsToPreselect.size > 0 && Array.isArray(leads)) {
          const preselected = leads.filter((l) => idsToPreselect.has(l.id));
          // If some leads weren't in the top 100, fetch missing ones directly
          const foundIds = new Set(preselected.map((l) => l.id));
          const missingIds = Array.from(idsToPreselect).filter((id) => !foundIds.has(id));

          if (missingIds.length > 0) {
            Promise.all(
              missingIds.map((id) =>
                fetch(`/api/v1/leads/${id}`)
                  .then((r) => r.json())
                  .then((j) => (j.success ? j.data.lead : null))
                  .catch(() => null)
              )
            ).then((fetchedMissing) => {
              const allSelected = [
                ...preselected,
                ...fetchedMissing.filter(Boolean),
              ];
              setSelectedLeads(allSelected);
            });
          } else {
            setSelectedLeads(preselected);
          }
        } else {
          setSelectedLeads([]);
        }
      });
    } else {
      setSelectedLeads([]);
      setAdminPassword("");
      setErrorMessage("");
    }
  }, [isOpen, initialLeadId, initialLeadIdsKey, fetchAvailableLeads]);

  // Debounced search when user types
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchAvailableLeads(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, fetchAvailableLeads]);

  const toggleLeadSelection = (lead: any) => {
    setErrorMessage("");
    setSelectedLeads((prev) => {
      const exists = prev.some((l) => l.id === lead.id);
      if (exists) {
        return prev.filter((l) => l.id !== lead.id);
      } else {
        return [...prev, lead];
      }
    });
  };

  const removeLeadFromSelection = (leadId: string) => {
    setSelectedLeads((prev) => prev.filter((l) => l.id !== leadId));
  };

  const handleSelectAllFiltered = () => {
    setErrorMessage("");
    setSelectedLeads((prev) => {
      const currentSelectedMap = new Map(prev.map((l) => [l.id, l]));
      availableLeads.forEach((l) => currentSelectedMap.set(l.id, l));
      return Array.from(currentSelectedMap.values());
    });
  };

  const handleDeselectAll = () => {
    setSelectedLeads([]);
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLeads.length === 0) {
      setErrorMessage("Please select at least one lead to delete.");
      return;
    }

    if (!adminPassword.trim()) {
      setErrorMessage("Admin password is required to confirm deletion.");
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const leadIds = selectedLeads.map((l) => l.id);
      const res = await fetch("/api/v1/leads/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadIds,
          adminPassword: adminPassword.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const err = json.error?.message || "Failed to delete lead(s). Check password and try again.";
        setErrorMessage(err);
        return;
      }

      const count = json.data?.deletedCount || selectedLeads.length;
      toast.success(
        "Leads Permanently Deleted",
        `Successfully removed ${count} lead record(s).`
      );

      onClose();
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "A network error occurred while deleting leads.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStageBadgeClass = (stage?: string) => {
    switch (stage) {
      case "NEW":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "CONTACTED":
        return "bg-teal-50 text-teal-800 border-teal-200";
      case "NOT_CONTACTED":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "FOLLOW_UP_SCHEDULED":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "SITE_VISIT_SCHEDULED":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "SITE_VISIT_COMPLETED":
        return "bg-cyan-50 text-cyan-800 border-cyan-200";
      case "QUOTATION_IN_PROGRESS":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "QUOTATION_SENT":
      case "ESTIMATE_SENT":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "NEGOTIATION":
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "WON":
      case "PROJECT_CREATED":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "LOST":
        return "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const selectedCount = selectedLeads.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Leads Authorization"
      description="Select one or multiple leads to permanently delete from CRM pipeline"
      maxWidth="lg"
    >
      <form onSubmit={handleDelete} className="space-y-4">
        {/* Warning Alert Banner */}
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
          <div className="p-1.5 bg-rose-100 text-rose-700 rounded-md shrink-0 mt-0.5">
            <Trash2 className="w-4 h-4" />
          </div>
          <div className="text-xs text-rose-950 space-y-0.5">
            <span className="font-bold text-rose-900 block text-xs">
              Permanent Administrative Deletion
            </span>
            <p className="text-rose-800 leading-relaxed text-[11px]">
              Deleting leads permanently clears all contact history, timeline logs, scheduled follow-ups, and site visits. This action requires administrator password confirmation.
            </p>
          </div>
        </div>

        {/* Lead Selector Header & Search */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Select Lead(s) to Delete <span className="text-rose-600">*</span>
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline"
              >
                Select All Filtered
              </button>
              {selectedCount > 0 && (
                <>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-slate-500 hover:text-rose-600 cursor-pointer"
                  >
                    Clear Selection
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Lead ID, Customer Name, Phone, Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900"
            />
          </div>

          {/* Scrollable Lead List with Multi-select Checkboxes */}
          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100 bg-white shadow-2xs">
            {isLoadingLeads ? (
              <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                <span>Loading available leads...</span>
              </div>
            ) : availableLeads.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No leads found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              availableLeads.map((item) => {
                const isSelected = selectedLeads.some((l) => l.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleLeadSelection(item)}
                    className={`p-2 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-rose-50/80 border-l-4 border-rose-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="shrink-0 text-slate-400 hover:text-rose-600">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-rose-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {item.referenceNo}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {item.clientName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                          <span>{item.phone}</span>
                          {item.location && (
                            <span className="truncate max-w-[150px]">📍 {item.location}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getStageBadgeClass(
                          item.stage
                        )}`}
                      >
                        {(item.stage || "NEW").replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Leads Chips & Count */}
        {selectedCount > 0 && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-rose-600" />
                Target Leads for Deletion ({selectedCount})
              </span>
              <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full">
                {selectedCount} Selected
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {selectedLeads.map((item) => (
                <div
                  key={item.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-rose-200 rounded text-[11px] text-slate-800 shadow-2xs"
                >
                  <span className="font-mono font-bold text-rose-700">{item.referenceNo}</span>
                  <span className="truncate max-w-[120px] font-medium">{item.clientName}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLeadFromSelection(item.id);
                    }}
                    className="p-0.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Password Authentication Field */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Admin Password <span className="text-rose-600">*</span>
            </label>
            <span className="text-[10px] text-slate-500">Security Check</span>
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                setErrorMessage("");
              }}
              placeholder="Enter administrator password..."
              className="w-full h-8 pl-9 pr-10 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-slate-900 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            Enter your account password (if Admin) or system administrator password.
          </p>
        </div>

        {/* Inline Error Display */}
        {errorMessage && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="danger"
            size="sm"
            disabled={selectedCount === 0 || !adminPassword.trim() || isDeleting}
            isLoading={isDeleting}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
          >
            {isDeleting
              ? `Deleting ${selectedCount} Lead(s)...`
              : selectedCount > 1
              ? `Confirm & Delete ${selectedCount} Leads`
              : selectedCount === 1
              ? "Confirm & Delete Lead"
              : "Delete Selected Leads"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
