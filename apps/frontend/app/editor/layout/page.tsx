"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  History,
  Loader2,
  Redo2,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import { FloatingActionButtons } from "./src/lib/FloatingActionButtons";
import {
  buildSelectedConfig,
  createAddableSection,
  createAboutPageSection,
  createContactPageSection,
  createCustomPageSection,
  createCustomPageBreadcrumb,
  createCustomPageDetailSection,
  createGalleryPageSection,
  createServicePageSection,
  createEventPageSection,
  createPropertyPageSection,
  createPortfolioPageSection,
  createTeamPageSection,
  createTypedPageSection,
  getBuilderTemplate,
  getSinglePageTemplateMenu,
  getTemplatePages,
  getThemeManagerVisibility,
  resolveThemePortfolioNavLink,
  type ThemeManagerKey,
  getTemplateVariables,
  scopeTemplatePageBodies,
  pageBodyHasOwnBreadcrumb,
  dropExtraPageBreadcrumbs,
  orderChromeSections,
  refreshCategoryContentFromApi,
  resolveLayoutPreview,
  keepThemeLockedVariant,
  resolveTemplateSectionVariant,
  withTopbarLayoutSkin,
  applyTopbarLayoutSkins,
} from "./src/data/templateFlow";
import { sectionRegistry } from "./src/lib/sectionRegistry";
import {
  INLINE_TEXT_FORMATS_KEY,
  readInlineTextFormats,
  prepareEditorSurfaceForReplace,
} from "./src/lib/inlineTextFormatting";
import { getSectionAnchorId } from "./src/lib/sectionAnchors";
import {
  mergeSectionContent,
  applyThemeVariantToSection,
  collectBestSectionContent,
  reconcileSectionsWithServer,
} from "./src/lib/preserveSectionContent";

import EditableSection from "./src/components/builder/EditableSection";
import EditSectionModal from "./src/components/builder/EditSectionModal";
import { usePreview } from "./src/components/context/PreviewContext";
import BlogIndexList from "./src/components/sections/blog/BlogIndexList";
import { normalizeBlogIndexLayout } from "./src/lib/blogLayouts";
import ServiceDetailArticle from "./src/components/sections/service/ServiceDetailArticle";
import RelatedCountryListingsSlider from "./src/components/sections/countriesserve/RelatedCountryListingsSlider";
import EventDetailArticle from "./src/components/sections/event/EventDetailArticle";
import PortfolioDetailArticle from "./src/components/sections/portfolio/PortfolioDetailArticle";
import TeamDetailArticle from "./src/components/sections/team/TeamDetailArticle";
import PropertyDetailArticle from "./src/components/sections/property/PropertyDetailArticle";
import RealEstatePropertyDetail1 from "./src/components/sections/featured/RealEstatePropertyDetail1";

import { SectionData, SectionItem } from "./src/types/section";
import type { ServiceItem, ServicePageState } from "../components/ServiceManager";
import type { EventItem, EventPageState } from "../components/EventManager";
import type {
  PortfolioItem,
  PortfolioPageState,
} from "../components/PortfolioManager";
import type {
  TeamItem,
  TeamPageState,
} from "../components/TeamManager";
import type {
  GalleryItem,
  GalleryPageState,
} from "../components/GalleryManager";
import type {
  CountriesServeState,
  CountryServeItem,
  CountryServeListing,
} from "../components/CountriesServeManager";
import type {
  PropertyItem,
  PropertyPageState,
} from "../components/PropertyManager";
import {
  parsePropertyAmenities,
  serializePropertyAmenities,
} from "./src/lib/propertyAmenities";
import { SITE_THEME_GLOBAL_CSS, ensureThemeGoogleFontsLoaded } from "./src/lib/themeTokens";
import {
  overlayManagerHomeFeed,
  syncHomeCardsIntoManagers,
  mapPropertyToListing,
  mapPortfolioToProject,
} from "./src/lib/managerHomeFeeds";
import {
  migrateGuestSiteToDatabase,
  clearGuestProgressAfterDbSave,
  setPublishedSiteUrl,
  setLastEditorUrl,
  getUserActiveSiteId,
  type GuestSitePayload,
} from "@/lib/migrateGuestSite";
import { recoverBlogPageLinksFromSections } from "@/lib/recoverBlogPageLinks";
import {
  loadEditorDraft,
  readEditorDraft,
  saveEditorDraft,
  type EditorDraft,
} from "@/lib/editorDraft";
import type { EditorDraftPageLink } from "@/lib/editorDraft";
import { applyOnboardingBrandToSections } from "@/lib/applyOnboardingBrand";
import {
  applyRedesignDomainToSections,
  readRedesignEditorTheme,
} from "@/lib/apply-redesign-domain";
import {
  buildRedesignHomeFromLayouts,
  readRedesignEditorSections,
  saveRedesignEditorSections,
} from "@/lib/build-redesign-home-sections";
import { isRedesignEditorSearchParams } from "@/lib/is-redesign-editor";
import { readRedesignEditorPack } from "@/lib/redesign-editor-session";
import { buildDefaultThemeNav } from "@/lib/onboardingPages";
import {
  readOnboardingDraft,
  saveOnboardingDraft,
  defaultOnboardingBusinessInfo,
} from "@/lib/onboardingDraft";
import { saveOnboardingNavSnapshot } from "@/lib/onboardingNavSnapshot";
import {
  readFlowPageLinksRaw,
  writeFlowFooterColumns,
  writeFlowPageLinks,
  activateFlowPreviewStorage,
} from "@/lib/flowPreviewStorage";
import { useUserAuth } from "@/components/auth/UserAuthContext";
import {
  buildDefaultThemeSeo,
  extractThemeSeoHints,
  hasManualSeoInConfig,
  mergeEmptySiteSeo,
  normalizePageSeoKey,
  patchGlobalSeo,
  patchPageSeo,
  type SiteSeoConfig,
} from "@/lib/siteSeo";
import { resolveCountryFlagImage } from "@/lib/countryFlags";
import {
  hydrateSiteTaxonomiesToLocal,
  normalizeSiteTaxonomies,
} from "@/lib/siteTaxonomies";
import {
  readEditorRevisions,
  saveEditorRevision,
  type EditorRevision,
} from "@/lib/editorHistory";
import {
  getCustomSectionLayout,
  layoutIdForColumnCount,
  type CustomSectionLayoutId,
} from "./src/data/customSectionLayouts";

function emitCloudSaveToast(
  status: "saving" | "saved" | "error",
  message: string,
) {
  window.dispatchEvent(
    new CustomEvent("ai-builder-cloud-save", {
      detail: { status, message },
    }),
  );
}

const THEME_SWITCH_LOCK_KEY = "css-ai-theme-switch-lock";

const markThemeSwitchLock = (siteId: string | null | undefined, templateId: string) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      THEME_SWITCH_LOCK_KEY,
      JSON.stringify({
        siteId: siteId || null,
        templateId,
        at: Date.now(),
      }),
    );
  } catch {
    /* ignore */
  }
};

const consumeThemeSwitchLock = (
  siteId: string | null | undefined,
  templateId: string,
) => {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(THEME_SWITCH_LOCK_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as {
      siteId?: string | null;
      templateId?: string;
      at?: number;
    };
    const fresh = typeof parsed.at === "number" && Date.now() - parsed.at < 60_000;
    const sameSite = (parsed.siteId || null) === (siteId || null);
    const sameTemplate = parsed.templateId === templateId;
    if (fresh && sameSite && sameTemplate) {
      window.sessionStorage.removeItem(THEME_SWITCH_LOCK_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const formatSectionName = (sectionType: string) =>
  sectionType.charAt(0).toUpperCase() + sectionType.slice(1);

const getSectionVariantData = (
  section: SectionItem,
): Record<string, unknown> | undefined => {
  const defaultVariant = `${section.type}-1`;
  const variantData =
    section.data?.[section.variant] ?? section.data?.[defaultVariant];
  if (isRecord(variantData)) return variantData;
  if (isRecord(section.data)) return section.data;
  return undefined;
};

/** Editor chrome / AI Assist label â€” prefer visitor-facing names over internal types. */
const getEditorSectionDisplayLabel = (section: {
  type: string;
  variant?: string;
  data?: SectionItem["data"];
}) => {
  if (section.variant?.startsWith("AboutPage")) return "About Story";
  if (section.type === "CTA") return "Call to action";
  if (section.type === "MissionPage") return "How we work";
  if (section.type === "MissionValues") return "Values";
  if (section.type === "CsrPage") return "Impact";
  if (section.type === "CsrPrograms") return "Programs";
  if (section.type === "CareerPage") return "Benefits";
  if (section.type === "CareerJobs") return "Open positions";
  if (section.type === "ContactPage") return "Details & form";
  // Realestate Cities-* is the portfolio / projects grid (not a "cities" list).
  if (section.type === "Cities") return "Portfolio";
  if (section.type === "CustomSection") {
    const data = getSectionVariantData(section as SectionItem);
    const name =
      typeof data?.sectionName === "string" ? data.sectionName.trim() : "";
    if (name) return name;
    return "Custom";
  }
  return section.type;
};

/** Always write edits to the visible section.variant, seeding from *-1/*-2 if needed. */
const resolveSectionVariantWriteTarget = (
  section: SectionItem,
  preferredVariant: string,
) => {
  const writeVariant =
    preferredVariant || section.variant || `${section.type}-1`;
  const fallbackVariant =
    (section.data?.[writeVariant] && writeVariant) ||
    (section.data?.[`${section.type}-1`] && `${section.type}-1`) ||
    (section.data?.[`${section.type}-2`] && `${section.type}-2`) ||
    Object.keys(section.data || {})[0];

  const baseData =
    section.data?.[writeVariant] ??
    (fallbackVariant ? section.data?.[fallbackVariant] : undefined);

  return {
    writeVariant,
    baseData: isRecord(baseData) ? (baseData as SectionData) : undefined,
  };
};

const getSectionLinkLabel = (section: SectionItem) =>
  getEditorSectionDisplayLabel(section);

const createPageSlug = (label: string) =>
  label.trim().toLowerCase().replace(/\s+/g, "-");

const normalizePageSlug = (value: string) => {
  const slug = createPageSlug(value);
  if (slug === "service") return "services";
  if (slug === "event") return "events";
  if (slug === "property") return "properties";
  if (slug === "portfolios") return "portfolio";
  if (slug === "team") return "teams";
  if (slug === "about-us") return "about";
  if (slug === "contact-us") return "contact";
  return slug;
};

type EditorPageLink = {
  label: string;
  href: string;
  children?: EditorPageLink[];
  menuType?: "link" | "dropdown" | "mega";
  kind?: "page" | "blogIndex" | "blog" | "document";
  hidden?: boolean;
  layout?: string;
  author?: string;
  image?: string;
  shortDescription?: string;
  longDescription?: string;
  category?: string;
  createdAt?: string;
};

const createBlogPageSection = (
  link: Pick<
    EditorPageLink,
    | "label"
    | "href"
    | "layout"
    | "author"
    | "image"
    | "shortDescription"
    | "longDescription"
    | "category"
  >,
): SectionItem | null => {
  const pageSlug = getMultiPageSlugFromHref(link.href);
  const label = link.label.trim();
  if (!pageSlug || !label) return null;

  const author = link.author?.trim() || "Website author";
  const image = link.image?.trim() || "/bg1.jpg";
  const excerpt =
    link.shortDescription?.trim() ||
    "Add a short introduction for this article.";
  const content =
    link.longDescription?.trim() || "Write the full blog content here.";
  const category = link.category?.trim() || "General";
  const variant =
    link.layout && /^BlogPage-[1-5]$/.test(link.layout)
      ? link.layout
      : "BlogPage-1";

  const variantData = {
    title: label,
    author,
    category,
    excerpt,
    content,
    image,
    layout: variant,
  };

  return {
    id: `BlogPage-${pageSlug}`,
    page: pageSlug,
    type: "BlogPage",
    variant,
    data: {
      "BlogPage-1": { ...variantData, layout: "BlogPage-1" },
      "BlogPage-2": { ...variantData, layout: "BlogPage-2" },
      "BlogPage-3": { ...variantData, layout: "BlogPage-3" },
      "BlogPage-4": { ...variantData, layout: "BlogPage-4" },
      "BlogPage-5": { ...variantData, layout: "BlogPage-5" },
    },
  } as SectionItem;
};

let customRuntimeId = 0;
const nextCustomRuntimeId = (prefix: string) => {
  customRuntimeId += 1;
  return `${prefix}-${customRuntimeId}`;
};

/** Bump when AI apply listener body must rebind after HMR (empty-deps trap). */
const AI_APPLY_ACTIONS_REV = 4;

type CustomSectionColumnRecord = {
  id?: string;
  elements?: Array<Record<string, unknown>>;
};

const seedCustomRuntimeIdFromSections = (sections: SectionItem[]) => {
  let maxId = customRuntimeId;

  const bump = (value: string) => {
    const match = value.match(/-(\d+)$/);
    if (!match) return;
    maxId = Math.max(maxId, Number(match[1]));
  };

  for (const section of sections) {
    if (section.type !== "CustomSection") continue;
    bump(getCustomSectionRuntimeId(section));
    const variantData = section.data?.[section.variant] ?? {};
    if (!Array.isArray(variantData.columns)) continue;
    for (const column of variantData.columns as CustomSectionColumnRecord[]) {
      if (typeof column.id === "string") bump(column.id);
      for (const element of column.elements ?? []) {
        if (typeof element.id === "string") bump(element.id);
      }
    }
  }

  customRuntimeId = maxId;
};

const normalizeCustomSectionColumns = (
  columns: CustomSectionColumnRecord[],
) => {
  const usedColumnIds = new Set<string>();
  // Element ids must be unique across the whole section (updates match by id).
  const usedElementIds = new Set<string>();

  return columns.map((column) => {
    let columnId = typeof column.id === "string" ? column.id.trim() : "";
    if (!columnId || usedColumnIds.has(columnId)) {
      columnId = nextCustomRuntimeId("column");
    }
    usedColumnIds.add(columnId);

    const elements = (column.elements ?? []).map((element) => {
      let elementId =
        typeof element.id === "string" ? String(element.id).trim() : "";
      if (!elementId || usedElementIds.has(elementId)) {
        elementId = nextCustomRuntimeId(String(element.type ?? "element"));
      }
      usedElementIds.add(elementId);
      return element.id === elementId ? element : { ...element, id: elementId };
    });

    const columnChanged =
      column.id !== columnId ||
      elements.some((element, index) => element !== column.elements?.[index]);

    return columnChanged ? { ...column, id: columnId, elements } : column;
  });
};

/** Keep live image widgets if an AI columns patch omitted them. */
const preserveCustomSectionImages = (
  liveColumns: CustomSectionColumnRecord[],
  nextColumns: CustomSectionColumnRecord[],
): CustomSectionColumnRecord[] => {
  if (!Array.isArray(liveColumns) || !liveColumns.length) return nextColumns;
  if (!Array.isArray(nextColumns) || !nextColumns.length) return liveColumns;

  return nextColumns.map((column, columnIndex) => {
    const live = liveColumns[columnIndex];
    if (!live || !Array.isArray(live.elements)) return column;

    const liveImages = live.elements.filter(
      (element) =>
        element &&
        typeof element === "object" &&
        (element as { type?: string }).type === "image",
    );
    if (!liveImages.length) return column;

    const nextElements = Array.isArray(column.elements)
      ? [...column.elements]
      : [];
    const nextHasImage = nextElements.some(
      (element) =>
        element &&
        typeof element === "object" &&
        (element as { type?: string }).type === "image",
    );
    // If AI already included image widgets, trust that patch.
    if (nextHasImage) return column;

    for (const image of liveImages) {
      const imageId =
        typeof image.id === "string" ? image.id : String(image.id ?? "");
      const already = nextElements.some(
        (element) =>
          element &&
          typeof element === "object" &&
          String((element as { id?: string }).id ?? "") === imageId,
      );
      if (already) continue;
      const liveIndex = live.elements!.findIndex(
        (element) =>
          element &&
          typeof element === "object" &&
          String((element as { id?: string }).id ?? "") === imageId,
      );
      const insertAt =
        liveIndex >= 0
          ? Math.min(liveIndex, nextElements.length)
          : nextElements.length;
      nextElements.splice(insertAt, 0, image);
    }

    return { ...column, elements: nextElements };
  });
};

const getCustomSectionRuntimeId = (section: SectionItem) => {
  if (section.type !== "CustomSection") {
    return section.id ?? section.type;
  }
  const variantData = section.data?.[section.variant] ?? {};
  const fromData =
    typeof variantData.customSectionId === "string"
      ? variantData.customSectionId.trim()
      : "";
  return fromData || section.id?.trim() || section.type;
};

const sectionMatchesCustomEvent = (
  section: SectionItem,
  eventSectionId: string,
) => {
  if (!eventSectionId) return false;
  if (section.type !== "CustomSection") {
    return (section.id ?? section.type) === eventSectionId;
  }
  const runtimeId = getCustomSectionRuntimeId(section);
  return (
    runtimeId === eventSectionId ||
    (section.id ?? section.type) === eventSectionId
  );
};

const syncCustomSectionIds = (sections: SectionItem[]) =>
  sections.map((section) => {
    if (section.type !== "CustomSection") return section;
    const variant = section.variant;
    const variantData = section.data?.[variant] ?? {};
    const nextId =
      section.id?.trim() ||
      (typeof variantData.customSectionId === "string"
        ? variantData.customSectionId.trim()
        : "") ||
      nextCustomRuntimeId("CustomSection");
    const currentCustomId =
      typeof variantData.customSectionId === "string"
        ? variantData.customSectionId.trim()
        : "";
    const rawColumns = Array.isArray(variantData.columns)
      ? (variantData.columns as CustomSectionColumnRecord[])
      : [];
    const columns = normalizeCustomSectionColumns(rawColumns);
    const columnsChanged = columns.some(
      (column, index) => column !== rawColumns[index],
    );
    if (
      section.id === nextId &&
      currentCustomId === nextId &&
      !columnsChanged
    ) {
      return section;
    }
    return {
      ...section,
      id: nextId,
      data: {
        ...section.data,
        [variant]: {
          ...variantData,
          customSectionId: nextId,
          ...(rawColumns.length > 0 ? { columns } : {}),
        },
      },
    };
  });

const getSectionPageLinks = (sections: SectionItem[]): EditorPageLink[] => {
  const headerSection = sections.find((section) => section.type === "Header");
  if (!headerSection?.data) return [];

  const seen = new Set<string>();
  const out: EditorPageLink[] = [];
  const pushLinks = (links: EditorPageLink[]) => {
    for (const link of flattenPageLinks(links)) {
      const key = `${(link.label || "").trim().toLowerCase()}|${(
        link.href || ""
      )
        .trim()
        .toLowerCase()}`;
      if (!key || key === "|" || seen.has(key)) continue;
      seen.add(key);
      out.push(link);
    }
  };

  const readFromVariant = (variantData: unknown) => {
    if (!variantData || typeof variantData !== "object") return;
    const data = variantData as SectionData & { blocks?: unknown[] };
    if (Array.isArray(data.menu) && data.menu.length) {
      pushLinks(data.menu as EditorPageLink[]);
    }
    const blocks = Array.isArray(data.blocks) ? data.blocks : [];
    for (const block of blocks) {
      if (!block || typeof block !== "object") continue;
      const row = block as Record<string, unknown>;
      if (row.type !== "menu" || !Array.isArray(row.items)) continue;
      pushLinks(row.items as EditorPageLink[]);
    }
  };

  // Active variant first, then every stored variant (Loan may live on Header-1
  // while the template currently uses Header-2, etc.).
  readFromVariant(headerSection.data[headerSection.variant]);
  for (const variantData of Object.values(headerSection.data)) {
    readFromVariant(variantData);
  }

  return out;
};

/** Collect nav links from Pages inventory + Header menu/blocks. */
const collectEditorPageCandidates = (
  pageLinks: EditorPageLink[],
  sections: SectionItem[],
): EditorPageLink[] => {
  const fromPages = flattenPageLinks(pageLinks);
  const fromHeader = flattenPageLinks(getSectionPageLinks(sections));
  const seen = new Set<string>();
  const out: EditorPageLink[] = [];
  for (const link of [...fromPages, ...fromHeader]) {
    const key = `${(link.label || "").trim().toLowerCase()}|${(
      link.href || ""
    )
      .trim()
      .toLowerCase()}`;
    if (!key || key === "|" || seen.has(key)) continue;
    seen.add(key);
    out.push(link);
  }
  return out;
};

const resolveSavedPageLinks = (
  links: EditorDraftPageLink[] | EditorPageLink[] | undefined,
  sections: SectionItem[],
): EditorPageLink[] =>
  Array.isArray(links) && links.length
    ? (links as EditorPageLink[])
    : getSectionPageLinks(sections);

const flattenPageLinks = (links: EditorPageLink[]): EditorPageLink[] =>
  links.flatMap((link) => [link, ...flattenPageLinks(link.children ?? [])]);

const getMultiPageSlugFromHref = (href: string) => {
  const normalizedHref = href.trim().toLowerCase();
  if (!normalizedHref.startsWith("#page-")) return "";
  return normalizePageSlug(normalizedHref.slice("#page-".length));
};

const resolveEditorPageLabel = (
  raw: string | null | undefined,
  pageLinks: EditorPageLink[],
) => {
  const value = (raw || "").trim();
  if (!value) return "Home";
  const slug = normalizePageSlug(value.replace(/^page[\s/_-]+/i, ""));
  if (!slug || slug === "home") return "Home";
  const match = flattenPageLinks(pageLinks).find((link) => {
    const hrefSlug = getMultiPageSlugFromHref(link.href || "");
    return hrefSlug === slug || normalizePageSlug(link.label) === slug;
  });
  return match?.label || value;
};

const isEventsPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
}) => {
  const href = (link.href || "").trim().toLowerCase();
  const slug =
    getMultiPageSlugFromHref(link.href || "") ||
    normalizePageSlug(link.label || "");
  return (
    slug === "events" ||
    href === "#page-event" ||
    href === "#page-events" ||
    href === "#event" ||
    href === "#events" ||
    (link.label || "").trim().toLowerCase() === "event" ||
    (link.label || "").trim().toLowerCase() === "events"
  );
};

const isPropertiesPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
}) => {
  const href = (link.href || "").trim().toLowerCase();
  const slug =
    getMultiPageSlugFromHref(link.href || "") ||
    normalizePageSlug(link.label || "");
  return (
    slug === "properties" ||
    href === "#page-property" ||
    href === "#page-properties" ||
    href === "#property" ||
    href === "#properties" ||
    (link.label || "").trim().toLowerCase() === "property" ||
    (link.label || "").trim().toLowerCase() === "properties"
  );
};

const isPortfolioPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
}) => {
  const href = (link.href || "").trim().toLowerCase();
  const slug =
    getMultiPageSlugFromHref(link.href || "") ||
    normalizePageSlug(link.label || "");
  return (
    slug === "portfolio" ||
    slug === "portfolios" ||
    slug === "projects" ||
    slug === "project" ||
    href === "#page-portfolio" ||
    href === "#page-portfolios" ||
    href === "#page-projects" ||
    href === "#page-project" ||
    href === "#portfolio" ||
    href === "#portfolios" ||
    href === "#projects" ||
    (link.label || "").trim().toLowerCase() === "portfolio" ||
    (link.label || "").trim().toLowerCase() === "portfolios" ||
    (link.label || "").trim().toLowerCase() === "projects" ||
    (link.label || "").trim().toLowerCase() === "project"
  );
};

const isTeamPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
}) => {
  const href = (link.href || "").trim().toLowerCase();
  const slug =
    getMultiPageSlugFromHref(link.href || "") ||
    normalizePageSlug(link.label || "");
  return (
    slug === "teams" ||
    href === "#page-team" ||
    href === "#page-teams" ||
    href === "#team" ||
    href === "#teams" ||
    (link.label || "").trim().toLowerCase() === "team" ||
    (link.label || "").trim().toLowerCase() === "teams"
  );
};

const isGalleryPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
}) => {
  const href = (link.href || "").trim().toLowerCase();
  const slug =
    getMultiPageSlugFromHref(link.href || "") ||
    normalizePageSlug(link.label || "");
  return (
    slug === "gallery" ||
    href === "#page-gallery" ||
    href === "#gallery" ||
    (link.label || "").trim().toLowerCase() === "gallery"
  );
};

const isServicesPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
}) => {
  const href = (link.href || "").trim().toLowerCase();
  const slug =
    getMultiPageSlugFromHref(link.href || "") ||
    normalizePageSlug(link.label || "");
  return (
    slug === "services" ||
    slug === "service" ||
    href === "#page-service" ||
    href === "#page-services" ||
    href === "#service" ||
    href === "#services" ||
    (link.label || "").trim().toLowerCase() === "service" ||
    (link.label || "").trim().toLowerCase() === "services"
  );
};

const canonicalizeEventsPageLink = (
  link: EditorPageLink,
): EditorPageLink => ({
  ...link,
  label: "Events",
  href: "#page-events",
  children: undefined,
});

const canonicalizePropertiesPageLink = (
  link: EditorPageLink,
): EditorPageLink => ({
  ...link,
  label: "Properties",
  href: "#page-properties",
  children: undefined,
});

const canonicalizePortfolioPageLink = (
  link: EditorPageLink,
  templateId?: string | null,
  category?: string | null,
): EditorPageLink => {
  const nav = resolveThemePortfolioNavLink(templateId, category);
  const slug = getMultiPageSlugFromHref(link.href);
  // Keep an existing theme projects/portfolio slug; only normalize aliases.
  if (slug === nav.slug) {
    return {
      ...link,
      label: link.label || nav.label,
      href: nav.href,
      children: undefined,
    };
  }
  if (slug === "projects" || slug === "project" || slug === "portfolio" || slug === "portfolios") {
    return {
      ...link,
      label: nav.label,
      href: nav.href,
      children: undefined,
    };
  }
  return {
    ...link,
    label: nav.label,
    href: nav.href,
    children: undefined,
  };
};

const canonicalizeTeamPageLink = (
  link: EditorPageLink,
): EditorPageLink => ({
  ...link,
  label: "Teams",
  href: "#page-teams",
  children: undefined,
});

const canonicalizeGalleryPageLink = (
  link: EditorPageLink,
): EditorPageLink => ({
  ...link,
  label: "Gallery",
  href: "#page-gallery",
  children: undefined,
});

const managerKindFromPageLink = (
  link: EditorPageLink,
): ThemeManagerKey | null => {
  if (link.kind === "blog") return null;
  if (isBlogIndexPageLink(link)) return "blogs";
  if (isServicesPageLink(link)) return "services";
  if (isEventsPageLink(link)) return "events";
  if (isPropertiesPageLink(link)) return "properties";
  if (isPortfolioPageLink(link)) return "portfolio";
  if (isTeamPageLink(link)) return "teams";
  if (isGalleryPageLink(link)) return "gallery";
  return null;
};

const applyThemeManagerWebsiteDefaults = (
  links: EditorPageLink[],
  templateId: string,
  category?: string | null,
): EditorPageLink[] => {
  const theme = getThemeManagerVisibility(templateId, category);
  return links.map((link) => {
    const kind = managerKindFromPageLink(link);
    if (!kind || typeof link.hidden === "boolean") return link;
    return { ...link, hidden: !theme[kind] };
  });
};

/** Collapse duplicate page entries that share a normalized #page-* slug. */
const dedupeEditorPageLinksBySlug = (
  links: EditorPageLink[],
): EditorPageLink[] => {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (link.kind === "blog") {
      const key = `blog:${link.href.trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }
    if (isEventsPageLink(link)) {
      if (seen.has("page:events")) return false;
      seen.add("page:events");
      return true;
    }
    if (isPropertiesPageLink(link)) {
      if (seen.has("page:properties")) return false;
      seen.add("page:properties");
      return true;
    }
    if (isPortfolioPageLink(link)) {
      if (seen.has("page:portfolio")) return false;
      seen.add("page:portfolio");
      return true;
    }
    if (isTeamPageLink(link)) {
      if (seen.has("page:teams")) return false;
      seen.add("page:teams");
      return true;
    }
    if (isGalleryPageLink(link)) {
      if (seen.has("page:gallery")) return false;
      seen.add("page:gallery");
      return true;
    }
    const slug = getMultiPageSlugFromHref(link.href);
    if (slug) {
      const key = `page:${slug}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }
    const labelSlug = normalizePageSlug(link.label);
    const key = `href:${link.href.trim().toLowerCase()}|label:${labelSlug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildTemplateMultiPageMenu = (
  templateId: string,
  currentLinks: EditorPageLink[],
  category?: string | null,
): EditorPageLink[] => {
  const template = getBuilderTemplate(templateId, category);
  const definitions = getTemplatePages(template);
  const flattenedLinks = flattenPageLinks(currentLinks);
  const navigationLinks = flattenedLinks.filter(
    (link) => link.kind !== "blog",
  );
  const blogRecords = flattenedLinks
    .filter((link) => link.kind === "blog")
    .map((link) => ({ ...link, children: undefined }));
  const hasMultiPageIdentity = navigationLinks.some((link) =>
    link.href.trim().toLowerCase().startsWith("#page-"),
  );
  const savedBySlug = new Map(
    navigationLinks.flatMap((link) => {
      const slug = getMultiPageSlugFromHref(link.href);
      return slug ? [[slug, link] as const] : [];
    }),
  );
  const homeLink = currentLinks.find(
    (link) => normalizePageSlug(link.label) === "home",
  );
  // Pages inventory always includes the full theme page list. Header nav is
  // controlled separately (onboarding Choose pages / Nav Menu editor).
  const canonicalLinks = definitions.map((definition) => {
    const slug = normalizePageSlug(definition.id);
    const savedLink = savedBySlug.get(slug);
    return {
      ...(savedLink || {}),
      label: savedLink?.label || definition.label,
      href: `#page-${slug}`,
    };
  });
  const definitionSlugs = new Set(
    definitions.map((definition) => normalizePageSlug(definition.id)),
  );
  const seenCustomSlugs = new Set<string>();
  const customPageLinks = hasMultiPageIdentity
    ? navigationLinks.flatMap((link) => {
        const slug = getMultiPageSlugFromHref(link.href);
        if (!slug || definitionSlugs.has(slug) || seenCustomSlugs.has(slug)) {
          return [];
        }
        seenCustomSlugs.add(slug);
        if (slug === "events") {
          return [canonicalizeEventsPageLink(link)];
        }
        if (slug === "portfolio" || slug === "projects" || slug === "project") {
          return [canonicalizePortfolioPageLink(link, templateId, category)];
        }
        if (slug === "teams") {
          return [canonicalizeTeamPageLink(link)];
        }
        if (slug === "gallery") {
          return [canonicalizeGalleryPageLink(link)];
        }
        return [{ ...link, children: undefined }];
      })
    : [];
  // Keep manually added external / path links so Nav Menu add/delete sticks.
  const manualLinks = navigationLinks.filter((link) => {
    const href = link.href.trim().toLowerCase();
    if (normalizePageSlug(link.label) === "home" || href === "#") return false;
    if (getMultiPageSlugFromHref(link.href)) return false;
    if (isEventsPageLink(link)) return false;
    if (isPortfolioPageLink(link)) return false;
    if (isTeamPageLink(link)) return false;
    if (isGalleryPageLink(link)) return false;
    if (link.kind === "blogIndex" || href === "#page-blogs") return false;
    // Avoid duplicating legacy hash nav while the multi-page menu is still seeding.
    if (!hasMultiPageIdentity && href.startsWith("#")) return false;
    return true;
  });

  return applyThemeManagerWebsiteDefaults(
    dedupeEditorPageLinksBySlug([
      { ...(homeLink || {}), label: homeLink?.label || "Home", href: "#" },
      ...canonicalLinks,
      ...customPageLinks,
      ...manualLinks,
      ...blogRecords,
    ]),
    templateId,
    category,
  );
};

/** Re-attach custom pages (e.g. "ram") that still have sections but were dropped from pageLinks. */
const recoverCustomPageLinksFromSections = (
  links: EditorPageLink[],
  sections: SectionItem[],
  templateId: string,
  category?: string | null,
): EditorPageLink[] => {
  const template = getBuilderTemplate(templateId, category);
  if (template.type === "Single Page Website") return links;

  const themeSlugs = new Set(
    getTemplatePages(template).map((page) => normalizePageSlug(page.id)),
  );
  const reservedSlugs = new Set([
    ...themeSlugs,
    "home",
    "blogs",
    "blog",
    "services",
    "events",
    "properties",
    "portfolio",
    "portfolios",
    "projects",
    "project",
    "teams",
    "gallery",
    "countries",
    "countries-we-serve",
  ]);

  const existingSlugs = new Set(
    flattenPageLinks(links).flatMap((link) => {
      const slug =
        getMultiPageSlugFromHref(link.href || "") ||
        normalizePageSlug(link.label || "");
      return slug ? [slug] : [];
    }),
  );

  const labelBySlug = new Map<string, string>();
  for (const section of sections) {
    const page = normalizePageSlug(section.page || "");
    if (!page || reservedSlugs.has(page) || existingSlugs.has(page)) continue;

    const id = (section.id || "").toLowerCase();
    const looksCustom =
      id.startsWith("custompage") ||
      section.type === "CustomSection" ||
      section.type === "Breadcrumb";
    // Any leftover page-scoped body for a non-theme slug counts too.
    const looksPageBody =
      Boolean(section.page) &&
      section.type !== "Header" &&
      section.type !== "Footer" &&
      section.type !== "Topbar" &&
      section.type !== "MissionValues" &&
      section.type !== "CsrPrograms" &&
      section.type !== "CareerJobs" &&
      section.type !== "Stats" &&
      section.type !== "CTA";

    if (!looksCustom && !looksPageBody) continue;

    let label =
      labelBySlug.get(page) ||
      page
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ") ||
      page;

    if (section.type === "Breadcrumb") {
      const data = (section.data?.[section.variant] ||
        Object.values(section.data || {})[0] ||
        {}) as SectionData;
      if (typeof data.title === "string" && data.title.trim()) {
        label = data.title.trim();
      }
    }

    labelBySlug.set(page, label);
  }

  if (!labelBySlug.size) return links;

  return [
    ...links,
    ...Array.from(labelBySlug.entries()).map(([slug, label]) => ({
      label,
      href: `#page-${slug}`,
    })),
  ];
};

const normalizeEditorPageLinks = (
  templateId: string,
  sections: SectionItem[],
  links: EditorPageLink[],
  category?: string | null,
  options?: { redesignHomeOnly?: boolean; redesignSinglePage?: boolean },
) => {
  const withRecoveredBlogs = recoverBlogPageLinksFromSections(links, sections);
  const withRecoveredCustom = recoverCustomPageLinksFromSections(
    withRecoveredBlogs,
    sections,
    templateId,
    category,
  );

  // Redesign single-page: section scroll menu only (drop domain void/#orphan labels).
  if (options?.redesignSinglePage) {
    const preserved = withRecoveredCustom.filter(
      (link) =>
        link.kind === "blog" ||
        link.kind === "document" ||
        isSinglePageBlogNavLink(link),
    );
    return buildSectionSyncedSinglePageMenu(sections, preserved, {
      appendMissingSectionLinks: true,
    });
  }

  // Redesign multi-page home-first: keep domain nav placeholders (javascript:void)
  // — never expand template multi-page inventory (that fight causes infinite setState hangs).
  if (options?.redesignHomeOnly) {
    let sourceLinks = links;
    const nonBlogCount = sourceLinks.filter((l) => l?.kind !== "blog").length;
    // Heal: Pages dropdown only had Home while Header already shows domain nav.
    if (nonBlogCount <= 1) {
      const header = sections.find((section) => section.type === "Header");
      const menu = header?.data?.[header.variant]?.menu;
      if (Array.isArray(menu) && menu.length > 1) {
        sourceLinks = menu
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const row = item as { label?: string; href?: string };
            const label = (row.label || "").trim();
            if (!label) return null;
            return {
              label,
              href: /^home$/i.test(label)
                ? "#"
                : (row.href || "javascript:void(0)").trim() ||
                  "javascript:void(0)",
            } as EditorPageLink;
          })
          .filter(Boolean) as EditorPageLink[];
      }
    }
    const seen = new Set<string>();
    const cleaned: EditorPageLink[] = [];
    for (const link of sourceLinks) {
      if (!link || link.kind === "blog") continue;
      const label = (link.label || "").trim() || "Page";
      if (
        /privacy|terms|cookie|sitemap|disclaimer|refund|shipping|policy$/i.test(
          label,
        )
      ) {
        continue;
      }
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (/^home$/i.test(label)) {
        cleaned.push({ label: "Home", href: "#" });
        continue;
      }
      const slug = normalizePageSlug(createPageSlug(label));
      cleaned.push({
        label,
        href: slug ? `#page-${slug}` : "javascript:void(0)",
      });
      if (cleaned.length >= 6) break;
    }
    const hasHome = cleaned.some((l) => /^home$/i.test(l.label));
    if (!hasHome) {
      cleaned.unshift({ label: "Home", href: "#" });
    }
    return cleaned.slice(0, 6);
  }

  const template = getBuilderTemplate(templateId, category);
  if (template.type !== "Single Page Website") {
    return applyThemeManagerWebsiteDefaults(
      dropOrphanManagerPageLinks(
        buildTemplateMultiPageMenu(templateId, withRecoveredCustom, category),
        sections,
        templateId,
        category,
      ),
      templateId,
      category,
    );
  }

  // Premium long homes previously stamped every section into the header.
  // Heal overcrowded auto-nav back to the curated single-page menu.
  const navOnly = withRecoveredCustom.filter(
    (link) =>
      link.kind !== "blog" &&
      link.kind !== "document" &&
      !isSinglePageBlogNavLink(link),
  );
  const longHome =
    Array.isArray(template.homeSectionOrder) &&
    template.homeSectionOrder.length > 10;
  if (longHome && navOnly.length > 8) {
    const curated = getSinglePageTemplateMenu(template);
    const preserved = withRecoveredCustom.filter(
      (link) =>
        link.kind === "blog" ||
        link.kind === "document" ||
        isSinglePageBlogNavLink(link),
    );
    return applyThemeManagerWebsiteDefaults(
      buildSectionSyncedSinglePageMenu(sections, [
        ...curated,
        ...preserved,
      ]),
      templateId,
      category,
    );
  }

  // Heal multiâ†’single leftovers: bare #page-* links that are not in the
  // current header become document pages (hidden from header sync).
  const headerMenu = getSectionPageLinks(sections);
  const headerHrefs = new Set(
    flattenPageLinks(headerMenu).map((link) => link.href.trim().toLowerCase()),
  );
  const headerLabels = new Set(
    flattenPageLinks(headerMenu).map((link) =>
      link.label.trim().toLowerCase(),
    ),
  );
  const adjusted = withRecoveredBlogs.map((link) => {
    if (
      link.kind === "blog" ||
      link.kind === "document" ||
      isSinglePageBlogNavLink(link)
    ) {
      return link;
    }
    const href = link.href.trim().toLowerCase();
    if (!href.startsWith("#page-")) return link;
    if (
      headerHrefs.has(href) ||
      headerLabels.has(link.label.trim().toLowerCase())
    ) {
      return link;
    }
    return { ...link, kind: "document" as const };
  });

  return applyThemeManagerWebsiteDefaults(
    buildSectionSyncedSinglePageMenu(sections, adjusted),
    templateId,
    category,
  );
};

/** Theme switch: start from the new theme's pages, then keep user-added pages. */
const buildThemeSwitchPageLinks = (
  nextTemplateId: string,
  nextThemeSections: SectionItem[],
  currentPageLinks: EditorPageLink[],
  currentSections: SectionItem[] = [],
  category?: string | null,
  previousTemplateId?: string | null,
): EditorPageLink[] => {
  const template = getBuilderTemplate(nextTemplateId, category);
  const isMulti = template.type === "Multiple Pages Website";

  if (!isMulti) {
    // Multi â†’ single: rebuild section nav from the destination theme. Do not
    // dump the whole multi-page Pages inventory into the single-page header.
    const sectionNav = buildSectionSyncedSinglePageMenu(
      nextThemeSections,
      [],
      { appendMissingSectionLinks: true },
    ).filter(
      (link) =>
        link.kind !== "blog" &&
        link.kind !== "document" &&
        !isSinglePageBlogNavLink(link),
    );

    const sectionLabels = new Set(
      sectionNav.map((link) => link.label.trim().toLowerCase()),
    );
    sectionLabels.add("home");

    const previousHeaderMenu = getSectionPageLinks(currentSections);
    const seenHrefs = new Set(
      flattenPageLinks(sectionNav).map((link) =>
        link.href.trim().toLowerCase(),
      ),
    );
    const seenLabels = new Set(sectionLabels);

    const customFromHeader = flattenPageLinks(previousHeaderMenu)
      .filter((link) => {
        if (
          link.kind === "blog" ||
          link.kind === "document" ||
          isSinglePageBlogNavLink(link)
        ) {
          return false;
        }
        const label = link.label.trim().toLowerCase();
        const href = link.href.trim().toLowerCase();
        if (!label || label === "home" || href === "#") return false;
        if (seenLabels.has(label) || seenHrefs.has(href)) return false;
        return true;
      })
      .map((link) => {
        const href = link.href.trim().toLowerCase();
        seenHrefs.add(href);
        seenLabels.add(link.label.trim().toLowerCase());
        return { ...link, children: undefined };
      });

    const blogNavigationLinks = flattenPageLinks([
      ...previousHeaderMenu,
      ...currentPageLinks,
    ])
      .filter(isSinglePageBlogNavLink)
      .map((link) => ({
        ...link,
        kind: "blogIndex" as const,
        href: "#page-blogs",
        children: undefined,
      }));
    const blogIndex =
      blogNavigationLinks[0] != null
        ? [blogNavigationLinks[0]]
        : [];

    const blogRecords = flattenPageLinks(currentPageLinks)
      .filter(
        (link) =>
          link.kind === "blog" &&
          Boolean(getMultiPageSlugFromHref(link.href)),
      )
      .map((link) => ({ ...link, children: undefined }));

    const documentSeen = new Set<string>();
    const documents: EditorPageLink[] = [];
    const pushDocument = (link: EditorPageLink) => {
      const href = link.href.trim().toLowerCase();
      const label = link.label.trim().toLowerCase();
      if (!href || href === "#" || label === "home") return;
      if (isSinglePageBlogNavLink(link) || link.kind === "blog") return;
      if (documentSeen.has(href) || seenHrefs.has(href)) return;
      if (seenLabels.has(label) && !href.startsWith("#page-")) return;
      documentSeen.add(href);
      documents.push({
        ...link,
        kind: "document",
        children: undefined,
      });
    };

    flattenPageLinks(currentPageLinks).forEach((link) => {
      if (link.kind === "document") {
        pushDocument(link);
        return;
      }
      if (link.kind === "blog" || isSinglePageBlogNavLink(link)) return;
      const href = link.href.trim().toLowerCase();
      const label = link.label.trim().toLowerCase();
      // Multi-page pages that are not in the new single-page nav become
      // document pages (Privacy/Terms/etc.) instead of header clutter.
      if (
        href.startsWith("#page-") &&
        !seenHrefs.has(href) &&
        !seenLabels.has(label) &&
        !customFromHeader.some(
          (item) => item.href.trim().toLowerCase() === href,
        )
      ) {
        pushDocument(link);
      }
    });

    return [
      ...sectionNav,
      ...customFromHeader,
      ...blogIndex,
      ...documents,
      ...blogRecords,
    ];
  }

  const themeMenu = getSectionPageLinks(nextThemeSections);
  const themeBase = buildTemplateMultiPageMenu(
    nextTemplateId,
    themeMenu.length ? themeMenu : [],
    category,
  );
  const templateSlugs = new Set(
    getTemplatePages(template).map((page) => normalizePageSlug(page.id)),
  );
  templateSlugs.add("home");
  const previousTemplateSlugs = new Set(
    getTemplatePages(
      getBuilderTemplate(previousTemplateId, category),
    ).map((page) => normalizePageSlug(page.id)),
  );

  const seen = new Set(
    flattenPageLinks(themeBase).map((link) => link.href.trim().toLowerCase()),
  );
  const merged = [...themeBase];

  flattenPageLinks(currentPageLinks).forEach((link) => {
    if (link.kind === "blog" || link.kind === "document") {
      const key = link.href.trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push({ ...link, children: undefined });
      return;
    }

    if (link.kind === "blogIndex") {
      const key = link.href.trim().toLowerCase() || "#page-blogs";
      if (seen.has(key)) return;
      seen.add(key);
      merged.push({ ...link, href: "#page-blogs", children: undefined });
      return;
    }

    const slug = getMultiPageSlugFromHref(link.href);
    if (!slug || templateSlugs.has(slug) || previousTemplateSlugs.has(slug)) {
      return;
    }
    const key = link.href.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push({ ...link, children: undefined });
  });

  return merged;
};

/** Header nav on theme switch: theme menu + user-added custom pages. */
const buildThemeSwitchHeaderMenu = (
  nextTemplateId: string,
  nextThemeSections: SectionItem[],
  nextPageLinks: EditorPageLink[],
  category?: string | null,
  previousTemplateId?: string | null,
): EditorPageLink[] => {
  const template = getBuilderTemplate(nextTemplateId, category);
  const templateSlugs = new Set(
    getTemplatePages(template).map((page) => normalizePageSlug(page.id)),
  );
  templateSlugs.add("home");
  const previousTemplateSlugs = new Set(
    getTemplatePages(
      getBuilderTemplate(previousTemplateId, category),
    ).map((page) => normalizePageSlug(page.id)),
  );

  const themeMenu = getSectionPageLinks(nextThemeSections)
    .filter(
      (link) =>
        link.kind !== "blog" && link.kind !== "document" && !link.hidden,
    )
    .map((link) => ({ ...link, children: link.children }));

  const baseMenu =
    themeMenu.length > 0
      ? themeMenu
      : nextPageLinks.filter((link) => {
          if (link.kind === "blog" || link.kind === "document" || link.hidden) {
            return false;
          }
          const href = link.href.trim().toLowerCase();
          if (href === "#") return true;
          const slug = getMultiPageSlugFromHref(link.href);
          return Boolean(slug && templateSlugs.has(slug));
        });

  const seen = new Set(
    flattenPageLinks(baseMenu).map((link) => link.href.trim().toLowerCase()),
  );
  const extras: EditorPageLink[] = [];

  flattenPageLinks(nextPageLinks).forEach((link) => {
    if (link.kind === "blog" || link.kind === "document" || link.hidden) return;
    const href = link.href.trim().toLowerCase();
    if (!href || seen.has(href) || href === "#") return;
    if (href.startsWith("#page-")) return;
    const slug = getMultiPageSlugFromHref(link.href);
    if (slug && (templateSlugs.has(slug) || previousTemplateSlugs.has(slug))) {
      return;
    }
    seen.add(href);
    extras.push({ ...link, children: undefined });
  });

  return [...baseMenu, ...extras];
};

const lockedSectionTypes = new Set(["Topbar", "Header", "Footer"]);

const isLockedSection = (section?: SectionItem) =>
  Boolean(section && lockedSectionTypes.has(section.type));

const PAGE_SHELL_SECTION_TYPES = new Set(["Topbar", "Header", "Footer"]);

const isCountriesServeEnabledInEditor = (section: SectionItem) => {
  if (section.type !== "CountriesServe") return true;
  const data =
    (section.data?.[section.variant] as SectionData | undefined) ||
    (section.data?.["CountriesServe-1"] as SectionData | undefined) ||
    ({} as SectionData);
  return data.countriesServeWebsiteEnabled !== false;
};

const findEnabledCountriesServeSection = (sections: SectionItem[]) => {
  const section = sections.find((item) => item.type === "CountriesServe");
  if (!section || !isCountriesServeEnabledInEditor(section)) return null;
  return section;
};

const placeCountriesServeBeforeFooter = (
  sections: SectionItem[],
  countriesSection: SectionItem | null,
) => {
  const without = sections.filter(
    (section) => section.type !== "CountriesServe",
  );
  if (!countriesSection) return without;
  const footerIndex = without.findIndex(
    (section) => section.type === "Footer",
  );
  if (footerIndex === -1) return [...without, countriesSection];
  return [
    ...without.slice(0, footerIndex),
    countriesSection,
    ...without.slice(footerIndex),
  ];
};

/** Same visibility rules as the editor canvas (home hides dormant .page sections). */
const isSectionVisibleInEditor = (
  section: SectionItem,
  pageSlug: string,
) => {
  if (section.type === "CountriesServe") {
    return isCountriesServeEnabledInEditor(section);
  }
  if (pageSlug && pageSlug !== "home") {
    return (
      PAGE_SHELL_SECTION_TYPES.has(section.type) ||
      normalizePageSlug(section.page || "") === pageSlug
    );
  }
  return !section.page;
};

/** Find adjacent visible, unlocked neighbor for move up/down. */
const findMovableNeighborIndex = (
  sections: SectionItem[],
  fromIndex: number,
  direction: -1 | 1,
  pageSlug: string,
) => {
  let targetIndex = fromIndex + direction;
  while (targetIndex >= 0 && targetIndex < sections.length) {
    const candidate = sections[targetIndex];
    if (
      isSectionVisibleInEditor(candidate, pageSlug) &&
      !isLockedSection(candidate)
    ) {
      return targetIndex;
    }
    targetIndex += direction;
  }
  return -1;
};

const ensureUniqueSectionIds = (sections: SectionItem[]) => {
  seedCustomRuntimeIdFromSections(sections);
  const usedIds = new Set<string>();

  const withUnique = sections.map((section, index) => {
    const baseId = section.id?.trim() || section.type || `Section-${index + 1}`;
    let nextId = baseId;
    let suffix = 2;

    while (usedIds.has(nextId)) {
      nextId = `${baseId}-${suffix}`;
      suffix += 1;
    }

    usedIds.add(nextId);
    return section.id === nextId ? section : { ...section, id: nextId };
  });

  return syncCustomSectionIds(withUnique);
};

const cloneSections = (sections: SectionItem[]) =>
  structuredClone(sections) as SectionItem[];

const alignTemplatePageSections = (
  sections: SectionItem[],
  templateId: string,
  category: string,
  pageLinks?: EditorPageLink[],
) => {
  const template = getBuilderTemplate(templateId, category);
  if (template.type === "Single Page Website") {
    // A single-page theme must only *hide* page-scoped sections. Removing them
    // here destroyed the user's About/Services/etc. content, so switching back
    // to a multi-page theme rebuilt those pages from template defaults. Both
    // the editor and published renderer already exclude `section.page` entries
    // for single-page templates, which lets us retain them safely as dormant
    // project content for a later theme switch.
    return syncHomeCardsIntoManagers(ensureUniqueSectionIds(sections));
  }

  const allPageDefinitions = getTemplatePages(template);
  const multiPageSlugs = new Set(
    flattenPageLinks(pageLinks ?? []).flatMap((link) => {
      const slug = getMultiPageSlugFromHref(link.href);
      return slug ? [slug] : [];
    }),
  );
  const pageDefinitions = multiPageSlugs.size
    ? allPageDefinitions.filter((definition) =>
        multiPageSlugs.has(normalizePageSlug(definition.id)),
      )
    : allPageDefinitions;
  const savedBreadcrumbsByPage = new Map(
    sections
      .filter((section) => section.type === "Breadcrumb" && section.page)
      .map((section) => [normalizePageSlug(section.page || ""), section]),
  );
  const savedMissionValuesByPage = new Map(
    sections
      .filter((section) => section.type === "MissionValues" && section.page)
      .map((section) => [normalizePageSlug(section.page || ""), section]),
  );
  const savedCsrProgramsByPage = new Map(
    sections
      .filter((section) => section.type === "CsrPrograms" && section.page)
      .map((section) => [normalizePageSlug(section.page || ""), section]),
  );
  const savedCareerJobsByPage = new Map(
    sections
      .filter((section) => section.type === "CareerJobs" && section.page)
      .map((section) => [normalizePageSlug(section.page || ""), section]),
  );
  const savedAboutStatsByPage = new Map(
    sections
      .filter((section) => section.type === "Stats" && section.page)
      .map((section) => [normalizePageSlug(section.page || ""), section]),
  );
  const savedAboutCtaByPage = new Map(
    sections
      .filter((section) => section.type === "CTA" && section.page)
      .map((section) => [normalizePageSlug(section.page || ""), section]),
  );
  const sectionComponentTypes: Record<string, string> = {
    AboutPage: "About",
    ServicePage: "Service",
    EventPage: "Event",
    PropertyPage: "Property",
    PortfolioPage: "Portfolio",
    TeamPage: "Team",
    GalleryPage: "Gallery",
    ContactPage: "Contact",
  };
  const createFreshPageSection = (sectionType: string) => {
    if (sectionType === "AboutPage") return createAboutPageSection(category);
    if (sectionType === "ServicePage") return createServicePageSection(category);
    if (sectionType === "EventPage") return createEventPageSection(category);
    if (sectionType === "PropertyPage")
      return createPropertyPageSection(category);
    if (sectionType === "PortfolioPage")
      return createPortfolioPageSection(category);
    if (sectionType === "TeamPage") return createTeamPageSection(category);
    if (sectionType === "GalleryPage") return createGalleryPageSection(category);
    if (sectionType === "ContactPage") return createContactPageSection(category);
    if (sectionType.endsWith("Page") && sectionType !== "CustomPage") {
      return createTypedPageSection(sectionType, category);
    }
    return null;
  };
  const seenPages = new Set<string>();

  const alignedBodies = sections.flatMap((section) => {
    if (
      (section.type === "Breadcrumb" ||
        section.type === "MissionValues" ||
        section.type === "CsrPrograms" ||
        section.type === "CareerJobs" ||
        section.type === "Stats" ||
        section.type === "CTA") &&
      section.page
    ) {
      const belongsToTemplatePage = pageDefinitions.some(
        (pageDefinition) =>
          pageDefinition.id !== "home" &&
          normalizePageSlug(pageDefinition.id) ===
            normalizePageSlug(section.page || ""),
      );

      // Template pages are inserted immediately before their body below. A
      // user-created page is not in template.pages, so keep its breadcrumb in
      // place instead of silently dropping the saved section.
      return belongsToTemplatePage ? [] : [section];
    }

    const pageDefinition = pageDefinitions.find(
      (pageDefinition) =>
        pageDefinition.id !== "home" &&
        (normalizePageSlug(section.page || "") ===
          normalizePageSlug(pageDefinition.id) ||
          section.id === pageDefinition.sectionType),
    );
      if (!pageDefinition) {
      // Keep page-scoped content even when the menu temporarily omits that
      // page (theme switch). Dropping here wiped About/Services from the DB.
      return [section];
    }
    if (seenPages.has(pageDefinition.id)) return [];
    seenPages.add(pageDefinition.id);

    const pageSectionType = pageDefinition.sectionType;
    const targetVariant = template.sectionVariants[pageSectionType];
    const freshSection = createFreshPageSection(pageSectionType);
    if (!targetVariant || !freshSection) return [section];

    const remapped = applyThemeVariantToSection(
      {
        ...section,
        data: section.data as unknown as Record<
          string,
          Record<string, unknown>
        >,
      },
      {
        variant: targetVariant,
        data: freshSection.data as unknown as Record<
          string,
          Record<string, unknown>
        >,
      },
    );

    return [
      {
        ...freshSection,
        id: pageSectionType,
        page: pageDefinition.id,
        type: sectionComponentTypes[pageSectionType] || freshSection.type,
        variant: targetVariant,
        data: {
          ...freshSection.data,
          ...(remapped.data as SectionItem["data"]),
          [targetVariant]: (remapped.data[targetVariant] ||
            mergeSectionContent(
              (freshSection.data[targetVariant] || {}) as Record<string, unknown>,
              collectBestSectionContent({
                variant: section.variant,
                data: section.data as unknown as Record<
                  string,
                  Record<string, unknown>
                >,
              }),
            )) as SectionData,
        },
      },
    ];
  });

  const footerIndex = alignedBodies.findIndex(
    (section) => section.type === "Footer",
  );
  const missingBodies = pageDefinitions.flatMap((definition) => {
    if (definition.id === "home" || seenPages.has(definition.id)) return [];
    const freshSection = createFreshPageSection(definition.sectionType);
    const targetVariant = template.sectionVariants[definition.sectionType];
    if (!freshSection || !targetVariant) return [];
    return [
      {
        ...freshSection,
        id: definition.sectionType,
        page: definition.id,
        type: sectionComponentTypes[definition.sectionType] || freshSection.type,
        variant: targetVariant,
      },
    ];
  });
  const bodiesWithMissing =
    footerIndex === -1
      ? [...alignedBodies, ...missingBodies]
      : [
          ...alignedBodies.slice(0, footerIndex),
          ...missingBodies,
          ...alignedBodies.slice(footerIndex),
        ];
  const breadcrumbVariant =
    template.sectionVariants.Breadcrumb || "Breadcrumb-1";
  return syncHomeCardsIntoManagers(ensureUniqueSectionIds(bodiesWithMissing.flatMap((section) => {
    const pageDefinition = pageDefinitions.find(
      (pageDefinition) =>
        pageDefinition.id !== "home" &&
        normalizePageSlug(section.page || "") ===
          normalizePageSlug(pageDefinition.id),
    );
    if (!pageDefinition) {
      return [section];
    }
    const isPageBody =
      section.id === pageDefinition.sectionType ||
      section.type === pageDefinition.sectionType ||
      String(section.variant || "").replace(/-\d+$/, "") ===
        pageDefinition.sectionType ||
      (pageDefinition.sectionType === "AboutPage" &&
        section.type === "About");
    if (!isPageBody) {
      return [section];
    }

    if (
      pageDefinition.sectionType !== "AboutPage" &&
      (pageBodyHasOwnBreadcrumb(section.variant) ||
        pageBodyHasOwnBreadcrumb(
          template.sectionVariants[pageDefinition.sectionType],
        ))
    ) {
      return [section];
    }

    const savedBreadcrumb = savedBreadcrumbsByPage.get(
      normalizePageSlug(pageDefinition.id),
    );
    const pageBodyData = (section.data?.[section.variant] ?? {}) as Record<
      string,
      unknown
    >;
    const activeBreadcrumbVariant = breadcrumbVariant;
    const savedBreadcrumbVariant =
      savedBreadcrumb?.variant || activeBreadcrumbVariant;
    const breadcrumbData =
      resolveLayoutPreview(activeBreadcrumbVariant, category)?.data || {};
    const savedBreadcrumbData =
      savedBreadcrumb?.data?.[savedBreadcrumbVariant] || {};
    const breadcrumb: SectionItem = {
      id: savedBreadcrumb?.id || `Breadcrumb-${pageDefinition.id}`,
      page: pageDefinition.id,
      type: "Breadcrumb",
      variant: activeBreadcrumbVariant,
      data: {
        ...(savedBreadcrumb?.data || {}),
        [activeBreadcrumbVariant]: {
          ...mergeSectionContent(
            breadcrumbData as Record<string, unknown>,
            savedBreadcrumbData as Record<string, unknown>,
          ),
          pretitle:
            (savedBreadcrumbData.pretitle as string | undefined) ||
            (typeof pageBodyData.pretitle === "string"
              ? pageBodyData.pretitle
              : undefined),
          title:
            (savedBreadcrumbData.title as string | undefined) ||
            pageDefinition.label ||
            (typeof pageBodyData.title === "string"
              ? pageBodyData.title
              : undefined),
          desc:
            (savedBreadcrumbData.desc as string | undefined) ||
            (typeof pageBodyData.desc === "string"
              ? pageBodyData.desc
              : undefined),
          desc2:
            (savedBreadcrumbData.desc2 as string | undefined) ||
            (typeof pageBodyData.desc2 === "string"
              ? pageBodyData.desc2
              : undefined),
        },
      },
    };
    const attached: SectionItem[] = [breadcrumb, section];
    if (pageDefinition.sectionType === "MissionPage") {
      const savedMissionValues = savedMissionValuesByPage.get(
        normalizePageSlug(pageDefinition.id),
      );
      const missionValuesVariant =
        template.sectionVariants.MissionValues || "MissionValues-5";
      const savedMissionValuesVariant =
        savedMissionValues?.variant || missionValuesVariant;
      const missionValuesPreview =
        resolveLayoutPreview(missionValuesVariant, category)?.data || {};
      const savedMissionValuesData =
        savedMissionValues?.data?.[savedMissionValuesVariant] || {};
      attached.push({
        id: savedMissionValues?.id || `MissionValues-${pageDefinition.id}`,
        page: pageDefinition.id,
        type: "MissionValues",
        variant: missionValuesVariant,
        data: {
          ...(savedMissionValues?.data || {}),
          [missionValuesVariant]: {
            ...mergeSectionContent(
              missionValuesPreview as Record<string, unknown>,
              savedMissionValuesData as Record<string, unknown>,
            ),
            pretitle:
              (savedMissionValuesData.pretitle as string | undefined) ||
              (typeof pageBodyData.valuesPretitle === "string"
                ? pageBodyData.valuesPretitle
                : undefined),
            title:
              (savedMissionValuesData.title as string | undefined) ||
              (typeof pageBodyData.valuesTitle === "string"
                ? pageBodyData.valuesTitle
                : undefined),
            values:
              (Array.isArray(savedMissionValuesData.values)
                ? savedMissionValuesData.values
                : undefined) ||
              (Array.isArray(pageBodyData.values)
                ? pageBodyData.values
                : undefined),
          },
        },
      });
    }
    if (pageDefinition.sectionType === "CsrPage") {
      const savedCsrPrograms = savedCsrProgramsByPage.get(
        normalizePageSlug(pageDefinition.id),
      );
      const csrProgramsVariant =
        template.sectionVariants.CsrPrograms || "CsrPrograms-5";
      const savedCsrProgramsVariant =
        savedCsrPrograms?.variant || csrProgramsVariant;
      const csrProgramsPreview =
        resolveLayoutPreview(csrProgramsVariant, category)?.data || {};
      const savedCsrProgramsData =
        savedCsrPrograms?.data?.[savedCsrProgramsVariant] || {};
      attached.push({
        id: savedCsrPrograms?.id || `CsrPrograms-${pageDefinition.id}`,
        page: pageDefinition.id,
        type: "CsrPrograms",
        variant: csrProgramsVariant,
        data: {
          ...(savedCsrPrograms?.data || {}),
          [csrProgramsVariant]: {
            ...mergeSectionContent(
              csrProgramsPreview as Record<string, unknown>,
              savedCsrProgramsData as Record<string, unknown>,
            ),
            pretitle:
              (savedCsrProgramsData.pretitle as string | undefined) ||
              (typeof pageBodyData.programsPretitle === "string"
                ? pageBodyData.programsPretitle
                : undefined),
            title:
              (savedCsrProgramsData.title as string | undefined) ||
              (typeof pageBodyData.programsTitle === "string"
                ? pageBodyData.programsTitle
                : undefined),
            programs:
              (Array.isArray(savedCsrProgramsData.programs)
                ? savedCsrProgramsData.programs
                : undefined) ||
              (Array.isArray(pageBodyData.programs)
                ? pageBodyData.programs
                : undefined),
          },
        },
      });
    }
    if (pageDefinition.sectionType === "CareerPage") {
      const savedCareerJobs = savedCareerJobsByPage.get(
        normalizePageSlug(pageDefinition.id),
      );
      const careerJobsVariant =
        template.sectionVariants.CareerJobs || "CareerJobs-5";
      const savedCareerJobsVariant =
        savedCareerJobs?.variant || careerJobsVariant;
      const careerJobsPreview =
        resolveLayoutPreview(careerJobsVariant, category)?.data || {};
      const savedCareerJobsData =
        savedCareerJobs?.data?.[savedCareerJobsVariant] || {};
      attached.push({
        id: savedCareerJobs?.id || `CareerJobs-${pageDefinition.id}`,
        page: pageDefinition.id,
        type: "CareerJobs",
        variant: careerJobsVariant,
        data: {
          ...(savedCareerJobs?.data || {}),
          [careerJobsVariant]: {
            ...mergeSectionContent(
              careerJobsPreview as Record<string, unknown>,
              savedCareerJobsData as Record<string, unknown>,
            ),
            pretitle:
              (savedCareerJobsData.pretitle as string | undefined) ||
              (typeof pageBodyData.jobsPretitle === "string"
                ? pageBodyData.jobsPretitle
                : undefined),
            title:
              (savedCareerJobsData.title as string | undefined) ||
              (typeof pageBodyData.jobsTitle === "string"
                ? pageBodyData.jobsTitle
                : undefined),
            jobs:
              (Array.isArray(savedCareerJobsData.jobs)
                ? savedCareerJobsData.jobs
                : undefined) ||
              (Array.isArray(pageBodyData.jobs)
                ? pageBodyData.jobs
                : undefined),
            formPretitle:
              (savedCareerJobsData.formPretitle as string | undefined) ||
              (typeof pageBodyData.formPretitle === "string"
                ? pageBodyData.formPretitle
                : undefined),
            formTitle:
              (savedCareerJobsData.formTitle as string | undefined) ||
              (typeof pageBodyData.formTitle === "string"
                ? pageBodyData.formTitle
                : undefined),
            formFields:
              (Array.isArray(savedCareerJobsData.formFields)
                ? savedCareerJobsData.formFields
                : undefined) ||
              (Array.isArray(pageBodyData.formFields)
                ? pageBodyData.formFields
                : undefined),
            applyLabel:
              (savedCareerJobsData.applyLabel as string | undefined) ||
              (typeof pageBodyData.applyLabel === "string"
                ? pageBodyData.applyLabel
                : undefined),
            successTitle:
              (savedCareerJobsData.successTitle as string | undefined) ||
              (typeof pageBodyData.successTitle === "string"
                ? pageBodyData.successTitle
                : undefined),
            successDesc:
              (savedCareerJobsData.successDesc as string | undefined) ||
              (typeof pageBodyData.successDesc === "string"
                ? pageBodyData.successDesc
                : undefined),
            successButtonLabel:
              (savedCareerJobsData.successButtonLabel as string | undefined) ||
              (typeof pageBodyData.successButtonLabel === "string"
                ? pageBodyData.successButtonLabel
                : undefined),
          },
        },
      });
    }
    if (pageDefinition.sectionType === "AboutPage") {
      const savedAboutStats = savedAboutStatsByPage.get(
        normalizePageSlug(pageDefinition.id),
      );
      const aboutStatsVariant = template.sectionVariants.Stats || "Stats-5";
      const savedAboutStatsVariant =
        savedAboutStats?.variant || aboutStatsVariant;
      const aboutStatsPreview =
        resolveLayoutPreview(aboutStatsVariant, category)?.data || {};
      const savedAboutStatsData =
        savedAboutStats?.data?.[savedAboutStatsVariant] || {};
      const aboutStats =
        (Array.isArray(savedAboutStatsData.stats)
          ? savedAboutStatsData.stats
          : undefined) ||
        (Array.isArray(pageBodyData.stats) ? pageBodyData.stats : undefined);
      attached.push({
        id: savedAboutStats?.id || `Stats-${pageDefinition.id}`,
        page: pageDefinition.id,
        type: "Stats",
        variant: aboutStatsVariant,
        data: {
          ...(savedAboutStats?.data || {}),
          [aboutStatsVariant]: {
            ...mergeSectionContent(
              aboutStatsPreview as Record<string, unknown>,
              savedAboutStatsData as Record<string, unknown>,
            ),
            ...(aboutStats ? { stats: aboutStats } : {}),
            statsStyle:
              (savedAboutStatsData.statsStyle as string | undefined) ||
              "light",
          },
        },
      });

      const savedAboutCta = savedAboutCtaByPage.get(
        normalizePageSlug(pageDefinition.id),
      );
      const aboutCtaVariant = template.sectionVariants.CTA || "CTA-5";
      const savedAboutCtaVariant = savedAboutCta?.variant || aboutCtaVariant;
      const aboutCtaPreview =
        resolveLayoutPreview(aboutCtaVariant, category)?.data || {};
      const savedAboutCtaData =
        savedAboutCta?.data?.[savedAboutCtaVariant] || {};
      const aboutCtaPretitle =
        (savedAboutCtaData.pretitle as string | undefined) ||
        (typeof pageBodyData.ctaPretitle === "string"
          ? pageBodyData.ctaPretitle
          : undefined);
      const aboutCtaTitle =
        (savedAboutCtaData.title as string | undefined) ||
        (typeof pageBodyData.ctaTitle === "string"
          ? pageBodyData.ctaTitle
          : undefined);
      const aboutCtaDescription =
        (savedAboutCtaData.description as string | undefined) ||
        (typeof pageBodyData.ctaDesc === "string"
          ? pageBodyData.ctaDesc
          : undefined);
      const aboutCtaButtons =
        (Array.isArray(savedAboutCtaData.buttons)
          ? savedAboutCtaData.buttons
          : undefined) ||
        (Array.isArray(pageBodyData.ctaButtons)
          ? pageBodyData.ctaButtons
          : undefined);
      attached.push({
        id: savedAboutCta?.id || `CTA-${pageDefinition.id}`,
        page: pageDefinition.id,
        type: "CTA",
        variant: aboutCtaVariant,
        data: {
          ...(savedAboutCta?.data || {}),
          [aboutCtaVariant]: {
            ...mergeSectionContent(
              aboutCtaPreview as Record<string, unknown>,
              savedAboutCtaData as Record<string, unknown>,
            ),
            ...(aboutCtaPretitle ? { pretitle: aboutCtaPretitle } : {}),
            ...(aboutCtaTitle ? { title: aboutCtaTitle } : {}),
            ...(aboutCtaDescription
              ? { description: aboutCtaDescription }
              : {}),
            ...(aboutCtaButtons ? { buttons: aboutCtaButtons } : {}),
          },
        },
      });
    }
    return attached;
  })));
};

const ensureMissingAboutPageCompanions = (
  sections: SectionItem[],
  templateId: string,
  category: string,
): SectionItem[] => {
  const template = getBuilderTemplate(templateId, category);
  if (template.type === "Single Page Website") return sections;

  let next = sections;
  let changed = false;
  getTemplatePages(template).forEach((pageDefinition) => {
    if (pageDefinition.sectionType !== "AboutPage") return;
    const slug = normalizePageSlug(pageDefinition.id);
    const bodyIndex = next.findIndex((section) => {
      const page = normalizePageSlug(section.page || "");
      const variantType = String(section.variant || "").replace(/-\d+$/, "");
      return (
        (page === slug || section.id === "AboutPage") &&
        (section.id === "AboutPage" ||
          section.type === "AboutPage" ||
          section.type === "About" ||
          variantType === "AboutPage")
      );
    });
    if (bodyIndex === -1) return;

    const body = next[bodyIndex];
    const pageBodyData = (body.data?.[body.variant] ?? {}) as Record<
      string,
      unknown
    >;
    const extras: SectionItem[] = [];

    if (
      !next.some(
        (section) =>
          section.type === "Stats" &&
          normalizePageSlug(section.page || "") === slug,
      )
    ) {
      const statsVariant = template.sectionVariants.Stats || "Stats-5";
      const statsPreview =
        resolveLayoutPreview(statsVariant, category)?.data || {};
      extras.push({
        id: `Stats-${pageDefinition.id}`,
        page: pageDefinition.id,
        type: "Stats",
        variant: statsVariant,
        data: {
          [statsVariant]: {
            ...(statsPreview as Record<string, unknown>),
            ...(Array.isArray(pageBodyData.stats)
              ? { stats: pageBodyData.stats }
              : {}),
            statsStyle: "light",
          },
        },
      });
    }

    if (
      !next.some(
        (section) =>
          section.type === "CTA" &&
          normalizePageSlug(section.page || "") === slug,
      )
    ) {
      const ctaVariant = template.sectionVariants.CTA || "CTA-5";
      const ctaPreview =
        resolveLayoutPreview(ctaVariant, category)?.data || {};
      extras.push({
        id: `CTA-${pageDefinition.id}`,
        page: pageDefinition.id,
        type: "CTA",
        variant: ctaVariant,
        data: {
          [ctaVariant]: {
            ...(ctaPreview as Record<string, unknown>),
            ...(typeof pageBodyData.ctaPretitle === "string"
              ? { pretitle: pageBodyData.ctaPretitle }
              : {}),
            ...(typeof pageBodyData.ctaTitle === "string"
              ? { title: pageBodyData.ctaTitle }
              : {}),
            ...(typeof pageBodyData.ctaDesc === "string"
              ? { description: pageBodyData.ctaDesc }
              : {}),
            ...(Array.isArray(pageBodyData.ctaButtons)
              ? { buttons: pageBodyData.ctaButtons }
              : {}),
          },
        },
      });
    }

    if (!extras.length) return;
    next = [
      ...next.slice(0, bodyIndex + 1),
      ...extras,
      ...next.slice(bodyIndex + 1),
    ];
    changed = true;
  });

  return changed ? next : sections;
};

/** Drop home sections the active theme no longer lists (e.g. LatestProject vs Cities/Portfolio). */
const stripHomeSectionsMissingFromTheme = (
  sections: SectionItem[],
  templateId: string,
  category: string,
): SectionItem[] => {
  const template = getBuilderTemplate(templateId, category);
  const homeOrder = Array.isArray(template.homeSectionOrder)
    ? template.homeSectionOrder
    : [];
  if (!homeOrder.length) return sections;
  const allowed = new Set(homeOrder);
  // Only strip known duplicate home teasers â€” never page-scoped sections.
  const strippable = new Set(["LatestProject"]);
  let changed = false;
  const next = sections.filter((section) => {
    if (section.page) return true;
    if (!strippable.has(section.type)) return true;
    if (allowed.has(section.type)) return true;
    changed = true;
    return false;
  });
  return changed ? next : sections;
};

const syncPageBreadcrumbsToTemplate = (
  sections: SectionItem[],
  templateId: string,
  category: string,
): SectionItem[] => {
  const template = getBuilderTemplate(templateId, category);
  if (template.type === "Single Page Website") return sections;

  const targetVariant = template.sectionVariants.Breadcrumb || "Breadcrumb-1";
  const pageDefinitions = getTemplatePages(template);
  let changed = false;

  const next = sections.map((section) => {
    if (section.type !== "Breadcrumb" || !section.page) return section;
    if (section.variant === targetVariant) return section;

    const slug = normalizePageSlug(section.page || "");
    const pageDefinition = pageDefinitions.find(
      (page) => normalizePageSlug(page.id) === slug,
    );
    const body = sections.find(
      (item) =>
        item.type !== "Breadcrumb" &&
        normalizePageSlug(item.page || "") === slug,
    );
    const pageBodyData = (body?.data?.[body.variant] ?? {}) as Record<
      string,
      unknown
    >;
    const savedData =
      (section.data?.[section.variant] as SectionData | undefined) ||
      (Object.values(section.data || {})[0] as SectionData | undefined) ||
      ({} as SectionData);
    const previewData =
      (resolveLayoutPreview(targetVariant, category)?.data as SectionData) ||
      ({} as SectionData);

    changed = true;
    return {
      ...section,
      variant: targetVariant,
      data: {
        [targetVariant]: {
          ...mergeSectionContent(
            previewData as Record<string, unknown>,
            savedData as Record<string, unknown>,
          ),
          pretitle:
            (savedData.pretitle as string | undefined) ||
            (typeof pageBodyData.pretitle === "string"
              ? pageBodyData.pretitle
              : undefined) ||
            (previewData.pretitle as string | undefined),
          title:
            (savedData.title as string | undefined) ||
            pageDefinition?.label ||
            (typeof pageBodyData.title === "string"
              ? pageBodyData.title
              : undefined) ||
            (previewData.title as string | undefined),
          desc:
            (savedData.desc as string | undefined) ||
            (typeof pageBodyData.desc === "string"
              ? pageBodyData.desc
              : undefined) ||
            (previewData.desc as string | undefined),
          desc2:
            (savedData.desc2 as string | undefined) ||
            (typeof pageBodyData.desc2 === "string"
              ? pageBodyData.desc2
              : undefined) ||
            (previewData.desc2 as string | undefined),
        },
      },
    };
  });

  return changed ? next : sections;
};

const ensureMissingPageBreadcrumbs = (
  sections: SectionItem[],
  templateId: string,
  category: string,
): SectionItem[] => {
  const template = getBuilderTemplate(templateId, category);
  if (template.type === "Single Page Website") return sections;

  // Prefer the user's current breadcrumb layout; only fall back to theme default
  // when no breadcrumb exists yet. Never force-reset here â€” that blocked layout edits.
  const breadcrumbVariant =
    sections.find((section) => section.type === "Breadcrumb")?.variant ||
    template.sectionVariants.Breadcrumb ||
    "Breadcrumb-1";
  const donor = sections.find((section) => section.type === "Breadcrumb");
  const donorData =
    (donor?.data?.[breadcrumbVariant] as SectionData | undefined) ||
    (donor?.data?.[donor.variant] as SectionData | undefined) ||
    ({} as SectionData);
  const previewData = (resolveLayoutPreview(breadcrumbVariant, category)
    ?.data || {}) as SectionData;

  let next = sections;
  let changed = false;
  getTemplatePages(template).forEach((pageDefinition) => {
    if (pageDefinition.id === "home") return;
    const slug = normalizePageSlug(pageDefinition.id);
    const bodyIndex = next.findIndex(
      (section) =>
        section.type !== "Breadcrumb" &&
        section.type !== "MissionValues" &&
        section.type !== "CsrPrograms" &&
        section.type !== "CareerJobs" &&
        section.type !== "Stats" &&
        section.type !== "CTA" &&
        (normalizePageSlug(section.page || "") === slug ||
          section.id === pageDefinition.sectionType),
    );
    if (bodyIndex === -1) return;
    const body = next[bodyIndex];
    if (
      pageBodyHasOwnBreadcrumb(body.variant) ||
      pageBodyHasOwnBreadcrumb(
        template.sectionVariants[pageDefinition.sectionType],
      )
    ) {
      return;
    }
    const hasBreadcrumb = next.some(
      (section) =>
        section.type === "Breadcrumb" &&
        normalizePageSlug(section.page || "") === slug,
    );
    if (hasBreadcrumb) return;

    const pageBodyData = (body.data?.[body.variant] ?? {}) as Record<
      string,
      unknown
    >;
    const breadcrumb: SectionItem = {
      id: `Breadcrumb-${pageDefinition.id}`,
      page: pageDefinition.id,
      type: "Breadcrumb",
      variant: breadcrumbVariant,
      data: {
        [breadcrumbVariant]: {
          ...previewData,
          ...donorData,
          pretitle:
            (typeof pageBodyData.pretitle === "string"
              ? pageBodyData.pretitle
              : undefined) ||
            (typeof donorData.pretitle === "string"
              ? donorData.pretitle
              : undefined) ||
            (typeof previewData.pretitle === "string"
              ? previewData.pretitle
              : undefined),
          title:
            pageDefinition.label ||
            (typeof pageBodyData.title === "string" && pageBodyData.title) ||
            (typeof donorData.title === "string" ? donorData.title : undefined),
          desc:
            (typeof pageBodyData.desc === "string" && pageBodyData.desc) ||
            (typeof donorData.desc === "string" ? donorData.desc : undefined),
          desc2:
            (typeof pageBodyData.desc2 === "string" && pageBodyData.desc2) ||
            (typeof donorData.desc2 === "string" ? donorData.desc2 : undefined),
        },
      },
    };
    next = [
      ...next.slice(0, bodyIndex),
      breadcrumb,
      ...next.slice(bodyIndex),
    ];
    changed = true;
  });
  return ensureMissingAboutPageCompanions(
    changed ? next : sections,
    templateId,
    category,
  );
};

const dropOrphanManagerPageLinks = (
  links: EditorPageLink[],
  sections: SectionItem[],
  templateId: string,
  category?: string | null,
): EditorPageLink[] => {
  const template = getBuilderTemplate(templateId, category);
  const themeSlugs = new Set(
    getTemplatePages(template).map((page) => normalizePageSlug(page.id)),
  );
  const bodySlugs = new Set(
    sections
      .filter(
        (section) =>
          Boolean(section.page) &&
          section.type !== "Breadcrumb" &&
          section.type !== "MissionValues" &&
          section.type !== "CsrPrograms" &&
          section.type !== "CareerJobs" &&
          section.type !== "Stats" &&
          section.type !== "CTA",
      )
      .map((section) => normalizePageSlug(section.page || "")),
  );
  return links.filter((link) => {
    const kind = managerKindFromPageLink(link);
    if (
      kind !== "properties" &&
      kind !== "events" &&
      kind !== "portfolio" &&
      kind !== "teams"
    ) {
      return true;
    }
    const slug =
      kind === "properties"
        ? "properties"
        : kind === "events"
          ? "events"
          : kind === "portfolio"
            ? "portfolio"
            : "teams";
    return themeSlugs.has(slug) || bodySlugs.has(slug);
  });
};

type EditorHistorySnapshot = {
  sections: SectionItem[];
  pageLinks: EditorPageLink[];
  templateVariables: Record<string, string>;
};

const cloneHistorySnapshot = (
  snapshot: EditorHistorySnapshot,
): EditorHistorySnapshot => structuredClone(snapshot) as EditorHistorySnapshot;

const addAboutPageSection = (sections: SectionItem[], category: string) => {
  if (sections.some((section) => section.id === "AboutPage")) return sections;

  const aboutPageSection = createAboutPageSection(category);
  const footerIndex = sections.findIndex((section) => section.type === "Footer");

  if (footerIndex === -1) return [...sections, aboutPageSection];

  return [
    ...sections.slice(0, footerIndex),
    aboutPageSection,
    ...sections.slice(footerIndex),
  ];
};

const addGalleryPageSection = (sections: SectionItem[], category: string) => {
  if (sections.some((section) => section.id === "GalleryPage")) return sections;

  const galleryPageSection = createGalleryPageSection(category);
  const footerIndex = sections.findIndex((section) => section.type === "Footer");

  if (footerIndex === -1) return [...sections, galleryPageSection];

  return [
    ...sections.slice(0, footerIndex),
    galleryPageSection,
    ...sections.slice(footerIndex),
  ];
};

/** Site-wide section â€” inserted before Footer; shown on every page above footer. */
const addCountriesServeSection = (
  sections: SectionItem[],
  category: string,
) => {
  if (sections.some((section) => section.type === "CountriesServe")) {
    return sections;
  }

  const created =
    createAddableSection("CountriesServe", category, "CountriesServe-1") ||
    null;
  if (!created) return sections;

  const footerIndex = sections.findIndex((section) => section.type === "Footer");
  if (footerIndex === -1) return [...sections, created];
  return [
    ...sections.slice(0, footerIndex),
    created,
    ...sections.slice(footerIndex),
  ];
};

const addContactPageSection = (sections: SectionItem[], category: string) => {
  if (sections.some((section) => section.id === "ContactPage")) return sections;

  const contactPageSection = createContactPageSection(category);
  const footerIndex = sections.findIndex((section) => section.type === "Footer");

  if (footerIndex === -1) return [...sections, contactPageSection];

  return [
    ...sections.slice(0, footerIndex),
    contactPageSection,
    ...sections.slice(footerIndex),
  ];
};

const addServicePageSection = (sections: SectionItem[], category: string) => {
  if (sections.some((section) => section.id === "ServicePage")) return sections;

  const servicePageSection = createServicePageSection(category);
  const galleryIndex = sections.findIndex((section) => section.id === "GalleryPage");
  const footerIndex = sections.findIndex((section) => section.type === "Footer");
  const insertIndex =
    galleryIndex !== -1 ? galleryIndex : footerIndex === -1 ? sections.length : footerIndex;

  return [
    ...sections.slice(0, insertIndex),
    servicePageSection,
    ...sections.slice(insertIndex),
  ];
};

const readServiceItemsFromData = (data: SectionData): ServiceItem[] => {
  // productItems is the source of truth once present â€” even when empty (user deleted all).
  if (Array.isArray(data.productItems)) {
    return data.productItems
      .map((item, index) => ({
        id:
          (typeof item.id === "string" && item.id) ||
          `card-${index}-${item.title || "service"}`,
        title: item.title || "",
        category: item.category || "Service",
        desc: item.desc || "",
        content: typeof item.content === "string" ? item.content : "",
        image: item.image || "/bg1.jpg",
        alt: item.alt || item.title || "",
        slug:
          (typeof item.slug === "string" && item.slug.trim()) ||
          createPageSlug(item.title || "") ||
          `service-${index + 1}`,
        order: typeof item.order === "number" ? item.order : index + 1,
        active: item.active !== false,
        layout: typeof item.layout === "string" ? item.layout : "",
        seoTitle: typeof item.seoTitle === "string" ? item.seoTitle : "",
        seoDescription:
          typeof item.seoDescription === "string" ? item.seoDescription : "",
        seoKeywords:
          typeof item.seoKeywords === "string" ? item.seoKeywords : "",
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  const slides = Array.isArray(data.serviceSlides)
    ? data.serviceSlides
    : Array.isArray(data.productSlides)
      ? data.productSlides
      : [];

  return slides
    .map((item, index) => ({
      id: `slide-${index}-${item.productTitle || "service"}`,
      title: item.productTitle || "",
      category: "Service",
      desc: item.productInfoDesc || "",
      content: "",
      image: item.image || "/bg1.jpg",
      alt: item.alt || item.productTitle || "",
      slug: createPageSlug(item.productTitle || "") || `service-${index + 1}`,
      order: index + 1,
      active: true,
      layout: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

const resolveManagerForSection = (
  section: SectionItem,
):
  | "Blogs"
  | "Services"
  | "Events"
  | "Gallery"
  | "Teams"
  | "Portfolio"
  | "Properties"
  | "Countries"
  | null => {
  const id = section.id || "";
  const type = section.type;
  const page = normalizePageSlug(section.page || "");

  if (type === "CountriesServe") {
    return "Countries";
  }
  if (
    id === "BlogPage" ||
    type === "BlogPage" ||
    normalizePageSlug(section.page || "") === "blogs"
  ) {
    return "Blogs";
  }
  if (type === "Blog" && !section.page) {
    return "Blogs";
  }
  if (
    id === "ServicePage" ||
    type === "ServicePage" ||
    (type === "Service" && (page === "service" || page === "services"))
  ) {
    return "Services";
  }
  if (
    id === "EventPage" ||
    type === "EventPage" ||
    (type === "Event" && page === "events")
  ) {
    return "Events";
  }
  if (
    id === "GalleryPage" ||
    type === "GalleryPage" ||
    (type === "Gallery" && page === "gallery")
  ) {
    return "Gallery";
  }
  if (
    id === "TeamPage" ||
    type === "TeamPage" ||
    (type === "Team" && (page === "teams" || page === "team"))
  ) {
    return "Teams";
  }
  if (
    id === "PortfolioPage" ||
    type === "PortfolioPage" ||
    type === "Cities" ||
    (type === "Portfolio" &&
      (page === "portfolio" || page === "projects" || page === "project"))
  ) {
    return "Portfolio";
  }
  if (
    id === "PropertyPage" ||
    type === "PropertyPage" ||
    type === "Highlight" ||
    type === "Featured" ||
    type === "BuyPropertyPage" ||
    type === "RentPage" ||
    (type === "Property" && (page === "properties" || page === "property"))
  ) {
    return "Properties";
  }
  return null;
};

const buildServicePageState = (data: SectionData): ServicePageState => ({
  pretitle: typeof data.pretitle === "string" ? data.pretitle : "Our Services",
  title:
    typeof data.title === "string"
      ? data.title
      : "Services that move your business forward",
  subtitle: typeof data.subtitle === "string" ? data.subtitle : "What we offer",
  desc:
    typeof data.desc === "string"
      ? data.desc
      : "Describe the services you provide and how they help customers.",
  desc2: typeof data.desc2 === "string" ? data.desc2 : "",
  sideImage: typeof data.sideImage === "string" ? data.sideImage : "/bg1.jpg",
  sideImageTitle:
    typeof data.sideImageTitle === "string" ? data.sideImageTitle : "Services",
  productSectionTitle:
    typeof data.productSectionTitle === "string"
      ? data.productSectionTitle
      : "All services",
  layout:
    typeof data.layout === "string" && data.layout.startsWith("ServicePage-")
      ? data.layout
      : undefined,
  detailLayout:
    typeof data.detailLayout === "string" &&
    data.detailLayout.startsWith("ServiceDetail-")
      ? data.detailLayout
      : undefined,
  services: readServiceItemsFromData(data),
});

const applyServicePageStateToData = (
  current: SectionData,
  state: ServicePageState,
): SectionData => {
  const orderedServices = [...state.services].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const productItems = orderedServices.map((service) => ({
    id: service.id,
    title: service.title,
    category: service.category || "Service",
    desc: service.desc,
    content: service.content || "",
    image: service.image || "/bg1.jpg",
    alt: service.alt || service.title,
    imageTitle: service.title,
    slug:
      service.slug?.trim() ||
      createPageSlug(service.title) ||
      service.id,
    order: service.order ?? 1,
    active: service.active !== false,
    layout: service.layout || "",
    seoTitle: service.seoTitle || "",
    seoDescription: service.seoDescription || "",
    seoKeywords: service.seoKeywords || "",
  }));

  const visibleServices = orderedServices.filter(
    (service) => service.active !== false,
  );
  const previousSlides = [
    ...(Array.isArray(current.productSlides) ? current.productSlides : []),
    ...(Array.isArray(current.serviceSlides) ? current.serviceSlides : []),
  ];
  const previousSlideBySlug = new Map(
    previousSlides.map((slide) => {
      const title =
        typeof slide.productTitle === "string" ? slide.productTitle : "";
      return [createPageSlug(title), slide] as const;
    }),
  );

  const serviceSlides = visibleServices.map((service) => {
    const previous =
      previousSlideBySlug.get(
        createPageSlug(service.title) || service.slug || "",
      ) || previousSlideBySlug.get(service.slug || "");
    return {
      image: service.image || previous?.image || "/bg1.jpg",
      alt: service.alt || previous?.alt || service.title,
      productTitle: service.title,
      productSubtitle:
        service.category || previous?.productSubtitle || "Service",
      productInfoTitle: service.title,
      productInfoDesc: service.desc || previous?.productInfoDesc || "",
      productFeatures:
        Array.isArray(previous?.productFeatures) && previous.productFeatures.length
          ? previous.productFeatures
          : [],
      productTotalPrice: previous?.productTotalPrice || "",
      productShippingText: previous?.productShippingText || "",
    };
  });

  return {
    ...current,
    pretitle: state.pretitle,
    title: state.title,
    subtitle: state.subtitle,
    desc: state.desc,
    desc2: state.desc2,
    sideImage: state.sideImage,
    sideImageTitle: state.sideImageTitle,
    productSectionTitle: state.productSectionTitle,
    ...(state.layout ? { layout: state.layout } : {}),
    ...(state.detailLayout ? { detailLayout: state.detailLayout } : {}),
    productItems,
    serviceSlides,
    productSlides: serviceSlides,
  };
};

const addEventPageSection = (sections: SectionItem[], category: string) => {
  let next = sections;

  const hasEventPage = next.some(
    (section) =>
      section.id === "EventPage" ||
      section.type === "EventPage" ||
      (section.type === "Event" &&
        normalizePageSlug(section.page || "") === "events"),
  );

  if (!hasEventPage) {
    const eventPageSection = createEventPageSection(category);
    const serviceIndex = next.findIndex(
      (section) =>
        section.id === "ServicePage" ||
        section.type === "ServicePage" ||
        (section.type === "Service" &&
          normalizePageSlug(section.page || "") === "services"),
    );
    const galleryIndex = next.findIndex(
      (section) => section.id === "GalleryPage",
    );
    const footerIndex = next.findIndex((section) => section.type === "Footer");
    const insertIndex =
      serviceIndex !== -1
        ? serviceIndex + 1
        : galleryIndex !== -1
          ? galleryIndex
          : footerIndex === -1
            ? next.length
            : footerIndex;

    next = [
      ...next.slice(0, insertIndex),
      eventPageSection,
      ...next.slice(insertIndex),
    ];
  }

  const hasEventBreadcrumb = next.some(
    (section) =>
      section.type === "Breadcrumb" &&
      normalizePageSlug(section.page || "") === "events",
  );

  if (!hasEventBreadcrumb) {
    const donor = next.find((section) => section.type === "Breadcrumb");
    const breadcrumbVariant = donor?.variant || "Breadcrumb-1";
    const donorData =
      (donor?.data?.[donor.variant] as SectionData | undefined) ||
      (donor?.data?.["Breadcrumb-1"] as SectionData | undefined) ||
      {};
    const previewData =
      resolveLayoutPreview(breadcrumbVariant, category)?.data || {};
    const breadcrumb: SectionItem = {
      id: "Breadcrumb-events",
      page: "events",
      type: "Breadcrumb",
      variant: breadcrumbVariant,
      data: {
        ...(donor?.data || {}),
        [breadcrumbVariant]: {
          ...previewData,
          ...donorData,
          title: "Events",
          homeLabel:
            (typeof donorData.homeLabel === "string" && donorData.homeLabel) ||
            "Home",
          parentLabel: "",
        },
      },
    };

    const eventBodyIndex = next.findIndex(
      (section) =>
        section.id === "EventPage" ||
        section.type === "EventPage" ||
        (section.type === "Event" &&
          normalizePageSlug(section.page || "") === "events"),
    );
    const insertAt = eventBodyIndex >= 0 ? eventBodyIndex : next.length;
    next = [...next.slice(0, insertAt), breadcrumb, ...next.slice(insertAt)];
  }

  return next;
};

const readEventItemsFromData = (data: SectionData): EventItem[] => {
  // productItems is authoritative once present â€” even when empty (user deleted all).
  if (Array.isArray(data.productItems)) {
    return data.productItems
      .map((item, index) => ({
        id:
          (typeof item.id === "string" && item.id) ||
          `card-${index}-${item.title || "event"}`,
        title: item.title || "",
        category: item.category || "Event",
        desc: item.desc || "",
        content: typeof item.content === "string" ? item.content : "",
        image: item.image || "/bg1.jpg",
        alt: item.alt || item.title || "",
        slug:
          (typeof item.slug === "string" && item.slug.trim()) ||
          createPageSlug(item.title || "") ||
          `event-${index + 1}`,
        order: typeof item.order === "number" ? item.order : index + 1,
        active: item.active !== false,
        layout: typeof item.layout === "string" ? item.layout : "",
        seoTitle: typeof item.seoTitle === "string" ? item.seoTitle : "",
        seoDescription:
          typeof item.seoDescription === "string" ? item.seoDescription : "",
        seoKeywords:
          typeof item.seoKeywords === "string" ? item.seoKeywords : "",
        eventDate: typeof item.eventDate === "string" ? item.eventDate : "",
        eventTime: typeof item.eventTime === "string" ? item.eventTime : "",
        eventType: item.eventType === "past" ? "past" : "upcoming",
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  const slides = Array.isArray(data.serviceSlides)
    ? data.serviceSlides
    : Array.isArray(data.productSlides)
      ? data.productSlides
      : [];

  return slides
    .map((item, index) => ({
      id: `slide-${index}-${item.productTitle || "event"}`,
      title: item.productTitle || "",
      category: "Event",
      desc: item.productInfoDesc || "",
      content: "",
      image: item.image || "/bg1.jpg",
      alt: item.alt || item.productTitle || "",
      slug: createPageSlug(item.productTitle || "") || `event-${index + 1}`,
      order: index + 1,
      active: true,
      layout: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      eventDate: "",
      eventTime: "",
      eventType: "upcoming" as const,
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

const buildEventPageState = (data: SectionData): EventPageState => ({
  pretitle: typeof data.pretitle === "string" ? data.pretitle : "Our Events",
  title:
    typeof data.title === "string"
      ? data.title
      : "Events worth showing up for",
  subtitle: typeof data.subtitle === "string" ? data.subtitle : "Upcoming",
  desc:
    typeof data.desc === "string"
      ? data.desc
      : "Share upcoming events, workshops, and gatherings with your audience.",
  desc2: typeof data.desc2 === "string" ? data.desc2 : "",
  sideImage: typeof data.sideImage === "string" ? data.sideImage : "/bg1.jpg",
  sideImageTitle:
    typeof data.sideImageTitle === "string" ? data.sideImageTitle : "Events",
  productSectionTitle:
    typeof data.productSectionTitle === "string"
      ? data.productSectionTitle
      : "All events",
  layout:
    typeof data.layout === "string" && data.layout.startsWith("EventPage-")
      ? data.layout
      : undefined,
  detailLayout:
    typeof data.detailLayout === "string" &&
    data.detailLayout.startsWith("EventDetail-")
      ? data.detailLayout
      : undefined,
  events: readEventItemsFromData(data),
});

const applyEventPageStateToData = (
  current: SectionData,
  state: EventPageState,
): SectionData => {
  const orderedEvents = [...state.events].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const productItems = orderedEvents.map((eventItem) => ({
    id: eventItem.id,
    title: eventItem.title,
    category: eventItem.category || "Event",
    desc: eventItem.desc,
    content: eventItem.content || "",
    image: eventItem.image || "/bg1.jpg",
    alt: eventItem.alt || eventItem.title,
    imageTitle: eventItem.title,
    slug:
      eventItem.slug?.trim() ||
      createPageSlug(eventItem.title) ||
      eventItem.id,
    order: eventItem.order ?? 1,
    active: eventItem.active !== false,
    layout: eventItem.layout || "",
    seoTitle: eventItem.seoTitle || "",
    seoDescription: eventItem.seoDescription || "",
    seoKeywords: eventItem.seoKeywords || "",
    eventDate: eventItem.eventDate || "",
    eventTime: eventItem.eventTime || "",
    eventType: eventItem.eventType === "past" ? "past" : "upcoming",
  }));

  const visibleEvents = orderedEvents.filter(
    (eventItem) => eventItem.active !== false,
  );

  const serviceSlides = visibleEvents.map((eventItem) => ({
    image: eventItem.image || "/bg1.jpg",
    alt: eventItem.alt || eventItem.title,
    productTitle: eventItem.title,
    productSubtitle: eventItem.category || "Event",
    productInfoTitle: eventItem.title,
    productInfoDesc: eventItem.desc,
    productFeatures: [],
    productTotalPrice: "",
    productShippingText: "",
  }));

  return {
    ...current,
    pretitle: state.pretitle,
    title: state.title,
    subtitle: state.subtitle,
    desc: state.desc,
    desc2: state.desc2,
    sideImage: state.sideImage,
    sideImageTitle: state.sideImageTitle,
    productSectionTitle: state.productSectionTitle,
    ...(state.layout ? { layout: state.layout } : {}),
    ...(state.detailLayout ? { detailLayout: state.detailLayout } : {}),
    productItems,
    serviceSlides,
    productSlides: serviceSlides,
  };
};

const addPropertyPageSection = (sections: SectionItem[], category: string) => {
  let next = sections;

  const hasPropertyPage = next.some(
    (section) =>
      section.id === "PropertyPage" ||
      section.type === "PropertyPage" ||
      (section.type === "Property" &&
        normalizePageSlug(section.page || "") === "properties"),
  );

  if (!hasPropertyPage) {
    const propertyPageSection = createPropertyPageSection(category);
    const eventIndex = next.findIndex(
      (section) =>
        section.id === "EventPage" ||
        section.type === "EventPage" ||
        (section.type === "Event" &&
          normalizePageSlug(section.page || "") === "events"),
    );
    const serviceIndex = next.findIndex(
      (section) =>
        section.id === "ServicePage" ||
        section.type === "ServicePage" ||
        (section.type === "Service" &&
          (normalizePageSlug(section.page || "") === "services" ||
            ["service", "services"].includes(normalizePageSlug(section.page || "")))),
    );
    const galleryIndex = next.findIndex(
      (section) => section.id === "GalleryPage",
    );
    const footerIndex = next.findIndex((section) => section.type === "Footer");
    const insertIndex =
      eventIndex !== -1
        ? eventIndex + 1
        : serviceIndex !== -1
          ? serviceIndex + 1
          : galleryIndex !== -1
            ? galleryIndex
            : footerIndex === -1
              ? next.length
              : footerIndex;

    next = [
      ...next.slice(0, insertIndex),
      propertyPageSection,
      ...next.slice(insertIndex),
    ];
  }

  const propertyBody = next.find(
    (section) =>
      section.id === "PropertyPage" ||
      section.type === "PropertyPage" ||
      (section.type === "Property" &&
        normalizePageSlug(section.page || "") === "properties"),
  );
  const propertyBodyHasOwnBreadcrumb = pageBodyHasOwnBreadcrumb(
    propertyBody?.variant,
  );
  const hasPropertyBreadcrumb = next.some(
    (section) =>
      section.type === "Breadcrumb" &&
      normalizePageSlug(section.page || "") === "properties",
  );

  if (!hasPropertyBreadcrumb && !propertyBodyHasOwnBreadcrumb) {
    const donor = next.find((section) => section.type === "Breadcrumb");
    const breadcrumbVariant = donor?.variant || "Breadcrumb-1";
    const donorData =
      (donor?.data?.[donor.variant] as SectionData | undefined) ||
      (donor?.data?.["Breadcrumb-1"] as SectionData | undefined) ||
      ({} as SectionData);
    const breadcrumb: SectionItem = {
      id: "Breadcrumb-properties",
      page: "properties",
      type: "Breadcrumb",
      variant: breadcrumbVariant,
      data: {
        [breadcrumbVariant]: {
          ...donorData,
          title: "Properties",
          parentLabel: "Home",
          desc: typeof donorData.desc === "string" ? donorData.desc : "",
        },
      },
    };

    const propertyBodyIndex = next.findIndex(
      (section) =>
        section.id === "PropertyPage" ||
        section.type === "PropertyPage" ||
        (section.type === "Property" &&
          normalizePageSlug(section.page || "") === "properties"),
    );
    const insertAt = propertyBodyIndex >= 0 ? propertyBodyIndex : next.length;
    next = [...next.slice(0, insertAt), breadcrumb, ...next.slice(insertAt)];
  }

  // Drop leftover CustomPage that used the properties slug before PropertyPage.
  next = next.filter(
    (section) =>
      !(
        typeof section.id === "string" &&
        section.id.startsWith("CustomPage-") &&
        normalizePageSlug(section.page || "") === "properties"
      ),
  );

  return orderChromeSections(next);
};

const readPropertyItemsFromData = (data: SectionData): PropertyItem[] => {
  const source = Array.isArray(data.productItems) && data.productItems.length
    ? data.productItems
    : Array.isArray((data as SectionData & { listings?: unknown[] }).listings)
      ? ((data as SectionData & { listings?: Array<Record<string, unknown>> }).listings || [])
      : [];
  if (!source.length) return [];

  return source
    .map((item, index) => {
      const record = item as Record<string, unknown>;
      const title =
        (typeof record.title === "string" && record.title) || "";
      return {
        id:
          (typeof record.id === "string" && record.id) ||
          `card-${index}-${title || "property"}`,
        title,
        category:
          (typeof record.category === "string" && record.category) ||
          "Residential",
        desc:
          (typeof record.desc === "string" && record.desc) ||
          (typeof record.description === "string" && record.description) ||
          "",
        content:
          typeof record.content === "string"
            ? record.content
            : typeof record.body === "string"
              ? record.body
              : "",
        image: (typeof record.image === "string" && record.image) || "/bg1.jpg",
        alt:
          (typeof record.alt === "string" && record.alt) || title || "",
        slug:
          (typeof record.slug === "string" && record.slug.trim()) ||
          createPageSlug(title) ||
          `property-${index + 1}`,
        order: typeof record.order === "number" ? record.order : index + 1,
        active: record.active !== false,
        featured: record.featured === true,
        layout: typeof record.layout === "string" ? record.layout : "",
        seoTitle: typeof record.seoTitle === "string" ? record.seoTitle : "",
        seoDescription:
          typeof record.seoDescription === "string" ? record.seoDescription : "",
        seoKeywords:
          typeof record.seoKeywords === "string" ? record.seoKeywords : "",
        price: typeof record.price === "string" ? record.price : "",
        address:
          (typeof record.address === "string" && record.address) ||
          (typeof record.location === "string" && record.location) ||
          "",
        bedrooms: typeof record.bedrooms === "string" ? record.bedrooms : "",
        bathrooms: typeof record.bathrooms === "string" ? record.bathrooms : "",
        areaSqft: typeof record.areaSqft === "string" ? record.areaSqft : "",
        parking: typeof record.parking === "string" ? record.parking : "",
        propertyType:
          typeof record.propertyType === "string"
            ? record.propertyType
            : "apartment",
        listingType:
          record.listingType === "rent" ||
          (typeof record.category === "string" &&
            record.category.toLowerCase().includes("rent"))
            ? "rent"
            : (typeof record.listingType === "string" && record.listingType) ||
              "sale",
        subtitle:
          typeof record.subtitle === "string" ? record.subtitle : "",
        statusText:
          typeof record.statusText === "string" ? record.statusText : "",
        amenities: parsePropertyAmenities(record.amenities),
        floorPlan: typeof record.floorPlan === "string" ? record.floorPlan : "",
        gallery: Array.isArray(record.gallery)
          ? record.gallery
              .filter((item): item is string => typeof item === "string")
              .map((item) => item.trim())
              .filter(Boolean)
          : Array.isArray(record.images)
            ? record.images
                .filter((item): item is string => typeof item === "string")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
      };
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

const buildPropertyPageState = (data: SectionData): PropertyPageState => ({
  pretitle:
    typeof data.pretitle === "string" ? data.pretitle : "Our Properties",
  title:
    typeof data.title === "string"
      ? data.title
      : "Homes and spaces worth exploring",
  subtitle: typeof data.subtitle === "string" ? data.subtitle : "Listings",
  desc:
    typeof data.desc === "string"
      ? data.desc
      : "Browse apartments, villas, and commercial spaces with floor plans and amenities.",
  desc2: typeof data.desc2 === "string" ? data.desc2 : "",
  sideImage: typeof data.sideImage === "string" ? data.sideImage : "/bg1.jpg",
  sideImageTitle:
    typeof data.sideImageTitle === "string"
      ? data.sideImageTitle
      : "Properties",
  productSectionTitle:
    typeof data.productSectionTitle === "string"
      ? data.productSectionTitle
      : "All properties",
  layout:
    typeof data.layout === "string" && data.layout.startsWith("PropertyPage-")
      ? data.layout
      : undefined,
  detailLayout:
    typeof data.detailLayout === "string" &&
    data.detailLayout.startsWith("PropertyDetail-")
      ? data.detailLayout
      : undefined,
  properties: readPropertyItemsFromData(data),
});

const applyPropertyPageStateToData = (
  current: SectionData,
  state: PropertyPageState,
): SectionData => {
  const ordered = [...state.properties].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const productItems = ordered.map((propertyItem) => ({
    id: propertyItem.id,
    title: propertyItem.title,
    category: propertyItem.category || "Residential",
    desc: propertyItem.desc,
    content: propertyItem.content || "",
    image: propertyItem.image || "/bg1.jpg",
    alt: propertyItem.alt || propertyItem.title,
    imageTitle: propertyItem.title,
    slug:
      propertyItem.slug?.trim() ||
      createPageSlug(propertyItem.title) ||
      propertyItem.id,
    order: propertyItem.order ?? 1,
    active: propertyItem.active !== false,
    layout: propertyItem.layout || "",
    seoTitle: propertyItem.seoTitle || "",
    seoDescription: propertyItem.seoDescription || "",
    seoKeywords: propertyItem.seoKeywords || "",
    price: propertyItem.price || "",
    address: propertyItem.address || "",
    bedrooms: propertyItem.bedrooms || "",
    bathrooms: propertyItem.bathrooms || "",
    areaSqft: propertyItem.areaSqft || "",
    parking: propertyItem.parking || "",
    propertyType: propertyItem.propertyType || "apartment",
    listingType: propertyItem.listingType?.trim() || "sale",
    subtitle: propertyItem.subtitle || "",
    statusText: propertyItem.statusText || "",
    amenities: serializePropertyAmenities(
      parsePropertyAmenities(propertyItem.amenities),
    ),
    floorPlan: propertyItem.floorPlan || "",
    gallery: (propertyItem.gallery || []).filter(Boolean),
    featured: propertyItem.featured === true,
  }));

  const visible = ordered.filter((item) => item.active !== false);
  const existingListings = Array.isArray(
    (current as SectionData & { listings?: unknown[] }).listings,
  )
    ? (
        (current as SectionData & { listings?: Array<Record<string, unknown>> })
          .listings || []
      ).filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
    : [];
  const listingsBySlug = new Map(
    existingListings.map((item) => {
      const slug =
        (typeof item.slug === "string" && item.slug) ||
        createPageSlug(typeof item.title === "string" ? item.title : "");
      return [slug, item] as const;
    }),
  );
  const listings = visible.map((propertyItem) =>
    mapPropertyToListing(
      propertyItem as unknown as Record<string, unknown>,
      listingsBySlug.get(
        propertyItem.slug?.trim() ||
          createPageSlug(propertyItem.title) ||
          propertyItem.id,
      ),
    ),
  );
  const serviceSlides = visible.map((propertyItem) => ({
    image: propertyItem.image || "/bg1.jpg",
    alt: propertyItem.alt || propertyItem.title,
    productTitle: propertyItem.title,
    productSubtitle: propertyItem.category || "Property",
    productInfoTitle: propertyItem.title,
    productInfoDesc: propertyItem.desc,
    productFeatures: [],
    productTotalPrice: propertyItem.price || "",
    productShippingText: "",
  }));

  return {
    ...current,
    pretitle: state.pretitle,
    title: state.title,
    subtitle: state.subtitle,
    desc: state.desc,
    desc2: state.desc2,
    sideImage: state.sideImage,
    sideImageTitle: state.sideImageTitle,
    productSectionTitle: state.productSectionTitle,
    ...(state.layout ? { layout: state.layout } : {}),
    ...(state.detailLayout ? { detailLayout: state.detailLayout } : {}),
    productItems,
    listings,
    serviceSlides,
    productSlides: serviceSlides,
  };
};

const addPortfolioPageSection = (
  sections: SectionItem[],
  category: string,
  templateId?: string | null,
) => {
  let next = sections;
  const pageSlug = resolveThemePortfolioNavLink(templateId, category).slug;

  const hasPortfolioPage = next.some(
    (section) =>
      section.id === "PortfolioPage" ||
      section.type === "PortfolioPage" ||
      (section.type === "Portfolio" &&
        (normalizePageSlug(section.page || "") === "portfolio" ||
          normalizePageSlug(section.page || "") === "projects" ||
          normalizePageSlug(section.page || "") === pageSlug)),
  );

  if (!hasPortfolioPage) {
    const portfolioPageSection = createPortfolioPageSection(category, pageSlug);
    const propertyIndex = next.findIndex(
      (section) =>
        section.id === "PropertyPage" ||
        section.type === "PropertyPage" ||
        (section.type === "Property" &&
          normalizePageSlug(section.page || "") === "properties"),
    );
    const eventIndex = next.findIndex(
      (section) =>
        section.id === "EventPage" ||
        section.type === "EventPage" ||
        (section.type === "Event" &&
          normalizePageSlug(section.page || "") === "events"),
    );
    const serviceIndex = next.findIndex(
      (section) =>
        section.id === "ServicePage" ||
        section.type === "ServicePage" ||
        (section.type === "Service" &&
          normalizePageSlug(section.page || "") === "services"),
    );
    const galleryIndex = next.findIndex((section) => section.id === "GalleryPage");
    const footerIndex = next.findIndex((section) => section.type === "Footer");
    const insertIndex =
      propertyIndex !== -1
        ? propertyIndex + 1
        : eventIndex !== -1
          ? eventIndex + 1
          : serviceIndex !== -1
            ? serviceIndex + 1
            : galleryIndex !== -1
              ? galleryIndex
              : footerIndex === -1
                ? next.length
                : footerIndex;

    next = [
      ...next.slice(0, insertIndex),
      portfolioPageSection,
      ...next.slice(insertIndex),
    ];
  }

  const portfolioBody = next.find(
    (section) =>
      section.id === "PortfolioPage" ||
      section.type === "PortfolioPage" ||
      (section.type === "Portfolio" &&
        (normalizePageSlug(section.page || "") === "portfolio" ||
          normalizePageSlug(section.page || "") === "projects" ||
          normalizePageSlug(section.page || "") === pageSlug)),
  );
  const portfolioBodyHasOwnBreadcrumb = pageBodyHasOwnBreadcrumb(
    portfolioBody?.variant,
  );
  const hasPortfolioBreadcrumb = next.some(
    (section) =>
      section.type === "Breadcrumb" &&
      (normalizePageSlug(section.page || "") === pageSlug ||
        normalizePageSlug(section.page || "") === "portfolio" ||
        normalizePageSlug(section.page || "") === "projects"),
  );

  if (!hasPortfolioBreadcrumb && !portfolioBodyHasOwnBreadcrumb) {
    const donor = next.find((section) => section.type === "Breadcrumb");
    const breadcrumbVariant = donor?.variant || "Breadcrumb-1";
    const donorData =
      (donor?.data?.[donor.variant] as SectionData | undefined) ||
      (donor?.data?.["Breadcrumb-1"] as SectionData | undefined) ||
      ({} as SectionData);
    const navLabel =
      pageSlug === "projects" || pageSlug === "project"
        ? "Projects"
        : "Portfolio";
    const breadcrumb: SectionItem = {
      id: `Breadcrumb-${pageSlug}`,
      page: pageSlug,
      type: "Breadcrumb",
      variant: breadcrumbVariant,
      data: {
        [breadcrumbVariant]: {
          ...donorData,
          title: navLabel,
          parentLabel: "Home",
          desc: typeof donorData.desc === "string" ? donorData.desc : "",
        },
      },
    };

    const portfolioBodyIndex = next.findIndex(
      (section) =>
        section.id === "PortfolioPage" ||
        section.type === "PortfolioPage" ||
        (section.type === "Portfolio" &&
          normalizePageSlug(section.page || "") === "portfolio"),
    );
    const insertAt =
      portfolioBodyIndex >= 0 ? portfolioBodyIndex : next.length;
    next = [...next.slice(0, insertAt), breadcrumb, ...next.slice(insertAt)];
  }

  next = next.filter(
    (section) =>
      !(
        typeof section.id === "string" &&
        section.id.startsWith("CustomPage-") &&
        normalizePageSlug(section.page || "") === "portfolio"
      ),
  );

  return next;
};

const readPortfolioItemsFromData = (data: SectionData): PortfolioItem[] => {
  const extra = data as SectionData & { projectItems?: unknown[] };
  const source = Array.isArray(data.productItems) && data.productItems.length
    ? data.productItems
    : Array.isArray(extra.projectItems)
      ? extra.projectItems
      : [];
  if (!source.length) return [];

  return source
    .map((item, index) => {
      const record = item as Record<string, unknown>;
      const title =
        (typeof record.title === "string" && record.title) ||
        (typeof record.name === "string" && record.name) ||
        "";
      return {
        id:
          (typeof record.id === "string" && record.id) ||
          `card-${index}-${title || "portfolio"}`,
        title,
        category:
          (typeof record.category === "string" && record.category) || "Portfolio",
        desc:
          (typeof record.desc === "string" && record.desc) ||
          (typeof record.description === "string" && record.description) ||
          "",
        content: typeof record.content === "string" ? record.content : "",
        image: (typeof record.image === "string" && record.image) || "/bg1.jpg",
        alt: (typeof record.alt === "string" && record.alt) || title || "",
        slug:
          (typeof record.slug === "string" && record.slug.trim()) ||
          createPageSlug(title) ||
          `portfolio-${index + 1}`,
        order: typeof record.order === "number" ? record.order : index + 1,
        active: record.active !== false,
        featured: record.featured === true,
        layout: typeof record.layout === "string" ? record.layout : "",
        seoTitle: typeof record.seoTitle === "string" ? record.seoTitle : "",
        seoDescription:
          typeof record.seoDescription === "string" ? record.seoDescription : "",
        seoKeywords:
          typeof record.seoKeywords === "string" ? record.seoKeywords : "",
        status: typeof record.status === "string" ? record.status : "",
        location:
          (typeof record.location === "string" && record.location) ||
          (typeof record.address === "string" && record.address) ||
          "",
      };
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

const buildPortfolioPageState = (data: SectionData): PortfolioPageState => ({
  pretitle: typeof data.pretitle === "string" ? data.pretitle : "Our Portfolio",
  title:
    typeof data.title === "string"
      ? data.title
      : "Work worth showing in detail",
  subtitle:
    typeof data.subtitle === "string" ? data.subtitle : "Featured work",
  desc:
    typeof data.desc === "string"
      ? data.desc
      : "Showcase selected projects, case studies, and visual work with dedicated detail pages.",
  desc2: typeof data.desc2 === "string" ? data.desc2 : "",
  sideImage: typeof data.sideImage === "string" ? data.sideImage : "/bg1.jpg",
  sideImageTitle:
    typeof data.sideImageTitle === "string" ? data.sideImageTitle : "Portfolio",
  productSectionTitle:
    typeof data.productSectionTitle === "string"
      ? data.productSectionTitle
      : "All portfolio items",
  layout:
    typeof data.layout === "string" && data.layout.startsWith("PortfolioPage-")
      ? data.layout
      : undefined,
  detailLayout:
    typeof data.detailLayout === "string" &&
    data.detailLayout.startsWith("PortfolioDetail-")
      ? data.detailLayout
      : undefined,
  portfolioItems: readPortfolioItemsFromData(data),
});

const applyPortfolioPageStateToData = (
  current: SectionData,
  state: PortfolioPageState,
): SectionData => {
  const ordered = [...state.portfolioItems].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const productItems = ordered.map((portfolioItem) => ({
    id: portfolioItem.id,
    title: portfolioItem.title,
    category: portfolioItem.category || "Portfolio",
    desc: portfolioItem.desc,
    content: portfolioItem.content || "",
    image: portfolioItem.image || "/bg1.jpg",
    alt: portfolioItem.alt || portfolioItem.title,
    imageTitle: portfolioItem.title,
    slug:
      portfolioItem.slug?.trim() ||
      createPageSlug(portfolioItem.title) ||
      portfolioItem.id,
    order: portfolioItem.order ?? 1,
    active: portfolioItem.active !== false,
    layout: portfolioItem.layout || "",
    seoTitle: portfolioItem.seoTitle || "",
    seoDescription: portfolioItem.seoDescription || "",
    seoKeywords: portfolioItem.seoKeywords || "",
    featured: portfolioItem.featured === true,
    status: portfolioItem.status || "",
    location: portfolioItem.location || "",
  }));

  const visible = ordered.filter((item) => item.active !== false);
  const existingProjects = Array.isArray(
    (current as SectionData & { projectItems?: unknown[] }).projectItems,
  )
    ? (
        (
          current as SectionData & {
            projectItems?: Array<Record<string, unknown>>;
          }
        ).projectItems || []
      ).filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
    : [];
  const projectsBySlug = new Map(
    existingProjects.map((item) => {
      const slug =
        (typeof item.slug === "string" && item.slug) ||
        createPageSlug(
          typeof item.title === "string"
            ? item.title
            : typeof item.name === "string"
              ? item.name
              : "",
        );
      return [slug, item] as const;
    }),
  );
  const projectItems = visible.map((portfolioItem) =>
    mapPortfolioToProject(
      portfolioItem as unknown as Record<string, unknown>,
      projectsBySlug.get(
        portfolioItem.slug?.trim() ||
          createPageSlug(portfolioItem.title) ||
          portfolioItem.id,
      ),
    ),
  );
  const serviceSlides = visible.map((portfolioItem) => ({
    image: portfolioItem.image || "/bg1.jpg",
    alt: portfolioItem.alt || portfolioItem.title,
    productTitle: portfolioItem.title,
    productSubtitle: portfolioItem.category || "Portfolio",
    productInfoTitle: portfolioItem.title,
    productInfoDesc: portfolioItem.desc,
    productFeatures: [],
    productTotalPrice: "",
    productShippingText: "",
  }));

  return {
    ...current,
    pretitle: state.pretitle,
    title: state.title,
    subtitle: state.subtitle,
    desc: state.desc,
    desc2: state.desc2,
    sideImage: state.sideImage,
    sideImageTitle: state.sideImageTitle,
    productSectionTitle: state.productSectionTitle,
    ...(state.layout ? { layout: state.layout } : {}),
    ...(state.detailLayout ? { detailLayout: state.detailLayout } : {}),
    productItems,
    projectItems,
    serviceSlides,
    productSlides: serviceSlides,
  };
};

const addTeamPageSection = (sections: SectionItem[], category: string) => {
  let next = sections;

  const hasTeamPage = next.some(
    (section) =>
      section.id === "TeamPage" ||
      section.type === "TeamPage" ||
      (section.type === "Team" &&
        normalizePageSlug(section.page || "") === "teams"),
  );

  if (!hasTeamPage) {
    const teamPageSection = createTeamPageSection(category);
    const portfolioIndex = next.findIndex(
      (section) =>
        section.id === "PortfolioPage" ||
        section.type === "PortfolioPage" ||
        (section.type === "Portfolio" &&
          normalizePageSlug(section.page || "") === "portfolio"),
    );
    const propertyIndex = next.findIndex(
      (section) =>
        section.id === "PropertyPage" ||
        section.type === "PropertyPage" ||
        (section.type === "Property" &&
          normalizePageSlug(section.page || "") === "properties"),
    );
    const eventIndex = next.findIndex(
      (section) =>
        section.id === "EventPage" ||
        section.type === "EventPage" ||
        (section.type === "Event" &&
          normalizePageSlug(section.page || "") === "events"),
    );
    const serviceIndex = next.findIndex(
      (section) =>
        section.id === "ServicePage" ||
        section.type === "ServicePage" ||
        (section.type === "Service" &&
          normalizePageSlug(section.page || "") === "services"),
    );
    const galleryIndex = next.findIndex((section) => section.id === "GalleryPage");
    const footerIndex = next.findIndex((section) => section.type === "Footer");
    const insertIndex =
      portfolioIndex !== -1
        ? portfolioIndex + 1
        : propertyIndex !== -1
          ? propertyIndex + 1
          : eventIndex !== -1
            ? eventIndex + 1
            : serviceIndex !== -1
              ? serviceIndex + 1
              : galleryIndex !== -1
                ? galleryIndex
                : footerIndex === -1
                  ? next.length
                  : footerIndex;

    next = [
      ...next.slice(0, insertIndex),
      teamPageSection,
      ...next.slice(insertIndex),
    ];
  }

  const hasTeamBreadcrumb = next.some(
    (section) =>
      section.type === "Breadcrumb" &&
      normalizePageSlug(section.page || "") === "teams",
  );

  if (!hasTeamBreadcrumb) {
    const donor = next.find((section) => section.type === "Breadcrumb");
    const breadcrumbVariant = donor?.variant || "Breadcrumb-1";
    const donorData =
      (donor?.data?.[donor.variant] as SectionData | undefined) ||
      (donor?.data?.["Breadcrumb-1"] as SectionData | undefined) ||
      ({} as SectionData);
    const breadcrumb: SectionItem = {
      id: "Breadcrumb-teams",
      page: "teams",
      type: "Breadcrumb",
      variant: breadcrumbVariant,
      data: {
        [breadcrumbVariant]: {
          ...donorData,
          title: "Teams",
          parentLabel: "Home",
          desc: typeof donorData.desc === "string" ? donorData.desc : "",
        },
      },
    };

    const teamBodyIndex = next.findIndex(
      (section) =>
        section.id === "TeamPage" ||
        section.type === "TeamPage" ||
        (section.type === "Team" &&
          normalizePageSlug(section.page || "") === "teams"),
    );
    const insertAt = teamBodyIndex >= 0 ? teamBodyIndex : next.length;
    next = [...next.slice(0, insertAt), breadcrumb, ...next.slice(insertAt)];
  }

  next = next.filter(
    (section) =>
      !(
        typeof section.id === "string" &&
        section.id.startsWith("CustomPage-") &&
        normalizePageSlug(section.page || "") === "teams"
      ),
  );

  return next;
};

const readTeamItemsFromData = (data: SectionData): TeamItem[] => {
  if (Array.isArray(data.productItems)) {
    return data.productItems
      .map((item, index) => ({
        id:
          (typeof item.id === "string" && item.id) ||
          `card-${index}-${item.title || "team"}`,
        title: item.title || "",
        category: item.category || "Team",
        desc: item.desc || "",
        content: typeof item.content === "string" ? item.content : "",
        image: item.image || "/bg1.jpg",
        alt: item.alt || item.title || "",
        slug:
          (typeof item.slug === "string" && item.slug.trim()) ||
          createPageSlug(item.title || "") ||
          `team-${index + 1}`,
        order: typeof item.order === "number" ? item.order : index + 1,
        active: item.active !== false,
        layout: typeof item.layout === "string" ? item.layout : "",
        seoTitle: typeof item.seoTitle === "string" ? item.seoTitle : "",
        seoDescription:
          typeof item.seoDescription === "string" ? item.seoDescription : "",
        seoKeywords:
          typeof item.seoKeywords === "string" ? item.seoKeywords : "",
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  return [];
};

const buildTeamPageState = (data: SectionData): TeamPageState => ({
  pretitle: typeof data.pretitle === "string" ? data.pretitle : "Our Team",
  title:
    typeof data.title === "string"
      ? data.title
      : "Meet the people behind the work",
  subtitle: typeof data.subtitle === "string" ? data.subtitle : "Our people",
  desc:
    typeof data.desc === "string"
      ? data.desc
      : "Introduce your team members with dedicated profile pages.",
  desc2: typeof data.desc2 === "string" ? data.desc2 : "",
  sideImage: typeof data.sideImage === "string" ? data.sideImage : "/bg1.jpg",
  sideImageTitle:
    typeof data.sideImageTitle === "string" ? data.sideImageTitle : "Teams",
  productSectionTitle:
    typeof data.productSectionTitle === "string"
      ? data.productSectionTitle
      : "All team members",
  layout:
    typeof data.layout === "string" && data.layout.startsWith("TeamPage-")
      ? data.layout
      : undefined,
  detailLayout:
    typeof data.detailLayout === "string" &&
    data.detailLayout.startsWith("TeamDetail-")
      ? data.detailLayout
      : undefined,
  teamMembers: readTeamItemsFromData(data),
});

const readGalleryItemsFromData = (data: SectionData): GalleryItem[] => {
  if (Array.isArray(data.galleryItems)) {
    return data.galleryItems
      .map((item, index) => ({
        id:
          (typeof item.id === "string" && item.id) ||
          `gallery-${index}-${item.title || "item"}`,
        title: item.title || "",
        category: item.category || "Gallery",
        desc: item.desc || item.alt || "",
        image: item.image || "/bg1.jpg",
        alt: item.alt || item.title || "",
        order: typeof item.order === "number" ? item.order : index + 1,
        active: item.active !== false,
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  return [];
};

const buildGalleryPageState = (data: SectionData): GalleryPageState => ({
  pretitle: typeof data.pretitle === "string" ? data.pretitle : "Our Gallery",
  title:
    typeof data.title === "string"
      ? data.title
      : "Moments worth sharing",
  desc:
    typeof data.desc === "string"
      ? data.desc
      : "Browse photos and visuals from our work, events, and community.",
  layout:
    typeof data.layout === "string" && data.layout.startsWith("GalleryPage-")
      ? data.layout
      : undefined,
  galleryItems: readGalleryItemsFromData(data),
});

const applyGalleryPageStateToData = (
  current: SectionData,
  state: GalleryPageState,
): SectionData => {
  const ordered = [...state.galleryItems].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const galleryItems = ordered.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category || "Gallery",
    desc: item.desc,
    image: item.image || "/bg1.jpg",
    alt: item.alt || item.title,
    order: item.order ?? 1,
    active: item.active !== false,
  }));
  return {
    ...current,
    pretitle: state.pretitle,
    title: state.title,
    desc: state.desc,
    layout: state.layout,
    galleryItems,
  };
};

const readCountriesServeItemsFromData = (
  data: SectionData,
): CountryServeItem[] => {
  if (!Array.isArray(data.countriesServeItems)) return [];
  return data.countriesServeItems
    .map((item, index) => {
      const row = item as CountryServeItem & {
        items?: Array<{ title?: string; href?: string; id?: string }>;
      };
      const name = typeof row.name === "string" ? row.name : "";
      const existingFlag = typeof row.flagImage === "string" ? row.flagImage : "";
      return {
        id:
          typeof row.id === "string" && row.id
            ? row.id
            : `country-${index + 1}`,
        name,
        flagImage: existingFlag.trim() || resolveCountryFlagImage(name),
        flagAlt: typeof row.flagAlt === "string" ? row.flagAlt : name,
        order: row.order ?? index + 1,
        active: row.active !== false,
      };
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

const readCountriesServeListingsFromData = (
  data: SectionData,
  countries: CountryServeItem[],
): CountryServeListing[] => {
  const fromFlat = Array.isArray(data.countriesServeListings)
    ? data.countriesServeListings
    : [];

  if (fromFlat.length) {
    return fromFlat
      .map((item, index) => {
        const row = item as CountryServeListing;
        const country =
          countries.find((c) => c.id === row.countryId) ||
          countries.find(
            (c) =>
              c.name.toLowerCase() ===
              (row.category || "").trim().toLowerCase(),
          );
        return {
          id:
            typeof row.id === "string" && row.id
              ? row.id
              : `listing-${index + 1}`,
          title: typeof row.title === "string" ? row.title : "",
          category: country?.name || (typeof row.category === "string" ? row.category : ""),
          countryId: country?.id || (typeof row.countryId === "string" ? row.countryId : ""),
          desc: typeof row.desc === "string" ? row.desc : "",
          content: typeof row.content === "string" ? row.content : "",
          image: typeof row.image === "string" ? row.image : "",
          alt: typeof row.alt === "string" ? row.alt : "",
          link: typeof row.link === "string" ? row.link : "",
          slug: typeof row.slug === "string" ? row.slug : "",
          order: row.order ?? index + 1,
          active: row.active !== false,
          seoTitle: typeof row.seoTitle === "string" ? row.seoTitle : "",
          seoDescription:
            typeof row.seoDescription === "string" ? row.seoDescription : "",
          seoKeywords:
            typeof row.seoKeywords === "string" ? row.seoKeywords : "",
        };
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  // Legacy nested country.items â†’ flat listings
  if (!Array.isArray(data.countriesServeItems)) return [];
  const migrated: CountryServeListing[] = [];
  data.countriesServeItems.forEach((countryRaw, countryIndex) => {
    const country = countryRaw as CountryServeItem & {
      items?: Array<{
        id?: string;
        title?: string;
        href?: string;
        link?: string;
        order?: number;
      }>;
    };
    const countryId =
      typeof country.id === "string" && country.id
        ? country.id
        : `country-${countryIndex + 1}`;
    const countryName =
      typeof country.name === "string" ? country.name : "";
    if (!Array.isArray(country.items)) return;
    country.items.forEach((link, linkIndex) => {
      migrated.push({
        id:
          typeof link.id === "string" && link.id
            ? link.id
            : `listing-${countryIndex + 1}-${linkIndex + 1}`,
        title: typeof link.title === "string" ? link.title : "",
        category: countryName,
        countryId,
        desc: "",
        content: "",
        image: "",
        alt: "",
        link:
          typeof link.link === "string"
            ? link.link
            : typeof link.href === "string"
              ? link.href
              : "",
        slug: "",
        order: link.order ?? linkIndex + 1,
        active: true,
        seoTitle: "",
        seoDescription: "",
        seoKeywords: "",
      });
    });
  });
  return migrated.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

const buildCountriesServeState = (data: SectionData): CountriesServeState => {
  const countries = readCountriesServeItemsFromData(data);
  return {
    pretitle: typeof data.pretitle === "string" ? data.pretitle : "Global reach",
    title:
      typeof data.title === "string" ? data.title : "Countries We Serve",
    desc:
      typeof data.desc === "string"
        ? data.desc
        : "Professional services across India and worldwide.",
    websiteEnabled: data.countriesServeWebsiteEnabled !== false,
    countriesServeItems: countries,
    countriesServeListings: readCountriesServeListingsFromData(data, countries),
  };
};

const applyCountriesServeStateToData = (
  current: SectionData,
  state: CountriesServeState,
): SectionData => {
  const orderedCountries = [...state.countriesServeItems].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const orderedListings = [...state.countriesServeListings].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  return {
    ...current,
    pretitle: state.pretitle,
    title: state.title,
    desc: state.desc,
    countriesServeWebsiteEnabled: state.websiteEnabled !== false,
    countriesServeItems: orderedCountries.map((item, index) => ({
      id: item.id,
      name: item.name,
      flagImage: item.flagImage,
      flagAlt: item.flagAlt || item.name,
      order: item.order ?? index + 1,
      active: item.active !== false,
    })),
    countriesServeListings: orderedListings.map((item, index) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      countryId: item.countryId,
      desc: item.desc || "",
      content: item.content || "",
      image: item.image || "",
      alt: item.alt || item.title,
      link: item.link || "",
      slug: item.slug || "",
      order: item.order ?? index + 1,
      active: item.active !== false,
      seoTitle: item.seoTitle || "",
      seoDescription: item.seoDescription || "",
      seoKeywords: item.seoKeywords || "",
    })),
  };
};

const applyTeamPageStateToData = (
  current: SectionData,
  state: TeamPageState,
): SectionData => {
  const ordered = [...state.teamMembers].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const productItems = ordered.map((teamMember) => ({
    id: teamMember.id,
    title: teamMember.title,
    category: teamMember.category || "Team",
    desc: teamMember.desc,
    content: teamMember.content || "",
    image: teamMember.image || "/bg1.jpg",
    alt: teamMember.alt || teamMember.title,
    imageTitle: teamMember.title,
    slug:
      teamMember.slug?.trim() ||
      createPageSlug(teamMember.title) ||
      teamMember.id,
    order: teamMember.order ?? 1,
    active: teamMember.active !== false,
    layout: teamMember.layout || "",
    seoTitle: teamMember.seoTitle || "",
    seoDescription: teamMember.seoDescription || "",
    seoKeywords: teamMember.seoKeywords || "",
  }));

  const visible = ordered.filter((item) => item.active !== false);
  const serviceSlides = visible.map((teamMember) => ({
    image: teamMember.image || "/bg1.jpg",
    alt: teamMember.alt || teamMember.title,
    productTitle: teamMember.title,
    productSubtitle: teamMember.category || "Team",
    productInfoTitle: teamMember.title,
    productInfoDesc: teamMember.desc,
    productFeatures: [],
    productTotalPrice: "",
    productShippingText: "",
  }));

  return {
    ...current,
    pretitle: state.pretitle,
    title: state.title,
    subtitle: state.subtitle,
    desc: state.desc,
    desc2: state.desc2,
    sideImage: state.sideImage,
    sideImageTitle: state.sideImageTitle,
    productSectionTitle: state.productSectionTitle,
    ...(state.layout ? { layout: state.layout } : {}),
    ...(state.detailLayout ? { detailLayout: state.detailLayout } : {}),
    productItems,
    serviceSlides,
    productSlides: serviceSlides,
  };
};

const addCustomPageSectionsForLinks = (
  sections: SectionItem[],
  category: string,
  pageLinks: EditorPageLink[],
  templateId?: string | null,
) => {
  const uniqueLabels = Array.from(
    new Set(
      flattenPageLinks(pageLinks)
        .filter((link) => getMultiPageSlugFromHref(link.href))
        .map((link) => link.label),
    ),
  );

  return uniqueLabels.reduce((nextSections, label) => {
    const pageSlug = createPageSlug(label);
    const normalizedSlug = normalizePageSlug(pageSlug);

    if (!pageSlug || pageSlug === "home" || normalizedSlug === "home") {
      return nextSections;
    }

    const canonicalSlug = (value: string) => {
      const slug = normalizePageSlug(value);
      if (slug === "privacy-policy") return "privacy";
      if (slug === "mission-vision") return "mission";
      if (slug === "csr-initiatives" || slug === "csr") return "community";
      if (slug === "cookie-policy") return "cookie";
      if (slug === "refund-policy") return "refund";
      if (slug === "terms-and-conditions" || slug === "terms-conditions") {
        return "terms";
      }
      return slug;
    };

    // Manager inventory pages (ServicePage / EventPage / …) — don't replace with CustomPage.
    const managerBodyTypes: Record<string, string[]> = {
      services: ["ServicePage", "Service"],
      events: ["EventPage", "Event"],
      properties: ["PropertyPage", "Property"],
      portfolio: ["PortfolioPage", "Portfolio"],
      teams: ["TeamPage", "Team"],
      gallery: ["GalleryPage"],
      blogs: ["BlogPage", "BlogIndex"],
      blog: ["BlogPage", "BlogIndex"],
    };
    const managerTypes = managerBodyTypes[normalizedSlug];
    if (managerTypes) {
      const hasManagerBody = nextSections.some((section) => {
        const page = normalizePageSlug(section.page || "");
        const samePage =
          page === normalizedSlug ||
          canonicalSlug(page) === canonicalSlug(normalizedSlug) ||
          (!page &&
            (section.id === "ServicePage" ||
              section.type === "ServicePage" ||
              section.id === "EventPage" ||
              section.type === "EventPage"));
        return samePage && managerTypes.includes(section.type);
      });
      if (hasManagerBody) return nextSections;
    }

    const hasTypedTemplateBody = nextSections.some((section) => {
      const id = (section.id || "").toLowerCase();
      const page = normalizePageSlug(section.page || "");
      const samePage =
        page === normalizedSlug ||
        canonicalSlug(page) === canonicalSlug(normalizedSlug);
      return (
        samePage &&
        section.type !== "Breadcrumb" &&
        section.type !== "CustomSection" &&
        !id.startsWith("custompage")
      );
    });
    // Still run ensure for CustomPage-* scaffolds so duplicate Details get collapsed.
    if (hasTypedTemplateBody) return nextSections;

    return ensureCustomPageScaffold(
      nextSections,
      category,
      label,
      templateId,
    );
  }, sections);
};

/** Breadcrumb + hero + ~500-word detail for a custom inner page. */
const ensureCustomPageScaffold = (
  sections: SectionItem[],
  category: string,
  label: string,
  templateId?: string | null,
): SectionItem[] => {
  const trimmedLabel = label.trim();
  if (!trimmedLabel) return sections;

  const rawSlug = createPageSlug(trimmedLabel);
  const slug = normalizePageSlug(rawSlug);
  if (!slug || slug === "home") return sections;

  const pageMatches = (pageValue: string | undefined) => {
    const page = normalizePageSlug(pageValue || "");
    return page === slug || page === rawSlug || normalizePageSlug(rawSlug) === page;
  };

  const isDetailSection = (section: SectionItem) => {
    const id = (section.id ?? "").toLowerCase();
    if (!pageMatches(section.page)) return false;
    if (id.startsWith("custompagedetail-")) return true;
    if (section.type !== "CustomSection") return false;
    const data =
      (section.data?.[section.variant] as { sectionName?: string } | undefined) ||
      {};
    return /details?/i.test(String(data.sectionName || ""));
  };

  const hasBody = sections.some(
    (section) =>
      section.type !== "Breadcrumb" &&
      !isDetailSection(section) &&
      pageMatches(section.page),
  );
  const existingBreadcrumb = sections.find(
    (section) =>
      section.type === "Breadcrumb" && pageMatches(section.page),
  );
  const hasBreadcrumb = Boolean(existingBreadcrumb);
  const detailId = `CustomPageDetail-${slug}`;
  const existingDetails = sections.filter(isDetailSection);
  const hasDetail = existingDetails.length > 0;

  const template = getBuilderTemplate(templateId, category);
  // Theme-active first; live site only as fallback — never hardcode -1.
  const activeBreadcrumbVariant =
    template.sectionVariants?.Breadcrumb ||
    sections.find((section) => section.type === "Breadcrumb")?.variant ||
    "Breadcrumb-1";

  const breadcrumbSection = createCustomPageBreadcrumb(category, trimmedLabel, {
    variant: activeBreadcrumbVariant,
    templateId,
  });
  // Force canonical page slug (About Us → "about") so detection stays idempotent.
  const customPageSection = {
    ...createCustomPageSection(category, trimmedLabel),
    id: `CustomPage-${slug}`,
    page: slug,
  };
  const detailSection = {
    ...createCustomPageDetailSection(category, trimmedLabel),
    id: detailId,
    page: slug,
  };

  let next = sections;

  // Drop duplicate Details blocks for this page (keep the first).
  if (existingDetails.length > 1) {
    const keepId = existingDetails[0]?.id;
    next = next.filter(
      (section) => !isDetailSection(section) || section.id === keepId,
    );
  }

  // Upgrade wrong/default breadcrumb skin to the theme-active layout.
  if (
    existingBreadcrumb &&
    existingBreadcrumb.variant !== activeBreadcrumbVariant
  ) {
    const savedData =
      (existingBreadcrumb.data?.[existingBreadcrumb.variant] as
        | SectionData
        | undefined) ||
      (Object.values(existingBreadcrumb.data || {})[0] as
        | SectionData
        | undefined) ||
      ({} as SectionData);
    const previewData =
      (resolveLayoutPreview(activeBreadcrumbVariant, category)
        ?.data as SectionData) || ({} as SectionData);
    next = next.map((section) => {
      if (section !== existingBreadcrumb) return section;
      return {
        ...section,
        variant: activeBreadcrumbVariant,
        data: {
          [activeBreadcrumbVariant]: {
            ...previewData,
            ...savedData,
            title:
              (typeof savedData.title === "string" && savedData.title) ||
              trimmedLabel,
            homeLabel:
              (typeof savedData.homeLabel === "string" && savedData.homeLabel) ||
              (typeof previewData.homeLabel === "string" &&
                previewData.homeLabel) ||
              "Home",
          },
        },
      };
    });
  }

  if (hasBody) {
    if (!hasDetail) {
      const bodyIndex = next.findIndex(
        (section) =>
          (section.id ?? "") === `CustomPage-${slug}` ||
          (section.type !== "Breadcrumb" &&
            section.type !== "CustomSection" &&
            normalizePageSlug(section.page || "") === slug),
      );
      if (bodyIndex >= 0) {
        next = [
          ...next.slice(0, bodyIndex + 1),
          detailSection,
          ...next.slice(bodyIndex + 1),
        ];
      } else {
        const footerIndex = next.findIndex(
          (section) => section.type === "Footer",
        );
        next =
          footerIndex === -1
            ? [...next, detailSection]
            : [
                ...next.slice(0, footerIndex),
                detailSection,
                ...next.slice(footerIndex),
              ];
      }
    }
    return next === sections ? sections : ensureUniqueSectionIds(next);
  }

  const insertSections = [
    ...(hasBreadcrumb ? [] : [breadcrumbSection]),
    customPageSection,
    ...(hasDetail ? [] : [detailSection]),
  ];
  if (!insertSections.length) {
    return next === sections ? sections : ensureUniqueSectionIds(next);
  }

  const footerIndex = next.findIndex((section) => section.type === "Footer");
  const merged =
    footerIndex === -1
      ? [...next, ...insertSections]
      : [
          ...next.slice(0, footerIndex),
          ...insertSections,
          ...next.slice(footerIndex),
        ];
  return ensureUniqueSectionIds(merged);
};

const rewritePageHrefInValue = (
  value: unknown,
  oldHref: string,
  newHref: string,
  oldLabel: string,
  newLabel: string,
): unknown => {
  if (typeof value === "string") {
    if (value === oldHref) return newHref;
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      rewritePageHrefInValue(item, oldHref, newHref, oldLabel, newLabel),
    );
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(record).map(([key, item]) => {
        if (
          key === "label" &&
          typeof item === "string" &&
          item.trim() === oldLabel &&
          typeof record.href === "string" &&
          record.href === oldHref
        ) {
          return [key, newLabel];
        }
    return [
          key,
          rewritePageHrefInValue(item, oldHref, newHref, oldLabel, newLabel),
        ];
      }),
    );
  }

  return value;
};

const renamePageSections = (
  sections: SectionItem[],
  oldLabel: string,
  newLabel: string,
  oldHref: string,
  newHref: string,
): SectionItem[] => {
  const oldSlug =
    getMultiPageSlugFromHref(oldHref) || createPageSlug(oldLabel);
  const newSlug =
    getMultiPageSlugFromHref(newHref) || createPageSlug(newLabel);
  if (!oldSlug || !newSlug) return sections;

  return sections.map((section) => {
    const nextData = rewritePageHrefInValue(
      section.data,
      oldHref,
      newHref,
      oldLabel,
      newLabel,
    ) as SectionItem["data"];

    const matchesPage =
      normalizePageSlug(section.page || "") === normalizePageSlug(oldSlug);

    if (!matchesPage) {
      if (nextData === section.data) return section;
      return { ...section, data: nextData };
    }

    const nextVariants = Object.fromEntries(
      Object.entries(nextData).map(([variant, variantData]) => {
        if (!variantData || typeof variantData !== "object") {
          return [variant, variantData];
        }
        const data = variantData as Record<string, unknown>;
        const title =
          typeof data.title === "string" && data.title.trim() === oldLabel
            ? newLabel
            : data.title;
        return [variant, { ...data, title }];
      }),
    ) as SectionItem["data"];

    return {
      ...section,
      id: section.id.replace(
        new RegExp(`${oldSlug}$`),
        newSlug,
      ),
      page: newSlug,
      data: nextVariants,
    };
  });
};

const areMenusEqual = (
  currentMenu: { label: string; href: string; children?: { label: string; href: string }[] }[] = [],
  nextMenu: { label: string; href: string; children?: { label: string; href: string }[] }[],
): boolean =>
  currentMenu.length === nextMenu.length &&
  currentMenu.every(
    (item, index) =>
      item.label === nextMenu[index]?.label &&
      item.href === nextMenu[index]?.href &&
      areMenusEqual(item.children, nextMenu[index]?.children ?? []),
  );

const BRAND_LOGO_PROJECT_FIELDS = [
  "logo",
  "logoImage",
  "logoImageTitle",
] as const;

/** Nav + brand fields belong to the website, not one header layout variant. */
const HEADER_PROJECT_FIELDS = [
  ...BRAND_LOGO_PROJECT_FIELDS,
  "menu",
  "buttons",
] as const;

/** Footer link columns + brand belong to the website, not one footer layout. */
const FOOTER_PROJECT_FIELDS = [
  ...BRAND_LOGO_PROJECT_FIELDS,
  "footerColumns",
  "footerContact",
  "footerSocialLinks",
  "footerLegalLinks",
  "copyrightText",
  "whatsappLink",
  "callLink",
  "floatingItems",
] as const;

/**
 * Logo/nav/footer-link details belong to the website, not one layout variant.
 * Keep them on every stored variant so changing layouts cannot reveal defaults.
 */
const syncHeaderProjectFields = (
  section: SectionItem,
  data: Record<string, SectionData> = section.data,
): Record<string, SectionData> => {
  if (section.type !== "Header" && section.type !== "Footer") return data;

  const activeData = data[section.variant] ?? section.data[section.variant];
  if (!activeData) return data;

  const fields =
    section.type === "Header"
      ? HEADER_PROJECT_FIELDS
      : FOOTER_PROJECT_FIELDS;

  const projectFields = Object.fromEntries(
    fields.filter((field) =>
      Object.prototype.hasOwnProperty.call(activeData, field),
    ).map((field) => [field, activeData[field as keyof typeof activeData]]),
  );
  if (!Object.keys(projectFields).length) return data;

  return Object.fromEntries(
    Object.entries(data).map(([variant, variantData]) => [
      variant,
      { ...variantData, ...projectFields } as SectionData,
    ]),
  );
};

/**
 * Project content is variant-independent. Whenever a user edits one layout,
 * copy every compatible content field into the other stored layouts while
 * mergeSectionContent deliberately leaves visual/layout controls untouched.
 * This is the central contract used by modal edits, inline edits and themes.
 */
const syncSectionContentAcrossVariants = (
  section: SectionItem,
  data: Record<string, SectionData> = section.data,
  sourceVariant = section.variant,
): Record<string, SectionData> => {
  const sourceData = data[sourceVariant];
  if (!sourceData) return data;

  const syncedData = Object.fromEntries(
    Object.entries(data).map(([variant, variantData]) => [
      variant,
      variant === sourceVariant
        ? sourceData
        : (mergeSectionContent(
            variantData as Record<string, unknown>,
            sourceData as Record<string, unknown>,
          ) as SectionData),
    ]),
  );

  return syncHeaderProjectFields(section, syncedData);
};

const ensureActiveVariantData = (sections: SectionItem[]): SectionItem[] =>
  sections.map((section) => {
    if (!section?.data || section.data[section.variant]) return section;

    const fallback =
      section.data[`${section.type}-1`] ??
      section.data[`${section.type}-2`] ??
      Object.values(section.data)[0];

    if (!fallback || typeof fallback !== "object") return section;

    return {
      ...section,
      data: {
        ...section.data,
        [section.variant]: { ...(fallback as SectionData) },
      },
    };
  });

const isSitemapNavLink = (link: { label?: string; href?: string }) => {
  const label = (link.label || "").trim().toLowerCase();
  const href = (link.href || "").trim().toLowerCase().replace(/\/+$/, "");
  return (
    label === "sitemap" ||
    href === "/sitemap" ||
    href.endsWith("/sitemap") ||
    href === "#page-sitemap"
  );
};

const stripSitemapFromMenu = (menu: unknown): EditorPageLink[] | undefined => {
  if (!Array.isArray(menu)) return undefined;
  return (menu as EditorPageLink[]).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    if (isSitemapNavLink(item)) return [];
    const children = Array.isArray(item.children)
      ? item.children.filter((child) => !isSitemapNavLink(child))
      : item.children;
    return [{ ...item, children }];
  });
};

const syncHeaderEditorState = (
  sections: SectionItem[],
  pageLinks: EditorPageLink[],
  options?: { preserveExistingMenu?: boolean },
): SectionItem[] =>
  sections.map((section) => {
    if (section.type !== "Header") return section;

    const fallbackData =
      section.data[section.variant] ??
      section.data[`${section.type}-1`] ??
      section.data[`${section.type}-2`] ??
      Object.values(section.data || {})[0];
    if (!fallbackData) return section;

    // Seed missing active variant keys (e.g. Header-4 templates that only
    // stored Header-1/Header-2 content) so the settings popup can edit them.
    const seededData = section.data[section.variant]
      ? section.data
      : {
          ...section.data,
          [section.variant]: { ...fallbackData },
        };

    const sectionWithActiveVariant = {
      ...section,
      data: seededData,
    };
    const projectData = syncSectionContentAcrossVariants(sectionWithActiveVariant);

    const withStrippedMenu = (data: Record<string, SectionData>) => {
      const variantData = data[section.variant] as SectionData | undefined;
      const stripped = stripSitemapFromMenu(variantData?.menu);
      if (!stripped) return data;
      return {
        ...data,
        [section.variant]: {
          ...variantData,
          menu: stripped,
        },
      };
    };

    // Multi-page: nav menu is authored separately from the full page list.
    // Do not rebuild menu from every pageLink or deleted items come back.
    if (options?.preserveExistingMenu) {
      return {
        ...sectionWithActiveVariant,
        data: withStrippedMenu(projectData),
      };
    }

    // Single-page: rebuild top-level links from page inventory, but keep any
    // existing dropdown children (AI master submenus) on matching parents.
    const activeVariantData = projectData[section.variant] as
      | SectionData
      | undefined;
    const existingMenu = Array.isArray(activeVariantData?.menu)
      ? (activeVariantData.menu as EditorPageLink[])
      : [];
    const existingByKey = new Map<string, EditorPageLink>();
    for (const link of existingMenu) {
      const key = `${(link.href || "").trim().toLowerCase()}|${(
        link.label || ""
      )
        .trim()
        .toLowerCase()}`;
      existingByKey.set(key, link);
      const hrefKey = (link.href || "").trim().toLowerCase();
      if (hrefKey) existingByKey.set(hrefKey, link);
      const labelKey = (link.label || "").trim().toLowerCase();
      if (labelKey) existingByKey.set(`label:${labelKey}`, link);
    }

    const nextMenu = pageLinks
      .filter(
        (link) =>
          link.kind !== "blog" &&
          link.kind !== "document" &&
          !link.hidden,
      )
      .map((link) => {
        const hrefKey = (link.href || "").trim().toLowerCase();
        const labelKey = (link.label || "").trim().toLowerCase();
        const isVoidHref = /^javascript:/i.test(hrefKey) || hrefKey === "#";
        // Never match children by shared javascript:void(0) — every redesign
        // placeholder would inherit the same mega-menu and smash the header.
        const prev =
          (!isVoidHref && hrefKey !== "#"
            ? existingByKey.get(hrefKey)
            : undefined) ||
          existingByKey.get(`label:${labelKey}`) ||
          (!isVoidHref
            ? existingByKey.get(`${hrefKey}|${labelKey}`)
            : undefined);
        if (
          prev &&
          Array.isArray(prev.children) &&
          prev.children.length &&
          !isVoidHref
        ) {
          return {
            label: link.label,
            href: link.href,
            children: prev.children,
            menuType: prev.menuType || ("dropdown" as const),
          };
        }
        // Flat link only — stable shape so normalize/sync cannot thrash.
        return {
          label: link.label,
          href: link.href,
        };
      });

    return {
      ...sectionWithActiveVariant,
      data: {
        ...projectData,
        [section.variant]: {
          ...projectData[section.variant],
          menu: stripSitemapFromMenu(nextMenu) ?? nextMenu,
        },
      },
    };
  });

const SINGLE_PAGE_SECTION_MENU: Record<
  string,
  { label: string; legacyHrefs: string[] }
> = {
  Banner: { label: "Home", legacyHrefs: ["#", "/", "#home"] },
  About: { label: "About", legacyHrefs: ["#about"] },
  Product: { label: "Services", legacyHrefs: ["#services", "#service"] },
  Service: { label: "Services", legacyHrefs: ["#services", "#service"] },
  WhyChooseUs: {
    label: "Why Choose Us",
    legacyHrefs: ["#why-choose-us"],
  },
  Gallery: { label: "Gallery", legacyHrefs: ["#gallery"] },
  FormDetail: { label: "Contact", legacyHrefs: ["#contact"] },
  Contact: { label: "Contact", legacyHrefs: ["#contact"] },
  FAQ: { label: "FAQ", legacyHrefs: ["#faq"] },
  Testimonial: { label: "Testimonials", legacyHrefs: ["#testimonials"] },
  CountriesServe: {
    label: "Countries",
    legacyHrefs: ["#countries-we-serve", "#countries"],
  },
};

const isSinglePageBlogNavLink = (link: EditorPageLink) =>
  link.kind === "blogIndex" ||
  (link.kind !== "blog" &&
    link.href.trim().toLowerCase() === "#page-blogs");

const isBlogIndexPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
}) => {
  const href = (link.href || "").trim().toLowerCase();
  const label = (link.label || "").trim().toLowerCase();
  return (
    link.kind === "blogIndex" ||
    href === "#page-blogs" ||
    href === "#page-blog" ||
    href === "#blogs" ||
    label === "blogs" ||
    label === "blog"
  );
};

const removePageLinkFromMenu = (
  menu: unknown,
  match: { label?: string; href?: string; kind?: string },
): EditorPageLink[] | undefined => {
  if (!Array.isArray(menu)) return undefined;
  const targetHref = (match.href || "").trim().toLowerCase();
  const targetLabel = (match.label || "").trim().toLowerCase();
  const targetSlug =
    getMultiPageSlugFromHref(match.href || "") ||
    normalizePageSlug(match.label || "");
  const removingBlogIndex = isBlogIndexPageLink(match);
  const removingServices = isServicesPageLink(match);
  const removingEvents = isEventsPageLink(match);
  const removingProperties = isPropertiesPageLink(match);
  const removingPortfolio = isPortfolioPageLink(match);
  const removingTeams = isTeamPageLink(match);
  const removingGallery = isGalleryPageLink(match);

  return (menu as EditorPageLink[]).flatMap((item) => {
    const itemHref = (item.href || "").trim().toLowerCase();
    const itemLabel = (item.label || "").trim().toLowerCase();
    const itemSlug =
      getMultiPageSlugFromHref(item.href || "") ||
      normalizePageSlug(item.label || "");
    const matches =
      (removingBlogIndex && isBlogIndexPageLink(item)) ||
      (removingServices && isServicesPageLink(item)) ||
      (removingEvents && isEventsPageLink(item)) ||
      (removingProperties && isPropertiesPageLink(item)) ||
      (removingPortfolio && isPortfolioPageLink(item)) ||
      (removingTeams && isTeamPageLink(item)) ||
      (removingGallery && isGalleryPageLink(item)) ||
      (Boolean(targetHref) && itemHref === targetHref) ||
      (Boolean(targetSlug) &&
        Boolean(itemSlug) &&
        itemSlug === targetSlug &&
        item.kind !== "blog") ||
      (Boolean(targetLabel) &&
        itemLabel === targetLabel &&
        item.kind !== "blog");

    if (matches) return [];

    const nextChildren = removePageLinkFromMenu(item.children, match);
    return [
      {
        ...item,
        ...(nextChildren ? { children: nextChildren } : { children: undefined }),
      },
    ];
  });
};

const stripRemovedPageFromSectionMenus = (
  sections: SectionItem[],
  match: { label?: string; href?: string; kind?: string },
): SectionItem[] =>
  sections.map((section) => {
    if (section.type !== "Header" && section.type !== "Footer") return section;

    let changed = false;
    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => {
        if (!variantData || typeof variantData !== "object") {
          return [variant, variantData];
        }
        const data = variantData as SectionData & {
          blocks?: unknown[];
        };

        const hasMenu = Array.isArray(data.menu);
        const hasBlocks = Array.isArray(data.blocks);
        if (!hasMenu && !hasBlocks) return [variant, variantData];

        let nextMenu = hasMenu
          ? removePageLinkFromMenu(data.menu, match) || []
          : undefined;

        let nextBlocks = hasBlocks ? [...(data.blocks as unknown[])] : undefined;
        if (nextBlocks) {
          nextBlocks = nextBlocks.map((block) => {
            if (!block || typeof block !== "object") return block;
            const row = block as Record<string, unknown>;
            if (row.type !== "menu" || !Array.isArray(row.items)) return block;
            const filtered = removePageLinkFromMenu(row.items, match) || [];
            if (!nextMenu) nextMenu = filtered;
            return { ...row, items: filtered };
          });
          // Keep menu block in lockstep with data.menu (source of truth).
          if (nextMenu) {
            nextBlocks = nextBlocks.map((block) => {
              if (!block || typeof block !== "object") return block;
              const row = block as Record<string, unknown>;
              if (row.type !== "menu") return block;
              return { ...row, items: nextMenu };
            });
          }
        }

        // Prefer writing an explicit menu so resolveSectionBlocks overlays it.
        if (!nextMenu && nextBlocks) {
          const menuBlock = nextBlocks.find(
            (block) =>
              block &&
              typeof block === "object" &&
              (block as Record<string, unknown>).type === "menu",
          ) as { items?: unknown } | undefined;
          if (Array.isArray(menuBlock?.items)) {
            nextMenu = menuBlock.items as EditorPageLink[];
          }
        }

        changed = true;
        return [
          variant,
          {
            ...data,
            ...(nextMenu ? { menu: nextMenu } : {}),
            ...(nextBlocks ? { blocks: nextBlocks } : {}),
          },
        ];
      }),
    ) as SectionItem["data"];

    return changed ? { ...section, data: nextData } : section;
  });

const ensureBlogsInHeaderMenu = (sections: SectionItem[]): SectionItem[] =>
  sections.map((section) => {
    if (section.type !== "Header") return section;

    let changed = false;
    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => {
        if (!variantData || typeof variantData !== "object") {
          return [variant, variantData];
        }
        const data = variantData as SectionData;
        if (!Array.isArray(data.menu)) return [variant, variantData];

        const hasBlogs = flattenPageLinks(data.menu as EditorPageLink[]).some(
          isBlogIndexPageLink,
        );
        if (hasBlogs) return [variant, variantData];

        changed = true;
        return [
          variant,
          {
            ...data,
            menu: [
              ...(data.menu as EditorPageLink[]),
              {
                label: "Blogs",
                href: "#page-blogs",
                kind: "blogIndex" as const,
              },
            ],
          },
        ];
      }),
    ) as SectionItem["data"];

    return changed ? { ...section, data: nextData } : section;
  });

const ensureServicesInHeaderMenu = (sections: SectionItem[]): SectionItem[] =>
  sections.map((section) => {
    if (section.type !== "Header") return section;

    let changed = false;
    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => {
        if (!variantData || typeof variantData !== "object") {
          return [variant, variantData];
        }
        const data = variantData as SectionData;
        if (!Array.isArray(data.menu)) return [variant, variantData];

        const hasServices = flattenPageLinks(
          data.menu as EditorPageLink[],
        ).some(isServicesPageLink);
        if (hasServices) return [variant, variantData];

        changed = true;
        return [
          variant,
          {
            ...data,
            menu: [
              ...(data.menu as EditorPageLink[]),
              {
                label: "Services",
                href: "#page-services",
              },
            ],
          },
        ];
      }),
    ) as SectionItem["data"];

    return changed ? { ...section, data: nextData } : section;
  });

const ensureEventsInHeaderMenu = (sections: SectionItem[]): SectionItem[] =>
  sections.map((section) => {
    if (section.type !== "Header") return section;

    let changed = false;
    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => {
        if (!variantData || typeof variantData !== "object") {
          return [variant, variantData];
        }
        const data = variantData as SectionData;
        if (!Array.isArray(data.menu)) return [variant, variantData];

        const hasEvents = flattenPageLinks(data.menu as EditorPageLink[]).some(
          isEventsPageLink,
        );
        if (hasEvents) return [variant, variantData];

        changed = true;
        return [
          variant,
          {
            ...data,
            menu: [
              ...(data.menu as EditorPageLink[]),
              {
                label: "Events",
                href: "#page-events",
              },
            ],
          },
        ];
      }),
    ) as SectionItem["data"];

    return changed ? { ...section, data: nextData } : section;
  });

/** Short label for header submenu (2â€“3 words). */
const shortMasterMenuLabel = (title: string) => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const short = words.slice(0, 3).join(" ");
  if (short.length <= 22) return short || title.trim() || "Item";
  return `${short.slice(0, 20).trim()}â€¦`;
};

const masterDetailHref = (
  master: "blog" | "service" | "team" | "portfolio" | "event" | "property",
  slug: string,
) => {
  const clean = slug.trim().replace(/^\/+|\/+$/g, "");
  if (master === "blog") return `#page-blog-${clean}`;
  return `#master-detail/${master}/${encodeURIComponent(clean)}`;
};

const masterHeaderParent = (
  master: "blog" | "service" | "team" | "portfolio" | "event" | "property",
): { label: string; href: string } => {
  if (master === "blog") return { label: "Blogs", href: "#page-blogs" };
  if (master === "service") return { label: "Services", href: "#page-service" };
  if (master === "event") return { label: "Events", href: "#page-events" };
  if (master === "portfolio")
    return { label: "Portfolio", href: "#page-portfolio" };
  if (master === "team") return { label: "Teams", href: "#page-teams" };
  return { label: "Properties", href: "#page-properties" };
};

const isMasterHeaderParentLink = (
  link: EditorPageLink,
  master: "blog" | "service" | "team" | "portfolio" | "event" | "property",
) => {
  if (master === "blog") return isBlogIndexPageLink(link);
  if (master === "service") return isServicesPageLink(link);
  if (master === "event") return isEventsPageLink(link);
  if (master === "portfolio") return isPortfolioPageLink(link);
  if (master === "team") return isTeamPageLink(link);
  return isPropertiesPageLink(link);
};

const masterGroupHref = (
  master: "blog" | "service" | "team" | "portfolio" | "event" | "property",
  groupLabel: string,
) => {
  const slug =
    createPageSlug(groupLabel) ||
    groupLabel
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ||
    "group";
  return `#master-group/${master}/${encodeURIComponent(slug)}`;
};

/** Build/replace header dropdown submenu for a master listing. */
const applyMasterHeaderSubmenu = (
  sections: SectionItem[],
  master: "blog" | "service" | "team" | "portfolio" | "event" | "property",
  items: Array<{
    title: string;
    slug: string;
    category?: string;
    propertyType?: string;
  }>,
  options?: {
    mode?: "name" | "category" | "type";
    merge?: "new" | "before" | "after" | "skip" | "mix" | "replace";
  },
): SectionItem[] => {
  const mode = options?.mode || "name";
  const rawMerge = options?.merge || "after";
  const merge =
    rawMerge === "mix"
      ? "after"
      : rawMerge === "replace"
        ? "new"
        : rawMerge;
  if (merge === "skip") return sections;

  const parent = masterHeaderParent(master);

  const isManagedHref = (href: string) => {
    const normalized = href.trim().toLowerCase();
    if (master === "blog") return normalized.startsWith("#page-blog-");
    return (
      normalized.startsWith(`#master-detail/${master}/`) ||
      normalized.startsWith(`#master-group/${master}/`)
    );
  };

  let managedChildren: Array<{ label: string; href: string }>;
  if (mode === "category" || mode === "type") {
    const seen = new Set<string>();
    managedChildren = [];
    for (const item of items) {
      const raw =
        mode === "type"
          ? item.propertyType || item.category || "Apartment"
          : item.category || "General";
      const label = shortMasterMenuLabel(raw);
      const key = label.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      managedChildren.push({
        label,
        href: masterGroupHref(master, raw),
      });
    }
  } else {
    const seen = new Set<string>();
    managedChildren = [];
    for (const item of items) {
      const slug =
        (item.slug || createPageSlug(item.title) || "").trim() || "item";
      const href = masterDetailHref(master, slug);
      const key = href.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      managedChildren.push({
        label: shortMasterMenuLabel(item.title),
        href,
      });
    }
  }

  if (!managedChildren.length && merge !== "new") return sections;

  const syncMenuBlocks = (
    data: SectionData,
    menu: EditorPageLink[],
  ): SectionData => {
    if (!Array.isArray(data.blocks)) return { ...data, menu };
    let found = false;
    const blocks = data.blocks.map((block) => {
      if (!block || typeof block !== "object") return block;
      const row = block as Record<string, unknown>;
      if (row.type !== "menu") return block;
      found = true;
      return { ...row, items: menu };
    });
    if (!found) {
      blocks.push({ id: "menu", type: "menu", items: menu });
    }
    return { ...data, menu, blocks };
  };

  return sections.map((section) => {
    if (section.type !== "Header") return section;
    let changed = false;
    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => {
        if (!variantData || typeof variantData !== "object") {
          return [variant, variantData];
        }
        const data = variantData as SectionData;
        const menu = Array.isArray(data.menu)
          ? ([...data.menu] as EditorPageLink[])
          : [];

        const parentIndex = menu.findIndex((link) =>
          isMasterHeaderParentLink(link, master),
        );
        changed = true;
        if (parentIndex >= 0) {
          const existing = menu[parentIndex];
          const prevChildren = Array.isArray(existing.children)
            ? existing.children
            : [];
          const nonManaged = prevChildren.filter(
            (child) => !isManagedHref(child.href || ""),
          );
          const oldManaged = prevChildren.filter((child) =>
            isManagedHref(child.href || ""),
          );
          const nextChildren =
            merge === "new"
              ? managedChildren
              : merge === "before"
                ? [...nonManaged, ...managedChildren, ...oldManaged]
                : [...nonManaged, ...oldManaged, ...managedChildren];
          const seenHrefs = new Set<string>();
          const dedupedChildren = nextChildren.filter((child) => {
            const key = (child.href || "").trim().toLowerCase();
            if (!key) return true;
            if (seenHrefs.has(key)) return false;
            seenHrefs.add(key);
            return true;
          });
          menu[parentIndex] = {
            ...existing,
            label: existing.label || parent.label,
            href: existing.href || parent.href,
            menuType: dedupedChildren.length ? "dropdown" : "link",
            children: dedupedChildren.length ? dedupedChildren : undefined,
            ...(master === "blog" ? { kind: "blogIndex" as const } : {}),
          };
        } else if (managedChildren.length) {
          menu.push({
            label: parent.label,
            href: parent.href,
            menuType: "dropdown",
            children: managedChildren,
            ...(master === "blog" ? { kind: "blogIndex" as const } : {}),
          });
        }

        return [variant, syncMenuBlocks(data, menu)];
      }),
    ) as SectionItem["data"];

    return changed ? { ...section, data: nextData } : section;
  });
};

/** Ensure AI-added master titles/slugs don't collide with existing ones. */
const uniqueMasterItemIdentity = (
  title: string,
  existingTitles: Set<string>,
  existingSlugs: Set<string>,
  fallbackSlug: string,
) => {
  let nextTitle = title.trim() || "Item";
  let baseSlug = createPageSlug(nextTitle) || fallbackSlug;
  let slug = baseSlug;
  let suffix = 2;
  while (
    existingTitles.has(nextTitle.toLowerCase()) ||
    existingSlugs.has(slug.toLowerCase())
  ) {
    nextTitle = `${title.trim() || "Item"} ${suffix}`;
    slug = createPageSlug(nextTitle) || `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  existingTitles.add(nextTitle.toLowerCase());
  existingSlugs.add(slug.toLowerCase());
  return { title: nextTitle, slug };
};

/** True when Header already has a dropdown under this master parent. */
const masterParentHasDropdownInSections = (
  sections: SectionItem[],
  master: "blog" | "service" | "team" | "portfolio" | "event" | "property",
) => {
  for (const section of sections) {
    if (section.type !== "Header") continue;
    for (const variantData of Object.values(section.data || {})) {
      if (!variantData || typeof variantData !== "object") continue;
      const menu = (variantData as SectionData).menu;
      if (!Array.isArray(menu)) continue;
      for (const link of menu as EditorPageLink[]) {
        if (!isMasterHeaderParentLink(link, master)) continue;
        if (Array.isArray(link.children) && link.children.length > 0) {
          return true;
        }
      }
    }
  }
  return false;
};

/** Infer submenu mode from existing managed hrefs (group vs detail). */
const detectMasterHeaderSubmenuMode = (
  sections: SectionItem[],
  master: "blog" | "service" | "team" | "portfolio" | "event" | "property",
): "name" | "category" | "type" => {
  const groupPrefix = `#master-group/${master}/`;
  const detailPrefix =
    master === "blog" ? "#page-blog-" : `#master-detail/${master}/`;
  let sawGroup = false;
  let sawDetail = false;
  for (const section of sections) {
    if (section.type !== "Header") continue;
    for (const variantData of Object.values(section.data || {})) {
      if (!variantData || typeof variantData !== "object") continue;
      const menu = (variantData as SectionData).menu;
      if (!Array.isArray(menu)) continue;
      for (const link of menu as EditorPageLink[]) {
        if (!isMasterHeaderParentLink(link, master)) continue;
        for (const child of link.children || []) {
          const href = (child.href || "").trim().toLowerCase();
          if (href.startsWith(groupPrefix)) sawGroup = true;
          if (href.startsWith(detailPrefix)) sawDetail = true;
        }
      }
    }
  }
  if (sawGroup && !sawDetail) {
    return master === "property" ? "type" : "category";
  }
  return "name";
};

/** Keep header submenu in sync with live master items (drop orphans after delete). */
const pruneMasterHeaderSubmenuToItems = (
  sections: SectionItem[],
  master: "blog" | "service" | "team" | "portfolio" | "event" | "property",
  items: Array<{
    title: string;
    slug: string;
    category?: string;
    propertyType?: string;
  }>,
): SectionItem[] => {
  const allowed = new Set<string>();
  for (const item of items) {
    const slug = (item.slug || createPageSlug(item.title) || "").trim();
    if (slug) {
      allowed.add(masterDetailHref(master, slug).trim().toLowerCase());
    }
    if (item.category?.trim()) {
      allowed.add(masterGroupHref(master, item.category).trim().toLowerCase());
    }
    if (item.propertyType?.trim()) {
      allowed.add(
        masterGroupHref(master, item.propertyType).trim().toLowerCase(),
      );
    }
  }

  const isManagedHref = (href: string) => {
    const normalized = href.trim().toLowerCase();
    if (master === "blog") return normalized.startsWith("#page-blog-");
    return (
      normalized.startsWith(`#master-detail/${master}/`) ||
      normalized.startsWith(`#master-group/${master}/`)
    );
  };

  return sections.map((section) => {
    if (section.type !== "Header") return section;
    let changed = false;
    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => {
        if (!variantData || typeof variantData !== "object") {
          return [variant, variantData];
        }
        const data = variantData as SectionData;
        if (!Array.isArray(data.menu)) return [variant, variantData];

        const menu = (data.menu as EditorPageLink[]).map((link) => {
          if (!isMasterHeaderParentLink(link, master)) return link;
          const prevChildren = Array.isArray(link.children)
            ? link.children
            : [];
          if (!prevChildren.length) return link;

          const nextChildren = prevChildren.filter((child) => {
            const href = (child.href || "").trim();
            if (!isManagedHref(href)) return true;
            return allowed.has(href.toLowerCase());
          });

          if (nextChildren.length === prevChildren.length) return link;
          changed = true;
          if (!nextChildren.length) {
            return {
              ...link,
              children: undefined,
              menuType:
                link.menuType === "dropdown" || link.menuType === "mega"
                  ? ("link" as const)
                  : link.menuType,
            };
          }
          return { ...link, children: nextChildren, menuType: "dropdown" as const };
        });

        if (!changed) return [variant, variantData];
        const nextVariant: SectionData = { ...data, menu };
        if (Array.isArray(data.blocks)) {
          nextVariant.blocks = data.blocks.map((block) => {
            if (!block || typeof block !== "object") return block;
            const row = block as Record<string, unknown>;
            if (row.type !== "menu") return block;
            return { ...row, items: menu };
          });
        }
        return [variant, nextVariant];
      }),
    ) as SectionItem["data"];

    return changed ? { ...section, data: nextData } : section;
  });
};

const ensurePropertiesInHeaderMenu = (sections: SectionItem[]): SectionItem[] =>
  sections.map((section) => {
    if (section.type !== "Header") return section;

    let changed = false;
    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => {
        if (!variantData || typeof variantData !== "object") {
          return [variant, variantData];
        }
        const data = variantData as SectionData;
        if (!Array.isArray(data.menu)) return [variant, variantData];

        const hasProperties = flattenPageLinks(
          data.menu as EditorPageLink[],
        ).some(isPropertiesPageLink);
        if (hasProperties) return [variant, variantData];

        changed = true;
        return [
          variant,
          {
            ...data,
            menu: [
              ...(data.menu as EditorPageLink[]),
              {
                label: "Properties",
                href: "#page-properties",
              },
            ],
          },
        ];
      }),
    ) as SectionItem["data"];

    return changed ? { ...section, data: nextData } : section;
  });

const ensurePortfolioInHeaderMenu = (
  sections: SectionItem[],
  templateId?: string | null,
  category?: string | null,
): SectionItem[] => {
  const nav = resolveThemePortfolioNavLink(templateId, category);
  return sections.map((section) => {
    if (section.type !== "Header") return section;

    let changed = false;
    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => {
        if (!variantData || typeof variantData !== "object") {
          return [variant, variantData];
        }
        const data = variantData as SectionData;
        if (!Array.isArray(data.menu)) return [variant, variantData];

        const hasPortfolio = flattenPageLinks(
          data.menu as EditorPageLink[],
        ).some(isPortfolioPageLink);
        if (hasPortfolio) return [variant, variantData];

        changed = true;
        return [
          variant,
          {
            ...data,
            menu: [
              ...(data.menu as EditorPageLink[]),
              {
                label: nav.label,
                href: nav.href,
              },
            ],
          },
        ];
      }),
    ) as SectionItem["data"];

    return changed ? { ...section, data: nextData } : section;
  });
};

const ensureGalleryInHeaderMenu = (sections: SectionItem[]): SectionItem[] =>
  sections.map((section) => {
    if (section.type !== "Header") return section;

    let changed = false;
    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => {
        if (!variantData || typeof variantData !== "object") {
          return [variant, variantData];
        }
        const data = variantData as SectionData;
        if (!Array.isArray(data.menu)) return [variant, variantData];

        const hasGallery = flattenPageLinks(
          data.menu as EditorPageLink[],
        ).some(isGalleryPageLink);
        if (hasGallery) return [variant, variantData];

        changed = true;
        return [
          variant,
          {
            ...data,
            menu: [
              ...(data.menu as EditorPageLink[]),
              {
                label: "Gallery",
                href: "#page-gallery",
              },
            ],
          },
        ];
      }),
    ) as SectionItem["data"];

    return changed ? { ...section, data: nextData } : section;
  });

const ensureTeamsInHeaderMenu = (sections: SectionItem[]): SectionItem[] =>
  sections.map((section) => {
    if (section.type !== "Header") return section;

    let changed = false;
    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => {
        if (!variantData || typeof variantData !== "object") {
          return [variant, variantData];
        }
        const data = variantData as SectionData;
        if (!Array.isArray(data.menu)) return [variant, variantData];

        const hasTeams = flattenPageLinks(
          data.menu as EditorPageLink[],
        ).some(isTeamPageLink);
        if (hasTeams) return [variant, variantData];

        changed = true;
        return [
          variant,
          {
            ...data,
            menu: [
              ...(data.menu as EditorPageLink[]),
              {
                label: "Teams",
                href: "#page-teams",
              },
            ],
          },
        ];
      }),
    ) as SectionItem["data"];

    return changed ? { ...section, data: nextData } : section;
  });

const buildSectionSyncedSinglePageMenu = (
  sections: SectionItem[],
  currentLinks: EditorPageLink[],
  options?: { appendMissingSectionLinks?: boolean },
): EditorPageLink[] => {
  const appendMissingSectionLinks = options?.appendMissingSectionLinks === true;
  const homeSections = sections.filter((section) => !section.page);
  const usedLabels = new Set<string>();

  const sectionLinks = homeSections.flatMap((section, sectionIndex) => {
    const definition = SINGLE_PAGE_SECTION_MENU[section.type];
    if (!definition) return [];

    const menuKey = definition.label.toLowerCase();
    if (usedLabels.has(menuKey)) return [];
    usedLabels.add(menuKey);

    const href =
      section.type === "Banner"
        ? "#"
        : `#${getSectionAnchorId(homeSections, sectionIndex)}`;
    const matchingLink = currentLinks.find((link) => {
      const normalizedHref = link.href.trim().toLowerCase();
      return (
        normalizedHref === href.toLowerCase() ||
        definition.legacyHrefs.includes(normalizedHref) ||
        link.label.trim().toLowerCase() === menuKey
      );
    });

    return [
      matchingLink
        ? { ...matchingLink, href }
        : { label: definition.label, href },
    ];
  });

  const blogNavigationLinks = currentLinks
    .filter(isSinglePageBlogNavLink)
    .map((link) => ({
      ...link,
      kind: "blogIndex" as const,
      href: "#page-blogs",
      children: undefined,
    }));
  const blogRecords = flattenPageLinks(currentLinks)
    .filter(
      (link) =>
        link.kind === "blog" &&
        Boolean(getMultiPageSlugFromHref(link.href)),
    )
    .map((link) => ({ ...link, children: undefined }));

  const documentRecords = currentLinks
    .filter((link) => link.kind === "document")
    .map((link) => ({ ...link, children: undefined }));

  const currentNav = currentLinks.filter(
    (link) =>
      link.kind !== "blog" &&
      link.kind !== "document" &&
      !isSinglePageBlogNavLink(link),
  );

  // Empty nav (first load) â†’ derive from page sections.
  if (currentNav.length === 0) {
    return [
      ...sectionLinks,
      ...blogNavigationLinks,
      ...documentRecords,
      ...blogRecords,
    ];
  }

  // Preserve user add/delete/reorder/dropdowns; only refresh hrefs for known sections.
  const refreshedNav = currentNav.map((link) => {
    const normalizedHref = link.href.trim().toLowerCase();
    const normalizedLabel = link.label.trim().toLowerCase();
    const matched =
      sectionLinks.find((item) => item.href.toLowerCase() === normalizedHref) ||
      sectionLinks.find(
        (item) => item.label.trim().toLowerCase() === normalizedLabel,
      ) ||
      sectionLinks.find((item) => {
        const definition = Object.values(SINGLE_PAGE_SECTION_MENU).find(
          (entry) => entry.label.toLowerCase() === item.label.toLowerCase(),
        );
        return definition?.legacyHrefs.includes(normalizedHref) ?? false;
      });

    return matched ? { ...link, href: matched.href } : { ...link };
  });

  let nextNav = refreshedNav;
  if (appendMissingSectionLinks) {
    const coveredLabels = new Set(
      refreshedNav.map((link) => link.label.trim().toLowerCase()),
    );
    const coveredHrefs = new Set(
      refreshedNav.map((link) => link.href.trim().toLowerCase()),
    );
    const missing = sectionLinks.filter(
      (item) =>
        !coveredLabels.has(item.label.trim().toLowerCase()) &&
        !coveredHrefs.has(item.href.trim().toLowerCase()),
    );
    nextNav = [...refreshedNav, ...missing];
  }

  return [
    ...nextNav,
    ...blogNavigationLinks,
    ...documentRecords,
    ...blogRecords,
  ];
};

/** Known section â†” multi-page slug aliases for theme-switch href conversion. */
const NAV_LINK_SECTION_ALIASES: {
  slugs: string[];
  labels: string[];
  singleHrefs: string[];
}[] = [
  { slugs: ["home"], labels: ["home"], singleHrefs: ["#", "/", "#home"] },
  { slugs: ["about"], labels: ["about"], singleHrefs: ["#about"] },
  {
    slugs: ["services", "service"],
    labels: ["services", "service"],
    singleHrefs: ["#services", "#service"],
  },
  { slugs: ["gallery"], labels: ["gallery"], singleHrefs: ["#gallery"] },
  { slugs: ["contact"], labels: ["contact"], singleHrefs: ["#contact"] },
  { slugs: ["faq"], labels: ["faq"], singleHrefs: ["#faq"] },
  {
    slugs: ["testimonials", "testimonial"],
    labels: ["testimonials", "testimonial"],
    singleHrefs: ["#testimonials", "#testimonial"],
  },
  {
    slugs: ["why-choose-us", "whychooseus"],
    labels: ["why choose us", "why-choose-us"],
    singleHrefs: ["#why-choose-us"],
  },
];

const findNavLinkAlias = (href: string, label = "") => {
  const normalizedHref = href.trim().toLowerCase();
  const normalizedLabel = label.trim().toLowerCase();
  const slug = getMultiPageSlugFromHref(href);

  return (
    NAV_LINK_SECTION_ALIASES.find(
      (alias) =>
        (slug && alias.slugs.includes(slug)) ||
        alias.singleHrefs.includes(normalizedHref) ||
        (normalizedLabel && alias.labels.includes(normalizedLabel)),
    ) || null
  );
};

const buildSinglePageSectionHrefLookup = (sections: SectionItem[]) => {
  const homeSections = sections.filter((section) => !section.page);
  const byLabel = new Map<string, string>();
  const byHref = new Map<string, string>();

  homeSections.forEach((section, sectionIndex) => {
    const definition = SINGLE_PAGE_SECTION_MENU[section.type];
    if (!definition) return;
    const href =
      section.type === "Banner"
        ? "#"
        : `#${getSectionAnchorId(homeSections, sectionIndex)}`;
    const labelKey = definition.label.toLowerCase();
    if (!byLabel.has(labelKey)) byLabel.set(labelKey, href);
    definition.legacyHrefs.forEach((legacy) => {
      if (!byHref.has(legacy)) byHref.set(legacy, href);
    });
    byHref.set(href.toLowerCase(), href);
  });

  return { byLabel, byHref };
};

const resolveNavHrefForTemplate = (
  href: string,
  label: string,
  templateId: string,
  themeSections: SectionItem[],
  options?: { forcePageLink?: boolean; category?: string | null },
): string => {
  const normalizedHref = href.trim();
  if (!normalizedHref) return href;

  const lowerHref = normalizedHref.toLowerCase();
  const lowerLabel = label.trim().toLowerCase();
  if (lowerHref === "#page-blogs" || lowerLabel === "blogs" || lowerLabel === "blog") {
    return "#page-blogs";
  }

  // Real pages (documents / custom pages) always keep #page-* links.
  if (options?.forcePageLink) {
    if (lowerHref.startsWith("#page-")) return normalizedHref;
    const slug = createPageSlug(label) || getMultiPageSlugFromHref(normalizedHref);
    return slug && slug !== "home" ? `#page-${slug}` : normalizedHref;
  }

  const template = getBuilderTemplate(templateId, options?.category);
  const isMulti = template.type === "Multiple Pages Website";
  const alias = findNavLinkAlias(normalizedHref, label);

  if (!isMulti) {
    const lookup = buildSinglePageSectionHrefLookup(themeSections);
    if (alias) {
      for (const aliasLabel of alias.labels) {
        const sectionHref = lookup.byLabel.get(aliasLabel);
        if (sectionHref) return sectionHref;
      }
      for (const singleHref of alias.singleHrefs) {
        const sectionHref = lookup.byHref.get(singleHref);
        if (sectionHref) return sectionHref;
      }
    }
    const byLabel = lookup.byLabel.get(lowerLabel);
    if (byLabel) return byLabel;
    const byHref = lookup.byHref.get(lowerHref);
    if (byHref) return byHref;
    // Non-section page links stay as #page-* on single-page sites.
    return normalizedHref;
  }

  // Multi-page: section anchors / aliases become #page-{slug}.
  if (lowerHref === "#" || lowerLabel === "home") return "#";

  const templatePages = getTemplatePages(template);
  if (alias) {
    const matchedPage =
      templatePages.find((page) =>
        alias.slugs.includes(normalizePageSlug(page.id)),
      ) ||
      templatePages.find((page) =>
        alias.labels.includes(page.label.trim().toLowerCase()),
      );
    if (matchedPage) return `#page-${normalizePageSlug(matchedPage.id)}`;
    return `#page-${alias.slugs[0]}`;
  }

  const existingSlug = getMultiPageSlugFromHref(normalizedHref);
  if (existingSlug) return `#page-${existingSlug}`;

  const matchedByLabel = templatePages.find(
    (page) => page.label.trim().toLowerCase() === lowerLabel,
  );
  if (matchedByLabel) return `#page-${normalizePageSlug(matchedByLabel.id)}`;

  if (lowerHref.startsWith("#") && lowerHref !== "#") {
    const hashSlug = normalizePageSlug(lowerHref.slice(1));
    if (hashSlug) return `#page-${hashSlug}`;
  }

  return normalizedHref;
};

const adaptPageLinksForTemplate = (
  links: EditorPageLink[],
  templateId: string,
  themeSections: SectionItem[],
  category?: string | null,
): EditorPageLink[] =>
  links.map((link) => {
    const forcePageLink =
      link.kind === "document" ||
      link.kind === "blog" ||
      link.kind === "blogIndex";
    const href = resolveNavHrefForTemplate(
      link.href,
      link.label,
      templateId,
      themeSections,
      { forcePageLink, category },
    );
    const children = link.children
      ? adaptPageLinksForTemplate(
          link.children,
          templateId,
          themeSections,
          category,
        )
      : undefined;
    return {
      ...link,
      href:
        link.kind === "blogIndex" || isSinglePageBlogNavLink(link)
          ? "#page-blogs"
          : href,
      children,
    };
  });

const rewriteHrefFieldsForTemplate = (
  value: unknown,
  templateId: string,
  themeSections: SectionItem[],
  category?: string | null,
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const record = item as Record<string, unknown>;
        const label = typeof record.label === "string" ? record.label : "";
        const next = rewriteHrefFieldsForTemplate(
          record,
          templateId,
          themeSections,
          category,
        ) as Record<string, unknown>;
        if (typeof record.href === "string") {
          return {
            ...next,
            href: resolveNavHrefForTemplate(
              record.href,
              label,
              templateId,
              themeSections,
              { category },
            ),
          };
        }
        return next;
      }
      return rewriteHrefFieldsForTemplate(
        item,
        templateId,
        themeSections,
        category,
      );
    });
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(record).map(([key, item]) => {
        if (key === "href" && typeof item === "string") {
          const label = typeof record.label === "string" ? record.label : "";
          return [
            key,
            resolveNavHrefForTemplate(
              item,
              label,
              templateId,
              themeSections,
              { category },
            ),
          ];
        }
        return [
          key,
          rewriteHrefFieldsForTemplate(
            item,
            templateId,
            themeSections,
            category,
          ),
        ];
      }),
    );
  }

  return value;
};

const adaptSectionsHrefsForTemplate = (
  sections: SectionItem[],
  templateId: string,
  themeSections: SectionItem[],
  category?: string | null,
): SectionItem[] =>
  sections.map((section) => {
    const nextData = rewriteHrefFieldsForTemplate(
      section.data,
      templateId,
      themeSections,
      category,
    ) as SectionItem["data"];
    return nextData === section.data ? section : { ...section, data: nextData };
  });

const replaceFirstTextValue = (
  value: unknown,
  oldText: string,
  newText: string,
  targetOccurrence = 0,
  tracker: { occurrence: number } = { occurrence: 0 },
): { value: unknown; replaced: boolean } => {
  if (typeof value === "string") {
    if (value.trim() !== oldText.trim()) {
      return { value, replaced: false };
    }

    const isTarget = tracker.occurrence === targetOccurrence;
    tracker.occurrence += 1;
    return isTarget
      ? { value: newText, replaced: true }
      : { value, replaced: false };
  }

  if (Array.isArray(value)) {
    let replaced = false;
    const nextValue = value.map((item) => {
      if (replaced) return item;

      const result = replaceFirstTextValue(
        item,
        oldText,
        newText,
        targetOccurrence,
        tracker,
      );
      replaced = result.replaced;

      return result.value;
    });

    return { value: nextValue, replaced };
  }

  if (isRecord(value)) {
    let replaced = false;
    const nextValue = Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (replaced) return [key, item];
        if (key.startsWith("__")) return [key, item];

        const result = replaceFirstTextValue(
          item,
          oldText,
          newText,
          targetOccurrence,
          tracker,
        );
        replaced = result.replaced;

        return [key, result.value];
      }),
    );

    return { value: nextValue, replaced };
  }

  return { value, replaced: false };
};

const BLOCK_ROLE_LEGACY_FIELDS: Record<string, string[]> = {
  pretitle: ["pretitle"],
  heading: ["title", "productTitle", "productSectionTitle"],
  subheading: ["subtitle", "productSubtitle"],
  paragraph: ["desc", "productInfoDesc"],
  "paragraph-secondary": ["desc2", "philosophyDesc"],
  "philosophy-heading": ["philosophyTitle"],
  phone: ["phone"],
  email: ["email"],
  location: ["location"],
};

/** Prefer formatKey (block id / field) so CSS text-transform cannot break saves. */
const applyInlineTextByFormatKey = (
  data: SectionData,
  formatKey: string,
  newText: string,
): { value: SectionData; replaced: boolean } => {
  const blockMatch = formatKey.match(/^block:([^:]+):(.+)$/);
  if (blockMatch) {
    const [, blockId, fieldPath] = blockMatch;
    const field = fieldPath.split(":")[0];
    let replaced = false;
    const nextBlocks = Array.isArray(data.blocks)
      ? data.blocks.map((block) => {
          if (!isRecord(block) || block.id !== blockId || replaced) return block;
          if (typeof block[field] !== "string") return block;
          replaced = true;
          return { ...block, [field]: newText };
        })
      : data.blocks;

    let nextData: SectionData = {
      ...data,
      ...(replaced && Array.isArray(nextBlocks) ? { blocks: nextBlocks } : {}),
    };

    const roleFromId = blockId.endsWith("-text")
      ? blockId.slice(0, -"-text".length)
      : "";
    const updatedBlock = Array.isArray(nextBlocks)
      ? nextBlocks.find((block) => isRecord(block) && block.id === blockId)
      : undefined;
    const role =
      (isRecord(updatedBlock) && typeof updatedBlock.role === "string"
        ? updatedBlock.role
        : "") || roleFromId;
    const legacyFields = BLOCK_ROLE_LEGACY_FIELDS[role] || [];

    if (field === "content" && legacyFields.length) {
      const existingKeys = legacyFields.filter(
        (legacyKey) => typeof nextData[legacyKey] === "string",
      );
      if (existingKeys.length) {
        existingKeys.forEach((legacyKey) => {
          nextData = { ...nextData, [legacyKey]: newText };
        });
        replaced = true;
      } else if (role === "heading") {
        nextData = { ...nextData, title: newText };
        replaced = true;
      } else if (!replaced) {
        nextData = { ...nextData, [legacyFields[0]]: newText };
        replaced = true;
      }
    }

    if (replaced) return { value: nextData, replaced: true };
  }

  const fieldMatch = formatKey.match(/^[^:]+:([^:]+)$/);
  if (fieldMatch) {
    const fieldAlias = fieldMatch[1];
    const fieldMap: Record<string, string> = {
      title: "title",
      pretitle: "pretitle",
      subtitle: "subtitle",
      description: "desc",
      "description-secondary": "desc2",
      "philosophy-title": "philosophyTitle",
      "philosophy-description": "philosophyDesc",
      submit: "formSubmitLabel",
      phone: "phone",
      email: "email",
      location: "location",
      logo: "logo",
    };
    const dataKey = fieldMap[fieldAlias];
    if (dataKey) {
      return {
        value: { ...data, [dataKey]: newText },
        replaced: true,
      };
    }
  }

  return { value: data, replaced: false };
};

const getBreadcrumbInlineField = (formatKey?: string) => {
  if (!formatKey?.startsWith("breadcrumb-")) return null;
  if (formatKey.endsWith(":home-label")) return "homeLabel";
  if (
    formatKey.endsWith(":current-label") ||
    formatKey.endsWith(":title")
  ) {
    return "title";
  }
  if (formatKey.endsWith(":pretitle")) return "pretitle";
  if (formatKey.endsWith(":description")) return "desc";
  return null;
};

const MAX_INLINE_MENU_LABEL_LENGTH = 20;

const applyHeaderMenuInlineLabelUpdate = (
  activeData: SectionData,
  formatKey: string,
  newText: string,
  fallbackMenu?: EditorPageLink[],
): { value: SectionData; menu: EditorPageLink[] } | null => {
  const trimmedText = newText.trim().slice(0, MAX_INLINE_MENU_LABEL_LENGTH);
  if (!trimmedText) return null;

  const sourceMenu =
    Array.isArray(activeData.menu) && activeData.menu.length > 0
      ? (activeData.menu as EditorPageLink[])
      : fallbackMenu;
  if (!sourceMenu?.length) return null;

  const menuItems = sourceMenu.map((item) => ({
    ...item,
    children: item.children?.map((child) => ({ ...child })),
  }));

  const itemMatch = formatKey.match(/^block:menu:item:(\d+):label$/);
  if (itemMatch) {
    const index = Number(itemMatch[1]);
    if (!menuItems[index]) return null;
    menuItems[index] = { ...menuItems[index], label: trimmedText };
    return { value: { ...activeData, menu: menuItems }, menu: menuItems };
  }

  const childMatch = formatKey.match(
    /^block:menu:item:(\d+):child:(\d+):label$/,
  );
  if (childMatch) {
    const itemIndex = Number(childMatch[1]);
    const childIndex = Number(childMatch[2]);
    const parent = menuItems[itemIndex];
    if (!parent?.children?.[childIndex]) return null;
    const children = parent.children.map((child, index) =>
      index === childIndex ? { ...child, label: trimmedText } : child,
    );
    menuItems[itemIndex] = { ...parent, children };
    return { value: { ...activeData, menu: menuItems }, menu: menuItems };
  }

  return null;
};

const replaceFirstLinkHref = (
  value: unknown,
  oldHref: string,
  newHref: string,
  linkText: string,
): { value: unknown; replaced: boolean } => {
  if (Array.isArray(value)) {
    let replaced = false;
    const nextValue = value.map((item) => {
      if (replaced) return item;

      const result = replaceFirstLinkHref(
        item,
        oldHref,
        newHref,
        linkText,
      );
      replaced = result.replaced;
      return result.value;
    });

    return { value: nextValue, replaced };
  }

  if (isRecord(value)) {
    const normalizedLinkText = linkText.replace(/\s+/g, " ").trim();
    const textFields = ["label", "title", "text", "name"];
    const hasMatchingText = textFields.some((field) => {
      const fieldValue = value[field];
      return (
        typeof fieldValue === "string" &&
        fieldValue.replace(/\s+/g, " ").trim() === normalizedLinkText
      );
    });

    if (value.href === oldHref && hasMatchingText) {
      return { value: { ...value, href: newHref }, replaced: true };
    }

    let replaced = false;
    const nextValue = Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (replaced || key.startsWith("__")) return [key, item];

        const result = replaceFirstLinkHref(
          item,
          oldHref,
          newHref,
          linkText,
        );
        replaced = result.replaced;
        return [key, result.value];
      }),
    );

    return { value: nextValue, replaced };
  }

  return { value, replaced: false };
};

const replaceFirstMediaValue = (
  value: unknown,
  oldSrc: string,
  newSrc: string,
  mediaType: "image" | "video",
  fileName: string,
  targetOccurrence = 0,
  tracker: { occurrence: number } = { occurrence: 0 },
): { value: unknown; replaced: boolean } => {
  if (typeof value === "string") {
    if (value !== oldSrc) return { value, replaced: false };

    const isTarget = tracker.occurrence === targetOccurrence;
    tracker.occurrence += 1;
    return isTarget
      ? { value: newSrc, replaced: true }
      : { value, replaced: false };
  }

  if (Array.isArray(value)) {
    let replaced = false;
    const nextValue = value.map((item) => {
      if (replaced) return item;

      const result = replaceFirstMediaValue(
        item,
        oldSrc,
        newSrc,
        mediaType,
        fileName,
        targetOccurrence,
        tracker,
      );
      replaced = result.replaced;

      return result.value;
    });

    return { value: nextValue, replaced };
  }

  if (isRecord(value)) {
    let replaced = false;
    const nextValue = Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (replaced) return [key, item];

        const result = replaceFirstMediaValue(
          item,
          oldSrc,
          newSrc,
          mediaType,
          fileName,
          targetOccurrence,
          tracker,
        );
        replaced = result.replaced;

        return [key, result.value];
      }),
    );

    if (replaced && mediaType === "image") {
      if ("backgroundImageTitle" in nextValue) {
        nextValue.backgroundImageTitle = fileName;
      }
      if ("sideImageTitle" in nextValue) {
        nextValue.sideImageTitle = fileName;
      }
      if ("alt" in nextValue && !nextValue.alt) {
        nextValue.alt = fileName;
      }
    }

    return { value: nextValue, replaced };
  }

  return { value, replaced: false };
};

const replaceHintedMediaValue = (
  data: SectionData,
  newSrc: string,
  fileName: string,
  fieldHint?: string,
): { value: SectionData; replaced: boolean } => {
  const fieldByRole: Record<string, string> = {
    background: "backgroundImage",
    side: "sideImage",
    logo: "logoImage",
  };
  const field = fieldHint ? fieldByRole[fieldHint] : undefined;
  if (!field || typeof data[field] !== "string") {
    return { value: data, replaced: false };
  }

  const nextData: SectionData = { ...data, [field]: newSrc };
  const titleField = `${field}Title`;
  if (titleField in nextData) nextData[titleField] = fileName;
  return { value: nextData, replaced: true };
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <EditorLayoutPage />
    </Suspense>
  );
}

function EditorLayoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentPage, pageLinks, setCurrentPage, setPageLinks } = usePreview();
  const designIdParam = (searchParams.get("designId") || "").trim();
  const redesignPack = designIdParam.startsWith("rd_")
    ? readRedesignEditorPack(designIdParam)
    : null;
  const templateId =
    searchParams.get("templateId") ||
    redesignPack?.templateId ||
    "template-1";
  const category =
    searchParams.get("category") || redesignPack?.category || "Realestate";
  const siteId = searchParams.get("siteId");
  const urlPage = searchParams.get("page");
  const isRedesignOpen = isRedesignEditorSearchParams(searchParams);
  const redesignDesignId = designIdParam;
  const redesignSectionVariants = redesignPack?.sectionVariants || {};
  const page = resolveEditorPageLabel(
    urlPage && urlPage !== "home" ? urlPage : currentPage || "home",
    pageLinks,
  );
  const [contentReady, setContentReady] = useState(false);
  const [guestDraft, setGuestDraft] = useState<EditorDraft | null>(null);
  const [guestDraftReady, setGuestDraftReady] = useState(() => Boolean(siteId));
  const [redesignLiveSections, setRedesignLiveSections] = useState<
    SectionItem[] | null
  >(null);
  const requestedSiteIdentity = siteId
    ? `${siteId}:${templateId}:${category}`
    : "local";
  const [readySiteIdentity, setReadySiteIdentity] = useState<string | null>(
    siteId ? null : "local",
  );
  const siteReady = readySiteIdentity === requestedSiteIdentity;
  const [siteLoadError, setSiteLoadError] = useState("");
  const [siteEpoch, setSiteEpoch] = useState(0);
  /** In-memory site snapshot â€” never open a DB site from template defaults. */
  const [hydratedSite, setHydratedSite] = useState<{
    siteId: string;
    templateId: string;
    category: string;
    sections: SectionItem[];
    pageLinks: EditorPageLink[];
    templateVariables: Record<string, string>;
    seo?: SiteSeoConfig;
    updatedAt: number;
  } | null>(null);

  useEffect(() => {
    const hasExplicitParams = Boolean(
      searchParams.get("templateId") ||
        searchParams.get("category") ||
        searchParams.get("siteId"),
    );
    if (!hasExplicitParams) return;

    const params = new URLSearchParams({ templateId, category });
    if (siteId) params.set("siteId", siteId);
    const pageSlug = searchParams.get("page");
    if (pageSlug && pageSlug !== "home") params.set("page", pageSlug);
    // Redesign keeps a clean public URL (designId/domain/businessName only).
    if (isRedesignOpen && designIdParam) {
      const clean = new URLSearchParams();
      clean.set("designId", designIdParam);
      const domainParam = searchParams.get("domain");
      if (domainParam) clean.set("domain", domainParam);
      const businessName = searchParams.get("businessName");
      if (businessName) clean.set("businessName", businessName);
      setLastEditorUrl(`/editor?${clean.toString()}`);
      return;
    }
    if (searchParams.get("redesign") === "1") params.set("redesign", "1");
    const designIdFromUrl = searchParams.get("designId");
    if (designIdFromUrl) params.set("designId", designIdFromUrl);
    const domainParam = searchParams.get("domain");
    if (domainParam) params.set("domain", domainParam);
    const businessName = searchParams.get("businessName");
    if (businessName) params.set("businessName", businessName);
    setLastEditorUrl(`/editor?${params.toString()}`);
  }, [searchParams, templateId, category, siteId, isRedesignOpen, designIdParam]);

  useEffect(() => {
    let cancelled = false;
    const prepareTimeout = window.setTimeout(() => {
      setContentReady(false);
      void (async () => {
        await refreshCategoryContentFromApi();
        if (!cancelled) setContentReady(true);
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(prepareTimeout);
    };
  }, [templateId, category]);

  useEffect(() => {
    if (siteId) {
      setGuestDraft(null);
      setGuestDraftReady(true);
      return;
    }
    // Redesign: restore designId-scoped local draft (survives refresh).
    if (isRedesignOpen && designIdParam) {
      setGuestDraftReady(false);
      let cancelled = false;
      void (async () => {
        let draft = await loadEditorDraft(templateId, category, designIdParam);
        // Cloud migrate saves under DB siteId; URL may still be designId-only.
        if (!draft?.sections?.length) {
          const activeId = getUserActiveSiteId();
          if (activeId && activeId !== designIdParam) {
            draft = await loadEditorDraft(templateId, category, activeId);
          }
        }
        if (cancelled) return;
        setGuestDraft(draft);
        setGuestDraftReady(true);
      })();
      return () => {
        cancelled = true;
      };
    }
    if (isRedesignOpen) {
      setGuestDraft(null);
      setGuestDraftReady(true);
      return;
    }
    setGuestDraftReady(false);
    let cancelled = false;
    void loadEditorDraft(templateId, category).then((draft) => {
      if (cancelled) return;
      setGuestDraft(draft);
      setGuestDraftReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [siteId, templateId, category, isRedesignOpen, designIdParam]);

  // If seed didn't persist sections (quota / empty build), rebuild from pack + domain theme.
  useEffect(() => {
    if (!isRedesignOpen || siteId || !contentReady || !designIdParam) return;
    if (readRedesignEditorSections(designIdParam)?.length) {
      setRedesignLiveSections(null);
      return;
    }
    const pack = redesignPack;
    const theme = readRedesignEditorTheme(designIdParam);
    if (!pack?.category || !theme) return;
    let cancelled = false;
    void (async () => {
      await refreshCategoryContentFromApi();
      if (cancelled) return;
      const built = buildRedesignHomeFromLayouts(
        pack.category,
        pack.sectionVariants || {},
        theme,
      );
      if (!built.length) return;
      saveRedesignEditorSections(designIdParam, built);
      if (!cancelled) setRedesignLiveSections(built as SectionItem[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isRedesignOpen,
    siteId,
    contentReady,
    designIdParam,
    redesignPack,
    templateId,
    category,
  ]);

  /** When opening an existing DB site, prefer latest saved config over empty/local draft. */
  useEffect(() => {
    let cancelled = false;
    let canOpenSite = false;
    const prepareTimeout = window.setTimeout(() => {
      if (!siteId) {
        setHydratedSite(null);
        setSiteLoadError("");
        setReadySiteIdentity("local");
        return;
      }

      setReadySiteIdentity(null);
      setHydratedSite(null);
      setSiteLoadError("");
      void (async () => {
        try {
          const res = await fetch(`/api/user/sites/${siteId}`, {
            credentials: "include",
            cache: "no-store",
          });
          if (res.status === 401 || res.status === 403) {
            const returnUrl = `/editor?${new URLSearchParams({
              templateId,
              category,
              siteId,
            }).toString()}`;
            window.sessionStorage.setItem(
              "css-ai-private-editor-return-url",
              returnUrl,
            );
            router.replace("/user/dashboard?login=required");
            return;
          }
          if (!res.ok) {
            throw new Error("Unable to load the saved website");
          }

        const data = (await res.json()) as {
          templateId?: string | null;
          category?: string | null;
          updatedAt?: string;
          config?: {
            templateId?: string;
            category?: string;
            clientUpdatedAt?: number;
            pageLinks?: EditorDraftPageLink[];
            sections?: SectionItem[];
            templateVariables?: Record<string, string>;
            seo?: SiteSeoConfig;
            taxonomies?: Record<string, unknown> | null;
          };
        };

        const nextTemplateId =
          data.config?.templateId || data.templateId || templateId;
        const nextCategory =
          data.config?.category || data.category || category;
        const sections = Array.isArray(data.config?.sections)
          ? data.config.sections
          : [];
        if (!sections.length) {
          throw new Error("This website has no saved editable content");
        }

        hydrateSiteTaxonomiesToLocal(
          siteId,
          normalizeSiteTaxonomies(data.config?.taxonomies),
        );

        const nextPageLinks = Array.isArray(data.config?.pageLinks)
          ? data.config.pageLinks
          : [];
        const nextVariables =
          data.config?.templateVariables &&
          typeof data.config.templateVariables === "object"
            ? data.config.templateVariables
            : {};
        const nextSeo = data.config?.seo;
        const serverPageLinks = resolveSavedPageLinks(nextPageLinks, sections);
        const existingDraft =
          readEditorDraft(templateId, nextCategory, siteId) ||
          readEditorDraft(nextTemplateId, nextCategory, siteId);
        const serverUpdatedAt = Date.parse(data.updatedAt || "");
        const serverClientUpdatedAt = Number(data.config?.clientUpdatedAt);
        // Prefer the newest signal from DB so a stale clientUpdatedAt cannot
        // lose to a newer-but-worse localStorage draft after publish/autosave.
        const serverContentUpdatedAt = Math.max(
          Number.isFinite(serverClientUpdatedAt) ? serverClientUpdatedAt : 0,
          Number.isFinite(serverUpdatedAt) ? serverUpdatedAt : 0,
        );
        const themeSwitchLock =
          consumeThemeSwitchLock(siteId, templateId) ||
          consumeThemeSwitchLock(siteId, nextTemplateId);
        // Existing sites trust the database on refresh. Local draft only wins
        // for an in-flight theme switch, or a genuinely newer unsynced edit.
        const keepNewerLocalDraft = Boolean(
          existingDraft &&
            (themeSwitchLock ||
              (existingDraft.pendingSync === true &&
                existingDraft.updatedAt > serverContentUpdatedAt)),
        );
        const mergedSeo =
          (keepNewerLocalDraft ? existingDraft?.seo : nextSeo) ||
          nextSeo ||
          existingDraft?.seo ||
          undefined;
        const draftSections = keepNewerLocalDraft
          ? (reconcileSectionsWithServer(
              existingDraft!.sections as SectionItem[],
              sections,
            ) as SectionItem[])
          : null;
        const candidateSections = draftSections || sections;
        const candidatePageLinks = resolveSavedPageLinks(
          keepNewerLocalDraft
            ? existingDraft!.pageLinks
            : serverPageLinks,
          candidateSections,
        );
        const candidateVariables = keepNewerLocalDraft
          ? existingDraft!.templateVariables ?? nextVariables
          : nextVariables;
        const normalizedCandidatePageLinks = normalizeEditorPageLinks(
          nextTemplateId,
          candidateSections,
          candidatePageLinks,
          nextCategory,
        );
        const restoredSections = alignTemplatePageSections(
          candidateSections,
          nextTemplateId,
          nextCategory,
          normalizedCandidatePageLinks,
        );
        const restoredPageLinks = normalizeEditorPageLinks(
          nextTemplateId,
          restoredSections,
          normalizedCandidatePageLinks,
          nextCategory,
        );

        const restoredUpdatedAt =
          keepNewerLocalDraft && existingDraft
            ? existingDraft.updatedAt
            : serverContentUpdatedAt > 0
              ? serverContentUpdatedAt
              : Date.now();

        // Only push localâ†’DB when recovering real unsynced edits. Never write
        // schema normalization back â€” that path was wiping logos/banner content
        // with template defaults after refresh.
        if (keepNewerLocalDraft) {
          await migrateGuestSiteToDatabase(
            {
              templateId: nextTemplateId,
              category: nextCategory,
              clientUpdatedAt: restoredUpdatedAt,
              sections: restoredSections,
              pageLinks: restoredPageLinks,
              templateVariables: candidateVariables,
            },
            { siteId },
          );
        }
        saveEditorDraft({
          updatedAt: restoredUpdatedAt,
          pendingSync: false,
          siteId,
          templateId: nextTemplateId,
          category: nextCategory,
          sections: restoredSections,
          pageLinks: restoredPageLinks,
          templateVariables: candidateVariables,
          seo: mergedSeo,
        });

        if (
          !cancelled &&
          (nextTemplateId !== templateId || nextCategory !== category)
        ) {
          const correctedUrl = `/editor?${new URLSearchParams({
            templateId: nextTemplateId,
            category: nextCategory,
            siteId,
          }).toString()}`;
          setLastEditorUrl(correctedUrl);
          setHydratedSite({
            siteId,
            templateId: nextTemplateId,
            category: nextCategory,
            sections: restoredSections,
            pageLinks: restoredPageLinks,
            templateVariables: candidateVariables,
            seo: mergedSeo,
            updatedAt: restoredUpdatedAt,
          });
          canOpenSite = true;
          router.replace(correctedUrl);
          return;
        }

        if (!cancelled) {
          setHydratedSite({
            siteId,
            templateId: nextTemplateId,
            category: nextCategory,
            sections: restoredSections,
            pageLinks: restoredPageLinks,
            templateVariables: candidateVariables,
            seo: mergedSeo,
            updatedAt: restoredUpdatedAt,
          });
          setPageLinks(restoredPageLinks);
          setSiteEpoch((value) => value + 1);
        }
        canOpenSite = true;
        } catch (error) {
          // Only reuse a local draft when it still has unsynced edits. A stale
          // synced cache must not mask a failed DB load with old content.
          const cachedDraft = readEditorDraft(templateId, category, siteId);
          const canUseCachedDraft = cachedDraft?.pendingSync === true;

          if (canUseCachedDraft && cachedDraft) {
            canOpenSite = true;
            if (!cancelled) {
              const cachedSections = cachedDraft.sections as SectionItem[];
              const cachedPageLinks = resolveSavedPageLinks(
                cachedDraft.pageLinks,
                cachedSections,
              );
              const normalizedCachedPageLinks = normalizeEditorPageLinks(
                templateId,
                cachedSections,
                cachedPageLinks,
                category,
              );
              setHydratedSite({
                siteId,
                templateId,
                category,
                sections: cachedSections,
                pageLinks: normalizedCachedPageLinks,
                templateVariables: cachedDraft.templateVariables ?? {},
                seo: cachedDraft.seo,
                updatedAt: cachedDraft.updatedAt,
              });
              setPageLinks(normalizedCachedPageLinks);
              setSiteEpoch((value) => value + 1);
            }
          } else if (!cancelled) {
            setSiteLoadError(
              error instanceof Error
                ? error.message
                : "Unable to load the saved website",
            );
          }
        } finally {
          if (!cancelled) {
            setReadySiteIdentity(canOpenSite ? requestedSiteIdentity : null);
          }
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(prepareTimeout);
    };
  }, [
    siteId,
    templateId,
    category,
    router,
    setPageLinks,
    requestedSiteIdentity,
  ]);

  const initialConfig = useMemo(
    () => (contentReady ? buildSelectedConfig(templateId, category) : null),
    [templateId, category, contentReady],
  );
  const templateVariables = (() => {
    const fromTemplate = initialConfig
      ? getTemplateVariables(initialConfig.templateId)
      : {};
    const fromPrefs = redesignPack?.templateVariables || {};
    return { ...fromTemplate, ...fromPrefs };
  })();

  const templateIdentity = `${templateId}:${category}`;
  const prevTemplateIdentityRef = useRef(templateIdentity);
  const syncingPageFromUrlRef = useRef(false);

  useEffect(() => {
    if (prevTemplateIdentityRef.current === templateIdentity) return;
    prevTemplateIdentityRef.current = templateIdentity;
    const nextPage = searchParams.get("page");
    syncingPageFromUrlRef.current = true;
    setCurrentPage(
      nextPage && nextPage !== "home"
        ? resolveEditorPageLabel(nextPage, pageLinks)
        : "Home",
    );
  }, [pageLinks, searchParams, setCurrentPage, templateIdentity]);

  // Hydrate currentPage from the URL when the URL (or nav labels) change.
  // Do not depend on currentPage here â€” that blocked sidebar page clicks.
  useEffect(() => {
    if (!urlPage || urlPage === "home") return;
    const label = resolveEditorPageLabel(urlPage, pageLinks);
    if (normalizePageSlug(currentPage) === normalizePageSlug(label)) return;
    syncingPageFromUrlRef.current = true;
    setCurrentPage(label);
  }, [pageLinks, setCurrentPage, urlPage]);

  useEffect(() => {
    if (syncingPageFromUrlRef.current) {
      syncingPageFromUrlRef.current = false;
      return;
    }

    const slug = normalizePageSlug(currentPage || "home");
    const urlSlug = urlPage || "home";
    if (slug === urlSlug) return;
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "home") params.delete("page");
    else params.set("page", slug);
    router.replace(`/editor?${params.toString()}`, { scroll: false });
  }, [currentPage, router, searchParams, urlPage]);

  useEffect(() => {
    const scrollContainer = document.querySelector<HTMLElement>(
      "[data-template-scroll]",
    );
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [currentPage]);

  useEffect(() => {
    if (!initialConfig || !siteReady) return;
    const headerSection = initialConfig.sections.find(
      (section) => section.type === "Header",
    );
    const headerData = headerSection?.data?.[headerSection.variant];
    const categoryPageLinks = headerData?.menu;
    const redesignHomeOnly =
      isRedesignOpen && redesignPack?.pageType === "multi-page";
    const redesignSinglePage =
      isRedesignOpen && redesignPack?.pageType !== "multi-page";

    if (siteId && hydratedSite?.pageLinks?.length) {
      setPageLinks(hydratedSite.pageLinks);
      return;
    }

    // Fresh onboarding â†’ seed Pages inventory, then expand to full theme pages.
    // Header nav is stamped separately from ai-builder-page-links (selection only).
    try {
      const flowPath = redesignHomeOnly || redesignSinglePage ? "redesign" : "create-custom";
      activateFlowPreviewStorage(flowPath);
      const fromOnboarding = sessionStorage.getItem(
        "css-ai-onboarding-page-links-ready",
      );
      if (fromOnboarding === "1") {
        const raw = readFlowPageLinksRaw(flowPath);
        const parsed = raw ? (JSON.parse(raw) as unknown) : null;
        if (Array.isArray(parsed) && parsed.length) {
          setPageLinks(
            normalizeEditorPageLinks(
              templateId,
              initialConfig.sections,
              parsed as EditorPageLink[],
              category,
              { redesignHomeOnly, redesignSinglePage },
            ),
          );
          sessionStorage.removeItem("css-ai-onboarding-page-links-ready");
          return;
        }
        sessionStorage.removeItem("css-ai-onboarding-page-links-ready");
      }
    } catch {
      /* fall through */
    }

    // Redesign multi-page without onboarding flag: still prefer stored domain nav placeholders.
    if (redesignHomeOnly) {
      try {
        activateFlowPreviewStorage("redesign");
        const raw = readFlowPageLinksRaw("redesign");
        const parsed = raw ? (JSON.parse(raw) as unknown) : null;
        if (Array.isArray(parsed) && parsed.length) {
          setPageLinks(
            normalizeEditorPageLinks(
              templateId,
              initialConfig.sections,
              parsed as EditorPageLink[],
              category,
              { redesignHomeOnly: true },
            ),
          );
          return;
        }
      } catch {
        /* fall through */
      }
      setPageLinks(
        normalizeEditorPageLinks(
          templateId,
          initialConfig.sections,
          [{ label: "Home", href: "#" }],
          category,
          { redesignHomeOnly: true },
        ),
      );
      return;
    }

    // Redesign single-page: heal domain void/#page leftovers → section scroll anchors.
    if (redesignSinglePage) {
      try {
        activateFlowPreviewStorage("redesign");
        const raw = readFlowPageLinksRaw("redesign");
        const parsed = raw ? (JSON.parse(raw) as unknown) : null;
        const seed =
          Array.isArray(parsed) && parsed.length
            ? (parsed as EditorPageLink[])
            : Array.isArray(categoryPageLinks)
              ? (categoryPageLinks as EditorPageLink[])
              : [{ label: "Home", href: "#" }];
        setPageLinks(
          normalizeEditorPageLinks(
            templateId,
            initialConfig.sections,
            seed,
            category,
            { redesignSinglePage: true },
          ),
        );
        return;
      } catch {
        setPageLinks(
          normalizeEditorPageLinks(
            templateId,
            initialConfig.sections,
            [{ label: "Home", href: "#" }],
            category,
            { redesignSinglePage: true },
          ),
        );
        return;
      }
    }

    const draft = siteId
      ? readEditorDraft(templateId, category, siteId)
      : guestDraft;
    if (draft) {
      const draftSections = draft.sections as SectionItem[];
      const restoredLinks = resolveSavedPageLinks(
        draft.pageLinks,
        draftSections,
      );
      setPageLinks(
        normalizeEditorPageLinks(templateId, draftSections, restoredLinks, category),
      );
      return;
    }

    if (!Array.isArray(categoryPageLinks) || !categoryPageLinks.length) return;

    setPageLinks(
      normalizeEditorPageLinks(
        templateId,
        initialConfig.sections,
        categoryPageLinks,
        category,
      ),
    );
  }, [
    initialConfig,
    setPageLinks,
    templateId,
    category,
    siteId,
    siteReady,
    siteEpoch,
    hydratedSite,
    guestDraft,
    isRedesignOpen,
    redesignPack?.pageType,
  ]);

  const draft = siteId ? null : guestDraft;
  const redesignPrefillSections =
    !siteId && isRedesignOpen
      ? readRedesignEditorSections(designIdParam) || redesignLiveSections
      : null;
  // Prefer designId-scoped draft (user edits) over one-shot seed prefill.
  const restoredSections = siteId
    ? hydratedSite?.sections
    : Array.isArray(draft?.sections) && draft.sections.length
      ? (draft.sections as SectionItem[])
      : redesignPrefillSections && redesignPrefillSections.length
        ? (redesignPrefillSections as SectionItem[])
        : null;

  const restoreFromDraft = Boolean(
    siteId
      ? restoredSections
      : Array.isArray(draft?.sections) && draft.sections.length,
  );
  const useRedesignPrefill = Boolean(
    !restoreFromDraft &&
      redesignPrefillSections &&
      redesignPrefillSections.length,
  );

  const isEditorInteractive = Boolean(
    contentReady &&
      guestDraftReady &&
      initialConfig &&
      siteReady &&
      (!siteId ||
        (hydratedSite?.siteId === siteId &&
          Array.isArray(restoredSections) &&
          restoredSections.length > 0)),
  );

  useEffect(() => {
    if (!isEditorInteractive) return;
    window.dispatchEvent(new CustomEvent("ai-builder-editor-ready"));
  }, [isEditorInteractive, templateId, category, siteId, siteEpoch]);

  useEffect(() => {
    if (siteLoadError && !siteReady) {
      window.dispatchEvent(new CustomEvent("ai-builder-editor-ready"));
    }
  }, [siteLoadError, siteReady]);

  if (siteLoadError && !siteReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-6 text-center">
        <p className="text-sm font-semibold text-red-600">{siteLoadError}</p>
        <p className="max-w-md text-sm text-slate-500">
          Your saved website was not replaced. Please return to the dashboard
          and try opening it again.
        </p>
      </div>
    );
  }

  if (!isEditorInteractive) {
    return null;
  }

  return (
    <EditorPage
      key={`${designIdParam || "no-rd"}-${templateId}-${category}-${siteId || "local"}-${siteEpoch}`}
      initialSections={restoredSections || initialConfig!.sections}
      restoreFromDraft={restoreFromDraft}
      useRedesignPrefill={useRedesignPrefill}
      templateVariables={
        siteId && hydratedSite?.templateVariables
          ? hydratedSite.templateVariables
          : draft?.templateVariables && Object.keys(draft.templateVariables).length
            ? draft.templateVariables
            : templateVariables
      }
      initialSeo={siteId ? hydratedSite?.seo : draft?.seo}
      activeSiteId={siteId}
      category={category}
      page={page}
      templateId={templateId}
      pageLinks={pageLinks}
      cloudSaveArmed={Boolean(!siteId || hydratedSite?.siteId === siteId)}
      isRedesignOpen={isRedesignOpen}
      redesignDesignId={redesignDesignId}
      redesignSectionVariants={redesignSectionVariants}
      redesignPageType={
        redesignPack?.pageType === "multi-page" ? "multi-page" : "single-page"
      }
    />
  );
}

function EditorPage({
  initialSections,
  restoreFromDraft,
  useRedesignPrefill = false,
  templateVariables: initialTemplateVariables,
  initialSeo,
  activeSiteId,
  category,
  page,
  templateId,
  pageLinks,
  cloudSaveArmed = true,
  isRedesignOpen = false,
  redesignDesignId = "",
  redesignSectionVariants = {},
  redesignPageType = "single-page",
}: {
  initialSections: SectionItem[];
  restoreFromDraft: boolean;
  useRedesignPrefill?: boolean;
  templateVariables: Record<string, string>;
  initialSeo?: SiteSeoConfig;
  activeSiteId?: string | null;
  category: string;
  page: string;
  templateId: string;
  pageLinks: EditorPageLink[];
  /** False until a DB site has been hydrated into memory (blocks default wipe). */
  cloudSaveArmed?: boolean;
  isRedesignOpen?: boolean;
  redesignDesignId?: string;
  redesignSectionVariants?: Record<string, string>;
  redesignPageType?: "single-page" | "multi-page";
}) {
  const router = useRouter();
  const {
    themeVariables,
    setThemeVariables,
    setPageLinks,
    setCurrentPage,
    siteSeoConfig,
    setSiteSeoConfig,
  } = usePreview();
  const { user } = useUserAuth();
  /** Redesign persists guest draft under designId so refresh restores the project. */
  const persistDraftSiteId =
    activeSiteId ||
    (isRedesignOpen && redesignDesignId ? redesignDesignId : undefined) ||
    undefined;
  const lastAutosaveFingerprintRef = useRef<string | null>(null);
  const cloudSaveSeqRef = useRef(0);
  const cloudSaveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const urgentAutosaveRef = useRef(false);
  const themeSwitchingRef = useRef(false);
  const siteSeoConfigRef = useRef(siteSeoConfig);
  const setSiteSeoConfigRef = useRef(setSiteSeoConfig);
  useEffect(() => {
    siteSeoConfigRef.current = siteSeoConfig;
  }, [siteSeoConfig]);
  useEffect(() => {
    setSiteSeoConfigRef.current = setSiteSeoConfig;
  }, [setSiteSeoConfig]);

  useEffect(() => {
    setThemeVariables(initialTemplateVariables);
    setSiteSeoConfig(initialSeo || {});
    // Reset the autosave baseline when template/category remounts.
    lastAutosaveFingerprintRef.current = null;
    // Only re-seed when the selected template/category/site epoch changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, category]);

  const templateVariables =
    Object.keys(themeVariables).length > 0
      ? themeVariables
      : initialTemplateVariables;
  const [sections, setSections] = useState<SectionItem[]>(() => {
    const normalizedInitialSections = scopeTemplatePageBodies(
      ensureUniqueSectionIds(initialSections),
      templateId,
      category,
    );

    const forceRedesignStamp =
      isRedesignOpen &&
      (() => {
        try {
          return sessionStorage.getItem("css-ai-redesign-domain-stamp") === "1";
        } catch {
          return false;
        }
      })();
    // Fresh redesign must not restore a stale guest draft (wipes domain stamp).
    const useDraftSections = restoreFromDraft && !forceRedesignStamp;
    // Prefill already = custom-layouts + domain stamp from redesign seed.
    const usePrefill = useRedesignPrefill || forceRedesignStamp;

    const homeOnlySections = (list: SectionItem[]) =>
      list.filter((section) => {
        if (
          section.type === "Header" ||
          section.type === "Footer" ||
          section.type === "Topbar"
        ) {
          return true;
        }
        const pageSlug = String(section.page || "")
          .trim()
          .toLowerCase();
        if (pageSlug && pageSlug !== "home") return false;
        // Drop dedicated multi-page bodies on first redesign open.
        if (/Page$/i.test(section.type) || /Page$/i.test(section.id || "")) {
          return false;
        }
        return true;
      });

    const aligned = useDraftSections
      ? normalizedInitialSections
      : usePrefill
        ? homeOnlySections(ensureUniqueSectionIds(normalizedInitialSections))
        : isRedesignOpen
        ? homeOnlySections(ensureUniqueSectionIds(normalizedInitialSections))
        : alignTemplatePageSections(
          ensureUniqueSectionIds(
    addCustomPageSectionsForLinks(
      addContactPageSection(
        addGalleryPageSection(
                  addEventPageSection(
          addServicePageSection(
                      addAboutPageSection(normalizedInitialSections, category),
              category,
            ),
            category,
          ),
          category,
        ),
        category,
      ),
      category,
      pageLinks,
      templateId,
    ),
          ),
          templateId,
          category,
          pageLinks,
        );

    // Fresh guest open: stamp onboarding logo/contact/nav onto the theme.
    // Restoring a local draft must keep the saved edits â€” overwrite here was
    // wiping Header/Footer changes on every refresh without login.
    let branded = useDraftSections || usePrefill
      ? aligned
      : applyOnboardingBrandToSections(aligned, {
          overwrite: !activeSiteId,
        });

    // Redesign â†’ editor: pick layout variants FIRST, then stamp domain data
    // (variant swap replaces section.data and would wipe logo/content if done after).
    // Prefill path already stamped â€” only re-stamp if flag still set / theme present.
    if (isRedesignOpen && !usePrefill) {
      const variants = redesignSectionVariants || {};
      if (!useDraftSections && Object.keys(variants).length) {
        branded = branded.map((section) => {
          const nextVariant = variants[section.type];
          if (!nextVariant || nextVariant === section.variant) return section;
          try {
            const fresh = createAddableSection(
              section.type,
              category,
              nextVariant,
            );
            if (!fresh) return { ...section, variant: nextVariant };
            return applyThemeVariantToSection(section, {
              variant: nextVariant,
              data: fresh.data as Record<string, Record<string, unknown>>,
            });
          } catch {
            return { ...section, variant: nextVariant };
          }
        });
      }

      const domainTheme = readRedesignEditorTheme(redesignDesignId);
      // Never re-stamp over a restored draft — that wiped user uploads
      // (/uploads/... looked "invalid" vs https domain logos).
      const shouldStamp =
        Boolean(domainTheme) &&
        !useDraftSections &&
        (forceRedesignStamp ||
          (() => {
            const header = branded.find((s) => s.type === "Header");
            const topbar = branded.find((s) => s.type === "Topbar");
            const headerData = header
              ? (header.data?.[header.variant] as
                  | Record<string, unknown>
                  | undefined)
              : undefined;
            const topbarData = topbar
              ? (topbar.data?.[topbar.variant] as
                  | Record<string, unknown>
                  | undefined)
              : undefined;
            const logo =
              typeof headerData?.logoImage === "string"
                ? headerData.logoImage.trim()
                : "";
            const email =
              typeof topbarData?.email === "string"
                ? topbarData.email.trim()
                : "";
            const logoLower = logo.toLowerCase();
            const logoLooksStored =
              /^https?:\/\//i.test(logo) ||
              logo.startsWith("data:") ||
              logo.startsWith("/uploads/");
            return (
              !logo ||
              /hello@example|example\.com/i.test(email) ||
              /elephpant|\/php|php[-_]?logo|placeholder|default[-_]?logo|sample[-_]?logo/i.test(
                logoLower,
              ) ||
              !logoLooksStored
            );
          })());
      if (domainTheme && shouldStamp) {
        branded = applyRedesignDomainToSections(branded, domainTheme);
      }
      try {
        sessionStorage.removeItem("css-ai-redesign-domain-stamp");
      } catch {
        /* ignore */
      }
    } else if (isRedesignOpen && usePrefill) {
      // Prefill may still hold template defaults (PHP logo, hello@example.com).
      try {
        sessionStorage.removeItem("css-ai-redesign-domain-stamp");
      } catch {
        /* ignore */
      }
      const domainTheme = readRedesignEditorTheme(redesignDesignId);
      if (domainTheme) {
        branded = applyRedesignDomainToSections(branded, domainTheme);
      }
    }

    return applyTopbarLayoutSkins(
      ensureMissingPageBreadcrumbs(branded, templateId, category),
    );
  });
  const sectionsRef = useRef(sections);
  const pageLinksRef = useRef(pageLinks);
  const categoryRef = useRef(category);
  const templateVariablesRef = useRef(templateVariables);
  const editorViewPageRef = useRef(page);
  const isSinglePageTemplateRef = useRef(true);
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);
  useEffect(() => {
    pageLinksRef.current = pageLinks;
  }, [pageLinks]);
  useEffect(() => {
    categoryRef.current = category;
  }, [category]);
  useEffect(() => {
    templateVariablesRef.current = templateVariables;
  }, [templateVariables]);
  useEffect(() => {
    editorViewPageRef.current = page;
  }, [page]);
  useEffect(() => {
    ensureThemeGoogleFontsLoaded();
  }, []);
  useEffect(() => {
    setSections((current) =>
      applyTopbarLayoutSkins(
        ensureMissingPageBreadcrumbs(
          syncPageBreadcrumbsToTemplate(
            stripHomeSectionsMissingFromTheme(current, templateId, category),
            templateId,
            category,
          ),
          templateId,
          category,
        ),
      ),
    );
  }, [category, templateId]);
  useEffect(() => {
    if (!Array.isArray(sections) || !sections.length) return;
    const template = getBuilderTemplate(templateId, category);
    const onboarding = isRedesignOpen
      ? readOnboardingDraft("redesign")
      : readOnboardingDraft("create-custom") || readOnboardingDraft("create-ai");
    const hints = extractThemeSeoHints(sections);
    const pageLabels = [
      { label: "Home" },
      ...flattenPageLinks(pageLinks)
        .filter((link) => link.kind !== "blog")
        .map((link) => ({ label: link.label })),
    ];
    const defaults = buildDefaultThemeSeo({
      category,
      templateTitle: template.title,
      templateDescription: template.preview_description,
      brandName:
        onboarding?.businessInfo.name || hints.brandName,
      brandDescription:
        onboarding?.businessInfo.description || hints.bannerDesc,
      bannerTitle: hints.bannerTitle,
      bannerDesc: hints.bannerDesc,
      ogImage: hints.ogImage || template.previewimage || template.image,
      pages: pageLabels,
    });
    const merged = mergeEmptySiteSeo(siteSeoConfig, defaults);
    if (merged !== siteSeoConfig) {
      setSiteSeoConfig(merged);
    }
  }, [
    category,
    pageLinks,
    sections,
    setSiteSeoConfig,
    siteSeoConfig,
    templateId,
    isRedesignOpen,
  ]);
  const [inlineRenderEpochs, setInlineRenderEpochs] = useState<
    Record<string, number>
  >({});
  const historyPastRef = useRef<EditorHistorySnapshot[]>([]);
  const historyFutureRef = useRef<EditorHistorySnapshot[]>([]);
  const historyCurrentRef = useRef<EditorHistorySnapshot>({
    sections: cloneSections(sections),
    pageLinks: structuredClone(pageLinks) as EditorPageLink[],
    templateVariables: structuredClone(templateVariables) as Record<
      string,
      string
    >,
  });
  const suppressHistoryCaptureRef = useRef(false);
  const [historyAvailability, setHistoryAvailability] = useState({
    canUndo: false,
    canRedo: false,
  });
  const [showHistory, setShowHistory] = useState(false);
  const [savedRevisions, setSavedRevisions] = useState<EditorRevision[]>([]);
  const historyDialogRef = useRef<HTMLDivElement | null>(null);

  const [draftReady, setDraftReady] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingSectionInitialTab, setEditingSectionInitialTab] = useState<string | undefined>();
  const [masterDetailView, setMasterDetailView] = useState<{
    master: "service" | "event" | "portfolio" | "team" | "property" | "country";
    slug: string;
  } | null>(null);
  const [masterGroupFilter, setMasterGroupFilter] = useState<{
    master: "blog" | "service" | "event" | "portfolio" | "team" | "property";
    slug: string;
  } | null>(null);
  const [aiApplyBusy, setAiApplyBusy] = useState(false);
  const [aiApplyLabel, setAiApplyLabel] = useState("AI is updatingâ€¦");
  const [savedToastSection, setSavedToastSection] = useState<string | null>(
    null,
  );
  const [inlineUpdateToast, setInlineUpdateToast] = useState<string | null>(
    null,
  );
  const isSinglePageTemplate = isRedesignOpen
    ? redesignPageType !== "multi-page"
    : getBuilderTemplate(templateId, category).type === "Single Page Website";
  useEffect(() => {
    isSinglePageTemplateRef.current = isSinglePageTemplate;
  }, [isSinglePageTemplate]);

  useEffect(() => {
    const openNavigationMenu = () => {
      const header = sectionsRef.current.find((section) => section.type === "Header");
      if (!header) return;
      const headerId = header.id ?? header.type;
      prepareEditorSurfaceForReplace();
      bumpSectionRenderEpoch(headerId);
      setEditingSectionInitialTab("Nav Menu");
      setEditingSection(headerId);
    };
    window.addEventListener("ai-builder-open-navigation-menu", openNavigationMenu);
    return () => window.removeEventListener("ai-builder-open-navigation-menu", openNavigationMenu);
  }, []);

  useEffect(() => {
    const onViewMasterDetail = (event: Event) => {
      const detail = (
        event as CustomEvent<{ master?: string; slug?: string }>
      ).detail;
      const master = detail?.master;
      const slug = typeof detail?.slug === "string" ? detail.slug.trim() : "";
      if (
        !slug ||
        (master !== "service" &&
          master !== "event" &&
          master !== "portfolio" &&
          master !== "team" &&
          master !== "property" &&
          master !== "country")
      ) {
        return;
      }
      setMasterDetailView({ master, slug });
      setMasterGroupFilter(null);
    };
    window.addEventListener("ai-builder-view-master-detail", onViewMasterDetail);
    return () =>
      window.removeEventListener(
        "ai-builder-view-master-detail",
        onViewMasterDetail,
      );
  }, []);

  useEffect(() => {
    const onViewMasterListing = (event: Event) => {
      const detail = (
        event as CustomEvent<{ master?: string; groupSlug?: string }>
      ).detail;
      const master = detail?.master;
      const groupSlug = (detail?.groupSlug || "").trim();
      const pageLabel =
        master === "blog"
          ? "Blogs"
          : master === "service"
            ? "Services"
            : master === "event"
              ? "Events"
              : master === "portfolio"
                ? "Portfolio"
                : master === "team"
                  ? "Teams"
                  : master === "property"
                    ? "Properties"
                    : null;
      if (!pageLabel) return;
      setMasterDetailView(null);
      if (
        groupSlug &&
        (master === "blog" ||
          master === "service" ||
          master === "event" ||
          master === "portfolio" ||
          master === "team" ||
          master === "property")
      ) {
        setMasterGroupFilter({ master, slug: groupSlug });
      } else {
        setMasterGroupFilter(null);
      }
      setCurrentPage(pageLabel);
    };
    window.addEventListener(
      "ai-builder-view-master-listing",
      onViewMasterListing,
    );
    return () =>
      window.removeEventListener(
        "ai-builder-view-master-listing",
        onViewMasterListing,
      );
  }, [setCurrentPage]);

  useEffect(() => {
    setMasterDetailView(null);
    setMasterGroupFilter((current) => {
      if (!current) return null;
      const expected =
        current.master === "blog"
          ? "Blogs"
          : current.master === "service"
            ? "Services"
            : current.master === "event"
              ? "Events"
              : current.master === "portfolio"
                ? "Portfolio"
                : current.master === "team"
                  ? "Teams"
                  : "Properties";
      const pageSlug = createPageSlug(page);
      const expectedSlug = createPageSlug(expected);
      if (
        page === expected ||
        pageSlug === expectedSlug ||
        (current.master === "service" &&
          (pageSlug === "service" || pageSlug === "services"))
      ) {
        return current;
      }
      return null;
    });
  }, [page]);

  useEffect(() => {
    const handleBlogLayoutChanged = () => {
      urgentAutosaveRef.current = true;
    };
    window.addEventListener(
      "ai-builder-blog-layout-changed",
      handleBlogLayoutChanged,
    );
    return () => {
      window.removeEventListener(
        "ai-builder-blog-layout-changed",
        handleBlogLayoutChanged,
      );
    };
  }, []);

  useEffect(() => {
    const findServiceSection = (items: SectionItem[]) =>
      items.find(
        (section) =>
          section.id === "ServicePage" ||
          section.type === "ServicePage" ||
          (section.type === "Service" &&
            ["service", "services"].includes(normalizePageSlug(section.page || ""))),
      );

    const emitServiceState = (items: SectionItem[]) => {
      const section = findServiceSection(items);
      if (!section) return;
      const data =
        (section.data[section.variant] as SectionData | undefined) ??
        (section.data["ServicePage-1"] as SectionData | undefined) ??
        ({} as SectionData);
      window.dispatchEvent(
        new CustomEvent("ai-builder-service-page-state", {
          detail: {
            ...buildServicePageState(data),
            layout: section.variant || "ServicePage-1",
          },
        }),
      );
    };

    const handleEnsureServicePage = () => {
      urgentAutosaveRef.current = true;
      setSections((current) => {
        const next = addServicePageSection(current, category);
        queueMicrotask(() => emitServiceState(next));
        return next;
      });
      setPageLinks((current) => {
        const hasServicesLink = flattenPageLinks(current).some((link) => {
          const href = link.href.trim().toLowerCase();
          const label = link.label.trim().toLowerCase();
          return (
            href === "#page-service" ||
            href === "#page-services" ||
            label === "services" ||
            label === "service"
          );
        });
        if (hasServicesLink) return current;
        return [
          ...current,
          {
            label: "Services",
            href: "#page-service",
            hidden: !getThemeManagerVisibility(templateId, category).services,
          },
        ];
      });
    };

    const handleServicePageQuery = () => {
      const current = sectionsRef.current;
      const section = findServiceSection(current);
      if (!section) return;
      const data =
        (section.data[section.variant] as SectionData | undefined) ??
        (section.data["ServicePage-1"] as SectionData | undefined) ??
        ({} as SectionData);
      const state = buildServicePageState(data);
      const menuPayload = state.services.map((service) => ({
        title: service.title,
        slug:
          service.slug ||
          createPageSlug(service.title) ||
          service.id ||
          "service",
        category: service.category,
      }));
      // If Service dropdown already exists, rebuild managed links from live list
      // using the same mode (category vs name) that is already on the header.
      const submenuMode = detectMasterHeaderSubmenuMode(current, "service");
      const synced =
        menuPayload.length && masterParentHasDropdownInSections(current, "service")
          ? applyMasterHeaderSubmenu(current, "service", menuPayload, {
              mode: submenuMode,
              merge: "new",
            })
          : pruneMasterHeaderSubmenuToItems(current, "service", menuPayload);
      const headerChanged = synced.some(
        (sectionItem, index) => sectionItem !== current[index],
      );
      if (headerChanged) {
        sectionsRef.current = synced;
        setSections(synced);
      }
      emitServiceState(sectionsRef.current);
    };

    const handleServicePageUpdate = (event: Event) => {
      const detail = (event as CustomEvent<ServicePageState>).detail;
      if (!detail) return;
      urgentAutosaveRef.current = true;
      setSections((current) => {
        const withSection = addServicePageSection(current, category);
        const next = withSection.map((section) => {
          if (
            section.id !== "ServicePage" &&
            section.type !== "ServicePage" &&
            !(
              section.type === "Service" &&
              ["service", "services"].includes(normalizePageSlug(section.page || ""))
            )
          ) {
            return section;
          }

          const currentVariant = section.variant || "ServicePage-1";
          const nextVariant = keepThemeLockedVariant(
            currentVariant,
            detail.layout,
          );
          const currentData =
            (section.data[nextVariant] as SectionData | undefined) ??
            (section.data[currentVariant] as SectionData | undefined) ??
            (section.data["ServicePage-1"] as SectionData | undefined) ??
            ({} as SectionData);
          const nextVariantData = applyServicePageStateToData(
            currentData,
            { ...detail, layout: nextVariant },
          );

          return {
            ...section,
            variant: nextVariant,
            data: syncSectionContentAcrossVariants(
              { ...section, variant: nextVariant },
              {
                ...section.data,
                [nextVariant]: nextVariantData,
                "ServicePage-1": nextVariantData,
              },
              nextVariant,
            ),
          };
        });
        return pruneMasterHeaderSubmenuToItems(
          next,
          "service",
          (detail.services || []).map((service) => ({
            title: service.title,
            slug:
              service.slug ||
              createPageSlug(service.title) ||
              service.id ||
              "service",
            category: service.category,
          })),
        );
      });
    };

    window.addEventListener(
      "ai-builder-ensure-service-page",
      handleEnsureServicePage,
    );
    window.addEventListener(
      "ai-builder-service-page-query",
      handleServicePageQuery,
    );
    window.addEventListener(
      "ai-builder-service-page-update",
      handleServicePageUpdate,
    );

    return () => {
      window.removeEventListener(
        "ai-builder-ensure-service-page",
        handleEnsureServicePage,
      );
      window.removeEventListener(
        "ai-builder-service-page-query",
        handleServicePageQuery,
      );
      window.removeEventListener(
        "ai-builder-service-page-update",
        handleServicePageUpdate,
      );
    };
  }, [category, setCurrentPage, setPageLinks]);

  useEffect(() => {
    const findPortfolioSection = (items: SectionItem[]) =>
      items.find(
        (section) =>
          section.id === "PortfolioPage" ||
          section.type === "PortfolioPage" ||
          (section.type === "Portfolio" &&
            normalizePageSlug(section.page || "") === "portfolio"),
      );

    const emitPortfolioState = (items: SectionItem[]) => {
      const section = findPortfolioSection(items);
      if (!section) return;
      const data =
        (section.data[section.variant] as SectionData | undefined) ??
        (section.data["PortfolioPage-1"] as SectionData | undefined) ??
        ({} as SectionData);
      window.dispatchEvent(
        new CustomEvent("ai-builder-portfolio-page-state", {
          detail: {
            ...buildPortfolioPageState(data),
            layout: section.variant || "PortfolioPage-1",
          },
        }),
      );
    };

    const handleEnsurePortfolioPage = (event?: Event) => {
      const detail = (
        event as CustomEvent<{ forceVisible?: boolean; navigate?: boolean }> | undefined
      )?.detail;
      const forceVisible = Boolean(detail?.forceVisible);
      const nav = resolveThemePortfolioNavLink(templateId, category);
      urgentAutosaveRef.current = true;
      setSections((current) => {
        const withPage = addPortfolioPageSection(
          current,
          category,
          templateId,
        );
        const next = ensurePortfolioInHeaderMenu(
          withPage,
          templateId,
          category,
        );
        sectionsRef.current = next;
        queueMicrotask(() => emitPortfolioState(sectionsRef.current));
        return next;
      });
      setPageLinks((current) => {
        let kept = false;
        const next = current.flatMap((link) => {
          if (!isPortfolioPageLink(link)) return [link];
          if (kept) return [];
          kept = true;
          const canonical = canonicalizePortfolioPageLink(
            link,
            templateId,
            category,
          );
          return [
            {
              ...canonical,
              ...(forceVisible ? { hidden: false } : {}),
            },
          ];
        });
        if (kept) return next;
        // Theme ships Projects/Portfolio â†’ default visible on first ensure.
        const themeHasPortfolio = getThemeManagerVisibility(
          templateId,
          category,
        ).portfolio;
        return [
          ...next,
          {
            label: nav.label,
            href: nav.href,
            hidden: forceVisible ? false : !themeHasPortfolio,
          },
        ];
      });
    };

    const handlePortfolioPageQuery = () => {
      emitPortfolioState(sectionsRef.current);
    };

    const handlePortfolioPageUpdate = (event: Event) => {
      const detail = (event as CustomEvent<PortfolioPageState>).detail;
      if (!detail) return;
      urgentAutosaveRef.current = true;
      setSections((current) => {
        const withSection = addPortfolioPageSection(
          current,
          category,
          templateId,
        );
        const next = withSection.map((section) => {
          if (
            section.id !== "PortfolioPage" &&
            section.type !== "PortfolioPage" &&
            !(
              section.type === "Portfolio" &&
              (normalizePageSlug(section.page || "") === "portfolio" ||
                normalizePageSlug(section.page || "") === "projects")
            )
          ) {
            return section;
          }

          const currentVariant = section.variant || "PortfolioPage-1";
          const nextVariant = keepThemeLockedVariant(
            currentVariant,
            detail.layout,
          );
          const currentData =
            (section.data[nextVariant] as SectionData | undefined) ??
            (section.data[currentVariant] as SectionData | undefined) ??
            (section.data["PortfolioPage-1"] as SectionData | undefined) ??
            ({} as SectionData);
          const nextVariantData = applyPortfolioPageStateToData(currentData, {
            ...detail,
            layout: nextVariant,
          });

          return {
            ...section,
            variant: nextVariant,
            data: syncSectionContentAcrossVariants(
              { ...section, variant: nextVariant },
              {
                ...section.data,
                [nextVariant]: nextVariantData,
                "PortfolioPage-1": nextVariantData,
              },
              nextVariant,
            ),
          };
        });
        sectionsRef.current = next;
        return next;
      });
    };

    window.addEventListener(
      "ai-builder-ensure-portfolio-page",
      handleEnsurePortfolioPage,
    );
    window.addEventListener(
      "ai-builder-portfolio-page-query",
      handlePortfolioPageQuery,
    );
    window.addEventListener(
      "ai-builder-portfolio-page-update",
      handlePortfolioPageUpdate,
    );

    return () => {
      window.removeEventListener(
        "ai-builder-ensure-portfolio-page",
        handleEnsurePortfolioPage,
      );
      window.removeEventListener(
        "ai-builder-portfolio-page-query",
        handlePortfolioPageQuery,
      );
      window.removeEventListener(
        "ai-builder-portfolio-page-update",
        handlePortfolioPageUpdate,
      );
    };
  }, [category, templateId, setCurrentPage, setPageLinks]);

  useEffect(() => {
    const findTeamSection = (items: SectionItem[]) =>
      items.find(
        (section) =>
          section.id === "TeamPage" ||
          section.type === "TeamPage" ||
          (section.type === "Team" &&
            normalizePageSlug(section.page || "") === "teams"),
      );

    const emitTeamState = (items: SectionItem[]) => {
      const section = findTeamSection(items);
      if (!section) return;
      const data =
        (section.data[section.variant] as SectionData | undefined) ??
        (section.data["TeamPage-1"] as SectionData | undefined) ??
        ({} as SectionData);
      window.dispatchEvent(
        new CustomEvent("ai-builder-team-page-state", {
          detail: {
            ...buildTeamPageState(data),
            layout: section.variant || "TeamPage-1",
          },
        }),
      );
    };

    const handleEnsureTeamPage = () => {
      urgentAutosaveRef.current = true;
      setSections((current) => {
        const next = addTeamPageSection(current, category);
        sectionsRef.current = next;
        queueMicrotask(() => emitTeamState(sectionsRef.current));
        return next;
      });
      setPageLinks((current) => {
        let kept = false;
        const next = current.flatMap((link) => {
          if (!isTeamPageLink(link)) return [link];
          if (kept) return [];
          kept = true;
          return [canonicalizeTeamPageLink(link)];
        });
        if (kept) return next;
        return [
          ...next,
          {
            label: "Teams",
            href: "#page-teams",
            hidden: !getThemeManagerVisibility(templateId, category).teams,
          },
        ];
      });
    };

    const handleTeamPageQuery = () => {
      emitTeamState(sectionsRef.current);
    };

    const handleTeamPageUpdate = (event: Event) => {
      const detail = (event as CustomEvent<TeamPageState>).detail;
      if (!detail) return;
      urgentAutosaveRef.current = true;
      setSections((current) => {
        const withSection = addTeamPageSection(current, category);
        const next = withSection.map((section) => {
          if (
            section.id !== "TeamPage" &&
            section.type !== "TeamPage" &&
            !(
              section.type === "Team" &&
              normalizePageSlug(section.page || "") === "teams"
            )
          ) {
            return section;
          }

          const currentVariant = section.variant || "TeamPage-1";
          const nextVariant = keepThemeLockedVariant(
            currentVariant,
            detail.layout,
          );
          const currentData =
            (section.data[nextVariant] as SectionData | undefined) ??
            (section.data[currentVariant] as SectionData | undefined) ??
            (section.data["TeamPage-1"] as SectionData | undefined) ??
            ({} as SectionData);
          const nextVariantData = applyTeamPageStateToData(currentData, {
            ...detail,
            layout: nextVariant,
          });

          return {
            ...section,
            variant: nextVariant,
            data: syncSectionContentAcrossVariants(
              { ...section, variant: nextVariant },
              {
                ...section.data,
                [nextVariant]: nextVariantData,
                "TeamPage-1": nextVariantData,
              },
              nextVariant,
            ),
          };
        });
        sectionsRef.current = next;
        return next;
      });
    };

    window.addEventListener(
      "ai-builder-ensure-team-page",
      handleEnsureTeamPage,
    );
    window.addEventListener(
      "ai-builder-team-page-query",
      handleTeamPageQuery,
    );
    window.addEventListener(
      "ai-builder-team-page-update",
      handleTeamPageUpdate,
    );

    return () => {
      window.removeEventListener(
        "ai-builder-ensure-team-page",
        handleEnsureTeamPage,
      );
      window.removeEventListener(
        "ai-builder-team-page-query",
        handleTeamPageQuery,
      );
      window.removeEventListener(
        "ai-builder-team-page-update",
        handleTeamPageUpdate,
      );
    };
  }, [category, setCurrentPage, setPageLinks]);

  useEffect(() => {
    const findGallerySection = (items: SectionItem[]) =>
      items.find(
        (section) =>
          section.id === "GalleryPage" ||
          section.type === "GalleryPage" ||
          (section.type === "Gallery" &&
            normalizePageSlug(section.page || "") === "gallery"),
      );

    const emitGalleryState = (items: SectionItem[]) => {
      const section = findGallerySection(items);
      if (!section) return;
      const data =
        (section.data[section.variant] as SectionData | undefined) ??
        (section.data["GalleryPage-1"] as SectionData | undefined) ??
        ({} as SectionData);
      window.dispatchEvent(
        new CustomEvent("ai-builder-gallery-page-state", {
          detail: {
            ...buildGalleryPageState(data),
            layout: section.variant || "GalleryPage-1",
          },
        }),
      );
    };

    const handleEnsureGalleryPage = () => {
      urgentAutosaveRef.current = true;
      setSections((current) => {
        const next = addGalleryPageSection(current, category);
        sectionsRef.current = next;
        queueMicrotask(() => emitGalleryState(sectionsRef.current));
        return next;
      });
      setPageLinks((current) => {
        let kept = false;
        const next = current.flatMap((link) => {
          if (!isGalleryPageLink(link)) return [link];
          if (kept) return [];
          kept = true;
          return [canonicalizeGalleryPageLink(link)];
        });
        if (kept) return next;
        return [
          ...next,
          {
            label: "Gallery",
            href: "#page-gallery",
            hidden: !getThemeManagerVisibility(templateId, category).gallery,
          },
        ];
      });
    };

    const handleGalleryPageQuery = () => {
      emitGalleryState(sectionsRef.current);
    };

    const handleGalleryPageUpdate = (event: Event) => {
      const detail = (event as CustomEvent<GalleryPageState>).detail;
      if (!detail) return;
      urgentAutosaveRef.current = true;
      setSections((current) => {
        const withSection = addGalleryPageSection(current, category);
        const next = withSection.map((section) => {
          if (
            section.id !== "GalleryPage" &&
            section.type !== "GalleryPage" &&
            !(
              section.type === "Gallery" &&
              normalizePageSlug(section.page || "") === "gallery"
            )
          ) {
            return section;
          }

          const currentVariant = section.variant || "GalleryPage-1";
          const nextVariant =
            detail.layout && /^GalleryPage-[1-5]$/.test(detail.layout)
              ? detail.layout
              : currentVariant;
          const currentData =
            (section.data[nextVariant] as SectionData | undefined) ??
            (section.data[currentVariant] as SectionData | undefined) ??
            (section.data["GalleryPage-1"] as SectionData | undefined) ??
            ({} as SectionData);
          const nextVariantData = applyGalleryPageStateToData(currentData, {
            ...detail,
            layout: nextVariant,
          });

          return {
            ...section,
            variant: nextVariant,
            data: syncSectionContentAcrossVariants(
              { ...section, variant: nextVariant },
              {
                ...section.data,
                [nextVariant]: nextVariantData,
                "GalleryPage-1": nextVariantData,
              },
              nextVariant,
            ),
          };
        });
        sectionsRef.current = next;
        return next;
      });
    };

    window.addEventListener(
      "ai-builder-ensure-gallery-page",
      handleEnsureGalleryPage,
    );
    window.addEventListener(
      "ai-builder-gallery-page-query",
      handleGalleryPageQuery,
    );
    window.addEventListener(
      "ai-builder-gallery-page-update",
      handleGalleryPageUpdate,
    );

    return () => {
      window.removeEventListener(
        "ai-builder-ensure-gallery-page",
        handleEnsureGalleryPage,
      );
      window.removeEventListener(
        "ai-builder-gallery-page-query",
        handleGalleryPageQuery,
      );
      window.removeEventListener(
        "ai-builder-gallery-page-update",
        handleGalleryPageUpdate,
      );
    };
  }, [category, setCurrentPage, setPageLinks]);

  useEffect(() => {
    const findCountriesServeSection = (items: SectionItem[]) =>
      items.find((section) => section.type === "CountriesServe");

    const emitCountriesServeState = (items: SectionItem[]) => {
      const section = findCountriesServeSection(items);
      if (!section) return;
      const data =
        (section.data[section.variant] as SectionData | undefined) ??
        (section.data["CountriesServe-1"] as SectionData | undefined) ??
        ({} as SectionData);
      const state = buildCountriesServeState(data);
      window.dispatchEvent(
        new CustomEvent("ai-builder-countries-serve-state", {
          detail: state,
        }),
      );

      const rawCountries = Array.isArray(data.countriesServeItems)
        ? data.countriesServeItems
        : [];
      const needsFlagPersist = rawCountries.some((item) => {
        if (!item || typeof item !== "object") return false;
        const row = item as { name?: string; flagImage?: string };
        const name = typeof row.name === "string" ? row.name.trim() : "";
        const flag =
          typeof row.flagImage === "string" ? row.flagImage.trim() : "";
        return Boolean(name && !flag && resolveCountryFlagImage(name));
      });
      if (!needsFlagPersist) return;

      urgentAutosaveRef.current = true;
      setSections((current) => {
        const next = current.map((item) => {
          if (item.type !== "CountriesServe") return item;
          const variant = item.variant || "CountriesServe-1";
          const currentData =
            (item.data[variant] as SectionData | undefined) ??
            (item.data["CountriesServe-1"] as SectionData | undefined) ??
            ({} as SectionData);
          const nextVariantData = applyCountriesServeStateToData(
            currentData,
            state,
          );
          return {
            ...item,
            variant,
            data: syncSectionContentAcrossVariants(
              { ...item, variant },
              {
                ...item.data,
                [variant]: nextVariantData,
                "CountriesServe-1": nextVariantData,
              },
              variant,
            ),
          };
        });
        sectionsRef.current = next;
        return next;
      });
    };

    const handleEnsureCountriesServe = () => {
      urgentAutosaveRef.current = true;
      setSections((current) => {
        const next = addCountriesServeSection(current, category);
        sectionsRef.current = next;
        queueMicrotask(() => emitCountriesServeState(sectionsRef.current));
        return next;
      });
    };

    const handleCountriesServeQuery = () => {
      emitCountriesServeState(sectionsRef.current);
    };

    const handleCountriesServeUpdate = (event: Event) => {
      const detail = (event as CustomEvent<CountriesServeState>).detail;
      if (!detail) return;
      urgentAutosaveRef.current = true;
      setSections((current) => {
        const withSection = addCountriesServeSection(current, category);
        const next = withSection.map((section) => {
          if (section.type !== "CountriesServe") return section;
          const variant = section.variant || "CountriesServe-1";
          const currentData =
            (section.data[variant] as SectionData | undefined) ??
            (section.data["CountriesServe-1"] as SectionData | undefined) ??
            ({} as SectionData);
          const nextVariantData = applyCountriesServeStateToData(
            currentData,
            detail,
          );
          return {
            ...section,
            variant,
            data: syncSectionContentAcrossVariants(
              { ...section, variant },
              {
                ...section.data,
                [variant]: nextVariantData,
                "CountriesServe-1": nextVariantData,
              },
              variant,
            ),
          };
        });
        sectionsRef.current = next;
        return next;
      });
    };

    window.addEventListener(
      "ai-builder-ensure-countries-serve",
      handleEnsureCountriesServe,
    );
    window.addEventListener(
      "ai-builder-countries-serve-query",
      handleCountriesServeQuery,
    );
    window.addEventListener(
      "ai-builder-countries-serve-update",
      handleCountriesServeUpdate,
    );

    return () => {
      window.removeEventListener(
        "ai-builder-ensure-countries-serve",
        handleEnsureCountriesServe,
      );
      window.removeEventListener(
        "ai-builder-countries-serve-query",
        handleCountriesServeQuery,
      );
      window.removeEventListener(
        "ai-builder-countries-serve-update",
        handleCountriesServeUpdate,
      );
    };
  }, [category]);

  useEffect(() => {
    const findEventSection = (items: SectionItem[]) =>
      items.find(
        (section) =>
          section.id === "EventPage" ||
          section.type === "EventPage" ||
          (section.type === "Event" &&
            normalizePageSlug(section.page || "") === "events"),
      );

    const emitEventState = (items: SectionItem[]) => {
      const section = findEventSection(items);
      if (!section) return;
      const data =
        (section.data[section.variant] as SectionData | undefined) ??
        (section.data["EventPage-1"] as SectionData | undefined) ??
        ({} as SectionData);
      window.dispatchEvent(
        new CustomEvent("ai-builder-event-page-state", {
          detail: {
            ...buildEventPageState(data),
            layout: section.variant || "EventPage-1",
          },
        }),
      );
    };

    const handleEnsureEventPage = () => {
      urgentAutosaveRef.current = true;
      setSections((current) => {
        const next = addEventPageSection(current, category);
        sectionsRef.current = next;
        queueMicrotask(() => emitEventState(sectionsRef.current));
        return next;
      });
      setPageLinks((current) => {
        let keptEvents = false;
        const next = current.flatMap((link) => {
          if (!isEventsPageLink(link)) return [link];
          if (keptEvents) return [];
          keptEvents = true;
          return [canonicalizeEventsPageLink(link)];
        });
        if (keptEvents) return next;
        return [
          ...next,
          {
            label: "Events",
            href: "#page-events",
            hidden: !getThemeManagerVisibility(templateId, category).events,
          },
        ];
      });
    };

    const handleEventPageQuery = () => {
      emitEventState(sectionsRef.current);
    };

    const handleEventPageUpdate = (event: Event) => {
      const detail = (event as CustomEvent<EventPageState>).detail;
      if (!detail) return;
      urgentAutosaveRef.current = true;
      setSections((current) => {
        const withSection = addEventPageSection(current, category);
        const next = withSection.map((section) => {
          if (
            section.id !== "EventPage" &&
            section.type !== "EventPage" &&
            !(
              section.type === "Event" &&
              normalizePageSlug(section.page || "") === "events"
            )
          ) {
            return section;
          }

          const currentVariant = section.variant || "EventPage-1";
          const nextVariant = keepThemeLockedVariant(
            currentVariant,
            detail.layout,
          );
          const currentData =
            (section.data[nextVariant] as SectionData | undefined) ??
            (section.data[currentVariant] as SectionData | undefined) ??
            (section.data["EventPage-1"] as SectionData | undefined) ??
            ({} as SectionData);
          const nextVariantData = applyEventPageStateToData(currentData, {
            ...detail,
            layout: nextVariant,
          });

          return {
            ...section,
            variant: nextVariant,
            data: syncSectionContentAcrossVariants(
              { ...section, variant: nextVariant },
              {
                ...section.data,
                [nextVariant]: nextVariantData,
                "EventPage-1": nextVariantData,
              },
              nextVariant,
            ),
          };
        });
        sectionsRef.current = next;
        queueMicrotask(() => emitEventState(sectionsRef.current));
        return next;
      });
    };

    window.addEventListener(
      "ai-builder-ensure-event-page",
      handleEnsureEventPage,
    );
    window.addEventListener(
      "ai-builder-event-page-query",
      handleEventPageQuery,
    );
    window.addEventListener(
      "ai-builder-event-page-update",
      handleEventPageUpdate,
    );

    return () => {
      window.removeEventListener(
        "ai-builder-ensure-event-page",
        handleEnsureEventPage,
      );
      window.removeEventListener(
        "ai-builder-event-page-query",
        handleEventPageQuery,
      );
      window.removeEventListener(
        "ai-builder-event-page-update",
        handleEventPageUpdate,
      );
    };
  }, [category, setCurrentPage, setPageLinks]);

  useEffect(() => {
    const findPropertySection = (items: SectionItem[]) =>
      items.find(
        (section) =>
          section.id === "PropertyPage" ||
          section.type === "PropertyPage" ||
          (section.type === "Property" &&
            normalizePageSlug(section.page || "") === "properties"),
      );

    const emitPropertyState = (items: SectionItem[]) => {
      const section = findPropertySection(items);
      if (!section) return;
      const data =
        (section.data[section.variant] as SectionData | undefined) ??
        (section.data["PropertyPage-1"] as SectionData | undefined) ??
        ({} as SectionData);
      window.dispatchEvent(
        new CustomEvent("ai-builder-property-page-state", {
          detail: {
            ...buildPropertyPageState(data),
            layout: section.variant || "PropertyPage-1",
          },
        }),
      );
    };

    const handleEnsurePropertyPage = () => {
      urgentAutosaveRef.current = true;
      setSections((current) => {
        const next = addPropertyPageSection(current, category);
        sectionsRef.current = next;
        queueMicrotask(() => emitPropertyState(sectionsRef.current));
        return next;
      });
      setPageLinks((current) => {
        let kept = false;
        const next = current.flatMap((link) => {
          if (!isPropertiesPageLink(link)) return [link];
          if (kept) return [];
          kept = true;
          return [canonicalizePropertiesPageLink(link)];
        });
        if (kept) return next;
        return [
          ...next,
          {
            label: "Properties",
            href: "#page-properties",
            hidden: !getThemeManagerVisibility(templateId, category).properties,
          },
        ];
      });
    };

    const handlePropertyPageQuery = () => {
      emitPropertyState(sectionsRef.current);
    };

    const handlePropertyPageUpdate = (event: Event) => {
      const detail = (event as CustomEvent<PropertyPageState>).detail;
      if (!detail) return;
      urgentAutosaveRef.current = true;
      setSections((current) => {
        const withSection = addPropertyPageSection(current, category);
        const next = withSection.map((section) => {
          if (
            section.id !== "PropertyPage" &&
            section.type !== "PropertyPage" &&
            !(
              section.type === "Property" &&
              normalizePageSlug(section.page || "") === "properties"
            )
          ) {
            return section;
          }

          const currentVariant = section.variant || "PropertyPage-1";
          const nextVariant = keepThemeLockedVariant(
            currentVariant,
            detail.layout,
          );
          const currentData =
            (section.data[nextVariant] as SectionData | undefined) ??
            (section.data[currentVariant] as SectionData | undefined) ??
            (section.data["PropertyPage-1"] as SectionData | undefined) ??
            ({} as SectionData);
          const nextVariantData = applyPropertyPageStateToData(currentData, {
            ...detail,
            layout: nextVariant,
          });

          return {
            ...section,
            variant: nextVariant,
            data: syncSectionContentAcrossVariants(
              { ...section, variant: nextVariant },
              {
                ...section.data,
                [nextVariant]: nextVariantData,
                "PropertyPage-1": nextVariantData,
              },
              nextVariant,
            ),
          };
        });
        sectionsRef.current = next;
        return next;
      });
    };

    window.addEventListener(
      "ai-builder-ensure-property-page",
      handleEnsurePropertyPage,
    );
    window.addEventListener(
      "ai-builder-property-page-query",
      handlePropertyPageQuery,
    );
    window.addEventListener(
      "ai-builder-property-page-update",
      handlePropertyPageUpdate,
    );

    return () => {
      window.removeEventListener(
        "ai-builder-ensure-property-page",
        handleEnsurePropertyPage,
      );
      window.removeEventListener(
        "ai-builder-property-page-query",
        handlePropertyPageQuery,
      );
      window.removeEventListener(
        "ai-builder-property-page-update",
        handlePropertyPageUpdate,
      );
    };
  }, [category, setCurrentPage, setPageLinks]);

  useEffect(() => {
    // Let restored sections, menu and theme variables settle before taking the
    // autosave baseline. This prevents initialization state from overwriting
    // the saved project during refresh or a theme remount.
    if (
      !areMenusEqual(
        pageLinks,
        normalizeEditorPageLinks(templateId, sections, pageLinks, category, {
          redesignHomeOnly: isRedesignOpen && redesignPageType === "multi-page",
          redesignSinglePage:
            isRedesignOpen && redesignPageType !== "multi-page",
        }),
      )
    ) {
      // Safety: never block autosave forever if menus keep healing.
      const fallback = window.setTimeout(() => setDraftReady(true), 2500);
      return () => window.clearTimeout(fallback);
    }

    const timeout = window.setTimeout(() => setDraftReady(true), 400);
    return () => window.clearTimeout(timeout);
  }, [pageLinks, sections, templateId, category, isRedesignOpen, redesignPageType]);

  useEffect(() => {
    const nextPageLinks = normalizeEditorPageLinks(
      templateId,
      sections,
      pageLinks,
      category,
      {
        redesignHomeOnly: isRedesignOpen && redesignPageType === "multi-page",
        redesignSinglePage:
          isRedesignOpen && redesignPageType !== "multi-page",
      },
    );
    if (!areMenusEqual(pageLinks, nextPageLinks)) {
      setPageLinks(nextPageLinks);
    }
  }, [
    draftReady,
    pageLinks,
    sections,
    setPageLinks,
    templateId,
    category,
    isRedesignOpen,
    redesignPageType,
  ]);

  // Manager pages (Blogs/Services/Portfolio/â€¦) are removed from Header only via
  // explicit `ai-builder-page-removed`. Auto-stripping here raced Nav Menu edits
  // and made items "gayab" right after add/type/drag.
  // Show on website uses pageLinks.hidden + live/published menu filters instead.

  useEffect(() => {
    if (!savedToastSection) return;

    const timeout = window.setTimeout(() => {
      setSavedToastSection(null);
    }, 2400);

    return () => window.clearTimeout(timeout);
  }, [savedToastSection]);

  useEffect(() => {
    if (!inlineUpdateToast) return;

    const timeout = window.setTimeout(() => {
      setInlineUpdateToast(null);
    }, 2400);

    return () => window.clearTimeout(timeout);
  }, [inlineUpdateToast]);

  useEffect(() => {
    const previous = historyCurrentRef.current;
    const next: EditorHistorySnapshot = {
      sections: cloneSections(sections),
      pageLinks: structuredClone(pageLinks) as EditorPageLink[],
      templateVariables: structuredClone(templateVariables) as Record<
        string,
        string
      >,
    };
    if (!draftReady) {
      historyPastRef.current = [];
      historyFutureRef.current = [];
      historyCurrentRef.current = cloneHistorySnapshot(next);
      return;
    }
    if (JSON.stringify(previous) === JSON.stringify(next)) return;

    if (suppressHistoryCaptureRef.current) {
      suppressHistoryCaptureRef.current = false;
      historyCurrentRef.current = cloneHistorySnapshot(next);
      setHistoryAvailability({
        canUndo: historyPastRef.current.length > 0,
        canRedo: historyFutureRef.current.length > 0,
      });
      return;
    }

    historyPastRef.current = [
      ...historyPastRef.current.slice(-49),
      cloneHistorySnapshot(previous),
    ];
    historyFutureRef.current = [];
    historyCurrentRef.current = cloneHistorySnapshot(next);
    setHistoryAvailability({ canUndo: true, canRedo: false });
  }, [draftReady, pageLinks, sections, templateVariables]);

  const undoEditorChange = () => {
    const previous = historyPastRef.current.at(-1);
    if (!previous) return;

    historyPastRef.current = historyPastRef.current.slice(0, -1);
    historyFutureRef.current = [
      cloneHistorySnapshot(historyCurrentRef.current),
      ...historyFutureRef.current.slice(0, 49),
    ];
    suppressHistoryCaptureRef.current = true;
    setSections(cloneSections(previous.sections));
    setPageLinks(structuredClone(previous.pageLinks) as EditorPageLink[]);
    setThemeVariables({ ...previous.templateVariables });
    setHistoryAvailability({
      canUndo: historyPastRef.current.length > 0,
      canRedo: true,
    });
  };

  const redoEditorChange = () => {
    const next = historyFutureRef.current[0];
    if (!next) return;

    historyFutureRef.current = historyFutureRef.current.slice(1);
    historyPastRef.current = [
      ...historyPastRef.current.slice(-49),
      cloneHistorySnapshot(historyCurrentRef.current),
    ];
    suppressHistoryCaptureRef.current = true;
    setSections(cloneSections(next.sections));
    setPageLinks(structuredClone(next.pageLinks) as EditorPageLink[]);
    setThemeVariables({ ...next.templateVariables });
    setHistoryAvailability({
      canUndo: true,
      canRedo: historyFutureRef.current.length > 0,
    });
  };

  const openRevisionHistory = () => {
    setSavedRevisions(
      readEditorRevisions(templateId, category, activeSiteId),
    );
    setShowHistory(true);
  };

  const restoreRevision = (revision: EditorRevision) => {
    const revisionSections = ensureUniqueSectionIds(
      revision.sections as SectionItem[],
    );

    historyPastRef.current = [
      ...historyPastRef.current.slice(-49),
      cloneHistorySnapshot(historyCurrentRef.current),
    ];
    historyFutureRef.current = [];
    suppressHistoryCaptureRef.current = true;
    setSections(revisionSections);
    setPageLinks(revision.pageLinks as EditorPageLink[]);
    setThemeVariables(revision.templateVariables);
    setShowHistory(false);
    setInlineUpdateToast("Previous version restored");
    setHistoryAvailability({ canUndo: true, canRedo: false });
  };

  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
      ) {
        return;
      }

      if (event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undoEditorChange();
      }

      if (
        event.key.toLowerCase() === "y" ||
        (event.key.toLowerCase() === "z" && event.shiftKey)
      ) {
        event.preventDefault();
        redoEditorChange();
      }
    };

    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  });

  useEffect(() => {
    if (!showHistory) return;

    const dialog = historyDialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const getFocusable = () =>
      dialog
        ? Array.from(
            dialog.querySelectorAll<HTMLElement>(
              'button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];
    const focusFrame = window.requestAnimationFrame(() => {
      getFocusable()[0]?.focus();
    });
    const handleHistoryKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowHistory(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1) ?? first;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleHistoryKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleHistoryKeyDown);
      previouslyFocused?.focus();
    };
  }, [showHistory]);

  useEffect(() => {
    // Redesign single-page: never scaffold inner pages from nav labels.
    // Redesign multipage: scaffold once links have real #page-* hrefs.
    if (isRedesignOpen && redesignPageType !== "multi-page") return;

    const timeout = window.setTimeout(() => {
      setSections((prevSections) => {
        const scaffolded = addCustomPageSectionsForLinks(
          prevSections,
          category,
          pageLinks,
          templateId,
        );
        if (scaffolded === prevSections) return prevSections;
        // Do not re-apply domain stamp here — it overwrote user uploads on refresh.
        return ensureUniqueSectionIds(scaffolded);
      });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [
    category,
    pageLinks,
    templateId,
    isRedesignOpen,
    redesignPageType,
  ]);

  // Heal Pages inventory: custom pages (e.g. "ram") can lose their pageLinks
  // entry after Nav Menu sync while sections still exist.
  useEffect(() => {
    // Redesign home-first: recover must not re-inject template #page-* links
    // after normalize caps the domain placeholder menu (infinite hang).
    if (isRedesignOpen && redesignPageType !== "multi-page") return;

    setPageLinks((current) => {
      const next = recoverCustomPageLinksFromSections(
        current,
        sections,
        templateId,
        category,
      );
      return next.length === current.length ? current : next;
    });
  }, [
    sections,
    templateId,
    category,
    setPageLinks,
    isRedesignOpen,
    redesignPageType,
  ]);

  useEffect(() => {
    const savedBlogLinks = flattenPageLinks(pageLinks).filter(
      (link) => link.kind === "blog",
    );
    if (!savedBlogLinks.length) return;

    setSections((prevSections) => {
      let nextSections = prevSections;
      let changed = false;

      savedBlogLinks.forEach((link) => {
        const pageSlug = getMultiPageSlugFromHref(link.href);
        if (
          !pageSlug ||
          nextSections.some(
            (section) =>
              section.type === "BlogPage" &&
              normalizePageSlug(section.page || "") === pageSlug,
          )
        ) {
          return;
        }

        const blogSection = createBlogPageSection(link);
        if (!blogSection) return;
        const footerIndex = nextSections.findIndex(
          (section) => section.type === "Footer",
        );
        nextSections =
          footerIndex === -1
            ? [...nextSections, blogSection]
            : [
                ...nextSections.slice(0, footerIndex),
                blogSection,
                ...nextSections.slice(footerIndex),
              ];
        changed = true;
      });

      if (!changed) return prevSections;
      urgentAutosaveRef.current = true;
      return ensureUniqueSectionIds(nextSections);
    });
  }, [pageLinks]);

  useEffect(() => {
    const handlePageAdded = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          label?: string;
          href?: string;
          kind?: "page" | "blogIndex" | "blog" | "document";
          layout?: string;
          author?: string;
          image?: string;
        }>
      ).detail;
      const label = detail?.label?.trim();

      if (isSinglePageTemplate && detail?.kind !== "blog" && detail?.kind !== "document") return;

      const pageSlug = getMultiPageSlugFromHref(detail?.href || "");
      if (!label || !pageSlug) return;

      const normalizedSlug = normalizePageSlug(pageSlug);
      if (
        detail?.kind !== "blog" &&
        detail?.kind !== "document" &&
        (normalizedSlug === "services" ||
          normalizedSlug === "events" ||
          normalizedSlug === "properties" ||
          normalizedSlug === "portfolio" ||
          normalizedSlug === "teams" ||
          normalizedSlug === "blogs" ||
          normalizedSlug === "blog")
      ) {
        return;
      }

      urgentAutosaveRef.current = true;
      setSections((prevSections) => {
        const slug = normalizePageSlug(pageSlug);

        // Blog posts: body only (no page breadcrumb strip).
        if (detail.kind === "blog") {
          const hasBody = prevSections.some(
            (section) =>
              section.type === "BlogPage" &&
              normalizePageSlug(section.page || "") === slug,
          );
          if (hasBody) return prevSections;
          const blogSection = createBlogPageSection({
            label,
            href: detail.href || `#page-${pageSlug}`,
            layout: detail.layout,
            author: detail.author,
            image: detail.image,
          });
          if (!blogSection) return prevSections;
        const footerIndex = prevSections.findIndex(
          (section) => section.type === "Footer",
        );
          return ensureUniqueSectionIds(
            footerIndex === -1
              ? [...prevSections, blogSection]
              : [
          ...prevSections.slice(0, footerIndex),
                  blogSection,
          ...prevSections.slice(footerIndex),
                ],
          );
        }

        const next = ensureCustomPageScaffold(
          prevSections,
          category,
          label,
          templateId,
        );
        if (next !== prevSections) {
          sectionsRef.current = next;
        }
        return next;
      });
    };

    const handlePageRemoved = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          label?: string;
          href?: string;
          kind?: "page" | "blogIndex" | "blog" | "document";
        }>
      ).detail;
      if (!detail) return;

      const removingBlogIndex = isBlogIndexPageLink(detail);
      const pageSlug =
        getMultiPageSlugFromHref(detail.href || "") ||
        createPageSlug(detail.label || "");

      // Blog manager delete: drop that post's BlogPage section only.
      if (detail.kind === "blog") {
        if (!pageSlug) return;
        urgentAutosaveRef.current = true;
        setSections((prevSections) =>
          prevSections.filter(
            (section) =>
              !(
                section.type === "BlogPage" &&
                normalizePageSlug(section.page || "") ===
                  normalizePageSlug(pageSlug)
              ),
          ),
        );
        return;
      }

      if (
        isSinglePageTemplate &&
        detail.kind !== "document" &&
        !removingBlogIndex
      ) {
        return;
      }

      if (!removingBlogIndex && (!pageSlug || pageSlug === "home")) return;

      urgentAutosaveRef.current = true;
      setSections((prevSections) => {
        const withoutMenus = stripRemovedPageFromSectionMenus(
          prevSections,
          detail,
        );
        let next: SectionItem[];
        if (removingBlogIndex) {
          // Drop blogs index chrome only â€” keep BlogPage post sections.
          next = withoutMenus.filter((section) => {
            if (section.type === "BlogPage") return true;
            const slug = normalizePageSlug(section.page || "");
            return slug !== "blogs" && slug !== "blog";
          });
        } else {
          next = withoutMenus.filter(
            (section) =>
              normalizePageSlug(section.page || "") !==
              normalizePageSlug(pageSlug),
          );
        }
        sectionsRef.current = next;
        return next;
      });
    };

    const handlePageRenamed = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          oldLabel?: string;
          newLabel?: string;
          oldHref?: string;
          newHref?: string;
          kind?: "page" | "blogIndex" | "blog" | "document";
        }>
      ).detail;
      if (
        isSinglePageTemplate &&
        detail?.kind !== "blog" &&
        detail?.kind !== "document"
      ) {
        return;
      }

      const oldLabel = detail?.oldLabel?.trim() || "";
      const newLabel = detail?.newLabel?.trim() || "";
      const oldHref = detail?.oldHref?.trim() || "";
      const newHref = detail?.newHref?.trim() || "";
      if (!oldLabel || !newLabel || !oldHref || !newHref) return;
      if (oldLabel === newLabel && oldHref === newHref) return;

      urgentAutosaveRef.current = true;
      setSections((prevSections) =>
        renamePageSections(
          prevSections,
          oldLabel,
          newLabel,
          oldHref,
          newHref,
        ),
      );
    };

    window.addEventListener("ai-builder-page-added", handlePageAdded);
    window.addEventListener("ai-builder-page-removed", handlePageRemoved);
    window.addEventListener("ai-builder-page-renamed", handlePageRenamed);
    const handleBlogsWebsiteVisibility = (event: Event) => {
      const enabled = Boolean(
        (event as CustomEvent<{ enabled?: boolean }>).detail?.enabled,
      );
      // Keep in Nav Menu when hidden â€” live/published filter by pageLinks.hidden.
      if (!enabled) return;
      urgentAutosaveRef.current = true;
      setSections((current) => ensureBlogsInHeaderMenu(current));
    };
    window.addEventListener(
      "ai-builder-blogs-website-visibility",
      handleBlogsWebsiteVisibility,
    );
    const handleServicesWebsiteVisibility = (event: Event) => {
      const enabled = Boolean(
        (event as CustomEvent<{ enabled?: boolean }>).detail?.enabled,
      );
      if (!enabled) return;
      urgentAutosaveRef.current = true;
      setSections((current) => ensureServicesInHeaderMenu(current));
    };
    window.addEventListener(
      "ai-builder-services-website-visibility",
      handleServicesWebsiteVisibility,
    );
    const handleEventsWebsiteVisibility = (event: Event) => {
      const enabled = Boolean(
        (event as CustomEvent<{ enabled?: boolean }>).detail?.enabled,
      );
      if (!enabled) return;
      urgentAutosaveRef.current = true;
      setSections((current) => ensureEventsInHeaderMenu(current));
    };
    window.addEventListener(
      "ai-builder-events-website-visibility",
      handleEventsWebsiteVisibility,
    );
    const handlePropertiesWebsiteVisibility = (event: Event) => {
      const enabled = Boolean(
        (event as CustomEvent<{ enabled?: boolean }>).detail?.enabled,
      );
      if (!enabled) return;
      urgentAutosaveRef.current = true;
      setSections((current) => ensurePropertiesInHeaderMenu(current));
    };
    window.addEventListener(
      "ai-builder-properties-website-visibility",
      handlePropertiesWebsiteVisibility,
    );
    const handlePortfolioWebsiteVisibility = (event: Event) => {
      const enabled = Boolean(
        (event as CustomEvent<{ enabled?: boolean }>).detail?.enabled,
      );
      // Keep Projects in Header/Nav Menu even when hidden â€” published + live
      // header filter by pageLinks.hidden. Stripping here made items "gayab".
      if (!enabled) return;
      urgentAutosaveRef.current = true;
      setSections((current) =>
        ensurePortfolioInHeaderMenu(current, templateId, category),
      );
    };
    window.addEventListener(
      "ai-builder-portfolio-website-visibility",
      handlePortfolioWebsiteVisibility,
    );
    const handleTeamsWebsiteVisibility = (event: Event) => {
      const enabled = Boolean(
        (event as CustomEvent<{ enabled?: boolean }>).detail?.enabled,
      );
      if (!enabled) return;
      urgentAutosaveRef.current = true;
      setSections((current) => ensureTeamsInHeaderMenu(current));
    };
    window.addEventListener(
      "ai-builder-teams-website-visibility",
      handleTeamsWebsiteVisibility,
    );
    const handleGalleryWebsiteVisibility = (event: Event) => {
      const enabled = Boolean(
        (event as CustomEvent<{ enabled?: boolean }>).detail?.enabled,
      );
      if (!enabled) return;
      urgentAutosaveRef.current = true;
      setSections((current) => ensureGalleryInHeaderMenu(current));
    };
    window.addEventListener(
      "ai-builder-gallery-website-visibility",
      handleGalleryWebsiteVisibility,
    );
    const handleBlogUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{
        href?: string;
        label?: string;
        layout?: string;
        author?: string;
        image?: string;
        shortDescription?: string;
        longDescription?: string;
        category?: string;
      }>).detail;
      const pageSlug = getMultiPageSlugFromHref(detail?.href || "");
      if (!pageSlug) return;
      urgentAutosaveRef.current = true;
      setSections((current) =>
        current.map((section) => {
          if (
            section.type !== "BlogPage" ||
            normalizePageSlug(section.page || "") !== pageSlug
          ) {
            return section;
          }
          const variant =
            detail.layout && /^BlogPage-[1-5]$/.test(detail.layout)
              ? detail.layout
              : section.variant;
          const nextData = {
            ...section.data,
            [variant]: {
              ...(section.data[variant] ??
                section.data[section.variant] ??
                {}),
              ...(detail.label ? { title: detail.label } : {}),
              ...(typeof detail.author === "string"
                ? { author: detail.author }
                : {}),
              ...(typeof detail.image === "string"
                ? { image: detail.image }
                : {}),
              ...(typeof detail.shortDescription === "string"
                ? { excerpt: detail.shortDescription }
                : {}),
              ...(typeof detail.longDescription === "string"
                ? { content: detail.longDescription }
                : {}),
              ...(typeof detail.category === "string"
                ? { category: detail.category }
                : {}),
              layout: variant,
            },
          };
          return { ...section, variant, data: nextData };
        }),
      );
    };
    window.addEventListener("ai-builder-blog-updated", handleBlogUpdated);

    return () => {
      window.removeEventListener("ai-builder-page-added", handlePageAdded);
      window.removeEventListener("ai-builder-page-removed", handlePageRemoved);
      window.removeEventListener("ai-builder-page-renamed", handlePageRenamed);
      window.removeEventListener(
        "ai-builder-blogs-website-visibility",
        handleBlogsWebsiteVisibility,
      );
      window.removeEventListener(
        "ai-builder-services-website-visibility",
        handleServicesWebsiteVisibility,
      );
      window.removeEventListener(
        "ai-builder-events-website-visibility",
        handleEventsWebsiteVisibility,
      );
      window.removeEventListener(
        "ai-builder-properties-website-visibility",
        handlePropertiesWebsiteVisibility,
      );
      window.removeEventListener(
        "ai-builder-portfolio-website-visibility",
        handlePortfolioWebsiteVisibility,
      );
      window.removeEventListener(
        "ai-builder-teams-website-visibility",
        handleTeamsWebsiteVisibility,
      );
      window.removeEventListener(
        "ai-builder-gallery-website-visibility",
        handleGalleryWebsiteVisibility,
      );
      window.removeEventListener("ai-builder-blog-updated", handleBlogUpdated);
    };
  }, [category, isSinglePageTemplate, templateId]);

  const commitSections = (
    mutate: (currentSections: SectionItem[]) => SectionItem[],
  ) => {
    const nextSections = mutate(sectionsRef.current);
    sectionsRef.current = nextSections;
    setSections(nextSections);
  };

  const bumpSectionRenderEpoch = (sectionId: string) => {
    setInlineRenderEpochs((current) => ({
      ...current,
      [sectionId]: (current[sectionId] ?? 0) + 1,
    }));
  };

  const prepareSectionSurfaceForDataUpdate = (sectionId: string) => {
    const editorSurface = document.querySelector<HTMLElement>(
      "[data-editor-live-surface]",
    );
    const needsRemount = Boolean(
      editorSurface?.querySelector(
        "[contenteditable='true'], [data-editor-inline-formatted]",
      ),
    );
    prepareEditorSurfaceForReplace();
    if (needsRemount) bumpSectionRenderEpoch(sectionId);
  };

  const updateSectionVariant = (sectionId: string, variant: string) => {
    // Finish contenteditable / restore decorated DOM before React replaces
    // this section (Enter â†’ <br> otherwise causes removeChild crashes).
    prepareEditorSurfaceForReplace();
    commitSections((currentSections) => {
      const source = currentSections.find(
        (section) => (section.id ?? section.type) === sectionId,
      );
      const syncAllBreadcrumbs = source?.type === "Breadcrumb";

      const next = currentSections.map((section) => {
        const isTarget = (section.id ?? section.type) === sectionId;
        if (!isTarget && !(syncAllBreadcrumbs && section.type === "Breadcrumb")) {
          return section;
        }
        const nextData = {
          ...section.data,
          [variant]: withTopbarLayoutSkin(
            variant,
            mergeSectionContent(
              (section.data[variant] || {}) as Record<string, unknown>,
              (section.data[section.variant] || {}) as Record<string, unknown>,
            ),
          ) as SectionData,
        };
        const nextSection = { ...section, variant, data: nextData };
        return {
          ...nextSection,
          data: syncSectionContentAcrossVariants(
            nextSection,
            nextData,
            variant,
          ),
        };
      });

      return syncAllBreadcrumbs
        ? ensureMissingPageBreadcrumbs(next, templateId, category)
        : next;
    });
    const targetSection = sectionsRef.current.find(
      (section) => (section.id ?? section.type) === sectionId,
    );
    if (targetSection?.type === "Breadcrumb") {
      sectionsRef.current.forEach((section) => {
        if (section.type === "Breadcrumb") {
          bumpSectionRenderEpoch(section.id ?? section.type);
        }
      });
    } else {
      bumpSectionRenderEpoch(sectionId);
    }
  };

  const updateSectionData = (
    sectionId: string,
    newData: Record<string, SectionData>,
  ) => {
    prepareSectionSurfaceForDataUpdate(sectionId);
    commitSections((currentSections) =>
      currentSections.map((section) => {
        if ((section.id ?? section.type) !== sectionId) return section;

        const mergedData = { ...section.data, ...newData };
        if (section.type === "CustomSection") {
          for (const [variantKey, variantValue] of Object.entries(mergedData)) {
            if (!variantValue || typeof variantValue !== "object") continue;
            const variantRecord = variantValue as Record<string, unknown>;
            if (!Array.isArray(variantRecord.columns)) continue;
            mergedData[variantKey] = {
              ...variantRecord,
              columns: normalizeCustomSectionColumns(
                variantRecord.columns as CustomSectionColumnRecord[],
              ),
            } as SectionData;
          }
        }
        return {
          ...section,
          data: syncSectionContentAcrossVariants(
            section,
            mergedData,
            section.variant,
          ),
        };
      }),
    );
  };

  const updateInlineText = (
    sectionId: string,
    variant: string,
    sectionType: string,
    oldText: string,
    newText: string,
    formattedHtml: string | null,
    oldOccurrence: number,
    newOccurrence: number,
    formatKey?: string,
  ) => {
    let syncedMenuLinks: EditorPageLink[] | null = null;
    let didUpdate = false;

    commitSections((currentSections) =>
      currentSections.map((section) => {
        if ((section.id ?? section.type) !== sectionId) return section;

        const { writeVariant, baseData } = resolveSectionVariantWriteTarget(
          section,
          variant,
        );
        const activeData = baseData;
        if (!activeData) return section;

        const isFormattingOnly = oldText.trim() === newText.trim();
        const breadcrumbField =
          sectionType === "Breadcrumb"
            ? getBreadcrumbInlineField(formatKey)
            : null;
        const headerMenuUpdate =
          sectionType === "Header" &&
          formatKey?.startsWith("block:menu:") &&
          !isFormattingOnly
            ? applyHeaderMenuInlineLabelUpdate(
                activeData,
                formatKey,
                newText,
                pageLinksRef.current.filter(
                  (link) =>
                    link.kind !== "blog" &&
                    link.kind !== "document" &&
                    !link.hidden,
                ),
              )
            : null;
        const keyedUpdate =
          !headerMenuUpdate &&
          !isFormattingOnly &&
          !breadcrumbField &&
          formatKey
            ? applyInlineTextByFormatKey(activeData, formatKey, newText)
            : null;
        const result = headerMenuUpdate
          ? { value: headerMenuUpdate.value, replaced: true }
          : isFormattingOnly
          ? { value: activeData, replaced: true }
          : breadcrumbField
            ? {
                value: {
                  ...activeData,
                  [breadcrumbField]: newText,
                },
                replaced: true,
              }
          : keyedUpdate?.replaced
            ? keyedUpdate
          : replaceFirstTextValue(
              activeData,
              oldText,
              newText,
              oldOccurrence,
            );

        if (!result.replaced || !isRecord(result.value)) return section;

        if (headerMenuUpdate) {
          syncedMenuLinks = headerMenuUpdate.menu;
        }

        const nextFormats = readInlineTextFormats(activeData).filter(
          (format) => {
            const matchesKey = Boolean(
              formatKey && format.key === formatKey,
            );
            const matchesLegacyPosition =
              !format.key &&
              format.text.trim() === oldText.trim() &&
              format.occurrence === oldOccurrence;

            return !matchesKey && !matchesLegacyPosition;
          },
        );

        if (formattedHtml) {
          nextFormats.push({
            text: newText,
            occurrence: newOccurrence,
            html: formattedHtml,
            ...(formatKey ? { key: formatKey } : {}),
          });
        }

        const cleanData = { ...(result.value as SectionData) };
        delete cleanData[INLINE_TEXT_FORMATS_KEY];

        const nextData = {
          ...section.data,
          [writeVariant]: {
            ...cleanData,
            ...(nextFormats.length
              ? { [INLINE_TEXT_FORMATS_KEY]: nextFormats }
              : {}),
          } as SectionData,
        };

        didUpdate = true;
        return {
          ...section,
          data: syncSectionContentAcrossVariants(
            section,
            nextData,
            writeVariant,
          ),
        };
      }),
    );
    if (!didUpdate) return;

    urgentAutosaveRef.current = true;
    if (syncedMenuLinks) {
      setPageLinks((current) => {
        const documents = current.filter((link) => link.kind === "document");
        const blogPosts = flattenPageLinks(current)
          .filter((link) => link.kind === "blog")
          .map((link) => ({ ...link, children: undefined }));

        // Header menu is the source of truth after inline rename (Home,
        // section links, blog index). Keep documents + blog posts separately.
        const nextNav = syncedMenuLinks.filter(
          (link) => link.kind !== "blog" && link.kind !== "document",
        );

        if (isSinglePageTemplate) {
          return [...nextNav, ...documents, ...blogPosts];
        }

        // Multi-page: keep pages that were only removed from the visible menu.
        const navHrefs = new Set(
          flattenPageLinks(nextNav).map((link) =>
            link.href.trim().toLowerCase(),
          ),
        );
        const orphans = flattenPageLinks(current)
          .filter((link) => {
            if (link.kind === "blog" || link.kind === "document") return false;
            const href = link.href.trim().toLowerCase();
            if (!href || navHrefs.has(href)) return false;
            return (
              href === "#" ||
              href.startsWith("#page-") ||
              link.kind === "blogIndex" ||
              link.kind === "page"
            );
          })
          .map((link) => ({ ...link, children: undefined }));

        return [...nextNav, ...orphans, ...documents, ...blogPosts];
      });
    }
    // Only remount + toast when data actually changed. A failed match used to
    // remount anyway and wipe the contenteditable text the user just typed.
    setInlineRenderEpochs((current) => ({
      ...current,
      [sectionId]: (current[sectionId] ?? 0) + 1,
    }));
    setInlineUpdateToast(`${formatSectionName(sectionType)} Content - Updated`);
  };

  const updateInlineLink = (
    sectionId: string,
    variant: string,
    sectionType: string,
    oldHref: string,
    newHref: string,
    linkText: string,
  ) => {
    commitSections((currentSections) =>
      currentSections.map((section) => {
        if ((section.id ?? section.type) !== sectionId) return section;

        const { writeVariant, baseData } = resolveSectionVariantWriteTarget(
          section,
          variant,
        );
        const activeData = baseData;
        if (!activeData) return section;

        const result = replaceFirstLinkHref(
          activeData,
          oldHref,
          newHref,
          linkText,
        );
        if (!result.replaced || !isRecord(result.value)) return section;

        const nextData = {
          ...section.data,
          [writeVariant]: result.value as SectionData,
        };
        return {
          ...section,
          data: syncSectionContentAcrossVariants(
            section,
            nextData,
            writeVariant,
          ),
        };
      }),
    );
    setInlineRenderEpochs((current) => ({
      ...current,
      [sectionId]: (current[sectionId] ?? 0) + 1,
    }));
    setInlineUpdateToast(`${formatSectionName(sectionType)} Link - Updated`);
  };

  const updateInlineMedia = (
    sectionId: string,
    variant: string,
    sectionType: string,
    oldSrc: string,
    newSrc: string,
    mediaType: "image" | "video",
    fileName: string,
    occurrence: number,
    fieldHint?: string,
  ) => {
    commitSections((currentSections) =>
      currentSections.map((section) => {
        if ((section.id ?? section.type) !== sectionId) return section;

        const { writeVariant, baseData } = resolveSectionVariantWriteTarget(
          section,
          variant,
        );
        const activeData = baseData;
        if (!activeData) return section;

        const hintedResult =
          mediaType === "image"
            ? replaceHintedMediaValue(
                activeData,
                newSrc,
                fileName,
                fieldHint,
              )
            : { value: activeData, replaced: false };
        const result = hintedResult.replaced
          ? hintedResult
          : replaceFirstMediaValue(
          activeData,
          oldSrc,
          newSrc,
          mediaType,
          fileName,
              occurrence,
        );

        if (!result.replaced || !isRecord(result.value)) return section;

        const nextData = {
          ...section.data,
          [writeVariant]: result.value as SectionData,
        };
        return {
          ...section,
          data: syncSectionContentAcrossVariants(
            section,
            nextData,
            writeVariant,
          ),
        };
      }),
    );
    // Media values update through normal React props. Forcing a remount here
    // conflicts with the toolbar's temporary inline-format DOM wrappers and
    // can make React remove a node that is no longer a direct child.
    urgentAutosaveRef.current = true;
    setInlineUpdateToast(
      `${formatSectionName(sectionType)} ${
        mediaType === "video" ? "Video" : "Image"
      } - Updated`,
    );
  };

  const deleteSection = (sectionId: string) => {
    const deletedSection = sections.find(
      (section) => (section.id ?? section.type) === sectionId,
    );
    const nextSections = sections.filter(
      (section) => (section.id ?? section.type) !== sectionId,
    );
    urgentAutosaveRef.current = true;
    setSections(nextSections);
    if (isSinglePageTemplate) {
      const definition = deletedSection
        ? SINGLE_PAGE_SECTION_MENU[deletedSection.type]
        : undefined;
      const linksWithoutDeleted = definition
        ? pageLinks.filter((link) => {
            const href = link.href.trim().toLowerCase();
            const label = link.label.trim().toLowerCase();
            return (
              label !== definition.label.toLowerCase() &&
              !definition.legacyHrefs.includes(href)
            );
          })
        : pageLinks;
      setPageLinks(
        buildSectionSyncedSinglePageMenu(nextSections, linksWithoutDeleted),
      );
    } else if (deletedSection?.page && deletedSection.type !== "Breadcrumb") {
      const deletedPageSlug = normalizePageSlug(deletedSection.page);
      const remainingPageBody = nextSections.some(
        (section) =>
          section.type !== "Breadcrumb" &&
          normalizePageSlug(section.page || "") === deletedPageSlug,
      );
      if (!remainingPageBody) {
        setSections(
          nextSections.filter(
            (section) =>
              normalizePageSlug(section.page || "") !== deletedPageSlug,
          ),
        );
        setPageLinks(
          pageLinks.filter(
            (link) => getMultiPageSlugFromHref(link.href) !== deletedPageSlug,
          ),
        );
      }
    }
  setEditingSection(null);
};

  const addSectionAfter = (
    afterSectionId: string,
    sectionType: string,
    variant?: string,
  ) => {
    const nextSection = createAddableSection(sectionType, category, variant);
    if (!nextSection) return;
    const pageSlug = normalizePageSlug(createPageSlug(page));
    const scopedNextSection =
      pageSlug && pageSlug !== "home"
        ? { ...nextSection, page: pageSlug }
        : nextSection;

    const nextSections = (() => {
      const targetIndex = sections.findIndex(
        (section) => (section.id ?? section.type) === afterSectionId,
      );

      if (targetIndex === -1) {
        return ensureUniqueSectionIds([
          ...sections,
          scopedNextSection,
        ]);
      }

      return ensureUniqueSectionIds([
        ...sections.slice(0, targetIndex + 1),
        scopedNextSection,
        ...sections.slice(targetIndex + 1),
      ]);
    })();
    setSections(nextSections);
    if (isSinglePageTemplate) {
      setPageLinks(
        buildSectionSyncedSinglePageMenu(nextSections, pageLinks, {
          appendMissingSectionLinks: true,
        }),
      );
    }
  };

  const addCustomSectionAfter = (
    afterSectionId: string,
    layoutId: CustomSectionLayoutId,
    initialColumns?: Array<{ id: string; elements: Array<Record<string, unknown>> }>,
    sectionFields?: Record<string, unknown>,
  ) => {
    const id = nextCustomRuntimeId("CustomSection");
    const pageSlug = normalizePageSlug(createPageSlug(page));
    const layout = getCustomSectionLayout(layoutId);
    const cellCount = layout?.cellCount ?? 1;
    const columns =
      Array.isArray(initialColumns) && initialColumns.length > 0
        ? initialColumns
        : Array.from({ length: cellCount }, () => ({
            id: nextCustomRuntimeId("column"),
            elements: [] as Array<Record<string, unknown>>,
          }));
    const customSection: SectionItem = {
      id,
      type: "CustomSection",
      variant: "CustomSection-1",
      ...(pageSlug && pageSlug !== "home" ? { page: pageSlug } : {}),
      data: {
        "CustomSection-1": {
          customSectionId: id,
          layout: layoutId,
          columns,
          ...(sectionFields && typeof sectionFields === "object"
            ? sectionFields
            : {}),
        },
      },
    };
    setSections((current) => {
      const targetIndex = current.findIndex((section) => (section.id ?? section.type) === afterSectionId);
      const next = targetIndex < 0 ? [...current, customSection] : [...current.slice(0, targetIndex + 1), customSection, ...current.slice(targetIndex + 1)];
      const unique = ensureUniqueSectionIds(next);
      // Sync immediately so AI follow-up apply does not race React's useEffect.
      sectionsRef.current = unique;
      return unique;
    });
    return id;
  };

  useEffect(() => {
    const handleCustomSectionUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{
        sectionId?: string;
        patch?: Record<string, unknown>;
      }>).detail;
      if (!detail?.sectionId || !detail.patch) return;

      setSections((current) => current.map((section) => {
        if (!sectionMatchesCustomEvent(section, detail.sectionId!)) return section;
        const variantData = section.data[section.variant] ?? {};
        const nextVariant: Record<string, unknown> = {
          ...variantData,
          ...detail.patch,
        };
        if (Array.isArray(nextVariant.columns)) {
          nextVariant.columns = normalizeCustomSectionColumns(
            nextVariant.columns as CustomSectionColumnRecord[],
          );
        }
        return {
          ...section,
          data: {
            ...section.data,
            [section.variant]: nextVariant,
          },
        };
      }));
    };

    window.addEventListener(
      "ai-builder-custom-section-updated",
      handleCustomSectionUpdated,
    );
    return () => window.removeEventListener(
      "ai-builder-custom-section-updated",
      handleCustomSectionUpdated,
    );
  }, []);

  useEffect(() => {
    const handleCustomElementAdded = (event: Event) => {
      const detail = (event as CustomEvent<{ sectionId?: string; columnIndex?: number; type?: "text" | "image" | "button" | "table" | "slider" | "faq" | "heading" | "testimonial" }>).detail;
      if (!detail?.sectionId || typeof detail.columnIndex !== "number" || !detail.type) return;
      const columnIndex = detail.columnIndex;
      const elementType = detail.type;
      setSections((current) => {
        const next = current.map((section) => {
        if (!sectionMatchesCustomEvent(section, detail.sectionId!)) return section;
        const variantData = section.data[section.variant] ?? {};
        const columns = Array.isArray(variantData.columns) ? structuredClone(variantData.columns) as Array<{ id: string; elements?: Array<Record<string, unknown>> }> : [];
        while (columns.length <= columnIndex) {
          columns.push({
            id: nextCustomRuntimeId("column"),
            elements: [],
          });
        }
        const column = columns[columnIndex];
        if (!column) return section;
        column.elements = Array.isArray(column.elements) ? column.elements : [];
        const element =
          elementType === "image"
            ? {
                id: nextCustomRuntimeId(elementType),
                type: elementType,
                src: "/bg1.jpg",
                imageStyle: "cover" as const,
              }
            : elementType === "slider"
              ? {
                  id: nextCustomRuntimeId(elementType),
                  type: elementType,
                  sliderAutoplay: true,
                  sliderHeight: 320,
                  sliderCardsPerView: 1,
                  sliderPopupOnClick: false,
                  slides: [
                    { id: nextCustomRuntimeId("slide"), src: "/bg1.jpg", alt: "Slide 1" },
                    { id: nextCustomRuntimeId("slide"), src: "/bg1.jpg", alt: "Slide 2" },
                    { id: nextCustomRuntimeId("slide"), src: "/bg1.jpg", alt: "Slide 3" },
                  ],
                }
              : elementType === "faq"
                ? {
                    id: nextCustomRuntimeId(elementType),
                    type: elementType,
                    faqItems: [
                      {
                        id: nextCustomRuntimeId("faq"),
                        question: "What is included?",
                        answer:
                          "Share a short answer about what customers get with this offer.",
                      },
                      {
                        id: nextCustomRuntimeId("faq"),
                        question: "How do I get started?",
                        answer:
                          "Explain the first step so visitors know exactly what to do next.",
                      },
                      {
                        id: nextCustomRuntimeId("faq"),
                        question: "Can I contact support?",
                        answer:
                          "Tell people how to reach you for help, booking, or more details.",
                      },
                    ],
                  }
                : elementType === "testimonial"
                  ? {
                      id: nextCustomRuntimeId(elementType),
                      type: elementType,
                      testimonialLayout: "grid" as const,
                      testimonialCardsPerView: 2 as const,
                      testimonialMobileCardsPerView: 1 as const,
                      testimonialCardPadding: 16,
                      testimonialNav: "arrow" as const,
                      testimonialAutoplay: false,
                      testimonialItems: [
                        {
                          id: nextCustomRuntimeId("testimonial"),
                          name: "Aarav Mehta",
                          role: "Founder, Studio North",
                          quote:
                            "The site made our work easier to understand and brought in better leads within the first week.",
                          image: "/bg1.jpg",
                          rating: 5,
                        },
                        {
                          id: nextCustomRuntimeId("testimonial"),
                          name: "Neha Kapoor",
                          role: "Marketing Lead",
                          quote:
                            "Clean sections, fast pages, and the editor keeps the content simple for our whole team.",
                          image: "/bg1.jpg",
                          rating: 5,
                        },
                      ],
                    }
                : elementType === "heading"
                  ? {
                      id: nextCustomRuntimeId("heading"),
                      type: "heading" as const,
                      value: "Add a heading",
                      align: "left" as const,
                      headingLevel: 2,
                      fontSize: 40,
                      textColor: "#0f172a",
                    }
                  : elementType === "table"
                    ? {
                        id: nextCustomRuntimeId(elementType),
                        type: elementType,
                        rows: [
                          ["Heading", "Value"],
                          ["Item", "Detail"],
                        ],
                      }
                    : elementType === "button"
                      ? {
                          id: nextCustomRuntimeId(elementType),
                          type: elementType,
                          value: "Button",
                          href: "#",
                          icon: "none",
                          iconPosition: "after",
                          openInNewTab: false,
                        }
                      : {
                          id: nextCustomRuntimeId(elementType),
                          type: elementType,
                          value: "Click this text to edit your content.",
                        };
        column.elements = [...column.elements, element];
        return {
          ...section,
          data: {
            ...section.data,
            [section.variant]: { ...variantData, columns },
          },
        };
      });
        sectionsRef.current = next;
        return next;
      });
    };
    window.addEventListener("ai-builder-custom-element-added", handleCustomElementAdded);
    return () => window.removeEventListener("ai-builder-custom-element-added", handleCustomElementAdded);
  }, []);

  useEffect(() => {
    const handleCustomElementUpdated = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          sectionId?: string;
          elementId?: string;
          patch?: Record<string, unknown>;
        }>
      ).detail;
      if (!detail?.sectionId || !detail.elementId || !detail.patch) return;

      setSections((current) => current.map((section) => {
        if (!sectionMatchesCustomEvent(section, detail.sectionId!)) return section;
        const variantData = section.data[section.variant] ?? {};
        const columns = Array.isArray(variantData.columns)
          ? structuredClone(variantData.columns) as Array<{
              id: string;
              elements?: Array<Record<string, unknown>>;
            }>
          : [];
        let updated = false;
        for (const column of columns) {
          column.elements = (column.elements ?? []).map((element) => {
            if (element.id !== detail.elementId) return element;
            updated = true;
            return { ...element, ...detail.patch };
          });
        }
        if (!updated) return section;
        return {
          ...section,
          data: {
            ...section.data,
            [section.variant]: { ...variantData, columns },
          },
        };
      }));
    };

    window.addEventListener(
      "ai-builder-custom-element-updated",
      handleCustomElementUpdated,
    );
    return () => window.removeEventListener(
      "ai-builder-custom-element-updated",
      handleCustomElementUpdated,
    );
  }, []);

  useEffect(() => {
    const handleCustomColumnUpdated = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          sectionId?: string;
          columnIndex?: number;
          patch?: Record<string, unknown>;
        }>
      ).detail;
      if (!detail?.sectionId || detail.columnIndex === undefined || !detail.patch) return;

      setSections((current) => current.map((section) => {
        if (!sectionMatchesCustomEvent(section, detail.sectionId!)) return section;
        const variantData = section.data[section.variant] ?? {};
        const columns = Array.isArray(variantData.columns)
          ? structuredClone(variantData.columns) as Array<Record<string, unknown>>
          : [];
        const column = columns[detail.columnIndex!];
        if (!column) return section;
        columns[detail.columnIndex!] = { ...column, ...detail.patch };
        return {
          ...section,
          data: {
            ...section.data,
            [section.variant]: { ...variantData, columns },
          },
        };
      }));
    };

    window.addEventListener("ai-builder-custom-column-updated", handleCustomColumnUpdated);
    return () => window.removeEventListener("ai-builder-custom-column-updated", handleCustomColumnUpdated);
  }, []);

  useEffect(() => {
    const handleCustomColumnWidthsUpdated = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          sectionId?: string;
          widths?: number[];
        }>
      ).detail;
      if (!detail?.sectionId || !Array.isArray(detail.widths)) return;

      setSections((current) => current.map((section) => {
        if (!sectionMatchesCustomEvent(section, detail.sectionId!)) return section;
        const variantData = section.data[section.variant] ?? {};
        const columns = Array.isArray(variantData.columns)
          ? structuredClone(variantData.columns) as Array<Record<string, unknown>>
          : [];
        if (columns.length === 0) return section;

        detail.widths!.forEach((width, index) => {
          if (!columns[index] || typeof width !== "number") return;
          columns[index] = { ...columns[index], widthPercent: width };
        });

        return {
          ...section,
          data: {
            ...section.data,
            [section.variant]: { ...variantData, columns },
          },
        };
      }));
    };

    window.addEventListener("ai-builder-custom-column-widths-updated", handleCustomColumnWidthsUpdated);
    return () => window.removeEventListener("ai-builder-custom-column-widths-updated", handleCustomColumnWidthsUpdated);
  }, []);

  useEffect(() => {
    type ColumnAction = "move-left" | "move-right" | "add" | "duplicate" | "delete" | "clear";
    const MAX_CUSTOM_COLUMNS = 6;
    const handleCustomColumnAction = (event: Event) => {
      const detail = (event as CustomEvent<{
        sectionId?: string;
        columnIndex?: number;
        action?: ColumnAction;
      }>).detail;
      if (!detail?.sectionId || detail.columnIndex === undefined || !detail.action) return;
      const sectionId = detail.sectionId;
      const index = detail.columnIndex as number;
      const action = detail.action;

      setSections((current) => current.map((section) => {
        if (!sectionMatchesCustomEvent(section, sectionId)) return section;
        const variantData = section.data[section.variant] ?? {};
        const columns = Array.isArray(variantData.columns)
          ? structuredClone(variantData.columns) as Array<{ id: string; elements?: Array<Record<string, unknown>> }>
          : [];
        if (!columns[index]) return section;

        if (action === "move-left" && index > 0) {
          [columns[index - 1], columns[index]] = [columns[index], columns[index - 1]];
        } else if (action === "move-right" && index < columns.length - 1) {
          [columns[index], columns[index + 1]] = [columns[index + 1], columns[index]];
        } else if (action === "add" && columns.length < MAX_CUSTOM_COLUMNS) {
          columns.splice(index + 1, 0, { id: nextCustomRuntimeId("column"), elements: [] });
        } else if (action === "duplicate" && columns.length < MAX_CUSTOM_COLUMNS) {
          const duplicate = structuredClone(columns[index]);
          duplicate.id = nextCustomRuntimeId("column");
          duplicate.elements = (duplicate.elements ?? []).map((element: Record<string, unknown>) => ({
            ...element,
            id: nextCustomRuntimeId(String(element.type ?? "element")),
          }));
          columns.splice(index + 1, 0, duplicate);
        } else if (action === "delete" && columns.length > 1) {
          columns.splice(index, 1);
        } else if (action === "clear") {
          columns[index] = { ...columns[index], elements: [] };
        } else {
          return section;
        }

        const changesColumnCount = ["add", "duplicate", "delete"].includes(action);
        return {
          ...section,
          data: {
            ...section.data,
            [section.variant]: {
              ...variantData,
              ...(changesColumnCount ? { layout: layoutIdForColumnCount(columns.length) } : {}),
              columns,
            },
          },
        };
      }));
    };

    window.addEventListener("ai-builder-custom-column-action", handleCustomColumnAction);
    return () => window.removeEventListener("ai-builder-custom-column-action", handleCustomColumnAction);
  }, []);

  useEffect(() => {
    type ElementAction = "move-up" | "move-down" | "duplicate" | "delete";
    const handleCustomElementAction = (event: Event) => {
      const detail = (event as CustomEvent<{
        sectionId?: string;
        columnIndex?: number;
        elementId?: string;
        action?: ElementAction;
      }>).detail;
      if (!detail?.sectionId || detail.columnIndex === undefined || !detail.elementId || !detail.action) return;
      const { sectionId, elementId, action } = detail;
      const columnIndex = detail.columnIndex;

      setSections((current) => current.map((section) => {
        if (!sectionMatchesCustomEvent(section, sectionId)) return section;
        const variantData = section.data[section.variant] ?? {};
        const columns = Array.isArray(variantData.columns)
          ? structuredClone(variantData.columns) as Array<{ id: string; elements?: Array<Record<string, unknown>> }>
          : [];
        const column = columns[columnIndex];
        if (!column) return section;
        const elements = column.elements ?? [];
        const elementIndex = elements.findIndex((element) => element.id === elementId);
        if (elementIndex < 0) return section;

        if (action === "move-up" && elementIndex > 0) {
          [elements[elementIndex - 1], elements[elementIndex]] = [elements[elementIndex], elements[elementIndex - 1]];
        } else if (action === "move-down" && elementIndex < elements.length - 1) {
          [elements[elementIndex], elements[elementIndex + 1]] = [elements[elementIndex + 1], elements[elementIndex]];
        } else if (action === "duplicate") {
          elements.splice(elementIndex + 1, 0, {
            ...structuredClone(elements[elementIndex]),
            id: nextCustomRuntimeId(String(elements[elementIndex].type ?? "element")),
          });
        } else if (action === "delete") {
          elements.splice(elementIndex, 1);
        } else {
          return section;
        }
        column.elements = elements;
        return { ...section, data: { ...section.data, [section.variant]: { ...variantData, columns } } };
      }));
    };

    window.addEventListener("ai-builder-custom-element-action", handleCustomElementAction);
    return () => window.removeEventListener("ai-builder-custom-element-action", handleCustomElementAction);
  }, []);

  useEffect(() => {
    type SectionAction = "move-up" | "move-down" | "duplicate" | "delete";
    const handleCustomSectionAction = (event: Event) => {
      const detail = (event as CustomEvent<{ sectionId?: string; action?: SectionAction }>).detail;
      if (!detail?.sectionId || !detail.action) return;
      const { sectionId, action } = detail;
      setSections((current) => {
        const index = current.findIndex((section) =>
          sectionMatchesCustomEvent(section, sectionId),
        );
        if (index < 0) return current;
        if (action === "delete") return current.filter((_, itemIndex) => itemIndex !== index);
        if (action === "move-up" || action === "move-down") {
          const direction = action === "move-up" ? -1 : 1;
          const pageLabel = editorViewPageRef.current;
          const currentPageLink = flattenPageLinks(pageLinksRef.current).find(
            (link) =>
              normalizePageSlug(link.label) === normalizePageSlug(pageLabel),
          );
          const pageScopedSlug = getMultiPageSlugFromHref(
            currentPageLink?.href || "",
          );
          const pageSlug =
            pageScopedSlug ||
            (isSinglePageTemplateRef.current
              ? "home"
              : normalizePageSlug(pageLabel));
          const targetIndex = findMovableNeighborIndex(
            current,
            index,
            direction,
            pageSlug,
          );
          if (targetIndex < 0) return current;
          const next = [...current];
          [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
          return next;
        }
        const duplicate = structuredClone(current[index]);
        const duplicateId = nextCustomRuntimeId("CustomSection");
        duplicate.id = duplicateId;
        const variantData = duplicate.data[duplicate.variant] ?? {};
        const columns = Array.isArray(variantData.columns)
          ? structuredClone(variantData.columns) as Array<{ id: string; elements?: Array<Record<string, unknown>> }>
          : [];
        for (const column of columns) {
          column.id = nextCustomRuntimeId("column");
          column.elements = (column.elements ?? []).map((element) => ({
            ...element,
            id: nextCustomRuntimeId(String(element.type ?? "element")),
          }));
        }
        duplicate.data = {
          ...duplicate.data,
          [duplicate.variant]: { ...variantData, customSectionId: duplicateId, columns },
        };
        return [...current.slice(0, index + 1), duplicate, ...current.slice(index + 1)];
      });
    };

    window.addEventListener("ai-builder-custom-section-action", handleCustomSectionAction);
    return () => window.removeEventListener("ai-builder-custom-section-action", handleCustomSectionAction);
  }, []);

  const moveSection = (sectionId: string, direction: -1 | 1) => {
    const pageLabel = editorViewPageRef.current;
    const currentPageLink = flattenPageLinks(pageLinksRef.current).find(
      (link) => normalizePageSlug(link.label) === normalizePageSlug(pageLabel),
    );
    const pageScopedSlug = getMultiPageSlugFromHref(currentPageLink?.href || "");
    const pageSlug =
      pageScopedSlug ||
      (isSinglePageTemplateRef.current
        ? "home"
        : normalizePageSlug(pageLabel));

    setSections((prevSections) => {
      const currentIndex = prevSections.findIndex(
        (section) => (section.id ?? section.type) === sectionId,
      );

      if (
        currentIndex === -1 ||
        isLockedSection(prevSections[currentIndex])
      ) {
        return prevSections;
      }

      const targetIndex = findMovableNeighborIndex(
        prevSections,
        currentIndex,
        direction,
        pageSlug,
      );

      if (targetIndex < 0) {
        return prevSections;
      }

      const nextSections = [...prevSections];
      [nextSections[currentIndex], nextSections[targetIndex]] = [
        nextSections[targetIndex],
        nextSections[currentIndex],
      ];

      return nextSections;
    });
  };

  const aiEditorActionsRef = useRef({
    updateSectionVariant,
    updateSectionData,
    addSectionAfter,
    addCustomSectionAfter,
    deleteSection,
    moveSection,
  });
  aiEditorActionsRef.current = {
    updateSectionVariant,
    updateSectionData,
    addSectionAfter,
    addCustomSectionAfter,
    deleteSection,
    moveSection,
  };

  // Always-fresh breadcrumb apply (avoids stale empty-deps AI listener after HMR).
  const applyAddBreadcrumbRef = useRef<(action: Record<string, unknown>) => string>(
    () => "Breadcrumb apply is not ready.",
  );
  // Always-fresh custom section add (same stale-listener class of bugs).
  type AiCustomWidget = {
    columnIndex?: number;
    type: "text" | "image" | "button" | "table" | "slider" | "faq" | "heading" | "testimonial";
    value?: string;
    src?: string;
    href?: string;
    textColor?: string;
    buttonBackgroundColor?: string;
    buttonTextColor?: string;
    sliderCardsPerView?: 1 | 2 | 3 | 4;
    faqItems?: Array<{ id?: string; question: string; answer: string }>;
    testimonialItems?: Array<{
      id?: string;
      name: string;
      role?: string;
      quote: string;
      image?: string;
      rating?: number;
    }>;
  };
  const applyAddCustomRef = useRef<
    (
      layoutId?: string,
      elements?: AiCustomWidget[],
      afterSectionHint?: string,
      sectionFields?: Record<string, unknown>,
    ) => string
  >(() => "Custom section apply is not ready.");
  applyAddCustomRef.current = (
    layoutId?: string,
    elements?: AiCustomWidget[],
    afterSectionHint?: string,
    sectionFields?: Record<string, unknown>,
  ) => {
    const items = sectionsRef.current;
    const hint = (afterSectionHint || "").trim();

    let anchor: string | undefined;
    if (hint && hint.toLowerCase() !== "end") {
      const target =
        items.find(
          (section) =>
            (section.id ?? section.type) === hint ||
            section.type.toLowerCase() === hint.toLowerCase(),
        ) ||
        items.find(
          (section) =>
            section.type.toLowerCase().includes(hint.toLowerCase()) ||
            (section.id || "").toLowerCase().includes(hint.toLowerCase()),
        );
      if (target) {
        anchor = target.id ?? target.type;
      }
    }

    if (!anchor) {
      const footerIndex = items.findIndex((section) => section.type === "Footer");
      anchor =
        footerIndex > 0
          ? items[footerIndex - 1].id ?? items[footerIndex - 1].type
          : items[items.length - 1]?.id ?? items[items.length - 1]?.type;
    }

    if (!anchor) return "Could not add custom section.";

    const resolvedLayout = (layoutId ||
      "two-columns") as CustomSectionLayoutId;
    const layout = getCustomSectionLayout(resolvedLayout);
    const cellCount = layout?.cellCount ?? 1;
    const widgets = Array.isArray(elements) ? elements : [];
    const theme = templateVariablesRef.current || {};
    const isAbout = sectionFields?.sectionName === "About";
    const primaryBg = theme["--primary-bg"] || "#0f766e";
    const primaryText = theme["--primary-text"] || "#ffffff";
    const secondaryText = theme["--secondary-text"] || "#0f172a";

    const columns: Array<{
      id: string;
      elements: Array<Record<string, unknown>>;
    }> = Array.from({ length: cellCount }, () => ({
      id: nextCustomRuntimeId("column"),
      elements: [],
    }));

    for (const widget of widgets) {
      const columnIndex =
        typeof widget.columnIndex === "number" ? widget.columnIndex : 0;
      while (columns.length <= columnIndex) {
        columns.push({
          id: nextCustomRuntimeId("column"),
          elements: [],
        });
      }
      const column = columns[columnIndex];
      if (!column) continue;

      if (widget.type === "image") {
        column.elements.push({
          id: nextCustomRuntimeId("image"),
          type: "image",
          src: widget.src || "/bg1.jpg",
          imageStyle: "cover",
        });
        continue;
      }
      if (widget.type === "heading") {
        column.elements.push({
          id: nextCustomRuntimeId("heading"),
          type: "heading",
          value: widget.value || "Add a heading",
          align: isAbout ? "left" : "center",
          headingLevel: 2,
          fontSize: 40,
          textColor:
            typeof widget.textColor === "string" && widget.textColor
              ? widget.textColor
              : secondaryText,
        });
        continue;
      }
      if (widget.type === "button") {
        column.elements.push({
          id: nextCustomRuntimeId("button"),
          type: "button",
          value: widget.value || "Button",
          href: widget.href || "#",
          icon: "none",
          iconPosition: "after",
          openInNewTab: false,
          align: isAbout ? "left" : "center",
          buttonBackgroundColor:
            typeof widget.buttonBackgroundColor === "string" &&
            widget.buttonBackgroundColor
              ? widget.buttonBackgroundColor
              : isAbout
                ? primaryBg
                : "#ffffff",
          buttonTextColor:
            typeof widget.buttonTextColor === "string" && widget.buttonTextColor
              ? widget.buttonTextColor
              : isAbout
                ? primaryText
                : primaryBg,
          buttonBorderRadius: isAbout ? 10 : 999,
        });
        continue;
      }
      if (widget.type === "slider") {
        const cards =
          widget.sliderCardsPerView === 2 ||
          widget.sliderCardsPerView === 3 ||
          widget.sliderCardsPerView === 4
            ? widget.sliderCardsPerView
            : 1;
        column.elements.push({
          id: nextCustomRuntimeId("slider"),
          type: "slider",
          sliderAutoplay: true,
          sliderHeight: 320,
          sliderCardsPerView: cards,
          sliderPopupOnClick: false,
          slides: Array.from({ length: Math.max(cards, 3) }, (_, i) => ({
            id: nextCustomRuntimeId("slide"),
            src: "/bg1.jpg",
            alt: `Slide ${i + 1}`,
          })),
        });
        continue;
      }
      if (widget.type === "faq") {
        const faqItems = Array.isArray(widget.faqItems)
          ? widget.faqItems.map((item) => ({
              id: item.id || nextCustomRuntimeId("faq"),
              question: item.question,
              answer: item.answer || "Add an answer here.",
            }))
          : [
              {
                id: nextCustomRuntimeId("faq"),
                question: "What is included?",
                answer:
                  "Share a short answer about what customers get with this offer.",
              },
            ];
        column.elements.push({
          id: nextCustomRuntimeId("faq"),
          type: "faq",
          faqItems,
        });
        continue;
      }
      if (widget.type === "testimonial") {
        column.elements.push({
          id: nextCustomRuntimeId("testimonial"),
          type: "testimonial",
          testimonialLayout: "grid",
          testimonialCardsPerView: 2,
          testimonialMobileCardsPerView: 1,
          testimonialCardPadding: 16,
          testimonialNav: "arrow",
          testimonialAutoplay: false,
          testimonialItems: Array.isArray(widget.testimonialItems)
            ? widget.testimonialItems.map((item, index) => ({
                id: item.id || nextCustomRuntimeId("testimonial"),
                name: item.name || `Customer ${index + 1}`,
                role: item.role || "Customer",
                quote: item.quote || "Add a short testimonial quote here.",
                image: item.image || "/bg1.jpg",
                rating: Math.max(
                  1,
                  Math.min(5, Math.round(Number(item.rating) || 5)),
                ),
              }))
            : [],
        });
        continue;
      }
      if (widget.type === "table") {
        column.elements.push({
          id: nextCustomRuntimeId("table"),
          type: "table",
          rows: [
            ["Heading", "Value"],
            ["Item", "Detail"],
          ],
        });
        continue;
      }
      column.elements.push({
        id: nextCustomRuntimeId("text"),
        type: "text",
        value: widget.value || "Click this text to edit your content.",
        align: sectionFields ? (isAbout ? "left" : "center") : "left",
      });
    }

    aiEditorActionsRef.current.addCustomSectionAfter(
      anchor,
      resolvedLayout,
      columns,
      sectionFields && typeof sectionFields === "object"
        ? sectionFields
        : undefined,
    );

    return widgets.length
      ? "Custom section added with available widgets."
      : "Custom section added.";
  };
  // Always-fresh delete apply (same stale-listener class of bugs as breadcrumb).
  const applyDeletePageRef = useRef<(action: Record<string, unknown>) => string>(
    () => "Delete page apply is not ready.",
  );
  applyDeletePageRef.current = (action: Record<string, unknown>) => {
    const pageLabel =
      typeof action.pageLabel === "string" ? action.pageLabel.trim() : "";
    if (!pageLabel) return "Page name is required to delete.";
    if (/^home$/i.test(pageLabel)) return "Home page cannot be deleted.";

    const targetSlug = normalizePageSlug(pageLabel);
    const candidates = collectEditorPageCandidates(
      pageLinksRef.current,
      sectionsRef.current,
    );
    const existing =
      candidates.find(
        (link) =>
          (link.label || "").trim().toLowerCase() === pageLabel.toLowerCase() ||
          normalizePageSlug(getMultiPageSlugFromHref(link.href) || "") ===
            targetSlug,
      ) || null;

    if (existing?.kind === "blog") {
      return `"${existing.label}" is a blog post â€” delete it from Blogs manager.`;
    }

    // Always strip by label/href â€” Loan may exist only in Header menu/blocks.
    const matchLink: EditorPageLink = existing || {
      label: pageLabel,
      href: `#page-${targetSlug || createPageSlug(pageLabel)}`,
    };

    const removingBlogIndex = isBlogIndexPageLink(matchLink);
    const pageSlug =
      getMultiPageSlugFromHref(matchLink.href || "") ||
      createPageSlug(matchLink.label || pageLabel);

    const nextLinks = pageLinksRef.current.filter((item) => {
      if (item.kind === "blog") return true;
      if (removingBlogIndex) return !isBlogIndexPageLink(item);
      return (
        (item.label || "").trim().toLowerCase() !==
          matchLink.label.trim().toLowerCase() &&
        normalizePageSlug(getMultiPageSlugFromHref(item.href) || "") !==
          normalizePageSlug(pageSlug)
      );
    });
    pageLinksRef.current = nextLinks;
    setPageLinks(nextLinks);

    const viewPage = (editorViewPageRef.current || "").trim();
    if (
      viewPage &&
      (viewPage.toLowerCase() === matchLink.label.toLowerCase() ||
        normalizePageSlug(viewPage) === normalizePageSlug(pageSlug))
    ) {
      const nextPage =
        nextLinks.find(
          (item) =>
            item.kind !== "blog" &&
            (item.label || "").trim().toLowerCase() !==
              matchLink.label.toLowerCase(),
        )?.label ?? "Home";
      setCurrentPage(nextPage);
    }

    urgentAutosaveRef.current = true;
    const stripMatch = removingBlogIndex
      ? {
          ...matchLink,
          kind: "blogIndex",
          href: matchLink.href || "#page-blogs",
          label: matchLink.label || "Blogs",
        }
      : matchLink;
    const withoutMenus = stripRemovedPageFromSectionMenus(
      sectionsRef.current,
      stripMatch,
    );
    const nextSections = removingBlogIndex
      ? withoutMenus.filter((section) => {
          if (section.type === "BlogPage") return true;
          const slug = normalizePageSlug(section.page || "");
          return slug !== "blogs" && slug !== "blog";
        })
      : withoutMenus.filter(
          (section) =>
            normalizePageSlug(section.page || "") !==
            normalizePageSlug(pageSlug),
        );
    sectionsRef.current = nextSections;
    setSections(nextSections);

    const header = nextSections.find((section) => section.type === "Header");
    if (header) {
      prepareEditorSurfaceForReplace();
      bumpSectionRenderEpoch(header.id ?? header.type);
    }

    const stillInNav = collectEditorPageCandidates(
      nextLinks,
      nextSections,
    ).some(
      (link) =>
        (link.label || "").trim().toLowerCase() ===
          matchLink.label.trim().toLowerCase() ||
        normalizePageSlug(getMultiPageSlugFromHref(link.href) || "") ===
          normalizePageSlug(pageSlug),
    );

    return stillInNav
      ? `Tried to delete "${matchLink.label}" but it is still in the nav â€” hard refresh and try again.`
      : `Deleted "${matchLink.label}" from Pages, nav menu, and page sections.`;
  };
  applyAddBreadcrumbRef.current = (action: Record<string, unknown>) => {
    let targetLabel =
      typeof action.pageLabel === "string" ? action.pageLabel.trim() : "";
    if (!targetLabel || /^(this|that|current|ye|is)$/i.test(targetLabel)) {
      targetLabel = (editorViewPageRef.current || "").trim();
    }
    if (!targetLabel || /^home$/i.test(targetLabel)) {
      return "Open an inner page first, then ask to add a breadcrumb.";
    }

    const pageSlug = normalizePageSlug(
      targetLabel.toLowerCase().replace(/\s+/g, "-"),
    );
    const pageLink = flattenPageLinks(pageLinksRef.current).find(
      (link) =>
        link.label.trim().toLowerCase() === targetLabel.toLowerCase() ||
        normalizePageSlug(getMultiPageSlugFromHref(link.href) || "") ===
          pageSlug,
    );
    const resolvedSlug =
      normalizePageSlug(getMultiPageSlugFromHref(pageLink?.href || "") || "") ||
      pageSlug;
    const resolvedLabel = pageLink?.label || targetLabel;

    if (
      sectionsRef.current.some(
        (section) =>
          section.type === "Breadcrumb" &&
          normalizePageSlug(section.page || "") === resolvedSlug,
      )
    ) {
      setCurrentPage(resolvedLabel);
      return `Breadcrumb already exists on "${resolvedLabel}".`;
    }

    const breadcrumbVariant = "Breadcrumb-1";
    const previewData =
      resolveLayoutPreview(breadcrumbVariant, categoryRef.current)?.data || {};
    const breadcrumbSection: SectionItem = {
      id: `Breadcrumb-${resolvedSlug}`,
      page: resolvedSlug,
      type: "Breadcrumb",
      variant: breadcrumbVariant,
      data: {
        [breadcrumbVariant]: {
          ...(previewData as Record<string, unknown>),
          title: resolvedLabel,
          homeLabel: "Home",
        } as SectionData,
      },
    };

    const sourceSections = sectionsRef.current;
    const pageBodyIndex = sourceSections.findIndex((section) => {
      if (section.type === "Breadcrumb") return false;
      if (normalizePageSlug(section.page || "") === resolvedSlug) return true;
      // Fallback: custom page body whose title matches the label.
      const data =
        (section.data?.[section.variant] as Record<string, unknown> | undefined) ||
        {};
      const title =
        typeof data.title === "string" ? data.title.trim().toLowerCase() : "";
      return title === resolvedLabel.trim().toLowerCase();
    });

    let nextSections: SectionItem[];
    if (pageBodyIndex >= 0) {
      const body = sourceSections[pageBodyIndex];
      // Ensure the body is page-scoped so the breadcrumb stays visible with it.
      const scopedBody =
        normalizePageSlug(body.page || "") === resolvedSlug
          ? body
          : { ...body, page: resolvedSlug };
      nextSections = ensureUniqueSectionIds([
        ...sourceSections.slice(0, pageBodyIndex),
        breadcrumbSection,
        scopedBody,
        ...sourceSections.slice(pageBodyIndex + 1),
      ]);
    } else {
      const footerIndex = sourceSections.findIndex(
        (section) => section.type === "Footer",
      );
      nextSections =
        footerIndex === -1
          ? ensureUniqueSectionIds([...sourceSections, breadcrumbSection])
          : ensureUniqueSectionIds([
              ...sourceSections.slice(0, footerIndex),
              breadcrumbSection,
              ...sourceSections.slice(footerIndex),
            ]);
    }

    urgentAutosaveRef.current = true;
    sectionsRef.current = nextSections;
    setSections(nextSections);
    setCurrentPage(resolvedLabel);
    return `Added breadcrumb to "${resolvedLabel}".`;
  };

  // Capture-phase: handle breadcrumb/delete batches before any stale bubble listener.
  useEffect(() => {
    const handleFreshApply = (event: Event) => {
      const detail = (
        event as CustomEvent<{ actions?: Array<Record<string, unknown>> }>
      ).detail;
      const actions = Array.isArray(detail?.actions) ? detail.actions : [];
      const mutating = actions.filter((action) => {
        const type = typeof action.type === "string" ? action.type : "";
        return Boolean(type) && type !== "ask";
      });
      if (!mutating.length) return;
      const onlyBreadcrumb = mutating.every(
        (action) => action.type === "addBreadcrumb",
      );
      const onlyDelete = mutating.every(
        (action) => action.type === "deletePage",
      );
      if (!onlyBreadcrumb && !onlyDelete) return;

      event.stopImmediatePropagation();
      setAiApplyLabel(onlyDelete ? "Deleting page" : "Adding breadcrumb");
      setAiApplyBusy(true);
      const startedAt = Date.now();
      const notes: string[] = [];
      let applyOk = true;
      try {
        for (const action of mutating) {
          if (action.type === "deletePage") {
            notes.push(applyDeletePageRef.current(action));
          } else {
            notes.push(applyAddBreadcrumbRef.current(action));
          }
        }
      } catch (error) {
        applyOk = false;
        notes.push(
          error instanceof Error
            ? `Apply failed: ${error.message}`
            : "Apply failed unexpectedly.",
        );
      } finally {
        window.dispatchEvent(
          new CustomEvent("ai-builder-ai-action-result", {
            detail: {
              ok: applyOk,
              message: notes.filter(Boolean).join(" ") || "Done.",
            },
          }),
        );
        const waitMs = Math.max(0, 700 - (Date.now() - startedAt));
        window.setTimeout(() => setAiApplyBusy(false), waitMs);
      }
    };

    window.addEventListener(
      "ai-builder-ai-apply-actions",
      handleFreshApply,
      true,
    );
    return () => {
      window.removeEventListener(
        "ai-builder-ai-apply-actions",
        handleFreshApply,
        true,
      );
    };
  }, []);

  // AI Assist command bus (chat â†’ editor actions)
  useEffect(() => {
    const emitResult = (ok: boolean, message: string) => {
      window.dispatchEvent(
        new CustomEvent("ai-builder-ai-action-result", {
          detail: { ok, message },
        }),
      );
    };

    const sanitizeSectionData = (value: unknown): Record<string, unknown> => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return {};

      const sanitizeValue = (raw: unknown, depth: number): unknown => {
        if (typeof raw === "string") {
          if (raw.startsWith("data:") && raw.length > 400) {
            return "[binary-omitted]";
          }
          // Keep image paths/URLs long enough so AI can preserve them.
          if (
            /^https?:\/\//i.test(raw) ||
            raw.startsWith("/") ||
            raw.startsWith("blob:")
          ) {
            return raw.length > 900 ? `${raw.slice(0, 900)}â€¦` : raw;
          }
          const max = depth <= 1 ? 500 : 280;
          return raw.length > max ? `${raw.slice(0, max)}â€¦` : raw;
        }
        if (
          typeof raw === "number" ||
          typeof raw === "boolean" ||
          raw == null
        ) {
          return raw;
        }
        if (Array.isArray(raw)) {
          if (depth >= 5) return [];
          const limit = depth === 0 ? 16 : 32;
          return raw.slice(0, limit).map((item) => {
            if (!item || typeof item !== "object" || Array.isArray(item)) {
              return item;
            }
            const slim: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(
              item as Record<string, unknown>,
            )) {
              const next = sanitizeValue(v, depth + 1);
              if (next !== undefined) slim[k] = next;
            }
            return slim;
          });
        }
        return undefined;
      };

      const source = value as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [key, raw] of Object.entries(source)) {
        const next = sanitizeValue(raw, 0);
        if (next !== undefined) out[key] = next;
      }
      return out;
    };

    const resolveSection = (hint?: string) => {
      const items = sectionsRef.current;
      const raw = (hint || "").trim().toLowerCase();
      if (!raw) {
        return (
          items.find(
            (section) =>
              !["Header", "Topbar", "Footer", "Breadcrumb"].includes(section.type),
          ) || items[0]
        );
      }

      // Exact id / type match first (home-language patches use section ids).
      const exact =
        items.find(
          (section) => (section.id ?? section.type).toLowerCase() === raw,
        ) ||
        items.find((section) => section.type.toLowerCase() === raw) ||
        items.find((section) => section.variant.toLowerCase() === raw);
      if (exact) return exact;

      const aliases: Array<{ type: string; keys: string[] }> = [
        { type: "Banner", keys: ["banner", "hero", "slider", "home banner"] },
        { type: "About", keys: ["about", "about us", "company"] },
        { type: "Product", keys: ["product", "service", "services"] },
        { type: "WhyChooseUs", keys: ["why", "why choose", "choose us", "whychooseus"] },
        { type: "Gallery", keys: ["gallery", "photos", "images gallery"] },
        { type: "FormDetail", keys: ["form", "lead form", "contact form"] },
        { type: "FAQ", keys: ["faq", "question", "questions"] },
        {
          type: "Testimonial",
          keys: ["testimonial", "review", "reviews", "client", "clients"],
        },
        {
          type: "CustomSection",
          keys: ["custom", "cta", "cta card", "custom section"],
        },
        {
          type: "CountriesServe",
          keys: [
            "countries",
            "countries serve",
            "countries we serve",
            "countries section",
          ],
        },
        { type: "Features", keys: ["features", "feature"] },
        { type: "Highlight", keys: ["highlight"] },
        { type: "Featured", keys: ["featured"] },
        { type: "LatestProject", keys: ["latestproject", "latest project", "projects"] },
        { type: "Cities", keys: ["cities", "city"] },
        { type: "FeaturedDev", keys: ["featureddev", "featured dev", "developers"] },
        { type: "Process", keys: ["process"] },
        { type: "Awards", keys: ["awards", "award"] },
        { type: "Stats", keys: ["stats", "statistics"] },
        { type: "Blog", keys: ["blog", "blogs"] },
        { type: "Contact", keys: ["contact"] },
        {
          type: "InvestmentOpportunities",
          keys: ["investmentopportunities", "investment", "opportunities"],
        },
        { type: "Header", keys: ["header", "navbar", "menu", "nav"] },
        { type: "Footer", keys: ["footer"] },
        { type: "Topbar", keys: ["topbar", "top bar"] },
      ];

      const match = aliases.find((entry) =>
        entry.keys.some((key) => raw === key || raw.includes(key)),
      );
      if (match) {
        return items.find((section) => section.type === match.type);
      }

      return items.find((section) => {
        const id = (section.id ?? section.type).toLowerCase();
        return (
          id.includes(raw) ||
          section.type.toLowerCase().includes(raw) ||
          section.variant.toLowerCase().includes(raw)
        );
      });
    };

    const nextVariantFor = (sectionType: string, current: string) => {
      const pools: Record<string, string[]> = {
        Banner: ["Banner-1", "Banner-2", "Banner-3", "Banner-4"],
        About: ["About-1", "About-2"],
        Product: ["Product-1", "Product-2", "Product-3"],
        Gallery: ["Gallery-1", "Gallery-2"],
        FormDetail: ["FormDetail-1", "FormDetail-2", "FormDetail-3"],
        FAQ: ["FAQ-1", "FAQ-2"],
        Testimonial: ["Testimonial-1", "Testimonial-2"],
        WhyChooseUs: ["WhyChooseUs-1", "WhyChooseUs-2"],
        Header: ["Header-1", "Header-2"],
        Footer: ["Footer-1"],
      };
      const list = pools[sectionType] || [];
      if (!list.length) return null;
      const index = list.indexOf(current);
      return list[(index + 1) % list.length] || list[0];
    };

    const handleQuery = (event?: Event) => {
      const detail = (
        event as CustomEvent<{ pageLabel?: string; allPages?: boolean }> | undefined
      )?.detail;
      const requestedPage = normalizePageSlug(detail?.pageLabel || "");
      const includeAllPages = detail?.allPages === true;
      const viewPage = requestedPage || normalizePageSlug(editorViewPageRef.current || "home");
      const currentPageLink = flattenPageLinks(pageLinksRef.current).find(
        (link) => normalizePageSlug(link.label) === viewPage,
      );
      const pageScopedSlug = getMultiPageSlugFromHref(
        currentPageLink?.href || "",
      );
      const currentPageSlug =
        pageScopedSlug ||
        (isSinglePageTemplateRef.current ? "home" : viewPage) ||
        "home";
      const shellTypes = new Set(["Topbar", "Header", "Footer"]);
      const scopedSource = includeAllPages
        ? sectionsRef.current
        : currentPageSlug && currentPageSlug !== "home"
          ? sectionsRef.current.filter(
              (section) =>
                shellTypes.has(section.type) ||
                normalizePageSlug(section.page || "") === currentPageSlug,
            )
          : sectionsRef.current.filter((section) => !section.page);

      const sections = scopedSource.map((section) => {
        const data = sanitizeSectionData(section.data?.[section.variant]);
        const editableFields = Object.keys(data);
        const itemShapes: Record<string, string[]> = {};
        for (const [key, value] of Object.entries(data)) {
          if (
            Array.isArray(value) &&
            value[0] &&
            typeof value[0] === "object" &&
            !Array.isArray(value[0])
          ) {
            itemShapes[key] = Object.keys(value[0] as Record<string, unknown>);
          }
        }
        return {
          id: section.id ?? section.type,
          type: section.type,
          variant: section.variant,
          page: section.page || null,
          data,
          editableFields,
          itemShapes,
        };
      });
      window.dispatchEvent(
        new CustomEvent("ai-builder-ai-sections-state", {
          detail: {
            sections,
            currentPage: currentPageSlug,
            themeVariables: templateVariablesRef.current || {},
          },
        }),
      );
    };

    const applyPatch = (
      hint: string | undefined,
      fields: Record<string, unknown> | undefined,
    ) => {
      const section = resolveSection(hint);
      if (!section) return "Section not found for update.";
      if (!fields || typeof fields !== "object") return "Patch fields missing.";
      const sectionId = section.id ?? section.type;
      const current =
        (section.data?.[section.variant] as Record<string, unknown> | undefined) ||
        {};

      // Normalize AI field aliases â†’ editor legacy fields.
      const mapped: Record<string, unknown> = { ...fields };
      if (typeof mapped.heading === "string" && mapped.title == null) {
        mapped.title = mapped.heading;
      }
      if (typeof mapped.paragraph === "string" && mapped.desc == null) {
        mapped.desc = mapped.paragraph;
      }
      if (typeof mapped.description === "string" && mapped.desc == null) {
        mapped.desc = mapped.description;
      }
      if (typeof mapped.subtitle === "string" && mapped.pretitle == null) {
        mapped.pretitle = mapped.subtitle;
      }
      // Some About/page sections render desc1 instead of desc â€” always mirror.
      if (typeof mapped.desc === "string" && mapped.desc1 == null) {
        mapped.desc1 = mapped.desc;
      }
      if (typeof mapped.tagline === "string" && mapped.pretitle == null) {
        mapped.pretitle = mapped.tagline;
      }
      const buttonLabel =
        typeof mapped.buttonLabel === "string" && mapped.buttonLabel.trim()
          ? mapped.buttonLabel.trim()
          : null;
      delete mapped.heading;
      delete mapped.paragraph;
      delete mapped.description;
      delete mapped.tagline;
      delete mapped.buttonLabel;
      const rebuildBlocksFromItems = mapped.__rebuildBlocksFromItems === true;
      delete mapped.__rebuildBlocksFromItems;

      const nextData: Record<string, unknown> = {
        ...current,
        ...mapped,
      };

      if (
        rebuildBlocksFromItems &&
        (Array.isArray(mapped.productItems) ||
          Array.isArray(mapped.serviceSlides) ||
          Array.isArray(mapped.productSlides))
      ) {
        // Stored card blocks win over productItems in the renderer â€” clear so
        // resolveSectionBlocks rebuilds cards from the translated items/slides.
        delete nextData.blocks;
      }

      if (buttonLabel) {
        const existingButtons = Array.isArray(nextData.buttons)
          ? (nextData.buttons as Array<Record<string, unknown>>)
          : [];
        if (existingButtons.length) {
          nextData.buttons = existingButtons.map((button, index) => {
            if (index !== 0 || !button || typeof button !== "object") {
              return button;
            }
            return { ...button, label: buttonLabel };
          });
        } else {
          nextData.buttons = [
            { label: buttonLabel, href: "#", variant: "primary" },
          ];
        }

        if (Array.isArray(nextData.bannerSlides) && nextData.bannerSlides.length) {
          nextData.bannerSlides = (
            nextData.bannerSlides as Array<Record<string, unknown>>
          ).map((slide) => {
            if (!slide || typeof slide !== "object") return slide;
            const button =
              slide.button && typeof slide.button === "object"
                ? { ...(slide.button as Record<string, unknown>), label: buttonLabel }
                : { label: buttonLabel, href: "#" };
            return { ...slide, button };
          });
        }

        // CustomSection CTA buttons live in columns[].elements[].value
        if (
          section.type === "CustomSection" &&
          Array.isArray(nextData.columns)
        ) {
          let customButtonTouched = false;
          nextData.columns = (
            nextData.columns as Array<Record<string, unknown>>
          ).map((column) => {
            if (!column || typeof column !== "object") return column;
            const elements = Array.isArray(column.elements)
              ? (column.elements as Array<Record<string, unknown>>)
              : [];
            if (!elements.length) return column;
            return {
              ...column,
              elements: elements.map((element) => {
                if (
                  customButtonTouched ||
                  !element ||
                  typeof element !== "object" ||
                  element.type !== "button"
                ) {
                  return element;
                }
                customButtonTouched = true;
                return { ...element, value: buttonLabel };
              }),
            };
          });
        }
      }

      // Banner/About etc. often keep a `blocks` array that wins over title/desc.
      // Sync text/image blocks so the canvas actually shows the AI patch.
      if (Array.isArray(nextData.blocks)) {
        const blocks = structuredClone(nextData.blocks) as Array<
          Record<string, unknown>
        >;
        let touched = false;
        let buttonTouched = false;
        for (const block of blocks) {
          if (block.type === "text") {
            if (
              block.role === "pretitle" &&
              typeof mapped.pretitle === "string"
            ) {
              block.content = mapped.pretitle;
              touched = true;
            }
            if (block.role === "heading" && typeof mapped.title === "string") {
              block.content = mapped.title;
              touched = true;
            }
            if (
              block.role === "subheading" &&
              typeof mapped.subtitle === "string"
            ) {
              block.content = mapped.subtitle;
              touched = true;
            }
            if (
              (block.role === "paragraph" || block.role === "paragraph-secondary") &&
              typeof mapped.desc === "string" &&
              block.role === "paragraph"
            ) {
              block.content = mapped.desc;
              touched = true;
            }
            if (
              block.role === "paragraph-secondary" &&
              typeof mapped.desc2 === "string"
            ) {
              block.content = mapped.desc2;
              touched = true;
            }
          }
          if (block.type === "button" && buttonLabel && !buttonTouched) {
            block.label = buttonLabel;
            buttonTouched = true;
            touched = true;
          }
          if (
            block.type === "image" &&
            (block.role === "background" || !block.role) &&
            typeof mapped.backgroundImage === "string"
          ) {
            block.src = mapped.backgroundImage;
            touched = true;
          }
          if (
            block.type === "image" &&
            block.role === "side" &&
            typeof mapped.sideImage === "string"
          ) {
            block.src = mapped.sideImage;
            touched = true;
          }
          if (block.type === "logo" && typeof mapped.logo === "string") {
            block.text = mapped.logo;
            touched = true;
          }
        }
        // If desc was requested but no paragraph block existed, inject it or nuke blocks.
        const descRequested = typeof mapped.desc === "string";
        const descApplied = blocks.some(
          (b) => b.type === "text" && b.role === "paragraph" && b.content === mapped.desc,
        );
        if (descRequested && !descApplied) {
          // Try to find any text block without a strict role to use as paragraph
          const fallbackBlock = blocks.find(
            (b) => b.type === "text" && !b.role,
          );
          if (fallbackBlock) {
            fallbackBlock.content = mapped.desc;
            fallbackBlock.role = "paragraph";
            touched = true;
          } else {
            // Force rebuild from flat fields
            delete nextData.blocks;
          }
        }
        if (touched && nextData.blocks) {
          nextData.blocks = blocks;
        } else if (
          !touched && (
          mapped.title != null ||
          mapped.pretitle != null ||
          mapped.desc != null ||
          mapped.subtitle != null ||
          mapped.backgroundImage != null ||
          mapped.sideImage != null ||
          buttonLabel != null)
        ) {
          // Fall back to legacy fields so resolveSectionBlocks rebuilds text/images.
          delete nextData.blocks;
        }
      } else if (buttonLabel) {
        delete nextData.blocks;
      }

      // Real-estate slider banners render from bannerSlides[].image, not backgroundImage.
      if (
        section.type === "Banner" &&
        typeof mapped.backgroundImage === "string" &&
        mapped.backgroundImage.trim() &&
        Array.isArray(nextData.bannerSlides) &&
        nextData.bannerSlides.length
      ) {
        const img = mapped.backgroundImage.trim();
        const hasSlideIndex =
          typeof mapped.imageItemIndex === "number" &&
          Number.isFinite(mapped.imageItemIndex);
        const targetIndex = hasSlideIndex
          ? Math.max(0, Math.floor(mapped.imageItemIndex as number))
          : null;
        nextData.bannerSlides = (
          nextData.bannerSlides as Array<Record<string, unknown>>
        ).map((slide, index) => {
          if (!slide || typeof slide !== "object") return slide;
          if (targetIndex != null && index !== targetIndex) return slide;
          return { ...slide, image: img };
        });
        if (hasSlideIndex) delete mapped.imageItemIndex;
      }

      // Product / card sections: backgroundImage alias â†’ selected card/slide image
      if (
        (section.type === "Product" || section.type === "Service") &&
        typeof mapped.backgroundImage === "string" &&
        mapped.backgroundImage.trim()
      ) {
        const img = mapped.backgroundImage.trim();
        const targetIndex =
          typeof mapped.imageItemIndex === "number" &&
          Number.isFinite(mapped.imageItemIndex)
            ? Math.max(0, Math.floor(mapped.imageItemIndex as number))
            : 0;
        delete mapped.imageItemIndex;

        const patchSlideArrays = (key: string) => {
          const live = Array.isArray(current[key])
            ? current[key]
            : nextData[key];
          if (!Array.isArray(live)) return;
          nextData[key] = (live as Array<Record<string, unknown>>).map(
            (slide, index) =>
              index === targetIndex && slide && typeof slide === "object"
                ? { ...slide, image: img }
                : slide,
          );
        };
        patchSlideArrays("serviceSlides");
        patchSlideArrays("productSlides");
        patchSlideArrays("productItems");

        const liveBlocks = Array.isArray(current.blocks)
          ? (current.blocks as Array<Record<string, unknown>>)
          : Array.isArray(nextData.blocks)
            ? (nextData.blocks as Array<Record<string, unknown>>)
            : null;

        if (liveBlocks && liveBlocks.length) {
          let cardOrdinal = -1;
          nextData.blocks = liveBlocks.map((block) => {
            if (!block || typeof block !== "object" || block.type !== "card") {
              return block;
            }
            cardOrdinal += 1;
            if (cardOrdinal !== targetIndex) return block;
            return { ...block, image: img };
          });
        } else if (!Array.isArray(nextData.productItems)) {
          nextData.productItems = [
            {
              title: "Primary",
              category: "",
              desc: "",
              image: img,
            },
          ];
        }
      }

      // When AI sends slim blocks with card images, merge onto LIVE blocks only
      if (Array.isArray(mapped.blocks) && Array.isArray(current.blocks)) {
        const incoming = mapped.blocks as Array<Record<string, unknown>>;
        const targetIndex =
          typeof mapped.imageItemIndex === "number" &&
          Number.isFinite(mapped.imageItemIndex)
            ? Math.max(0, Math.floor(mapped.imageItemIndex as number))
            : 0;
        let firstCardImage: string | null = null;
        for (const block of incoming) {
          if (
            block &&
            block.type === "card" &&
            typeof block.image === "string" &&
            block.image.trim()
          ) {
            firstCardImage = block.image.trim();
            break;
          }
        }
        if (firstCardImage) {
          let cardOrdinal = -1;
          nextData.blocks = (
            current.blocks as Array<Record<string, unknown>>
          ).map((block) => {
            if (!block || typeof block !== "object") return block;
            if (block.type !== "card") return block;
            cardOrdinal += 1;
            if (cardOrdinal !== targetIndex) return block;
            return { ...block, image: firstCardImage };
          });
        }
      }

      // CustomSection: title/desc live in heading/text widgets inside columns
      if (
        section.type === "CustomSection" &&
        Array.isArray(nextData.columns) &&
        (typeof mapped.title === "string" || typeof mapped.desc === "string")
      ) {
        let headingTouched = false;
        let textTouched = false;
        nextData.columns = (
          nextData.columns as Array<Record<string, unknown>>
        ).map((column) => {
          if (!column || typeof column !== "object") return column;
          const elements = Array.isArray(column.elements)
            ? (column.elements as Array<Record<string, unknown>>)
            : [];
          if (!elements.length) return column;
          return {
            ...column,
            elements: elements.map((element) => {
              if (!element || typeof element !== "object") return element;
              if (
                !headingTouched &&
                element.type === "heading" &&
                typeof mapped.title === "string"
              ) {
                headingTouched = true;
                return { ...element, value: mapped.title };
              }
              if (
                !textTouched &&
                element.type === "text" &&
                typeof mapped.desc === "string"
              ) {
                textTouched = true;
                const desc = mapped.desc;
                const wrapped = /<p[\s>]/i.test(desc)
                  ? desc
                  : `<p style="margin:0;font-size:1.05rem;line-height:1.7;">${desc}</p>`;
                return { ...element, value: wrapped };
              }
              return element;
            }),
          };
        });
      }

      // Slider banners: when flat fields patch without bannerSlides, sync ALL slides.
      if (
        Array.isArray(nextData.bannerSlides) &&
        !Array.isArray(mapped.bannerSlides) &&
        (typeof mapped.title === "string" ||
          typeof mapped.desc === "string" ||
          typeof mapped.pretitle === "string" ||
          typeof mapped.subtitle === "string")
      ) {
        nextData.bannerSlides = (
          nextData.bannerSlides as Array<Record<string, unknown>>
        ).map((slide) => {
          if (!slide || typeof slide !== "object") return slide;
          return {
            ...slide,
            ...(typeof mapped.title === "string" ? { title: mapped.title } : {}),
            ...(typeof mapped.desc === "string" ? { desc: mapped.desc } : {}),
            ...(typeof mapped.pretitle === "string"
              ? { pretitle: mapped.pretitle }
              : typeof mapped.subtitle === "string"
                ? { pretitle: mapped.subtitle }
                : {}),
          };
        });
      }

      if (
        section.type === "CustomSection" &&
        Array.isArray(nextData.columns)
      ) {
        const liveColumns = Array.isArray(current.columns)
          ? (current.columns as CustomSectionColumnRecord[])
          : [];
        // Full look/layout redesigns replace structure â€” do not re-inject old images.
        const isFullRedesign =
          typeof mapped.designLookId === "string" ||
          (typeof mapped.layout === "string" &&
            mapped.layout !== String(current.layout || ""));
        const patchedColumns = isFullRedesign
          ? (nextData.columns as CustomSectionColumnRecord[])
          : preserveCustomSectionImages(
              liveColumns,
              nextData.columns as CustomSectionColumnRecord[],
            );
        nextData.columns = normalizeCustomSectionColumns(patchedColumns);
      }

      aiEditorActionsRef.current.updateSectionData(sectionId, {
        [section.variant]: nextData as never,
      });
      bumpSectionRenderEpoch(sectionId);

      const faqCount = Array.isArray(mapped.faqItems)
        ? (mapped.faqItems as unknown[]).length
        : null;

      // Scroll section into view so the user can see the change.
      window.setTimeout(() => {
        const anchorGuess: Record<string, string> = {
          Banner: "home",
          About: "about",
          Product: "products",
          Gallery: "gallery",
          FAQ: "faq",
          Testimonial: "testimonials",
          FormDetail: "contact",
          WhyChooseUs: "whychooseus",
        };
        const guess = anchorGuess[section.type];
        const el =
          (guess
            ? document.getElementById(guess) ||
              document.querySelector(`[data-section-id="${guess}"]`)
            : null) ||
          document.querySelector(`[data-section-id="${sectionId}"]`) ||
          document.getElementById(sectionId);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);

      if (faqCount != null) {
        return `FAQ updated (${faqCount} questions).`;
      }

      const changedBits = [
        typeof mapped.title === "string" ? `title: "${mapped.title}"` : null,
        typeof mapped.pretitle === "string"
          ? `pretitle: "${mapped.pretitle}"`
          : null,
        typeof mapped.desc === "string" ? `desc updated` : null,
        typeof mapped.backgroundImage === "string" ? `image updated` : null,
        typeof mapped.sideImage === "string" ? `side image updated` : null,
        buttonLabel ? `button: "${buttonLabel}"` : null,
      ].filter(Boolean);

      return changedBits.length
        ? `${section.type} updated (${changedBits.join(", ")}).`
        : `${section.type} content updated.`;
    };

    const applyLayout = (hint?: string, variant?: string) => {
      const section = resolveSection(hint);
      if (!section) return "Section not found for layout change.";
      const sectionId = section.id ?? section.type;
      const next =
        variant || nextVariantFor(section.type, section.variant) || null;
      if (!next || next === section.variant) {
        return `No other layout found for ${section.type}.`;
      }
      aiEditorActionsRef.current.updateSectionVariant(sectionId, next);
      return `${section.type} layout ${section.variant} â†’ ${next}.`;
    };

    const applyAdd = (
      sectionType?: string,
      variant?: string,
      afterSectionHint?: string,
    ) => {
      const type = sectionType?.trim();
      if (!type) return "Which section should I add?";
      const items = sectionsRef.current;
      const hint = (afterSectionHint || "").trim();

      let anchor: string | undefined;
      if (hint && hint.toLowerCase() !== "end") {
        const target =
          items.find(
            (section) =>
              (section.id ?? section.type) === hint ||
              section.type.toLowerCase() === hint.toLowerCase(),
          ) || resolveSection(hint);
        if (target) {
          anchor = target.id ?? target.type;
        }
      }

      if (!anchor) {
        const footerIndex = items.findIndex(
          (section) => section.type === "Footer",
        );
        anchor =
          footerIndex > 0
            ? items[footerIndex - 1].id ?? items[footerIndex - 1].type
            : items[items.length - 1]?.id ?? items[items.length - 1]?.type;
      }

      if (!anchor) return "Could not add section.";
      aiEditorActionsRef.current.addSectionAfter(anchor, type, variant);
      return `${type} Ready section added.`;
    };

    const applyDelete = (hint?: string) => {
      const section = resolveSection(hint);
      if (!section) return "Section not found to delete.";
      if (["Header", "Topbar", "Footer"].includes(section.type)) {
        return `${section.type} cannot be deleted.`;
      }
      aiEditorActionsRef.current.deleteSection(section.id ?? section.type);
      return `${section.type} section deleted.`;
    };

    const applyMove = (hint?: string, direction?: "up" | "down") => {
      const section = resolveSection(hint);
      if (!section) return "Section not found to move.";
      aiEditorActionsRef.current.moveSection(
        section.id ?? section.type,
        direction === "down" ? 1 : -1,
      );
      return `${section.type} moved ${direction === "down" ? "down" : "up"}.`;
    };

    const uniqueAiBlogSlug = (
      links: EditorPageLink[],
      baseSlug: string,
    ): string => {
      let slug = baseSlug || "post";
      let suffix = 2;
      while (
        flattenPageLinks(links).some(
          (page) => page.href === `#page-blog-${slug}`,
        )
      ) {
        slug = `${baseSlug || "post"}-${suffix++}`;
      }
      return slug;
    };

    const applyAddMasterItems = (
      master?: string,
      rawItems?: Array<Record<string, unknown>>,
      headerSubmenu?: boolean,
      headerSubmenuMode?: "name" | "category" | "type",
      headerSubmenuMerge?: "new" | "before" | "after" | "skip" | "mix" | "replace",
    ) => {
      const kind =
        master === "blog" ||
        master === "service" ||
        master === "gallery" ||
        master === "team" ||
        master === "portfolio" ||
        master === "event" ||
        master === "property" ||
        master === "country"
          ? master
          : null;
      if (!kind) return "Unknown master page type.";

      const items = (Array.isArray(rawItems) ? rawItems : [])
        .map((row) => {
          const title =
            typeof row.title === "string" ? row.title.trim() : "";
          if (!title) return null;
          const desc = typeof row.desc === "string" ? row.desc.trim() : "";
          const category =
            typeof row.category === "string" ? row.category.trim() : "";
          const propertyType =
            typeof row.propertyType === "string"
              ? row.propertyType.trim()
              : "";
          const seoTitle =
            typeof row.seoTitle === "string" ? row.seoTitle.trim() : "";
          const seoDescription =
            typeof row.seoDescription === "string"
              ? row.seoDescription.trim()
              : "";
          const seoKeywords =
            typeof row.seoKeywords === "string"
              ? row.seoKeywords.trim()
              : "";
          return {
            title,
            desc,
            content:
              typeof row.content === "string" ? row.content.trim() : "",
            author:
              typeof row.author === "string" ? row.author.trim() : "",
            category,
            propertyType,
            image:
              typeof row.image === "string" && row.image.trim()
                ? row.image.trim()
                : "/bg1.jpg",
            seoTitle: seoTitle || title,
            seoDescription:
              seoDescription ||
              desc ||
              `Learn more about ${title}.`,
            seoKeywords:
              seoKeywords ||
              [title, category].filter(Boolean).join(", "),
          };
        })
        .filter(Boolean)
        .slice(0, 50) as Array<{
        title: string;
        desc: string;
        content: string;
        author: string;
        category: string;
        propertyType: string;
        image: string;
        seoTitle: string;
        seoDescription: string;
        seoKeywords: string;
      }>;

      if (!items.length) return "No master items to add.";

      const cat = categoryRef.current;
      urgentAutosaveRef.current = true;

      const submenuMode = headerSubmenuMode || "name";
      const rawMerge = headerSubmenuMerge || "after";
      const submenuMerge =
        rawMerge === "mix"
          ? "after"
          : rawMerge === "replace"
            ? "new"
            : rawMerge;

      const withHeaderSubmenuIfNeeded = (
        sections: SectionItem[],
        masterKind:
          | "blog"
          | "service"
          | "team"
          | "portfolio"
          | "event"
          | "property",
        submenuItems: Array<{
          title: string;
          slug: string;
          category?: string;
          propertyType?: string;
        }>,
      ) => {
        if (!headerSubmenu || submenuMerge === "skip") return sections;
        if (!submenuItems.length) return sections;
        return applyMasterHeaderSubmenu(sections, masterKind, submenuItems, {
          mode: submenuMode,
          merge: submenuMerge,
        });
      };

      const syncHeaderSubmenuIfNeeded = (
        masterKind:
          | "blog"
          | "service"
          | "team"
          | "portfolio"
          | "event"
          | "property",
        submenuItems: Array<{
          title: string;
          slug: string;
          category?: string;
          propertyType?: string;
        }>,
      ) => {
        if (!headerSubmenu || submenuMerge === "skip") return;
        if (!submenuItems.length) return;
        setSections((current) =>
          withHeaderSubmenuIfNeeded(current, masterKind, submenuItems),
        );
      };

      if (kind === "blog") {
        setPageLinks((current) => {
          let next = [...current];
          const flat = flattenPageLinks(next);
          const hasBlogPosts = flat.some((page) => page.kind === "blog");
          const hasBlogsNavigation = flat.some(
            (page) =>
              page.kind === "blogIndex" ||
              (page.kind !== "blog" &&
                (page.href.trim().toLowerCase() === "#page-blogs" ||
                  page.label.trim().toLowerCase() === "blogs")),
          );
          if (!hasBlogPosts && !hasBlogsNavigation) {
            next = [
              ...next,
              {
                label: "Blogs",
                href: "#page-blogs",
                kind: "blogIndex" as const,
                layout: "BlogIndex-1",
              },
            ];
          }
          const blogSubmenuItems: Array<{
            title: string;
            slug: string;
            category?: string;
          }> = [];
          for (const item of items) {
            const baseSlug =
              createPageSlug(item.title) ||
              item.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "") ||
              "post";
            const slug = uniqueAiBlogSlug(next, baseSlug);
            blogSubmenuItems.push({
              title: item.title,
              slug,
              category: item.category || "General",
            });
            next = [
              ...next,
              {
                label: item.title,
                href: `#page-blog-${slug}`,
                kind: "blog" as const,
                slug,
                layout: "BlogPage-1",
                author: item.author || "Website author",
                image: item.image,
                shortDescription:
                  item.desc || `A short intro for ${item.title}.`,
                longDescription:
                  item.content ||
                  `Write the full blog content for ${item.title}.`,
                category: item.category || "General",
                createdAt: new Date().toISOString(),
                seoTitle: item.seoTitle || item.title,
                seoDescription:
                  item.seoDescription ||
                  item.desc ||
                  `A short intro for ${item.title}.`,
                seoKeywords:
                  item.seoKeywords ||
                  [item.title, item.category || "General"].join(", "),
              },
            ];
          }
          if (headerSubmenu && submenuMerge !== "skip" && blogSubmenuItems.length) {
            queueMicrotask(() => {
              setSections((secs) =>
                applyMasterHeaderSubmenu(secs, "blog", blogSubmenuItems, {
                  mode: submenuMode,
                  merge: submenuMerge,
                }),
              );
            });
          }
          return next;
        });
        setCurrentPage("Blogs");
        return `Added ${items.length} blog post(s).`;
      }

      if (kind === "service") {
        setPageLinks((current) => {
          const hasServicesLink = flattenPageLinks(current).some((link) => {
            const href = link.href.trim().toLowerCase();
            const label = link.label.trim().toLowerCase();
            return (
              href === "#page-service" ||
              href === "#page-services" ||
              label === "services" ||
              label === "service"
            );
          });
          if (hasServicesLink) return current;
          return [
            ...current,
            { label: "Services", href: "#page-service" },
          ];
        });
        setSections((current) => {
          const withSection = addServicePageSection(current, cat);
          let menuItems: Array<{
            title: string;
            slug: string;
            category?: string;
          }> = [];
          const next = withSection.map((section) => {
            if (
              section.id !== "ServicePage" &&
              section.type !== "ServicePage" &&
              !(
                section.type === "Service" &&
                ["service", "services"].includes(normalizePageSlug(section.page || ""))
              )
            ) {
              return section;
            }
            const variant = section.variant || "ServicePage-1";
            const currentData =
              (section.data[variant] as SectionData | undefined) ??
              (section.data["ServicePage-1"] as SectionData | undefined) ??
              ({} as SectionData);
            const state = buildServicePageState(currentData);
            const startOrder = state.services.length;
            const existingTitles = new Set(
              state.services.map((service) => service.title.trim().toLowerCase()),
            );
            const existingSlugs = new Set(
              state.services.map((service) =>
                (
                  service.slug ||
                  createPageSlug(service.title) ||
                  service.id
                )
                  .trim()
                  .toLowerCase(),
              ),
            );
            const added = items.map((item, index) => {
              const identity = uniqueMasterItemIdentity(
                item.title,
                existingTitles,
                existingSlugs,
                `service-${startOrder + index + 1}`,
              );
              return {
                id: `ai-service-${Date.now()}-${index}`,
                title: identity.title,
                category: item.category || "Service",
                desc: item.desc || `Brief description for ${identity.title}.`,
                content:
                  item.content ||
                  `Full details about ${identity.title}. Update this content in the editor.`,
                image: item.image,
                alt: identity.title,
                slug: identity.slug,
                order: startOrder + index + 1,
                active: true,
                layout: "",
                seoTitle: item.seoTitle || identity.title,
                seoDescription:
                  item.seoDescription ||
                  item.desc ||
                  `Brief description for ${identity.title}.`,
                seoKeywords:
                  item.seoKeywords ||
                  [identity.title, item.category || "Service"].join(", "),
              };
            });
            const allServices = [...state.services, ...added];
            menuItems = added.map((service) => ({
              title: service.title,
              slug: service.slug,
              category: service.category,
            }));
            const nextVariantData = applyServicePageStateToData(currentData, {
              ...state,
              layout: variant,
              services: allServices,
            });
            return {
              ...section,
              variant,
              data: syncSectionContentAcrossVariants(
                { ...section, variant },
                {
                  ...section.data,
                  [variant]: nextVariantData,
                  "ServicePage-1": nextVariantData,
                },
                variant,
              ),
            };
          });
          const withMenu = withHeaderSubmenuIfNeeded(next, "service", menuItems);
          sectionsRef.current = withMenu;
          queueMicrotask(() => {
            window.dispatchEvent(
              new CustomEvent("ai-builder-service-page-query"),
            );
          });
          return withMenu;
        });
        setCurrentPage("Services");
        return `Added ${items.length} service(s).`;
      }

      if (kind === "gallery") {
        setPageLinks((current) => {
          let kept = false;
          const next = current.flatMap((link) => {
            if (!isGalleryPageLink(link)) return [link];
            if (kept) return [];
            kept = true;
            return [canonicalizeGalleryPageLink(link)];
          });
          if (kept) return next;
          return [...next, { label: "Gallery", href: "#page-gallery" }];
        });
        setSections((current) => {
          const withSection = addGalleryPageSection(current, cat);
          const next = withSection.map((section) => {
            if (
              section.id !== "GalleryPage" &&
              section.type !== "GalleryPage" &&
              !(
                section.type === "Gallery" &&
                normalizePageSlug(section.page || "") === "gallery"
              )
            ) {
              return section;
            }
            const variant = section.variant || "GalleryPage-1";
            const currentData =
              (section.data[variant] as SectionData | undefined) ??
              (section.data["GalleryPage-1"] as SectionData | undefined) ??
              ({} as SectionData);
            const state = buildGalleryPageState(currentData);
            const startOrder = state.galleryItems.length;
            const added = items.map((item, index) => ({
              id: `ai-gallery-${Date.now()}-${index}`,
              title: item.title,
              category: item.category || "Gallery",
              desc: item.desc || item.title,
              image: item.image,
              alt: item.title,
              order: startOrder + index + 1,
              active: true,
            }));
            const nextVariantData = applyGalleryPageStateToData(currentData, {
              ...state,
              layout: variant,
              galleryItems: [...state.galleryItems, ...added],
            });
            return {
              ...section,
              variant,
              data: syncSectionContentAcrossVariants(
                { ...section, variant },
                {
                  ...section.data,
                  [variant]: nextVariantData,
                  "GalleryPage-1": nextVariantData,
                },
                variant,
              ),
            };
          });
          sectionsRef.current = next;
          queueMicrotask(() => {
            window.dispatchEvent(
              new CustomEvent("ai-builder-gallery-page-query"),
            );
          });
          return next;
        });
        setCurrentPage("Gallery");
        return `Added ${items.length} gallery item(s).`;
      }

      if (kind === "team") {
        setPageLinks((current) => {
          let kept = false;
          const next = current.flatMap((link) => {
            if (!isTeamPageLink(link)) return [link];
            if (kept) return [];
            kept = true;
            return [canonicalizeTeamPageLink(link)];
          });
          if (kept) return next;
          return [...next, { label: "Teams", href: "#page-teams" }];
        });
        setSections((current) => {
          const withSection = addTeamPageSection(current, cat);
          let menuItems: Array<{
            title: string;
            slug: string;
            category?: string;
          }> = [];
          const next = withSection.map((section) => {
            if (
              section.id !== "TeamPage" &&
              section.type !== "TeamPage" &&
              !(
                section.type === "Team" &&
                normalizePageSlug(section.page || "") === "teams"
              )
            ) {
              return section;
            }
            const variant = section.variant || "TeamPage-1";
            const currentData =
              (section.data[variant] as SectionData | undefined) ??
              (section.data["TeamPage-1"] as SectionData | undefined) ??
              ({} as SectionData);
            const state = buildTeamPageState(currentData);
            const startOrder = state.teamMembers.length;
            const existingTitles = new Set(
              state.teamMembers.map((member) =>
                member.title.trim().toLowerCase(),
              ),
            );
            const existingSlugs = new Set(
              state.teamMembers.map((member) =>
                (member.slug || createPageSlug(member.title) || member.id)
                  .trim()
                  .toLowerCase(),
              ),
            );
            const added = items.map((item, index) => {
              const identity = uniqueMasterItemIdentity(
                item.title,
                existingTitles,
                existingSlugs,
                `team-${startOrder + index + 1}`,
              );
              return {
                id: `ai-team-${Date.now()}-${index}`,
                title: identity.title,
                category: item.category || "Team",
                desc: item.desc || `Role overview for ${identity.title}.`,
                content: item.content || "",
                image: item.image,
                alt: identity.title,
                slug: identity.slug,
                order: startOrder + index + 1,
                active: true,
                layout: "",
                seoTitle: item.seoTitle || identity.title,
                seoDescription:
                  item.seoDescription ||
                  item.desc ||
                  `Role overview for ${identity.title}.`,
                seoKeywords:
                  item.seoKeywords ||
                  [identity.title, item.category || "Team"].join(", "),
              };
            });
            const allMembers = [...state.teamMembers, ...added];
            menuItems = added.map((member) => ({
              title: member.title,
              slug: member.slug,
              category: member.category,
            }));
            const nextVariantData = applyTeamPageStateToData(currentData, {
              ...state,
              layout: variant,
              teamMembers: allMembers,
            });
            return {
              ...section,
              variant,
              data: syncSectionContentAcrossVariants(
                { ...section, variant },
                {
                  ...section.data,
                  [variant]: nextVariantData,
                  "TeamPage-1": nextVariantData,
                },
                variant,
              ),
            };
          });
          const withMenu = withHeaderSubmenuIfNeeded(next, "team", menuItems);
          sectionsRef.current = withMenu;
          queueMicrotask(() => {
            window.dispatchEvent(
              new CustomEvent("ai-builder-team-page-query"),
            );
          });
          return withMenu;
        });
        setCurrentPage("Teams");
        return `Added ${items.length} team member(s).`;
      }

      if (kind === "portfolio") {
        const portfolioNav = resolveThemePortfolioNavLink(templateId, cat);
        setPageLinks((current) => {
          let kept = false;
          const next = current.flatMap((link) => {
            if (!isPortfolioPageLink(link)) return [link];
            if (kept) return [];
            kept = true;
            return [
              canonicalizePortfolioPageLink(link, templateId, cat),
            ];
          });
          if (kept) return next;
          return [
            ...next,
            {
              label: portfolioNav.label,
              href: portfolioNav.href,
              hidden: false,
            },
          ];
        });
        setSections((current) => {
          const withSection = addPortfolioPageSection(current, cat, templateId);
          let menuItems: Array<{
            title: string;
            slug: string;
            category?: string;
          }> = [];
          const next = withSection.map((section) => {
            if (
              section.id !== "PortfolioPage" &&
              section.type !== "PortfolioPage" &&
              !(
                section.type === "Portfolio" &&
                normalizePageSlug(section.page || "") === "portfolio"
              )
            ) {
              return section;
            }
            const variant = section.variant || "PortfolioPage-1";
            const currentData =
              (section.data[variant] as SectionData | undefined) ??
              (section.data["PortfolioPage-1"] as SectionData | undefined) ??
              ({} as SectionData);
            const state = buildPortfolioPageState(currentData);
            const startOrder = state.portfolioItems.length;
            const added = items.map((item, index) => ({
              id: `ai-portfolio-${Date.now()}-${index}`,
              title: item.title,
              category: item.category || "Portfolio",
              desc: item.desc || `Brief description for ${item.title}.`,
              content:
                item.content ||
                `Full details about ${item.title}. Update this content in the editor.`,
              image: item.image,
              alt: item.title,
              slug:
                createPageSlug(item.title) ||
                `portfolio-${startOrder + index + 1}`,
              order: startOrder + index + 1,
              active: true,
              layout: "",
              seoTitle: item.seoTitle || item.title,
              seoDescription:
                item.seoDescription ||
                item.desc ||
                `Brief description for ${item.title}.`,
              seoKeywords:
                item.seoKeywords ||
                [item.title, item.category || "Portfolio"].join(", "),
            }));
            const allItems = [...state.portfolioItems, ...added];
            menuItems = added.map((row) => ({
              title: row.title,
              slug: row.slug,
              category: row.category,
            }));
            const nextVariantData = applyPortfolioPageStateToData(currentData, {
              ...state,
              layout: variant,
              portfolioItems: allItems,
            });
            return {
              ...section,
              variant,
              data: syncSectionContentAcrossVariants(
                { ...section, variant },
                {
                  ...section.data,
                  [variant]: nextVariantData,
                  "PortfolioPage-1": nextVariantData,
                },
                variant,
              ),
            };
          });
          const withMenu = withHeaderSubmenuIfNeeded(
            next,
            "portfolio",
            menuItems,
          );
          sectionsRef.current = withMenu;
          queueMicrotask(() => {
            window.dispatchEvent(
              new CustomEvent("ai-builder-portfolio-page-query"),
            );
          });
          return withMenu;
        });
        setCurrentPage("Portfolio");
        return `Added ${items.length} portfolio item(s).`;
      }

      if (kind === "event") {
        setPageLinks((current) => {
          let kept = false;
          const next = current.flatMap((link) => {
            if (!isEventsPageLink(link)) return [link];
            if (kept) return [];
            kept = true;
            return [canonicalizeEventsPageLink(link)];
          });
          if (kept) return next;
          return [...next, { label: "Events", href: "#page-events" }];
        });
        setSections((current) => {
          const withSection = addEventPageSection(current, cat);
          let menuItems: Array<{
            title: string;
            slug: string;
            category?: string;
          }> = [];
          const next = withSection.map((section) => {
            if (
              section.id !== "EventPage" &&
              section.type !== "EventPage" &&
              !(
                section.type === "Event" &&
                normalizePageSlug(section.page || "") === "events"
              )
            ) {
              return section;
            }
            const variant = section.variant || "EventPage-1";
            const currentData =
              (section.data[variant] as SectionData | undefined) ??
              (section.data["EventPage-1"] as SectionData | undefined) ??
              ({} as SectionData);
            const state = buildEventPageState(currentData);
            const startOrder = state.events.length;
            const detailLayout =
              state.detailLayout ||
              (typeof currentData.detailLayout === "string"
                ? currentData.detailLayout
                : "EventDetail-1");
            const added = items.map((item, index) => {
              const when = new Date();
              when.setDate(when.getDate() + 7 + index);
              return {
                id: `ai-event-${Date.now()}-${index}`,
                title: item.title,
                category: item.category || "Event",
                desc: item.desc || `Join us for ${item.title}.`,
                content:
                  item.content ||
                  `Full details about ${item.title}. Update this content in the editor.`,
                image: item.image,
                alt: item.title,
                slug:
                  createPageSlug(item.title) ||
                  `event-${startOrder + index + 1}`,
                order: startOrder + index + 1,
                active: true,
                layout: detailLayout,
                seoTitle: item.seoTitle || item.title,
                seoDescription:
                  item.seoDescription ||
                  item.desc ||
                  `Join us for ${item.title}.`,
                seoKeywords:
                  item.seoKeywords ||
                  [item.title, item.category || "Event"].join(", "),
                eventDate: when.toISOString().slice(0, 10),
                eventTime: "10:00",
                eventType: "upcoming" as const,
              };
            });
            const allEvents = [...state.events, ...added];
            menuItems = added.map((row) => ({
              title: row.title,
              slug: row.slug,
              category: row.category,
            }));
            const nextVariantData = applyEventPageStateToData(currentData, {
              ...state,
              layout: variant,
              events: allEvents,
            });
            return {
              ...section,
              variant,
              data: syncSectionContentAcrossVariants(
                { ...section, variant },
                {
                  ...section.data,
                  [variant]: nextVariantData,
                  "EventPage-1": nextVariantData,
                },
                variant,
              ),
            };
          });
          const withMenu = withHeaderSubmenuIfNeeded(next, "event", menuItems);
          sectionsRef.current = withMenu;
          queueMicrotask(() => {
            window.dispatchEvent(
              new CustomEvent("ai-builder-event-page-query"),
            );
          });
          return withMenu;
        });
        setCurrentPage("Events");
        return `Added ${items.length} event(s).`;
      }

      if (kind === "country") {
        setSections((current) => {
          const withSection = addCountriesServeSection(current, cat);
          const next = withSection.map((section) => {
            if (section.type !== "CountriesServe") return section;
            const variant = section.variant || "CountriesServe-1";
            const currentData =
              (section.data[variant] as SectionData | undefined) ??
              (section.data["CountriesServe-1"] as SectionData | undefined) ??
              ({} as SectionData);
            const state = buildCountriesServeState(currentData);
            let countries = [...state.countriesServeItems];
            const withFlag = <
              T extends { name: string; flagImage?: string; flagAlt?: string },
            >(
              country: T,
            ): T => {
              if ((country.flagImage || "").trim()) return country;
              const flagImage = resolveCountryFlagImage(country.name);
              if (!flagImage) return country;
              return {
                ...country,
                flagImage,
                flagAlt: (country.flagAlt || "").trim() || country.name,
              };
            };
            const resolveCountry = (wantedRaw: string) => {
              const wanted = wantedRaw.trim();
              if (!wanted) {
                const fallback =
                  countries[0] ||
                  withFlag({
                    id: `country-ai-${Date.now()}`,
                    name: "India",
                    flagImage: "",
                    flagAlt: "India",
                    order: 1,
                    active: true,
                  });
                return withFlag(fallback);
              }
              const wantedLower = wanted.toLowerCase();
              const match = countries.find((country) => {
                const name = country.name.trim().toLowerCase();
                if (name === wantedLower) return true;
                if (wantedLower === "uk") {
                  return (
                    name === "uk" ||
                    name === "united kingdom" ||
                    name === "britain"
                  );
                }
                if (wantedLower === "usa") {
                  return (
                    name === "usa" ||
                    name === "us" ||
                    name === "united states" ||
                    name === "america"
                  );
                }
                if (wantedLower === "uae") {
                  return (
                    name === "uae" ||
                    name === "dubai" ||
                    name === "united arab emirates"
                  );
                }
                return false;
              });
              if (match) {
                const patched = withFlag(match);
                if (patched.flagImage !== match.flagImage) {
                  countries = countries.map((country) =>
                    country.id === match.id ? patched : country,
                  );
                }
                return patched;
              }
              const created = withFlag({
                id: `country-ai-${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2, 7)}`,
                name: wanted,
                flagImage: "",
                flagAlt: wanted,
                order: countries.length + 1,
                active: true,
              });
              countries = [...countries, created];
              return created;
            };
            if (!countries.length) {
              countries = [
                withFlag({
                  id: `country-ai-${Date.now()}`,
                  name: "India",
                  flagImage: "",
                  flagAlt: "India",
                  order: 1,
                  active: true,
                }),
              ];
            } else {
              countries = countries.map((country) => withFlag(country));
            }
            const startOrder = state.countriesServeListings.reduce(
              (max, item) => Math.max(max, item.order ?? 0),
              0,
            );
            const existingTitles = new Set(
              state.countriesServeListings.map((listing) =>
                listing.title.trim().toLowerCase(),
              ),
            );
            const existingSlugs = new Set(
              state.countriesServeListings.map((listing) =>
                (listing.slug || createPageSlug(listing.title) || listing.id)
                  .trim()
                  .toLowerCase(),
              ),
            );
            const added = items.map((item, index) => {
              const identity = uniqueMasterItemIdentity(
                item.title,
                existingTitles,
                existingSlugs,
                `listing-${startOrder + index + 1}`,
              );
              const matchedCountry = resolveCountry(
                item.category || "India",
              );
              return {
                id: `ai-country-listing-${Date.now()}-${index}`,
                title: identity.title,
                category: matchedCountry?.name || item.category || "Global",
                countryId: matchedCountry?.id || "",
                desc:
                  item.desc ||
                  `Local support for ${identity.title}.`,
                content:
                  item.content ||
                  `Full details about ${identity.title}. Update this content in the editor.`,
                image: item.image,
                alt: identity.title,
                link: "",
                slug: identity.slug,
                order: startOrder + index + 1,
                active: true,
                seoTitle: item.seoTitle || identity.title,
                seoDescription:
                  item.seoDescription ||
                  item.desc ||
                  `Local support for ${identity.title}.`,
                seoKeywords:
                  item.seoKeywords ||
                  [identity.title, matchedCountry?.name || "Country"].join(
                    ", ",
                  ),
              };
            });
            const nextVariantData = applyCountriesServeStateToData(
              currentData,
              {
                ...state,
                countriesServeItems: countries,
                countriesServeListings: [
                  ...state.countriesServeListings,
                  ...added,
                ],
              },
            );
            return {
              ...section,
              variant,
              data: syncSectionContentAcrossVariants(
                { ...section, variant },
                {
                  ...section.data,
                  [variant]: nextVariantData,
                  "CountriesServe-1": nextVariantData,
                },
                variant,
              ),
            };
          });
          sectionsRef.current = next;
          queueMicrotask(() => {
            window.dispatchEvent(
              new CustomEvent("ai-builder-countries-serve-query"),
            );
          });
          return next;
        });
        return `Added ${items.length} country listing(s).`;
      }

      // property
      setPageLinks((current) => {
        let kept = false;
        const next = current.flatMap((link) => {
          if (!isPropertiesPageLink(link)) return [link];
          if (kept) return [];
          kept = true;
          return [canonicalizePropertiesPageLink(link)];
        });
        if (kept) return next;
        return [...next, { label: "Properties", href: "#page-properties" }];
      });
      setSections((current) => {
        const withSection = addPropertyPageSection(current, cat);
        let menuItems: Array<{
          title: string;
          slug: string;
          category?: string;
          propertyType?: string;
        }> = [];
        const next = withSection.map((section) => {
          if (
            section.id !== "PropertyPage" &&
            section.type !== "PropertyPage" &&
            !(
              section.type === "Property" &&
              normalizePageSlug(section.page || "") === "properties"
            )
          ) {
            return section;
          }
          const variant = section.variant || "PropertyPage-1";
          const currentData =
            (section.data[variant] as SectionData | undefined) ??
            (section.data["PropertyPage-1"] as SectionData | undefined) ??
            ({} as SectionData);
          const state = buildPropertyPageState(currentData);
          const startOrder = state.properties.length;
          const detailLayout =
            state.detailLayout ||
            (typeof currentData.detailLayout === "string"
              ? currentData.detailLayout
              : "PropertyDetail-1");
          const added = items.map((item, index) => ({
            id: `ai-property-${Date.now()}-${index}`,
            title: item.title,
            category: item.category || "Residential",
            desc: item.desc || `Explore ${item.title}.`,
            content:
              item.content ||
              `Full details about ${item.title}. Update this content in the editor.`,
            image: item.image,
            alt: item.title,
            slug:
              createPageSlug(item.title) ||
              `property-${startOrder + index + 1}`,
            order: startOrder + index + 1,
            active: true,
            layout: detailLayout,
            seoTitle: item.seoTitle || item.title,
            seoDescription:
              item.seoDescription ||
              item.desc ||
              `Explore ${item.title}.`,
            seoKeywords:
              item.seoKeywords ||
              [item.title, item.category || "Residential", "property"].join(
                ", ",
              ),
            price: "Price on request",
            address: "",
            bedrooms: "3",
            bathrooms: "2",
            areaSqft: "1200",
            propertyType:
              item.propertyType ||
              item.category?.toLowerCase().replace(/\s+/g, "-") ||
              "apartment",
            listingType: "sale",
            amenities: [],
            floorPlan: "",
          }));
          const allProperties = [...state.properties, ...added];
          menuItems = added.map((row) => ({
            title: row.title,
            slug: row.slug,
            category: row.category,
            propertyType: row.propertyType,
          }));
          const nextVariantData = applyPropertyPageStateToData(currentData, {
            ...state,
            layout: variant,
            properties: allProperties,
          });
          return {
            ...section,
            variant,
            data: syncSectionContentAcrossVariants(
              { ...section, variant },
              {
                ...section.data,
                [variant]: nextVariantData,
                "PropertyPage-1": nextVariantData,
              },
              variant,
            ),
          };
        });
        const withMenu = withHeaderSubmenuIfNeeded(
          next,
          "property",
          menuItems,
        );
        sectionsRef.current = withMenu;
        queueMicrotask(() => {
          window.dispatchEvent(
            new CustomEvent("ai-builder-property-page-query"),
          );
        });
        return withMenu;
      });
      setCurrentPage("Properties");
      return `Added ${items.length} property listing(s).`;
    };

    const applyRenameCountry = (fromRaw?: string, toRaw?: string) => {
      const from = (fromRaw || "").trim();
      const to = (toRaw || "").trim();
      if (!from || !to) return "Country rename needs both names.";
      if (from.toLowerCase() === to.toLowerCase()) {
        return "Country name is already correct.";
      }

      const fromLower = from.toLowerCase();
      const replaceInText = (value: string) => {
        if (!value) return value;
        const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return value.replace(new RegExp(escaped, "gi"), to);
      };

      let renamed = 0;
      let listingsUpdated = 0;
      const source = sectionsRef.current;
      const withSection = addCountriesServeSection(source, category);
      const next = withSection.map((section) => {
        if (section.type !== "CountriesServe") return section;
        const variant = section.variant || "CountriesServe-1";
        const currentData =
          (section.data[variant] as SectionData | undefined) ??
          (section.data["CountriesServe-1"] as SectionData | undefined) ??
          ({} as SectionData);
        const state = buildCountriesServeState(currentData);
        const matchedIds = new Set<string>();
        const countries = state.countriesServeItems.map((country) => {
          if (country.name.trim().toLowerCase() !== fromLower) return country;
          matchedIds.add(country.id);
          renamed += 1;
          const flagImage =
            resolveCountryFlagImage(to) || country.flagImage || "";
          return {
            ...country,
            name: to,
            flagAlt: to,
            flagImage,
          };
        });
        const listings = state.countriesServeListings.map((listing) => {
          const byId = listing.countryId && matchedIds.has(listing.countryId);
          const byCategory =
            (listing.category || "").trim().toLowerCase() === fromLower;
          const titleHasTypo = listing.title.toLowerCase().includes(fromLower);
          if (!byId && !byCategory && !titleHasTypo) return listing;
          listingsUpdated += 1;
          const nextTitle = replaceInText(listing.title);
          return {
            ...listing,
            title: nextTitle,
            category: byId || byCategory ? to : replaceInText(listing.category),
            countryId: byCategory
              ? countries.find((c) => c.name === to)?.id || listing.countryId
              : listing.countryId,
            desc: replaceInText(listing.desc || ""),
            content: replaceInText(listing.content || ""),
            slug: createPageSlug(nextTitle) || listing.slug,
            seoTitle: replaceInText(listing.seoTitle || ""),
            seoDescription: replaceInText(listing.seoDescription || ""),
            seoKeywords: replaceInText(listing.seoKeywords || ""),
            alt: replaceInText(listing.alt || ""),
          };
        });

        if (!renamed && !listingsUpdated) return section;

        const nextVariantData = applyCountriesServeStateToData(currentData, {
          ...state,
          countriesServeItems: countries,
          countriesServeListings: listings,
        });
        return {
          ...section,
          variant,
          data: syncSectionContentAcrossVariants(
            { ...section, variant },
            {
              ...section.data,
              [variant]: nextVariantData,
              "CountriesServe-1": nextVariantData,
            },
            variant,
          ),
        };
      });

      if (!renamed && !listingsUpdated) {
        return `Country "${from}" not found.`;
      }

      urgentAutosaveRef.current = true;
      sectionsRef.current = next;
      setSections(next);
      queueMicrotask(() => {
        window.dispatchEvent(
          new CustomEvent("ai-builder-countries-serve-query"),
        );
      });

      return `Renamed "${from}" â†’ "${to}"${
        listingsUpdated ? ` (${listingsUpdated} listing(s) updated)` : ""
      }.`;
    };

    const applySetSiteSeo = (action: Record<string, unknown>) => {
      const metaTitle =
        typeof action.metaTitle === "string" ? action.metaTitle.trim() : "";
      const metaDescription =
        typeof action.metaDescription === "string"
          ? action.metaDescription.trim()
          : "";
      const metaKeywords =
        typeof action.metaKeywords === "string"
          ? action.metaKeywords.trim()
          : "";
      const pageLabel =
        typeof action.pageLabel === "string" ? action.pageLabel.trim() : "";
      const allPages = action.allPages === true;
      if (!metaTitle && !metaDescription && !metaKeywords) {
        return "SEO needs at least a title or description.";
      }
      const patch = {
        ...(metaTitle ? { metaTitle } : {}),
        ...(metaDescription ? { metaDescription } : {}),
        ...(metaKeywords ? { metaKeywords } : {}),
        ...(metaTitle ? { ogTitle: metaTitle } : {}),
        ...(metaDescription ? { ogDescription: metaDescription } : {}),
      };
      urgentAutosaveRef.current = true;

      // Fake page names from bad AI parse (e.g. "all") â†’ treat as site/home SEO.
      const bogusPage =
        pageLabel &&
        /^(all|every|entire|sab|saara|saari|sari|page|pages|home|site|website)$/i.test(
          pageLabel,
        );

      if (allPages || bogusPage || !pageLabel) {
        let next = patchGlobalSeo(siteSeoConfigRef.current, patch);
        next = patchPageSeo(next, "home", patch);
        const existingPages = Object.keys(next.pages || {});
        for (const key of existingPages) {
          if (normalizePageSeoKey(key) === "home") continue;
          if (/^(all|every|page|pages)$/i.test(key)) continue;
          next = patchPageSeo(next, key, patch);
        }
        // Drop bogus "all" page key if it was created earlier
        if (next.pages && (next.pages.all || next.pages["all"])) {
          const pages = { ...next.pages };
          delete pages.all;
          next = { ...next, pages };
        }
        setSiteSeoConfigRef.current(next);
        return allPages || bogusPage
          ? "Updated SEO meta for all pages (including Home)."
          : "Updated site SEO meta title and description.";
      }

      let next = patchPageSeo(siteSeoConfigRef.current, pageLabel, patch);
      if (normalizePageSeoKey(pageLabel) === "home") {
        next = patchGlobalSeo(next, patch);
      }
      setSiteSeoConfigRef.current(next);
      return `Updated SEO for "${pageLabel}" page.`;
    };

    const applyPublishSite = () => {
      window.dispatchEvent(new CustomEvent("ai-builder-publish-request"));
      return "Publish started â€” check the top bar for progress.";
    };

    const applySetThemeColors = (action: Record<string, unknown>) => {
      const raw =
        action.values && typeof action.values === "object"
          ? (action.values as Record<string, unknown>)
          : {};
      const patch: Record<string, string> = {};
      for (const [key, value] of Object.entries(raw)) {
        if (typeof value === "string" && value.trim()) {
          patch[key] = value.trim();
        }
      }
      if (!Object.keys(patch).length) {
        return "Theme colors missing.";
      }
      urgentAutosaveRef.current = true;
      setThemeVariables({
        ...(templateVariablesRef.current || {}),
        ...patch,
      });
      const label =
        typeof action.label === "string" && action.label.trim()
          ? action.label.trim()
          : "custom";
      return `Updated website theme (${label}).`;
    };

    const applyDeleteMasterItem = (
      masterRaw?: string,
      titleRaw?: string,
    ) => {
      const master = (masterRaw || "").trim().toLowerCase();
      const title = (titleRaw || "").trim();
      if (!title) return "Delete needs an item title.";
      const titleLower = title.toLowerCase();
      const matches = (value?: string) =>
        (value || "").trim().toLowerCase() === titleLower;

      if (master === "blog") {
        const blog = flattenPageLinks(pageLinksRef.current).find(
          (link) => link.kind === "blog" && matches(link.label),
        );
        if (!blog) return `Blog "${title}" not found.`;
        const nextLinks = pageLinksRef.current.filter(
          (page) => page.href !== blog.href,
        );
        pageLinksRef.current = nextLinks;
        setPageLinks(nextLinks);
        urgentAutosaveRef.current = true;
        window.dispatchEvent(
          new CustomEvent("ai-builder-page-removed", {
            detail: {
              label: blog.label,
              href: blog.href,
              kind: "blog" as const,
            },
          }),
        );
        return `Deleted blog "${title}".`;
      }

      if (master === "country") {
        let deleted = 0;
        const source = sectionsRef.current;
        const next = source.map((section) => {
          if (
            section.id !== "CountriesServe" &&
            section.type !== "CountriesServe"
          ) {
            return section;
          }
          const variant = section.variant || `${section.type}-1`;
          const currentData =
            (section.data[variant] as SectionData | undefined) ??
            (section.data[`${section.type}-1`] as SectionData | undefined) ??
            ({} as SectionData);
          const state = buildCountriesServeState(currentData);
          const before = state.countriesServeListings.length;
          const listings = state.countriesServeListings.filter(
            (item) => !matches(item.title),
          );
          deleted += before - listings.length;
          if (before === listings.length) return section;
          return {
            ...section,
            variant,
            data: syncSectionContentAcrossVariants(
              { ...section, variant },
              {
                ...section.data,
                [variant]: applyCountriesServeStateToData(currentData, {
                  ...state,
                  countriesServeListings: listings,
                }),
                [`${section.type}-1`]: applyCountriesServeStateToData(
                  currentData,
                  { ...state, countriesServeListings: listings },
                ),
              },
              variant,
            ),
          };
        });
        if (!deleted) return `Listing "${title}" not found.`;
        urgentAutosaveRef.current = true;
        sectionsRef.current = next;
        setSections(next);
        queueMicrotask(() => {
          window.dispatchEvent(
            new CustomEvent("ai-builder-countries-serve-query"),
          );
        });
        return `Deleted listing "${title}".`;
      }

      const sectionMatchers: Record<
        string,
        {
          match: (section: SectionItem) => boolean;
          apply: (
            data: SectionData,
          ) => { data: SectionData; deleted: number } | null;
          queryEvent?: string;
        }
      > = {
        service: {
          match: (section) =>
            section.id === "ServicePage" ||
            section.type === "ServicePage" ||
            (section.type === "Service" &&
              ["service", "services"].includes(normalizePageSlug(section.page || ""))),
          apply: (data) => {
            const state = buildServicePageState(data);
            const before = state.services.length;
            const services = state.services.filter(
              (item) => !matches(item.title),
            );
            if (services.length === before) return null;
            return {
              data: applyServicePageStateToData(data, { ...state, services }),
              deleted: before - services.length,
            };
          },
          queryEvent: "ai-builder-service-page-query",
        },
        event: {
          match: (section) =>
            section.id === "EventPage" ||
            section.type === "EventPage" ||
            (section.type === "Event" &&
              normalizePageSlug(section.page || "") === "events"),
          apply: (data) => {
            const state = buildEventPageState(data);
            const before = state.events.length;
            const events = state.events.filter((item) => !matches(item.title));
            if (events.length === before) return null;
            return {
              data: applyEventPageStateToData(data, { ...state, events }),
              deleted: before - events.length,
            };
          },
          queryEvent: "ai-builder-event-page-query",
        },
        property: {
          match: (section) =>
            section.id === "PropertyPage" ||
            section.type === "PropertyPage" ||
            (section.type === "Property" &&
              normalizePageSlug(section.page || "") === "properties"),
          apply: (data) => {
            const state = buildPropertyPageState(data);
            const before = state.properties.length;
            const properties = state.properties.filter(
              (item) => !matches(item.title),
            );
            if (properties.length === before) return null;
            return {
              data: applyPropertyPageStateToData(data, {
                ...state,
                properties,
              }),
              deleted: before - properties.length,
            };
          },
          queryEvent: "ai-builder-property-page-query",
        },
        portfolio: {
          match: (section) =>
            section.id === "PortfolioPage" ||
            section.type === "PortfolioPage" ||
            (section.type === "Portfolio" &&
              normalizePageSlug(section.page || "") === "portfolio"),
          apply: (data) => {
            const state = buildPortfolioPageState(data);
            const before = state.portfolioItems.length;
            const portfolioItems = state.portfolioItems.filter(
              (item) => !matches(item.title),
            );
            if (portfolioItems.length === before) return null;
            return {
              data: applyPortfolioPageStateToData(data, {
                ...state,
                portfolioItems,
              }),
              deleted: before - portfolioItems.length,
            };
          },
          queryEvent: "ai-builder-portfolio-page-query",
        },
        team: {
          match: (section) =>
            section.id === "TeamPage" ||
            section.type === "TeamPage" ||
            (section.type === "Team" &&
              normalizePageSlug(section.page || "") === "teams"),
          apply: (data) => {
            const state = buildTeamPageState(data);
            const before = state.teamMembers.length;
            const teamMembers = state.teamMembers.filter(
              (item) => !matches(item.title),
            );
            if (teamMembers.length === before) return null;
            return {
              data: applyTeamPageStateToData(data, {
                ...state,
                teamMembers,
              }),
              deleted: before - teamMembers.length,
            };
          },
          queryEvent: "ai-builder-team-page-query",
        },
        gallery: {
          match: (section) =>
            section.id === "GalleryPage" ||
            section.type === "GalleryPage" ||
            (section.type === "Gallery" &&
              normalizePageSlug(section.page || "") === "gallery"),
          apply: (data) => {
            const state = buildGalleryPageState(data);
            const before = state.galleryItems.length;
            const galleryItems = state.galleryItems.filter(
              (item) => !matches(item.title),
            );
            if (galleryItems.length === before) return null;
            return {
              data: applyGalleryPageStateToData(data, {
                ...state,
                galleryItems,
              }),
              deleted: before - galleryItems.length,
            };
          },
          queryEvent: "ai-builder-gallery-page-query",
        },
      };

      const matcher = sectionMatchers[master];
      if (!matcher) return `Delete not supported for "${master}".`;

      let deletedCount = 0;
      const source = sectionsRef.current;
      const next = source.map((section) => {
        if (!matcher.match(section)) return section;
        const variant = section.variant || `${section.type}-1`;
        const currentData =
          (section.data[variant] as SectionData | undefined) ??
          (section.data[`${section.type}-1`] as SectionData | undefined) ??
          ({} as SectionData);
        const result = matcher.apply(currentData);
        if (!result) return section;
        deletedCount += result.deleted;
        return {
          ...section,
          variant,
          data: syncSectionContentAcrossVariants(
            { ...section, variant },
            {
              ...section.data,
              [variant]: result.data,
              [`${section.type}-1`]: result.data,
            },
            variant,
          ),
        };
      });

      if (!deletedCount) return `${master} item "${title}" not found.`;
      urgentAutosaveRef.current = true;
      sectionsRef.current = next;
      setSections(next);
      if (matcher.queryEvent) {
        queueMicrotask(() => {
          window.dispatchEvent(new CustomEvent(matcher.queryEvent!));
        });
      }
      return `Deleted ${master} "${title}".`;
    };

    const applyRenamePage = (fromRaw?: string, toRaw?: string) => {
      const from = (fromRaw || "").trim();
      const to = (toRaw || "").trim();
      if (!from || !to) return "Page rename needs both names.";
      if (/^home$/i.test(from) || /^home$/i.test(to)) {
        return "Home page cannot be renamed.";
      }
      if (from.toLowerCase() === to.toLowerCase()) {
        return "Page name is already correct.";
      }
      const links = pageLinksRef.current;
      const oldLink = links.find(
        (page) =>
          (page.label || "").trim().toLowerCase() === from.toLowerCase() ||
          normalizePageSlug(getMultiPageSlugFromHref(page.href) || "") ===
            normalizePageSlug(from),
      );
      if (!oldLink) return `Page "${from}" not found.`;
      if (oldLink.kind === "blog") {
        return `"${oldLink.label}" is a blog â€” rename it from Blogs manager / rename chat.`;
      }
      const alreadyExists = flattenPageLinks(links).some(
        (page) =>
          page !== oldLink &&
          (page.label || "").trim().toLowerCase() === to.toLowerCase(),
      );
      if (alreadyExists) return `Page "${to}" already exists.`;

      const newHref =
        oldLink.kind === "blogIndex"
          ? "#page-blogs"
          : `#page-${createPageSlug(to) || "page"}`;
      const nextLinks = links.map((page) =>
        page === oldLink ||
        ((page.label || "").trim().toLowerCase() === from.toLowerCase() &&
          page.kind !== "blog")
          ? { ...page, label: to, href: newHref }
          : page,
      );
      pageLinksRef.current = nextLinks;
      setPageLinks(nextLinks);
      const viewPage = (editorViewPageRef.current || "").trim();
      if (
        viewPage &&
        (viewPage.toLowerCase() === from.toLowerCase() ||
          normalizePageSlug(viewPage) === normalizePageSlug(from))
      ) {
        setCurrentPage(to);
      }
      urgentAutosaveRef.current = true;
      window.dispatchEvent(
        new CustomEvent("ai-builder-page-renamed", {
          detail: {
            oldLabel: oldLink.label || from,
            newLabel: to,
            oldHref: oldLink.href,
            newHref,
            kind: oldLink.kind,
          },
        }),
      );
      return `Renamed page "${from}" â†’ "${to}".`;
    };

    const applyDuplicateSection = (hint?: string) => {
      const section = resolveSection(hint);
      if (!section) return "Section not found to duplicate.";
      if (["Header", "Topbar", "Footer", "Breadcrumb"].includes(section.type)) {
        return `${section.type} cannot be duplicated.`;
      }
      const index = sectionsRef.current.findIndex(
        (item) =>
          (item.id ?? item.type) === (section.id ?? section.type) ||
          item === section,
      );
      if (index < 0) return "Section not found to duplicate.";
      const duplicate = structuredClone(sectionsRef.current[index]) as SectionItem;
      const baseId = (duplicate.id || duplicate.type || "Section").replace(
        /-\d+$/,
        "",
      );
      duplicate.id = `${baseId}-copy-${Date.now().toString(36)}`;
      if (duplicate.type === "CustomSection") {
        const variant = duplicate.variant || "CustomSection-1";
        const variantData =
          (duplicate.data?.[variant] as Record<string, unknown> | undefined) ||
          {};
        const columns = Array.isArray(variantData.columns)
          ? (structuredClone(variantData.columns) as Array<{
              id: string;
              elements?: Array<Record<string, unknown>>;
            }>)
          : [];
        for (const column of columns) {
          column.id = nextCustomRuntimeId("column");
          column.elements = (column.elements ?? []).map((element) => ({
            ...element,
            id: nextCustomRuntimeId(String(element.type ?? "element")),
          }));
        }
        duplicate.data = {
          ...duplicate.data,
          [variant]: {
            ...variantData,
            customSectionId: duplicate.id,
            columns,
          },
        };
      }
      const next = ensureUniqueSectionIds([
        ...sectionsRef.current.slice(0, index + 1),
        duplicate,
        ...sectionsRef.current.slice(index + 1),
      ]);
      urgentAutosaveRef.current = true;
      sectionsRef.current = next;
      setSections(next);
      prepareEditorSurfaceForReplace();
      return `${section.type} section duplicated.`;
    };

    const HOME_CONTENT_BY_AUDIENCE: Record<
      string,
      {
        banner: { pretitle: string; title: string; desc: string; buttonLabel: string };
        about: { pretitle: string; title: string; desc: string };
        why: { pretitle: string; title: string; desc: string };
      }
    > = {
      school: {
        banner: {
          pretitle: "Admissions open",
          title: "Nurturing curious minds for tomorrow",
          desc: "A warm, modern school experience with strong academics, sports, and values â€” built for every learner.",
          buttonLabel: "Apply Now",
        },
        about: {
          pretitle: "About our school",
          title: "Where learning feels personal",
          desc: "We combine experienced teachers, safe campuses, and hands-on activities so students grow confidently in studies and life skills.",
        },
        why: {
          pretitle: "Why families choose us",
          title: "Care, clarity, and results",
          desc: "From early years to senior grades, families trust our clear communication, caring staff, and consistent student progress.",
        },
      },
      business: {
        banner: {
          pretitle: "Grow with confidence",
          title: "Smart solutions for modern businesses",
          desc: "We help brands plan, build, and scale with clear strategy, reliable delivery, and measurable outcomes.",
          buttonLabel: "Get Started",
        },
        about: {
          pretitle: "Who we are",
          title: "Your growth partner",
          desc: "Our team blends strategy and execution so your business moves faster â€” with less friction and more clarity.",
        },
        why: {
          pretitle: "Why work with us",
          title: "Practical expertise that ships",
          desc: "Clients stay because we communicate clearly, deliver on time, and focus on what actually moves the business forward.",
        },
      },
      realestate: {
        banner: {
          pretitle: "Find your next home",
          title: "Trusted property guidance, locally",
          desc: "Browse verified listings and get honest advice for buying, selling, or renting â€” without the stress.",
          buttonLabel: "View Properties",
        },
        about: {
          pretitle: "About our agency",
          title: "Local experts. Clear deals.",
          desc: "We know the neighborhoods, pricing, and paperwork â€” so every property decision feels informed and secure.",
        },
        why: {
          pretitle: "Why clients trust us",
          title: "Transparent. Fast. Local.",
          desc: "From first visit to final paperwork, our process stays simple, honest, and focused on your goals.",
        },
      },
      hospital: {
        banner: {
          pretitle: "Care you can trust",
          title: "Compassionate healthcare, close to home",
          desc: "Modern facilities and experienced doctors dedicated to safe, personal care for every patient.",
          buttonLabel: "Book Appointment",
        },
        about: {
          pretitle: "About our hospital",
          title: "People-first medical care",
          desc: "We combine clinical excellence with a calm patient experience â€” clear guidance at every step.",
        },
        why: {
          pretitle: "Why patients choose us",
          title: "Expertise with empathy",
          desc: "Families return because we listen carefully, explain clearly, and treat every patient with dignity.",
        },
      },
      restaurant: {
        banner: {
          pretitle: "Taste the difference",
          title: "Fresh flavors. Warm hospitality.",
          desc: "From everyday favorites to special occasions, enjoy food made with care in a welcoming space.",
          buttonLabel: "Reserve a Table",
        },
        about: {
          pretitle: "Our story",
          title: "Cooked with heart",
          desc: "We source quality ingredients and craft dishes that feel familiar, generous, and memorable.",
        },
        why: {
          pretitle: "Why diners love us",
          title: "Flavor, comfort, consistency",
          desc: "Guests come back for honest portions, friendly service, and a place that feels like home.",
        },
      },
      general: {
        banner: {
          pretitle: "Welcome",
          title: "Built to help you grow",
          desc: "Clear messaging, trusted service, and a website experience that converts visitors into customers.",
          buttonLabel: "Contact Us",
        },
        about: {
          pretitle: "About us",
          title: "Reliable partners for your goals",
          desc: "We focus on practical results â€” helpful guidance, quality delivery, and long-term trust.",
        },
        why: {
          pretitle: "Why choose us",
          title: "Simple. Honest. Effective.",
          desc: "People stay because we communicate clearly and deliver what we promise.",
        },
      },
    };

    const applyRefreshHomeContent = (audienceRaw?: string) => {
      const key = (audienceRaw || "general").trim().toLowerCase();
      const pack =
        HOME_CONTENT_BY_AUDIENCE[key] || HOME_CONTENT_BY_AUDIENCE.general;
      const notes: string[] = [];
      notes.push(
        applyPatch("Banner", {
          pretitle: pack.banner.pretitle,
          title: pack.banner.title,
          desc: pack.banner.desc,
          buttonLabel: pack.banner.buttonLabel,
        }),
      );
      notes.push(
        applyPatch("About", {
          pretitle: pack.about.pretitle,
          title: pack.about.title,
          desc: pack.about.desc,
        }),
      );
      const whyHint =
        resolveSection("WhyChooseUs") || resolveSection("Why choose us");
      if (whyHint) {
        notes.push(
          applyPatch("WhyChooseUs", {
            pretitle: pack.why.pretitle,
            title: pack.why.title,
            desc: pack.why.desc,
          }),
        );
      }
      return `Home content refreshed for ${key}. ${notes.filter(Boolean).join(" ")}`;
    };

    const applyRenameMasterItem = (
      masterRaw?: string,
      fromRaw?: string,
      toRaw?: string,
    ) => {
      const master = (masterRaw || "").trim().toLowerCase();
      const from = (fromRaw || "").trim();
      const to = (toRaw || "").trim();
      if (!from || !to) return "Rename needs both names.";
      if (from.toLowerCase() === to.toLowerCase()) {
        return "Name is already correct.";
      }
      if (master === "country") {
        return applyRenameCountry(from, to);
      }

      const fromLower = from.toLowerCase();
      const matches = (value?: string) =>
        (value || "").trim().toLowerCase() === fromLower;

      if (master === "blog") {
        let renamed = 0;
        setPageLinks((current) =>
          current.map((link) => {
            if (link.kind !== "blog" || !matches(link.label)) return link;
            renamed += 1;
            const slug = createPageSlug(to) || link.href.replace(/^#page-/, "");
            return {
              ...link,
              label: to,
              href: `#page-${slug}`,
            };
          }),
        );
        return renamed
          ? `Renamed blog "${from}" â†’ "${to}".`
          : `Blog "${from}" not found.`;
      }

      const sectionMatchers: Record<
        string,
        {
          match: (section: SectionItem) => boolean;
          apply: (
            data: SectionData,
          ) => { data: SectionData; renamed: number } | null;
          queryEvent?: string;
        }
      > = {
        service: {
          match: (section) =>
            section.id === "ServicePage" ||
            section.type === "ServicePage" ||
            (section.type === "Service" &&
              ["service", "services"].includes(normalizePageSlug(section.page || ""))),
          apply: (data) => {
            const state = buildServicePageState(data);
            let renamed = 0;
            const services = state.services.map((item) => {
              if (!matches(item.title)) return item;
              renamed += 1;
              return {
                ...item,
                title: to,
                slug: createPageSlug(to) || item.slug,
                seoTitle: item.seoTitle === item.title ? to : item.seoTitle,
              };
            });
            if (!renamed) return null;
            return {
              data: applyServicePageStateToData(data, { ...state, services }),
              renamed,
            };
          },
          queryEvent: "ai-builder-service-page-query",
        },
        event: {
          match: (section) =>
            section.id === "EventPage" ||
            section.type === "EventPage" ||
            (section.type === "Event" &&
              normalizePageSlug(section.page || "") === "events"),
          apply: (data) => {
            const state = buildEventPageState(data);
            let renamed = 0;
            const events = state.events.map((item) => {
              if (!matches(item.title)) return item;
              renamed += 1;
              return {
                ...item,
                title: to,
                slug: createPageSlug(to) || item.slug,
                seoTitle: item.seoTitle === item.title ? to : item.seoTitle,
              };
            });
            if (!renamed) return null;
            return {
              data: applyEventPageStateToData(data, { ...state, events }),
              renamed,
            };
          },
          queryEvent: "ai-builder-event-page-query",
        },
        property: {
          match: (section) =>
            section.id === "PropertyPage" ||
            section.type === "PropertyPage" ||
            (section.type === "Property" &&
              normalizePageSlug(section.page || "") === "properties"),
          apply: (data) => {
            const state = buildPropertyPageState(data);
            let renamed = 0;
            const properties = state.properties.map((item) => {
              if (!matches(item.title)) return item;
              renamed += 1;
              return {
                ...item,
                title: to,
                slug: createPageSlug(to) || item.slug,
                seoTitle: item.seoTitle === item.title ? to : item.seoTitle,
              };
            });
            if (!renamed) return null;
            return {
              data: applyPropertyPageStateToData(data, {
                ...state,
                properties,
              }),
              renamed,
            };
          },
          queryEvent: "ai-builder-property-page-query",
        },
        portfolio: {
          match: (section) =>
            section.id === "PortfolioPage" ||
            section.type === "PortfolioPage" ||
            (section.type === "Portfolio" &&
              normalizePageSlug(section.page || "") === "portfolio"),
          apply: (data) => {
            const state = buildPortfolioPageState(data);
            let renamed = 0;
            const portfolioItems = state.portfolioItems.map((item) => {
              if (!matches(item.title)) return item;
              renamed += 1;
              return {
                ...item,
                title: to,
                slug: createPageSlug(to) || item.slug,
                seoTitle: item.seoTitle === item.title ? to : item.seoTitle,
              };
            });
            if (!renamed) return null;
            return {
              data: applyPortfolioPageStateToData(data, {
                ...state,
                portfolioItems,
              }),
              renamed,
            };
          },
          queryEvent: "ai-builder-portfolio-page-query",
        },
        team: {
          match: (section) =>
            section.id === "TeamPage" ||
            section.type === "TeamPage" ||
            (section.type === "Team" &&
              normalizePageSlug(section.page || "") === "teams"),
          apply: (data) => {
            const state = buildTeamPageState(data);
            let renamed = 0;
            const teamMembers = state.teamMembers.map((item) => {
              if (!matches(item.title)) return item;
              renamed += 1;
              return {
                ...item,
                title: to,
                slug: createPageSlug(to) || item.slug,
                seoTitle: item.seoTitle === item.title ? to : item.seoTitle,
              };
            });
            if (!renamed) return null;
            return {
              data: applyTeamPageStateToData(data, {
                ...state,
                teamMembers,
              }),
              renamed,
            };
          },
          queryEvent: "ai-builder-team-page-query",
        },
        gallery: {
          match: (section) =>
            section.id === "GalleryPage" ||
            section.type === "GalleryPage" ||
            (section.type === "Gallery" &&
              normalizePageSlug(section.page || "") === "gallery"),
          apply: (data) => {
            const state = buildGalleryPageState(data);
            let renamed = 0;
            const galleryItems = state.galleryItems.map((item) => {
              if (!matches(item.title)) return item;
              renamed += 1;
              return {
                ...item,
                title: to,
                alt: item.alt === item.title ? to : item.alt,
              };
            });
            if (!renamed) return null;
            return {
              data: applyGalleryPageStateToData(data, {
                ...state,
                galleryItems,
              }),
              renamed,
            };
          },
          queryEvent: "ai-builder-gallery-page-query",
        },
      };

      const matcher = sectionMatchers[master];
      if (!matcher) return `Rename not supported for "${master}".`;

      let renamedCount = 0;
      const source = sectionsRef.current;
      const next = source.map((section) => {
        if (!matcher.match(section)) return section;
        const variant = section.variant || `${section.type}-1`;
        const currentData =
          (section.data[variant] as SectionData | undefined) ??
          (section.data[`${section.type}-1`] as SectionData | undefined) ??
          ({} as SectionData);
        const result = matcher.apply(currentData);
        if (!result) return section;
        renamedCount += result.renamed;
        return {
          ...section,
          variant,
          data: syncSectionContentAcrossVariants(
            { ...section, variant },
            {
              ...section.data,
              [variant]: result.data,
              [`${section.type}-1`]: result.data,
            },
            variant,
          ),
        };
      });

      if (!renamedCount) return `${master} item "${from}" not found.`;
      urgentAutosaveRef.current = true;
      sectionsRef.current = next;
      setSections(next);
      if (matcher.queryEvent) {
        queueMicrotask(() => {
          window.dispatchEvent(new CustomEvent(matcher.queryEvent!));
        });
      }
      return `Renamed ${master} "${from}" â†’ "${to}".`;
    };

    const handleApplyActions = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          actions?: Array<Record<string, unknown>>;
        }>
      ).detail;
      const actions = Array.isArray(detail?.actions) ? detail.actions : [];
      if (!actions.length) {
        emitResult(false, "AI did not return any edit actions.");
        return;
      }

      const mutating = actions.filter((action) => {
        const type = typeof action.type === "string" ? action.type : "";
        return type && type !== "ask";
      });

      if (!mutating.length) {
        emitResult(true, "Choose an option to continue.");
        return;
      }

      const labels: string[] = [];
      for (const action of mutating) {
        const type = typeof action.type === "string" ? action.type : "";
        if (type === "patch") labels.push("Updating content");
        else if (type === "addSection" || type === "addCustomSection")
          labels.push("Adding section");
        else if (type === "addPage") labels.push("Creating page");
        else if (type === "placePageInNav") labels.push("Updating nav menu");
        else if (type === "addBreadcrumb") labels.push("Adding breadcrumb");
        else if (type === "deletePage") labels.push("Deleting page");
        else if (type === "addMasterItems") labels.push("Adding master items");
        else if (type === "renameCountry" || type === "renameMasterItem")
          labels.push("Renaming item");
        else if (type === "setSiteSeo") labels.push("Updating SEO");
        else if (type === "publishSite") labels.push("Publishing website");
        else if (type === "setThemeColors") labels.push("Updating theme");
        else if (type === "deleteMasterItem") labels.push("Deleting item");
        else if (type === "renamePage") labels.push("Renaming page");
        else if (type === "duplicateSection") labels.push("Duplicating section");
        else if (type === "refreshHomeContent") labels.push("Refreshing content");
        else if (type === "deleteSection") labels.push("Removing section");
        else if (type === "moveSection") labels.push("Moving section");
        else labels.push("Applying changes");
      }
      setAiApplyLabel(labels[0] || "AI is updatingâ€¦");
      setAiApplyBusy(true);

      // Never open the manual modal for AI edits â€” apply on canvas directly.
    setEditingSection(null);
      setEditingSectionInitialTab(undefined);
      prepareEditorSurfaceForReplace();

      const startedAt = Date.now();
      const notes: string[] = [];
      let applyOk = true;
      try {
        for (const action of actions) {
          const type = typeof action.type === "string" ? action.type : "";
          if (type === "patch") {
            notes.push(
              applyPatch(
                typeof action.sectionHint === "string"
                  ? action.sectionHint
                  : undefined,
                action.fields && typeof action.fields === "object"
                  ? (action.fields as Record<string, unknown>)
                  : undefined,
              ),
            );
            continue;
          }
          if (type === "changeLayout") {
            notes.push(
              "Ready sections keep their layout. Only content and images can be changed.",
            );
            continue;
          }
          if (type === "addSection") {
            notes.push(
              applyAdd(
                typeof action.sectionType === "string"
                  ? action.sectionType
                  : undefined,
                typeof action.variant === "string" ? action.variant : undefined,
                typeof action.afterSectionHint === "string"
                  ? action.afterSectionHint
                  : undefined,
              ),
            );
            continue;
          }
          if (type === "addCustomSection") {
            notes.push(
              applyAddCustomRef.current(
                typeof action.layoutId === "string" ? action.layoutId : undefined,
                Array.isArray(action.elements)
                  ? (action.elements as Array<{
                      columnIndex?: number;
                      type: "text" | "image" | "button" | "table" | "slider" | "faq" | "heading" | "testimonial";
                      value?: string;
                      src?: string;
                      href?: string;
                      textColor?: string;
                      buttonBackgroundColor?: string;
                      buttonTextColor?: string;
                      sliderCardsPerView?: 1 | 2 | 3 | 4;
                      faqItems?: Array<{
                        id?: string;
                        question: string;
                        answer: string;
                      }>;
                      testimonialItems?: Array<{
                        id?: string;
                        name: string;
                        role?: string;
                        quote: string;
                        image?: string;
                        rating?: number;
                      }>;
                    }>)
                  : undefined,
                typeof action.afterSectionHint === "string"
                  ? action.afterSectionHint
                  : undefined,
                action.sectionFields &&
                  typeof action.sectionFields === "object"
                  ? (action.sectionFields as Record<string, unknown>)
                  : undefined,
              ),
            );
            continue;
          }
          if (type === "addPage") {
            const pageLabel =
              typeof action.pageLabel === "string"
                ? action.pageLabel.trim()
                : "";
            if (!pageLabel) {
              notes.push("Page name is required.");
              continue;
            }
            if (/^(this|that|current|ye|is)$/i.test(pageLabel)) {
              notes.push(
                "That sounds like nav placement. Try: add this page in nav menu after About.",
              );
              continue;
            }
            if (isSinglePageTemplateRef.current) {
              const legal =
                /\bprivacy\b/i.test(pageLabel) ||
                /\bterms?\b/i.test(pageLabel) ||
                /\bcookie/i.test(pageLabel) ||
                /\bdisclaimer\b/i.test(pageLabel) ||
                /\brefund\b/i.test(pageLabel) ||
                /\bcancellation\b/i.test(pageLabel) ||
                /\blegal\b/i.test(pageLabel) ||
                /\bshipping\s+policy\b/i.test(pageLabel);
              if (!legal) {
                notes.push(
                  "Single-page websites can only add legal pages (Privacy, Terms, Cookie, Disclaimer, Refund).",
                );
                continue;
              }
            }
            const slug = pageLabel
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
            if (!slug || slug === "home") {
              notes.push(`Cannot create a page named "${pageLabel}".`);
              continue;
            }
            const href = `#page-${slug}`;
            const existing = flattenPageLinks(pageLinksRef.current).find(
              (link) =>
                link.label.trim().toLowerCase() === pageLabel.toLowerCase() ||
                normalizePageSlug(getMultiPageSlugFromHref(link.href) || "") ===
                  slug,
            );
            if (existing) {
              setCurrentPage(existing.label);
              // Backfill breadcrumb / ~500-word detail for older custom pages.
              const scaffolded = ensureCustomPageScaffold(
                sectionsRef.current,
                categoryRef.current,
                existing.label,
                templateId,
              );
              if (scaffolded !== sectionsRef.current) {
                sectionsRef.current = scaffolded;
                setSections(scaffolded);
                urgentAutosaveRef.current = true;
                notes.push(
                  `Page "${existing.label}" already exists â€” added missing breadcrumb/detail content.`,
                );
              } else {
                notes.push(
                  `Page "${existing.label}" already exists â€” opened it.`,
                );
              }
              continue;
            }
            const kind = isSinglePageTemplateRef.current
              ? ("document" as const)
              : undefined;
            const nextPageLink = {
              label: pageLabel,
              href,
              ...(kind ? { kind } : {}),
            };
            pageLinksRef.current = [...pageLinksRef.current, nextPageLink];
            setPageLinks(pageLinksRef.current);
            // Sync scaffold immediately so placePageInNav / later updates
            // cannot race-wipe breadcrumb + hero + ~500-word detail.
            const scaffolded = ensureCustomPageScaffold(
              sectionsRef.current,
              categoryRef.current,
              pageLabel,
              templateId,
            );
            if (scaffolded !== sectionsRef.current) {
              sectionsRef.current = scaffolded;
              setSections(scaffolded);
            }
            window.dispatchEvent(
              new CustomEvent("ai-builder-page-added", {
                detail: {
                  label: pageLabel,
                  href,
                  ...(kind ? { kind } : {}),
                },
              }),
            );
            setCurrentPage(pageLabel);
            notes.push(
              `Created page "${pageLabel}" with breadcrumb, hero, and ~500-word detail section.`,
            );
            continue;
          }
          if (type === "deletePage") {
            notes.push(applyDeletePageRef.current(action));
            continue;
          }
          if (type === "placePageInNav") {
            const afterLabel =
              typeof action.afterLabel === "string"
                ? action.afterLabel.trim()
                : "";
            let targetLabel =
              typeof action.pageLabel === "string"
                ? action.pageLabel.trim()
                : "";
            if (
              !targetLabel ||
              /^(this|that|current|ye|is)$/i.test(targetLabel)
            ) {
              targetLabel = (editorViewPageRef.current || "").trim();
            }
            if (!afterLabel) {
              notes.push("Tell me after which nav item (e.g. After About).");
              continue;
            }
            if (!targetLabel || /^home$/i.test(targetLabel)) {
              notes.push(
                "Open the page you want in the editor, then ask to add it to the nav menu.",
              );
              continue;
            }

            const existingPage = flattenPageLinks(pageLinksRef.current).find(
              (link) =>
                link.label.trim().toLowerCase() === targetLabel.toLowerCase(),
            );
            const slug = targetLabel
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
            const href =
              existingPage?.href ||
              (slug ? `#page-${slug}` : `#page-${targetLabel}`);
            const navItem: EditorPageLink = {
              label: existingPage?.label || targetLabel,
              href,
              ...(existingPage?.kind ? { kind: existingPage.kind } : {}),
            };

            const readMenuFromData = (
              data: Record<string, unknown>,
            ): EditorPageLink[] => {
              if (Array.isArray(data.menu) && data.menu.length) {
                return [...(data.menu as EditorPageLink[])];
              }
              const blocks = Array.isArray(data.blocks) ? data.blocks : [];
              for (const block of blocks) {
                if (!block || typeof block !== "object") continue;
                const row = block as Record<string, unknown>;
                if (row.type !== "menu") continue;
                if (Array.isArray(row.items) && row.items.length) {
                  return [...(row.items as EditorPageLink[])];
                }
              }
              return [];
            };

            const writeMenuToData = (
              data: Record<string, unknown>,
              menu: EditorPageLink[],
            ): Record<string, unknown> => {
              const blocks = Array.isArray(data.blocks)
                ? [...(data.blocks as unknown[])]
                : [];
              let found = false;
              const nextBlocks = blocks.map((block) => {
                if (!block || typeof block !== "object") return block;
                const row = block as Record<string, unknown>;
                if (row.type !== "menu") return block;
                found = true;
                return { ...row, items: menu };
              });
              if (!found) {
                nextBlocks.push({ id: "menu", type: "menu", items: menu });
              }
              return { ...data, menu, blocks: nextBlocks };
            };

            const matchNavLabel = (link: EditorPageLink, label: string) => {
              const left = link.label.trim().toLowerCase();
              const right = label.trim().toLowerCase();
              return (
                left === right ||
                left.includes(right) ||
                right.includes(left)
              );
            };

            let placed = false;
            let alreadyThere = false;
            let headerId = "";
            const sourceSections = sectionsRef.current;
            const headerSection = sourceSections.find(
              (section) => section.type === "Header",
            );

            if (!headerSection) {
              notes.push("Header section not found â€” could not update nav.");
              continue;
            }

            headerId = headerSection.id ?? headerSection.type;
            const nextSections = sourceSections.map((section) => {
              if (section.type !== "Header") return section;
              const variant = section.variant || "Header-1";
              const active =
                (section.data?.[variant] as
                  | Record<string, unknown>
                  | undefined) ||
                (Object.values(section.data || {})[0] as
                  | Record<string, unknown>
                  | undefined) ||
                {};
              const menu = readMenuFromData(active);

              const existingIndex = menu.findIndex(
                (link) =>
                  matchNavLabel(link, navItem.label) ||
                  (link.href || "").trim().toLowerCase() ===
                    href.trim().toLowerCase(),
              );
              const afterIndex = menu.findIndex((link) =>
                matchNavLabel(link, afterLabel),
              );

              if (existingIndex >= 0) {
                alreadyThere = true;
                const [item] = menu.splice(existingIndex, 1);
                const insertAt =
                  afterIndex >= 0
                    ? existingIndex <= afterIndex
                      ? afterIndex
                      : afterIndex + 1
                    : menu.length;
                menu.splice(Math.max(0, insertAt), 0, item);
                placed = true;
              } else if (afterIndex >= 0) {
                menu.splice(afterIndex + 1, 0, navItem);
                placed = true;
              } else {
                menu.push(navItem);
                placed = true;
              }

              const nextVariantData = writeMenuToData(active, menu);
              const nextData = {
                ...section.data,
                [variant]: nextVariantData,
              };
              return {
                ...section,
                data: syncSectionContentAcrossVariants(
                  section,
                  nextData as Record<string, SectionData>,
                  variant,
                ),
              };
            });

            sectionsRef.current = nextSections;
            setSections(nextSections);

            if (headerId) {
              bumpSectionRenderEpoch(headerId);
            }

            if (!existingPage && slug && slug !== "home") {
              setPageLinks((prev) => {
                if (
                  flattenPageLinks(prev).some(
                    (link) =>
                      link.label.trim().toLowerCase() ===
                      navItem.label.toLowerCase(),
                  )
                ) {
                  return prev;
                }
                return [...prev, navItem];
              });
            }

            notes.push(
              placed
                ? alreadyThere
                  ? `Moved "${navItem.label}" in nav menu after ${afterLabel}.`
                  : `Added "${navItem.label}" to nav menu after ${afterLabel}.`
                : `Could not update nav menu for "${navItem.label}".`,
            );
            continue;
          }
          if (type === "addBreadcrumb") {
            notes.push(applyAddBreadcrumbRef.current(action));
            continue;
          }
          if (type === "addMasterItems") {
            const modeRaw =
              typeof action.headerSubmenuMode === "string"
                ? action.headerSubmenuMode.trim().toLowerCase()
                : "";
            const mergeRaw =
              typeof action.headerSubmenuMerge === "string"
                ? action.headerSubmenuMerge.trim().toLowerCase()
                : "";
            notes.push(
              applyAddMasterItems(
                typeof action.master === "string" ? action.master : undefined,
                Array.isArray(action.items)
                  ? (action.items as Array<Record<string, unknown>>)
                  : undefined,
                action.headerSubmenu === true,
                modeRaw === "category" ||
                  modeRaw === "type" ||
                  modeRaw === "name"
                  ? modeRaw
                  : undefined,
                mergeRaw === "new" ||
                  mergeRaw === "before" ||
                  mergeRaw === "after" ||
                  mergeRaw === "skip" ||
                  mergeRaw === "mix" ||
                  mergeRaw === "replace"
                  ? mergeRaw === "mix"
                    ? "after"
                    : mergeRaw === "replace"
                      ? "new"
                      : mergeRaw
                  : undefined,
              ),
            );
            continue;
          }
          if (type === "renameCountry") {
            notes.push(
              applyRenameCountry(
                typeof action.from === "string" ? action.from : undefined,
                typeof action.to === "string" ? action.to : undefined,
              ),
            );
            continue;
          }
          if (type === "renameMasterItem") {
            notes.push(
              applyRenameMasterItem(
                typeof action.master === "string" ? action.master : undefined,
                typeof action.from === "string" ? action.from : undefined,
                typeof action.to === "string" ? action.to : undefined,
              ),
            );
            continue;
          }
          if (type === "setSiteSeo") {
            notes.push(applySetSiteSeo(action));
            continue;
          }
          if (type === "publishSite") {
            notes.push(applyPublishSite());
            continue;
          }
          if (type === "setThemeColors") {
            notes.push(applySetThemeColors(action));
            continue;
          }
          if (type === "deleteMasterItem") {
            notes.push(
              applyDeleteMasterItem(
                typeof action.master === "string" ? action.master : undefined,
                typeof action.title === "string" ? action.title : undefined,
              ),
            );
            continue;
          }
          if (type === "renamePage") {
            notes.push(
              applyRenamePage(
                typeof action.from === "string" ? action.from : undefined,
                typeof action.to === "string" ? action.to : undefined,
              ),
            );
            continue;
          }
          if (type === "duplicateSection") {
            notes.push(
              applyDuplicateSection(
                typeof action.sectionHint === "string"
                  ? action.sectionHint
                  : undefined,
              ),
            );
            continue;
          }
          if (type === "refreshHomeContent") {
            notes.push(
              applyRefreshHomeContent(
                typeof action.audience === "string"
                  ? action.audience
                  : undefined,
              ),
            );
            continue;
          }
          if (type === "deleteSection") {
            notes.push(
              applyDelete(
                typeof action.sectionHint === "string"
                  ? action.sectionHint
                  : undefined,
              ),
            );
            continue;
          }
          if (type === "moveSection") {
            notes.push(
              applyMove(
                typeof action.sectionHint === "string"
                  ? action.sectionHint
                  : undefined,
                action.direction === "down" ? "down" : "up",
              ),
            );
            continue;
          }
          if (type) {
            notes.push(`Unsupported AI action: ${type}.`);
          }
        }
      } catch (error) {
        applyOk = false;
        notes.push(
          error instanceof Error
            ? `Apply failed: ${error.message}`
            : "Apply failed unexpectedly.",
        );
      } finally {
        // Tell chat immediately â€” do not wait for the preloader delay (that caused timeouts).
        emitResult(applyOk, notes.filter(Boolean).join(" ") || "Done.");
        const elapsed = Date.now() - startedAt;
        const waitMs = Math.max(0, 700 - elapsed);
        window.setTimeout(() => setAiApplyBusy(false), waitMs);
      }
    };

    window.addEventListener("ai-builder-ai-query-sections", handleQuery);
    window.addEventListener("ai-builder-ai-apply-actions", handleApplyActions);
    return () => {
      window.removeEventListener("ai-builder-ai-query-sections", handleQuery);
      window.removeEventListener(
        "ai-builder-ai-apply-actions",
        handleApplyActions,
      );
    };
    // applyAddCustom goes through applyAddCustomRef so HMR keeps the seed fix live.
  }, [AI_APPLY_ACTIONS_REV]);

  const syncedSections = useMemo(
    () =>
      syncHeaderEditorState(ensureActiveVariantData(sections), pageLinks, {
        // Multi-page: Nav Menu is separate from the Pages inventory.
        preserveExistingMenu: !isSinglePageTemplate,
      }),
    [isSinglePageTemplate, pageLinks, sections],
  );

  const handleSectionSave = (sectionType: string) => {
    setEditingSection(null);
    setSavedToastSection(sectionType);
    urgentAutosaveRef.current = true;

    const snapshotPageLinks = pageLinksRef.current;
    const snapshotSections = syncHeaderEditorState(
      sectionsRef.current,
      snapshotPageLinks,
      { preserveExistingMenu: !isSinglePageTemplate },
    );
    const snapshotVariables = templateVariablesRef.current;
    const snapshotUpdatedAt = Date.now();
    const payload: GuestSitePayload = {
      templateId,
      category,
      clientUpdatedAt: snapshotUpdatedAt,
      pageLinks: snapshotPageLinks,
      sections: snapshotSections,
      templateVariables: snapshotVariables,
      ...(isRedesignOpen
        ? {
            createPath: "redesign" as const,
            ...(redesignDesignId ? { designId: redesignDesignId } : {}),
          }
        : {}),
    };

    saveEditorDraft({
      updatedAt: snapshotUpdatedAt,
      siteId: persistDraftSiteId,
      templateId,
      category,
      pageLinks: snapshotPageLinks,
      sections: snapshotSections,
      templateVariables: snapshotVariables,
      seo: siteSeoConfigRef.current,
    });
    if (isRedesignOpen && redesignDesignId) {
      saveRedesignEditorSections(
        redesignDesignId,
        snapshotSections as SectionItem[],
      );
    }
    lastAutosaveFingerprintRef.current = JSON.stringify({
      templateId,
      category,
      pageLinks: snapshotPageLinks,
      templateVariables: snapshotVariables,
      sections: snapshotSections,
    });

    if (!user) return;

    const seq = ++cloudSaveSeqRef.current;
    cloudSaveQueueRef.current = cloudSaveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        if (seq !== cloudSaveSeqRef.current || themeSwitchingRef.current) return;
        try {
          emitCloudSaveToast("saving", "Saving changes...");
          const migrated = await migrateGuestSiteToDatabase(payload, {
            siteId: activeSiteId,
          });
          if (seq !== cloudSaveSeqRef.current) return;
          saveEditorDraft({
            updatedAt: snapshotUpdatedAt,
            pendingSync: false,
            siteId: migrated.siteId,
            templateId,
            category,
            pageLinks: snapshotPageLinks,
            sections: snapshotSections,
            templateVariables: snapshotVariables,
            seo: siteSeoConfigRef.current,
          });
          if (isRedesignOpen && redesignDesignId) {
            saveEditorDraft({
              updatedAt: snapshotUpdatedAt,
              pendingSync: false,
              siteId: redesignDesignId,
              templateId,
              category,
              pageLinks: snapshotPageLinks,
              sections: snapshotSections,
              templateVariables: snapshotVariables,
              seo: siteSeoConfigRef.current,
            });
            saveRedesignEditorSections(
              redesignDesignId,
              snapshotSections as SectionItem[],
            );
          }
          setLastEditorUrl(
            `/editor?${new URLSearchParams({
              templateId,
              category,
              siteId: migrated.siteId,
              ...(isRedesignOpen && redesignDesignId
                ? { designId: redesignDesignId, redesign: "1" }
                : {}),
            }).toString()}`,
          );
          emitCloudSaveToast("saved", "Changes saved");
        } catch (error) {
          if (seq !== cloudSaveSeqRef.current) return;
          emitCloudSaveToast(
            "error",
            error instanceof Error ? error.message : "Could not save changes",
          );
        }
      });
  };

  /**
   * Switch layouts without replacing the user's project. Existing active
   * section content wins over the new theme defaults, while the target theme
   * supplies each section's new variant and any fields it requires.
   */
  useEffect(() => {
    const handleThemeChangeRequest = async (event: Event) => {
      const nextTemplateId = (
        event as CustomEvent<{ templateId?: string }>
      ).detail?.templateId;

      if (isRedesignOpen) {
        window.dispatchEvent(
          new CustomEvent("ai-builder-theme-change-failed", {
            detail: { message: "Theme switch is disabled for Redesign." },
          }),
        );
        return;
      }

      if (
        !nextTemplateId ||
        nextTemplateId === templateId ||
        themeSwitchingRef.current
      ) {
        return;
      }

      themeSwitchingRef.current = true;
      prepareEditorSurfaceForReplace();
      // Invalidate the debounce, then durably flush the exact current project
      // before converting it to the next theme. A pending timeout is not yet in
      // cloudSaveQueueRef, so waiting for the queue alone can lose recent edits.
      cloudSaveSeqRef.current += 1;

      try {
        await cloudSaveQueueRef.current.catch(() => undefined);

        const currentPageLinks = pageLinksRef.current;
        const currentSections = syncHeaderEditorState(
          sectionsRef.current,
          currentPageLinks,
          {
            preserveExistingMenu:
              getBuilderTemplate(templateId, category).type !== "Single Page Website",
          },
        );
        const currentTemplateVariables = templateVariablesRef.current;
        const currentUpdatedAt = Date.now();
        const currentPayload: GuestSitePayload = {
          templateId,
          category,
          clientUpdatedAt: currentUpdatedAt,
          pageLinks: currentPageLinks,
          sections: currentSections,
          templateVariables: currentTemplateVariables,
          ...(isRedesignOpen
            ? {
                createPath: "redesign" as const,
                ...(redesignDesignId ? { designId: redesignDesignId } : {}),
              }
            : {}),
        };

        saveEditorDraft({
          updatedAt: currentUpdatedAt,
          siteId: persistDraftSiteId,
          templateId,
          category,
          pageLinks: currentPageLinks,
          sections: currentSections,
          templateVariables: currentTemplateVariables,
          seo: siteSeoConfigRef.current,
        });
        if (user) {
          emitCloudSaveToast("saving", "Saving before theme change...");
          await migrateGuestSiteToDatabase(currentPayload, {
            siteId: activeSiteId,
          });
          saveEditorDraft({
            updatedAt: currentUpdatedAt,
            pendingSync: false,
            siteId: persistDraftSiteId,
            templateId,
            category,
            pageLinks: currentPageLinks,
            sections: currentSections,
            templateVariables: currentTemplateVariables,
            seo: siteSeoConfigRef.current,
          });
        }

        await refreshCategoryContentFromApi();
        const nextConfig = buildSelectedConfig(nextTemplateId, category);
        const themeNav = buildDefaultThemeNav(nextTemplateId, category);
        const preservedPageExtras = flattenPageLinks(currentPageLinks).filter(
          (link) =>
            link.kind === "blog" ||
            link.kind === "document" ||
            link.kind === "blogIndex",
        );
        const nextPageLinks = normalizeEditorPageLinks(
          nextTemplateId,
          nextConfig.sections,
          [...themeNav.headerMenu, ...preservedPageExtras],
          category,
        );
        const nextHeaderMenu = adaptPageLinksForTemplate(
          themeNav.headerMenu,
          nextTemplateId,
          nextConfig.sections,
          category,
        );
        saveOnboardingNavSnapshot({
          templateId: nextTemplateId,
          menu: nextHeaderMenu,
          footerColumns: themeNav.footerColumns,
        });
        const existingOnboardingDraft = readOnboardingDraft("create-custom");
        saveOnboardingDraft({
          step: existingOnboardingDraft?.step ?? 3,
          businessInfo:
            existingOnboardingDraft?.businessInfo ||
            defaultOnboardingBusinessInfo(),
          selectedCategory: category,
          selectedTemplateId: nextTemplateId,
          showMonitor: existingOnboardingDraft?.showMonitor ?? false,
          pagesSelection: themeNav.pagesSelection,
          createPath: "create-custom",
        });
        try {
          writeFlowPageLinks("create-custom", nextPageLinks);
          writeFlowFooterColumns("create-custom", themeNav.footerColumns);
          sessionStorage.setItem("css-ai-apply-onboarding-header", "1");
        } catch {
          /* ignore */
        }
        const destPageSlugs = new Set(
          getTemplatePages(getBuilderTemplate(nextTemplateId, category)).map(
            (page) => normalizePageSlug(page.id),
          ),
        );
        const previousPageSlugs = new Set(
          getTemplatePages(getBuilderTemplate(templateId, category)).map(
            (page) => normalizePageSlug(page.id),
          ),
        );

        const mappedHome = nextConfig.sections
          .filter((section) => !section.page)
          .map((targetSection) => {
            const current = currentSections.find(
              (section) => section.type === targetSection.type && !section.page,
            );
            if (!current || targetSection.type === "Banner") {
              return {
                ...targetSection,
                id: current?.id || targetSection.id || targetSection.type,
              };
            }

            const nextSection = applyThemeVariantToSection(
              {
                ...current,
                data: current.data as unknown as Record<
                  string,
                  Record<string, unknown>
                >,
              },
              {
                variant: targetSection.variant,
                data: targetSection.data as unknown as Record<
                  string,
                  Record<string, unknown>
                >,
              },
              targetSection.type === "Header"
                ? { menu: nextHeaderMenu }
                : undefined,
            );

            const normalizedSection = {
              ...current,
              ...nextSection,
              data: nextSection.data as SectionItem["data"],
            } as SectionItem;

            return {
              ...normalizedSection,
              data: syncSectionContentAcrossVariants(
                normalizedSection,
                normalizedSection.data,
                normalizedSection.variant,
              ),
            };
          });

        const keptInnerPages = currentSections.filter((section) => {
          if (!section.page) return false;
          const slug = normalizePageSlug(section.page);
          if (destPageSlugs.has(slug)) return true;
          if (previousPageSlugs.has(slug)) return false;
          return true;
        });

        const switchedSections = adaptSectionsHrefsForTemplate(
          [...mappedHome, ...keptInnerPages],
          nextTemplateId,
          nextConfig.sections,
          category,
        ).map((section) => {
          // Re-assert header menu after href rewrite so section anchors /
          // page links match the destination template type.
          if (section.type !== "Header") return section;
          const active = section.data[section.variant];
          if (!active) return section;
          const withMenu = {
          ...section,
          data: {
            ...section.data,
              [section.variant]: {
                ...active,
                menu: nextHeaderMenu,
            },
          },
        };
          return {
            ...withMenu,
            data: syncSectionContentAcrossVariants(
              withMenu,
              withMenu.data,
              withMenu.variant,
            ),
          };
        });
        // Cover every existing page slug so align remaps inner pages into the
        // new theme instead of leaving stale variants only fixed on refresh.
        const pageLinksForAlign = (() => {
          const links = [...nextPageLinks];
          const seen = new Set(
            flattenPageLinks(links).map((link) =>
              normalizePageSlug(getMultiPageSlugFromHref(link.href) || ""),
            ),
          );
          switchedSections.forEach((section) => {
            const slug = normalizePageSlug(section.page || "");
            if (!slug || seen.has(slug)) return;
            seen.add(slug);
            links.push({
              label: formatSectionName(section.type),
              href: `#page-${slug}`,
            });
          });
          return links;
        })();
        const nextSections = applyOnboardingBrandToSections(
          ensureMissingPageBreadcrumbs(
            syncPageBreadcrumbsToTemplate(
              alignTemplatePageSections(
                switchedSections,
                nextTemplateId,
                category,
                pageLinksForAlign,
              ),
              nextTemplateId,
              category,
            ),
            nextTemplateId,
            category,
          ).map((section) => {
            if (section.type !== "Footer") return section;
            return {
              ...section,
              data: syncSectionContentAcrossVariants(
                section,
                Object.fromEntries(
                  Object.entries(section.data || {}).map(([variant, variantData]) => [
                    variant,
                    {
                      ...((variantData || {}) as Record<string, unknown>),
                      footerColumns: themeNav.footerColumns,
                    },
                  ]),
                ) as SectionItem["data"],
                section.variant,
              ),
            };
          }),
          // Logo/contact stay; header/footer reset to this theme's Choose-pages defaults.
          { overwrite: true, applyNav: true },
        );
        const nextTemplateVariables = {
          ...getTemplateVariables(nextTemplateId, category),
          // Keep typography choices, but let the destination theme reset colors.
          ...Object.fromEntries(
            Object.entries(currentTemplateVariables).filter(([key]) =>
              key === "fontFamily" ||
              key === "--font-body" ||
              key === "--font-heading" ||
              key === "--font-ui",
            ),
          ),
        };
        const nextUpdatedAt = Math.max(Date.now(), currentUpdatedAt + 1);
        const payload: GuestSitePayload = {
          templateId: nextTemplateId,
          category,
          clientUpdatedAt: nextUpdatedAt,
          pageLinks: nextPageLinks,
          sections: nextSections,
          templateVariables: nextTemplateVariables,
          seo: siteSeoConfigRef.current,
        };

        saveEditorRevision({
          siteId: persistDraftSiteId,
          templateId: nextTemplateId,
          category,
          sections: nextSections,
          pageLinks: nextPageLinks,
          templateVariables: nextTemplateVariables,
        });
        saveEditorDraft({
          updatedAt: nextUpdatedAt,
          pendingSync: true,
          siteId: persistDraftSiteId,
          templateId: nextTemplateId,
          category,
          pageLinks: nextPageLinks,
          sections: nextSections,
          templateVariables: nextTemplateVariables,
          seo: siteSeoConfigRef.current,
        });
        markThemeSwitchLock(activeSiteId, nextTemplateId);

        let resolvedSiteId = activeSiteId || "";
        if (user) {
          emitCloudSaveToast("saving", "Applying theme...");
          const migrated = await migrateGuestSiteToDatabase(payload, {
            siteId: activeSiteId,
          });
          resolvedSiteId = migrated.siteId;
          saveEditorDraft({
            updatedAt: nextUpdatedAt,
            pendingSync: false,
            siteId: migrated.siteId,
            templateId: nextTemplateId,
            category,
            pageLinks: nextPageLinks,
            sections: nextSections,
            templateVariables: nextTemplateVariables,
            seo: siteSeoConfigRef.current,
          });
        }

        const nextParams = new URLSearchParams({
          templateId: nextTemplateId,
          category,
        });
        if (resolvedSiteId) nextParams.set("siteId", resolvedSiteId);
        const nextUrl = `/editor?${nextParams.toString()}`;

        setLastEditorUrl(nextUrl);
        setLastEditorUrl(nextUrl);
        window.dispatchEvent(
          new CustomEvent("ai-builder-theme-change-success"),
        );
        if (user) emitCloudSaveToast("saved", "Theme applied");
        // Do not setSections here â€” that reconciles against inline-decorated DOM
        // and triggers removeChild errors. Draft + route remount load the theme.
        prepareEditorSurfaceForReplace();
        router.replace(nextUrl);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to apply this theme";
        emitCloudSaveToast("error", message);
        window.dispatchEvent(
          new CustomEvent("ai-builder-theme-change-failed", {
            detail: { message },
          }),
        );
      } finally {
        themeSwitchingRef.current = false;
      }
    };

    window.addEventListener(
      "ai-builder-theme-change-request",
      handleThemeChangeRequest,
    );
    return () => {
      window.removeEventListener(
        "ai-builder-theme-change-request",
        handleThemeChangeRequest,
      );
    };
  }, [
    activeSiteId,
    category,
    isRedesignOpen,
    pageLinks,
    router,
    setPageLinks,
    setThemeVariables,
    syncedSections,
    templateId,
    user,
  ]);

  /** Manual SEO save only (SEO typing does not autosave / flash toast) */
  useEffect(() => {
    const handleSeoSave = async () => {
      const seo = siteSeoConfigRef.current;
      const snapshotPageLinks = pageLinksRef.current;
      const snapshotSections = syncHeaderEditorState(
        sectionsRef.current,
        snapshotPageLinks,
        { preserveExistingMenu: !isSinglePageTemplate },
      );
      const snapshotVariables = templateVariablesRef.current;
      const seoUpdatedAt = Date.now();

      saveEditorDraft({
        updatedAt: seoUpdatedAt,
        pendingSync: true,
        siteId: persistDraftSiteId,
        templateId,
        category,
        sections: snapshotSections,
        pageLinks: snapshotPageLinks,
        templateVariables: snapshotVariables,
        seo,
      });

      if (!user) {
        emitCloudSaveToast("saved", "SEO saved on this device");
        return;
      }

      try {
        emitCloudSaveToast("saving", "Saving SEO...");
        const migrated = await migrateGuestSiteToDatabase(
          {
            templateId,
            category,
            clientUpdatedAt: seoUpdatedAt,
            pageLinks: snapshotPageLinks,
            sections: snapshotSections,
            templateVariables: snapshotVariables,
            seo,
          },
          { siteId: activeSiteId },
        );
        saveEditorDraft({
          updatedAt: seoUpdatedAt,
          pendingSync: false,
          siteId: migrated.siteId,
          templateId,
          category,
          sections: snapshotSections,
          pageLinks: snapshotPageLinks,
          templateVariables: snapshotVariables,
          seo,
        });
        setLastEditorUrl(
          `/editor?${new URLSearchParams({
            templateId,
            category,
            siteId: migrated.siteId,
          }).toString()}`,
        );
        emitCloudSaveToast("saved", "SEO saved");
      } catch (error) {
        console.error("SEO save failed", error);
        emitCloudSaveToast(
          "error",
          error instanceof Error ? error.message : "Could not save SEO",
        );
      }
    };

    window.addEventListener("ai-builder-seo-save", handleSeoSave);
    return () => {
      window.removeEventListener("ai-builder-seo-save", handleSeoSave);
    };
  }, [templateId, category, user, activeSiteId, isSinglePageTemplate]);

  useEffect(() => {
    const readBrandLogo = () => {
      const header = sectionsRef.current.find(
        (section) => section.type === "Header",
      );
      const data = header
        ? header.data?.[header.variant] ?? header.data?.["Header-1"]
        : undefined;
      const logoImage =
        data && typeof data === "object" && typeof data.logoImage === "string"
          ? data.logoImage
          : "";
      window.dispatchEvent(
        new CustomEvent("ai-builder-brand-logo", {
          detail: { logoImage },
        }),
      );
    };

    const handleLogoRequest = () => {
      readBrandLogo();
    };

    const handleSetLogo = (event: Event) => {
      const detail = (
        event as CustomEvent<{ logoImage?: string; logoImageTitle?: string }>
      ).detail;
      const logoImage = typeof detail?.logoImage === "string" ? detail.logoImage : "";
      const logoImageTitle =
        typeof detail?.logoImageTitle === "string" && detail.logoImageTitle.trim()
          ? detail.logoImageTitle
          : "Logo";
      commitSections((currentSections) =>
        currentSections.map((section) => {
          if (section.type !== "Header" && section.type !== "Footer") {
            return section;
          }
          const active =
            section.data?.[section.variant] ??
            ({} as SectionData);
          const nextData = {
            ...section.data,
            [section.variant]: {
              ...active,
              logoImage,
              logoImageTitle: logoImage ? logoImageTitle : "",
            },
          };
          return {
            ...section,
            data: syncHeaderProjectFields(
              { ...section, data: nextData },
              nextData,
            ),
          };
        }),
      );
      sectionsRef.current.forEach((section) => {
        if (section.type === "Header" || section.type === "Footer") {
          bumpSectionRenderEpoch(section.id ?? section.type);
        }
      });
      urgentAutosaveRef.current = true;
      readBrandLogo();
    };

    window.addEventListener("ai-builder-brand-logo-request", handleLogoRequest);
    window.addEventListener("ai-builder-set-brand-logo", handleSetLogo);
    return () => {
      window.removeEventListener(
        "ai-builder-brand-logo-request",
        handleLogoRequest,
      );
      window.removeEventListener("ai-builder-set-brand-logo", handleSetLogo);
    };
  }, []);

  /** Save the current editor state before the isolated multi-device preview loads. */
  useEffect(() => {
    const handlePreviewRequest = async () => {
      const authRes = await fetch("/api/user/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (!authRes.ok) {
        window.dispatchEvent(
          new CustomEvent("ai-builder-preview-failed", {
            detail: { message: "Login is required to preview this website" },
          }),
        );
        return;
      }

      try {
        saveEditorDraft({
          siteId: persistDraftSiteId,
          templateId,
          category,
          sections: syncedSections,
          pageLinks,
          templateVariables,
          seo: siteSeoConfigRef.current,
        });

        const migrated = await migrateGuestSiteToDatabase(
          {
            templateId,
            category,
            pageLinks,
            sections: syncedSections,
            templateVariables,
          },
          { siteId: activeSiteId },
        );

        setLastEditorUrl(
          `/editor?${new URLSearchParams({
            templateId,
            category,
            siteId: migrated.siteId,
          }).toString()}`,
        );

        window.dispatchEvent(
          new CustomEvent("ai-builder-preview-ready", {
            detail: { siteId: migrated.siteId },
          }),
        );
      } catch (error) {
        window.dispatchEvent(
          new CustomEvent("ai-builder-preview-failed", {
            detail: {
              message:
                error instanceof Error
                  ? error.message
                  : "Unable to prepare website preview",
            },
          }),
        );
      }
    };

    window.addEventListener("ai-builder-preview-request", handlePreviewRequest);
    return () => {
      window.removeEventListener(
        "ai-builder-preview-request",
        handlePreviewRequest,
      );
    };
  }, [
    activeSiteId,
    category,
    pageLinks,
    syncedSections,
    templateId,
    templateVariables,
    user,
  ]);

  /** Local draft + cloud autosave for content (SEO not overwritten) */
  useEffect(() => {
    // The theme handler persists one atomic old snapshot and one atomic target
    // snapshot itself. Do not let its intermediate render get stored under the
    // old template identity while the URL is changing.
    if (!draftReady || themeSwitchingRef.current || !cloudSaveArmed) return;

    const fingerprint = JSON.stringify({
      templateId,
      category,
      pageLinks,
      templateVariables,
      sections: syncedSections,
    });

    // Opening or refreshing the editor establishes the baseline only. Saving
    // starts after content/menu/theme state actually differs from that baseline.
    if (lastAutosaveFingerprintRef.current === null) {
      lastAutosaveFingerprintRef.current = fingerprint;
      return;
    }

    if (fingerprint === lastAutosaveFingerprintRef.current) return;
    lastAutosaveFingerprintRef.current = fingerprint;

    const payloadUpdatedAt = Date.now();

    const existingDraft = readEditorDraft(
      templateId,
      category,
      persistDraftSiteId,
    );
    const seoForDraft = hasManualSeoInConfig(siteSeoConfigRef.current)
      ? siteSeoConfigRef.current
      : existingDraft?.seo || siteSeoConfigRef.current;
    saveEditorDraft({
      updatedAt: payloadUpdatedAt,
      siteId: persistDraftSiteId,
      templateId,
      category,
      sections: syncedSections,
      pageLinks,
      templateVariables,
      seo: seoForDraft,
    });
    if (isRedesignOpen && redesignDesignId) {
      saveRedesignEditorSections(
        redesignDesignId,
        syncedSections as SectionItem[],
      );
    }
    saveEditorRevision({
      siteId: persistDraftSiteId,
      templateId,
      category,
      sections: syncedSections,
      pageLinks,
      templateVariables,
    });

    if (!user) return;

    const seq = ++cloudSaveSeqRef.current;
    const autosaveDelay = urgentAutosaveRef.current ? 0 : 1200;
    const cloudTimeout = window.setTimeout(() => {
      urgentAutosaveRef.current = false;
      cloudSaveQueueRef.current = cloudSaveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          if (
            seq !== cloudSaveSeqRef.current ||
            themeSwitchingRef.current
          ) {
            return;
          }
          try {
            emitCloudSaveToast("saving", "Saving...");
        // Do not pass seo here â€” keeps previously saved SEO in DB
            const migrated = await migrateGuestSiteToDatabase(
              {
                templateId,
                category,
                clientUpdatedAt: payloadUpdatedAt,
                pageLinks,
                sections: syncedSections,
                templateVariables,
                ...(isRedesignOpen
                  ? {
                      createPath: "redesign" as const,
                      ...(redesignDesignId
                        ? { designId: redesignDesignId }
                        : {}),
                    }
                  : {}),
              },
              { siteId: activeSiteId },
            );
            if (seq !== cloudSaveSeqRef.current) return;

            saveEditorDraft({
              updatedAt: payloadUpdatedAt,
              pendingSync: false,
              siteId: migrated.siteId,
              templateId,
              category,
              pageLinks,
              sections: syncedSections,
              templateVariables,
              seo: seoForDraft,
            });
            // Redesign URL stays on designId — keep that slot in sync too.
            if (isRedesignOpen && redesignDesignId) {
              saveEditorDraft({
                updatedAt: payloadUpdatedAt,
                pendingSync: false,
                siteId: redesignDesignId,
                templateId,
                category,
                pageLinks,
                sections: syncedSections,
                templateVariables,
                seo: seoForDraft,
              });
              saveRedesignEditorSections(
                redesignDesignId,
                syncedSections as SectionItem[],
              );
            }

            setLastEditorUrl(
              `/editor?${new URLSearchParams({
                templateId,
                category,
                siteId: migrated.siteId,
                ...(isRedesignOpen && redesignDesignId
                  ? { designId: redesignDesignId, redesign: "1" }
                  : {}),
              }).toString()}`,
            );

            try {
              const channel = new BroadcastChannel("ai-builder-site-updated");
              channel.postMessage({
                type: "site-config-saved",
                siteId: migrated.siteId,
                slug: migrated.slug,
                at: Date.now(),
              });
              channel.close();
            } catch {
              /* BroadcastChannel unsupported */
            }

            emitCloudSaveToast("saved", "Changes saved");
          } catch (error) {
            if (seq !== cloudSaveSeqRef.current) return;
            console.error("Cloud autosave failed", error);
            emitCloudSaveToast(
              "error",
              error instanceof Error
                ? error.message
                : "Could not save changes",
            );
          }
        });
    }, autosaveDelay);

    return () => {
      window.clearTimeout(cloudTimeout);
    };
  }, [
    draftReady,
    cloudSaveArmed,
    syncedSections,
    pageLinks,
    templateId,
    category,
    templateVariables,
    user,
    activeSiteId,
    isRedesignOpen,
    redesignDesignId,
  ]);

  useEffect(() => {
    const handlePublishRequest = async () => {
      const publishedPayload: GuestSitePayload = {
        templateId,
        category,
        pageLinks,
        sections: syncedSections,
        templateVariables,
        seo: siteSeoConfig,
        ...(isRedesignOpen
          ? {
              createPath: "redesign" as const,
              ...(redesignDesignId ? { designId: redesignDesignId } : {}),
            }
          : { createPath: "create-custom" as const }),
      };

      const authRes = await fetch("/api/user/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!authRes.ok) {
        window.dispatchEvent(
          new CustomEvent("ai-builder-publish-login-required"),
        );
        return;
      }

      try {
        const publishUpdatedAt = Date.now();
        saveEditorDraft({
          updatedAt: publishUpdatedAt,
          pendingSync: true,
          siteId: persistDraftSiteId,
          templateId,
          category,
          sections: syncedSections,
          pageLinks,
          templateVariables,
          seo: siteSeoConfig,
        });

        const migrated = await migrateGuestSiteToDatabase(
          {
            ...publishedPayload,
            clientUpdatedAt: publishUpdatedAt,
          },
          {
            siteId: activeSiteId,
          },
        );

        const response = await fetch(
          `/api/user/sites/${migrated.siteId}/publish`,
          {
          method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({}),
          },
        );

        if (!response.ok) {
          throw new Error("Publish request failed");
        }

        const result = (await response.json()) as {
          id?: string;
          slug?: string;
          path?: string;
          url?: string;
        };

        clearGuestProgressAfterDbSave();

        const publishedPath =
          result.path ?? `/published/${result.slug ?? result.id}`;
        const publishedUrl =
          result.url ?? `${window.location.origin}${publishedPath}`;

        setPublishedSiteUrl(publishedUrl);
        setLastEditorUrl(
          `/editor?${new URLSearchParams({
            templateId,
            category,
            siteId: migrated.siteId,
            ...(isRedesignOpen && redesignDesignId
              ? { designId: redesignDesignId, redesign: "1" }
              : {}),
          }).toString()}`,
        );

        // Ensure local draft matches what was just published.
        saveEditorDraft({
          updatedAt: publishUpdatedAt,
          pendingSync: false,
          siteId: migrated.siteId,
          templateId,
          category,
          sections: syncedSections,
          pageLinks,
          templateVariables,
          seo: siteSeoConfig,
        });

        window.dispatchEvent(
          new CustomEvent("ai-builder-published", {
            detail: {
              id: result.slug ?? result.id,
              url: publishedUrl,
            },
          }),
        );
      } catch (error) {
        console.error("Database publish failed", error);
      window.dispatchEvent(
          new CustomEvent("ai-builder-publish-failed", {
          detail: {
              message:
                error instanceof Error
                  ? error.message
                  : "Unable to publish your website",
          },
        }),
      );
      }
    };

    window.addEventListener("ai-builder-publish-request", handlePublishRequest);

    return () => {
      window.removeEventListener(
        "ai-builder-publish-request",
        handlePublishRequest,
      );
    };
  }, [
    activeSiteId,
    category,
    pageLinks,
    syncedSections,
    siteSeoConfig,
    templateId,
    templateVariables,
    isRedesignOpen,
    redesignDesignId,
  ]);

  const editingSectionItem = syncedSections.find(
    (section) => (section.id ?? section.type) === editingSection,
  );
  const footerSection = syncedSections.find(
    (section) => section.type === "Footer",
  );
  const footerVariantData = footerSection
    ? footerSection.data?.[footerSection.variant] ??
      footerSection.data?.["Footer-1"]
    : undefined;
  const footerData = isRecord(footerVariantData)
    ? (footerVariantData as SectionData)
    : undefined;
  const { canUndo: canUndoEditor, canRedo: canRedoEditor } =
    historyAvailability;
  const currentPageLink = flattenPageLinks(pageLinks).find(
    (link) => normalizePageSlug(link.label) === normalizePageSlug(page),
  );
  const isViewingBlogIndex = Boolean(
    currentPageLink && isBlogIndexPageLink(currentPageLink),
  );
  const pageScopedSlug = getMultiPageSlugFromHref(currentPageLink?.href || "");
  const currentPageSlug =
    pageScopedSlug ||
    (isSinglePageTemplate ? "home" : normalizePageSlug(page));
  const pageShellSectionTypes = ["Topbar", "Header", "Footer"];
  const editorTemplate = getBuilderTemplate(templateId, category);
  const countriesServeSection = findEnabledCountriesServeSection(syncedSections);
  const visibleSectionsRaw = dropExtraPageBreadcrumbs(
    isViewingBlogIndex || masterDetailView
      ? syncedSections.filter((section) =>
          pageShellSectionTypes.includes(section.type),
        )
      : currentPageSlug && currentPageSlug !== "home"
      ? syncedSections.filter(
          (section) =>
            pageShellSectionTypes.includes(section.type) ||
            section.type === "CountriesServe" ||
            normalizePageSlug(section.page || "") === currentPageSlug,
        )
      : syncedSections.filter((section) => !section.page),
    editorTemplate,
  );
  const hasInnerPageBody = visibleSectionsRaw.some(
    (section) =>
      !pageShellSectionTypes.includes(section.type) &&
      section.type !== "CountriesServe",
  );
  const allowHeaderAddOnEmptyPage =
    Boolean(currentPageSlug && currentPageSlug !== "home") && !hasInnerPageBody;
  const visibleSectionsWithCountryBreadcrumb = (() => {
    if (masterDetailView?.master !== "country") return visibleSectionsRaw;
    const donor =
      syncedSections.find(
        (section) =>
          section.type === "Breadcrumb" &&
          (normalizePageSlug(section.page || "") === "blogs" ||
            normalizePageSlug(section.page || "") === "blog" ||
            normalizePageSlug(section.page || "") === "services" ||
            normalizePageSlug(section.page || "") === "about"),
      ) ?? syncedSections.find((section) => section.type === "Breadcrumb");
    if (!donor) return visibleSectionsRaw;
    const shell = [...visibleSectionsRaw];
    const headerIndex = shell.findIndex((section) => section.type === "Header");
    const insertAt = headerIndex >= 0 ? headerIndex + 1 : 0;
    shell.splice(insertAt, 0, {
      ...donor,
      id: `${donor.id || "Breadcrumb"}-country-detail`,
    });
    return shell;
  })();
  const visibleSections =
    orderChromeSections(
      isViewingBlogIndex || masterDetailView
        ? visibleSectionsWithCountryBreadcrumb
        : placeCountriesServeBeforeFooter(
            visibleSectionsRaw,
            countriesServeSection,
          ),
    );
  const blogIndexPosts = useMemo(() => {
    if (!isViewingBlogIndex) return [];
    return flattenPageLinks(pageLinks)
      .filter((link) => link.kind === "blog" && !link.hidden)
      .map((link) => ({
        href: link.href,
        label: link.label,
        image: link.image,
        category: link.category,
        shortDescription: link.shortDescription,
        author: link.author,
      }));
  }, [isViewingBlogIndex, pageLinks]);
  const blogIndexLayoutId = normalizeBlogIndexLayout(
    currentPageLink?.layout || "BlogIndex-1",
  );
  const openBlogsManager = () => {
    window.dispatchEvent(
      new CustomEvent("ai-builder-open-manager", {
        detail: { manager: "Blogs" },
      }),
    );
  };

  const resolveMasterDetailArticle = () => {
    if (!masterDetailView) return null;
    const { master, slug } = masterDetailView;
    const matchSlug = (value?: string) =>
      (value || "").trim().toLowerCase() === slug.trim().toLowerCase();

    if (master === "service") {
      const section = sectionsRef.current.find(
        (item) =>
          item.id === "ServicePage" ||
          item.type === "ServicePage" ||
          (item.type === "Service" &&
            ["service", "services"].includes(normalizePageSlug(item.page || ""))),
      );
      if (!section) return null;
      const data =
        (section.data[section.variant] as SectionData | undefined) ||
        (section.data["ServicePage-1"] as SectionData | undefined) ||
        ({} as SectionData);
      const item = buildServicePageState(data).services.find(
        (row) => matchSlug(row.slug) || matchSlug(createPageSlug(row.title)),
      );
      if (!item) return null;
      return (
        <ServiceDetailArticle
          key={`master-detail-${master}-${slug}`}
          service={{
            title: item.title,
            category: item.category,
            excerpt: item.desc,
            content: item.content,
            image: item.image,
            layout: item.layout,
          }}
        />
      );
    }

    if (master === "country") {
      const section = sectionsRef.current.find(
        (item) => item.type === "CountriesServe",
      );
      if (!section) return null;
      const data =
        (section.data[section.variant] as SectionData | undefined) ||
        (section.data["CountriesServe-1"] as SectionData | undefined) ||
        ({} as SectionData);
      const state = buildCountriesServeState(data);
      const item = state.countriesServeListings.find(
        (row) => matchSlug(row.slug) || matchSlug(createPageSlug(row.title)),
      );
      if (!item) return null;
      const selectedSlug =
        item.slug?.trim() || createPageSlug(item.title) || item.id;
      const countryKey = (item.category || "").trim().toLowerCase();
      const countryId = (item.countryId || "").trim();
      const relatedListings = state.countriesServeListings
        .filter((listing) => {
          const listingSlug =
            listing.slug?.trim() ||
            createPageSlug(listing.title) ||
            listing.id;
          if (listingSlug === selectedSlug) return false;
          if (listing.active === false) return false;
          if (countryId && listing.countryId === countryId) return true;
          if (!countryKey) return false;
          return (listing.category || "").trim().toLowerCase() === countryKey;
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .slice(0, 12);
      const countryLabel = item.category?.trim() || "this country";
      return (
        <div key={`master-detail-${master}-${slug}`}>
          <ServiceDetailArticle
            service={{
              title: item.title,
              category: item.category,
              excerpt: item.desc,
              content: item.content,
              image: item.image,
              layout: "ServiceDetail-1",
            }}
          />
          <RelatedCountryListingsSlider
            countryLabel={countryLabel}
            useAnchor
            items={relatedListings.map((listing) => {
              const listingSlug =
                listing.slug?.trim() ||
                createPageSlug(listing.title) ||
                listing.id;
              return {
                id: listing.id,
                title: listing.title,
                category: listing.category,
                desc: listing.desc,
                image: listing.image,
                href: `#master-detail/country/${encodeURIComponent(listingSlug)}`,
              };
            })}
          />
        </div>
      );
    }

    if (master === "event") {
      const section = sectionsRef.current.find(
        (item) =>
          item.id === "EventPage" ||
          item.type === "EventPage" ||
          (item.type === "Event" &&
            normalizePageSlug(item.page || "") === "events"),
      );
      if (!section) return null;
      const data =
        (section.data[section.variant] as SectionData | undefined) ||
        (section.data["EventPage-1"] as SectionData | undefined) ||
        ({} as SectionData);
      const item = buildEventPageState(data).events.find(
        (row) => matchSlug(row.slug) || matchSlug(createPageSlug(row.title)),
      );
      if (!item) return null;
      return (
        <EventDetailArticle
          key={`master-detail-${master}-${slug}`}
          eventItem={{
            title: item.title,
            category: item.category,
            excerpt: item.desc,
            content: item.content,
            image: item.image,
            layout: item.layout,
            eventDate: item.eventDate,
            eventTime: item.eventTime,
            eventType: item.eventType,
          }}
        />
      );
    }

    if (master === "portfolio") {
      const section = sectionsRef.current.find(
        (item) =>
          item.id === "PortfolioPage" ||
          item.type === "PortfolioPage" ||
          (item.type === "Portfolio" &&
            normalizePageSlug(item.page || "") === "portfolio"),
      );
      if (!section) return null;
      const data =
        (section.data[section.variant] as SectionData | undefined) ||
        (section.data["PortfolioPage-1"] as SectionData | undefined) ||
        ({} as SectionData);
      const item = buildPortfolioPageState(data).portfolioItems.find(
        (row) => matchSlug(row.slug) || matchSlug(createPageSlug(row.title)),
      );
      if (!item) return null;
      return (
        <PortfolioDetailArticle
          key={`master-detail-${master}-${slug}`}
          portfolioItem={{
            title: item.title,
            category: item.category,
            excerpt: item.desc,
            content: item.content,
            image: item.image,
            layout: item.layout,
          }}
        />
      );
    }

    if (master === "team") {
      const section = sectionsRef.current.find(
        (item) =>
          item.id === "TeamPage" ||
          item.type === "TeamPage" ||
          (item.type === "Team" &&
            normalizePageSlug(item.page || "") === "teams"),
      );
      if (!section) return null;
      const data =
        (section.data[section.variant] as SectionData | undefined) ||
        (section.data["TeamPage-1"] as SectionData | undefined) ||
        ({} as SectionData);
      const item = buildTeamPageState(data).teamMembers.find(
        (row) => matchSlug(row.slug) || matchSlug(createPageSlug(row.title)),
      );
      if (!item) return null;
      return (
        <TeamDetailArticle
          key={`master-detail-${master}-${slug}`}
          teamMember={{
            title: item.title,
            category: item.category,
            excerpt: item.desc,
            content: item.content,
            image: item.image,
            layout: item.layout,
          }}
        />
      );
    }

    const section = sectionsRef.current.find(
      (item) =>
        item.id === "PropertyPage" ||
        item.type === "PropertyPage" ||
        (item.type === "Property" &&
          normalizePageSlug(item.page || "") === "properties"),
    );
    if (!section) return null;
    const data =
      (section.data[section.variant] as SectionData | undefined) ||
      (section.data["PropertyPage-1"] as SectionData | undefined) ||
      ({} as SectionData);
    const item = buildPropertyPageState(data).properties.find(
      (row) => matchSlug(row.slug) || matchSlug(createPageSlug(row.title)),
    );
    if (!item) return null;
    const useRealEstateDetail = /^(PropertyPage|PropertyDetail)-[56]$/.test(
      section.variant || item.layout || "",
    );
    if (useRealEstateDetail) {
      const featureRows = [
        item.bedrooms
          ? { label: "Bedrooms", value: item.bedrooms }
          : null,
        item.areaSqft
          ? {
              label: "Area",
              value: /sq\.?\s*ft|sqft/i.test(item.areaSqft)
                ? item.areaSqft
                : `${item.areaSqft} sq.ft`,
            }
          : null,
        item.bathrooms
          ? { label: "Bathrooms", value: item.bathrooms }
          : null,
        item.parking
          ? { label: "Parking", value: item.parking }
          : null,
      ].filter(Boolean);
      return (
        <RealEstatePropertyDetail1
          key={`master-detail-${master}-${slug}`}
          data={{
            title: item.title,
            image: item.image,
            alt: item.alt || item.title,
            category:
              item.listingType === "rent" ? "For Rent" : "For Sale",
            subtitle: item.category,
            statusText: item.statusText,
            price: item.price,
            description: item.desc,
            body: item.content,
            location: item.address,
            propertyType: item.propertyType,
            bedrooms: item.bedrooms,
            bathrooms: item.bathrooms,
            areaSqft: item.areaSqft,
            parking: item.parking,
            features: featureRows,
            amenities: item.amenities,
            gallery: Array.isArray(item.gallery) ? item.gallery : [],
            floorPlan: item.floorPlan,
            homeLabel: "Home",
            homeHref: "#",
            propertiesLabel: "Properties",
            propertiesHref: "#page-properties",
            primaryButtonHref: "#page-contact",
            primaryButtonLabel: "Book a visit",
            backButtonLabel: "All properties",
          }}
        />
      );
    }
    return (
      <PropertyDetailArticle
        key={`master-detail-${master}-${slug}`}
        propertyItem={{
          title: item.title,
          category: item.category,
          excerpt: item.desc,
          content: item.content,
          image: item.image,
          layout: item.layout,
          price: item.price,
          address: item.address,
          bedrooms: item.bedrooms,
          bathrooms: item.bathrooms,
          areaSqft: item.areaSqft,
          parking: item.parking,
          propertyType: item.propertyType,
          listingType: item.listingType,
          amenities: item.amenities,
          floorPlan: item.floorPlan,
          gallery: Array.isArray(item.gallery) ? item.gallery : [],
        }}
      />
    );
  };

  const masterDetailArticle = resolveMasterDetailArticle();
  const pageSectionLinks: EditorPageLink[] = (() => {
    // Always derive from full home sections so footer/header link pickers
    // keep real anchors even when viewing an inner/document page.
    const homeSections = syncedSections.filter((section) => !section.page);
    return homeSections
      .map((section, sectionIndex) => ({ section, sectionIndex }))
      .filter(
        ({ section }) =>
          !["Topbar", "Header", "Footer"].includes(section.type),
      )
      .map(({ section, sectionIndex }) => ({
        label: getSectionLinkLabel(section),
        href:
          section.type === "Banner"
            ? "#"
            : `#${getSectionAnchorId(homeSections, sectionIndex)}`,
      }));
  })();
  const blogIndexBlock = isViewingBlogIndex ? (
    <EditableSection
      key="blog-index-listing"
      label="Blogs"
      anchorId="page-blogs"
      category={category}
      pageScope="page"
      pageSectionLinks={pageSectionLinks}
      isSinglePage={isSinglePageTemplate}
      lockCanvasEdit
      onEdit={openBlogsManager}
      onDelete={() => undefined}
      onAiAssist={() => {
        window.dispatchEvent(
          new CustomEvent("ai-builder-open-section-chat", {
            detail: {
              sectionId: "BlogIndex",
              sectionType: "BlogIndex",
              label: "Blogs",
            },
          }),
        );
      }}
      onAddSection={() => undefined}
      onAddCustomSection={() => undefined}
      onInlineTextEdit={() => undefined}
      onInlineLinkEdit={() => undefined}
      onInlineMediaEdit={() => undefined}
    >
      <BlogIndexList
        blogs={blogIndexPosts}
        layout={blogIndexLayoutId}
        getHref={(blog) => blog.href || "#"}
      />
    </EditableSection>
  ) : null;
  const countriesServeShellBlock = (() => {
    if (!(isViewingBlogIndex || masterDetailView) || !countriesServeSection) {
      return null;
    }
    const section = countriesServeSection;
    const Component = sectionRegistry[section.variant];
    if (!Component) return null;
    const defaultVariant = `${section.type}-1`;
    const variantData =
      section.data?.[section.variant] ?? section.data?.[defaultVariant];
    const sectionData = (
      isRecord(variantData) ? variantData : section.data
    ) as SectionData;
    const sectionId = section.id ?? section.type;
    return (
      <EditableSection
        key={`countries-serve-shell-${sectionId}`}
        label="Countries"
        sectionType={section.type}
        anchorId="countries-we-serve"
        category={category}
        pageScope="home"
        pageSectionLinks={pageSectionLinks}
        isSinglePage={isSinglePageTemplate}
        onEdit={() => {
          window.dispatchEvent(
            new CustomEvent("ai-builder-open-manager", {
              detail: { manager: "Countries" },
            }),
          );
        }}
        onDelete={() => undefined}
        onAiAssist={() => {
          window.dispatchEvent(
            new CustomEvent("ai-builder-open-section-chat", {
              detail: {
                sectionId,
                sectionType: "CountriesServe",
                label: "Countries",
              },
            }),
          );
        }}
        onAddSection={() => undefined}
        onAddCustomSection={() => undefined}
        onInlineTextEdit={() => undefined}
        onInlineLinkEdit={() => undefined}
        onInlineMediaEdit={() => undefined}
      >
        <Component data={sectionData} editorMode />
      </EditableSection>
    );
  })();
  const masterDetailCountryListing = (() => {
    if (masterDetailView?.master !== "country") return null;
    const section = syncedSections.find((item) => item.type === "CountriesServe");
    if (!section) return null;
    const data =
      (section.data[section.variant] as SectionData | undefined) ||
      (section.data["CountriesServe-1"] as SectionData | undefined) ||
      ({} as SectionData);
    const state = buildCountriesServeState(data);
    const slug = masterDetailView.slug.trim().toLowerCase();
    return (
      state.countriesServeListings.find((row) => {
        const listingSlug = (
          row.slug?.trim() ||
          createPageSlug(row.title) ||
          row.id ||
          ""
        ).toLowerCase();
        return listingSlug === slug;
      }) || null
    );
  })();
  const countriesServeBreadcrumbParent =
    masterDetailCountryListing?.category?.trim() || "Countries";
  const scrollToTopbar = () => {
    const scrollContainer = document.querySelector<HTMLElement>(
      "[data-template-scroll]",
    );

    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main
      data-editor-live-surface
      data-site-theme-root
      className="editor-smooth-surface w-full max-w-full overflow-x-clip [overflow-wrap:anywhere]"
      style={
        {
          ...templateVariables,
          fontFamily:
            templateVariables["--font-body"] ||
            templateVariables.fontFamily ||
            undefined,
        } as React.CSSProperties
      }
    >
      <style dangerouslySetInnerHTML={{ __html: SITE_THEME_GLOBAL_CSS }} />
      {visibleSections.map((section) => {
        const sectionId = section.id ?? section.type;
        const sectionIndex = visibleSections.findIndex(
          (item) => (item.id ?? item.type) === sectionId,
        );
        const previousSection = visibleSections[sectionIndex - 1];
        const nextSection = visibleSections[sectionIndex + 1];
        const canMoveUp =
          Boolean(previousSection) &&
          !isLockedSection(section) &&
          !isLockedSection(previousSection);
        const canMoveDown =
          Boolean(nextSection) &&
          !isLockedSection(section) &&
          !isLockedSection(nextSection);
        const renderVariant = resolveTemplateSectionVariant(
          section,
          editorTemplate,
        );
        const Component = sectionRegistry[renderVariant];
        const defaultVariant = `${section.type}-1`;
        const variantData =
          section.data?.[renderVariant] ??
          section.data?.[section.variant] ??
          section.data?.[defaultVariant];

        const rawVariantData = isRecord(variantData) ? variantData : section.data;
        const isServiceListing =
          section.type === "ServicePage" ||
          (section.type === "Service" &&
            ["service", "services"].includes(normalizePageSlug(section.page || "")));
        const isEventListing =
          section.type === "EventPage" ||
          (section.type === "Event" &&
            normalizePageSlug(section.page || "") === "events");
        const isPortfolioListing =
          section.type === "PortfolioPage" ||
          (section.type === "Portfolio" &&
            normalizePageSlug(section.page || "") === "portfolio");
        const serviceLayout =
          typeof rawVariantData.layout === "string" &&
          rawVariantData.layout.startsWith("ServicePage-")
            ? rawVariantData.layout
            : section.variant;
        const eventLayout =
          typeof rawVariantData.layout === "string" &&
          rawVariantData.layout.startsWith("EventPage-")
            ? rawVariantData.layout
            : section.variant;
        const portfolioLayout =
          typeof rawVariantData.layout === "string" &&
          rawVariantData.layout.startsWith("PortfolioPage-")
            ? rawVariantData.layout
            : section.variant;
        const sectionData = {
          ...rawVariantData,
          ...overlayManagerHomeFeed(
            { ...section, variant: renderVariant },
            sections.map((item) => ({
              ...item,
              variant: resolveTemplateSectionVariant(item, editorTemplate),
            })),
            pageLinks,
          ),
          ...(section.type === "CustomSection"
            ? { customSectionId: sectionId }
            : {}),
          ...(isServiceListing ? { layout: serviceLayout } : {}),
          ...(isEventListing ? { layout: eventLayout } : {}),
          ...(isPortfolioListing ? { layout: portfolioLayout } : {}),
          ...(isServiceListing &&
          masterGroupFilter?.master === "service" &&
          masterGroupFilter.slug
            ? {
                productItems: (
                  Array.isArray(rawVariantData.productItems)
                    ? rawVariantData.productItems
                    : []
                ).filter((item) => {
                  if (!item || typeof item !== "object") return false;
                  const category =
                    "category" in item && typeof item.category === "string"
                      ? item.category
                      : "";
                  const slug = createPageSlug(category);
                  return (
                    slug === masterGroupFilter.slug ||
                    category.trim().toLowerCase() ===
                      masterGroupFilter.slug.toLowerCase()
                  );
                }),
              }
            : {}),
          ...(isEventListing &&
          masterGroupFilter?.master === "event" &&
          masterGroupFilter.slug
            ? {
                productItems: (
                  Array.isArray(rawVariantData.productItems)
                    ? rawVariantData.productItems
                    : []
                ).filter((item) => {
                  if (!item || typeof item !== "object") return false;
                  const category =
                    "category" in item && typeof item.category === "string"
                      ? item.category
                      : "";
                  const slug = createPageSlug(category);
                  return (
                    slug === masterGroupFilter.slug ||
                    category.trim().toLowerCase() ===
                      masterGroupFilter.slug.toLowerCase()
                  );
                }),
              }
            : {}),
          ...(isPortfolioListing &&
          masterGroupFilter?.master === "portfolio" &&
          masterGroupFilter.slug
            ? {
                productItems: (
                  Array.isArray(rawVariantData.productItems)
                    ? rawVariantData.productItems
                    : []
                ).filter((item) => {
                  if (!item || typeof item !== "object") return false;
                  const category =
                    "category" in item && typeof item.category === "string"
                      ? item.category
                      : "";
                  const slug = createPageSlug(category);
                  return (
                    slug === masterGroupFilter.slug ||
                    category.trim().toLowerCase() ===
                      masterGroupFilter.slug.toLowerCase()
                  );
                }),
              }
            : {}),
          ...(section.type === "Breadcrumb" && masterDetailCountryListing
            ? {
                title: masterDetailCountryListing.title,
                parentLabel: countriesServeBreadcrumbParent,
                desc:
                  masterDetailCountryListing.desc ||
                  (typeof rawVariantData.desc === "string"
                    ? rawVariantData.desc
                    : ""),
              }
            : {}),
        } as SectionData;
        const stickyMode =
          section.type === "Header"
            ? (sectionData.headerType ?? "scroll")
            : section.type === "Topbar"
              ? (sectionData.topbarType ?? "scroll")
              : "scroll";

        if (!Component) return null;

        const sectionEl = (
          <EditableSection
            label={getEditorSectionDisplayLabel(section)}
            sectionType={section.type}
            anchorId={getSectionAnchorId(visibleSections, sectionIndex)}
            category={category}
            pageScope={createPageSlug(page) === "home" ? "home" : "page"}
            forceShowAddButton={
              allowHeaderAddOnEmptyPage && section.type === "Header"
            }
            pageSectionLinks={pageSectionLinks}
            isSinglePage={isSinglePageTemplate}
            onEdit={() => {
              const manager = resolveManagerForSection(section);
              if (manager) {
                window.dispatchEvent(
                  new CustomEvent("ai-builder-open-manager", {
                    detail: { manager, preservePage: true },
                  }),
                );
                return;
              }
              prepareEditorSurfaceForReplace();
              bumpSectionRenderEpoch(sectionId);
              setEditingSectionInitialTab(undefined);
              setEditingSection(sectionId);
            }}
            onDelete={() => deleteSection(sectionId)}
            onAiAssist={() => {
              window.dispatchEvent(
                new CustomEvent("ai-builder-open-section-chat", {
                  detail: {
                    sectionId,
                    sectionType: section.type,
                    label: getEditorSectionDisplayLabel(section),
                  },
                }),
              );
            }}
            onAddSection={(sectionType, variant) =>
              addSectionAfter(sectionId, sectionType, variant)
            }
            onAddCustomSection={(columnCount) => addCustomSectionAfter(sectionId, columnCount)}
            stickyMode={stickyMode}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            onMoveUp={() => moveSection(sectionId, -1)}
            onMoveDown={() => moveSection(sectionId, 1)}
            onInlineTextEdit={(
              oldText,
              newText,
              formattedHtml,
              oldOccurrence,
              newOccurrence,
              formatKey,
            ) =>
              updateInlineText(
                sectionId,
                section.variant,
                section.type,
                oldText,
                newText,
                formattedHtml,
                oldOccurrence,
                newOccurrence,
                formatKey,
              )
            }
            inlineTextFormats={readInlineTextFormats(sectionData)}
            onInlineLinkEdit={(oldHref, newHref, linkText) =>
              updateInlineLink(
                sectionId,
                section.variant,
                section.type,
                oldHref,
                newHref,
                linkText,
              )
            }
            onInlineMediaEdit={(
              oldSrc,
              newSrc,
              mediaType,
              fileName,
              occurrence,
              fieldHint,
            ) =>
              updateInlineMedia(
                sectionId,
                section.variant,
                section.type,
                oldSrc,
                newSrc,
                mediaType,
                fileName,
                occurrence,
                fieldHint,
              )
            }
          >
            <Component
              key={`${sectionId}-inline-${inlineRenderEpochs[sectionId] ?? 0}`}
              data={sectionData}
              editorMode
            />
          </EditableSection>
        );

        if (
          (isViewingBlogIndex || masterDetailArticle) &&
          section.type === "Footer"
        ) {
          return (
            <React.Fragment key={`section-${sectionId}`}>
              {isViewingBlogIndex ? blogIndexBlock : null}
              {masterDetailArticle}
              {countriesServeShellBlock}
              {sectionEl}
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={`section-${sectionId}`}>{sectionEl}</React.Fragment>
        );
      })}
      {isViewingBlogIndex &&
        !visibleSections.some((section) => section.type === "Footer") &&
        blogIndexBlock}
      {masterDetailArticle &&
        !visibleSections.some((section) => section.type === "Footer") &&
        masterDetailArticle}
      {(isViewingBlogIndex || masterDetailArticle) &&
        !visibleSections.some((section) => section.type === "Footer") &&
        countriesServeShellBlock}

      {editingSectionItem && (
        <EditSectionModal
          key={`section-modal-${editingSectionItem.id ?? editingSectionItem.type}`}
          sectionId={editingSectionItem.id ?? editingSectionItem.type}
          sectionType={editingSectionItem.type}
          category={category}
          isSinglePage={
            getBuilderTemplate(templateId, category).type === "Single Page Website"
          }
          sections={syncedSections}
          onClose={() => setEditingSection(null)}
          onSave={handleSectionSave}
          onSelectVariant={updateSectionVariant}
          onUpdateSectionData={updateSectionData}
          initialTab={editingSectionInitialTab}
        />
      )}

      {savedToastSection && (
        <div
          key={`section-saved-toast-${savedToastSection}`}
          className="fixed bottom-3 left-1/2 z-[10000] w-[min(92vw,300px)] -translate-x-1/2 rounded-[22px] border border-gray-500 bg-blue-600 px-1 py-3 text-center text-lg font-medium text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
          role="status"
          aria-live="polite"
        >
          {formatSectionName(savedToastSection)} changes saved
        </div>
      )}

      {inlineUpdateToast && (
        <div
          key={`inline-update-toast-${inlineUpdateToast}`}
          className="fixed right-4 top-4 z-[10003] rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-[0_12px_35px_rgba(15,23,42,0.16)]"
          role="status"
          aria-live="polite"
        >
          {inlineUpdateToast}
        </div>
      )}

      {aiApplyBusy ? (
        <div
          className="fixed inset-0 z-[10250] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[3px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex min-w-[240px] max-w-[340px] flex-col items-center gap-3 rounded-2xl border border-white/70 bg-white px-7 py-6 text-center shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
            <span className="relative grid size-14 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-violet-400/25" />
              <span className="relative grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
                <Sparkles size={22} />
              </span>
            </span>
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-zinc-900">
                {aiApplyLabel}
              </p>
              <p className="mt-1 text-[12px] text-zinc-500">
                Please wait â€” applying changes on the page
              </p>
            </div>
            <Loader2
              size={22}
              className="animate-spin text-violet-600"
              aria-hidden="true"
            />
          </div>
        </div>
      ) : null}

      <div
        data-editor-toolbar
        className="fixed bottom-5 right-20 z-[9010] flex items-center gap-1 rounded-full border border-slate-300 bg-white p-1.5 shadow-lg"
      >
        <button
          type="button"
          disabled={!canUndoEditor}
          onClick={undoEditorChange}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Undo editor change"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={17} />
        </button>
        <button
          type="button"
          disabled={!canRedoEditor}
          onClick={redoEditorChange}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Redo editor change"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={17} />
        </button>
        <button
          type="button"
          onClick={openRevisionHistory}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
          aria-label="Open revision history"
          title="Version history"
        >
          <History size={17} />
        </button>
        </div>

      {showHistory && (
        <div
          className="fixed inset-0 z-[10050] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowHistory(false);
          }}
        >
          <div
            ref={historyDialogRef}
            className="flex max-h-[min(86vh,680px)] w-[min(94vw,560px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Version history"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Version history
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Recent autosaved versions on this device
                </p>
              </div>
      <button
        type="button"
                onClick={() => setShowHistory(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Close version history"
              >
                <X size={18} />
      </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {savedRevisions.length ? (
                <div className="space-y-2">
                  {savedRevisions.map((revision) => (
                    <div
                      key={revision.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {new Date(revision.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {revision.sections.length} sections
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => restoreRevision(revision)}
                        className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-slate-500">
                  A saved version will appear after your next change.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <FloatingActionButtons
        footerData={footerData}
        onBackToTop={scrollToTopbar}
      />
    </main>
  );
}
