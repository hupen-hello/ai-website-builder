import { applyOnboardingLogoToSections } from "@/lib/applyOnboardingLogo";
import { applyOnboardingContactToSections } from "@/lib/applyOnboardingContact";
import { applyOnboardingAboutContentToSections } from "@/lib/applyOnboardingAboutContent";
import { readEditorScopedOnboardingDraft } from "@/lib/onboardingDraft";
import {
  getEditorTemplateIdFromUrl,
  isEditorOnboardingSinglePage,
  readOnboardingNavSnapshotForEditor,
  rebuildOnboardingNavFromDraft,
  saveOnboardingNavSnapshot,
  type OnboardingNavMenuLink,
} from "@/lib/onboardingNavSnapshot";
import { buildFooterColumnsFromOnboardingSelection } from "@/lib/onboardingPages";

type SectionLike = {
  type: string;
  variant: string;
  data: Record<string, Record<string, unknown>>;
};

export type ApplyOnboardingBrandOptions = {
  overwrite?: boolean;
  /** When false, skip header/footer nav stamps (theme switch keeps logo/contact only). */
  applyNav?: boolean;
};

function isFreshOnboardingOpen() {
  if (typeof window === "undefined") return false;
  try {
    return (
      sessionStorage.getItem("css-ai-onboarding-page-links-ready") === "1" ||
      sessionStorage.getItem("css-ai-apply-onboarding-header") === "1"
    );
  } catch {
    return false;
  }
}

function resolveOnboardingNav() {
  return (
    readOnboardingNavSnapshotForEditor() || rebuildOnboardingNavFromDraft()
  );
}

function normalizeMenuForPageType(
  menu: OnboardingNavMenuLink[],
): OnboardingNavMenuLink[] {
  if (!isEditorOnboardingSinglePage()) return menu;
  return menu.map((link) => {
    const { children: _children, menuType: _menuType, ...rest } = link;
    return rest;
  });
}

function applyOnboardingHeaderMenuToSections<T extends SectionLike>(
  sections: T[],
  options?: ApplyOnboardingBrandOptions,
): T[] {
  if (options?.applyNav === false) return sections;
  const overwrite = options?.overwrite !== false;
  const nav = resolveOnboardingNav();
  if (!nav?.menu.length) return sections;
  const menu = normalizeMenuForPageType(nav.menu);

  try {
    sessionStorage.removeItem("css-ai-apply-onboarding-header");
  } catch {
    /* ignore */
  }

  if (isFreshOnboardingOpen()) {
    saveOnboardingNavSnapshot({
      templateId: nav.templateId,
      menu: nav.menu,
      footerColumns: nav.footerColumns,
    });
  }

  return sections.map((section) => {
    if (section.type !== "Header") return section;
    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => {
        const current = (variantData || {}) as Record<string, unknown>;
        const existing = Array.isArray(current.menu) ? current.menu : [];
        if (!overwrite && existing.length) {
          return [variant, current];
        }
        return [
          variant,
          {
            ...current,
            menu,
          },
        ];
      }),
    );
    return { ...section, data: nextData };
  });
}

function applyOnboardingFooterToSections<T extends SectionLike>(
  sections: T[],
  options?: ApplyOnboardingBrandOptions,
): T[] {
  if (options?.applyNav === false) return sections;
  const overwrite = options?.overwrite !== false;
  let footerColumns: {
    title: string;
    links: { label: string; href: string }[];
  }[] = [];

  const nav = resolveOnboardingNav();
  if (nav?.footerColumns?.length) {
    footerColumns = nav.footerColumns;
  }

  if (!footerColumns.length) {
    const draft = readEditorScopedOnboardingDraft();
    const urlTemplateId = getEditorTemplateIdFromUrl();
    // Never stamp another theme's footer onto the current editor template.
    if (
      draft?.pagesSelection &&
      draft.selectedTemplateId &&
      urlTemplateId &&
      draft.selectedTemplateId === urlTemplateId
    ) {
      footerColumns = buildFooterColumnsFromOnboardingSelection(
        draft.pagesSelection,
        draft.selectedTemplateId,
        draft.businessInfo.websiteRelated === "campaign-page"
          ? "single-page"
          : draft.businessInfo.pageType,
      );
    }
  }

  if (!footerColumns.length) return sections;

  return sections.map((section) => {
    if (section.type !== "Footer") return section;
    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => {
        const current = (variantData || {}) as Record<string, unknown>;
        const existing = Array.isArray(current.footerColumns)
          ? current.footerColumns
          : [];
        if (!overwrite && existing.length) {
          return [variant, current];
        }
        return [
          variant,
          {
            ...current,
            footerColumns,
          },
        ];
      }),
    );
    return { ...section, data: nextData };
  });
}

/** Apply onboarding logo + contact + header/footer page picks onto editor sections. */
export function applyOnboardingBrandToSections<T extends SectionLike>(
  sections: T[],
  options?: ApplyOnboardingBrandOptions,
): T[] {
  return applyOnboardingFooterToSections(
    applyOnboardingHeaderMenuToSections(
      applyOnboardingAboutContentToSections(
        applyOnboardingContactToSections(
          applyOnboardingLogoToSections(sections, options),
          options,
        ),
        options,
      ),
      options,
    ),
    options,
  );
}
