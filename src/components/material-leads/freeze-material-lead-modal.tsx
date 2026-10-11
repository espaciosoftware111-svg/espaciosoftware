"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Snowflake,
  RotateCcw,
  Search,
  Loader2,
  CheckSquare,
  Square,
  X,
  Boxes,
  ShieldCheck,
} from "lucide-react";

export interface FreezeMaterialLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLeadId?: string | null;
  initialLeadIds?: string[];
  initialMode?: "freeze" | "unfreeze";
}

const DEFAULT_LEAD_IDS: string[] = [];

export const FreezeMaterialLeadModal: React.FC<FreezeMaterialLeadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialLeadId = null,
  initialLeadIds = DEFAULT_LEAD_IDS,
  initialMode = "freeze",
}) => {
  const toast = useToast();

  const [isFreezeMode, setIsFreezeMode] = useState(initialMode === "freeze");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableLeads, setAvailableLeads] = useState<any[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<any[]>([]);
  const [freezeReason, setFreezeReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
      // fallback
    } finally {
      setIsLoadingLeads(false);
    }
    return [];
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsFreezeMode(initialMode === "freeze");
      setFreezeReason("");
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
              const validMissing = fetchedMissing.filter(Boolean);
              setSelectedLeads([...preselected, ...validMissing]);
            });
          } else {
            setSelectedLeads(preselected);
          }
        } else {
          setSelectedLeads([]);
        }
      });
    }
  }, [isOpen, initialLeadId, initialLeadIds, initialMode, fetchAvailableLeads]);

  const toggleSelectLead = (lead: any) => {
    setSelectedLeads((prev) => {
      const exists = prev.some((l) => l.id === lead.id);
      if (exists) {
        return prev.filter((l) => l.id !== lead.id);
      } else {
        return [...prev, lead];
      }
    });
  };

  const selectAllFiltered = () => {
    const newItems = availableLeads.filter(
      (al) => !selectedLeads.some((sl) => sl.id === al.id)
    );
    setSelectedLeads((prev) => [...prev, ...newItems]);
  };

  const clearSelection = () => {
    setSelectedLeads([]);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLeads.length === 0) {
      setErrorMessage("Please select at least one material lead.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/v1/material-leads/freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: selectedLeads.map((l) => l.id),
          freeze: isFreezeMode,
          reason: freezeReason.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.error?.message || json.message || "Action failed");
        return;
      }

      toast.success(
        isFreezeMode ? "Material Leads Frozen / Archived" : "Material Leads Unfrozen / Restored",
        json.message || `Successfully updated ${selectedLeads.length} material lead(s).`
      );

      onSuccess();
      onClose();
    } catch {
      setErrorMessage("Network error during operation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isFreezeMode ? "Freeze / Archive Material Lead(s)" : "Unfreeze / Restore Material Lead(s)"}
      maxWidth="xl"
    >
      <form onSubmit={handleAction} className="space-y-4">
        {/* Info Banner */}
        <div className="flex items-start gap-3 p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs text-[#166534]">
          <ShieldCheck className="w-5 h-5 shrink-0 text-[#16a34a] mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#14532d]">
              {isFreezeMode ? "Safe Freeze & Archive" : "Active Restoration"}
            </p>
            <p className="text-[#15803d] leading-relaxed text-[11px]">
              {isFreezeMode
                ? "Freezing archives the material lead and associated vendor quotes and requirement specifications with zero data loss. It can be restored anytime."
                : "Unfreezing restores the material lead to the active procurement pipeline."}
            </p>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex items-center gap-2 p-1 bg-[#F3EEE5] rounded-lg border border-[#E8E2D8] text-xs">
          <button
            type="button"
            onClick={() => setIsFreezeMode(true)}
            className={`flex-1 py-1.5 px-3 rounded-md font-semibold transition flex items-center justify-center gap-1.5 ${
              isFreezeMode
                ? "bg-[#FFFEFC] text-[#262421] shadow-2xs"
                : "text-[#77716A] hover:text-[#262421]"
            }`}
          >
            <Snowflake className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>Freeze / Archive</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFreezeMode(false)}
            className={`flex-1 py-1.5 px-3 rounded-md font-semibold transition flex items-center justify-center gap-1.5 ${
              !isFreezeMode
                ? "bg-[#FFFEFC] text-[#262421] shadow-2xs"
                : "text-[#77716A] hover:text-[#262421]"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Unfreeze / Restore</span>
          </button>
        </div>

        {/* Selected Leads Pill Box */}
        {selectedLeads.length > 0 && (
          <div className="space-y-2 p-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#262421]">
                Selected Material Leads ({selectedLeads.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {selectedLeads.map((l) => (
                <div
                  key={l.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFFEFC] border border-[#E8E2D8] text-xs font-medium text-[#262421]"
                >
                  <Boxes className="w-3 h-3 text-[#77716A]" />
                  <span className="font-mono text-[11px] text-[#77716A]">{l.referenceNo || l.materialLeadId}</span>
                  <span className="truncate max-w-[140px]">{l.clientName || l.contactPerson}</span>
                  <button
                    type="button"
                    onClick={() => toggleSelectLead(l)}
                    className="p-0.5 text-[#77716A] hover:text-[#DC2626] rounded-full"
                    title="Remove selection"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Lead Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-[#262421]">Search & Select Material Leads</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllFiltered}
                className="text-[11px] text-[#89652D] hover:underline font-medium"
              >
                Select All
              </button>
              <span className="text-[#E8E2D8]">|</span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-[11px] text-[#77716A] hover:text-[#262421]"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#77716A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ID, Contact, Phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchAvailableLeads(e.target.value);
              }}
              className="w-full h-9 pl-9 pr-3 text-xs bg-[#FFFEFC] border border-[#E8E2D8] rounded-lg text-[#262421] placeholder-[#77716A] focus:outline-none focus:border-[#89652D]"
            />
          </div>

          {/* Search Results List */}
          <div className="max-h-40 overflow-y-auto border border-[#E8E2D8] rounded-lg divide-y divide-[#E8E2D8] bg-[#FFFEFC]">
            {isLoadingLeads ? (
              <div className="p-4 text-center text-xs text-[#77716A] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#89652D]" />
                <span>Loading material leads...</span>
              </div>
            ) : availableLeads.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#77716A]">
                No matching material leads found.
              </div>
            ) : (
              availableLeads.map((l) => {
                const isSelected = selectedLeads.some((sl) => sl.id === l.id);
                return (
                  <div
                    key={l.id}
                    onClick={() => toggleSelectLead(l)}
                    className={`p-2 flex items-center justify-between text-xs cursor-pointer transition ${
                      isSelected ? "bg-[#FAF8F5]" : "hover:bg-[#FAF8F5]/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#89652D] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-[#77716A] shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-[#262421]">
                            {l.referenceNo || l.materialLeadId}
                          </span>
                          <span className="font-medium text-[#262421] truncate">
                            {l.clientName || l.contactPerson}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#77716A] block">
                          {l.phone} • Status: {l.status || l.stage}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Reason / Remarks */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#262421] block">
            Archive Remarks (Optional)
          </label>
          <textarea
            value={freezeReason}
            onChange={(e) => setFreezeReason(e.target.value)}
            placeholder="e.g., Procurement postponed, vendor quota fulfilled..."
            rows={2}
            className="w-full p-2.5 text-xs bg-[#FFFEFC] border border-[#E8E2D8] rounded-lg text-[#262421] placeholder-[#77716A] focus:outline-none focus:border-[#89652D] resize-none"
          />
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626]">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D8]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <button
            type="submit"
            disabled={isSubmitting || selectedLeads.length === 0}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white shadow-2xs transition disabled:opacity-50 disabled:cursor-not-allowed ${
              isFreezeMode
                ? "bg-[#0284C7] hover:bg-[#0369A1]"
                : "bg-[#16A34A] hover:bg-[#15803D]"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isFreezeMode ? (
              <Snowflake className="w-3.5 h-3.5" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            <span>
              {isSubmitting
                ? "Processing..."
                : isFreezeMode
                ? `Freeze & Archive (${selectedLeads.length})`
                : `Unfreeze & Restore (${selectedLeads.length})`}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
