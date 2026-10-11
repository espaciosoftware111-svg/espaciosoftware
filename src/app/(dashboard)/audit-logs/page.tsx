"use client";

import React, { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import {
  ShieldAlert,
  RefreshCw,
  ShieldCheck,
  Activity,
  UserCheck,
  MapPin,
  ExternalLink,
  Eye,
  Clock,
  User,
  Layers,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  AuditDetailViewer,
  getDisplayIp,
  getGoogleMapsUrl,
} from "@/components/audit/audit-detail-viewer";

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

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
      cell: (row: any) => {
        const ip = getDisplayIp(row.ipAddress);
        return (
          <a
            href={getGoogleMapsUrl(row.ipAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F3EEE5]/80 hover:bg-[#89652D]/15 text-[#262421] hover:text-[#89652D] border border-[#E8E2D8] hover:border-[#89652D]/40 transition-all font-mono text-[11px] group cursor-pointer"
            title={`View IP ${ip} on Google Maps`}
          >
            <MapPin className="w-3 h-3 text-[#89652D] group-hover:scale-110 transition-transform" />
            <span>{ip}</span>
            <ExternalLink className="w-2.5 h-2.5 text-[#77716A] group-hover:text-[#262421]" />
          </a>
        );
      },
    },
    {
      header: "Details",
      accessorKey: "id" as const,
      cell: (row: any) => (
        <button
          type="button"
          onClick={() => setSelectedLog(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#89652D] hover:text-[#262421] bg-[#F3EEE5]/60 hover:bg-[#F3EEE5] border border-[#E8E2D8] rounded-md transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Details</span>
        </button>
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

      {/* Audit Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Audit Record: ${selectedLog.action}` : "Audit Record"}
        maxWidth="2xl"
      >
        {selectedLog && (
          <div className="space-y-4">
            {/* Metadata Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Actor</span>
                <span className="font-semibold text-stone-900">{selectedLog.user?.fullName || "System Admin"}</span>
                <span className="text-[10px] text-stone-500 block font-mono">{selectedLog.user?.email || "system@espacio.internal"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Target Record</span>
                <span className="font-semibold text-stone-900">{selectedLog.entityType}</span>
                <span className="text-[10px] text-stone-500 block font-mono">{selectedLog.entityId || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">IP Location</span>
                <a
                  href={getGoogleMapsUrl(selectedLog.ipAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white hover:bg-gold/15 text-stone-800 border border-stone-200 mt-0.5 font-mono text-[11px] group cursor-pointer"
                  title="Open IP on Google Maps"
                >
                  <MapPin className="w-3 h-3 text-gold group-hover:scale-110 transition-transform" />
                  <span>{getDisplayIp(selectedLog.ipAddress)}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-stone-400 group-hover:text-stone-700" />
                </a>
              </div>
            </div>

            {/* Human Understandable Change Viewer */}
            <AuditDetailViewer
              oldValues={selectedLog.parsedOldValues || (selectedLog.oldValues ? JSON.parse(selectedLog.oldValues) : null)}
              newValues={selectedLog.parsedNewValues || (selectedLog.newValues ? JSON.parse(selectedLog.newValues) : null)}
              ipAddress={selectedLog.ipAddress}
              action={selectedLog.action}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
