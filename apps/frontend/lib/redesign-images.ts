/**
 * Resolve media for redesign: prefer existing-site images, then stock APIs.
 */

export type RedesignImagePack = {
  urls: string[];
  sources: Array<"domain" | "pixabay" | "pexels">;
  logoImage?: string;
};

function isLikelyBrokenDomainUrl(url: string) {
  const lower = url.toLowerCase();
  return (
    !/^https?:\/\//i.test(url) ||
    /\.(heic|heif|svg|tif|tiff)(\?|$)/i.test(lower) ||
    /data:image|1x1|pixel|tracking|blur_2/i.test(lower)
  );
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
      photos?: Array<{ src?: { large2x?: string; large?: string; medium?: string } }>;
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

export async function resolveRedesignImages(input: {
  domainImages?: string[];
  logoImage?: string;
  brandName?: string;
  vision?: string;
  need?: number;
  /** Exclude images hosted on the reference site (legal / content safety). */
  referenceUrl?: string;
  domainUrl?: string;
}): Promise<RedesignImagePack> {
  const need = Math.min(Math.max(input.need ?? 8, 4), 12);
  const urls: string[] = [];
  const sources: RedesignImagePack["sources"] = [];
  const refHost = (() => {
    try {
      const raw = (input.referenceUrl || "").trim();
      if (!raw) return "";
      const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      return new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase();
    } catch {
      return "";
    }
  })();

  const allowUrl = (url: string) => {
    if (!url || isLikelyBrokenDomainUrl(url)) return false;
    try {
      const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
      if (refHost && (host === refHost || host.endsWith(`.${refHost}`))) return false;
      return true;
    } catch {
      return false;
    }
  };

  for (const url of input.domainImages || []) {
    if (!allowUrl(url) || urls.includes(url)) continue;
    urls.push(url);
    sources.push("domain");
    if (urls.length >= Math.max(3, need - 2)) break;
  }

  const queries = [
    `${input.brandName || "nonprofit"} community education India`,
    `${input.brandName || "business"} team helping people`,
    "charity volunteers children education",
    "modern nonprofit organization India",
    input.vision?.slice(0, 80) || "community service organization",
  ];

  for (const query of queries) {
    if (urls.length >= need) break;
    const pixabay = await searchPixabayUrls(query, need - urls.length);
    for (const url of pixabay) {
      if (!allowUrl(url) || urls.includes(url)) continue;
      urls.push(url);
      sources.push("pixabay");
      if (urls.length >= need) break;
    }
  }

  for (const query of queries) {
    if (urls.length >= need) break;
    const pexels = await searchPexelsUrls(query, need - urls.length);
    for (const url of pexels) {
      if (!allowUrl(url) || urls.includes(url)) continue;
      urls.push(url);
      sources.push("pexels");
      if (urls.length >= need) break;
    }
  }

  const logoImage =
    input.logoImage && allowUrl(input.logoImage) ? input.logoImage : "";

  return {
    urls: urls.slice(0, need),
    sources: sources.slice(0, need),
    logoImage: logoImage || undefined,
  };
}
