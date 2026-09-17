"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

// Global in-memory cache for client-side instant navigation
const globalClientCache = new Map<string, { data: any; timestamp: number }>();
const activeListeners = new Map<string, Set<() => void>>();

export function getCachedData<T>(key: string): T | null {
  const entry = globalClientCache.get(key);
  if (entry) {
    return entry.data as T;
  }
  return null;
}

export function setCachedData(key: string, data: any): void {
  globalClientCache.set(key, { data, timestamp: Date.now() });
  const listeners = activeListeners.get(key);
  if (listeners) {
    listeners.forEach((fn) => fn());
  }
}

export function invalidateClientCache(urlPrefix: string): void {
  for (const key of globalClientCache.keys()) {
    if (key.startsWith(urlPrefix)) {
      globalClientCache.delete(key);
      const listeners = activeListeners.get(key);
      if (listeners) {
        listeners.forEach((fn) => fn());
      }
    }
  }
}

/**
 * High-Speed Reactive Data Hook with Instant Local Cache + Background Revalidation
 */
export function useFastData<T = any>(
  url: string | null,
  options?: {
    ttlMs?: number;
    realtimeTable?: string;
  }
) {
  const ttlMs = options?.ttlMs ?? 60000; // 1 minute stale time
  const cached = url ? getCachedData<T>(url) : null;

  const [data, setData] = useState<T | null>(cached);
  const [isLoading, setIsLoading] = useState<boolean>(!cached && Boolean(url));
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const isMounted = useRef(true);

  const fetchData = useCallback(
    async (isBackground = false) => {
      if (!url) return;
      if (!isBackground && !cached) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const result = json.data !== undefined ? json.data : json;

        if (isMounted.current) {
          setData(result);
          setCachedData(url, result);
        }
      } catch (err) {
        console.error(`[FastData] Error fetching ${url}:`, err);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [url, cached]
  );

  useEffect(() => {
    isMounted.current = true;
    if (!url) return;

    const entry = globalClientCache.get(url);
    const isStale = !entry || Date.now() - entry.timestamp > ttlMs;

    if (entry) {
      setData(entry.data);
      setIsLoading(false);
    }

    if (isStale) {
      fetchData(Boolean(entry));
    }

    // Subscribe to external invalidations of this URL
    if (!activeListeners.has(url)) {
      activeListeners.set(url, new Set());
    }
    const listener = () => {
      const updated = getCachedData<T>(url);
      if (updated && isMounted.current) {
        setData(updated);
      }
    };
    activeListeners.get(url)?.add(listener);

    return () => {
      isMounted.current = false;
      activeListeners.get(url)?.delete(listener);
    };
  }, [url, ttlMs, fetchData]);

  // Real-time Supabase Table Subscription
  useEffect(() => {
    if (!options?.realtimeTable) return;
    const table = options.realtimeTable;

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          // Trigger instant background reload when any change occurs in Supabase
          fetchData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options?.realtimeTable, fetchData]);

  const mutate = useCallback(
    (updater: T | ((prev: T | null) => T), shouldRevalidate = true) => {
      if (!url) return;
      const next = typeof updater === "function" ? (updater as any)(data) : updater;
      setData(next);
      setCachedData(url, next);
      if (shouldRevalidate) {
        fetchData(true);
      }
    },
    [url, data, fetchData]
  );

  return {
    data,
    isLoading,
    isRefreshing,
    mutate,
    refresh: () => fetchData(false),
  };
}
