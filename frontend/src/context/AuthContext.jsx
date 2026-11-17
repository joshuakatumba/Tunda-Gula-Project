import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setUnauthorizedHandler, setTokenRefreshHandler } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
const AuthContext = createContext(null);
function saveSession(token, expiresAt) {
  localStorage.setItem("tg_token", token);
  if (expiresAt) {
    localStorage.setItem("tg_token_expires_at", expiresAt);
  }
}
function clearSession() {
  localStorage.removeItem("tg_token");
  localStorage.removeItem("tg_token_expires_at");
}
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const logout = useCallback(() => {
    const token = localStorage.getItem("tg_token");
    if (token) {
      api.post(ENDPOINTS.logout).catch(() => {
      });
    }
    clearSession();
    setUser(null);
  }, []);
  const logoutAll = useCallback(async () => {
    try {
      await api.post(ENDPOINTS.logoutAll);
    } catch {
    }
    clearSession();
    setUser(null);
  }, []);
  const refreshToken = useCallback(async () => {
    try {
      const res = await api.post(ENDPOINTS.refreshToken);
      if (res.token) {
        saveSession(res.token, res.expires_at);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);
  useEffect(() => {
    setUnauthorizedHandler(logout);
    setTokenRefreshHandler(refreshToken);
  }, [logout, refreshToken]);
  useEffect(() => {
    const token = localStorage.getItem("tg_token");
    if (!token) {
      setLoading(false);
      return;
    }
    const expiresAt = localStorage.getItem("tg_token_expires_at");
    if (expiresAt && new Date(expiresAt) < /* @__PURE__ */ new Date()) {
      refreshToken().then((refreshed) => {
        if (refreshed) {
          api.get(ENDPOINTS.me).then((profile) => setUser(profile)).catch(() => clearSession()).finally(() => setLoading(false));
        } else {
          clearSession();
          setLoading(false);
        }
      });
      return;
    }
    api.get(ENDPOINTS.me).then((profile) => setUser(profile)).catch(() => {
      clearSession();
    }).finally(() => setLoading(false));
  }, []);
  const login = async (identifier, password) => {
    const res = await api.post(ENDPOINTS.login, { email: identifier, password });
    if (res.token && res.user) {
      saveSession(res.token, res.expires_at);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.error || "Login failed");
  };
  const requestOtp = async (phone) => {
    return api.post(ENDPOINTS.requestOtp, { phone });
  };
  const verifyOtp = async (phone, code) => {
    const res = await api.post(ENDPOINTS.verifyOtp, { phone, code });
    if (res.token && res.user) {
      saveSession(res.token, res.expires_at);
      setUser(res.user);
    }
    return res;
  };
  const register = async (data) => {
    const res = await api.post(ENDPOINTS.register, data);
    if (res.token && res.user) {
      saveSession(res.token, res.expires_at);
      setUser(res.user);
    }
  };
  const googleLogin = async (credential, extra = {}) => {
    const res = await api.post(ENDPOINTS.google, { credential, ...extra });
    if (res.token && res.user) {
      saveSession(res.token, res.expires_at);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.error || "Google sign-in failed");
  };
  const setSession = (token, userData, expiresAt) => {
    saveSession(token, expiresAt);
    setUser(userData);
  };
  return <AuthContext.Provider value={{ user, session: user, loading, login, googleLogin, requestOtp, verifyOtp, register, setSession, logout, logoutAll }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
