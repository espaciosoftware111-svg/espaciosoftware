import React from "react";

export default function DashboardRouteLoading() {
  return (
    <div className="w-full space-y-5 animate-pulse min-h-[500px]">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-walnut/15 rounded-md" />
          <div className="h-3.5 w-72 bg-walnut/10 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-walnut/15 rounded-lg" />
          <div className="h-8 w-28 bg-gold/30 rounded-lg" />
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-walnut/15 bg-white/70 shadow-2xs space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-walnut/10 rounded" />
              <div className="h-6 w-6 rounded-lg bg-walnut/10" />
            </div>
            <div className="h-7 w-28 bg-walnut/15 rounded-md" />
            <div className="h-2.5 w-16 bg-walnut/10 rounded" />
          </div>
        ))}
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="p-3.5 rounded-xl border border-walnut/15 bg-white/70 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="h-9 w-64 bg-walnut/10 rounded-lg" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-walnut/10 rounded-lg" />
          <div className="h-9 w-28 bg-walnut/10 rounded-lg" />
        </div>
      </div>

      {/* Data Table Skeleton */}
      <div className="rounded-xl border border-walnut/15 bg-white/70 shadow-2xs overflow-hidden">
        <div className="h-10 bg-cream/80 border-b border-walnut/15 px-4 flex items-center justify-between">
          <div className="h-3.5 w-32 bg-walnut/15 rounded" />
          <div className="h-3.5 w-24 bg-walnut/15 rounded" />
        </div>
        <div className="divide-y divide-walnut/10 p-2 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-full bg-walnut/5 rounded flex items-center px-4 justify-between">
              <div className="h-3.5 w-28 bg-walnut/10 rounded" />
              <div className="h-3.5 w-40 bg-walnut/10 rounded" />
              <div className="h-3.5 w-20 bg-walnut/10 rounded" />
              <div className="h-3.5 w-16 bg-walnut/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
