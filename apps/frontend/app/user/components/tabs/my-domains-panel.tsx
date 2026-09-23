"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Copy,
  Globe2,
  Loader2,
  RefreshCw,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { listDomainConnections, updateDomainConnection, type DomainConnection } from "@/lib/customDomain";
import {
  daysUntilExpiry,
  formatDomainExpiry,
  listPurchasedDomains,
  renewPurchasedDomain,
  setPurchasedDomainAutoRenew,
  updatePurchasedDomainDnsRecords,
  type DnsRecord,
  type PurchasedDomain,
} from "@/lib/purchasedDomain";
import type { DashboardTab } from "../sidebar";

const DEFAULT_A_RECORD_IP =
  process.env.NEXT_PUBLIC_CUSTOM_DOMAIN_A_RECORD_IP || "76.76.21.21";
const DEFAULT_NAMESERVERS = (
  process.env.NEXT_PUBLIC_CUSTOM_DOMAIN_NAMESERVERS ||
  "ns1.cssfounder.com,ns2.cssfounder.com"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-700 transition hover:border-blue-200 hover:text-blue-700"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ConnectedDomainDnsPanel({
  connection,
  onVerified,
}: {
  connection: DomainConnection;
  onVerified: () => void;
}) {
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");

  const handleVerify = async () => {
    setVerifying(true);
    setMessage("");
    try {
      const response = await fetch("/api/user/domains/connect/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: connection.domain,
          method: connection.method,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        verified?: boolean;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(data.message || "Unable to verify DNS.");
      }
      updateDomainConnection(connection.id, {
        status: data.verified ? "verified" : "pending",
        verifiedAt: data.verified ? new Date().toISOString() : undefined,
        lastCheckedAt: new Date().toISOString(),
      });
      setMessage(data.message || (data.verified ? "DNS verified." : "DNS pending."));
      onVerified();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to verify DNS.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
      <div>
        <p className="text-[12px] font-semibold text-zinc-900">
          Update DNS at your domain provider
        </p>
        <p className="mt-0.5 text-[10px] leading-4 text-zinc-500">
          Add these records at GoDaddy, Namecheap, etc., then verify below.
        </p>
      </div>

      {connection.method === "a-record" ? (
        [
          { host: "@", value: DEFAULT_A_RECORD_IP },
          { host: "www", value: DEFAULT_A_RECORD_IP },
        ].map((record) => (
          <div
            key={record.host}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5"
          >
            <div className="grid gap-2 sm:grid-cols-[60px_60px_1fr_auto] sm:items-center">
              <div>
                <p className="text-[9px] font-semibold uppercase text-zinc-400">Type</p>
                <p className="mt-0.5 text-[11px] font-semibold">A</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase text-zinc-400">Host</p>
                <p className="mt-0.5 text-[11px] font-semibold">{record.host}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase text-zinc-400">Value</p>
                <p className="mt-0.5 font-mono text-[11px] font-semibold">{record.value}</p>
              </div>
              <CopyButton value={record.value} />
            </div>
          </div>
        ))
      ) : (
        DEFAULT_NAMESERVERS.map((nameserver) => (
          <div
            key={nameserver}
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-[9px] font-semibold uppercase text-zinc-400">
                Nameserver
              </p>
              <p className="mt-0.5 font-mono text-[11px] font-semibold">{nameserver}</p>
            </div>
            <CopyButton value={nameserver} />
          </div>
        ))
      )}

      <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[10px] text-amber-900">
        DNS can take up to <strong>24 hours</strong> to propagate.
      </div>

      {message ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] text-blue-800">
          {message}
        </div>
      ) : null}

      <button
        type="button"
        disabled={verifying}
        onClick={() => void handleVerify()}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-3.5 text-[11px] font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
      >
        {verifying ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        Verify DNS
      </button>
    </div>
  );
}

type ManagedDomain =
  | ({ kind: "purchased" } & PurchasedDomain)
  | ({
      kind: "connected";
      connection: DomainConnection;
    } & Pick<
      DomainConnection,
      "id" | "domain" | "siteId" | "siteTitle" | "siteSlug" | "status"
    >);

function statusBadge(status: PurchasedDomain["status"] | DomainConnection["status"], kind: ManagedDomain["kind"]) {
  if (kind === "connected") {
    const connected = status === "verified";
    return {
      label: connected ? "Connected" : "Pending DNS",
      className: connected
        ? "bg-emerald-100 text-emerald-700"
        : "bg-amber-100 text-amber-700",
    };
  }

  if (status === "expired") {
    return { label: "Expired", className: "bg-red-100 text-red-700" };
  }
  if (status === "expiring") {
    return { label: "Expiring soon", className: "bg-amber-100 text-amber-800" };
  }
  return { label: "Active", className: "bg-emerald-100 text-emerald-700" };
}

function DnsEditor({
  records,
  onSave,
}: {
  records: DnsRecord[];
  onSave: (records: DnsRecord[]) => void;
}) {
  const [draft, setDraft] = useState(records);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(records);
  }, [records]);

  const updateRecord = (id: string, patch: Partial<DnsRecord>) => {
    setDraft((current) =>
      current.map((record) =>
        record.id === id ? { ...record, ...patch } : record,
      ),
    );
    setSaved(false);
  };

  const addRecord = () => {
    setDraft((current) => [
      ...current,
      {
        id: `custom-${Date.now()}`,
        type: "A",
        host: "@",
        value: "",
        ttl: 3600,
      },
    ]);
    setSaved(false);
  };

  return (
    <div className="mt-3 space-y-2.5 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-semibold text-zinc-900">DNS records</p>
        <button
          type="button"
          onClick={addRecord}
          className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-zinc-700 transition hover:border-blue-200 hover:text-blue-700"
        >
          Add record
        </button>
      </div>

      {draft.map((record) => (
        <div
          key={record.id}
          className="grid gap-2 rounded-lg border border-zinc-200 bg-white p-2.5 sm:grid-cols-[80px_80px_1fr_70px]"
        >
          <select
            value={record.type}
            onChange={(event) =>
              updateRecord(record.id, {
                type: event.target.value as DnsRecord["type"],
              })
            }
            className="h-9 rounded-lg border border-zinc-200 px-2 text-[11px]"
          >
            {["A", "AAAA", "CNAME", "MX", "TXT"].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            value={record.host}
            onChange={(event) => updateRecord(record.id, { host: event.target.value })}
            placeholder="@"
            className="h-9 rounded-lg border border-zinc-200 px-2 text-[11px]"
          />
          <input
            value={record.value}
            onChange={(event) => updateRecord(record.id, { value: event.target.value })}
            placeholder="Value"
            className="h-9 rounded-lg border border-zinc-200 px-2 text-[11px]"
          />
          <input
            value={record.ttl}
            onChange={(event) =>
              updateRecord(record.id, {
                ttl: Number(event.target.value) || 3600,
              })
            }
            type="number"
            min={60}
            className="h-9 rounded-lg border border-zinc-200 px-2 text-[11px]"
          />
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            onSave(draft);
            setSaved(true);
          }}
          className="inline-flex h-9 items-center justify-center rounded-xl bg-zinc-950 px-3.5 text-[11px] font-semibold text-white transition hover:bg-zinc-800"
        >
          Save DNS
        </button>
        {saved ? (
          <span className="text-[10px] font-semibold text-emerald-700">
            DNS saved locally
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function MyDomainsPanel({
  onNavigate,
}: {
  onNavigate: (tab: DashboardTab) => void;
}) {
  const [items, setItems] = useState<ManagedDomain[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const refresh = useCallback(() => {
    const purchased = listPurchasedDomains().map(
      (domain) =>
        ({
          kind: "purchased",
          ...domain,
        }) as ManagedDomain,
    );

    const purchasedNames = new Set(purchased.map((item) => item.domain));
    const connected = listDomainConnections()
      .filter((connection) => !purchasedNames.has(connection.domain))
      .map(
        (connection) =>
          ({
            kind: "connected",
            connection,
            id: connection.id,
            domain: connection.domain,
            siteId: connection.siteId,
            siteTitle: connection.siteTitle,
            siteSlug: connection.siteSlug,
            status: connection.status,
          }) as ManagedDomain,
      );

    setItems([...purchased, ...connected]);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const purchased = items.filter((item) => item.kind === "purchased");
    return {
      total: items.length,
      expiring: purchased.filter(
        (item) => item.kind === "purchased" && item.status === "expiring",
      ).length,
      autoRenew: purchased.filter(
        (item) => item.kind === "purchased" && item.autoRenew,
      ).length,
    };
  }, [items]);

  const handleRenew = async (domain: PurchasedDomain) => {
    setBusyId(domain.id);
    setNotice("");
    try {
      await fetch("/api/user/domains/renew", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId: domain.id }),
      });
      renewPurchasedDomain(domain.id);
      refresh();
      setNotice(`${domain.domain} renewed for 1 more year.`);
    } catch {
      setNotice("Unable to renew domain right now.");
    } finally {
      setBusyId(null);
    }
  };

  const handleAutoRenew = (domain: PurchasedDomain) => {
    setPurchasedDomainAutoRenew(domain.id, !domain.autoRenew);
    refresh();
  };

  const handleSaveDns = (domain: PurchasedDomain, records: DnsRecord[]) => {
    updatePurchasedDomainDnsRecords(domain.id, records);
    refresh();
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_12px_40px_rgba(24,39,75,.07)]">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 px-4 py-5 sm:px-6">
          <h3 className="text-lg font-bold text-white sm:text-xl">My domains</h3>
          <p className="mt-1 text-xs leading-5 text-blue-100 sm:text-sm">
            Renewal, DNS records, auto-renew, and website connection — all in
            one place.
          </p>
        </div>
        <div className="grid gap-3 px-4 py-4 sm:grid-cols-3 sm:px-6">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
              Total domains
            </p>
            <p className="mt-1 text-lg font-bold text-zinc-950">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
              Expiring soon
            </p>
            <p className="mt-1 text-lg font-bold text-amber-700">{stats.expiring}</p>
          </div>
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
              Auto-renew on
            </p>
            <p className="mt-1 text-lg font-bold text-emerald-700">{stats.autoRenew}</p>
          </div>
        </div>
      </section>

      {notice ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
          {notice}
        </div>
      ) : null}

      {items.length ? (
        <div className="space-y-2.5">
          {items.map((item) => {
            const badge = statusBadge(
              item.kind === "purchased" ? item.status : item.status,
              item.kind,
            );
            const expanded = expandedId === item.id;

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
              >
                <div className="p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        <Globe2 size={18} />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm font-bold text-zinc-950 sm:text-base">
                            {item.domain}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                            {item.kind === "purchased" ? "Purchased" : "Connected"}
                          </span>
                        </div>

                        {item.siteTitle ? (
                          <p className="mt-1 text-xs text-zinc-500">
                            Website:{" "}
                            <span className="font-semibold text-zinc-700">
                              {item.siteTitle}
                            </span>
                            {item.siteSlug ? (
                              <span className="font-mono">
                                {" "}
                                · /published/{item.siteSlug}
                              </span>
                            ) : null}
                          </p>
                        ) : null}

                        {item.kind === "purchased" ? (
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock size={13} />
                              Expires {formatDomainExpiry(item.expiresAt)}
                            </span>
                            <span>{daysUntilExpiry(item.expiresAt)} days left</span>
                            <span className="font-medium text-zinc-700">{item.price}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.kind === "purchased" ? (
                        <>
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => void handleRenew(item)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                          >
                            {busyId === item.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <RefreshCw size={13} />
                            )}
                            Renew
                          </button>
                          <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700">
                            <input
                              type="checkbox"
                              checked={item.autoRenew}
                              onChange={() => handleAutoRenew(item)}
                              className="size-3.5 rounded border-zinc-300"
                            />
                            Auto-renew
                          </label>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : item.id)
                        }
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 transition hover:border-blue-200 hover:text-blue-700"
                      >
                        <Settings2 size={13} />
                        {expanded ? "Hide DNS" : "Manage DNS"}
                      </button>
                    </div>
                  </div>

                  {expanded ? (
                    item.kind === "purchased" ? (
                      <DnsEditor
                        records={item.dnsRecords}
                        onSave={(records) => handleSaveDns(item, records)}
                      />
                    ) : (
                      <ConnectedDomainDnsPanel
                        connection={item.connection}
                        onVerified={refresh}
                      />
                    )
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-5 py-10 text-center">
          <Globe2 size={28} className="mx-auto text-zinc-300" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-zinc-700">
            No domains yet
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Buy a new domain or connect an existing one to see renewal and DNS
            controls here.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2.5 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-white">
            <ShieldCheck size={17} />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Domain billing & invoices
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Purchased domains appear in Billing with Core plan charges.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("Billing")}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:border-blue-200 hover:text-blue-700"
        >
          Billing & invoices
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
