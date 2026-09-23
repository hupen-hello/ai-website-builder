import type { Metadata } from "next";
import {
  getGlobalSeo,
  getPageSeo,
  normalizePageSeoKey,
  normalizeSiteSeoConfig,
  parseKeywords,
} from "./siteSeo";

export type PublishedSeoPayload = {
  title?: string;
  description?: string;
  keywords?: string[] | string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string | null;
  ogType?: string;
  schemaType?: string;
  schemaJson?: string;
  sitemapEnabled?: boolean;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  favicon?: string | null;
  googleAnalyticsId?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
};

export type PublishedSitePayload = {
  id: string;
  title?: string;
  slug?: string;
  templateId: string;
  category: string;
  pageLinks: Array<{
    label: string;
    href?: string;
    kind?: string;
    hidden?: boolean;
    children?: Array<{
      label: string;
      href?: string;
      kind?: string;
      hidden?: boolean;
    }>;
  }>;
  sections: Array<{
    page?: string;
    type?: string;
    variant?: string;
    data?: Record<string, { menu?: Array<{ label?: string; href?: string; kind?: string; children?: unknown[] }> }>;
  }>;
  templateVariables: Record<string, string>;
  businessInfo?: {
    audience?: string;
    name?: string;
    description?: string;
  } | null;
  seo?: PublishedSeoPayload | null;
  publishedAt: string;
  updatedAt?: string;
  /** True when the owner paid the Remove Branding add-on. */
  removeBranding?: boolean;
};

function pickText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

/** True for placeholder titles like "Business Website" created at site migrate. */
function isGenericCategoryWebsiteTitle(
  title: string | null | undefined,
  category: string | null | undefined,
) {
  if (!title?.trim() || !category?.trim()) return false;
  return (
    title.trim().toLowerCase() === `${category.trim().toLowerCase()} website`
  );
}

function extractBrandNameFromSections(
  sections: PublishedSitePayload["sections"] | undefined,
) {
  if (!Array.isArray(sections)) return "";

  for (const section of sections) {
    if (section?.type !== "Header" || !section.data) continue;
    const variants = Object.values(section.data);
    for (const variant of variants) {
      if (!variant || typeof variant !== "object") continue;
      const data = variant as Record<string, unknown>;
      const logo =
        (typeof data.logo === "string" && data.logo.trim()) ||
        (typeof data.logoText === "string" && data.logoText.trim()) ||
        (typeof data.brandName === "string" && data.brandName.trim()) ||
        "";
      if (logo) return logo;

      if (Array.isArray(data.blocks)) {
        for (const block of data.blocks) {
          if (!block || typeof block !== "object") continue;
          const record = block as Record<string, unknown>;
          if (
            record.type === "logo" &&
            typeof record.text === "string" &&
            record.text.trim()
          ) {
            return record.text.trim();
          }
        }
      }
    }
  }

  return "";
}

function asKeywordList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") return parseKeywords(value);
  return [];
}

const createPageSlug = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createPublishedPageSlug = (label: string) => {
  const slug = createPageSlug(label);
  if (slug === "home") return "";
  return slug;
};

/** True when blogs are enabled to show on the live website. */
export function hasPublishedBlogIndexPage(
  site:
    | Pick<PublishedSitePayload, "pageLinks" | "sections">
    | null
    | undefined,
): boolean {
  return hasPublishedFeaturePage(site, isPublishedBlogIndexLink);
}

const isPublishedBlogIndexLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
  hidden?: boolean;
}) => {
  if (link.kind === "blog") return false;
  if (link.kind === "blogIndex") return true;
  const href = (link.href || "").trim().toLowerCase();
  if (href === "#page-blogs" || href === "#blogs") return true;
  const label = (link.label || "").trim().toLowerCase();
  return label === "blogs" || label === "blog";
};

export const isPublishedServicesPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
  hidden?: boolean;
}) => {
  if (link.kind === "blog") return false;
  const href = (link.href || "").trim().toLowerCase();
  const label = (link.label || "").trim().toLowerCase();
  return (
    href === "#page-service" ||
    href === "#page-services" ||
    label === "service" ||
    label === "services"
  );
};

export const isPublishedEventsPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
  hidden?: boolean;
}) => {
  if (link.kind === "blog") return false;
  const href = (link.href || "").trim().toLowerCase();
  const label = (link.label || "").trim().toLowerCase();
  return (
    href === "#page-event" ||
    href === "#page-events" ||
    label === "event" ||
    label === "events"
  );
};

export const isPublishedPropertiesPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
  hidden?: boolean;
}) => {
  if (link.kind === "blog") return false;
  const href = (link.href || "").trim().toLowerCase();
  const label = (link.label || "").trim().toLowerCase();
  return (
    href === "#page-property" ||
    href === "#page-properties" ||
    label === "property" ||
    label === "properties"
  );
};

export const isPublishedPortfolioPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
  hidden?: boolean;
}) => {
  if (link.kind === "blog") return false;
  const href = (link.href || "").trim().toLowerCase();
  const label = (link.label || "").trim().toLowerCase();
  // Realestate themes use /projects (#page-projects); others use /portfolio.
  return (
    href === "#page-portfolio" ||
    href === "#page-portfolios" ||
    href === "#page-projects" ||
    href === "#page-project" ||
    label === "portfolio" ||
    label === "portfolios" ||
    label === "projects" ||
    label === "project"
  );
};

export const isPublishedTeamsPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
  hidden?: boolean;
}) => {
  if (link.kind === "blog") return false;
  const href = (link.href || "").trim().toLowerCase();
  const label = (link.label || "").trim().toLowerCase();
  return (
    href === "#page-team" ||
    href === "#page-teams" ||
    label === "team" ||
    label === "teams"
  );
};

export const isPublishedGalleryPageLink = (link: {
  label?: string;
  href?: string;
  kind?: string;
  hidden?: boolean;
}) => {
  if (link.kind === "blog") return false;
  const href = (link.href || "").trim().toLowerCase();
  const label = (link.label || "").trim().toLowerCase();
  return href === "#page-gallery" || label === "gallery";
};

const flattenPublishedLinks = <T extends { children?: T[] }>(
  links: T[],
): T[] => links.flatMap((link) => [link, ...flattenPublishedLinks(link.children || [])]);

const hasPublishedFeaturePage = (
  site:
    | Pick<PublishedSitePayload, "pageLinks" | "sections">
    | null
    | undefined,
  isFeatureLink: (link: {
    label?: string;
    href?: string;
    kind?: string;
    hidden?: boolean;
  }) => boolean,
): boolean => {
  const pageLinks = flattenPublishedLinks(site?.pageLinks || []);
  const page = pageLinks.find(isFeatureLink) as { hidden?: boolean } | undefined;
  if (!page || page.hidden) return false;

  const header = (site?.sections || []).find(
    (section) => section.type === "Header",
  );
  if (!header?.data) return true;

  const variantKey = header.variant || "Header-1";
  const variantData =
    header.data[variantKey] ||
    header.data["Header-1"] ||
    Object.values(header.data)[0];
  const menu = variantData?.menu;
  if (!Array.isArray(menu) || menu.length === 0) return true;

  return flattenPublishedLinks(
    menu as Array<{
      label?: string;
      href?: string;
      kind?: string;
      children?: unknown[];
    }>,
  ).some(isFeatureLink);
};

export function hasPublishedServicesPage(
  site:
    | Pick<PublishedSitePayload, "pageLinks" | "sections">
    | null
    | undefined,
): boolean {
  return hasPublishedFeaturePage(site, isPublishedServicesPageLink);
}

export function hasPublishedEventsPage(
  site:
    | Pick<PublishedSitePayload, "pageLinks" | "sections">
    | null
    | undefined,
): boolean {
  return hasPublishedFeaturePage(site, isPublishedEventsPageLink);
}

export function hasPublishedPropertiesPage(
  site:
    | Pick<PublishedSitePayload, "pageLinks" | "sections">
    | null
    | undefined,
): boolean {
  return hasPublishedFeaturePage(site, isPublishedPropertiesPageLink);
}

export function hasPublishedPortfolioPage(
  site:
    | Pick<PublishedSitePayload, "pageLinks" | "sections">
    | null
    | undefined,
): boolean {
  return hasPublishedFeaturePage(site, isPublishedPortfolioPageLink);
}

export function hasPublishedTeamsPage(
  site:
    | Pick<PublishedSitePayload, "pageLinks" | "sections">
    | null
    | undefined,
): boolean {
  return hasPublishedFeaturePage(site, isPublishedTeamsPageLink);
}

export function hasPublishedGalleryPage(
  site:
    | Pick<PublishedSitePayload, "pageLinks" | "sections">
    | null
    | undefined,
): boolean {
  return hasPublishedFeaturePage(site, isPublishedGalleryPageLink);
}

export function isPublishedBlogIndexSlug(pageSlug?: string | null): boolean {
  const slug = createPageSlug(pageSlug || "");
  return slug === "blogs" || slug === "blog";
}

/** Listing or post detail paths under /blogs or /blog/... */
export function isPublishedBlogPublicPath(pageSlug?: string | null): boolean {
  const raw = (pageSlug || "").replace(/^\/+|\/+$/g, "").toLowerCase();
  return (
    raw === "blogs" ||
    raw === "blog" ||
    raw.startsWith("blog/") ||
    raw.startsWith("blogs/")
  );
}

export function isPublishedServicesPublicPath(pageSlug?: string | null): boolean {
  const raw = (pageSlug || "").replace(/^\/+|\/+$/g, "").toLowerCase();
  return (
    raw === "services" ||
    raw === "service" ||
    raw.startsWith("service/") ||
    raw.startsWith("services/")
  );
}

export function isPublishedEventsPublicPath(pageSlug?: string | null): boolean {
  const raw = (pageSlug || "").replace(/^\/+|\/+$/g, "").toLowerCase();
  return (
    raw === "events" ||
    raw === "event" ||
    raw.startsWith("event/") ||
    raw.startsWith("events/")
  );
}

export function isPublishedPropertiesPublicPath(
  pageSlug?: string | null,
): boolean {
  const raw = (pageSlug || "").replace(/^\/+|\/+$/g, "").toLowerCase();
  return (
    raw === "properties" ||
    raw === "property" ||
    raw.startsWith("property/") ||
    raw.startsWith("properties/")
  );
}

export function isPublishedPortfolioPublicPath(pageSlug?: string | null): boolean {
  const raw = (pageSlug || "").replace(/^\/+|\/+$/g, "").toLowerCase();
  return raw === "portfolio" || raw.startsWith("portfolio/");
}

export function isPublishedTeamsPublicPath(pageSlug?: string | null): boolean {
  const raw = (pageSlug || "").replace(/^\/+|\/+$/g, "").toLowerCase();
  return (
    raw === "teams" ||
    raw === "team" ||
    raw.startsWith("team/") ||
    raw.startsWith("teams/")
  );
}

export function isPublishedGalleryPublicPath(pageSlug?: string | null): boolean {
  const raw = (pageSlug || "").replace(/^\/+|\/+$/g, "").toLowerCase();
  return raw === "gallery";
}

/**
 * Resolve a published path to a page label, or `null` when the slug does not
 * exist on the site (so callers can show a real 404 instead of Home).
 */
export function matchPublishedPageLabelFromSlug(
  site: PublishedSitePayload,
  pageSlug?: string | null,
): string | null {
  const rawPath = (pageSlug || "").replace(/^\/+|\/+$/g, "");
  let slug = createPageSlug(rawPath);
  if (slug.startsWith("page-") && slug.length > "page-".length) {
    slug = slug.slice("page-".length);
  }
  if (!slug || slug === "home") return "Home";

  if (slug === "blogs" || slug === "blog") {
    return hasPublishedBlogIndexPage(site) ? "Blogs" : null;
  }

  if (/^blog\//i.test(rawPath) || /^blogs\//i.test(rawPath)) {
    return hasPublishedBlogIndexPage(site) ? "Blogs" : null;
  }
  if (/^service\//i.test(rawPath) || /^services\//i.test(rawPath)) {
    return hasPublishedServicesPage(site) ? "Services" : null;
  }
  if (/^event\//i.test(rawPath) || /^events\//i.test(rawPath)) {
    return hasPublishedEventsPage(site) ? "Events" : null;
  }
  if (/^property\//i.test(rawPath) || /^properties\//i.test(rawPath)) {
    return hasPublishedPropertiesPage(site) ? "Properties" : null;
  }
  if (/^portfolio\//i.test(rawPath)) {
    return hasPublishedPortfolioPage(site) ? "Portfolio" : null;
  }
  if (/^projects\/.+/i.test(rawPath)) {
    return hasPublishedPortfolioPage(site) ? "Projects" : null;
  }
  if (/^team\//i.test(rawPath) || /^teams\//i.test(rawPath)) {
    return hasPublishedTeamsPage(site) ? "Teams" : null;
  }
  if (/^country\//i.test(rawPath) || /^countries\//i.test(rawPath)) {
    return site.sections.some((section) => section.type === "CountriesServe")
      ? "Countries"
      : null;
  }
  if (/^gallery$/i.test(rawPath)) {
    return hasPublishedGalleryPage(site) ? "Gallery" : null;
  }

  const allLinks = (site.pageLinks || []).flatMap((link) => [
    link,
    ...(link.children || []),
  ]);

  const getHrefSlug = (href?: string) => {
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
      if (!rest || rest.includes("/")) return "";
      return rest;
    }
    if (normalized.startsWith("/") && !normalized.startsWith("/published/")) {
      const rest = decodeURIComponent(
        normalized.replace(/^\/+/, "").split(/[?#]/, 1)[0],
      ).replace(/\/+$/, "");
      return rest && !rest.includes("/") ? rest : "";
    }
    return "";
  };

  const visibleLinks = allLinks.filter(
    (link) => link.kind !== "blog" && !link.hidden,
  );

  const byHref = visibleLinks.find((link) => getHrefSlug(link.href) === slug);
  if (byHref) {
    if (isPublishedServicesPageLink(byHref) && !hasPublishedServicesPage(site)) {
      return null;
    }
    if (isPublishedEventsPageLink(byHref) && !hasPublishedEventsPage(site)) {
      return null;
    }
    if (
      isPublishedPropertiesPageLink(byHref) &&
      !hasPublishedPropertiesPage(site)
    ) {
      return null;
    }
    if (
      isPublishedPortfolioPageLink(byHref) &&
      !hasPublishedPortfolioPage(site)
    ) {
      return null;
    }
    if (isPublishedTeamsPageLink(byHref) && !hasPublishedTeamsPage(site)) {
      return null;
    }
    if (isPublishedGalleryPageLink(byHref) && !hasPublishedGalleryPage(site)) {
      return null;
    }
    return byHref.label;
  }

  const pageLabels = visibleLinks.map((link) => link.label);
  const exactLabel = pageLabels.find(
    (label) => createPublishedPageSlug(label) === slug,
  );
  if (exactLabel) {
    const matched = visibleLinks.find((link) => link.label === exactLabel);
    if (
      matched &&
      isPublishedServicesPageLink(matched) &&
      !hasPublishedServicesPage(site)
    ) {
      return null;
    }
    if (
      matched &&
      isPublishedEventsPageLink(matched) &&
      !hasPublishedEventsPage(site)
    ) {
      return null;
    }
    if (
      matched &&
      isPublishedPropertiesPageLink(matched) &&
      !hasPublishedPropertiesPage(site)
    ) {
      return null;
    }
    if (
      matched &&
      isPublishedPortfolioPageLink(matched) &&
      !hasPublishedPortfolioPage(site)
    ) {
      return null;
    }
    if (
      matched &&
      isPublishedTeamsPageLink(matched) &&
      !hasPublishedTeamsPage(site)
    ) {
      return null;
    }
    if (
      matched &&
      isPublishedGalleryPageLink(matched) &&
      !hasPublishedGalleryPage(site)
    ) {
      return null;
    }
    return exactLabel;
  }

  const legacySlug =
    slug === "about-us"
      ? "about"
      : slug === "contact-us"
        ? "contact"
        : slug === "service"
          ? "services"
          : slug === "event"
            ? "events"
            : slug === "team"
              ? "teams"
              : slug;
  if (legacySlug !== slug) {
    const legacyByHref = visibleLinks.find(
      (link) => getHrefSlug(link.href) === legacySlug,
    );
    if (legacyByHref) return legacyByHref.label;
    const legacyLabel = pageLabels.find(
      (label) => createPublishedPageSlug(label) === legacySlug,
    );
    if (legacyLabel) return legacyLabel;
  }

  if (slug === "events" || slug === "event") {
    return hasPublishedEventsPage(site) ? "Events" : null;
  }
  if (slug === "services" || slug === "service") {
    return hasPublishedServicesPage(site) ? "Services" : null;
  }
  if (slug === "properties" || slug === "property") {
    return hasPublishedPropertiesPage(site) ? "Properties" : null;
  }
  if (slug === "portfolio") {
    return hasPublishedPortfolioPage(site) ? "Portfolio" : null;
  }
  if (slug === "teams" || slug === "team") {
    return hasPublishedTeamsPage(site) ? "Teams" : null;
  }
  if (slug === "gallery") {
    return hasPublishedGalleryPage(site) ? "Gallery" : null;
  }

  const sectionPage = (site.sections || []).find((section) => {
    const sectionSlug = normalizePageSeoKey(section.page || "");
    return (
      sectionSlug === slug ||
      sectionSlug === legacySlug ||
      (slug === "about-us" && sectionSlug === "about") ||
      (slug === "contact-us" && sectionSlug === "contact")
    );
  })?.page;

  return sectionPage || null;
}

export function resolvePublishedPageLabelFromSlug(
  site: PublishedSitePayload,
  pageSlug?: string,
): string {
  return matchPublishedPageLabelFromSlug(site, pageSlug) || "Home";
}

/** False for junk paths like /published/{site}/kkkkk */
export function isKnownPublishedPagePath(
  site: PublishedSitePayload | null | undefined,
  pageSlug?: string | null,
): boolean {
  if (!site) return false;
  const raw = (pageSlug || "").replace(/^\/+|\/+$/g, "");
  if (!raw) return true;
  return matchPublishedPageLabelFromSlug(site, pageSlug) != null;
}

export function getSiteOrigin(requestOrigin?: string | null) {
  const configured =
    process.env.NEXT_PUBLIC_PUBLISH_BASE_URL ||
    process.env.PUBLISH_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (requestOrigin) return requestOrigin.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function toAbsoluteUrl(origin: string, value?: string | null) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }
  if (value.startsWith("/")) return `${origin}${value}`;
  return undefined;
}

type PublishedDetailSeoItem = {
  title: string;
  slug: string;
  desc?: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
};

const createDetailSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const readSectionVariantData = (
  section: PublishedSitePayload["sections"][number],
): Record<string, unknown> | null => {
  if (!section.data || typeof section.data !== "object") return null;
  const variant = section.variant || `${section.type || "Section"}-1`;
  const variantData =
    section.data[variant] ||
    section.data[`${section.type}-1`] ||
    Object.values(section.data)[0];
  if (!variantData || typeof variantData !== "object") return null;
  return variantData as Record<string, unknown>;
};

const mapDetailItemsFromRows = (
  rows: unknown[],
  fallbackPrefix: string,
): PublishedDetailSeoItem[] =>
  rows
    .filter((row) => row && typeof row === "object")
    .map((row, index) => {
      const record = row as Record<string, unknown>;
      const title =
        typeof record.title === "string"
          ? record.title.trim()
          : typeof record.label === "string"
            ? record.label.trim()
            : "";
      const slug =
        (typeof record.slug === "string" && record.slug.trim()) ||
        createDetailSlug(title) ||
        `${fallbackPrefix}-${index + 1}`;
      return {
        title,
        slug: createDetailSlug(slug) || slug,
        desc:
          typeof record.desc === "string"
            ? record.desc
            : typeof record.shortDescription === "string"
              ? record.shortDescription
              : undefined,
        image: typeof record.image === "string" ? record.image : undefined,
        seoTitle:
          typeof record.seoTitle === "string" ? record.seoTitle : undefined,
        seoDescription:
          typeof record.seoDescription === "string"
            ? record.seoDescription
            : undefined,
        seoKeywords:
          typeof record.seoKeywords === "string"
            ? record.seoKeywords
            : undefined,
      };
    })
    .filter((item) => item.title);

const findPublishedDetailSeoItem = (
  site: PublishedSitePayload,
  pageSlug?: string | null,
): { item: PublishedDetailSeoItem; publicPath: string } | null => {
  const raw = (pageSlug || "").replace(/^\/+|\/+$/g, "");
  if (!raw) return null;

  const match =
    raw.match(/^(service|services)\/([^/?#]+)$/i) ||
    raw.match(/^(event|events)\/([^/?#]+)$/i) ||
    raw.match(/^(property|properties)\/([^/?#]+)$/i) ||
    raw.match(/^(portfolio|projects)\/([^/?#]+)$/i) ||
    raw.match(/^(team|teams)\/([^/?#]+)$/i) ||
    raw.match(/^(country|countries)\/([^/?#]+)$/i) ||
    raw.match(/^(blog|blogs)\/([^/?#]+)$/i);
  if (!match) return null;

  const kind = match[1].toLowerCase();
  const itemSlug = createDetailSlug(decodeURIComponent(match[2]));
  if (!itemSlug) return null;

  const publicKind =
    kind === "services"
      ? "service"
      : kind === "events"
        ? "event"
        : kind === "properties"
          ? "property"
          : kind === "projects"
            ? "portfolio"
          : kind === "teams"
            ? "team"
            : kind === "countries"
              ? "country"
              : kind === "blogs"
                ? "blog"
                : kind;

  if (publicKind === "country") {
    const section = site.sections.find(
      (item) => item.type === "CountriesServe",
    );
    if (!section) return null;
    const data = readSectionVariantData(section);
    if (!data) return null;
    const rows = Array.isArray(data.countriesServeListings)
      ? data.countriesServeListings
      : [];
    const items = mapDetailItemsFromRows(rows, "country");
    const item = items.find((row) => row.slug === itemSlug);
    if (!item) return null;
    return { publicPath: `country/${itemSlug}`, item };
  }

  if (publicKind === "blog") {
    const blogs = (site.pageLinks || [])
      .flatMap((link) => [link, ...(link.children || [])])
      .filter((link) => link.kind === "blog" && !link.hidden);
    const blog = blogs.find((link) => {
      const href = (link.href || "").trim().toLowerCase();
      const fromHref = href.startsWith("#page-blog-")
        ? createDetailSlug(href.slice("#page-blog-".length))
        : "";
      const fromLabel = createDetailSlug(link.label);
      return fromHref === itemSlug || fromLabel === itemSlug;
    });
    if (!blog) return null;
    const record = blog as {
      label: string;
      shortDescription?: string;
      image?: string;
      seoTitle?: string;
      seoDescription?: string;
      seoKeywords?: string;
      slug?: string;
    };
    return {
      publicPath: `blog/${itemSlug}`,
      item: {
        title: record.label,
        slug: itemSlug,
        desc: record.shortDescription,
        image: record.image,
        seoTitle: record.seoTitle,
        seoDescription: record.seoDescription,
        seoKeywords: record.seoKeywords,
      },
    };
  }

  const sectionMatchers: {
    types: string[];
    pageSlugs: string[];
    listKeys: string[];
  } =
    publicKind === "service"
      ? {
          types: ["ServicePage", "Service"],
          pageSlugs: ["services", "service"],
          listKeys: ["productItems", "services"],
        }
      : publicKind === "event"
        ? {
            types: ["EventPage", "Event"],
            pageSlugs: ["events", "event"],
            listKeys: ["productItems", "eventItems", "events"],
          }
        : publicKind === "property"
          ? {
              types: ["PropertyPage", "Property", "BuyPropertyPage", "RentPage"],
              pageSlugs: ["properties", "property", "buy-a-property", "rent"],
              listKeys: ["productItems", "propertyItems", "properties", "listings"],
            }
          : publicKind === "portfolio"
            ? {
                types: ["PortfolioPage", "Portfolio", "LatestProject"],
                pageSlugs: ["portfolio", "projects"],
                listKeys: ["productItems", "portfolioItems", "items", "projectItems"],
              }
            : {
                types: ["TeamPage", "Team"],
                pageSlugs: ["teams", "team"],
                listKeys: ["productItems", "teamMembers", "members", "items"],
              };

  const section = site.sections.find((item) => {
    if (!sectionMatchers.types.includes(item.type || "")) return false;
    if (item.type?.endsWith("Page")) return true;
    const page = createDetailSlug(item.page || "");
    return sectionMatchers.pageSlugs.includes(page);
  });
  if (!section) return null;

  const data = readSectionVariantData(section);
  if (!data) return null;

  let rows: unknown[] = [];
  for (const key of sectionMatchers.listKeys) {
    const value = data[key];
    if (Array.isArray(value) && value.length) {
      rows = value;
      break;
    }
  }

  const items = mapDetailItemsFromRows(rows, publicKind);
  const item = items.find((row) => row.slug === itemSlug);
  if (!item) return null;

  return {
    publicPath: `${kind === "projects" ? "projects" : publicKind}/${itemSlug}`,
    item,
  };
};

export function resolvePublishedSeo(
  site: PublishedSitePayload,
  origin: string,
  pageLabel = "Home",
  pageSlug?: string | null,
) {
  const slug = site.slug || site.id;
  const config = normalizeSiteSeoConfig(site.seo);
  const pageManual = getPageSeo(config, pageLabel);
  const globalManual = getGlobalSeo(config);
  const pagePathSlug = createPublishedPageSlug(pageLabel);
  const detail = findPublishedDetailSeoItem(site, pageSlug);

  const brandFromHeader = extractBrandNameFromSections(site.sections);

  const siteFallbackTitle =
    pickText(
      // Prefer explicit business/brand names over the generic "{Category} Website"
      // placeholder that migrateGuestSite uses when no name is set yet.
      site.businessInfo?.name,
      brandFromHeader,
      isGenericCategoryWebsiteTitle(site.title, site.category)
        ? ""
        : site.title,
      site.category ? `${site.category} Website` : "",
    ) || "Website";

  const title =
    pickText(
      detail?.item.seoTitle,
      detail?.item.title
        ? `${detail.item.title} | ${pageLabel !== "Home" ? pageLabel : siteFallbackTitle}`
        : "",
      pageManual.metaTitle,
      pageLabel !== "Home" ? `${pageLabel} | ${site.title || site.category}` : "",
      siteFallbackTitle,
    ) || "Website";

  const description =
    pickText(
      detail?.item.seoDescription,
      detail?.item.desc,
      pageManual.metaDescription,
      site.businessInfo?.description,
    ) || `Official ${title} website.`;

  const detailKeywords = asKeywordList(detail?.item.seoKeywords);
  const keywords =
    detailKeywords.length > 0
      ? detailKeywords
      : asKeywordList(pageManual.metaKeywords).length > 0
        ? asKeywordList(pageManual.metaKeywords)
        : ([title, site.category, site.businessInfo?.audience, "website"].filter(
            Boolean,
          ) as string[]);

  const keywordsContent = keywords.join(", ");
  const siteUrl = detail
    ? `${origin}/published/${slug}/${detail.publicPath}`
    : pagePathSlug
      ? `${origin}/published/${slug}/${pagePathSlug}`
      : `${origin}/published/${slug}`;
  const ogTitle = pickText(pageManual.ogTitle, title) || title;
  const ogDescription =
    pickText(pageManual.ogDescription, description) || description;
  const ogImage =
    toAbsoluteUrl(origin, pageManual.ogImage) ||
    toAbsoluteUrl(origin, detail?.item.image);
  const ogType = pickText(pageManual.ogType, "website") || "website";
  const robotsIndex = globalManual.robotsIndex !== false;
  const robotsFollow = globalManual.robotsFollow !== false;

  return {
    title,
    description,
    keywords,
    keywordsContent,
    siteUrl,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    schemaType:
      pickText(globalManual.schemaType, "Organization") || "Organization",
    schemaJson:
      typeof globalManual.schemaJson === "string" ? globalManual.schemaJson : "",
    slug,
    pageLabel,
    robotsIndex,
    robotsFollow,
    favicon: toAbsoluteUrl(origin, globalManual.favicon),
    googleAnalyticsId: pickText(globalManual.googleAnalyticsId) || undefined,
  };
}

export function buildPublishedMetadata(
  site: PublishedSitePayload,
  origin: string,
  pageLabel = "Home",
  pageSlug?: string | null,
): Metadata {
  const seo = resolvePublishedSeo(site, origin, pageLabel, pageSlug);

  return {
    title: {
      absolute: seo.title,
    },
    description: seo.description,
    keywords: seo.keywordsContent,
    alternates: {
      canonical: seo.siteUrl,
    },
    openGraph: {
      type: "website",
      url: seo.siteUrl,
      title: seo.ogTitle,
      description: seo.ogDescription,
      siteName: seo.title,
      images: seo.ogImage
        ? [{ url: seo.ogImage, alt: seo.ogTitle }]
        : undefined,
    },
    twitter: {
      card: seo.ogImage ? "summary_large_image" : "summary",
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
    robots: {
      index: seo.robotsIndex,
      follow: seo.robotsFollow,
    },
    icons: seo.favicon
      ? {
          icon: [{ url: seo.favicon }],
          shortcut: seo.favicon,
          apple: seo.favicon,
        }
      : undefined,
    other: {
      keywords: seo.keywordsContent,
    },
  };
}

export function buildPublishedJsonLd(
  site: PublishedSitePayload,
  origin: string,
  pageLabel = "Home",
  pageSlug?: string | null,
) {
  const seo = resolvePublishedSeo(site, origin, pageLabel, pageSlug);

  if (seo.schemaJson?.trim()) {
    try {
      return JSON.parse(seo.schemaJson) as Record<string, unknown>;
    } catch {
      /* fall through to auto schema */
    }
  }

  const primaryType = seo.schemaType || "Organization";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${seo.siteUrl}#website`,
        url: seo.siteUrl,
        name: seo.title,
        description: seo.description,
        inLanguage: "en",
      },
      {
        "@type": primaryType,
        "@id": `${seo.siteUrl}#organization`,
        name: seo.title,
        url: seo.siteUrl,
        description: seo.description,
        ...(seo.ogImage ? { logo: seo.ogImage, image: seo.ogImage } : {}),
      },
    ],
  };
}

export function applyPublishedSeoToDocument(
  site: PublishedSitePayload,
  origin: string,
  pageLabel: string,
  pageSlug?: string | null,
) {
  if (typeof document === "undefined") return;
  const seo = resolvePublishedSeo(site, origin, pageLabel, pageSlug);
  document.title = seo.title;

  const setMeta = (
    selector: string,
    attribute: "name" | "property",
    key: string,
    content: string,
  ) => {
    let element = document.head.querySelector(
      `${selector}[${attribute}="${key}"]`,
    ) as HTMLMetaElement | null;
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, key);
      document.head.appendChild(element);
    }
    element.setAttribute("content", content);
  };

  setMeta("meta", "name", "description", seo.description);
  setMeta("meta", "name", "keywords", seo.keywordsContent);
  setMeta("meta", "property", "og:title", seo.ogTitle);
  setMeta("meta", "property", "og:description", seo.ogDescription);
  setMeta("meta", "property", "og:url", seo.siteUrl);
  setMeta("meta", "property", "og:type", seo.ogType);
  if (seo.ogImage) {
    setMeta("meta", "property", "og:image", seo.ogImage);
  }

  const iconHref = seo.favicon || "";
  let iconLink = document.head.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (iconHref) {
    if (!iconLink) {
      iconLink = document.createElement("link");
      iconLink.rel = "icon";
      document.head.appendChild(iconLink);
    }
    iconLink.href = iconHref;
  }
}
