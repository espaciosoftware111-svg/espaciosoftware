"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Bell,
  LogOut,
  ShieldCheck,
  Menu,
  ChevronDown,
  User as UserIcon,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { GlobalSearchModal } from "./global-search-modal";
import { NotificationDrawer } from "./notification-drawer";
import { useRouter, usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";

export interface TopNavProps {
  user?: {
    fullName: string;
    email: string;
    roles: string[];
    accessLevel?: "SUPER_ADMIN" | "ADMIN" | "USER";
  };
  onOpenMobileMenu?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ user, onOpenMobileMenu }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Interactive Month & Period Selector State
  const now = new Date();
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [activePeriodLabel, setActivePeriodLabel] = useState<string>(
    now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
  );

  const router = useRouter();
  const pathname = usePathname();
  const primaryRole = user?.accessLevel || user?.roles?.[0] || "USER";

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/v1/notifications?limit=1");
        const json = await res.json();
        if (json.success && typeof json.data?.unreadCount === "number") {
          setUnreadCount(json.data.unreadCount);
        }
      } catch {
        // Quiet handling
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const getPageTitle = () => {
    if (pathname === "/dashboard") return { title: "Dashboard", desc: "Executive Command Center & Business Overview" };
    if (pathname === "/leads" || pathname.startsWith("/leads")) return { title: "Leads", desc: "Manage client inquiries and sales pipeline" };
    if (pathname === "/material-leads" || pathname.startsWith("/material-leads")) return { title: "Material Leads", desc: "Material requests, catalog unlocks, and material leads pipeline" };
    if (pathname === "/projects" || pathname.startsWith("/projects")) return { title: "Projects", desc: "Active project execution, stages, and quality" };
    if (pathname === "/quotations" || pathname.startsWith("/quotations")) return { title: "Quotations", desc: "Sales estimates and pricing builder" };
    if (pathname === "/finance/payments" || pathname.startsWith("/finance/payments")) return { title: "Payments", desc: "Client payment collections and milestone receipts" };
    if (pathname === "/finance/expenses" || pathname.startsWith("/finance/expenses")) return { title: "Expenses", desc: "Project costs and operational expense vouchers" };
    if (pathname === "/finance/petty-cash" || pathname.startsWith("/finance/petty-cash")) return { title: "Petty Cash", desc: "Site cash float and employee advances" };
    if (pathname === "/procurement/vendors" || pathname.startsWith("/procurement/vendors")) return { title: "Vendors", desc: "Supplier directory, commercial terms, and ratings" };
    if (pathname === "/procurement/project-materials" || pathname.startsWith("/procurement/project-materials") || pathname === "/procurement/purchase-orders" || pathname.startsWith("/procurement/purchase-orders")) return { title: "Project Materials", desc: "Confirmed project material orders, receiving status, and pipeline tracking" };
    if (pathname === "/procurement/materials-order" || pathname.startsWith("/procurement/materials-order")) return { title: "Materials Order", desc: "Confirmed material orders for Materials Required Leads" };
    if (pathname === "/procurement/material-requests" || pathname.startsWith("/procurement/material-requests")) return { title: "Material Requests", desc: "Site item requisitions and approvals" };
    if (pathname.startsWith("/reports")) return { title: "Reports & Exports", desc: "Generate reports, export data as PDF or CSV, and download complete software snapshots" };
    if (pathname.startsWith("/notifications")) return { title: "NOTIFICATIONS & ALERTS", desc: "Central notification, dynamic operational alerts & action center" };
    if (pathname.startsWith("/settings")) return { title: "Settings", desc: "Global system configuration and preferences" };
    if (pathname.startsWith("/search")) return { title: "Search Results", desc: "Cross-module search and filter results" };
    return { title: "ESPACIO ERP", desc: "Enterprise operations" };
  };

  const pageInfo = getPageTitle();

  const currentMonthName = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date());

  return (
    <>
      <header className="h-16 bg-[#F8F6F1]/90 backdrop-blur-md border-b border-[#EAE5DD] px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 sticky top-0 select-none w-full min-w-0">
        {/* Left: Mobile Menu Toggle & Global Search Bar */}
        <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xl pr-3">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="p-1.5 -ml-1 text-[#77736C] hover:text-[#242321] hover:bg-[#F3EEE5] rounded-lg md:hidden shrink-0 cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="md:hidden shrink-0">
            <Logo size="xs" showText={false} />
          </div>

          {/* Global Search Field with Ctrl+K shortcut */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-between w-full max-w-md px-3.5 py-2 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl text-xs text-[#77736C] hover:border-[#B99558]/50 hover:bg-white transition-all shadow-[0_1px_2px_0_rgba(36,35,33,0.03)] cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0 truncate">
              <Search className="w-4 h-4 text-[#77736C] group-hover:text-[#242321] shrink-0" />
              <span className="truncate font-medium text-[#77736C]">Search leads, projects, invoices, materials...</span>
            </div>
            <span className="text-[11px] font-sans text-[#77736C] shrink-0 hidden sm:inline-block tracking-wide">
              Ctrl&nbsp; K
            </span>
          </button>
        </div>

        {/* Right Controls: Month Selector, Notifications, User Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Interactive Month & Period Selector Pill */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-[#FFFEFC] hover:bg-[#F3EEE5] border border-[#EAE5DD] hover:border-[#B99558]/60 rounded-xl text-xs font-semibold text-[#242321] shadow-[0_1px_2px_0_rgba(36,35,33,0.03)] transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#77736C]" />
              <span>{activePeriodLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#77736C] transition-transform ${isMonthPickerOpen ? "rotate-180" : ""}`} />
            </button>

            {isMonthPickerOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMonthPickerOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_10px_25px_-5px_rgba(36,35,33,0.1)] p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {/* Year Switcher Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EAE5DD]">
                    <button
                      onClick={() => setSelectedYear((y) => y - 1)}
                      className="p-1 text-[#77736C] hover:text-[#242321] hover:bg-[#F5F2EC] rounded-md transition-colors cursor-pointer"
                      title="Previous Year"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-[#242321] font-mono">{selectedYear}</span>
                    <button
                      onClick={() => setSelectedYear((y) => y + 1)}
                      className="p-1 text-[#77736C] hover:text-[#242321] hover:bg-[#F5F2EC] rounded-md transition-colors cursor-pointer"
                      title="Next Year"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 12 Month Grid */}
                  <div className="grid grid-cols-3 gap-1.5 pb-3 border-b border-[#EAE5DD]">
                    {[
                      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                    ].map((mName, mIdx) => {
                      const isCurrentSelected = selectedMonth === mIdx && selectedYear === new Date().getFullYear();
                      return (
                        <button
                          key={mName}
                          onClick={() => {
                            setSelectedMonth(mIdx);
                            const fullMonth = new Date(selectedYear, mIdx, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
                            setActivePeriodLabel(fullMonth);
                            setIsMonthPickerOpen(false);
                            if (pathname === "/dashboard") {
                              router.push(`/dashboard?month=${selectedYear}-${String(mIdx + 1).padStart(2, "0")}`);
                            }
                          }}
                          className={`py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                            isCurrentSelected
                              ? "bg-[#EEE5D6] text-[#242321] font-bold border border-[#B99558]/40"
                              : "text-[#77736C] hover:text-[#242321] hover:bg-[#F5F2EC]"
                          }`}
                        >
                          {mName}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Preset Ranges */}
                  <div className="pt-2 space-y-1">
                    <button
                      onClick={() => {
                        const now = new Date();
                        setSelectedYear(now.getFullYear());
                        setSelectedMonth(now.getMonth());
                        setActivePeriodLabel(now.toLocaleDateString("en-IN", { month: "long", year: "numeric" }));
                        setIsMonthPickerOpen(false);
                        if (pathname === "/dashboard") router.push("/dashboard?period=THIS_MONTH");
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#242321] hover:bg-[#F5F2EC] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>This Month (Current)</span>
                      <Check className="w-3.5 h-3.5 text-[#B99558]" />
                    </button>
                    <button
                      onClick={() => {
                        const prev = new Date();
                        prev.setMonth(prev.getMonth() - 1);
                        setSelectedYear(prev.getFullYear());
                        setSelectedMonth(prev.getMonth());
                        setActivePeriodLabel(prev.toLocaleDateString("en-IN", { month: "long", year: "numeric" }));
                        setIsMonthPickerOpen(false);
                        if (pathname === "/dashboard") router.push("/dashboard?period=LAST_MONTH");
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#77736C] hover:text-[#242321] hover:bg-[#F5F2EC] transition-colors cursor-pointer"
                    >
                      <span>Last Month</span>
                    </button>
                    <button
                      onClick={() => {
                        setActivePeriodLabel(`Year ${selectedYear}`);
                        setIsMonthPickerOpen(false);
                        if (pathname === "/dashboard") router.push("/dashboard?period=THIS_YEAR");
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#77736C] hover:text-[#242321] hover:bg-[#F5F2EC] transition-colors cursor-pointer"
                    >
                      <span>Full Year {selectedYear}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notifications Button */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 text-[#77736C] hover:text-[#242321] hover:bg-[#F3EEE5] rounded-xl transition-colors cursor-pointer border border-transparent hover:border-[#EAE5DD]"
            title="Notifications & Alerts"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#C48436] text-white text-[9px] font-bold font-mono flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="h-5 w-px bg-[#EAE5DD] hidden sm:block" />

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 p-1 pr-2 hover:bg-[#F3EEE5] rounded-xl transition-colors text-left cursor-pointer border border-transparent hover:border-[#EAE5DD]"
            >
              <div className="w-8 h-8 rounded-full bg-[#EEE5D6] border border-[#DDD6CA] flex items-center justify-center text-[#242321] font-bold text-xs shrink-0 shadow-[0_1px_2px_0_rgba(36,35,33,0.04)]">
                {user?.fullName?.charAt(0) || "A"}
              </div>
              <div className="hidden lg:block leading-tight">
                <p className="text-xs font-bold text-[#242321] truncate max-w-[130px]">{user?.fullName || "System Admin"}</p>
                <p className="text-[10px] text-[#77736C] uppercase tracking-wider font-semibold">{primaryRole}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#77736C] hidden lg:block" />
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_10px_25px_-5px_rgba(36,35,33,0.08)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2.5 border-b border-[#EAE5DD]">
                    <p className="text-xs font-bold text-[#242321]">{user?.fullName || "System Admin"}</p>
                    <p className="text-[11px] text-[#77736C] truncate font-medium">{user?.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#B99558]" />
                      <span className="text-[10px] font-bold text-[#8C6E38] uppercase tracking-wider">{primaryRole}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        router.push("/settings/profile");
                      }}
                      className="w-full px-3.5 py-2 text-xs text-[#242321] hover:bg-[#F3EEE5] flex items-center gap-2.5 transition-colors text-left cursor-pointer font-medium"
                    >
                      <UserIcon className="w-4 h-4 text-[#77736C]" />
                      <span>Profile & Account</span>
                    </button>
                  </div>

                  <div className="border-t border-[#EAE5DD] pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-3.5 py-2 text-xs text-[#B8594D] hover:bg-[#FDF2F0] flex items-center gap-2.5 transition-colors text-left cursor-pointer font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />
    </>
  );
};
