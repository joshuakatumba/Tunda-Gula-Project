const API_URL = import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? "/api/v1" : "http://localhost:8000/api/v1");
let onUnauthorized = null;
let onTokenRefresh = null;
let isRefreshing = false;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}
export function setTokenRefreshHandler(handler) {
  onTokenRefresh = handler;
}
const PUBLIC_PATHS = ["/accounts/login/", "/accounts/google/", "/accounts/register/", "/accounts/otp/request/", "/accounts/otp/verify/", "/market/prices/"];
async function request(path, options) {
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
  const token = isPublic ? null : localStorage.getItem("tg_token");
  const headers = {
    "Content-Type": "application/json",
    ...token ? { Authorization: `Token ${token}` } : {}
  };
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers ?? {}
    }
  });
  if (res.status === 401 && !isPublic) {
    const data2 = await res.json().catch(() => ({}));
    if (data2.code === "token_expired" && onTokenRefresh && !isRefreshing) {
      isRefreshing = true;
      const refreshed = await onTokenRefresh();
      isRefreshing = false;
      if (refreshed) {
        return request(path, options);
      }
    }
    localStorage.removeItem("tg_token");
    localStorage.removeItem("tg_token_expires_at");
    if (onUnauthorized) onUnauthorized();
    throw new Error("Unauthorized");
  }
  if (res.status === 204) return {};
  const contentType = res.headers.get("content-type") || "";
  let data = {};
  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = {};
    }
  } else {
    if (!res.ok) {
      const err = new Error(`Server returned ${res.status}: ${res.statusText || "Service unavailable"}`);
      err.status = res.status;
      throw err;
    }
  }
  if (!res.ok) {
    const err = new Error(data.detail || data.error || "Request failed");
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}
export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: body ? JSON.stringify(body) : void 0 }),
  patch: (path, body) => request(path, { method: "PATCH", body: body ? JSON.stringify(body) : void 0 }),
  delete: (path) => request(path, { method: "DELETE" }),
  /** Download an authenticated file (e.g. CSV) and trigger a browser save. */
  download: async (path, filename) => {
    const token = localStorage.getItem("tg_token");
    const res = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Token ${token}` } : {}
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
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }
};
