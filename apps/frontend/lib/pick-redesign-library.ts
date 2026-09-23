/**
 * Auto-pick an uploaded category + template for Redesign.
 * Primary niche wins — industry chips (e.g. “we serve Real Estate”) must not
 * override an agency / web-design business like cssfounder.com.
 */

import {
  getCategoriesForOnboarding,
  getTemplatesForCategory,
  refreshCategoryContentFromApi,
} from "@/app/editor/layout/src/data/templateFlow";

export type RedesignLibraryPick = {
  category: string;
  templateId: string;
  templateName: string;
};

/** Ordered by priority — first match wins. Agency/web before Realestate. */
const KEYWORD_CATEGORY: Array<{ re: RegExp; category: string }> = [
  {
    re: /\b(web\s*design|website\s*design|website\s*develop|web\s*develop|digital\s*agency|creative\s*agency|it\s*(company|services)|software\s*(company|agency)|css\s*founder|ui\/?ux|hire\s+(developer|designer)|psd\s*to\s*html)\b/i,
    category: "Business",
  },
  {
    re: /\b(agency|studio|consultancy|consulting|marketing\s*agency|branding)\b/i,
    category: "Business",
  },
  { re: /\b(school|college|education|cbse|campus|admission)\b/i, category: "School" },
  { re: /\b(hospital|clinic|doctor|medical|healthcare)\b/i, category: "Hospitals" },
  {
    re: /\b(realtor|real\s*estate\s+(agency|agent|broker|company)|property\s+(dealer|listing|for\s+sale|management)|buy\s*(a\s*)?(home|flat|apartment)|housing\s+society)\b/i,
    category: "Realestate",
  },
  { re: /\b(e-?commerce|online\s*store|shopify)\b/i, category: "Ecommerce" },
  { re: /\b(portfolio|freelancer|personal\s*brand)\b/i, category: "Portfolio" },
  { re: /\b(ngo|charity|nonprofit|non-profit)\b/i, category: "NGO" },
  { re: /\b(business|company|services|corporate)\b/i, category: "Business" },
];

const FALLBACK_ORDER = ["Business", "Portfolio", "School", "Ecommerce", "Realestate"];

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function resolveCategoryName(
  wanted: string,
  cats: ReturnType<typeof getCategoriesForOnboarding>,
): string | null {
  const match = cats.find(
    (c) =>
      normalizeName(c.name) === normalizeName(wanted) ||
      normalizeName(c.slug || "") === normalizeName(wanted) ||
      normalizeName(c.name).includes(normalizeName(wanted)) ||
      normalizeName(wanted).includes(normalizeName(c.name)),
  );
  if (match && getTemplatesForCategory(match.name).length) return match.name;
  return null;
}

function findCategoryByHint(hint: string): string | null {
  const cats = getCategoriesForOnboarding();
  if (!cats.length) return null;

  for (const row of KEYWORD_CATEGORY) {
    if (!row.re.test(hint)) continue;
    const resolved = resolveCategoryName(row.category, cats);
    if (resolved) return resolved;
  }

  for (const name of FALLBACK_ORDER) {
    const resolved = resolveCategoryName(name, cats);
    if (resolved) return resolved;
  }

  const withTemplates = cats.find((c) => getTemplatesForCategory(c.name).length > 0);
  return withTemplates?.name || cats[0]?.name || null;
}

/** Resolve library pack from vision / websiteRelated / brand copy. */
export async function pickRedesignLibraryPack(options: {
  vision?: string;
  websiteRelated?: string;
  brandName?: string;
  description?: string;
  domainUrl?: string;
  preferredCategory?: string;
  preferredTemplateId?: string;
}): Promise<RedesignLibraryPick | null> {
  await refreshCategoryContentFromApi();

  const hint = [
    options.brandName,
    options.description,
    options.vision,
    options.websiteRelated,
    options.domainUrl,
  ]
    .filter(Boolean)
    .join(" ");

  let category =
    (options.preferredCategory || "").trim() ||
    findCategoryByHint(hint) ||
    "";

  if (!category) return null;

  let templates = getTemplatesForCategory(category);
  if (!templates.length) {
    // Niche category exists (e.g. Business) but no template linked yet — borrow any active template for variants only.
    const all = getBuilderTemplates().filter(
      (t) => !t.status || t.status === "Active",
    );
    templates = all;
  }
  if (!templates.length) {
    const fallback = findCategoryByHint("business company services");
    if (!fallback) return null;
    category = fallback;
    templates = getTemplatesForCategory(category);
  }
  if (!templates.length) return null;

  const preferred = (options.preferredTemplateId || "").trim();
  const chosen =
    (preferred && templates.find((t) => t.id === preferred)) || templates[0];

  return {
    category,
    templateId: chosen.id,
    templateName: chosen.name || chosen.id,
  };
}
