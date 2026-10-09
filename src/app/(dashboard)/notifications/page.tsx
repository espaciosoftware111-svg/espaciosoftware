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
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  FileText,
  DollarSign,
  Receipt,
  Truck,
  ShoppingCart,
  Boxes,
  Briefcase,
  Users,
  Coins,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { FilterSelect } from "@/components/ui/filter-select";
import { clientCache } from "@/lib/client-cache";

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
  const cachedNotifData = clientCache.getImmediate<any>("notifications_list_default");
  const [notifications, setNotifications] = useState<NotificationItem[]>(cachedNotifData?.notifications || []);
  const [notifCategory, setNotifCategory] = useState("ALL");
  const [notifPriority, setNotifPriority] = useState("ALL");
  const [notifStatus, setNotifStatus] = useState("ALL");
  const [notifDateRange, setNotifDateRange] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notifSearch, setNotifSearch] = useState("");
  const [notifLoading, setNotifLoading] = useState(!cachedNotifData);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Counters
  const [totalCount, setTotalCount] = useState(cachedNotifData?.totalCount || 0);
  const [unreadCount, setUnreadCount] = useState(cachedNotifData?.unreadCount || 0);
  const [urgentCount, setUrgentCount] = useState(cachedNotifData?.urgentCount || 0);
  const [resolvedCount, setResolvedCount] = useState(cachedNotifData?.resolvedCount || 0);

  // Reminders State
  const cachedReminders = clientCache.getImmediate<ReminderItem[]>("reminders_list_default");
  const [reminders, setReminders] = useState<ReminderItem[]>(cachedReminders || []);
  const [reminderStatus, setReminderStatus] = useState("ALL");
  const [reminderSearch, setReminderSearch] = useState("");
  const [reminderLoading, setReminderLoading] = useState(!cachedReminders);
  const [overdueCount, setOverdueCount] = useState(0);

  // Create Reminder Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDueAt, setNewDueAt] = useState("");
  const [newPriority, setNewPriority] = useState("NORMAL");
  const [newActionUrl, setNewActionUrl] = useState("");
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);

  const fetchNotifications = useCallback(async (isSyncRequest = false) => {
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

    const isDefault = notifCategory === "ALL" && notifPriority === "ALL" && notifStatus === "ALL" && notifDateRange === "ALL" && !notifSearch.trim() && !isSyncRequest;
    const cacheKey = isDefault ? "notifications_list_default" : `notifs_${url}`;
    const cached = clientCache.getImmediate<any>(cacheKey);

    if (cached && !isSyncRequest) {
      setNotifications(cached.notifications || []);
      setTotalCount(cached.totalCount || 0);
      setUnreadCount(cached.unreadCount || 0);
      setUrgentCount(cached.urgentCount || 0);
      setResolvedCount(cached.resolvedCount || 0);
      setNotifLoading(false);
      setIsBackgroundRefreshing(true);
    } else {
      setNotifLoading(true);
    }

    try {
      const data = await clientCache.fetchWithCache(cacheKey, async () => {
        const res = await fetch(url);
        const json = await res.json();
        if (!json.success || !json.data) throw new Error("Failed to load notifications");
        return json.data;
      }, { ttlMs: 30000, forceRefresh: isSyncRequest });

      setNotifications(data.notifications || []);
      setTotalCount(data.totalCount || 0);
      setUnreadCount(data.unreadCount || 0);
      setUrgentCount(data.urgentCount || 0);
      setResolvedCount(data.resolvedCount || 0);
    } catch {
      // Quiet handling
    } finally {
      setNotifLoading(false);
      setIsBackgroundRefreshing(false);
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

  const fetchReminders = useCallback(async (force = false) => {
    let url = `/api/v1/notifications/reminders?limit=50`;
    if (reminderStatus !== "ALL") url += `&status=${reminderStatus}`;
    if (reminderSearch.trim()) url += `&search=${encodeURIComponent(reminderSearch.trim())}`;

    const isDefault = reminderStatus === "ALL" && !reminderSearch.trim();
    const cacheKey = isDefault ? "reminders_list_default" : `reminders_${url}`;
    const cached = clientCache.getImmediate<ReminderItem[]>(cacheKey);

    if (cached && !force) {
      setReminders(cached);
      setReminderLoading(false);
    } else {
      setReminderLoading(true);
    }

    try {
      const data = await clientCache.fetchWithCache(cacheKey, async () => {
        const res = await fetch(url);
        const json = await res.json();
        if (!json.success || !json.data) throw new Error("Failed to load reminders");
        return json.data.reminders || [];
      }, { ttlMs: 30000, forceRefresh: force });

      setReminders(data);
      const overdue = data.filter((r: ReminderItem) => r.status === "OVERDUE" || (new Date(r.dueAt) < new Date() && r.status === "PENDING")).length;
      setOverdueCount(overdue);
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
      setNotifications((prev: NotificationItem[]) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev: number) => Math.max(0, prev - 1));
    } catch {
      // Quiet handling
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/v1/notifications/mark-all-read", { method: "POST" });
      setNotifications((prev: NotificationItem[]) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Quiet handling
    }
  };

  const resolveAlert = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/v1/notifications/${id}/resolve`, { method: "POST" });
      setNotifications((prev: NotificationItem[]) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true, dismissedAt: new Date().toISOString() } : n
        )
      );
      setResolvedCount((prev: number) => prev + 1);
      setUnreadCount((prev: number) => Math.max(0, prev - 1));
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
        return <Users className="w-4 h-4 text-[#89652D]" />;
      case "PROJECTS":
        return <Briefcase className="w-4 h-4 text-[#536B4E]" />;
      case "QUOTATIONS":
        return <FileText className="w-4 h-4 text-[#89652D]" />;
      case "PAYMENTS":
        return <Receipt className="w-4 h-4 text-[#536B4E]" />;
      case "EXPENSES":
        return <DollarSign className="w-4 h-4 text-[#A45435]" />;
      case "PETTY_CASH":
        return <Coins className="w-4 h-4 text-[#89652D]" />;
      case "VENDORS":
        return <Truck className="w-4 h-4 text-[#77716A]" />;
      case "PROJECT_MATERIALS":
        return <ShoppingCart className="w-4 h-4 text-[#77716A]" />;
      case "MATERIALS_ORDER":
        return <Boxes className="w-4 h-4 text-[#77716A]" />;
      default:
        return <Bell className="w-4 h-4 text-[#77716A]" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF0ED] text-[#A45435] border border-[#EACDC4]">
            <ShieldAlert className="w-3 h-3 text-[#A45435]" /> URGENT
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F8EBD5] text-[#89652D] border border-[#DFD4C3]">
            <AlertTriangle className="w-3 h-3 text-[#89652D]" /> HIGH
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F3EEE5] text-[#77716A] border border-[#E8E2D8]">
            LOW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8]">
            NORMAL
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Top Header Bar */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#89652D]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#262421] tracking-tight">Notifications & Alerts</h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold font-mono rounded-full bg-[#F8EBD5] text-[#89652D] border border-[#DFD4C3]">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-[#77716A]">
                Centralized notification hub, live follow-up & site visit alerts, financial balances, and connected pipeline actions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncAlerts}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#262421] bg-[#FFFEFC] hover:bg-[#F3EEE5] border border-[#E8E2D8] rounded-xl shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Re-evaluate all business records and synchronize active alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-[#89652D]" : "text-[#77716A]"}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Alerts"}</span>
          </button>

          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer ${
              unreadCount > 0
                ? "bg-[#242321] text-[#FAF8F5] hover:bg-[#383633]"
                : "bg-[#F3EEE5] text-[#77716A] border border-[#E8E2D8] opacity-60 cursor-not-allowed"
            }`}
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4 Dynamic Metric / KPI Cards */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Feed */}
        <div
          onClick={() => {
            setNotifStatus("ALL");
            setNotifCategory("ALL");
          }}
          className={`p-4 bg-[#FFFEFC] border rounded-xl shadow-2xs cursor-pointer transition hover:border-[#DFD4C3] ${
            notifStatus === "ALL" ? "border-[#89652D] ring-1 ring-[#89652D]/20" : "border-[#E8E2D8]"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#77716A]">
            <span>Total Feed</span>
            <Bell className="w-4 h-4 text-[#89652D]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#262421] mt-1.5 tabular-nums">
            {totalCount}
          </div>
          <div className="text-[11px] text-[#77716A] mt-0.5">All generated notifications</div>
        </div>

        {/* Unread Alerts */}
        <div
          onClick={() => setNotifStatus("UNREAD")}
          className={`p-4 bg-[#FFFEFC] border rounded-xl shadow-2xs cursor-pointer transition hover:border-[#DFD4C3] ${
            notifStatus === "UNREAD" ? "border-[#89652D] ring-1 ring-[#89652D]/20 bg-[#FAF8F5]" : "border-[#E8E2D8]"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#262421]">
            <span>Unread Alerts</span>
            <span className="w-2 h-2 rounded-full bg-[#89652D] animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#89652D] mt-1.5 tabular-nums">
            {unreadCount}
          </div>
          <div className="text-[11px] text-[#77716A] mt-0.5">Requiring administrator review</div>
        </div>

        {/* Urgent & Action Required */}
        <div
          onClick={() => setNotifStatus("ACTIVE")}
          className={`p-4 bg-[#FFFEFC] border rounded-xl shadow-2xs cursor-pointer transition hover:border-[#DFD4C3] ${
            notifStatus === "ACTIVE" ? "border-[#A45435] ring-1 ring-[#A45435]/20 bg-[#FAF0ED]/30" : "border-[#E8E2D8]"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#A45435]">
            <span>Action Required</span>
            <ShieldAlert className="w-4 h-4 text-[#A45435]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#A45435] mt-1.5 tabular-nums">
            {urgentCount}
          </div>
          <div className="text-[11px] text-[#A45435]/80 mt-0.5">Overdue follow-ups & inspections</div>
        </div>

        {/* Resolved Today */}
        <div
          onClick={() => setNotifStatus("RESOLVED")}
          className={`p-4 bg-[#FFFEFC] border rounded-xl shadow-2xs cursor-pointer transition hover:border-[#DFD4C3] ${
            notifStatus === "RESOLVED" ? "border-[#536B4E] ring-1 ring-[#536B4E]/20 bg-[#F4F7F3]/30" : "border-[#E8E2D8]"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#536B4E]">
            <span>Resolved History</span>
            <CheckCircle2 className="w-4 h-4 text-[#536B4E]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#536B4E] mt-1.5 tabular-nums">
            {resolvedCount}
          </div>
          <div className="text-[11px] text-[#536B4E]/80 mt-0.5">Completed tasks & cleared alerts</div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Sub-Tabs: Notifications vs Reminders */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E2D8]">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setMainTab("NOTIFICATIONS")}
            className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              mainTab === "NOTIFICATIONS"
                ? "border-[#89652D] text-[#262421]"
                : "border-transparent text-[#77716A] hover:text-[#262421]"
            }`}
          >
            <Bell className="w-4 h-4 text-[#89652D]" />
            <span>Operational Alerts & Activities</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 font-mono text-[10px] font-bold bg-[#F8EBD5] text-[#89652D] border border-[#DFD4C3] rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMainTab("REMINDERS")}
            className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              mainTab === "REMINDERS"
                ? "border-[#89652D] text-[#262421]"
                : "border-transparent text-[#77716A] hover:text-[#262421]"
            }`}
          >
            <Clock className="w-4 h-4 text-[#77716A]" />
            <span>Scheduled Reminders & Snooze</span>
            {overdueCount > 0 && (
              <span className="px-1.5 py-0.2 font-mono text-[10px] font-bold bg-[#FAF0ED] text-[#A45435] border border-[#EACDC4] rounded-full">
                {overdueCount}
              </span>
            )}
          </button>
        </div>

        {mainTab === "REMINDERS" && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 mb-2 rounded-xl bg-[#242321] text-[#FAF8F5] text-xs font-bold shadow-2xs hover:bg-[#383633] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Reminder</span>
          </button>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MAIN NOTIFICATIONS TAB CONTENT */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mainTab === "NOTIFICATIONS" && (
        <div className="space-y-4">
          {/* Advanced Multi-Dimensional Filter Bar */}
          <div className="bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl p-3.5 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <FilterSelect
                label="Category"
                options={CATEGORY_OPTIONS}
                value={notifCategory}
                onChange={(val) => setNotifCategory(val || "ALL")}
                variant="beige"
                size="sm"
              />

              <FilterSelect
                label="Status"
                options={STATUS_OPTIONS}
                value={notifStatus}
                onChange={(val) => setNotifStatus(val || "ALL")}
                variant="beige"
                size="sm"
              />

              <FilterSelect
                label="Priority"
                options={PRIORITY_OPTIONS}
                value={notifPriority}
                onChange={(val) => setNotifPriority(val || "ALL")}
                variant="beige"
                size="sm"
              />

              <FilterSelect
                label="Date Range"
                options={DATE_RANGE_OPTIONS}
                value={notifDateRange}
                onChange={(val) => setNotifDateRange(val || "ALL")}
                variant="beige"
                size="sm"
              />
            </div>

            {/* Custom Date Picker (if CUSTOM date range selected) */}
            {notifDateRange === "CUSTOM" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E8E2D8]">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77716A] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] text-[#262421] focus:border-[#89652D] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#77716A] mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] text-[#262421] focus:border-[#89652D] outline-none"
                  />
                </div>
              </div>
            )}

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#77716A] absolute left-3 top-3" />
              <input
                type="text"
                value={notifSearch}
                onChange={(e) => setNotifSearch(e.target.value)}
                placeholder="Search notifications by Lead Name/ID, Project Title/ID, Vendor, Quotation, Payment Ref, or Keywords..."
                className="w-full text-xs py-2 pl-9 pr-8 rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] text-[#262421] placeholder-[#77716A] focus:border-[#89652D] focus:ring-2 focus:ring-[#89652D]/20 outline-none"
              />
              {notifSearch && (
                <button
                  onClick={() => setNotifSearch("")}
                  className="absolute right-3 top-2.5 text-[#77716A] hover:text-[#262421] text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Background Revalidation Indicator */}
          {isBackgroundRefreshing && (
            <div className="w-full bg-[#FAF8F5] border border-[#E8E2D8] px-3.5 py-1.5 rounded-xl flex items-center justify-between text-xs text-[#89652D] animate-pulse">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#89652D]" />
                <span>Syncing live notifications and alerts...</span>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* Notification List Feed */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="space-y-2.5">
            {notifLoading ? (
              <div className="space-y-2.5 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-[#E8E2D8] bg-[#FFFEFC] flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-[#F3EEE5] shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-48 bg-[#F3EEE5] rounded"></div>
                          <div className="h-4 w-16 bg-[#F3EEE5] rounded"></div>
                        </div>
                        <div className="h-3 w-3/4 bg-[#FAF8F5] rounded"></div>
                        <div className="h-2.5 w-24 bg-[#FAF8F5] rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-16 text-center text-xs text-[#77716A] bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] flex flex-col items-center justify-center gap-2 shadow-2xs">
                <CheckCircle2 className="w-8 h-8 text-[#536B4E]" />
                <h3 className="text-sm font-bold text-[#262421]">NO NOTIFICATIONS</h3>
                <p className="max-w-md text-[#77716A]">
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
                      ? "bg-[#FAF8F5] border-[#DFD4C3] hover:bg-[#F3EEE5]/40 shadow-2xs"
                      : "bg-[#FFFEFC] border-[#E8E2D8] hover:bg-[#FAF7F2]"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Category Icon */}
                    <div className="w-9 h-9 rounded-xl bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {getCategoryIcon(item.category)}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#262421] leading-tight">
                          {item.title}
                        </span>
                        {getPriorityBadge(item.priority)}
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#F3EEE5] border border-[#E8E2D8] text-[#77716A]">
                          {item.category.replace(/_/g, " ")}
                        </span>
                        {item.entityId && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E8E2D8] text-[#262421]">
                            {item.entityType || "Record"}: {item.entityId.substring(0, 8)}...
                          </span>
                        )}
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#89652D] inline-block" title="Unread" />
                        )}
                      </div>

                      <p className="text-xs text-[#262421] leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-[#77716A] pt-0.5">
                        <span className="font-mono">{formatDate(item.createdAt)}</span>
                        {item.dismissedAt && (
                          <span className="text-[#536B4E] font-semibold flex items-center gap-1">
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FFFEFC] hover:bg-[#F3EEE5] border border-[#E8E2D8] text-[#262421] text-xs font-semibold transition cursor-pointer shadow-2xs"
                      >
                        <span>Open Record</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#89652D]" />
                      </button>
                    )}

                    {!item.isRead && (
                      <button
                        onClick={(e) => markRead(item.id, e)}
                        className="p-1.5 rounded-lg border border-[#E8E2D8] bg-[#FFFEFC] hover:bg-[#F3EEE5] text-[#77716A] hover:text-[#262421] text-xs transition cursor-pointer"
                        title="Mark as Read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!item.dismissedAt && (item.priority === "HIGH" || item.priority === "URGENT") && (
                      <button
                        onClick={(e) => resolveAlert(item.id, e)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F4F7F3] hover:bg-[#E8EFE6] border border-[#D1E0CD] text-[#536B4E] text-xs font-bold transition cursor-pointer"
                        title="Resolve and clear this active alert"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#536B4E]" />
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
          <div className="bg-[#FFFEFC] border border-[#E8E2D8] rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-[#77716A]">Filter:</span>
              {["ALL", "PENDING", "OVERDUE", "COMPLETED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setReminderStatus(st)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    reminderStatus === st
                      ? "bg-[#242321] text-[#FAF8F5] shadow-2xs"
                      : "bg-[#F3EEE5] text-[#77716A] hover:bg-[#E8E2D8]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#77716A] absolute left-3 top-2.5" />
              <input
                type="text"
                value={reminderSearch}
                onChange={(e) => setReminderSearch(e.target.value)}
                placeholder="Search reminders..."
                className="w-full text-xs py-1.5 pl-8 pr-3 rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] text-[#262421] placeholder-[#77716A] outline-none focus:border-[#89652D]"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {reminderLoading ? (
              <div className="p-12 text-center text-xs text-[#77716A] bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] flex flex-col items-center gap-2">
                <Clock className="w-5 h-5 animate-spin text-[#89652D]" />
                Loading reminders...
              </div>
            ) : reminders.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#77716A] bg-[#FFFEFC] rounded-xl border border-[#E8E2D8]">
                No reminders found in this view. Click &quot;Create Reminder&quot; to schedule an action.
              </div>
            ) : (
              reminders.map((rem) => (
                <div
                  key={rem.id}
                  className="p-4 rounded-xl border border-[#E8E2D8] bg-[#FFFEFC] hover:bg-[#FAF7F2] transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#262421]">{rem.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#F3EEE5] border border-[#E8E2D8] text-[#77716A]">
                        {rem.referenceNo}
                      </span>
                      {getPriorityBadge(rem.priority)}
                    </div>
                    {rem.description && (
                      <p className="text-xs text-[#77716A]">{rem.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-[#77716A] pt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-[#89652D]" /> Due: {formatDate(rem.dueAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {rem.actionUrl && (
                      <button
                        onClick={() => router.push(rem.actionUrl!)}
                        className="px-3 py-1.5 text-xs font-semibold bg-[#FFFEFC] hover:bg-[#F3EEE5] border border-[#E8E2D8] rounded-xl text-[#262421] flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#89652D]" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#262421]/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FFFEFC] rounded-2xl border border-[#E8E2D8] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <h3 className="text-sm font-bold text-[#262421]">Schedule New Reminder</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-[#77716A] hover:text-[#262421] hover:bg-[#F3EEE5] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Follow up on Project PRJ-001 quotation"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] text-[#262421] placeholder-[#77716A] focus:border-[#89652D] focus:ring-2 focus:ring-[#89652D]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">Due Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={newDueAt}
                  onChange={(e) => setNewDueAt(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] text-[#262421] focus:border-[#89652D] focus:ring-2 focus:ring-[#89652D]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] text-[#262421] focus:border-[#89652D] focus:ring-2 focus:ring-[#89652D]/20 outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional details regarding this reminder..."
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] text-[#262421] placeholder-[#77716A] focus:border-[#89652D] focus:ring-2 focus:ring-[#89652D]/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#262421] mb-1">Action URL / Redirection</label>
                <input
                  type="text"
                  value={newActionUrl}
                  onChange={(e) => setNewActionUrl(e.target.value)}
                  placeholder="e.g. /projects or /leads"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E8E2D8] bg-[#FAF8F5] text-[#262421] placeholder-[#77716A] focus:border-[#89652D] focus:ring-2 focus:ring-[#89652D]/20 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#77716A] hover:bg-[#F3EEE5] rounded-xl border border-[#E8E2D8] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReminder}
                  className="px-4 py-2 text-xs font-bold text-[#FAF8F5] bg-[#242321] hover:bg-[#383633] rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
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
