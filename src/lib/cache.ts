type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string, maxAgeMs = 60_000): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > maxAgeMs) {
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}
