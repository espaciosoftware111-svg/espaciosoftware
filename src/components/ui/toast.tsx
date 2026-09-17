"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: {
    type?: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      type = "success",
      title,
      message,
      duration = 3500,
    }: {
      type?: ToastType;
      title: string;
      message?: string;
      duration?: number;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep at most 5 toasts visible

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: "success", title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: "error", title, message, duration: 5000 });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: "info", title, message });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: "warning", title, message, duration: 4500 });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning }}>
      {children}
      {/* Toast Overlay Container — Fixed Bottom-Right */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-250 animate-in slide-in-from-bottom-5 fade-in select-none",
              t.type === "success" && "bg-[#FAF8F5]/95 border-emerald-300 text-charcoal",
              t.type === "error" && "bg-rose-50/95 border-rose-300 text-rose-950",
              t.type === "warning" && "bg-amber-50/95 border-amber-300 text-amber-950",
              t.type === "info" && "bg-cream/95 border-walnut/20 text-charcoal"
            )}
          >
            {/* Status Icon */}
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {t.type === "error" && <AlertCircle className="w-4 h-4 text-rose-600" />}
              {t.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-600" />}
              {t.type === "info" && <Info className="w-4 h-4 text-gold" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  t.type === "success" && "text-emerald-900",
                  t.type === "error" && "text-rose-900",
                  t.type === "warning" && "text-amber-900",
                  t.type === "info" && "text-charcoal"
                )}
              >
                {t.title}
              </p>
              {t.message && (
                <p className="text-[11px] text-walnut mt-0.5 leading-snug break-words font-medium">
                  {t.message}
                </p>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 rounded-md text-walnut/60 hover:text-charcoal hover:bg-walnut/10 transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback safe dummy object in case invoked outside provider
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
    };
  }
  return context;
};
