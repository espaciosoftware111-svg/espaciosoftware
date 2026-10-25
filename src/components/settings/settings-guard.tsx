"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  isSettingsAuthorized,
  setSettingsAuthorized,
  SETTINGS_PASSCODE,
} from "./settings-password-modal";
import { Lock, Eye, EyeOff, ShieldAlert, KeyRound, ArrowLeft } from "lucide-react";

interface SettingsGuardProps {
  children: React.ReactNode;
}

export const SettingsGuard: React.FC<SettingsGuardProps> = ({ children }) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    setIsAuthorized(isSettingsAuthorized());

    return () => {
      // Auto-lock when navigating away from settings to another section
      setSettingsAuthorized(false);
    };
  }, []);

  // During initial mount check, render quiet loader
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-[#DDD6CA] border-t-[#8C6E38] rounded-full animate-spin" />
      </div>
    );
  }

  // If already authorized, render the settings content
  if (isAuthorized) {
    return <>{children}</>;
  }

  // If not authorized, render the centered Settings Security Challenge
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.trim() === SETTINGS_PASSCODE) {
      setSettingsAuthorized(true);
      setIsAuthorized(true);
    } else {
      setError("Incorrect password. Access denied.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPassword("");
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 select-none">
      <div
        className={`w-full max-w-md bg-[#FFFEFC] rounded-2xl border border-[#EAE5DD] shadow-[0_12px_40px_rgba(36,35,33,0.08)] p-7 transition-all ${
          isShaking ? "animate-shake" : ""
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F5EFE6] border border-[#E4D7C5] flex items-center justify-center text-[#8C6E38] shadow-xs mb-3.5">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-[#242321] tracking-tight">
            Settings Security Verification
          </h1>
          <p className="text-xs text-[#77736C] mt-1.5 max-w-sm">
            Enter the administrative security password to access system configurations, users, and integrations.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#242321] mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter password"
                autoFocus
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

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-[#77736C] hover:text-[#242321] hover:bg-[#F5F2EC] transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-[#242321] hover:bg-[#34322E] text-white shadow-xs transition cursor-pointer"
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
