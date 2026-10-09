"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  ExternalLink,
  Clock,
  Folder,
  DollarSign,
  Truck,
  CheckSquare,
  X,
  RefreshCw,
  Phone,
  MapPin,
  User,
  PhoneCall,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Link2,
  Building2,
  Tag,
  ChevronDown,
  Clock3,
  Check,
  FileText,
  AlertTriangle,
  Layers,
  Inbox,
  Sparkles,
  Briefcase,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ClockTimePicker } from "@/components/ui/clock-time-picker";
import { formatDate } from "@/lib/utils";
import { clientCache } from "@/lib/client-cache";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO String
  time?: string | null;
  sourceType:
    | "TASK"
    | "LEAD_FOLLOW_UP"
    | "SITE_VISIT"
    | "PROJECT_MILESTONE"
    | "PAYMENT_DUE"
    | "PO_DELIVERY"
    | "QUOTATION_EXPIRY"
    | "REMINDER";
  sourceId: string;
  referenceNo?: string;
  clientName?: string;
  clientPhone?: string;
  location?: string;
  assignedToName?: string;
  notes?: string;
  actionUrl: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: string;
  category:
    | "FOLLOW_UPS"
    | "SITE_VISITS"
    | "TASKS"
    | "PROJECT_MILESTONES"
    | "DELIVERIES"
    | "PAYMENTS"
    | "REMINDERS";
  amount?: number;
}

interface CalendarKPIs {
  todayAppointments: number;
  pendingFollowUps: number;
  scheduledSiteVisits: number;
  tasksDueToday: number;
  expectedDeliveries: number;
}

const CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    accent: string;
  }
> = {
  SITE_VISITS: {
    label: "Site Visit",
    icon: MapPin,
    bg: "bg-[#F7F4EE]",
    border: "border-[#E8E0D2]",
    text: "text-[#262421]",
    badgeBg: "bg-[#EFE9DF]",
    badgeText: "text-[#6B5A42]",
    badgeBorder: "border-[#DFD5C6]",
    accent: "#A18D70",
  },
  FOLLOW_UPS: {
    label: "CRM Follow-up",
    icon: PhoneCall,
    bg: "bg-[#FAF7F2]",
    border: "border-[#EBE3D7]",
    text: "text-[#262421]",
    badgeBg: "bg-[#F3ECE0]",
    badgeText: "text-[#7A5E33]",
    badgeBorder: "border-[#E4D7C2]",
    accent: "#B99558",
  },
  TASKS: {
    label: "Task / To-Do",
    icon: CheckSquare,
    bg: "bg-[#F8F6F2]",
    border: "border-[#E8E3DA]",
    text: "text-[#262421]",
    badgeBg: "bg-[#ECE7DF]",
    badgeText: "text-[#5A544C]",
    badgeBorder: "border-[#DDD5C9]",
    accent: "#6E6659",
  },
  PROJECT_MILESTONES: {
    label: "Project Milestone",
    icon: Folder,
    bg: "bg-[#F9F6F0]",
    border: "border-[#EAE1D5]",
    text: "text-[#262421]",
    badgeBg: "bg-[#F2EAE0]",
    badgeText: "text-[#6F5B46]",
    badgeBorder: "border-[#E2D5C6]",
    accent: "#8C7355",
  },
  DELIVERIES: {
    label: "Material Delivery",
    icon: Truck,
    bg: "bg-[#F9F5EE]",
    border: "border-[#EBE1D4]",
    text: "text-[#262421]",
    badgeBg: "bg-[#F1E8DC]",
    badgeText: "text-[#72573D]",
    badgeBorder: "border-[#E2D3C2]",
    accent: "#855F38",
  },
  PAYMENTS: {
    label: "Payment Due",
    icon: DollarSign,
    bg: "bg-[#FAF4F2]",
    border: "border-[#EFE1DD]",
    text: "text-[#262421]",
    badgeBg: "bg-[#F7E7E3]",
    badgeText: "text-[#874A3D]",
    badgeBorder: "border-[#ECCAC3]",
    accent: "#A85A48",
  },
  REMINDERS: {
    label: "Reminder",
    icon: Clock3,
    bg: "bg-[#F7F5F1]",
    border: "border-[#E9E4DC]",
    text: "text-[#262421]",
    badgeBg: "bg-[#ECE6DE]",
    badgeText: "text-[#5E574D]",
    badgeBorder: "border-[#DDD6CB]",
    accent: "#6E6659",
  },
};

const DEFAULT_CATEGORY_CONFIG = {
  label: "Event",
  icon: CalendarIcon,
  bg: "bg-[#F8F6F1]",
  border: "border-[#E8E2D8]",
  text: "text-[#262421]",
  badgeBg: "bg-[#F3EEE5]",
  badgeText: "text-[#77716A]",
  badgeBorder: "border-[#E8E2D8]",
  accent: "#A18D70",
};

export default function CalendarWorkspacePage() {
  const router = useRouter();
  const toast = useToast();

  const [calendarView, setCalendarView] = useState<"DAY" | "WEEK" | "MONTH">("DAY");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month + 2, 0, 23, 59, 59).toISOString();
  const calendarCacheKey = `/api/v1/calendar/events?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}${categoryFilter !== "ALL" ? `&category=${categoryFilter}` : ""}${statusFilter !== "ALL" ? `&status=${statusFilter}` : ""}${searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : ""}`;
  const initialCached = clientCache.getImmediate<any>(calendarCacheKey);

  const [events, setEvents] = useState<CalendarEvent[]>(() => initialCached?.data || []);
  const [kpis, setKpis] = useState<CalendarKPIs>(() => initialCached?.meta?.kpi || {
    todayAppointments: 0,
    pendingFollowUps: 0,
    scheduledSiteVisits: 0,
    tasksDueToday: 0,
    expectedDeliveries: 0,
  });
  const [isLoading, setIsLoading] = useState(!initialCached);

  // Selected event for the Companion Details Panel
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState<"DETAILS" | "RELATED" | "HISTORY">("DETAILS");

  // Quick Schedule Event modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newEventType, setNewEventType] = useState<"TASK" | "LEAD_FOLLOW_UP" | "SITE_VISIT" | "REMINDER">("TASK");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [newEventTime, setNewEventTime] = useState("10:00");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventPriority, setNewEventPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [newEventNotes, setNewEventNotes] = useState("");
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // Fetch events
  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true);
    try {
      const yr = currentDate.getFullYear();
      const m = currentDate.getMonth();
      const s = new Date(yr, m - 1, 1).toISOString();
      const e = new Date(yr, m + 2, 0, 23, 59, 59).toISOString();

      const params = new URLSearchParams({
        startDate: s,
        endDate: e,
        ...(categoryFilter !== "ALL" ? { category: categoryFilter } : {}),
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      });

      const res = await fetch(`/api/v1/calendar/events?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setEvents(json.data);
        if (json.meta?.kpi) {
          setKpis(json.meta.kpi);
        }
        // If an event was selected, keep it updated
        if (selectedEvent) {
          const fresh = json.data.find((e: CalendarEvent) => e.id === selectedEvent.id);
          if (fresh) setSelectedEvent(fresh);
        }
        clientCache.set(calendarCacheKey, json, 30000);
      }
    } catch (err) {
      console.error("Error fetching calendar data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, categoryFilter, statusFilter, searchQuery, calendarCacheKey, selectedEvent]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Date Navigation Handlers
  const handlePrevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleSelectDay = (date: Date) => {
    setSelectedDate(date);
    if (date.getMonth() !== currentDate.getMonth() || date.getFullYear() !== currentDate.getFullYear()) {
      setCurrentDate(new Date(date));
    }
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    handleSelectDay(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    handleSelectDay(d);
  };

  const handleOpenScheduleModal = (dateStr?: string) => {
    if (dateStr) {
      setNewEventDate(dateStr);
    } else {
      setNewEventDate(selectedDate.toISOString().split("T")[0]);
    }
    setNewEventTitle("");
    setNewEventLocation("");
    setNewEventNotes("");
    setIsScheduleModalOpen(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      toast.error("Validation Error", "Please provide a title for the event");
      return;
    }

    setIsSubmittingEvent(true);
    try {
      const res = await fetch("/api/v1/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: newEventType,
          title: newEventTitle.trim(),
          date: newEventDate,
          time: newEventTime || undefined,
          priority: newEventPriority,
          location: newEventLocation.trim() || undefined,
          notes: newEventNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Event Scheduled", "Added successfully to operational calendar.");
        setIsScheduleModalOpen(false);
        fetchCalendarData();
      } else {
        toast.error("Failed to schedule", json.error?.message || "Could not save event");
      }
    } catch {
      toast.error("Network Error", "Could not connect to calendar server");
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const getStyles = (category: string) => {
    return CATEGORY_CONFIG[category] || DEFAULT_CATEGORY_CONFIG;
  };

  // Group events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      const dStr = ev.date.split("T")[0];
      if (!map[dStr]) map[dStr] = [];
      map[dStr].push(ev);
    }
    return map;
  }, [events]);

  // Month Matrix calculation for the mini calendar
  const monthData = useMemo(() => {
    const yr = currentDate.getFullYear();
    const m = currentDate.getMonth();

    const firstDayIndex = new Date(yr, m, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(yr, m + 1, 0).getDate();
    const totalDaysPrevMonth = new Date(yr, m, 0).getDate();

    const days: {
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      dateStr: string;
      eventCount: number;
      events: CalendarEvent[];
    }[] = [];

    const selStr = selectedDate.toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = totalDaysPrevMonth - i;
      const d = new Date(yr, m - 1, dayNum);
      const dStr = d.toISOString().split("T")[0];
      const evList = eventsByDate[dStr] || [];
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === selStr,
        dateStr: dStr,
        eventCount: evList.length,
        events: evList,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(yr, m, i);
      const dStr = d.toISOString().split("T")[0];
      const evList = eventsByDate[dStr] || [];
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isSelected: dStr === selStr,
        dateStr: dStr,
        eventCount: evList.length,
        events: evList,
      });
    }

    // Next month padding to fill grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(yr, m + 1, i);
      const dStr = d.toISOString().split("T")[0];
      const evList = eventsByDate[dStr] || [];
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === selStr,
        dateStr: dStr,
        eventCount: evList.length,
        events: evList,
      });
    }

    return days;
  }, [currentDate, selectedDate, eventsByDate]);

  // Week View Days calculation based on selectedDate
  const weekData = useMemo(() => {
    const curr = new Date(selectedDate);
    const dayOfWeek = curr.getDay(); // 0 = Sun
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const weekDays: {
      date: Date;
      dateStr: string;
      isToday: boolean;
      isSelected: boolean;
      events: CalendarEvent[];
    }[] = [];
    const todayStr = new Date().toISOString().split("T")[0];
    const selStr = selectedDate.toISOString().split("T")[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dStr = d.toISOString().split("T")[0];
      weekDays.push({
        date: d,
        dateStr: dStr,
        isToday: dStr === todayStr,
        isSelected: dStr === selStr,
        events: eventsByDate[dStr] || [],
      });
    }
    return weekDays;
  }, [selectedDate, eventsByDate]);

  // Filtered Events for DAY View
  const selectedDayDateStr = selectedDate.toISOString().split("T")[0];
  const dayEvents = useMemo(() => {
    return eventsByDate[selectedDayDateStr] || [];
  }, [eventsByDate, selectedDayDateStr]);

  // Filtered Events for WEEK View
  const weekEventsCount = useMemo(() => {
    return weekData.reduce((acc, curr) => acc + curr.events.length, 0);
  }, [weekData]);

  // Filtered Events for MONTH View (Grouped by date)
  const monthEventsGrouped = useMemo(() => {
    const yr = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const map: Record<string, { date: Date; events: CalendarEvent[] }> = {};

    for (const ev of events) {
      const evDate = new Date(ev.date);
      if (evDate.getFullYear() === yr && evDate.getMonth() === m) {
        const dStr = ev.date.split("T")[0];
        if (!map[dStr]) {
          map[dStr] = { date: evDate, events: [] };
        }
        map[dStr].events.push(ev);
      }
    }

    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [events, currentDate]);

  // Hourly slots for the Day View timeline
  const HOURLY_SLOTS = useMemo(() => {
    return [
      { label: "All Day", hour: null },
      { label: "9:00 AM", hour: 9 },
      { label: "10:00 AM", hour: 10 },
      { label: "11:00 AM", hour: 11 },
      { label: "12:00 PM", hour: 12 },
      { label: "1:00 PM", hour: 13 },
      { label: "2:00 PM", hour: 14 },
      { label: "3:00 PM", hour: 15 },
      { label: "4:00 PM", hour: 16 },
      { label: "5:00 PM", hour: 17 },
      { label: "6:00 PM", hour: 18 },
    ];
  }, []);

  // Map day events into timeline slots
  const timelineSlotEvents = useMemo(() => {
    const slotMap: Record<string, CalendarEvent[]> = {};
    const unslotted: CalendarEvent[] = [];

    dayEvents.forEach((ev) => {
      if (!ev.time) {
        if (!slotMap["all-day"]) slotMap["all-day"] = [];
        slotMap["all-day"].push(ev);
      } else {
        const [hStr] = ev.time.split(":");
        const hourNum = parseInt(hStr, 10);
        const slotKey = isNaN(hourNum) ? "all-day" : `slot-${hourNum}`;
        if (!slotMap[slotKey]) slotMap[slotKey] = [];
        slotMap[slotKey].push(ev);
      }
    });

    return { slotMap, unslotted };
  }, [dayEvents]);

  // Find all related activities for the currently selected event
  const relatedData = useMemo(() => {
    if (!selectedEvent) return { forSameEntity: [], forSameDay: [] };

    // 1. Same client, project, or reference number
    const forSameEntity = events.filter((ev) => {
      if (ev.id === selectedEvent.id) return false;
      const sameRef =
        selectedEvent.referenceNo &&
        ev.referenceNo &&
        selectedEvent.referenceNo.trim().toUpperCase() === ev.referenceNo.trim().toUpperCase();
      const sameClient =
        selectedEvent.clientName &&
        ev.clientName &&
        selectedEvent.clientName.trim().toLowerCase() === ev.clientName.trim().toLowerCase();
      const sameSource = selectedEvent.sourceId && ev.sourceId && selectedEvent.sourceId === ev.sourceId;
      return Boolean(sameRef || sameClient || sameSource);
    });

    // 2. Other events on the same scheduled date
    const selectedDateStr = selectedEvent.date.split("T")[0];
    const forSameDay = events.filter((ev) => {
      if (ev.id === selectedEvent.id) return false;
      return ev.date.split("T")[0] === selectedDateStr;
    });

    return { forSameEntity, forSameDay };
  }, [selectedEvent, events]);

  const monthTitle = currentDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const selectedDayFormatted = selectedDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 w-full min-w-0 text-[#262421]">
      {/* 1. TOP HEADER & METRICS SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#262421]">
            Operational Calendar
          </h1>
          <p className="text-xs text-[#77716A] mt-0.5">
            Schedule and manage follow-ups, site visits, tasks, milestones, and deliveries.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchCalendarData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#262421] bg-[#FFFEFC] hover:bg-[#F3EEE5] border border-[#E8E2D8] rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-60"
            title="Refresh Calendar"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#77716A] ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => handleOpenScheduleModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#FFFEFC] bg-[#302D29] hover:bg-[#201E1B] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Today's Events */}
        <div
          onClick={() => {
            setCategoryFilter("ALL");
            handleToday();
          }}
          className="p-3.5 bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs hover:border-[#B99558]/60 cursor-pointer transition flex items-start justify-between gap-3 group"
        >
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#77716A] block truncate">
              Today&apos;s Events
            </span>
            <span className="text-xl font-bold font-mono text-[#262421] tabular-nums block mt-0.5">
              {kpis.todayAppointments}
            </span>
            <span className="text-[11px] text-[#77716A] block mt-0.5">
              Scheduled today
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#77716A] group-hover:text-[#262421] shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
        </div>

        {/* Follow-ups */}
        <div
          onClick={() => setCategoryFilter("FOLLOW_UPS")}
          className="p-3.5 bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs hover:border-[#B99558]/60 cursor-pointer transition flex items-start justify-between gap-3 group"
        >
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#77716A] block truncate">
              Follow-ups
            </span>
            <span className="text-xl font-bold font-mono text-[#262421] tabular-nums block mt-0.5">
              {kpis.pendingFollowUps}
            </span>
            <span className="text-[11px] text-[#77716A] block mt-0.5">
              CRM client calls
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#77716A] group-hover:text-[#262421] shrink-0">
            <User className="w-4 h-4" />
          </div>
        </div>

        {/* Site Visits */}
        <div
          onClick={() => setCategoryFilter("SITE_VISITS")}
          className="p-3.5 bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs hover:border-[#B99558]/60 cursor-pointer transition flex items-start justify-between gap-3 group"
        >
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#77716A] block truncate">
              Site Visits
            </span>
            <span className="text-xl font-bold font-mono text-[#262421] tabular-nums block mt-0.5">
              {kpis.scheduledSiteVisits}
            </span>
            <span className="text-[11px] text-[#77716A] block mt-0.5">
              Site inspections
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#77716A] group-hover:text-[#262421] shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
        </div>

        {/* Tasks Due */}
        <div
          onClick={() => setCategoryFilter("TASKS")}
          className="p-3.5 bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs hover:border-[#B99558]/60 cursor-pointer transition flex items-start justify-between gap-3 group"
        >
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#77716A] block truncate">
              Tasks Due
            </span>
            <span className="text-xl font-bold font-mono text-[#262421] tabular-nums block mt-0.5">
              {kpis.tasksDueToday}
            </span>
            <span className="text-[11px] text-[#77716A] block mt-0.5">
              Operational tasks
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#77716A] group-hover:text-[#262421] shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
        </div>

        {/* Deliveries */}
        <div
          onClick={() => setCategoryFilter("DELIVERIES")}
          className="p-3.5 bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs hover:border-[#B99558]/60 cursor-pointer transition flex items-start justify-between gap-3 group col-span-2 sm:col-span-1"
        >
          <div className="min-w-0">
            <span className="text-xs font-medium text-[#77716A] block truncate">
              Deliveries
            </span>
            <span className="text-xl font-bold font-mono text-[#262421] tabular-nums block mt-0.5">
              {kpis.expectedDeliveries}
            </span>
            <span className="text-[11px] text-[#77716A] block mt-0.5">
              Orders arriving
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#F3EEE5] border border-[#E8E2D8] flex items-center justify-center text-[#77716A] group-hover:text-[#262421] shrink-0">
            <Truck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. THREE-COLUMN COHESIVE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: INTERACTIVE MINI CALENDAR & CATEGORY FILTERS (3 COLS)        */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 space-y-4 min-w-0">
          {/* A. Calendar Interactive Card */}
          <div className="bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs p-4 space-y-3.5 min-w-0">
            {/* Month Header & Controls */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-[#77716A] hover:text-[#262421] hover:bg-[#F3EEE5] transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-xs font-bold text-[#262421] font-sans">
                {monthTitle}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-[#77716A] hover:text-[#262421] hover:bg-[#F3EEE5] transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-[#77716A] uppercase py-1 border-b border-[#E8E2D8]/60">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Mini Calendar Grid (42 Days) */}
            <div className="grid grid-cols-7 gap-1">
              {monthData.map((cell, idx) => {
                const isSelected = cell.isSelected;
                const isToday = cell.isToday;
                const isCurrentMonth = cell.isCurrentMonth;
                const hasEvents = cell.eventCount > 0;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(cell.date)}
                    className={`h-8 rounded-lg relative flex flex-col items-center justify-center transition cursor-pointer ${
                      isSelected
                        ? "bg-[#A18D70] text-[#FFFEFC] font-bold shadow-2xs"
                        : isToday
                        ? "bg-[#F3EEE5] text-[#262421] font-bold border border-[#B99558]/50"
                        : isCurrentMonth
                        ? "text-[#262421] hover:bg-[#F3EEE5]"
                        : "text-[#77716A]/40 hover:bg-[#F3EEE5]/50"
                    }`}
                  >
                    <span className="text-xs font-mono">{cell.date.getDate()}</span>

                    {/* Dot Indicators */}
                    {hasEvents && (
                      <span
                        className={`w-1 h-1 rounded-full mt-0.5 ${
                          isSelected ? "bg-[#FFFEFC]" : "bg-[#B99558]"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Date Jumps */}
            <div className="pt-2 border-t border-[#E8E2D8] flex items-center justify-between text-xs text-[#77716A]">
              <button
                onClick={handleToday}
                className="text-[11px] font-bold text-[#A18D70] hover:text-[#262421] cursor-pointer"
              >
                ● Today
              </button>
              <button
                onClick={() => {
                  const tm = new Date();
                  tm.setDate(tm.getDate() + 1);
                  handleSelectDay(tm);
                }}
                className="text-[11px] hover:text-[#262421] cursor-pointer"
              >
                Tomorrow
              </button>
              <button
                onClick={() => setCalendarView("WEEK")}
                className="text-[11px] hover:text-[#262421] cursor-pointer"
              >
                This Week
              </button>
              <button
                onClick={() => setCalendarView("MONTH")}
                className="text-[11px] hover:text-[#262421] cursor-pointer"
              >
                This Month
              </button>
            </div>
          </div>

          {/* B. Filter Events Card */}
          <div className="bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs p-4 space-y-3.5 min-w-0">
            <h4 className="text-xs font-bold text-[#262421]">
              Filter Events
            </h4>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#77716A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#F8F6F1] border border-[#E8E2D8] rounded-lg text-[#262421] placeholder-[#77716A] focus:outline-none focus:border-[#B99558]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#77716A] hover:text-[#262421]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Event Categories Checkboxes */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-[#77716A] uppercase tracking-wider block">
                Event Categories
              </span>

              {[
                { id: "ALL", label: "All Categories", icon: Layers },
                { id: "SITE_VISITS", label: "Site Visits", icon: MapPin },
                { id: "FOLLOW_UPS", label: "CRM Follow-ups", icon: PhoneCall },
                { id: "TASKS", label: "Tasks", icon: CheckSquare },
                { id: "PROJECT_MILESTONES", label: "Milestones", icon: Folder },
                { id: "DELIVERIES", label: "Deliveries", icon: Truck },
              ].map((cat) => {
                const isSelected = categoryFilter === cat.id;
                const Icon = cat.icon;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? "bg-[#F3EEE5] text-[#262421] font-bold border border-[#E8E2D8]"
                        : "text-[#77716A] hover:bg-[#F8F6F1] hover:text-[#262421]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-[#302D29] border-[#302D29] text-white"
                            : "border-[#E8E2D8] bg-[#FFFEFC]"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <Icon className="w-3.5 h-3.5 text-[#77716A]" />
                      <span>{cat.label}</span>
                    </div>

                    <span className="text-[10px] font-mono text-[#77716A]">
                      {cat.id === "ALL"
                        ? events.length
                        : events.filter((e) => e.category === cat.id).length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Status Filter */}
            <div className="pt-2 border-t border-[#E8E2D8] space-y-1.5">
              <span className="text-[11px] font-semibold text-[#77716A] uppercase tracking-wider block">
                Status
              </span>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs font-semibold bg-[#F8F6F1] border border-[#E8E2D8] rounded-lg px-3 py-1.5 text-[#262421] appearance-none focus:outline-none focus:border-[#B99558] cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending / Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#77716A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MIDDLE COLUMN: CENTRAL EVENT SCHEDULE (DAY / WEEK / MONTH)                */}
        {/* ========================================================================= */}
        <div
          className={
            selectedEvent
              ? "lg:col-span-5 space-y-4 min-w-0"
              : "lg:col-span-9 space-y-4 min-w-0"
          }
        >
          {/* Schedule Header Card */}
          <div className="bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 min-w-0">
            {/* View Selector (Day / Week / Month) */}
            <div className="inline-flex items-center p-0.5 bg-[#F3EEE5] rounded-lg border border-[#E8E2D8] shrink-0">
              {[
                { id: "DAY", label: "Day" },
                { id: "WEEK", label: "Week" },
                { id: "MONTH", label: "Month" },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setCalendarView(v.id as any)}
                  className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                    calendarView === v.id
                      ? "bg-[#FFFEFC] text-[#262421] font-bold shadow-2xs border border-[#E8E2D8]"
                      : "text-[#77716A] hover:text-[#262421]"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Date Title & Navigation */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={calendarView === "DAY" ? handlePrevDay : handlePrevMonth}
                className="p-1.5 text-[#77716A] hover:text-[#262421] rounded-lg hover:bg-[#F3EEE5] transition cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center px-1">
                <h2 className="text-xs sm:text-sm font-bold text-[#262421] truncate max-w-[180px] sm:max-w-none">
                  {calendarView === "DAY" && selectedDayFormatted}
                  {calendarView === "WEEK" && (
                    <>
                      {weekData[0]?.date.toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      –{" "}
                      {weekData[6]?.date.toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </>
                  )}
                  {calendarView === "MONTH" && monthTitle}
                </h2>
                <p className="text-[11px] text-[#77716A]">
                  {calendarView === "DAY" &&
                    `${dayEvents.length} events scheduled for this day`}
                  {calendarView === "WEEK" &&
                    `${weekEventsCount} events across 7 days`}
                  {calendarView === "MONTH" &&
                    `${events.length} events in ${monthTitle}`}
                </p>
              </div>

              <button
                onClick={calendarView === "DAY" ? handleNextDay : handleNextMonth}
                className="p-1.5 text-[#77716A] hover:text-[#262421] rounded-lg hover:bg-[#F3EEE5] transition cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Today jump shortcut */}
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-[#77716A] hover:text-[#262421] bg-[#F8F6F1] border border-[#E8E2D8] rounded-lg transition cursor-pointer shrink-0"
            >
              Today
            </button>
          </div>

          {/* VIEW 1: DAY VIEW SCHEDULE TIMELINE */}
          {calendarView === "DAY" && (
            <div className="bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs divide-y divide-[#E8E2D8]/60 overflow-hidden">
              {dayEvents.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#F3EEE5] text-[#77716A] flex items-center justify-center mx-auto">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#262421]">
                      No events scheduled
                    </h4>
                    <p className="text-[11px] text-[#77716A] mt-0.5">
                      No activities or appointments recorded for this day.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenScheduleModal(selectedDayDateStr)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#FFFEFC] bg-[#302D29] hover:bg-[#201E1B] rounded-xl transition shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule on this Date</span>
                  </button>
                </div>
              ) : (
                HOURLY_SLOTS.map((slot, sIdx) => {
                  const isAllDay = slot.hour === null;
                  const slotKey = isAllDay ? "all-day" : `slot-${slot.hour}`;
                  const slotItems = timelineSlotEvents.slotMap[slotKey] || [];

                  return (
                    <div
                      key={sIdx}
                      className="flex items-start min-h-[52px] group hover:bg-[#FBF9F5] transition"
                    >
                      {/* Time Label Column */}
                      <div className="w-20 sm:w-24 p-3 shrink-0 text-right">
                        <span className="text-[11px] font-mono font-medium text-[#77716A]">
                          {slot.label}
                        </span>
                      </div>

                      {/* Event Container Column */}
                      <div className="flex-1 p-2 border-l border-[#E8E2D8]/60 min-h-[52px] space-y-2">
                        {slotItems.map((ev) => {
                          const config = getStyles(ev.category);
                          const Icon = config.icon;
                          const isSelected = selectedEvent?.id === ev.id;

                          return (
                            <div
                              key={ev.id}
                              onClick={() => setSelectedEvent(ev)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                                isSelected
                                  ? "bg-[#FAF7F2] border-[#A18D70] shadow-sm ring-1 ring-[#A18D70]"
                                  : "bg-[#FFFEFC] border-[#E8E2D8] hover:border-[#B99558]/60 hover:bg-[#FAF7F2]/60 shadow-2xs"
                              }`}
                            >
                              {/* Left Accent Bar */}
                              <div
                                className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full"
                                style={{ backgroundColor: config.accent }}
                              />

                              <div className="pl-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Icon
                                      className="w-3.5 h-3.5 shrink-0"
                                      style={{ color: config.accent }}
                                    />
                                    <h4 className="text-xs font-bold text-[#262421]">
                                      {ev.title}
                                    </h4>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {ev.time && (
                                      <span className="text-[10px] font-mono text-[#77716A]">
                                        {ev.time}
                                      </span>
                                    )}
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${config.badgeBg} ${config.badgeText} border ${config.badgeBorder}`}
                                    >
                                      {config.label}
                                    </span>
                                  </div>
                                </div>

                                {ev.notes && (
                                  <p className="text-[11px] text-[#77716A] mt-1 line-clamp-1">
                                    {ev.notes}
                                  </p>
                                )}

                                {ev.clientName && (
                                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#77716A]">
                                    <span className="font-medium text-[#262421]">
                                      {ev.clientName}
                                    </span>
                                    {ev.clientPhone && (
                                      <span className="font-mono">
                                        {ev.clientPhone}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW 2: WEEK VIEW FEED */}
          {calendarView === "WEEK" && (
            <div className="space-y-3">
              {weekData.map((dayCol, idx) => {
                const dayEvs = dayCol.events;
                const isSelected = dayCol.isSelected;
                const isToday = dayCol.isToday;

                return (
                  <div
                    key={idx}
                    className={`bg-[#FFFEFC] rounded-xl border transition shadow-2xs overflow-hidden ${
                      isSelected
                        ? "border-[#A18D70] ring-1 ring-[#A18D70]"
                        : isToday
                        ? "border-[#B99558]"
                        : "border-[#E8E2D8]"
                    }`}
                  >
                    {/* Header */}
                    <div
                      onClick={() => handleSelectDay(dayCol.date)}
                      className={`p-2.5 border-b border-[#E8E2D8] flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? "bg-[#F3EEE5]"
                          : isToday
                          ? "bg-[#FAF7F2]"
                          : "bg-[#F8F6F1]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#262421]">
                          {dayCol.date.toLocaleDateString("en-IN", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {isToday && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#B99558] text-white">
                            TODAY
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#77716A]">
                        {dayEvs.length} {dayEvs.length === 1 ? "event" : "events"}
                      </span>
                    </div>

                    {/* Events */}
                    <div className="p-2 space-y-1.5">
                      {dayEvs.length === 0 ? (
                        <div className="text-[11px] text-[#77716A]/60 italic py-1 px-2">
                          No events scheduled.
                        </div>
                      ) : (
                        dayEvs.map((ev) => {
                          const config = getStyles(ev.category);
                          const isEvSelected = selectedEvent?.id === ev.id;

                          return (
                            <div
                              key={ev.id}
                              onClick={() => setSelectedEvent(ev)}
                              className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 ${
                                isEvSelected
                                  ? "bg-[#F3EEE5] border-[#A18D70]"
                                  : "bg-[#FFFEFC] border-[#E8E2D8] hover:bg-[#F8F6F1]"
                              }`}
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: config.accent }}
                                />
                                <span className="text-xs font-bold text-[#262421] truncate">
                                  {ev.title}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-[#77716A] shrink-0">
                                {ev.time || "All Day"}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 3: MONTH VIEW FEED */}
          {calendarView === "MONTH" && (
            <div className="space-y-3">
              {monthEventsGrouped.length === 0 ? (
                <div className="p-12 text-center bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#F3EEE5] text-[#77716A] flex items-center justify-center mx-auto">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#262421]">
                      No events in {monthTitle}
                    </h4>
                    <p className="text-[11px] text-[#77716A] mt-0.5">
                      No operational schedule entries recorded for this month.
                    </p>
                  </div>
                </div>
              ) : (
                monthEventsGrouped.map(([dateStr, group]) => (
                  <div
                    key={dateStr}
                    className="bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs overflow-hidden"
                  >
                    <div
                      onClick={() => handleSelectDay(group.date)}
                      className="p-2.5 bg-[#F8F6F1] border-b border-[#E8E2D8] flex items-center justify-between cursor-pointer hover:bg-[#F3EEE5] transition"
                    >
                      <span className="font-bold text-xs text-[#262421]">
                        {group.date.toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="text-[11px] text-[#77716A]">
                        {group.events.length} {group.events.length === 1 ? "item" : "items"}
                      </span>
                    </div>

                    <div className="p-2 space-y-1.5">
                      {group.events.map((ev) => {
                        const config = getStyles(ev.category);
                        const isEvSelected = selectedEvent?.id === ev.id;

                        return (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 ${
                              isEvSelected
                                ? "bg-[#F3EEE5] border-[#A18D70]"
                                : "bg-[#FFFEFC] border-[#E8E2D8] hover:bg-[#F8F6F1]"
                            }`}
                          >
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-[#262421] truncate">
                                {ev.title}
                              </h5>
                              {ev.clientName && (
                                <span className="text-[11px] text-[#77716A] block">
                                  {ev.clientName}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-[#77716A] shrink-0">
                              {ev.time || "All Day"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: SELECTED-EVENT DETAILS & RELATED PANEL (4 COLS)             */}
        {/* ========================================================================= */}
        {selectedEvent && (
          <div className="lg:col-span-4 space-y-4 min-w-0 sticky top-6 animate-in fade-in slide-in-from-right-3 duration-150">
            {/* Main Event Card */}
            <div className="bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-sm p-4 space-y-4">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Category Badge */}
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#F3EEE5] text-[#77716A] border border-[#E8E2D8]">
                      {getStyles(selectedEvent.category).label}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                        selectedEvent.priority === "URGENT" || selectedEvent.priority === "HIGH"
                          ? "bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]"
                          : "bg-[#F8F6F1] text-[#77716A] border-[#E8E2D8]"
                      }`}
                    >
                      {selectedEvent.priority} Priority
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-1 rounded-lg text-[#77716A] hover:text-[#262421] hover:bg-[#F3EEE5] transition cursor-pointer"
                    title="Close Details Panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#262421] leading-snug">
                    {selectedEvent.title}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-[#77716A]">
                      Status: {selectedEvent.status}
                    </span>
                    <span className="text-[10px] font-semibold text-[#8C6E38] bg-[#F5F1E9] border border-[#E5DAC9] px-2 py-0.5 rounded">
                      ✓ {selectedEvent.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs: Details / Related / History */}
              <div className="flex items-center border-b border-[#E8E2D8] text-xs font-semibold text-[#77716A]">
                <button
                  onClick={() => setActiveDetailsTab("DETAILS")}
                  className={`pb-2 px-1 mr-4 transition cursor-pointer ${
                    activeDetailsTab === "DETAILS"
                      ? "text-[#262421] font-bold border-b-2 border-[#302D29]"
                      : "hover:text-[#262421]"
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveDetailsTab("RELATED")}
                  className={`pb-2 px-1 mr-4 transition cursor-pointer ${
                    activeDetailsTab === "RELATED"
                      ? "text-[#262421] font-bold border-b-2 border-[#302D29]"
                      : "hover:text-[#262421]"
                  }`}
                >
                  Related ({relatedData.forSameEntity.length})
                </button>
                <button
                  onClick={() => setActiveDetailsTab("HISTORY")}
                  className={`pb-2 px-1 transition cursor-pointer ${
                    activeDetailsTab === "HISTORY"
                      ? "text-[#262421] font-bold border-b-2 border-[#302D29]"
                      : "hover:text-[#262421]"
                  }`}
                >
                  History
                </button>
              </div>

              {/* Tab 1: Details Content */}
              {activeDetailsTab === "DETAILS" && (
                <div className="space-y-3">
                  {/* Schedule Info 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Scheduled Date */}
                    <div className="p-2.5 rounded-lg bg-[#F8F6F1] border border-[#E8E2D8] space-y-0.5">
                      <span className="text-[10px] font-medium text-[#77716A] uppercase tracking-wider block">
                        Scheduled Date
                      </span>
                      <span className="text-xs font-bold text-[#262421] block">
                        {formatDate(selectedEvent.date)}
                      </span>
                    </div>

                    {/* Scheduled Time */}
                    <div className="p-2.5 rounded-lg bg-[#F8F6F1] border border-[#E8E2D8] space-y-0.5">
                      <span className="text-[10px] font-medium text-[#77716A] uppercase tracking-wider block">
                        Scheduled Time
                      </span>
                      <span className="text-xs font-bold font-mono text-[#262421] block">
                        {selectedEvent.time || "All Day"}
                      </span>
                    </div>

                    {/* Client / Contact */}
                    <div className="p-2.5 rounded-lg bg-[#F8F6F1] border border-[#E8E2D8] space-y-0.5">
                      <span className="text-[10px] font-medium text-[#77716A] uppercase tracking-wider block">
                        Client / Contact
                      </span>
                      <span className="text-xs font-bold text-[#262421] block truncate">
                        {selectedEvent.clientName || "—"}
                      </span>
                      {selectedEvent.clientPhone && (
                        <span className="text-[11px] font-mono text-[#77716A] block truncate">
                          {selectedEvent.clientPhone}
                        </span>
                      )}
                    </div>

                    {/* Lead ID / Reference */}
                    <div className="p-2.5 rounded-lg bg-[#F8F6F1] border border-[#E8E2D8] space-y-0.5">
                      <span className="text-[10px] font-medium text-[#77716A] uppercase tracking-wider block">
                        Lead ID / Ref
                      </span>
                      <span className="text-xs font-mono font-bold text-[#262421] block truncate">
                        {selectedEvent.referenceNo || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Location */}
                  {selectedEvent.location && (
                    <div className="p-2.5 rounded-lg bg-[#F8F6F1] border border-[#E8E2D8] space-y-0.5">
                      <span className="text-[10px] font-medium text-[#77716A] uppercase tracking-wider block">
                        Location / Address
                      </span>
                      <p className="text-xs font-medium text-[#262421]">
                        {selectedEvent.location}
                      </p>
                    </div>
                  )}

                  {/* Notes & Instructions */}
                  {selectedEvent.notes && (
                    <div className="p-2.5 rounded-lg bg-[#F8F6F1] border border-[#E8E2D8] space-y-0.5">
                      <span className="text-[10px] font-medium text-[#77716A] uppercase tracking-wider block">
                        Notes & Instructions
                      </span>
                      <p className="text-xs text-[#55524E] leading-relaxed">
                        {selectedEvent.notes}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1">
                    {/* Call & WhatsApp buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      {selectedEvent.clientPhone ? (
                        <>
                          <a
                            href={`tel:${selectedEvent.clientPhone}`}
                            className="py-2 px-3 rounded-xl bg-[#302D29] hover:bg-[#201E1B] text-[#FFFEFC] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Client</span>
                          </a>
                          <a
                            href={`https://wa.me/${selectedEvent.clientPhone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 px-3 rounded-xl bg-[#FFFEFC] hover:bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#77716A]" />
                            <span>WhatsApp</span>
                          </a>
                        </>
                      ) : (
                        <div className="col-span-2 py-2 text-center text-[11px] text-[#77716A] bg-[#F8F6F1] rounded-lg">
                          No phone number linked to this event
                        </div>
                      )}
                    </div>

                    {/* Operational Workspace Link */}
                    {selectedEvent.actionUrl && (
                      <Link href={selectedEvent.actionUrl} className="block">
                        <button
                          type="button"
                          className="w-full py-2.5 px-3 rounded-xl bg-[#FFFEFC] hover:bg-[#F3EEE5] text-[#262421] border border-[#E8E2D8] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#77716A]" />
                          <span>Open Full Operational Workspace</span>
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Related Items Content */}
              {activeDetailsTab === "RELATED" && (
                <div className="space-y-3">
                  {relatedData.forSameEntity.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#77716A] bg-[#F8F6F1] rounded-lg border border-[#E8E2D8]">
                      No other follow-ups or activities linked to this client/project.
                    </div>
                  ) : (
                    relatedData.forSameEntity.map((relEv) => {
                      const config = getStyles(relEv.category);
                      return (
                        <div
                          key={relEv.id}
                          onClick={() => setSelectedEvent(relEv)}
                          className="p-2.5 rounded-lg bg-[#F8F6F1] border border-[#E8E2D8] hover:bg-[#F3EEE5] transition cursor-pointer space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] text-[#77716A]">
                            <span className="font-bold uppercase">{config.label}</span>
                            <span>{formatDate(relEv.date)}</span>
                          </div>
                          <h5 className="text-xs font-bold text-[#262421] line-clamp-1">
                            {relEv.title}
                          </h5>
                          <div className="flex items-center justify-between text-[10px] text-[#77716A]">
                            <span>Status: {relEv.status}</span>
                            <span className="font-semibold text-[#8C6E38]">View ➔</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 3: History */}
              {activeDetailsTab === "HISTORY" && (
                <div className="space-y-2 text-xs text-[#77716A]">
                  <div className="p-2.5 rounded-lg bg-[#F8F6F1] border border-[#E8E2D8] space-y-1">
                    <span className="text-[10px] font-mono text-[#77716A] block">
                      {formatDate(selectedEvent.date)}
                    </span>
                    <p className="text-[#262421] font-medium">
                      Event scheduled on operational calendar
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Related on this Day Card */}
            {relatedData.forSameDay.length > 0 && (
              <div className="bg-[#FFFEFC] rounded-xl border border-[#E8E2D8] shadow-2xs p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-[#262421]">
                  Other Events on This Day ({relatedData.forSameDay.length})
                </h4>

                <div className="space-y-1.5">
                  {relatedData.forSameDay.map((dayEv) => (
                    <div
                      key={dayEv.id}
                      onClick={() => setSelectedEvent(dayEv)}
                      className="p-2 rounded-lg bg-[#F8F6F1] hover:bg-[#F3EEE5] border border-[#E8E2D8] transition cursor-pointer flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="font-medium text-[#262421] truncate">
                        {dayEv.title}
                      </span>
                      <span className="text-[10px] font-mono text-[#77716A] shrink-0">
                        {dayEv.time || "All Day"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL: QUICK SCHEDULE EVENT MODAL                    */}
      {/* ==================================================== */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Operational Appointment / Task"
        maxWidth="md"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4 pt-1">
          {/* Event Category */}
          <div>
            <label className="text-xs font-bold text-[#262421] block mb-1">
              Event Category *
            </label>
            <select
              value={newEventType}
              onChange={(e) => setNewEventType(e.target.value as any)}
              className="w-full h-9 px-3 text-xs font-semibold bg-[#FFFEFC] border border-[#E8E2D8] rounded-lg text-[#262421] outline-none focus:border-[#B99558]"
            >
              <option value="TASK">Task / To-Do</option>
              <option value="LEAD_FOLLOW_UP">Lead CRM Follow-Up (Call/Meeting)</option>
              <option value="SITE_VISIT">Client Site Visit</option>
              <option value="REMINDER">System Reminder / Alert</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-[#262421] block mb-1">
              Title / Activity Summary *
            </label>
            <Input
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="e.g. Client Design Discussion with Rohan Verma"
              required
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#262421] block mb-1">
                Date *
              </label>
              <Input
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#262421] block mb-1">
                Time
              </label>
              <ClockTimePicker
                value={newEventTime}
                onChange={(val) => setNewEventTime(val)}
                placeholder="Select time"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-bold text-[#262421] block mb-1">
              Priority
            </label>
            <select
              value={newEventPriority}
              onChange={(e) => setNewEventPriority(e.target.value as any)}
              className="w-full h-9 px-3 text-xs bg-[#FFFEFC] border border-[#E8E2D8] rounded-lg text-[#262421] outline-none focus:border-[#B99558]"
            >
              <option value="LOW">Low Priority</option>
              <option value="NORMAL">Normal Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="URGENT">Urgent Priority</option>
            </select>
          </div>

          {/* Location */}
          {(newEventType === "SITE_VISIT" || newEventType === "LEAD_FOLLOW_UP") && (
            <div>
              <label className="text-xs font-bold text-[#262421] block mb-1">
                Site Location / Meeting Place
              </label>
              <Input
                value={newEventLocation}
                onChange={(e) => setNewEventLocation(e.target.value)}
                placeholder="e.g. Jubilee Hills Site, Flat 402"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-[#262421] block mb-1">
              Notes & Action Details
            </label>
            <textarea
              value={newEventNotes}
              onChange={(e) => setNewEventNotes(e.target.value)}
              placeholder="Enter discussion points, special instructions, or requirements..."
              rows={3}
              className="w-full p-2.5 text-xs bg-[#FFFEFC] border border-[#E8E2D8] rounded-lg text-[#262421] outline-none focus:border-[#B99558]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsScheduleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingEvent}
              className="font-bold text-xs bg-[#302D29] hover:bg-[#201E1B] text-[#FFFEFC]"
            >
              {isSubmittingEvent ? "Scheduling..." : "Save to Calendar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
