import {
  EXPORT_MAX_DOWNLOADS,
  type ExportFormat,
  isExportFormat,
} from "@/lib/exportPricing";
import { queueUserStateSync } from "@/lib/userStateSync";

export type PurchasedExport = {
  siteId: string;
  siteTitle?: string;
  siteSlug?: string;
  format: ExportFormat;
  downloadsRemaining: number;
  downloadsMax: number;
  paymentId: string;
  orderId: string;
  purchasedAt: string;
  amountInr: number;
};

/** Stored inside purchasedAddons so existing user-state sync persists it. */
export const EXPORT_ADDON_PREFIX = "export-";

export function exportAddonId(format: ExportFormat) {
  return `${EXPORT_ADDON_PREFIX}${format}` as const;
}

export function formatFromExportAddonId(addonId: string): ExportFormat | null {
  if (addonId === "export-html") return "html";
  if (addonId === "export-nextjs") return "nextjs";
  return null;
}

export function isExportAddonId(addonId: unknown): boolean {
  return typeof addonId === "string" && addonId.startsWith(EXPORT_ADDON_PREFIX);
}

const ADDONS_STORAGE_KEY = "css-ai-user-addons";

type AddonRecord = Record<string, unknown>;

function readAddonRecords(): AddonRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADDONS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is AddonRecord =>
            Boolean(item) && typeof item === "object" && !Array.isArray(item),
        )
      : [];
  } catch {
    return [];
  }
}

function writeAddonRecords(items: AddonRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADDONS_STORAGE_KEY, JSON.stringify(items));
  queueUserStateSync();
  window.dispatchEvent(new Event("storage"));
}

function toPurchasedExport(raw: AddonRecord): PurchasedExport | null {
  const format =
    formatFromExportAddonId(String(raw.addonId || "")) ||
    (isExportFormat(raw.format) ? raw.format : null);
  if (!format) return null;
  if (typeof raw.siteId !== "string" || !raw.siteId.trim()) return null;

  const downloadsRemaining = Number(
    raw.creditsRemaining ?? raw.downloadsRemaining,
  );
  const downloadsMax = Number(raw.downloadsMax);
  const amountInr = Number(raw.amountInr);

  return {
    siteId: raw.siteId.trim(),
    siteTitle:
      typeof raw.siteTitle === "string" ? raw.siteTitle : undefined,
    siteSlug: typeof raw.siteSlug === "string" ? raw.siteSlug : undefined,
    format,
    downloadsRemaining: Number.isFinite(downloadsRemaining)
      ? Math.max(0, Math.floor(downloadsRemaining))
      : 0,
    downloadsMax: Number.isFinite(downloadsMax)
      ? Math.max(1, Math.floor(downloadsMax))
      : EXPORT_MAX_DOWNLOADS,
    paymentId: typeof raw.paymentId === "string" ? raw.paymentId : "",
    orderId: typeof raw.orderId === "string" ? raw.orderId : "",
    purchasedAt:
      typeof raw.purchasedAt === "string"
        ? raw.purchasedAt
        : new Date().toISOString(),
    amountInr: Number.isFinite(amountInr) ? amountInr : 0,
  };
}

function toAddonRecord(item: PurchasedExport): AddonRecord {
  return {
    siteId: item.siteId,
    siteTitle: item.siteTitle,
    siteSlug: item.siteSlug,
    addonId: exportAddonId(item.format),
    format: item.format,
    cycle: "monthly",
    paymentId: item.paymentId,
    orderId: item.orderId,
    purchasedAt: item.purchasedAt,
    creditsRemaining: item.downloadsRemaining,
    downloadsRemaining: item.downloadsRemaining,
    downloadsMax: item.downloadsMax,
    amountInr: item.amountInr,
  };
}

export function listPurchasedExports() {
  return readAddonRecords()
    .map(toPurchasedExport)
    .filter((item): item is PurchasedExport => Boolean(item));
}

export function getExportEntitlement(siteId: string, format: ExportFormat) {
  return (
    listPurchasedExports().find(
      (item) => item.siteId === siteId && item.format === format,
    ) ?? null
  );
}

export function canDownloadExport(siteId: string, format: ExportFormat) {
  const item = getExportEntitlement(siteId, format);
  return Boolean(item && item.downloadsRemaining > 0);
}

export function savePurchasedExport(input: {
  siteId: string;
  siteTitle?: string;
  siteSlug?: string;
  format: ExportFormat;
  paymentId: string;
  orderId: string;
  amountInr: number;
  downloadsRemaining?: number;
}) {
  const next: PurchasedExport = {
    siteId: input.siteId,
    siteTitle: input.siteTitle,
    siteSlug: input.siteSlug,
    format: input.format,
    downloadsRemaining: input.downloadsRemaining ?? EXPORT_MAX_DOWNLOADS,
    downloadsMax: EXPORT_MAX_DOWNLOADS,
    paymentId: input.paymentId,
    orderId: input.orderId,
    purchasedAt: new Date().toISOString(),
    amountInr: input.amountInr,
  };

  const others = readAddonRecords().filter((item) => {
    const existing = toPurchasedExport(item);
    if (!existing) return true;
    return !(
      existing.siteId === next.siteId && existing.format === next.format
    );
  });

  writeAddonRecords([...others, toAddonRecord(next)]);
  return next;
}

export function setExportDownloadsRemaining(
  siteId: string,
  format: ExportFormat,
  downloadsRemaining: number,
) {
  const items = readAddonRecords();
  let updated: PurchasedExport | null = null;
  const next = items.map((item) => {
    const existing = toPurchasedExport(item);
    if (!existing || existing.siteId !== siteId || existing.format !== format) {
      return item;
    }
    updated = {
      ...existing,
      downloadsRemaining: Math.max(0, Math.floor(downloadsRemaining)),
    };
    return toAddonRecord(updated);
  });
  if (updated) writeAddonRecords(next);
  return updated;
}

/** Used by server entitlement checks against purchasedAddons JSON. */
export function parseExportFromAddonRecord(
  value: unknown,
): PurchasedExport | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return toPurchasedExport(value as AddonRecord);
}
