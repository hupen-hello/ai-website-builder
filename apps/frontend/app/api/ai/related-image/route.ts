import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  buildLocalizedStockTerms,
  resolveCategoryImageHint,
  resolveCountryHint,
} from "@/lib/aiImageContext";
import {
  fetchMagnificStockImage,
  magnificBufferFingerprint,
} from "@/lib/magnificStock";
import { fetchPixabayStockImage } from "@/lib/pixabayStock";
import { fetchPexelsStockImage } from "@/lib/pexelsStock";

export const runtime = "nodejs";

const FALLBACK_STOCK = ["/bg1.jpg"];

function sanitizeHint(raw?: string | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .replace(/<[^>]+>/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && word.length <= 24)
    .slice(0, 6);
}

async function downloadImageCandidate(url: string): Promise<{
  bytes: Buffer;
  extension: "png" | "jpg" | "webp";
} | null> {
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
    const extension = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
    return { bytes, extension };
  } catch {
    return null;
  }
}

async function saveImageBuffer(
  buffer: Buffer,
  extension: "png" | "jpg" | "webp",
): Promise<string> {
  const folder = `${new Date().getUTCFullYear()}-${String(
    new Date().getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  const directory = path.join(
    process.cwd(),
    "public",
    "uploads",
    "ai-assist",
    folder,
  );
  await mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(directory, filename), buffer);
  return `/uploads/ai-assist/${folder}/${filename}`;
}

function pickLocalFallback(
  stockImages: string[],
  avoidSrc?: string,
): string {
  const avoid = (avoidSrc || "").trim().toLowerCase();
  const pool = [...stockImages, ...FALLBACK_STOCK].filter(
    (src) => src.toLowerCase() !== avoid,
  );
  if (!pool.length) return stockImages[0] || FALLBACK_STOCK[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

async function fingerprintPublicSrc(src?: string | null): Promise<string | null> {
  const clean = (src || "").trim().split("?")[0] || "";
  if (!clean.startsWith("/")) return null;
  try {
    const absolute = path.join(
      process.cwd(),
      "public",
      clean.replace(/^\//, ""),
    );
    const bytes = await readFile(absolute);
    return magnificBufferFingerprint(bytes);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      category?: string;
      country?: string;
      locale?: string;
      timeZone?: string;
      hint?: string;
      avoidSrc?: string;
      avoidSrcs?: string[];
    };

    const category = resolveCategoryImageHint(body?.category);
    const country = resolveCountryHint({
      country: body?.country,
      locale: body?.locale,
      timeZone: body?.timeZone,
    });
    const hintWords = sanitizeHint(body?.hint);
    const topics = buildLocalizedStockTerms({
      category,
      country,
      hintWords,
      extras: [`slot${Date.now() % 97}`],
    });

    const avoidList = [
      body?.avoidSrc,
      ...(Array.isArray(body?.avoidSrcs) ? body.avoidSrcs : []),
    ]
      .map((src) => (typeof src === "string" ? src.trim() : ""))
      .filter(Boolean);

    const excludeFingerprints = new Set<string>();
    for (const src of avoidList.slice(0, 24)) {
      const fp = await fingerprintPublicSrc(src);
      if (fp) excludeFingerprints.add(fp);
    }

    const magnific = await fetchMagnificStockImage(topics, {
      maxAttempts: 8,
      excludeFingerprints,
      acceptLanguage: country.acceptLanguage,
    });
    if (magnific) {
      const saved = await saveImageBuffer(magnific.bytes, magnific.extension);
      return NextResponse.json({
        url: saved,
        source: "magnific",
        meta: {
          category: category.id,
          country: country.code,
          region: country.region,
        },
      });
    }

    const pixabay = await fetchPixabayStockImage(topics, {
      maxAttempts: 12,
      excludeFingerprints,
      countryCode: country.code,
      categoryKeywords: [
        category.label,
        category.id,
        ...category.imageKeywords,
      ],
      countryKeywords: [
        country.name,
        country.region,
        country.code,
        ...country.imageKeywords,
      ],
    });
    if (pixabay) {
      const saved = await saveImageBuffer(pixabay.bytes, pixabay.extension);
      return NextResponse.json({
        url: saved,
        source: "pixabay",
        meta: {
          category: category.id,
          country: country.code,
          region: country.region,
        },
      });
    }

    const pexels = await fetchPexelsStockImage(topics, {
      maxAttempts: 12,
      excludeFingerprints,
      acceptLanguage: country.acceptLanguage,
      countryCode: country.code,
      categoryKeywords: [
        category.label,
        category.id,
        ...category.imageKeywords,
      ],
      countryKeywords: [
        country.name,
        country.region,
        country.code,
        ...country.imageKeywords,
      ],
    });
    if (pexels) {
      const saved = await saveImageBuffer(pexels.bytes, pexels.extension);
      return NextResponse.json({
        url: saved,
        source: "pexels",
        meta: {
          category: category.id,
          country: country.code,
          region: country.region,
        },
      });
    }

    const place =
      country.imageKeywords[0] || country.name.toLowerCase().replace(/\s+/g, "");
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const seed = `${Date.now()}-${attempt}-${Math.random().toString(36).slice(2, 10)}`;
      const topicA = topics[attempt % topics.length];
      const topicB = topics[(attempt + 1) % topics.length];
      const categoryKey = category.imageKeywords[0] || category.id;
      const candidates = [
        `https://loremflickr.com/1280/854/${encodeURIComponent(`${categoryKey},${place},${topicA}`)}?random=${encodeURIComponent(seed)}`,
        `https://loremflickr.com/1280/854/${encodeURIComponent(`${category.id},${place},${topicB}`)}?lock=${encodeURIComponent(seed)}`,
        `https://loremflickr.com/1280/854/${encodeURIComponent(`${categoryKey},${place}`)}?random=${encodeURIComponent(`${seed}-b`)}`,
      ];

      for (const url of candidates) {
        const downloaded = await downloadImageCandidate(url);
        if (!downloaded) continue;
        const fingerprint = magnificBufferFingerprint(downloaded.bytes);
        if (excludeFingerprints.has(fingerprint)) continue;
        const saved = await saveImageBuffer(
          downloaded.bytes,
          downloaded.extension,
        );
        return NextResponse.json({
          url: saved,
          source: "online",
          meta: {
            category: category.id,
            country: country.code,
            region: country.region,
          },
        });
      }
    }

    return NextResponse.json({
      url: pickLocalFallback(category.stockImages, body?.avoidSrc),
      source: "local",
      meta: {
        category: category.id,
        country: country.code,
        region: country.region,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not fetch a related image." },
      { status: 500 },
    );
  }
}
