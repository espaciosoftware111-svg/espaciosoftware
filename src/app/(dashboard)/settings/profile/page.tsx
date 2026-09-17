"use client";

import React, { useState, useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { UserCheck, Save, CheckCircle2, AlertCircle, Shield, Upload, Trash2, User, Phone, Mail } from "lucide-react";

export default function UserProfileSettingsPage() {
  const [profile, setProfile] = useState({
    id: "",
    email: "",
    fullName: "",
    displayName: "",
    phone: "",
    avatarUrl: "",
    userRoles: [] as any[],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings/profile");
      const json = await res.json();
      if (json.success && json.data) {
        setProfile({
          id: json.data.id || "",
          email: json.data.email || "",
          fullName: json.data.fullName || "",
          displayName: json.data.fullName || "",
          phone: json.data.phone || "",
          avatarUrl: json.data.avatarUrl || "",
          userRoles: json.data.userRoles || [],
        });
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: "error", text: "Photo must be smaller than 2MB" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        setProfile((prev) => ({ ...prev, avatarUrl: base64Url }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profile.fullName,
          phone: profile.phone,
          avatarUrl: profile.avatarUrl,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Personal profile updated successfully" });
      } else {
        setMessage({ type: "error", text: json.error?.message || "Failed to update profile" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#FAF8F5]">
      <SettingsSidebar />

      <main className="flex-1 p-4 md:p-8 max-w-4xl space-y-6">
        <div className="border-b border-[#C5A880]/20 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#423C36] uppercase tracking-wider">
              Personal Account
            </span>
          </div>
          <h1 className="text-xl font-black text-[#423C36] tracking-tight mt-1 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#C5A880]" /> My Profile Settings (Rule 8 &amp; 9)
          </h1>
          <p className="text-xs text-[#423C36]/70 mt-0.5">
            Manage your personal administrative identity, profile photo, and communication phone number.
          </p>
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

        {isLoading ? (
          <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#C5A880]/20 text-center text-xs text-[#423C36]/50">
            Loading user profile...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Avatar Card */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2">
                Profile Photo (Rule 9)
              </h2>

              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-[#FAF6EF] rounded-xl border border-[#C5A880]/20">
                <div className="w-20 h-20 rounded-full bg-[#FFFFFF] border-2 border-[#C5A880] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {profile.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-9 h-9 text-[#C5A880]" />
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="text-xs font-bold text-[#423C36]">
                    {profile.fullName || "User Avatar"}
                  </div>
                  <p className="text-[11px] text-[#423C36]/70 leading-relaxed">
                    Upload PNG, JPG, or WEBP under 2MB. Your avatar appears in activity timelines and top navigation.
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <label className="px-3 py-1.5 bg-[#423C36] hover:bg-[#2F2B26] text-[#FAF6EF] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Upload Photo</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>

                    {profile.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setProfile({ ...profile, avatarUrl: "" })}
                        className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2">
                User Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">
                    Email Address <span className="text-[#423C36]/50 font-normal">(System ID - Read Only)</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full px-3 py-2 text-xs border border-[#C5A880]/20 rounded-xl bg-[#FAF6EF]/80 text-[#423C36]/70 font-mono opacity-80 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            {/* Role & Permissions Card */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-3">
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#C5A880]" /> Assigned Roles &amp; System Authorization
              </h2>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {profile.userRoles && profile.userRoles.length > 0 ? (
                  profile.userRoles.map((ur: any) => (
                    <span
                      key={ur.role?.id || ur.id}
                      className="px-3 py-1 text-xs font-bold font-mono rounded-lg bg-[#C5A880]/20 text-[#423C36] border border-[#C5A880]/30"
                    >
                      {ur.role?.name || "SUPER_ADMIN"}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#423C36]/70">Super Admin Access</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-bold text-[#423C36] bg-[#C5A880] hover:bg-[#B39366] rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
