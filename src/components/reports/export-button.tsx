"use client";

import React, { useState } from "react";
import { Download, FileText, FileSpreadsheet, Loader2, ChevronDown } from "lucide-react";

export interface ExportButtonProps {
  /** The report key from REPORT_CATALOG (e.g. "sales_leads") */
  reportKey: string;
  /** Human-readable label for this export (e.g. "Leads") */
  label?: string;
  /** Active filter to pass to report API */
  filter?: {
    period?: string;
    startDate?: string;
    endDate?: string;
    projectId?: string;
    clientId?: string;
  };
  /** Optional extra CSS classes for the button */
  className?: string;
  /** Size variant */
  size?: "xs" | "sm" | "md";
}

/**
 * ExportButton — Reusable drop-down export button for any module.
 *
 * Provides three options:
 *   1. Export CSV    → downloads a .csv file
 *   2. Export JSON   → downloads a .json file
 *   3. Open PDF      → opens print-ready HTML in a new tab
 */
export function ExportButton({
  reportKey,
  label = "Export",
  filter = { period: "this_year" },
  className = "",
  size = "sm",
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState<string | null>(null);

  const sizeClasses = {
    xs: "text-xs px-2.5 py-1.5 gap-1.5",
    sm: "text-xs px-3 py-2 gap-2",
    md: "text-sm px-4 py-2 gap-2",
  };

  const handleExport = async (format: "CSV" | "JSON") => {
    setLoadingFormat(format);
    setIsOpen(false);
    try {
      const res = await fetch("/api/v1/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportKey, format, filter }),
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format === "CSV" ? "csv" : "json";
      a.download = `${reportKey}_${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please try again.");
    } finally {
      setLoadingFormat(null);
    }
  };

  const handlePdf = async () => {
    setLoadingFormat("PDF");
    setIsOpen(false);
    try {
      const res = await fetch("/api/v1/reports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportKey, filter }),
      });

      if (!res.ok) throw new Error("PDF generation failed");

      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      // Revoke after a short delay so the new tab can load
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed. Please try again.");
    } finally {
      setLoadingFormat(null);
    }
  };

  const isLoading = loadingFormat !== null;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Main button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        disabled={isLoading}
        className={`inline-flex items-center ${sizeClasses[size]} font-medium rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
        aria-label={`Export ${label}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>{isLoading ? `Exporting ${loadingFormat}...` : label}</span>
        <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-full mt-1.5 z-50 min-w-[176px] bg-white rounded-xl border border-slate-200 shadow-lg py-1 overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Export Options</p>
            </div>

            <button
              role="menuitem"
              onClick={() => handleExport("CSV")}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <div className="text-left">
                <div className="font-semibold">Export CSV</div>
                <div className="text-slate-400 text-[11px]">Open in Excel / Sheets</div>
              </div>
            </button>

            <button
              role="menuitem"
              onClick={() => handleExport("JSON")}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <div className="text-left">
                <div className="font-semibold">Export JSON</div>
                <div className="text-slate-400 text-[11px]">Structured data format</div>
              </div>
            </button>

            <button
              role="menuitem"
              onClick={handlePdf}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <span className="text-slate-600 text-sm leading-none">📄</span>
              <div className="text-left">
                <div className="font-semibold">Open Print PDF</div>
                <div className="text-slate-400 text-[11px]">Print-ready report → Save as PDF</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
