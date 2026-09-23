import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";

/** Always checked for every search. */
const DEFAULT_TLDS = [
  "com",
  "in",
  "co.in",
  "net",
  "org",
  "info",
  "biz",
  "co",
  "io",
  "ai",
  "online",
  "store",
];

/** Multi-part TLDs must be matched longest-first when parsing a typed domain. */
const COMPOUND_TLDS = [
  "co.in",
  "net.in",
  "org.in",
  "gen.in",
  "firm.in",
  "ind.in",
  "co.uk",
  "org.uk",
  "me.uk",
  "com.au",
  "net.au",
  "org.au",
  "com.co",
  "net.co",
  "nom.co",
].sort((a, b) => b.length - a.length);

type ResellerClubAvailability = {
  status?: string;
  classkey?: string;
};

type ResellerClubErrorResponse = {
  status?: string;
  message?: string;
  error?: string;
};

type DomainResult = {
  domain: string;
  available: boolean;
  premium?: boolean;
  price?: string | null;
  message?: string;
  status?: string;
};

function normalizeQuery(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/\s+/g, "");
}

function parseDomainQuery(value: string): { label: string; tld?: string } {
  const normalized = normalizeQuery(value);
  if (!normalized.includes(".")) {
    return { label: normalized };
  }

  for (const compound of COMPOUND_TLDS) {
    if (normalized.endsWith(`.${compound}`)) {
      const label = normalized.slice(0, -(compound.length + 1));
      if (label && !label.includes(".")) {
        return { label, tld: compound };
      }
    }
  }

  const parts = normalized.split(".");
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { label: parts[0], tld: parts[1] };
  }

  // Fallback: first segment is the label (e.g. sub.example.com → example ignored)
  return { label: parts[0] || "" };
}

function buildTldList(preferredTld?: string) {
  const tlds: string[] = [];
  const seen = new Set<string>();

  const push = (tld: string) => {
    const value = tld.trim().toLowerCase();
    if (!value || seen.has(value)) return;
    seen.add(value);
    tlds.push(value);
  };

  if (preferredTld) push(preferredTld);
  for (const tld of DEFAULT_TLDS) push(tld);
  // Extra Indian third-level options near the top when user asked for .in family
  if (preferredTld?.endsWith(".in") || preferredTld === "in") {
    push("net.in");
    push("org.in");
  }

  return tlds;
}

function isResellerClubErrorPayload(
  data: Record<string, unknown>,
): data is ResellerClubErrorResponse {
  return (
    data.status === "ERROR" ||
    data.status === "Failed" ||
    typeof data.message === "string" ||
    typeof data.error === "string"
  );
}

function availabilityMessage(status?: string) {
  switch (status) {
    case "available":
      return undefined;
    case "regthroughus":
      return "Already registered in your ResellerClub account.";
    case "regthroughothers":
      return "This domain is already registered with another registrar.";
    case "unknown":
      return "Registry unavailable right now. Try again in a few minutes.";
    default:
      return "This domain is already taken or unavailable right now.";
  }
}

function getResellerClubCredentials() {
  const userId = process.env.RESELLERCLUB_USER_ID?.trim();
  const apiKey = (
    process.env.RESELLERCLUB_API_KEY || process.env.RESELLERCLUB_PASSWORD
  )?.trim();
  return { userId, apiKey };
}

function parseResellerClubResults(
  label: string,
  tlds: string[],
  data: Record<string, ResellerClubAvailability>,
): DomainResult[] {
  return tlds.map((tld) => {
    const domain = `${label}.${tld}`;
    const match = data[domain];
    const status = match?.status?.toLowerCase();

    return {
      domain,
      available: status === "available",
      premium: match?.classkey === "premium",
      price: null,
      status,
      message: availabilityMessage(status),
    };
  });
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { label, tld: preferredTld } = parseDomainQuery(
    request.nextUrl.searchParams.get("q") || "",
  );
  const tlds = buildTldList(preferredTld);

  if (!label || label.length < 2) {
    return NextResponse.json(
      { message: "Enter at least 2 characters to search domains." },
      { status: 400 },
    );
  }

  const { userId, apiKey } = getResellerClubCredentials();

  if (!userId || !apiKey) {
    const fallbackResults: DomainResult[] = tlds.map((tld) => ({
      domain: `${label}.${tld}`,
      available: false,
      message:
        "ResellerClub credentials are not configured yet. Add server env values first.",
    }));

    return NextResponse.json({
      configured: false,
      message:
        "ResellerClub env vars missing. Add RESELLERCLUB_USER_ID and RESELLERCLUB_API_KEY in apps/frontend/.env.local, then restart the dev server.",
      results: fallbackResults,
    });
  }

  try {
    const url = new URL("https://httpapi.com/api/domains/available.json");
    url.searchParams.set("auth-userid", userId);
    url.searchParams.set("api-key", apiKey);
    url.searchParams.set("domain-name", label);
    for (const tld of tlds) {
      url.searchParams.append("tlds", tld);
    }

    const response = await fetch(url.toString(), { cache: "no-store" });
    const raw = await response.text();

    let data: Record<string, unknown> | null = null;

    try {
      data = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    } catch {
      data = null;
    }

    if (!data) {
      return NextResponse.json(
        {
          configured: true,
          message:
            "ResellerClub returned an invalid response. Check API key and whitelisted server IP in ResellerClub Settings → API.",
        },
        { status: 502 },
      );
    }

    if (isResellerClubErrorPayload(data)) {
      const message =
        data.message || data.error || "ResellerClub search failed.";

      return NextResponse.json(
        {
          configured: true,
          message: message.includes("IP")
            ? `${message} Add your public IP in ResellerClub → Settings → API → Whitelist IP, then wait ~30 minutes.`
            : message,
        },
        { status: 502 },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          configured: true,
          message: `ResellerClub search failed (HTTP ${response.status}). Verify RESELLERCLUB_USER_ID and RESELLERCLUB_API_KEY, then restart the dev server.`,
        },
        { status: 502 },
      );
    }

    const results = parseResellerClubResults(
      label,
      tlds,
      data as Record<string, ResellerClubAvailability>,
    );

    return NextResponse.json({ configured: true, results });
  } catch {
    return NextResponse.json(
      { message: "Unable to search domains right now." },
      { status: 500 },
    );
  }
}
