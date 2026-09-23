"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  CSSProperties,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { sectionRegistry } from "@/app/editor/layout/src/lib/sectionRegistry";
import {
  getTemplateVariables,
  refreshCategoryContentFromApi,
  resolveLayoutPreview,
} from "@/app/editor/layout/src/data/templateFlow";
import {
  PreviewProvider,
  usePreview,
  type PageLink,
} from "@/app/editor/layout/src/components/context/PreviewContext";
import EditorLoadingScreen from "@/app/editor/components/EditorLoadingScreen";

/**
 * Card thumbnails: slightly shorter hero so Header + Banner + next section fit.
 * Keep real video for Banner-2 / Banner-4; other banners stay on stills.
 */
function adaptSectionDataForCardPreview(
  variantKey: string,
  sectionType: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  if (sectionType !== "Banner") return data;

  const isVideoBanner = variantKey === "Banner-2" || variantKey === "Banner-4";

  if (isVideoBanner) {
    const next: Record<string, unknown> = {
      ...data,
      bannerHeight: 52,
    };
    if (variantKey === "Banner-2") {
      next.bannerBackgroundMode = "video";
    }
    return next;
  }

  const next: Record<string, unknown> = {
    ...data,
    bannerBackgroundMode: "image",
    bannerHeight: 48,
  };

  if (Array.isArray(next.bannerSlides)) {
    next.bannerSlides = next.bannerSlides.map((slide) => {
      if (!slide || typeof slide !== "object" || Array.isArray(slide)) {
        return slide;
      }
      const item = slide as Record<string, unknown>;
      const image =
        typeof item.image === "string" && item.image.trim()
          ? item.image
          : typeof item.poster === "string" && item.poster.trim()
            ? item.poster
            : "";
      if (image) {
        return { ...item, image, video: undefined };
      }
      return item;
    });
  }

  return next;
}

const SECTION_ORDER = [
  "Topbar",
  "Header",
  "Breadcrumb",
  "Banner",
  "Features",
  "Highlight",
  "Featured",
  "LatestProject",
  "Cities",
  "About",
  "Product",
  "WhyChooseUs",
  "FeaturedDev",
  "Process",
  "Gallery",
  "FormDetail",
  "Awards",
  "Stats",
  "Blog",
  "FAQ",
  "Testimonial",
  "Contact",
  "InvestmentOpportunities",
  "CountriesServe",
  "AboutPage",
  "ServicePage",
  "EventPage",
  "PropertyPage",
  "PropertyDetail",
  "PortfolioPage",
  "ProjectDetail",
  "TeamPage",
  "GalleryPage",
  "ContactPage",
  "AwardsPage",
  "MissionPage",
  "MissionValues",
  "CsrPage",
  "CsrPrograms",
  "CareerPage",
  "CareerJobs",
  "CTA",
  "RentPage",
  "BuyPropertyPage",
  "BlogPage",
  "BlogDetail",
  "SitemapPage",
  "PrivacyPage",
  "TermsPage",
  "DisclaimerPage",
  "CookiePolicyPage",
  "RefundPolicyPage",
  "CustomPage",
  "Footer",
];

type SitePage = {
  id: string;
  label: string;
  variants: string[];
};

/** Home sections that become scroll menu items on Single Page sites */
const SECTION_SCROLL_MENU: Record<string, { id: string; label: string }> = {
  Banner: { id: "home", label: "Home" },
  About: { id: "about", label: "About" },
  Product: { id: "services", label: "Services" },
  WhyChooseUs: { id: "why-choose-us", label: "Why Choose Us" },
  Gallery: { id: "gallery", label: "Gallery" },
  FormDetail: { id: "contact", label: "Contact" },
  FAQ: { id: "faq", label: "FAQ" },
  Testimonial: { id: "testimonials", label: "Testimonials" },
};

function buildSectionScrollMenu(variantKeys: string[]): PageLink[] {
  const items: PageLink[] = [];
  const seen = new Set<string>();
  for (const key of variantKeys) {
    const type = key.replace(/-\d+$/, "");
    const entry = SECTION_SCROLL_MENU[type];
    if (!entry || seen.has(entry.id)) continue;
    seen.add(entry.id);
    items.push({
      label: entry.label,
      href: entry.id === "home" ? "#" : `#${entry.id}`,
    });
  }
  return items;
}

function sectionAnchorId(variantKey: string): string | undefined {
  const type = variantKey.replace(/-\d+$/, "");
  return SECTION_SCROLL_MENU[type]?.id;
}

function parseVariants(searchParams: URLSearchParams): string[] {
  const multi = searchParams.getAll("v").filter(Boolean);
  if (multi.length) return multi;

  const csv = searchParams.get("variants") || "";
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseSitePages(searchParams: URLSearchParams): SitePage[] {
  const rows = searchParams.getAll("p");
  return rows
    .map((row) => {
      const [id, label, csv] = row.split("~");
      if (!id || !csv) return null;
      return {
        id: id.trim(),
        label: (label || id).trim(),
        variants: csv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
    })
    .filter((p): p is SitePage => Boolean(p));
}

function slugifyPreview(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function listingSlug(item: Record<string, unknown>) {
  const slug = typeof item.slug === "string" ? item.slug.trim() : "";
  if (slug) return slugifyPreview(slug);
  const href = typeof item.href === "string" ? item.href.trim() : "";
  const fromHref = href.match(/\/([^/?#]+)\/?$/)?.[1];
  if (
    fromHref &&
    !["blog", "blogs", "properties", "property", "projects"].includes(
      fromHref.toLowerCase(),
    )
  ) {
    return slugifyPreview(decodeURIComponent(fromHref));
  }
  const title = typeof item.title === "string" ? item.title : "";
  return slugifyPreview(title);
}

function collectPropertyListings(category: string) {
  const keys = [
    "BuyPropertyPage-5",
    "PropertyPage-5",
    "RentPage-5",
    "Featured-5",
  ];
  const items: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (const key of keys) {
    const listings = resolveLayoutPreview(key, category)?.data?.listings;
    if (!Array.isArray(listings)) continue;
    for (const row of listings) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue;
      const item = row as Record<string, unknown>;
      const slug = listingSlug(item);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      items.push(item);
    }
  }
  return items;
}

function collectBlogPosts(category: string) {
  const keys = ["Blog-5", "BlogPage-6", "BlogPage-5"];
  const items: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (const key of keys) {
    const data = resolveLayoutPreview(key, category)?.data as
      | Record<string, unknown>
      | undefined;
    const posts = data?.blogItems ?? data?.galleryItems;
    if (!Array.isArray(posts)) continue;
    for (const row of posts) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue;
      const item = row as Record<string, unknown>;
      const slug = listingSlug(item);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      items.push(item);
    }
  }
  return items;
}

function collectProjectItems(category: string) {
  const keys = ["PortfolioPage-5", "PortfolioPage-6", "LatestProject-5"];
  const items: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (const key of keys) {
    const data = resolveLayoutPreview(key, category)?.data as
      | Record<string, unknown>
      | undefined;
    const rows = data?.projectItems;
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue;
      const item = row as Record<string, unknown>;
      const slug = listingSlug(item);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      items.push(item);
    }
  }
  return items;
}

function scrollComposeToTop() {
  const nodes = document.querySelectorAll<HTMLElement>("[data-template-scroll]");
  nodes.forEach((node) => {
    node.scrollTo({ top: 0, left: 0, behavior: "auto" });
    node.scrollTop = 0;
  });
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function sortVariants(keys: string[]) {
  return [...keys];
}

function sitePagesToMenu(pages: SitePage[]): PageLink[] {
  return pages.map((page) => ({
    label: page.label,
    // prefix so section anchors (#about) don't steal multipage clicks
    href: page.id === "home" ? "#" : `#page-${page.id}`,
  }));
}

function matchPageId(pages: SitePage[], currentPage: string): string | null {
  const raw = currentPage.trim().toLowerCase();
  if (!raw) return null;

  const stripped = raw.replace(/^page[\s-]+/, "");
  const byId = pages.find(
    (p) =>
      p.id.toLowerCase() === raw ||
      p.id.toLowerCase() === stripped,
  );
  if (byId) return byId.id;

  const byLabel = pages.find((p) => p.label.toLowerCase() === raw);
  if (byLabel) return byLabel.id;

  const slug = raw.replace(/\s+/g, "-");
  const bySlug = pages.find((p) => p.id.toLowerCase() === slug);
  if (bySlug) return bySlug.id;

  const strippedSlug = stripped.replace(/\s+/g, "-");
  const byStrippedSlug = pages.find(
    (p) => p.id.toLowerCase() === strippedSlug,
  );
  if (byStrippedSlug) return byStrippedSlug.id;

  return null;
}

const PAGE_PATH_ALIASES: Record<string, string> = {
  "": "home",
  home: "home",
  about: "about",
  "about-us": "about",
  properties: "properties",
  property: "properties",
  sale: "properties",
  "sale-a-property": "properties",
  buy: "buy-a-property",
  "buy-a-property": "buy-a-property",
  rent: "rent",
  "rent-a-property": "rent",
  projects: "projects",
  project: "projects",
  blog: "blog",
  blogs: "blog",
  contact: "contact",
  "contact-us": "contact",
  services: "services",
  service: "services",
  awards: "awards",
  mission: "mission",
  "mission-vision": "mission",
  community: "community",
  csr: "community",
  careers: "careers",
  career: "careers",
  sitemap: "sitemap",
  privacy: "privacy",
  "privacy-policy": "privacy",
  terms: "terms",
  "terms-and-conditions": "terms",
  disclaimer: "disclaimer",
  "cookie-policy": "cookie-policy",
  cookies: "cookie-policy",
  "refund-policy": "refund-policy",
  refund: "refund-policy",
  gallery: "gallery",
};

function homePageId(pages: SitePage[]) {
  return (
    pages.find((page) => page.id.toLowerCase() === "home")?.id ||
    pages.find((page) => page.label.toLowerCase() === "home")?.id ||
    pages[0]?.id ||
    null
  );
}

function resolvePageFromPath(pages: SitePage[], value: string) {
  const raw = value
    .trim()
    .replace(/^#/, "")
    .replace(/^\/+/, "")
    .replace(/^page[\s/_-]+/i, "")
    .split(/[?#]/, 1)[0]
    .replace(/\/+$/, "")
    .toLowerCase();
  const alias = PAGE_PATH_ALIASES[raw] || raw;
  if (alias === "home") return homePageId(pages);
  return matchPageId(pages, alias) || matchPageId(pages, raw);
}

function isExternalHref(href: string) {
  const value = href.trim();
  if (/^(mailto:|tel:|javascript:|sms:)/i.test(value)) return true;
  if (/^https?:\/\//i.test(value)) {
    try {
      return new URL(value).origin !== window.location.origin;
    } catch {
      return true;
    }
  }
  return value.startsWith("//");
}

function ComposeNavSync({
  sitePages,
  activePageId,
  onPageChange,
  children,
}: {
  sitePages: SitePage[];
  activePageId: string;
  onPageChange: (pageId: string) => void;
  children: ReactNode;
}) {
  const { currentPage, setCurrentPage, setPageLinks } = usePreview();
  const skipPageMatchRef = useRef(false);

  useEffect(() => {
    if (!sitePages.length) return;
    setPageLinks(sitePagesToMenu(sitePages));
  }, [sitePages, setPageLinks]);

  useEffect(() => {
    const active = sitePages.find((p) => p.id === activePageId);
    if (!active) return;
    if (currentPage.toLowerCase() === active.label.toLowerCase()) return;
    skipPageMatchRef.current = true;
    setCurrentPage(active.label);
    // Sync label from the active tab only — do not ping-pong with currentPage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageId, sitePages, setCurrentPage]);

  useEffect(() => {
    if (skipPageMatchRef.current) {
      skipPageMatchRef.current = false;
      return;
    }
    const matched = matchPageId(sitePages, currentPage);
    if (matched && matched !== activePageId) {
      onPageChange(matched);
    }
  }, [currentPage, sitePages, activePageId, onPageChange]);

  return <>{children}</>;
}

function ComposeInner() {
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const [loadedContentKey, setLoadedContentKey] = useState<string | null>(null);
  const contentReady = loadedContentKey === paramsKey;

  const sitePages = useMemo(
    () => parseSitePages(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paramsKey],
  );
  const showNav = searchParams.get("nav") === "1" && sitePages.length > 0;
  const isEmbedded = searchParams.get("chrome") === "0";
  const isCardPreview = searchParams.get("card") === "1";
  const initialPage =
    searchParams.get("page") || sitePages[0]?.id || "home";
  const [activePageState, setActivePageState] = useState(() => ({
    paramsKey,
    pageId: initialPage,
  }));
  const activePageId =
    activePageState.paramsKey === paramsKey
      ? activePageState.pageId
      : initialPage;
  const setActivePageId = useCallback(
    (pageId: string) => setActivePageState({ paramsKey, pageId }),
    [paramsKey],
  );
  const [previewDetail, setPreviewDetail] = useState<{
    kind: "property" | "blog" | "project";
    slug: string;
  } | null>(null);

  useEffect(() => {
    setPreviewDetail(null);
  }, [activePageId, paramsKey]);

  useEffect(() => {
    scrollComposeToTop();
    const frame = window.requestAnimationFrame(() => {
      scrollComposeToTop();
    });
    const timer = window.setTimeout(scrollComposeToTop, 50);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [previewDetail, activePageId]);

  useEffect(() => {
    let cancelled = false;

    if (isEmbedded) {
      void refreshCategoryContentFromApi().then(() => {
        if (!cancelled) setLoadedContentKey(paramsKey);
      });
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      await refreshCategoryContentFromApi();
      if (!cancelled) setLoadedContentKey(paramsKey);
    })();
    return () => {
      cancelled = true;
    };
  }, [paramsKey, isEmbedded]);

  const variantKeys = useMemo(() => {
    const pageKeys = showNav
      ? sortVariants(
          (sitePages.find((p) => p.id === activePageId) || sitePages[0])
            ?.variants || [],
        )
      : sortVariants(parseVariants(searchParams));
    if (!previewDetail) return pageKeys;
    const chrome = pageKeys.filter((key) =>
      /^(Topbar|Header|Footer)-\d+$/.test(key),
    );
    const detailKey =
      previewDetail.kind === "blog"
        ? "BlogDetail-5"
        : previewDetail.kind === "project"
          ? "ProjectDetail-5"
          : "PropertyDetail-5";
    return sortVariants([...chrome, detailKey]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, showNav, sitePages, activePageId, previewDetail]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = (anchor.getAttribute("href") || "").trim();
      if (!href || isExternalHref(href) || anchor.getAttribute("target") === "_blank") {
        return;
      }

      let path = href;
      let hash = "";
      if (href.startsWith("#")) {
        path = "";
        hash = href.slice(1);
      } else {
        try {
          const url = new URL(href, window.location.origin);
          path = url.pathname;
          hash = url.hash.replace(/^#/, "");
        } catch {
          path = href.split(/[?#]/, 1)[0];
        }
      }

      const propertyMatch =
        path.match(/^\/properties\/([^/]+)\/?$/i) ||
        path.match(/^\/property\/([^/]+)\/?$/i);
      if (propertyMatch?.[1]) {
        event.preventDefault();
        event.stopPropagation();
        setPreviewDetail({
          kind: "property",
          slug: decodeURIComponent(propertyMatch[1]),
        });
        scrollComposeToTop();
        return;
      }
      const blogMatch = path.match(/^\/blogs?\/([^/]+)\/?$/i);
      if (blogMatch?.[1]) {
        event.preventDefault();
        event.stopPropagation();
        setPreviewDetail({
          kind: "blog",
          slug: decodeURIComponent(blogMatch[1]),
        });
        scrollComposeToTop();
        return;
      }
      const projectMatch = path.match(/^\/projects\/([^/]+)\/?$/i);
      if (projectMatch?.[1]) {
        event.preventDefault();
        event.stopPropagation();
        setPreviewDetail({
          kind: "project",
          slug: decodeURIComponent(projectMatch[1]),
        });
        scrollComposeToTop();
        return;
      }

      const pageId =
        resolvePageFromPath(sitePages, hash || path || href) ||
        (href === "#" || path === "/" ? homePageId(sitePages) : null);
      if (!pageId) return;

      event.preventDefault();
      event.stopPropagation();
      setPreviewDetail(null);
      if (pageId !== activePageId) setActivePageId(pageId);
      scrollComposeToTop();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [activePageId, setActivePageId, sitePages]);

  const isMultiPageSite = showNav && sitePages.length > 1;
  const categoryParam = searchParams.get("category") || "Business";
  const templateIdParam = searchParams.get("templateId") || "template-1";
  const hideChrome = searchParams.get("chrome") === "0" && !showNav;
  const sectionScrollMenu = useMemo(
    () => (!isMultiPageSite ? buildSectionScrollMenu(variantKeys) : []),
    [isMultiPageSite, variantKeys],
  );
  const navMenu = useMemo(() => {
    // Card thumbnails: never replace header menu with a truncated scroll menu
    // (e.g. only Home + About from the 3 visible sections).
    if (isCardPreview && !isMultiPageSite) return null;
    if (isMultiPageSite) return sitePagesToMenu(sitePages);
    if (sectionScrollMenu.length) return sectionScrollMenu;
    return null;
  }, [isCardPreview, isMultiPageSite, sitePages, sectionScrollMenu]);

  const cssVars = useMemo(
    () =>
      contentReady
        ? (getTemplateVariables(templateIdParam, categoryParam) as CSSProperties)
        : ({} as CSSProperties),
    [contentReady, templateIdParam, categoryParam],
  );

  useEffect(() => {
    if (!isEmbedded || !contentReady) return;
    window.parent.postMessage(
      {
        type: "ai-builder-compose-preview-ready",
        src: `${window.location.pathname}${window.location.search}`,
      },
      window.location.origin,
    );
  }, [contentReady, isEmbedded, paramsKey]);

  const sections = useMemo(() => {
    if (!contentReady) return [];
    return variantKeys.map((key) => {
      const Component = sectionRegistry[key];
      const preview = resolveLayoutPreview(key, categoryParam);
      const sectionType = key.replace(/-\d+$/, "");
      let data: Record<string, unknown> = preview?.data
        ? { ...(preview.data as Record<string, unknown>) }
        : {};

      if (isCardPreview) {
        data = adaptSectionDataForCardPreview(key, sectionType, data);
      }

      if (sectionType === "Header" && navMenu?.length) {
        const existingMenu = Array.isArray(data.menu) ? data.menu : [];
        const hasDropdowns = existingMenu.some(
          (item) =>
            item &&
            typeof item === "object" &&
            Array.isArray((item as { children?: unknown }).children) &&
            ((item as { children: unknown[] }).children?.length ?? 0) > 0,
        );
        data = {
          ...data,
          menu: hasDropdowns ? existingMenu : navMenu,
        };
      }

      const pageTitle =
        (showNav
          ? (sitePages.find((p) => p.id === activePageId) || sitePages[0])
              ?.label
          : "") ||
        searchParams.get("title") ||
        "";

      if (sectionType === "Breadcrumb" && pageTitle) {
        data = { ...data, title: pageTitle };
      }

      if (sectionType === "CustomPage" && pageTitle) {
        data = {
          ...data,
          title: pageTitle,
          pretitle:
            typeof data.pretitle === "string" && data.pretitle.trim()
              ? data.pretitle
              : "Page",
          desc:
            typeof data.desc === "string" && data.desc.trim()
              ? data.desc
              : `Welcome to our ${pageTitle} page. Here you will find clear information about ${pageTitle}, what we offer, and how it can help you take the next step.`,
        };
      }

      if (
        sectionType === "PropertyDetail" &&
        previewDetail?.kind === "property"
      ) {
        const listings = collectPropertyListings(categoryParam);
        const listing = listings.find(
          (item) => listingSlug(item) === previewDetail.slug,
        );
        if (listing) {
          const listingImages = [
            listing.image,
            ...(Array.isArray(listing.images) ? listing.images : []),
            ...(Array.isArray(listing.gallery) ? listing.gallery : []),
            ...listings.map((item) => item.image),
          ].filter((src): src is string => typeof src === "string" && Boolean(src.trim()));
          data = {
            ...data,
            ...listing,
            title: listing.title,
            image: listing.image,
            images: Array.from(new Set(listingImages)).slice(0, 6),
            alt: listing.alt,
            subtitle: listing.subtitle,
            infoTitle: listing.infoTitle,
            description: listing.description || listing.desc,
            body: listing.body || listing.description || listing.desc,
            statusText: listing.statusText,
            price: listing.price,
            category: listing.category,
            features: listing.features,
            button: listing.button,
          };
        }
      }

      if (sectionType === "BlogDetail" && previewDetail?.kind === "blog") {
        const post = collectBlogPosts(categoryParam).find(
          (item) => listingSlug(item) === previewDetail.slug,
        );
        if (post) {
          data = {
            ...data,
            ...post,
            title: post.title,
            image: post.image,
            alt: post.alt,
            date: post.date,
            excerpt: post.excerpt || post.desc || post.body,
            body: post.body || post.excerpt || post.desc,
          };
        }
      }

      if (
        sectionType === "ProjectDetail" &&
        previewDetail?.kind === "project"
      ) {
        const project = collectProjectItems(categoryParam).find(
          (item) => listingSlug(item) === previewDetail.slug,
        );
        if (project) {
          data = {
            ...data,
            ...project,
            title: project.title,
            image: project.image,
            alt: project.alt,
            category: project.category,
            status: project.status || project.statusText,
            location: project.location,
            desc: project.desc || project.description,
            body: project.body || project.desc || project.description,
          };
        }
      }

      return {
        key,
        Component,
        data,
        anchorId: !isMultiPageSite ? sectionAnchorId(key) : undefined,
      };
    });
  }, [
    variantKeys,
    categoryParam,
    contentReady,
    navMenu,
    isMultiPageSite,
    showNav,
    sitePages,
    activePageId,
    isCardPreview,
    previewDetail,
    paramsKey,
  ]);

  if (!contentReady) {
    return isEmbedded ? (
      <EditorLoadingScreen variant="embed" />
    ) : (
      <EditorLoadingScreen message="Loading content…" />
    );
  }

  if (variantKeys.length === 0) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-500">
          Pass variants via ?variants=Header-1,Banner-1
        </p>
      </main>
    );
  }

  const body = (
    <main className="min-h-dvh bg-white" style={cssVars} data-template-scroll>
      {!showNav && !hideChrome ? (
        <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Template compose preview
              </p>
              <p className="text-sm font-bold text-slate-900">
                {categoryParam} · {variantKeys.join(" · ")}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="w-full overflow-x-hidden bg-white"
        {...(variantKeys.some((key) => /^Breadcrumb-\d+$/.test(key))
          ? { "data-compose-has-breadcrumb": "true" }
          : {})}
      >
        {variantKeys.some((key) => /^Breadcrumb-\d+$/.test(key)) ? (
          <style>{`[data-compose-has-breadcrumb] [data-variant]:not([data-variant^="Breadcrumb-"]) [data-editor-section-label="Page Banner"]{display:none!important}`}</style>
        ) : null}
        {sections.map(({ key, Component, data, anchorId }) =>
          Component ? (
            <div
              key={`${activePageId}-${key}`}
              id={anchorId}
              data-section-id={anchorId}
              data-variant={key}
            >
              <Component data={data} />
            </div>
          ) : (
            <div
              key={`${activePageId}-${key}`}
              className="flex h-24 items-center justify-center bg-slate-100 text-sm text-slate-500"
            >
              Missing: {key}
            </div>
          ),
        )}
      </div>
    </main>
  );

  if (!showNav) return body;

  return (
    <PreviewProvider>
      <ComposeNavSync
        sitePages={sitePages}
        activePageId={activePageId}
        onPageChange={setActivePageId}
      >
        {body}
      </ComposeNavSync>
    </PreviewProvider>
  );
}

function ComposePreviewSuspenseFallback() {
  const isEmbedded = false;
  return isEmbedded ? (
    <EditorLoadingScreen variant="embed" />
  ) : (
    <EditorLoadingScreen message="Loading preview…" />
  );
}

export default function TemplateComposePreviewPage() {
  return (
    <Suspense fallback={<ComposePreviewSuspenseFallback />}>
      <ComposeInner />
    </Suspense>
  );
}
