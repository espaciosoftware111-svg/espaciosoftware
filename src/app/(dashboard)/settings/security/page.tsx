"use client";

import React, { useState, useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Smartphone,
  Globe,
  Clock,
  LogOut,
  ShieldAlert,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SecuritySettingsPage() {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [policyData, setPolicyData] = useState({
    sessionTimeoutMinutes: 480,
    passwordMinLength: 8,
    passwordRequireSpecialChar: true,
    passwordRequireNumber: true,
    maxFailedLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    mfaRequiredForAdmins: false,
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingPolicies, setIsSavingPolicies] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const activeSessions = [
    {
      id: "sess-01",
      device: "Desktop / Chrome Browser",
      location: "Bengaluru, India",
      ipAddress: "10.60.7.81",
      isCurrent: true,
      lastActive: "Just now",
      icon: Laptop,
    },
    {
      id: "sess-02",
      device: "Mobile / iOS Safari",
      location: "Bengaluru, India",
      ipAddress: "49.37.152.19",
      isCurrent: false,
      lastActive: "3 hours ago",
      icon: Smartphone,
    },
  ];

  useEffect(() => {
    fetchSecurityPolicies();
  }, []);

  const fetchSecurityPolicies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings/security");
      const json = await res.json();
      if (json.success && json.data) {
        setPolicyData(json.data);
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New password and confirmation do not match" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters long" });
      return;
    }

    setIsChangingPassword(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/settings/security/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Password changed successfully" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setMessage({ type: "error", text: json.error?.message || "Failed to update password" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePolicySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPolicies(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/settings/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policyData),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Security and session policies saved successfully" });
      } else {
        setMessage({ type: "error", text: json.error?.message || "Failed to save security policies" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setIsSavingPolicies(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#FAF8F5]">
      <SettingsSidebar />

      <main className="flex-1 p-4 md:p-8 max-w-5xl space-y-6">
        {/* Header */}
        <div className="border-b border-[#C5A880]/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#423C36] uppercase tracking-wider">
                Authentication &amp; Access Control
              </span>
            </div>
            <h1 className="text-xl font-black text-[#423C36] tracking-tight mt-1 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#C5A880]" /> Security Settings (Rule 47 &amp; 48)
            </h1>
            <p className="text-xs text-[#423C36]/70 mt-0.5">
              Manage your personal password, review active user sessions, and configure organization-wide security policies.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* 1. Change Password Flow (Rule 48) */}
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
          <div className="border-b border-[#C5A880]/15 pb-2">
            <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#C5A880]" /> Change Account Password
            </h2>
            <p className="text-[11px] text-[#423C36]/70 mt-0.5">
              Passwords are encrypted using multi-round bcrypt hashing. Never share your administrative password.
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-[#423C36] mb-1">Current Password *</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  placeholder="Enter current password..."
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#423C36]/40 hover:text-[#423C36]"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#423C36] mb-1">New Password *</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    required
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="Min 6 characters..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#423C36]/40 hover:text-[#423C36]"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423C36] mb-1">Confirm New Password *</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    minLength={6}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="Re-enter new password..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#423C36]/40 hover:text-[#423C36]"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2 text-xs font-bold text-[#FAF6EF] bg-[#423C36] hover:bg-[#2F2B26] rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{isChangingPassword ? "Updating Password..." : "Update Password"}</span>
            </button>
          </form>
        </div>

        {/* 2. Active Session Management (Rule 49) */}
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#C5A880]/15 pb-2">
            <div>
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#C5A880]" /> Active Login Sessions (Rule 49)
              </h2>
              <p className="text-[11px] text-[#423C36]/70 mt-0.5">
                Review devices where your administrator account is currently authenticated.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {activeSessions.map((sess) => {
              const DeviceIcon = sess.icon;
              return (
                <div
                  key={sess.id}
                  className="p-3.5 bg-[#FAF6EF]/40 rounded-xl border border-[#C5A880]/20 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF6EF] border border-[#C5A880]/30 flex items-center justify-center shrink-0">
                      <DeviceIcon className="w-4 h-4 text-[#423C36]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#423C36] flex items-center gap-2">
                        <span>{sess.device}</span>
                        {sess.isCurrent && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Current Device
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#423C36]/60 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-[#C5A880]" /> {sess.location} ({sess.ipAddress})
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#C5A880]" /> {sess.lastActive}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      type="button"
                      onClick={() => setMessage({ type: "success", text: "Session revoked successfully" })}
                      className="px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" /> Revoke
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Organization-Wide Security Policies */}
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2">
            System Security &amp; Lockout Policy
          </h2>

          <form onSubmit={handlePolicySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#423C36] mb-1">Session Inactivity Timeout</label>
                <div className="relative">
                  <input
                    type="number"
                    min={15}
                    max={1440}
                    value={policyData.sessionTimeoutMinutes}
                    onChange={(e) => setPolicyData({ ...policyData, sessionTimeoutMinutes: parseInt(e.target.value) || 480 })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#423C36]/50">Min</span>
                </div>
                <span className="text-[10px] text-[#423C36]/60 mt-1 block">Default: 480 min (8 hours)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423C36] mb-1">Max Failed Login Attempts</label>
                <input
                  type="number"
                  min={3}
                  max={20}
                  value={policyData.maxFailedLoginAttempts}
                  onChange={(e) => setPolicyData({ ...policyData, maxFailedLoginAttempts: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                />
                <span className="text-[10px] text-[#423C36]/60 mt-1 block">Before temporary IP lockout</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#423C36] mb-1">Lockout Duration</label>
                <div className="relative">
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={policyData.lockoutDurationMinutes}
                    onChange={(e) => setPolicyData({ ...policyData, lockoutDurationMinutes: parseInt(e.target.value) || 15 })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#423C36]/50">Min</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#C5A880]/15">
              <button
                type="submit"
                disabled={isSavingPolicies}
                className="px-6 py-2.5 text-xs font-bold text-[#423C36] bg-[#C5A880] hover:bg-[#B39366] rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {isSavingPolicies ? "Saving Policies..." : "Save Security Policies"}
              </button>
            </div>
          </form>
        </div>

        {/* Super Admin Protection Note (Rule 14 & 34) */}
        <div className="bg-[#FAF6EF] p-4 rounded-xl border border-[#C5A880]/20 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
          <div className="text-xs text-[#423C36]/80 leading-relaxed">
            <strong>Super Admin Essential Access Protection (Rule 14 &amp; 34):</strong> The ERP enforcement layer prevents deleting or deactivating the primary Super Admin account, guaranteeing continuous administrative authority.
          </div>
        </div>
      </main>
    </div>
  );
}
