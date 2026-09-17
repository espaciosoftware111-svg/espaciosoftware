"use client";

import React, { useState } from "react";
import {
  Download,
  X,
  FileSpreadsheet,
  Loader2,
  CheckSquare,
  Square,
  Database,
  AlertTriangle,
} from "lucide-react";

const ALL_SECTIONS = [
  { key: "Leads", label: "Leads" },
  { key: "Quotations", label: "Quotations" },
  { key: "Projects", label: "Projects" },
  { key: "Payments", label: "Client Payments" },
  { key: "GST Invoices", label: "GST Invoices" },
  { key: "Expenses", label: "Expenses" },
  { key: "Petty Cash Advances", label: "Petty Cash Advances" },
  { key: "Petty Cash Expenses", label: "Petty Cash Expenses" },
  { key: "Vendors", label: "Vendors" },
  { key: "Vendor Payments", label: "Vendor Payments" },
  { key: "Project Materials", label: "Project Materials Orders" },
  { key: "Materials Orders", label: "Materials Orders (Leads)" },
  { key: "Inventory", label: "Inventory / Stock" },
  { key: "GST Tax Summary", label: "GST Tax Summary" },
];

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ExportModal — Complete Software Data Export
 *
 * Allows Super Admin to select specific sections and export as:
 *   - Individual CSV files (downloaded one by one)
 *   - Combined PDF report (all sections in one print-ready HTML)
 */
export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [selectedSections, setSelectedSections] = useState<string[]>(
    ALL_SECTIONS.map((s) => s.key)
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"CSV" | "PDF">("CSV");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleAll = () => {
    if (selectedSections.length === ALL_SECTIONS.length) {
      setSelectedSections([]);
    } else {
      setSelectedSections(ALL_SECTIONS.map((s) => s.key));
    }
  };

  const handleExport = async () => {
    if (selectedSections.length === 0) {
      setErrorMessage("Please select at least one section to export.");
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);
    setResultMessage(null);
    setProgress({ done: 0, total: selectedSections.length });

    try {
      const res = await fetch("/api/v1/reports/export-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: exportFormat,
          sections: selectedSections,
        }),
      });

      if (!res.ok) throw new Error("Export failed. Please try again.");

      if (exportFormat === "PDF") {
        // Server returns HTML blob directly
        const html = await res.text();
        const blob = new Blob([html], { type: "text/html" });
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => window.URL.revokeObjectURL(url), 15000);
        setResultMessage(`Complete software export opened in new tab. Use Ctrl+P to Save as PDF.`);
      } else {
        // CSV: server returns JSON manifest with csvContent per section
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || "Export failed");

        const { sections } = json.data as {
          sections: Array<{ sectionName: string; fileName: string; csvContent: string; rowCount: number }>;
        };

        // Download each section as a separate CSV file
        let done = 0;
        for (const section of sections) {
          const blob = new Blob([section.csvContent], { type: "text/csv; charset=utf-8" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = section.fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          done++;
          setProgress({ done, total: sections.length });
          // Small pause to prevent browser from blocking multiple downloads
          await new Promise((r) => setTimeout(r, 400));
        }

        const totalRecords = sections.reduce((s, f) => s + f.rowCount, 0);
        setResultMessage(
          `✅ ${sections.length} CSV file${sections.length > 1 ? "s" : ""} downloaded — ${totalRecords.toLocaleString("en-IN")} total records exported.`
        );
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
      setProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Database className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h2 id="export-modal-title" className="text-sm font-bold text-slate-900">
                  Complete Software Data Export
                </h2>
                <p className="text-xs text-slate-500">
                  Select sections and format to export
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
              aria-label="Close export modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Format Selector */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Export Format</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setExportFormat("CSV")}
                  className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    exportFormat === "CSV"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-semibold text-xs">CSV Files</div>
                    <div className="text-[11px] text-slate-400">One file per section</div>
                  </div>
                </button>
                <button
                  onClick={() => setExportFormat("PDF")}
                  className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    exportFormat === "PDF"
                      ? "border-blue-500 bg-blue-50 text-blue-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="text-base">📄</span>
                  <div className="text-left">
                    <div className="font-semibold text-xs">Print PDF</div>
                    <div className="text-[11px] text-slate-400">Combined report (all sections)</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Section Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700">
                  Select Sections ({selectedSections.length}/{ALL_SECTIONS.length})
                </p>
                <button
                  onClick={toggleAll}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                >
                  {selectedSections.length === ALL_SECTIONS.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_SECTIONS.map((section) => {
                  const isSelected = selectedSections.includes(section.key);
                  return (
                    <button
                      key={section.key}
                      onClick={() => toggleSection(section.key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
                        isSelected
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      )}
                      <span className="truncate">{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Progress */}
            {isExporting && progress && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <p className="text-xs font-semibold text-slate-700">
                    Exporting... ({progress.done}/{progress.total})
                  </p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Result / Error */}
            {resultMessage && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-800 font-medium">
                {resultMessage}
              </div>
            )}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">
              {selectedSections.length} section{selectedSections.length !== 1 ? "s" : ""} selected
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || selectedSections.length === 0}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {isExporting ? "Exporting..." : `Export ${exportFormat}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
