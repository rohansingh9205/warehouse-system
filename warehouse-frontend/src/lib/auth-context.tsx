"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "./api-client";
import type { CurrentUser } from "@/types";

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

const refresh = useCallback(async () => {
  try {
    const data = await api.get<{ user: CurrentUser }>("/auth/me");

    console.log("AUTH /me SUCCESS:", data);
    console.log("AUTH USER:", data.user);

    setUser(data.user);
  } catch (error) {
    console.error("AUTH /me FAILED:", error);
    setUser(null);
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
    }
    setUser(null);
    router.push("/login");
  }, [router]);

  return <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
