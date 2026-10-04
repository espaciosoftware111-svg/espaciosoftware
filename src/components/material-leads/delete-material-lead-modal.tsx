"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Trash2,
  Lock,
  Search,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  CheckSquare,
  Square,
  X,
  Boxes,
} from "lucide-react";

export interface DeleteMaterialLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLeadId?: string | null;
  initialLeadIds?: string[];
}

const DEFAULT_LEAD_IDS: string[] = [];

export const DeleteMaterialLeadModal: React.FC<DeleteMaterialLeadModalProps> = ({
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

  // Fetch material leads for the searchable list
  const fetchAvailableLeads = useCallback(async (query: string = "") => {
    setIsLoadingLeads(true);
    try {
      const params = new URLSearchParams({
        limit: "100",
        ...(query.trim() ? { search: query.trim() } : {}),
      });
      const res = await fetch(`/api/v1/material-leads?${params.toString()}`);
      const json = await res.json();
      const rawLeads = json?.data || (Array.isArray(json) ? json : []);
      if (Array.isArray(rawLeads)) {
        setAvailableLeads(rawLeads);
        return rawLeads;
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
          const foundIds = new Set(preselected.map((l) => l.id));
          const missingIds = Array.from(idsToPreselect).filter((id) => !foundIds.has(id));

          if (missingIds.length > 0) {
            Promise.all(
              missingIds.map((id) =>
                fetch(`/api/v1/material-leads/${id}`)
                  .then((r) => r.json())
                  .then((j) => (j.success ? j.data.materialLead || j.data.lead || j.data : null))
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
      setErrorMessage("Please select at least one material lead to delete.");
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
      const res = await fetch("/api/v1/material-leads/bulk-delete", {
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
        const err = json.error?.message || "Failed to delete material lead(s). Check password and try again.";
        setErrorMessage(err);
        return;
      }

      const count = json.data?.deletedCount || selectedLeads.length;
      toast.success(
        "Material Leads Permanently Deleted",
        `Successfully removed ${count} material lead record(s).`
      );

      onClose();
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "A network error occurred while deleting material leads.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    const s = (status || "NEW").toUpperCase();
    switch (s) {
      case "NEW":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "CONTACTED":
        return "bg-teal-50 text-teal-800 border-teal-200";
      case "MATERIAL_REQUIRED":
      case "REQUIREMENT_DISCUSSED":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "QUOTATION_GENERATED":
      case "QUOTATION_IN_PROGRESS":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "QUOTATION_SENT":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "CONFIRMATION_FEE_PAID":
      case "ORDER_CONFIRMED":
      case "ORDER_COMPLETED":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "LOST":
      case "CANCELLED":
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
      title="Delete Material Leads Authorization"
      description="Select one or multiple material leads to permanently delete from CRM pipeline"
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
              Deleting material leads permanently clears all material requirements, quotation linkages, follow-ups, timeline logs, and vendor requests. This action requires administrator password confirmation.
            </p>
          </div>
        </div>

        {/* Lead Selector Header & Search */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Select Material Lead(s) to Delete <span className="text-rose-600">*</span>
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
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter available material leads by reference ID, customer, phone, location..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
            />
          </div>
        </div>

        {/* Selected Chips Strip */}
        {selectedCount > 0 && (
          <div className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-rose-900">
              <span>Selected for Deletion ({selectedCount})</span>
              <span className="font-normal text-rose-700">Click &apos;x&apos; to deselect</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
              {selectedLeads.map((l) => (
                <span
                  key={l.id}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-white border border-rose-200 text-rose-900 shadow-2xs"
                >
                  <span className="font-mono font-bold">{l.materialLeadId || l.referenceNo}</span>
                  <span className="text-slate-600">({l.customerName || l.clientName})</span>
                  <button
                    type="button"
                    onClick={() => removeLeadFromSelection(l.id)}
                    className="text-rose-400 hover:text-rose-700 p-0.5 rounded cursor-pointer"
                    title="Remove from selection"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Searchable Leads Checklist */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-100/70 px-3 py-2 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>Available Material Leads Directory</span>
            <span>{availableLeads.length} record(s)</span>
          </div>

          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
            {isLoadingLeads ? (
              <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                Loading material leads...
              </div>
            ) : availableLeads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching material leads found.
              </div>
            ) : (
              availableLeads.map((lead) => {
                const isSelected = selectedLeads.some((l) => l.id === lead.id);
                return (
                  <div
                    key={lead.id}
                    onClick={() => toggleLeadSelection(lead)}
                    className={`px-3 py-2.5 flex items-center justify-between gap-3 text-xs cursor-pointer transition ${
                      isSelected
                        ? "bg-rose-50/70 hover:bg-rose-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0 text-slate-400">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-rose-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            {lead.materialLeadId || lead.referenceNo}
                          </span>
                          <span className="font-semibold text-slate-800 truncate">
                            {lead.customerName || lead.clientName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-mono">{lead.primaryContact || lead.phone}</span>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{lead.requirement || "Materials Supply"}</span>
                          {lead.location && (
                            <>
                              <span>•</span>
                              <span>{lead.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap capitalize ${getStatusBadgeClass(
                          lead.status || lead.stage
                        )}`}
                      >
                        ● {(lead.status || lead.stage || "NEW").replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Admin Password Input */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            Enter Admin Password <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                setErrorMessage("");
              }}
              placeholder="Confirm your Admin / Super Admin password..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            For security, bulk or single lead deletion strictly validates credentials against active system administrators.
          </p>
        </div>

        {/* Error Feedback Message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {selectedCount > 0 ? (
              <span className="font-semibold text-rose-700">
                {selectedCount} material lead(s) will be permanently deleted
              </span>
            ) : (
              <span>No leads selected</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={selectedCount === 0 || !adminPassword.trim() || isDeleting}
              isLoading={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              {isDeleting
                ? "Deleting..."
                : selectedCount > 1
                ? `Delete ${selectedCount} Leads Permanently`
                : "Delete Lead Permanently"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
