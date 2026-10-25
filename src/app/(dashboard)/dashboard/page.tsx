import React from "react";
import { redirect } from "next/navigation";
import { AuthService } from "@/modules/auth/auth.service";
import { DashboardMetricsService } from "@/modules/dashboard/dashboard.service";
import { ApprovalsService } from "@/modules/approvals/approvals.service";
import { DashboardClient } from "./dashboard-client";

export const revalidate = 0; // Dynamic server rendering
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await AuthService.getSessionFromCookies();

  if (!session) {
    redirect("/login");
  }

  const accessLevel = session.accessLevel || (session.roles?.includes("ADMIN") ? "ADMIN" : "USER");

  // Provide initial empty structure immediately so UI shell renders in 0ms
  const initialSummary = DashboardMetricsService.getEmptyDashboardSummary({
    period: "THIS_MONTH",
  });

  return (
    <DashboardClient
      initialData={initialSummary}
      isInitialLoading={true}
      user={{
        id: session.userId,
        email: session.email,
        fullName: session.fullName,
        accessLevel,
      }}
    />
  );
}
