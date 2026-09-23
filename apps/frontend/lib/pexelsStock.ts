/**
 * Pexels stock photo fallback when Magnific daily download quota is exhausted.
 * Requires PEXELS_API_KEY in server env. Never expose the key to the client.
 *
 * Pexels ranking is weaker than Magnific for locale — we force demonym/city-first
 * queries (e.g. "indian school classroom") and prefer photos whose alt mentions
 * place or category tokens.
 */

const PEXELS_BASE = "https://api.pexels.com/v1";

export type PexelsImageBytes = {
  bytes: Buffer;
  extension: "png" | "jpg" | "webp";
  resourceId: number;
};

const recentlyUsedIds: number[] = [];
const RECENT_MAX = 64;

/** Extra place tokens that work well on Pexels (demonym + cities). */
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
  const key = (process.env.PEXELS_API_KEY || "").trim();
  return key || null;
}

function authHeaders(): HeadersInit {
  const key = getApiKey();
  if (!key) throw new Error("PEXELS_API_KEY missing");
  return {
    Authorization: key,
    Accept: "application/json",
  };
}

function extensionFromContentType(
  contentType: string,
): "png" | "jpg" | "webp" {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

export function pexelsBufferFingerprint(bytes: Buffer): string {
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
  if (blob.includes("school") || blob.includes("education") || blob.includes("student")) {
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
  if (
    blob.includes("business") ||
    blob.includes("office") ||
    blob.includes("corporate")
  ) {
    return "business";
  }
  return "business";
}

/**
 * Demonym/city-first queries — this is what actually works on Pexels.
 * Example: "indian school classroom", "dubai corporate office"
 */
function buildLocalizedPexelsQueries(params: {
  terms: string[];
  categoryKeywords: string[];
  countryKeywords: string[];
  countryCode?: string;
}): string[] {
  const code = (params.countryCode || "").trim().toUpperCase();
  const places = uniqueTerms([
    ...(PLACE_BOOST[code] || []),
    ...params.countryKeywords,
  ], 12);
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
    // Require at least one place token in the query itself
    const hasPlace = places.some((p) => value.includes(p));
    if (!hasPlace) return;
    seen.add(value);
    queries.push(value);
  };

  // Highest-signal patterns first
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
      push(`${cat} in ${city}`);
    }
  }

  // Keep strong multi-word terms from caller (already localized)
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
): Promise<Omit<PexelsImageBytes, "resourceId"> | null> {
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

type PexelsPhoto = {
  id?: number;
  alt?: string;
  src?: {
    original?: string;
    large2x?: string;
    large?: string;
    medium?: string;
    landscape?: string;
  };
};

async function searchPhotos(
  query: string,
  page: number,
): Promise<Array<{ id: number; url: string; alt: string }>> {
  const params = new URLSearchParams();
  params.set("query", query);
  params.set("page", String(Math.max(1, Math.min(page, 20))));
  params.set("per_page", "30");
  // No orientation lock — local scenes are often portrait on Pexels.
  // No locale lock — en-US locale bias hurts India/MEA relevance.

  const response = await fetch(`${PEXELS_BASE}/search?${params.toString()}`, {
    headers: authHeaders(),
    cache: "no-store",
  });

  if (!response.ok) return [];

  const json = (await response.json()) as { photos?: PexelsPhoto[] };
  const photos = Array.isArray(json?.photos) ? json.photos : [];
  const out: Array<{ id: number; url: string; alt: string }> = [];
  for (const photo of photos) {
    const id = Number(photo?.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    const url = (
      photo.src?.large2x ||
      photo.src?.large ||
      photo.src?.landscape ||
      photo.src?.medium ||
      photo.src?.original ||
      ""
    ).trim();
    if (!url) continue;
    out.push({
      id,
      url,
      alt: typeof photo.alt === "string" ? photo.alt.toLowerCase() : "",
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

function scorePhoto(params: {
  alt: string;
  query: string;
  places: string[];
  categories: string[];
}): number {
  const { alt, query, places, categories } = params;
  const placeHits = tokenHit(alt, places);
  const categoryHits = tokenHit(alt, categories);
  const queryHits = tokenHit(alt, query.split(/\s+/));

  let score = 0;
  score += placeHits * 8;
  score += categoryHits * 4;
  score += queryHits * 2;

  // Empty alt: weak trust — only keep if query itself is strongly localized
  if (!alt) {
    score += places.some((p) => query.includes(p)) ? 3 : -5;
  }

  // Reject-ish: alt mentions unrelated geography when we asked for a place
  if (alt && places.length && placeHits === 0) {
    score -= 6;
  }

  return score;
}

export type FetchPexelsOptions = {
  maxAttempts?: number;
  excludeIds?: Iterable<number>;
  excludeFingerprints?: Iterable<string>;
  acceptLanguage?: string;
  categoryKeywords?: string[];
  countryKeywords?: string[];
  /** ISO country code for demonym/city boost (IN, AE, US…). */
  countryCode?: string;
};

/**
 * Search Pexels with demonym/city-first category queries and pick the best match.
 */
export async function fetchPexelsStockImage(
  terms: string[],
  options?: FetchPexelsOptions,
): Promise<PexelsImageBytes | null> {
  if (!getApiKey()) return null;

  const categoryKeywords = options?.categoryKeywords || [];
  const countryKeywords = options?.countryKeywords || [];
  const countryCode = (options?.countryCode || "").trim().toUpperCase();
  const places = uniqueTerms(
    [...(PLACE_BOOST[countryCode] || []), ...countryKeywords],
    14,
  );
  const categories = uniqueTerms(categoryKeywords, 12);

  const queries = buildLocalizedPexelsQueries({
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
    alt: string;
    score: number;
  };

  // Gather scored candidates across a few strong queries, then download best.
  const ranked: Candidate[] = [];

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const query = queries[attempt % queries.length];
    const page = 1 + Math.floor(attempt / Math.max(queries.length, 1));

    let photos: Array<{ id: number; url: string; alt: string }> = [];
    try {
      photos = await searchPhotos(query, page);
    } catch {
      continue;
    }
    if (!photos.length) continue;

    for (const photo of photos) {
      if (triedIds.has(photo.id)) continue;
      const score = scorePhoto({
        alt: photo.alt,
        query,
        places,
        categories,
      });
      // First passes: require a non-negative score (place/category relevance)
      if (attempt < queries.length && score < 2) continue;
      ranked.push({ ...photo, score });
      triedIds.add(photo.id);
    }

    // Early download if we already have a strong place+category match
    ranked.sort((a, b) => b.score - a.score);
    const strong = ranked.find((row) => row.score >= 10);
    if (strong) {
      const downloaded = await downloadBytesFromUrl(strong.url);
      if (downloaded) {
        const fingerprint = pexelsBufferFingerprint(downloaded.bytes);
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
      const fingerprint = pexelsBufferFingerprint(downloaded.bytes);
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

export function hasPexelsApiKey(): boolean {
  return Boolean(getApiKey());
}
