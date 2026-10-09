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

  const getStageBadgeInfo = (stage?: string) => {
    switch (stage) {
      case "NEW":
        return {
          emoji: "🌱",
          label: "New Lead",
          className: "bg-[#F0F7F2] text-[#21613A] border-[#D4E8DC]",
        };
      case "CONTACTED":
        return {
          emoji: "💬",
          label: "Contacted",
          className: "bg-[#F0F6FC] text-[#1E5788] border-[#D4E4F5]",
        };
      case "NOT_CONTACTED":
        return {
          emoji: "⏳",
          label: "Not Contacted",
          className: "bg-[#FEF9EC] text-[#865E12] border-[#F6E8BF]",
        };
      case "FOLLOW_UP_SCHEDULED":
        return {
          emoji: "📅",
          label: "Follow-up",
          className: "bg-[#F0F4FE] text-[#2C4892] border-[#D7E2FA]",
        };
      case "SITE_VISIT_SCHEDULED":
        return {
          emoji: "📍",
          label: "Site Visit",
          className: "bg-[#F7F2FC] text-[#59348F] border-[#E6DAF7]",
        };
      case "SITE_VISIT_COMPLETED":
        return {
          emoji: "📐",
          label: "Site Inspected",
          className: "bg-[#EFF8F7] text-[#16605B] border-[#D1EFE9]",
        };
      case "QUOTATION_IN_PROGRESS":
        return {
          emoji: "📝",
          label: "Estimating",
          className: "bg-[#FAF5E8] text-[#7A5816] border-[#EEDEBC]",
        };
      case "QUOTATION_SENT":
      case "ESTIMATE_SENT":
        return {
          emoji: "📨",
          label: "Quote Sent",
          className: "bg-[#F0F9F5] text-[#1B5E48] border-[#D1EEDE]",
        };
      case "NEGOTIATION":
        return {
          emoji: "🤝",
          label: "Negotiation",
          className: "bg-[#F3F1FA] text-[#463887] border-[#DFD9F3]",
        };
      case "WON":
        return {
          emoji: "🎉",
          label: "Won",
          className: "bg-[#ECF7ED] text-[#185E30] border-[#C8E8CB]",
        };
      case "PROJECT_CREATED":
        return {
          emoji: "🚀",
          label: "Project Created",
          className: "bg-[#E9F5EB] text-[#145328] border-[#C0E3C5]",
        };
      case "LOST":
        return {
          emoji: "🍂",
          label: "Lost",
          className: "bg-[#FDF2F2] text-[#8C3030] border-[#F7D3D3]",
        };
      default:
        return {
          emoji: "📋",
          label: stage ? stage.replace(/_/g, " ") : "Pending",
          className: "bg-[#F5F2EC] text-[#5C564E] border-[#E4DFD6]",
        };
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
                      {(() => {
                        const badge = getStageBadgeInfo(item.stage);
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.className}`}
                          >
                            <span className="text-[11px] leading-none select-none">{badge.emoji}</span>
                            <span>{badge.label}</span>
                          </span>
                        );
                      })()}
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
