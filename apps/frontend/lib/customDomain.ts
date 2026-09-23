import { queueUserStateSync } from "@/lib/userStateSync";

export type DomainConnectionMethod = "a-record" | "nameserver";

export type DomainConnectionStatus = "pending" | "verified";

export type DomainConnection = {
  id: string;
  domain: string;
  method: DomainConnectionMethod;
  status: DomainConnectionStatus;
  siteId?: string;
  siteTitle?: string;
  siteSlug?: string;
  createdAt: string;
  verifiedAt?: string;
  lastCheckedAt?: string;
};

const STORAGE_KEY = "css-ai-domain-connections";

function readConnections(): DomainConnection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as DomainConnection[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeConnections(connections: DomainConnection[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
  queueUserStateSync();
}

export function listDomainConnections(siteId?: string | null) {
  const connections = readConnections();
  if (!siteId) return connections;
  return connections.filter((item) => !item.siteId || item.siteId === siteId);
}

export function getConnectionForSite(siteId: string) {
  return readConnections().find((item) => item.siteId === siteId) ?? null;
}

export function isSiteConnected(siteId: string) {
  return Boolean(getConnectionForSite(siteId));
}

export function saveDomainConnection(input: {
  domain: string;
  method: DomainConnectionMethod;
  siteId?: string | null;
  siteTitle?: string | null;
  siteSlug?: string | null;
}) {
  const normalized = input.domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");

  if (!normalized || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(normalized)) {
    throw new Error("Enter a valid domain like example.com");
  }

  if (!input.siteId) {
    throw new Error("Please select a website to connect this domain with.");
  }

  const connections = readConnections();
  const existingForSite = connections.find((item) => item.siteId === input.siteId);
  if (existingForSite) {
    throw new Error(
      `This website is already connected to ${existingForSite.domain}.`,
    );
  }

  const existing = connections.find(
    (item) => item.domain === normalized && item.siteId === (input.siteId || undefined),
  );
  if (existing) {
    return existing;
  }

  const connection: DomainConnection = {
    id: `${Date.now()}-${normalized}`,
    domain: normalized,
    method: input.method,
    status: "pending",
    siteId: input.siteId,
    siteTitle: input.siteTitle || undefined,
    siteSlug: input.siteSlug || undefined,
    createdAt: new Date().toISOString(),
  };

  writeConnections([connection, ...connections]);
  return connection;
}

export function updateDomainConnection(
  id: string,
  patch: Partial<
    Pick<
      DomainConnection,
      "status" | "verifiedAt" | "lastCheckedAt" | "method"
    >
  >,
) {
  const connections = readConnections();
  const index = connections.findIndex((item) => item.id === id);
  if (index === -1) return null;

  connections[index] = { ...connections[index], ...patch };
  writeConnections(connections);
  return connections[index];
}

export function removeDomainConnection(id: string) {
  writeConnections(readConnections().filter((item) => item.id !== id));
}
