"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  UploadCloud,
  Search,
  Grid,
  List as ListIcon,
  Star,
  Trash2,
  Download,
  RotateCcw,
  Clock,
  Folder,
  X,
  File,
  Image as ImageIcon,
  Sheet,
  RefreshCw,
  HardDrive,
  Layers,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { FilterSelect } from "@/components/ui/filter-select";

interface DocumentVersionItem {
  id: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  changeNote?: string | null;
  uploadedBy?: { id: string; fullName: string } | null;
  createdAt: string;
}

interface DocumentItem {
  id: string;
  referenceNo: string;
  name: string;
  description?: string | null;
  type: string;
  category: string;
  status: string;
  isFavorite: boolean;
  currentVersion: number;
  owner?: { id: string; fullName: string } | null;
  project?: { id: string; referenceNo: string; title: string } | null;
  versions?: DocumentVersionItem[];
  createdAt: string;
  updatedAt: string;
}

export default function DocumentsWorkspacePage() {
  const [viewMode, setViewMode] = useState<"LIST" | "GRID">("LIST");
  const [activeTab, setActiveTab] = useState<"ALL" | "RECENT" | "FAVORITES" | "TRASH">("ALL");

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Upload Queue Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState("GENERAL");
  const [uploadType, setUploadType] = useState("OTHER");
  const [uploadName, setUploadName] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail / Version History Modal
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/api/v1/documents?tab=${activeTab}&limit=50`;
      if (categoryFilter !== "ALL") url += `&category=${categoryFilter}`;
      if (typeFilter !== "ALL") url += `&type=${typeFilter}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setDocuments(json.data.documents || []);
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, categoryFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0 || !uploadName.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFiles[0]);
      formData.append("name", uploadName.trim());
      formData.append("description", uploadDesc.trim());
      formData.append("category", uploadCategory);
      formData.append("type", uploadType);

      const res = await fetch("/api/v1/documents", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setIsUploadModalOpen(false);
        setUploadFiles([]);
        setUploadName("");
        setUploadDesc("");
        fetchDocuments();
      }
    } catch {
      // Quiet handling
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFavorite = async (docId: string) => {
    try {
      await fetch(`/api/v1/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleFavorite: true }),
      });
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, isFavorite: !d.isFavorite } : d))
      );
    } catch {
      // Quiet handling
    }
  };

  const moveToTrash = async (docId: string) => {
    try {
      await fetch(`/api/v1/documents/${docId}`, { method: "DELETE" });
      fetchDocuments();
    } catch {
      // Quiet handling
    }
  };

  const restoreFromTrash = async (docId: string) => {
    try {
      await fetch(`/api/v1/documents/${docId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESTORE_FROM_TRASH" }),
      });
      fetchDocuments();
    } catch {
      // Quiet handling
    }
  };

  const handleDownload = async (version: DocumentVersionItem) => {
    try {
      const downloadUrl = `/api/v1/files/${version.id}/download?token=${encodeURIComponent("demo_token")}`;
      window.open(downloadUrl, "_blank");
    } catch {
      // Quiet handling
    }
  };

  const restoreVersion = async (docId: string, versionNumber: number) => {
    try {
      await fetch(`/api/v1/documents/${docId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionNumber }),
      });
      const res = await fetch(`/api/v1/documents/${docId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedDoc(json.data);
        fetchDocuments();
      }
    } catch {
      // Quiet handling
    }
  };

  const getFileIcon = (mimeType?: string, type?: string) => {
    if (mimeType?.includes("image") || type === "IMAGE") {
      return <ImageIcon className="w-4 h-4 text-[#89652D]" />;
    }
    if (mimeType?.includes("pdf") || type === "CONTRACT" || type === "QUOTATION") {
      return <FileText className="w-4 h-4 text-[#A45435]" />;
    }
    if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel") || type === "REPORT") {
      return <Sheet className="w-4 h-4 text-[#536B4E]" />;
    }
    return <File className="w-4 h-4 text-[#77716A]" />;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const totalBytes = documents.reduce((acc, doc) => {
    const latestVer = doc.versions && doc.versions[0];
    return acc + (latestVer?.fileSize || 0);
  }, 0);

  const favoriteCount = documents.filter((d) => d.isFavorite).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#89652D]">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#262421] tracking-tight">Documents & Files Workspace</h1>
              <p className="text-xs text-[#77716A]">
                Centralized digital file repository with storage abstraction, version control, and multi-entity links.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-[#FAF8F5] bg-[#242321] hover:bg-[#383633] rounded-xl shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" /> Upload Document
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#FFFEFC] border border-[#E8E2D8] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716A]">Total Files</span>
            <Layers className="w-4 h-4 text-[#89652D]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#262421] font-mono tabular-nums">
            {documents.length}
          </div>
          <p className="mt-1 text-[11px] text-[#77716A]">In active repository</p>
        </div>

        <div className="p-4 rounded-xl bg-[#FFFEFC] border border-[#E8E2D8] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716A]">Storage In Use</span>
            <HardDrive className="w-4 h-4 text-[#77716A]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#262421] font-mono tabular-nums">
            {formatBytes(totalBytes)}
          </div>
          <p className="mt-1 text-[11px] text-[#77716A]">Across latest versions</p>
        </div>

        <div className="p-4 rounded-xl bg-[#FFFEFC] border border-[#E8E2D8] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716A]">Starred</span>
            <Star className="w-4 h-4 text-[#89652D] fill-[#89652D]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#89652D] font-mono tabular-nums">
            {favoriteCount}
          </div>
          <p className="mt-1 text-[11px] text-[#77716A]">Marked as priority</p>
        </div>

        <div className="p-4 rounded-xl bg-[#FFFEFC] border border-[#E8E2D8] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716A]">Audit & Versioning</span>
            <Sparkles className="w-4 h-4 text-[#536B4E]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#536B4E] font-mono tabular-nums">
            100%
          </div>
          <p className="mt-1 text-[11px] text-[#77716A]">Immutable history enabled</p>
        </div>
      </div>

      {/* Tabs & View Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E2D8]">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "ALL"
                ? "border-[#89652D] text-[#262421]"
                : "border-transparent text-[#77716A] hover:text-[#262421]"
            }`}
          >
            <Folder className="w-4 h-4" /> All Documents
          </button>

          <button
            onClick={() => setActiveTab("RECENT")}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "RECENT"
                ? "border-[#89652D] text-[#262421]"
                : "border-transparent text-[#77716A] hover:text-[#262421]"
            }`}
          >
            <Clock className="w-4 h-4" /> Recent Uploads
          </button>

          <button
            onClick={() => setActiveTab("FAVORITES")}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "FAVORITES"
                ? "border-[#89652D] text-[#262421]"
                : "border-transparent text-[#77716A] hover:text-[#262421]"
            }`}
          >
            <Star className="w-4 h-4" /> Favorites
          </button>

          <button
            onClick={() => setActiveTab("TRASH")}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "TRASH"
                ? "border-[#A45435] text-[#A45435]"
                : "border-transparent text-[#77716A] hover:text-[#A45435]"
            }`}
          >
            <Trash2 className="w-4 h-4" /> Trash
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center border border-[#E8E2D8] rounded-xl overflow-hidden bg-[#F8F6F1] p-0.5">
            <button
              onClick={() => setViewMode("LIST")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "LIST"
                  ? "bg-[#FFFEFC] text-[#262421] shadow-2xs font-bold"
                  : "text-[#77716A] hover:text-[#262421]"
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "GRID"
                  ? "bg-[#FFFEFC] text-[#262421] shadow-2xs font-bold"
                  : "text-[#77716A] hover:text-[#262421]"
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={fetchDocuments}
            className="p-1.5 text-[#77716A] hover:text-[#262421] rounded-xl hover:bg-[#F3EEE5] border border-[#E8E2D8] bg-[#FFFEFC] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FFFEFC] p-3 rounded-xl border border-[#E8E2D8] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#77716A]" />
            <input
              type="text"
              placeholder="Search by DOC reference, name, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-[#262421] placeholder-[#77716A] focus:outline-hidden focus:ring-2 focus:ring-[#89652D]/20 focus:border-[#89652D]"
            />
          </div>

          <FilterSelect
            label="Category"
            placeholder="All Categories"
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val || "ALL")}
            options={[
              { value: "PROJECT", label: "Project" },
              { value: "FINANCE", label: "Finance" },
              { value: "PROCUREMENT", label: "Procurement" },
              { value: "CRM", label: "CRM" },
              { value: "INVENTORY", label: "Inventory" },
              { value: "TASKS", label: "Tasks" },
              { value: "GENERAL", label: "General" },
            ]}
            variant="beige"
            size="sm"
          />

          <FilterSelect
            label="Document Type"
            placeholder="All Types"
            value={typeFilter}
            onChange={(val) => setTypeFilter(val || "ALL")}
            options={[
              { value: "CONTRACT", label: "Contract" },
              { value: "QUOTATION", label: "Quotation" },
              { value: "INVOICE", label: "Invoice" },
              { value: "RECEIPT", label: "Receipt" },
              { value: "DRAWING", label: "Drawing" },
              { value: "SPECIFICATION", label: "Specification" },
              { value: "REPORT", label: "Report" },
              { value: "IMAGE", label: "Image" },
              { value: "OTHER", label: "Other" },
            ]}
            variant="beige"
            size="sm"
          />
        </div>
      </div>

      {/* DOCUMENT LIST VIEW */}
      {viewMode === "LIST" ? (
        <div className="bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E8E2D8] bg-[#F8F6F1]">
                  <th className="py-3 px-4 text-[11px] font-bold text-[#77716A]">Reference</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#77716A]">Document Name</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#77716A]">Category / Type</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#77716A]">Version</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#77716A]">Owner</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#77716A]">Size</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#77716A]">Updated</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-[#77716A] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-xs text-[#77716A]">
                      <div className="inline-block animate-spin w-5 h-5 border-2 border-[#89652D] border-t-transparent rounded-full mb-2"></div>
                      <p>Loading document repository...</p>
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-xs text-[#77716A]">
                      No documents match the active filters.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => {
                    const latestVer = doc.versions && doc.versions[0];
                    return (
                      <tr
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className="hover:bg-[#FAF7F2] cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#262421]">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(doc.id);
                              }}
                              className={`p-0.5 hover:text-[#89652D] cursor-pointer ${
                                doc.isFavorite ? "text-[#89652D] fill-[#89652D]" : "text-[#77716A]/40"
                              }`}
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                            {doc.referenceNo}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#262421] max-w-xs">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center">
                              {getFileIcon(latestVer?.mimeType, doc.type)}
                            </div>
                            <span className="truncate">{doc.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#77716A]">
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[#F3EEE5] text-[#77716A] border border-[#E8E2D8]">
                            {doc.category} • {doc.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-[#F8EBD5] text-[#89652D] border border-[#DFD4C3]">
                            v{doc.currentVersion}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#77716A] font-medium">
                          {doc.owner ? doc.owner.fullName : <span className="text-[#77716A]/40">-</span>}
                        </td>
                        <td className="py-3 px-4 text-[#77716A] font-mono tabular-nums text-[11px]">
                          {latestVer ? formatBytes(latestVer.fileSize) : "-"}
                        </td>
                        <td className="py-3 px-4 text-[#77716A] text-[11px]">{formatDate(doc.updatedAt)}</td>
                        <td className="py-3 px-4 text-right">
                          {activeTab === "TRASH" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                restoreFromTrash(doc.id);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-[#536B4E] bg-[#F4F7F3] hover:bg-[#E8EFE6] border border-[#D1E0CD] rounded-lg transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" /> Restore
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveToTrash(doc.id);
                              }}
                              className="p-1.5 text-[#77716A] hover:text-[#A45435] rounded-lg hover:bg-[#FAF0ED] transition-colors cursor-pointer"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DOCUMENT GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {isLoading ? (
            <div className="col-span-full p-12 text-center text-xs text-[#77716A]">
              Loading document grid...
            </div>
          ) : documents.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-[#77716A]">
              No documents found.
            </div>
          ) : (
            documents.map((doc) => {
              const latestVer = doc.versions && doc.versions[0];
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="bg-[#FFFEFC] p-4 rounded-xl border border-[#E8E2D8] shadow-2xs hover:border-[#DFD4C3] hover:shadow-xs transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2.5 bg-[#F3EEE5] border border-[#E8E2D8] rounded-xl">
                      {getFileIcon(latestVer?.mimeType, doc.type)}
                    </div>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#F8EBD5] text-[#89652D] border border-[#DFD4C3] rounded-md">
                      v{doc.currentVersion}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="font-mono text-[10px] font-bold text-[#77716A] block">{doc.referenceNo}</span>
                    <h3 className="text-xs font-bold text-[#262421] truncate">{doc.name}</h3>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#77716A] pt-2 border-t border-[#E8E2D8]">
                    <span className="font-semibold">{doc.category}</span>
                    <span className="font-mono">{latestVer ? formatBytes(latestVer.fileSize) : "-"}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-[#262421]/60 backdrop-blur-xs">
          <div className="bg-[#FFFEFC] rounded-2xl shadow-2xl border border-[#E8E2D8] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E8E2D8] flex items-center justify-between bg-[#F8F6F1]">
              <h3 className="text-sm font-bold text-[#262421] flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#89652D]" /> Upload Enterprise Document
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 text-[#77716A] hover:text-[#262421] rounded-lg hover:bg-[#F3EEE5] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">
                  Select File <span className="text-[#A45435]">*</span>
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setUploadFiles(Array.from(e.target.files));
                      if (!uploadName) {
                        setUploadName(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-[#E8E2D8] rounded-xl bg-[#FAF8F5] text-[#262421] focus:outline-hidden focus:ring-2 focus:ring-[#89652D]/20 focus:border-[#89652D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">
                  Document Title <span className="text-[#A45435]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electrical Layout Agreement V2"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8E2D8] rounded-xl bg-[#FAF8F5] text-[#262421] focus:outline-hidden focus:ring-2 focus:ring-[#89652D]/20 focus:border-[#89652D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#262421] mb-1">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E8E2D8] rounded-xl bg-[#FAF8F5] text-[#262421] focus:outline-hidden focus:ring-2 focus:ring-[#89652D]/20 focus:border-[#89652D]"
                  >
                    <option value="PROJECT">Project</option>
                    <option value="FINANCE">Finance</option>
                    <option value="PROCUREMENT">Procurement</option>
                    <option value="CRM">CRM</option>
                    <option value="INVENTORY">Inventory</option>
                    <option value="TASKS">Tasks</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#262421] mb-1">Document Type</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E8E2D8] rounded-xl bg-[#FAF8F5] text-[#262421] focus:outline-hidden focus:ring-2 focus:ring-[#89652D]/20 focus:border-[#89652D]"
                  >
                    <option value="CONTRACT">Contract</option>
                    <option value="QUOTATION">Quotation</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="RECEIPT">Receipt</option>
                    <option value="DRAWING">Drawing</option>
                    <option value="SPECIFICATION">Specification</option>
                    <option value="REPORT">Report</option>
                    <option value="IMAGE">Image</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or reference instructions..."
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8E2D8] rounded-xl bg-[#FAF8F5] text-[#262421] focus:outline-hidden focus:ring-2 focus:ring-[#89652D]/20 focus:border-[#89652D]"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#77716A] hover:bg-[#F3EEE5] rounded-xl transition-colors border border-[#E8E2D8] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-[#FAF8F5] bg-[#242321] hover:bg-[#383633] rounded-xl shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Uploading..." : "Save & Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT DETAIL & VERSION HISTORY MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-[#262421]/60 backdrop-blur-xs">
          <div className="bg-[#FFFEFC] rounded-2xl shadow-2xl border border-[#E8E2D8] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E8E2D8] flex items-center justify-between bg-[#F8F6F1]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8] rounded-md">
                  {selectedDoc.referenceNo}
                </span>
                <span className="text-xs font-bold font-mono text-[#89652D] bg-[#F8EBD5] border border-[#DFD4C3] px-2 py-0.5 rounded-md">
                  v{selectedDoc.currentVersion}
                </span>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 text-[#77716A] hover:text-[#262421] rounded-lg hover:bg-[#F3EEE5] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#262421]">{selectedDoc.name}</h2>
                <p className="text-xs text-[#77716A] mt-1">
                  Category: <span className="font-semibold text-[#262421]">{selectedDoc.category}</span> • Type: <span className="font-semibold text-[#262421]">{selectedDoc.type}</span>
                </p>
                {selectedDoc.description && (
                  <p className="text-xs text-[#77716A] mt-2 bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D8]">
                    {selectedDoc.description}
                  </p>
                )}
              </div>

              {/* Version History Section */}
              <div className="space-y-3 pt-3 border-t border-[#E8E2D8]">
                <h4 className="text-xs font-bold text-[#262421] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#89652D]" /> Immutable Version History
                </h4>
                <div className="divide-y divide-[#E8E2D8] border border-[#E8E2D8] rounded-xl overflow-hidden">
                  {selectedDoc.versions && selectedDoc.versions.length > 0 ? (
                    selectedDoc.versions.map((ver) => (
                      <div key={ver.id} className="p-3 bg-[#FFFEFC] flex items-center justify-between gap-4 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#262421]">v{ver.versionNumber}</span>
                            <span className="text-[#77716A] font-medium">{ver.fileName}</span>
                            <span className="text-[#77716A] font-mono text-[11px]">({formatBytes(ver.fileSize)})</span>
                          </div>
                          <p className="text-[10px] text-[#77716A]">
                            Uploaded by {ver.uploadedBy ? ver.uploadedBy.fullName : "User"} on {formatDate(ver.createdAt)}
                          </p>
                          {ver.changeNote && <p className="text-[10px] text-[#77716A] italic">&quot;{ver.changeNote}&quot;</p>}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {ver.versionNumber !== selectedDoc.currentVersion && (
                            <button
                              onClick={() => restoreVersion(selectedDoc.id, ver.versionNumber)}
                              className="px-2.5 py-1 text-[10px] font-bold text-[#89652D] bg-[#F8EBD5] hover:bg-[#F3DEBE] border border-[#DFD4C3] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Restore content from this version as new current version"
                            >
                              <RotateCcw className="w-3 h-3" /> Restore v{ver.versionNumber}
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(ver)}
                            className="px-2.5 py-1 text-[10px] font-bold text-[#262421] bg-[#FFFEFC] hover:bg-[#F3EEE5] border border-[#E8E2D8] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" /> Download
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-[#77716A]">No version history records.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-[#E8E2D8] bg-[#F8F6F1] flex items-center justify-between text-xs text-[#77716A]">
              <span>Created {formatDate(selectedDoc.createdAt)}</span>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 font-bold text-[#262421] bg-[#FFFEFC] hover:bg-[#F3EEE5] border border-[#E8E2D8] rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
