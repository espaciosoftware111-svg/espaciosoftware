"use client";

import React, { useState } from "react";
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
  ChevronLeft,
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
      { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: "Calendar", href: "/calendar", icon: <CalendarDays className="w-5 h-5" /> },
      { label: "Leads", href: "/leads", icon: <Users className="w-5 h-5" />, permission: "leads:read" },
      { label: "Material Leads", href: "/material-leads", icon: <PackageCheck className="w-5 h-5" />, permission: "leads:read" },
      { label: "Projects", href: "/projects", icon: <FolderKanban className="w-5 h-5" />, permission: "projects:read" },
      {
        label: "Quotations",
        href: "/quotations",
        icon: <FileText className="w-5 h-5" />,
        permission: "quotations:read",
        subItems: [
          { label: "Complete Interiors", href: "/quotations?type=LEAD" },
          { label: "Materials Quotation", href: "/quotations?type=MATERIAL" },
          { label: "Invoice", href: "/quotations?tab=invoices" },
        ],
      },
      { label: "Payments", href: "/finance/payments", icon: <Receipt className="w-5 h-5" />, permission: "payments:read" },
      { label: "Expenses", href: "/finance/expenses", icon: <Wallet className="w-5 h-5" />, permission: "expenses:read" },
      { label: "Petty Cash", href: "/finance/petty-cash", icon: <Coins className="w-5 h-5" />, permission: "petty_cash:read" },
      { label: "Vendors", href: "/procurement/vendors", icon: <Truck className="w-5 h-5" />, permission: "vendors:read" },
      { label: "Project Materials", href: "/procurement/project-materials", icon: <ShoppingCart className="w-5 h-5" />, permission: "purchase_orders:read" },
      { label: "Materials Order", href: "/procurement/materials-order", icon: <Boxes className="w-5 h-5" />, permission: "purchase_orders:read" },
      { label: "Material Requests", href: "/procurement/material-requests", icon: <Package className="w-5 h-5" />, permission: "material_requests:read" },
    ],
  },
  {
    title: "INSIGHTS",
    items: [
      { label: "Reports & Exports", href: "/reports", icon: <BarChart3 className="w-5 h-5" />, permission: "reports:read" },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Notifications & Alerts", href: "/notifications", icon: <Bell className="w-5 h-5" /> },
      { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" />, permission: "settings:manage" },
      { label: "Trash / Recycle Bin", href: "/trash", icon: <Trash2 className="w-5 h-5" /> },
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
  const { can, isSuperAdmin, isAdmin } = usePermissions();

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
      <div className="h-16 px-4 sm:px-5 flex items-center justify-between border-b border-walnut/30 shrink-0 bg-[#423C36]">
        <Link
          href="/dashboard"
          onClick={() => isMobileView && onCloseMobile?.()}
          className="flex items-center gap-3 overflow-hidden"
        >
          <Logo
            size="sm"
            light
            subtitle="INTERIORS & MODULAR"
            collapsed={isCollapsed && !isMobileView}
          />
        </Link>
        {isMobileView && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-[#E8DEC8] hover:text-[#FAF6EF] hover:bg-walnut/30 cursor-pointer"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto overflow-x-hidden">
        {filteredSections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            {!isCollapsed || isMobileView ? (
              <h3 className="px-3 text-[11px] font-bold text-[#D4C3B3] uppercase tracking-wider">
                {section.title}
              </h3>
            ) : (
              <div className="h-px bg-walnut/25 my-2.5 mx-1" />
            )}

            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

              return (
                <div key={item.href} className="relative group">
                  {/* Main Link */}
                  <Link
                    href={item.href}
                    prefetch={true}
                    onClick={() => isMobileView && onCloseMobile?.()}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-[13.5px] font-semibold rounded-lg transition-all duration-150 cursor-pointer",
                      isActive
                        ? "bg-gold text-charcoal font-bold shadow-gold"
                        : "text-[#FAF6EF] hover:bg-walnut/30 hover:text-white"
                    )}
                  >
                    <span className={cn("shrink-0", isActive ? "text-charcoal" : "text-[#E8DEC8] group-hover:text-white")}>
                      {item.icon}
                    </span>
                    {(!isCollapsed || isMobileView) && <span className="truncate leading-tight">{item.label}</span>}
                  </Link>

                  {/* Sub-items (e.g. Complete Interiors, Materials Quotation, Invoice) */}
                  {item.subItems && (!isCollapsed || isMobileView) && (
                    <div className="ml-6 pl-3 border-l border-walnut/30 mt-1 space-y-1">
                      {item.subItems.map((sub) => {
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            prefetch={true}
                            onClick={() => isMobileView && onCloseMobile?.()}
                            className={cn(
                              "flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer",
                              "text-[#E8DEC8]/85 hover:text-white hover:bg-walnut/20"
                            )}
                          >
                            <span className="truncate">{sub.label}</span>
                            {sub.badge && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold font-bold">
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
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-[#4A433D] text-cream text-xs font-medium rounded-lg shadow-modal border border-walnut/30 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle Footer (Desktop only) */}
      {!isMobileView && (
        <div className="p-2.5 border-t border-walnut/30 flex items-center justify-between shrink-0 bg-[#423C36]">
          {!isCollapsed && <span className="text-[11px] font-mono text-[#D4C3B3] pl-2 font-semibold">v1.0.0</span>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-[#E8DEC8] hover:text-[#FAF6EF] hover:bg-walnut/30 transition-colors w-full flex items-center justify-center cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronLeft className="w-4.5 h-4.5" />}
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar (Hidden on mobile/tablet below md) */}
      <aside
        className={cn(
          "hidden md:flex bg-[#4A433D] text-[#FAF6EF] border-r border-walnut/20 flex-col shrink-0 min-h-screen select-none transition-all duration-200 z-30 relative",
          isCollapsed ? "w-18" : "w-72"
        )}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Slide-over Drawer & Backdrop (Rendered only on < md when open) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Sliding Drawer */}
          <aside className="relative flex flex-col w-72 max-w-[85vw] bg-[#4A433D] text-[#FAF6EF] border-r border-walnut/20 h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
