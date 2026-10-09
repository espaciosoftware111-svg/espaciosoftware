"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./topnav";
import { PermissionsProvider } from "@/components/providers/permissions-provider";
import { ToastProvider } from "@/components/ui/toast";

export interface AppShellProps {
  user: {
    fullName: string;
    email: string;
    roles: string[];
    accessLevel?: "SUPER_ADMIN" | "ADMIN" | "USER";
    permissions?: string[];
  };
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ user, children }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <PermissionsProvider user={user}>
      <ToastProvider>
        <div className="flex h-screen w-full bg-[#F8F6F1] overflow-hidden select-none">
          {/* Responsive Sidebar (Desktop Permanent + Mobile Slide-over Drawer) */}
          <Sidebar
            isMobileOpen={isMobileNavOpen}
            onCloseMobile={() => setIsMobileNavOpen(false)}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#F8F6F1]">
            <TopNav
              user={{
                fullName: user.fullName,
                email: user.email,
                roles: user.roles,
                accessLevel: user.accessLevel,
              }}
              onOpenMobileMenu={() => setIsMobileNavOpen(true)}
            />

            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-7 w-full min-w-0 bg-[#F8F6F1]">
              <div className="max-w-7xl mx-auto w-full min-w-0 space-y-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </ToastProvider>
    </PermissionsProvider>
  );
};
