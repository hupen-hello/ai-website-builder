import { queueUserStateSync } from "@/lib/userStateSync";

export type PurchasedDomainStatus = "active" | "expiring" | "expired";

export type DnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT";

export type DnsRecord = {
  id: string;
  type: DnsRecordType;
  host: string;
  value: string;
  ttl: number;
};

export type PurchasedDomain = {
  id: string;
  domain: string;
  status: PurchasedDomainStatus;
  purchasedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  price: string;
  siteId?: string;
  siteTitle?: string;
  siteSlug?: string;
  connectionStatus: "pending" | "verified";
  dnsRecords: DnsRecord[];
};

const STORAGE_KEY = "css-ai-purchased-domains";
const DEFAULT_A_IP =
  process.env.NEXT_PUBLIC_CUSTOM_DOMAIN_A_RECORD_IP || "76.76.21.21";

function readDomains(): PurchasedDomain[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as PurchasedDomain[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDomains(domains: PurchasedDomain[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(domains));
  queueUserStateSync();
}

function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

function defaultDnsRecords(domain: string): DnsRecord[] {
  return [
    {
      id: `${domain}-a-root`,
      type: "A",
      host: "@",
      value: DEFAULT_A_IP,
      ttl: 3600,
    },
    {
      id: `${domain}-cname-www`,
      type: "CNAME",
      host: "www",
      value: domain,
      ttl: 3600,
    },
  ];
}

function computeStatus(expiresAt: string): PurchasedDomainStatus {
  const expiry = new Date(expiresAt).getTime();
  const now = Date.now();
  const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);

  if (daysLeft < 0) return "expired";
  if (daysLeft <= 30) return "expiring";
  return "active";
}

function withComputedStatus(domain: PurchasedDomain): PurchasedDomain {
  return { ...domain, status: computeStatus(domain.expiresAt) };
}

export function listPurchasedDomains() {
  return readDomains().map(withComputedStatus);
}

export function getPurchasedDomain(id: string) {
  return listPurchasedDomains().find((item) => item.id === id) ?? null;
}

export function getPurchasedDomainByName(domain: string) {
  const normalized = normalizeDomain(domain);
  return listPurchasedDomains().find((item) => item.domain === normalized) ?? null;
}

export function purchaseDomain(input: {
  domain: string;
  price?: string;
  siteId: string;
  siteTitle?: string;
  siteSlug?: string;
}) {
  const normalized = normalizeDomain(input.domain);
  if (!normalized || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(normalized)) {
    throw new Error("Enter a valid domain like example.com");
  }

  if (!input.siteId) {
    throw new Error("Please select a website for this domain.");
  }

  const domains = readDomains();
  if (domains.some((item) => item.domain === normalized)) {
    throw new Error("This domain is already in your account.");
  }

  const purchasedAt = new Date();
  const expiresAt = new Date(purchasedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const entry: PurchasedDomain = {
    id: `pd-${Date.now()}-${normalized}`,
    domain: normalized,
    status: "active",
    purchasedAt: purchasedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    autoRenew: true,
    price: input.price || "₹1,200/year + Core ₹900 (1 mo)",
    siteId: input.siteId,
    siteTitle: input.siteTitle,
    siteSlug: input.siteSlug,
    connectionStatus: "verified",
    dnsRecords: defaultDnsRecords(normalized),
  };

  writeDomains([entry, ...domains]);
  return withComputedStatus(entry);
}

export function renewPurchasedDomain(id: string) {
  const domains = readDomains();
  const index = domains.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error("Domain not found.");
  }

  const currentExpiry = new Date(domains[index].expiresAt);
  const base = currentExpiry.getTime() > Date.now() ? currentExpiry : new Date();
  const nextExpiry = new Date(base);
  nextExpiry.setFullYear(nextExpiry.getFullYear() + 1);

  domains[index] = {
    ...domains[index],
    expiresAt: nextExpiry.toISOString(),
    status: "active",
  };

  writeDomains(domains);
  return withComputedStatus(domains[index]);
}

export function setPurchasedDomainAutoRenew(id: string, autoRenew: boolean) {
  const domains = readDomains();
  const index = domains.findIndex((item) => item.id === id);
  if (index === -1) return null;

  domains[index] = { ...domains[index], autoRenew };
  writeDomains(domains);
  return withComputedStatus(domains[index]);
}

export function updatePurchasedDomainDnsRecords(
  id: string,
  dnsRecords: DnsRecord[],
) {
  const domains = readDomains();
  const index = domains.findIndex((item) => item.id === id);
  if (index === -1) return null;

  domains[index] = { ...domains[index], dnsRecords };
  writeDomains(domains);
  return withComputedStatus(domains[index]);
}

export function formatDomainExpiry(expiresAt: string) {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return expiresAt;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function daysUntilExpiry(expiresAt: string) {
  const expiry = new Date(expiresAt).getTime();
  return Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24));
}
