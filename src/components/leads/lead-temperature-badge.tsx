"use client";

import React from "react";
import { Flame, Sun, Snowflake, ShieldAlert } from "lucide-react";

export type LeadTemperature = "COOL" | "WARM" | "HOT" | "FREEZE";

export const LEAD_TEMPERATURE_CONFIG: Record<
  LeadTemperature,
  {
    label: string;
    emoji: string;
    badgeClass: string;
    textClass: string;
    borderClass: string;
    bgClass: string;
    activeButtonClass: string;
    inactiveButtonClass: string;
  }
> = {
  COOL: {
    label: "Cool",
    emoji: "🧊",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    textClass: "text-sky-700",
    borderClass: "border-sky-300",
    bgClass: "bg-sky-50",
    activeButtonClass: "bg-sky-600 text-white border-sky-600 shadow-xs hover:bg-sky-700",
    inactiveButtonClass: "bg-white text-sky-700 border-sky-200 hover:bg-sky-50",
  },
  WARM: {
    label: "Warm",
    emoji: "☀️",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    textClass: "text-amber-700",
    borderClass: "border-amber-300",
    bgClass: "bg-amber-50",
    activeButtonClass: "bg-amber-600 text-white border-amber-600 shadow-xs hover:bg-amber-700",
    inactiveButtonClass: "bg-white text-amber-700 border-amber-200 hover:bg-amber-50",
  },
  HOT: {
    label: "Hot",
    emoji: "🔥",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    textClass: "text-rose-700",
    borderClass: "border-rose-300",
    bgClass: "bg-rose-50",
    activeButtonClass: "bg-rose-600 text-white border-rose-600 shadow-xs hover:bg-rose-700",
    inactiveButtonClass: "bg-white text-rose-700 border-rose-200 hover:bg-rose-50",
  },
  FREEZE: {
    label: "Freeze",
    emoji: "❄️",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    textClass: "text-indigo-700",
    borderClass: "border-indigo-300",
    bgClass: "bg-indigo-50",
    activeButtonClass: "bg-indigo-600 text-white border-indigo-600 shadow-xs hover:bg-indigo-700",
    inactiveButtonClass: "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50",
  },
};

export function getLeadTemperature(tags?: string | null): LeadTemperature | null {
  if (!tags) return null;
  if (tags.includes("[LEAD_TEMP:HOT]")) return "HOT";
  if (tags.includes("[LEAD_TEMP:WARM]")) return "WARM";
  if (tags.includes("[LEAD_TEMP:COOL]")) return "COOL";
  if (tags.includes("[LEAD_TEMP:FREEZE]") || tags.includes("[FROZEN_ARCHIVED]")) return "FREEZE";
  return null;
}

export function setLeadTemperatureTag(
  currentTags: string | null | undefined,
  temp: LeadTemperature
): string {
  let cleaned = (currentTags || "")
    .replace(/\[LEAD_TEMP:(HOT|WARM|COOL|FREEZE)\]/g, "")
    .replace(/,\s*,/g, ",")
    .trim();

  // If unfreezing to hot/warm/cool, remove [FROZEN_ARCHIVED]
  if (temp !== "FREEZE") {
    cleaned = cleaned.replace(/\[FROZEN_ARCHIVED\]/g, "").replace(/,\s*,/g, ",").trim();
  }

  const newTag = `[LEAD_TEMP:${temp}]`;
  if (!cleaned) return newTag;
  return `${cleaned}, ${newTag}`;
}

export function LeadTemperatureIcon({
  temp,
  className = "w-3 h-3",
}: {
  temp: LeadTemperature;
  className?: string;
}) {
  switch (temp) {
    case "HOT":
      return <Flame className={className} />;
    case "WARM":
      return <Sun className={className} />;
    case "COOL":
      return <Snowflake className={className} />;
    case "FREEZE":
      return <ShieldAlert className={className} />;
  }
}

export function LeadTemperatureBadge({
  temperature,
  size = "sm",
  showLabel = true,
}: {
  temperature?: LeadTemperature | null;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
}) {
  if (!temperature) return null;
  const config = LEAD_TEMPERATURE_CONFIG[temperature];
  if (!config) return null;

  const sizeClasses =
    size === "xs"
      ? "text-[9px] px-1.5 py-0.5 gap-1"
      : size === "md"
      ? "text-xs px-2.5 py-1 gap-1.5"
      : "text-[10px] px-2 py-0.5 gap-1";

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-md border ${config.badgeClass} ${sizeClasses}`}
      title={`Lead Rating: ${config.label}`}
    >
      <LeadTemperatureIcon temp={temperature} className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export function LeadTemperatureButtonGroup({
  currentTemp,
  onSelect,
  disabled = false,
}: {
  currentTemp?: LeadTemperature | null;
  onSelect: (temp: LeadTemperature) => void;
  disabled?: boolean;
}) {
  const options: LeadTemperature[] = ["COOL", "WARM", "HOT", "FREEZE"];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {options.map((temp) => {
        const config = LEAD_TEMPERATURE_CONFIG[temp];
        const isSelected = currentTemp === temp;

        return (
          <button
            key={temp}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(temp)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isSelected ? config.activeButtonClass : config.inactiveButtonClass
            }`}
            title={`Mark Lead as ${config.label}`}
          >
            <LeadTemperatureIcon temp={temp} className="w-3 h-3" />
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
