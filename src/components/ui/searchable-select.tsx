"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  subtext?: string;
}

export interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  allowOthers?: boolean;
  othersLabel?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: string;
}

const OTHERS_VALUE = "__OTHERS__";

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder = "Select an option...",
  options,
  value,
  onChange,
  allowOthers = true,
  othersLabel = "Others (Specify custom)",
  disabled = false,
  required = false,
  className = "",
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOthersMode, setIsOthersMode] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Determine if current value is in predefined options
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Sync state if external value changes
  useEffect(() => {
    if (!value) {
      setIsOthersMode(false);
      setCustomInput("");
    } else if (selectedOption) {
      setIsOthersMode(false);
      setCustomInput("");
    } else if (value && value !== OTHERS_VALUE) {
      setIsOthersMode(true);
      setCustomInput(value);
    }
  }, [value, selectedOption]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options efficiently
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options.slice(0, 100); // limit rendered DOM nodes for speed
    const query = searchQuery.toLowerCase();
    return options
      .filter(
        (opt) =>
          opt.label.toLowerCase().includes(query) ||
          (opt.subtext && opt.subtext.toLowerCase().includes(query)) ||
          opt.value.toLowerCase().includes(query)
      )
      .slice(0, 100);
  }, [options, searchQuery]);

  const handleSelect = (val: string) => {
    if (val === OTHERS_VALUE) {
      setIsOthersMode(true);
      setIsOpen(false);
      onChange(customInput);
      setTimeout(() => customInputRef.current?.focus(), 50);
    } else {
      setIsOthersMode(false);
      setCustomInput("");
      onChange(val);
      setIsOpen(false);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const txt = e.target.value;
    setCustomInput(txt);
    onChange(txt);
  };

  const handleClearCustom = () => {
    setIsOthersMode(false);
    setCustomInput("");
    onChange("");
  };

  return (
    <div className={cn("flex flex-col gap-1.5 relative select-none", className)} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-charcoal uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* When in OTHERS custom input mode */}
      {isOthersMode ? (
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              ref={customInputRef}
              type="text"
              value={customInput}
              onChange={handleCustomChange}
              placeholder="Type custom name/details..."
              disabled={disabled}
              className="w-full h-9 pl-3 pr-8 text-xs bg-amber-50/50 border border-amber-300 rounded-lg text-charcoal font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {customInput && (
              <button
                type="button"
                onClick={() => {
                  setCustomInput("");
                  onChange("");
                  customInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-walnut/60 hover:text-charcoal cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleClearCustom}
            className="h-9 px-2.5 text-xs text-walnut hover:text-charcoal bg-cream/70 hover:bg-cream border border-walnut/20 rounded-lg font-semibold cursor-pointer transition-colors"
            title="Return to dropdown list"
          >
            List
          </button>
        </div>
      ) : (
        /* Regular Dropdown Trigger Button */
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }
          }}
          className={cn(
            "w-full h-9 px-3 flex items-center justify-between gap-2 text-xs bg-white border border-walnut/20 rounded-lg font-medium text-left transition-colors cursor-pointer",
            isOpen && "border-gold ring-1 ring-gold/40",
            disabled && "opacity-60 cursor-not-allowed bg-cream/40",
            error && "border-rose-300 ring-1 ring-rose-200"
          )}
        >
          <span className={cn("truncate", selectedOption ? "text-charcoal font-semibold" : "text-walnut/70")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={cn("w-3.5 h-3.5 text-walnut transition-transform shrink-0", isOpen && "rotate-180")} />
        </button>
      )}

      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}

      {/* Popover Dropdown Panel */}
      {isOpen && !isOthersMode && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full z-50 bg-[#FCFBF9] border border-walnut/20 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-64">
          {/* Search Header */}
          <div className="p-2 border-b border-walnut/15 bg-cream/60 flex items-center gap-2 shrink-0">
            <Search className="w-3.5 h-3.5 text-walnut shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full text-xs bg-transparent border-none outline-none text-charcoal placeholder:text-walnut/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-walnut hover:text-charcoal cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto p-1 divide-y divide-walnut/5">
            {filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "w-full px-2.5 py-2 flex items-center justify-between text-left text-xs rounded-lg transition-colors cursor-pointer",
                    isSelected
                      ? "bg-gold/20 text-charcoal font-bold"
                      : "hover:bg-cream/70 text-charcoal"
                  )}
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-medium">{opt.label}</p>
                    {opt.subtext && <p className="text-[10px] text-walnut truncate">{opt.subtext}</p>}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-gold shrink-0" />}
                </button>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="p-3 text-center text-xs text-walnut">
                No matching records found.
              </div>
            )}

            {/* OTHERS option */}
            {allowOthers && (
              <button
                type="button"
                onClick={() => handleSelect(OTHERS_VALUE)}
                className="w-full px-2.5 py-2 mt-1 flex items-center gap-2 text-left text-xs text-amber-800 hover:bg-amber-50 rounded-lg font-bold border-t border-walnut/10 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>{othersLabel}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
