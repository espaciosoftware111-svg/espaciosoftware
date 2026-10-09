import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "active" | "pending" | "delayed" | "completed" | "neutral" | "danger" | "success" | "warning";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  showDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  showDot = true,
  className,
  ...props
}) => {
  const variants: Record<BadgeVariant, string> = {
    active: "bg-[#F4EDE0] text-[#8C6E38] border-[#E5DACB]",
    success: "bg-[#F4EFE6] text-[#8C7355] border-[#E5DACB]",
    completed: "bg-[#F4EFE6] text-[#8C7355] border-[#E5DACB]",
    pending: "bg-[#F4EDE0] text-[#8C6E38] border-[#E8DEC8]",
    warning: "bg-[#FAF3EB] text-[#C48436] border-[#ECD9C6]",
    delayed: "bg-[#FDF2F0] text-[#B8594D] border-[#F5D2CD]",
    danger: "bg-[#FDF2F0] text-[#B8594D] border-[#F5D2CD]",
    neutral: "bg-[#F5F2EC] text-[#77736C] border-[#EAE5DD]",
  };

  const dotColors: Record<BadgeVariant, string> = {
    active: "bg-[#B99558]",
    success: "bg-[#8C7355]",
    completed: "bg-[#8C7355]",
    pending: "bg-[#B99558]",
    warning: "bg-[#C48436]",
    delayed: "bg-[#B8594D]",
    danger: "bg-[#B8594D]",
    neutral: "bg-[#77736C]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full border shadow-2xs select-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
};
