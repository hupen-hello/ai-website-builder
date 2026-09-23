/**
 * Redesign home = custom-layouts components only (not template/theme defaults).
 * Domain logo/content is stamped separately via applyRedesignDomainToSections.
 */

import { createAddableSection } from "@/app/editor/layout/src/data/templateFlow";
import type { BuiltSiteTheme } from "@/lib/built-site-theme";
import { applyRedesignDomainToSections } from "@/lib/apply-redesign-domain";

const HOME_SECTION_ORDER = [
  "Topbar",
  "Header",
  "Banner",
  "About",
  "Product",
  "WhyChooseUs",
  "Gallery",
  "Testimonial",
  "FAQ",
  "FormDetail",
  "Footer",
] as const;

type SectionItem = {
  id: string;
  type: string;
  variant: string;
  page?: string;
  data: Record<string, Record<string, unknown>>;
};

/** Assemble Home from picked custom-layouts variants only. */
export function buildRedesignHomeFromLayouts(
  category: string,
  sectionVariants: Record<string, string>,
  theme?: BuiltSiteTheme | null,
): SectionItem[] {
  const built: SectionItem[] = [];
  const usedTypes = new Set<string>();

  const tryAdd = (type: string, variant?: string) => {
    if (usedTypes.has(type)) return;
    const key = (variant || sectionVariants[type] || "").trim();
    if (!key && type !== "Header" && type !== "Banner" && type !== "Footer") {
      return;
    }
    const section = createAddableSection(type, category, key || undefined);
    if (!section) return;
    usedTypes.add(type);
    built.push({
      id: section.id,
      type: section.type,
      variant: section.variant,
      page: section.page,
      data: section.data as Record<string, Record<string, unknown>>,
    });
  };

  // Prefer explicit picks first (stable order).
  for (const type of HOME_SECTION_ORDER) {
    if (sectionVariants[type]) tryAdd(type, sectionVariants[type]);
  }
  // Always try core chrome even if pick missed them.
  for (const type of ["Header", "Banner", "Footer"] as const) {
    tryAdd(type);
  }

  if (!built.length) return [];

  return theme ? applyRedesignDomainToSections(built, theme) : built;
}

const SECTIONS_KEY = "lestow-redesign-editor-sections";

export function saveRedesignEditorSections(
  designId: string,
  sections: SectionItem[],
) {
  if (typeof window === "undefined" || !designId) return;
  try {
    const raw = JSON.stringify({ designId, sections, savedAt: Date.now() });
    // localStorage so refresh keeps the redesign (sessionStorage was too fragile / quota).
    window.localStorage.setItem(`${SECTIONS_KEY}:${designId}`, raw);
    window.localStorage.setItem(SECTIONS_KEY, raw);
    window.sessionStorage.setItem(`${SECTIONS_KEY}:${designId}`, raw);
    window.sessionStorage.setItem(SECTIONS_KEY, raw);
  } catch {
    try {
      // Retry slim: drop heavy nested blobs if quota hit
      const slim = sections.map((s) => ({
        id: s.id,
        type: s.type,
        variant: s.variant,
        page: s.page,
        data: s.data,
      }));
      const raw = JSON.stringify({ designId, sections: slim, savedAt: Date.now() });
      window.localStorage.setItem(`${SECTIONS_KEY}:${designId}`, raw);
    } catch {
      /* ignore */
    }
  }
}

export function readRedesignEditorSections(
  designId?: string | null,
): SectionItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const id = (designId || "").trim();
    const raw =
      (id && window.localStorage.getItem(`${SECTIONS_KEY}:${id}`)) ||
      (id && window.sessionStorage.getItem(`${SECTIONS_KEY}:${id}`)) ||
      (!id
        ? window.localStorage.getItem(SECTIONS_KEY) ||
          window.sessionStorage.getItem(SECTIONS_KEY)
        : null);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      designId?: string;
      sections?: SectionItem[];
    };
    if (id && parsed.designId && parsed.designId !== id) return null;
    if (!Array.isArray(parsed.sections) || !parsed.sections.length) return null;
    return parsed.sections;
  } catch {
    return null;
  }
}

export function clearAllRedesignEditorSections(): void {
  if (typeof window === "undefined") return;
  try {
    const stores = [window.localStorage, window.sessionStorage];
    for (const store of stores) {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (key && key.startsWith(SECTIONS_KEY)) keys.push(key);
      }
      for (const key of keys) store.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}
