/**
 * In-memory TTL cache for DLD API responses.
 * Resets on cold start — acceptable for Vercel serverless.
 * Avoids hammering the DLD gateway on repeated identical queries.
 */

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

export function cacheKey(endpoint: string, params: Record<string, string>): string {
  // Stable key regardless of object property order
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return `${endpoint}:${sorted}`;
}

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached(key: string, data: unknown, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// TTL constants (ms)
export const TTL = {
  TRANSACTIONS:  6  * 60 * 60 * 1000,  // 6 hours  — transactions change daily
  RENTS:         6  * 60 * 60 * 1000,  // 6 hours
  AREAS:         7  * 24 * 60 * 60 * 1000, // 7 days — area list rarely changes
  RENTAL_INDEX:  24 * 60 * 60 * 1000,  // 24 hours — quarterly data, but refresh daily
  BUILDINGS:     24 * 60 * 60 * 1000,  // 24 hours
};
