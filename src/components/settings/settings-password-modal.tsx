"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lock, Eye, EyeOff, ShieldAlert, KeyRound, X } from "lucide-react";

export const SETTINGS_PASSCODE = "9505151116";
export const SETTINGS_STORAGE_KEY = "espacio_settings_authorized";

export function isSettingsAuthorized(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SETTINGS_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setSettingsAuthorized(authorized: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (authorized) {
      sessionStorage.setItem(SETTINGS_STORAGE_KEY, "true");
    } else {
      sessionStorage.removeItem(SETTINGS_STORAGE_KEY);
    }
  } catch {
    // quiet handling
  }
}

interface SettingsPasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const SettingsPasswordModal: React.FC<SettingsPasswordModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  title = "Settings Protected",
  description = "Enter the security password to access system settings.",
}) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setError(null);
      setIsShaking(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.trim() === SETTINGS_PASSCODE) {
      setSettingsAuthorized(true);
      onSuccess();
    } else {
      setError("Incorrect password. Access denied.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPassword("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#242321]/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-md bg-[#FFFEFC] rounded-2xl border border-[#EAE5DD] shadow-[0_20px_50px_rgba(36,35,33,0.18)] p-6 z-10 transition-all animate-in zoom-in-95 duration-150 ${
          isShaking ? "animate-shake" : ""
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#77736C] hover:text-[#242321] hover:bg-[#F5F2EC] transition-colors cursor-pointer"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F5EFE6] border border-[#E4D7C5] flex items-center justify-center text-[#8C6E38] shadow-xs mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#242321] tracking-tight">{title}</h2>
          <p className="text-xs text-[#77736C] mt-1 max-w-xs">{description}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#242321] mb-1.5">
              Security Password
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-[#FAF8F5] border border-[#DDD6CA] rounded-xl text-[#242321] placeholder:text-[#A8A29A] focus:outline-none focus:ring-2 focus:ring-[#B99558]/30 focus:border-[#B99558] transition"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77736C] hover:text-[#242321] transition cursor-pointer p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-rose-600 animate-in fade-in">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-[#77736C] hover:text-[#242321] hover:bg-[#F5F2EC] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#242321] hover:bg-[#34322E] text-white shadow-xs transition cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unlock Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
