/**
 * TundaGula — API Client
 *
 * Thin wrapper around fetch that:
 *  - Reads VITE_API_URL from environment
 *  - Attaches the auth token from localStorage
 *  - Handles 401 (auto-refresh on token_expired, otherwise logout)
 *  - Provides typed get/post/patch/delete helpers
 */

const API_URL = import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? "/api/v1" : "http://localhost:8000/api/v1");

/** Callback set by AuthContext to clear session on 401 */
let onUnauthorized: (() => void) | null = null;
/** Callback set by AuthContext to refresh token */
let onTokenRefresh: (() => Promise<boolean>) | null = null;

/** Flag to prevent infinite refresh loops */
let isRefreshing = false;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export function setTokenRefreshHandler(handler: () => Promise<boolean>) {
  onTokenRefresh = handler;
}

/** Public endpoints: must never carry a (possibly stale) auth token */
const PUBLIC_PATHS = ["/accounts/login/", "/accounts/register/", "/accounts/otp/request/", "/accounts/otp/verify/", "/market/prices/"];

async function request<T = any>(path: string, options?: RequestInit): Promise<T> {
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
  const token = isPublic ? null : localStorage.getItem("tg_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string> ?? {}),
    },
  });

  // Handle 401 — distinguish expired vs invalid
  if (res.status === 401) {
    const data = await res.json().catch(() => ({}));

    // If token expired and we have a refresh handler, try to refresh once
    if (data.code === "token_expired" && onTokenRefresh && !isRefreshing) {
      isRefreshing = true;
      const refreshed = await onTokenRefresh();
      isRefreshing = false;

      if (refreshed) {
        // Retry the original request with the new token
        return request<T>(path, options);
      }
    }

    // Refresh failed or token is invalid — log out
    localStorage.removeItem("tg_token");
    localStorage.removeItem("tg_token_expires_at");
    if (onUnauthorized) onUnauthorized();
    throw new Error("Unauthorized");
  }

  // No content
  if (res.status === 204) return {} as T;

  const contentType = res.headers.get("content-type") || "";
  let data: any = {};

  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = {};
    }
  } else {
    if (!res.ok) {
      const err: any = new Error(`Server returned ${res.status}: ${res.statusText || "Service unavailable"}`);
      err.status = res.status;
      throw err;
    }
  }

  if (!res.ok) {
    const err: any = new Error(data.detail || data.error || "Request failed");
    err.data = data;
    err.status = res.status;
    throw err;
  }

  return data as T;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),

  post: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),

  patch: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),

  delete: <T = any>(path: string) =>
    request<T>(path, { method: "DELETE" }),

  /** Download an authenticated file (e.g. CSV) and trigger a browser save. */
  download: async (path: string, filename: string) => {
    const token = localStorage.getItem("tg_token");
    const res = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Token ${token}` } : {},
    });
    if (!res.ok) throw new Error(res.status === 403 ? "You are not allowed to export this." : "Export failed. Please try again.");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
