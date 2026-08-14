/**
 * TundaGula — Auth Context
 *
 * Provides authentication state + methods to the entire app.
 *
 * Usage:
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 *
 *   const { user, login, register, logout, loading } = useAuth();
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setUnauthorizedHandler } from "../api/client";
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
  verifyOtp: (phone: string, code: string) => Promise<{ token?: string; user?: UserSession; verified?: boolean }>;
  /** Register a new account (returns token + user) */
  register: (data: Record<string, any>) => Promise<void>;
  /** Set session from a token + user response (used after verify/register) */
  setSession: (token: string, user: UserSession) => void;
  /** Log out — clears token and user */
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("tg_token");
    setUser(null);
  }, []);

  // Wire up the 401 handler
  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  // On mount, check for existing token → restore session
  useEffect(() => {
    const token = localStorage.getItem("tg_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api.get<UserSession>(ENDPOINTS.me)
      .then((profile) => setUser(profile))
      .catch(() => {
        localStorage.removeItem("tg_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const requestOtp = async (phone: string) => {
    return api.post(ENDPOINTS.requestOtp, { phone });
  };

  const verifyOtp = async (phone: string, code: string) => {
    const res = await api.post(ENDPOINTS.verifyOtp, { phone, code });
    if (res.token && res.user) {
      localStorage.setItem("tg_token", res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (data: Record<string, any>) => {
    const res = await api.post(ENDPOINTS.register, data);
    if (res.token && res.user) {
      localStorage.setItem("tg_token", res.token);
      setUser(res.user);
    }
  };

  const setSession = (token: string, userData: UserSession) => {
    localStorage.setItem("tg_token", token);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, requestOtp, verifyOtp, register, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
