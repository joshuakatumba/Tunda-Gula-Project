/**
 * TundaGula — API Client
 *
 * Thin wrapper around fetch that:
 *  - Reads VITE_API_URL from environment
 *  - Attaches the auth token from localStorage
 *  - Handles 401 (auto-logout)
 *  - Provides typed get/post/patch/delete helpers
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/api/v1";

/** Callback set by AuthContext to clear session on 401 */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T = any>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("tg_token");

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

  // Auto-logout on 401
  if (res.status === 401) {
    localStorage.removeItem("tg_token");
    if (onUnauthorized) onUnauthorized();
    throw new Error("Unauthorized");
  }

  // No content
  if (res.status === 204) return {} as T;

  const data = await res.json();

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
};
