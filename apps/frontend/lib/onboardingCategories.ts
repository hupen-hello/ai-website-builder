import type { OnboardingWebsiteRelated } from "@/lib/onboardingDraft";

export type OnboardingCategory = {
  id: string;
  order: number;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  status?: string | null;
  /** Optional admin-assigned website-related type */
  type?: string | null;
  /** Canonical content-bundle name used for templates (when known). */
  contentName?: string;
};

const RELATED_KEYWORDS: Record<
  Exclude<OnboardingWebsiteRelated, "">,
  RegExp
> = {
  "service-provider":
    /service|repair|beauty|health|wellness|travel|financial|automotive|pet|professional|event|maintenance|realestate|school|business|home|consult/i,
  products:
    /product|shop|ecommerce|fashion|business|automotive|retail|store|commerce/i,
  blog: /blog|school|business|portfolio|media|content|news|magazine/i,
  ngo: /ngo|non.?profit|charity|school|health|community|foundation|volunteer|welfare|social|home\s*services|event\s*services|pet\s*services|other\s*services/i,
  "campaign-page":
    /campaign|event|business|school|product|marketing|landing|promo/i,
};

function isActive(category: OnboardingCategory) {
  const status = (category.status || "Active").trim().toLowerCase();
  return status === "active";
}

/** Prefer explicit `type` from API; otherwise match name/slug/description keywords. */
export function categoryMatchesWebsiteRelated(
  category: OnboardingCategory,
  websiteRelated: OnboardingWebsiteRelated | "" | null | undefined,
): boolean {
  if (!websiteRelated) return true;

  const type = (category.type || "").trim().toLowerCase();
  if (type) {
    return (
      type === websiteRelated.toLowerCase() ||
      type.replace(/_/g, "-") === websiteRelated.toLowerCase()
    );
  }

  const pattern = RELATED_KEYWORDS[websiteRelated];
  if (!pattern) return true;

  const haystack = [category.name, category.slug, category.description || ""]
    .join(" ")
    .toLowerCase();
  return pattern.test(haystack);
}

export function filterOnboardingCategories(
  categories: OnboardingCategory[],
  websiteRelated?: OnboardingWebsiteRelated | "" | null,
): OnboardingCategory[] {
  const active = categories.filter(isActive);
  // Campaign can be for any niche — show every active category.
  if (!websiteRelated || websiteRelated === "campaign-page") return active;

  const related = active.filter((category) =>
    categoryMatchesWebsiteRelated(category, websiteRelated),
  );
  // If nothing matches the selected site type, still show every active category.
  return related.length > 0 ? related : active;
}

/**
 * Keep only categories that have template/theme content available
 * (matched by name or slug). Categories without a theme are hidden.
 */
export function preferCategoriesWithContent(
  categories: OnboardingCategory[],
  contentCategories: Array<{ name: string; slug?: string | null }>,
): OnboardingCategory[] {
  if (!contentCategories.length) return categories;

  const byName = new Map(
    contentCategories.map((item) => [item.name.trim().toLowerCase(), item.name]),
  );
  const bySlug = new Map(
    contentCategories
      .filter((item) => item.slug)
      .map((item) => [String(item.slug).trim().toLowerCase(), item.name]),
  );

  const withContent = categories
    .map((category) => {
      const contentName =
        byName.get(category.name.trim().toLowerCase()) ||
        bySlug.get(category.slug.trim().toLowerCase());
      if (!contentName) return null;
      return { ...category, contentName, name: contentName };
    })
    .filter((category): category is OnboardingCategory => Boolean(category));

  // Never show a category that has no theme/template content.
  return withContent;
}

export async function fetchOnboardingCategories(
  signal?: AbortSignal,
): Promise<OnboardingCategory[]> {
  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  const tryUrls = ["/api/categories", `${backend}/categories`];

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { cache: "no-store", signal });
      if (!res.ok) continue;
      const data = (await res.json()) as unknown;
      if (!Array.isArray(data)) continue;
      return data
        .filter(
          (row): row is OnboardingCategory =>
            Boolean(row) &&
            typeof row === "object" &&
            typeof (row as OnboardingCategory).name === "string" &&
            typeof (row as OnboardingCategory).slug === "string",
        )
        .map((row) => ({
          id: String((row as { id?: string }).id || row.slug),
          order: Number(row.order) || 0,
          name: row.name.trim(),
          slug: row.slug.trim(),
          icon: row.icon ?? null,
          description: row.description ?? null,
          status: row.status ?? "Active",
          type:
            typeof (row as { type?: unknown }).type === "string"
              ? String((row as { type: string }).type)
              : null,
        }))
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    } catch {
      /* try next */
    }
  }

  return [];
}
