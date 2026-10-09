import React from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  isNumeric?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  emptySubtext?: string;
  isLoading?: boolean;
  className?: string;
  stickyHeader?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyText = "No records found.",
  emptySubtext = "There are no items to display in this view.",
  isLoading = false,
  className,
  stickyHeader = false,
}: DataTableProps<T>) {
  const showSkeleton = isLoading && data.length === 0;
  const isRefreshing = isLoading && data.length > 0;

  return (
    <div className={cn("w-full border border-[#EAE5DD] rounded-xl overflow-hidden bg-[#FFFEFC] shadow-[0_1px_3px_0_rgba(36,35,33,0.03)] relative", className)}>
      {/* Subtle Progress Bar during background refresh */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#B99558]/30 overflow-hidden z-20">
          <div className="h-full bg-[#B99558] animate-pulse w-full" />
        </div>
      )}

      <div className="overflow-x-auto max-h-[650px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className={cn(stickyHeader && "sticky top-0 z-10")}>
            <tr className="bg-[#F8F6F1] border-b border-[#EAE5DD]">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn(
                    "px-4 py-3 text-[10.5px] font-bold text-[#77736C] uppercase tracking-wider select-none",
                    (col.align === "right" || col.isNumeric) && "text-right",
                    col.align === "center" && "text-center",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn("divide-y divide-[#EAE5DD] transition-opacity duration-150", isRefreshing && "opacity-60")}>
            {showSkeleton ? (
              // Render 5 elegant skeleton rows to preserve table height with zero layout shift
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skel-${rIdx}`} className="animate-pulse bg-white/40">
                  {columns.map((col, cIdx) => (
                    <td key={`skel-c-${cIdx}`} className="px-4 py-3.5">
                      <div
                        className={cn(
                          "h-3.5 bg-[#F5F2EC] rounded-md border border-[#EAE5DD]/50",
                          cIdx === 0 ? "w-3/4" : cIdx === 1 ? "w-1/2" : "w-2/3",
                          (col.align === "right" || col.isNumeric) && "ml-auto"
                        )}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-[#77736C]">
                  <div className="flex flex-col items-center justify-center gap-1 max-w-sm mx-auto">
                    <p className="font-bold text-[#242321] text-xs">{emptyText}</p>
                    <p className="text-[11px] text-[#77736C]">{emptySubtext}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "transition-colors hover:bg-[#F8F6F1]/80",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col, cIdx) => {
                    const value = col.cell ? col.cell(row) : col.accessorKey ? (row[col.accessorKey] as React.ReactNode) : null;
                    return (
                      <td
                        key={cIdx}
                        className={cn(
                          "px-4 py-3 text-[#242321] font-medium leading-normal",
                          (col.align === "right" || col.isNumeric) && "text-right tabular-nums font-mono",
                          col.align === "center" && "text-center",
                          col.className
                        )}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

