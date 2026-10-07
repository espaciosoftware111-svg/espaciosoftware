"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Clock, X, Check, Sun, Moon } from "lucide-react";

interface ClockTimePickerProps {
  value?: string; // 24-hour format: "HH:mm" (e.g., "14:30") or ""
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  label?: string;
}

export function ClockTimePicker({
  value = "",
  onChange,
  placeholder = "Select time",
  className = "",
  disabled = false,
  required = false,
  id,
  name,
}: ClockTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"hours" | "minutes">("hours");
  
  // Parse incoming value "HH:mm"
  const parseValue = (val: string) => {
    if (!val || !val.includes(":")) {
      return { hour24: 12, minute: 0, hour12: 12, period: "PM" as "AM" | "PM" };
    }
    const [hStr, mStr] = val.split(":");
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return { hour24: h, minute: m, hour12, period };
  };

  const parsed = parseValue(value);
  const [selectedHour, setSelectedHour] = useState<number>(parsed.hour12);
  const [selectedMinute, setSelectedMinute] = useState<number>(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(parsed.period);
  const [isDragging, setIsDragging] = useState(false);

  // Sync internal state when external value changes
  useEffect(() => {
    const p = parseValue(value);
    setSelectedHour(p.hour12);
    setSelectedMinute(p.minute);
    setSelectedPeriod(p.period);
  }, [value]);

  const containerRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Format 24h string to emit
  const emitChange = useCallback((hour12: number, min: number, period: "AM" | "PM") => {
    let h24 = hour12 % 12;
    if (period === "PM") {
      h24 += 12;
    }
    const hh = String(h24).padStart(2, "0");
    const mm = String(min).padStart(2, "0");
    onChange(`${hh}:${mm}`);
  }, [onChange]);

  const handleHourSelect = (hour: number, autoSwitch = true) => {
    setSelectedHour(hour);
    emitChange(hour, selectedMinute, selectedPeriod);
    if (autoSwitch) {
      setTimeout(() => setActiveView("minutes"), 180);
    }
  };

  const handleMinuteSelect = (minute: number) => {
    setSelectedMinute(minute);
    emitChange(selectedHour, minute, selectedPeriod);
  };

  const handlePeriodToggle = (period: "AM" | "PM") => {
    setSelectedPeriod(period);
    emitChange(selectedHour, selectedMinute, period);
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    const h24 = now.getHours();
    const m = now.getMinutes();
    const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    setSelectedHour(h12);
    setSelectedMinute(m);
    setSelectedPeriod(period);
    emitChange(h12, m, period);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Convert angle on clock face to hour / minute
  const handleClockInteraction = useCallback((clientX: number, clientY: number) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;

    // Angle in degrees from 12 o'clock clockwise
    const angleRad = Math.atan2(dy, dx);
    const degrees = (angleRad * (180 / Math.PI) + 90 + 360) % 360;

    if (activeView === "hours") {
      let rawHour = Math.round(degrees / 30) % 12;
      const hour = rawHour === 0 ? 12 : rawHour;
      handleHourSelect(hour, false);
    } else {
      const minute = Math.round(degrees / 6) % 60;
      handleMinuteSelect(minute);
    }
  }, [activeView, selectedMinute, selectedPeriod, selectedHour]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handleClockInteraction(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      handleClockInteraction(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = () => {
    if (isDragging && activeView === "hours") {
      setTimeout(() => setActiveView("minutes"), 120);
    }
    setIsDragging(false);
  };

  // Formatted display for trigger input
  const getDisplayValue = () => {
    if (!value) return "";
    const p = parseValue(value);
    const hh = String(p.hour12).padStart(2, "0");
    const mm = String(p.minute).padStart(2, "0");
    return `${hh}:${mm} ${p.period}`;
  };

  // Preset quick selections
  const presets = [
    { label: "9:00 AM", value: "09:00" },
    { label: "10:30 AM", value: "10:30" },
    { label: "12:00 PM", value: "12:00" },
    { label: "2:30 PM", value: "14:30" },
    { label: "4:00 PM", value: "16:00" },
    { label: "6:00 PM", value: "18:00" },
  ];

  // Calculate clock hand angle
  const hourAngle = (selectedHour % 12) * 30;
  const minuteAngle = selectedMinute * 6;
  const currentAngle = activeView === "hours" ? hourAngle : minuteAngle;

  const clockRadius = 88; // radius in px for number placement

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      {/* Hidden input for standard forms */}
      <input type="hidden" name={name} id={id} value={value} required={required} />

      {/* Input Trigger */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setActiveView("hours");
          }
        }}
        className={`flex items-center justify-between w-full px-3 py-2 text-xs bg-white border border-walnut/20 rounded-md shadow-sm cursor-pointer transition-all hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          disabled ? "opacity-50 cursor-not-allowed bg-neutral-50" : ""
        } ${isOpen ? "ring-2 ring-emerald-500/30 border-emerald-500" : ""} ${className}`}
      >
        <div className="flex items-center gap-2 text-charcoal truncate">
          <Clock className={`w-3.5 h-3.5 ${value ? "text-emerald-600" : "text-walnut/50"}`} />
          {value ? (
            <span className="font-semibold tracking-wide font-mono text-[12px]">{getDisplayValue()}</span>
          ) : (
            <span className="text-walnut/50">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-walnut/40 hover:text-red-500 rounded hover:bg-neutral-100 transition-colors"
              title="Clear time"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Clock Popover */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1.5 p-3 bg-white border border-walnut/15 rounded-xl shadow-2xl w-[270px] left-0 sm:left-auto right-auto animate-in fade-in zoom-in-95 duration-150 select-none text-charcoal"
          style={{ minWidth: "260px" }}
        >
          {/* Digital Time Header */}
          <div className="flex items-center justify-between bg-neutral-900 text-white p-2.5 rounded-lg mb-3 shadow-inner">
            <div className="flex items-center gap-1 font-mono text-xl font-bold tracking-tight">
              <button
                type="button"
                onClick={() => setActiveView("hours")}
                className={`px-2 py-0.5 rounded transition-all ${
                  activeView === "hours"
                    ? "bg-emerald-500 text-white shadow"
                    : "text-neutral-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {String(selectedHour).padStart(2, "0")}
              </button>
              <span className="text-neutral-400 animate-pulse">:</span>
              <button
                type="button"
                onClick={() => setActiveView("minutes")}
                className={`px-2 py-0.5 rounded transition-all ${
                  activeView === "minutes"
                    ? "bg-emerald-500 text-white shadow"
                    : "text-neutral-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {String(selectedMinute).padStart(2, "0")}
              </button>
            </div>

            {/* AM / PM Toggle */}
            <div className="flex flex-col bg-neutral-800 p-0.5 rounded-md text-[10px] font-bold">
              <button
                type="button"
                onClick={() => handlePeriodToggle("AM")}
                className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                  selectedPeriod === "AM"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Sun className="w-2.5 h-2.5" /> AM
              </button>
              <button
                type="button"
                onClick={() => handlePeriodToggle("PM")}
                className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                  selectedPeriod === "PM"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Moon className="w-2.5 h-2.5" /> PM
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setActiveView("hours")}
              className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all ${
                activeView === "hours"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              Select Hour
            </button>
            <button
              type="button"
              onClick={() => setActiveView("minutes")}
              className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-all ${
                activeView === "minutes"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              Select Minute
            </button>
          </div>

          {/* Analog Circular Clock Face */}
          <div className="flex justify-center my-2">
            <div
              ref={clockRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative w-[210px] h-[210px] rounded-full bg-neutral-100/90 border border-neutral-200/80 shadow-inner flex items-center justify-center cursor-pointer touch-none select-none"
            >
              {/* Subtle Center Dot */}
              <div className="absolute w-2.5 h-2.5 bg-emerald-600 rounded-full z-20 shadow" />

              {/* Clock Hand Pointer */}
              <div
                className="absolute top-1/2 left-1/2 origin-top w-0.5 bg-emerald-500 transition-transform duration-75 z-10 pointer-events-none"
                style={{
                  height: `${clockRadius}px`,
                  transform: `translate(-50%, 0) rotate(${currentAngle + 180}deg)`,
                }}
              >
                {/* Pointer Tip Circle Indicator */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-7 h-7 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shadow-md ring-2 ring-emerald-300"
                >
                  {activeView === "hours" ? selectedHour : String(selectedMinute).padStart(2, "0")}
                </div>
              </div>

              {/* Clock Face Numbers */}
              {activeView === "hours" ? (
                // Hours 1 to 12
                [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => {
                  const angle = (h % 12) * 30 - 90;
                  const rad = (angle * Math.PI) / 180;
                  const x = 105 + clockRadius * Math.cos(rad);
                  const y = 105 + clockRadius * Math.sin(rad);
                  const isSelected = selectedHour === h;

                  return (
                    <button
                      key={`hour-${h}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHourSelect(h);
                      }}
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: "translate(-50%, -50%)",
                      }}
                      className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                        isSelected
                          ? "text-white font-bold"
                          : "text-neutral-700 hover:bg-neutral-200 hover:text-emerald-700"
                      }`}
                    >
                      {h}
                    </button>
                  );
                })
              ) : (
                // Minutes: Major numbers (00, 05, 10, ... 55)
                [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                  const angle = m * 6 - 90;
                  const rad = (angle * Math.PI) / 180;
                  const x = 105 + clockRadius * Math.cos(rad);
                  const y = 105 + clockRadius * Math.sin(rad);
                  const isSelected = selectedMinute === m;

                  return (
                    <button
                      key={`min-${m}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMinuteSelect(m);
                      }}
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: "translate(-50%, -50%)",
                      }}
                      className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all ${
                        isSelected
                          ? "text-white font-bold"
                          : "text-neutral-700 hover:bg-neutral-200 hover:text-emerald-700"
                      }`}
                    >
                      {String(m).padStart(2, "0")}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Preset Time Chips */}
          <div className="mt-2 pt-2 border-t border-neutral-100">
            <div className="text-[10px] font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
              Quick Suggestions
            </div>
            <div className="grid grid-cols-3 gap-1">
              {presets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    onChange(p.value);
                    const parsedP = parseValue(p.value);
                    setSelectedHour(parsedP.hour12);
                    setSelectedMinute(parsedP.minute);
                    setSelectedPeriod(parsedP.period);
                  }}
                  className={`px-1.5 py-1 text-[10px] rounded border font-medium transition-colors text-center ${
                    value === p.value
                      ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold"
                      : "bg-neutral-50 border-neutral-200/60 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100 text-xs">
            <button
              type="button"
              onClick={handleSetCurrentTime}
              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 hover:underline"
            >
              Current Time
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-sm transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
