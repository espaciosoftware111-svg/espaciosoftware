"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import {
  Sliders,
  UserPlus,
  Receipt,
  CreditCard,
  FolderKanban,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers,
} from "lucide-react";

interface BusinessConfigSummary {
  leadSourcesCount: number;
  expenseCategoriesCount: number;
  paymentMethodsCount: number;
  projectCategoriesCount: number;
  vendorCategoriesCount: number;
  materialCategoriesCount: number;
}

export default function BusinessConfigurationHubPage() {
  const [stats, setStats] = useState<BusinessConfigSummary>({
    leadSourcesCount: 6,
    expenseCategoriesCount: 10,
    paymentMethodsCount: 6,
    projectCategoriesCount: 5,
    vendorCategoriesCount: 9,
    materialCategoriesCount: 8,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBusinessSummary();
  }, []);

  const fetchBusinessSummary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/settings/business");
      const json = await res.json();
      if (json.success && json.data) {
        setStats({
          leadSourcesCount: json.data.leadSettings?.sources?.length || 6,
          expenseCategoriesCount: json.data.expenseSettings?.categories?.length || 10,
          paymentMethodsCount: json.data.paymentSettings?.paymentMethods?.length || 6,
          projectCategoriesCount: json.data.projectSettings?.categories?.length || 5,
          vendorCategoriesCount: json.data.vendorSettings?.categories?.length || 9,
          materialCategoriesCount: json.data.vendorSettings?.materialCategories?.length || 8,
        });
      }
    } catch {
      // Quiet handling
    } finally {
      setIsLoading(false);
    }
  };

  const configModules = [
    {
      title: "Lead Acquisition Sources",
      description: "Manage lead source channels (Website, Referral, Direct Visit, Social Media, etc.) with Global Others rule.",
      href: "/settings/leads",
      icon: UserPlus,
      count: stats.leadSourcesCount,
      countLabel: "Sources",
    },
    {
      title: "Expense Categories",
      description: "Project and Business expense types (Materials, Labour, Transport, Rent, Salaries) with deactivate safety.",
      href: "/settings/expenses",
      icon: Receipt,
      count: stats.expenseCategoriesCount,
      countLabel: "Categories",
    },
    {
      title: "Payment Methods & Types",
      description: "Client payment channels (UPI, Bank Transfer, Cheque, Cash) and milestone stages (Advance, Final).",
      href: "/settings/payments",
      icon: CreditCard,
      count: stats.paymentMethodsCount,
      countLabel: "Methods",
    },
    {
      title: "Project Categories & Stages",
      description: "Project execution scopes (Residential Turnkey, Modular, Fitout) and 13-stage turnkey pipeline.",
      href: "/settings/projects",
      icon: FolderKanban,
      count: stats.projectCategoriesCount,
      countLabel: "Categories",
    },
    {
      title: "Vendor Categories & Types",
      description: "Vendor trade classifications (Plywood, Hardware, Glass, Paint) and contractor engagement models.",
      href: "/settings/vendors",
      icon: Truck,
      count: stats.vendorCategoriesCount,
      countLabel: "Trade Categories",
    },
    {
      title: "Raw Material Master Categories",
      description: "Material inventory master types (Plywood, Laminate, Veneer, Hardware, Glass, Electrical).",
      href: "/settings/vendors",
      icon: Layers,
      count: stats.materialCategoriesCount,
      countLabel: "Material Types",
    },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#FAF8F5]">
      <SettingsSidebar />

      <main className="flex-1 p-4 md:p-8 max-w-5xl space-y-6">
        {/* Header */}
        <div className="border-b border-[#C5A880]/20 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C5A880]/20 text-[#423C36] uppercase tracking-wider">
              Central Master
            </span>
          </div>
          <h1 className="text-xl font-black text-[#423C36] tracking-tight mt-1 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#C5A880]" /> Business Configuration (Rule 15)
          </h1>
          <p className="text-xs text-[#423C36]/70 mt-0.5">
            Centralized master repository of reusable business options across CRM, Projects, Finance, and Procurement.
          </p>
        </div>

        {/* Global Others Rule Banner */}
        <div className="bg-[#FAF6EF] p-5 rounded-2xl border border-[#C5A880]/30 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C5A880]" />
            <h2 className="text-xs font-bold text-[#423C36] uppercase tracking-wider">
              Global &ldquo;Others&rdquo; Rule (Rule 17)
            </h2>
          </div>
          <p className="text-xs text-[#423C36]/80 leading-relaxed">
            Whenever predefined dropdown options exist anywhere in ESPACIO ERP (Lead Sources, Payment Methods, Expense Categories, Vendor Trades), selecting <strong>&ldquo;Others&rdquo;</strong> displays a real-time manual input field. Custom values are dynamically saved without breaking existing system structures.
          </p>
        </div>

        {/* Configuration Modules Grid */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#423C36]">
            Configurable Business Modules ({configModules.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {configModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.title}
                  href={mod.href}
                  className="group bg-[#FFFFFF] hover:bg-[#FAF6EF]/70 p-5 rounded-2xl border border-[#C5A880]/25 hover:border-[#C5A880] shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF6EF] group-hover:bg-[#C5A880]/20 flex items-center justify-center border border-[#C5A880]/30 transition-colors">
                        <Icon className="w-5 h-5 text-[#423C36]" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#C5A880]/20 text-[#423C36]">
                        {mod.count} {mod.countLabel}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#423C36] group-hover:text-[#C5A880] transition-colors">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-[#423C36]/70 mt-1 line-clamp-2 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#C5A880]/15 flex items-center justify-between text-xs font-semibold text-[#423C36]/80 group-hover:text-[#423C36]">
                    <span>Manage Options</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A880] group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Historical Integrity Guarantee */}
        <div className="bg-[#FAF6EF] p-4 rounded-xl border border-[#C5A880]/20 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
          <div className="text-xs text-[#423C36]/80 leading-relaxed">
            <strong>Deactivate instead of Delete (Rule 60):</strong> Modifying business configuration choices automatically updates future data entry forms while keeping past leads, projects, expenses, payments, and quotations completely intact.
          </div>
        </div>
      </main>
    </div>
  );
}
