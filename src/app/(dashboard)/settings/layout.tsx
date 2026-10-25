import React from "react";
import { SettingsGuard } from "@/components/settings/settings-guard";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <SettingsGuard>{children}</SettingsGuard>;
}
