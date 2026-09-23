import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { ZipFileEntry } from "@/lib/zipStore";

const MEDIA_EXT = /\.(avif|gif|jpe?g|png|svg|webp|bmp|ico|mp4|webm|mov|m4v|avi|ogg|ogv)(?:$|\?)/i;
const MEDIA_KEY =
  /(image|img|photo|logo|src|poster|thumbnail|background|avatar|icon|media|video)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function looksLikeMediaUrl(value: string, keyHint = "") {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("data:")) return false;
  if (trimmed.startsWith("blob:")) return false;
  if (trimmed.includes("/uploads/")) return true;
  if (MEDIA_EXT.test(trimmed)) return true;
  if (
    MEDIA_KEY.test(keyHint) &&
    (trimmed.startsWith("/") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://"))
  ) {
    return true;
  }
  return false;
}

/** Collect unique media URL strings from published site JSON. */
export function collectMediaUrls(value: unknown, keyHint = ""): string[] {
  const found = new Set<string>();

  const walk = (node: unknown, key: string) => {
    if (typeof node === "string") {
      if (looksLikeMediaUrl(node, key)) found.add(node.trim());
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${key}[${index}]`));
      return;
    }
    if (isRecord(node)) {
      Object.entries(node).forEach(([childKey, childValue]) =>
        walk(childValue, childKey),
      );
    }
  };

  walk(value, keyHint);
  return Array.from(found);
}

function extensionFromUrl(url: string, contentType?: string | null) {
  const clean = url.split("?")[0] || url;
  const match = clean.match(
    /\.(avif|gif|jpe?g|png|svg|webp|bmp|ico|mp4|webm|mov|m4v|avi|ogg|ogv)$/i,
  );
  if (match) return `.${match[1].toLowerCase().replace("jpeg", "jpg")}`;

  const type = (contentType || "").toLowerCase();
  if (type.includes("png")) return ".png";
  if (type.includes("jpeg") || type.includes("jpg")) return ".jpg";
  if (type.includes("webp")) return ".webp";
  if (type.includes("gif")) return ".gif";
  if (type.includes("svg")) return ".svg";
  if (type.includes("avif")) return ".avif";
  if (type.includes("mp4")) return ".mp4";
  if (type.includes("webm")) return ".webm";
  if (type.includes("quicktime") || type.includes("mov")) return ".mov";
  return ".bin";
}

function safeLocalName(url: string, ext: string) {
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 12);
  const base = path
    .basename((url.split("?")[0] || "asset").replace(/\\/g, "/"))
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const stem = base.replace(/\.[a-z0-9]+$/i, "") || "asset";
  return `${stem}-${hash}${ext}`;
}

function rewriteValue(value: unknown, map: Map<string, string>): unknown {
  if (typeof value === "string") {
    return map.get(value.trim()) || value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewriteValue(item, map));
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        rewriteValue(child, map),
      ]),
    );
  }
  return value;
}

export function rewriteMediaUrls<T>(value: T, map: Map<string, string>): T {
  return rewriteValue(value, map) as T;
}

async function readLocalPublicFile(urlPath: string) {
  const relative = urlPath.split("?")[0] || "";
  if (!relative.startsWith("/")) return null;
  const normalized = path
    .normalize(relative)
    .replace(/^(\.\.[/\\])+/, "")
    .replace(/^[/\\]+/, "");
  if (!normalized || normalized.includes("..")) return null;

  const roots = [
    path.join(process.cwd(), "public"),
    path.join(process.cwd(), "apps", "frontend", "public"),
    path.join(process.cwd(), "..", "frontend", "public"),
    // Monorepo: Next may run from apps/frontend while uploads also live under admin
    path.join(process.cwd(), "..", "admin", "public"),
    path.join(process.cwd(), "apps", "admin", "public"),
  ];

  for (const root of roots) {
    const absolute = path.join(root, normalized);
    const resolvedRoot = path.resolve(root);
    if (!path.resolve(absolute).startsWith(resolvedRoot)) continue;
    try {
      return await fs.readFile(absolute);
    } catch {
      /* try next root */
    }
  }
  return null;
}

async function fetchRemoteBytes(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return {
      bytes: buffer,
      contentType: res.headers.get("content-type"),
    };
  } catch {
    return null;
  }
}

export type CollectedExportAsset = {
  /** Path inside the exported Next.js project, e.g. public/media/foo.jpg */
  zipPath: string;
  /** Public URL used inside site.json, e.g. /media/foo.jpg */
  publicUrl: string;
  bytes: Uint8Array;
  sourceUrl: string;
};

/**
 * Download/copy media referenced by the published payload into export assets.
 * Rewrites URLs to local `/media/...` paths so the ZIP runs offline.
 */
export async function collectExportAssets(options: {
  payload: unknown;
  origin: string;
  folderName: string;
  /** Extra origins to try for absolute `/uploads/...` paths (e.g. backend). */
  fallbackOrigins?: string[];
  maxFiles?: number;
}): Promise<{
  assets: CollectedExportAsset[];
  urlMap: Map<string, string>;
  missing: string[];
}> {
  const maxFiles = options.maxFiles ?? 120;
  const urls = collectMediaUrls(options.payload).slice(0, maxFiles);
  const urlMap = new Map<string, string>();
  const assets: CollectedExportAsset[] = [];
  const missing: string[] = [];
  const usedNames = new Set<string>();
  const fetchOrigins = [
    options.origin,
    ...(options.fallbackOrigins || []),
  ]
    .map((origin) => origin.replace(/\/$/, ""))
    .filter(Boolean)
    .filter((origin, index, list) => list.indexOf(origin) === index);

  for (const rawUrl of urls) {
    let bytes: Uint8Array | null = null;
    let contentType: string | null = null;

    if (rawUrl.startsWith("/")) {
      bytes = await readLocalPublicFile(rawUrl);
      if (!bytes) {
        for (const origin of fetchOrigins) {
          const remote = await fetchRemoteBytes(`${origin}${rawUrl}`);
          if (remote) {
            bytes = remote.bytes;
            contentType = remote.contentType;
            break;
          }
        }
      }
    } else if (/^https?:\/\//i.test(rawUrl)) {
      const remote = await fetchRemoteBytes(rawUrl);
      if (remote) {
        bytes = remote.bytes;
        contentType = remote.contentType;
      }
    }

    if (!bytes || !bytes.length) {
      missing.push(rawUrl);
      continue;
    }

    // Skip very large single assets (80MB — allows hero videos)
    if (bytes.byteLength > 80 * 1024 * 1024) {
      missing.push(rawUrl);
      continue;
    }

    let filename = safeLocalName(rawUrl, extensionFromUrl(rawUrl, contentType));
    while (usedNames.has(filename)) {
      filename = safeLocalName(`${rawUrl}-${usedNames.size}`, extensionFromUrl(rawUrl, contentType));
    }
    usedNames.add(filename);

    const publicUrl = `/media/${filename}`;
    urlMap.set(rawUrl, publicUrl);
    assets.push({
      zipPath: `${options.folderName}/public/media/${filename}`,
      publicUrl,
      bytes,
      sourceUrl: rawUrl,
    });
  }

  return { assets, urlMap, missing };
}

export function assetsToZipEntries(assets: CollectedExportAsset[]): ZipFileEntry[] {
  return assets.map((asset) => ({
    path: asset.zipPath,
    content: asset.bytes,
  }));
}
