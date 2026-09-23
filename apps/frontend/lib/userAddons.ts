import type { PlanAddonId } from "@/lib/planAddons";
import type { PlanCycle } from "@/lib/razorpayPlans";
import { isExportAddonId } from "@/lib/userExports";
import { isCorePlanActive, listSiteSubscriptions } from "@/lib/userPlan";
import { queueUserStateSync } from "@/lib/userStateSync";

export type PurchasedAddon = {
  siteId: string;
  siteTitle?: string;
  siteSlug?: string;
  addonId: PlanAddonId;
  cycle: PlanCycle;
  paymentId: string;
  orderId: string;
  purchasedAt: string;
  expiresAt?: string;
  creditsRemaining?: number;
  cancelledAt?: string;
};

const STORAGE_KEY = "css-ai-user-addons";
const LEGACY_STORAGE_KEY = "css-ai-user-addons-legacy-migrated";

function isMockPurchase(item: { paymentId?: string; orderId?: string }) {
  return (
    item.paymentId?.startsWith("pay_mock_") ||
    item.orderId?.startsWith("order_mock_") ||
    false
  );
}

function isAddonActive(item: PurchasedAddon) {
  if (isExportAddonId(item.addonId)) return false;
  if (item.cancelledAt) return false;
  if (isMockPurchase(item)) return false;
  if (item.expiresAt) {
    return new Date(item.expiresAt).getTime() > Date.now();
  }
  return true;
}

function normalizeAddon(
  item: PurchasedAddon & { billing?: string; siteId?: string },
): PurchasedAddon | null {
  if (!item?.addonId) return null;
  const cycle: PlanCycle =
    item.cycle === "yearly" || item.billing === "yearly" ? "yearly" : "monthly";
  return {
    siteId: item.siteId || "",
    siteTitle: item.siteTitle,
    siteSlug: item.siteSlug,
    addonId: item.addonId,
    cycle,
    paymentId: item.paymentId,
    orderId: item.orderId,
    purchasedAt: item.purchasedAt,
    expiresAt: item.expiresAt,
    creditsRemaining: item.creditsRemaining,
    cancelledAt: item.cancelledAt,
  };
}

function getDefaultMigrationSiteId() {
  const coreSite = listSiteSubscriptions().find((item) =>
    isCorePlanActive(item.siteId),
  );
  return coreSite?.siteId || "";
}

function migrateLegacyAddons(items: PurchasedAddon[]) {
  if (typeof window === "undefined") return items;

  const alreadyMigrated = localStorage.getItem(LEGACY_STORAGE_KEY) === "1";
  const hasLegacy = items.some((item) => !item.siteId);
  if (!hasLegacy || alreadyMigrated) return items;

  const defaultSiteId = getDefaultMigrationSiteId();
  const defaultSite = listSiteSubscriptions().find(
    (item) => item.siteId === defaultSiteId,
  );

  if (!defaultSiteId) {
    return items.filter((item) => Boolean(item.siteId));
  }

  const migrated = items
    .map((item) => {
      if (item.siteId) return item;
      return {
        ...item,
        siteId: defaultSiteId,
        siteTitle: defaultSite?.siteTitle,
        siteSlug: defaultSite?.siteSlug,
      };
    })
    .filter((item) => Boolean(item.siteId));

  try {
    localStorage.setItem(LEGACY_STORAGE_KEY, "1");
  } catch {
    // ignore
  }

  return migrated;
}

function readAllAddons(): PurchasedAddon[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<
      PurchasedAddon & { billing?: string; siteId?: string }
    >;
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map((item) => normalizeAddon(item))
      .filter((item): item is PurchasedAddon => Boolean(item));

    const migrated = migrateLegacyAddons(normalized);
    if (migrated.length !== normalized.length || migrated.some((item, index) => item.siteId !== normalized[index]?.siteId)) {
      writeAddons(migrated);
    }

    return migrated;
  } catch {
    return [];
  }
}

function writeAddons(items: PurchasedAddon[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  queueUserStateSync();
}

export function listPurchasedAddons(siteId?: string): PurchasedAddon[] {
  const items = readAllAddons().filter((item) => isAddonActive(item));
  if (!siteId) return items;
  return items.filter((item) => item.siteId === siteId);
}

export function listAllPurchasedAddons(siteId?: string): PurchasedAddon[] {
  const items = readAllAddons();
  if (!siteId) return items;
  return items.filter((item) => item.siteId === siteId);
}

export function hasActiveAddon(siteId: string, addonId: PlanAddonId) {
  if (!siteId) return false;
  return listPurchasedAddons(siteId).some((item) => item.addonId === addonId);
}

export function getPurchasedAddon(siteId: string, addonId: PlanAddonId) {
  if (!siteId) return null;
  return listPurchasedAddons(siteId).find((item) => item.addonId === addonId) || null;
}

export function savePurchasedAddon(input: {
  siteId: string;
  siteTitle?: string;
  siteSlug?: string;
  addonId: PlanAddonId;
  cycle: PlanCycle;
  paymentId: string;
  orderId: string;
  creditsRemaining?: number;
}) {
  if (!input.siteId) {
    throw new Error("A website is required to activate an add-on.");
  }

  const purchasedAt = new Date();
  const expiresAt = new Date(purchasedAt);
  if (input.cycle === "yearly") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  const next: PurchasedAddon = {
    siteId: input.siteId,
    siteTitle: input.siteTitle,
    siteSlug: input.siteSlug,
    addonId: input.addonId,
    cycle: input.cycle,
    paymentId: input.paymentId,
    orderId: input.orderId,
    purchasedAt: purchasedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    creditsRemaining: input.creditsRemaining,
  };

  const current = readAllAddons().filter(
    (item) => !(item.siteId === input.siteId && item.addonId === input.addonId),
  );
  current.push(next);
  writeAddons(current);
  return next;
}

export function savePurchasedAddons(
  addonIds: PlanAddonId[],
  input: {
    siteId: string;
    siteTitle?: string;
    siteSlug?: string;
    cycle: PlanCycle;
    paymentId: string;
    orderId: string;
  },
) {
  return addonIds.map((addonId) =>
    savePurchasedAddon({
      addonId,
      siteId: input.siteId,
      siteTitle: input.siteTitle,
      siteSlug: input.siteSlug,
      cycle: input.cycle,
      paymentId: input.paymentId,
      orderId: input.orderId,
    }),
  );
}

export function cancelPurchasedAddon(siteId: string, addonId: PlanAddonId) {
  if (!siteId) return false;

  const current = readAllAddons();
  const index = current.findIndex(
    (item) =>
      item.siteId === siteId &&
      item.addonId === addonId &&
      isAddonActive(item),
  );
  if (index < 0) return false;

  current[index] = {
    ...current[index],
    cancelledAt: new Date().toISOString(),
  };
  writeAddons(current);
  return true;
}
