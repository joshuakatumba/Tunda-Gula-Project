import { api } from "../api/client";
const cache = /* @__PURE__ */ new Map();
export async function getCached(path, ttlMs = 6e4) {
  const entry = cache.get(path);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data;
  }
  const data = await api.get(path);
  cache.set(path, { data, expiresAt: Date.now() + ttlMs });
  return data;
}
export function invalidateCache(path) {
  cache.delete(path);
}
export function invalidateCachePrefix(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
export function clearCache() {
  cache.clear();
}
