import { getBackendUrl } from "@/lib/backend";
import type { ExportFormat } from "@/lib/exportPricing";
import {
  parseExportFromAddonRecord,
  type PurchasedExport,
} from "@/lib/userExports";

type UserStatePayload = {
  siteSubscriptions?: unknown;
  purchasedAddons?: unknown;
  purchasedDomains?: unknown;
  domainConnections?: unknown;
};

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

async function fetchUserState(token: string): Promise<UserStatePayload | null> {
  const res = await fetch(`${getBackendUrl()}/user-state`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as UserStatePayload | null;
}

async function saveUserState(token: string, state: UserStatePayload) {
  const res = await fetch(`${getBackendUrl()}/user-state`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(state),
    cache: "no-store",
  });
  return res.ok;
}

function listExportsFromAddons(addons: unknown[]): PurchasedExport[] {
  return addons
    .map(parseExportFromAddonRecord)
    .filter((item): item is PurchasedExport => Boolean(item));
}

/** Returns remaining downloads after consume, or null if not entitled. */
export async function consumeExportDownloadOnServer(
  token: string,
  siteId: string,
  format: ExportFormat,
): Promise<{ downloadsRemaining: number } | null> {
  const state = await fetchUserState(token);
  if (!state) return null;

  const addons = asArray(state.purchasedAddons);
  const exports = listExportsFromAddons(addons);
  const current = exports.find(
    (item) => item.siteId === siteId && item.format === format,
  );
  if (!current || current.downloadsRemaining <= 0) return null;

  const downloadsRemaining = current.downloadsRemaining - 1;
  const nextAddons = addons.map((item) => {
    const parsed = parseExportFromAddonRecord(item);
    if (!parsed || parsed.siteId !== siteId || parsed.format !== format) {
      return item;
    }
    return {
      ...(item as Record<string, unknown>),
      creditsRemaining: downloadsRemaining,
      downloadsRemaining,
      downloadsMax: parsed.downloadsMax,
      format: parsed.format,
      addonId: `export-${parsed.format}`,
    };
  });

  const saved = await saveUserState(token, {
    siteSubscriptions: state.siteSubscriptions ?? {},
    purchasedAddons: nextAddons,
    purchasedDomains: asArray(state.purchasedDomains),
    domainConnections: asArray(state.domainConnections),
  });

  if (!saved) return null;
  return { downloadsRemaining };
}
