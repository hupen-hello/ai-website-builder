"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearUserActiveSiteId } from "@/lib/migrateGuestSite";
import {
  clearPersistedUserStateLocal,
  hydratePersistedUserState,
  resetUserStateHydration,
} from "@/lib/userStateSync";
import { syncOnboardingContactToProfile } from "@/lib/syncOnboardingContactToProfile";
import { consumeWelcomePending } from "@/lib/welcomeSignup";
import { showAppAlert } from "@/lib/confirmDialog";
import { claimLocalCreateAiDesigns } from "@/lib/create-ai-design-sync";

function afterAuthHydrate(userId?: string | null) {
  void hydratePersistedUserState(userId || undefined).catch(() => undefined);
  void claimLocalCreateAiDesigns().catch(() => undefined);
}

export type UserAccount = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  gender?: string | null;
  birthday?: string | null;
  phone?: string | null;
  nationality?: string | null;
  location?: string | null;
  address?: string | null;
};

type ProfileUpdateInput = {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  gender?: string | null;
  birthday?: string | null;
  phone?: string | null;
  nationality?: string | null;
  location?: string | null;
  address?: string | null;
  currentPassword?: string;
  newPassword?: string;
};

type UserAuthContextValue = {
  user: UserAccount | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  requestOtp: (email: string) => Promise<void>;
  loginWithOtp: (email: string, code: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  logout: () => Promise<void>;
};

const UserAuthContext = createContext<UserAuthContextValue | null>(null);

async function applyOnboardingContact(
  account: UserAccount | null,
  setUser: (user: UserAccount | null) => void,
) {
  if (!account) return;
  const next = await syncOnboardingContactToProfile(account);
  if (next) setUser(next);
}

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/user/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setUser(null);
        resetUserStateHydration();
        return;
      }
      const data = (await res.json()) as UserAccount;
      setUser(data);
      afterAuthHydrate(data.id);
      void applyOnboardingContact(data, setUser);
    } catch {
      setUser(null);
      resetUserStateHydration();
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  useEffect(() => {
    if (loading || !user) return;
    if (typeof window !== "undefined" && window.location.pathname === "/auth") {
      return;
    }
    if (!consumeWelcomePending()) return;
    const firstName = user.name?.trim().split(/\s+/)[0];
    void showAppAlert({
      title: firstName ? `Welcome, ${firstName}` : "Welcome to Lestow",
      text: "Your account is ready. Start building your first website anytime.",
      icon: "success",
      confirmButtonText: "Let's go",
    });
  }, [loading, user]);

  const requestOtp = useCallback(async (email: string) => {
    const res = await fetch("/api/user/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Unable to send code");
    }
  }, []);

  const loginWithOtp = useCallback(async (email: string, code: string) => {
    const res = await fetch("/api/user/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Invalid code");
    }
    setUser(data.user ?? null);
    afterAuthHydrate(data.user?.id);
    void applyOnboardingContact(data.user ?? null, setUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/user/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }
      setUser(data.user ?? null);
      afterAuthHydrate(data.user?.id);
      void applyOnboardingContact(data.user ?? null, setUser);
    },
    [],
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const res = await fetch("/api/user/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }
      setUser(data.user ?? null);
      afterAuthHydrate(data.user?.id);
      void applyOnboardingContact(data.user ?? null, setUser);
    },
    [],
  );

  const logout = useCallback(async () => {
    await fetch("/api/user/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    resetUserStateHydration();
    clearPersistedUserStateLocal();
    clearUserActiveSiteId();
  }, []);

  const updateProfile = useCallback(async (input: ProfileUpdateInput) => {
    const res = await fetch("/api/user/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Unable to update profile");
    }
    setUser(data.user ?? null);
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    const res = await fetch("/api/user/auth/avatar", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Unable to upload avatar");
    }
    setUser(data.user ?? null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshUser,
      login,
      requestOtp,
      loginWithOtp,
      register,
      updateProfile,
      uploadAvatar,
      logout,
    }),
    [
      user,
      loading,
      refreshUser,
      login,
      requestOtp,
      loginWithOtp,
      register,
      updateProfile,
      uploadAvatar,
      logout,
    ],
  );

  return (
    <UserAuthContext.Provider value={value}>{children}</UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) {
    throw new Error("useUserAuth must be used within UserAuthProvider");
  }
  return ctx;
}

export function useOptionalUserAuth() {
  return useContext(UserAuthContext);
}
