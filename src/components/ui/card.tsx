import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, header, footer, className, ...props }) => {
  return (
    <div
      className={cn(
        "bg-[#FFFEFC] border border-[#EAE5DD] rounded-xl shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] flex flex-col min-w-0 w-full overflow-hidden transition-all duration-150",
        className
      )}
      {...props}
    >
      {header && (
        <div className="px-5 py-3.5 border-b border-[#EAE5DD] flex items-center justify-between bg-[#F8F6F1]/60 min-w-0 gap-2">
          {header}
        </div>
      )}
      {children}
      {footer && (
        <div className="px-5 py-3 bg-[#F8F6F1]/40 border-t border-[#EAE5DD] text-xs text-[#77736C] min-w-0">
          {footer}
        </div>
      )}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-5", className)} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn("text-base font-bold text-[#242321] leading-none tracking-tight", className)} {...props} />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn("text-xs text-[#77736C]", className)} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("p-5 pt-0", className)} {...props} />
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("flex items-center p-5 pt-0", className)} {...props} />
);

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendType?: "positive" | "negative" | "warning" | "neutral";
  icon?: React.ReactNode;
  emptyContext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  trend,
  trendType = "neutral",
  icon,
  emptyContext,
}) => {
  const trendColors = {
    positive: "text-[#8C7355] font-semibold",
    negative: "text-[#B8594D] font-semibold",
    warning: "text-[#C48436] font-semibold",
    neutral: "text-[#77736C]",
  };

  const numericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
  const isZero = isNaN(numericValue) || numericValue === 0;

  return (
    <div className="p-4 sm:p-4.5 bg-[#FFFEFC] rounded-xl border border-[#EAE5DD] shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] flex items-center justify-between gap-3 min-w-0 w-full hover:border-[#B99558]/50 transition-colors">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-[#F5F2EC] border border-[#EAE5DD] flex items-center justify-center text-[#77736C] shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <span className="text-[10.5px] font-bold text-[#77736C] uppercase tracking-wider block truncate">
            {label}
          </span>
          <div className="flex items-baseline gap-2 mt-0.5 min-w-0">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#242321] tracking-tight tabular-nums truncate">
              {value}
            </span>
            {trend && (
              <span className={cn("text-[11px] font-mono shrink-0", trendColors[trendType])}>
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-[#77736C] mt-0.5 truncate font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
