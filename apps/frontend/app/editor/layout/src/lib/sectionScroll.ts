export const scrollTemplateToTop = () => {
  const scrollContainer = document.querySelector<HTMLElement>(
    "[data-template-scroll]",
  );

  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
};

/** Internal editor href for routed pages: #page-{slug} (not blogs). */
export const getRoutedPageSlugFromHref = (href: string) => {
  const normalized = href.trim().toLowerCase();
  if (normalized.startsWith("#page-")) {
    if (normalized === "#page-blogs" || normalized.startsWith("#page-blog-")) {
      return "";
    }
    return decodeURIComponent(normalized.slice("#page-".length)).replace(
      /^\/+|\/+$/g,
      "",
    );
  }

  // Published public paths: /published/{siteId}/{slug}
  // Detail routes (/service/x, /event/x, …) are NOT soft page slugs.
  const publishedMatch = normalized.match(/^\/published\/[^/]+\/(.+?)\/?$/i);
  if (publishedMatch) {
    const rest = decodeURIComponent(publishedMatch[1]).replace(/^\/+|\/+$/g, "");
    if (!rest || rest === "blogs" || rest === "blog") return "";
    if (
      /^(?:service|services|event|events|property|properties|portfolio|projects|team|teams|blog|blogs|country|countries)\//i.test(
        rest,
      )
    ) {
      return "";
    }
    // Only single-segment listing/page paths soft-route.
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

export const getPublishedSiteBasePath = (pathname = window.location.pathname) => {
  const match = pathname.match(/^(\/published\/[^/]+)/i);
  return match?.[1]?.replace(/\/+$/, "") ?? "";
};

/** Map template listing hrefs like /projects/x onto /published/{site}/portfolio/x. */
export const resolvePublishedListingHref = (
  href: string,
  detailBase?: string,
  slug?: string,
) => {
  const raw = (href || "").trim();
  if (
    /^https?:\/\//i.test(raw) ||
    raw.startsWith("mailto:") ||
    raw.startsWith("tel:") ||
    raw.toLowerCase().startsWith("/published/")
  ) {
    return raw || "#";
  }

  const path = raw.split(/[?#]/, 1)[0].replace(/\/+$/, "");
  const siteFromDetail = (detailBase || "").replace(
    /\/(?:property|properties|portfolio|projects|service|services|event|events|team|teams)\/?$/i,
    "",
  );
  const sitePath =
    siteFromDetail ||
    (typeof window !== "undefined" ? getPublishedSiteBasePath() : "");

  const indexMatch = path.match(
    /^\/(properties|property|projects|portfolio|services|service|events|event|buy-a-property|rent)\/?$/i,
  );
  if (indexMatch && sitePath) {
    const page = indexMatch[1].toLowerCase();
    const publicSlug =
      page === "property"
        ? "properties"
        : page === "service"
          ? "services"
          : page === "event"
            ? "events"
            : page;
    return `${sitePath}/${publicSlug}`;
  }

  const detailMatch = path.match(
    /^\/(properties|property|projects|portfolio|services|service|events|event)\/([^/]+)$/i,
  );
  if (detailMatch) {
    const kind = detailMatch[1].toLowerCase();
    const mapped =
      kind === "properties" || kind === "property"
        ? "property"
        : kind === "projects"
          ? "projects"
        : kind === "portfolio"
          ? "portfolio"
          : kind === "events" || kind === "event"
            ? "event"
            : "service";
    const itemId = (slug || "").trim() || detailMatch[2];
    if (detailBase && itemId) {
      return `${detailBase.replace(/\/+$/, "")}/${encodeURIComponent(itemId)}`;
    }
    if (sitePath && itemId) {
      return `${sitePath}/${mapped}/${encodeURIComponent(itemId)}`;
    }
  }

  const id =
    (slug || "").trim() ||
    (!raw.startsWith("/") ? path.replace(/[?#].*$/, "").trim() : "");

  if (detailBase && id && id !== "#") {
    return `${detailBase.replace(/\/+$/, "")}/${encodeURIComponent(id)}`;
  }

  return raw || "#";
};

/** Rewrite editor-style internal links onto /published/{site}/... */
export const resolvePublishedPageHref = (
  href: string,
  siteBase?: string,
  options?: { slug?: string; detailBase?: string },
) => {
  const raw = (href || "").trim();
  if (
    !raw ||
    /^https?:\/\//i.test(raw) ||
    raw.startsWith("mailto:") ||
    raw.startsWith("tel:") ||
    raw.startsWith("#")
  ) {
    return raw || "#";
  }

  if (raw.toLowerCase().startsWith("/published/")) {
    return raw.split("#")[0].split("?")[0];
  }

  const listingHref = resolvePublishedListingHref(
    raw,
    options?.detailBase,
    options?.slug,
  );
  if (listingHref !== raw && listingHref.toLowerCase().startsWith("/published/")) {
    return listingHref;
  }

  const base =
    siteBase ||
    (typeof window !== "undefined" ? getPublishedSiteBasePath() : "");
  if (!base) return raw;

  const [pathPart, ...rest] = raw.split("?");
  const path = pathPart.replace(/\/+$/, "");
  const query = rest.length ? `?${rest.join("?")}` : "";

  if (path === "/blog" || path === "/blogs") {
    return `${base}/blogs${query}`;
  }

  const blogDetail = path.match(/^\/blog(?:s)?\/([^/]+)$/i);
  if (blogDetail) {
    return `${base}/blog/${encodeURIComponent(blogDetail[1])}${query}`;
  }

  const pageMatch = path.match(/^\/([^/]+)$/);
  if (pageMatch) {
    const slug = pageMatch[1].toLowerCase();
    if (slug === "blog") return `${base}/blogs${query}`;
    if (slug === "service") return `${base}/services${query}`;
    if (slug === "event") return `${base}/events${query}`;
    if (slug === "property") return `${base}/properties${query}`;
    return `${base}/${slug}${query}`;
  }

  const detailMatch = path.match(
    /^\/(properties|property|projects|portfolio|services|service|events|event|team|teams)\/([^/]+)$/i,
  );
  if (detailMatch) {
    const kind = detailMatch[1].toLowerCase();
    const itemId = (options?.slug || "").trim() || detailMatch[2];
    const mapped =
      kind === "properties" || kind === "property"
        ? "property"
        : kind === "projects"
          ? "projects"
          : kind === "portfolio"
            ? "portfolio"
            : kind === "events" || kind === "event"
              ? "event"
              : kind === "teams" || kind === "team"
                ? "team"
                : "service";
    if (options?.detailBase && itemId) {
      return `${options.detailBase.replace(/\/+$/, "")}/${encodeURIComponent(itemId)}${query}`;
    }
    if (itemId) {
      return `${base}/${mapped}/${encodeURIComponent(itemId)}${query}`;
    }
  }

  return raw;
};

type PublishedHrefData = {
  publishedSiteBase?: string;
  portfolioDetailBase?: string;
  propertyDetailBase?: string;
};

/** Resolve internal hrefs using publishedSiteBase injected on section data. */
export const publishedHrefFromData = (
  href: string,
  data?: PublishedHrefData,
  slug?: string,
): string => {
  const siteBase =
    typeof data?.publishedSiteBase === "string"
      ? data.publishedSiteBase.trim()
      : undefined;
  const detailBase =
    typeof data?.portfolioDetailBase === "string"
      ? data.portfolioDetailBase.trim()
      : typeof data?.propertyDetailBase === "string"
        ? data.propertyDetailBase.trim()
        : undefined;
  return resolvePublishedPageHref(href, siteBase, { slug, detailBase });
};

/**
 * Blog / detail published URLs keep their own shell and skip
 * currentPage→path sync — clicks must hard-navigate off these routes.
 */
export const isPublishedSpecialContentRoute = (
  pathname = typeof window !== "undefined" ? window.location.pathname : "",
) =>
  /\/published\/[^/]+\/(?:blogs?(?:\/|$)|service\/|services\/.+|event\/|events\/.+|property\/|properties\/.+|portfolio\/.+|projects\/.+|team\/|teams\/.+|country\/|countries\/.+)/i.test(
    pathname,
  );

/** Build the public published URL shown in the status bar / hover. */
export const buildPublishedPageHref = (
  siteId: string,
  href: string,
  label = "",
): string => {
  const base = `/published/${encodeURIComponent(siteId)}`;
  const normalizedHref = href.trim();
  const normalizedLabel = label.trim().toLowerCase();

  if (
    normalizedLabel === "home" ||
    !normalizedHref ||
    normalizedHref === "#"
  ) {
    return base;
  }

  if (
    normalizedHref.toLowerCase() === "#page-blogs" ||
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

  // Already a clean published path — keep it (strip any hash).
  if (normalizedHref.toLowerCase().startsWith("/published/")) {
    return normalizedHref.split("#")[0].split("?")[0];
  }

  let slug = getRoutedPageSlugFromHref(normalizedHref);
  if (!slug) {
    slug = normalizedLabel
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  if (slug === "home") return base;
  if (slug === "service") slug = "services";
  if (slug === "event") slug = "events";
  if (!slug) return base;
  return `${base}/${slug}`;
};

/** Navigate to /published/{site}/blogs from any nested published path. */
export const navigatePublishedBlogs = (): boolean => {
  if (typeof window === "undefined") return false;
  const sitePath = getPublishedSiteBasePath();
  if (!sitePath) return false;
  window.location.assign(`${sitePath}/blogs`);
  return true;
};

/**
 * Navigate to a published page from #page-{slug} or /published/{site}/{slug}.
 */
export const navigatePublishedPageHref = (href: string): boolean => {
  if (typeof window === "undefined") return false;
  if (!window.location.pathname.startsWith("/published/")) return false;

  const sitePath = getPublishedSiteBasePath();
  if (!sitePath) return false;

  const normalized = href.trim();
  if (normalized.toLowerCase().startsWith("/published/")) {
    if (!normalized.toLowerCase().startsWith(sitePath.toLowerCase())) {
      return false;
    }
    window.location.assign(normalized.split("#")[0].split("?")[0]);
    return true;
  }

  const masterDetail = normalized.match(
    /^#master-detail\/(service|event|portfolio|team|property|country)\/([^/?#]+)/i,
  );
  if (masterDetail) {
    const kind = masterDetail[1].toLowerCase();
    const slug = decodeURIComponent(masterDetail[2]);
    window.location.assign(`${sitePath}/${kind}/${encodeURIComponent(slug)}`);
    return true;
  }

  const masterGroup = normalized.match(
    /^#master-group\/(blog|service|event|portfolio|team|property)\/([^/?#]+)/i,
  );
  if (masterGroup) {
    const kind = masterGroup[1].toLowerCase();
    const slug = decodeURIComponent(masterGroup[2]);
    const segment = kind === "blog" ? "blogs" : kind;
    window.location.assign(
      `${sitePath}/${segment}/category/${encodeURIComponent(slug)}`,
    );
    return true;
  }

  const slug = getRoutedPageSlugFromHref(href);
  if (!slug) return false;

  const publicSlug =
    slug === "service" ? "services" : slug === "event" ? "events" : slug;
  window.location.assign(`${sitePath}/${publicSlug}`);
  return true;
};

/** Editor: open master item detail from submenu href. */
export const navigateEditorMasterDetailHref = (href: string): boolean => {
  if (typeof window === "undefined") return false;
  if (window.location.pathname.startsWith("/published/")) return false;
  const match = href
    .trim()
    .match(
      /^#master-detail\/(service|event|portfolio|team|property|country)\/([^/?#]+)/i,
    );
  if (!match) return false;
  window.dispatchEvent(
    new CustomEvent("ai-builder-view-master-detail", {
      detail: {
        master: match[1].toLowerCase(),
        slug: decodeURIComponent(match[2]),
      },
    }),
  );
  scrollTemplateToTop();
  return true;
};

/** Editor: category/type submenu → open master listing page (optionally filtered). */
export const navigateEditorMasterGroupHref = (href: string): boolean => {
  if (typeof window === "undefined") return false;
  if (window.location.pathname.startsWith("/published/")) return false;
  const match = href
    .trim()
    .match(
      /^#master-group\/(blog|service|event|portfolio|team|property)\/([^/?#]+)/i,
    );
  if (!match) return false;
  window.dispatchEvent(
    new CustomEvent("ai-builder-view-master-listing", {
      detail: {
        master: match[1].toLowerCase(),
        groupSlug: decodeURIComponent(match[2]),
      },
    }),
  );
  scrollTemplateToTop();
  return true;
};

export const scrollToSectionHref = (href: string): boolean => {
  const normalized = href.trim();
  if (!normalized || normalized === "#") {
    scrollTemplateToTop();
    return true;
  }
  if (!normalized.startsWith("#")) return false;

  const id = decodeURIComponent(normalized.slice(1));
  if (!id || id.startsWith("page-")) return false;

  const target =
    document.getElementById(id) ||
    document.querySelector<HTMLElement>(`[data-section-id="${id}"]`);
  if (!target) return false;

  // Offset for sticky header so the section title isn't hidden under nav.
  const header = document.querySelector<HTMLElement>("header");
  const headerHeight = header?.getBoundingClientRect().height ?? 0;
  const scrollParent = document.querySelector<HTMLElement>(
    "[data-template-scroll]",
  );
  if (scrollParent) {
    const parentRect = scrollParent.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextTop =
      scrollParent.scrollTop + (targetRect.top - parentRect.top) - headerHeight - 8;
    scrollParent.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
  } else {
    const top =
      window.scrollY + target.getBoundingClientRect().top - headerHeight - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }
  return true;
};

export const stripUrlHash = () => {
  if (!window.location.hash) return;
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
};

export const handleHashlessSectionAnchorClick = (
  event: MouseEvent,
): boolean => {
  const rawTarget = event.target;
  if (!(rawTarget instanceof Element)) return false;

  const anchor = rawTarget.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return false;

  const href = anchor.getAttribute("href")?.trim() ?? "";
  if (!href.startsWith("#")) return false;

  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }

  // Published: #page-blogs → /published/{site}/blogs
  if (href.trim().toLowerCase() === "#page-blogs") {
    if (navigatePublishedBlogs()) {
      event.preventDefault();
      return true;
    }
  }

  // Published: #page-privacy-policy → /published/{site}/privacy-policy
  if (navigatePublishedPageHref(href)) {
    event.preventDefault();
    return true;
  }

  // From a nested published page, section anchors go to the site home URL.
  const publishedBase = getPublishedSiteBasePath();
  if (
    publishedBase &&
    window.location.pathname.replace(/\/+$/, "") !== publishedBase &&
    href.startsWith("#") &&
    !href.toLowerCase().startsWith("#page-")
  ) {
    event.preventDefault();
    window.location.assign(
      `${publishedBase}${href === "#" ? "" : href}`,
    );
    return true;
  }

  if (!scrollToSectionHref(href)) return false;

  event.preventDefault();
  stripUrlHash();
  return true;
};
