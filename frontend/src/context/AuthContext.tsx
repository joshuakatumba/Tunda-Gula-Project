/**
 * TundaGula — Auth Context
 *
 * Provides authentication state + methods to the entire app.
 * Supports token expiry, silent refresh, and multi-device logout.
 *
 * Usage:
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 *
 *   const { user, login, register, logout, logoutAll, loading } = useAuth();
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setUnauthorizedHandler, setTokenRefreshHandler } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

export interface UserSession {
  id: number;
  phone: string;
  name: string;
  role: "buyer" | "seller" | "admin";
  seller_type: string;
  buyer_type: string;
  district: string;
  is_verified: boolean;
  date_joined: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  /** Request an OTP code for a phone number */
  requestOtp: (phone: string) => Promise<{ message: string }>;
  /** Verify an OTP and get back a token + user (or verified flag for new users) */
  verifyOtp: (phone: string, code: string) => Promise<{ token?: string; user?: UserSession; verified?: boolean; verification_token?: string; expires_at?: string }>;
  /** Register a new account (returns token + user) */
  register: (data: Record<string, any>) => Promise<void>;
  /** Set session from a token + user response (used after verify/register) */
  setSession: (token: string, user: UserSession, expiresAt?: string) => void;
  /** Log out — clears token on current device */
  logout: () => void;
  /** Log out from all devices */
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Save session data to localStorage */
function saveSession(token: string, expiresAt?: string) {
  localStorage.setItem("tg_token", token);
  if (expiresAt) {
    localStorage.setItem("tg_token_expires_at", expiresAt);
  }
}

/** Clear all session data from localStorage */
function clearSession() {
  localStorage.removeItem("tg_token");
  localStorage.removeItem("tg_token_expires_at");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    // Fire-and-forget server logout (best-effort — don't block UI)
    const token = localStorage.getItem("tg_token");
    if (token) {
      api.post(ENDPOINTS.logout).catch(() => {});
    }
    clearSession();
    setUser(null);
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await api.post(ENDPOINTS.logoutAll);
    } catch {
      // Even if server call fails, clear local session
    }
    clearSession();
    setUser(null);
  }, []);

  // Refresh the token silently — called by api/client.ts on token_expired
  const refreshToken = useCallback(async (): Promise<boolean> => {
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

  // Wire up the 401 handler and refresh handler
  useEffect(() => {
    setUnauthorizedHandler(logout);
    setTokenRefreshHandler(refreshToken);
  }, [logout, refreshToken]);

  // On mount, check for existing token → restore session
  useEffect(() => {
    const token = localStorage.getItem("tg_token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Check if token has expired locally before making a network call
    const expiresAt = localStorage.getItem("tg_token_expires_at");
    if (expiresAt && new Date(expiresAt) < new Date()) {
      // Token expired — try to refresh it
      refreshToken().then((refreshed) => {
        if (refreshed) {
          // Token refreshed — now fetch profile
          api.get<UserSession>(ENDPOINTS.me)
            .then((profile) => setUser(profile))
            .catch(() => clearSession())
            .finally(() => setLoading(false));
        } else {
          clearSession();
          setLoading(false);
        }
      });
      return;
    }

    // Token looks valid — try to fetch profile
    api.get<UserSession>(ENDPOINTS.me)
      .then((profile) => setUser(profile))
      .catch(() => {
        clearSession();
      })
      .finally(() => setLoading(false));
  }, []);

  const requestOtp = async (phone: string) => {
    return api.post(ENDPOINTS.requestOtp, { phone });
  };

  const verifyOtp = async (phone: string, code: string) => {
    const res = await api.post(ENDPOINTS.verifyOtp, { phone, code });
    if (res.token && res.user) {
      saveSession(res.token, res.expires_at);
      setUser(res.user);
    }
    return res;
  };

  const register = async (data: Record<string, any>) => {
    const res = await api.post(ENDPOINTS.register, data);
    if (res.token && res.user) {
      saveSession(res.token, res.expires_at);
      setUser(res.user);
    }
  };

  const setSession = (token: string, userData: UserSession, expiresAt?: string) => {
    saveSession(token, expiresAt);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, requestOtp, verifyOtp, register, setSession, logout, logoutAll }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
