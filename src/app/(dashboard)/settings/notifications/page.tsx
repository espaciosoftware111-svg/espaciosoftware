"use client";

import React, { useState, useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  Bell,
  Sliders,
  Shield,
  Save,
  Plus,
  Edit,
  Check,
  X,
  AlertCircle,
  Clock,
  Layers,
  CheckCircle2,
  CalendarCheck2,
  AlertTriangle,
} from "lucide-react";

interface PreferenceItem {
  category: string;
  channel: string;
  isEnabled: boolean;
}

interface RuleItem {
  id: string;
  name: string;
  eventType: string;
  category: string;
  priority: string;
  recipientType: string;
  targetRole?: string | null;
  channels: string;
  templateTitle: string;
  templateBody: string;
  isEnabled: boolean;
  isSystemMandatory: boolean;
}

const CATEGORIES = [
  "CRM",
  "PROJECTS",
  "FINANCE",
  "PROCUREMENT",
  "INVENTORY",
  "TASKS",
  "SYSTEM",
  "REPORTS",
];

const CHANNELS = ["IN_APP", "EMAIL", "WHATSAPP", "PUSH", "SMS"];

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<Record<string, Record<string, boolean>>>({});
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Follow-up Alert Preferences (Rule 37)
  const [followUpAlerts, setFollowUpAlerts] = useState({
    onScheduledDate: true,
    dayBefore: true,
    whenOverdue: true,
    siteVisitReminders: true,
  });

  // Priority Toggles (Rule 36)
  const [priorityAlerts, setPriorityAlerts] = useState({
    LOW: true,
    MEDIUM: true,
    HIGH: true,
    URGENT: true,
  });

  // Rule Builder Modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [ruleEventType, setRuleEventType] = useState("PAYMENT_OVERDUE");
  const [ruleCategory, setRuleCategory] = useState("FINANCE");
  const [rulePriority, setRulePriority] = useState("NORMAL");
  const [ruleRecipientType, setRuleRecipientType] = useState("ROLE");
  const [ruleTargetRole, setRuleTargetRole] = useState("FINANCE");
  const [ruleChannels, setRuleChannels] = useState<string[]>(["IN_APP"]);
  const [ruleTemplateTitle, setRuleTemplateTitle] = useState("");
  const [ruleTemplateBody, setRuleTemplateBody] = useState("");
  const [ruleIsEnabled, setRuleIsEnabled] = useState(true);
  const [isSubmittingRule, setIsSubmittingRule] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const [prefRes, rulesRes] = await Promise.all([
        fetch("/api/v1/notifications/preferences"),
        fetch("/api/v1/notifications/rules"),
      ]);

      const prefJson = await prefRes.json();
      const rulesJson = await rulesRes.json();

      if (prefJson.success) {
        const prefMap: Record<string, Record<string, boolean>> = {};
        (prefJson.data || []).forEach((p: PreferenceItem) => {
          if (!prefMap[p.category]) prefMap[p.category] = {};
          prefMap[p.category][p.channel] = p.isEnabled;
        });
        setPreferences(prefMap);
      }

      if (rulesJson.success) {
        setRules(rulesJson.data || []);
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const togglePreference = async (category: string, channel: string) => {
    const current = preferences[category]?.[channel] ?? true;
    const nextVal = !current;

    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [channel]: nextVal,
      },
    }));

    try {
      await fetch("/api/v1/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, channel, isEnabled: nextVal }),
      });
      setMessage({ type: "success", text: "Notification channel preference updated" });
    } catch {
      // Quiet handling
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !ruleTemplateTitle.trim() || !ruleTemplateBody.trim()) return;

    setIsSubmittingRule(true);
    try {
      const res = await fetch("/api/v1/notifications/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRuleId || undefined,
          name: ruleName.trim(),
          eventType: ruleEventType,
          category: ruleCategory,
          priority: rulePriority,
          recipientType: ruleRecipientType,
          targetRole: ruleTargetRole,
          channels: ruleChannels,
          templateTitle: ruleTemplateTitle.trim(),
          templateBody: ruleTemplateBody.trim(),
          isEnabled: ruleIsEnabled,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsRuleModalOpen(false);
        resetRuleForm();
        fetchSettings();
        setMessage({ type: "success", text: "Notification rule saved successfully" });
      }
    } catch {
      // Quiet handling
    } finally {
      setIsSubmittingRule(false);
    }
  };

  const openCreateRuleModal = () => {
    resetRuleForm();
    setIsRuleModalOpen(true);
  };

  const openEditRuleModal = (rule: RuleItem) => {
    setEditingRuleId(rule.id);
    setRuleName(rule.name);
    setRuleEventType(rule.eventType);
    setRuleCategory(rule.category);
    setRulePriority(rule.priority);
    setRuleRecipientType(rule.recipientType);
    setRuleTargetRole(rule.targetRole || "FINANCE");
    try {
      setRuleChannels(JSON.parse(rule.channels));
    } catch {
      setRuleChannels(["IN_APP"]);
    }
    setRuleTemplateTitle(rule.templateTitle);
    setRuleTemplateBody(rule.templateBody);
    setRuleIsEnabled(rule.isEnabled);
    setIsRuleModalOpen(true);
  };

  const resetRuleForm = () => {
    setEditingRuleId(null);
    setRuleName("");
    setRuleEventType("PAYMENT_OVERDUE");
    setRuleCategory("FINANCE");
    setRulePriority("NORMAL");
    setRuleRecipientType("ROLE");
    setRuleTargetRole("FINANCE");
    setRuleChannels(["IN_APP"]);
    setRuleTemplateTitle("");
    setRuleTemplateBody("");
    setRuleIsEnabled(true);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#FAF8F5]">
      <SettingsSidebar />

      <main className="flex-1 p-4 md:p-8 max-w-6xl space-y-6">
        {/* Header */}
        <div className="border-b border-[#C5A880]/20 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#423C36] uppercase tracking-wider">
              Alerts &amp; Dispatches
            </span>
          </div>
          <h1 className="text-xl font-black text-[#423C36] tracking-tight mt-1 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#C5A880]" /> Notification Settings (Rule 35)
          </h1>
          <p className="text-xs text-[#423C36]/70 mt-0.5">
            Configure automated event alerts, channel delivery preferences, priority thresholds, and follow-up schedules.
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

        {/* 1. Follow-up & Reminder Rules (Rule 37) */}
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2 flex items-center gap-2">
            <CalendarCheck2 className="w-4 h-4 text-[#C5A880]" /> Follow-up &amp; Site Visit Alert Schedules (Rule 37)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: "onScheduledDate", label: "On Scheduled Date", desc: "Notify on day of follow-up" },
              { key: "dayBefore", label: "1 Day Before", desc: "Advance reminder notice" },
              { key: "whenOverdue", label: "When Overdue", desc: "Escalation alert if missed" },
              { key: "siteVisitReminders", label: "Site Visit Alerts", desc: "Pre-visit location briefing" },
            ].map((item) => {
              const isChecked = (followUpAlerts as any)[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() =>
                    setFollowUpAlerts((prev) => ({ ...prev, [item.key]: !isChecked }))
                  }
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2 ${
                    isChecked
                      ? "bg-[#FAF6EF] border-[#C5A880]/40"
                      : "bg-slate-50 border-slate-200 opacity-60"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-[#423C36]">{item.label}</div>
                    <p className="text-[10px] text-[#423C36]/60 mt-0.5">{item.desc}</p>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isChecked ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isChecked ? "ON" : "OFF"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Priority Settings (Rule 36) */}
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#C5A880]/25 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider border-b border-[#C5A880]/15 pb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#C5A880]" /> Notification Priority Thresholds (Rule 36)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { level: "LOW", label: "Low Priority", color: "bg-slate-100 text-slate-800 border-slate-300" },
              { level: "MEDIUM", label: "Medium Priority", color: "bg-blue-100 text-blue-800 border-blue-300" },
              { level: "HIGH", label: "High Priority", color: "bg-amber-100 text-amber-800 border-amber-300" },
              { level: "URGENT", label: "Urgent Priority", color: "bg-rose-100 text-rose-800 border-rose-300" },
            ].map((p) => {
              const isChecked = (priorityAlerts as any)[p.level];
              return (
                <div
                  key={p.level}
                  onClick={() =>
                    setPriorityAlerts((prev) => ({ ...prev, [p.level]: !isChecked }))
                  }
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isChecked ? "bg-[#FAF6EF] border-[#C5A880]/40" : "bg-slate-50 border-slate-200 opacity-60"
                  }`}
                >
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${p.color}`}>
                    {p.label}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isChecked ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isChecked ? "ACTIVE" : "MUTED"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Category Delivery Matrix (Rule 35) */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#C5A880]/25 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-[#C5A880]/15 bg-[#FAF6EF] flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#C5A880]" /> Category &amp; Channel Delivery Matrix (Rule 35)
              </h2>
              <p className="text-[11px] text-[#423C36]/70 mt-0.5">
                Toggle channels for Leads, Projects, Payments, Expenses, Petty Cash, and Procurement.
              </p>
            </div>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#C5A880]/20 bg-[#FAF8F5]">
                  <th className="py-2.5 px-4 font-bold text-[#423C36]">Business Category</th>
                  {CHANNELS.map((ch) => (
                    <th key={ch} className="py-2.5 px-4 font-bold text-[#423C36] text-center">
                      {ch.replace("_", " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C5A880]/15">
                {CATEGORIES.map((cat) => (
                  <tr key={cat} className="hover:bg-[#FAF6EF]/40">
                    <td className="py-3 px-4 font-bold text-[#423C36]">{cat}</td>
                    {CHANNELS.map((ch) => {
                      const isEnabled = preferences[cat]?.[ch] ?? true;
                      return (
                        <td key={ch} className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => togglePreference(cat, ch)}
                            className="w-4 h-4 text-[#C5A880] rounded border-[#C5A880] focus:ring-[#C5A880] cursor-pointer"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Automated Notification Rules Engine */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#C5A880]/25 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-[#C5A880]/15 bg-[#FAF6EF] flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#C5A880]" /> Automated Notification Rules ({rules.length})
              </h2>
              <p className="text-[11px] text-[#423C36]/70 mt-0.5">
                Configure event triggers, recipient roles, and message templates.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateRuleModal}
              className="px-3.5 py-1.5 text-xs font-bold text-[#FAF6EF] bg-[#423C36] hover:bg-[#2F2B26] rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C5A880]" /> Add Notification Rule
            </button>
          </div>

          <div className="divide-y divide-[#C5A880]/15">
            {rules.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#423C36]/50">
                No custom notification rules configured. Click &ldquo;Add Notification Rule&rdquo; to create one.
              </div>
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#FAF6EF]/40">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-[#423C36]">{rule.name}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#FAF6EF] text-[#423C36] border border-[#C5A880]/30 font-mono">
                        {rule.eventType}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#C5A880]/20 text-[#423C36]">
                        {rule.category}
                      </span>
                      {rule.isEnabled ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-700">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#423C36]/70 mt-1 line-clamp-1">{rule.templateBody}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditRuleModal(rule)}
                    className="p-1.5 hover:bg-[#FAF6EF] rounded-lg text-[#423C36]/70 hover:text-[#423C36] transition-colors cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rule Builder Modal */}
        {isRuleModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FFFFFF] border border-[#C5A880]/30 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
              <div className="p-4 border-b border-[#C5A880]/20 bg-[#FAF6EF] flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#423C36] uppercase tracking-wider">
                  {editingRuleId ? "Edit Notification Rule" : "Create Notification Rule"}
                </h3>
                <button
                  onClick={() => setIsRuleModalOpen(false)}
                  className="p-1 text-[#423C36]/60 hover:text-[#423C36] rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRule} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Rule Name *</label>
                  <input
                    type="text"
                    required
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="e.g. Overdue Payment Alert"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#423C36] mb-1">Event Type</label>
                    <select
                      value={ruleEventType}
                      onChange={(e) => setRuleEventType(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36]"
                    >
                      <option value="PAYMENT_OVERDUE">PAYMENT_OVERDUE</option>
                      <option value="LEAD_ASSIGNED">LEAD_ASSIGNED</option>
                      <option value="FOLLOW_UP_DUE">FOLLOW_UP_DUE</option>
                      <option value="SITE_VISIT_SCHEDULED">SITE_VISIT_SCHEDULED</option>
                      <option value="QUOTATION_APPROVED">QUOTATION_APPROVED</option>
                      <option value="PROJECT_STAGE_CHANGED">PROJECT_STAGE_CHANGED</option>
                      <option value="EXPENSE_SUBMITTED">EXPENSE_SUBMITTED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#423C36] mb-1">Target Category</label>
                    <select
                      value={ruleCategory}
                      onChange={(e) => setRuleCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36]"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Template Title *</label>
                  <input
                    type="text"
                    required
                    value={ruleTemplateTitle}
                    onChange={(e) => setRuleTemplateTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="e.g. Overdue payment alert for {project}"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#423C36] mb-1">Template Message Body *</label>
                  <textarea
                    rows={3}
                    required
                    value={ruleTemplateBody}
                    onChange={(e) => setRuleTemplateBody(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF6EF]/50 border border-[#C5A880]/30 rounded-xl text-[#423C36] focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40"
                    placeholder="e.g. Payment of ₹{amount} is pending for milestone {milestone}."
                  />
                </div>

                <div className="pt-3 border-t border-[#C5A880]/20 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRuleModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#423C36] hover:bg-[#FAF6EF] rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRule}
                    className="px-5 py-2 text-xs font-bold text-[#423C36] bg-[#C5A880] hover:bg-[#B39366] rounded-xl transition-colors shadow-2xs"
                  >
                    {isSubmittingRule ? "Saving..." : "Save Rule"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
