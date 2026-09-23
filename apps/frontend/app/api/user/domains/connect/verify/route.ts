import { cookies } from "next/headers";
import dns from "dns/promises";
import { NextRequest, NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";

const DEFAULT_A_RECORD_IP = process.env.CUSTOM_DOMAIN_A_RECORD_IP || "76.76.21.21";
const DEFAULT_NAMESERVERS = (
  process.env.CUSTOM_DOMAIN_NAMESERVERS || "ns1.cssfounder.com,ns2.cssfounder.com"
)
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

type VerifyPayload = {
  domain?: string;
  method?: "a-record" | "nameserver";
};

function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

function normalizeNameserver(value: string) {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

async function verifyARecord(domain: string, targetIp: string) {
  const hosts = [domain, `www.${domain}`];
  for (const host of hosts) {
    try {
      const addresses = await dns.resolve4(host);
      if (addresses.includes(targetIp)) {
        return { verified: true, matchedHost: host, records: addresses };
      }
    } catch {
      // Try next host.
    }
  }

  return { verified: false, matchedHost: null, records: [] as string[] };
}

async function verifyNameservers(domain: string, expected: string[]) {
  try {
    const nameservers = (await dns.resolveNs(domain)).map(normalizeNameserver);
    const verified = expected.every((expectedNs) =>
      nameservers.some(
        (actual) =>
          actual === expectedNs || actual.endsWith(`.${expectedNs}`),
      ),
    );

    return { verified, nameservers };
  } catch {
    return { verified: false, nameservers: [] as string[] };
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let body: VerifyPayload;
  try {
    body = (await request.json()) as VerifyPayload;
  } catch {
    return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
  }

  const domain = normalizeDomain(body.domain || "");
  if (!domain) {
    return NextResponse.json({ message: "Domain is required" }, { status: 400 });
  }

  const method = body.method === "nameserver" ? "nameserver" : "a-record";

  if (method === "nameserver") {
    const result = await verifyNameservers(domain, DEFAULT_NAMESERVERS);
    return NextResponse.json({
      verified: result.verified,
      method,
      domain,
      nameservers: DEFAULT_NAMESERVERS,
      detectedNameservers: result.nameservers,
      message: result.verified
        ? "Nameservers are connected. Your domain should be live soon."
        : "Nameservers are not updated yet. DNS can take up to 24 hours to propagate.",
    });
  }

  const result = await verifyARecord(domain, DEFAULT_A_RECORD_IP);
  return NextResponse.json({
    verified: result.verified,
    method,
    domain,
    targetIp: DEFAULT_A_RECORD_IP,
    matchedHost: result.matchedHost,
    detectedRecords: result.records,
    message: result.verified
      ? "DNS is connected. Your domain should be live soon."
      : "A record is not pointing to our server yet. DNS can take up to 24 hours to propagate.",
  });
}
