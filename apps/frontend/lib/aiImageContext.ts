/**
 * Shared category + region hints for AI stock image search.
 */

export type CountryHint = {
  code: string;
  name: string;
  region: string;
  imageKeywords: string[];
  acceptLanguage: string;
};

export type CategoryImageHint = {
  id: string;
  label: string;
  imageKeywords: string[];
  stockImages: string[];
};

const COUNTRY_BY_CODE: Record<string, CountryHint> = {
  IN: {
    code: "IN",
    name: "India",
    region: "South Asia",
    imageKeywords: [
      "indian",
      "india",
      "mumbai",
      "delhi",
      "bangalore",
      "south asian",
    ],
    acceptLanguage: "en-IN",
  },
  PK: {
    code: "PK",
    name: "Pakistan",
    region: "South Asia",
    imageKeywords: ["pakistani", "pakistan", "karachi", "lahore"],
    acceptLanguage: "en-PK",
  },
  BD: {
    code: "BD",
    name: "Bangladesh",
    region: "South Asia",
    imageKeywords: ["bangladeshi", "bangladesh", "dhaka"],
    acceptLanguage: "en-BD",
  },
  AE: {
    code: "AE",
    name: "United Arab Emirates",
    region: "Middle East",
    imageKeywords: ["dubai", "uae", "emirates", "abu dhabi"],
    acceptLanguage: "en-AE",
  },
  SA: {
    code: "SA",
    name: "Saudi Arabia",
    region: "Middle East",
    imageKeywords: ["saudi", "riyadh", "jeddah"],
    acceptLanguage: "en-SA",
  },
  US: {
    code: "US",
    name: "United States",
    region: "North America",
    imageKeywords: ["american", "usa", "united states", "new york"],
    acceptLanguage: "en-US",
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    region: "Europe",
    imageKeywords: ["british", "uk", "london", "england"],
    acceptLanguage: "en-GB",
  },
  CA: {
    code: "CA",
    name: "Canada",
    region: "North America",
    imageKeywords: ["canadian", "canada", "toronto"],
    acceptLanguage: "en-CA",
  },
  AU: {
    code: "AU",
    name: "Australia",
    region: "Oceania",
    imageKeywords: ["australian", "australia", "sydney"],
    acceptLanguage: "en-AU",
  },
  SG: {
    code: "SG",
    name: "Singapore",
    region: "Southeast Asia",
    imageKeywords: ["singapore", "singaporean"],
    acceptLanguage: "en-SG",
  },
  MY: {
    code: "MY",
    name: "Malaysia",
    region: "Southeast Asia",
    imageKeywords: ["malaysian", "malaysia", "kuala lumpur"],
    acceptLanguage: "en-MY",
  },
  NP: {
    code: "NP",
    name: "Nepal",
    region: "South Asia",
    imageKeywords: ["nepali", "nepal", "kathmandu"],
    acceptLanguage: "en-NP",
  },
  LK: {
    code: "LK",
    name: "Sri Lanka",
    region: "South Asia",
    imageKeywords: ["sri lankan", "sri lanka", "colombo"],
    acceptLanguage: "en-LK",
  },
  NG: {
    code: "NG",
    name: "Nigeria",
    region: "Africa",
    imageKeywords: ["nigerian", "nigeria", "lagos"],
    acceptLanguage: "en-NG",
  },
  ZA: {
    code: "ZA",
    name: "South Africa",
    region: "Africa",
    imageKeywords: ["south african", "south africa", "johannesburg"],
    acceptLanguage: "en-ZA",
  },
  DE: {
    code: "DE",
    name: "Germany",
    region: "Europe",
    imageKeywords: ["german", "germany", "berlin"],
    acceptLanguage: "en-DE",
  },
  FR: {
    code: "FR",
    name: "France",
    region: "Europe",
    imageKeywords: ["french", "france", "paris"],
    acceptLanguage: "en-FR",
  },
};

const TIMEZONE_COUNTRY: Array<{ match: RegExp; code: string }> = [
  { match: /^Asia\/(Kolkata|Calcutta)$/i, code: "IN" },
  { match: /^Asia\/Karachi$/i, code: "PK" },
  { match: /^Asia\/Dhaka$/i, code: "BD" },
  { match: /^Asia\/(Dubai|Muscat)$/i, code: "AE" },
  { match: /^Asia\/Riyadh$/i, code: "SA" },
  { match: /^Asia\/Singapore$/i, code: "SG" },
  { match: /^Asia\/Kuala_Lumpur$/i, code: "MY" },
  { match: /^Asia\/Kathmandu$/i, code: "NP" },
  { match: /^Asia\/Colombo$/i, code: "LK" },
  { match: /^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix)$/i, code: "US" },
  { match: /^Europe\/London$/i, code: "GB" },
  { match: /^America\/Toronto$/i, code: "CA" },
  { match: /^Australia\//i, code: "AU" },
  { match: /^Africa\/Lagos$/i, code: "NG" },
  { match: /^Africa\/Johannesburg$/i, code: "ZA" },
  { match: /^Europe\/Berlin$/i, code: "DE" },
  { match: /^Europe\/Paris$/i, code: "FR" },
];

const CATEGORY_HINTS: Record<string, CategoryImageHint> = {
  school: {
    id: "school",
    label: "School",
    imageKeywords: [
      "school",
      "classroom",
      "students",
      "campus",
      "teachers",
      "education",
      "uniform",
    ],
    stockImages: [
      "/categories/school/bg11.jpg",
      "/categories/school/bg22.jpg",
      "/categories/school/bg33.png",
    ],
  },
  business: {
    id: "business",
    label: "Business",
    imageKeywords: [
      "office",
      "business",
      "corporate",
      "meeting",
      "startup",
      "workplace",
    ],
    stockImages: [
      "/categories/business/bg11.jpg",
      "/categories/business/bg22.jpg",
      "/categories/business/bg33.jpg",
    ],
  },
  realestate: {
    id: "realestate",
    label: "Real Estate",
    imageKeywords: [
      "house",
      "property",
      "apartment",
      "real estate",
      "home",
      "building",
    ],
    stockImages: [
      "/categories/realestate/bg11.jpg",
      "/categories/realestate/bg22.jpg",
      "/categories/realestate/bg33.jpg",
    ],
  },
};

function countryFromCode(code?: string | null): CountryHint | null {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  if (normalized === "UK") return COUNTRY_BY_CODE.GB;
  return COUNTRY_BY_CODE[normalized] || null;
}

export function resolveCountryHint(input: {
  country?: string | null;
  locale?: string | null;
  timeZone?: string | null;
}): CountryHint {
  const explicit = countryFromCode(input.country);
  if (explicit) return explicit;

  const timeZone = (input.timeZone || "").trim();
  for (const row of TIMEZONE_COUNTRY) {
    if (row.match.test(timeZone)) {
      const found = countryFromCode(row.code);
      if (found) return found;
    }
  }

  const locale = (input.locale || "").trim();
  const localeRegion = locale.match(/[-_]([A-Za-z]{2})$/)?.[1];
  const fromLocale = countryFromCode(localeRegion);
  if (fromLocale) return fromLocale;

  return COUNTRY_BY_CODE.IN;
}

export function resolveCategoryImageHint(
  raw?: string | null,
): CategoryImageHint {
  const key = (raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  if (key && CATEGORY_HINTS[key]) return CATEGORY_HINTS[key];
  if (key.includes("school") || key.includes("educat"))
    return CATEGORY_HINTS.school;
  if (key.includes("real") || key.includes("propert") || key.includes("estate"))
    return CATEGORY_HINTS.realestate;
  if (key.includes("business") || key.includes("corporat") || key.includes("agency"))
    return CATEGORY_HINTS.business;
  return CATEGORY_HINTS.school;
}

/**
 * Ordered search terms: demonym/region + category first so stock APIs match local context.
 */
export function buildLocalizedStockTerms(params: {
  category: CategoryImageHint;
  country: CountryHint;
  hintWords?: string[];
  extras?: string[];
}): string[] {
  const { category, country } = params;
  const hints = (params.hintWords || []).filter(Boolean).slice(0, 6);
  const extras = (params.extras || []).filter(Boolean).slice(0, 4);
  const cat = category.imageKeywords[0] || category.id;
  const demonym = country.imageKeywords[0] || country.name;
  const place = country.imageKeywords[1] || country.name;
  const scene = category.imageKeywords[1] || cat;

  const paired = [
    `${demonym} ${cat} ${scene}`,
    `${demonym} ${cat}`,
    `${demonym} ${scene}`,
    `${cat} ${demonym}`,
    `${category.label} ${country.name}`,
    `${place} ${cat}`,
    `${cat} ${country.name}`,
    `${demonym} ${category.imageKeywords[2] || scene}`,
    `${cat} ${country.region}`,
  ];

  const ordered = [
    ...paired,
    ...hints,
    ...category.imageKeywords,
    country.name,
    country.region,
    ...country.imageKeywords,
    ...extras,
    category.id,
  ];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ordered) {
    const cleaned = String(raw || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length < 2 || seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
    if (out.length >= 14) break;
  }
  return out;
}

export function clientLocalePayload(): {
  locale: string;
  timeZone: string;
} {
  let locale = "en-IN";
  let timeZone = "Asia/Kolkata";
  try {
    if (typeof navigator !== "undefined") {
      locale = navigator.language || locale;
    }
    timeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || timeZone;
  } catch {
    // keep defaults
  }
  return { locale, timeZone };
}
