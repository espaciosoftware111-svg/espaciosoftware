"use client";

import React, { useState } from "react";
import {
  Trash2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  X,
  Database,
  ArrowRight,
} from "lucide-react";

interface PurgeDataSectionProps {
  onSuccess?: () => void;
  className?: string;
}

export function PurgeDataSection({ onSuccess, className = "" }: PurgeDataSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const REQUIRED_PHRASE = "RESET ALL DATA";

  const handleOpenModal = () => {
    setPassword("");
    setConfirmationPhrase("");
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    setPassword("");
    setConfirmationPhrase("");
    setErrorMessage(null);
  };

  const handlePurgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (confirmationPhrase !== REQUIRED_PHRASE) {
      setErrorMessage(`Please type exactly "${REQUIRED_PHRASE}" in the confirmation box.`);
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your Super Admin password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/v1/settings/purge-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          confirmationPhrase,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || "Failed to purge database data.");
      }

      setSuccessMessage(json.message || "All ERP data has been successfully reset to 0!");
      setPassword("");
      setConfirmationPhrase("");

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while resetting data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = confirmationPhrase === REQUIRED_PHRASE && password.length >= 1;

  return (
    <>
      {/* Danger Zone Card */}
      <div className={`bg-[#FFFFFF] p-6 rounded-2xl border-2 border-rose-200/80 shadow-2xs space-y-4 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 tracking-wider uppercase flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" /> Danger Zone
              </span>
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                Admin Password Required
              </span>
            </div>
            <h2 className="text-sm font-black text-[#423C36] tracking-tight flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" /> System-Wide Data Reset &amp; Purge
            </h2>
            <p className="text-xs text-[#423C36]/70 max-w-xl leading-relaxed">
              Permanently delete all operational transactions including <strong>Leads</strong>, <strong>Material Requests</strong>, <strong>Quotations</strong>, <strong>Projects</strong>, <strong>Expenses</strong>, <strong>Client Payments</strong>, <strong>Purchase Orders</strong>, <strong>Vendors</strong>, and <strong>Inventory Stocks</strong>. Resets all totals and financial balances to <strong>₹0</strong> while preserving admin user credentials and system configuration.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 border border-rose-700/30"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All ERP Data</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200/50 space-y-0.5">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">What gets cleared</span>
            <p className="text-[11px] text-rose-900/80">Leads, Projects, Expenses, Payments, POs, GRNs, Stocks, Tasks, Logs</p>
          </div>
          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/50 space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">What gets kept</span>
            <p className="text-[11px] text-emerald-900/80">Admin Accounts, System Roles, Permissions, Tax &amp; Company Profile</p>
          </div>
          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/50 space-y-0.5">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Financial Accounts</span>
            <p className="text-[11px] text-amber-900/80">Bank, Cash Locker &amp; UPI accounts reset to clean ₹0.00 balances</p>
          </div>
        </div>
      </div>

      {/* Confirmation & Password Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-[#FFFFFF] rounded-2xl max-w-lg w-full border border-rose-300 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="bg-rose-50/90 p-5 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-rose-950 tracking-tight">
                    Confirm Complete System Data Purge
                  </h3>
                  <p className="text-[11px] text-rose-800/80">
                    This action will reset all software records to 0
                  </p>
                </div>
              </div>

              {!isSubmitting && (
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-lg hover:bg-rose-200/60 text-rose-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handlePurgeSubmit} className="p-6 space-y-5">
              {/* Alert Box */}
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-900 leading-relaxed">
                  <strong>Permanent Data Loss:</strong> All leads, materials, expenses, client payments, quotations, projects, purchase orders, inventory stocks, and transaction logs will be permanently deleted and cannot be recovered.
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-rose-100 rounded-xl border border-rose-300 text-xs text-rose-900 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="p-3.5 bg-emerald-100 rounded-xl border border-emerald-300 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{successMessage} Reloading system...</span>
                </div>
              )}

              {/* Step 1: Confirmation phrase */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#423C36] block">
                  1. Type <span className="font-mono text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded text-[11px]">{REQUIRED_PHRASE}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmationPhrase}
                  onChange={(e) => setConfirmationPhrase(e.target.value)}
                  placeholder={`Type "${REQUIRED_PHRASE}" here`}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-[#FAF8F5] border border-[#C5A880]/40 rounded-xl text-[#423C36] placeholder-[#423C36]/40 focus:outline-hidden focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all disabled:opacity-50"
                  autoFocus
                />
              </div>

              {/* Step 2: Admin Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#423C36] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#C5A880]" /> 2. Enter Super Admin Password:
                  </span>
                  <span className="text-[10px] text-[#423C36]/60 font-normal">Security verification</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your admin account password"
                    disabled={isSubmitting}
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-[#FAF8F5] border border-[#C5A880]/40 rounded-xl text-[#423C36] placeholder-[#423C36]/40 focus:outline-hidden focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#423C36]/50 hover:text-[#423C36] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#C5A880]/15">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-xs font-semibold text-[#423C36] bg-[#FAF8F5] hover:bg-[#FAF6EF] border border-[#C5A880]/30 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-rose-700/30"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Purging All Data...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Purge Everything to 0</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
