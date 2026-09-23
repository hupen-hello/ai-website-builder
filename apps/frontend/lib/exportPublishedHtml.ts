import { createHash } from "crypto";
import path from "path";
import {
  hasPublishedBlogIndexPage,
  hasPublishedGalleryPage,
  type PublishedSitePayload,
} from "@/lib/publishedSeo";
import { normalizePageSeoKey } from "@/lib/siteSeo";
import { SITE_THEME_GLOBAL_CSS, GOOGLE_FONTS_HREF } from "@/app/editor/layout/src/lib/themeTokens";
import type { ZipFileEntry } from "@/lib/zipStore";
import type { CollectedExportAsset } from "@/lib/exportPublishedAssets";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeFolderName(slug: string) {
  return `${slugify(slug) || "website"}-html`;
}

export function getPublishedHtmlExportFolderName(slug: string) {
  return safeFolderName(slug);
}

type HtmlPage = {
  key: string;
  fileName: string;
  fetchPath: string;
};

const DETAIL_PREFIX =
  /^(blog|blogs|service|event|property|properties|portfolio|projects|team|country|countries)\/[a-z0-9][a-z0-9\-_/]*$/i;

const DETAIL_KIND_GROUP =
  "blog|blogs|service|event|property|properties|portfolio|projects|team|country|countries";

function pageKeyFromHref(href: string, label: string) {
  const raw = href.trim();
  const lower = raw.toLowerCase();
  if (!raw || raw === "#" || lower === "#home") return "home";
  // Placeholders / in-page anchors are not separate HTML files.
  if (
    lower.startsWith("javascript:") ||
    lower === "void(0)" ||
    lower === "#void"
  ) {
    return "";
  }
  if (lower.startsWith("#page-")) {
    return normalizePageSeoKey(raw.slice("#page-".length));
  }
  // Pure section hashes (#about) stay on index.html — do not spawn pages.
  if (lower.startsWith("#")) return "";
  return normalizePageSeoKey(label || raw);
}

function listNavHtmlPages(payload: PublishedSitePayload, slug: string): HtmlPage[] {
  const pages: HtmlPage[] = [
    {
      key: "home",
      fileName: "index.html",
      fetchPath: `/published/${encodeURIComponent(slug)}`,
    },
  ];
  const seen = new Set(["home"]);

  // Single-page sites: one HTML file only (section hashes live on index).
  if (isPublishedSinglePageSite(payload)) {
    return pages;
  }

  const add = (key: string) => {
    const normalized = normalizePageSeoKey(key);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    pages.push({
      key: normalized,
      fileName: `${normalized}.html`,
      fetchPath: `/published/${encodeURIComponent(slug)}/${encodeURIComponent(normalized)}`,
    });
  };

  const walk = (links: PublishedSitePayload["pageLinks"] | undefined) => {
    for (const link of links || []) {
      if (link.hidden) continue;
      const key = pageKeyFromHref(link.href || "", link.label || "");
      if (key === "gallery" && !hasPublishedGalleryPage(payload)) {
        if (link.children?.length) walk(link.children);
        continue;
      }
      if (key === "blogs" || key === "blog" || link.kind === "blogIndex") {
        if (hasPublishedBlogIndexPage(payload)) add("blogs");
        if (link.children?.length) walk(link.children);
        continue;
      }
      if (key && key !== "home") add(key);
      if (link.children?.length) walk(link.children);
    }
  };
  walk(payload.pageLinks);

  return pages;
}

/** Detect single-page published sites (home body sections; blogs don't count as multi). */
function isPublishedSinglePageSite(payload: PublishedSitePayload): boolean {
  const sections = payload.sections || [];
  const body = sections.filter((s) => {
    const type = String(s.type || "");
    const page = String(s.page || "").trim();
    if (!type) return false;
    if (/^(Header|Footer|TopBar|Breadcrumb|BlogPage)$/i.test(type)) return false;
    if (/^blog-/i.test(page)) return false;
    return true;
  });
  if (!body.length) return false;
  // All main content on home → single-page (ignore stale multi-page nav leftovers).
  return body.every((s) => !String(s.page || "").trim());
}

function detailPageFromPath(siteSlug: string, detailPath: string): HtmlPage | null {
  const cleaned = detailPath
    .replace(/^\/+/, "")
    .replace(/\.html$/i, "")
    .split(/[?#]/)[0]
    .trim();
  if (!DETAIL_PREFIX.test(cleaned)) return null;
  const key = cleaned
    .split("/")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .join("/");
  return {
    key,
    fileName: `${key}.html`,
    fetchPath: `/published/${encodeURIComponent(siteSlug)}/${key
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/")}`,
  };
}

function collectDetailPathsFromHtml(html: string, siteSlug: string) {
  const found = new Set<string>();
  const patterns = [
    new RegExp(
      `/published/${escapeRegExp(siteSlug)}/((?:${DETAIL_KIND_GROUP})/[^"'\\s?#]+)`,
      "gi",
    ),
    new RegExp(
      `/published/${escapeRegExp(encodeURIComponent(siteSlug))}/((?:${DETAIL_KIND_GROUP})/[^"'\\s?#]+)`,
      "gi",
    ),
    new RegExp(
      `((?:${DETAIL_KIND_GROUP})\\/[a-z0-9][a-z0-9\\-_/]*)\\.html`,
      "gi",
    ),
  ];

  for (const re of patterns) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(html))) {
      const raw = decodeURIComponent(match[1] || "").replace(/\/+$/, "");
      if (DETAIL_PREFIX.test(raw)) found.add(raw.toLowerCase());
    }
  }

  return Array.from(found);
}

function createCountryListingSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Seed country detail pages from payload so export does not rely only on HTML link scraping. */
function collectCountryDetailPagesFromPayload(
  payload: PublishedSitePayload,
  siteSlug: string,
): HtmlPage[] {
  const pages: HtmlPage[] = [];
  const seen = new Set<string>();

  for (const section of payload.sections || []) {
    if ((section.type || "").trim() !== "CountriesServe") continue;
    const variant = section.variant?.trim() || "CountriesServe-1";
    const variantData =
      section.data && typeof section.data === "object"
        ? ((section.data as Record<string, unknown>)[variant] ??
          (section.data as Record<string, unknown>)["CountriesServe-1"] ??
          section.data)
        : null;
    if (!variantData || typeof variantData !== "object") continue;
    const rows = Array.isArray(
      (variantData as Record<string, unknown>).countriesServeListings,
    )
      ? ((variantData as Record<string, unknown>).countriesServeListings as unknown[])
      : [];

    rows.forEach((row, index) => {
      if (!row || typeof row !== "object") return;
      const item = row as Record<string, unknown>;
      if (item.active === false) return;
      const title =
        typeof item.title === "string" ? item.title.trim() : "";
      const slugRaw =
        typeof item.slug === "string" ? item.slug.trim() : "";
      const slug =
        createCountryListingSlug(slugRaw) ||
        createCountryListingSlug(title) ||
        `country-${index + 1}`;
      if (!slug || seen.has(slug)) return;
      seen.add(slug);
      const detail = detailPageFromPath(siteSlug, `country/${slug}`);
      if (detail) pages.push(detail);
    });
  }

  return pages;
}

function readExportSectionData(
  section: PublishedSitePayload["sections"][number],
): Record<string, unknown> | null {
  if (!section.data || typeof section.data !== "object") return null;
  const variant = section.variant || `${section.type || "Section"}-1`;
  const data = section.data as Record<string, unknown>;
  const variantData = data[variant] || data[`${section.type}-1`] || data;
  if (!variantData || typeof variantData !== "object" || Array.isArray(variantData)) {
    return null;
  }
  return variantData as Record<string, unknown>;
}

function listingSlugFromRecord(record: Record<string, unknown>, index: number) {
  const slug =
    (typeof record.slug === "string" && record.slug.trim()) ||
    slugify(typeof record.title === "string" ? record.title : "");
  return slug || `item-${index + 1}`;
}

function collectRowsFromKeys(
  data: Record<string, unknown>,
  keys: string[],
): unknown[] {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value) && value.length) return value;
  }
  return [];
}

/** Seed project detail pages from payload so export is not limited to the first listing page. */
function collectProjectDetailPagesFromPayload(
  payload: PublishedSitePayload,
  siteSlug: string,
): HtmlPage[] {
  const pages: HtmlPage[] = [];
  const seen = new Set<string>();

  for (const section of payload.sections || []) {
    const type = (section.type || "").trim();
    if (type !== "PortfolioPage" && type !== "LatestProject" && type !== "Portfolio") {
      continue;
    }
    const data = readExportSectionData(section);
    if (!data) continue;
    const rows = collectRowsFromKeys(data, [
      "projectItems",
      "productItems",
      "portfolioItems",
      "items",
    ]);
    rows.forEach((row, index) => {
      if (!row || typeof row !== "object") return;
      const item = row as Record<string, unknown>;
      if (item.active === false) return;
      const slug = listingSlugFromRecord(item, index);
      if (!slug || seen.has(slug)) return;
      seen.add(slug);
      const detail = detailPageFromPath(siteSlug, `projects/${slug}`);
      if (detail) pages.push(detail);
    });
  }

  return pages;
}

/** Seed property detail pages from Buy / Rent / Sale listings. */
function collectPropertyDetailPagesFromPayload(
  payload: PublishedSitePayload,
  siteSlug: string,
): HtmlPage[] {
  const pages: HtmlPage[] = [];
  const seen = new Set<string>();

  for (const section of payload.sections || []) {
    const type = (section.type || "").trim();
    if (
      type !== "BuyPropertyPage" &&
      type !== "RentPage" &&
      type !== "PropertyPage" &&
      type !== "Property"
    ) {
      continue;
    }
    const data = readExportSectionData(section);
    if (!data) continue;
    const rows = collectRowsFromKeys(data, [
      "listings",
      "productItems",
      "propertyItems",
      "properties",
    ]);
    rows.forEach((row, index) => {
      if (!row || typeof row !== "object") return;
      const item = row as Record<string, unknown>;
      if (item.active === false) return;
      const slug = listingSlugFromRecord(item, index);
      if (!slug || seen.has(slug)) return;
      seen.add(slug);
      const detail = detailPageFromPath(siteSlug, `property/${slug}`);
      if (detail) pages.push(detail);
    });
  }

  return pages;
}

function isExportedNotFoundPage(html: string) {
  return (
    /<title>\s*Page not found\s*<\/title>/i.test(html) ||
    /Sorry, website not found/i.test(html)
  );
}

function hrefBetween(fromFile: string, toFile: string) {
  const fromDir = path.posix.dirname(fromFile);
  const base = fromDir === "." ? "" : fromDir;
  const rel = path.posix.relative(base, toFile).replace(/\\/g, "/");
  return rel || path.posix.basename(toFile);
}

function depthPrefix(fileName: string) {
  const depth = fileName.split("/").length - 1;
  return "../".repeat(Math.max(0, depth));
}

async function fetchText(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractStylesheetHrefs(html: string) {
  const hrefs: string[] = [];
  const re = /<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const tag = match[0];
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (href) hrefs.push(href);
  }
  return hrefs;
}

function absolutize(origin: string, url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `http:${url}`;
  if (url.startsWith("/")) return `${origin.replace(/\/$/, "")}${url}`;
  return `${origin.replace(/\/$/, "")}/${url}`;
}

function stripScripts(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<link\b[^>]*rel=["']preload["'][^>]*>/gi, "")
    .replace(/<link\b[^>]*rel=["'](?:modulepreload|prefetch)["'][^>]*>/gi, "");
}

function rewritePublishedLinks(
  html: string,
  slug: string,
  pages: HtmlPage[],
  fromFile: string,
) {
  const fileByKey = new Map(pages.map((page) => [page.key, page.fileName]));
  let next = html;
  const patterns = [
    `/published/${slug}`,
    `/published/${encodeURIComponent(slug)}`,
  ];

  for (const base of patterns) {
    next = next.replace(
      new RegExp(
        `(?:https?:\\/\\/[^"'\\s]+?)?${escapeRegExp(base)}(?:/([^"'\\s?#]+))?`,
        "g",
      ),
      (_full, pageSlug?: string) => {
        if (!pageSlug) return hrefBetween(fromFile, "index.html");
        const decoded = decodeURIComponent(pageSlug);
        const key = DETAIL_PREFIX.test(decoded)
          ? decoded
              .split("/")
              .map((part) => part.trim().toLowerCase())
              .filter(Boolean)
              .join("/")
          : normalizePageSeoKey(decoded);
        const target = fileByKey.get(key) || `${key}.html`;
        return hrefBetween(fromFile, target);
      },
    );
  }

  return next;
}

/**
 * On secondary pages (e.g. properties.html), single-page hash menus like #about
 * must point back to index.html#about or navigation gets stuck.
 */
function rewriteHashMenuLinksToHome(html: string, fromFile: string) {
  if (fromFile === "index.html") return html;
  const home = hrefBetween(fromFile, "index.html");

  return html.replace(/href=(["'])#(.*?)(["'])/gi, (_full, q1, hash, q2) => {
    const clean = String(hash || "").trim();
    if (!clean) return `href=${q1}${home}${q2}`;
    return `href=${q1}${home}#${clean}${q2}`;
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyUrlMap(content: string, urlMap: Map<string, string>) {
  let next = content;
  const entries = Array.from(urlMap.entries()).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [from, to] of entries) {
    if (!from) continue;
    next = next.split(from).join(to);
  }
  return next;
}

/** Map Next.js `/_next/image?url=...` optimizer URLs to local media files. */
function rewriteNextImageUrls(html: string, urlMap: Map<string, string>) {
  const resolveOptimizer = (optimizerUrl: string) => {
    const cleaned = optimizerUrl.replace(/&amp;/g, "&");
    const query = cleaned.includes("?")
      ? cleaned.slice(cleaned.indexOf("?") + 1)
      : "";
    try {
      const original = decodeURIComponent(
        new URLSearchParams(query).get("url") || "",
      );
      if (!original) return null;
      const candidates = [
        original,
        original.split("?")[0],
        original.startsWith("/") ? original : `/${original}`,
      ];
      for (const candidate of candidates) {
        const mapped = urlMap.get(candidate);
        if (mapped) return mapped.replace(/^\//, "");
      }
    } catch {
      return null;
    }
    return null;
  };

  return html.replace(/\/_next\/image\?[^"'\\\s>]*/gi, (match) => {
    return resolveOptimizer(match) || match;
  });
}

function relativeMediaPaths(html: string, prefix = "") {
  let next = html.replace(/(["'(,]\s*)\/media\//g, `$1${prefix}media/`);
  // srcSet lists multiple URLs: "media/a 1x, media/a 2x" — prefix every entry
  next = next.replace(/(["'(,]\s*)(?!\.\.\/)media\//g, `$1${prefix}media/`);
  return next;
}

/** Prefer a single local src for Next/Image tags so srcSet can't pick a bad path. */
function normalizeLocalImageSources(html: string, prefix = "") {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (!/data-nimg=/i.test(tag) && !/srcset=/i.test(tag)) return tag;

    const mediaSrc =
      tag.match(/data-editor-media-src=["']([^"']+)["']/i)?.[1] ||
      tag.match(/src=["']([^"']*media\/[^"']+)["']/i)?.[1] ||
      tag.match(/(?:\.\.\/)*media\/[a-z0-9._-]+/i)?.[0] ||
      "";

    if (!mediaSrc) return tag;

    let local = mediaSrc.replace(/^\/+/, "");
    if (prefix && local.startsWith("media/")) {
      local = `${prefix}${local}`;
    }

    let next = tag.replace(/\s+srcset=["'][^"']*["']/gi, "");
    if (/\ssrc=["']/i.test(next)) {
      next = next.replace(/\ssrc=["'][^"']*["']/i, ` src="${local}"`);
    } else {
      next = next.replace(/<img\b/i, `<img src="${local}"`);
    }
    return next;
  });
}

function siteRuntimeJs() {
  return `(() => {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Back to top (FloatingActionButtons aria-label is usually "Back to top")
  document
    .querySelectorAll(
      '[data-back-to-top="true"], [aria-label="Back to top"], [aria-label="Scroll to top"]',
    )
    .forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        scrollTop();
      });
    });

  // FAQ accordion (ready + custom) — React onClick is stripped in HTML export
  const setFaqOpen = (item, open) => {
    item.setAttribute("data-export-faq-open", open ? "true" : "false");
    const panel = item.querySelector("[data-export-faq-panel]");
    const chevron = item.querySelector("[data-export-faq-chevron], svg");
    if (panel) {
      panel.classList.toggle("grid-rows-[1fr]", open);
      panel.classList.toggle("opacity-100", open);
      panel.classList.toggle("grid-rows-[0fr]", !open);
      panel.classList.toggle("opacity-0", !open);
    }
    if (chevron) {
      chevron.classList.toggle("rotate-180", open);
    }
  };

  document.querySelectorAll("[data-export-faq-item]").forEach((item) => {
    const trigger = item.querySelector("[data-export-faq-trigger]");
    if (!trigger) return;
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const root =
        item.closest("[data-export-faq]") || item.parentElement || document;
      const wasOpen = item.getAttribute("data-export-faq-open") === "true";
      root.querySelectorAll("[data-export-faq-item]").forEach((other) => {
        setFaqOpen(other, false);
      });
      if (!wasOpen) setFaqOpen(item, true);
    });
  });

  // Horizontal carousels (highlight, projects, featured, blog, gallery, clients)
  const findCarousel = (from) => {
    let el = from;
    while (el && el !== document.body) {
      const scroller = el.querySelector
        ? el.querySelector('[data-box-layout-grid="carousel"]')
        : null;
      if (scroller) return scroller;
      if (
        el.getAttribute &&
        el.getAttribute("data-box-layout-grid") === "carousel"
      ) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  };

  const carouselDir = (label) => {
    const t = (label || "").toLowerCase();
    if (
      /previous page|next page|toggle menu|back to top|previous banner|next banner|previous product slide|next product slide|previous property image|next property image/.test(
        t,
      )
    ) {
      return 0;
    }
    if (/^go to |^show /.test(t)) return 0;
    if (/previous|scroll .* left/.test(t)) return -1;
    if (/next|scroll .* right/.test(t)) return 1;
    return 0;
  };

  document.querySelectorAll("button[aria-label]").forEach((btn) => {
    const dir = carouselDir(btn.getAttribute("aria-label"));
    if (!dir) return;
    if (
      btn.closest(
        "[data-export-banner-slider], [data-export-fade-slider], [data-export-product-slider]",
      )
    ) {
      return;
    }
    btn.removeAttribute("disabled");
    btn.style.pointerEvents = "";
    btn.style.opacity = "";
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const scroller =
        findCarousel(btn.parentElement) ||
        findCarousel(btn.closest("section"));
      if (!scroller) return;
      scroller.scrollBy({
        left: dir * Math.max(scroller.clientWidth * 0.8, 280),
        behavior: "smooth",
      });
    });
  });

  const bindFadeSlider = (root, autoplayMs) => {
    const slides = Array.from(
      root.querySelectorAll(
        "[data-export-banner-slide], [data-export-fade-slide]",
      ),
    );
    if (slides.length <= 1) return;
    let index = Math.max(
      0,
      slides.findIndex((slide) => slide.getAttribute("data-active") === "true"),
    );
    if (index < 0) index = 0;

    const dots = () =>
      root.querySelectorAll(
        "[data-export-banner-dot], [data-export-fade-dot], [aria-label^='Go to slide'], [aria-label^='Show image']",
      );

    const paint = () => {
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.setAttribute("data-active", active ? "true" : "false");
        slide.style.opacity = active ? "1" : "0";
        slide.style.pointerEvents = active ? "auto" : "none";
        slide.setAttribute("aria-hidden", active ? "false" : "true");
        slide.classList.toggle("opacity-100", active);
        slide.classList.toggle("opacity-0", !active);
        slide.classList.toggle("pointer-events-none", !active);
      });
      dots().forEach((dot, i) => {
        const active = i === index;
        dot.classList.toggle("w-8", active);
        dot.classList.toggle("w-10", active);
        dot.classList.toggle("bg-white", active);
        dot.classList.toggle("w-2", !active);
        dot.classList.toggle("w-3", !active);
        dot.classList.toggle("bg-white/50", !active);
        dot.classList.toggle("bg-white/45", !active);
        dot.classList.toggle("bg-white/55", !active);
      });
    };

    const prev = root.querySelector(
      '[aria-label="Previous slide"], [aria-label="Previous banner slide"], [aria-label="Previous property image"]',
    );
    const next = root.querySelector(
      '[aria-label="Next slide"], [aria-label="Next banner slide"], [aria-label="Next property image"]',
    );
    if (prev) {
      prev.addEventListener("click", (event) => {
        event.preventDefault();
        index = (index - 1 + slides.length) % slides.length;
        paint();
      });
    }
    if (next) {
      next.addEventListener("click", (event) => {
        event.preventDefault();
        index = (index + 1) % slides.length;
        paint();
      });
    }
    dots().forEach((dot, i) => {
      dot.addEventListener("click", (event) => {
        event.preventDefault();
        index = i;
        paint();
      });
    });

    paint();
    if (autoplayMs > 0) {
      window.setInterval(() => {
        index = (index + 1) % slides.length;
        paint();
      }, autoplayMs);
    }
  };

  document
    .querySelectorAll("[data-export-banner-slider]")
    .forEach((root) => bindFadeSlider(root, 5500));
  document
    .querySelectorAll("[data-export-fade-slider]")
    .forEach((root) => bindFadeSlider(root, 0));

  // Product program slider (Primary School / ProductOne)
  document.querySelectorAll("[data-export-product-slider]").forEach((root) => {
    let slides = [];
    try {
      slides = JSON.parse(root.getAttribute("data-slides") || "[]");
    } catch {
      slides = [];
    }
    if (!Array.isArray(slides) || slides.length <= 1) return;
    let index = 0;

    const paint = () => {
      const slide = slides[index];
      if (!slide) return;
      const img =
        root.querySelector("[data-export-product-image]") ||
        root.querySelector("img[data-editor-media]");
      if (img) {
        if (slide.image) {
          img.setAttribute("src", slide.image);
          img.setAttribute("data-editor-media-src", slide.image);
          img.removeAttribute("srcset");
        }
        if (slide.alt) img.setAttribute("alt", slide.alt);
      }
      root.querySelectorAll("[data-export-product-title]").forEach((el) => {
        el.textContent = slide.title || "";
      });
      root.querySelectorAll("[data-export-product-category]").forEach((el) => {
        el.textContent = slide.category || "";
      });
      root.querySelectorAll("[data-export-product-desc]").forEach((el) => {
        el.textContent = slide.desc || "";
      });
    };

    const prev = root.querySelector('[aria-label="Previous product slide"]');
    const next = root.querySelector('[aria-label="Next product slide"]');
    if (prev) {
      prev.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        index = index <= 0 ? slides.length - 1 : index - 1;
        paint();
      });
    }
    if (next) {
      next.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        index = index >= slides.length - 1 ? 0 : index + 1;
        paint();
      });
    }
  });

  // Custom / card sliders — slide JSON on root for HTML export navigation
  document.querySelectorAll("[data-export-slider]").forEach((root) => {
    let slides = [];
    try {
      slides = JSON.parse(root.getAttribute("data-slides") || "[]");
    } catch {
      slides = [];
    }
    if (!Array.isArray(slides) || !slides.length) return;

    const cardsPerView = Math.max(
      1,
      Number(root.getAttribute("data-cards-per-view") || "1") || 1,
    );
    const autoplay = root.getAttribute("data-autoplay") !== "0";
    const maxStart = Math.max(0, slides.length - cardsPerView);
    let index = 0;
    const grid = root.querySelector("[data-export-slider-grid]");
    if (!grid) return;

    const paint = () => {
      const start = Math.min(Math.max(0, index), maxStart);
      const gapPx = cardsPerView > 1 ? 12 : 0;
      const height = root.getAttribute("data-slider-height") || "320";
      grid.style.display = "grid";
      grid.style.gridTemplateColumns =
        "repeat(" + cardsPerView + ", minmax(0, 1fr))";
      grid.style.gap = gapPx + "px";
      grid.innerHTML = "";
      slides.slice(start, start + cardsPerView).forEach((slide, visibleIndex) => {
        const wrap = document.createElement("div");
        wrap.className = "relative overflow-hidden rounded-xl bg-slate-900";
        const img = document.createElement("img");
        img.src = slide.src || "";
        img.alt = slide.alt || "Slide " + (start + visibleIndex + 1);
        img.className = "h-full w-full object-cover";
        img.style.height = height + "px";
        wrap.appendChild(img);
        grid.appendChild(wrap);
      });

      const prev = root.querySelector('[aria-label="Previous cards"]');
      const next = root.querySelector('[aria-label="Next cards"]');
      if (prev) prev.disabled = start <= 0;
      if (next) next.disabled = start >= maxStart;
      root.querySelectorAll("[data-export-slider-dot]").forEach((dot, i) => {
        const active = i === start;
        dot.classList.toggle("bg-slate-800", active);
        dot.classList.toggle("bg-slate-300", !active);
      });
    };

    const prev = root.querySelector('[aria-label="Previous cards"]');
    const next = root.querySelector('[aria-label="Next cards"]');
    if (prev) {
      prev.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        index = Math.max(0, index - 1);
        paint();
      });
    }
    if (next) {
      next.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        index = Math.min(maxStart, index + 1);
        paint();
      });
    }
    root.querySelectorAll("[data-export-slider-dot]").forEach((dot, i) => {
      dot.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        index = i;
        paint();
      });
    });

    paint();
    if (autoplay && slides.length > cardsPerView) {
      window.setInterval(() => {
        index = index >= maxStart ? 0 : index + 1;
        paint();
      }, 4000);
    }
  });

  // Testimonial / related-item track sliders (responsive cards-per-view)
  document
    .querySelectorAll(
      "[data-export-testimonial-slider], [data-export-related-slider]",
    )
    .forEach((root) => {
      const track = root.querySelector(
        "[data-export-testimonial-track], [data-export-related-track]",
      );
      if (!track) return;

      const desktopCpv = Math.max(
        1,
        Number(
          root.getAttribute("data-cards-per-view-desktop") ||
            root.getAttribute("data-cards-per-view") ||
            "1",
        ) || 1,
      );
      const mobileCpv = Math.max(
        1,
        Number(
          root.getAttribute("data-cards-per-view-mobile") ||
            root.getAttribute("data-cards-per-view") ||
            "1",
        ) || 1,
      );
      const gapPx = Number(root.getAttribute("data-gap") || "12") || 12;
      const itemCount = Math.max(
        1,
        Number(root.getAttribute("data-item-count") || "0") ||
          track.children.length,
      );
      const autoplay = root.getAttribute("data-autoplay") === "1";
      const isRelated = root.hasAttribute("data-export-related-slider");
      let index = 0;
      let timer = 0;

      const resolveCpv = () =>
        window.innerWidth < 640 ? mobileCpv : desktopCpv;

      const paint = () => {
        const cardsPerView = resolveCpv();
        const maxStart = Math.max(0, itemCount - cardsPerView);
        if (index > maxStart) index = maxStart;
        const start = Math.min(Math.max(0, index), maxStart);

        Array.from(track.children).forEach((child) => {
          if (!(child instanceof HTMLElement)) return;
          child.style.flex = "0 0 auto";
          child.style.width =
            "calc((100% - " +
            (cardsPerView - 1) * gapPx +
            "px) / " +
            cardsPerView +
            ")";
          child.style.minWidth = child.style.width;
        });
        track.style.gap = gapPx + "px";
        track.style.display = "flex";
        track.style.width = "100%";

        if (isRelated) {
          track.style.transform =
            "translateX(calc(-1 * " +
            start +
            " * ((100% - " +
            (cardsPerView - 1) * gapPx +
            "px) / " +
            cardsPerView +
            " + " +
            gapPx +
            "px)))";
        } else {
          track.style.transform =
            "translateX(calc(-" +
            start +
            " * ((100% + " +
            gapPx +
            "px) / " +
            cardsPerView +
            ")))";
        }

        const canSlide = maxStart > 0;
        root
          .querySelectorAll(
            '[aria-label="Previous testimonials"], [aria-label="Next testimonials"], [aria-label="Previous related items"], [aria-label="Next related items"]',
          )
          .forEach((btn) => {
            if (!(btn instanceof HTMLElement)) return;
            btn.style.display = canSlide ? "" : "none";
            btn.style.pointerEvents = canSlide ? "auto" : "none";
          });

        const dots = root.querySelectorAll(
          "[data-export-testimonial-dot], [data-export-related-dot]",
        );
        dots.forEach((dot, i) => {
          if (!(dot instanceof HTMLElement)) return;
          const active = i === start;
          dot.style.display = i <= maxStart && canSlide ? "" : "none";
          dot.classList.toggle("bg-slate-800", active);
          dot.classList.toggle("bg-slate-300", !active);
        });
      };

      const go = (nextIndex) => {
        const maxStart = Math.max(0, itemCount - resolveCpv());
        if (maxStart <= 0) return;
        index = ((nextIndex % (maxStart + 1)) + (maxStart + 1)) % (maxStart + 1);
        paint();
      };

      const prev = root.querySelector(
        '[aria-label="Previous testimonials"], [aria-label="Previous related items"]',
      );
      const next = root.querySelector(
        '[aria-label="Next testimonials"], [aria-label="Next related items"]',
      );
      if (prev) {
        prev.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const maxStart = Math.max(0, itemCount - resolveCpv());
          go(index <= 0 ? maxStart : index - 1);
        });
      }
      if (next) {
        next.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          const maxStart = Math.max(0, itemCount - resolveCpv());
          go(index >= maxStart ? 0 : index + 1);
        });
      }
      root
        .querySelectorAll(
          "[data-export-testimonial-dot], [data-export-related-dot]",
        )
        .forEach((dot, i) => {
          dot.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            go(i);
          });
        });

      const startAutoplay = () => {
        if (timer) window.clearInterval(timer);
        if (!autoplay) return;
        timer = window.setInterval(() => {
          const maxStart = Math.max(0, itemCount - resolveCpv());
          if (maxStart <= 0) return;
          go(index >= maxStart ? 0 : index + 1);
        }, 4000);
      };

      paint();
      startAutoplay();
      window.addEventListener("resize", () => {
        paint();
        startAutoplay();
      });
    });

  // Menu active state (scroll spy + click) — React scroll spy is stripped in HTML export
  (() => {
    const header =
      document.querySelector("header") ||
      document.querySelector("[data-site-theme-root]");
    if (!header) return;

    const navLinks = Array.from(
      header.querySelectorAll("nav a[href]"),
    ).filter((link) => {
      if (link.closest("[data-html-export-mobile-nav]")) return false;
      const href = (link.getAttribute("href") || "").trim();
      if (!href || href.startsWith("tel:") || href.startsWith("mailto:")) {
        return false;
      }
      return true;
    });
    if (!navLinks.length) return;

    const activeTemplate =
      navLinks.find((link) => link.getAttribute("aria-current") === "page") ||
      null;
    const activeStyle = activeTemplate
      ? activeTemplate.getAttribute("style") || ""
      : "";

    const sectionIdFromHref = (href) => {
      const raw = (href || "").trim();
      const hash = raw.includes("#") ? raw.slice(raw.indexOf("#") + 1) : "";
      if (!hash || hash.startsWith("page-") || hash.startsWith("master-detail")) {
        return "";
      }
      try {
        return decodeURIComponent(hash);
      } catch {
        return hash;
      }
    };

    const setActiveLink = (active) => {
      navLinks.forEach((link) => {
        const isActive = link === active;
        if (isActive) {
          link.setAttribute("aria-current", "page");
          if (activeStyle) link.setAttribute("style", activeStyle);
        } else {
          link.removeAttribute("aria-current");
          link.removeAttribute("style");
        }
      });
    };

    const findSectionLink = (id) => {
      if (!id) return null;
      return (
        navLinks.find((link) => sectionIdFromHref(link.getAttribute("href")) === id) ||
        null
      );
    };

    const updateFromScroll = () => {
      const activationLine = 140;
      let bestId = "";
      let bestTop = Number.NEGATIVE_INFINITY;
      const ids = new Set();
      navLinks.forEach((link) => {
        const id = sectionIdFromHref(link.getAttribute("href"));
        if (id) ids.add(id);
      });
      ids.forEach((id) => {
        const target =
          document.getElementById(id) ||
          document.querySelector('[data-section-id="' + id + '"]');
        if (!target) return;
        const top = target.getBoundingClientRect().top;
        if (top <= activationLine && top > bestTop) {
          bestTop = top;
          bestId = id;
        }
      });
      if (!bestId) {
        const file = (
          window.location.pathname.split("/").pop() || "index.html"
        ).toLowerCase();
        const isHomePage =
          !file ||
          file === "index.html" ||
          file === "" ||
          file === "/";
        if (!isHomePage) return;
        const home =
          navLinks.find((link) => {
            const href = (link.getAttribute("href") || "").trim().toLowerCase();
            const label = (link.textContent || "").replace(/\\s+/g, " ").trim().toLowerCase();
            return (
              label === "home" ||
              href === "#" ||
              href === "#home" ||
              href.endsWith("index.html") ||
              href.endsWith("/")
            );
          }) || null;
        if (home) setActiveLink(home);
        return;
      }
      const match = findSectionLink(bestId);
      if (match) setActiveLink(match);
    };

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const id = sectionIdFromHref(link.getAttribute("href"));
        if (id) {
          setActiveLink(link);
          return;
        }
        // Multi-page html links — mark clicked item active before navigation
        setActiveLink(link);
      });
    });

    updateFromScroll();
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);
  })();

  // Hash anchors (single-page style)
  document.querySelectorAll('a[href*="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href") || "";
      const hashIndex = href.indexOf("#");
      if (hashIndex < 0) return;
      const hash = href.slice(hashIndex);
      if (hash.length < 2 || hash === "#home") {
        if (hash === "#home" || href.endsWith("#")) {
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }
      // Only intercept same-page hashes (not other.html#section unless current is that file)
      const pathPart = href.slice(0, hashIndex);
      if (
        pathPart &&
        !pathPart.endsWith("index.html") &&
        pathPart !== "./" &&
        pathPart !== "." &&
        !/^[.]{0,2}\\/?$/.test(pathPart)
      ) {
        const current = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
        const targetFile = pathPart.split("/").pop().toLowerCase();
        if (targetFile && targetFile !== current && targetFile !== "index.html") {
          return;
        }
      }
      const id = decodeURIComponent(hash.slice(1));
      const target =
        document.getElementById(id) ||
        document.querySelector('[data-section-id="' + id + '"]');
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // FAQ accordion — RealEstate uses aria-controls="real-estate-faq-answer-N"
  document.querySelectorAll('button[aria-controls^="real-estate-faq-answer"]').forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const id = trigger.getAttribute("aria-controls");
      const panel = id ? document.getElementById(id) : null;
      const item = trigger.closest("article") || trigger.parentElement;
      const root = item?.parentElement || document;
      const wasOpen = trigger.getAttribute("aria-expanded") === "true";
      root.querySelectorAll('button[aria-controls^="real-estate-faq-answer"]').forEach((other) => {
        const otherId = other.getAttribute("aria-controls");
        const otherPanel = otherId ? document.getElementById(otherId) : null;
        other.setAttribute("aria-expanded", "false");
        if (otherPanel) {
          otherPanel.classList.remove("grid-rows-[1fr]", "opacity-100");
          otherPanel.classList.add("grid-rows-[0fr]", "opacity-0");
        }
      });
      if (!wasOpen && panel) {
        trigger.setAttribute("aria-expanded", "true");
        panel.classList.remove("grid-rows-[0fr]", "opacity-0");
        panel.classList.add("grid-rows-[1fr]", "opacity-100");
      }
    });
  });

  // Testimonial dots + carousel scroll
  document.querySelectorAll('[data-box-layout-grid="carousel"]').forEach((scroller) => {
    const section = scroller.closest("section");
    const dots = section
      ? Array.from(section.querySelectorAll('[aria-label^="Go to testimonial"]'))
      : [];
    if (!dots.length) return;

    const paintDots = (index) => {
      dots.forEach((other, i) => {
        const on = i === index;
        other.setAttribute("aria-current", on ? "true" : "false");
        other.classList.toggle("w-6", on);
        other.classList.toggle("bg-[#c44536]", on);
        other.classList.toggle("w-2", !on);
        other.classList.toggle("bg-[#141414]/20", !on);
      });
    };

    const nearestIndex = () => {
      const cards = Array.from(scroller.children);
      let best = 0;
      let bestDist = Infinity;
      cards.forEach((card, i) => {
        if (!(card instanceof HTMLElement)) return;
        const dist = Math.abs(card.offsetLeft - scroller.scrollLeft);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      return best;
    };

    dots.forEach((dot, index) => {
      dot.addEventListener("click", (event) => {
        event.preventDefault();
        const card = scroller.children[index];
        if (card instanceof HTMLElement) {
          scroller.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
        }
        paintDots(index);
      });
    });

    scroller.addEventListener(
      "scroll",
      () => paintDots(nearestIndex()),
      { passive: true },
    );
    paintDots(nearestIndex());
  });

  // Category / listing tabs (Featured Projects + /projects page)
  document.querySelectorAll("[data-export-filter]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const value = (btn.getAttribute("data-export-filter") || "All").toLowerCase();
      let root = btn.parentElement;
      while (
        root &&
        root !== document.body &&
        !root.querySelector("[data-export-card-category]")
      ) {
        root = root.parentElement;
      }
      if (!root) root = document;
      root.querySelectorAll("[data-export-filter]").forEach((other) => {
        const on = other === btn;
        other.setAttribute("aria-pressed", on ? "true" : "false");
        other.classList.toggle("bg-[#141414]", on);
        other.classList.toggle("text-white", on);
        other.classList.toggle("text-[#141414]", !on);
        other.classList.toggle("border-[#141414]", on);
      });
      root.querySelectorAll("[data-export-card-category]").forEach((card) => {
        const cat = (card.getAttribute("data-export-card-category") || "").toLowerCase();
        const show = value === "all" || cat === value;
        card.classList.toggle("hidden", !show);
      });
    });
  });

  // Mobile menu (prefer SSR panel; otherwise build a static panel)
  const toggle = document.querySelector('[aria-label="Toggle menu"]');
  const existingPanel = document.querySelector("[data-export-mobile-nav]");
  if (toggle && existingPanel) {
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const open = existingPanel.classList.contains("hidden");
      existingPanel.classList.toggle("hidden", !open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    existingPanel.querySelectorAll("[data-export-mobile-group]").forEach((groupBtn) => {
      groupBtn.addEventListener("click", (event) => {
        event.preventDefault();
        const wrap = groupBtn.parentElement;
        const submenu = wrap?.querySelector("div.flex.flex-col, div[class*='flex-col']");
        if (submenu && submenu !== groupBtn) submenu.classList.toggle("hidden");
      });
    });
    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (existingPanel.contains(target) || toggle.contains(target)) return;
      existingPanel.classList.add("hidden");
      toggle.setAttribute("aria-expanded", "false");
    });
  } else if (toggle) {
  const headerShell =
    toggle.closest("header") ||
    toggle.closest("[data-site-theme-root] > div") ||
    toggle.parentElement?.parentElement ||
    toggle.parentElement;
  if (!headerShell) return;

  if (getComputedStyle(headerShell).position === "static") {
    headerShell.style.position = "relative";
  }

  const panel = document.createElement("div");
  panel.id = "html-export-mobile-nav";
  panel.setAttribute("data-html-export-mobile-nav", "true");
  panel.style.cssText = [
    "display:none",
    "position:absolute",
    "left:0",
    "right:0",
    "top:100%",
    "z-index:10050",
    "padding:1rem",
    "border-top:1px solid rgba(15,23,42,0.08)",
    "background:inherit",
    "box-shadow:0 16px 40px rgba(15,23,42,0.16)",
  ].join(";");

  const nav = document.createElement("nav");
  nav.style.cssText = "display:flex;flex-direction:column;gap:0.5rem;";

  const seen = new Set();
  const collectLinks = () => {
    const links = [];
    headerShell.querySelectorAll("a[href]").forEach((link) => {
      if (panel.contains(link)) return;
      const label = (link.textContent || "").replace(/\\s+/g, " ").trim();
      const href = link.getAttribute("href") || "";
      if (!label || !href || href.startsWith("tel:") || href.startsWith("mailto:")) return;
      // Skip tiny icon-only / social links
      if (label.length > 40) return;
      const key = label.toLowerCase() + "|" + href;
      if (seen.has(key)) return;
      seen.add(key);
      links.push({ label, href });
    });
    return links;
  };

  collectLinks().forEach(({ label, href }) => {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    a.style.cssText =
      "display:block;padding:0.65rem 0.75rem;border-radius:0.75rem;font-size:0.9rem;font-weight:600;color:inherit;text-decoration:none;";
    a.addEventListener("click", () => {
      panel.style.display = "none";
      toggle.setAttribute("aria-expanded", "false");
    });
    nav.appendChild(a);
  });

  panel.appendChild(nav);
  headerShell.appendChild(panel);

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    const open = panel.style.display === "none" || !panel.style.display;
    panel.style.display = open ? "block" : "none";
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (panel.contains(target) || toggle.contains(target)) return;
    panel.style.display = "none";
    toggle.setAttribute("aria-expanded", "false");
  });
  }
})();
`;
}

function revealHiddenMotion(html: string) {
  return html.replace(/\sstyle="([^"]*)"/gi, (_full, style: string) => {
    const kept = style
      .split(";")
      .map((part: string) => part.trim())
      .filter(Boolean)
      .filter((part: string) => {
        const lower = part.toLowerCase().replace(/\s+/g, "");
        if (lower === "opacity:0") return false;
        if (lower.startsWith("transform:translatey(")) return false;
        return true;
      });
    if (!kept.length) return "";
    return ` style="${kept.join(";")}"`;
  });
}

function rewriteBareAppLinks(
  html: string,
  pages: HtmlPage[],
  fromFile: string,
) {
  const fileByKey = new Map(pages.map((page) => [page.key, page.fileName]));
  return html.replace(
    /href=(["'])\/(contact|about|projects|properties|services|privacy|terms|gallery|blog|buy-a-property|rent|careers)(?:\/([^"'?#]+))?\1/gi,
    (_full, quote: string, page: string, rest?: string) => {
      const kind = page.toLowerCase();
      if (rest) {
        const mapped = kind === "properties" ? "property" : kind;
        const key = `${mapped}/${decodeURIComponent(rest)}`;
        const target = fileByKey.get(key) || `${key}.html`;
        return `href=${quote}${hrefBetween(fromFile, target)}${quote}`;
      }
      const target = fileByKey.get(kind) || `${kind}.html`;
      return `href=${quote}${hrefBetween(fromFile, target)}${quote}`;
    },
  );
}

function themeRootCss(templateVariables: Record<string, string> | undefined) {
  const vars = Object.entries(templateVariables || {})
    .filter(([key, value]) => key.startsWith("--") && typeof value === "string")
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
  return `:root {\n${vars}\n}\n\n${SITE_THEME_GLOBAL_CSS}\n`;
}

function replaceStylesheets(html: string, href: string) {
  let replaced = false;
  const next = html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, () => {
    if (replaced) return "";
    replaced = true;
    return `<link rel="stylesheet" href="${href}" />`;
  });
  if (replaced) return next;
  return next.replace(
    /<\/head>/i,
    `  <link rel="stylesheet" href="${href}" />\n</head>`,
  );
}

function injectHeadExtras(html: string, extras: string) {
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${extras}\n</head>`);
  }
  return `<head>${extras}</head>${html}`;
}

/**
 * Build a static HTML ZIP from live published pages (same visual CSS + media).
 */
export async function buildPublishedHtmlExport(options: {
  payload: PublishedSitePayload;
  origin: string;
  assets: CollectedExportAsset[];
  urlMap: Map<string, string>;
}): Promise<{ folderName: string; files: ZipFileEntry[]; filename: string }> {
  const slug = options.payload.slug || options.payload.id || "website";
  const title = options.payload.title?.trim() || slug;
  const folderName = safeFolderName(slug);
  const origin = options.origin.replace(/\/$/, "");
  const pageMap = new Map<string, HtmlPage>();
  for (const page of listNavHtmlPages(options.payload, slug)) {
    pageMap.set(page.key, page);
  }
  const singlePage = isPublishedSinglePageSite(options.payload);
  if (!singlePage) {
    for (const page of collectCountryDetailPagesFromPayload(
      options.payload,
      slug,
    )) {
      if (!pageMap.has(page.key)) pageMap.set(page.key, page);
    }
    for (const page of collectProjectDetailPagesFromPayload(
      options.payload,
      slug,
    )) {
      if (!pageMap.has(page.key)) pageMap.set(page.key, page);
    }
    for (const page of collectPropertyDetailPagesFromPayload(
      options.payload,
      slug,
    )) {
      if (!pageMap.has(page.key)) pageMap.set(page.key, page);
    }
  }

  const rawHtmlByKey = new Map<string, string>();
  const cssChunks: string[] = [themeRootCss(options.payload.templateVariables)];
  const cssSeen = new Set<string>();
  const assetExtras: ZipFileEntry[] = [];

  const collectCssFromHtml = async (html: string) => {
    const stylesheets = extractStylesheetHrefs(html);
    for (const href of stylesheets) {
      const abs = absolutize(origin, href);
      if (cssSeen.has(abs)) continue;
      cssSeen.add(abs);
      const css = await fetchText(abs);
      if (!css) continue;

      let rewrittenCss = css;
      const urlRe = /url\((['"]?)([^'")]+)\1\)/gi;
      let match: RegExpExecArray | null;
      while ((match = urlRe.exec(css))) {
        const rawUrl = match[2].trim();
        if (
          !rawUrl ||
          rawUrl.startsWith("data:") ||
          rawUrl.startsWith("#") ||
          /^https?:\/\/fonts\./i.test(rawUrl)
        ) {
          continue;
        }
        const assetAbs = absolutize(origin, rawUrl);
        try {
          const res = await fetch(assetAbs, { cache: "no-store" });
          if (!res.ok) continue;
          const bytes = Buffer.from(await res.arrayBuffer());
          if (!bytes.length || bytes.byteLength > 8 * 1024 * 1024) continue;
          const hash = createHash("sha1").update(assetAbs).digest("hex").slice(0, 10);
          const ext =
            (assetAbs.split("?")[0].match(/\.([a-z0-9]+)$/i)?.[1] || "bin").toLowerCase();
          const localName = `font-${hash}.${ext}`;
          assetExtras.push({
            path: `${folderName}/assets/${localName}`,
            content: bytes,
          });
          rewrittenCss = rewrittenCss.split(rawUrl).join(`./${localName}`);
        } catch {
          /* skip */
        }
      }

      cssChunks.push(`/* ${abs} */\n${rewrittenCss}`);
    }
  };

  // Pass 1: fetch nav/listing pages and discover detail URLs
  for (const page of Array.from(pageMap.values())) {
    const html = await fetchText(absolutize(origin, page.fetchPath));
    if (!html || isExportedNotFoundPage(html)) {
      if (page.key === "home") {
        throw new Error(`Unable to fetch published page HTML (${page.fetchPath})`);
      }
      continue;
    }
    rawHtmlByKey.set(page.key, html);
    await collectCssFromHtml(html);

    if (singlePage) continue;
    for (const detailPath of collectDetailPathsFromHtml(html, slug)) {
      const detail = detailPageFromPath(slug, detailPath);
      if (detail && !pageMap.has(detail.key)) pageMap.set(detail.key, detail);
    }
  }

  // Pass 2: fetch detail pages discovered from listings
  for (const page of Array.from(pageMap.values())) {
    if (rawHtmlByKey.has(page.key)) continue;
    const html = await fetchText(absolutize(origin, page.fetchPath));
    if (!html || isExportedNotFoundPage(html)) continue;
    rawHtmlByKey.set(page.key, html);
    await collectCssFromHtml(html);
  }

  const pages = Array.from(pageMap.values());
  const files: ZipFileEntry[] = [];

  for (const page of pages) {
    let html = rawHtmlByKey.get(page.key);
    if (!html) continue;

    const prefix = depthPrefix(page.fileName);

    html = stripScripts(html);
    html = revealHiddenMotion(html);
    html = applyUrlMap(html, options.urlMap);
    html = rewriteNextImageUrls(html, options.urlMap);
    html = relativeMediaPaths(html, prefix);
    html = normalizeLocalImageSources(html, prefix);
    html = rewritePublishedLinks(html, slug, pages, page.fileName);
    html = rewriteBareAppLinks(html, pages, page.fileName);
    html = rewriteHashMenuLinksToHome(html, page.fileName);
    html = replaceStylesheets(html, `${prefix}assets/styles.css`);
    html = injectHeadExtras(
      html,
      [
        `<link rel="stylesheet" href="${GOOGLE_FONTS_HREF}" />`,
        `<meta name="generator" content="CSS Founder HTML export" />`,
      ].join("\n  "),
    );

    if (page.key === "home" && title) {
      html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
    }

    const scriptTag = `  <script src="${prefix}assets/site.js" defer></script>\n`;
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${scriptTag}</body>`);
    } else {
      html += `\n${scriptTag}`;
    }

    files.push({
      path: `${folderName}/${page.fileName}`,
      content: html,
    });
  }

  files.push({
    path: `${folderName}/assets/styles.css`,
    content: `${cssChunks.join("\n\n")}\n`,
  });

  files.push({
    path: `${folderName}/assets/site.js`,
    content: siteRuntimeJs(),
  });

  for (const asset of options.assets) {
    files.push({
      path: `${folderName}${asset.publicUrl}`,
      content: asset.bytes,
    });
  }

  files.push(...assetExtras);

  files.push({
    path: `${folderName}/README.md`,
    content: `# ${title}

Static HTML export of \`/published/${slug}\` (same layout CSS + images/videos).

## Open

Open \`index.html\` in a browser (or serve the folder):

\`\`\`bash
npx --yes serve .
\`\`\`

## Included

- HTML pages for Home, linked pages, and detail pages (projects, property, blog, …)
- \`assets/styles.css\` — published site styles (Tailwind utilities + theme)
- \`assets/site.js\` — back-to-top, FAQ, product/gallery/banner/testimonial sliders, menu active, mobile menu
- \`media/\` — ${options.assets.length} image/video file(s)
`,
  });

  return {
    folderName,
    files,
    filename: `${folderName}.zip`,
  };
}
