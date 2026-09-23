import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse } from "next/server";
import {
  extractDomainContent,
  extractReferenceDesign,
  mergeSiteBuild,
} from "@/lib/site-extraction";
import { fetchHtmlResilient } from "@/lib/reference-clone-swap";

export const runtime = "nodejs";

const REQUEST_TIMEOUT_MS = 12_000;

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

  const addresses = isIP(url.hostname)
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true });

  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Private network URLs cannot be checked.");
  }

  return url;
}

async function fetchHtml(url: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`Could not fetch ${url}`);
    }

    return response.text();
  } catch {
    // Sites like dflwf.com often 403 plain fetch — browser render fallback.
    const rendered = await fetchHtmlResilient(url);
    return rendered.html;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      domainUrl?: string;
      referenceUrl?: string;
      websiteName?: string;
      vision?: string;
    };

    const domainUrl = body.domainUrl?.trim() || "";
    const referenceUrl = body.referenceUrl?.trim() || "";
    const websiteName = body.websiteName?.trim() || "";
    const vision = body.vision?.trim() || "";

    // Redesign is domain-only (no inspiration URL). Reference is optional.
    if (!domainUrl && !referenceUrl) {
      return NextResponse.json(
        { message: "Domain URL is required." },
        { status: 400 },
      );
    }

    const normalizeHost = (raw: string) => {
      try {
        const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
        return new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase();
      } catch {
        return raw.trim().toLowerCase();
      }
    };

    if (
      domainUrl &&
      referenceUrl &&
      normalizeHost(domainUrl) === normalizeHost(referenceUrl)
    ) {
      return NextResponse.json(
        {
          message:
            "Reference website must be different from your existing site. Pick another site for design inspiration (like Shuffle redesign).",
        },
        { status: 400 },
      );
    }

    let domainHtml = "";
    let referenceHtml = "";

    if (domainUrl) {
      const url = await validatePublicUrl(domainUrl);
      domainHtml = await fetchHtml(url.toString());
    }

    if (referenceUrl) {
      const referenceValidated = await validatePublicUrl(referenceUrl);
      referenceHtml = await fetchHtml(referenceValidated.toString());
    } else {
      // Domain-only redesign: palette / section cues from the same site HTML.
      referenceHtml = domainHtml;
    }

    const content = domainHtml
      ? extractDomainContent(domainHtml, domainUrl, websiteName, vision)
      : extractDomainContent("", domainUrl || referenceUrl, websiteName, vision);

    const design = extractReferenceDesign(
      referenceHtml,
      referenceUrl || domainUrl || websiteName,
    );

    return NextResponse.json(
      mergeSiteBuild(
        content,
        design,
        domainUrl || websiteName,
        referenceUrl || domainUrl || "",
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to extract site data.";
    return NextResponse.json({ message }, { status: 422 });
  }
}
