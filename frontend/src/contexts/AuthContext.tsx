import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getStoredToken, setToken } from "@/src/lib/api";

export type User = {
  user_id: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
  mobile?: string | null;
  city?: string | null;
  state?: string | null;
  occupation?: string | null;
  employment_type?: string | null;
  dob?: string | null;
  gender?: string | null;
  pan?: string | null;
  aadhaar?: string | null;
  monthly_income?: number | null;
  company_name?: string | null;
  business_name?: string | null;
  preferred_language?: string | null;
  marital_status?: string | null;
  existing_loan?: boolean | null;
  cibil_score?: number | null;
  onboarded?: boolean;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signInWithOtp: (mobile: string, code: string, extra?: { name?: string; email?: string; referral_code?: string }) => Promise<User>;
  signInWithGoogleSession: (session_id: string) => Promise<User>;
  refresh: () => Promise<User | null>;
  updateProfile: (patch: Partial<User>) => Promise<User>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<User | null> => {
    try {
      const tok = await getStoredToken();
      if (!tok) { setUser(null); return null; }
      const me = await api.get<User>("/auth/me");
      setUser(me);
      return me;
    } catch (e: any) {
      if (e?.status === 401) await setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => { await refresh(); setLoading(false); })();
  }, [refresh]);

  const signInWithOtp = async (mobile: string, code: string, extra?: { name?: string; email?: string; referral_code?: string }) => {
    const res = await api.post<{ session_token: string; user: User }>("/auth/otp/verify", { mobile, code, ...extra });
    await setToken(res.session_token);
    setUser(res.user);
    return res.user;
  };

  const signInWithGoogleSession = async (session_id: string) => {
    const res = await api.post<{ session_token: string; user: User }>("/auth/google/session", { session_id });
    await setToken(res.session_token);
    setUser(res.user);
    return res.user;
  };

  const updateProfile = async (patch: Partial<User>) => {
    const u = await api.put<User>("/me/profile", patch);
    setUser(u);
    return u;
  };

  const signOut = async () => {
    try { await api.post("/auth/logout"); } catch {}
    await setToken(null);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, signInWithOtp, signInWithGoogleSession, refresh, updateProfile, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AuthProvider missing");
  return v;
}
