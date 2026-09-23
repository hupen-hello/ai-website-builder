"use client";

import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Home,
  LayoutDashboard,
} from "lucide-react";
import { FloatingActionButtons } from "../../editor/layout/src/lib/FloatingActionButtons";
import { polishCreateAiExportHtml } from "@/lib/create-ai-chrome";
import {
  PreviewProvider,
  usePreview,
} from "../../editor/layout/src/components/context/PreviewContext";
import { sectionRegistry } from "../../editor/layout/src/lib/sectionRegistry";
import {
  EDITOR_EMPTY_TEXT_VALUE,
  readInlineTextFormats,
} from "../../editor/layout/src/lib/inlineTextFormatting";
import InlineFormattedSection from "../../editor/layout/src/components/builder/InlineFormattedSection";
import { getSectionAnchorId } from "../../editor/layout/src/lib/sectionAnchors";
import {
  handleHashlessSectionAnchorClick,
  scrollToSectionHref,
  stripUrlHash,
} from "../../editor/layout/src/lib/sectionScroll";
import {
  applyPublishedSeoToDocument,
  getSiteOrigin,
  hasPublishedBlogIndexPage,
  hasPublishedEventsPage,
  hasPublishedPortfolioPage,
  hasPublishedPropertiesPage,
  hasPublishedTeamsPage,
  hasPublishedGalleryPage,
  hasPublishedServicesPage,
  isKnownPublishedPagePath,
} from "@/lib/publishedSeo";
import type { PublishedSitePayload } from "@/lib/publishedSeo";
import { recoverBlogPageLinksFromSections } from "@/lib/recoverBlogPageLinks";
import { filterMenuByHiddenPageLinks } from "../../editor/layout/src/lib/navVisibility";
import {
  getBuilderTemplates,
  getBuilderTemplate,
  pageBodyHasOwnBreadcrumb,
  dropExtraPageBreadcrumbs,
  orderChromeSections,
  resolveLayoutPreview,
  resolveTemplateSectionVariant,
} from "../../editor/layout/src/data/templateFlow";
import { SectionData, SectionItem } from "../../editor/layout/src/types/section";
import BlogDetailArticle from "../../editor/layout/src/components/sections/blog/BlogDetailArticle";
import BlogIndexList from "../../editor/layout/src/components/sections/blog/BlogIndexList";
import ServiceDetailArticle from "../../editor/layout/src/components/sections/service/ServiceDetailArticle";
import RelatedCountryListingsSlider from "../../editor/layout/src/components/sections/countriesserve/RelatedCountryListingsSlider";
import EventDetailArticle from "../../editor/layout/src/components/sections/event/EventDetailArticle";
import PortfolioDetailArticle from "../../editor/layout/src/components/sections/portfolio/PortfolioDetailArticle";
import TeamDetailArticle from "../../editor/layout/src/components/sections/team/TeamDetailArticle";
import PropertyDetailArticle from "../../editor/layout/src/components/sections/property/PropertyDetailArticle";
import RealEstatePropertyDetail1 from "../../editor/layout/src/components/sections/featured/RealEstatePropertyDetail1";
import RealEstateProjectDetail1 from "../../editor/layout/src/components/sections/projects/RealEstateProjectDetail1";
import {
  normalizeBlogDetailLayout,
  normalizeBlogIndexLayout,
} from "../../editor/layout/src/lib/blogLayouts";
import {
  DEFAULT_SERVICE_DETAIL_LAYOUT,
  normalizeServiceDetailLayout,
} from "../../editor/layout/src/lib/serviceLayouts";
import {
  DEFAULT_EVENT_DETAIL_LAYOUT,
  normalizeEventDetailLayout,
} from "../../editor/layout/src/lib/eventLayouts";
import {
  DEFAULT_PROPERTY_DETAIL_LAYOUT,
  normalizePropertyDetailLayout,
} from "../../editor/layout/src/lib/propertyLayouts";
import {
  DEFAULT_PORTFOLIO_DETAIL_LAYOUT,
  normalizePortfolioDetailLayout,
} from "../../editor/layout/src/lib/portfolioLayouts";
import {
  DEFAULT_TEAM_DETAIL_LAYOUT,
  normalizeTeamDetailLayout,
} from "../../editor/layout/src/lib/teamLayouts";
import { parsePropertyAmenities } from "../../editor/layout/src/lib/propertyAmenities";
import { SITE_THEME_GLOBAL_CSS, ensureThemeGoogleFontsLoaded } from "../../editor/layout/src/lib/themeTokens";
import { getLeadFormName } from "../../editor/layout/src/lib/leadFormFields";
import { overlayManagerHomeFeed } from "../../editor/layout/src/lib/managerHomeFeeds";

type PublishedPageLink = {
  label: string;
  href: string;
  kind?: "page" | "blogIndex" | "blog" | "document";
  hidden?: boolean;
  layout?: string;
  author?: string;
  image?: string;
  slug?: string;
  shortDescription?: string;
  longDescription?: string;
  category?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  createdAt?: string;
  children?: PublishedPageLink[];
};

type ClientPayload = Omit<PublishedSitePayload, "pageLinks" | "sections"> & {
  pageLinks: PublishedPageLink[];
  sections: SectionItem[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stripEditorOnlyValues = (value: unknown): unknown => {
  if (typeof value === "string") {
    return value.replaceAll(EDITOR_EMPTY_TEXT_VALUE, "");
  }

  if (Array.isArray(value)) return value.map(stripEditorOnlyValues);

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        stripEditorOnlyValues(item),
      ]),
    );
  }

  return value;
};

const createPageSlug = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Published URL slug from the page name — no forced about→about-us remaps. */
const createPublishedPageSlug = (label: string) => {
  const slug = createPageSlug(label);
  if (slug === "home") return "";
  return slug;
};

const getSlugFromPageHref = (href?: string) => {
  const normalized = (href || "").trim().toLowerCase();
  if (normalized.startsWith("#page-")) {
    if (normalized === "#page-blogs" || normalized.startsWith("#page-blog-")) {
      return "";
    }
    return decodeURIComponent(normalized.slice("#page-".length)).replace(
      /^\/+|\/+$/g,
      "",
    );
  }
  const publishedMatch = normalized.match(/^\/published\/[^/]+\/(.+?)\/?$/i);
  if (publishedMatch) {
    const rest = decodeURIComponent(publishedMatch[1]).replace(/^\/+|\/+$/g, "");
    if (!rest || rest === "blogs" || rest === "blog") return "";
    if (
      /^(?:service|services|event|events|property|properties|portfolio|team|teams|blog|blogs)\//i.test(
        rest,
      )
    ) {
      return "";
    }
    if (rest.includes("/")) return "";
    return rest;
  }
  if (normalized.startsWith("/") && !normalized.startsWith("/published/")) {
    const rest = decodeURIComponent(
      normalized.replace(/^\/+/, "").split(/[?#]/, 1)[0],
    ).replace(/\/+$/, "");
    if (
      rest &&
      !rest.includes("/") &&
      !["api", "editor", "auth", "user", "preview"].includes(rest)
    ) {
      return rest;
    }
  }
  return "";
};

const resolvePublishedPathSlug = (
  payload: ClientPayload | null | undefined,
  label: string,
) => {
  const normalizedLabel = label.trim().toLowerCase();
  const links = Array.isArray(payload?.pageLinks) ? payload.pageLinks : [];
  const match = links
    .flatMap((link) => [link, ...(link.children || [])])
    .find((link) => link.label.trim().toLowerCase() === normalizedLabel);
  const fromHref = getSlugFromPageHref(match?.href);
  if (fromHref && fromHref !== "home") return fromHref;
  return createPublishedPageSlug(label);
};

const normalizeContentPageSlug = (value: string) => {
  const slug = createPageSlug(value);
  // Legacy URL aliases only (old bookmarks) — do not rewrite new URLs.
  if (slug === "about-us") return "about";
  if (slug === "contact-us") return "contact";
  if (slug === "service") return "services";
  if (slug === "event") return "events";
  if (slug === "property") return "properties";
  if (slug === "portfolios") return "portfolio";
  if (slug === "team") return "teams";
  return slug;
};

/** Label slug, URL slug, and template page id can differ (Sale a Property vs properties). */
const getPublishedPageContentSlugs = (
  payload: ClientPayload,
  currentPage: string,
  currentPageSlug: string,
  urlPath = "",
) => {
  const slugs = new Set<string>();
  const add = (value?: string) => {
    const slug = normalizeContentPageSlug(value || "");
    if (slug && slug !== "home") slugs.add(slug);
  };

  add(currentPage);
  add(currentPageSlug);
  add(urlPath);

  const match = payload.pageLinks
    .flatMap((link) => [link, ...(link.children || [])])
    .find((link) => {
      const labelSlug = createPublishedPageSlug(link.label);
      const hrefSlug = getSlugFromPageHref(link.href);
      return (
        link.label.trim().toLowerCase() === currentPage.trim().toLowerCase() ||
        labelSlug === currentPageSlug ||
        hrefSlug === currentPageSlug ||
        hrefSlug === normalizeContentPageSlug(urlPath)
      );
    });
  if (match) {
    add(match.label);
    add(getSlugFromPageHref(match.href));
  }

  const urlSlug = normalizeContentPageSlug(urlPath);
  if (urlSlug === "buy-a-property") return new Set(["buy-a-property"]);
  if (urlSlug === "rent" || urlSlug === "rent-a-property") {
    // Prefer exact URL slug; include alias only if no sections match the primary
    const hasRent = payload.sections.some((s) => normalizeContentPageSlug(s.page || "") === "rent");
    const hasRentA = payload.sections.some((s) => normalizeContentPageSlug(s.page || "") === "rent-a-property");
    if (hasRent && !hasRentA) return new Set(["rent"]);
    if (hasRentA && !hasRent) return new Set(["rent-a-property"]);
    return new Set([urlSlug]);
  }
  if (urlSlug === "sale-a-property" || urlSlug === "sell-a-property") {
    const hasSale = payload.sections.some((s) => normalizeContentPageSlug(s.page || "") === "sale-a-property");
    const hasSell = payload.sections.some((s) => normalizeContentPageSlug(s.page || "") === "sell-a-property");
    const hasProps = payload.sections.some((s) => normalizeContentPageSlug(s.page || "") === "properties");
    // Use only matching slugs
    const set = new Set<string>();
    if (hasSale) set.add("sale-a-property");
    if (hasSell) set.add("sell-a-property");
    if (hasProps) set.add("properties");
    return set.size > 0 ? set : new Set(["sale-a-property", "sell-a-property", "properties"]);
  }

  const isBuy = slugs.has("buy-a-property");
  const isRent = slugs.has("rent") || slugs.has("rent-a-property");
  const isSale = slugs.has("sale-a-property") || slugs.has("sell-a-property");

  if (isBuy && !isRent && !isSale) return new Set(["buy-a-property"]);
  if (isRent && !isBuy && !isSale) {
    const hasR = payload.sections.some((s) => normalizeContentPageSlug(s.page || "") === "rent");
    const hasRA = payload.sections.some((s) => normalizeContentPageSlug(s.page || "") === "rent-a-property");
    if (hasR && !hasRA) return new Set(["rent"]);
    if (hasRA && !hasR) return new Set(["rent-a-property"]);
    return new Set([normalizeContentPageSlug(urlPath) || "rent"]);
  }
  if (isSale || (slugs.has("properties") && !isBuy && !isRent)) {
    const primaryUrl = normalizeContentPageSlug(urlPath);
    const candidates = ["sale-a-property", "sell-a-property", "properties"];
    const matching = candidates.filter((c) =>
      payload.sections.some((s) => normalizeContentPageSlug(s.page || "") === c),
    );
    if (matching.length === 1) return new Set(matching);
    if (matching.includes(primaryUrl)) return new Set([primaryUrl]);
    return matching.length > 0 ? new Set(matching) : new Set(candidates);
  }

  // For non-property inner pages, prefer the URL slug to avoid duplicate
  // sections when the page label slug differs from the URL slug.
  const primarySlug = normalizeContentPageSlug(urlPath);
  if (primarySlug && primarySlug !== "home" && slugs.size > 1) {
    const hasSections = payload.sections.some(
      (s) => normalizeContentPageSlug(s.page || "") === primarySlug,
    );
    if (hasSections) return new Set([primarySlug]);
  }

  return slugs;
};

const getExclusiveListingSectionType = (
  slugs: Set<string>,
  urlPath = "",
) => {
  const urlSlug = normalizeContentPageSlug(urlPath);
  const ordered = [urlSlug, ...slugs];
  for (const slug of ordered) {
    if (slug === "buy-a-property") return "BuyPropertyPage";
    if (slug === "rent" || slug === "rent-a-property") return "RentPage";
    if (
      slug === "sale-a-property" ||
      slug === "sell-a-property" ||
      slug === "properties"
    ) {
      return "PropertyPage";
    }
  }
  return "";
};

const resolvePageLabelFromSlug = (
  payload: ClientPayload,
  pageSlug?: string,
) => {
  const rawPath = (pageSlug || "").replace(/^\/+|\/+$/g, "");
  const allLinks = payload.pageLinks.flatMap((link) => [
    link,
    ...(link.children || []),
  ]);

  // Nested published paths before slug normalization
  if (
    /^blog\//i.test(rawPath) ||
    /^blogs\//i.test(rawPath)
  ) {
    const blogIndex = allLinks.find(
      (link) =>
        link.kind === "blogIndex" ||
        link.href.trim().toLowerCase() === "#page-blogs" ||
        createPublishedPageSlug(link.label) === "blogs" ||
        createPublishedPageSlug(link.label) === "blog",
    );
    return blogIndex?.label || "Blogs";
  }
  if (/^service\//i.test(rawPath) || /^services\//i.test(rawPath)) {
    const serviceLink = allLinks.find((link) => {
      const labelSlug = createPublishedPageSlug(link.label);
      return labelSlug === "service" || labelSlug === "services";
    });
    return serviceLink?.label || "Services";
  }
  if (/^event\//i.test(rawPath) || /^events\//i.test(rawPath)) {
    const eventLink = allLinks.find((link) => {
      const labelSlug = createPublishedPageSlug(link.label);
      return labelSlug === "event" || labelSlug === "events";
    });
    return eventLink?.label || "Events";
  }
  if (/^property\//i.test(rawPath) || /^properties\//i.test(rawPath)) {
    const propertyLink = allLinks.find((link) => {
      const labelSlug = createPublishedPageSlug(link.label);
      return labelSlug === "property" || labelSlug === "properties";
    });
    return propertyLink?.label || "Properties";
  }
  if (/^portfolio\//i.test(rawPath)) {
    const portfolioLink = allLinks.find((link) => {
      const labelSlug = createPublishedPageSlug(link.label);
      return labelSlug === "portfolio" || labelSlug === "portfolios";
    });
    return portfolioLink?.label || "Portfolio";
  }
  if (/^projects\//i.test(rawPath)) {
    const projectsLink = allLinks.find((link) => {
      const labelSlug = createPublishedPageSlug(link.label);
      const hrefSlug = getSlugFromPageHref(link.href);
      const href = link.href.trim().toLowerCase();
      return (
        labelSlug === "projects" ||
        hrefSlug === "projects" ||
        href === "#page-projects"
      );
    });
    return projectsLink?.label || "Projects";
  }
  if (/^team\//i.test(rawPath) || /^teams\/.+/i.test(rawPath)) {
    const teamLink = allLinks.find((link) => {
      const labelSlug = createPublishedPageSlug(link.label);
      return labelSlug === "team" || labelSlug === "teams";
    });
    return teamLink?.label || "Teams";
  }
  if (/^gallery$/i.test(rawPath)) {
    const galleryLink = allLinks.find((link) => {
      const labelSlug = createPublishedPageSlug(link.label);
      const href = link.href.trim().toLowerCase();
      return labelSlug === "gallery" || href === "#page-gallery";
    });
    return galleryLink?.label || "Gallery";
  }

  let slug = createPageSlug(pageSlug || "");
  // Accept /page-privacy-policy as an alias of /privacy-policy
  if (slug.startsWith("page-") && slug.length > "page-".length) {
    slug = slug.slice("page-".length);
  }
  if (!slug || slug === "home") return "Home";

  const pageLabels = allLinks.map((link) => link.label);
  const exactLabel = pageLabels.find(
    (label) => createPublishedPageSlug(label) === slug,
  );
  if (exactLabel) return exactLabel;

  // Blog index
  if (slug === "blogs" || slug === "blog") {
    const blogIndex = allLinks.find(
      (link) =>
        link.kind === "blogIndex" ||
        link.href.trim().toLowerCase() === "#page-blogs" ||
        createPublishedPageSlug(link.label) === "blogs" ||
        createPublishedPageSlug(link.label) === "blog",
    );
    return blogIndex?.label || "Blogs";
  }

  // Events index (/event and /events)
  if (slug === "events" || slug === "event") {
    const eventIndex = allLinks.find((link) => {
      const hrefSlug = getSlugFromPageHref(link.href);
      const labelSlug = createPublishedPageSlug(link.label);
      return (
        hrefSlug === "event" ||
        hrefSlug === "events" ||
        labelSlug === "event" ||
        labelSlug === "events"
      );
    });
    if (eventIndex) return eventIndex.label;
  }

  // Properties index (/property and /properties)
  if (slug === "properties" || slug === "property") {
    const propertyIndex = allLinks.find((link) => {
      const hrefSlug = getSlugFromPageHref(link.href);
      const labelSlug = createPublishedPageSlug(link.label);
      return (
        hrefSlug === "property" ||
        hrefSlug === "properties" ||
        labelSlug === "property" ||
        labelSlug === "properties"
      );
    });
    if (propertyIndex) return propertyIndex.label;
  }
  if (slug === "portfolio") {
    const portfolioIndex = allLinks.find((link) => {
      const hrefSlug = getSlugFromPageHref(link.href);
      const labelSlug = createPublishedPageSlug(link.label);
      return hrefSlug === "portfolio" || labelSlug === "portfolio";
    });
    if (portfolioIndex) return portfolioIndex.label;
  }
  if (slug === "teams" || slug === "team") {
    const teamIndex = allLinks.find((link) => {
      const hrefSlug = getSlugFromPageHref(link.href);
      const labelSlug = createPublishedPageSlug(link.label);
      return (
        hrefSlug === "team" ||
        hrefSlug === "teams" ||
        labelSlug === "team" ||
        labelSlug === "teams"
      );
    });
    if (teamIndex) return teamIndex.label;
  }
  if (slug === "gallery") {
    const galleryIndex = allLinks.find((link) => {
      const hrefSlug = getSlugFromPageHref(link.href);
      const labelSlug = createPublishedPageSlug(link.label);
      return hrefSlug === "gallery" || labelSlug === "gallery";
    });
    if (galleryIndex) return galleryIndex.label;
  }

  const byHref = allLinks.find(
    (link) => getSlugFromPageHref(link.href) === slug,
  );
  if (byHref) return byHref.label;

  // /services ↔ #page-service (and reverse)
  const normalizedSlug = normalizeContentPageSlug(slug);
  if (normalizedSlug !== slug) {
    const byNormalizedHref = allLinks.find(
      (link) => getSlugFromPageHref(link.href) === normalizedSlug,
    );
    if (byNormalizedHref) return byNormalizedHref.label;
  }
  const byServiceAlias = allLinks.find((link) => {
    const hrefSlug = getSlugFromPageHref(link.href);
    const labelSlug = createPublishedPageSlug(link.label);
    if (slug !== "services" && slug !== "service") return false;
    return (
      hrefSlug === "service" ||
      hrefSlug === "services" ||
      labelSlug === "service" ||
      labelSlug === "services"
    );
  });
  if (byServiceAlias) return byServiceAlias.label;

  const byEventAlias = allLinks.find((link) => {
    const hrefSlug = getSlugFromPageHref(link.href);
    const labelSlug = createPublishedPageSlug(link.label);
    if (slug !== "events" && slug !== "event") return false;
    return (
      hrefSlug === "event" ||
      hrefSlug === "events" ||
      labelSlug === "event" ||
      labelSlug === "events"
    );
  });
  if (byEventAlias) return byEventAlias.label;

  const byPropertyAlias = allLinks.find((link) => {
    const hrefSlug = getSlugFromPageHref(link.href);
    const labelSlug = createPublishedPageSlug(link.label);
    if (slug !== "properties" && slug !== "property") return false;
    return (
      hrefSlug === "property" ||
      hrefSlug === "properties" ||
      labelSlug === "property" ||
      labelSlug === "properties"
    );
  });
  if (byPropertyAlias) return byPropertyAlias.label;

  const byPortfolioAlias = allLinks.find((link) => {
    const hrefSlug = getSlugFromPageHref(link.href);
    const labelSlug = createPublishedPageSlug(link.label);
    if (slug !== "portfolio") return false;
    return hrefSlug === "portfolio" || labelSlug === "portfolio";
  });
  if (byPortfolioAlias) return byPortfolioAlias.label;

  const byTeamAlias = allLinks.find((link) => {
    const hrefSlug = getSlugFromPageHref(link.href);
    const labelSlug = createPublishedPageSlug(link.label);
    if (slug !== "teams" && slug !== "team") return false;
    return (
      hrefSlug === "team" ||
      hrefSlug === "teams" ||
      labelSlug === "team" ||
      labelSlug === "teams"
    );
  });
  if (byTeamAlias) return byTeamAlias.label;

  const byGalleryAlias = allLinks.find((link) => {
    const hrefSlug = getSlugFromPageHref(link.href);
    const labelSlug = createPublishedPageSlug(link.label);
    if (slug !== "gallery") return false;
    return hrefSlug === "gallery" || labelSlug === "gallery";
  });
  if (byGalleryAlias) return byGalleryAlias.label;

  const aliasLabel = pageLabels.find((label) => {
    const labelSlug = createPublishedPageSlug(label);
    return (
      normalizeContentPageSlug(labelSlug) === normalizedSlug ||
      normalizeContentPageSlug(labelSlug) === slug
    );
  });
  if (aliasLabel) return aliasLabel;

  // Legacy aliases: /about-us → About page keyed as "about"
  const legacySlug = normalizeContentPageSlug(slug);
  if (legacySlug !== slug) {
    const legacyByHref = allLinks.find(
      (link) => getSlugFromPageHref(link.href) === legacySlug,
    );
    if (legacyByHref) return legacyByHref.label;
    const legacyLabel = pageLabels.find(
      (label) => createPublishedPageSlug(label) === legacySlug,
    );
    if (legacyLabel) return legacyLabel;
  }

  const sectionPage = payload.sections.find((section) => {
    const sectionSlug = createPageSlug(section.page || "");
    return (
      sectionSlug === slug ||
      sectionSlug === legacySlug ||
      (slug === "about-us" && sectionSlug === "about") ||
      (slug === "contact-us" && sectionSlug === "contact") ||
      (slug === "services" && sectionSlug === "service") ||
      (slug === "events" && sectionSlug === "event") ||
      (slug === "event" && sectionSlug === "event") ||
      (slug === "properties" && sectionSlug === "property") ||
      (slug === "property" && sectionSlug === "property") ||
      (slug === "property" && sectionSlug === "properties") ||
      (slug === "portfolio" && sectionSlug === "portfolio") ||
      (slug === "teams" && sectionSlug === "teams") ||
      (slug === "team" && sectionSlug === "teams") ||
      (slug === "gallery" && sectionSlug === "gallery")
    );
  })?.page;

  return sectionPage || "Home";
};

const isMultiPagePayload = (payload: ClientPayload) => {
  const cfgVars =
    payload.templateVariables &&
    typeof payload.templateVariables === "object"
      ? (payload.templateVariables as Record<string, unknown>)
      : {};
  const flowMarker =
    typeof cfgVars["--lestow-create-path"] === "string"
      ? String(cfgVars["--lestow-create-path"]).trim().toLowerCase()
      : "";
  const createPath =
    typeof (payload as { createPath?: unknown }).createPath === "string"
      ? String((payload as { createPath?: string }).createPath)
          .trim()
          .toLowerCase()
      : "";

  // Content wins: redesign "single-page" often still uses a multi-page template id.
  // Ignore chrome + blog scaffolding — those alone must not force path-routed menus.
  const body = (payload.sections || []).filter((section) => {
    const type = String(section.type || "");
    const page = String(section.page || "").trim();
    if (!type) return false;
    if (/^(Header|Footer|TopBar|Breadcrumb|BlogPage)$/i.test(type)) return false;
    if (/^blog-/i.test(page)) return false;
    return true;
  });
  const homeOnlyBody =
    body.length > 0 &&
    body.every((section) => !String(section.page || "").trim());
  if (homeOnlyBody) return false;

  // Redesign / explicit single-page flow: keep section-scroll menus even if a
  // stray custom page section exists (blogs still path-route separately).
  if (createPath === "redesign" || flowMarker === "redesign") {
    const hasRealInnerPages = body.some((section) =>
      Boolean(String(section.page || "").trim()),
    );
    if (!hasRealInnerPages) return false;
  }

  const template = getBuilderTemplates().find(
    (item) => item.id === payload.templateId,
  );
  if (template) return template.type === "Multiple Pages Website";

  return payload.sections.some(
    (section) =>
      typeof section.page === "string" &&
      section.page.trim().length > 0 &&
      !/^blog-/i.test(section.page.trim()) &&
      !/^(Breadcrumb|BlogPage)$/i.test(String(section.type || "")),
  );
};

const isRoutedPageLink = (link: PublishedPageLink) => {
  if (link.kind === "blog" || link.kind === "blogIndex") return false;
  if (link.kind === "document") return true;
  return link.href.trim().toLowerCase().startsWith("#page-");
};

/** Full multi-page sites, or single-page sites with Privacy/Terms document pages. */
const hasPathRoutedPages = (payload: ClientPayload) => {
  if (isMultiPagePayload(payload)) return true;
  return payload.pageLinks.some(isRoutedPageLink);
};

const isDocumentPageLabel = (payload: ClientPayload, label: string) => {
  const normalized = label.trim().toLowerCase();
  if (!normalized || normalized === "home") return false;
  return payload.pageLinks.some(
    (link) =>
      isRoutedPageLink(link) &&
      link.label.trim().toLowerCase() === normalized,
  );
};

type MenuNavItem = {
  label: string;
  href: string;
  children?: MenuNavItem[];
  menuType?: string;
  kind?: string;
};

const PUBLISHED_SINGLE_PAGE_SECTION_MENU: Record<string, string> = {
  Banner: "Home",
  About: "About",
  Product: "Services",
  Service: "Services",
  WhyChooseUs: "Why Choose Us",
  Gallery: "Gallery",
  FormDetail: "Contact",
  Contact: "Contact",
  FAQ: "FAQ",
  Testimonial: "Testimonials",
  CountriesServe: "Countries",
};

/** Build Home-section scroll menu when payload is content-single-page. */
const buildPublishedSinglePageSectionMenu = (
  payload: ClientPayload,
): MenuNavItem[] => {
  const homeSections = payload.sections.filter((section) => !section.page);
  const usedLabels = new Set<string>();
  const links: MenuNavItem[] = [];

  homeSections.forEach((section, sectionIndex) => {
    const label = PUBLISHED_SINGLE_PAGE_SECTION_MENU[section.type];
    if (!label) return;
    const key = label.toLowerCase();
    if (usedLabels.has(key)) return;
    usedLabels.add(key);
    links.push({
      label,
      href:
        section.type === "Banner"
          ? "#"
          : `#${getSectionAnchorId(homeSections, sectionIndex)}`,
    });
  });

  return links;
};

const singlePageNavNeedsSectionHeal = (
  links: Array<{ href?: string; label?: string; kind?: string }>,
  payload: ClientPayload,
) => {
  const homeSections = payload.sections.filter((section) => !section.page);
  const available = new Set(
    homeSections.map(
      (_, sectionIndex) =>
        `#${getSectionAnchorId(homeSections, sectionIndex)}`.toLowerCase(),
    ),
  );
  available.add("#");
  available.add("#home");

  return links.some((link) => {
    if (link.kind === "blog" || link.kind === "blogIndex" || link.kind === "document") {
      return false;
    }
    const href = (link.href || "").trim().toLowerCase();
    if (!href || href.startsWith("#page-") || href.startsWith("#master-")) {
      return false;
    }
    if (href.startsWith("javascript:") || href === "void(0)") return true;
    if (href.startsWith("#") && !available.has(href)) return true;
    return false;
  });
};

const getSinglePageAnchor = (
  payload: ClientPayload,
  label: string,
  preferredHref?: string,
) => {
  const homeSections = payload.sections.filter((section) => !section.page);
  const availableAnchors = new Set(
    homeSections.map(
      (_, sectionIndex) => `#${getSectionAnchorId(homeSections, sectionIndex)}`,
    ),
  );
  const normalizedPreferredHref = preferredHref?.trim() ?? "";
  if (
    normalizedPreferredHref === "#" ||
    availableAnchors.has(normalizedPreferredHref)
  ) {
    return normalizedPreferredHref;
  }

  // Keep document page hrefs (#page-privacy-policy) for path routing.
  if (
    normalizedPreferredHref.toLowerCase().startsWith("#page-") &&
    normalizedPreferredHref.toLowerCase() !== "#page-blogs" &&
    !normalizedPreferredHref.toLowerCase().startsWith("#page-blog-")
  ) {
    return normalizedPreferredHref;
  }

  const slug = normalizeContentPageSlug(label);
  if (!slug || slug === "home") return "#";

  const typeCandidates: Record<string, string[]> = {
    about: ["About"],
    services: ["Service", "Product"],
    events: ["Event"],
    portfolio: ["Portfolio"],
    teams: ["Team"],
    gallery: ["Gallery"],
    contact: ["Contact", "FormDetail"],
    faq: ["FAQ"],
    testimonials: ["Testimonial"],
    "why-choose-us": ["WhyChooseUs"],
    whychooseus: ["WhyChooseUs"],
  };
  const candidates = typeCandidates[slug] ?? [];
  const sectionIndex = homeSections.findIndex((section) => {
    const sectionSlug = normalizeContentPageSlug(section.type);
    return candidates.includes(section.type) || sectionSlug === slug;
  });

  // Never invent dead hashes (#school-history) that have no matching section id.
  return sectionIndex >= 0
    ? `#${getSectionAnchorId(homeSections, sectionIndex)}`
    : "#";
};

const resolvePublishedCurrentPage = (
  payload: ClientPayload,
  pageSlug?: string,
  siteId?: string,
) => {
  const slug = (pageSlug || "").replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!slug || slug === "home" || (siteId && slug === siteId.toLowerCase())) {
    return "Home";
  }
  return resolvePageLabelFromSlug(payload, pageSlug);
};

/** Phone chip / CTA label → tel: (never /published/.../91-...) */
const extractTelHref = (href: string, label: string) => {
  const raw = `${href || ""} ${label || ""}`.trim();
  if (/^tel:/i.test(href.trim())) return href.trim();
  // Digits-only / +91-… paths wrongly stored as page slugs
  const fromHref = href.trim().replace(/^\/+/, "");
  if (/^(?:\+?\d[\d\s().-]{6,}\d)$/.test(fromHref.replace(/\s+/g, " "))) {
    const digits = fromHref.replace(/[^\d+]/g, "");
    return digits ? `tel:${digits}` : "";
  }
  const match = raw.match(
    /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?)?\d[\d\s().-]{6,}\d/,
  );
  if (!match) return "";
  const digits = match[0].replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length < 8) return "";
  return `tel:${digits.startsWith("+") ? digits : digits}`;
};

const looksLikePhoneNav = (href: string, label: string) => {
  const h = (href || "").trim().toLowerCase();
  const l = (label || "").trim().toLowerCase();
  if (h.startsWith("tel:")) return true;
  if (/whatsapp|wa\.me|call\s*agent|call\s*us|phone/i.test(`${l} ${h}`)) {
    return Boolean(extractTelHref(href, label)) || /call/i.test(l);
  }
  // Label is mostly a phone number
  if (/^\+?\d[\d\s().-]{7,}\d$/.test(l.replace(/\s+/g, " ").trim())) return true;
  // Href looks like phone digits / +91-… (not a real page path)
  const bare = h
    .replace(/^\/+/, "")
    .replace(/^published\/[^/]+\//i, "")
    .replace(/^#page-/, "");
  if (/^(?:\+?\d[\d().-]{6,}\d)$/.test(bare)) return true;
  return false;
};

const looksLikeCtaNav = (label: string) => {
  const l = (label || "").trim().toLowerCase();
  return /^(book|get|request|schedule|enquire|inquiry|contact|call|visit|quote|demo|appoint)/i.test(
    l,
  ) || /book\s*(a\s*)?(visit|call|demo|appointment)|call\s*agent|get\s*quote|enquire|contact\s*us/i.test(
    l,
  );
};

const findPublishedPageHrefByLabel = (
  siteId: string,
  label: string,
  payload: ClientPayload,
) => {
  const normalizedLabel = label.trim().toLowerCase();
  if (!normalizedLabel || normalizedLabel === "home") {
    return `/published/${encodeURIComponent(siteId)}`;
  }
  const matched = payload.pageLinks
    ?.flatMap((link) => [link, ...(link.children || [])])
    .find((link) => link.label.trim().toLowerCase() === normalizedLabel);
  if (matched) {
    return buildPublishedPublicPath(siteId, matched.href, matched.label);
  }
  // Soft match: About → about / about-us page if present
  const slug = createPublishedPageSlug(label);
  if (!slug) return "";
  const bySlug = payload.pageLinks
    ?.flatMap((link) => [link, ...(link.children || [])])
    .find((link) => {
      const linkSlug =
        getSlugFromPageHref(link.href) || createPublishedPageSlug(link.label);
      return (
        linkSlug === slug ||
        (slug === "about" &&
          (linkSlug === "about-us" || linkSlug === "about")) ||
        ((slug === "services" || slug === "service") &&
          (linkSlug === "our-services" ||
            linkSlug === "services" ||
            linkSlug === "service")) ||
        ((slug === "contact" || slug === "contact-us") &&
          (linkSlug === "contact-us" || linkSlug === "contact"))
      );
    });
  if (bySlug) {
    return buildPublishedPublicPath(siteId, bySlug.href, bySlug.label);
  }
  return "";
};

const findPayloadPhoneTel = (payload: ClientPayload) => {
  const visit = (value: unknown): string => {
    if (!value) return "";
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = visit(item);
        if (found) return found;
      }
      return "";
    }
    if (typeof value !== "object") return "";
    const record = value as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label : "";
    const href = typeof record.href === "string" ? record.href : "";
    if (label || href) {
      const tel = extractTelHref(href, label);
      if (tel) return tel;
    }
    for (const child of Object.values(record)) {
      const found = visit(child);
      if (found) return found;
    }
    return "";
  };
  for (const section of payload.sections || []) {
    if (section.type !== "Header" && section.type !== "Footer") continue;
    const found = visit(section.data);
    if (found) return found;
  }
  return "";
};

const findContactFallbackHref = (
  siteId: string,
  multiPage: boolean,
  payload: ClientPayload,
) => {
  const byLabel =
    findPublishedPageHrefByLabel(siteId, "Contact", payload) ||
    findPublishedPageHrefByLabel(siteId, "Contact Us", payload) ||
    findPublishedPageHrefByLabel(siteId, "Enquiry", payload);
  if (byLabel && !byLabel.endsWith(`/published/${encodeURIComponent(siteId)}`)) {
    return byLabel;
  }
  const homeSections = payload.sections.filter((section) => !section.page);
  const contactIdx = homeSections.findIndex((section) =>
    ["Contact", "FormDetail"].includes(section.type),
  );
  if (contactIdx >= 0) {
    const hash = `#${getSectionAnchorId(homeSections, contactIdx)}`;
    if (multiPage) {
      return `/published/${encodeURIComponent(siteId)}${hash}`;
    }
    return hash;
  }
  return multiPage ? `/published/${encodeURIComponent(siteId)}` : "#";
};

const buildPublishedPublicPath = (
  siteId: string,
  href: string,
  label: string,
) => {
  const base = `/published/${encodeURIComponent(siteId)}`;
  const normalizedHref = href.trim().toLowerCase();
  const normalizedLabel = label.trim().toLowerCase();

  // Never invent fake page routes from phone chips.
  if (looksLikePhoneNav(href, label)) {
    return extractTelHref(href, label) || base;
  }

  if (
    normalizedLabel === "home" ||
    !normalizedHref ||
    normalizedHref === "#"
  ) {
    return base;
  }

  if (
    normalizedHref === "#page-blogs" ||
    normalizedLabel === "blogs" ||
    normalizedLabel === "blog"
  ) {
    return `${base}/blogs`;
  }

  const masterDetail = normalizedHref.match(
    /^#master-detail\/(service|event|portfolio|team|property|country)\/([^/?#]+)/i,
  );
  if (masterDetail) {
    const kind = masterDetail[1].toLowerCase();
    const slug = decodeURIComponent(masterDetail[2]);
    return `${base}/${kind}/${encodeURIComponent(slug)}`;
  }

  const masterGroup = normalizedHref.match(
    /^#master-group\/(blog|service|event|portfolio|team|property)\/([^/?#]+)/i,
  );
  if (masterGroup) {
    const kind = masterGroup[1].toLowerCase();
    const slug = decodeURIComponent(masterGroup[2]);
    const segment = kind === "blog" ? "blogs" : kind;
    return `${base}/${segment}/category/${encodeURIComponent(slug)}`;
  }

  let slug = getSlugFromPageHref(href) || createPublishedPageSlug(label);
  if (slug === "service") slug = "services";
  if (slug === "event") slug = "events";
  if (!slug) return base;
  return `${base}/${slug}`;
};

const resolvePublishedNavHref = ({
  siteId,
  href,
  label,
  multiPage,
  payload,
  forcePath,
}: {
  siteId: string;
  href: string;
  label: string;
  multiPage: boolean;
  payload: ClientPayload;
  forcePath?: boolean;
}) => {
  const normalizedHref = href.trim().toLowerCase();
  const normalizedLabel = label.trim().toLowerCase();

  // Keep absolute / protocol links as-is.
  if (
    /^https?:\/\//i.test(href.trim()) ||
    /^mailto:/i.test(normalizedHref) ||
    /^tel:/i.test(normalizedHref) ||
    /^sms:/i.test(normalizedHref) ||
    /^(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com)\b/i.test(normalizedHref)
  ) {
    return href.trim();
  }

  // Phone chips (+91-… / Call Agent) → tel:, never fake page routes.
  if (looksLikePhoneNav(href, label)) {
    const tel =
      extractTelHref(href, label) || findPayloadPhoneTel(payload);
    if (tel) return tel;
    if (/call/i.test(normalizedLabel)) {
      return findContactFallbackHref(siteId, multiPage, payload);
    }
  }

  // Master detail / category-group submenu links always path-route.
  if (
    /^#master-detail\/(service|event|portfolio|team|property)\//i.test(
      normalizedHref,
    ) ||
    /^#master-group\/(blog|service|event|portfolio|team|property)\//i.test(
      normalizedHref,
    )
  ) {
    return buildPublishedPublicPath(siteId, href, label);
  }

  // Blogs always path-route on published sites.
  if (
    normalizedHref === "#page-blogs" ||
    normalizedLabel === "blogs" ||
    normalizedLabel === "blog"
  ) {
    return buildPublishedPublicPath(siteId, href, label);
  }

  const isDeadOrSectionHash =
    !normalizedHref ||
    normalizedHref === "#" ||
    normalizedHref === "#home" ||
    normalizedHref === "javascript:void(0)" ||
    normalizedHref === "void(0)" ||
    (normalizedHref.startsWith("#") &&
      !normalizedHref.startsWith("#page-") &&
      !normalizedHref.startsWith("#master-"));

  // Dead # / void CTAs + footer page labels must resolve on multipage.
  if (!forcePath && isDeadOrSectionHash) {
    const isBareHash =
      !normalizedHref ||
      normalizedHref === "#" ||
      normalizedHref === "#home" ||
      normalizedHref === "javascript:void(0)" ||
      normalizedHref === "void(0)";

    if (isBareHash) {
      if (looksLikeCtaNav(label) || /call\s*agent|book\s*visit/i.test(label)) {
        if (/call/i.test(normalizedLabel)) {
          const tel =
            extractTelHref(href, label) || findPayloadPhoneTel(payload);
          if (tel) return tel;
        }
        return findContactFallbackHref(siteId, multiPage, payload);
      }
      if (multiPage) {
        const pageHref = findPublishedPageHrefByLabel(siteId, label, payload);
        if (pageHref) return pageHref;
      }
    }

    // Real in-page section hashes (#gallery, #contact) keep scroll behavior
    // on single-page. On multipage, prefer a real page when the label matches.
    if (!isBareHash) {
      if (multiPage) {
        const pageHref = findPublishedPageHrefByLabel(siteId, label, payload);
        if (
          pageHref &&
          pageHref !== `/published/${encodeURIComponent(siteId)}`
        ) {
          return pageHref;
        }
      }
      const anchor = getSinglePageAnchor(payload, label, href);
      if (anchor && anchor !== "#") {
        return multiPage
          ? `/published/${encodeURIComponent(siteId)}${anchor}`
          : anchor;
      }
      if (multiPage) {
        const pageHref = findPublishedPageHrefByLabel(siteId, label, payload);
        if (pageHref) return pageHref;
      }
      return anchor;
    }

    if (multiPage) {
      const pageHref = findPublishedPageHrefByLabel(siteId, label, payload);
      if (pageHref) return pageHref;
    }
    return getSinglePageAnchor(payload, label, href);
  }

  if (multiPage || forcePath) {
    return buildPublishedPublicPath(siteId, href, label);
  }

  // Single-page: document pages (Privacy/Terms) keep path routes.
  const matchedLink = payload.pageLinks
    .flatMap((link) => [link, ...(link.children || [])])
    .find(
      (link) =>
        link.label.trim().toLowerCase() === normalizedLabel ||
        link.href.trim().toLowerCase() === normalizedHref,
    );
  if (matchedLink && isRoutedPageLink(matchedLink)) {
    return buildPublishedPublicPath(siteId, matchedLink.href, matchedLink.label);
  }

  // Single-page section nav → in-page anchors (scroll).
  return getSinglePageAnchor(payload, label, href);
};

const rewritePublishedMenuHrefs = (
  menu: SectionData["menu"],
  siteId: string,
  multiPage: boolean,
  payload: ClientPayload,
): SectionData["menu"] => {
  if (!Array.isArray(menu)) return menu;

  const hasBlogIndex = hasPublishedBlogIndexPage(payload);

  const isBlogIndexNavItem = (item: MenuNavItem) => {
    const href = (item.href || "").trim().toLowerCase();
    const label = (item.label || "").trim().toLowerCase();
    if (item.kind === "blogIndex") return true;
    if (href === "#page-blogs" || href === "#blogs" || href === "/blogs") {
      return true;
    }
    if (label === "blogs" || label === "blog") return true;
    if (/\/blogs\/?$/.test(href) && !/\/blogs\/.+/.test(href)) return true;
    return false;
  };

  const mapItem = (item: MenuNavItem): MenuNavItem | null => {
    if (!hasBlogIndex && isBlogIndexNavItem(item)) return null;
    return {
      ...item,
      href: resolvePublishedNavHref({
        siteId,
        href: item.href || "",
        label: item.label || "",
        multiPage,
        payload,
      }),
      children: item.children
        ?.map(mapItem)
        .filter((child): child is MenuNavItem => Boolean(child)),
    };
  };

  // Redesign single-page leftovers: domain labels (#school-history) → real section anchors.
  const sourceMenu =
    !multiPage && singlePageNavNeedsSectionHeal(menu as MenuNavItem[], payload)
      ? [
          ...buildPublishedSinglePageSectionMenu(payload),
          ...(menu as MenuNavItem[]).filter(
            (item) =>
              item.kind === "document" ||
              item.kind === "blogIndex" ||
              isBlogIndexNavItem(item),
          ),
        ]
      : menu;

  return filterMenuByHiddenPageLinks(
    sourceMenu
      .map((item) => mapItem(item as MenuNavItem))
      .filter((item): item is MenuNavItem => Boolean(item)),
    payload.pageLinks,
  );
};

const rewritePublishedFooterLinks = (
  sectionData: SectionData,
  siteId: string,
  multiPage: boolean,
  payload: ClientPayload,
): Partial<SectionData> => {
  const patch: Partial<SectionData> = {};

  if (Array.isArray(sectionData.menu)) {
    patch.menu = rewritePublishedMenuHrefs(
      sectionData.menu,
      siteId,
      multiPage,
      payload,
    );
  }

  if (Array.isArray(sectionData.buttons)) {
    patch.buttons = sectionData.buttons.map((button) => ({
      ...button,
      href: resolvePublishedNavHref({
        siteId,
        href: button.href || "",
        label: button.label || "",
        multiPage,
        payload,
      }),
    }));
  }

  if (Array.isArray(sectionData.footerLegalLinks)) {
    patch.footerLegalLinks = sectionData.footerLegalLinks.map((link) => ({
      ...link,
      href: resolvePublishedNavHref({
        siteId,
        href: link.href || "",
        label: link.label || "",
        multiPage,
        payload,
        // Legal links are usually document pages — keep path routing.
        forcePath: true,
      }),
    }));
  }

  if (Array.isArray(sectionData.footerColumns)) {
    patch.footerColumns = sectionData.footerColumns.map((column) => ({
      ...column,
      links: Array.isArray(column.links)
        ? column.links.map((link) => ({
            ...link,
            href: resolvePublishedNavHref({
              siteId,
              href: link.href || "",
              label: link.label || "",
              multiPage,
              payload,
            }),
          }))
        : column.links,
    }));
  }

  if (Array.isArray(sectionData.floatingItems)) {
    patch.floatingItems = sectionData.floatingItems.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return item;
      const record = item as Record<string, unknown>;
      const href = typeof record.href === "string" ? record.href.trim() : "";
      if (
        !href ||
        /^https?:\/\//i.test(href) ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#")
      ) {
        return item;
      }
      return {
        ...record,
        href: resolvePublishedNavHref({
          siteId,
          href,
          label: typeof record.label === "string" ? record.label : "",
          multiPage,
          payload,
          forcePath: true,
        }),
      };
    });
  }

  return patch;
};

const createPublishedPreviewLinks = (
  links: PublishedPageLink[],
  multiPage: boolean,
  payload?: ClientPayload,
  siteId?: string,
): PublishedPageLink[] => {
  const sourceLinks =
    !multiPage &&
    payload &&
    singlePageNavNeedsSectionHeal(links, payload)
      ? ([
          ...buildPublishedSinglePageSectionMenu(payload).map((item) => ({
            label: item.label,
            href: item.href,
            kind: "page" as const,
          })),
          ...links.filter(
            (link) =>
              link.kind === "blog" ||
              link.kind === "blogIndex" ||
              link.kind === "document" ||
              isRoutedPageLink(link),
          ),
        ] as PublishedPageLink[])
      : links;

  return sourceLinks.filter((link) => link.kind !== "blog").map((link) => {
    const normalizedHref = (link.href || "").trim().toLowerCase();
    const isSectionHash =
      normalizedHref === "#" ||
      normalizedHref === "#home" ||
      (normalizedHref.startsWith("#") &&
        !normalizedHref.startsWith("#page-") &&
        !normalizedHref.startsWith("#master-"));

    // Section scroll anchors stay hashes even on multi-page shells (home + blogs).
    if (!multiPage || isSectionHash) {
      if (isRoutedPageLink(link) && !isSectionHash) {
        return {
          ...link,
          href: siteId
            ? buildPublishedPublicPath(siteId, link.href, link.label)
            : link.href,
          children: link.children?.length
            ? createPublishedPreviewLinks(
                link.children,
                multiPage,
                payload,
                siteId,
              )
            : undefined,
        };
      }
      return {
        ...link,
        href:
          payload && isSectionHash
            ? getSinglePageAnchor(payload, link.label, link.href)
            : !multiPage && payload
              ? getSinglePageAnchor(payload, link.label, link.href)
              : link.href,
        children: link.children?.length
          ? createPublishedPreviewLinks(
              link.children,
              multiPage,
              payload,
              siteId,
            )
          : undefined,
      };
    }

    const fromHref = getSlugFromPageHref(link.href);
    const slug = fromHref || createPublishedPageSlug(link.label);
    const href = siteId
      ? buildPublishedPublicPath(siteId, link.href, link.label)
      : slug
        ? `#page-${slug}`
        : "#";
    return {
      ...link,
      href,
      children: link.children?.length
        ? createPublishedPreviewLinks(link.children, true, payload, siteId)
        : undefined,
    };
  });
};

const getBlogSlug = (blog: PublishedPageLink) =>
  blog.slug?.trim() ||
  blog.href.replace(/^#page-/, "").replace(/^\/+|\/+$/g, "") ||
  createPublishedPageSlug(blog.label);

type PublishedServiceItem = {
  id?: string;
  title: string;
  category?: string;
  desc?: string;
  content?: string;
  image?: string;
  slug?: string;
  active?: boolean;
  layout?: string;
  seoTitle?: string;
  seoDescription?: string;
};

const getServiceSlug = (service: PublishedServiceItem, index = 0) =>
  service.slug?.trim() ||
  createPublishedPageSlug(service.title) ||
  `service-${index + 1}`;

const resolveServiceDetailSlug = (path: string) => {
  if (/^services?\/category\//i.test(path)) return "";
  return path.replace(/^services?\//i, "").replace(/^\/+|\/+$/g, "");
};

type PublishedCountryListingItem = {
  id?: string;
  title: string;
  category?: string;
  countryId?: string;
  desc?: string;
  content?: string;
  image?: string;
  slug?: string;
  order?: number;
  active?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
};

const getCountryListingSlug = (
  listing: PublishedCountryListingItem,
  index = 0,
) =>
  listing.slug?.trim() ||
  createPublishedPageSlug(listing.title) ||
  `country-${index + 1}`;

const resolveCountryListingDetailSlug = (path: string) =>
  path
    .replace(/^countr(?:y|ies)\//i, "")
    .replace(/^\/+|\/+$/g, "");

const readPublishedCountryListings = (
  payload: ClientPayload,
): PublishedCountryListingItem[] => {
  const section = payload.sections.find(
    (item) => item.type === "CountriesServe",
  );
  if (!section) return [];
  if (!isCountriesServeWebsiteEnabled(section)) return [];

  const defaultVariant = `${section.type}-1`;
  const variantData =
    section.data?.[section.variant] ?? section.data?.[defaultVariant];
  const sectionData = (
    isRecord(variantData) ? variantData : section.data
  ) as SectionData;

  const fromFlat = Array.isArray(sectionData.countriesServeListings)
    ? sectionData.countriesServeListings
    : [];

  if (fromFlat.length) {
    return fromFlat
      .map((row, index) => {
        const item = row as PublishedCountryListingItem;
        return {
          id: item.id,
          title: typeof item.title === "string" ? item.title : "",
          category: typeof item.category === "string" ? item.category : "",
          countryId: typeof item.countryId === "string" ? item.countryId : "",
          desc: typeof item.desc === "string" ? item.desc : "",
          content: typeof item.content === "string" ? item.content : "",
          image: typeof item.image === "string" ? item.image : "",
          slug: getCountryListingSlug(item, index),
          order: typeof item.order === "number" ? item.order : index + 1,
          active: item.active !== false,
          seoTitle: typeof item.seoTitle === "string" ? item.seoTitle : "",
          seoDescription:
            typeof item.seoDescription === "string" ? item.seoDescription : "",
          seoKeywords:
            typeof item.seoKeywords === "string" ? item.seoKeywords : "",
        };
      })
      .filter((item) => item.title && item.active !== false);
  }

  // Legacy nested country.items
  const countries = Array.isArray(sectionData.countriesServeItems)
    ? sectionData.countriesServeItems
    : [];
  const migrated: PublishedCountryListingItem[] = [];
  countries.forEach((countryRaw, countryIndex) => {
    const country = countryRaw as {
      id?: string;
      name?: string;
      items?: Array<{
        title?: string;
        desc?: string;
        content?: string;
        image?: string;
        slug?: string;
        link?: string;
        href?: string;
        active?: boolean;
        seoTitle?: string;
        seoDescription?: string;
        seoKeywords?: string;
      }>;
    };
    if (!Array.isArray(country.items)) return;
    country.items.forEach((link, linkIndex) => {
      const title = typeof link.title === "string" ? link.title : "";
      if (!title || link.active === false) return;
      migrated.push({
        title,
        category: typeof country.name === "string" ? country.name : "",
        countryId: typeof country.id === "string" ? country.id : "",
        desc: typeof link.desc === "string" ? link.desc : "",
        content: typeof link.content === "string" ? link.content : "",
        image: typeof link.image === "string" ? link.image : "",
        slug:
          (typeof link.slug === "string" && link.slug.trim()) ||
          createPublishedPageSlug(title) ||
          `country-${countryIndex + 1}-${linkIndex + 1}`,
        order: linkIndex + 1,
        active: true,
        seoTitle: typeof link.seoTitle === "string" ? link.seoTitle : "",
        seoDescription:
          typeof link.seoDescription === "string" ? link.seoDescription : "",
        seoKeywords:
          typeof link.seoKeywords === "string" ? link.seoKeywords : "",
      });
    });
  });
  return migrated;
};

const hasPublishedCountriesServeSection = (payload: ClientPayload) =>
  payload.sections.some((section) => {
    if (section.type !== "CountriesServe") return false;
    const defaultVariant = `${section.type}-1`;
    const variantData =
      section.data?.[section.variant] ?? section.data?.[defaultVariant];
    const sectionData = (
      isRecord(variantData) ? variantData : section.data
    ) as SectionData;
    return sectionData.countriesServeWebsiteEnabled !== false;
  });

const isCountriesServeWebsiteEnabled = (section: {
  type?: string;
  variant?: string;
  data?: Record<string, unknown>;
}) => {
  if (section.type !== "CountriesServe") return true;
  const defaultVariant = `${section.type}-1`;
  const variantData =
    section.data?.[section.variant || ""] ??
    section.data?.[defaultVariant];
  const sectionData = (
    isRecord(variantData) ? variantData : section.data
  ) as SectionData;
  return sectionData.countriesServeWebsiteEnabled !== false;
};

const findEnabledCountriesServeSection = <
  T extends {
    type?: string;
    variant?: string;
    data?: Record<string, unknown>;
  },
>(
  sections: T[],
): T | null => {
  const section = sections.find((item) => item.type === "CountriesServe");
  if (!section || !isCountriesServeWebsiteEnabled(section)) return null;
  return section;
};

/** Keep Countries We Serve just above Footer on every page. */
const placeCountriesServeBeforeFooter = <T extends { type?: string }>(
  sections: T[],
  countriesSection: T | null,
): T[] => {
  const without = sections.filter((section) => section.type !== "CountriesServe");
  if (!countriesSection) return without;
  const footerIndex = without.findIndex((section) => section.type === "Footer");
  if (footerIndex === -1) return [...without, countriesSection];
  return [
    ...without.slice(0, footerIndex),
    countriesSection,
    ...without.slice(footerIndex),
  ];
};

const resolveMasterCategorySlug = (path: string, kind: string) => {
  const escaped = kind.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = path
    .replace(/^\/+|\/+$/g, "")
    .match(new RegExp(`^${escaped}s?/category/([^/]+)$`, "i"));
  return match ? decodeURIComponent(match[1]) : "";
};

const matchesMasterGroupSlug = (label: string | undefined, slug: string) => {
  const target = slug.trim().toLowerCase();
  if (!target) return false;
  const raw = (label || "").trim();
  if (!raw) return false;
  if (raw.toLowerCase() === target) return true;
  return createPublishedPageSlug(raw) === target;
};

const filterItemsByGroupSlug = <T extends { category?: string; propertyType?: string }>(
  items: T[],
  groupSlug: string,
  preferPropertyType = false,
): T[] => {
  if (!groupSlug) return items;
  return items.filter((item) => {
    if (preferPropertyType) {
      return (
        matchesMasterGroupSlug(item.propertyType, groupSlug) ||
        matchesMasterGroupSlug(item.category, groupSlug)
      );
    }
    return matchesMasterGroupSlug(item.category, groupSlug);
  });
};

const findPageBreadcrumbSection = (
  payload: ClientPayload,
  pageSlug: string,
) => {
  const normalizedTarget = normalizeContentPageSlug(pageSlug);
  return payload.sections.find(
    (section) =>
      section.type === "Breadcrumb" &&
      normalizeContentPageSlug(section.page || "") === normalizedTarget,
  );
};

const SPLIT_INNER_PAGE_BODIES = new Set([
  "AboutPage",
  "AwardsPage",
  "MissionPage",
  "CsrPage",
  "CareerPage",
  "ContactPage",
]);

const getSplitInnerPageType = (section?: SectionItem | null) => {
  if (!section) return "";
  const id = String(section.id || "").toLowerCase();
  // Custom pages reuse AboutPage-* layout but must not auto-add About companions (Stats/CTA).
  if (id.startsWith("custompage")) return "";
  if (SPLIT_INNER_PAGE_BODIES.has(section.type)) return section.type;
  if (SPLIT_INNER_PAGE_BODIES.has(String(section.id || ""))) {
    return String(section.id);
  }
  const variantType = String(section.variant || "").replace(/-\d+$/, "");
  if (SPLIT_INNER_PAGE_BODIES.has(variantType)) return variantType;
  return "";
};

const SPLIT_PAGE_COMPANIONS: Record<
  string,
  { type: string; variantFallback: string }[]
> = {
  AboutPage: [
    { type: "Stats", variantFallback: "Stats-5" },
    { type: "CTA", variantFallback: "CTA-5" },
  ],
  MissionPage: [{ type: "MissionValues", variantFallback: "MissionValues-5" }],
  CsrPage: [{ type: "CsrPrograms", variantFallback: "CsrPrograms-5" }],
  CareerPage: [{ type: "CareerJobs", variantFallback: "CareerJobs-5" }],
};

const readSectionVariantData = (section?: SectionItem | null) => {
  if (!section) return {} as Record<string, unknown>;
  const variantData =
    section.data?.[section.variant] ?? section.data?.[`${section.type}-1`];
  return isRecord(variantData) ? variantData : {};
};

const isDedicatedPageBodySection = (section: SectionItem) => {
  const type = section.type || "";
  const id = String(section.id || "").toLowerCase();
  return (
    type.endsWith("Page") &&
    type !== "CustomPage" &&
    !id.startsWith("custompage")
  );
};

const buildSplitCompanionData = (
  pageBodyType: string,
  companionType: string,
  preview: Record<string, unknown>,
  savedData: Record<string, unknown>,
  pageBodyData: Record<string, unknown>,
) => {
  if (pageBodyType === "AboutPage" && companionType === "Stats") {
    return {
      ...preview,
      ...savedData,
      stats: Array.isArray(savedData.stats)
        ? savedData.stats
        : Array.isArray(pageBodyData.stats)
          ? pageBodyData.stats
          : preview.stats,
      statsStyle: savedData.statsStyle || "light",
    };
  }
  if (pageBodyType === "AboutPage" && companionType === "CTA") {
    return {
      ...preview,
      ...savedData,
      pretitle:
        savedData.pretitle || pageBodyData.ctaPretitle || preview.pretitle,
      title: savedData.title || pageBodyData.ctaTitle || preview.title,
      description:
        savedData.description || pageBodyData.ctaDesc || preview.description,
      buttons: Array.isArray(savedData.buttons)
        ? savedData.buttons
        : Array.isArray(pageBodyData.ctaButtons)
          ? pageBodyData.ctaButtons
          : preview.buttons,
    };
  }
  if (pageBodyType === "MissionPage") {
    return {
      ...preview,
      ...savedData,
      pretitle:
        savedData.pretitle || pageBodyData.valuesPretitle || preview.pretitle,
      title: savedData.title || pageBodyData.valuesTitle || preview.title,
      values: Array.isArray(savedData.values)
        ? savedData.values
        : Array.isArray(pageBodyData.values)
          ? pageBodyData.values
          : preview.values,
    };
  }
  if (pageBodyType === "CsrPage") {
    return {
      ...preview,
      ...savedData,
      pretitle:
        savedData.pretitle ||
        pageBodyData.programsPretitle ||
        preview.pretitle,
      title: savedData.title || pageBodyData.programsTitle || preview.title,
      programs: Array.isArray(savedData.programs)
        ? savedData.programs
        : Array.isArray(pageBodyData.programs)
          ? pageBodyData.programs
          : preview.programs,
    };
  }
  return {
    ...preview,
    ...savedData,
    pretitle:
      savedData.pretitle || pageBodyData.jobsPretitle || preview.pretitle,
    title: savedData.title || pageBodyData.jobsTitle || preview.title,
    jobs: Array.isArray(savedData.jobs)
      ? savedData.jobs
      : Array.isArray(pageBodyData.jobs)
        ? pageBodyData.jobs
        : preview.jobs,
    formPretitle:
      savedData.formPretitle || pageBodyData.formPretitle || preview.formPretitle,
    formTitle: savedData.formTitle || pageBodyData.formTitle || preview.formTitle,
    formFields: Array.isArray(savedData.formFields)
      ? savedData.formFields
      : Array.isArray(pageBodyData.formFields)
        ? pageBodyData.formFields
        : preview.formFields,
    applyLabel: savedData.applyLabel || pageBodyData.applyLabel || preview.applyLabel,
    successTitle:
      savedData.successTitle || pageBodyData.successTitle || preview.successTitle,
    successDesc:
      savedData.successDesc || pageBodyData.successDesc || preview.successDesc,
    successButtonLabel:
      savedData.successButtonLabel ||
      pageBodyData.successButtonLabel ||
      preview.successButtonLabel,
  };
};

/** Editor injects split breadcrumb + companions on load; published must do the same. */
const attachMissingSplitInnerPageSections = (
  pageSections: SectionItem[],
  payload: ClientPayload,
  pageContentSlugs: Set<string>,
): SectionItem[] => {
  const bodyFromPage = pageSections.find((section) =>
    Boolean(getSplitInnerPageType(section)),
  );
  const bodyFromPayload = payload.sections.find(
    (section) =>
      Boolean(getSplitInnerPageType(section)) &&
      pageContentSlugs.has(normalizeContentPageSlug(section.page || "")),
  );
  const body = bodyFromPage || bodyFromPayload;
  if (!body) return pageSections;

  let next = [...pageSections];
  if (!bodyFromPage) {
    next = next.filter((section) => {
      const id = String(section.id || "").toLowerCase();
      return !id.startsWith("custompage");
    });
    const footerIndex = next.findIndex((section) => section.type === "Footer");
    const insertAt = footerIndex >= 0 ? footerIndex : next.length;
    next = [...next.slice(0, insertAt), body, ...next.slice(insertAt)];
  }

  const category = payload.category || "Realestate";
  const template = getBuilderTemplates().find(
    (item) => item.id === payload.templateId,
  );
  const bodyData = readSectionVariantData(body);

  const splitType = getSplitInnerPageType(body);
  if (
    splitType &&
    !pageBodyHasOwnBreadcrumb(body.variant) &&
    !pageBodyHasOwnBreadcrumb(
      resolveTemplateSectionVariant(body, template),
    ) &&
    !next.some(
      (section) =>
        section.type === "Breadcrumb" && Boolean(sectionRegistry[section.variant]),
    )
  ) {
    const saved =
      payload.sections.find(
        (section) =>
          section.type === "Breadcrumb" &&
          pageContentSlugs.has(normalizeContentPageSlug(section.page || "")),
      ) || findPageBreadcrumbSection(payload, body.page || "");
    const variant =
      template?.sectionVariants?.Breadcrumb ||
      saved?.variant ||
      payload.sections.find(
        (section) =>
          section.type === "Breadcrumb" && Boolean(sectionRegistry[section.variant]),
      )?.variant ||
      "Breadcrumb-5";
    const preview = (resolveLayoutPreview(variant, category)?.data ||
      {}) as Record<string, unknown>;
    const savedData = readSectionVariantData(saved);
    const headerIndex = next.findIndex((section) => section.type === "Header");
    const insertAt = headerIndex >= 0 ? headerIndex + 1 : 0;
    next = [
      ...next.slice(0, insertAt),
      {
        id: saved?.id || `Breadcrumb-${body.page || body.type}`,
        page: body.page,
        type: "Breadcrumb",
        variant,
        data: {
          ...(saved?.data || {}),
          [variant]: {
            ...preview,
            ...savedData,
            pretitle: savedData.pretitle || bodyData.pretitle || preview.pretitle,
            title:
              savedData.title ||
              bodyData.title ||
              body.page ||
              preview.title,
            desc: savedData.desc || bodyData.desc || preview.desc,
            desc2: savedData.desc2 || bodyData.desc2 || preview.desc2,
          },
        },
      },
      ...next.slice(insertAt),
    ];
  }

  const companionSpecs = SPLIT_PAGE_COMPANIONS[splitType] || [];
  for (const companionSpec of companionSpecs) {
    if (
      next.some(
        (section) =>
          section.type === companionSpec.type &&
          (pageContentSlugs.has(normalizeContentPageSlug(section.page || "")) ||
            normalizeContentPageSlug(section.page || "") ===
              normalizeContentPageSlug(body.page || "")),
      )
    ) {
      continue;
    }
    const saved = payload.sections.find(
      (section) =>
        section.type === companionSpec.type &&
        (pageContentSlugs.has(normalizeContentPageSlug(section.page || "")) ||
          normalizeContentPageSlug(section.page || "") ===
            normalizeContentPageSlug(body.page || "")),
    );
    const variant =
      saved?.variant ||
      template?.sectionVariants?.[companionSpec.type] ||
      companionSpec.variantFallback;
    const preview = (resolveLayoutPreview(variant, category)?.data ||
      {}) as Record<string, unknown>;
    const savedData = readSectionVariantData(saved);
    const footerIndex = next.findIndex((section) => section.type === "Footer");
    const insertAt = footerIndex >= 0 ? footerIndex : next.length;
    next = [
      ...next.slice(0, insertAt),
      {
        id: saved?.id || `${companionSpec.type}-${body.page || body.type}`,
        page: body.page,
        type: companionSpec.type,
        variant,
        data: {
          ...(saved?.data || {}),
          [variant]: buildSplitCompanionData(
            splitType,
            companionSpec.type,
            preview,
            savedData,
            bodyData,
          ),
        },
      },
      ...next.slice(insertAt),
    ];
  }

  return next;
};

const readPublishedServices = (
  payload: ClientPayload,
): {
  services: PublishedServiceItem[];
  detailLayout: string;
} => {
  const section =
    payload.sections.find((item) => item.type === "ServicePage") ??
    payload.sections.find(
      (item) =>
        item.type === "Service" &&
        normalizeContentPageSlug(item.page || "") === "services",
    );

  if (!section) {
    return { services: [], detailLayout: DEFAULT_SERVICE_DETAIL_LAYOUT };
  }

  const defaultVariant = `${section.type}-1`;
  const variantData =
    section.data?.[section.variant] ?? section.data?.[defaultVariant];
  const sectionData = (
    isRecord(variantData) ? variantData : section.data
  ) as SectionData;

  const detailLayout = normalizeServiceDetailLayout(
    typeof sectionData.detailLayout === "string"
      ? sectionData.detailLayout
      : DEFAULT_SERVICE_DETAIL_LAYOUT,
  );

  const items = Array.isArray(sectionData.productItems)
    ? sectionData.productItems
    : [];

  const services: PublishedServiceItem[] = items
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const record = item as PublishedServiceItem & { title?: string };
      return {
        id: typeof record.id === "string" ? record.id : undefined,
        title: record.title || "",
        category: record.category,
        desc: record.desc,
        content: record.content,
        image: record.image,
        slug: getServiceSlug(record, index),
        active: record.active !== false,
        layout: record.layout || detailLayout,
        seoTitle: record.seoTitle,
        seoDescription: record.seoDescription,
      };
    })
    .filter((item) => item.title && item.active !== false);

  return { services, detailLayout };
};

type PublishedEventItem = {
  id?: string;
  title: string;
  category?: string;
  desc?: string;
  content?: string;
  image?: string;
  slug?: string;
  active?: boolean;
  layout?: string;
  seoTitle?: string;
  seoDescription?: string;
  eventDate?: string;
  eventTime?: string;
  eventType?: "upcoming" | "past";
};

const getEventSlug = (eventItem: PublishedEventItem, index = 0) =>
  eventItem.slug?.trim() ||
  createPublishedPageSlug(eventItem.title) ||
  `event-${index + 1}`;

const resolveEventDetailSlug = (path: string) => {
  if (/^events?\/category\//i.test(path)) return "";
  return path.replace(/^events?\//i, "").replace(/^\/+|\/+$/g, "");
};

const readPublishedEvents = (
  payload: ClientPayload,
): {
  events: PublishedEventItem[];
  detailLayout: string;
} => {
  const section =
    payload.sections.find((item) => item.type === "EventPage") ??
    payload.sections.find(
      (item) =>
        item.type === "Event" &&
        normalizeContentPageSlug(item.page || "") === "events",
    ) ??
    payload.sections.find(
      (item) =>
        item.type === "Event" &&
        normalizeContentPageSlug(item.page || "") === "event",
    );

  if (!section) {
    return { events: [], detailLayout: DEFAULT_EVENT_DETAIL_LAYOUT };
  }

  const defaultVariant = `${section.type}-1`;
  const variantData =
    section.data?.[section.variant] ?? section.data?.[defaultVariant];
  const sectionData = (
    isRecord(variantData) ? variantData : section.data
  ) as SectionData;

  const detailLayout = normalizeEventDetailLayout(
    typeof sectionData.detailLayout === "string"
      ? sectionData.detailLayout
      : DEFAULT_EVENT_DETAIL_LAYOUT,
  );

  const items = Array.isArray(sectionData.productItems)
    ? sectionData.productItems
    : [];

  const events: PublishedEventItem[] = items
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const record = item as PublishedEventItem & {
        title?: string;
        eventDate?: string;
        eventTime?: string;
        eventType?: string;
      };
      return {
        id: typeof record.id === "string" ? record.id : undefined,
        title: record.title || "",
        category: record.category,
        desc: record.desc,
        content: record.content,
        image: record.image,
        slug: getEventSlug(record, index),
        active: record.active !== false,
        layout: record.layout || detailLayout,
        seoTitle: record.seoTitle,
        seoDescription: record.seoDescription,
        eventDate:
          typeof record.eventDate === "string" ? record.eventDate : "",
        eventTime:
          typeof record.eventTime === "string" ? record.eventTime : "",
        eventType: record.eventType === "past" ? "past" : "upcoming",
      };
    })
    .filter((item) => item.title && item.active !== false);

  return { events, detailLayout };
};

type PublishedPropertyItem = {
  id?: string;
  title: string;
  category?: string;
  desc?: string;
  content?: string;
  image?: string;
  slug?: string;
  active?: boolean;
  layout?: string;
  seoTitle?: string;
  seoDescription?: string;
  price?: string;
  address?: string;
  bedrooms?: string;
  bathrooms?: string;
  areaSqft?: string;
  parking?: string;
  propertyType?: string;
  listingType?: string;
  amenities?:
    | string
    | Array<{
        name: string;
        icon?: string;
      }>;
  floorPlan?: string;
  /** Property manager gallery images → detail page slider */
  gallery?: string[];
  sourcePage?: string;
  statusText?: string;
  subtitle?: string;
  infoTitle?: string;
  location?: string;
  features?: Array<{ label: string; value: string }>;
  button?: { label?: string; href?: string };
};

const getPropertySlug = (propertyItem: PublishedPropertyItem, index = 0) =>
  propertyItem.slug?.trim() ||
  createPublishedPageSlug(propertyItem.title) ||
  `property-${index + 1}`;

const resolvePropertyDetailSlug = (path: string) => {
  if (/^propert(?:y|ies)\/category\//i.test(path)) return "";
  return path.replace(/^propert(?:y|ies)\//i, "").replace(/^\/+|\/+$/g, "");
};

const readPublishedSectionData = (
  section: ClientPayload["sections"][number],
): SectionData => {
  const defaultVariant = `${section.type}-1`;
  const variantData =
    section.data?.[section.variant] ?? section.data?.[defaultVariant];
  return (isRecord(variantData) ? variantData : section.data) as SectionData;
};

const propertyFeatureValue = (features: unknown, needle: string) => {
  if (!Array.isArray(features)) return "";
  const hit = features.find((row) => {
    if (!row || typeof row !== "object") return false;
    return String((row as { label?: string }).label || "")
      .toLowerCase()
      .includes(needle);
  }) as { value?: string } | undefined;
  return typeof hit?.value === "string" ? hit.value : "";
};

const normalizePropertyGallery = (record: Record<string, unknown>): string[] => {
  const out: string[] = [];
  const push = (value: unknown) => {
    if (typeof value === "string" && value.trim()) {
      out.push(value.trim());
      return;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const image = (value as { image?: unknown; src?: unknown }).image;
      const src = (value as { src?: unknown }).src;
      if (typeof image === "string" && image.trim()) out.push(image.trim());
      else if (typeof src === "string" && src.trim()) out.push(src.trim());
    }
  };
  for (const key of ["gallery", "images", "slides"] as const) {
    const value = record[key];
    if (!Array.isArray(value)) continue;
    value.forEach(push);
  }
  return Array.from(new Set(out));
};

const buildPublishedPropertyFeatures = (
  record: Record<string, unknown>,
  fallbackFeatures: Array<{ label: string; value: string }>,
): Array<{ label: string; value: string }> => {
  const bedrooms =
    (typeof record.bedrooms === "string" && record.bedrooms.trim()) ||
    propertyFeatureValue(fallbackFeatures, "bed");
  const bathrooms =
    (typeof record.bathrooms === "string" && record.bathrooms.trim()) ||
    propertyFeatureValue(fallbackFeatures, "bath");
  const areaSqft =
    (typeof record.areaSqft === "string" && record.areaSqft.trim()) ||
    propertyFeatureValue(fallbackFeatures, "area");
  const parking =
    (typeof record.parking === "string" && record.parking.trim()) ||
    propertyFeatureValue(fallbackFeatures, "park");
  const hasStructured = Boolean(bedrooms || bathrooms || areaSqft || parking);
  if (hasStructured) {
    return [
      bedrooms ? { label: "Bedrooms", value: bedrooms } : null,
      areaSqft
        ? {
            label: "Area",
            value: /sq\.?\s*ft|sqft/i.test(areaSqft)
              ? areaSqft
              : `${areaSqft} sq.ft`,
          }
        : null,
      bathrooms ? { label: "Bathrooms", value: bathrooms } : null,
      parking ? { label: "Parking", value: parking } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  }
  return fallbackFeatures.filter((row) => row.label && row.value);
};

const readPublishedProperties = (
  payload: ClientPayload,
): {
  properties: PublishedPropertyItem[];
  detailLayout: string;
  realEstateSkin: boolean;
} => {
  const sections = payload.sections.filter((item) => {
    const page = normalizeContentPageSlug(item.page || "");
    return (
      item.type === "PropertyPage" ||
      item.type === "BuyPropertyPage" ||
      item.type === "RentPage" ||
      (item.type === "Property" &&
        (page === "properties" ||
          page === "property" ||
          page === "buy-a-property" ||
          page === "rent"))
    );
  });

  if (!sections.length) {
    return {
      properties: [],
      detailLayout: DEFAULT_PROPERTY_DETAIL_LAYOUT,
      realEstateSkin: false,
    };
  }

  const layoutSource =
    sections.find((item) => item.type === "PropertyPage") ?? sections[0];
  const layoutData = readPublishedSectionData(layoutSource);
  const sourceVariant = String(layoutSource.variant || "");
  const realEstateSkin = /^(PropertyPage|BuyPropertyPage|RentPage|PropertyDetail)-[56]$/.test(
    sourceVariant,
  );
  const detailLayout = realEstateSkin
    ? sourceVariant.endsWith("-6")
      ? "PropertyDetail-6"
      : "PropertyDetail-5"
    : normalizePropertyDetailLayout(
        typeof layoutData.detailLayout === "string"
          ? layoutData.detailLayout
          : DEFAULT_PROPERTY_DETAIL_LAYOUT,
      );

  const properties: PublishedPropertyItem[] = [];
  const mergeProperty = (
    base: PublishedPropertyItem,
    extra: PublishedPropertyItem,
  ): PublishedPropertyItem => {
    const next = { ...base };
    (Object.entries(extra) as Array<[keyof PublishedPropertyItem, unknown]>).forEach(
      ([key, value]) => {
        const current = next[key];
        const currentBlank =
          current == null ||
          current === "" ||
          (Array.isArray(current) && current.length === 0);
        const extraBlank =
          value == null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0);
        if (currentBlank && !extraBlank) {
          (next as Record<string, unknown>)[key] = value;
        }
      },
    );
    return next;
  };

  sections.forEach((section) => {
    const sectionData = readPublishedSectionData(section);
    const extra = sectionData as SectionData & { listings?: unknown[] };
    const items = [
      ...(Array.isArray(sectionData.productItems) ? sectionData.productItems : []),
      ...(Array.isArray(extra.listings) ? extra.listings : []),
    ];

    items.forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      const record = item as PublishedPropertyItem & {
        title?: string;
        listingType?: string;
        description?: string;
        body?: string;
        location?: string;
        features?: unknown;
        button?: unknown;
        statusText?: string;
        subtitle?: string;
        infoTitle?: string;
      };
      const title = record.title || "";
      if (!title) return;
      const slug = getPropertySlug(record, properties.length + index);
      const category = typeof record.category === "string" ? record.category : "";
      const page = normalizeContentPageSlug(section.page || "");
      const sourcePage =
        section.type === "BuyPropertyPage" || page === "buy-a-property"
          ? "buy-a-property"
          : section.type === "RentPage" || page === "rent"
            ? "rent"
            : "properties";
      const featuresRaw = Array.isArray(record.features)
        ? record.features.flatMap((feature) => {
            if (!feature || typeof feature !== "object") return [];
            const entry = feature as { label?: unknown; value?: unknown };
            return [
              {
                label: typeof entry.label === "string" ? entry.label : "",
                value: typeof entry.value === "string" ? entry.value : "",
              },
            ];
          })
        : [];
      const features = buildPublishedPropertyFeatures(
        record as Record<string, unknown>,
        featuresRaw,
      );
      const buttonRecord =
        record.button && typeof record.button === "object" && !Array.isArray(record.button)
          ? (record.button as { label?: string; href?: string })
          : undefined;
      const nextItem: PublishedPropertyItem = {
        id: typeof record.id === "string" ? record.id : undefined,
        title,
        category: record.category,
        desc: record.desc || record.description,
        content: record.content || record.body,
        image: record.image,
        slug,
        active: record.active !== false,
        layout: record.layout || detailLayout,
        seoTitle: record.seoTitle,
        seoDescription: record.seoDescription,
        price: typeof record.price === "string" ? record.price : "",
        address:
          typeof record.address === "string" && record.address
            ? record.address
            : typeof record.location === "string"
              ? record.location
              : "",
        location:
          typeof record.location === "string" ? record.location : undefined,
        bedrooms:
          typeof record.bedrooms === "string" && record.bedrooms
            ? record.bedrooms
            : propertyFeatureValue(featuresRaw, "bed"),
        bathrooms:
          typeof record.bathrooms === "string" && record.bathrooms
            ? record.bathrooms
            : propertyFeatureValue(featuresRaw, "bath"),
        areaSqft:
          typeof record.areaSqft === "string" && record.areaSqft
            ? record.areaSqft
            : propertyFeatureValue(featuresRaw, "area"),
        parking:
          typeof record.parking === "string" && record.parking
            ? record.parking
            : propertyFeatureValue(featuresRaw, "park"),
        propertyType:
          typeof record.propertyType === "string" ? record.propertyType : "",
        listingType:
          typeof record.listingType === "string" && record.listingType.trim()
            ? record.listingType.trim()
            : category.toLowerCase().includes("rent")
              ? "rent"
              : "sale",
        amenities: parsePropertyAmenities(record.amenities),
        floorPlan: typeof record.floorPlan === "string" ? record.floorPlan : "",
        gallery: normalizePropertyGallery(record as Record<string, unknown>),
        sourcePage,
        statusText:
          typeof record.statusText === "string" ? record.statusText : "",
        subtitle: typeof record.subtitle === "string" ? record.subtitle : "",
        infoTitle: typeof record.infoTitle === "string" ? record.infoTitle : "",
        features,
        button: buttonRecord,
      };
      const existingIndex = properties.findIndex((item) => item.slug === slug);
      if (existingIndex >= 0) {
        properties[existingIndex] = mergeProperty(
          properties[existingIndex],
          nextItem,
        );
        return;
      }
      properties.push(nextItem);
    });
  });

  return {
    properties: properties.filter((item) => item.active !== false),
    detailLayout,
    realEstateSkin,
  };
};

type PublishedPortfolioItem = {
  id?: string;
  title: string;
  category?: string;
  desc?: string;
  content?: string;
  image?: string;
  slug?: string;
  active?: boolean;
  layout?: string;
  seoTitle?: string;
  seoDescription?: string;
  location?: string;
  status?: string;
};

const getPortfolioSlug = (portfolioItem: PublishedPortfolioItem, index = 0) =>
  portfolioItem.slug?.trim() ||
  createPublishedPageSlug(portfolioItem.title) ||
  `portfolio-${index + 1}`;

const resolvePortfolioDetailSlug = (path: string) => {
  if (/^(?:portfolio|projects)\/category\//i.test(path)) return "";
  const raw = path
    .replace(/^(?:portfolio|projects)\//i, "")
    .replace(/^\/+|\/+$/g, "");
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const readPublishedPortfolio = (
  payload: ClientPayload,
): {
  portfolioItems: PublishedPortfolioItem[];
  detailLayout: string;
} => {
  const sections = payload.sections.filter((item) => {
    const page = normalizeContentPageSlug(item.page || "");
    return (
      item.type === "PortfolioPage" ||
      item.type === "LatestProject" ||
      (item.type === "Portfolio" &&
        (page === "portfolio" || page === "projects"))
    );
  });

  if (!sections.length) {
    return {
      portfolioItems: [],
      detailLayout: DEFAULT_PORTFOLIO_DETAIL_LAYOUT,
    };
  }

  const layoutSource =
    sections.find((item) => item.type === "PortfolioPage") ?? sections[0];
  const layoutData = readPublishedSectionData(layoutSource);
  const detailLayout = normalizePortfolioDetailLayout(
    typeof layoutData.detailLayout === "string"
      ? layoutData.detailLayout
      : DEFAULT_PORTFOLIO_DETAIL_LAYOUT,
  );

  const seen = new Set<string>();
  const portfolioItems: PublishedPortfolioItem[] = [];

  sections.forEach((section) => {
    const sectionData = readPublishedSectionData(section);
    const rawItems = [
      ...(Array.isArray(sectionData.productItems) ? sectionData.productItems : []),
      ...((sectionData as SectionData & { projectItems?: unknown[] }).projectItems ||
        []),
    ];

    rawItems.forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      const record = item as PublishedPortfolioItem & {
        title?: string;
        body?: string;
        description?: string;
        location?: string;
        status?: string;
        statusText?: string;
      };
      const title = record.title || "";
      if (!title) return;
        const slug =
          (typeof record.slug === "string" && record.slug.trim()) ||
          getPortfolioSlug(record, portfolioItems.length + index);
        if (seen.has(slug)) return;
        seen.add(slug);
        portfolioItems.push({
          id: typeof record.id === "string" ? record.id : undefined,
          title,
        category: record.category,
        desc: record.desc || record.description,
        content: record.content || record.body,
        image: record.image,
        slug,
        active: record.active !== false,
        layout: record.layout || detailLayout,
        seoTitle: record.seoTitle,
        seoDescription: record.seoDescription,
        location: typeof record.location === "string" ? record.location : "",
        status:
          typeof record.status === "string"
            ? record.status
            : typeof record.statusText === "string"
              ? record.statusText
              : "",
      });
    });
  });

  return {
    portfolioItems: portfolioItems.filter((item) => item.active !== false),
    detailLayout,
  };
};

type PublishedTeamItem = {
  id?: string;
  title: string;
  category?: string;
  desc?: string;
  content?: string;
  image?: string;
  slug?: string;
  active?: boolean;
  layout?: string;
  seoTitle?: string;
  seoDescription?: string;
};

const getTeamSlug = (teamItem: PublishedTeamItem, index = 0) =>
  teamItem.slug?.trim() ||
  createPublishedPageSlug(teamItem.title) ||
  `team-${index + 1}`;

const resolveTeamDetailSlug = (path: string) => {
  if (/^teams?\/category\//i.test(path)) return "";
  return path.replace(/^teams?\//i, "").replace(/^\/+|\/+$/g, "");
};

const readPublishedTeam = (
  payload: ClientPayload,
): {
  teamMembers: PublishedTeamItem[];
  detailLayout: string;
} => {
  const section =
    payload.sections.find((item) => item.type === "TeamPage") ??
    payload.sections.find(
      (item) =>
        item.type === "Team" &&
        normalizeContentPageSlug(item.page || "") === "teams",
    ) ??
    payload.sections.find(
      (item) =>
        item.type === "Team" &&
        normalizeContentPageSlug(item.page || "") === "team",
    );

  if (!section) {
    return { teamMembers: [], detailLayout: DEFAULT_TEAM_DETAIL_LAYOUT };
  }

  const defaultVariant = `${section.type}-1`;
  const variantData =
    section.data?.[section.variant] ?? section.data?.[defaultVariant];
  const sectionData = (
    isRecord(variantData) ? variantData : section.data
  ) as SectionData;

  const detailLayout = normalizeTeamDetailLayout(
    typeof sectionData.detailLayout === "string"
      ? sectionData.detailLayout
      : DEFAULT_TEAM_DETAIL_LAYOUT,
  );

  const items = Array.isArray(sectionData.productItems)
    ? sectionData.productItems
    : [];

  const teamMembers: PublishedTeamItem[] = items
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const record = item as PublishedTeamItem & { title?: string };
      return {
        id: typeof record.id === "string" ? record.id : undefined,
        title: record.title || "",
        category: record.category,
        desc: record.desc,
        content: record.content,
        image: record.image,
        slug: getTeamSlug(record, index),
        active: record.active !== false,
        layout: record.layout || detailLayout,
        seoTitle: record.seoTitle,
        seoDescription: record.seoDescription,
      };
    })
    .filter((item) => item.title && item.active !== false);

  return { teamMembers, detailLayout };
};

function PublishedTeamView({
  siteId,
  path,
  teamMembers,
  detailLayout,
}: {
  siteId: string;
  path: string;
  teamMembers: PublishedTeamItem[];
  detailLayout: string;
}) {
  const teamSlug = resolveTeamDetailSlug(path);
  const selectedTeam = teamSlug
    ? teamMembers.find(
        (teamItem, index) => getTeamSlug(teamItem, index) === teamSlug,
      )
    : undefined;

  useEffect(() => {
    if (!selectedTeam) return;
    document.title = selectedTeam.seoTitle || selectedTeam.title;
    let description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content =
      selectedTeam.seoDescription ||
      selectedTeam.desc ||
      selectedTeam.title;
  }, [selectedTeam]);

  if (teamSlug && !selectedTeam) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-slate-50 px-5">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] theme-accent">
            Team
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">
            Team member not found
          </h1>
          <Link
            href={`/published/${encodeURIComponent(siteId)}/teams`}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Back to teams <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedTeam) return null;

  return (
    <div className="min-h-[60vh] w-full bg-white text-slate-900">
      <TeamDetailArticle
        teamMember={{
          title: selectedTeam.title,
          category: selectedTeam.category,
          excerpt: selectedTeam.desc,
          content: selectedTeam.content,
          image: selectedTeam.image,
          layout: normalizeTeamDetailLayout(
            selectedTeam.layout || detailLayout,
          ),
        }}
      />
    </div>
  );
}

function PublishedServiceView({
  siteId,
  path,
  services,
  detailLayout,
}: {
  siteId: string;
  path: string;
  services: PublishedServiceItem[];
  detailLayout: string;
}) {
  const serviceSlug = resolveServiceDetailSlug(path);
  const selectedService = serviceSlug
    ? services.find(
        (service, index) => getServiceSlug(service, index) === serviceSlug,
      )
    : undefined;

  useEffect(() => {
    if (!selectedService) return;
    document.title = selectedService.seoTitle || selectedService.title;
    let description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content =
      selectedService.seoDescription ||
      selectedService.desc ||
      selectedService.title;
  }, [selectedService]);

  if (serviceSlug && !selectedService) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-slate-50 px-5">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] theme-accent">
            Service
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">
            Service not found
          </h1>
          <Link
            href={`/published/${encodeURIComponent(siteId)}/services`}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Back to services <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedService) return null;

  const selectedSlug = getServiceSlug(
    selectedService,
    services.indexOf(selectedService),
  );
  const categoryKey = (selectedService.category || "").trim().toLowerCase();
  const categoryLabel = selectedService.category?.trim() || "Services";
  const relatedServices = services
    .filter((service, index) => {
      if (service.active === false) return false;
      if (getServiceSlug(service, index) === selectedSlug) return false;
      if (!categoryKey) return true;
      return (service.category || "").trim().toLowerCase() === categoryKey;
    })
    .slice(0, 12);
  const serviceDetailBase = `/published/${encodeURIComponent(siteId)}/service`;

  return (
    <div className="min-h-[60vh] w-full bg-white text-slate-900">
      <ServiceDetailArticle
        service={{
          title: selectedService.title,
          category: selectedService.category,
          excerpt: selectedService.desc,
          content: selectedService.content,
          image: selectedService.image,
          layout: normalizeServiceDetailLayout(
            selectedService.layout || detailLayout,
          ),
        }}
      />
      <RelatedCountryListingsSlider
        countryLabel={categoryLabel}
        heading={`More services from ${categoryLabel}`}
        ctaLabel="View service"
        items={relatedServices.map((service) => {
          const slug = getServiceSlug(service);
          return {
            id: slug,
            title: service.title,
            category: service.category || categoryLabel,
            desc: service.desc,
            image: service.image,
            href: `${serviceDetailBase}/${encodeURIComponent(slug)}`,
          };
        })}
      />
    </div>
  );
}

function PublishedCountryListingView({
  siteId,
  path,
  listings,
}: {
  siteId: string;
  path: string;
  listings: PublishedCountryListingItem[];
}) {
  const listingSlug = resolveCountryListingDetailSlug(path);
  const selectedListing = listingSlug
    ? listings.find(
        (listing, index) =>
          getCountryListingSlug(listing, index) === listingSlug,
      )
    : undefined;

  useEffect(() => {
    if (!selectedListing) return;
    document.title = selectedListing.seoTitle || selectedListing.title;
    let description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content =
      selectedListing.seoDescription ||
      selectedListing.desc ||
      selectedListing.title;
  }, [selectedListing]);

  if (listingSlug && !selectedListing) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-slate-50 px-5">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] theme-accent">
            Listing
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">
            Listing not found
          </h1>
          <Link
            href={`/published/${encodeURIComponent(siteId)}`}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Back to home <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedListing) return null;

  const selectedSlug = getCountryListingSlug(
    selectedListing,
    listings.indexOf(selectedListing),
  );
  const countryKey = (selectedListing.category || "").trim().toLowerCase();
  const countryId = (selectedListing.countryId || "").trim();
  const relatedListings = listings
    .filter((listing, index) => {
      if (getCountryListingSlug(listing, index) === selectedSlug) return false;
      if (countryId && listing.countryId && listing.countryId === countryId) {
        return true;
      }
      if (!countryKey) return false;
      return (listing.category || "").trim().toLowerCase() === countryKey;
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .slice(0, 12);
  const countryLabel = selectedListing.category?.trim() || "this country";
  const detailBase = `/published/${encodeURIComponent(siteId)}/country`;

  return (
    <div className="min-h-[60vh] w-full bg-white text-slate-900">
      <ServiceDetailArticle
        service={{
          title: selectedListing.title,
          category: selectedListing.category,
          excerpt: selectedListing.desc,
          content: selectedListing.content,
          image: selectedListing.image,
          layout: "ServiceDetail-1",
        }}
      />

      <RelatedCountryListingsSlider
        countryLabel={countryLabel}
        items={relatedListings.map((listing) => {
          const slug =
            listing.slug?.trim() ||
            createPublishedPageSlug(listing.title) ||
            listing.id ||
            "listing";
          return {
            id: listing.id,
            title: listing.title,
            category: listing.category,
            desc: listing.desc,
            image: listing.image,
            href: `${detailBase}/${encodeURIComponent(slug)}`,
          };
        })}
      />
    </div>
  );
}

function PublishedEventView({
  siteId,
  path,
  events,
  detailLayout,
}: {
  siteId: string;
  path: string;
  events: PublishedEventItem[];
  detailLayout: string;
}) {
  const eventSlug = resolveEventDetailSlug(path);
  const selectedEvent = eventSlug
    ? events.find(
        (eventItem, index) => getEventSlug(eventItem, index) === eventSlug,
      )
    : undefined;

  useEffect(() => {
    if (!selectedEvent) return;
    document.title = selectedEvent.seoTitle || selectedEvent.title;
    let description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content =
      selectedEvent.seoDescription ||
      selectedEvent.desc ||
      selectedEvent.title;
  }, [selectedEvent]);

  if (eventSlug && !selectedEvent) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-slate-50 px-5">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] theme-accent">
            Event
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">
            Event not found
          </h1>
          <Link
            href={`/published/${encodeURIComponent(siteId)}/events`}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Back to events <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedEvent) return null;

  const selectedSlug = getEventSlug(
    selectedEvent,
    events.indexOf(selectedEvent),
  );
  const categoryKey = (selectedEvent.category || "").trim().toLowerCase();
  const categoryLabel = selectedEvent.category?.trim() || "Events";
  const relatedEvents = events
    .filter((eventItem, index) => {
      if (eventItem.active === false) return false;
      if (getEventSlug(eventItem, index) === selectedSlug) return false;
      if (!categoryKey) return true;
      return (eventItem.category || "").trim().toLowerCase() === categoryKey;
    })
    .slice(0, 12);
  const eventDetailBase = `/published/${encodeURIComponent(siteId)}/event`;

  return (
    <div className="min-h-[60vh] w-full bg-white text-slate-900">
      <EventDetailArticle
        eventItem={{
          title: selectedEvent.title,
          category: selectedEvent.category,
          excerpt: selectedEvent.desc,
          content: selectedEvent.content,
          image: selectedEvent.image,
          eventDate: selectedEvent.eventDate,
          eventTime: selectedEvent.eventTime,
          eventType: selectedEvent.eventType,
          layout: normalizeEventDetailLayout(
            selectedEvent.layout || detailLayout,
          ),
        }}
      />
      <RelatedCountryListingsSlider
        countryLabel={categoryLabel}
        heading={`More events from ${categoryLabel}`}
        ctaLabel="View event"
        items={relatedEvents.map((eventItem) => {
          const slug = getEventSlug(eventItem);
          return {
            id: slug,
            title: eventItem.title,
            category: eventItem.category || categoryLabel,
            desc: eventItem.desc,
            image: eventItem.image,
            href: `${eventDetailBase}/${encodeURIComponent(slug)}`,
          };
        })}
      />
    </div>
  );
}

function PublishedPropertyView({
  siteId,
  path,
  properties,
  detailLayout,
  realEstateSkin,
}: {
  siteId: string;
  path: string;
  properties: PublishedPropertyItem[];
  detailLayout: string;
  realEstateSkin: boolean;
}) {
  const propertySlug = resolvePropertyDetailSlug(path);
  const selectedProperty = propertySlug
    ? properties.find(
        (propertyItem, index) =>
          getPropertySlug(propertyItem, index) === propertySlug,
      )
    : undefined;

  useEffect(() => {
    if (!selectedProperty) return;
    document.title = selectedProperty.seoTitle || selectedProperty.title;
    let description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content =
      selectedProperty.seoDescription ||
      selectedProperty.desc ||
      selectedProperty.title;
  }, [selectedProperty]);

  if (propertySlug && !selectedProperty) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-slate-50 px-5">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] theme-accent">
            Property
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">
            Property not found
          </h1>
          <Link
            href={`/published/${encodeURIComponent(siteId)}/properties`}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Back to properties <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedProperty) return null;

  const listingPageSlug =
    selectedProperty.sourcePage === "rent"
      ? "rent"
      : selectedProperty.sourcePage === "buy-a-property"
        ? "buy-a-property"
        : "properties";
  const listingPageLabel =
    listingPageSlug === "rent"
      ? "Rent a Property"
      : listingPageSlug === "buy-a-property"
        ? "Buy a Property"
        : "Properties";
  const publishedBase = `/published/${encodeURIComponent(siteId)}`;

  if (
    realEstateSkin ||
    selectedProperty.sourcePage === "buy-a-property" ||
    selectedProperty.sourcePage === "rent" ||
    (Array.isArray(selectedProperty.features) &&
      selectedProperty.features.length > 0)
  ) {
    return (
      <RealEstatePropertyDetail1
        data={{
          title: selectedProperty.title,
          image: selectedProperty.image,
          alt: selectedProperty.title,
          category: selectedProperty.category,
          subtitle: selectedProperty.subtitle,
          statusText: selectedProperty.statusText,
          infoTitle: selectedProperty.infoTitle,
          price: selectedProperty.price,
          description: selectedProperty.desc,
          body: selectedProperty.content,
          location: selectedProperty.location || selectedProperty.address,
          propertyType: selectedProperty.propertyType,
          bedrooms: selectedProperty.bedrooms,
          bathrooms: selectedProperty.bathrooms,
          areaSqft: selectedProperty.areaSqft,
          parking: selectedProperty.parking,
          features: selectedProperty.features,
          amenities: selectedProperty.amenities,
          gallery: selectedProperty.gallery || [],
          floorPlan: selectedProperty.floorPlan,
          button: selectedProperty.button,
          homeLabel: "Home",
          homeHref: publishedBase,
          propertiesLabel: listingPageLabel,
          propertiesHref: `${publishedBase}/${listingPageSlug}`,
          primaryButtonHref: `${publishedBase}/contact`,
          primaryButtonLabel: "Book a visit",
          backButtonLabel: `All ${listingPageLabel.toLowerCase()}`,
        } as SectionData}
      />
    );
  }

  return (
    <div className="min-h-[60vh] w-full bg-white text-slate-900">
      <PropertyDetailArticle
        propertyItem={{
          title: selectedProperty.title,
          category: selectedProperty.category,
          excerpt: selectedProperty.desc,
          content: selectedProperty.content,
          image: selectedProperty.image,
          price: selectedProperty.price,
          address: selectedProperty.address,
          bedrooms: selectedProperty.bedrooms,
          bathrooms: selectedProperty.bathrooms,
          areaSqft: selectedProperty.areaSqft,
          parking: selectedProperty.parking,
          propertyType: selectedProperty.propertyType,
          listingType: selectedProperty.listingType,
          amenities: selectedProperty.amenities,
          floorPlan: selectedProperty.floorPlan,
          gallery: selectedProperty.gallery || [],
          layout: normalizePropertyDetailLayout(
            selectedProperty.layout || detailLayout,
          ),
        }}
      />
    </div>
  );
}

function PublishedPortfolioView({
  siteId,
  path,
  portfolioItems,
  detailLayout,
}: {
  siteId: string;
  path: string;
  portfolioItems: PublishedPortfolioItem[];
  detailLayout: string;
}) {
  const portfolioSlug = resolvePortfolioDetailSlug(path);
  const selectedPortfolioItem = portfolioSlug
    ? portfolioItems.find(
        (portfolioItem, index) =>
          getPortfolioSlug(portfolioItem, index) === portfolioSlug,
      )
    : undefined;

  useEffect(() => {
    if (!selectedPortfolioItem) return;
    document.title =
      selectedPortfolioItem.seoTitle || selectedPortfolioItem.title;
    let description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content =
      selectedPortfolioItem.seoDescription ||
      selectedPortfolioItem.desc ||
      selectedPortfolioItem.title;
  }, [selectedPortfolioItem]);

  if (portfolioSlug && !selectedPortfolioItem) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-slate-50 px-5">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] theme-accent">
            {/^projects\//i.test(path) ? "Project" : "Portfolio"}
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">
            {/^projects\//i.test(path) ? "Project not found" : "Portfolio item not found"}
          </h1>
          <Link
            href={`/published/${encodeURIComponent(siteId)}/${
              /^projects\//i.test(path) ? "projects" : "portfolio"
            }`}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            {/^projects\//i.test(path) ? "Back to projects" : "Back to portfolio"} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedPortfolioItem) return null;

  const publishedBase = `/published/${encodeURIComponent(siteId)}`;
  const isThemeProject = /^projects\//i.test(path);
  const listingBase = isThemeProject
    ? `${publishedBase}/projects`
    : `${publishedBase}/portfolio`;

  if (isThemeProject || selectedPortfolioItem.location || selectedPortfolioItem.status) {
    return (
      <RealEstateProjectDetail1
        data={{
          title: selectedPortfolioItem.title,
          image: selectedPortfolioItem.image,
          alt: selectedPortfolioItem.title,
          category: selectedPortfolioItem.category,
          status: selectedPortfolioItem.status,
          desc: selectedPortfolioItem.desc,
          body: selectedPortfolioItem.content,
          location: selectedPortfolioItem.location,
          homeLabel: "Home",
          homeHref: publishedBase,
          projectsLabel: "Projects",
          projectsHref: `${publishedBase}/projects`,
          ctaHref: `${publishedBase}/contact`,
          ctaLabel: "Enquire about this project",
          backLabel: "All projects",
        } as SectionData}
      />
    );
  }

  const selectedSlug = getPortfolioSlug(
    selectedPortfolioItem,
    portfolioItems.indexOf(selectedPortfolioItem),
  );
  const categoryKey = (selectedPortfolioItem.category || "")
    .trim()
    .toLowerCase();
  const categoryLabel =
    selectedPortfolioItem.category?.trim() || "Portfolio";
  const relatedPortfolio = portfolioItems
    .filter((portfolioItem, index) => {
      if (portfolioItem.active === false) return false;
      if (getPortfolioSlug(portfolioItem, index) === selectedSlug) return false;
      if (!categoryKey) return true;
      return (
        (portfolioItem.category || "").trim().toLowerCase() === categoryKey
      );
    })
    .slice(0, 12);
  const portfolioDetailBase = listingBase;

  return (
    <div className="min-h-[60vh] w-full bg-white text-slate-900">
      <PortfolioDetailArticle
        portfolioItem={{
          title: selectedPortfolioItem.title,
          category: selectedPortfolioItem.category,
          excerpt: selectedPortfolioItem.desc,
          content: selectedPortfolioItem.content,
          image: selectedPortfolioItem.image,
          layout: normalizePortfolioDetailLayout(
            selectedPortfolioItem.layout || detailLayout,
          ),
        }}
      />
      <RelatedCountryListingsSlider
        countryLabel={categoryLabel}
        heading={`More projects from ${categoryLabel}`}
        ctaLabel="View project"
        items={relatedPortfolio.map((portfolioItem) => {
          const slug = getPortfolioSlug(portfolioItem);
          return {
            id: slug,
            title: portfolioItem.title,
            category: portfolioItem.category || categoryLabel,
            desc: portfolioItem.desc,
            image: portfolioItem.image,
            href: `${portfolioDetailBase}/${encodeURIComponent(slug)}`,
          };
        })}
      />
    </div>
  );
}

function PublishedBlogView({
  siteId,
  path,
  blogs,
  indexLayout,
}: {
  siteId: string;
  path: string;
  blogs: PublishedPageLink[];
  indexLayout?: string;
}) {
  const blogSlug = path.replace(/^blogs?\/?/, "");
  const selectedBlog = blogSlug
    ? blogs.find((blog) => getBlogSlug(blog) === blogSlug)
    : undefined;

  useEffect(() => {
    if (!selectedBlog) return;
    document.title = selectedBlog.seoTitle || selectedBlog.label;
    let description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content =
      selectedBlog.seoDescription ||
      selectedBlog.shortDescription ||
      selectedBlog.label;
  }, [selectedBlog]);

  if (blogSlug && !selectedBlog) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-slate-50 px-5">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] theme-accent">
            Blog
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">
            Post not found
          </h1>
          <Link
            href={`/published/${encodeURIComponent(siteId)}/blogs`}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Back to blogs <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (selectedBlog) {
    const selectedSlug = getBlogSlug(selectedBlog);
    const categoryKey = (selectedBlog.category || "").trim().toLowerCase();
    const categoryLabel =
      selectedBlog.category?.trim() || "General";
    const relatedBlogs = blogs
      .filter((blog) => {
        if (getBlogSlug(blog) === selectedSlug) return false;
        if (blog.hidden) return false;
        if (!categoryKey) return true;
        return (blog.category || "").trim().toLowerCase() === categoryKey;
      })
      .slice(0, 12);

    return (
      <div className="min-h-[60vh] w-full bg-white text-slate-900">
        <BlogDetailArticle
          post={{
            title: selectedBlog.label,
            author: selectedBlog.author,
            category: selectedBlog.category,
            excerpt: selectedBlog.shortDescription,
            content: selectedBlog.longDescription,
            image: selectedBlog.image,
            layout: normalizeBlogDetailLayout(selectedBlog.layout),
          }}
        />
        <RelatedCountryListingsSlider
          countryLabel={categoryLabel}
          heading={`More posts from ${categoryLabel}`}
          ctaLabel="Read article"
          items={relatedBlogs.map((blog) => ({
            id: getBlogSlug(blog),
            title: blog.label,
            category: blog.category || categoryLabel,
            desc: blog.shortDescription,
            image: blog.image,
            href: `/published/${encodeURIComponent(siteId)}/blog/${encodeURIComponent(getBlogSlug(blog))}`,
          }))}
        />
      </div>
    );
  }

  return (
    <BlogIndexList
      blogs={blogs}
      layout={normalizeBlogIndexLayout(indexLayout)}
      getHref={(blog) =>
        `/published/${encodeURIComponent(siteId)}/blog/${encodeURIComponent(getBlogSlug(blog))}`
      }
    />
  );
}

function PublishedNotFoundScreen({
  siteId,
  requestedPath,
  kind = "website",
}: {
  siteId: string;
  requestedPath: string;
  /** Missing site vs missing/disabled page on a live site */
  kind?: "website" | "page";
}) {
  const isPage = kind === "page";

  useEffect(() => {
    document.title = isPage ? "Page not found" : "Sorry, website not found";
  }, [isPage]);

  const badge = isPage ? "Page unavailable" : "Website unavailable";
  const lead = isPage
    ? "We looked everywhere, but this page is not available on this website right now."
    : "We looked everywhere, but this address does not lead to a live website right now.";
  const reasons = isPage
    ? ["Page removed", "Link outdated", "Page hidden"]
    : ["URL changed", "Website unpublished", "Incorrect address"];
  const headline = isPage ? (
    <>
      Sorry, page
      <span className="block text-red-400">not found.</span>
    </>
  ) : (
    <>
      Sorry, website
      <span className="block text-red-400">not found.</span>
    </>
  );
  const description = isPage
    ? "This website is live, but the page you asked for does not exist or is no longer published. Check the address or go back to the website home."
    : "The link may have changed, expired, or the website may no longer be published. Check the address or head back home.";

  return (
    <main className="relative flex h-[100dvh] flex-col overflow-hidden bg-[#070913] text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -left-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-red-600/35 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-56 -right-40 h-[38rem] w-[38rem] rounded-full bg-blue-600/25 blur-[150px]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl shrink-0 items-center justify-between px-5 py-3 sm:px-8 sm:py-4 lg:py-5">
        <Link
          href="/"
          aria-label="CSS Founder home"
          className="rounded-2xl bg-white px-4 py-2 shadow-[0_12px_35px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5"
        >
          <Image
            src="/logo.png"
            alt="CSS Founder"
            width={118}
            height={45}
            priority
            className="h-auto w-[104px] sm:w-[118px]"
          />
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65 backdrop-blur-xl sm:text-xs">
          <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.95)]" />
          {badge}
        </span>
      </header>

      <section className="relative z-10 mx-auto grid min-h-0 w-full max-w-7xl flex-1 items-center px-5 py-3 sm:px-8 sm:py-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-5">
        <div className="hidden text-left lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-red-300">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            Error 404
          </div>

          <div className="relative mt-6 w-fit">
            <p className="bg-gradient-to-b from-white via-white to-white/15 bg-clip-text text-[9rem] font-black leading-[0.82] tracking-[-0.1em] text-transparent sm:text-[13rem] lg:text-[15rem]">
              404
            </p>
            <div className="absolute -right-2 -top-3 flex h-20 w-20 items-center justify-center rounded-[1.7rem] border border-white/15 bg-white/10 text-4xl shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:-right-7 sm:h-24 sm:w-24 sm:text-5xl">
              <span role="img" aria-label="Folded hands">
                {"\u{1F64F}"}
              </span>
            </div>
          </div>

          <p className="mt-7 max-w-xl text-base leading-7 text-white/55 lg:text-lg">
            {lead}
          </p>

          <div className="mt-6 flex max-w-xl flex-wrap gap-2">
            {reasons.map((reason) => (
              <span
                key={reason}
                className="rounded-full border border-white/10 bg-white/[0.045] px-3.5 py-2 text-xs font-medium text-white/50"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute -inset-1 rounded-[2.2rem] bg-gradient-to-br from-red-500/40 via-transparent to-blue-500/30 blur-xl"
          />
          <div className="relative max-h-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.075] p-5 shadow-[0_35px_100px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:p-8 lg:p-9">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full border-[28px] border-white/[0.035]" />

            <div className="relative">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/15 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] lg:hidden">
                <span role="img" aria-label="Sorry">
                  {"\u{1F64F}"}
                </span>
              </span>
              <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:mt-0 lg:text-[2.45rem]">
                {headline}
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
                {description}
              </p>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                  Requested address
                </p>
                <p className="mt-1.5 truncate font-mono text-xs text-white/65 sm:text-sm">
                  {requestedPath}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {isPage ? (
                  <Link
                    href={`/published/${encodeURIComponent(siteId)}`}
                    className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white shadow-[0_15px_35px_rgba(220,38,38,0.28)] transition hover:-translate-y-0.5 hover:bg-red-500"
                  >
                    <Home size={17} />
                    Back to website
                    <ArrowRight
                      size={16}
                      className="transition group-hover:translate-x-1"
                    />
                  </Link>
                ) : (
                  <Link
                    href="/"
                    className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white shadow-[0_15px_35px_rgba(220,38,38,0.28)] transition hover:-translate-y-0.5 hover:bg-red-500"
                  >
                    <Home size={17} />
                    Go to homepage
                    <ArrowRight
                      size={16}
                      className="transition group-hover:translate-x-1"
                    />
                  </Link>
                )}
                {isPage ? (
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3.5 text-sm font-bold text-white/85 transition hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    CSS Founder home
                  </Link>
                ) : null}
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <Link
                  href="/user/dashboard"
                  className="group inline-flex items-center gap-3 text-sm text-white/50 transition hover:text-white"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/70 transition group-hover:border-red-400/30 group-hover:bg-red-500/15 group-hover:text-red-300">
                    <LayoutDashboard size={16} />
                  </span>
                  <span>
                    Website owner?{" "}
                    <strong className="font-semibold text-white/85">
                      Open dashboard
                    </strong>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <p className="relative z-10 shrink-0 py-2.5 text-center text-[11px] font-medium tracking-wide text-white/25 sm:text-xs">
        CSS Founder &middot; Building websites that build businesses
      </p>
    </main>
  );
}

function PublishedSiteContent({
  siteId,
  initialPageSlug,
  initialPayload,
}: {
  siteId: string;
  initialPageSlug?: string;
  initialPayload: ClientPayload | null;
}) {
  const { currentPage, setCurrentPage } = usePreview();
  const [payload, setPayload] = useState<ClientPayload | null>(initialPayload);
  const [hasLoaded, setHasLoaded] = useState(Boolean(initialPayload));
  const [routeReady, setRouteReady] = useState(false);
  const [clientPublishedPath, setClientPublishedPath] = useState(
    (initialPageSlug || "").replace(/^\/+|\/+$/g, ""),
  );
  const isMultiPage = payload ? isMultiPagePayload(payload) : false;
  const canPathRoutePages = payload ? hasPathRoutedPages(payload) : false;
  const publishedPath = clientPublishedPath;

  useEffect(() => {
    setClientPublishedPath((initialPageSlug || "").replace(/^\/+|\/+$/g, ""));
  }, [initialPageSlug]);
  const isBlogRoute =
    publishedPath === "blogs" ||
    publishedPath.startsWith("blogs/") ||
    publishedPath.startsWith("blog/");
  const isBlogDetailRoute =
    (/^blog\//i.test(publishedPath) || /^blogs\/.+/i.test(publishedPath)) &&
    !/^blogs?\/category\//i.test(publishedPath);
  const isServiceCategoryRoute = /^services?\/category\/[^/]+/i.test(
    publishedPath,
  );
  const isEventCategoryRoute = /^events?\/category\/[^/]+/i.test(publishedPath);
  const isPropertyCategoryRoute = /^propert(?:y|ies)\/category\/[^/]+/i.test(
    publishedPath,
  );
  const isPortfolioCategoryRoute = /^portfolio\/category\/[^/]+/i.test(
    publishedPath,
  );
  const isTeamCategoryRoute = /^teams?\/category\/[^/]+/i.test(publishedPath);
  const isBlogCategoryRoute = /^blogs?\/category\/[^/]+/i.test(publishedPath);
  const isServiceDetailRoute =
    !isServiceCategoryRoute &&
    (/^service\/(?!category\/)/i.test(publishedPath) ||
      /^services\/(?!category\/).+/i.test(publishedPath));
  const isEventDetailRoute =
    !isEventCategoryRoute &&
    (/^event\/(?!category\/)/i.test(publishedPath) ||
      /^events\/(?!category\/).+/i.test(publishedPath));
  const isPropertyDetailRoute =
    !isPropertyCategoryRoute &&
    (/^property\/(?!category\/)/i.test(publishedPath) ||
      /^properties\/(?!category\/).+/i.test(publishedPath));
  const isPortfolioDetailRoute =
    !isPortfolioCategoryRoute && /^portfolio\/(?!category\/).+/i.test(publishedPath);
  const isProjectDetailRoute = /^projects\/.+/i.test(publishedPath);
  const isProjectOrPortfolioDetail =
    isPortfolioDetailRoute || isProjectDetailRoute;
  const isTeamDetailRoute =
    !isTeamCategoryRoute &&
    (/^team\/(?!category\/)/i.test(publishedPath) ||
      /^teams\/(?!category\/).+/i.test(publishedPath));
  const isCountryDetailRoute =
    /^country\/(?!category\/).+/i.test(publishedPath) ||
    /^countries\/(?!category\/).+/i.test(publishedPath);
  const serviceCategorySlug = isServiceCategoryRoute
    ? resolveMasterCategorySlug(publishedPath, "service")
    : "";
  const eventCategorySlug = isEventCategoryRoute
    ? resolveMasterCategorySlug(publishedPath, "event")
    : "";
  const propertyCategorySlug = isPropertyCategoryRoute
    ? resolveMasterCategorySlug(publishedPath, "property")
    : "";
  const portfolioCategorySlug = isPortfolioCategoryRoute
    ? resolveMasterCategorySlug(publishedPath, "portfolio")
    : "";
  const teamCategorySlug = isTeamCategoryRoute
    ? resolveMasterCategorySlug(publishedPath, "team")
    : "";

  const isPreservedPublishedPath =
    isBlogRoute ||
    isBlogCategoryRoute ||
    isServiceDetailRoute ||
    isServiceCategoryRoute ||
    isEventDetailRoute ||
    isEventCategoryRoute ||
    isPropertyDetailRoute ||
    isPropertyCategoryRoute ||
    isPortfolioDetailRoute ||
    isProjectDetailRoute ||
    isPortfolioCategoryRoute ||
    isTeamDetailRoute ||
    isTeamCategoryRoute ||
    isCountryDetailRoute;

  // Listing → detail (and page changes) must start at the top — Next soft nav
  // otherwise keeps the previous scroll mid-page.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [publishedPath, currentPage]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [publishedPath, currentPage]);

  useEffect(() => {
    ensureThemeGoogleFontsLoaded();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("scrollRestoration" in window.history)) {
      return;
    }
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPublishedSite = async () => {
      try {
        const response = await fetch(`/api/published/${siteId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Published site was not found on the server");
        }

        const publishedPayload = (await response.json()) as ClientPayload;

        if (!isMounted) return;

        setPayload(publishedPayload);
        setCurrentPage(
          resolvePublishedCurrentPage(publishedPayload, initialPageSlug, siteId),
        );
        setHasLoaded(true);
        setRouteReady(true);
        return;
      } catch {
        const storedPayload = window.localStorage.getItem(
          `ai-builder-published-site-${siteId}`,
        );

        if (!isMounted) return;

        if (!storedPayload) {
          setHasLoaded(true);
          return;
        }

        try {
          const parsedPayload = JSON.parse(storedPayload) as ClientPayload;
          setPayload(parsedPayload);
          setCurrentPage(
            resolvePublishedCurrentPage(parsedPayload, initialPageSlug, siteId),
          );
        } catch {
          setPayload(null);
        } finally {
          setHasLoaded(true);
          setRouteReady(true);
        }
      }
    };

    const loadTimeout = window.setTimeout(() => {
      if (initialPayload) {
        setPayload(initialPayload);
        setCurrentPage(
          resolvePublishedCurrentPage(initialPayload, initialPageSlug, siteId),
        );
        setHasLoaded(true);
        setRouteReady(true);
        return;
      }

      void loadPublishedSite();
    }, 0);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("ai-builder-site-updated");
      channel.onmessage = (event: MessageEvent) => {
        const data = event.data as {
          type?: string;
          siteId?: string;
          slug?: string;
        } | null;
        if (!data || data.type !== "site-config-saved") return;
        if (data.slug !== siteId && data.siteId !== siteId) return;
        void loadPublishedSite();
      };
    } catch {
      channel = null;
    }

    return () => {
      isMounted = false;
      window.clearTimeout(loadTimeout);
      channel?.close();
    };
  }, [initialPageSlug, initialPayload, setCurrentPage, siteId]);

  useEffect(() => {
    // Keep nested master URLs (detail + category) — do not rewrite to /services etc.
    if (!payload || !routeReady || isPreservedPublishedPath) return;

    const pageSlug = resolvePublishedPathSlug(
      payload,
      currentPage || "Home",
    );
    const basePath = `/published/${encodeURIComponent(siteId)}`;
    const pathSlug =
      !pageSlug ||
      pageSlug === "home" ||
      pageSlug.toLowerCase() === siteId.toLowerCase()
        ? ""
        : pageSlug;

    // Single-page: only path-route document pages; Home stays at /published/{site}
    if (!isMultiPage && !isDocumentPageLabel(payload, currentPage || "Home")) {
      if (window.location.pathname !== basePath) {
        window.history.replaceState({ publishedPage: "" }, "", basePath);
      }
      if (clientPublishedPath) setClientPublishedPath("");
      return;
    }

    // Document + multi-page paths use the label slug only: term → /term
    // (editor href stays #page-term; "page-" is not part of the published slug)
    const nextPath = `${basePath}${pathSlug ? `/${pathSlug}` : ""}`;
    if (window.location.pathname !== nextPath) {
      window.history.replaceState({ publishedPage: pathSlug }, "", nextPath);
    }
    if (clientPublishedPath !== pathSlug) setClientPublishedPath(pathSlug);
  }, [
    canPathRoutePages,
    clientPublishedPath,
    currentPage,
    isMultiPage,
    isPreservedPublishedPath,
    payload,
    routeReady,
    siteId,
  ]);

  useEffect(() => {
    if (!routeReady || !payload || !canPathRoutePages) return;
    const handlePopState = () => {
      const prefix = `/published/${encodeURIComponent(siteId)}`;
      const pageSlug = window.location.pathname
        .slice(prefix.length)
        .replace(/^\/+|\/+$/g, "");
      setCurrentPage(resolvePageLabelFromSlug(payload, pageSlug));
      setClientPublishedPath(pageSlug);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [canPathRoutePages, payload, routeReady, setCurrentPage, siteId]);

  const isThankYouPageEarly =
    publishedPath === "thank-you" || publishedPath === "thankyou";

  const visibleSections = useMemo(() => {
    if (!payload) return [];

    if (
      isBlogRoute ||
      isServiceDetailRoute ||
      isEventDetailRoute ||
      isPropertyDetailRoute ||
      isProjectOrPortfolioDetail ||
      isTeamDetailRoute ||
      isCountryDetailRoute ||
      isThankYouPageEarly
    ) {
      const shellSectionTypes = ["Topbar", "Header", "Footer"];

      const shell = shellSectionTypes.flatMap((type) => {
        const section =
          payload.sections.find(
            (item) => item.type === type && !item.page,
          ) ??
          payload.sections.find(
            (item) =>
              item.type === type &&
              normalizeContentPageSlug(item.page || "") === "home",
          ) ??
          payload.sections.find((item) => item.type === type);

        return section ? [section] : [];
      });

      if (isServiceDetailRoute) {
        const breadcrumb = findPageBreadcrumbSection(payload, "services");
        if (breadcrumb) {
          const headerIndex = shell.findIndex(
            (section) => section.type === "Header",
          );
          const insertAt = headerIndex >= 0 ? headerIndex + 1 : 0;
          shell.splice(insertAt, 0, breadcrumb);
        }
      }

      if (isEventDetailRoute) {
        const breadcrumb =
          findPageBreadcrumbSection(payload, "events") ??
          findPageBreadcrumbSection(payload, "event");
        if (breadcrumb) {
          const headerIndex = shell.findIndex(
            (section) => section.type === "Header",
          );
          const insertAt = headerIndex >= 0 ? headerIndex + 1 : 0;
          shell.splice(insertAt, 0, {
            ...breadcrumb,
            id: `${breadcrumb.id || "Breadcrumb"}-event-detail`,
          });
        }
      }

      if (isPropertyDetailRoute) {
        const hasRealEstatePropertyPage = payload.sections.some(
          (item) =>
            item.type === "BuyPropertyPage" || item.type === "RentPage",
        );
        if (!hasRealEstatePropertyPage) {
          const breadcrumb =
            findPageBreadcrumbSection(payload, "properties") ??
            findPageBreadcrumbSection(payload, "property");
          if (breadcrumb) {
            const headerIndex = shell.findIndex(
              (section) => section.type === "Header",
            );
            const insertAt = headerIndex >= 0 ? headerIndex + 1 : 0;
            shell.splice(insertAt, 0, {
              ...breadcrumb,
              id: `${breadcrumb.id || "Breadcrumb"}-property-detail`,
            });
          }
        }
      }

      if (isPortfolioDetailRoute && !isProjectDetailRoute) {
        const breadcrumb =
          findPageBreadcrumbSection(payload, "portfolio") ??
          findPageBreadcrumbSection(payload, "projects");
        if (breadcrumb) {
          const headerIndex = shell.findIndex(
            (section) => section.type === "Header",
          );
          const insertAt = headerIndex >= 0 ? headerIndex + 1 : 0;
          shell.splice(insertAt, 0, {
            ...breadcrumb,
            id: `${breadcrumb.id || "Breadcrumb"}-portfolio-detail`,
          });
        }
      }

      if (isTeamDetailRoute) {
        const breadcrumb =
          findPageBreadcrumbSection(payload, "teams") ??
          findPageBreadcrumbSection(payload, "team");
        if (breadcrumb) {
          const headerIndex = shell.findIndex(
            (section) => section.type === "Header",
          );
          const insertAt = headerIndex >= 0 ? headerIndex + 1 : 0;
          shell.splice(insertAt, 0, {
            ...breadcrumb,
            id: `${breadcrumb.id || "Breadcrumb"}-team-detail`,
          });
        }
      }

      if (isBlogDetailRoute) {
        const breadcrumb =
          findPageBreadcrumbSection(payload, "blogs") ??
          findPageBreadcrumbSection(payload, "blog");
        if (breadcrumb) {
          const headerIndex = shell.findIndex(
            (section) => section.type === "Header",
          );
          const insertAt = headerIndex >= 0 ? headerIndex + 1 : 0;
          shell.splice(insertAt, 0, {
            ...breadcrumb,
            id: `${breadcrumb.id || "Breadcrumb"}-blog-detail`,
          });
        }
      }

      if (isCountryDetailRoute) {
        const countrySlug = resolveCountryListingDetailSlug(publishedPath);
        const countryListings = readPublishedCountryListings(payload);
        const listingExists = Boolean(
          countrySlug &&
            countryListings.some(
              (listing, index) =>
                getCountryListingSlug(listing, index) === countrySlug,
            ),
        );
        // Not-found pages keep Topbar/Header/Footer only — no donor "About" breadcrumb.
        if (listingExists) {
          const breadcrumb =
            findPageBreadcrumbSection(payload, "countries") ??
            findPageBreadcrumbSection(payload, "country") ??
            findPageBreadcrumbSection(payload, "blogs") ??
            findPageBreadcrumbSection(payload, "services") ??
            findPageBreadcrumbSection(payload, "about");
          if (breadcrumb) {
            const headerIndex = shell.findIndex(
              (section) => section.type === "Header",
            );
            const insertAt = headerIndex >= 0 ? headerIndex + 1 : 0;
            shell.splice(insertAt, 0, {
              ...breadcrumb,
              id: `${breadcrumb.id || "Breadcrumb"}-country-detail`,
            });
          }
        }
      }

      return shell;
    }

    const currentPageSlug = normalizeContentPageSlug(currentPage || "Home");
    const pageContentSlugs = getPublishedPageContentSlugs(
      payload,
      currentPage || "Home",
      currentPageSlug,
      publishedPath,
    );
    const pageShellSectionTypes = ["Topbar", "Header", "Footer"];
    const countriesServeSection = findEnabledCountriesServeSection(
      payload.sections,
    );

    let pageSections =
      currentPageSlug && currentPageSlug !== "home"
        ? payload.sections.filter(
            (section) =>
              pageShellSectionTypes.includes(section.type) ||
              section.type === "CountriesServe" ||
              pageContentSlugs.has(
                normalizeContentPageSlug(section.page || ""),
              ),
          )
        : payload.sections.filter((section) => !section.page);

    if (!hasPublishedPortfolioPage(payload)) {
      pageSections = pageSections.filter(
        (section) =>
          section.type !== "LatestProject" &&
          section.type !== "PortfolioPage" &&
          section.type !== "Portfolio",
      );
    }

    const exclusiveListingType = getExclusiveListingSectionType(
      pageContentSlugs,
      publishedPath,
    );
    if (exclusiveListingType) {
      const keepTypes = new Set([
        "Topbar",
        "Header",
        "Footer",
        "CountriesServe",
        "Breadcrumb",
        exclusiveListingType,
      ]);
      if (exclusiveListingType === "PropertyPage") keepTypes.add("Property");
      pageSections = pageSections.filter((section) => {
        if (!keepTypes.has(section.type)) return false;
        if (
          typeof section.id === "string" &&
          section.id.startsWith("CustomPage-")
        ) {
          return false;
        }
        return true;
      });
      // Deduplicate listing sections — keep only one per listing type,
      // preferring the one whose page slug matches the URL path.
      const listingTypes = new Set([exclusiveListingType, "Property"]);
      const listingSections = pageSections.filter((s) => listingTypes.has(s.type));
      if (listingSections.length > 1) {
        const urlSlug = normalizeContentPageSlug(publishedPath);
        const preferred =
          listingSections.find(
            (s) => normalizeContentPageSlug(s.page || "") === urlSlug,
          ) || listingSections[0];
        pageSections = pageSections.filter(
          (s) => !listingTypes.has(s.type) || s === preferred,
        );
      }
    } else if (
      pageContentSlugs.has("buy-a-property") ||
      pageContentSlugs.has("rent") ||
      pageContentSlugs.has("rent-a-property") ||
      pageContentSlugs.has("sale-a-property") ||
      pageContentSlugs.has("properties")
    ) {
      pageSections = pageSections.filter((section) => {
        const page = normalizeContentPageSlug(section.page || "");
        if (section.type === "About" && page !== "about") return false;
        if (
          typeof section.id === "string" &&
          section.id.startsWith("CustomPage-")
        ) {
          return false;
        }
        return true;
      });
    }

    // Prefer the real Properties listing over a leftover CustomPage that stole
    // the same `page: properties` slug before the Properties feature existed.
    if (pageContentSlugs.has("properties") && !isPropertyDetailRoute) {
      const hasPropertyListing = pageSections.some(
        (section) =>
          section.id === "PropertyPage" ||
          section.type === "PropertyPage" ||
          section.type === "Property",
      );
      if (hasPropertyListing) {
        pageSections = pageSections.filter(
          (section) =>
            !(
              typeof section.id === "string" &&
              section.id.startsWith("CustomPage-") &&
              pageContentSlugs.has(
                normalizeContentPageSlug(section.page || ""),
              )
            ),
        );
      }
    }

    // Dedicated inner pages (Privacy, Mission, CSR, …) already include a
    // breadcrumb + body. Drop leftover CustomPage/AboutPage-2 scaffolds that
    // were stored under the nav-label slug (privacy-policy vs privacy).
    const dedicatedPageBodies = pageSections.filter(isDedicatedPageBodySection);
    if (dedicatedPageBodies.length) {
      const keepSplitBreadcrumb = dedicatedPageBodies.some(
        (section) =>
          Boolean(getSplitInnerPageType(section)) ||
          !pageBodyHasOwnBreadcrumb(section.variant),
      );
      pageSections = pageSections.filter((section) => {
        const id = String(section.id || "").toLowerCase();
        if (id.startsWith("custompage")) return false;
        if (section.type === "Breadcrumb" && !keepSplitBreadcrumb) return false;
        return true;
      });
    }
    pageSections = attachMissingSplitInnerPageSections(
      pageSections,
      payload,
      pageContentSlugs,
    );

    if (currentPageSlug === "portfolio" && !isPortfolioDetailRoute) {
      const hasPortfolioBreadcrumb = pageSections.some(
        (section) =>
          section.type === "Breadcrumb" &&
          normalizeContentPageSlug(section.page || "") === "portfolio",
      );
      if (!hasPortfolioBreadcrumb) {
        const donor =
          findPageBreadcrumbSection(payload, "portfolio") ??
          findPageBreadcrumbSection(payload, "services") ??
          findPageBreadcrumbSection(payload, "about");
        if (donor) {
          const headerIndex = pageSections.findIndex(
            (section) => section.type === "Header",
          );
          const insertAt = headerIndex >= 0 ? headerIndex + 1 : 0;
          pageSections = [
            ...pageSections.slice(0, insertAt),
            {
              ...donor,
              id: `${donor.id || "Breadcrumb"}-portfolio-listing`,
              page: "portfolio",
            },
            ...pageSections.slice(insertAt),
          ];
        }
      }
    }

    if (currentPageSlug === "teams" && !isTeamDetailRoute) {
      const hasTeamsBreadcrumb = pageSections.some(
        (section) =>
          section.type === "Breadcrumb" &&
          normalizeContentPageSlug(section.page || "") === "teams",
      );
      if (!hasTeamsBreadcrumb) {
        const donor =
          findPageBreadcrumbSection(payload, "teams") ??
          findPageBreadcrumbSection(payload, "services") ??
          findPageBreadcrumbSection(payload, "about");
        if (donor) {
          const headerIndex = pageSections.findIndex(
            (section) => section.type === "Header",
          );
          const insertAt = headerIndex >= 0 ? headerIndex + 1 : 0;
          pageSections = [
            ...pageSections.slice(0, insertAt),
            {
              ...donor,
              id: `${donor.id || "Breadcrumb"}-teams-listing`,
              page: "teams",
            },
            ...pageSections.slice(insertAt),
          ];
        }
      }
    }

    if (currentPageSlug === "gallery") {
      const hasGalleryBreadcrumb = pageSections.some(
        (section) =>
          section.type === "Breadcrumb" &&
          normalizeContentPageSlug(section.page || "") === "gallery",
      );
      if (!hasGalleryBreadcrumb) {
        const donor =
          findPageBreadcrumbSection(payload, "gallery") ??
          findPageBreadcrumbSection(payload, "services") ??
          findPageBreadcrumbSection(payload, "about");
        if (donor) {
          const headerIndex = pageSections.findIndex(
            (section) => section.type === "Header",
          );
          const insertAt = headerIndex >= 0 ? headerIndex + 1 : 0;
          pageSections = [
            ...pageSections.slice(0, insertAt),
            {
              ...donor,
              id: `${donor.id || "Breadcrumb"}-gallery-listing`,
              page: "gallery",
            },
            ...pageSections.slice(insertAt),
          ];
        }
      }
    }

    // Events listing may lack a dedicated Breadcrumb section on older publishes.
    if (currentPageSlug === "events" && !isEventDetailRoute) {
      const hasEventsBreadcrumb = pageSections.some(
        (section) =>
          section.type === "Breadcrumb" &&
          normalizeContentPageSlug(section.page || "") === "events",
      );
      if (!hasEventsBreadcrumb) {
        const donor =
          findPageBreadcrumbSection(payload, "events") ??
          findPageBreadcrumbSection(payload, "services") ??
          findPageBreadcrumbSection(payload, "about");
        if (donor) {
          const headerIndex = pageSections.findIndex(
            (section) => section.type === "Header",
          );
          const insertAt = headerIndex >= 0 ? headerIndex + 1 : 0;
          pageSections = [
            ...pageSections.slice(0, insertAt),
            {
              ...donor,
              id: `${donor.id || "Breadcrumb"}-events-listing`,
              page: "events",
            },
            ...pageSections.slice(insertAt),
          ];
        }
      }
    }

    // Properties listing may lack a dedicated Breadcrumb on older publishes.
    if (pageContentSlugs.has("properties") && !isPropertyDetailRoute) {
      const publishedTemplate = getBuilderTemplate(
        payload.templateId,
        payload.category,
      );
      const hasThemePropertyBody = pageSections.some(
        (section) =>
          section.type === "PropertyPage" ||
          section.type === "Property" ||
          section.type === "BuyPropertyPage" ||
          section.type === "RentPage",
      );
      const propertyBodyHasOwnBreadcrumb = pageSections.some(
        (section) =>
          (section.type === "PropertyPage" ||
            section.type === "Property" ||
            section.type === "BuyPropertyPage" ||
            section.type === "RentPage") &&
          pageBodyHasOwnBreadcrumb(
            resolveTemplateSectionVariant(section, publishedTemplate),
          ),
      );
      const hasPropertiesBreadcrumb = pageSections.some(
        (section) =>
          section.type === "Breadcrumb" &&
          pageContentSlugs.has(normalizeContentPageSlug(section.page || "")),
      );
      if (
        !propertyBodyHasOwnBreadcrumb &&
        !hasThemePropertyBody &&
        !hasPropertiesBreadcrumb
      ) {
        const donor =
          findPageBreadcrumbSection(payload, "properties") ??
          findPageBreadcrumbSection(payload, "sale-a-property") ??
          findPageBreadcrumbSection(payload, "services") ??
          findPageBreadcrumbSection(payload, "about");
        if (donor) {
          const headerIndex = pageSections.findIndex(
            (section) => section.type === "Header",
          );
          const insertAt = headerIndex >= 0 ? headerIndex + 1 : 0;
          pageSections = [
            ...pageSections.slice(0, insertAt),
            {
              ...donor,
              id: `${donor.id || "Breadcrumb"}-properties-listing`,
              page: "properties",
            },
            ...pageSections.slice(insertAt),
          ];
        }
      }
    }

    pageSections = placeCountriesServeBeforeFooter(
      pageSections,
      countriesServeSection,
    );

    const splitBody = pageSections.find((section) =>
      Boolean(getSplitInnerPageType(section)),
    );
    if (
      splitBody &&
      !pageSections.some((section) => section.type === "Breadcrumb")
    ) {
      pageSections = attachMissingSplitInnerPageSections(
        pageSections,
        payload,
        pageContentSlugs,
      );
    }

    const publishedTemplate = getBuilderTemplate(
      payload.templateId,
      payload.category,
    );
    const themeBreadcrumb = publishedTemplate.sectionVariants?.Breadcrumb;
    if (themeBreadcrumb) {
      const categoryKey = payload.category || "Realestate";
      pageSections = pageSections.map((section) => {
        if (section.type !== "Breadcrumb" || !section.page) return section;
        if (section.variant === themeBreadcrumb) return section;
        const savedData =
          (section.data?.[section.variant] as Record<string, unknown> | undefined) ||
          (Object.values(section.data || {})[0] as
            | Record<string, unknown>
            | undefined) ||
          {};
        const preview = (resolveLayoutPreview(themeBreadcrumb, categoryKey)
          ?.data || {}) as Record<string, unknown>;
        return {
          ...section,
          variant: themeBreadcrumb,
          data: {
            [themeBreadcrumb]: {
              ...preview,
              ...savedData,
              title: savedData.title || preview.title,
              homeLabel: savedData.homeLabel || preview.homeLabel || "Home",
            },
          },
        };
      });
    }
    return orderChromeSections(
      dropExtraPageBreadcrumbs(pageSections, publishedTemplate),
    );
  }, [
    currentPage,
    isBlogDetailRoute,
    isBlogRoute,
    isEventDetailRoute,
    isPortfolioDetailRoute,
    isProjectOrPortfolioDetail,
    isPropertyDetailRoute,
    isServiceDetailRoute,
    isTeamDetailRoute,
    isCountryDetailRoute,
    isThankYouPageEarly,
    payload,
    publishedPath,
  ]);

  useEffect(() => {
    if (!payload) return;

    const pathBlocked =
      ((publishedPath === "services" ||
        publishedPath === "service" ||
        isServiceDetailRoute ||
        isServiceCategoryRoute) &&
        !hasPublishedServicesPage(payload)) ||
      ((publishedPath === "events" ||
        publishedPath === "event" ||
        isEventDetailRoute ||
        isEventCategoryRoute) &&
        !hasPublishedEventsPage(payload)) ||
      ((publishedPath === "properties" ||
        publishedPath === "property" ||
        isPropertyDetailRoute ||
        isPropertyCategoryRoute) &&
        !hasPublishedPropertiesPage(payload)) ||
      ((publishedPath === "teams" ||
        publishedPath === "team" ||
        isTeamDetailRoute ||
        isTeamCategoryRoute) &&
        !hasPublishedTeamsPage(payload)) ||
      ((publishedPath === "portfolio" ||
        publishedPath === "projects" ||
        isPortfolioDetailRoute ||
        isPortfolioCategoryRoute) &&
        !hasPublishedPortfolioPage(payload)) ||
      ((publishedPath === "blogs" ||
        publishedPath === "blog" ||
        isBlogDetailRoute ||
        isBlogCategoryRoute) &&
        !hasPublishedBlogIndexPage(payload)) ||
      (publishedPath === "gallery" && !hasPublishedGalleryPage(payload)) ||
      (isCountryDetailRoute && !hasPublishedCountriesServeSection(payload)) ||
      (Boolean(publishedPath) &&
        !isThankYouPageEarly &&
        !isKnownPublishedPagePath(payload, publishedPath));

    if (isThankYouPageEarly) {
      document.title = "Thank You";
      return;
    }

    if (pathBlocked) {
      document.title = "Page not found";
      return;
    }

    applyPublishedSeoToDocument(
      payload,
      getSiteOrigin(window.location.origin),
      currentPage || "Home",
      publishedPath || null,
    );
  }, [
    currentPage,
    isBlogCategoryRoute,
    isBlogDetailRoute,
    isBlogRoute,
    isEventCategoryRoute,
    isEventDetailRoute,
    isPortfolioCategoryRoute,
    isPortfolioDetailRoute,
    isProjectDetailRoute,
    isPropertyCategoryRoute,
    isPropertyDetailRoute,
    isServiceCategoryRoute,
    isServiceDetailRoute,
    isTeamCategoryRoute,
    isTeamDetailRoute,
    isCountryDetailRoute,
    isThankYouPageEarly,
    payload,
    publishedPath,
  ]);

  useEffect(() => {
    if (!routeReady || !payload) return;

    const hash = window.location.hash;
    if (hash && hash !== "#") {
      window.requestAnimationFrame(() => {
        if (scrollToSectionHref(hash)) {
          stripUrlHash();
        }
      });
    }
  }, [payload, routeReady, visibleSections]);

  useEffect(() => {
    if (!routeReady || !payload) return;

    const onDocumentClick = (event: MouseEvent) => {
      handleHashlessSectionAnchorClick(event);
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [payload, routeReady]);

  const footerSection = payload?.sections.find(
    (section) => section.type === "Footer",
  );
  const footerVariantData = footerSection
    ? (footerSection.data?.[footerSection.variant] ??
      footerSection.data?.["Footer-1"])
    : undefined;
  const footerData = isRecord(footerVariantData)
    ? (footerVariantData as SectionData)
    : undefined;

  const scrollToTopbar = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!hasLoaded) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!payload) {
    return (
      <PublishedNotFoundScreen
        siteId={siteId}
        requestedPath={`/published/${siteId}`}
        kind="website"
      />
    );
  }

  // Feature pages turned off / unknown paths → classic 404 UI.
  // Avoid notFound() — Next.js 16 + Turbopack Performance.measure crash.
  const blogsRouteBlocked =
    (publishedPath === "blogs" ||
      publishedPath === "blog" ||
      isBlogDetailRoute ||
      isBlogCategoryRoute) &&
    !hasPublishedBlogIndexPage(payload);
  const servicesRouteBlocked =
    (publishedPath === "services" ||
      publishedPath === "service" ||
      isServiceDetailRoute ||
      isServiceCategoryRoute) &&
    !hasPublishedServicesPage(payload);
  const eventsRouteBlocked =
    (publishedPath === "events" ||
      publishedPath === "event" ||
      isEventDetailRoute ||
      isEventCategoryRoute) &&
    !hasPublishedEventsPage(payload);
  const propertiesRouteBlocked =
    (publishedPath === "properties" ||
      publishedPath === "property" ||
      isPropertyDetailRoute ||
      isPropertyCategoryRoute) &&
    !hasPublishedPropertiesPage(payload);
  const portfolioRouteBlocked =
    (publishedPath === "portfolio" ||
      publishedPath === "projects" ||
      isPortfolioDetailRoute ||
      isPortfolioCategoryRoute) &&
    !hasPublishedPortfolioPage(payload);
  const teamsRouteBlocked =
    (publishedPath === "teams" ||
      publishedPath === "team" ||
      isTeamDetailRoute ||
      isTeamCategoryRoute) &&
    !hasPublishedTeamsPage(payload);
  const galleryRouteBlocked =
    publishedPath === "gallery" && !hasPublishedGalleryPage(payload);
  const countryRouteBlocked =
    isCountryDetailRoute && !hasPublishedCountriesServeSection(payload);
  const isThankYouPage = isThankYouPageEarly;
  const unknownPagePath =
    Boolean(publishedPath) &&
    !isThankYouPage &&
    !blogsRouteBlocked &&
    !servicesRouteBlocked &&
    !eventsRouteBlocked &&
    !propertiesRouteBlocked &&
    !portfolioRouteBlocked &&
    !teamsRouteBlocked &&
    !galleryRouteBlocked &&
    !countryRouteBlocked &&
    !isKnownPublishedPagePath(payload, publishedPath);

  const showInlineNotFound =
    blogsRouteBlocked ||
    servicesRouteBlocked ||
    eventsRouteBlocked ||
    propertiesRouteBlocked ||
    portfolioRouteBlocked ||
    teamsRouteBlocked ||
    galleryRouteBlocked ||
    countryRouteBlocked ||
    unknownPagePath;

  const shellOnlyTypes = new Set(["Topbar", "Header", "Footer"]);
  const sectionsToRender =
    showInlineNotFound || isThankYouPage
      ? visibleSections.filter((s) => shellOnlyTypes.has(s.type))
      : visibleSections;

  const publishedBlogs = recoverBlogPageLinksFromSections(
    payload.pageLinks,
    payload.sections,
  ).filter((link) => link.kind === "blog" && !link.hidden);
  const hasBlogIndexPage = hasPublishedBlogIndexPage(payload);
  const showPublishedBlogIndex =
    (publishedPath === "blogs" || publishedPath === "blog") &&
    hasBlogIndexPage;
  const showPublishedBlogView =
    isBlogDetailRoute || showPublishedBlogIndex;
  const blogIndexLayout = payload.pageLinks.find(
    (link) =>
      link.kind === "blogIndex" ||
      link.href.trim().toLowerCase() === "#page-blogs",
  )?.layout;
  const { services: publishedServices, detailLayout: serviceDetailLayout } =
    readPublishedServices(payload);
  const { events: publishedEvents, detailLayout: eventDetailLayout } =
    readPublishedEvents(payload);
  const {
    properties: publishedProperties,
    detailLayout: propertyDetailLayout,
    realEstateSkin: propertyRealEstateSkin,
  } =
    readPublishedProperties(payload);
  const {
    portfolioItems: publishedPortfolio,
    detailLayout: portfolioDetailLayout,
  } = readPublishedPortfolio(payload);
  const serviceDetailBase = `/published/${encodeURIComponent(siteId)}/service`;
  const eventDetailBase = `/published/${encodeURIComponent(siteId)}/event`;
  const propertyDetailBase = `/published/${encodeURIComponent(siteId)}/property`;
  const portfolioDetailBase = `/published/${encodeURIComponent(siteId)}/${
    payload.sections.some(
      (section) =>
        section.type === "PortfolioPage" &&
        (normalizeContentPageSlug(section.page || "") === "projects" ||
          section.variant === "PortfolioPage-5" ||
          section.variant === "PortfolioPage-6"),
    )
      ? "projects"
      : "portfolio"
  }`;
  const {
    teamMembers: publishedTeamMembers,
    detailLayout: teamDetailLayout,
  } = readPublishedTeam(payload);
  const teamDetailBase = `/published/${encodeURIComponent(siteId)}/team`;
  const countriesServeDetailBase = `/published/${encodeURIComponent(siteId)}/country`;
  const publishedCountryListings = readPublishedCountryListings(payload);
  const serviceDetailSlug = isServiceDetailRoute
    ? resolveServiceDetailSlug(publishedPath)
    : "";
  const selectedPublishedService = serviceDetailSlug
    ? publishedServices.find(
        (service, index) =>
          getServiceSlug(service, index) === serviceDetailSlug,
      )
    : undefined;
  const servicesBreadcrumbSection = findPageBreadcrumbSection(
    payload,
    "services",
  );
  const servicesBreadcrumbData = (() => {
    if (!servicesBreadcrumbSection) return null;
    const variant =
      servicesBreadcrumbSection.data?.[servicesBreadcrumbSection.variant] ??
      servicesBreadcrumbSection.data?.["Breadcrumb-1"];
    return isRecord(variant) ? (variant as SectionData) : null;
  })();
  const eventDetailSlug = isEventDetailRoute
    ? resolveEventDetailSlug(publishedPath)
    : "";
  const selectedPublishedEvent = eventDetailSlug
    ? publishedEvents.find(
        (eventItem, index) =>
          getEventSlug(eventItem, index) === eventDetailSlug,
      )
    : undefined;
  const eventsBreadcrumbSection =
    findPageBreadcrumbSection(payload, "events") ??
    findPageBreadcrumbSection(payload, "event");
  const eventsBreadcrumbData = (() => {
    if (!eventsBreadcrumbSection) return null;
    const variant =
      eventsBreadcrumbSection.data?.[eventsBreadcrumbSection.variant] ??
      eventsBreadcrumbSection.data?.["Breadcrumb-1"];
    return isRecord(variant) ? (variant as SectionData) : null;
  })();
  const propertyDetailSlug = isPropertyDetailRoute
    ? resolvePropertyDetailSlug(publishedPath)
    : "";
  const selectedPublishedProperty = propertyDetailSlug
    ? publishedProperties.find(
        (propertyItem, index) =>
          getPropertySlug(propertyItem, index) === propertyDetailSlug,
      )
    : undefined;
  const propertiesBreadcrumbSection =
    findPageBreadcrumbSection(payload, "buy-a-property") ??
    findPageBreadcrumbSection(payload, "rent") ??
    findPageBreadcrumbSection(payload, "properties") ??
    findPageBreadcrumbSection(payload, "property");
  const propertiesBreadcrumbData = (() => {
    if (!propertiesBreadcrumbSection) return null;
    const variant =
      propertiesBreadcrumbSection.data?.[
        propertiesBreadcrumbSection.variant
      ] ?? propertiesBreadcrumbSection.data?.["Breadcrumb-1"];
    return isRecord(variant) ? (variant as SectionData) : null;
  })();
  const portfolioDetailSlug = isProjectOrPortfolioDetail
    ? resolvePortfolioDetailSlug(publishedPath)
    : "";
  const selectedPublishedPortfolio = portfolioDetailSlug
    ? publishedPortfolio.find(
        (portfolioItem, index) =>
          getPortfolioSlug(portfolioItem, index) === portfolioDetailSlug,
      )
    : undefined;
  const portfolioBreadcrumbSection = findPageBreadcrumbSection(
    payload,
    "portfolio",
  );
  const portfolioBreadcrumbData = (() => {
    if (!portfolioBreadcrumbSection) return null;
    const variant =
      portfolioBreadcrumbSection.data?.[portfolioBreadcrumbSection.variant] ??
      portfolioBreadcrumbSection.data?.["Breadcrumb-1"];
    return isRecord(variant) ? (variant as SectionData) : null;
  })();
  const teamDetailSlug = isTeamDetailRoute
    ? resolveTeamDetailSlug(publishedPath)
    : "";
  const selectedPublishedTeam = teamDetailSlug
    ? publishedTeamMembers.find(
        (teamItem, index) =>
          getTeamSlug(teamItem, index) === teamDetailSlug,
      )
    : undefined;
  const teamsBreadcrumbSection =
    findPageBreadcrumbSection(payload, "teams") ??
    findPageBreadcrumbSection(payload, "team");
  const teamsBreadcrumbData = (() => {
    if (!teamsBreadcrumbSection) return null;
    const variant =
      teamsBreadcrumbSection.data?.[teamsBreadcrumbSection.variant] ??
      teamsBreadcrumbSection.data?.["Breadcrumb-1"];
    return isRecord(variant) ? (variant as SectionData) : null;
  })();
  const blogDetailSlug = isBlogDetailRoute
    ? publishedPath.replace(/^blogs?\//i, "").replace(/^\/+|\/+$/g, "")
    : "";
  const selectedPublishedBlog = blogDetailSlug
    ? publishedBlogs.find((blog) => getBlogSlug(blog) === blogDetailSlug)
    : undefined;
  const blogsIndexLabel =
    payload.pageLinks.find(
      (link) =>
        link.kind === "blogIndex" ||
        link.href.trim().toLowerCase() === "#page-blogs",
    )?.label || "Blogs";
  const countryDetailSlug = isCountryDetailRoute
    ? resolveCountryListingDetailSlug(publishedPath)
    : "";
  const selectedPublishedCountryListing = countryDetailSlug
    ? publishedCountryListings.find(
        (listing, index) =>
          getCountryListingSlug(listing, index) === countryDetailSlug,
      )
    : undefined;
  const countriesIndexLabel = "Countries";
  const hasPublishedFooter = sectionsToRender.some(
    (section) => section.type === "Footer",
  );
  const countriesServeSectionForShell = findEnabledCountriesServeSection(
    payload.sections,
  );
  const usesSyntheticPageContent =
    showPublishedBlogView ||
    isServiceDetailRoute ||
    isEventDetailRoute ||
    isPropertyDetailRoute ||
    isProjectOrPortfolioDetail ||
    isTeamDetailRoute ||
    isCountryDetailRoute ||
    showInlineNotFound ||
    isThankYouPage;
  const renderCountriesServeBeforeFooter = () => {
    if (!usesSyntheticPageContent || !countriesServeSectionForShell) {
      return null;
    }
    const section = countriesServeSectionForShell;
    const Component = sectionRegistry[section.variant];
    if (!Component) return null;
    const defaultVariant = `${section.type}-1`;
    const variantData =
      section.data?.[section.variant] ?? section.data?.[defaultVariant];
    const sectionData = (
      isRecord(variantData) ? variantData : section.data
    ) as SectionData;
    return (
      <InlineFormattedSection
        anchorId="countries-we-serve"
        sectionType={section.type}
        className="relative z-0"
        formats={readInlineTextFormats(sectionData)}
      >
        <Component
          data={
            {
              ...(stripEditorOnlyValues(sectionData) as SectionData),
              countriesServeDetailBase,
            } as SectionData
          }
        />
      </InlineFormattedSection>
    );
  };

  const publishedTemplate = getBuilderTemplate(
    payload.templateId,
    payload.category,
  );

  return (
    <main
      className="min-h-screen w-full overflow-x-clip [overflow-wrap:anywhere]"
      data-site-theme-root
      style={payload.templateVariables as React.CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: SITE_THEME_GLOBAL_CSS }} />
      {sectionsToRender.map((section, sectionIndex) => {
        const renderVariant = resolveTemplateSectionVariant(
          section,
          publishedTemplate,
        );
        const renderSection = { ...section, variant: renderVariant };
        const Component = sectionRegistry[renderVariant];
        const defaultVariant = `${section.type}-1`;
        const variantData =
          section.data?.[renderVariant] ??
          section.data?.[section.variant] ??
          section.data?.[defaultVariant];
        const sectionData = {
          ...(isRecord(variantData) ? variantData : section.data),
          ...overlayManagerHomeFeed(
            renderSection,
            payload.sections.map((item) => ({
              ...item,
              variant: resolveTemplateSectionVariant(item, publishedTemplate),
            })),
            payload.pageLinks || [],
          ),
        } as SectionData;
        const isServiceListing =
          section.type === "ServicePage" ||
          (section.type === "Service" &&
            (normalizeContentPageSlug(section.page || "") === "services" ||
              ["service", "services"].includes(
                normalizeContentPageSlug(section.page || ""),
              )));
        const isEventListing =
          section.type === "EventPage" ||
          (section.type === "Event" &&
            (normalizeContentPageSlug(section.page || "") === "events" ||
              normalizeContentPageSlug(section.page || "") === "event"));
        const isPropertyListing =
          section.type === "PropertyPage" ||
          (section.type === "Property" &&
            (normalizeContentPageSlug(section.page || "") === "properties" ||
              normalizeContentPageSlug(section.page || "") === "property"));
        const isPortfolioListing =
          section.type === "PortfolioPage" ||
          section.type === "LatestProject" ||
          (section.type === "Portfolio" &&
            (normalizeContentPageSlug(section.page || "") === "portfolio" ||
              normalizeContentPageSlug(section.page || "") === "projects"));
        const isTeamListing =
          section.type === "TeamPage" ||
          (section.type === "Team" &&
            (normalizeContentPageSlug(section.page || "") === "teams" ||
              normalizeContentPageSlug(section.page || "") === "team"));
        const isGalleryListing =
          section.type === "GalleryPage" ||
          (section.type === "Gallery" &&
            normalizeContentPageSlug(section.page || "") === "gallery");
        const serviceLayout =
          typeof sectionData.layout === "string" &&
          sectionData.layout.startsWith("ServicePage-")
            ? sectionData.layout
            : section.variant;
        const eventLayout =
          typeof sectionData.layout === "string" &&
          sectionData.layout.startsWith("EventPage-")
            ? sectionData.layout
            : section.variant;
        const propertyLayout =
          typeof sectionData.layout === "string" &&
          sectionData.layout.startsWith("PropertyPage-")
            ? sectionData.layout
            : section.variant;
        const portfolioLayout =
          typeof sectionData.layout === "string" &&
          sectionData.layout.startsWith("PortfolioPage-")
            ? sectionData.layout
            : section.variant;
        const teamLayout =
          typeof sectionData.layout === "string" &&
          sectionData.layout.startsWith("TeamPage-")
            ? sectionData.layout
            : section.variant;
        const galleryLayout =
          typeof sectionData.layout === "string" &&
          sectionData.layout.startsWith("GalleryPage-")
            ? sectionData.layout
            : section.variant;
        const publishedSiteBase = `/published/${encodeURIComponent(siteId)}`;
        const publishedSectionData = {
          ...(stripEditorOnlyValues(sectionData) as SectionData),
          publishedSiteBase,
          propertyDetailBase,
          portfolioDetailBase,
          ...((section.type === "Header" || section.type === "Footer")
            ? rewritePublishedFooterLinks(
                sectionData,
                siteId,
                isMultiPage,
                payload,
              )
            : {}),
          ...(section.type === "Footer"
            ? { removeBranding: payload.removeBranding === true }
            : {}),
          ...(isServiceListing
            ? {
                layout: serviceLayout,
                serviceDetailBase,
                ...(serviceCategorySlug
                  ? {
                      productItems: filterItemsByGroupSlug(
                        Array.isArray(sectionData.productItems)
                          ? sectionData.productItems
                          : [],
                        serviceCategorySlug,
                      ),
                      serviceSlides: filterItemsByGroupSlug(
                        Array.isArray(sectionData.serviceSlides)
                          ? (sectionData.serviceSlides as Array<{
                              category?: string;
                            }>)
                          : [],
                        serviceCategorySlug,
                      ),
                      productSlides: filterItemsByGroupSlug(
                        Array.isArray(sectionData.productSlides)
                          ? (sectionData.productSlides as Array<{
                              category?: string;
                            }>)
                          : [],
                        serviceCategorySlug,
                      ),
                      productSectionTitle:
                        serviceCategorySlug.replace(/-/g, " ").replace(/\b\w/g, (c) =>
                          c.toUpperCase(),
                        ) || sectionData.productSectionTitle,
                    }
                  : {}),
              }
            : {}),
          ...(isEventListing
            ? {
                layout: eventLayout,
                eventDetailBase,
                ...(eventCategorySlug
                  ? {
                      productItems: filterItemsByGroupSlug(
                        Array.isArray(sectionData.productItems)
                          ? sectionData.productItems
                          : [],
                        eventCategorySlug,
                      ),
                    }
                  : {}),
              }
            : {}),
          ...(isPropertyListing
            ? {
                layout: propertyLayout,
                propertyDetailBase,
                ...(propertyCategorySlug
                  ? {
                      productItems: filterItemsByGroupSlug(
                        Array.isArray(sectionData.productItems)
                          ? sectionData.productItems
                          : [],
                        propertyCategorySlug,
                        true,
                      ),
                    }
                  : {}),
              }
            : {}),
          ...(isPortfolioListing
            ? {
                layout: portfolioLayout,
                portfolioDetailBase,
                productItems:
                  Array.isArray(sectionData.productItems) &&
                  sectionData.productItems.length
                    ? portfolioCategorySlug
                      ? filterItemsByGroupSlug(
                          sectionData.productItems,
                          portfolioCategorySlug,
                        )
                      : sectionData.productItems
                    : publishedPortfolio,
                projectItems: (() => {
                  const existing = Array.isArray(
                    (sectionData as SectionData & { projectItems?: unknown[] })
                      .projectItems,
                  )
                    ? (
                        sectionData as SectionData & {
                          projectItems?: Array<Record<string, unknown>>;
                        }
                      ).projectItems || []
                    : [];
                  const source = existing.length
                    ? existing
                    : Array.isArray(sectionData.productItems) &&
                        sectionData.productItems.length
                      ? sectionData.productItems
                      : publishedPortfolio;
                  return portfolioCategorySlug
                    ? filterItemsByGroupSlug(
                        source as Array<{ category?: string }>,
                        portfolioCategorySlug,
                      )
                    : source;
                })(),
              }
            : {}),
          ...(isTeamListing
            ? {
                layout: teamLayout,
                teamDetailBase,
                ...(teamCategorySlug
                  ? {
                      productItems: filterItemsByGroupSlug(
                        Array.isArray(sectionData.productItems)
                          ? sectionData.productItems
                          : [],
                        teamCategorySlug,
                      ),
                    }
                  : {}),
              }
            : {}),
          ...(isGalleryListing
            ? {
                layout: galleryLayout,
              }
            : {}),
          ...(section.type === "CountriesServe"
            ? {
                countriesServeDetailBase,
              }
            : {}),
          ...(isServiceDetailRoute &&
          section.type === "Breadcrumb" &&
          selectedPublishedService
            ? {
                title: selectedPublishedService.title,
                parentLabel:
                  (typeof servicesBreadcrumbData?.title === "string" &&
                    servicesBreadcrumbData.title.trim()) ||
                  "Services",
                desc:
                  selectedPublishedService.desc ||
                  (typeof sectionData.desc === "string" ? sectionData.desc : ""),
              }
            : {}),
          ...(normalizeContentPageSlug(currentPage || "") === "events" &&
          !isEventDetailRoute &&
          section.type === "Breadcrumb"
            ? {
                title: "Events",
                parentLabel: "",
              }
            : {}),
          ...(isEventDetailRoute &&
          section.type === "Breadcrumb" &&
          selectedPublishedEvent
            ? {
                title: selectedPublishedEvent.title,
                parentLabel:
                  (typeof eventsBreadcrumbData?.title === "string" &&
                    eventsBreadcrumbData.title.trim()) ||
                  "Events",
                desc:
                  selectedPublishedEvent.desc ||
                  (typeof sectionData.desc === "string" ? sectionData.desc : ""),
              }
            : {}),
          ...(normalizeContentPageSlug(currentPage || "") === "properties" &&
          !isPropertyDetailRoute &&
          section.type === "Breadcrumb"
            ? {
                title: "Properties",
                parentLabel: "",
              }
            : {}),
          ...(isPropertyDetailRoute &&
          section.type === "Breadcrumb" &&
          selectedPublishedProperty
            ? {
                title: selectedPublishedProperty.title,
                parentLabel:
                  selectedPublishedProperty.sourcePage === "rent"
                    ? "Rent a Property"
                    : selectedPublishedProperty.sourcePage === "buy-a-property"
                      ? "Buy a Property"
                      : (typeof propertiesBreadcrumbData?.title === "string" &&
                          propertiesBreadcrumbData.title.trim() &&
                          !/^(events?|services?|about)$/i.test(
                            propertiesBreadcrumbData.title.trim(),
                          )
                            ? propertiesBreadcrumbData.title.trim()
                            : "Properties"),
                desc:
                  selectedPublishedProperty.desc ||
                  (typeof sectionData.desc === "string" ? sectionData.desc : ""),
              }
            : {}),
          ...(normalizeContentPageSlug(currentPage || "") === "portfolio" &&
          !isPortfolioDetailRoute &&
          section.type === "Breadcrumb"
            ? {
                title: "Portfolio",
                parentLabel: "",
              }
            : {}),
          ...(isProjectOrPortfolioDetail &&
          section.type === "Breadcrumb" &&
          selectedPublishedPortfolio
            ? {
                title: selectedPublishedPortfolio.title,
                parentLabel: isProjectDetailRoute
                  ? "Projects"
                  : (typeof portfolioBreadcrumbData?.title === "string" &&
                      portfolioBreadcrumbData.title.trim()) ||
                    "Portfolio",
                desc:
                  selectedPublishedPortfolio.desc ||
                  (typeof sectionData.desc === "string" ? sectionData.desc : ""),
              }
            : {}),
          ...(normalizeContentPageSlug(currentPage || "") === "teams" &&
          !isTeamDetailRoute &&
          section.type === "Breadcrumb"
            ? {
                title: "Teams",
                parentLabel: "",
              }
            : {}),
          ...(normalizeContentPageSlug(currentPage || "") === "gallery" &&
          section.type === "Breadcrumb"
            ? {
                title: "Gallery",
                parentLabel: "",
              }
            : {}),
          ...(isTeamDetailRoute &&
          section.type === "Breadcrumb" &&
          selectedPublishedTeam
            ? {
                title: selectedPublishedTeam.title,
                parentLabel:
                  (typeof teamsBreadcrumbData?.title === "string" &&
                    teamsBreadcrumbData.title.trim()) ||
                  "Teams",
                desc:
                  selectedPublishedTeam.desc ||
                  (typeof sectionData.desc === "string" ? sectionData.desc : ""),
              }
            : {}),
          ...(isBlogDetailRoute &&
          section.type === "Breadcrumb" &&
          selectedPublishedBlog
            ? {
                title: selectedPublishedBlog.label,
                parentLabel: blogsIndexLabel,
                desc:
                  selectedPublishedBlog.shortDescription ||
                  (typeof sectionData.desc === "string" ? sectionData.desc : ""),
              }
            : {}),
          ...(isCountryDetailRoute &&
          section.type === "Breadcrumb" &&
          selectedPublishedCountryListing
            ? {
                title: selectedPublishedCountryListing.title,
                parentLabel:
                  selectedPublishedCountryListing.category?.trim() ||
                  countriesIndexLabel,
                desc:
                  selectedPublishedCountryListing.desc ||
                  (typeof sectionData.desc === "string" ? sectionData.desc : ""),
              }
            : {}),
        } as SectionData;
        const stickyMode =
          section.type === "Header"
            ? (sectionData.headerType ?? "scroll")
            : section.type === "Topbar"
              ? (sectionData.topbarType ?? "scroll")
              : "scroll";
        const sectionStackClass =
          section.type === "Topbar"
            ? "z-[130]"
            : section.type === "Header"
              ? "z-[120]"
              : "z-0";

        if (!Component) return null;

        // Country listing not-found: never show donor breadcrumb (e.g. About).
        if (
          isCountryDetailRoute &&
          countryDetailSlug &&
          !selectedPublishedCountryListing &&
          section.type === "Breadcrumb"
        ) {
          return null;
        }

        return (
          <React.Fragment key={section.id ?? `${section.type}-${sectionIndex}`}>
            {showPublishedBlogView && section.type === "Footer" ? (
              <PublishedBlogView
                siteId={siteId}
                path={publishedPath}
                blogs={publishedBlogs}
                indexLayout={blogIndexLayout}
              />
            ) : null}
            {isServiceDetailRoute && section.type === "Footer" ? (
              <PublishedServiceView
                siteId={siteId}
                path={publishedPath}
                services={publishedServices}
                detailLayout={serviceDetailLayout}
              />
            ) : null}
            {isEventDetailRoute && section.type === "Footer" ? (
              <PublishedEventView
                siteId={siteId}
                path={publishedPath}
                events={publishedEvents}
                detailLayout={eventDetailLayout}
              />
            ) : null}
            {isPropertyDetailRoute && section.type === "Footer" ? (
              <PublishedPropertyView
                siteId={siteId}
                path={publishedPath}
                properties={publishedProperties}
                detailLayout={propertyDetailLayout}
                realEstateSkin={propertyRealEstateSkin}
              />
            ) : null}
            {isProjectOrPortfolioDetail && section.type === "Footer" ? (
              <PublishedPortfolioView
                siteId={siteId}
                path={publishedPath}
                portfolioItems={publishedPortfolio}
                detailLayout={portfolioDetailLayout}
              />
            ) : null}
            {isTeamDetailRoute && section.type === "Footer" ? (
              <PublishedTeamView
                siteId={siteId}
                path={publishedPath}
                teamMembers={publishedTeamMembers}
                detailLayout={teamDetailLayout}
              />
            ) : null}
            {isCountryDetailRoute && section.type === "Footer" ? (
              <PublishedCountryListingView
                siteId={siteId}
                path={publishedPath}
                listings={publishedCountryListings}
              />
            ) : null}
            {section.type === "Footer"
              ? renderCountriesServeBeforeFooter()
              : null}
            {section.type === "Footer" && showInlineNotFound ? (
              <section className="flex flex-col items-center justify-center py-20 px-4 text-center min-h-[50vh]">
                <h1 className="text-7xl sm:text-9xl font-black opacity-10">404</h1>
                <h2 className="mt-4 text-2xl sm:text-3xl font-bold">Page Not Found</h2>
                <p className="mt-3 max-w-md text-base opacity-70">
                  Sorry, the page you are looking for does not exist or has been moved.
                </p>
                <a
                  href={`/published/${encodeURIComponent(siteId)}`}
                  className="mt-8 inline-block rounded-full bg-black text-white px-8 py-3 text-sm font-semibold shadow hover:opacity-80 transition"
                >
                  Back to Home
                </a>
              </section>
            ) : null}
            {section.type === "Footer" && isThankYouPage ? (
              <section className="flex flex-col items-center justify-center py-20 px-4 text-center min-h-[50vh]">
                <div className="text-5xl sm:text-6xl mb-4">{"\u2705"}</div>
                <h1 className="text-3xl sm:text-4xl font-bold">Thank You!</h1>
                <p className="mt-3 max-w-md text-base opacity-70">
                  Your submission has been received. We will get back to you shortly.
                </p>
                <a
                  href={`/published/${encodeURIComponent(siteId)}`}
                  className="mt-8 inline-block rounded-full bg-black text-white px-8 py-3 text-sm font-semibold shadow hover:opacity-80 transition"
                >
                  Back to Home
                </a>
              </section>
            ) : null}
            <InlineFormattedSection
              anchorId={getSectionAnchorId(sectionsToRender, sectionIndex)}
              sectionType={section.type}
              className={`${stickyMode === "sticky" ? "sticky top-0" : "relative"} ${sectionStackClass}`}
              formats={readInlineTextFormats(sectionData)}
            >
              <Component
                data={publishedSectionData}
                leadCapture={
                  section.type === "Contact" ||
                  section.type === "FormDetail" ||
                  section.type === "CareerJobs" ||
                  section.variant.startsWith("ContactPage") ||
                  section.variant.startsWith("CareerJobs")
                    ? {
                        siteSlug: siteId,
                        formName: getLeadFormName(
                          sectionData,
                          section.type,
                          section.variant,
                        ),
                        formSection: section.variant,
                        formPage:
                          section.page ||
                          (currentPage && currentPage !== "Home"
                            ? currentPage
                            : undefined),
                      }
                    : undefined
                }
              />
            </InlineFormattedSection>
          </React.Fragment>
        );
      })}

      {showPublishedBlogView && !hasPublishedFooter ? (
        <PublishedBlogView
          siteId={siteId}
          path={publishedPath}
          blogs={publishedBlogs}
          indexLayout={blogIndexLayout}
        />
      ) : null}

      {isServiceDetailRoute && !hasPublishedFooter ? (
        <PublishedServiceView
          siteId={siteId}
          path={publishedPath}
          services={publishedServices}
          detailLayout={serviceDetailLayout}
        />
      ) : null}

      {isEventDetailRoute && !hasPublishedFooter ? (
        <PublishedEventView
          siteId={siteId}
          path={publishedPath}
          events={publishedEvents}
          detailLayout={eventDetailLayout}
        />
      ) : null}

      {isPropertyDetailRoute && !hasPublishedFooter ? (
        <PublishedPropertyView
          siteId={siteId}
          path={publishedPath}
          properties={publishedProperties}
          detailLayout={propertyDetailLayout}
          realEstateSkin={propertyRealEstateSkin}
        />
      ) : null}

      {isProjectOrPortfolioDetail && !hasPublishedFooter ? (
        <PublishedPortfolioView
          siteId={siteId}
          path={publishedPath}
          portfolioItems={publishedPortfolio}
          detailLayout={portfolioDetailLayout}
        />
      ) : null}

      {isTeamDetailRoute && !hasPublishedFooter ? (
        <PublishedTeamView
          siteId={siteId}
          path={publishedPath}
          teamMembers={publishedTeamMembers}
          detailLayout={teamDetailLayout}
        />
      ) : null}

      {isCountryDetailRoute && !hasPublishedFooter ? (
        <PublishedCountryListingView
          siteId={siteId}
          path={publishedPath}
          listings={publishedCountryListings}
        />
      ) : null}
      {!hasPublishedFooter ? renderCountriesServeBeforeFooter() : null}

      <FloatingActionButtons
        footerData={footerData}
        onBackToTop={scrollToTopbar}
        leftClassName="fixed bottom-5 left-5 z-[9000] flex flex-col gap-3"
      />
    </main>
  );
}

export default function PublishedSiteClient({
  siteId,
  initialPageSlug,
  initialPayload,
}: {
  siteId: string;
  initialPageSlug?: string;
  initialPayload: PublishedSitePayload | null;
}) {
  const createAiSite = (
    initialPayload as {
      createAiSite?: {
        pages?: Array<{ id?: string; label?: string; html?: string }>;
        activePageId?: string;
      } | null;
    } | null
  )?.createAiSite;
  const createAiPages = Array.isArray(createAiSite?.pages)
    ? createAiSite.pages.filter(
        (page) => typeof page?.html === "string" && page.html.trim().length > 80,
      )
    : [];
  if (createAiPages.length) {
    const slug = (initialPageSlug || "").trim().toLowerCase();
    const match =
      createAiPages.find(
        (page) =>
          String(page.id || "").toLowerCase() === slug ||
          String(page.label || "")
            .toLowerCase()
            .replace(/\s+/g, "-") === slug,
      ) ||
      createAiPages.find(
        (page) => page.id === createAiSite?.activePageId,
      ) ||
      createAiPages[0];
    const srcDoc = polishCreateAiExportHtml(
      match?.html || "",
      initialPayload?.title ||
        initialPayload?.businessInfo?.name ||
        "",
    );
    return (
      <iframe
        title={initialPayload?.title || "Published site"}
        srcDoc={srcDoc}
        className="h-dvh w-full border-0 bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    );
  }

  const clientPayload = initialPayload
    ? ({
        ...initialPayload,
        pageLinks: (initialPayload.pageLinks ?? []) as PublishedPageLink[],
        sections: (initialPayload.sections ?? []) as SectionItem[],
      } satisfies ClientPayload)
    : null;
  const isMultiPage = clientPayload
    ? isMultiPagePayload(clientPayload)
    : false;

  return (
    <PreviewProvider
      initialCurrentPage={
        clientPayload
          ? resolvePublishedCurrentPage(clientPayload, initialPageSlug, siteId)
          : "Home"
      }
      initialPageLinks={
        clientPayload
          ? createPublishedPreviewLinks(
              clientPayload.pageLinks,
              isMultiPage,
              clientPayload,
              siteId,
            )
          : undefined
      }
    >
      <PublishedSiteContent
        siteId={siteId}
        initialPageSlug={initialPageSlug}
        initialPayload={clientPayload}
      />
    </PreviewProvider>
  );
}
