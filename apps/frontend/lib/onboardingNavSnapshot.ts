import {
  buildFooterColumnsFromOnboardingSelection,
  buildPageLinksFromOnboardingSelection,
  type OnboardingFooterColumnData,
} from "@/lib/onboardingPages";
import {
  readEditorScopedOnboardingDraft,
  type OnboardingBusinessInfo,
} from "@/lib/onboardingDraft";
import { getBuilderTemplate } from "@/app/editor/layout/src/data/templateFlow";

const NAV_SNAPSHOT_KEY = "css-ai-onboarding-nav-snapshot";
const FOOTER_COLUMNS_KEY = "css-ai-onboarding-footer-columns";

function navSnapshotStorageKey(): string {
  if (typeof window === "undefined") return NAV_SNAPSHOT_KEY;
  try {
    const siteId = (
      new URLSearchParams(window.location.search).get("siteId") || ""
    ).trim();
    if (/^rd_/i.test(siteId)) return `${NAV_SNAPSHOT_KEY}:redesign`;
  } catch {
    /* ignore */
  }
  return `${NAV_SNAPSHOT_KEY}:create-custom`;
}

export type OnboardingNavMenuLink = {
  label: string;
  href: string;
  kind?: string;
  children?: OnboardingNavMenuLink[];
  [key: string]: unknown;
};

export type OnboardingNavSnapshot = {
  templateId: string;
  menu: OnboardingNavMenuLink[];
  footerColumns: OnboardingFooterColumnData[];
  updatedAt: number;
};

export function getEditorTemplateIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return new URLSearchParams(window.location.search).get("templateId");
  } catch {
    return null;
  }
}

export function saveOnboardingNavSnapshot(input: {
  templateId: string;
  menu: OnboardingNavMenuLink[];
  footerColumns: OnboardingFooterColumnData[];
}): void {
  if (typeof window === "undefined") return;
  if (!input.templateId || !input.menu.length) return;
  try {
    const payload: OnboardingNavSnapshot = {
      templateId: input.templateId,
      menu: input.menu,
      footerColumns: input.footerColumns,
      updatedAt: Date.now(),
    };
    localStorage.setItem(navSnapshotStorageKey(), JSON.stringify(payload));
    // Do NOT write ai-builder-page-links here — PreviewContext owns that key
    // for the full Pages inventory.
    localStorage.setItem(
      FOOTER_COLUMNS_KEY,
      JSON.stringify(input.footerColumns),
    );
  } catch {
    /* ignore */
  }
}

export function clearOnboardingNavSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(NAV_SNAPSHOT_KEY);
    localStorage.removeItem(`${NAV_SNAPSHOT_KEY}:redesign`);
    localStorage.removeItem(`${NAV_SNAPSHOT_KEY}:create-custom`);
    localStorage.removeItem(FOOTER_COLUMNS_KEY);
  } catch {
    /* ignore */
  }
}

export function readOnboardingNavSnapshot(): OnboardingNavSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(navSnapshotStorageKey()) ||
      localStorage.getItem(NAV_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnboardingNavSnapshot>;
    if (
      !parsed ||
      typeof parsed.templateId !== "string" ||
      !Array.isArray(parsed.menu) ||
      !parsed.menu.length ||
      typeof parsed.updatedAt !== "number"
    ) {
      return null;
    }
    return {
      templateId: parsed.templateId,
      menu: parsed.menu as OnboardingNavMenuLink[],
      footerColumns: Array.isArray(parsed.footerColumns)
        ? (parsed.footerColumns as OnboardingFooterColumnData[])
        : [],
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

/** Snapshot for the template currently open in the editor URL. */
export function readOnboardingNavSnapshotForEditor(): OnboardingNavSnapshot | null {
  const snapshot = readOnboardingNavSnapshot();
  const templateId = getEditorTemplateIdFromUrl();
  if (!snapshot || !templateId || snapshot.templateId !== templateId) {
    return null;
  }
  return snapshot;
}

/**
 * Rebuild nav from onboarding draft when snapshot is missing but draft matches.
 */
export function rebuildOnboardingNavFromDraft(): OnboardingNavSnapshot | null {
  const draft = readEditorScopedOnboardingDraft();
  const templateId = getEditorTemplateIdFromUrl();
  if (
    !draft?.selectedTemplateId ||
    !templateId ||
    draft.selectedTemplateId !== templateId ||
    !draft.pagesSelection
  ) {
    return null;
  }
  const pageType: OnboardingBusinessInfo["pageType"] =
    draft.businessInfo.websiteRelated === "campaign-page"
      ? "single-page"
      : draft.businessInfo.pageType;
  const menu = buildPageLinksFromOnboardingSelection(
    draft.pagesSelection,
    templateId,
    pageType,
  ) as OnboardingNavMenuLink[];
  const footerColumns = buildFooterColumnsFromOnboardingSelection(
    draft.pagesSelection,
    templateId,
    pageType,
  );
  if (!menu.length) return null;
  return {
    templateId,
    menu,
    footerColumns,
    updatedAt: draft.updatedAt || Date.now(),
  };
}

/** True when onboarding pageType (or template) is single-page. */
export function isEditorOnboardingSinglePage(): boolean {
  const draft = readEditorScopedOnboardingDraft();
  if (draft?.businessInfo.websiteRelated === "campaign-page") return true;
  if (draft?.businessInfo.pageType === "single-page") return true;
  if (draft?.businessInfo.pageType === "multi-page") return false;
  const templateId = getEditorTemplateIdFromUrl();
  if (!templateId) return true;
  return getBuilderTemplate(templateId).type === "Single Page Website";
}
