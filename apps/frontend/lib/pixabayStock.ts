/**
 * Pixabay stock photo fallback (2nd after Magnific, before Pexels).
 * Requires PIXABAY_API_KEY in server env. Never expose the key to the client.
 * https://pixabay.com/api/docs/
 *
 * Uses demonym/city-first queries and prefers hits whose tags match place/category.
 */

const PIXABAY_BASE = "https://pixabay.com/api/";

export type PixabayImageBytes = {
  bytes: Buffer;
  extension: "png" | "jpg" | "webp";
  resourceId: number;
};

const recentlyUsedIds: number[] = [];
const RECENT_MAX = 64;

const PLACE_BOOST: Record<string, string[]> = {
  IN: [
    "indian",
    "india",
    "mumbai",
    "delhi",
    "bangalore",
    "bengaluru",
    "hyderabad",
    "chennai",
    "kolkata",
    "pune",
    "south asian",
  ],
  PK: ["pakistani", "pakistan", "karachi", "lahore", "islamabad"],
  BD: ["bangladeshi", "bangladesh", "dhaka"],
  AE: ["dubai", "uae", "emirates", "abu dhabi", "arab"],
  SA: ["saudi", "riyadh", "jeddah", "arab"],
  US: ["american", "usa", "united states", "new york", "california"],
  GB: ["british", "uk", "london", "england"],
  CA: ["canadian", "canada", "toronto", "vancouver"],
  AU: ["australian", "australia", "sydney", "melbourne"],
  SG: ["singapore", "singaporean"],
  MY: ["malaysian", "malaysia", "kuala lumpur"],
  NP: ["nepali", "nepal", "kathmandu"],
  LK: ["sri lankan", "sri lanka", "colombo"],
  NG: ["nigerian", "nigeria", "lagos"],
  ZA: ["south african", "south africa", "johannesburg", "cape town"],
  DE: ["german", "germany", "berlin"],
  FR: ["french", "france", "paris"],
};

const CATEGORY_SCENES: Record<string, string[]> = {
  school: [
    "classroom",
    "students",
    "children studying",
    "teacher",
    "campus",
    "school uniform",
    "education",
  ],
  business: [
    "office",
    "meeting",
    "corporate",
    "workplace",
    "startup team",
    "business people",
  ],
  realestate: [
    "house",
    "apartment",
    "home interior",
    "building exterior",
    "property",
    "modern home",
  ],
};

function rememberUsedId(id: number) {
  const existing = recentlyUsedIds.indexOf(id);
  if (existing >= 0) recentlyUsedIds.splice(existing, 1);
  recentlyUsedIds.push(id);
  while (recentlyUsedIds.length > RECENT_MAX) recentlyUsedIds.shift();
}

function getApiKey(): string | null {
  const key = (process.env.PIXABAY_API_KEY || "").trim();
  return key || null;
}

function extensionFromContentType(
  contentType: string,
): "png" | "jpg" | "webp" {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

export function pixabayBufferFingerprint(bytes: Buffer): string {
  const sample = bytes.subarray(0, Math.min(bytes.length, 2048));
  let hash = bytes.length;
  for (let i = 0; i < sample.length; i += 17) {
    hash = (hash * 33 + sample[i]) >>> 0;
  }
  return `${bytes.length}:${hash}`;
}

function normalizeTerm(raw: string): string {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueTerms(values: string[], limit = 20): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = normalizeTerm(raw);
    if (value.length < 2 || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
    if (out.length >= limit) break;
  }
  return out;
}

function resolveCategoryKey(categoryKeywords: string[]): string {
  const blob = categoryKeywords.join(" ").toLowerCase();
  if (
    blob.includes("school") ||
    blob.includes("education") ||
    blob.includes("student")
  ) {
    return "school";
  }
  if (
    blob.includes("realestate") ||
    blob.includes("real estate") ||
    blob.includes("property") ||
    blob.includes("house") ||
    blob.includes("apartment")
  ) {
    return "realestate";
  }
  return "business";
}

function buildLocalizedPixabayQueries(params: {
  terms: string[];
  categoryKeywords: string[];
  countryKeywords: string[];
  countryCode?: string;
}): string[] {
  const code = (params.countryCode || "").trim().toUpperCase();
  const places = uniqueTerms(
    [...(PLACE_BOOST[code] || []), ...params.countryKeywords],
    12,
  );
  const cats = uniqueTerms(params.categoryKeywords, 10);
  const categoryKey = resolveCategoryKey(cats);
  const scenes = CATEGORY_SCENES[categoryKey] || CATEGORY_SCENES.business;
  const demonym = places[0] || "";
  const countryName = places.find((p) => p.length > 4) || places[1] || demonym;
  const primaryCat = cats[0] || categoryKey;

  const queries: string[] = [];
  const seen = new Set<string>();
  const push = (q: string) => {
    const value = normalizeTerm(q);
    if (value.length < 5 || seen.has(value)) return;
    if (!places.some((p) => value.includes(p))) return;
    seen.add(value);
    queries.push(value);
  };

  for (const scene of scenes.slice(0, 5)) {
    if (demonym) push(`${demonym} ${primaryCat} ${scene}`);
    if (demonym) push(`${demonym} ${scene}`);
    if (countryName && countryName !== demonym) {
      push(`${countryName} ${primaryCat} ${scene}`);
    }
  }

  for (const cat of cats.slice(0, 4)) {
    if (demonym) {
      push(`${demonym} ${cat}`);
      push(`${cat} ${demonym}`);
    }
    for (const city of places.slice(0, 5)) {
      push(`${city} ${cat}`);
    }
  }

  for (const term of params.terms) {
    const value = normalizeTerm(term);
    if (value.includes(" ") && places.some((p) => value.includes(p))) {
      push(value);
    }
  }

  return queries.slice(0, 16);
}

async function downloadBytesFromUrl(
  url: string,
): Promise<Omit<PixabayImageBytes, "resourceId"> | null> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        Accept: "image/*",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("image")) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 1500) return null;
    return { bytes, extension: extensionFromContentType(contentType) };
  } catch {
    return null;
  }
}

type PixabayHit = {
  id?: number;
  tags?: string;
  largeImageURL?: string;
  webformatURL?: string;
  fullHDURL?: string;
  imageURL?: string;
};

async function searchPhotos(
  query: string,
  page: number,
): Promise<Array<{ id: number; url: string; tags: string }>> {
  const key = getApiKey();
  if (!key) return [];

  const params = new URLSearchParams();
  params.set("key", key);
  params.set("q", query);
  params.set("image_type", "photo");
  params.set("safesearch", "true");
  params.set("per_page", "30");
  params.set("page", String(Math.max(1, Math.min(page, 20))));
  // Prefer editors' choice when available for cleaner results
  if (page === 1 && Math.random() < 0.45) {
    params.set("editors_choice", "true");
  }

  const response = await fetch(`${PIXABAY_BASE}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return [];

  const json = (await response.json()) as { hits?: PixabayHit[] };
  const hits = Array.isArray(json?.hits) ? json.hits : [];
  const out: Array<{ id: number; url: string; tags: string }> = [];
  for (const hit of hits) {
    const id = Number(hit?.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    const url = (
      hit.largeImageURL ||
      hit.fullHDURL ||
      hit.webformatURL ||
      hit.imageURL ||
      ""
    ).trim();
    if (!url) continue;
    out.push({
      id,
      url,
      tags: typeof hit.tags === "string" ? hit.tags.toLowerCase() : "",
    });
  }
  return out;
}

function tokenHit(text: string, tokens: string[]): number {
  let hits = 0;
  for (const token of tokens) {
    if (token.length < 3) continue;
    if (text.includes(token)) hits += 1;
  }
  return hits;
}

function scoreHit(params: {
  tags: string;
  query: string;
  places: string[];
  categories: string[];
}): number {
  const { tags, query, places, categories } = params;
  let score = 0;
  score += tokenHit(tags, places) * 8;
  score += tokenHit(tags, categories) * 4;
  score += tokenHit(tags, query.split(/\s+/)) * 2;
  if (!tags) {
    score += places.some((p) => query.includes(p)) ? 3 : -5;
  }
  if (tags && places.length && tokenHit(tags, places) === 0) {
    score -= 6;
  }
  return score;
}

export type FetchPixabayOptions = {
  maxAttempts?: number;
  excludeIds?: Iterable<number>;
  excludeFingerprints?: Iterable<string>;
  categoryKeywords?: string[];
  countryKeywords?: string[];
  countryCode?: string;
};

export async function fetchPixabayStockImage(
  terms: string[],
  options?: FetchPixabayOptions,
): Promise<PixabayImageBytes | null> {
  if (!getApiKey()) return null;

  const categoryKeywords = options?.categoryKeywords || [];
  const countryKeywords = options?.countryKeywords || [];
  const countryCode = (options?.countryCode || "").trim().toUpperCase();
  const places = uniqueTerms(
    [...(PLACE_BOOST[countryCode] || []), ...countryKeywords],
    14,
  );
  const categories = uniqueTerms(categoryKeywords, 12);

  const queries = buildLocalizedPixabayQueries({
    terms,
    categoryKeywords,
    countryKeywords,
    countryCode,
  });
  if (!queries.length) return null;

  const maxAttempts = options?.maxAttempts ?? 12;
  const triedIds = new Set<number>([
    ...recentlyUsedIds,
    ...(options?.excludeIds ? Array.from(options.excludeIds) : []),
  ]);
  const excludeFingerprints = new Set(
    options?.excludeFingerprints
      ? Array.from(options.excludeFingerprints)
      : [],
  );

  type Candidate = {
    id: number;
    url: string;
    tags: string;
    score: number;
  };

  const ranked: Candidate[] = [];

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const query = queries[attempt % queries.length];
    const page = 1 + Math.floor(attempt / Math.max(queries.length, 1));

    let photos: Array<{ id: number; url: string; tags: string }> = [];
    try {
      photos = await searchPhotos(query, page);
    } catch {
      continue;
    }
    if (!photos.length) continue;

    for (const photo of photos) {
      if (triedIds.has(photo.id)) continue;
      const score = scoreHit({
        tags: photo.tags,
        query,
        places,
        categories,
      });
      if (attempt < queries.length && score < 2) continue;
      ranked.push({ ...photo, score });
      triedIds.add(photo.id);
    }

    ranked.sort((a, b) => b.score - a.score);
    const strong = ranked.find((row) => row.score >= 10);
    if (strong) {
      const downloaded = await downloadBytesFromUrl(strong.url);
      if (downloaded) {
        const fingerprint = pixabayBufferFingerprint(downloaded.bytes);
        if (!excludeFingerprints.has(fingerprint)) {
          rememberUsedId(strong.id);
          return {
            bytes: downloaded.bytes,
            extension: downloaded.extension,
            resourceId: strong.id,
          };
        }
      }
    }
  }

  ranked.sort((a, b) => b.score - a.score);
  for (const candidate of ranked.slice(0, 12)) {
    if (candidate.score < 1) continue;
    try {
      const downloaded = await downloadBytesFromUrl(candidate.url);
      if (!downloaded) continue;
      const fingerprint = pixabayBufferFingerprint(downloaded.bytes);
      if (excludeFingerprints.has(fingerprint)) continue;
      rememberUsedId(candidate.id);
      return {
        bytes: downloaded.bytes,
        extension: downloaded.extension,
        resourceId: candidate.id,
      };
    } catch {
      // next
    }
  }

  return null;
}

export function hasPixabayApiKey(): boolean {
  return Boolean(getApiKey());
}
