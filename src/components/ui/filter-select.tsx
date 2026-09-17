"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSelectProps {
  label?: string;
  placeholder?: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  allowOthers?: boolean;
  othersLabel?: string;
  customPlaceholder?: string;
  className?: string;
  variant?: "beige" | "slate";
  size?: "sm" | "md";
  disabled?: boolean;
}

const OTHERS_VALUE = "__OTHERS__";

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  allowOthers = true,
  othersLabel = "Others",
  customPlaceholder,
  className = "",
  variant = "beige",
  size = "sm",
  disabled = false,
}) => {
  // Check if current value is one of the predefined options
  const isPredefined = options.some((opt) => opt.value === value) || value === "" || value === "ALL";

  // Internal state for custom text and others mode
  const [isOthersSelected, setIsOthersSelected] = useState<boolean>(!isPredefined && value !== "");
  const [customText, setCustomText] = useState<string>(!isPredefined ? value : "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize when external value changes (e.g. on reset or programmatic change)
  useEffect(() => {
    if (value === "" || value === "ALL") {
      setIsOthersSelected(false);
      setCustomText("");
    } else if (options.some((opt) => opt.value === value)) {
      setIsOthersSelected(false);
      setCustomText("");
    } else if (value && value !== OTHERS_VALUE) {
      setIsOthersSelected(true);
      setCustomText(value);
    }
  }, [value, options]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVal = e.target.value;
    if (selectedVal === OTHERS_VALUE) {
      setIsOthersSelected(true);
      const textToUse = customText.trim();
      onChange(textToUse);
      // Auto focus the custom input after render
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setIsOthersSelected(false);
      setCustomText("");
      onChange(selectedVal);
    }
  };

  const handleCustomTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setCustomText(newText);
    onChange(newText);
  };

  const handleClearCustom = () => {
    setCustomText("");
    onChange("");
    inputRef.current?.focus();
  };

  // Determine current dropdown selection value
  const selectValue = isOthersSelected ? OTHERS_VALUE : value;

  // Theme Styling
  const isBeige = variant === "beige";
  const heightClass = size === "sm" ? "h-8" : "h-8.5";

  const selectBaseStyle = isBeige
    ? "bg-[#FAF7F2] border-[#E2D9CE] text-[#1A1612] focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
    : "bg-slate-50 border-slate-200 text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";

  const inputBaseStyle = isBeige
    ? "bg-[#FFFFFF] border-[#C89B3C] text-[#1A1612] placeholder-[#7A7064]/70 focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]"
    : "bg-[#FFFFFF] border-emerald-500 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";

  const defaultPlaceholder = placeholder || (label ? `All ${label}s` : "All Options");
  const computedCustomPlaceholder = customPlaceholder || (label ? `Enter custom ${label.toLowerCase()}...` : "Enter custom value...");

  return (
    <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      {/* Dropdown Select */}
      <select
        value={selectValue}
        onChange={handleSelectChange}
        disabled={disabled}
        className={`${heightClass} px-2.5 text-xs font-medium border rounded-md outline-none transition-colors cursor-pointer ${selectBaseStyle}`}
        aria-label={label || defaultPlaceholder}
      >
        {defaultPlaceholder && <option value="">{defaultPlaceholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {allowOthers && (
          <option value={OTHERS_VALUE}>
            {othersLabel}
          </option>
        )}
      </select>

      {/* Manual Custom Input Field (Appears when 'Others' is selected) */}
      {isOthersSelected && (
        <div className="relative inline-flex items-center animate-in fade-in zoom-in-95 duration-150">
          <input
            ref={inputRef}
            type="text"
            value={customText}
            onChange={handleCustomTextChange}
            placeholder={computedCustomPlaceholder}
            className={`${heightClass} pl-2.5 pr-7 text-xs font-medium border rounded-md shadow-2xs outline-none w-44 md:w-52 transition-all ${inputBaseStyle}`}
            autoFocus
          />
          {customText ? (
            <button
              type="button"
              onClick={handleClearCustom}
              className="absolute right-1.5 p-0.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Clear custom filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Search className="w-3 h-3 absolute right-2 text-slate-400 pointer-events-none" />
          )}
        </div>
      )}
    </div>
  );
};
