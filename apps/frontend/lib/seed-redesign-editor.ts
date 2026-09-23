/**
 * Redesign → editor bridge: seed onboarding draft from extracted domain theme
 * so uploaded template components get brand/logo/contact/about — same stamp path
 * as Create Custom. Does not touch Create-AI storage.
 */

import type { BuiltSiteTheme } from "@/lib/built-site-theme";
import type { RedesignBuildPayload } from "@/lib/redesign-build-storage";
import {
  defaultOnboardingBusinessInfo,
  saveOnboardingDraft,
  type OnboardingBusinessInfo,
} from "@/lib/onboardingDraft";
import {
  buildFooterColumnsFromOnboardingSelection,
  defaultOnboardingPagesSelection,
} from "@/lib/onboardingPages";
import { clearRedesignSiteEditorDrafts, type EditorDraftPageLink, saveEditorDraft } from "@/lib/editorDraft";
import { clearUserActiveSiteId, setLastEditorUrl } from "@/lib/migrateGuestSite";
import { saveOnboardingNavSnapshot } from "@/lib/onboardingNavSnapshot";
import {
  writeFlowFooterColumns,
  writeFlowPageLinks,
} from "@/lib/flowPreviewStorage";
import {
  buildTemplateComposePreviewUrl,
  getTemplatesForCategory,
} from "@/app/editor/layout/src/data/templateFlow";
import { saveRedesignEditorTheme, buildRedesignDomainNavLinks } from "@/lib/apply-redesign-domain";
import { saveRedesignEditorPack } from "@/lib/redesign-editor-session";
import {
  buildRedesignHomeFromLayouts,
  saveRedesignEditorSections,
} from "@/lib/build-redesign-home-sections";
import { redesignPrefsToTemplateVariables } from "@/lib/redesign-design-prefs";
import type { CreateAiColorPaletteId, CreateAiFontId } from "@/lib/create-ai-design-prefs";
import { refreshCategoryContentFromApi } from "@/app/editor/layout/src/data/templateFlow";

/** Domain nav labels in header; only Home is active — rest are placeholders until pages are added. */
function buildRedesignPageLinks(theme: BuiltSiteTheme): EditorDraftPageLink[] {
  return buildRedesignDomainNavLinks(theme);
}

export function resolveRedesignTemplateId(category: string, preferred?: string) {
  const list = getTemplatesForCategory(category);
  if (!list.length) return preferred?.trim() || "";
  if (preferred && list.some((t) => t.id === preferred)) return preferred;
  return list[0]?.id || "";
}

export function buildRedesignComposePreviewUrl(
  category: string,
  templateId: string,
): string | null {
  const template = getTemplatesForCategory(category).find((t) => t.id === templateId);
  if (!template) return null;
  return buildTemplateComposePreviewUrl(template, category);
}

export async function seedRedesignEditorFromExtract(options: {
  theme: BuiltSiteTheme;
  category: string;
  templateId: string;
  payload: RedesignBuildPayload;
  designId?: string | null;
  sectionVariants?: Record<string, string>;
  pickedBy?: "ai" | "heuristic";
}): Promise<{
  editorUrl: string;
  composePreviewUrl: string | null;
  brandedPreviewUrl: string | null;
}> {
  const { category, templateId, payload } = options;
  const designId = (options.designId || payload.designId || "").trim();
  // Merge form contact when crawl missed head/JSON-LD fields.
  const theme: BuiltSiteTheme = {
    ...options.theme,
    contactEmail:
      (options.theme.contactEmail || payload.email || "").trim() ||
      options.theme.contactEmail,
    contactPhone:
      (options.theme.contactPhone || payload.mobile || "").trim() ||
      options.theme.contactPhone,
    contactAddress:
      (options.theme.contactAddress || payload.address || "").trim() ||
      options.theme.contactAddress,
    brandName:
      (options.theme.brandName || payload.websiteName || "").trim() ||
      options.theme.brandName,
  };
  // Prefer user-selected page type from redesign prefs step.
  const pageType =
    payload.pageType === "multi-page" ? "multi-page" : "single-page";

  const businessInfo: OnboardingBusinessInfo = {
    ...defaultOnboardingBusinessInfo(),
    audience: payload.audience || "company",
    name: (theme.brandName || payload.websiteName || "").trim(),
    description: (
      theme.description ||
      theme.paragraphs?.[0] ||
      payload.vision ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000),
    websiteRelated: payload.websiteRelated || "service-provider",
    pageType,
    email: (theme.contactEmail || payload.email || "").trim(),
    mobile: (theme.contactPhone || payload.mobile || "").replace(/\D/g, "").slice(0, 15),
    address: (theme.contactAddress || payload.address || "").trim(),
    includeDetails: Boolean(
      (theme.contactEmail || payload.email || "").trim() ||
        (theme.contactPhone || payload.mobile || "").trim() ||
        (theme.contactAddress || payload.address || "").trim(),
    ),
    hasLogo: theme.logoImage ? "yes" : "no",
    logoName: theme.brandName || payload.websiteName || "Logo",
    logoImage: (theme.logoImage || "").trim(),
  };

  // Bodies = Home first. Multi-page keeps domain nav voids until pages are added.
  // Single-page: Home only — editor heals to section scroll anchors.
  const pagesSelection =
    pageType === "multi-page"
      ? defaultOnboardingPagesSelection(templateId, pageType)
      : { selectedPages: ["header:home"] };
  const pageLinks =
    pageType === "multi-page"
      ? buildRedesignPageLinks(theme)
      : [{ label: "Home", href: "#", kind: "page" as const }];
  const footerColumns = buildFooterColumnsFromOnboardingSelection(
    pagesSelection,
    templateId,
    pageType,
  );

  clearUserActiveSiteId();
  // Never wipe create-custom's unscoped draft — only prior redesign slots.
  clearRedesignSiteEditorDrafts();
  saveRedesignEditorTheme(theme, designId);

  // Home = custom-layouts components only + domain logo/content stamp (not template theme).
  const variants = options.sectionVariants || {};
  await refreshCategoryContentFromApi();
  const homeSections = buildRedesignHomeFromLayouts(category, variants, theme);
  if (designId && homeSections.length) {
    saveRedesignEditorSections(designId, homeSections);
    // Persist as designId-scoped editor draft so refresh restores edits.
    saveEditorDraft({
      siteId: designId,
      templateId,
      category,
      sections: homeSections,
      pageLinks,
      templateVariables: redesignPrefsToTemplateVariables({
        category,
        pageType,
        colorPalette: (payload.colorPalette as CreateAiColorPaletteId) || "ocean",
        fontFamily: (payload.fontFamily as CreateAiFontId) || "syne-manrope",
      }),
      pendingSync: false,
    });
  }

  if (designId) {
    const templateVariables = redesignPrefsToTemplateVariables({
      category,
      pageType,
      colorPalette: (payload.colorPalette as CreateAiColorPaletteId) || "ocean",
      fontFamily: (payload.fontFamily as CreateAiFontId) || "syne-manrope",
    });
    saveRedesignEditorPack({
      designId,
      templateId,
      category,
      sectionVariants: variants,
      domain: theme.domainUrl || payload.domainName || "",
      businessName: businessInfo.name,
      pickedBy: options.pickedBy,
      templateVariables,
      pageType,
      savedAt: Date.now(),
    });
  }

  saveOnboardingDraft({
    step: 3,
    businessInfo,
    selectedCategory: category,
    selectedTemplateId: templateId,
    showMonitor: true,
    pagesSelection,
    createPath: "redesign",
  });

  try {
    writeFlowPageLinks("redesign", pageLinks);
    writeFlowFooterColumns("redesign", footerColumns);
    saveOnboardingNavSnapshot({
      templateId,
      menu: pageLinks,
      footerColumns,
    });
    sessionStorage.setItem("css-ai-onboarding-page-links-ready", "1");
    sessionStorage.setItem("css-ai-apply-onboarding-header", "1");
    sessionStorage.setItem("css-ai-redesign-domain-stamp", "1");
    sessionStorage.removeItem("css-ai-onboarding-menu-subset");
    sessionStorage.removeItem("css-ai-sync-header-from-onboarding");
  } catch {
    /* ignore */
  }

  // Public URL: no templateId / category / redesign=1 — editor resolves from session pack.
  const params = new URLSearchParams();
  if (designId) params.set("designId", designId);
  const domain = (theme.domainUrl || payload.domainName || "").trim();
  if (domain) params.set("domain", domain);
  if (businessInfo.name) params.set("businessName", businessInfo.name);

  const editorUrl = `/editor?${params.toString()}`;
  setLastEditorUrl(editorUrl);
  const composePreviewUrl = buildRedesignComposePreviewUrl(category, templateId);
  const brandedPreviewUrl = designId
    ? `/redesign/build/${encodeURIComponent(designId)}/live`
    : null;
  return { editorUrl, composePreviewUrl, brandedPreviewUrl };
}
