"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { usePermissions } from "@/components/providers/permissions-provider";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Receipt,
  Wallet,
  Coins,
  Truck,
  ShoppingCart,
  Boxes,
  Package,
  PackageCheck,
  BarChart3,
  Bell,
  Settings,
  CalendarDays,
  Trash2,
  ChevronRight,
  X,
} from "lucide-react";

interface SubNavItem {
  label: string;
  href: string;
  badge?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
  adminOnly?: boolean;
  badge?: string | number;
  subItems?: SubNavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "Calendar", href: "/calendar", icon: <CalendarDays className="w-4 h-4" /> },
      { label: "Leads", href: "/leads", icon: <Users className="w-4 h-4" />, permission: "leads:read" },
      { label: "Material Leads", href: "/material-leads", icon: <PackageCheck className="w-4 h-4" />, permission: "leads:read" },
      { label: "Projects", href: "/projects", icon: <FolderKanban className="w-4 h-4" />, permission: "projects:read" },
      {
        label: "Quotations",
        href: "/quotations",
        icon: <FileText className="w-4 h-4" />,
        permission: "quotations:read",
        subItems: [
          { label: "Complete Interiors", href: "/quotations?type=LEAD" },
          { label: "Materials Quotation", href: "/quotations?type=MATERIAL" },
          { label: "Invoice", href: "/quotations?tab=invoices" },
        ],
      },
      { label: "Invoices", href: "/quotations?tab=invoices", icon: <FileText className="w-4 h-4" />, permission: "quotations:read" },
      { label: "Payments", href: "/finance/payments", icon: <Receipt className="w-4 h-4" />, permission: "payments:read" },
      { label: "Expenses", href: "/finance/expenses", icon: <Wallet className="w-4 h-4" />, permission: "expenses:read" },
      { label: "Petty Cash", href: "/finance/petty-cash", icon: <Coins className="w-4 h-4" />, permission: "petty_cash:read" },
      { label: "Vendors", href: "/procurement/vendors", icon: <Truck className="w-4 h-4" />, permission: "vendors:read" },
      { label: "Purchase Orders", href: "/procurement/project-materials", icon: <FileText className="w-4 h-4" />, permission: "purchase_orders:read" },
      { label: "Project Materials", href: "/procurement/project-materials", icon: <ShoppingCart className="w-4 h-4" />, permission: "purchase_orders:read" },
      { label: "Materials Order", href: "/procurement/materials-order", icon: <Boxes className="w-4 h-4" />, permission: "purchase_orders:read" },
      { label: "Material Requests", href: "/procurement/material-requests", icon: <Package className="w-4 h-4" />, permission: "material_requests:read" },
    ],
  },
  {
    title: "INSIGHTS",
    items: [
      { label: "Reports & Exports", href: "/reports", icon: <BarChart3 className="w-4 h-4" />, permission: "reports:read" },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Notifications & Alerts", href: "/notifications", icon: <Bell className="w-4 h-4" /> },
      { label: "Settings", href: "/settings", icon: <Settings className="w-4 h-4" />, permission: "settings:manage" },
      { label: "Trash / Recycle Bin", href: "/trash", icon: <Trash2 className="w-4 h-4" /> },
    ],
  },
];

export interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const { can, isSuperAdmin, isAdmin } = usePermissions();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/v1/notifications?limit=1");
        const json = await res.json();
        if (json.success && typeof json.data?.unreadCount === "number") {
          setUnreadNotifCount(json.data.unreadCount);
        }
      } catch {
        // Quiet handling
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  const filteredSections = navSections
    .map((section) => {
      const filteredItems = section.items.filter((item) => {
        if (isSuperAdmin) return true;
        if (item.adminOnly && !isAdmin) return false;
        if (item.permission && !can(item.permission)) return false;
        return true;
      });

      return {
        ...section,
        items: filteredItems,
      };
    })
    .filter((section) => section.items.length > 0);

  const renderNavContent = (isMobileView: boolean) => (
    <>
      {/* Brand Header */}
      <div className="h-16 px-4 sm:px-5 flex items-center justify-between border-b border-[#EAE5DD] shrink-0 bg-[#F5F2EC]">
        <Link
          href="/dashboard"
          onClick={() => isMobileView && onCloseMobile?.()}
          className="flex items-center gap-2.5 overflow-hidden"
        >
          <Logo
            size="sm"
            light={false}
            subtitle="INTERIORS & MODULAR"
            collapsed={isCollapsed && !isMobileView}
          />
        </Link>
        {isMobileView && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-[#77736C] hover:text-[#242321] hover:bg-[#EEE5D6]/60 cursor-pointer"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto overflow-x-hidden">
        {filteredSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!isCollapsed || isMobileView ? (
              <h3 className="px-3 text-[10px] font-bold text-[#77736C] uppercase tracking-wider">
                {section.title}
              </h3>
            ) : (
              <div className="h-px bg-[#EAE5DD] my-2 mx-1" />
            )}

            {section.items.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              const displayBadge =
                item.href === "/notifications"
                  ? unreadNotifCount > 0
                    ? String(unreadNotifCount)
                    : undefined
                  : item.badge;

              return (
                <div key={item.href + item.label} className="relative group">
                  {/* Main Link */}
                  <Link
                    href={item.href}
                    prefetch={true}
                    onClick={() => isMobileView && onCloseMobile?.()}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-[13px] rounded-lg transition-all duration-150 cursor-pointer select-none",
                      isActive
                        ? "bg-[#EEE5D6] text-[#242321] font-bold shadow-none"
                        : "text-[#242321] font-medium hover:bg-[#EEE5D6]/50 hover:text-[#242321]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 truncate">
                      <span className={cn("shrink-0", isActive ? "text-[#242321]" : "text-[#77736C] group-hover:text-[#242321]")}>
                        {item.icon}
                      </span>
                      {(!isCollapsed || isMobileView) && <span className="truncate">{item.label}</span>}
                    </div>
                    {displayBadge && (!isCollapsed || isMobileView) && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#89652D] text-[#FAF8F5] text-[10px] font-bold font-mono tabular-nums flex items-center justify-center shrink-0 shadow-2xs">
                        {displayBadge}
                      </span>
                    )}
                  </Link>

                  {/* Sub-items (e.g. Complete Interiors, Materials Quotation, Invoice) */}
                  {item.subItems && (!isCollapsed || isMobileView) && (
                    <div className="ml-5 pl-2.5 border-l border-[#EAE5DD] mt-1 space-y-0.5">
                      {item.subItems.map((sub) => {
                        return (
                          <Link
                            key={sub.href + sub.label}
                            href={sub.href}
                            prefetch={true}
                            onClick={() => isMobileView && onCloseMobile?.()}
                            className={cn(
                              "flex items-center justify-between px-2.5 py-1 text-[11.5px] rounded-md transition-all cursor-pointer",
                              "text-[#77736C] hover:text-[#242321] hover:bg-[#EEE5D6]/40"
                            )}
                          >
                            <span className="truncate">{sub.label}</span>
                            {sub.badge && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#B99558]/20 text-[#8C6E38] font-bold">
                                {sub.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Tooltip on Collapsed Hover (Desktop only) */}
                  {isCollapsed && !isMobileView && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-[#242321] text-white text-xs font-medium rounded-lg shadow-modal whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Account / User Section at Bottom */}
      <div className="p-3 border-t border-[#EAE5DD] shrink-0 bg-[#F5F2EC]">
        <Link
          href="/settings"
          onClick={() => isMobileView && onCloseMobile?.()}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-[#EEE5D6]/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#EEE5D6] border border-[#DDD6CA] flex items-center justify-center text-[#242321] font-bold text-xs shrink-0">
              E
            </div>
            {(!isCollapsed || isMobileView) && (
              <div className="min-w-0 leading-tight">
                <p className="text-xs font-bold text-[#242321] truncate">ESPACIO</p>
                <p className="text-[10px] text-[#77736C] truncate font-medium">System Admin</p>
              </div>
            )}
          </div>
          {(!isCollapsed || isMobileView) && <ChevronRight className="w-3.5 h-3.5 text-[#77736C] shrink-0" />}
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar (Hidden on mobile/tablet below md) */}
      <aside
        className={cn(
          "hidden md:flex bg-[#F5F2EC] text-[#242321] border-r border-[#EAE5DD] flex-col shrink-0 min-h-screen select-none transition-all duration-200 z-30 relative",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Slide-over Drawer & Backdrop (Rendered only on < md when open) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#242321]/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Sliding Drawer */}
          <aside className="relative flex flex-col w-64 max-w-[80vw] bg-[#F5F2EC] text-[#242321] border-r border-[#EAE5DD] h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
