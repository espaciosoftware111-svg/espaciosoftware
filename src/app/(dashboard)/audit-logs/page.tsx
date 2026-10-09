"use client";

import React, { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/table";
import { ShieldAlert, RefreshCw, ShieldCheck, Activity, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/audit-logs");
      const json = await res.json();
      if (json.success && json.data) {
        setAuditLogs(json.data);
      }
    } catch {
      // quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    {
      header: "Timestamp",
      accessorKey: "createdAt" as const,
      cell: (row: any) => (
        <span className="font-mono text-xs text-[#77716A]">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      header: "Actor / User",
      accessorKey: "user" as const,
      cell: (row: any) => (
        <div>
          <span className="font-semibold text-[#262421] block">{row.user?.fullName || "System Engine"}</span>
          <span className="text-[10px] text-[#77716A] font-mono">{row.user?.email || "system@espacio.internal"}</span>
        </div>
      ),
    },
    {
      header: "Action Code",
      accessorKey: "action" as const,
      cell: (row: any) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
            row.action?.includes("DELETE") || row.action?.includes("SECURITY")
              ? "bg-[#FAF0ED] text-[#A45435] border border-[#EACDC4]"
              : row.action?.includes("CREATE") || row.action?.includes("AUTH")
              ? "bg-[#F4F7F3] text-[#536B4E] border border-[#D1E0CD]"
              : "bg-[#F3EEE5] text-[#77716A] border border-[#E8E2D8]"
          }`}
        >
          {row.action}
        </span>
      ),
    },
    {
      header: "Target Entity",
      accessorKey: "entityType" as const,
      cell: (row: any) => (
        <span className="font-mono text-xs text-[#262421] font-semibold">
          {row.entityType}:{row.entityId ? row.entityId.substring(0, 8) : "N/A"}
        </span>
      ),
    },
    {
      header: "IP Address",
      accessorKey: "ipAddress" as const,
      cell: (row: any) => (
        <span className="font-mono text-xs text-[#77716A]">{row.ipAddress || "127.0.0.1"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#89652D]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#262421] tracking-tight">System Audit Log</h1>
              <p className="text-xs text-[#77716A]">
                Immutable system event ledger capturing authentication and operational data updates
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="p-2 text-[#77716A] hover:text-[#262421] hover:bg-[#F3EEE5] rounded-xl border border-[#E8E2D8] bg-[#FFFEFC] shadow-2xs transition-colors cursor-pointer"
          title="Refresh Audit Logs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs overflow-hidden">
        <DataTable
          columns={columns}
          data={auditLogs}
          keyExtractor={(r) => r.id}
          emptyText={isLoading ? "Loading system audit logs..." : "No system audit logs recorded yet."}
        />
      </div>
    </div>
  );
}
