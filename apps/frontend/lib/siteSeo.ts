export type SiteSeoSettings = {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  schemaType?: string;
  schemaJson?: string;
  sitemapEnabled?: boolean;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  favicon?: string;
  googleAnalyticsId?: string;
};

/** Stored in site config — top-level = site-wide, pages = per-page meta/OG */
export type SiteSeoConfig = SiteSeoSettings & {
  pages?: Record<string, SiteSeoSettings>;
};

export const DEFAULT_SITE_SEO: SiteSeoSettings = {
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  ogType: "website",
  schemaType: "Organization",
  schemaJson: "",
  sitemapEnabled: true,
  robotsIndex: true,
  robotsFollow: true,
  favicon: "",
  googleAnalyticsId: "",
};

const PAGE_SEO_FIELDS = [
  "metaTitle",
  "metaDescription",
  "metaKeywords",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "ogType",
] as const;

export function normalizePageSeoKey(pageLabel: string): string {
  const slug = pageLabel.trim().toLowerCase().replace(/\s+/g, "-");
  if (!slug || slug === "home") return "home";
  if (slug === "service") return "services";
  if (slug === "about-us") return "about";
  if (slug === "contact-us") return "contact";
  return slug;
}

export function normalizeSiteSeo(value: unknown): SiteSeoSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_SITE_SEO };
  }

  const raw = value as Record<string, unknown>;
  return {
    metaTitle:
      typeof raw.metaTitle === "string" ? raw.metaTitle : "",
    metaDescription:
      typeof raw.metaDescription === "string" ? raw.metaDescription : "",
    metaKeywords:
      typeof raw.metaKeywords === "string" ? raw.metaKeywords : "",
    ogTitle: typeof raw.ogTitle === "string" ? raw.ogTitle : "",
    ogDescription:
      typeof raw.ogDescription === "string" ? raw.ogDescription : "",
    ogImage: typeof raw.ogImage === "string" ? raw.ogImage : "",
    ogType:
      typeof raw.ogType === "string" && raw.ogType.trim()
        ? raw.ogType
        : "website",
    schemaType:
      typeof raw.schemaType === "string" && raw.schemaType.trim()
        ? raw.schemaType
        : "Organization",
    schemaJson: typeof raw.schemaJson === "string" ? raw.schemaJson : "",
    sitemapEnabled: raw.sitemapEnabled !== false,
    robotsIndex: raw.robotsIndex !== false,
    robotsFollow: raw.robotsFollow !== false,
    favicon: typeof raw.favicon === "string" ? raw.favicon : "",
    googleAnalyticsId:
      typeof raw.googleAnalyticsId === "string" ? raw.googleAnalyticsId : "",
  };
}

export function normalizeSiteSeoConfig(value: unknown): SiteSeoConfig {
  const base = normalizeSiteSeo(value);
  const raw =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const pages: Record<string, SiteSeoSettings> = {};
  if (
    raw.pages &&
    typeof raw.pages === "object" &&
    !Array.isArray(raw.pages)
  ) {
    for (const [key, pageValue] of Object.entries(raw.pages)) {
      pages[normalizePageSeoKey(key)] = normalizeSiteSeo(pageValue);
    }
  }

  // Legacy flat SEO (single object) → treat meta/OG as Home page SEO.
  if (
    !Object.keys(pages).length &&
    PAGE_SEO_FIELDS.some(
      (key) =>
        typeof base[key] === "string" && String(base[key]).trim().length > 0,
    )
  ) {
    pages.home = {
      metaTitle: base.metaTitle,
      metaDescription: base.metaDescription,
      metaKeywords: base.metaKeywords,
      ogTitle: base.ogTitle,
      ogDescription: base.ogDescription,
      ogImage: base.ogImage,
      ogType: base.ogType,
    };
  }

  return { ...base, pages };
}

export function getPageSeo(
  config: SiteSeoConfig,
  pageLabel: string,
): SiteSeoSettings {
  const key = normalizePageSeoKey(pageLabel);
  const pageSpecific = config.pages?.[key];
  if (pageSpecific) {
    return normalizeSiteSeo(pageSpecific);
  }
  if (key === "home") {
    return normalizeSiteSeo(config);
  }
  return { ...DEFAULT_SITE_SEO };
}

export function getGlobalSeo(config: SiteSeoConfig): SiteSeoSettings {
  return normalizeSiteSeo(config);
}

export function patchPageSeo(
  config: SiteSeoConfig,
  pageLabel: string,
  patch: Partial<SiteSeoSettings>,
): SiteSeoConfig {
  const key = normalizePageSeoKey(pageLabel);
  const pages = { ...(config.pages ?? {}) };
  pages[key] = normalizeSiteSeo({ ...(pages[key] ?? {}), ...patch });
  return normalizeSiteSeoConfig({ ...config, pages });
}

export function patchGlobalSeo(
  config: SiteSeoConfig,
  patch: Partial<SiteSeoSettings>,
): SiteSeoConfig {
  const next = normalizeSiteSeoConfig({ ...config, ...patch });
  // Meta Tags panel reads getPageSeo → pages.home. Keep Home page SEO in sync
  // whenever site-wide meta/OG fields are written.
  const homePatch: Partial<SiteSeoSettings> = {};
  for (const key of PAGE_SEO_FIELDS) {
    if (patch[key] !== undefined) {
      homePatch[key] = patch[key];
    }
  }
  if (!Object.keys(homePatch).length) return next;
  return patchPageSeo(next, "home", homePatch);
}

export function parseKeywords(value?: string) {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function hasManualSeoValues(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const raw = value as Record<string, unknown>;
  return [
    "metaTitle",
    "metaDescription",
    "metaKeywords",
    "ogTitle",
    "ogDescription",
    "ogImage",
    "schemaJson",
  ].some(
    (key) => typeof raw[key] === "string" && String(raw[key]).trim().length > 0,
  );
}

export function hasManualSeoInConfig(value: unknown): boolean {
  const config = normalizeSiteSeoConfig(value);
  if (hasManualSeoValues(config)) return true;
  return Object.values(config.pages ?? {}).some((page) =>
    hasManualSeoValues(page),
  );
}

const seoText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const clipSeoText = (value: string, max = 160) => {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
};

const formatCategoryLabel = (category: string) =>
  category
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

type SeoSectionLike = {
  type?: string;
  variant?: string;
  data?: Record<string, Record<string, unknown> | undefined>;
};

const readSeoVariantData = (section?: SeoSectionLike | null) => {
  if (!section?.data) return {} as Record<string, unknown>;
  const variant = section.variant || "";
  const direct = section.data[variant];
  if (direct && typeof direct === "object") return direct;
  const values = Object.values(section.data).filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object",
  );
  return values[0] || {};
};

export function extractThemeSeoHints(sections: SeoSectionLike[] | undefined) {
  const list = Array.isArray(sections) ? sections : [];
  const header = list.find((section) => section.type === "Header");
  const banner = list.find((section) => section.type === "Banner");
  const headerData = readSeoVariantData(header);
  const bannerData = readSeoVariantData(banner);
  const slides = Array.isArray(bannerData.bannerSlides)
    ? bannerData.bannerSlides
    : [];
  const firstSlide =
    slides.find((item) => item && typeof item === "object") as
      | Record<string, unknown>
      | undefined;

  const brandName =
    seoText(headerData.logo) ||
    seoText(headerData.logoText) ||
    seoText(headerData.brandName);

  const bannerTitle =
    seoText(bannerData.title) || seoText(firstSlide?.title);
  const bannerDesc = seoText(bannerData.desc) || seoText(firstSlide?.desc);
  const ogImage =
    seoText(bannerData.backgroundImage) ||
    seoText(firstSlide?.image) ||
    seoText(headerData.logoImage);

  return { brandName, bannerTitle, bannerDesc, ogImage };
}

export type ThemeSeoPageInput = {
  label: string;
};

export function buildDefaultThemeSeo(input: {
  category?: string | null;
  templateTitle?: string | null;
  templateDescription?: string | null;
  brandName?: string | null;
  brandDescription?: string | null;
  bannerTitle?: string | null;
  bannerDesc?: string | null;
  ogImage?: string | null;
  pages?: ThemeSeoPageInput[];
}): SiteSeoConfig {
  const categoryLabel = formatCategoryLabel(input.category || "Website");
  const brand =
    seoText(input.brandName) ||
    seoText(input.templateTitle) ||
    `${categoryLabel} Website`;
  const description = clipSeoText(
    seoText(input.brandDescription) ||
      seoText(input.bannerDesc) ||
      seoText(input.templateDescription) ||
      seoText(input.bannerTitle) ||
      `${brand} offers ${categoryLabel.toLowerCase()} services online.`,
  );
  const homeTitle = seoText(input.bannerTitle)
    ? `${seoText(input.bannerTitle)} | ${brand}`
    : brand;
  const keywords = Array.from(
    new Set(
      [brand, categoryLabel, "website", seoText(input.bannerTitle)]
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).join(", ");

  const home: SiteSeoSettings = {
    ...DEFAULT_SITE_SEO,
    metaTitle: homeTitle,
    metaDescription: description,
    metaKeywords: keywords,
    ogTitle: homeTitle,
    ogDescription: description,
    ogImage: seoText(input.ogImage),
    ogType: "website",
    schemaType: "Organization",
  };

  const pages: Record<string, SiteSeoSettings> = {
    home,
  };

  const seen = new Set(["home"]);
  for (const page of input.pages || []) {
    const label = seoText(page.label);
    const key = normalizePageSeoKey(label);
    if (!label || seen.has(key) || key === "home") continue;
    seen.add(key);
    const pageTitle = `${label} | ${brand}`;
    const pageDescription = clipSeoText(
      `${brand} — ${label}. ${description}`,
    );
    const pageKeywords = Array.from(
      new Set([label, brand, categoryLabel, "website"].filter(Boolean)),
    ).join(", ");
    pages[key] = {
      ...DEFAULT_SITE_SEO,
      metaTitle: pageTitle,
      metaDescription: pageDescription,
      metaKeywords: pageKeywords,
      ogTitle: pageTitle,
      ogDescription: pageDescription,
      ogImage: seoText(input.ogImage),
      ogType: "website",
    };
  }

  return normalizeSiteSeoConfig({ ...home, pages });
}

const mergeSeoSettings = (
  current: SiteSeoSettings | undefined,
  fallback: SiteSeoSettings,
): { next: SiteSeoSettings; changed: boolean } => {
  const base = normalizeSiteSeo(current);
  let changed = false;
  const next = { ...base };
  for (const key of PAGE_SEO_FIELDS) {
    if (!seoText(base[key]) && seoText(fallback[key])) {
      next[key] = fallback[key];
      changed = true;
    }
  }
  if (!seoText(base.schemaType) && seoText(fallback.schemaType)) {
    next.schemaType = fallback.schemaType;
    changed = true;
  }
  return { next, changed };
};

/** Fill blank SEO fields from theme defaults without overwriting user values. */
export function mergeEmptySiteSeo(
  existing: SiteSeoConfig | undefined,
  defaults: SiteSeoConfig,
): SiteSeoConfig {
  if (!existing) return defaults;
  const current = normalizeSiteSeoConfig(existing);
  let changed = false;
  const homeMerge = mergeSeoSettings(current.pages?.home || current, defaults);
  changed = homeMerge.changed;

  const pages: Record<string, SiteSeoSettings> = {
    ...(current.pages || {}),
    home: homeMerge.next,
  };

  for (const [key, fallback] of Object.entries(defaults.pages || {})) {
    const merged = mergeSeoSettings(pages[key], fallback);
    if (merged.changed || !pages[key]) {
      pages[key] = merged.next;
      changed = true;
    }
  }

  if (!changed) return existing;
  return normalizeSiteSeoConfig({
    ...current,
    ...homeMerge.next,
    pages,
  });
}
