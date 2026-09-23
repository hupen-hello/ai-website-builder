/**
 * Stamp extracted domain theme onto editor template sections (redesign → editor).
 * Safe for Create-Custom: only runs when redesign bridge theme is present.
 */

import type { BuiltSiteTheme } from "@/lib/built-site-theme";
import { applyBrandLogoToSections } from "@/lib/applyOnboardingLogo";
import { applyBrandContactToSections } from "@/lib/applyOnboardingContact";
import { applyBrandAboutContentToSections } from "@/lib/applyOnboardingAboutContent";

const REDESIGN_EDITOR_THEME_KEY = "lestow-redesign-editor-theme";

type SectionLike = {
  type: string;
  variant: string;
  page?: string;
  data: Record<string, Record<string, unknown>>;
};

export function saveRedesignEditorTheme(
  theme: BuiltSiteTheme,
  designId?: string | null,
) {
  if (typeof window === "undefined") return;
  try {
    const slim: BuiltSiteTheme = {
      ...theme,
      contentImages: (theme.contentImages || []).slice(0, 8),
      paragraphs: (theme.paragraphs || []).slice(0, 6),
      headings: (theme.headings || []).slice(0, 8),
      features: (theme.features || []).slice(0, 6),
      sectionPlan: (theme.sectionPlan || []).slice(0, 8),
      referenceNavItems: (theme.referenceNavItems || []).slice(0, 12),
      navItems: (theme.navItems || []).slice(0, 12),
      categories: (theme.categories || []).slice(0, 12),
    };
    const payload = {
      designId: (designId || "").trim(),
      theme: slim,
      savedAt: Date.now(),
    };
    const raw = JSON.stringify(payload);
    window.localStorage.setItem(REDESIGN_EDITOR_THEME_KEY, raw);
    window.sessionStorage.setItem(REDESIGN_EDITOR_THEME_KEY, raw);
    if (designId) {
      window.localStorage.setItem(`${REDESIGN_EDITOR_THEME_KEY}:${designId}`, raw);
      window.sessionStorage.setItem(
        `${REDESIGN_EDITOR_THEME_KEY}:${designId}`,
        raw,
      );
    }
  } catch {
    /* quota — keep a tiny brand-only fallback */
    try {
      const tiny = {
        designId: (designId || "").trim(),
        theme: {
          brandName: theme.brandName || "",
          logoImage: theme.logoImage || "",
          description: (theme.description || "").slice(0, 400),
          tagline: theme.tagline || "",
          contentImages: (theme.contentImages || []).slice(0, 4),
          heroImage: theme.heroImage || "",
          contactEmail: theme.contactEmail || "",
          contactPhone: theme.contactPhone || "",
          contactAddress: theme.contactAddress || "",
          navItems: (theme.navItems || []).slice(0, 8),
          paragraphs: (theme.paragraphs || []).slice(0, 2),
          features: (theme.features || []).slice(0, 3),
        },
        savedAt: Date.now(),
      };
      const tinyRaw = JSON.stringify(tiny);
      window.localStorage.setItem(REDESIGN_EDITOR_THEME_KEY, tinyRaw);
      window.sessionStorage.setItem(REDESIGN_EDITOR_THEME_KEY, tinyRaw);
      if (designId) {
        window.localStorage.setItem(
          `${REDESIGN_EDITOR_THEME_KEY}:${designId}`,
          tinyRaw,
        );
        window.sessionStorage.setItem(
          `${REDESIGN_EDITOR_THEME_KEY}:${designId}`,
          tinyRaw,
        );
      }
    } catch {
      /* ignore */
    }
  }
}

export function readRedesignEditorTheme(
  designId?: string | null,
): BuiltSiteTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const id = (designId || "").trim();
    const raw =
      (id &&
        window.localStorage.getItem(`${REDESIGN_EDITOR_THEME_KEY}:${id}`)) ||
      (id &&
        window.sessionStorage.getItem(`${REDESIGN_EDITOR_THEME_KEY}:${id}`)) ||
      (!id
        ? window.localStorage.getItem(REDESIGN_EDITOR_THEME_KEY) ||
          window.sessionStorage.getItem(REDESIGN_EDITOR_THEME_KEY)
        : null);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      designId?: string;
      theme?: BuiltSiteTheme;
    };
    if (!parsed.theme || typeof parsed.theme !== "object") return null;
    // Never apply another design's unscoped theme to this rd_ session.
    if (
      id &&
      parsed.designId &&
      parsed.designId.trim() &&
      parsed.designId.trim() !== id
    ) {
      return null;
    }
    return parsed.theme;
  } catch {
    return null;
  }
}

export function clearAllRedesignEditorThemes(): void {
  if (typeof window === "undefined") return;
  try {
    const stores = [window.localStorage, window.sessionStorage];
    for (const store of stores) {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (key && key.startsWith(REDESIGN_EDITOR_THEME_KEY)) keys.push(key);
      }
      for (const key of keys) store.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

const REDESIGN_VOID_HREF = "javascript:void(0)";

/** Domain nav labels for redesign header — flat, short, no mega/dropdown children. */
export function buildRedesignDomainNavLinks(theme: BuiltSiteTheme): Array<{
  label: string;
  href: string;
  kind: "page";
}> {
  const raw = [...(theme.navItems || []), ...(theme.categories || [])]
    .map((item) => String(item || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const links: Array<{ label: string; href: string; kind: "page" }> = [];

  const push = (label: string, href: string) => {
    const clean = label.replace(/\s+/g, " ").trim();
    if (!clean || clean.length > 28) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    if (
      /^(toggle|menu|login|sign\s*up|cart|search|subscribe|download|whatsapp|phone|email|call|get\s*quote)$/i.test(
        clean,
      )
    ) {
      return;
    }
    // Footer/legal links crowd the header and break layout.
    if (
      /privacy|terms|cookie|sitemap|disclaimer|refund|shipping|policy$/i.test(
        clean,
      )
    ) {
      return;
    }
    seen.add(key);
    links.push({ label: clean, href, kind: "page" });
  };

  push("Home", "#");
  for (const label of raw) {
    if (/^(home|index)$/i.test(label)) continue;
    const slug = cleanSlug(label);
    push(label, slug && slug !== "home" ? `#page-${slug}` : REDESIGN_VOID_HREF);
    // Hard cap — more than ~6 smash the header and block editor clicks.
    if (links.length >= 6) break;
  }

  return links;
}

function cleanSlug(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureArrayField(
  current: Record<string, unknown>,
  key: string,
): void {
  const value = current[key];
  if (value == null) return;
  if (Array.isArray(value)) return;
  // Corrupted object/string from merge — drop so components don't crash.
  current[key] = [];
}

function stampRedesignHeaderMenu(
  current: Record<string, unknown>,
  theme: BuiltSiteTheme,
) {
  const menu = buildRedesignDomainNavLinks(theme).map(({ label, href }) => ({
    label,
    href,
  }));
  current.menu = menu;
}

function patchString(
  current: Record<string, unknown>,
  key: string,
  value: string,
  overwrite: boolean,
) {
  if (!value) return;
  const existing = current[key];
  if (
    !overwrite &&
    typeof existing === "string" &&
    existing.trim() &&
    !/lorem|placeholder|your (company|brand)|sample/i.test(existing)
  ) {
    return;
  }
  current[key] = value;
}

function patchBannerImages(
  current: Record<string, unknown>,
  images: string[],
  brand: string,
) {
  if (!images.length) return;
  const hero = images[0];
  patchString(current, "backgroundImage", hero, true);
  patchString(current, "backgroundImageTitle", brand || "Hero", true);
  patchString(current, "image", hero, true);
  patchString(current, "imageUrl", hero, true);

  if (Array.isArray(current.slides)) {
    current.slides = (current.slides as unknown[]).map((slide, i) => {
      if (!slide || typeof slide !== "object") return slide;
      const next = { ...(slide as Record<string, unknown>) };
      const img = images[i % images.length];
      if (img) {
        next.image = img;
        if (!next.alt) next.alt = brand || "Slide";
      }
      return next;
    });
  }

  if (Array.isArray(current.blocks)) {
    current.blocks = (current.blocks as unknown[]).map((block) => {
      if (!block || typeof block !== "object") return block;
      const next = { ...(block as Record<string, unknown>) };
      if (next.type === "image" || next.role === "background" || next.role === "image") {
        next.src = hero;
        next.url = hero;
        next.content = hero;
      }
      return next;
    });
  }
}

function patchBrandCopy(
  current: Record<string, unknown>,
  theme: BuiltSiteTheme,
  sectionType: string,
  overwrite = true,
) {
  const brand = (theme.brandName || "").trim();
  const tagline = (theme.tagline || theme.headings?.[0] || "").trim();
  const desc = (
    theme.description ||
    theme.paragraphs?.[0] ||
    ""
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);

  if (brand) {
    patchString(current, "logo", brand, true);
    if (/banner|hero|header/i.test(sectionType)) {
      patchString(current, "title", brand, overwrite);
      patchString(current, "heading", brand, overwrite);
    }
  }
  if (tagline) {
    patchString(current, "subtitle", tagline, overwrite);
    patchString(current, "subheading", tagline, overwrite);
    patchString(current, "tagline", tagline, overwrite);
  }
  if (desc) {
    patchString(current, "desc", desc, overwrite);
    patchString(current, "description", desc, overwrite);
    patchString(current, "text", desc, overwrite);
  }

  const features = theme.features || [];
  if (features.length && Array.isArray(current.items)) {
    current.items = (current.items as unknown[]).map((item, i) => {
      if (!item || typeof item !== "object") return item;
      const f = features[i % features.length];
      if (!f) return item;
      return {
        ...(item as Record<string, unknown>),
        title: f.title || (item as Record<string, unknown>).title,
        description:
          f.description || (item as Record<string, unknown>).description,
        desc: f.description || (item as Record<string, unknown>).desc,
      };
    });
  }
}

/** Apply full domain extract onto template section data. */
export function applyRedesignDomainToSections<T extends SectionLike>(
  sections: T[],
  theme: BuiltSiteTheme | null | undefined,
): T[] {
  if (!theme) return sections;

  const brand = (theme.brandName || "").trim();
  const images = [
    ...(theme.contentImages || []),
    theme.heroImage || "",
  ].filter((u) => typeof u === "string" && /^https?:\/\//i.test(u.trim()));

  let next = applyBrandLogoToSections(sections, {
    logoImage: theme.logoImage || "",
    logoName: brand || "Logo",
    brandName: brand,
    overwrite: true,
  });
  next = applyBrandContactToSections(next, {
    email: theme.contactEmail || "",
    phone: theme.contactPhone || "",
    address: theme.contactAddress || "",
    overwrite: true,
  });
  next = applyBrandAboutContentToSections(next, {
    description:
      theme.description || theme.paragraphs?.[0] || theme.tagline || "",
    overwrite: true,
  });

  return next.map((section) => {
    const type = section.type || "";
    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => {
        const current = {
          ...((variantData || {}) as Record<string, unknown>),
        };
        patchBrandCopy(current, theme, type);
        if (/banner|hero|about|gallery|feature|service|property/i.test(type)) {
          patchBannerImages(current, images, brand);
        }
        if (/^header$/i.test(type)) {
          stampRedesignHeaderMenu(current, theme);
        }
        // Keep list fields as arrays — corrupt merges crash the editor (items.map).
        ensureArrayField(current, "whyChooseUsItems");
        ensureArrayField(current, "items");
        ensureArrayField(current, "galleryItems");
        ensureArrayField(current, "faqItems");
        ensureArrayField(current, "features");
        ensureArrayField(current, "slides");
        ensureArrayField(current, "menu");
        return [variant, current];
      }),
    );
    return { ...section, data: nextData };
  });
}
