"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#77736C]">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded-lg border border-[#EAE5DD] bg-[#FFFEFC] px-3 py-1.5 text-xs sm:text-sm text-[#242321] placeholder:text-[#77736C]/60 shadow-[0_1px_2px_0_rgba(36,35,33,0.03)] focus:outline-none focus:ring-1 focus:ring-[#B99558]/40 focus:border-[#B99558] disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            error && "border-[#B8594D] focus:ring-[#B8594D]/30 focus:border-[#B8594D] text-[#B8594D]",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-[#B8594D] font-medium">{error}</span>}
        {!error && helperText && <span className="text-xs text-[#77736C]">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

