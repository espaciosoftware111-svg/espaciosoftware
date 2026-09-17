class ServerMemoryCache {
  private cache = new Map<string, { data: any; expiresAt: number }>();

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (item && item.expiresAt > Date.now()) {
      return item.data as T;
    }
    return null;
  }

  public set(key: string, data: any, ttlSeconds: number = 15): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  public invalidate(namespace: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(namespace)) {
        this.cache.delete(key);
      }
    }
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const serverCache = new ServerMemoryCache();
