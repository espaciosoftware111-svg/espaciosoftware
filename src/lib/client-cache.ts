/**
 * Client-Side In-Memory Cache for ESPACIO OS
 * Provides instantaneous page rendering (0ms), Stale-While-Revalidate caching,
 * and automatic deduplication across sidebar route navigations.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ClientCache {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlight = new Map<string, Promise<any>>();
  private defaultTTL = 2 * 60 * 1000; // 2 minutes default TTL

  /**
   * Get cached data if available
   */
  public get<T>(key: string): { data: T; isStale: boolean } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isStale = Date.now() - entry.timestamp > entry.ttl;
    return { data: entry.data as T, isStale };
  }

  /**
   * Get immediate data synchronously or null
   */
  public getImmediate<T>(key: string): T | null {
    const entry = this.cache.get(key);
    return entry ? (entry.data as T) : null;
  }

  /**
   * Set cached data with TTL
   */
  public set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate cache keys matching prefix or specific key
   */
  public invalidate(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix) || key.includes(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Fetch with client caching, background revalidation, and promise deduplication.
   * Supports either (url, options) or (key, customFetcher, options).
   */
  public async fetchWithCache<T>(
    keyOrUrl: string,
    fetcherOrOptions?: (() => Promise<T>) | {
      ttl?: number;
      ttlMs?: number;
      forceFresh?: boolean;
      forceRefresh?: boolean;
      onBackgroundUpdate?: (data: T) => void;
    },
    extraOptions?: {
      ttl?: number;
      ttlMs?: number;
      forceFresh?: boolean;
      forceRefresh?: boolean;
      onBackgroundUpdate?: (data: T) => void;
    }
  ): Promise<T> {
    const isCustomFetcher = typeof fetcherOrOptions === "function";
    const customFetcher = isCustomFetcher ? (fetcherOrOptions as () => Promise<T>) : null;
    const options = isCustomFetcher ? extraOptions : (fetcherOrOptions as any);

    const ttl = options?.ttlMs ?? options?.ttl ?? this.defaultTTL;
    const forceFresh = options?.forceRefresh ?? options?.forceFresh ?? false;
    const onBackgroundUpdate = options?.onBackgroundUpdate;

    // 1. Check existing cache
    if (!forceFresh) {
      const cached = this.get<T>(keyOrUrl);
      if (cached) {
        if (cached.isStale && !customFetcher) {
          this.revalidateInBackground<T>(keyOrUrl, ttl, onBackgroundUpdate);
        }
        return cached.data;
      }
    }

    // 2. Deduplicate in-flight requests
    if (this.inFlight.has(keyOrUrl)) {
      return this.inFlight.get(keyOrUrl) as Promise<T>;
    }

    const fetchPromise = (async () => {
      try {
        if (customFetcher) {
          const data = await customFetcher();
          this.set<T>(keyOrUrl, data, ttl);
          return data;
        } else {
          const res = await fetch(keyOrUrl);
          if (!res.ok) {
            throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
          }
          const json = await res.json();
          this.set<T>(keyOrUrl, json, ttl);
          return json as T;
        }
      } finally {
        this.inFlight.delete(keyOrUrl);
      }
    })();

    this.inFlight.set(keyOrUrl, fetchPromise);
    return fetchPromise;
  }

  private async revalidateInBackground<T>(
    url: string,
    ttl: number,
    onBackgroundUpdate?: (data: T) => void
  ): Promise<void> {
    if (this.inFlight.has(url)) return;

    try {
      const fetchPromise = fetch(url).then(async (res) => {
        if (!res.ok) return;
        const json = await res.json();
        this.set<T>(url, json, ttl);
        if (onBackgroundUpdate) {
          onBackgroundUpdate(json as T);
        }
      });
      this.inFlight.set(url, fetchPromise);
      await fetchPromise;
    } catch {
      // Quiet background revalidation error handling
    } finally {
      this.inFlight.delete(url);
    }
  }
}

export const clientCache = new ClientCache();
