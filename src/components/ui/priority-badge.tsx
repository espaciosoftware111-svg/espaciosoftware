import React from "react";
import { cn } from "@/lib/utils";

export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | string;

export interface PriorityBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  priority?: PriorityLevel | null;
  size?: "xs" | "sm" | "md";
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  LOW: {
    bg: "bg-[#E8EFE5]",
    text: "text-[#536B4E]",
    border: "border-[#D7E3D2]",
  },
  MEDIUM: {
    bg: "bg-[#F8EBD5]",
    text: "text-[#89652D]",
    border: "border-[#EAD6B2]",
  },
  HIGH: {
    bg: "bg-[#F8E4D9]",
    text: "text-[#A45435]",
    border: "border-[#EBCDBD]",
  },
  URGENT: {
    bg: "bg-[#F5DEDC]",
    text: "text-[#A33F3A]",
    border: "border-[#E8C5C2]",
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = "sm",
  className,
  children,
  ...props
}) => {
  const normalized = (priority || (typeof children === "string" ? children : "MEDIUM"))
    .toString()
    .trim()
    .toUpperCase();

  const config = PRIORITY_STYLES[normalized] || PRIORITY_STYLES.MEDIUM;

  const sizeClasses = {
    xs: "text-[9px] px-1.5 py-0.5 rounded",
    sm: "text-[10px] px-2 py-0.5 rounded",
    md: "text-xs px-2.5 py-1 rounded-md",
  };

  const displayText =
    children ||
    (normalized === "LOW"
      ? "LOW"
      : normalized === "MEDIUM"
      ? "MEDIUM"
      : normalized === "HIGH"
      ? "HIGH"
      : normalized === "URGENT"
      ? "URGENT"
      : normalized);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-semibold tracking-wide border uppercase select-none",
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {displayText}
    </span>
  );
};
