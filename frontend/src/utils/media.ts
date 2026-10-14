/**
 * Utility to resolve media URLs across different environments.
 * Handles relative media paths, docker hostnames, and missing port numbers.
 */

const API_URL = import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? "" : "http://localhost:8000");
export const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  const str = String(url).trim();
  if (!str) return null;

  // Local object URLs or base64 data URLs
  if (str.startsWith("blob:") || str.startsWith("data:")) {
    return str;
  }

  // Any media path with /media/ (including http://localhost:8000/media/... or http://localhost/media/...)
  const mediaIdx = str.indexOf("/media/");
  if (mediaIdx !== -1) {
    const relativePath = str.slice(mediaIdx);
    return API_ORIGIN ? `${API_ORIGIN}${relativePath}` : relativePath;
  }

  // Relative paths
  if (str.startsWith("media/")) {
    return API_ORIGIN ? `${API_ORIGIN}/${str}` : `/${str}`;
  }

  // Django relative upload_to paths (e.g. "listings/thumbnails/1.jpg")
  if (str.startsWith("listings/")) {
    return API_ORIGIN ? `${API_ORIGIN}/media/${str}` : `/media/${str}`;
  }

  return str;
}
