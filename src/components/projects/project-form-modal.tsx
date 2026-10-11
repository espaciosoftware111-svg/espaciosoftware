"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  Search,
  UserPlus,
  Check,
  ChevronsUpDown,
  Phone,
  User,
  Sparkles,
  Loader2,
} from "lucide-react";
import { PROJECT_PRIORITIES } from "@/validators/project.schema";

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: any) => void;
  initialData?: any;
}

interface ClientOptionItem {
  id: string;
  clientId: string | null;
  leadId: string | null;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  propertyTypeKey: string | null;
  estimatedBudget: number | null;
  type: "CLIENT" | "LEAD";
  referenceNo: string;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const isEdit = Boolean(initialData?.id);

  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    leadId: "",
    propertyTypeKey: "APARTMENT_INTERIOR",
    totalBudget: 0,
    startDate: new Date().toISOString().split("T")[0],
    targetCompletionDate: "",
    priority: "MEDIUM",
    status: "ACTIVE",
    siteAddress: "",
    city: "Hyderabad",
    state: "Telangana",
    postalCode: "",
    notes: "",
  });

  const [clientOptions, setClientOptions] = useState<ClientOptionItem[]>([]);
  const [selectedOption, setSelectedOption] = useState<ClientOptionItem | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Combobox & Search States
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "LEAD" | "CLIENT">("ALL");
  const comboboxRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Manual Client Add States
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualError, setManualError] = useState("");
  const [isSavingManual, setIsSavingManual] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title || "",
          clientId: initialData.clientId || initialData.client?.id || "",
          leadId: initialData.leadId || initialData.lead?.id || "",
          propertyTypeKey: initialData.propertyTypeKey || "APARTMENT_INTERIOR",
          totalBudget: initialData.contractValue || initialData.revisedBudget || initialData.totalBudget || 0,
          startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          targetCompletionDate: initialData.targetCompletionDate ? new Date(initialData.targetCompletionDate).toISOString().split("T")[0] : "",
          priority: initialData.priority || "MEDIUM",
          status: initialData.status || "ACTIVE",
          siteAddress: initialData.siteAddress || "",
          city: initialData.city || "Hyderabad",
          state: initialData.state || "Telangana",
          postalCode: initialData.postalCode || "",
          notes: initialData.notes || "",
        });
      } else {
        setFormData({
          title: "",
          clientId: "",
          leadId: "",
          propertyTypeKey: "APARTMENT_INTERIOR",
          totalBudget: 0,
          startDate: new Date().toISOString().split("T")[0],
          targetCompletionDate: "",
          priority: "MEDIUM",
          status: "ACTIVE",
          siteAddress: "",
          city: "Hyderabad",
          state: "Telangana",
          postalCode: "",
          notes: "",
        });
        setSelectedOption(null);
      }
      setIsComboboxOpen(false);
      setIsManualAddOpen(false);
      setSearchQuery("");
      setManualError("");
      loadClientOptions();
    }
  }, [isOpen, initialData]);

  // Close combobox on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setIsComboboxOpen(false);
        setIsManualAddOpen(false);
      }
    };
    if (isComboboxOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isComboboxOpen]);

  // Auto focus search when combobox opens
  useEffect(() => {
    if (isComboboxOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isComboboxOpen]);

  const loadClientOptions = async () => {
    setIsLoadingOptions(true);
    try {
      const res = await fetch("/api/v1/projects/client-options");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setClientOptions(json.data);

        // If editing or existing selection, match it
        const currentClientId = initialData?.clientId || initialData?.client?.id;
        const currentLeadId = initialData?.leadId || initialData?.lead?.id;

        if (currentClientId || currentLeadId) {
          const matched = json.data.find(
            (opt: ClientOptionItem) =>
              (currentClientId && opt.clientId === currentClientId) ||
              (currentLeadId && opt.leadId === currentLeadId)
          );
          if (matched) {
            setSelectedOption(matched);
          } else if (initialData?.client) {
            setSelectedOption({
              id: `client-${initialData.client.id}`,
              clientId: initialData.client.id,
              leadId: null,
              name: initialData.client.fullName || "Client",
              phone: initialData.client.phone || "",
              email: initialData.client.email || null,
              address: null,
              city: null,
              state: null,
              postalCode: null,
              propertyTypeKey: null,
              estimatedBudget: null,
              type: "CLIENT",
              referenceNo: initialData.client.referenceNo || "",
            });
          }
        }
      }
    } catch {
      // quiet fallback
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleSelectOption = async (opt: ClientOptionItem) => {
    setSelectedOption(opt);
    setIsComboboxOpen(false);
    setIsManualAddOpen(false);

    let resolvedClientId = opt.clientId || "";
    const resolvedLeadId = opt.leadId || "";

    // If selecting a Lead that does not yet have a clientId, auto-resolve/create it
    if (opt.type === "LEAD" && !resolvedClientId && opt.leadId) {
      try {
        const resolveRes = await fetch("/api/v1/projects/client-options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ensure_lead_client",
            leadId: opt.leadId,
          }),
        });
        const resolveJson = await resolveRes.json();
        if (resolveJson.success && resolveJson.data?.id) {
          resolvedClientId = resolveJson.data.id;
          opt.clientId = resolvedClientId;
        }
      } catch {
        // non-blocking fallback
      }
    }

    setFormData((prev) => {
      const updates: any = {
        ...prev,
        clientId: resolvedClientId,
        leadId: resolvedLeadId,
      };

      // Smart autofill from lead details if form fields are default/empty
      if (!prev.title || prev.title.trim() === "") {
        updates.title = `${opt.name} - Interior Execution`;
      }
      if (opt.address && (!prev.siteAddress || prev.siteAddress.trim() === "")) {
        updates.siteAddress = opt.address;
      }
      if (opt.estimatedBudget && (!prev.totalBudget || prev.totalBudget === 0)) {
        updates.totalBudget = opt.estimatedBudget;
      }
      if (opt.propertyTypeKey) {
        const cleanType = opt.propertyTypeKey.toUpperCase();
        if (cleanType.includes("VILLA")) updates.propertyTypeKey = "VILLA_INTERIOR";
        else if (cleanType.includes("COMMERCIAL") || cleanType.includes("OFFICE")) updates.propertyTypeKey = "COMMERCIAL_OFFICE";
        else if (cleanType.includes("RENOV")) updates.propertyTypeKey = "RENOVATION";
        else updates.propertyTypeKey = "APARTMENT_INTERIOR";
      }

      return updates;
    });
  };

  const handleManualAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError("");

    if (!manualName.trim() || manualName.trim().length < 2) {
      setManualError("Please enter a valid client name (min 2 chars)");
      return;
    }

    const cleanPhone = manualPhone.trim();
    if (!cleanPhone || cleanPhone.length < 7) {
      setManualError("Please enter a valid phone number (min 7 digits)");
      return;
    }

    setIsSavingManual(true);
    try {
      const res = await fetch("/api/v1/projects/client-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: manualName.trim(),
          phone: cleanPhone,
          email: manualEmail.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const client = json.data;
        const newOpt: ClientOptionItem = {
          id: `client-${client.id}`,
          clientId: client.id,
          leadId: null,
          name: client.fullName,
          phone: client.phone,
          email: client.email || null,
          address: client.address || null,
          city: client.city || null,
          state: client.state || null,
          postalCode: client.postalCode || null,
          propertyTypeKey: null,
          estimatedBudget: null,
          type: "CLIENT",
          referenceNo: client.referenceNo,
        };

        // Add to local options list & select
        setClientOptions((prev) => [newOpt, ...prev]);
        await handleSelectOption(newOpt);

        // Reset manual form
        setManualName("");
        setManualPhone("");
        setManualEmail("");
        setIsManualAddOpen(false);
      } else {
        setManualError(json.error?.message || "Failed to create client");
      }
    } catch {
      setManualError("Network error adding client");
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.clientId && !formData.leadId) {
      setError("Please select a client or lead to proceed.");
      setIsLoading(false);
      return;
    }

    try {
      const url = isEdit ? `/api/v1/projects/${initialData.id}` : "/api/v1/projects";
      const method = isEdit ? "PATCH" : "POST";

      const payload = {
        ...formData,
        totalBudget: Number(formData.totalBudget) || 0,
        contractValue: Number(formData.totalBudget) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        onSuccess(json.data);
        onClose();
      } else {
        setError(json.error?.message || "Failed to save project");
      }
    } catch {
      setError("Network error submitting project details");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter client and lead options based on query and tab
  const filteredOptions = clientOptions.filter((opt) => {
    if (activeTab === "LEAD" && opt.type !== "LEAD") return false;
    if (activeTab === "CLIENT" && opt.type !== "CLIENT") return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    const cleanQ = q.replace(/[^0-9]/g, "");
    const optPhoneDigits = opt.phone.replace(/[^0-9]/g, "");

    const nameMatch = opt.name.toLowerCase().includes(q);
    const phoneMatch = cleanQ ? optPhoneDigits.includes(cleanQ) : opt.phone.toLowerCase().includes(q);
    const refMatch = opt.referenceNo.toLowerCase().includes(q);

    return nameMatch || phoneMatch || refMatch;
  });

  const leadCount = clientOptions.filter((o) => o.type === "LEAD").length;
  const clientCount = clientOptions.filter((o) => o.type === "CLIENT").length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4A433D]/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#F6EFE3] border border-[#6F5642]/20 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#6F5642]/20 flex items-center justify-between bg-[#ECF4F0]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#F2B455]/20 text-[#6F5642] rounded-lg">
              <Building2 className="w-5 h-5 text-[#6F5642]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#4A433D]">
                {isEdit ? `Edit Project: ${initialData.referenceNo}` : "Create New Project"}
              </h2>
              <p className="text-[11px] text-[#6F5642]">
                {isEdit ? "Update project execution details and timeline" : "Initialize a new project record"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#6F5642] hover:text-[#4A433D] rounded-lg hover:bg-[#F6EFE3] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Project Title */}
          <div>
            <label className="block text-xs font-semibold text-[#4A433D] mb-1">
              Project Title <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="e.g. Luxury 4BHK Villa - Indiranagar"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-white border-[#6F5642]/30"
            />
          </div>

          {/* Client Combobox & Property Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Searchable Client & Lead Dropdown */}
            <div className="relative" ref={comboboxRef}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#4A433D]">
                  Client <span className="text-rose-500">*</span>
                </label>
                {!isEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsComboboxOpen(true);
                      setIsManualAddOpen(!isManualAddOpen);
                    }}
                    className="text-[11px] font-semibold text-[#10B981] hover:text-[#059669] flex items-center gap-1 transition-colors"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Add Manually</span>
                  </button>
                )}
              </div>

              {/* Trigger Button */}
              <button
                type="button"
                disabled={isEdit}
                onClick={() => setIsComboboxOpen(!isComboboxOpen)}
                className={`w-full h-9 px-3 text-xs bg-white border border-[#6F5642]/30 rounded-md flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#F2B455] text-[#4A433D] transition-colors ${
                  isEdit ? "bg-[#ECF4F0] cursor-not-allowed text-[#6F5642]" : "hover:border-[#6F5642]/60"
                }`}
              >
                {selectedOption ? (
                  <div className="flex items-center gap-2 overflow-hidden truncate">
                    <span className="font-semibold text-[#4A433D] truncate">{selectedOption.name}</span>
                    <span className="tabular-nums text-[#6F5642] text-[11px] shrink-0">
                      ({selectedOption.phone})
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-semibold shrink-0 ${
                        selectedOption.type === "LEAD"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {selectedOption.type === "LEAD" ? "Lead" : "Client"}
                    </span>
                  </div>
                ) : (
                  <span className="text-[#6F5642]/70 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-[#6F5642]/60" />
                    Select client or lead...
                  </span>
                )}
                <ChevronsUpDown className="w-3.5 h-3.5 text-[#6F5642] shrink-0 ml-1" />
              </button>

              {/* Dropdown Popover */}
              {isComboboxOpen && !isEdit && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-[#6F5642]/30 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-80 animate-in fade-in-50 duration-150">
                  {/* Search Input Bar */}
                  <div className="p-2 border-b border-[#6F5642]/15 bg-[#F6EFE3]/40">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#6F5642] absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Type name or phone number to search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-[#6F5642]/20 rounded-md focus:outline-none focus:ring-1 focus:ring-[#10B981] text-[#4A433D]"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6F5642] hover:text-[#4A433D]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#6F5642]/10 text-[10px]">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab("ALL")}
                          className={`px-2 py-0.5 rounded font-medium transition-colors ${
                            activeTab === "ALL"
                              ? "bg-[#6F5642] text-white"
                              : "bg-[#ECF4F0] text-[#6F5642] hover:bg-[#E2ECE7]"
                          }`}
                        >
                          All ({clientOptions.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("LEAD")}
                          className={`px-2 py-0.5 rounded font-medium transition-colors ${
                            activeTab === "LEAD"
                              ? "bg-amber-600 text-white"
                              : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                          }`}
                        >
                          Leads ({leadCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("CLIENT")}
                          className={`px-2 py-0.5 rounded font-medium transition-colors ${
                            activeTab === "CLIENT"
                              ? "bg-emerald-700 text-white"
                              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          }`}
                        >
                          Clients ({clientCount})
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsManualAddOpen(!isManualAddOpen)}
                        className="text-[11px] font-semibold text-[#10B981] hover:underline flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" />
                        {isManualAddOpen ? "Hide Form" : "+ Manual Add"}
                      </button>
                    </div>
                  </div>

                  {/* Manual Add Quick Form (Collapsible) */}
                  {isManualAddOpen && (
                    <div className="p-3 bg-[#ECF4F0] border-b border-[#6F5642]/20 animate-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-[#4A433D] flex items-center gap-1">
                          <UserPlus className="w-3.5 h-3.5 text-[#10B981]" />
                          Manually Enter Client
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsManualAddOpen(false)}
                          className="text-[#6F5642] hover:text-[#4A433D]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {manualError && (
                        <div className="mb-2 p-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] rounded flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{manualError}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Input
                          placeholder="Client Full Name *"
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          className="bg-white h-7 text-xs border-[#6F5642]/30"
                        />
                        <Input
                          placeholder="Phone Number (e.g. 9876543210) *"
                          value={manualPhone}
                          onChange={(e) => setManualPhone(e.target.value)}
                          className="bg-white h-7 text-xs tabular-nums border-[#6F5642]/30"
                        />
                        <Input
                          placeholder="Email (optional)"
                          type="email"
                          value={manualEmail}
                          onChange={(e) => setManualEmail(e.target.value)}
                          className="bg-white h-7 text-xs border-[#6F5642]/30"
                        />
                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setIsManualAddOpen(false)}
                            className="h-6 text-[10px] px-2 border-[#6F5642]/30"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isSavingManual}
                            onClick={handleManualAddClient}
                            className="h-6 text-[10px] px-2.5 bg-[#10B981] hover:bg-[#059669] text-white"
                          >
                            {isSavingManual ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <Check className="w-3 h-3 mr-1" />
                            )}
                            Save & Select
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* List of Options */}
                  <div className="overflow-y-auto max-h-52 divide-y divide-[#6F5642]/10">
                    {isLoadingOptions ? (
                      <div className="p-4 text-center text-xs text-[#6F5642] flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
                        <span>Loading clients and leads...</span>
                      </div>
                    ) : filteredOptions.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-xs text-[#6F5642]">
                          No client or lead matching &ldquo;{searchQuery}&rdquo;
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setManualName(searchQuery);
                            setIsManualAddOpen(true);
                          }}
                          className="mt-2 text-xs font-semibold text-[#10B981] hover:underline inline-flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>+ Create &ldquo;{searchQuery}&rdquo; as client</span>
                        </button>
                      </div>
                    ) : (
                      filteredOptions.map((opt) => {
                        const isSelected = selectedOption?.id === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleSelectOption(opt)}
                            className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                              isSelected
                                ? "bg-[#ECF4F0] text-[#4A433D] font-semibold"
                                : "hover:bg-[#F6EFE3]/80 text-[#4A433D]"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-[#4A433D] truncate">{opt.name}</span>
                                <span className="tabular-nums text-[#6F5642] font-mono text-[11px]">
                                  ({opt.phone})
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                    opt.type === "LEAD"
                                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  }`}
                                >
                                  {opt.type === "LEAD" ? `Lead · ${opt.referenceNo}` : `Client · ${opt.referenceNo}`}
                                </span>
                              </div>
                              {(opt.address || opt.email) && (
                                <p className="text-[10px] text-[#6F5642] truncate mt-0.5">
                                  {opt.address ? `📍 ${opt.address}` : ""}
                                  {opt.address && opt.email ? " · " : ""}
                                  {opt.email ? `✉️ ${opt.email}` : ""}
                                </p>
                              )}
                            </div>

                            {isSelected && (
                              <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-xs font-semibold text-[#4A433D] mb-1">Property Type</label>
              <select
                value={formData.propertyTypeKey}
                onChange={(e) => setFormData({ ...formData, propertyTypeKey: e.target.value })}
                className="w-full h-9 px-3 text-xs bg-white border border-[#6F5642]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F2B455] text-[#4A433D]"
              >
                <option value="APARTMENT_INTERIOR">Apartment Interior</option>
                <option value="VILLA_INTERIOR">Villa / Independent House</option>
                <option value="COMMERCIAL_OFFICE">Commercial Office</option>
                <option value="RENOVATION">Renovation & Remodel</option>
              </select>
            </div>
          </div>

          {/* Contract Value & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4A433D] mb-1">
                Contract Value / Budget (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-[#6F5642] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="number"
                  required
                  min="0"
                  placeholder="0.00"
                  className="pl-8 tabular-nums font-semibold bg-white border-[#6F5642]/30"
                  value={formData.totalBudget || ""}
                  onChange={(e) => setFormData({ ...formData, totalBudget: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A433D] mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full h-9 px-3 text-xs bg-white border border-[#6F5642]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F2B455] text-[#4A433D]"
              >
                {PROJECT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date & Target Completion Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4A433D] mb-1">Start Date</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-[#6F5642] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="date"
                  className="pl-8 bg-white border-[#6F5642]/30"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A433D] mb-1">Target Completion Date</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-[#6F5642] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="date"
                  className="pl-8 bg-white border-[#6F5642]/30"
                  value={formData.targetCompletionDate}
                  onChange={(e) => setFormData({ ...formData, targetCompletionDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Site Address */}
          <div>
            <label className="block text-xs font-semibold text-[#4A433D] mb-1">Site Address</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-[#6F5642] absolute left-3 top-3" />
              <textarea
                rows={2}
                placeholder="Flat / House No, Street, Landmark, Area..."
                value={formData.siteAddress}
                onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })}
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-[#6F5642]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F2B455] text-[#4A433D]"
              />
            </div>
          </div>

          {/* City & State */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#4A433D] mb-1">City</label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="bg-white border-[#6F5642]/30 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#4A433D] mb-1">State</label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="bg-white border-[#6F5642]/30 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#4A433D] mb-1">Postal Code</label>
              <Input
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="bg-white border-[#6F5642]/30 text-xs"
              />
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#4A433D] mb-1">Internal Execution Notes</label>
            <textarea
              rows={2}
              placeholder="Special instructions, site access notes, key client preferences..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-[#6F5642]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F2B455] text-[#4A433D]"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#6F5642]/20 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="border-[#6F5642]/30 text-[#4A433D]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="bg-[#6F5642] hover:bg-[#4A433D] text-white"
            >
              {isLoading ? "Saving..." : isEdit ? "Update Project" : "Create Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
