/**
 * TundaGula — Client-side API Response Cache
 *
 * Simple in-memory cache with TTL for GET requests.
 * Prevents redundant API calls for data that changes infrequently
 * (listings, categories, market prices).
 *
 * Usage:
 *   import { getCached, invalidateCache } from "../utils/apiCache";
 *   const listings = await getCached<Listing[]>("/api/listings/", 60000);
 */

import { api } from "../api/client";

interface CacheEntry<T = any> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Get data from cache or fetch from API.
 * @param path – API endpoint path
 * @param ttlMs – Cache duration in milliseconds (default: 60s)
 */
export async function getCached<T = any>(path: string, ttlMs = 60_000): Promise<T> {
  const entry = cache.get(path);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data as T;
  }

  const data = await api.get<T>(path);
  cache.set(path, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

/** Invalidate a specific cached entry */
export function invalidateCache(path: string): void {
  cache.delete(path);
}

/** Invalidate all entries matching a prefix */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/** Clear the entire cache */
export function clearCache(): void {
  cache.clear();
}
