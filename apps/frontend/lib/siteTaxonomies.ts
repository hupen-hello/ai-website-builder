/** Per-site editor category/type lists — local cache synced into Site.config.taxonomies */

export type SiteTaxonomies = {
  galleryCategories?: string[];
  teamCategories?: string[];
  portfolioCategories?: string[];
  blogCategories?: string[];
  serviceCategories?: string[];
  eventCategories?: string[];
  propertyCategories?: string[];
  propertyTypes?: unknown[];
  propertyListingTypes?: unknown[];
};

const LEGACY_KEYS: Record<keyof SiteTaxonomies, string> = {
  galleryCategories: "ai-builder-gallery-categories",
  teamCategories: "ai-builder-team-categories",
  portfolioCategories: "ai-builder-portfolio-categories",
  blogCategories: "ai-builder-blog-categories",
  serviceCategories: "ai-builder-service-categories",
  eventCategories: "ai-builder-event-categories",
  propertyCategories: "ai-builder-property-categories",
  propertyTypes: "ai-builder-property-types",
  propertyListingTypes: "ai-builder-property-listing-types",
};

function legacyKey(prefix: string, siteId?: string | null) {
  return `${prefix}:${siteId || "draft"}`;
}

function readJsonArray(storageKey: string): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonArray(storageKey: string, value: unknown[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Collect current taxonomy lists from localStorage for a site. */
export function readSiteTaxonomiesFromLocal(
  siteId?: string | null,
): SiteTaxonomies {
  const id = siteId || "draft";
  return {
    galleryCategories: asStringList(
      readJsonArray(legacyKey(LEGACY_KEYS.galleryCategories, id)),
    ),
    teamCategories: asStringList(
      readJsonArray(legacyKey(LEGACY_KEYS.teamCategories, id)),
    ),
    portfolioCategories: asStringList(
      readJsonArray(legacyKey(LEGACY_KEYS.portfolioCategories, id)),
    ),
    blogCategories: asStringList(
      readJsonArray(legacyKey(LEGACY_KEYS.blogCategories, id)),
    ),
    serviceCategories: asStringList(
      readJsonArray(legacyKey(LEGACY_KEYS.serviceCategories, id)),
    ),
    eventCategories: asStringList(
      readJsonArray(legacyKey(LEGACY_KEYS.eventCategories, id)),
    ),
    propertyCategories: asStringList(
      readJsonArray(legacyKey(LEGACY_KEYS.propertyCategories, id)),
    ),
    propertyTypes: readJsonArray(legacyKey(LEGACY_KEYS.propertyTypes, id)),
    propertyListingTypes: readJsonArray(
      legacyKey(LEGACY_KEYS.propertyListingTypes, id),
    ),
  };
}

function hasTaxonomyData(taxonomies: SiteTaxonomies | null | undefined) {
  if (!taxonomies) return false;
  return Object.values(taxonomies).some(
    (value) => Array.isArray(value) && value.length > 0,
  );
}

/** Hydrate localStorage keys from DB Site.config.taxonomies (after site load). */
export function hydrateSiteTaxonomiesToLocal(
  siteId: string | null | undefined,
  taxonomies: SiteTaxonomies | null | undefined,
) {
  if (!siteId || typeof window === "undefined" || !hasTaxonomyData(taxonomies)) {
    return;
  }

  (Object.keys(LEGACY_KEYS) as (keyof SiteTaxonomies)[]).forEach((field) => {
    const value = taxonomies?.[field];
    if (!Array.isArray(value) || value.length === 0) return;
    writeJsonArray(legacyKey(LEGACY_KEYS[field], siteId), value);
  });
}

export function normalizeSiteTaxonomies(
  value: unknown,
): SiteTaxonomies | null {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  if (!record) return null;

  const next: SiteTaxonomies = {};
  (Object.keys(LEGACY_KEYS) as (keyof SiteTaxonomies)[]).forEach((field) => {
    if (!(field in record)) return;
    const raw = record[field];
    if (!Array.isArray(raw)) return;
    if (
      field === "propertyTypes" ||
      field === "propertyListingTypes"
    ) {
      next[field] = raw;
    } else {
      next[field] = asStringList(raw);
    }
  });

  return hasTaxonomyData(next) ? next : null;
}
