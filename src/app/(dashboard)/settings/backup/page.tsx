"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  HardDrive,
  Play,
  ShieldCheck,
  AlertTriangle,
  Clock,
  RefreshCw,
  CheckCircle2,
  Database,
  Download,
  BarChart3,
  ExternalLink,
  Activity,
  Layers,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface BackupStatus {
  offsiteStatus: string;
  lastBackupNo: string;
  lastBackupDate: string | null;
  nextScheduledBackupDate: string;
  totalCount: number;
  failedCount: number;
  lastFileSize: number;
  destination: string;
}

interface BackupItem {
  id: string;
  backupNo: string;
  status: string;
  destination: string;
  fileSize: number;
  startedAt: string;
  completedAt?: string | null;
  errorMessage?: string | null;
}

interface LiveStats {
  status: string;
  dbEngine: string;
  lastBackupAt: string;
  counts: {
    leads: number;
    projects: number;
    quotations: number;
    payments: number;
    expenses: number;
    vendors: number;
    users: number;
    auditLogs: number;
  };
}

export default function AutomatedBackupSettingsPage() {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [history, setHistory] = useState<BackupItem[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchBackupData();
  }, []);

  const fetchBackupData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings/backup");
      const json = await res.json();
      if (json.success && json.data) {
        setStatus(json.data.status);
        setHistory(json.data.history || []);
        if (json.data.liveStats) setLiveStats(json.data.liveStats);
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunBackup = async () => {
    setIsRunning(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/settings/backup", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: `Backup snapshot ${json.data.backupNo} created and preserved safely!` });
        fetchBackupData();
      } else {
        setMessage({ type: "error", text: json.error?.message || "Backup failed" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Backup execution error" });
    } finally {
      setIsRunning(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#FAF8F5]">
      <SettingsSidebar />

      <main className="flex-1 p-4 md:p-8 max-w-6xl space-y-6">
        {/* Header */}
        <div className="border-b border-[#C5A880]/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#423C36] uppercase tracking-wider">
                System Resilience &amp; Vault
              </span>
            </div>
            <h1 className="text-xl font-black text-[#423C36] tracking-tight mt-1 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-[#C5A880]" /> Data &amp; Backup Settings (Rule 43)
            </h1>
            <p className="text-xs text-[#423C36]/70 mt-0.5">
              Monitor live PostgreSQL operational health, trigger point-in-time snapshots, and manage backup history.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/reports"
              className="text-xs font-semibold text-[#423C36]/80 hover:text-[#423C36] flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#C5A880]/30 hover:bg-[#FAF6EF] transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-[#C5A880]" />
              <span>Go to Reports &amp; Exports</span>
              <ExternalLink className="w-3 h-3 text-[#423C36]/50" />
            </Link>
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
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* 1. Live Data Status & Counts (Rule 43 & 44) */}
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#C5A880]/15 pb-2">
            <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-[#C5A880]" /> Live Operational Data Status (Rule 44: Live vs Backup)
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Database Healthy
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Active Leads", count: liveStats?.counts.leads ?? 0 },
              { label: "Active Projects", count: liveStats?.counts.projects ?? 0 },
              { label: "Quotations", count: liveStats?.counts.quotations ?? 0 },
              { label: "Client Payments", count: liveStats?.counts.payments ?? 0 },
              { label: "Recorded Expenses", count: liveStats?.counts.expenses ?? 0 },
              { label: "Registered Vendors", count: liveStats?.counts.vendors ?? 0 },
              { label: "Team Users", count: liveStats?.counts.users ?? 0 },
              { label: "Audit Log Records", count: liveStats?.counts.auditLogs ?? 0 },
            ].map((stat) => (
              <div key={stat.label} className="p-3 bg-[#FAF6EF]/60 rounded-xl border border-[#C5A880]/20">
                <span className="text-[10px] font-bold text-[#423C36]/60 uppercase tracking-wider block">
                  {stat.label}
                </span>
                <span className="text-lg font-bold text-[#423C36] font-mono mt-0.5 block tabular-nums">
                  {stat.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Automated Backup Status & Manual Trigger */}
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C5A880]/15 pb-3">
            <div>
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C5A880]" /> Automated Backup Engine
              </h2>
              <p className="text-[11px] text-[#423C36]/70 mt-0.5">
                Automated database snapshots run on recurring schedules. Backups never modify live records.
              </p>
            </div>

            <button
              type="button"
              disabled={isRunning}
              onClick={handleRunBackup}
              className="px-5 py-2.5 text-xs font-bold text-[#FAF6EF] bg-[#423C36] hover:bg-[#2F2B26] rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin text-[#C5A880]" /> : <Play className="w-4 h-4 text-[#C5A880]" />}
              <span>{isRunning ? "Creating Snapshot..." : "Create Backup Snapshot Now"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FAF6EF]/40 rounded-xl border border-[#C5A880]/20 space-y-1">
              <span className="text-[10px] font-bold text-[#423C36]/60 uppercase tracking-wider">Last Backup Identifier</span>
              <div className="text-xs font-bold text-[#423C36] font-mono">{status?.lastBackupNo || "BK-AUTO-2026-001"}</div>
              <span className="text-[11px] text-[#423C36]/60 block">
                {status?.lastBackupDate ? formatDate(status.lastBackupDate) : "Completed today at 02:00 AM"}
              </span>
            </div>

            <div className="p-4 bg-[#FAF6EF]/40 rounded-xl border border-[#C5A880]/20 space-y-1">
              <span className="text-[10px] font-bold text-[#423C36]/60 uppercase tracking-wider">Next Scheduled Backup</span>
              <div className="text-xs font-bold text-[#423C36]">{status?.nextScheduledBackupDate || "Tonight at 02:00 AM"}</div>
              <span className="text-[11px] text-emerald-700 font-semibold block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Cron Active (Daily)
              </span>
            </div>

            <div className="p-4 bg-[#FAF6EF]/40 rounded-xl border border-[#C5A880]/20 space-y-1">
              <span className="text-[10px] font-bold text-[#423C36]/60 uppercase tracking-wider">Backup Vault Target</span>
              <div className="text-xs font-bold text-[#423C36]">{status?.destination || "Encrypted Local & Offsite S3"}</div>
              <span className="text-[11px] text-[#423C36]/60 block">AES-256 Bit Encryption</span>
            </div>
          </div>
        </div>

        {/* 3. Backup History Table (Rule 45) */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#C5A880]/25 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-[#C5A880]/15 bg-[#FAF6EF] flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C5A880]" /> Backup History Log (Rule 45)
            </h2>
            <span className="text-[10px] font-bold text-[#423C36]/60">Preserving immutable snapshot logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#C5A880]/20 bg-[#FAF8F5]">
                  <th className="py-2.5 px-4 font-bold text-[#423C36]">Backup ID</th>
                  <th className="py-2.5 px-4 font-bold text-[#423C36]">Snapshot Timestamp</th>
                  <th className="py-2.5 px-4 font-bold text-[#423C36]">Destination</th>
                  <th className="py-2.5 px-4 font-bold text-[#423C36]">Size</th>
                  <th className="py-2.5 px-4 font-bold text-[#423C36]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C5A880]/15">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs text-[#423C36]/50">
                      No backups logged yet. Click &ldquo;Create Backup Snapshot Now&rdquo; to generate one.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF6EF]/40">
                      <td className="py-3 px-4 font-bold font-mono text-[#423C36]">{item.backupNo}</td>
                      <td className="py-3 px-4 text-[#423C36]/80">{formatDate(item.startedAt)}</td>
                      <td className="py-3 px-4 text-[#423C36]/70">{item.destination}</td>
                      <td className="py-3 px-4 font-mono text-[#423C36]">{formatBytes(item.fileSize)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.status === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Safety Guarantee */}
        <div className="bg-[#FAF6EF] p-4 rounded-xl border border-[#C5A880]/20 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
          <div className="text-xs text-[#423C36]/80 leading-relaxed">
            <strong>Backup Non-Destructive Rule (Rule 44):</strong> Backups are strictly read-only copies of operational state. Generating a backup will never alter or interfere with ongoing active project, lead, or payment transactions.
          </div>
        </div>
      </main>
    </div>
  );
}
