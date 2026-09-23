/**
 * Magnific (Freepik) stock photo fetch for AI image assist.
 * Requires MAGNIFIC_API_KEY in server env. Never expose the key to the client.
 *
 * Freemium plan: ~100 downloads / 24h. When quota is hit (403/429 or 100
 * successful downloads in the UTC day), callers should fall back to Pexels.
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const MAGNIFIC_BASE = "https://api.magnific.com";
const MAGNIFIC_DAILY_DOWNLOAD_LIMIT = 100;

export type MagnificImageBytes = {
  bytes: Buffer;
  extension: "png" | "jpg" | "webp";
  resourceId: number;
};

/** Skip IDs returned in this process so consecutive AI clicks get different photos. */
const recentlyUsedIds: number[] = [];
const RECENT_MAX = 48;

type MagnificQuotaState = {
  dayKey: string;
  downloadCount: number;
  blockedUntil: number;
};

let quotaMemory: MagnificQuotaState | null = null;

function utcDayKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

function quotaFilePath() {
  return path.join(process.cwd(), ".data", "magnific-quota.json");
}

async function loadQuotaState(): Promise<MagnificQuotaState> {
  const dayKey = utcDayKey();
  if (quotaMemory && quotaMemory.dayKey === dayKey) {
    return quotaMemory;
  }
  try {
    const raw = await readFile(quotaFilePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<MagnificQuotaState>;
    if (parsed.dayKey === dayKey) {
      quotaMemory = {
        dayKey,
        downloadCount: Math.max(0, Number(parsed.downloadCount) || 0),
        blockedUntil: Math.max(0, Number(parsed.blockedUntil) || 0),
      };
      return quotaMemory;
    }
  } catch {
    // fresh day / missing file
  }
  quotaMemory = { dayKey, downloadCount: 0, blockedUntil: 0 };
  return quotaMemory;
}

async function saveQuotaState(state: MagnificQuotaState) {
  quotaMemory = state;
  try {
    const file = quotaFilePath();
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(state), "utf8");
  } catch {
    // best-effort persistence
  }
}

/** True when Magnific may still accept downloads today. */
export async function isMagnificQuotaAvailable(): Promise<boolean> {
  if (!getApiKey()) return false;
  const state = await loadQuotaState();
  if (state.blockedUntil > Date.now()) return false;
  if (state.downloadCount >= MAGNIFIC_DAILY_DOWNLOAD_LIMIT) return false;
  return true;
}

export async function markMagnificQuotaExhausted(reason = "limit") {
  const state = await loadQuotaState();
  const now = Date.now();
  const nextUtcMidnight = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate() + 1,
    1,
    0,
    0,
  );
  state.blockedUntil = Math.max(now + 60 * 60 * 1000, nextUtcMidnight);
  if (reason === "limit") {
    state.downloadCount = Math.max(
      state.downloadCount,
      MAGNIFIC_DAILY_DOWNLOAD_LIMIT,
    );
  }
  await saveQuotaState(state);
}

async function recordMagnificDownloadSuccess() {
  const state = await loadQuotaState();
  state.downloadCount += 1;
  if (state.downloadCount >= MAGNIFIC_DAILY_DOWNLOAD_LIMIT) {
    await markMagnificQuotaExhausted("limit");
    return;
  }
  await saveQuotaState(state);
}

function rememberUsedId(id: number) {
  const existing = recentlyUsedIds.indexOf(id);
  if (existing >= 0) recentlyUsedIds.splice(existing, 1);
  recentlyUsedIds.push(id);
  while (recentlyUsedIds.length > RECENT_MAX) recentlyUsedIds.shift();
}

function getApiKey(): string | null {
  const key = (process.env.MAGNIFIC_API_KEY || "").trim();
  return key || null;
}

function authHeaders(): HeadersInit {
  const key = getApiKey();
  if (!key) throw new Error("MAGNIFIC_API_KEY missing");
  return {
    "x-magnific-api-key": key,
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

/** Lightweight fingerprint so we can skip duplicate image bytes. */
export function magnificBufferFingerprint(bytes: Buffer): string {
  const sample = bytes.subarray(0, Math.min(bytes.length, 2048));
  let hash = bytes.length;
  for (let i = 0; i < sample.length; i += 17) {
    hash = (hash * 33 + sample[i]) >>> 0;
  }
  return `${bytes.length}:${hash}`;
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
}

async function downloadBytesFromUrl(
  url: string,
): Promise<Omit<MagnificImageBytes, "resourceId"> | null> {
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

type MagnificResource = {
  id?: number | string;
};

async function searchPhotoIds(
  term: string,
  page: number,
  acceptLanguage: string,
): Promise<number[]> {
  const params = new URLSearchParams();
  params.set("term", term);
  params.set("page", String(Math.max(1, Math.min(page, 40))));
  params.set("limit", "24");
  params.set("order", Math.random() < 0.35 ? "recent" : "relevance");
  params.set("filters[content_type][photo]", "1");
  params.set("filters[license][freemium]", "1");

  const response = await fetch(
    `${MAGNIFIC_BASE}/v1/resources?${params.toString()}`,
    {
      headers: {
        ...authHeaders(),
        "Accept-Language": acceptLanguage || "en-US",
      },
      cache: "no-store",
    },
  );

  if (response.status === 403 || response.status === 429) {
    await markMagnificQuotaExhausted("http");
    return [];
  }
  if (!response.ok) return [];

  const json = (await response.json()) as { data?: MagnificResource[] };
  const items = Array.isArray(json?.data) ? json.data : [];
  const ids: number[] = [];
  for (const item of items) {
    const id = Number(item?.id);
    if (Number.isFinite(id) && id > 0) ids.push(id);
  }
  return ids;
}

async function downloadResourceById(
  resourceId: number,
  acceptLanguage: string,
): Promise<Omit<MagnificImageBytes, "resourceId"> | null> {
  const params = new URLSearchParams();
  params.set("image_size", "medium");

  const response = await fetch(
    `${MAGNIFIC_BASE}/v1/resources/${resourceId}/download?${params.toString()}`,
    {
      headers: {
        ...authHeaders(),
        "Accept-Language": acceptLanguage || "en-US",
      },
      cache: "no-store",
    },
  );

  if (response.status === 403 || response.status === 429) {
    await markMagnificQuotaExhausted("http");
    return null;
  }
  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as {
    data?: { url?: string; signed_url?: string | null };
  };
  const fileUrl =
    (json?.data?.url || "").trim() || (json?.data?.signed_url || "").trim();
  if (!fileUrl) return null;
  return downloadBytesFromUrl(fileUrl);
}

export type FetchMagnificOptions = {
  maxAttempts?: number;
  excludeIds?: Iterable<number>;
  excludeFingerprints?: Iterable<string>;
  acceptLanguage?: string;
};

/**
 * Search Magnific freemium photos for `terms`, download one unique image buffer.
 */
export async function fetchMagnificStockImage(
  terms: string[],
  options?: FetchMagnificOptions,
): Promise<MagnificImageBytes | null> {
  if (!(await isMagnificQuotaAvailable())) return null;

  const cleaned = terms
    .map((t) =>
      String(t || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((t) => t.length >= 2)
    .slice(0, 14);

  if (!cleaned.length) return null;

  const maxAttempts = options?.maxAttempts ?? 8;
  const acceptLanguage = (options?.acceptLanguage || "en-US").trim() || "en-US";
  const triedIds = new Set<number>([
    ...recentlyUsedIds,
    ...(options?.excludeIds ? Array.from(options.excludeIds) : []),
  ]);
  const excludeFingerprints = new Set(
    options?.excludeFingerprints
      ? Array.from(options.excludeFingerprints)
      : [],
  );

  const spice = ["photo", "realistic", "indoor", "outdoor", "people", "modern"];

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (!(await isMagnificQuotaAvailable())) return null;

    const anchor = cleaned[attempt % Math.min(cleaned.length, 5)];
    const support = cleaned[(attempt + 3) % cleaned.length] || cleaned[0];
    const extra = spice[attempt % spice.length];
    const term =
      attempt % 3 === 0
        ? anchor
        : attempt % 3 === 1
          ? `${anchor} ${support}`.trim()
          : `${anchor} ${extra}`.trim();
    const page = 1 + Math.floor(Math.random() * 6) + (attempt % 3);

    let ids: number[] = [];
    try {
      ids = await searchPhotoIds(term, page, acceptLanguage);
    } catch {
      continue;
    }

    shuffleInPlace(ids);

    for (const id of ids) {
      if (triedIds.has(id)) continue;
      triedIds.add(id);
      try {
        const downloaded = await downloadResourceById(id, acceptLanguage);
        if (!downloaded) {
          if (!(await isMagnificQuotaAvailable())) return null;
          continue;
        }
        const fingerprint = magnificBufferFingerprint(downloaded.bytes);
        if (excludeFingerprints.has(fingerprint)) continue;
        rememberUsedId(id);
        await recordMagnificDownloadSuccess();
        return {
          bytes: downloaded.bytes,
          extension: downloaded.extension,
          resourceId: id,
        };
      } catch {
        // try next id
      }
    }
  }

  return null;
}

export function hasMagnificApiKey(): boolean {
  return Boolean(getApiKey());
}
