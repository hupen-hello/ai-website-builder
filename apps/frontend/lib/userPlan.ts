import { queueUserStateSync } from "@/lib/userStateSync";
import { resolveEditorSiteId, setUserActiveSiteId } from "@/lib/migrateGuestSite";

export type UserPlanId = "starter" | "core";
export type UserPlanCycle = "monthly" | "yearly";

export type SiteSubscription = {
  siteId: string;
  siteTitle?: string;
  siteSlug?: string;
  planId: UserPlanId;
  cycle?: UserPlanCycle;
  paymentId?: string;
  orderId?: string;
  upgradedAt: string;
  expiresAt?: string;
};

/** @deprecated Account-level shape — migrated into per-site map on read. */
type LegacyUserSubscription = {
  planId: UserPlanId;
  cycle?: UserPlanCycle;
  paymentId?: string;
  orderId?: string;
  upgradedAt: string;
  expiresAt?: string;
};

type SiteSubscriptionMap = Record<string, SiteSubscription>;

const STORAGE_KEY = "css-ai-site-subscriptions";
const LEGACY_STORAGE_KEY = "css-ai-user-subscription";
const PENDING_CORE_KEY = "css-ai-pending-core-apply";

function starterSubscription(siteId: string): SiteSubscription {
  return {
    siteId,
    planId: "starter",
    upgradedAt: new Date(0).toISOString(),
  };
}

function isMockSubscription(subscription: {
  paymentId?: string;
  orderId?: string;
}) {
  return (
    subscription.paymentId?.startsWith("pay_mock_") ||
    subscription.orderId?.startsWith("order_mock_") ||
    false
  );
}

function isCoreActive(subscription: SiteSubscription | null | undefined) {
  if (!subscription || subscription.planId !== "core") return false;
  if (isMockSubscription(subscription)) return false;
  if (subscription.expiresAt) {
    return new Date(subscription.expiresAt).getTime() > Date.now();
  }
  return true;
}

function readRawSubscriptions(): SiteSubscriptionMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SiteSubscriptionMap;
    if (!parsed || typeof parsed !== "object") return {};
    const map: SiteSubscriptionMap = {};
    for (const [siteId, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") continue;
      map[siteId] = { ...value, siteId };
    }
    return map;
  } catch {
    return {};
  }
}

function readAllSubscriptions(): SiteSubscriptionMap {
  const cleaned: SiteSubscriptionMap = {};
  for (const [siteId, value] of Object.entries(readRawSubscriptions())) {
    if (isMockSubscription(value) || !isCoreActive(value)) continue;
    cleaned[siteId] = value;
  }
  return cleaned;
}

function writeAllSubscriptions(map: SiteSubscriptionMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  queueUserStateSync();
}

export function listSiteSubscriptions(): SiteSubscription[] {
  return Object.values(readAllSubscriptions());
}

export function getSiteSubscription(siteId: string): SiteSubscription {
  if (!siteId) return starterSubscription("");
  const stored = readAllSubscriptions()[siteId];
  if (!stored || !isCoreActive(stored)) {
    return starterSubscription(siteId);
  }
  return stored;
}

/** @deprecated Prefer getSiteSubscription(siteId). */
export function getUserSubscription(): SiteSubscription {
  const all = listSiteSubscriptions();
  const active = all.find((item) => isCoreActive(item));
  return active || starterSubscription("");
}

export function clearSiteSubscription(siteId: string) {
  if (!siteId) return;
  const map = readRawSubscriptions();
  delete map[siteId];
  writeAllSubscriptions(map);
}

export function clearUserSubscription() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function saveCoreSubscription(input: {
  siteId: string;
  siteTitle?: string;
  siteSlug?: string;
  cycle: UserPlanCycle;
  paymentId: string;
  orderId: string;
}) {
  if (!input.siteId) {
    throw new Error("A website is required to activate Core plan.");
  }

  const upgradedAt = new Date();
  const expiresAt = new Date(upgradedAt);
  if (input.cycle === "yearly") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  const subscription: SiteSubscription = {
    siteId: input.siteId,
    siteTitle: input.siteTitle,
    siteSlug: input.siteSlug,
    planId: "core",
    cycle: input.cycle,
    paymentId: input.paymentId,
    orderId: input.orderId,
    upgradedAt: upgradedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const map = readRawSubscriptions();
  map[input.siteId] = subscription;
  writeAllSubscriptions(map);
  setUserActiveSiteId(input.siteId);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("css-ai-plan-updated", {
        detail: { siteId: input.siteId, planId: "core" },
      }),
    );
  }
  return subscription;
}

export function stashPendingCoreApply(input: {
  siteId: string;
  siteTitle?: string;
  siteSlug?: string;
  cycle: UserPlanCycle;
  paymentId: string;
  orderId: string;
}) {
  if (typeof window === "undefined" || !input.siteId) return;
  const payload = JSON.stringify(input);
  sessionStorage.setItem(PENDING_CORE_KEY, payload);
  localStorage.setItem(PENDING_CORE_KEY, payload);
}

export function applyPendingCoreIfNeeded(preferredSiteId?: string) {
  if (typeof window === "undefined") return false;
  const raw =
    sessionStorage.getItem(PENDING_CORE_KEY) ||
    localStorage.getItem(PENDING_CORE_KEY);
  if (!raw) return false;
  try {
    const pending = JSON.parse(raw) as {
      siteId?: string;
      siteTitle?: string;
      siteSlug?: string;
      cycle?: UserPlanCycle;
      paymentId?: string;
      orderId?: string;
    };
    const siteId = pending.siteId?.trim() || preferredSiteId?.trim() || "";
    if (!siteId || !pending.paymentId || !pending.orderId) return false;
    if (!isCorePlanActive(siteId)) {
      saveCoreSubscription({
        siteId,
        siteTitle: pending.siteTitle,
        siteSlug: pending.siteSlug,
        cycle: pending.cycle === "yearly" ? "yearly" : "monthly",
        paymentId: pending.paymentId,
        orderId: pending.orderId,
      });
      return true;
    }
    sessionStorage.removeItem(PENDING_CORE_KEY);
    localStorage.removeItem(PENDING_CORE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function isCorePlanActive(siteId?: string) {
  if (!siteId) return false;
  return isCoreActive(getSiteSubscription(siteId));
}

/** Editor Core status is per website — never inherit another site's plan. */
export function isEditorCorePlanActive(explicitSiteId?: string) {
  const id =
    (explicitSiteId && explicitSiteId.trim()) ||
    (typeof window !== "undefined" ? resolveEditorSiteId() : "");
  applyPendingCoreIfNeeded(id);
  return Boolean(id && isCorePlanActive(id));
}

export function getCorePlanCycle(siteId: string): UserPlanCycle | null {
  if (!isCorePlanActive(siteId)) return null;
  const cycle = getSiteSubscription(siteId).cycle;
  return cycle === "yearly" ? "yearly" : "monthly";
}

export function canSwitchCoreToYearly(siteId: string) {
  return getCorePlanCycle(siteId) === "monthly";
}

/** Keep unused legacy type alias for older imports. */
export type UserSubscription = SiteSubscription | LegacyUserSubscription;
