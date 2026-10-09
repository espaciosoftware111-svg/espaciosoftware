"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B99558] focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

    const variants = {
      // Primary: Soft Gold with Espresso text
      primary: "bg-[#B99558] text-[#242321] hover:bg-[#A7844A] active:bg-[#94743C] shadow-[0_1px_2px_0_rgba(185,149,88,0.2)] font-bold",
      // Secondary: Crisp Ivory card surface with Hairline border
      secondary: "bg-[#FFFEFC] text-[#242321] border border-[#EAE5DD] hover:bg-[#F3EEE5] hover:border-[#DDD6CA] active:bg-[#EAE5DD] shadow-[0_1px_2px_0_rgba(36,35,33,0.03)]",
      // Outline: Hairline border
      outline: "border border-[#EAE5DD] bg-transparent text-[#242321] hover:bg-[#F5F2EC] hover:border-[#DDD6CA]",
      // Ghost: Neutral muted text with soft sand hover
      ghost: "text-[#77736C] hover:bg-[#EEE5D6]/60 hover:text-[#242321]",
      // Danger: Restrained terra-cotta
      danger: "bg-[#B8594D] text-white hover:bg-[#A34A3E] active:bg-[#8F3E34] shadow-subtle",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-md gap-1.5",
      md: "h-9 px-4 text-sm rounded-md gap-2",
      lg: "h-11 px-6 text-base rounded-lg gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
