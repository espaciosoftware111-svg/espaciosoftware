"use client";

import React, { useState, useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  Network,
  Save,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Globe,
  FileSpreadsheet,
  HardDrive,
  Mail,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Check,
} from "lucide-react";

export default function IntegrationsSettingsPage() {
  const [data, setData] = useState({
    whatsapp: {
      enabled: true,
      status: "CONNECTED" as "CONNECTED" | "NOT_CONNECTED",
      phoneNumber: "+91 98765 43210",
      instanceId: "ESPACIO-WA-LIVE-01",
      apiUrl: "https://api.whatsapp.com/v1",
      defaultQuotationTemplate: "Hello {{clientName}}, here is your interior quotation from ESPACIO: {{quotationLink}}",
      autoSendUpdates: true,
    },
    websiteLeads: {
      enabled: true,
      status: "READY" as "CONNECTED" | "READY",
      webhookUrl: "/api/v1/leads/webhook",
      apiKeyMasked: "esp_live_sec_••••••••••••94b2",
      leadAutoAssign: true,
      lastLeadReceivedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    googleSheets: {
      enabled: false,
      status: "DISCONNECTED" as "CONNECTED" | "DISCONNECTED",
      spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      sheetName: "ESPACIO_Live_Data_Sync",
      autoSyncIntervalMinutes: 60,
      lastSyncAt: null as string | null,
      syncLeads: true,
      syncProjects: true,
      syncExpenses: false,
    },
    googleDrive: {
      status: "CONNECTED" as any,
      provider: "LOCAL_DISK",
      rootFolderId: "espacio-erp-root",
      connectedAccount: "service-account@espacio-erp.iam.gserviceaccount.com",
      lastSyncAt: null as string | null,
    },
    email: {
      status: "CONNECTED" as any,
      senderName: "ESPACIO ERP Notifications",
      senderEmail: "notifications@espacio.com",
      smtpHost: "smtp.mailgun.org",
      smtpPort: 587,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings/integrations");
      const json = await res.json();
      if (json.success && json.data) {
        setData((prev) => ({
          ...prev,
          ...json.data,
        }));
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyWebhook = () => {
    const fullUrl = `${window.location.origin}${data.websiteLeads.webhookUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/settings/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Integrations settings saved successfully" });
      } else {
        setMessage({ type: "error", text: json.error?.message || "Failed to save integrations" });
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

      <main className="flex-1 p-4 md:p-8 max-w-5xl space-y-6">
        {/* Header */}
        <div className="border-b border-[#C5A880]/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#423C36] uppercase tracking-wider">
                External Systems &amp; APIs
              </span>
            </div>
            <h1 className="text-xl font-black text-[#423C36] tracking-tight mt-1 flex items-center gap-2">
              <Network className="w-5 h-5 text-[#C5A880]" /> Integration Settings (Rule 38)
            </h1>
            <p className="text-xs text-[#423C36]/70 mt-0.5">
              Configure communication APIs, inbound website lead webhooks, and cloud data synchronization.
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

        {isLoading ? (
          <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-[#C5A880]/20 text-center text-xs text-[#423C36]/50">
            Loading integrations...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. WhatsApp Integration (Rule 39 & 40) */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#C5A880]/15 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider">
                      WhatsApp Business Integration (Rule 39)
                    </h2>
                    <p className="text-[11px] text-[#423C36]/70">Used for sending quotations and client updates directly.</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    data.whatsapp.status === "CONNECTED"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {data.whatsapp.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">WhatsApp Business Number</label>
                  <input
                    type="text"
                    value={data.whatsapp.phoneNumber}
                    onChange={(e) =>
                      setData({ ...data, whatsapp: { ...data.whatsapp, phoneNumber: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Instance / Gateway Identifier</label>
                  <input
                    type="text"
                    value={data.whatsapp.instanceId}
                    onChange={(e) =>
                      setData({ ...data, whatsapp: { ...data.whatsapp, instanceId: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="ESPACIO-WA-LIVE-01"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Default Quotation Message Template</label>
                  <textarea
                    rows={2}
                    value={data.whatsapp.defaultQuotationTemplate}
                    onChange={(e) =>
                      setData({ ...data, whatsapp: { ...data.whatsapp, defaultQuotationTemplate: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40 font-mono"
                  />
                  <span className="text-[10px] text-[#423C36]/60 mt-0.5 block">
                    Supported merge tags: {"{{clientName}}"}, {"{{quotationNumber}}"}, {"{{quotationLink}}"}, {"{{totalAmount}}"}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Website Lead Integration (Rule 41) */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#C5A880]/15 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider">
                      Website Inbound Lead Webhook (Rule 41)
                    </h2>
                    <p className="text-[11px] text-[#423C36]/70">Captures web inquiries automatically into the CRM pipeline.</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {data.websiteLeads.status}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Webhook Ingestion Endpoint URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== "undefined" ? `${window.location.origin}${data.websiteLeads.webhookUrl}` : data.websiteLeads.webhookUrl}
                      className="w-full px-3 py-2 text-xs font-mono bg-[#FAF6EF]/80 border border-[#C5A880]/30 rounded-xl text-[#423C36] select-all cursor-text"
                    />
                    <button
                      type="button"
                      onClick={handleCopyWebhook}
                      className="px-3 py-2 bg-[#423C36] hover:bg-[#2F2B26] text-[#FAF6EF] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#C5A880]" />}
                      <span>{copied ? "Copied" : "Copy URL"}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-[#423C36] mb-1">API Secret Token (Masked)</label>
                    <input
                      type="text"
                      disabled
                      value={data.websiteLeads.apiKeyMasked}
                      className="w-full px-3 py-2 text-xs font-mono bg-[#FAF6EF]/80 border border-[#C5A880]/30 rounded-xl text-[#423C36] opacity-75 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#423C36] mb-1">Last Inbound Lead Timestamp</label>
                    <input
                      type="text"
                      disabled
                      value={data.websiteLeads.lastLeadReceivedAt ? new Date(data.websiteLeads.lastLeadReceivedAt).toLocaleString() : "Never"}
                      className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/80 border border-[#C5A880]/30 rounded-xl text-[#423C36] opacity-75 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Google Sheets Integration (Rule 42) */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#C5A880]/15 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider">
                      Google Sheets Real-time Sync (Rule 42)
                    </h2>
                    <p className="text-[11px] text-[#423C36]/70">Bidirectional reporting sheet synchronization without creating duplicate rows.</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.googleSheets.enabled}
                    onChange={(e) =>
                      setData({ ...data, googleSheets: { ...data.googleSheets, enabled: e.target.checked } })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#10B981]"></div>
                  <span className="ml-1.5 text-[11px] font-bold text-[#423C36]">
                    {data.googleSheets.enabled ? "ENABLED" : "DISABLED"}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Target Google Spreadsheet ID</label>
                  <input
                    type="text"
                    value={data.googleSheets.spreadsheetId}
                    onChange={(e) =>
                      setData({ ...data, googleSheets: { ...data.googleSheets, spreadsheetId: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Target Sheet Tab Name</label>
                  <input
                    type="text"
                    value={data.googleSheets.sheetName}
                    onChange={(e) =>
                      setData({ ...data, googleSheets: { ...data.googleSheets, sheetName: e.target.value } })
                    }
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="ESPACIO_Live_Data_Sync"
                  />
                </div>
              </div>
            </div>

            {/* Safety Guarantee */}
            <div className="bg-[#FAF6EF] p-4 rounded-xl border border-[#C5A880]/20 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
              <div className="text-xs text-[#423C36]/80 leading-relaxed">
                <strong>Zero Secret Exposure Guarantee (Rule 33 &amp; 38):</strong> Private OAuth keys and API tokens are securely managed at the server layer and never transmitted in client bundles.
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-xs font-bold text-[#423C36] bg-[#C5A880] hover:bg-[#B39366] rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Integration Settings"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
