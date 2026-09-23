import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 4;

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase();

  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(normalized)) return true;

  const ipv4 = normalized.startsWith("::ffff:")
    ? normalized.slice("::ffff:".length)
    : normalized;
  const parts = ipv4.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

async function validatePublicUrl(rawUrl: string) {
  const withProtocol = /^https?:\/\//i.test(rawUrl.trim())
    ? rawUrl.trim()
    : `https://${rawUrl.trim()}`;
  const url = new URL(withProtocol);

  if (!(["http:", "https:"] as string[]).includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }
  if (url.username || url.password) {
    throw new Error("URLs containing credentials are not supported.");
  }
  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("Only standard website ports are supported.");
  }
  if (
    url.hostname === "localhost" ||
    url.hostname.endsWith(".localhost") ||
    url.hostname.endsWith(".local")
  ) {
    throw new Error("Local network URLs cannot be checked.");
  }

  const addresses = isIP(url.hostname)
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Private network URLs cannot be checked.");
  }

  return url;
}

async function requestUrl(startUrl: URL) {
  let currentUrl = startUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      method: "HEAD",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { "User-Agent": "Lestow URL Checker/1.0" },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("The website returned an invalid redirect.");
      currentUrl = await validatePublicUrl(new URL(location, currentUrl).toString());
      continue;
    }

    return { response, finalUrl: currentUrl };
  }

  throw new Error("The website redirected too many times.");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: unknown };
    if (typeof body.url !== "string" || !body.url.trim()) {
      return NextResponse.json(
        { valid: false, message: "Enter a URL before checking." },
        { status: 400 },
      );
    }

    const url = await validatePublicUrl(body.url);
    const { response, finalUrl } = await requestUrl(url);
    const isReachable = response.status >= 200 && response.status < 500 && ![404, 410].includes(response.status);

    if (!isReachable) {
      return NextResponse.json(
        { valid: false, message: `The website returned status ${response.status}.` },
        { status: 422 },
      );
    }

    return NextResponse.json({
      valid: true,
      normalizedUrl: finalUrl.toString(),
      status: response.status,
    });
  } catch (error) {
    const message = error instanceof Error && error.message
      ? error.message
      : "This URL could not be reached.";
    return NextResponse.json({ valid: false, message }, { status: 422 });
  }
}
