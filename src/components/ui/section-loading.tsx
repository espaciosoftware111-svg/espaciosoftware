import React from "react";

export function SectionLoading({
  title = "Loading...",
  subtitle = "Preparing workspace and data...",
  showCards = true,
  cardCount = 4,
}: {
  title?: string;
  subtitle?: string;
  showCards?: boolean;
  cardCount?: number;
}) {
  return (
    <div className="w-full space-y-5 animate-pulse min-h-[500px] select-none">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#242321]/10 rounded-lg" />
          <div className="h-3.5 w-64 bg-[#77736C]/10 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8.5 w-24 bg-[#EAE5DD] rounded-lg" />
          <div className="h-8.5 w-28 bg-[#B99558]/20 rounded-lg" />
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      {showCards && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {Array.from({ length: cardCount }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-[#EAE5DD] bg-[#FFFEFC] shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-[#77736C]/15 rounded" />
                <div className="h-7 w-7 rounded-lg bg-[#242321]/5" />
              </div>
              <div className="h-7 w-28 bg-[#242321]/10 rounded-md" />
              <div className="h-2.5 w-16 bg-[#77736C]/10 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Filter / Search Bar Skeleton */}
      <div className="p-3.5 rounded-xl border border-[#EAE5DD] bg-[#FFFEFC] shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] flex flex-wrap items-center justify-between gap-3">
        <div className="h-9 w-64 bg-[#242321]/5 rounded-lg" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-[#242321]/5 rounded-lg" />
          <div className="h-9 w-28 bg-[#242321]/5 rounded-lg" />
        </div>
      </div>

      {/* Data Table Skeleton */}
      <div className="rounded-xl border border-[#EAE5DD] bg-[#FFFEFC] shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] overflow-hidden">
        <div className="h-10 bg-[#F5F2EC] border-b border-[#EAE5DD] px-4 flex items-center justify-between">
          <div className="h-3.5 w-32 bg-[#242321]/10 rounded" />
          <div className="h-3.5 w-24 bg-[#242321]/10 rounded" />
        </div>
        <div className="divide-y divide-[#EAE5DD]/60 p-2 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-full bg-[#242321]/[0.02] rounded flex items-center px-4 justify-between">
              <div className="h-3.5 w-28 bg-[#242321]/10 rounded" />
              <div className="h-3.5 w-40 bg-[#242321]/10 rounded" />
              <div className="h-3.5 w-20 bg-[#242321]/10 rounded" />
              <div className="h-3.5 w-16 bg-[#242321]/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SectionLoading;
