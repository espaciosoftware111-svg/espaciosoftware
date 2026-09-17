"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Clock,
  CheckCheck,
  Check,
  X,
  Plus,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Receipt,
  Truck,
  ShoppingCart,
  Boxes,
  Briefcase,
  Users,
  Coins,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { FilterSelect } from "@/components/ui/filter-select";

interface NotificationItem {
  id: string;
  type: string;
  category: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  isRead: boolean;
  dismissedAt?: string | null;
  createdAt: string;
}

interface ReminderItem {
  id: string;
  referenceNo: string;
  title: string;
  description?: string | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  dueAt: string;
  status: "PENDING" | "COMPLETED" | "DISMISSED" | "OVERDUE" | "CANCELLED";
  snoozedUntil?: string | null;
  actionUrl?: string | null;
  createdAt: string;
}

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Categories" },
  { value: "LEADS", label: "Leads & CRM" },
  { value: "PROJECTS", label: "Projects & Pipeline" },
  { value: "QUOTATIONS", label: "Quotations" },
  { value: "PAYMENTS", label: "Client Payments" },
  { value: "EXPENSES", label: "Expenses" },
  { value: "PETTY_CASH", label: "Petty Cash" },
  { value: "VENDORS", label: "Vendors & Suppliers" },
  { value: "PROJECT_MATERIALS", label: "Project Materials" },
  { value: "MATERIALS_ORDER", label: "Materials Order (Leads)" },
  { value: "SYSTEM", label: "System Activities" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "UNREAD", label: "Unread Only" },
  { value: "READ", label: "Read Only" },
  { value: "ACTIVE", label: "Active / Action Required" },
  { value: "RESOLVED", label: "Resolved Alerts" },
];

const PRIORITY_OPTIONS = [
  { value: "ALL", label: "All Priorities" },
  { value: "URGENT", label: "Urgent" },
  { value: "HIGH", label: "High" },
  { value: "NORMAL", label: "Normal" },
  { value: "LOW", label: "Low" },
];

const DATE_RANGE_OPTIONS = [
  { value: "ALL", label: "All Time" },
  { value: "TODAY", label: "Today" },
  { value: "YESTERDAY", label: "Yesterday" },
  { value: "LAST_7_DAYS", label: "Last 7 Days" },
  { value: "LAST_30_DAYS", label: "Last 30 Days" },
  { value: "CUSTOM", label: "Custom Range" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<"NOTIFICATIONS" | "REMINDERS">("NOTIFICATIONS");

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifCategory, setNotifCategory] = useState("ALL");
  const [notifPriority, setNotifPriority] = useState("ALL");
  const [notifStatus, setNotifStatus] = useState("ALL");
  const [notifDateRange, setNotifDateRange] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notifSearch, setNotifSearch] = useState("");
  const [notifLoading, setNotifLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Counters
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);

  // Reminders State
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [reminderStatus, setReminderStatus] = useState("ALL");
  const [reminderSearch, setReminderSearch] = useState("");
  const [reminderLoading, setReminderLoading] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);

  // Create Reminder Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDueAt, setNewDueAt] = useState("");
  const [newPriority, setNewPriority] = useState("NORMAL");
  const [newActionUrl, setNewActionUrl] = useState("");
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);

  // Snooze Modal State
  const [snoozeTargetId, setSnoozeTargetId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (isSyncRequest = false) => {
    setNotifLoading(true);
    try {
      let url = `/api/v1/notifications?limit=100`;

      if (notifCategory && notifCategory !== "ALL") {
        url += `&category=${encodeURIComponent(notifCategory)}`;
      }

      if (notifPriority && notifPriority !== "ALL") {
        url += `&priority=${encodeURIComponent(notifPriority)}`;
      }

      if (notifStatus && notifStatus !== "ALL") {
        url += `&status=${encodeURIComponent(notifStatus)}`;
      }

      // Date Range
      if (notifDateRange && notifDateRange !== "ALL") {
        url += `&dateRange=${encodeURIComponent(notifDateRange)}`;
        if (notifDateRange === "CUSTOM") {
          if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
          if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
        }
      }

      if (notifSearch.trim()) {
        url += `&search=${encodeURIComponent(notifSearch.trim())}`;
      }

      if (isSyncRequest) {
        url += `&sync=true`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data.notifications || []);
        setTotalCount(json.data.totalCount || 0);
        setUnreadCount(json.data.unreadCount || 0);
        setUrgentCount(json.data.urgentCount || 0);
        setResolvedCount(json.data.resolvedCount || 0);
      }
    } catch {
      // Quiet handling
    } finally {
      setNotifLoading(false);
    }
  }, [
    notifCategory,
    notifPriority,
    notifStatus,
    notifDateRange,
    startDate,
    endDate,
    notifSearch,
  ]);

  const handleSyncAlerts = async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/v1/notifications/sync", { method: "POST" });
      await fetchNotifications(true);
    } catch {
      // Quiet error handling
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchReminders = useCallback(async () => {
    setReminderLoading(true);
    try {
      let url = `/api/v1/notifications/reminders?limit=50`;
      if (reminderStatus !== "ALL") url += `&status=${reminderStatus}`;
      if (reminderSearch.trim()) url += `&search=${encodeURIComponent(reminderSearch.trim())}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setReminders(json.data.reminders || []);
        setOverdueCount(json.data.overdueCount || 0);
      }
    } catch {
      // Quiet handling
    } finally {
      setReminderLoading(false);
    }
  }, [reminderStatus, reminderSearch]);

  useEffect(() => {
    if (mainTab === "NOTIFICATIONS") {
      fetchNotifications();
    } else {
      fetchReminders();
    }
  }, [mainTab, fetchNotifications, fetchReminders]);

  const markRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Quiet handling
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/v1/notifications/mark-all-read", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Quiet handling
    }
  };

  const resolveAlert = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/v1/notifications/${id}/resolve`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, dismissedAt: new Date().toISOString() } : n
        )
      );
      setResolvedCount((prev) => prev + 1);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Quiet handling
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueAt) return;
    setIsSubmittingReminder(true);
    try {
      const res = await fetch("/api/v1/notifications/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim() || undefined,
          dueAt: new Date(newDueAt).toISOString(),
          priority: newPriority,
          actionUrl: newActionUrl.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        setNewTitle("");
        setNewDesc("");
        setNewDueAt("");
        setNewPriority("NORMAL");
        setNewActionUrl("");
        fetchReminders();
      }
    } catch {
      // Quiet handling
    } finally {
      setIsSubmittingReminder(false);
    }
  };

  const handleActionClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markRead(item.id);
    }
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "LEADS":
        return <Users className="w-4 h-4 text-amber-700" />;
      case "PROJECTS":
        return <Briefcase className="w-4 h-4 text-emerald-700" />;
      case "QUOTATIONS":
        return <FileText className="w-4 h-4 text-blue-700" />;
      case "PAYMENTS":
        return <Receipt className="w-4 h-4 text-gold" />;
      case "EXPENSES":
        return <DollarSign className="w-4 h-4 text-rose-700" />;
      case "PETTY_CASH":
        return <Coins className="w-4 h-4 text-amber-600" />;
      case "VENDORS":
        return <Truck className="w-4 h-4 text-purple-700" />;
      case "PROJECT_MATERIALS":
        return <ShoppingCart className="w-4 h-4 text-teal-700" />;
      case "MATERIALS_ORDER":
        return <Boxes className="w-4 h-4 text-indigo-700" />;
      default:
        return <Bell className="w-4 h-4 text-walnut" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" /> URGENT
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> HIGH
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-cream text-walnut border border-walnut/15">
            LOW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            NORMAL
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto select-none p-2 sm:p-4">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Top Header Bar */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-walnut/20">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-walnut">
            <span>Operational Center</span>
            <span>•</span>
            <span className="text-charcoal font-bold">Dynamic Notification Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal mt-1 flex items-center gap-2.5">
            <span>NOTIFICATIONS &amp; ALERTS</span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold font-mono rounded-full bg-gold text-charcoal shadow-2xs">
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="text-xs text-walnut mt-0.5">
            Centralized notification hub, live follow-up &amp; site visit alerts, financial balances, and connected pipeline actions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncAlerts}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-walnut hover:text-charcoal bg-white border border-walnut/20 rounded-lg shadow-2xs hover:bg-cream transition cursor-pointer disabled:opacity-50"
            title="Re-evaluate all business records and synchronize active alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-gold" : "text-walnut"}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Alerts"}</span>
          </button>

          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-charcoal bg-gold hover:bg-gold-hover rounded-lg shadow-gold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>MARK ALL AS READ</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4 Dynamic Metric / KPI Cards */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Feed */}
        <div
          onClick={() => {
            setNotifStatus("ALL");
            setNotifCategory("ALL");
          }}
          className={`p-4 bg-white border rounded-xl shadow-xs cursor-pointer transition hover:border-gold/60 ${
            notifStatus === "ALL" ? "border-gold ring-1 ring-gold/30" : "border-walnut/20"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-walnut">
            <span>Total Feed</span>
            <Bell className="w-4 h-4 text-walnut" />
          </div>
          <div className="text-2xl font-bold font-mono text-charcoal mt-1.5 tabular-nums">
            {totalCount}
          </div>
          <div className="text-[10px] text-walnut mt-0.5">All generated notifications</div>
        </div>

        {/* Unread Alerts */}
        <div
          onClick={() => setNotifStatus("UNREAD")}
          className={`p-4 bg-white border rounded-xl shadow-xs cursor-pointer transition hover:border-gold/60 ${
            notifStatus === "UNREAD" ? "border-gold ring-1 ring-gold/30 bg-gold-soft/20" : "border-walnut/20"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-charcoal">
            <span>Unread Alerts</span>
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-charcoal mt-1.5 tabular-nums">
            {unreadCount}
          </div>
          <div className="text-[10px] text-walnut mt-0.5">Requiring administrator review</div>
        </div>

        {/* Urgent & Action Required */}
        <div
          onClick={() => setNotifStatus("ACTIVE")}
          className={`p-4 bg-white border rounded-xl shadow-xs cursor-pointer transition hover:border-rose-400 ${
            notifStatus === "ACTIVE" ? "border-rose-400 ring-1 ring-rose-400/30 bg-rose-50/30" : "border-walnut/20"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-rose-700">
            <span>Action Required</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1.5 tabular-nums">
            {urgentCount}
          </div>
          <div className="text-[10px] text-rose-600 mt-0.5">Overdue follow-ups &amp; inspections</div>
        </div>

        {/* Resolved Today */}
        <div
          onClick={() => setNotifStatus("RESOLVED")}
          className={`p-4 bg-white border rounded-xl shadow-xs cursor-pointer transition hover:border-emerald-500 ${
            notifStatus === "RESOLVED" ? "border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-50/20" : "border-walnut/20"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            <span>Resolved History</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1.5 tabular-nums">
            {resolvedCount}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Completed tasks &amp; cleared alerts</div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Sub-Tabs: Notifications vs Reminders */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-walnut/15 pt-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setMainTab("NOTIFICATIONS")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              mainTab === "NOTIFICATIONS"
                ? "border-charcoal text-charcoal bg-cream/40 rounded-t-lg"
                : "border-transparent text-walnut hover:text-charcoal"
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-gold" />
            <span>Operational Alerts &amp; Activities</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 font-mono text-[10px] font-bold bg-gold text-charcoal rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMainTab("REMINDERS")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              mainTab === "REMINDERS"
                ? "border-charcoal text-charcoal bg-cream/40 rounded-t-lg"
                : "border-transparent text-walnut hover:text-charcoal"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-walnut" />
            <span>Scheduled Reminders &amp; Snooze</span>
            {overdueCount > 0 && (
              <span className="px-1.5 py-0.2 font-mono text-[10px] font-bold bg-rose-600 text-white rounded-full">
                {overdueCount}
              </span>
            )}
          </button>
        </div>

        {mainTab === "REMINDERS" && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 mb-1.5 rounded-lg bg-gold text-charcoal text-xs font-bold shadow-gold hover:bg-gold-hover transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Reminder</span>
          </button>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MAIN NOTIFICATIONS TAB CONTENT */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mainTab === "NOTIFICATIONS" && (
        <div className="space-y-4">
          {/* Advanced Multi-Dimensional Filter Bar (with OTHERS -> Manual Input) */}
          <div className="bg-white border border-walnut/20 rounded-xl p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Category Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-walnut mb-1">
                  Category
                </label>
                <FilterSelect
                  label=""
                  options={CATEGORY_OPTIONS}
                  value={notifCategory}
                  onChange={(val) => setNotifCategory(val)}
                  className="w-full text-xs"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-walnut mb-1">
                  Status
                </label>
                <FilterSelect
                  label=""
                  options={STATUS_OPTIONS}
                  value={notifStatus}
                  onChange={(val) => setNotifStatus(val)}
                  className="w-full text-xs"
                />
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-walnut mb-1">
                  Priority
                </label>
                <FilterSelect
                  label=""
                  options={PRIORITY_OPTIONS}
                  value={notifPriority}
                  onChange={(val) => setNotifPriority(val)}
                  className="w-full text-xs"
                />
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-walnut mb-1">
                  Date Range
                </label>
                <FilterSelect
                  label=""
                  options={DATE_RANGE_OPTIONS}
                  value={notifDateRange}
                  onChange={(val) => setNotifDateRange(val)}
                  className="w-full text-xs"
                />
              </div>
            </div>

            {/* Custom Date Picker (if CUSTOM date range selected) */}
            {notifDateRange === "CUSTOM" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-walnut/10">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-walnut mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:border-gold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-walnut mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:border-gold outline-none"
                  />
                </div>
              </div>
            )}

            {/* Search Input Bar */}
            <div className="relative pt-1">
              <Search className="w-4 h-4 text-walnut absolute left-3 top-4" />
              <input
                type="text"
                value={notifSearch}
                onChange={(e) => setNotifSearch(e.target.value)}
                placeholder="Search notifications by Lead Name/ID, Project Title/ID, Vendor, Quotation, Payment Ref, or Keywords..."
                className="w-full text-xs p-2.5 pl-9 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal placeholder-walnut/60 focus:border-gold outline-none"
              />
              {notifSearch && (
                <button
                  onClick={() => setNotifSearch("")}
                  className="absolute right-3 top-3.5 text-walnut hover:text-charcoal text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* Notification List Feed */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="space-y-2.5">
            {notifLoading ? (
              <div className="p-16 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15 flex flex-col items-center justify-center gap-2">
                <Clock className="w-6 h-6 animate-spin text-gold" />
                <span>Evaluating dynamic alerts &amp; loading feed...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-16 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15 flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600/70" />
                <h3 className="text-sm font-bold text-charcoal">NO NOTIFICATIONS</h3>
                <p className="max-w-md text-walnut">
                  You are all caught up! There are no pending alerts or unread activity notifications matching your current filter criteria.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleActionClick(item)}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer ${
                    !item.isRead
                      ? "bg-gold-soft/30 border-gold/40 hover:bg-gold-soft/50 shadow-xs"
                      : "bg-white border-walnut/15 hover:bg-cream/30 hover:border-walnut/30"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Category Icon */}
                    <div className="w-9 h-9 rounded-xl bg-cream border border-walnut/20 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {getCategoryIcon(item.category)}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-charcoal leading-tight">
                          {item.title}
                        </span>
                        {getPriorityBadge(item.priority)}
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cream border border-walnut/20 text-walnut">
                          {item.category.replace(/_/g, " ")}
                        </span>
                        {item.entityId && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-offwhite border border-walnut/20 text-charcoal">
                            {item.entityType || "Record"}: {item.entityId.substring(0, 8)}...
                          </span>
                        )}
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-gold inline-block" title="Unread" />
                        )}
                      </div>

                      <p className="text-xs text-charcoal leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-walnut pt-0.5">
                        <span className="font-mono">{formatDate(item.createdAt)}</span>
                        {item.dismissedAt && (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div
                    className="flex items-center gap-2 shrink-0 self-end sm:self-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.actionUrl && (
                      <button
                        onClick={() => handleActionClick(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-offwhite hover:bg-cream border border-walnut/20 text-charcoal text-xs font-bold transition cursor-pointer shadow-2xs"
                      >
                        <span>Open Record</span>
                        <ExternalLink className="w-3 h-3 text-gold" />
                      </button>
                    )}

                    {!item.isRead && (
                      <button
                        onClick={(e) => markRead(item.id, e)}
                        className="p-1.5 rounded-lg border border-walnut/20 bg-white hover:bg-cream text-walnut hover:text-charcoal text-xs transition cursor-pointer"
                        title="Mark as Read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!item.dismissedAt && (item.priority === "HIGH" || item.priority === "URGENT") && (
                      <button
                        onClick={(e) => resolveAlert(item.id, e)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition cursor-pointer"
                        title="Resolve and clear this active alert"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolve</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* REMINDERS TAB CONTENT */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mainTab === "REMINDERS" && (
        <div className="space-y-4">
          <div className="bg-white border border-walnut/20 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-walnut">Filter:</span>
              {["ALL", "PENDING", "OVERDUE", "COMPLETED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setReminderStatus(st)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    reminderStatus === st
                      ? "bg-gold text-charcoal shadow-2xs"
                      : "bg-cream/40 text-walnut hover:bg-cream"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-walnut absolute left-3 top-2.5" />
              <input
                type="text"
                value={reminderSearch}
                onChange={(e) => setReminderSearch(e.target.value)}
                placeholder="Search reminders..."
                className="w-full text-xs p-2 pl-8 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {reminderLoading ? (
              <div className="p-12 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15 flex flex-col items-center gap-2">
                <Clock className="w-5 h-5 animate-spin text-gold" />
                Loading reminders...
              </div>
            ) : reminders.length === 0 ? (
              <div className="p-12 text-center text-xs text-walnut bg-white rounded-xl border border-walnut/15">
                No reminders found in this view. Click &quot;+ Create Reminder&quot; to schedule an action.
              </div>
            ) : (
              reminders.map((rem) => (
                <div
                  key={rem.id}
                  className="p-4 rounded-xl border border-walnut/20 bg-white hover:bg-cream/20 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-charcoal">{rem.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cream border border-walnut/20 text-walnut">
                        {rem.referenceNo}
                      </span>
                      {getPriorityBadge(rem.priority)}
                    </div>
                    {rem.description && (
                      <p className="text-xs text-walnut">{rem.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-walnut pt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-gold" /> Due: {formatDate(rem.dueAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {rem.actionUrl && (
                      <button
                        onClick={() => router.push(rem.actionUrl!)}
                        className="px-2.5 py-1 text-xs font-bold bg-offwhite hover:bg-cream border border-walnut/20 rounded-md text-charcoal flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3 text-gold" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Create Reminder Modal */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-walnut/20 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-walnut/15">
              <h3 className="text-sm font-bold text-charcoal">Schedule New Reminder</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-md text-walnut hover:text-charcoal cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Follow up on Project PRJ-001 quotation"
                  className="w-full text-xs p-2.5 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Due Date &amp; Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={newDueAt}
                  onChange={(e) => setNewDueAt(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:border-gold outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional details regarding this reminder..."
                  className="w-full text-xs p-2.5 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Action URL / Redirection</label>
                <input
                  type="text"
                  value={newActionUrl}
                  onChange={(e) => setNewActionUrl(e.target.value)}
                  placeholder="e.g. /projects?id=... or /leads?id=..."
                  className="w-full text-xs p-2.5 rounded-lg border border-walnut/20 bg-cream/20 text-charcoal focus:border-gold outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-walnut/15">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-walnut hover:text-charcoal rounded-lg border border-walnut/20 bg-offwhite cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReminder}
                  className="px-4 py-2 text-xs font-bold text-charcoal bg-gold hover:bg-gold-hover rounded-lg shadow-gold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReminder ? "Scheduling..." : "Create Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
