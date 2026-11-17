const API_URL = import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? "" : "http://localhost:8000");
export const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");
export function resolveMediaUrl(url) {
  if (!url) return null;
  const str = String(url).trim();
  if (!str) return null;
  if (str.startsWith("blob:") || str.startsWith("data:")) {
    return str;
  }
  const mediaIdx = str.indexOf("/media/");
  if (mediaIdx !== -1) {
    const relativePath = str.slice(mediaIdx);
    return API_ORIGIN ? `${API_ORIGIN}${relativePath}` : relativePath;
  }
  if (str.startsWith("media/")) {
    return API_ORIGIN ? `${API_ORIGIN}/${str}` : `/${str}`;
  }
  if (str.startsWith("listings/")) {
    return API_ORIGIN ? `${API_ORIGIN}/media/${str}` : `/media/${str}`;
  }
  return str;
}
