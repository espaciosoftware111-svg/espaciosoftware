"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  DashboardSummaryResponse,
  DashboardPeriod,
  FollowUpItem,
} from "@/modules/dashboard/dashboard.types";
import { formatCurrency, formatRelativeTime, formatDate } from "@/lib/utils";
import {
  FolderKanban,
  Users,
  Wallet,
  Receipt,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Bell,
  Calendar,
  FileText,
  Building2,
  ShoppingCart,
  PieChart,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  PhoneCall,
  Coins,
  Package,
  AlertCircle,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  Plus,
  FolderPlus,
  CreditCard,
  FilePlus,
  MoreHorizontal,
  Compass,
} from "lucide-react";

import { PendingApprovalsCard } from "@/components/dashboard/pending-approvals-card";
import { PendingApprovalsData } from "@/modules/approvals/approvals.service";

interface DashboardClientProps {
  initialData: DashboardSummaryResponse;
  initialApprovals?: PendingApprovalsData;
  user?: {
    id: string;
    email: string;
    fullName: string;
    accessLevel: string;
  };
}

export function DashboardClient({ initialData, initialApprovals, user }: DashboardClientProps) {
  const router = useRouter();
  const [data, setData] = useState<DashboardSummaryResponse>(initialData);
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>(initialData.period || "THIS_MONTH");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Follow-up interaction modal states
  const [completingItem, setCompletingItem] = useState<FollowUpItem | null>(null);
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [reschedulingItem, setReschedulingItem] = useState<FollowUpItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Active chart hover item
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);

  // Dynamic greeting based on exact local time of day
  const resolveGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return "Good Morning, ESPACIO";
    if (hour >= 12 && hour < 17) return "Good Afternoon, ESPACIO";
    return "Good Evening, ESPACIO"; // Evening (5 PM - 11:59 PM) and Night (12 AM - 3:59 AM)
  };

  const [greeting, setGreeting] = useState<string>(resolveGreeting);

  useEffect(() => {
    setGreeting(resolveGreeting());
    const timer = setInterval(() => {
      setGreeting(resolveGreeting());
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  // Fetch updated data from Dashboard API
  const fetchDashboardData = async (period: DashboardPeriod, sDate?: string, eDate?: string) => {
    setIsRefreshing(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("period", period);
      if (sDate) params.set("startDate", sDate);
      if (eDate) params.set("endDate", eDate);

      const res = await fetch(`/api/v1/dashboard/summary?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load dashboard data");
      }

      setData(json.data);
      setSelectedPeriod(period);
    } catch (err: any) {
      setError(err.message || "Unable to refresh dashboard data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePeriodChange = (period: DashboardPeriod) => {
    setSelectedPeriod(period);
    if (period === "CUSTOM") {
      setShowCustomModal(true);
      return;
    }
    startTransition(() => {
      fetchDashboardData(period);
    });
  };

  const closeCustomModal = () => {
    setShowCustomModal(false);
    if (selectedPeriod === "CUSTOM" && data.period !== "CUSTOM") {
      setSelectedPeriod(data.period || "THIS_MONTH");
    }
  };

  const applyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    setShowCustomModal(false);
    startTransition(() => {
      fetchDashboardData("CUSTOM", customStart, customEnd);
    });
  };

  const handleManualRefresh = () => {
    startTransition(() => {
      if (selectedPeriod === "CUSTOM") {
        fetchDashboardData("CUSTOM", customStart, customEnd);
      } else {
        fetchDashboardData(selectedPeriod);
      }
      router.refresh();
    });
  };

  // Real-time auto-sync: Automatically revalidate on window focus and every 15s when active
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        if (selectedPeriod === "CUSTOM") {
          fetchDashboardData("CUSTOM", customStart, customEnd);
        } else {
          fetchDashboardData(selectedPeriod);
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        if (selectedPeriod === "CUSTOM") {
          fetchDashboardData("CUSTOM", customStart, customEnd);
        } else {
          fetchDashboardData(selectedPeriod);
        }
      }
    }, 15000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      clearInterval(interval);
    };
  }, [selectedPeriod, customStart, customEnd]);

  // Follow-up Action Submissions
  const handleCompleteFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingItem) return;

    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/v1/dashboard/follow-ups/${completingItem.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          type: completingItem.type,
          outcomeNotes: outcomeNotes || "Completed via Command Center",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to complete follow-up");
      }

      setSuccessToast(`Follow-up "${completingItem.title}" marked as complete.`);
      setTimeout(() => setSuccessToast(null), 4000);
      setCompletingItem(null);
      setOutcomeNotes("");
      await fetchDashboardData(selectedPeriod, customStart, customEnd);
    } catch (err: any) {
      setError(err.message || "Failed to complete follow-up");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleRescheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingItem || !rescheduleDate) return;

    setIsSubmittingAction(true);
    try {
      const res = await fetch(`/api/v1/dashboard/follow-ups/${reschedulingItem.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          type: reschedulingItem.type,
          newDate: rescheduleDate,
          notes: rescheduleNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to reschedule follow-up");
      }

      setSuccessToast(`Follow-up rescheduled to ${new Date(rescheduleDate).toLocaleDateString("en-IN")}.`);
      setTimeout(() => setSuccessToast(null), 4000);
      setReschedulingItem(null);
      setRescheduleDate("");
      setRescheduleNotes("");
      await fetchDashboardData(selectedPeriod, customStart, customEnd);
    } catch (err: any) {
      setError(err.message || "Failed to reschedule follow-up");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Helper to format activity titles nicely
  const formatActivityText = (act: any) => {
    if (act.title) return act.title;
    if (act.action === "PROJECT_COMPLETED" || act.action === "HANDOVER") {
      return "Project handed over to client";
    }
    if (act.action === "EXPENSE_CREATED" || act.entityType === "EXPENSE") {
      return "Expense recorded";
    }
    if (act.action === "PAYMENT_RECEIVED" || act.entityType === "PAYMENT") {
      return "Payment received";
    }
    if (act.action === "LEAD_CREATED" || act.entityType === "LEAD") {
      return "New lead added";
    }
    return `${act.action} on ${act.entityType || "record"}`;
  };

  // Helper to choose outline icon for activity
  const renderActivityIcon = (act: any) => {
    const text = (act.title || act.action || act.entityType || "").toLowerCase();
    if (text.includes("project") || text.includes("handover")) {
      return <Compass className="w-3.5 h-3.5 text-[#77736C]" />;
    }
    if (text.includes("expense")) {
      return <Receipt className="w-3.5 h-3.5 text-[#77736C]" />;
    }
    if (text.includes("payment") || text.includes("receivable")) {
      return <CreditCard className="w-3.5 h-3.5 text-[#77736C]" />;
    }
    if (text.includes("lead")) {
      return <Users className="w-3.5 h-3.5 text-[#77736C]" />;
    }
    return <Clock className="w-3.5 h-3.5 text-[#77736C]" />;
  };

  // Calculations for Project Status Donut Chart
  const inExecutionProjects = data.kpis.activeProjects || 0;
  const completedProjects = data.kpis.completedProjects || 0;
  const delayedProjects = data.kpis.delayedProjects || 0;
  const onHoldProjects = 0; // standard bucket
  const totalProjects = Math.max(1, inExecutionProjects + completedProjects + delayedProjects + onHoldProjects);

  // Donut SVG circumference calculation
  const donutRadius = 38;
  const donutCircumference = 2 * Math.PI * donutRadius;
  
  // Segment lengths
  const completedPct = completedProjects / totalProjects;
  const inExecutionPct = inExecutionProjects / totalProjects;
  const delayedPct = delayedProjects / totalProjects;
  const onHoldPct = onHoldProjects / totalProjects;

  const completedDash = completedPct * donutCircumference;
  const inExecutionDash = inExecutionPct * donutCircumference;
  const delayedDash = delayedPct * donutCircumference;

  // Financial Trend curve points calculation
  const trendPoints = data.financialTrend || [];
  const maxTrend = Math.max(
    ...(trendPoints.map((t) => Math.max(t.revenue, t.expense)) || [10000]),
    10000
  );

  return (
    <div className="space-y-6 w-full min-w-0 pb-16 select-none font-sans text-[#242321]">
      {/* 1. TOP HERO SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        {/* Left: Greeting & Status */}
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#242321]" suppressHydrationWarning>
            {greeting}
          </h1>
          <p className="text-xs sm:text-sm text-[#77736C]">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>

        {/* Right: Editorial Quote Banner Card */}
        <div className="relative flex items-center justify-between bg-[#F5F2EC] border border-[#EAE5DD] rounded-xl overflow-hidden shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] h-22 sm:h-24 w-full lg:w-[380px] shrink-0">
          <div className="p-4 sm:p-5 flex flex-col justify-center min-w-0 z-10 flex-1">
            <p className="font-serif italic text-sm sm:text-base text-[#242321] leading-tight tracking-wide">
              &ldquo;Turning spaces
              <br />
              into experiences&rdquo;
            </p>
            <div className="w-6 h-0.5 bg-[#B99558] mt-2 rounded-full" />
          </div>
          <div className="relative w-36 sm:w-44 h-full shrink-0 overflow-hidden">
            <Image
              src="/images/architectural-banner.jpg"
              alt="Architectural Interior"
              fill
              className="object-cover object-center"
              priority
            />
            {/* Soft subtle gradient blend from left */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#F5F2EC] via-[#F5F2EC]/30 to-transparent" />
          </div>
        </div>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="p-3 bg-[#FFFEFC] border border-[#B99558]/50 rounded-lg flex items-center justify-between text-xs text-[#242321] font-semibold min-w-0 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2 truncate">
            <CheckCircle2 className="w-4 h-4 text-[#8C7355] shrink-0" />
            <span className="truncate">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-[#77736C] hover:text-[#242321] cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Banner with Retry */}
      {error && (
        <div className="p-3 bg-[#FFFEFC] border border-[#B8594D]/50 rounded-lg flex items-center justify-between text-xs text-[#B8594D] font-semibold min-w-0">
          <div className="flex items-center gap-2 truncate">
            <AlertCircle className="w-4 h-4 text-[#B8594D] shrink-0" />
            <span className="truncate">{error}</span>
          </div>
          <button
            onClick={() => fetchDashboardData(selectedPeriod)}
            className="px-2 py-1 bg-[#F5F2EC] text-[#242321] border border-[#EAE5DD] rounded text-xs hover:bg-[#EEE5D6]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Admin Pending Approvals Command Center */}
      {user?.accessLevel === "ADMIN" && (
        <PendingApprovalsCard
          initialData={initialApprovals}
          onActionComplete={handleManualRefresh}
        />
      )}

      {/* 2. HORIZONTAL QUICK ACTIONS ROW (7 Tiles in 1 Row) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 w-full">
        {/* 1. New Lead */}
        <Link
          href="/leads"
          className="group p-3.5 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] hover:border-[#B99558]/60 hover:shadow-[0_4px_12px_0_rgba(36,35,33,0.05)] transition-all flex flex-col items-center justify-center gap-2 text-center"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#242321] group-hover:bg-[#EEE5D6] group-hover:border-[#B99558]/40 transition-colors">
            <Plus className="w-4 h-4 text-[#242321]" />
          </div>
          <span className="text-xs font-semibold text-[#242321] tracking-tight">New Lead</span>
        </Link>

        {/* 2. New Project */}
        <Link
          href="/projects"
          className="group p-3.5 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] hover:border-[#B99558]/60 hover:shadow-[0_4px_12px_0_rgba(36,35,33,0.05)] transition-all flex flex-col items-center justify-center gap-2 text-center"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#242321] group-hover:bg-[#EEE5D6] group-hover:border-[#B99558]/40 transition-colors">
            <FolderPlus className="w-4 h-4 text-[#242321]" />
          </div>
          <span className="text-xs font-semibold text-[#242321] tracking-tight">New Project</span>
        </Link>

        {/* 3. Record Payment */}
        <Link
          href="/finance/payments"
          className="group p-3.5 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] hover:border-[#B99558]/60 hover:shadow-[0_4px_12px_0_rgba(36,35,33,0.05)] transition-all flex flex-col items-center justify-center gap-2 text-center"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#242321] group-hover:bg-[#EEE5D6] group-hover:border-[#B99558]/40 transition-colors">
            <CreditCard className="w-4 h-4 text-[#242321]" />
          </div>
          <span className="text-xs font-semibold text-[#242321] tracking-tight">Record Payment</span>
        </Link>

        {/* 4. Add Expense */}
        <Link
          href="/finance/expenses"
          className="group p-3.5 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] hover:border-[#B99558]/60 hover:shadow-[0_4px_12px_0_rgba(36,35,33,0.05)] transition-all flex flex-col items-center justify-center gap-2 text-center"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#242321] group-hover:bg-[#EEE5D6] group-hover:border-[#B99558]/40 transition-colors">
            <Receipt className="w-4 h-4 text-[#242321]" />
          </div>
          <span className="text-xs font-semibold text-[#242321] tracking-tight">Add Expense</span>
        </Link>

        {/* 5. New Quotation */}
        <Link
          href="/quotations"
          className="group p-3.5 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] hover:border-[#B99558]/60 hover:shadow-[0_4px_12px_0_rgba(36,35,33,0.05)] transition-all flex flex-col items-center justify-center gap-2 text-center"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#242321] group-hover:bg-[#EEE5D6] group-hover:border-[#B99558]/40 transition-colors">
            <FilePlus className="w-4 h-4 text-[#242321]" />
          </div>
          <span className="text-xs font-semibold text-[#242321] tracking-tight">New Quotation</span>
        </Link>

        {/* 6. Vendors */}
        <Link
          href="/procurement/vendors"
          className="group p-3.5 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] hover:border-[#B99558]/60 hover:shadow-[0_4px_12px_0_rgba(36,35,33,0.05)] transition-all flex flex-col items-center justify-center gap-2 text-center"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#242321] group-hover:bg-[#EEE5D6] group-hover:border-[#B99558]/40 transition-colors">
            <Users className="w-4 h-4 text-[#242321]" />
          </div>
          <span className="text-xs font-semibold text-[#242321] tracking-tight">Vendors</span>
        </Link>

        {/* 7. More */}
        <Link
          href="/reports"
          className="group p-3.5 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] hover:border-[#B99558]/60 hover:shadow-[0_4px_12px_0_rgba(36,35,33,0.05)] transition-all flex flex-col items-center justify-center gap-2 text-center"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#242321] group-hover:bg-[#EEE5D6] group-hover:border-[#B99558]/40 transition-colors">
            <MoreHorizontal className="w-4 h-4 text-[#242321]" />
          </div>
          <span className="text-xs font-semibold text-[#242321] tracking-tight">More</span>
        </Link>
      </div>

      {/* 3. ROW OF 5 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 w-full">
        {/* 1. Total Leads */}
        <Link
          href="/leads"
          className="p-4 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] hover:border-[#B99558]/60 transition-all block group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C] shrink-0 group-hover:bg-[#EEE5D6] transition-colors">
              <Users className="w-4 h-4 text-[#77736C]" />
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#77736C] truncate">
              Total Leads
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#242321] tabular-nums">
              {data.kpis.totalLeads}
            </span>
            <span className="text-[11px] font-mono text-[#8C7355] font-semibold">
              ↗ 5%
            </span>
          </div>
          <p className="text-[11px] text-[#77736C] mt-0.5 truncate">
            CRM Opportunities
          </p>
        </Link>

        {/* 2. Active Projects */}
        <Link
          href="/projects?status=ACTIVE"
          className="p-4 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] hover:border-[#B99558]/60 transition-all block group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C] shrink-0 group-hover:bg-[#EEE5D6] transition-colors">
              <FolderKanban className="w-4 h-4 text-[#77736C]" />
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#77736C] truncate">
              Active Projects
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#242321] tabular-nums">
              {data.kpis.activeProjects}
            </span>
            <span className="text-[11px] font-mono text-[#8C7355] font-semibold">
              ↗ 5%
            </span>
          </div>
          <p className="text-[11px] text-[#77736C] mt-0.5 truncate">
            In Execution Pipeline
          </p>
        </Link>

        {/* 3. Completed Projects */}
        <Link
          href="/projects?stage=PROJECT_COMPLETED"
          className="p-4 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] hover:border-[#B99558]/60 transition-all block group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C] shrink-0 group-hover:bg-[#EEE5D6] transition-colors">
              <CheckCircle2 className="w-4 h-4 text-[#77736C]" />
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#77736C] truncate">
              Completed Projects
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#242321] tabular-nums">
              {data.kpis.completedProjects}
            </span>
          </div>
          <p className="text-[11px] text-[#77736C] mt-0.5 truncate">
            Handed Over to Client
          </p>
        </Link>

        {/* 4. Delayed Projects */}
        <Link
          href="/projects?delayHealth=DELAYED"
          className="p-4 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] hover:border-[#B99558]/60 transition-all block group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C] shrink-0 group-hover:bg-[#EEE5D6] transition-colors">
              <Clock className="w-4 h-4 text-[#77736C]" />
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#77736C] truncate">
              Delayed Projects
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#242321] tabular-nums">
              {data.kpis.delayedProjects}
            </span>
          </div>
          <p className="text-[11px] text-[#77736C] mt-0.5 truncate">
            {data.kpis.delayedProjects > 0 ? "Requires Attention" : "100% On Schedule"}
          </p>
        </Link>

        {/* 5. Pending Receivables */}
        <Link
          href="/finance/receivables"
          className="p-4 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] hover:border-[#B99558]/60 transition-all block group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C] shrink-0 group-hover:bg-[#EEE5D6] transition-colors">
              <Wallet className="w-4 h-4 text-[#77736C]" />
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#77736C] truncate">
              Pending Receivables
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#242321] tabular-nums">
              {formatCurrency(data.kpis.pendingClientPayments)}
            </span>
          </div>
          <p className="text-[11px] text-[#77736C] mt-0.5 truncate">
            Client Balance Due
          </p>
        </Link>
      </div>

      {/* 4. FINANCIAL OVERVIEW (LEFT) + PROJECT STATUS & TODAY'S FOLLOW-UPS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Financial Overview Card (7 Cols) */}
        <div className="lg:col-span-7 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] p-5 sm:p-6 space-y-6">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#242321]">Financial Overview</h2>
              <p className="text-xs text-[#77736C] mt-0.5">
                Revenue, expenses and profit for {data.periodLabel}
              </p>
            </div>

            {/* Period Selector Dropdown Pill */}
            <div className="relative inline-flex items-center bg-[#F5F2EC] border border-[#EAE5DD] rounded-lg px-3 py-1.5 shadow-2xs hover:border-[#B99558]/60 transition-colors">
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value as DashboardPeriod)}
                className="bg-transparent text-xs font-semibold text-[#242321] focus:outline-none cursor-pointer pr-5 appearance-none"
              >
                <option value="THIS_MONTH">This Month</option>
                <option value="TODAY">Today</option>
                <option value="THIS_WEEK">This Week</option>
                <option value="LAST_MONTH">Last Month</option>
                <option value="THIS_QUARTER">This Quarter</option>
                <option value="THIS_YEAR">This Year</option>
                <option value="OVERALL">Overall (All Time)</option>
                <option value="CUSTOM">Custom Range...</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#77736C] absolute right-2 pointer-events-none" />
            </div>
          </div>

          {/* 3 Metric Tiles Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Revenue */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C] shrink-0">
                <Users className="w-4 h-4 text-[#77736C]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-medium text-[#77736C] block">Revenue</span>
                <span className="text-lg font-bold font-mono text-[#242321] tabular-nums block truncate">
                  {formatCurrency(data.financialSummary?.revenue || 0)}
                </span>
                <span className="text-[11px] text-[#77736C] block">Verified Inflow</span>
              </div>
            </div>

            {/* Expenses */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C] shrink-0">
                <Receipt className="w-4 h-4 text-[#77736C]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-medium text-[#77736C] block">Expenses</span>
                <span className="text-lg font-bold font-mono text-[#242321] tabular-nums block truncate">
                  {formatCurrency(data.financialSummary?.expenses || 0)}
                </span>
                <span className="text-[11px] text-[#77736C] block">Approved Outflow</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C] shrink-0">
                <TrendingUp className="w-4 h-4 text-[#77736C]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-medium text-[#77736C] block">Net Profit</span>
                <span className="text-lg font-bold font-mono text-[#242321] tabular-nums block truncate">
                  {formatCurrency(data.financialSummary?.profit || 0)}
                </span>
                <span className="text-[11px] text-[#8C7355] font-semibold block">
                  {data.financialSummary?.profitMarginPct !== null
                    ? `${data.financialSummary?.profitMarginPct}% Margin`
                    : "0.0% Margin"}
                </span>
              </div>
            </div>
          </div>

          {/* Dual Line SVG Curve Chart */}
          <div className="pt-4 border-t border-[#EAE5DD] space-y-3">
            <div className="relative h-48 w-full">
              {/* Y-Axis Grid Lines and Labels */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-[#77736C]">
                <div className="flex items-center gap-2">
                  <span className="w-10 text-right">₹10K</span>
                  <div className="flex-1 h-px bg-[#EAE5DD]" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-10 text-right">₹7.5K</span>
                  <div className="flex-1 h-px bg-[#EAE5DD]" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-10 text-right">₹5K</span>
                  <div className="flex-1 h-px bg-[#EAE5DD]" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-10 text-right">₹2.5K</span>
                  <div className="flex-1 h-px bg-[#EAE5DD]" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-10 text-right">0</span>
                  <div className="flex-1 h-px bg-[#EAE5DD]" />
                </div>
              </div>

              {/* Smooth Spline SVG overlay */}
              <div className="absolute left-12 right-2 top-2 bottom-6">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 130" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#B99558" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#B99558" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Revenue Curve Fill */}
                  <path
                    d="M 0,110 C 60,80 80,40 120,65 C 160,90 200,70 240,55 C 280,40 320,45 360,35 C 400,25 450,10 500,10 L 500,125 L 0,125 Z"
                    fill="url(#revenueGrad)"
                  />

                  {/* Expense Line: Warm Taupe */}
                  <path
                    d="M 0,118 C 60,110 80,95 120,100 C 160,105 200,90 240,85 C 280,80 320,85 360,75 C 400,65 450,60 500,55"
                    fill="none"
                    stroke="#C5B49F"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Revenue Line: Soft Gold */}
                  <path
                    d="M 0,110 C 60,80 80,40 120,65 C 160,90 200,70 240,55 C 280,40 320,45 360,35 C 400,25 450,10 500,10"
                    fill="none"
                    stroke="#B99558"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  {/* Data Point Dots on Revenue Line */}
                  <circle cx="0" cy="110" r="2.5" fill="#B99558" />
                  <circle cx="120" cy="65" r="2.5" fill="#B99558" />
                  <circle cx="240" cy="55" r="2.5" fill="#B99558" />
                  <circle cx="360" cy="35" r="2.5" fill="#B99558" />
                  <circle cx="500" cy="10" r="3" fill="#B99558" />
                </svg>
              </div>

              {/* X-Axis Date Labels */}
              <div className="absolute left-12 right-2 bottom-0 flex justify-between text-[10px] font-mono text-[#77736C]">
                <span>1 Oct</span>
                <span>5 Oct</span>
                <span>10 Oct</span>
                <span>15 Oct</span>
                <span>20 Oct</span>
                <span>25 Oct</span>
                <span>31 Oct</span>
              </div>
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-center gap-6 text-xs text-[#77736C] pt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B99558]" />
                <span className="text-[#242321] font-medium">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C5B49F]" />
                <span className="text-[#242321] font-medium">Expenses</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Project Status (Top) + Today's Follow-ups (Bottom) (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Project Status Card */}
          <div className="bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#242321]">Project Status</h2>
              <div className="relative inline-flex items-center bg-[#F5F2EC] border border-[#EAE5DD] rounded-lg px-2.5 py-1 text-xs text-[#242321] font-semibold">
                <span>All Projects</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#77736C] ml-1.5" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              {/* Donut Chart with Center Count */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r={donutRadius}
                    fill="transparent"
                    stroke="#F5F2EC"
                    strokeWidth="11"
                  />
                  {/* Completed / Active Segments */}
                  <circle
                    cx="50"
                    cy="50"
                    r={donutRadius}
                    fill="transparent"
                    stroke="#A18D70"
                    strokeWidth="11"
                    strokeDasharray={`${completedDash} ${donutCircumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  {inExecutionDash > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#B99558"
                      strokeWidth="11"
                      strokeDasharray={`${inExecutionDash} ${donutCircumference}`}
                      strokeDashoffset={-completedDash}
                      strokeLinecap="round"
                    />
                  )}
                </svg>

                {/* Center Number & Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-2xl font-bold font-mono text-[#242321] leading-none">
                    {data.kpis.activeProjects + data.kpis.completedProjects + data.kpis.delayedProjects || 1}
                  </span>
                  <span className="text-[10.5px] text-[#77736C] font-medium mt-0.5">Total</span>
                </div>
              </div>

              {/* Status Legend List */}
              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#B99558]" />
                    <span className="text-[#77736C] font-medium">In Execution</span>
                  </div>
                  <span className="font-mono font-bold text-[#242321]">{data.kpis.activeProjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#A18D70]" />
                    <span className="text-[#77736C] font-medium">Completed</span>
                  </div>
                  <span className="font-mono font-bold text-[#242321]">{data.kpis.completedProjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#B8594D]" />
                    <span className="text-[#77736C] font-medium">Delayed</span>
                  </div>
                  <span className="font-mono font-bold text-[#242321]">{data.kpis.delayedProjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D1C7B8]" />
                    <span className="text-[#77736C] font-medium">On Hold</span>
                  </div>
                  <span className="font-mono font-bold text-[#242321]">0</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Today's Follow-ups Card */}
          <div className="bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#242321]">Today&apos;s Follow-ups</h2>
              <Link href="/leads" className="text-xs font-semibold text-[#77736C] hover:text-[#242321] transition-colors">
                View All
              </Link>
            </div>

            {data.followUps.items.length === 0 ? (
              <div className="p-4 bg-[#F8F6F1] border border-[#EAE5DD] rounded-xl flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#FFFEFC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C] shrink-0">
                  <Plus className="w-4 h-4 text-[#77736C]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#242321]">No follow-ups for today</p>
                  <p className="text-[11px] text-[#77736C]">All client tasks are up to date.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {data.followUps.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#F8F6F1] border border-[#EAE5DD] rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#242321] truncate">{item.clientOrLeadName}</span>
                        <span className="text-[10px] font-mono text-[#77736C]">({item.referenceNo})</span>
                      </div>
                      <p className="text-[11px] text-[#77736C] truncate mt-0.5">{item.title}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setCompletingItem(item)}
                        className="px-2 py-1 bg-[#FFFEFC] hover:bg-[#EEE5D6] border border-[#EAE5DD] rounded text-[11px] font-semibold text-[#242321] transition-colors"
                        title="Mark Completed"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => {
                          setReschedulingItem(item);
                          setRescheduleDate(new Date().toISOString().split("T")[0]);
                        }}
                        className="px-2 py-1 bg-[#FFFEFC] hover:bg-[#EEE5D6] border border-[#EAE5DD] rounded text-[11px] font-semibold text-[#77736C] transition-colors"
                        title="Reschedule"
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. BOTTOM ROW: RECENT LEADS (LEFT 50%) & RECENT ACTIVITIES (RIGHT 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT: Recent Leads */}
        <div className="bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#242321]">Recent Leads</h2>
            <Link href="/leads" className="text-xs font-semibold text-[#77736C] hover:text-[#242321] transition-colors">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EAE5DD] text-[10.5px] font-bold uppercase tracking-wider text-[#77736C]">
                  <th className="pb-2.5 font-bold">NAME</th>
                  <th className="pb-2.5 font-bold">SOURCE</th>
                  <th className="pb-2.5 font-bold">STATUS</th>
                  <th className="pb-2.5 font-bold">CREATED ON</th>
                  <th className="pb-2.5 text-right font-bold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DD]/70">
                {data.recentLeads && data.recentLeads.length > 0 ? (
                  data.recentLeads.slice(0, 5).map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#F8F6F1]/70 transition-colors">
                      <td className="py-3 font-semibold text-[#242321] max-w-[140px] truncate">
                        <Link href={lead.actionUrl} className="hover:underline">
                          {lead.name}
                        </Link>
                      </td>
                      <td className="py-3 text-[#77736C] font-normal">{lead.source}</td>
                      <td className="py-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#F5F2EC] text-[#242321] border border-[#EAE5DD]">
                          {lead.status === "NEW" ? "New" : lead.status}
                        </span>
                      </td>
                      <td className="py-3 text-[#77736C] font-mono text-[11px]" suppressHydrationWarning>
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={lead.actionUrl}
                          className="p-1 text-[#77736C] hover:text-[#242321] rounded inline-block"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr className="hover:bg-[#F8F6F1]/70 transition-colors">
                      <td className="py-3 font-semibold text-[#242321]">CRM Opportunities</td>
                      <td className="py-3 text-[#77736C]">Manual</td>
                      <td className="py-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#F5F2EC] text-[#242321] border border-[#EAE5DD]">
                          New
                        </span>
                      </td>
                      <td className="py-3 text-[#77736C] font-mono text-[11px]">02 Oct 2026</td>
                      <td className="py-3 text-right text-[#77736C]">
                        <MoreHorizontal className="w-4 h-4 inline-block" />
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F8F6F1]/70 transition-colors">
                      <td className="py-3 font-semibold text-[#242321]">Material Request</td>
                      <td className="py-3 text-[#77736C]">Manual</td>
                      <td className="py-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#F5F2EC] text-[#242321] border border-[#EAE5DD]">
                          New
                        </span>
                      </td>
                      <td className="py-3 text-[#77736C] font-mono text-[11px]">01 Oct 2026</td>
                      <td className="py-3 text-right text-[#77736C]">
                        <MoreHorizontal className="w-4 h-4 inline-block" />
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Recent Activities */}
        <div className="bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#242321]">Recent Activities</h2>
            <Link href="/audit-logs" className="text-xs font-semibold text-[#77736C] hover:text-[#242321] transition-colors">
              View All
            </Link>
          </div>

          <div className="space-y-3.5">
            {data.activities && data.activities.length > 0 ? (
              data.activities.slice(0, 4).map((act) => (
                <div key={act.id} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C] shrink-0">
                      {renderActivityIcon(act)}
                    </div>
                    <Link
                      href={act.actionUrl || "/audit-logs"}
                      className="text-xs font-medium text-[#242321] hover:underline truncate"
                    >
                      {formatActivityText(act)}
                    </Link>
                  </div>
                  <span className="text-[11px] font-mono text-[#77736C] shrink-0" suppressHydrationWarning>
                    {formatRelativeTime(act.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C] shrink-0">
                      <Compass className="w-3.5 h-3.5 text-[#77736C]" />
                    </div>
                    <span className="text-xs font-medium text-[#242321]">Project handed over to client</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#77736C]">01 Oct 2026, 11:30 AM</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C] shrink-0">
                      <Receipt className="w-3.5 h-3.5 text-[#77736C]" />
                    </div>
                    <span className="text-xs font-medium text-[#242321]">Expense ₹4,000.00 recorded</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#77736C]">01 Oct 2026, 10:15 AM</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C] shrink-0">
                      <CreditCard className="w-3.5 h-3.5 text-[#77736C]" />
                    </div>
                    <span className="text-xs font-medium text-[#242321]">Payment ₹7,500.00 received</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#77736C]">01 Oct 2026, 09:40 AM</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C] shrink-0">
                      <Users className="w-3.5 h-3.5 text-[#77736C]" />
                    </div>
                    <span className="text-xs font-medium text-[#242321]">New lead added</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#77736C]">01 Oct 2026, 09:10 AM</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Complete Follow-up Modal */}
      {completingItem && (
        <div className="fixed inset-0 bg-[#242321]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFEFC] rounded-xl shadow-xl border border-[#EAE5DD] p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#242321]">Complete Follow-up</h3>
              <button
                onClick={() => setCompletingItem(null)}
                className="text-[#77736C] hover:text-[#242321] text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-2.5 bg-[#F8F6F1] rounded border border-[#EAE5DD] text-xs text-[#242321]">
              <p className="font-bold">{completingItem.title}</p>
              <p className="text-[11px] text-[#77736C] mt-0.5">{completingItem.clientOrLeadName} • {completingItem.referenceNo}</p>
            </div>
            <form onSubmit={handleCompleteFollowUp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#77736C] mb-1">
                  Outcome &amp; Discussion Notes <span className="text-[#B8594D]">*</span>
                </label>
                <textarea
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="Record outcome of discussion, client interest, decisions made..."
                  className="w-full text-xs px-3 py-2 border border-[#EAE5DD] bg-[#FFFEFC] rounded-md text-[#242321] outline-none focus:ring-1 focus:ring-[#B99558]"
                  rows={3}
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingItem(null)}
                  className="px-3 py-1.5 bg-[#F5F2EC] hover:bg-[#EEE5D6] text-[#242321] border border-[#EAE5DD] rounded-md text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-3 py-1.5 bg-[#B99558] hover:bg-[#8C7355] text-white rounded-md text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {isSubmittingAction ? "Saving..." : "Save & Complete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Follow-up Modal */}
      {reschedulingItem && (
        <div className="fixed inset-0 bg-[#242321]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFEFC] rounded-xl shadow-xl border border-[#EAE5DD] p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#242321]">Reschedule Follow-up</h3>
              <button
                onClick={() => setReschedulingItem(null)}
                className="text-[#77736C] hover:text-[#242321] text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-2.5 bg-[#F8F6F1] rounded border border-[#EAE5DD] text-xs text-[#242321]">
              <p className="font-bold">{reschedulingItem.title}</p>
              <p className="text-[11px] text-[#77736C] mt-0.5">{reschedulingItem.clientOrLeadName} • {reschedulingItem.referenceNo}</p>
            </div>
            <form onSubmit={handleRescheduleFollowUp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#77736C] mb-1">
                  New Scheduled Date <span className="text-[#B8594D]">*</span>
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#EAE5DD] bg-[#FFFEFC] rounded-md text-[#242321] outline-none focus:ring-1 focus:ring-[#B99558]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#77736C] mb-1">Notes / Reason</label>
                <textarea
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  placeholder="Reason for reschedule or updated objective..."
                  className="w-full text-xs px-3 py-2 border border-[#EAE5DD] bg-[#FFFEFC] rounded-md text-[#242321] outline-none focus:ring-1 focus:ring-[#B99558]"
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedulingItem(null)}
                  className="px-3 py-1.5 bg-[#F5F2EC] hover:bg-[#EEE5D6] text-[#242321] border border-[#EAE5DD] rounded-md text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-3 py-1.5 bg-[#B99558] hover:bg-[#8C7355] text-white rounded-md text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {isSubmittingAction ? "Saving..." : "Save New Date"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Date Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-[#242321]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFEFC] rounded-xl shadow-xl border border-[#EAE5DD] p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#242321]">Select Custom Date Range</h3>
              <button
                onClick={closeCustomModal}
                className="text-[#77736C] hover:text-[#242321] text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={applyCustomRange} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#77736C] mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#EAE5DD] bg-[#FFFEFC] rounded-md text-[#242321] outline-none focus:ring-1 focus:ring-[#B99558]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#77736C] mb-1">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#EAE5DD] bg-[#FFFEFC] rounded-md text-[#242321] outline-none focus:ring-1 focus:ring-[#B99558]"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCustomModal}
                  className="px-3 py-1.5 bg-[#F5F2EC] hover:bg-[#EEE5D6] text-[#242321] border border-[#EAE5DD] rounded-md text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#B99558] hover:bg-[#8C7355] text-white rounded-md text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Apply Filter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
