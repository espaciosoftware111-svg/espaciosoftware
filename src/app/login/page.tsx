"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { ShieldCheck, UserCheck, KeyRound, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@espacio.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleFillAccount = (fillEmail: string, fillPass: string = "Password123!") => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Invalid email or password");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please check server status.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-offwhite rounded-xl shadow-modal border border-walnut/20 p-8">
        {/* Official Brand Header */}
        <div className="flex justify-center mb-6">
          <Logo size="lg" subtitle="INTERIORS AND MODULAR" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-base font-bold text-charcoal">Sign In to ESPACIO ERP</h2>
          <p className="text-xs text-walnut mt-1">Enter your credentials to access your workspace</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
            Sign In to Dashboard
          </Button>
        </form>

        {/* Quick Demo Login Credentials Bar */}
        <div className="mt-6 pt-5 border-t border-walnut/15 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-walnut uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-gold" />
              Quick Select Accounts:
            </span>
            <span className="text-[10px] text-walnut/70 font-normal">Pass: Password123!</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillAccount("admin@espacio.com")}
              className="text-left p-2 rounded-lg border border-walnut/20 bg-white hover:bg-cream transition-all text-xs cursor-pointer"
            >
              <div className="font-bold text-charcoal flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Super Admin
              </div>
              <div className="text-[10px] text-walnut truncate">admin@espacio.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillAccount("hassan@espacio.com")}
              className="text-left p-2 rounded-lg border border-walnut/20 bg-white hover:bg-cream transition-all text-xs cursor-pointer"
            >
              <div className="font-bold text-charcoal flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-blue-600" /> Finance Lead
              </div>
              <div className="text-[10px] text-walnut truncate">hassan@espacio.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillAccount("priya.sales@espacio.com")}
              className="text-left p-2 rounded-lg border border-walnut/20 bg-white hover:bg-cream transition-all text-xs cursor-pointer"
            >
              <div className="font-bold text-charcoal flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" /> Sales Lead
              </div>
              <div className="text-[10px] text-walnut truncate">priya.sales@espacio.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillAccount("espaciosoftware111@gmail.com")}
              className="text-left p-2 rounded-lg border border-walnut/20 bg-white hover:bg-cream transition-all text-xs cursor-pointer"
            >
              <div className="font-bold text-charcoal flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-600" /> Gmail Admin
              </div>
              <div className="text-[10px] text-walnut truncate">espaciosoftware111@gmail.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
