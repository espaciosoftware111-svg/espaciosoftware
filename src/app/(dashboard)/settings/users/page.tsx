"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  Users,
  UserPlus,
  Shield,
  UserX,
  CheckCircle2,
  X,
  Search,
  Key,
  Check,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  status: string;
  accessLevel: "SUPER_ADMIN" | "ADMIN" | "USER";
  createdAt: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Add User Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset Password Modal state
  const [resetModalUser, setResetModalUser] = useState<UserItem | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Delete User Modal state
  const [deleteModalUser, setDeleteModalUser] = useState<UserItem | null>(null);
  const [deleteSettingsPassword, setDeleteSettingsPassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Confirmation Modal
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings/users");
      const json = await res.json();
      if (json.success) {
        setUsers(json.data || []);
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newEmail || !newName) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          fullName: newName,
          phone: newPhone || undefined,
          accessLevel: "SUPER_ADMIN",
          roleName: "SUPER_ADMIN",
          password: newPassword || undefined,
          status: "ACTIVE",
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsAddModalOpen(false);
        setNewEmail("");
        setNewName("");
        setNewPhone("");
        setNewPassword("");
        fetchUsers();
      } else {
        setFormError(json.error?.message || "Failed to create user account.");
      }
    } catch {
      setFormError("Network error while creating user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = (userId: string, userName: string) => {
    setConfirmAction({
      title: "Deactivate User Account",
      message: `Are you sure you want to deactivate ${userName}? They will be immediately blocked from logging in, but all their audit history and records will remain safely preserved.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/settings/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "DEACTIVATED" }),
          });
          const json = await res.json();
          if (json.success) {
            fetchUsers();
          } else {
            alert(json.error?.message || "Failed to deactivate user.");
          }
        } catch {
          alert("Network error.");
        } finally {
          setConfirmAction(null);
        }
      },
    });
  };

  const handleReactivate = async (userId: string) => {
    try {
      const res = await fetch(`/api/v1/settings/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      const json = await res.json();
      if (json.success) {
        fetchUsers();
      } else {
        alert(json.error?.message || "Failed to reactivate user.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !resetPasswordValue) return;

    setIsResetting(true);
    setResetSuccessMessage(null);

    try {
      const res = await fetch(`/api/v1/settings/users/${resetModalUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPasswordValue }),
      });

      const json = await res.json();
      if (json.success) {
        setResetSuccessMessage(`Password updated successfully for ${resetModalUser.fullName}.`);
        setResetPasswordValue("");
        setTimeout(() => {
          setResetModalUser(null);
          setResetSuccessMessage(null);
        }, 1500);
      } else {
        alert(json.error?.message || "Failed to update password.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteModalUser) return;
    setDeleteError(null);

    const cleanPass = deleteSettingsPassword.trim();
    if (!cleanPass) {
      setDeleteError("Please enter the settings security password.");
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/v1/settings/users/${deleteModalUser.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settingsPassword: cleanPass,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setDeleteModalUser(null);
        setDeleteSettingsPassword("");
        fetchUsers();
      } else {
        setDeleteError(json.error?.message || "Incorrect settings password. User cannot be deleted.");
      }
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery));

      const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-cream/20">
      <SettingsSidebar />

      <main className="flex-1 p-4 md:p-8 max-w-6xl space-y-6">
        {/* Top Header Banner */}
        <div className="bg-white p-6 rounded-2xl border border-walnut/15 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gold/20 text-gold-darker tracking-wider uppercase">
                PEOPLE &amp; ACCESS
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Audit Logged
              </span>
            </div>
            <h1 className="text-2xl font-black text-charcoal tracking-tight mt-1">Users &amp; Access</h1>
            <p className="text-xs text-walnut mt-0.5 max-w-xl leading-relaxed">
              Manage system users and access. Every user operates with Super Admin privileges across all ERP modules, while all modifications and business actions are automatically audited with the identity of the person who changed them.
            </p>
          </div>

          <button
            onClick={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-charcoal hover:bg-charcoal/90 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-gold" />
            <span>Add New User</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-3.5 rounded-xl border border-walnut/15 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-walnut/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-cream/30 border border-walnut/20 rounded-lg text-charcoal placeholder:text-walnut/50 focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-cream/30 border border-walnut/20 rounded-lg text-charcoal font-medium focus:outline-none focus:border-gold"
            >
              <option value="ALL">All Statuses ({users.length})</option>
              <option value="ACTIVE">Active Users</option>
              <option value="DEACTIVATED">Deactivated</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-walnut/15 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-walnut/15 bg-cream/40">
                  <th className="py-3 px-4 font-bold text-charcoal">User Account</th>
                  <th className="py-3 px-4 font-bold text-charcoal">Authority Level</th>
                  <th className="py-3 px-4 font-bold text-charcoal">2-Step Verification</th>
                  <th className="py-3 px-4 font-bold text-charcoal">Status</th>
                  <th className="py-3 px-4 font-bold text-charcoal">Created At</th>
                  <th className="py-3 px-4 font-bold text-charcoal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-walnut/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-walnut/60">
                      Loading user accounts...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-walnut/60">
                      No user accounts found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isDeactivated = user.status === "DEACTIVATED";

                    return (
                      <tr key={user.id} className="hover:bg-cream/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-charcoal flex items-center gap-1.5">
                            {user.fullName}
                            <span className="p-0.5 rounded bg-gold/20 text-gold-darker text-[10px]" title="Super Admin Authority">
                              <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                            </span>
                          </div>
                          <div className="text-walnut text-[11px] font-mono mt-0.5">{user.email}</div>
                          {user.phone && <div className="text-walnut/70 text-[10px]">{user.phone}</div>}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 text-[10px] font-bold font-mono rounded-md border bg-amber-100 text-amber-900 border-amber-300 shadow-2xs flex items-center gap-1 w-fit">
                            <Shield className="w-3 h-3 text-gold" /> SUPER ADMIN
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Smartphone className="w-3 h-3 text-emerald-600" /> Mandatory TOTP
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              user.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-walnut font-tabular">
                          {formatDate(user.createdAt)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setResetModalUser(user);
                                setResetPasswordValue("");
                                setResetSuccessMessage(null);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-charcoal bg-cream hover:bg-cream-hover border border-walnut/20 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                              title="Reset Password"
                            >
                              <Key className="w-3 h-3 text-walnut" />
                              <span>Reset Password</span>
                            </button>

                            {isDeactivated ? (
                              <button
                                onClick={() => handleReactivate(user.id)}
                                className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reactivate</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeactivate(user.id, user.fullName)}
                                className="px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <UserX className="w-3 h-3" />
                                <span>Deactivate</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setDeleteModalUser(user);
                                setDeleteSettingsPassword("");
                                setShowDeletePassword(false);
                                setDeleteError(null);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                              title="Delete User Account"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Safety Banner */}
        <div className="p-4 bg-[#FAF6EF] rounded-xl border border-walnut/20 text-xs text-charcoal/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
            <span>
              <strong>Audit Safety Guarantee:</strong> All state changes, deletions, approvals, and creations across the ERP record the specific user, timestamp, and IP address in the central AuditLog.
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ADD USER MODAL                                            */}
        {/* ========================================================= */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-walnut/20 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-walnut/15 flex items-center justify-between bg-cream/60">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-gold" />
                  <h3 className="text-sm font-bold text-charcoal">Add New User Account</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-walnut hover:text-charcoal rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-walnut mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-walnut/20 bg-cream/30 rounded-lg text-charcoal focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-walnut mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@espacio.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-walnut/20 bg-cream/30 rounded-lg text-charcoal focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-walnut mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-walnut/20 bg-cream/30 rounded-lg text-charcoal focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-walnut">
                      Temporary Password (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
                        let rand = "";
                        for (let i = 0; i < 10; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
                        setNewPassword(rand);
                      }}
                      className="text-[11px] text-gold hover:text-gold-hover font-semibold underline cursor-pointer"
                    >
                      Generate Random
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Espacio@2026! or click Generate"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-walnut/20 bg-cream/30 rounded-lg text-charcoal focus:outline-none focus:border-gold"
                  />
                  <p className="text-[10px] text-walnut/70 mt-1">
                    Member must change this on first login before 2-step verification.
                  </p>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-charcoal flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-amber-900">Mandatory First-Time Security Workflow</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      On first sign-in, the user will be prompted to replace their temporary password with a new personal password. Immediately after, they will scan the QR code to set up Google Authenticator 2-Step Verification.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-walnut/15 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-walnut hover:bg-cream rounded-lg transition-colors border border-walnut/20 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold text-charcoal bg-gold hover:bg-gold-hover rounded-lg shadow-gold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Creating Account..." : "Create User Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* RESET PASSWORD MODAL                                      */}
        {/* ========================================================= */}
        {resetModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-walnut/20 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-4 border-b border-walnut/15 flex items-center justify-between bg-cream/60">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gold" />
                  <h3 className="text-sm font-bold text-charcoal">Reset Password</h3>
                </div>
                <button
                  onClick={() => setResetModalUser(null)}
                  className="p-1 text-walnut hover:text-charcoal rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="p-5 space-y-4">
                <div>
                  <p className="text-xs text-walnut mb-2">
                    Enter a new password for <strong className="text-charcoal">{resetModalUser.fullName}</strong> ({resetModalUser.email}).
                  </p>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-walnut/20 bg-cream/30 rounded-lg text-charcoal focus:outline-none focus:border-gold"
                  />
                </div>

                {resetSuccessMessage && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{resetSuccessMessage}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-walnut/15 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-walnut hover:bg-cream rounded-lg border border-walnut/20 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="px-4 py-1.5 text-xs font-bold text-charcoal bg-gold hover:bg-gold-hover rounded-lg shadow-gold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isResetting ? "Updating..." : "Save Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* DELETE USER MODAL (SETTINGS SECURITY PASSWORD PROTECTED)   */}
        {/* ========================================================= */}
        {deleteModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-950">Delete User Account</h3>
                    <p className="text-[11px] text-rose-700">Permanent account removal</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteModalUser(null)}
                  className="p-1 text-rose-400 hover:text-rose-700 rounded-md cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleDeleteUser} className="p-5 space-y-4">
                <div className="p-3 bg-[#FAF6EE] rounded-xl border border-[#E8DFC8] space-y-1">
                  <div className="text-xs font-bold text-[#242321]">{deleteModalUser.fullName}</div>
                  <div className="text-[11px] font-mono text-[#6A5844]">{deleteModalUser.email}</div>
                  <div className="text-[10px] uppercase font-bold text-[#8A755E] pt-0.5">
                    Authority: {deleteModalUser.accessLevel}
                  </div>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-900 leading-relaxed">
                  <p className="font-semibold text-rose-950 mb-0.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    Permanent Deletion Notice
                  </p>
                  This action will permanently delete this user account. The associated user roles and permissions will be removed. All historical audit logs and data records will be safely preserved.
                </div>

                {deleteError && (
                  <div className="p-3 bg-rose-100/80 border border-rose-300 rounded-xl text-xs font-semibold text-rose-900 flex items-center gap-2 animate-in fade-in duration-150">
                    <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1.5">
                    Settings Security Password <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-walnut">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showDeletePassword ? "text" : "password"}
                      required
                      autoFocus
                      placeholder="Enter settings security password"
                      value={deleteSettingsPassword}
                      onChange={(e) => setDeleteSettingsPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 text-xs font-mono border border-walnut/25 bg-[#FAF8F5] rounded-xl text-charcoal focus:outline-none focus:border-rose-500 focus:bg-white transition-all shadow-2xs"
                      disabled={isDeleting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-walnut hover:text-charcoal cursor-pointer"
                      aria-label={showDeletePassword ? "Hide password" : "Show password"}
                    >
                      {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-walnut/70 mt-1">
                    Enter the master settings passcode to confirm authorization.
                  </p>
                </div>

                <div className="pt-3 border-t border-walnut/15 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeleteModalUser(null)}
                    disabled={isDeleting}
                    className="px-3.5 py-2 text-xs font-semibold text-walnut hover:bg-cream rounded-xl border border-walnut/20 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                        <span>Delete User</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CONFIRMATION MODAL                                        */}
        {/* ========================================================= */}
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl border border-walnut/20 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {confirmAction.title}
              </h3>
              <p className="text-xs text-walnut leading-relaxed">{confirmAction.message}</p>
              <div className="pt-3 border-t border-walnut/15 flex items-center justify-end gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-walnut hover:bg-cream rounded-lg border border-walnut/20 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction.onConfirm}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
