/**
 * Live stock URLs for Create-with-AI (Pexels first, Pixabay fallback).
 * Server-only — uses PEXELS_API_KEY / PIXABAY_API_KEY from env.
 */

async function searchPexelsUrls(query: string, count: number): Promise<string[]> {
  const key = process.env.PEXELS_API_KEY?.trim();
  if (!key) return [];
  try {
    const params = new URLSearchParams({
      query: query.slice(0, 100),
      per_page: String(Math.min(Math.max(count, 3), 12)),
      orientation: "landscape",
    });
    const response = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: { Authorization: key },
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      photos?: Array<{
        src?: { large2x?: string; large?: string; medium?: string };
      }>;
    };
    return (data.photos || [])
      .map(
        (photo) =>
          photo.src?.large2x || photo.src?.large || photo.src?.medium || "",
      )
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function searchPixabayUrls(query: string, count: number): Promise<string[]> {
  const key = process.env.PIXABAY_API_KEY?.trim();
  if (!key) return [];
  try {
    const params = new URLSearchParams({
      key,
      q: query.slice(0, 100),
      image_type: "photo",
      orientation: "horizontal",
      safesearch: "true",
      per_page: String(Math.min(Math.max(count, 3), 12)),
    });
    const response = await fetch(`https://pixabay.com/api/?${params}`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      hits?: Array<{ largeImageURL?: string; webformatURL?: string }>;
    };
    return (data.hits || [])
      .map((hit) => hit.largeImageURL || hit.webformatURL || "")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function nicheQueries(input: {
  category: string;
  brandName?: string;
  description?: string;
  websiteRelated?: string;
}): string[] {
  const cat = (input.category || "business").trim();
  const brand = (input.brandName || "").trim();
  const related = (input.websiteRelated || "").replace(/-/g, " ");
  const descBit = (input.description || "")
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 4)
    .join(" ");

  const base = [
    `${cat} professional photography`,
    `${cat} ${related || "brand"} lifestyle`.trim(),
    brand ? `${brand} ${cat} workspace` : `${cat} modern interior`,
    descBit ? `${cat} ${descBit}` : `${cat} people authentic`,
    `${cat} detail close up premium`,
  ];

  // Slight shuffle via time so each generate feels fresh
  const seed = Date.now() % base.length;
  return [...base.slice(seed), ...base.slice(0, seed)];
}

/** Fetch live photo URLs for AI to place (not hardcoded defaults). */
export async function fetchCreateAiImageUrls(input: {
  category: string;
  brandName?: string;
  description?: string;
  websiteRelated?: string;
  need?: number;
}): Promise<string[]> {
  const need = Math.min(Math.max(input.need ?? 8, 4), 10);
  const urls: string[] = [];
  const queries = nicheQueries(input);

  // Parallel first wave (fast)
  const firstBatch = await Promise.all(
    queries.slice(0, 3).map((q) => searchPexelsUrls(q, 4)),
  );
  for (const batch of firstBatch) {
    for (const url of batch) {
      if (!url || urls.includes(url)) continue;
      urls.push(url);
      if (urls.length >= need) return urls.slice(0, need);
    }
  }

  // Fill with Pixabay / more Pexels if short
  for (const q of queries) {
    if (urls.length >= need) break;
    const more = [
      ...(await searchPexelsUrls(q, need - urls.length)),
      ...(await searchPixabayUrls(q, need - urls.length)),
    ];
    for (const url of more) {
      if (!url || urls.includes(url)) continue;
      urls.push(url);
      if (urls.length >= need) break;
    }
  }

  return urls.slice(0, need);
}
