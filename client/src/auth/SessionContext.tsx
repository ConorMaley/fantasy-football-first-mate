import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { apiGet, apiPost, configureApiClient, isNativePlatform } from "../api/client";

const REFRESH_TOKEN_KEY = "first_mate_refresh_token";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  emailVerified: boolean;
}

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthResponse {
  user: SessionUser;
  accessToken: string;
  refreshToken?: string;
}

interface SessionContextValue {
  status: SessionStatus;
  user: SessionUser | null;
  applySession: (auth: AuthResponse) => Promise<void>;
  setUser: (user: SessionUser) => void;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function platformBody(): Record<string, unknown> {
  return { platform: isNativePlatform ? "native" : "web" };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUserState] = useState<SessionUser | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  const clearSession = useCallback(async () => {
    accessTokenRef.current = null;
    if (isNativePlatform) {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
    setUserState(null);
    setStatus("unauthenticated");
  }, []);

  const applySession = useCallback(async (auth: AuthResponse) => {
    accessTokenRef.current = auth.accessToken;
    if (isNativePlatform && auth.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, auth.refreshToken);
    }
    setUserState(auth.user);
    setStatus("authenticated");
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const body = platformBody();
      if (isNativePlatform) {
        const stored = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (!stored) {
          await clearSession();
          return null;
        }
        body.refreshToken = stored;
      }

      const response = await apiPost<{ accessToken: string; refreshToken?: string }>("/auth/refresh", body, {
        skipAuth: true,
      });
      accessTokenRef.current = response.accessToken;
      if (isNativePlatform && response.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refreshToken);
      }
      return response.accessToken;
    } catch {
      await clearSession();
      return null;
    }
  }, [clearSession]);

  useEffect(() => {
    configureApiClient({ getAccessToken: () => accessTokenRef.current, refreshAccessToken });
  }, [refreshAccessToken]);

  useEffect(() => {
    (async () => {
      const token = await refreshAccessToken();
      if (!token) {
        setStatus("unauthenticated");
        return;
      }
      try {
        const me = await apiGet<{ user: SessionUser }>("/auth/me");
        setUserState(me.user);
        setStatus("authenticated");
      } catch {
        await clearSession();
      }
    })();
  }, [refreshAccessToken, clearSession]);

  const logout = useCallback(async () => {
    try {
      const body = platformBody();
      if (isNativePlatform) {
        body.refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      }
      await apiPost("/auth/logout", body, { skipAuth: true });
    } finally {
      await clearSession();
    }
  }, [clearSession]);

  const setUser = useCallback((next: SessionUser) => setUserState(next), []);

  const value = useMemo<SessionContextValue>(
    () => ({ status, user, applySession, setUser, logout }),
    [status, user, applySession, setUser, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
