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
  FolderKanban,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProjectId?: string | null;
  initialProjectIds?: string[];
}

const DEFAULT_PROJECT_IDS: string[] = [];

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProjectId = null,
  initialProjectIds = DEFAULT_PROJECT_IDS,
}) => {
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<any[]>([]);
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const initialProjectIdsKey = (initialProjectIds || []).join(",");

  // Fetch projects for the searchable list
  const fetchAvailableProjects = useCallback(async (query: string = "") => {
    setIsLoadingProjects(true);
    try {
      const params = new URLSearchParams({
        limit: "100",
        ...(query.trim() ? { search: query.trim() } : {}),
      });
      const res = await fetch(`/api/v1/projects?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAvailableProjects(json.data);
        return json.data;
      }
    } catch {
      // quiet fallback
    } finally {
      setIsLoadingProjects(false);
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
      if (initialProjectId) idsToPreselect.add(initialProjectId);
      if (initialProjectIds && initialProjectIds.length > 0) {
        initialProjectIds.forEach((id) => idsToPreselect.add(id));
      }

      fetchAvailableProjects().then((projects) => {
        if (idsToPreselect.size > 0 && Array.isArray(projects)) {
          const preselected = projects.filter((p) => idsToPreselect.has(p.id));
          const foundIds = new Set(preselected.map((p) => p.id));
          const missingIds = Array.from(idsToPreselect).filter((id) => !foundIds.has(id));

          if (missingIds.length > 0) {
            Promise.all(
              missingIds.map((id) =>
                fetch(`/api/v1/projects/${id}`)
                  .then((r) => r.json())
                  .then((j) => (j.success ? j.data : null))
                  .catch(() => null)
              )
            ).then((fetchedMissing) => {
              const allSelected = [
                ...preselected,
                ...fetchedMissing.filter(Boolean),
              ];
              setSelectedProjects(allSelected);
            });
          } else {
            setSelectedProjects(preselected);
          }
        } else {
          setSelectedProjects([]);
        }
      });
    } else {
      setSelectedProjects([]);
      setAdminPassword("");
      setErrorMessage("");
    }
  }, [isOpen, initialProjectId, initialProjectIdsKey, fetchAvailableProjects]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchAvailableProjects(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, fetchAvailableProjects]);

  const toggleProjectSelection = (project: any) => {
    setErrorMessage("");
    setSelectedProjects((prev) => {
      const exists = prev.some((p) => p.id === project.id);
      if (exists) {
        return prev.filter((p) => p.id !== project.id);
      } else {
        return [...prev, project];
      }
    });
  };

  const removeProjectFromSelection = (projectId: string) => {
    setSelectedProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const handleSelectAllFiltered = () => {
    setErrorMessage("");
    setSelectedProjects((prev) => {
      const currentSelectedMap = new Map(prev.map((p) => [p.id, p]));
      availableProjects.forEach((p) => currentSelectedMap.set(p.id, p));
      return Array.from(currentSelectedMap.values());
    });
  };

  const handleDeselectAll = () => {
    setSelectedProjects([]);
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProjects.length === 0) {
      setErrorMessage("Please select at least one project to delete.");
      return;
    }

    if (!adminPassword.trim()) {
      setErrorMessage("Admin password is required to confirm deletion.");
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const projectIds = selectedProjects.map((p) => p.id);
      const res = await fetch("/api/v1/projects/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectIds,
          adminPassword: adminPassword.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const err = json.error?.message || "Failed to delete project(s). Check password and ensure projects have no linked financial history.";
        setErrorMessage(err);
        return;
      }

      const count = json.data?.deletedCount || selectedProjects.length;
      toast.success(
        "Project(s) Permanently Deleted",
        `Successfully removed ${count} project record(s).`
      );

      onClose();
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "A network error occurred while deleting project(s).");
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedCount = selectedProjects.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Project(s) Record"
      maxWidth="xl"
    >
      <form onSubmit={handleDelete} className="space-y-4">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-3.5 bg-[#FAF0ED] border border-[#EACDC4] rounded-xl text-xs text-[#A45435]">
          <AlertTriangle className="w-5 h-5 shrink-0 text-[#A45435] mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#8C3030]">Permanent Deletion Warning</p>
            <p className="text-[#8C3030]/90 leading-relaxed text-[11px]">
              Deleted projects and associated stage histories, member allocations, and checklists will be permanently removed.
              Projects with financial transactions (payments, expenses) or procurement history cannot be deleted and must be archived instead.
            </p>
          </div>
        </div>

        {/* Search and Selection Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-[#262421]">
              Select Project(s) to Delete ({selectedCount} selected)
            </label>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                disabled={availableProjects.length === 0}
                className="text-[#89652D] hover:underline font-semibold disabled:opacity-40 cursor-pointer"
              >
                Select All
              </button>
              <span className="text-[#DFD4C3]">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                disabled={selectedCount === 0}
                className="text-[#77716A] hover:underline font-semibold disabled:opacity-40 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#77716A]" />
            <input
              type="text"
              placeholder="Search by project reference #, title, or client name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#262421] placeholder-[#77716A] focus:outline-hidden focus:ring-2 focus:ring-[#89652D]/20 focus:border-[#89652D]"
            />
          </div>

          {/* Available Projects Selection List */}
          <div className="border border-[#E8E2D8] rounded-xl max-h-52 overflow-y-auto divide-y divide-[#E8E2D8]/60 bg-[#FFFEFC]">
            {isLoadingProjects ? (
              <div className="p-8 text-center text-xs text-[#77716A] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#89652D]" />
                <span>Loading available projects...</span>
              </div>
            ) : availableProjects.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#77716A]">
                No projects match your search query.
              </div>
            ) : (
              availableProjects.map((p) => {
                const isSelected = selectedProjects.some((sp) => sp.id === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProjectSelection(p)}
                    className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected ? "bg-[#FAF8F5] hover:bg-[#F3EEE5]/60" : "hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="text-[#89652D] shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#89652D]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#77716A]/40" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#262421]">
                            {p.referenceNo}
                          </span>
                          <span className="text-xs font-semibold text-[#262421] truncate">
                            {p.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#77716A] mt-0.5">
                          <span>{p.client?.fullName || p.lead?.clientName || "Client"}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px] uppercase">{p.stage?.replace(/_/g, " ")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-bold text-[#262421] tabular-nums">
                        {p.contractValue ? formatCurrency(p.contractValue) : "—"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Project Chips */}
        {selectedProjects.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716A]">
              Selected for Deletion ({selectedProjects.length}):
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8]">
              {selectedProjects.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#FFFEFC] border border-[#E8E2D8] text-xs text-[#262421] font-medium shadow-2xs"
                >
                  <FolderKanban className="w-3 h-3 text-[#89652D]" />
                  <span className="font-mono font-bold text-[11px]">{p.referenceNo}</span>
                  <span className="truncate max-w-[140px] text-[11px]">{p.title}</span>
                  <button
                    type="button"
                    onClick={() => removeProjectFromSelection(p.id)}
                    className="p-0.5 text-[#77716A] hover:text-[#A45435] rounded-sm transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 bg-[#FAF0ED] border border-[#EACDC4] rounded-xl text-xs text-[#A45435] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#A45435] shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Admin Password Confirmation */}
        <div className="space-y-1.5 pt-2 border-t border-[#E8E2D8]">
          <label className="block text-xs font-bold text-[#262421]">
            Confirm with Admin Password <span className="text-[#A45435]">*</span>
          </label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#77716A]" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                setErrorMessage("");
              }}
              placeholder="Enter your administrator password..."
              className="w-full pl-9 pr-10 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#262421] placeholder-[#77716A] focus:outline-hidden focus:ring-2 focus:ring-[#89652D]/20 focus:border-[#89652D]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-[#77716A] hover:text-[#262421] cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8E2D8]">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-bold text-[#77716A] hover:bg-[#F3EEE5] rounded-xl border border-[#E8E2D8] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={selectedCount === 0 || !adminPassword.trim() || isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#A45435] hover:bg-[#8C3030] rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting Project(s)...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete ({selectedCount})</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
