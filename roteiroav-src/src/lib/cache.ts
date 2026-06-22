type CacheItem<T> = {
  value: T;
  expiry: number;
};

class SimpleCache {
  private cache: Map<string, CacheItem<any>> = new Map();

  set<T>(key: string, value: T, ttlMs: number): void {
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { value, expiry });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const memoryCache = new SimpleCache();
