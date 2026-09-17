"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  UserCheck,
  Users,
  ShieldCheck,
  Lock,
  Sliders,
  UserPlus,
  FolderKanban,
  FileText,
  CreditCard,
  Receipt,
  Truck,
  Bell,
  Network,
  HardDrive,
  Globe2,
  LayoutGrid,
} from "lucide-react";

interface SettingsNavSection {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ElementType;
  }[];
}

const navSections: SettingsNavSection[] = [
  {
    title: "ORGANIZATION & PROFILE",
    items: [
      { label: "Settings Overview", href: "/settings", icon: LayoutGrid },
      { label: "Company Information", href: "/settings/company", icon: Building2 },
      { label: "My Profile", href: "/settings/profile", icon: UserCheck },
    ],
  },
  {
    title: "PEOPLE & SECURITY",
    items: [
      { label: "Users & Access", href: "/settings/users", icon: Users },
      { label: "Roles & Permissions", href: "/settings/roles", icon: ShieldCheck },
      { label: "Security Settings", href: "/settings/security", icon: Lock },
    ],
  },
  {
    title: "BUSINESS CONFIGURATION",
    items: [
      { label: "Business Overview", href: "/settings/business", icon: Sliders },
      { label: "Lead Sources", href: "/settings/leads", icon: UserPlus },
      { label: "Project Settings", href: "/settings/projects", icon: FolderKanban },
      { label: "Quotation Settings", href: "/settings/quotations", icon: FileText },
      { label: "Payment Settings", href: "/settings/payments", icon: CreditCard },
      { label: "Expense Settings", href: "/settings/expenses", icon: Receipt },
      { label: "Vendor Settings", href: "/settings/vendors", icon: Truck },
    ],
  },
  {
    title: "SYSTEM & INTEGRATIONS",
    items: [
      { label: "Notification Settings", href: "/settings/notifications", icon: Bell },
      { label: "Integration Settings", href: "/settings/integrations", icon: Network },
      { label: "Data & Backup", href: "/settings/backup", icon: HardDrive },
      { label: "System Preferences", href: "/settings/preferences", icon: Globe2 },
    ],
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 bg-[#FAF6EF] border-r border-[#C5A880]/20 p-4 shrink-0 space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#423C36]">SETTINGS</h2>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#C5A880]/20 text-[#423C36]">
            Control Center
          </span>
        </div>
        <p className="text-[11px] text-[#423C36]/70 mt-0.5">Central system &amp; business configuration</p>
      </div>

      <nav className="space-y-4">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <span className="text-[10px] font-bold text-[#423C36]/60 uppercase tracking-wider block px-2 mb-1">
              {section.title}
            </span>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-[#C5A880]/25 text-[#423C36] font-bold border-l-2 border-[#C5A880] shadow-2xs"
                        : "text-[#423C36]/80 hover:bg-[#FAF8F5] hover:text-[#423C36]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#C5A880]" : "text-[#423C36]/60"}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
