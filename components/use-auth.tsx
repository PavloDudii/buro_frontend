"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getMe, login as loginRequest, refresh as refreshRequest, register as registerRequest, setRefresher } from "@/lib/api";
import type { AuthResponse, User } from "@/lib/types";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (input: { email: string; fullName: string; password: string }) => Promise<AuthResponse>;
  logout: () => void;
  requireToken: () => string;
};

const AuthContext = createContext<AuthState | null>(null);
const REFRESH_KEY = "buro.refreshToken";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setRefresher(async () => {
      const rt = sessionStorage.getItem(REFRESH_KEY);
      if (!rt) throw new Error("No refresh token");
      const auth = await refreshRequest(rt);
      sessionStorage.setItem(REFRESH_KEY, auth.refresh_token);
      setAccessToken(auth.access_token);
      setUser(auth.user);
      return auth.access_token;
    });
    return () => setRefresher(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const refreshToken = sessionStorage.getItem(REFRESH_KEY);
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const auth = await refreshRequest(refreshToken);
        if (cancelled) {
          return;
        }
        sessionStorage.setItem(REFRESH_KEY, auth.refresh_token);
        setAccessToken(auth.access_token);
        setUser(auth.user);

        const currentUser = await getMe(auth.access_token);
        if (!cancelled) {
          setUser(currentUser);
        }
      } catch {
        sessionStorage.removeItem(REFRESH_KEY);
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      accessToken,
      isLoading,
      login: async (email: string, password: string) => {
        const auth = await loginRequest(email, password);
        sessionStorage.setItem(REFRESH_KEY, auth.refresh_token);
        setAccessToken(auth.access_token);
        setUser(auth.user);
        return auth;
      },
      register: async (input: { email: string; fullName: string; password: string }) => {
        const auth = await registerRequest(input);
        sessionStorage.setItem(REFRESH_KEY, auth.refresh_token);
        setAccessToken(auth.access_token);
        setUser(auth.user);
        return auth;
      },
      logout: () => {
        sessionStorage.removeItem(REFRESH_KEY);
        setAccessToken(null);
        setUser(null);
      },
      requireToken: () => {
        if (!accessToken) {
          throw new Error("Authentication token is missing.");
        }
        return accessToken;
      },
    }),
    [accessToken, isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
