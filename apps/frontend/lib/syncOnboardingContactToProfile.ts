import { readNewestOnboardingDraft } from "@/lib/onboardingDraft";
import { normalizeIndianPhone } from "@/lib/userProfileExtras";

export type ProfileContactSnapshot = {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
};

export type OnboardingContactPrefill = {
  email: string;
  name: string;
  mobile: string;
  address: string;
};

type PendingContact = {
  mobile?: string;
  address?: string;
  name?: string;
};

const SYNCED_KEY_PREFIX = "css-onboarding-contact-synced:";
const PENDING_KEY_PREFIX = "css-onboarding-contact-pending:";

function syncedKey(userId: string) {
  return `${SYNCED_KEY_PREFIX}${userId}`;
}

function pendingKey(userId: string) {
  return `${PENDING_KEY_PREFIX}${userId}`;
}

function readPendingContact(userId: string): PendingContact | null {
  try {
    const raw = sessionStorage.getItem(pendingKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingContact;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writePendingContact(userId: string, pending: PendingContact) {
  try {
    sessionStorage.setItem(pendingKey(userId), JSON.stringify(pending));
  } catch {
    /* ignore */
  }
}

function clearPendingContact(userId: string) {
  try {
    sessionStorage.removeItem(pendingKey(userId));
  } catch {
    /* ignore */
  }
}

/** Prefill signup/login forms from the onboarding draft. */
export function getOnboardingContactPrefill(): OnboardingContactPrefill {
  const info = readNewestOnboardingDraft()?.businessInfo;
  return {
    email: info?.email?.trim() || "",
    name: info?.name?.trim() || "",
    mobile: info?.mobile?.trim() || "",
    address: info?.address?.trim() || "",
  };
}

/**
 * Copy onboarding Email / Mobile / Address into the user profile after signup
 * or login. Auth email is never overwritten (it is the login identity).
 * Empty profile slots are filled only — existing phone/address/name stay.
 */
export async function syncOnboardingContactToProfile<
  T extends ProfileContactSnapshot,
>(user: T | null | undefined): Promise<T | null> {
  if (!user?.id || typeof window === "undefined") return null;

  try {
    if (sessionStorage.getItem(syncedKey(user.id))) return null;
  } catch {
    /* ignore */
  }

  const info = readNewestOnboardingDraft()?.businessInfo;
  const pending = readPendingContact(user.id);
  const mobile = (info?.mobile || pending?.mobile || "").trim();
  const address = (info?.address || pending?.address || "").trim();
  const name = (info?.name || pending?.name || "").trim();

  // Keep a pending copy so publish can clear the onboarding draft without
  // losing contact fields if the first PATCH fails.
  if (mobile || address || name) {
    writePendingContact(user.id, { mobile, address, name });
  }

  if (!mobile && !address && !name && !info && !pending) return null;

  const patch: {
    phone?: string;
    address?: string;
    name?: string;
  } = {};

  if (mobile && !user.phone?.trim()) {
    patch.phone = normalizeIndianPhone(mobile) || mobile;
  }
  if (address && !user.address?.trim()) {
    patch.address = address;
  }
  if (name && !user.name?.trim()) {
    patch.name = name;
  }

  if (!Object.keys(patch).length) {
    try {
      sessionStorage.setItem(syncedKey(user.id), "1");
    } catch {
      /* ignore */
    }
    clearPendingContact(user.id);
    return null;
  }

  try {
    const res = await fetch("/api/user/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(patch),
    });
    const data = (await res.json().catch(() => ({}))) as {
      user?: T;
      message?: string;
    };
    if (!res.ok || !data.user) return null;

    try {
      sessionStorage.setItem(syncedKey(user.id), "1");
    } catch {
      /* ignore */
    }
    clearPendingContact(user.id);
    return data.user;
  } catch {
    return null;
  }
}
