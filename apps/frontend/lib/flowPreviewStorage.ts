/** Flow-scoped preview nav keys so Redesign / Custom / Create-AI don't overwrite each other. */

import type { OnboardingCreatePath } from "@/lib/onboardingDraft";

export const LEGACY_PAGE_LINKS_KEY = "ai-builder-page-links";
export const LEGACY_FOOTER_COLUMNS_KEY = "css-ai-onboarding-footer-columns";
export const LEGACY_CURRENT_PAGE_KEY = "ai-builder-current-page";

function scopedKey(base: string, path: OnboardingCreatePath) {
  return `${base}:${path}`;
}

export function pageLinksStorageKey(path: OnboardingCreatePath) {
  return scopedKey(LEGACY_PAGE_LINKS_KEY, path);
}

export function footerColumnsStorageKey(path: OnboardingCreatePath) {
  return scopedKey(LEGACY_FOOTER_COLUMNS_KEY, path);
}

export function currentPageStorageKey(path: OnboardingCreatePath) {
  return scopedKey(LEGACY_CURRENT_PAGE_KEY, path);
}

/** Active editor flow from URL (rd_ → redesign, else create-custom). */
export function detectEditorPreviewFlow(
  search?: string | null,
): OnboardingCreatePath {
  if (typeof window === "undefined" && !search) return "create-custom";
  try {
    const q = search ?? window.location.search;
    const designId = (new URLSearchParams(q).get("designId") || "").trim();
    if (/^rd_/i.test(designId)) return "redesign";
  } catch {
    /* ignore */
  }
  return "create-custom";
}

/** Write flow-scoped + activate into legacy key (PreviewContext / editor boot). */
export function writeFlowPageLinks(
  path: OnboardingCreatePath,
  pageLinks: unknown,
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(pageLinks);
    window.localStorage.setItem(pageLinksStorageKey(path), raw);
    // Active session uses legacy key so existing PreviewContext keeps working.
    window.localStorage.setItem(LEGACY_PAGE_LINKS_KEY, raw);
  } catch {
    /* ignore */
  }
}

export function writeFlowFooterColumns(
  path: OnboardingCreatePath,
  footerColumns: unknown,
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(footerColumns);
    window.localStorage.setItem(footerColumnsStorageKey(path), raw);
    window.localStorage.setItem(LEGACY_FOOTER_COLUMNS_KEY, raw);
  } catch {
    /* ignore */
  }
}

/** Keep scoped + legacy page-links in sync while the editor runs. */
export function mirrorActiveFlowPageLinks(pageLinks: unknown): void {
  if (typeof window === "undefined") return;
  writeFlowPageLinks(detectEditorPreviewFlow(), pageLinks);
}

export function mirrorActiveFlowCurrentPage(page: string): void {
  if (typeof window === "undefined") return;
  const label = (page || "Home").trim() || "Home";
  const path = detectEditorPreviewFlow();
  try {
    window.localStorage.setItem(currentPageStorageKey(path), label);
    window.localStorage.setItem(LEGACY_CURRENT_PAGE_KEY, label);
  } catch {
    /* ignore */
  }
}

/** Flow-scoped only — never fall back to another flow's legacy key. */
export function readFlowPageLinksRaw(
  path: OnboardingCreatePath,
): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(pageLinksStorageKey(path));
  } catch {
    return null;
  }
}

/** Copy this flow's scoped nav into legacy keys PreviewContext reads. */
export function activateFlowPreviewStorage(path: OnboardingCreatePath): void {
  if (typeof window === "undefined") return;
  try {
    const links = window.localStorage.getItem(pageLinksStorageKey(path));
    if (links) window.localStorage.setItem(LEGACY_PAGE_LINKS_KEY, links);
    const footer = window.localStorage.getItem(footerColumnsStorageKey(path));
    if (footer) {
      window.localStorage.setItem(LEGACY_FOOTER_COLUMNS_KEY, footer);
    }
    const page =
      window.localStorage.getItem(currentPageStorageKey(path))?.trim() ||
      "Home";
    window.localStorage.setItem(LEGACY_CURRENT_PAGE_KEY, page || "Home");
  } catch {
    /* ignore */
  }
}

export function clearAllFlowPreviewStorage(): void {
  if (typeof window === "undefined") return;
  const paths: OnboardingCreatePath[] = [
    "create-ai",
    "create-custom",
    "redesign",
  ];
  try {
    for (const path of paths) {
      window.localStorage.removeItem(pageLinksStorageKey(path));
      window.localStorage.removeItem(footerColumnsStorageKey(path));
      window.localStorage.removeItem(currentPageStorageKey(path));
    }
    window.localStorage.removeItem(LEGACY_PAGE_LINKS_KEY);
    window.localStorage.removeItem(LEGACY_FOOTER_COLUMNS_KEY);
    window.localStorage.removeItem(LEGACY_CURRENT_PAGE_KEY);
  } catch {
    /* ignore */
  }
}
