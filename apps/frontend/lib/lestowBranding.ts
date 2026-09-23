import { hasActiveAddon } from "@/lib/userAddons";

export const LESTOW_COPYRIGHT_CREDIT = "Powered by Lestow";
export const REMOVE_BRANDING_ADDON_ID = "remove-branding" as const;

export function stripLestowCopyrightCredit(text?: string): string {
  if (!text) return "";
  return text
    .replace(/\s*[·•|\-]\s*Powered by Lestow\s*$/i, "")
    .replace(/\s*Powered by Lestow\s*$/i, "")
    .trim();
}

/** Lestow credit stays until the paid Remove Branding add-on is active. */
export function shouldShowLestowCopyright(removeBranding?: boolean): boolean {
  if (removeBranding === true) return false;

  if (typeof window === "undefined") return true;

  try {
    const siteId = new URLSearchParams(window.location.search).get("siteId");
    if (siteId && hasActiveAddon(siteId, REMOVE_BRANDING_ADDON_ID)) {
      return false;
    }
  } catch {
    /* ignore */
  }

  return true;
}
