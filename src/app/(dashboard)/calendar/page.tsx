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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

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

  const [calendarView, setCalendarView] = useState<"MONTH" | "WEEK" | "DAY" | "AGENDA">("MONTH");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [kpis, setKpis] = useState<CalendarKPIs>({
    todayAppointments: 0,
    pendingFollowUps: 0,
    scheduledSiteVisits: 0,
    tasksDueToday: 0,
    expectedDeliveries: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Selected Day for the Day Drawer
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [isDayDrawerOpen, setIsDayDrawerOpen] = useState(false);

  // Selected Event for Event Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Quick Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("10:00");
  const [newEventType, setNewEventType] = useState<"TASK" | "LEAD_FOLLOW_UP" | "SITE_VISIT" | "REMINDER">("TASK");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventPriority, setNewEventPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventNotes, setNewEventNotes] = useState("");
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // Fetch events from server API
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // Range for query: 1 month before to 2 months after
      const start = new Date(year, month - 1, 1).toISOString();
      const end = new Date(year, month + 2, 0, 23, 59, 59).toISOString();

      let url = `/api/v1/calendar/events?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
      if (categoryFilter !== "ALL") url += `&category=${categoryFilter}`;
      if (statusFilter !== "ALL") url += `&status=${statusFilter}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setEvents(json.data || []);
        if (json.meta?.kpi) {
          setKpis(json.meta.kpi);
        }
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, categoryFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Navigation handlers
  const handlePrev = () => {
    if (calendarView === "MONTH") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (calendarView === "WEEK") {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const handleNext = () => {
    if (calendarView === "MONTH") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (calendarView === "WEEK") {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open Day Drawer
  const handleDayClick = (dayDate: Date) => {
    setSelectedDayDate(dayDate);
    setIsDayDrawerOpen(true);
  };

  // Open Quick Schedule Modal
  const handleOpenScheduleModal = (dateStr?: string) => {
    const d = dateStr || new Date().toISOString().split("T")[0];
    setNewEventDate(d);
    setNewEventTime("10:00");
    setNewEventType("TASK");
    setNewEventTitle("");
    setNewEventPriority("NORMAL");
    setNewEventLocation("");
    setNewEventNotes("");
    setIsScheduleModalOpen(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      toast.error("Missing Title", "Please enter a title or summary for this event");
      return;
    }

    setIsSubmittingEvent(true);
    try {
      const payload = {
        title: newEventTitle.trim(),
        eventType: newEventType,
        date: newEventDate,
        time: newEventTime || null,
        priority: newEventPriority,
        location: newEventLocation.trim() || null,
        notes: newEventNotes.trim() || null,
      };

      const res = await fetch("/api/v1/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to schedule event");
      }

      toast.success("Event Scheduled", "Operational calendar updated successfully");
      setIsScheduleModalOpen(false);
      fetchEvents();
    } catch (err: any) {
      toast.error("Scheduling Failed", err.message || "Could not schedule event");
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // Category Color and Icon mappings
  const getCategoryStyles = (category: string, sourceType: string) => {
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

  // Month Matrix calculation
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; dateStr: string }[] = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = totalDaysPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      const isToday = d.toDateString() === new Date().toDateString();
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday,
        dateStr: d.toISOString().split("T")[0],
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const isToday = d.toDateString() === new Date().toDateString();
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday,
        dateStr: d.toISOString().split("T")[0],
      });
    }

    // Next month padding to fill grid (42 cells = 6 weeks)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const isToday = d.toDateString() === new Date().toDateString();
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday,
        dateStr: d.toISOString().split("T")[0],
      });
    }

    return days;
  }, [currentDate]);

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

  // Events for the selected day in Day Drawer
  const selectedDayEvents = useMemo(() => {
    if (!selectedDayDate) return [];
    const dStr = selectedDayDate.toISOString().split("T")[0];
    return eventsByDate[dStr] || [];
  }, [selectedDayDate, eventsByDate]);

  // Week View Days calculation
  const weekData = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 = Sun
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const weekDays: { date: Date; dateStr: string; isToday: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDays.push({
        date: d,
        dateStr: d.toISOString().split("T")[0],
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }
    return weekDays;
  }, [currentDate]);

  // Month Title Formatter
  const monthTitle = currentDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#FAF8F5] text-charcoal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold/20 text-gold flex items-center justify-center font-bold">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-charcoal">Operational Calendar</h1>
              <p className="text-xs text-walnut">
                Centralized schedule connecting Lead Follow-ups, Site Visits, Tasks, Milestones, and Material Deliveries.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            disabled={isLoading}
            className="text-xs gap-1.5 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-gold" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenScheduleModal()}
            className="text-xs gap-1.5 shadow-sm font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            + Schedule Event / Task
          </Button>
        </div>
      </div>

      {/* Top 5 Dynamic KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Today's Appointments */}
        <div
          onClick={() => {
            setCurrentDate(new Date());
            setCalendarView("DAY");
          }}
          className="p-4 bg-white rounded-2xl border border-walnut/15 shadow-2xs hover:border-gold/50 cursor-pointer transition space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-walnut uppercase tracking-wider">Today's Schedule</span>
            <div className="w-7 h-7 rounded-lg bg-gold/15 text-gold flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-charcoal tabular-nums">
            {kpis.todayAppointments}
          </div>
          <p className="text-[10px] text-walnut/70">All scheduled items for today</p>
        </div>

        {/* Card 2: Pending Follow-Ups */}
        <div
          onClick={() => {
            setCategoryFilter("FOLLOW_UPS");
            setStatusFilter("PENDING");
          }}
          className="p-4 bg-white rounded-2xl border border-walnut/15 shadow-2xs hover:border-amber-400 cursor-pointer transition space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending Follow-Ups</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-900 tabular-nums">
            {kpis.pendingFollowUps}
          </div>
          <p className="text-[10px] text-amber-700/80">CRM client calls pending</p>
        </div>

        {/* Card 3: Scheduled Site Visits */}
        <div
          onClick={() => {
            setCategoryFilter("SITE_VISITS");
          }}
          className="p-4 bg-white rounded-2xl border border-walnut/15 shadow-2xs hover:border-sky-400 cursor-pointer transition space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Site Visits Today</span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-sky-900 tabular-nums">
            {kpis.scheduledSiteVisits}
          </div>
          <p className="text-[10px] text-sky-700/80">Client property inspections</p>
        </div>

        {/* Card 4: Tasks Due Today */}
        <div
          onClick={() => {
            setCategoryFilter("TASKS");
          }}
          className="p-4 bg-white rounded-2xl border border-walnut/15 shadow-2xs hover:border-indigo-400 cursor-pointer transition space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Tasks Due Today</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-indigo-900 tabular-nums">
            {kpis.tasksDueToday}
          </div>
          <p className="text-[10px] text-indigo-700/80">Operational to-dos</p>
        </div>

        {/* Card 5: Expected Deliveries */}
        <div
          onClick={() => {
            setCategoryFilter("DELIVERIES");
          }}
          className="p-4 bg-white rounded-2xl border border-walnut/15 shadow-2xs hover:border-teal-400 cursor-pointer transition space-y-1 col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Deliveries Today</span>
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-teal-900 tabular-nums">
            {kpis.expectedDeliveries}
          </div>
          <p className="text-[10px] text-teal-700/80">Vendor orders arriving</p>
        </div>
      </div>

      {/* Main Calendar Container */}
      <div className="bg-white rounded-2xl border border-walnut/15 shadow-sm overflow-hidden flex flex-col">
        {/* View Switcher, Date Controls & Search */}
        <div className="p-4 sm:p-5 border-b border-walnut/15 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white">
          {/* Left: Date Nav Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-cream/70 rounded-xl p-1 border border-walnut/15">
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg text-walnut hover:text-charcoal hover:bg-white transition"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-xs font-bold text-charcoal hover:bg-white rounded-lg transition"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-lg text-walnut hover:text-charcoal hover:bg-white transition"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-charcoal font-sans tracking-tight">
              {monthTitle}
            </h2>
          </div>

          {/* Center: Search & Status Filters */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-walnut/60 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client, location, task, or PO..."
                className="pl-8 text-xs bg-cream/30"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2.5 text-xs font-medium bg-cream/30 border border-walnut/20 rounded-lg text-charcoal outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending / Scheduled</option>
              <option value="COMPLETED">Completed / Confirmed</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>

          {/* Right: View Switcher (Month, Week, Day, Agenda) */}
          <div className="flex items-center gap-1 p-1 bg-cream/70 rounded-xl border border-walnut/15 self-start lg:self-auto">
            {[
              { id: "MONTH", label: "Month" },
              { id: "WEEK", label: "Week" },
              { id: "DAY", label: "Day" },
              { id: "AGENDA", label: "Agenda" },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setCalendarView(v.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
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

        {/* Category Pill Filters */}
        <div className="px-4 sm:px-5 py-2.5 bg-[#FCFBF9] border-b border-walnut/10 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[11px] font-bold text-walnut uppercase tracking-wider shrink-0 mr-1">
            Category:
          </span>
          {[
            { id: "ALL", label: `All (${events.length})`, dot: "bg-charcoal" },
            { id: "FOLLOW_UPS", label: "CRM Follow-Ups", dot: "bg-amber-500" },
            { id: "SITE_VISITS", label: "Site Visits", dot: "bg-sky-500" },
            { id: "TASKS", label: "Tasks & To-Dos", dot: "bg-indigo-500" },
            { id: "PROJECT_MILESTONES", label: "Project Milestones", dot: "bg-emerald-500" },
            { id: "DELIVERIES", label: "Material Deliveries", dot: "bg-teal-500" },
            { id: "PAYMENTS", label: "Payment Dues", dot: "bg-rose-500" },
          ].map((cat) => {
            const isActive = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? "bg-charcoal text-white shadow-2xs"
                    : "bg-white text-walnut border border-walnut/20 hover:text-charcoal hover:border-walnut/40"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cat.dot}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ==================================================== */}
        {/* 1. MONTH VIEW */}
        {/* ==================================================== */}
        {calendarView === "MONTH" && (
          <div className="flex-1 flex flex-col">
            {/* Weekday Names Header */}
            <div className="grid grid-cols-7 text-center bg-[#FAF8F5] border-b border-walnut/15 text-[11px] font-bold text-walnut uppercase tracking-wider py-2.5">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* 42 Calendar Cells */}
            <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-walnut/10 bg-white">
              {monthData.map((cell, idx) => {
                const dayEvents = eventsByDate[cell.dateStr] || [];
                const isCurrentMonth = cell.isCurrentMonth;
                const isToday = cell.isToday;

                return (
                  <div
                    key={idx}
                    onClick={() => handleDayClick(cell.date)}
                    className={`min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2 relative flex flex-col justify-between transition group cursor-pointer ${
                      !isCurrentMonth ? "bg-cream/20 text-walnut/40" : "bg-white hover:bg-cream/30"
                    } ${isToday ? "ring-2 ring-gold ring-inset bg-cream/40" : ""}`}
                  >
                    {/* Date Number + Quick Add trigger */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold font-mono inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          isToday
                            ? "bg-gold text-white font-extrabold shadow-2xs"
                            : isCurrentMonth
                            ? "text-charcoal"
                            : "text-walnut/40"
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>

                      {/* Quick Add Button on Hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenScheduleModal(cell.dateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-cream text-walnut hover:text-charcoal transition"
                        title="Add event on this date"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Event Chips List */}
                    <div className="space-y-1 my-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const style = getCategoryStyles(ev.category, ev.sourceType);

                        return (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${style.bg} ${style.border} ${style.text} truncate flex items-center gap-1 hover:shadow-2xs transition`}
                            title={`${ev.title} (${ev.clientName || ev.referenceNo || ""})`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} />
                            <span className="truncate">{ev.title}</span>
                          </div>
                        );
                      })}

                      {dayEvents.length > 3 && (
                        <div className="text-[10px] font-bold text-gold px-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>

                    {/* Bottom Indicator for Events */}
                    <div className="text-[9px] font-mono text-walnut/60 self-end">
                      {dayEvents.length > 0 ? `${dayEvents.length} items` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. WEEK VIEW */}
        {/* ==================================================== */}
        {calendarView === "WEEK" && (
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[800px] grid grid-cols-7 divide-x divide-walnut/15">
              {weekData.map((col, idx) => {
                const dayEvents = eventsByDate[col.dateStr] || [];

                return (
                  <div key={idx} className="min-h-[500px] flex flex-col bg-white">
                    {/* Day Column Header */}
                    <div
                      onClick={() => handleDayClick(col.date)}
                      className={`p-3 border-b border-walnut/15 text-center cursor-pointer hover:bg-cream/40 transition ${
                        col.isToday ? "bg-cream/60" : "bg-[#FAF8F5]"
                      }`}
                    >
                      <div className="text-[10px] font-bold text-walnut uppercase">
                        {col.date.toLocaleDateString("en-IN", { weekday: "short" })}
                      </div>
                      <div
                        className={`text-lg font-black font-mono mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-full ${
                          col.isToday ? "bg-gold text-white" : "text-charcoal"
                        }`}
                      >
                        {col.date.getDate()}
                      </div>
                      <div className="text-[10px] text-walnut/70 mt-0.5">
                        {dayEvents.length} scheduled
                      </div>
                    </div>

                    {/* Column Events List */}
                    <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                      {dayEvents.length === 0 ? (
                        <div className="p-4 text-center text-[11px] text-walnut/50 italic">
                          No events
                        </div>
                      ) : (
                        dayEvents.map((ev) => {
                          const style = getCategoryStyles(ev.category, ev.sourceType);
                          const Icon = style.icon;

                          return (
                            <div
                              key={ev.id}
                              onClick={() => setSelectedEvent(ev)}
                              className={`p-2.5 rounded-xl border ${style.bg} ${style.border} cursor-pointer hover:shadow-sm transition space-y-1`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-walnut flex items-center gap-1">
                                  <Icon className="w-3 h-3" />
                                  {style.label}
                                </span>
                                {ev.time && (
                                  <span className="text-[10px] font-mono font-bold text-charcoal">
                                    {ev.time}
                                  </span>
                                )}
                              </div>
                              <h4 className={`text-xs font-bold ${style.text} line-clamp-2`}>
                                {ev.title}
                              </h4>
                              {ev.clientName && (
                                <p className="text-[11px] text-charcoal/80 flex items-center gap-1">
                                  <User className="w-3 h-3 text-walnut" />
                                  {ev.clientName}
                                </p>
                              )}
                              {ev.location && (
                                <p className="text-[10px] text-walnut flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-gold" />
                                  {ev.location}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. DAY VIEW */}
        {/* ==================================================== */}
        {calendarView === "DAY" && (
          <div className="p-6 space-y-6 flex-1">
            <div className="flex items-center justify-between pb-4 border-b border-walnut/15">
              <div>
                <h3 className="text-lg font-bold text-charcoal">
                  {currentDate.toLocaleDateString("en-IN", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                <p className="text-xs text-walnut">
                  {eventsByDate[currentDate.toISOString().split("T")[0]]?.length || 0} scheduled appointments and operational items on this day.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenScheduleModal(currentDate.toISOString().split("T")[0])}
                className="text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                + Add Appointment
              </Button>
            </div>

            {/* List of items for current day */}
            <div className="space-y-3">
              {(eventsByDate[currentDate.toISOString().split("T")[0]] || []).length === 0 ? (
                <div className="p-16 text-center text-xs text-walnut bg-cream/30 rounded-2xl border border-walnut/15 space-y-3">
                  <CalendarIcon className="w-10 h-10 mx-auto text-gold/60" />
                  <p className="font-semibold text-charcoal">No scheduled items for this date.</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenScheduleModal(currentDate.toISOString().split("T")[0])}
                  >
                    + Schedule Appointment
                  </Button>
                </div>
              ) : (
                (eventsByDate[currentDate.toISOString().split("T")[0]] || []).map((ev) => {
                  const style = getCategoryStyles(ev.category, ev.sourceType);
                  const Icon = style.icon;

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`p-4 rounded-xl border ${style.bg} ${style.border} shadow-2xs hover:shadow-sm cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="neutral" className="text-[10px] uppercase font-bold flex items-center gap-1">
                            <Icon className="w-3 h-3" />
                            {style.label}
                          </Badge>
                          {ev.referenceNo && (
                            <span className="font-mono text-xs font-bold text-charcoal">
                              {ev.referenceNo}
                            </span>
                          )}
                          <Badge
                            variant={
                              ev.priority === "URGENT" || ev.priority === "HIGH"
                                ? "danger"
                                : "pending"
                            }
                            className="text-[10px]"
                          >
                            {ev.priority}
                          </Badge>
                          <Badge
                            variant={
                              ev.status === "COMPLETED" || ev.status === "CONFIRMED"
                                ? "completed"
                                : "neutral"
                            }
                            className="text-[10px]"
                          >
                            {ev.status}
                          </Badge>
                        </div>

                        <h4 className="text-sm font-bold text-charcoal">{ev.title}</h4>

                        <div className="flex items-center gap-4 text-xs text-walnut flex-wrap pt-1">
                          {ev.clientName && (
                            <span className="flex items-center gap-1 font-medium text-charcoal">
                              <User className="w-3.5 h-3.5 text-gold" />
                              {ev.clientName}
                            </span>
                          )}
                          {ev.clientPhone && (
                            <a
                              href={`tel:${ev.clientPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono text-charcoal flex items-center gap-1 hover:text-gold"
                            >
                              <Phone className="w-3.5 h-3.5 text-walnut" />
                              {ev.clientPhone}
                            </a>
                          )}
                          {ev.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-gold" />
                              {ev.location}
                            </span>
                          )}
                        </div>

                        {ev.notes && (
                          <p className="text-xs text-walnut/80 italic pt-1">{ev.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link
                          href={ev.actionUrl}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button size="sm" variant="outline" className="text-xs gap-1">
                            <span>Open Workspace</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 4. AGENDA LIST VIEW */}
        {/* ==================================================== */}
        {calendarView === "AGENDA" && (
          <div className="p-6 space-y-6 flex-1">
            <div className="flex items-center justify-between pb-3 border-b border-walnut/15">
              <div>
                <h3 className="text-base font-bold text-charcoal">Upcoming Operational Agenda</h3>
                <p className="text-xs text-walnut">All upcoming items grouped chronologically.</p>
              </div>
            </div>

            {events.length === 0 ? (
              <div className="p-16 text-center text-xs text-walnut bg-cream/30 rounded-2xl border border-walnut/15">
                No upcoming events matching your search or filters.
              </div>
            ) : (
              <div className="space-y-6">
                {Object.keys(eventsByDate)
                  .sort()
                  .map((dateKey) => {
                    const dayEvList = eventsByDate[dateKey] || [];
                    const dateObj = new Date(dateKey);
                    const isToday = dateObj.toDateString() === new Date().toDateString();

                    return (
                      <div key={dateKey} className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                              isToday
                                ? "bg-gold text-white font-extrabold shadow-2xs"
                                : "bg-cream text-charcoal border border-walnut/20"
                            }`}
                          >
                            {dateObj.toLocaleDateString("en-IN", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[11px] text-walnut font-medium">
                            ({dayEvList.length} items)
                          </span>
                        </div>

                        <div className="space-y-2 pl-2 border-l-2 border-walnut/15">
                          {dayEvList.map((ev) => {
                            const style = getCategoryStyles(ev.category, ev.sourceType);
                            const Icon = style.icon;

                            return (
                              <div
                                key={ev.id}
                                onClick={() => setSelectedEvent(ev)}
                                className={`p-3.5 rounded-xl border ${style.bg} ${style.border} hover:shadow-2xs cursor-pointer transition flex items-center justify-between gap-3`}
                              >
                                <div className="space-y-0.5 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-walnut uppercase flex items-center gap-1">
                                      <Icon className="w-3 h-3" />
                                      {style.label}
                                    </span>
                                    {ev.time && (
                                      <span className="text-[10px] font-mono font-bold text-charcoal">
                                        {ev.time}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-xs font-bold text-charcoal">{ev.title}</h4>
                                  <div className="flex items-center gap-3 text-[11px] text-walnut">
                                    {ev.clientName && <span>Client: <strong>{ev.clientName}</strong></span>}
                                    {ev.location && <span>Location: {ev.location}</span>}
                                  </div>
                                </div>

                                <Link
                                  href={ev.actionUrl}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button size="sm" variant="ghost" className="text-xs p-1.5" title="Open">
                                    <ExternalLink className="w-4 h-4 text-walnut hover:text-charcoal" />
                                  </Button>
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: DAY APPOINTMENTS DRAWER (Clicking any Date) */}
      {/* ==================================================== */}
      <Modal
        isOpen={isDayDrawerOpen}
        onClose={() => setIsDayDrawerOpen(false)}
        title={
          selectedDayDate
            ? `Daily Schedule: ${selectedDayDate.toLocaleDateString("en-IN", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}`
            : "Daily Schedule"
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-walnut">
              {selectedDayEvents.length} item(s) scheduled on this day
            </span>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setIsDayDrawerOpen(false);
                handleOpenScheduleModal(selectedDayDate?.toISOString().split("T")[0]);
              }}
              className="text-xs gap-1"
            >
              <Plus className="w-3 h-3" />
              + Add on this Date
            </Button>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="p-8 text-center text-xs text-walnut bg-cream/30 rounded-xl border border-walnut/15 space-y-2">
              <CalendarIcon className="w-8 h-8 mx-auto text-gold/60" />
              <p>No appointments or tasks scheduled for this date.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {selectedDayEvents.map((ev) => {
                const style = getCategoryStyles(ev.category, ev.sourceType);
                const Icon = style.icon;

                return (
                  <div
                    key={ev.id}
                    className={`p-3.5 rounded-xl border ${style.bg} ${style.border} space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="neutral" className="text-[10px] uppercase font-bold flex items-center gap-1">
                          <Icon className="w-3 h-3" />
                          {style.label}
                        </Badge>
                        <Badge variant="neutral" className="text-[10px]">
                          {ev.status}
                        </Badge>
                      </div>
                      {ev.time && (
                        <span className="font-mono text-xs font-bold text-charcoal">
                          {ev.time}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-charcoal">{ev.title}</h4>

                    {ev.clientName && (
                      <div className="text-xs text-walnut flex items-center gap-3">
                        <span>Customer: <strong className="text-charcoal">{ev.clientName}</strong></span>
                        {ev.clientPhone && (
                          <a
                            href={`tel:${ev.clientPhone}`}
                            className="font-mono text-charcoal hover:text-gold flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-gold" />
                            {ev.clientPhone}
                          </a>
                        )}
                      </div>
                    )}

                    {ev.location && (
                      <div className="text-xs text-walnut flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gold" />
                        <span>{ev.location}</span>
                      </div>
                    )}

                    {ev.notes && (
                      <p className="text-[11px] text-walnut/80 italic">{ev.notes}</p>
                    )}

                    <div className="pt-2 border-t border-walnut/10 flex justify-end">
                      <Link href={ev.actionUrl} onClick={() => setIsDayDrawerOpen(false)}>
                        <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                          <span>Open Section</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 2: EVENT DETAILS MODAL (Clicking any Event) */}
      {/* ==================================================== */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title || "Event Details"}
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="neutral" className="text-xs font-bold uppercase">
                {selectedEvent.category.replace(/_/g, " ")}
              </Badge>
              <Badge variant="pending" className="text-xs">
                {selectedEvent.status}
              </Badge>
              <Badge variant="neutral" className="text-xs font-mono">
                Priority: {selectedEvent.priority}
              </Badge>
            </div>

            <div className="p-4 bg-cream/40 rounded-xl border border-walnut/15 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-walnut/80 block">Scheduled Date</span>
                  <strong className="text-charcoal font-mono">
                    {formatDate(selectedEvent.date)}
                  </strong>
                </div>
                <div>
                  <span className="text-walnut/80 block">Scheduled Time</span>
                  <strong className="text-charcoal font-mono">
                    {selectedEvent.time || "All Day"}
                  </strong>
                </div>
              </div>

              {selectedEvent.clientName && (
                <div className="pt-2 border-t border-walnut/10 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-walnut/80 block">Client / Vendor</span>
                    <strong className="text-charcoal font-semibold">
                      {selectedEvent.clientName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-walnut/80 block">Phone Number</span>
                    {selectedEvent.clientPhone ? (
                      <a
                        href={`tel:${selectedEvent.clientPhone}`}
                        className="text-charcoal font-mono font-bold hover:text-gold flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5 text-gold" />
                        {selectedEvent.clientPhone}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
              )}

              {selectedEvent.location && (
                <div className="pt-2 border-t border-walnut/10">
                  <span className="text-walnut/80 block">Location / Site Address</span>
                  <p className="text-charcoal font-medium flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                    {selectedEvent.location}
                  </p>
                </div>
              )}

              {selectedEvent.notes && (
                <div className="pt-2 border-t border-walnut/10">
                  <span className="text-walnut/80 block">Notes & Details</span>
                  <p className="text-charcoal mt-0.5 italic">{selectedEvent.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEvent(null)}
                className="text-xs"
              >
                Close
              </Button>

              <Link href={selectedEvent.actionUrl} onClick={() => setSelectedEvent(null)}>
                <Button variant="primary" size="sm" className="text-xs gap-1.5 font-bold">
                  <span>Open Operational Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* ==================================================== */}
      {/* MODAL 3: QUICK SCHEDULE EVENT MODAL */}
      {/* ==================================================== */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Operational Appointment / Task"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
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
              <Input
                type="time"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
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
              className="font-bold text-xs"
            >
              {isSubmittingEvent ? "Scheduling..." : "Save to Calendar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

