
type CacheEntry<T> = {
  data: T;
  expiry: number;
};

class AppCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 60000; // 1 minute default

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('app_persistent_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([key, value]) => {
          this.cache.set(key, value as CacheEntry<any>);
        });
      }
    } catch (e) {
      console.warn("Failed to load cache from storage", e);
    }
  }

  private syncToStorage() {
    try {
      const obj: Record<string, CacheEntry<any>> = {};
      this.cache.forEach((value, key) => {
        // Only persist if not expired
        if (Date.now() < value.expiry) {
          obj[key] = value;
        }
      });
      localStorage.setItem('app_persistent_cache', JSON.stringify(obj));
    } catch (e) {
      console.warn("Failed to sync cache to storage", e);
    }
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    const expiry = Date.now() + (ttlMs ?? this.defaultTTL);
    this.cache.set(key, { data, expiry });
    this.syncToStorage();
    console.debug(`[Cache] SET: ${key} (TTL: ${(ttlMs ?? this.defaultTTL) / 1000}s)`);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      console.debug(`[Cache] MISS: ${key}`);
      return null;
    }

    if (Date.now() > entry.expiry) {
      console.debug(`[Cache] EXPIRED: ${key}`);
      this.cache.delete(key);
      this.syncToStorage();
      return null;
    }

    console.debug(`[Cache] HIT: ${key}`);
    return entry.data as T;
  }

  delete(key: string): void {
    console.debug(`[Cache] INVALIDATE: ${key}`);
    this.cache.delete(key);
    this.syncToStorage();
  }

  clear(): void {
    console.debug(`[Cache] CLEAR ALL`);
    this.cache.clear();
    localStorage.removeItem('app_persistent_cache');
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const appCache = new AppCache();
