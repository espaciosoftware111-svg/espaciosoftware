"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
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
  Search,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface SettingCardItem {
  id: string;
  title: string;
  category: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  keywords: string[];
}

const SETTINGS_CARDS: SettingCardItem[] = [
  {
    id: "company",
    title: "Company Information",
    category: "ORGANIZATION",
    description: "Legal entity, official business address, contact info, GSTIN, PAN, and official branding logo.",
    href: "/settings/company",
    icon: Building2,
    badge: "Official Details",
    keywords: ["company", "business", "address", "logo", "gstin", "pan", "email", "phone", "website", "branding"],
  },
  {
    id: "profile",
    title: "My Profile",
    category: "ORGANIZATION",
    description: "Personal account profile, display name, contact phone, avatar photo, and active role badges.",
    href: "/settings/profile",
    icon: UserCheck,
    keywords: ["profile", "avatar", "photo", "user", "email", "phone", "name"],
  },
  {
    id: "users",
    title: "Users & Access Management",
    category: "PEOPLE & SECURITY",
    description: "Manage team members, assign administrative roles, deactivate accounts, and enforce Super Admin safety.",
    href: "/settings/users",
    icon: Users,
    badge: "Super Admin",
    keywords: ["users", "team", "employees", "roles", "superadmin", "access", "activate", "deactivate"],
  },
  {
    id: "roles",
    title: "Roles & Permissions",
    category: "PEOPLE & SECURITY",
    description: "Granular role-based access control matrix (View, Create, Edit, Delete, Export, Manage).",
    href: "/settings/roles",
    icon: ShieldCheck,
    keywords: ["roles", "permissions", "rbac", "access", "matrix", "manager", "admin", "viewer"],
  },
  {
    id: "security",
    title: "Security Settings",
    category: "PEOPLE & SECURITY",
    description: "Change password, manage active browser sessions, lockout duration, and password strength policies.",
    href: "/settings/security",
    icon: Lock,
    badge: "Protected",
    keywords: ["security", "password", "session", "lockout", "auth", "mfa", "login"],
  },
  {
    id: "business",
    title: "Business Configuration",
    category: "BUSINESS CONFIGURATION",
    description: "Unified hub for configurable business choices across CRM, Projects, Finance, and Procurement.",
    href: "/settings/business",
    icon: Sliders,
    keywords: ["business", "configuration", "options", "custom", "others"],
  },
  {
    id: "leads",
    title: "Lead Sources & CRM",
    category: "BUSINESS CONFIGURATION",
    description: "Lead channels, custom sources with Global Others rule, Lead ID formatting (LD-001), and loss reasons.",
    href: "/settings/leads",
    icon: UserPlus,
    keywords: ["leads", "sources", "crm", "referral", "website", "social media", "loss reasons", "ld-001"],
  },
  {
    id: "projects",
    title: "Project Settings",
    category: "BUSINESS CONFIGURATION",
    description: "Project categories, execution stages workflow, Project ID format (PRJ-001), and timeline defaults.",
    href: "/settings/projects",
    icon: FolderKanban,
    keywords: ["projects", "stages", "pipeline", "categories", "prj-001", "turnkey", "modular"],
  },
  {
    id: "quotations",
    title: "Quotation Settings",
    category: "BUSINESS CONFIGURATION",
    description: "Number format (QT-001), currency, GST rules, default terms & conditions, company stamp & signature.",
    href: "/settings/quotations",
    icon: FileText,
    badge: "Stamp & Signature",
    keywords: ["quotations", "currency", "gst", "terms", "stamp", "signature", "print", "whatsapp", "qt-001"],
  },
  {
    id: "payments",
    title: "Payment Settings",
    category: "BUSINESS CONFIGURATION",
    description: "Payment types (Advance, Milestone, Final), payment methods (UPI, NEFT, Cheque, Others), and status labels.",
    href: "/settings/payments",
    icon: CreditCard,
    keywords: ["payments", "upi", "bank transfer", "cash", "cheque", "advance", "milestone", "final"],
  },
  {
    id: "expenses",
    title: "Expense Settings",
    category: "BUSINESS CONFIGURATION",
    description: "Expense categories with Project vs Business classification, receipt rules, and safe deactivation.",
    href: "/settings/expenses",
    icon: Receipt,
    keywords: ["expenses", "categories", "project expense", "business expense", "petty cash", "receipt"],
  },
  {
    id: "vendors",
    title: "Vendor & Material Settings",
    category: "BUSINESS CONFIGURATION",
    description: "Vendor categories, contractor types, and material categories (Wood, Laminate, Hardware, Glass, Paint).",
    href: "/settings/vendors",
    icon: Truck,
    keywords: ["vendors", "materials", "suppliers", "plywood", "hardware", "glass", "paint", "contractor"],
  },
  {
    id: "notifications",
    title: "Notification Settings",
    category: "SYSTEM & INTEGRATIONS",
    description: "Granular toggles for Leads, Projects, Payments, Expenses, Priorities, and Follow-up reminders.",
    href: "/settings/notifications",
    icon: Bell,
    keywords: ["notifications", "alerts", "leads", "projects", "follow-up", "priority", "reminders"],
  },
  {
    id: "integrations",
    title: "Integration Settings",
    category: "SYSTEM & INTEGRATIONS",
    description: "WhatsApp quotation dispatch, Website inbound lead webhooks, Google Sheets sync, Drive, and Email.",
    href: "/settings/integrations",
    icon: Network,
    badge: "WhatsApp & Webhook",
    keywords: ["integrations", "whatsapp", "website", "webhook", "google sheets", "drive", "email"],
  },
  {
    id: "backup",
    title: "Data & Backup",
    category: "SYSTEM & INTEGRATIONS",
    description: "Real-time database health metrics, record counts, automated snapshot logs, and export links.",
    href: "/settings/backup",
    icon: HardDrive,
    keywords: ["data", "backup", "snapshot", "database", "health", "restore", "records"],
  },
  {
    id: "preferences",
    title: "System Preferences",
    category: "SYSTEM & INTEGRATIONS",
    description: "Date formats (DD/MM/YYYY), time display (12h/24h), Indian Rupee symbol, timezone, and language.",
    href: "/settings/preferences",
    icon: Globe2,
    keywords: ["preferences", "date format", "time format", "currency", "timezone", "language"],
  },
];

export default function SettingsHubPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const categories = ["ALL", "ORGANIZATION", "PEOPLE & SECURITY", "BUSINESS CONFIGURATION", "SYSTEM & INTEGRATIONS"];

  const filteredCards = SETTINGS_CARDS.filter((card) => {
    const matchesCategory = activeCategory === "ALL" || card.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesSearch =
      card.title.toLowerCase().includes(q) ||
      card.description.toLowerCase().includes(q) ||
      card.keywords.some((k) => k.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#FAF8F5]">
      <SettingsSidebar />

      <main className="flex-1 p-4 md:p-8 max-w-6xl space-y-6">
        {/* Header Banner */}
        <div className="bg-[#FAF6EF] p-6 rounded-2xl border border-[#C5A880]/30 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#C5A880]/25 text-[#423C36] tracking-wider uppercase">
                  Central Administration
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Fully Dynamic
                </span>
              </div>
              <h1 className="text-2xl font-black text-[#423C36] tracking-tight mt-1">SETTINGS</h1>
              <p className="text-xs text-[#423C36]/70 mt-0.5 max-w-xl">
                Configure company identity, user permissions, business rules, quotation defaults, integrations, and system preferences without affecting existing business records.
              </p>
            </div>

            {/* Quick action to company settings */}
            <Link
              href="/settings/company"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#423C36] hover:bg-[#2F2B26] text-[#FAF6EF] rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-[#C5A880]" />
              <span>Edit Company Profile</span>
            </Link>
          </div>

          {/* Search & Filter Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#423C36]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settings (e.g. GST, logo, quote number, WhatsApp, password, lead source)..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#FFFFFF] border border-[#C5A880]/30 rounded-xl text-[#423C36] placeholder-[#423C36]/40 focus:outline-hidden focus:ring-2 focus:ring-[#C5A880]/40 transition-all shadow-2xs"
              />
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-tight whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === cat
                      ? "bg-[#C5A880] text-[#423C36] shadow-2xs"
                      : "bg-[#FFFFFF] text-[#423C36]/70 hover:bg-[#FAF6EF] hover:text-[#423C36] border border-[#C5A880]/20"
                  }`}
                >
                  {cat === "ALL" ? "All Settings" : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#423C36]">
              {activeCategory === "ALL" ? "All Configuration Modules" : activeCategory} ({filteredCards.length})
            </h2>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[11px] text-[#C5A880] hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.id}
                  href={card.href}
                  className="group relative bg-[#FFFFFF] hover:bg-[#FAF6EF]/60 p-5 rounded-2xl border border-[#C5A880]/25 hover:border-[#C5A880] shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF6EF] group-hover:bg-[#C5A880]/25 flex items-center justify-center border border-[#C5A880]/30 transition-colors">
                        <Icon className="w-5 h-5 text-[#423C36] group-hover:text-[#423C36]" />
                      </div>
                      {card.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#C5A880]/20 text-[#423C36]">
                          {card.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-[#423C36]/50 uppercase tracking-wider block">
                        {card.category}
                      </span>
                      <h3 className="text-sm font-bold text-[#423C36] mt-0.5 group-hover:text-[#C5A880] transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-[#423C36]/70 mt-1 line-clamp-2 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#C5A880]/15 flex items-center justify-between text-xs font-semibold text-[#423C36]/80 group-hover:text-[#423C36]">
                    <span>Configure</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A880] group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredCards.length === 0 && (
            <div className="bg-[#FFFFFF] p-10 rounded-2xl border border-[#C5A880]/20 text-center space-y-2">
              <Search className="w-8 h-8 text-[#423C36]/30 mx-auto" />
              <h3 className="text-sm font-bold text-[#423C36]">No settings found</h3>
              <p className="text-xs text-[#423C36]/60">
                No configuration module matched &ldquo;{searchQuery}&rdquo;. Try another search term or reset filters.
              </p>
            </div>
          )}
        </div>

        {/* Global Safety & Audit Guarantee */}
        <div className="bg-[#FAF6EF] p-4 rounded-xl border border-[#C5A880]/20 flex items-center justify-between text-xs text-[#423C36]/80">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#C5A880] shrink-0" />
            <span>
              <strong>Data Safety Guarantee:</strong> All setting modifications are audited in real time and safely applied to future records without altering historical business calculations.
            </span>
          </div>
          <Link
            href="/settings/backup"
            className="text-xs font-bold text-[#423C36] hover:text-[#C5A880] underline shrink-0 ml-4"
          >
            View DB Health
          </Link>
        </div>
      </main>
    </div>
  );
}
