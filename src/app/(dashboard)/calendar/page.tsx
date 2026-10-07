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
  FileText,
  Bell,
  CheckSquare,
  X,
  RefreshCw,
  Phone,
  MapPin,
  User,
  PhoneCall,
  ArrowRight,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Link2,
  Building2,
  Tag,
  ChevronRightSquare,
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

  // Selected event for the "Beside" companion panel
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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
        clientCache.set(calendarCacheKey, json, 30000);
      }
    } catch (err) {
      console.error("Error fetching calendar data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, categoryFilter, statusFilter, searchQuery, calendarCacheKey]);

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
    } catch (err) {
      toast.error("Network Error", "Could not connect to calendar server");
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // Category Color and Icon mappings
  const getCategoryStyles = (category: string, sourceType?: string) => {
    switch (category) {
      case "FOLLOW_UPS":
        return {
          bg: "bg-amber-50",
          border: "border-amber-300",
          text: "text-amber-900",
          dot: "bg-amber-500",
          icon: PhoneCall,
          label: "CRM Follow-Up",
        };
      case "SITE_VISITS":
        return {
          bg: "bg-sky-50",
          border: "border-sky-300",
          text: "text-sky-900",
          dot: "bg-sky-500",
          icon: MapPin,
          label: "Site Visit",
        };
      case "TASKS":
        return {
          bg: "bg-indigo-50",
          border: "border-indigo-300",
          text: "text-indigo-900",
          dot: "bg-indigo-500",
          icon: CheckSquare,
          label: "Task / To-Do",
        };
      case "PROJECT_MILESTONES":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-300",
          text: "text-emerald-900",
          dot: "bg-emerald-500",
          icon: Folder,
          label: "Project Milestone",
        };
      case "DELIVERIES":
        return {
          bg: "bg-teal-50",
          border: "border-teal-300",
          text: "text-teal-900",
          dot: "bg-teal-500",
          icon: Truck,
          label: "Material Delivery",
        };
      case "PAYMENTS":
        return {
          bg: "bg-rose-50",
          border: "border-rose-300",
          text: "text-rose-900",
          dot: "bg-rose-500",
          icon: DollarSign,
          label: "Payment Due",
        };
      case "REMINDERS":
        return {
          bg: "bg-purple-50",
          border: "border-purple-300",
          text: "text-purple-900",
          dot: "bg-purple-500",
          icon: Bell,
          label: "Reminder",
        };
      default:
        return {
          bg: "bg-cream",
          border: "border-walnut/20",
          text: "text-charcoal",
          dot: "bg-gold",
          icon: CalendarIcon,
          label: "Event",
        };
    }
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

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean; dateStr: string; eventCount: number; events: CalendarEvent[] }[] = [];

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

    const weekDays: { date: Date; dateStr: string; isToday: boolean; isSelected: boolean; events: CalendarEvent[] }[] = [];
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

  // Filtered Events for MONTH View (Sorted by date)
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

  // Find all related activities for the currently selected event
  const relatedData = useMemo(() => {
    if (!selectedEvent) return { forSameEntity: [], forSameDay: [] };

    // 1. Same client, project, or reference number
    const forSameEntity = events.filter((ev) => {
      if (ev.id === selectedEvent.id) return false;
      const sameRef = selectedEvent.referenceNo && ev.referenceNo && selectedEvent.referenceNo.trim().toUpperCase() === ev.referenceNo.trim().toUpperCase();
      const sameClient = selectedEvent.clientName && ev.clientName && selectedEvent.clientName.trim().toLowerCase() === ev.clientName.trim().toLowerCase();
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1750px] mx-auto min-h-screen bg-[#FAF8F5] text-charcoal">
      {/* 1. TOP HEADER & METRICS SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gold/20 text-gold flex items-center justify-center font-bold">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-charcoal">Operational Calendar</h1>
              <p className="text-xs text-walnut">
                Interactive schedule connecting Follow-ups, Site Visits, Tasks, Milestones, and Deliveries.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCalendarData}
            isLoading={isLoading}
            className="text-xs h-8 text-walnut hover:text-charcoal bg-white"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenScheduleModal()}
            className="text-xs h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> + Schedule Event
          </Button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => {
            setCategoryFilter("ALL");
            handleToday();
          }}
          className="p-3 bg-white rounded-xl border border-walnut/15 shadow-2xs hover:border-gold cursor-pointer transition space-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-walnut uppercase tracking-wider">Today&apos;s Events</span>
            <Clock className="w-3.5 h-3.5 text-gold" />
          </div>
          <div className="text-xl font-black font-mono text-charcoal tabular-nums">
            {kpis.todayAppointments}
          </div>
          <p className="text-[10px] text-walnut/70">Scheduled today</p>
        </div>

        <div
          onClick={() => setCategoryFilter("FOLLOW_UPS")}
          className="p-3 bg-white rounded-xl border border-walnut/15 shadow-2xs hover:border-amber-400 cursor-pointer transition space-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Follow-Ups</span>
            <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-black font-mono text-amber-900 tabular-nums">
            {kpis.pendingFollowUps}
          </div>
          <p className="text-[10px] text-amber-700/80">CRM client calls</p>
        </div>

        <div
          onClick={() => setCategoryFilter("SITE_VISITS")}
          className="p-3 bg-white rounded-xl border border-walnut/15 shadow-2xs hover:border-sky-400 cursor-pointer transition space-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">Site Visits</span>
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-xl font-black font-mono text-sky-900 tabular-nums">
            {kpis.scheduledSiteVisits}
          </div>
          <p className="text-[10px] text-sky-700/80">Site inspections</p>
        </div>

        <div
          onClick={() => setCategoryFilter("TASKS")}
          className="p-3 bg-white rounded-xl border border-walnut/15 shadow-2xs hover:border-indigo-400 cursor-pointer transition space-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Tasks Due</span>
            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-black font-mono text-indigo-900 tabular-nums">
            {kpis.tasksDueToday}
          </div>
          <p className="text-[10px] text-indigo-700/80">Operational tasks</p>
        </div>

        <div
          onClick={() => setCategoryFilter("DELIVERIES")}
          className="p-3 bg-white rounded-xl border border-walnut/15 shadow-2xs hover:border-teal-400 cursor-pointer transition space-y-0.5 col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Deliveries</span>
            <Truck className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-xl font-black font-mono text-teal-900 tabular-nums">
            {kpis.expectedDeliveries}
          </div>
          <p className="text-[10px] text-teal-700/80">Orders arriving</p>
        </div>
      </div>

      {/* 3. SPLIT WORKSPACE: LEFT CALENDAR, MIDDLE EVENTS LIST, RIGHT BESIDE HUB */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: INTERACTIVE MINI CALENDAR & CATEGORY FILTERS                */}
        {/* ========================================================================= */}
        <div className={selectedEvent ? "lg:col-span-3 xl:col-span-3 space-y-5" : "lg:col-span-5 xl:col-span-4 space-y-5"}>
          {/* A. Calendar Interactive Card */}
          <div className="bg-white rounded-2xl border border-walnut/15 shadow-sm p-4 sm:p-5 space-y-4">
            {/* Month Header & Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg text-walnut hover:text-charcoal hover:bg-cream/60 transition"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-xs sm:text-sm font-extrabold text-charcoal font-sans tracking-tight">
                  {monthTitle}
                </h3>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg text-walnut hover:text-charcoal hover:bg-cream/60 transition"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* View Scope Selector: Day / Week / Month */}
              <div className="flex items-center p-0.5 bg-cream/70 rounded-lg border border-walnut/15">
                {[
                  { id: "DAY", label: "Day" },
                  { id: "WEEK", label: "Week" },
                  { id: "MONTH", label: "Month" },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setCalendarView(v.id as any)}
                    className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-bold rounded-md transition ${
                      calendarView === v.id
                        ? "bg-white text-charcoal shadow-2xs border border-walnut/20"
                        : "text-walnut hover:text-charcoal"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-walnut uppercase tracking-wider py-1 border-b border-walnut/10">
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
                    className={`h-9 sm:h-10 rounded-xl relative flex flex-col items-center justify-center transition group ${
                      isSelected
                        ? "bg-emerald-700 text-white font-extrabold shadow-sm"
                        : isToday
                        ? "bg-gold/20 text-gold-dark font-bold border border-gold/40"
                        : isCurrentMonth
                        ? "text-charcoal hover:bg-cream/60"
                        : "text-walnut/30 hover:bg-cream/30"
                    }`}
                  >
                    <span className="text-xs font-mono">{cell.date.getDate()}</span>

                    {/* Dot Indicators */}
                    {hasEvents && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {cell.events.slice(0, 3).map((ev, evIdx) => {
                          const style = getCategoryStyles(ev.category, ev.sourceType);
                          return (
                            <span
                              key={evIdx}
                              className={`w-1 h-1 rounded-full ${
                                isSelected ? "bg-white" : style.dot
                              }`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Date Jumps */}
            <div className="pt-2 border-t border-walnut/10 flex items-center justify-between text-xs">
              <button
                onClick={handleToday}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1"
              >
                ● Today
              </button>

              <button
                onClick={() => {
                  const tm = new Date();
                  tm.setDate(tm.getDate() + 1);
                  handleSelectDay(tm);
                }}
                className="text-[11px] font-semibold text-walnut hover:text-charcoal hover:underline"
              >
                Tomorrow
              </button>

              <button
                onClick={() => setCalendarView("WEEK")}
                className="text-[11px] font-semibold text-walnut hover:text-charcoal hover:underline"
              >
                This Week
              </button>

              <button
                onClick={() => setCalendarView("MONTH")}
                className="text-[11px] font-semibold text-walnut hover:text-charcoal hover:underline"
              >
                This Month
              </button>
            </div>
          </div>

          {/* B. Category Filters & Status Card */}
          <div className="bg-white rounded-2xl border border-walnut/15 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" /> Filter Categories:
              </h4>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-[11px] font-medium bg-cream/40 border border-walnut/20 rounded-md px-2 py-1 text-charcoal outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending / Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            {/* Category Pills List */}
            <div className="space-y-1.5">
              {[
                { id: "ALL", label: "All Categories", count: events.length, dot: "bg-charcoal" },
                {
                  id: "FOLLOW_UPS",
                  label: "CRM Follow-Ups",
                  count: events.filter((e) => e.category === "FOLLOW_UPS").length,
                  dot: "bg-amber-500",
                },
                {
                  id: "SITE_VISITS",
                  label: "Site Visits",
                  count: events.filter((e) => e.category === "SITE_VISITS").length,
                  dot: "bg-sky-500",
                },
                {
                  id: "TASKS",
                  label: "Tasks & To-Dos",
                  count: events.filter((e) => e.category === "TASKS").length,
                  dot: "bg-indigo-500",
                },
                {
                  id: "PROJECT_MILESTONES",
                  label: "Project Milestones",
                  count: events.filter((e) => e.category === "PROJECT_MILESTONES").length,
                  dot: "bg-emerald-500",
                },
                {
                  id: "DELIVERIES",
                  label: "Material Deliveries",
                  count: events.filter((e) => e.category === "DELIVERIES").length,
                  dot: "bg-teal-500",
                },
                {
                  id: "PAYMENTS",
                  label: "Payment Dues",
                  count: events.filter((e) => e.category === "PAYMENTS").length,
                  dot: "bg-rose-500",
                },
              ].map((cat) => {
                const isActive = categoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-50/80 hover:bg-slate-100 text-slate-700 border border-slate-200/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cat.dot}`} />
                      <span>{cat.label}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isActive ? "bg-slate-800 text-slate-200" : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MIDDLE / MAIN COLUMN: EVENTS FEED (DAY / WEEK / MONTH SCOPE)              */}
        {/* ========================================================================= */}
        <div className={selectedEvent ? "lg:col-span-5 xl:col-span-5 space-y-4" : "lg:col-span-7 xl:col-span-8 space-y-4"}>
          {/* Feed Header Card */}
          <div className="bg-white rounded-2xl border border-walnut/15 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {calendarView} VIEW
                </span>
                <h2 className="text-sm sm:text-base font-bold text-charcoal">
                  {calendarView === "DAY" && selectedDayFormatted}
                  {calendarView === "WEEK" && (
                    <>Week of {weekData[0]?.date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – {weekData[6]?.date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</>
                  )}
                  {calendarView === "MONTH" && `${monthTitle} Operational Schedule`}
                </h2>
              </div>
              <p className="text-xs text-walnut mt-0.5">
                {calendarView === "DAY" && `${dayEvents.length} events scheduled for this day`}
                {calendarView === "WEEK" && `${weekEventsCount} total events across 7 days`}
                {calendarView === "MONTH" && `${events.length} total events in ${monthTitle}`}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-walnut/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="pl-8 text-xs bg-slate-50 border-slate-200 h-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VIEW 1: DAY VIEW EVENTS FEED                                             */}
          {/* ========================================================================= */}
          {calendarView === "DAY" && (
            <div className="space-y-3">
              {dayEvents.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-walnut/30 p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-cream/70 text-walnut flex items-center justify-center mx-auto">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-charcoal">No Events Scheduled</h4>
                    <p className="text-xs text-walnut mt-0.5">
                      There are no appointments, tasks, follow-ups, or deliveries set for {selectedDayFormatted}.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenScheduleModal(selectedDayDateStr)}
                    className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Schedule on this Date
                  </Button>
                </div>
              ) : (
                dayEvents.map((ev) => {
                  const style = getCategoryStyles(ev.category, ev.sourceType);
                  const Icon = style.icon;
                  const isItemActive = selectedEvent?.id === ev.id;

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`bg-white rounded-2xl border p-4 shadow-2xs hover:shadow-md transition cursor-pointer space-y-3 relative ${
                        isItemActive
                          ? "border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-50/15"
                          : `${style.border} hover:border-emerald-400`
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${style.bg} ${style.text} border ${style.border}`}
                          >
                            <Icon className="w-3 h-3" />
                            {style.label}
                          </span>

                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {ev.time ? `⏰ ${ev.time}` : "All Day"}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              ev.priority === "URGENT" || ev.priority === "HIGH"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {ev.priority}
                          </span>
                        </div>

                        {isItemActive && (
                          <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>Active Selection</span> ➔
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-charcoal">{ev.title}</h3>
                        {ev.notes && <p className="text-xs text-walnut mt-0.5 line-clamp-2">{ev.notes}</p>}
                      </div>

                      {/* Details & Location Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-walnut/10 text-xs">
                        <div className="flex flex-wrap items-center gap-3 text-walnut">
                          {ev.clientName && (
                            <span className="flex items-center gap-1 font-semibold text-charcoal text-[11px]">
                              <User className="w-3 h-3 text-gold" /> {ev.clientName}
                            </span>
                          )}

                          {ev.clientPhone && (
                            <span className="font-mono text-[11px] text-emerald-700">
                              {ev.clientPhone}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
                          <span>View Details Beside</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: WEEK VIEW EVENTS FEED                                            */}
          {/* ========================================================================= */}
          {calendarView === "WEEK" && (
            <div className="space-y-4">
              {weekData.map((dayCol, idx) => {
                const dayEvs = dayCol.events;
                const isSelected = dayCol.isSelected;
                const isToday = dayCol.isToday;

                return (
                  <div
                    key={idx}
                    className={`bg-white rounded-2xl border transition overflow-hidden shadow-2xs ${
                      isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-500/20"
                        : isToday
                        ? "border-gold"
                        : "border-walnut/15"
                    }`}
                  >
                    {/* Day Group Header */}
                    <div
                      onClick={() => handleSelectDay(dayCol.date)}
                      className={`p-3 border-b border-walnut/10 flex items-center justify-between cursor-pointer transition ${
                        isSelected ? "bg-emerald-50/50" : isToday ? "bg-cream/40" : "bg-[#FAF8F5]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] font-mono ${
                            isSelected
                              ? "bg-emerald-700 text-white"
                              : isToday
                              ? "bg-gold text-white"
                              : "bg-white text-charcoal border border-walnut/20"
                          }`}
                        >
                          {dayCol.date.getDate()}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-charcoal">
                            {dayCol.date.toLocaleDateString("en-IN", {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {isToday && (
                            <span className="ml-2 text-[9px] font-extrabold bg-gold/20 text-gold-dark px-1.5 py-0.5 rounded-full">
                              TODAY
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-walnut">
                        {dayEvs.length} {dayEvs.length === 1 ? "event" : "events"}
                      </span>
                    </div>

                    {/* Day Events Body */}
                    <div className="p-3 space-y-2">
                      {dayEvs.length === 0 ? (
                        <div className="text-xs text-walnut/50 italic py-1 pl-2">
                          No events scheduled for this day.
                        </div>
                      ) : (
                        dayEvs.map((ev) => {
                          const style = getCategoryStyles(ev.category, ev.sourceType);
                          const Icon = style.icon;
                          const isItemActive = selectedEvent?.id === ev.id;

                          return (
                            <div
                              key={ev.id}
                              onClick={() => setSelectedEvent(ev)}
                              className={`p-2.5 rounded-xl border transition cursor-pointer space-y-1 ${
                                isItemActive
                                  ? "border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-50/20"
                                  : `${style.border} ${style.bg} hover:shadow-xs`
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-700">
                                  <Icon className="w-3 h-3 text-slate-600" />
                                  {style.label}
                                </span>
                                {ev.time && (
                                  <span className="text-[10px] font-mono font-bold text-charcoal">
                                    {ev.time}
                                  </span>
                                )}
                              </div>

                              <h4 className="text-xs font-bold text-charcoal">{ev.title}</h4>

                              <div className="flex items-center justify-between text-[10px] text-walnut pt-1 border-t border-walnut/10">
                                <span>{ev.clientName || ev.referenceNo || "General Task"}</span>
                                <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                                  View Beside ➔
                                </span>
                              </div>
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

          {/* ========================================================================= */}
          {/* VIEW 3: MONTH VIEW EVENTS FEED                                           */}
          {/* ========================================================================= */}
          {calendarView === "MONTH" && (
            <div className="space-y-4">
              {monthEventsGrouped.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-walnut/30 p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-cream/70 text-walnut flex items-center justify-center mx-auto">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-charcoal">No Events in {monthTitle}</h4>
                    <p className="text-xs text-walnut mt-0.5">
                      No operational activities recorded matching the current filter.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenScheduleModal()}
                    className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Schedule Event
                  </Button>
                </div>
              ) : (
                monthEventsGrouped.map(([dateStr, group]) => {
                  return (
                    <div
                      key={dateStr}
                      className="bg-white rounded-2xl border border-walnut/15 shadow-2xs overflow-hidden space-y-0"
                    >
                      {/* Date Header Ribbon */}
                      <div
                        onClick={() => handleSelectDay(group.date)}
                        className="p-2.5 bg-[#FAF8F5] border-b border-walnut/10 flex items-center justify-between cursor-pointer hover:bg-cream/40 transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-charcoal font-sans">
                            {group.date.toLocaleDateString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-walnut">
                          {group.events.length} {group.events.length === 1 ? "item" : "items"}
                        </span>
                      </div>

                      {/* Event Cards for Date */}
                      <div className="p-2.5 space-y-2">
                        {group.events.map((ev) => {
                          const style = getCategoryStyles(ev.category, ev.sourceType);
                          const Icon = style.icon;
                          const isItemActive = selectedEvent?.id === ev.id;

                          return (
                            <div
                              key={ev.id}
                              onClick={() => setSelectedEvent(ev)}
                              className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                isItemActive
                                  ? "border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-50/20"
                                  : `${style.border} ${style.bg} hover:shadow-xs`
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-700">
                                    <Icon className="w-3 h-3 text-slate-600" />
                                    {style.label}
                                  </span>
                                  {ev.time && (
                                    <span className="text-[10px] font-mono font-bold text-charcoal">
                                      ⏰ {ev.time}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold text-charcoal">{ev.title}</h4>
                                {ev.clientName && (
                                  <p className="text-[10px] text-walnut flex items-center gap-1">
                                    <User className="w-3 h-3 text-gold" /> {ev.clientName}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                  <span>View Beside</span>
                                  <ArrowRight className="w-3 h-3" />
                                </span>
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
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: "BESIDE" COMPANION PANEL & RELATED ITEMS HUB (COL 4)       */}
        {/* ========================================================================= */}
        {selectedEvent && (
          <div className="lg:col-span-4 xl:col-span-4 space-y-4 sticky top-6 animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Main Details Card */}
            <div className="bg-white rounded-2xl border-2 border-emerald-500/30 shadow-lg p-5 space-y-4">
              {/* Header Ribbon */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-walnut/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {selectedEvent.category.replace(/_/g, " ")}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedEvent.status}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        selectedEvent.priority === "URGENT" || selectedEvent.priority === "HIGH"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {selectedEvent.priority} Priority
                    </span>
                  </div>
                  <h3 className="text-base font-black text-charcoal tracking-tight leading-snug">
                    {selectedEvent.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded-lg text-walnut/60 hover:text-charcoal hover:bg-cream/80 transition"
                  title="Close Side Panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Schedule Info Box */}
              <div className="p-3.5 bg-cream/30 rounded-xl border border-walnut/15 space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">Scheduled Date</span>
                    <strong className="text-charcoal font-mono text-xs flex items-center gap-1 mt-0.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                      {formatDate(selectedEvent.date)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">Scheduled Time</span>
                    <strong className="text-charcoal font-mono text-xs flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      {selectedEvent.time || "All Day Event"}
                    </strong>
                  </div>
                </div>

                {/* Client / Vendor Info */}
                {selectedEvent.clientName && (
                  <div className="pt-2 border-t border-walnut/10">
                    <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">Client / Contact</span>
                    <div className="flex items-center justify-between mt-1">
                      <strong className="text-charcoal font-semibold text-xs flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gold" />
                        {selectedEvent.clientName}
                      </strong>
                      {selectedEvent.referenceNo && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-walnut/20 font-bold text-slate-700">
                          {selectedEvent.referenceNo}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Location */}
                {selectedEvent.location && (
                  <div className="pt-2 border-t border-walnut/10">
                    <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">Location / Address</span>
                    <p className="text-charcoal text-xs flex items-center gap-1.5 mt-0.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                      {selectedEvent.location}
                    </p>
                  </div>
                )}

                {/* Assigned Member */}
                {selectedEvent.assignedToName && (
                  <div className="pt-2 border-t border-walnut/10">
                    <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">Assigned Staff</span>
                    <p className="text-charcoal text-xs flex items-center gap-1 mt-0.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      {selectedEvent.assignedToName}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {selectedEvent.notes && (
                  <div className="pt-2 border-t border-walnut/10">
                    <span className="text-[10px] font-bold text-walnut uppercase tracking-wider block">Notes & Instructions</span>
                    <p className="text-charcoal text-xs mt-0.5 italic bg-white/70 p-2 rounded-lg border border-walnut/10">
                      {selectedEvent.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Communication & Action Bar */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {selectedEvent.clientPhone ? (
                  <>
                    <a
                      href={`tel:${selectedEvent.clientPhone}`}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Call Client</span>
                    </a>
                    <a
                      href={`https://wa.me/${selectedEvent.clientPhone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </>
                ) : (
                  <div className="col-span-2 text-center text-[11px] text-walnut/60 italic">
                    No client phone linked to this record
                  </div>
                )}
              </div>

              {/* Main Workspace CTA Button */}
              <Link href={selectedEvent.actionUrl} className="block">
                <Button
                  variant="primary"
                  className="w-full justify-center text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white gap-2 py-2.5 shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Full Operational Workspace</span>
                </Button>
              </Link>
            </div>

            {/* RELATED ITEMS CARD: ALL LINKED ACTIVITIES FOR THIS ENTITY */}
            <div className="bg-white rounded-2xl border border-walnut/15 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                  Related to this Client / Project ({relatedData.forSameEntity.length})
                </h4>
              </div>

              {relatedData.forSameEntity.length === 0 ? (
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 text-center">
                  <p className="text-xs text-neutral-500">
                    No other upcoming follow-ups or milestones recorded for this client.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {relatedData.forSameEntity.map((relEv) => {
                    const style = getCategoryStyles(relEv.category, relEv.sourceType);
                    const RelIcon = style.icon;

                    return (
                      <div
                        key={relEv.id}
                        onClick={() => setSelectedEvent(relEv)}
                        className={`p-2.5 rounded-xl border ${style.border} ${style.bg} hover:shadow-xs transition cursor-pointer space-y-1`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-700">
                            <RelIcon className="w-3 h-3 text-slate-600" />
                            {style.label}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-charcoal">
                            {formatDate(relEv.date)}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-charcoal line-clamp-1">{relEv.title}</h5>
                        <div className="flex items-center justify-between text-[10px] text-walnut pt-0.5">
                          <span>Status: {relEv.status}</span>
                          <span className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5">
                            Switch to this ➔
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SAME-DAY SCHEDULE TIMELINE */}
            {relatedData.forSameDay.length > 0 && (
              <div className="bg-white rounded-2xl border border-walnut/15 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    Other Events on this Day ({relatedData.forSameDay.length})
                  </h4>
                </div>

                <div className="space-y-2">
                  {relatedData.forSameDay.map((dayEv) => {
                    const style = getCategoryStyles(dayEv.category, dayEv.sourceType);
                    return (
                      <div
                        key={dayEv.id}
                        onClick={() => setSelectedEvent(dayEv)}
                        className="p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 transition cursor-pointer flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="truncate">
                          <span className="font-bold text-charcoal text-[11px] block truncate">{dayEv.title}</span>
                          <span className="text-[10px] text-walnut/70">{dayEv.clientName || dayEv.category}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-600 shrink-0">
                          {dayEv.time || "All Day"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL 2: QUICK SCHEDULE EVENT MODAL                  */}
      {/* ==================================================== */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Operational Appointment / Task"
        maxWidth="md"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4 pt-1">
          {/* Event Type */}
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">
              Event Category *
            </label>
            <select
              value={newEventType}
              onChange={(e) => setNewEventType(e.target.value as any)}
              className="w-full h-9 px-3 text-xs font-semibold bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="TASK">Task / To-Do</option>
              <option value="LEAD_FOLLOW_UP">Lead CRM Follow-Up (Call/Meeting)</option>
              <option value="SITE_VISIT">Client Site Visit</option>
              <option value="REMINDER">System Reminder / Alert</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">
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
              <label className="text-xs font-bold text-charcoal block mb-1">
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
              <label className="text-xs font-bold text-charcoal block mb-1">
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
            <label className="text-xs font-bold text-charcoal block mb-1">
              Priority
            </label>
            <select
              value={newEventPriority}
              onChange={(e) => setNewEventPriority(e.target.value as any)}
              className="w-full h-9 px-3 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="LOW">Low Priority</option>
              <option value="NORMAL">Normal Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="URGENT">Urgent Priority</option>
            </select>
          </div>

          {/* Location (for site visits or meetings) */}
          {(newEventType === "SITE_VISIT" || newEventType === "LEAD_FOLLOW_UP") && (
            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">
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
            <label className="text-xs font-bold text-charcoal block mb-1">
              Notes & Action Details
            </label>
            <textarea
              value={newEventNotes}
              onChange={(e) => setNewEventNotes(e.target.value)}
              placeholder="Enter discussion points, special instructions, or requirements..."
              rows={2}
              className="w-full p-2.5 text-xs bg-white border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

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
              className="font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {isSubmittingEvent ? "Scheduling..." : "Save to Calendar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
