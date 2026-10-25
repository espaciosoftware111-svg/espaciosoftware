import React from "react";

export interface ProgressBarProps {
  value: number; // 0 to 100
  size?: "xs" | "sm" | "md";
  variant?: "auto" | "gold" | "emerald" | "blue" | "danger";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  size = "xs",
  variant = "auto",
  showLabel = false,
  label,
  className = "",
}) => {
  const clampedValue = Math.min(100, Math.max(0, Math.round(value)));

  // Size configurations
  const heightClass = {
    xs: "h-1.5",
    sm: "h-2",
    md: "h-3",
  }[size];

  // Dynamic color selection
  let fillColor = "bg-[#89652D]"; // ESPACIO warm gold
  if (variant === "emerald" || (variant === "auto" && clampedValue >= 100)) {
    fillColor = "bg-emerald-600";
  } else if (variant === "blue") {
    fillColor = "bg-blue-600";
  } else if (variant === "danger") {
    fillColor = "bg-rose-500";
  } else if (variant === "gold") {
    fillColor = "bg-[#89652D]";
  } else if (variant === "auto") {
    if (clampedValue >= 75) {
      fillColor = "bg-[#6A4A2D]";
    } else if (clampedValue >= 35) {
      fillColor = "bg-[#89652D]";
    } else {
      fillColor = "bg-[#A17A38]";
    }
  }

  return (
    <div className={`w-full flex flex-col gap-1 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-[10px] font-mono leading-none">
          <span className="text-[#77716A] truncate">{label || "Progress"}</span>
          <span className="font-bold tabular-nums text-[#262421]">{clampedValue}%</span>
        </div>
      )}
      <div
        className={`w-full ${heightClass} bg-[#F3EEE5] rounded-full overflow-hidden border border-[#E8E2D8] flex p-[0.5px]`}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${heightClass} ${fillColor} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
