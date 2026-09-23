import { getActiveRedesignDesignId, redesignStorageKey } from "@/lib/redesign-design-id";

export const BUILT_SITE_THEME_KEY = "lestow-redesign-built-site";
export const BUILT_SITE_HTML_KEY = "lestow-redesign-built-html";
export const BUILT_SITE_SECTIONS_KEY = "lestow-redesign-built-sections";

function themeKey(designId?: string | null) {
  return redesignStorageKey(BUILT_SITE_THEME_KEY, designId);
}
function htmlKey(designId?: string | null) {
  return redesignStorageKey(BUILT_SITE_HTML_KEY, designId);
}
function sectionsKey(designId?: string | null) {
  return redesignStorageKey(BUILT_SITE_SECTIONS_KEY, designId);
}

function writeScopedStorage(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* quota — try local only */
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota / private mode */
  }
  // Always mirror large clone payloads to IndexedDB (survives quota).
  if (value.length > 200_000) {
    void writeIdb(key, value);
  }
}

const IDB_NAME = "lestow-redesign";
const IDB_STORE = "kv";

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("idb open failed"));
  });
}

async function writeIdb(key: string, value: string) {
  try {
    const db = await openIdb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("idb write failed"));
    });
    db.close();
  } catch {
    /* ignore */
  }
}

async function readIdb(key: string): Promise<string | null> {
  try {
    const db = await openIdb();
    const value = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(typeof req.result === "string" ? req.result : null);
      req.onerror = () => reject(req.error || new Error("idb read failed"));
    });
    db.close();
    return value;
  } catch {
    return null;
  }
}

function readScopedStorage(key: string): string | null {
  const fromSession = window.sessionStorage.getItem(key);
  if (fromSession) return fromSession;
  try {
    const fromLocal = window.localStorage.getItem(key);
    if (fromLocal) {
      try {
        window.sessionStorage.setItem(key, fromLocal);
      } catch {
        /* ignore */
      }
      return fromLocal;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** When designId is explicit, read only that design — never bleed from another run. */
function readDesignScopedStorage(baseKey: string, designId?: string | null): string | null {
  const explicit = (designId || "").trim();
  if (explicit) return readScopedStorage(redesignStorageKey(baseKey, explicit));

  const active = (getActiveRedesignDesignId() || "").trim();
  if (active) {
    const fromActive = readScopedStorage(redesignStorageKey(baseKey, active));
    if (fromActive) return fromActive;
  }

  return readScopedStorage(baseKey);
}

/** Keep preview-in-new-tab working — sessionStorage is per-tab, localStorage is shared. */
export function mirrorBuiltSiteCache(designId?: string | null) {
  if (typeof window === "undefined") return;
  const id = (designId || getActiveRedesignDesignId() || "").trim();
  if (!id) return;
  for (const base of [BUILT_SITE_THEME_KEY, BUILT_SITE_SECTIONS_KEY, BUILT_SITE_HTML_KEY]) {
    const key = redesignStorageKey(base, id);
    const value = window.sessionStorage.getItem(key);
    if (value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* ignore */
      }
    }
  }
}

export type SiteFeature = {
  title: string;
  description: string;
};

export type BuiltSiteSectionItem = {
  id: string;
  label: string;
  html: string;
};

export type BuiltSiteSectionsHtml = {
  /** Dynamic sections copied/inspired from the reference site */
  items: BuiltSiteSectionItem[];
  /** Legacy fields kept for older UI readers */
  header?: string;
  banner?: string;
  features?: string;
  footer?: string;
};

export type BuiltSiteSectionPlan = {
  id: string;
  label: string;
  hint: string;
  uiBlueprint?: string;
  layout?: string;
};

export type BuiltSiteTheme = {
  brandName: string;
  headline: string;
  headlineAccent: string;
  tagline: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  features: SiteFeature[];
  navItems: string[];
  categories?: string[];
  ctaButtons: string[];
  listItems: string[];
  heroImage: string;
  logoImage?: string;
  contentImages?: string[];
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  contactPhones?: string[];
  contactEmails?: string[];
  sectionsTitle: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  buttonRadius: string;
  heroLayout: "left" | "center";
  headerStyle: "light" | "dark";
  referenceSiteName: string;
  /** Menu labels copied from reference IA (preferred for redesign header) */
  referenceNavItems?: string[];
  domainUrl: string;
  referenceUrl: string;
  sectionPlan?: BuiltSiteSectionPlan[];
  /** clone-swap | template-library | … */
  buildMode?: string;
  /** Uploaded template library (Shuffle-style redesign) */
  templateId?: string;
  templateCategory?: string;
  composePreviewUrl?: string;
  referenceMotion?: {
    hasHeroSlider: boolean;
    hasTicker: boolean;
    hasTabs: boolean;
    hasAccordion: boolean;
    hasLogoCarousel: boolean;
    hasScrollAnimations: boolean;
    libraries: string[];
    notes: string[];
  };
};

export function saveBuiltSiteTheme(theme: BuiltSiteTheme, designId?: string | null) {
  if (typeof window === "undefined") return;
  writeScopedStorage(themeKey(designId), JSON.stringify(theme));
}

export function getBuiltSiteTheme(designId?: string | null): BuiltSiteTheme | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = readDesignScopedStorage(BUILT_SITE_THEME_KEY, designId);
    if (!raw) return null;
    return JSON.parse(raw) as BuiltSiteTheme;
  } catch {
    return null;
  }
}

export function saveBuiltSiteHtml(html: string, designId?: string | null) {
  if (typeof window === "undefined") return;
  writeScopedStorage(htmlKey(designId), html);
}

export function getBuiltSiteHtml(designId?: string | null): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = readDesignScopedStorage(BUILT_SITE_HTML_KEY, designId);
    return raw && raw.includes("<html") ? raw : null;
  } catch {
    return null;
  }
}

export function clearBuiltSiteHtml() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(htmlKey());
  window.sessionStorage.removeItem(BUILT_SITE_HTML_KEY);
}

export function saveBuiltSiteSections(sections: BuiltSiteSectionsHtml, designId?: string | null) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(sections);
  writeScopedStorage(sectionsKey(designId), raw);
  // Clone docs are huge — always IDB backup so editor does not open empty.
  void writeIdb(sectionsKey(designId), raw);
}

export function getBuiltSiteSections(designId?: string | null): BuiltSiteSectionsHtml | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = readDesignScopedStorage(BUILT_SITE_SECTIONS_KEY, designId);
    if (!raw) return null;
    return parseSectionsRaw(raw);
  } catch {
    return null;
  }
}

function parseSectionsRaw(raw: string): BuiltSiteSectionsHtml | null {
  try {
    const parsed = JSON.parse(raw) as Partial<BuiltSiteSectionsHtml> & {
      header?: string;
      banner?: string;
      features?: string;
      footer?: string;
    };

    if (Array.isArray(parsed.items) && parsed.items.length) {
      const items = parsed.items.filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.label === "string" &&
          typeof item.html === "string",
      );
      if (!items.length) return null;
      return {
        items,
        header: items.find((item) => item.id === "header")?.html,
        banner: items.find((item) => /banner|hero/i.test(item.id))?.html,
        features: items.find((item) => /feature/i.test(item.id))?.html,
        footer: items.find((item) => item.id === "footer")?.html,
      };
    }

    if (
      typeof parsed.header === "string" &&
      typeof parsed.banner === "string" &&
      typeof parsed.features === "string" &&
      typeof parsed.footer === "string"
    ) {
      return {
        items: [
          { id: "header", label: "Header", html: parsed.header },
          { id: "banner", label: "Banner", html: parsed.banner },
          { id: "features", label: "Features", html: parsed.features },
          { id: "footer", label: "Footer", html: parsed.footer },
        ],
        header: parsed.header,
        banner: parsed.banner,
        features: parsed.features,
        footer: parsed.footer,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Async hydrate for large clone sections stored in IndexedDB after quota miss. */
export async function hydrateBuiltSiteSections(
  designId?: string | null,
): Promise<BuiltSiteSectionsHtml | null> {
  if (typeof window === "undefined") return null;
  const sync = getBuiltSiteSections(designId);
  if (sync?.items?.length) return sync;
  const key = sectionsKey(designId);
  const raw = (await readIdb(key)) || null;
  if (!raw) return null;
  try {
    window.sessionStorage.setItem(key, raw);
  } catch {
    /* ignore */
  }
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    /* ignore */
  }
  return parseSectionsRaw(raw);
}

export function clearBuiltSiteSections(designId?: string | null) {
  if (typeof window === "undefined") return;
  const key = sectionsKey(designId);
  window.sessionStorage.removeItem(key);
  window.sessionStorage.removeItem(BUILT_SITE_SECTIONS_KEY);
  try {
    window.localStorage.removeItem(key);
    window.localStorage.removeItem(BUILT_SITE_SECTIONS_KEY);
  } catch {
    /* ignore */
  }
  void writeIdb(key, "");
}

export function builtSiteCssVariables(theme: BuiltSiteTheme): Record<string, string> {
  return {
    "--built-primary": theme.primaryColor,
    "--built-accent": theme.accentColor,
    "--built-bg": theme.backgroundColor,
    "--built-text": theme.textColor,
    "--built-font": theme.fontFamily,
    "--built-button-radius": theme.buttonRadius,
  };
}

export function createFallbackTheme(input: {
  websiteName?: string;
  domainUrl?: string;
  referenceUrl?: string;
  vision?: string;
}): BuiltSiteTheme {
  const vision = (input.vision || "").replace(/\s+/g, " ").trim();
  const junkVision =
    vision.length < 24 ||
    /^(redesign|rebuild|new website|website|home|build|make|create|update)(\s+\w+){0,4}$/i.test(
      vision,
    );
  return {
    brandName: input.websiteName || "Your Website",
    headline: input.websiteName || "Welcome to your new homepage",
    headlineAccent: "",
    tagline: "Built from your existing content",
    description: junkVision
      ? "Your redesigned homepage is ready to preview."
      : vision || "Your redesigned homepage is ready to preview.",
    headings: [],
    paragraphs: [],
    features: [],
    navItems: ["Home", "Services", "About", "Contact"],
    categories: ["Home", "Services", "About", "Contact"],
    ctaButtons: ["Get Started", "Contact Us"],
    listItems: [],
    heroImage: "",
    logoImage: "",
    contentImages: [],
    sectionsTitle: "What we offer",
    primaryColor: "#0f766e",
    accentColor: "#c2410c",
    backgroundColor: "#f4f7f6",
    textColor: "#101214",
    fontFamily: "Georgia, 'Times New Roman', serif",
    buttonRadius: "10px",
    heroLayout: "left",
    headerStyle: "light",
    referenceSiteName: "Reference site",
    domainUrl: input.domainUrl || input.websiteName || "",
    referenceUrl: input.referenceUrl || "",
  };
}
