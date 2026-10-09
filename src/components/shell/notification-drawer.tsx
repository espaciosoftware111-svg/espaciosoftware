"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  X,
  ExternalLink,
  Clock,
  AlertTriangle,
  Info,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Inbox,
  Filter,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  category: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  title: string;
  message: string;
  actionUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

const CATEGORIES = [
  { id: "ALL", label: "All" },
  { id: "LEADS", label: "Leads" },
  { id: "PROJECTS", label: "Projects" },
  { id: "PAYMENTS", label: "Payments" },
  { id: "EXPENSES", label: "Expenses" },
  { id: "SYSTEM", label: "System" },
];

function getRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (isNaN(diffSec) || diffSec < 45) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return "Yesterday";
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
}) => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("limit", "40");
      if (activeCategory !== "ALL") params.set("category", activeCategory);
      if (onlyUnread) params.set("isRead", "false");

      const res = await fetch(`/api/v1/notifications?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data.notifications || []);
        const count = json.data.unreadCount ?? 0;
        setUnreadCount(count);
        if (onUnreadCountChange) onUnreadCountChange(count);
      }
    } catch {
      // Quiet polling handling
    }
  }, [activeCategory, onlyUnread, onUnreadCountChange]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchNotifications().finally(() => setIsLoading(false));
    }
  }, [isOpen, activeCategory, onlyUnread, fetchNotifications]);

  const markRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => {
        const next = Math.max(0, prev - 1);
        if (onUnreadCountChange) onUnreadCountChange(next);
        return next;
      });
    } catch {
      // Quiet handling
    }
  };

  const markAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await fetch("/api/v1/notifications/mark-all-read", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch {
      // Quiet handling
    } finally {
      setIsMarkingAll(false);
    }
  };

  const dismissNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/v1/notifications/${id}/dismiss`, { method: "POST" });
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead) {
        setUnreadCount((prev) => {
          const next = Math.max(0, prev - 1);
          if (onUnreadCountChange) onUnreadCountChange(next);
          return next;
        });
      }
    } catch {
      // Quiet handling
    }
  };

  const handleActionClick = (item: NotificationItem) => {
    if (!item.isRead) markRead(item.id);
    onClose();
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] flex items-center gap-1 shrink-0">
            <ShieldAlert className="w-3 h-3" /> Urgent
          </span>
        );
      case "HIGH":
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-[#FEF9EE] text-[#8C6E38] border border-[#E8D4A2] flex items-center gap-1 shrink-0">
            <AlertTriangle className="w-3 h-3 text-[#B99558]" /> High
          </span>
        );
      case "LOW":
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-[#F5F2EC] text-[#77736C] shrink-0 border border-[#EAE5DD]">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const filteredList = onlyUnread
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#242321]/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-[#FFFEFC] shadow-2xl border-l border-[#EAE5DD] z-10 flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EAE5DD] flex items-center justify-between bg-[#F8F6F1] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEE5D6] border border-[#DDD6CA] flex items-center justify-center text-[#8C6E38]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#242321]">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded-full bg-[#B99558] text-white">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#77736C]">Updates and operational alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={isMarkingAll}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#242321] hover:text-[#8C6E38] hover:bg-[#EEE5D6] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#B99558]" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#77736C] hover:text-[#242321] hover:bg-[#F3EEE5] transition-colors cursor-pointer"
              title="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-3.5 py-2.5 border-b border-[#EAE5DD] bg-[#FFFEFC] flex items-center justify-between gap-2 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-[#242321] text-[#FFFEFC] font-semibold shadow-2xs"
                    : "text-[#77736C] hover:bg-[#F5F2EC] hover:text-[#242321]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Unread Only Toggle */}
          <button
            onClick={() => setOnlyUnread(!onlyUnread)}
            className={`px-2 py-1 text-[11px] rounded-lg font-semibold border shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
              onlyUnread
                ? "bg-[#EEE5D6] text-[#242321] border-[#B99558]/50"
                : "bg-[#F8F6F1] text-[#77736C] border-[#EAE5DD] hover:text-[#242321]"
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Unread</span>
          </button>
        </div>

        {/* Notification List Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#EAE5DD]/60 p-2.5 space-y-1">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-[#77736C] flex flex-col items-center gap-3">
              <Clock className="w-5 h-5 animate-spin text-[#B99558]" />
              <span>Loading notifications...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-20 text-center text-xs text-[#77736C] flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C]">
                <Inbox className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#242321]">You&apos;re all caught up!</p>
                <p className="text-[11px] text-[#77736C] mt-0.5">
                  {onlyUnread
                    ? "No unread notifications to display."
                    : "No notifications found in this view."}
                </p>
              </div>
            </div>
          ) : (
            filteredList.map((item) => (
              <div
                key={item.id}
                onClick={() => handleActionClick(item)}
                className={`p-3.5 rounded-xl transition-all flex flex-col gap-2 cursor-pointer border ${
                  !item.isRead
                    ? "bg-[#FAF7F2] border-[#E5DAC9] hover:border-[#B99558]/60 shadow-[0_1px_2px_0_rgba(36,35,33,0.04)]"
                    : "bg-[#FFFEFC] border-[#EAE5DD] hover:bg-[#F8F6F1]"
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#B99558] shrink-0" />
                    )}
                    <h4 className="text-xs font-bold text-[#242321] truncate">{item.title}</h4>
                    {getPriorityBadge(item.priority)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!item.isRead && (
                      <button
                        onClick={(e) => markRead(item.id, e)}
                        title="Mark as read"
                        className="p-1 text-[#77736C] hover:text-[#242321] hover:bg-[#EAE5DD]/60 rounded-md transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => dismissNotification(item.id, e)}
                      title="Dismiss notification"
                      className="p-1 text-[#77736C] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-md transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Message */}
                <p className="text-xs text-[#55524E] leading-relaxed line-clamp-2">
                  {item.message}
                </p>

                {/* Footer Meta */}
                <div className="flex items-center justify-between mt-0.5 text-[11px] text-[#77736C]">
                  <span className="font-mono">{getRelativeTime(item.createdAt)}</span>
                  {item.actionUrl && (
                    <span className="text-[#8C6E38] hover:text-[#B99558] font-semibold flex items-center gap-1 text-[11px]">
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#EAE5DD] bg-[#F8F6F1] text-center shrink-0">
          <button
            onClick={() => {
              onClose();
              router.push("/notifications");
            }}
            className="w-full py-2.5 px-3 text-xs font-bold text-[#242321] hover:bg-[#EEE5D6] bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <span>View Full Notification Center</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#77736C]" />
          </button>
        </div>
      </div>
    </div>
  );
};
