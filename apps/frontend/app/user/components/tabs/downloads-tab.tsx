"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Download,
  FileCode2,
  FileStack,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  EXPORT_MAX_DOWNLOADS,
  EXPORT_PACKAGES,
  formatExportPrice,
  type ExportFormat,
} from "@/lib/exportPricing";
import { formatInr } from "@/lib/razorpayPlans";
import {
  listPurchasedExports,
  setExportDownloadsRemaining,
  type PurchasedExport,
} from "@/lib/userExports";
import type { DashboardTab } from "../sidebar";
import type { UserSite } from "../types";

type DownloadsTabProps = {
  sites: UserSite[];
  onNavigate: (tab: DashboardTab) => void;
};

function formatPurchasedAt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function siteLabel(item: PurchasedExport, sites: UserSite[]) {
  const live = sites.find((site) => site.id === item.siteId);
  return (
    live?.title?.trim() ||
    item.siteTitle?.trim() ||
    item.siteSlug ||
    "Website"
  );
}

export default function DownloadsTab({ sites, onNavigate }: DownloadsTabProps) {
  const [tick, setTick] = useState(0);
  const [exports, setExports] = useState<PurchasedExport[]>([]);
  const [filter, setFilter] = useState<"all" | "available" | "exhausted">(
    "all",
  );
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const inFlightRef = useRef(false);

  const refresh = () => {
    const ownedIds = new Set(sites.map((site) => site.id));
    setExports(
      listPurchasedExports().filter((item) => ownedIds.has(item.siteId)),
    );
    setTick((value) => value + 1);
  };

  useEffect(() => {
    refresh();
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [sites]);

  void tick;

  const stats = useMemo(() => {
    const available = exports.filter((item) => item.downloadsRemaining > 0);
    const exhausted = exports.filter((item) => item.downloadsRemaining <= 0);
    const remainingTotal = exports.reduce(
      (sum, item) => sum + item.downloadsRemaining,
      0,
    );
    return {
      total: exports.length,
      available: available.length,
      exhausted: exhausted.length,
      remainingTotal,
    };
  }, [exports]);

  const filtered = useMemo(() => {
    if (filter === "available") {
      return exports.filter((item) => item.downloadsRemaining > 0);
    }
    if (filter === "exhausted") {
      return exports.filter((item) => item.downloadsRemaining <= 0);
    }
    return exports;
  }, [exports, filter]);

  const downloadExport = async (item: PurchasedExport) => {
    const key = `${item.siteId}:${item.format}`;
    if (inFlightRef.current || item.downloadsRemaining <= 0) return;

    inFlightRef.current = true;
    setError("");
    setExportingKey(key);
    try {
      const res = await fetch(
        `/api/user/sites/${item.siteId}/export-${item.format === "html" ? "html" : "nextjs"}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data.message || "Unable to download export");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const matched = disposition.match(/filename=\"([^\"]+)\"/i);
      const filename =
        matched?.[1] ||
        `${item.siteSlug || "website"}-${item.format}.zip`;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      const remainingHeader = res.headers.get("X-Export-Downloads-Remaining");
      const remaining = Number(remainingHeader);
      if (Number.isFinite(remaining)) {
        setExportDownloadsRemaining(item.siteId, item.format, remaining);
      }
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to download export");
    } finally {
      inFlightRef.current = false;
      setExportingKey(null);
    }
  };

  const exportingItem = exportingKey
    ? exports.find((item) => `${item.siteId}:${item.format}` === exportingKey)
    : null;

  return (
    <section className="relative min-h-full overflow-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-9">
      <div className="pointer-events-none absolute -left-16 top-8 size-64 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 size-72 rounded-full bg-sky-100/50 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1080px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-blue-700 shadow-sm">
              <Download size={12} /> Paid exports
            </span>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
              Download Management
            </h2>
            <p className="mt-1 max-w-lg text-xs leading-5 text-zinc-500 sm:text-sm">
              Track HTML and Next.js purchases, remaining downloads, and
              re-download your packages.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("My Websites")}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
          >
            Buy new export
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Purchases", value: stats.total },
            { label: "Ready to download", value: stats.available },
            { label: "Downloads left", value: stats.remainingTotal },
            { label: "Used up", value: stats.exhausted },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-zinc-200 bg-white px-3.5 py-3 shadow-sm"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
                {card.label}
              </p>
              <p className="mt-1 text-xl font-bold text-zinc-950">{card.value}</p>
            </div>
          ))}
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 sm:text-sm">
            {error}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
            {(
              [
                ["all", "All"],
                ["available", "Available"],
                ["exhausted", "Used up"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${
                  filter === value
                    ? "bg-blue-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-600 transition hover:border-blue-200 hover:text-blue-700"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-white px-5 py-12 text-center shadow-sm">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <Download size={22} />
            </span>
            <h3 className="mt-3 text-base font-semibold text-zinc-950">
              {exports.length === 0
                ? "No export purchases yet"
                : "No exports in this filter"}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-zinc-500">
              {exports.length === 0
                ? "Go to My Websites, open the menu on a published site, and choose Export Website."
                : "Try another filter or buy a new export package."}
            </p>
            <button
              type="button"
              onClick={() => onNavigate("My Websites")}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Open My Websites
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {filtered.map((item) => {
              const key = `${item.siteId}:${item.format}`;
              const pack = EXPORT_PACKAGES[item.format as ExportFormat];
              const remaining = item.downloadsRemaining;
              const used = Math.max(0, item.downloadsMax - remaining);
              const canDownload = remaining > 0;
              const busy = exportingKey === key;
              const Icon = item.format === "html" ? FileStack : FileCode2;

              return (
                <article
                  key={key}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        <Icon size={20} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-zinc-950">
                            {siteLabel(item, sites)}
                          </h3>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              canDownload
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {canDownload
                              ? `${remaining} left`
                              : "Limit reached"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {pack.label} · {formatInr(item.amountInr || pack.priceInr)}{" "}
                          · Purchased {formatPurchasedAt(item.purchasedAt)}
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-400">
                          {item.siteSlug
                            ? `/published/${item.siteSlug}`
                            : item.siteId}
                          {" · "}
                          {used} of {item.downloadsMax || EXPORT_MAX_DOWNLOADS}{" "}
                          used
                        </p>
                        <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className={`h-full rounded-full ${
                              canDownload ? "bg-blue-600" : "bg-amber-500"
                            }`}
                            style={{
                              width: `${Math.max(
                                4,
                                (remaining /
                                  (item.downloadsMax || EXPORT_MAX_DOWNLOADS)) *
                                  100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                      {canDownload ? (
                        <button
                          type="button"
                          disabled={Boolean(exportingKey)}
                          onClick={() => void downloadExport(item)}
                          className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                        >
                          {busy ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Preparing…
                            </>
                          ) : (
                            <>
                              <Download size={14} />
                              Download ZIP
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onNavigate("My Websites")}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:border-blue-200 hover:text-blue-700"
                        >
                          Buy again · {formatExportPrice(item.format)}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 text-xs leading-5 text-zinc-500 shadow-sm">
          Each paid export includes up to {EXPORT_MAX_DOWNLOADS} downloads for
          that website and format. HTML is {formatExportPrice("html")}; Next.js
          is {formatExportPrice("nextjs")}.
        </div>
      </div>

      {exportingKey && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[10070] flex items-center justify-center p-4"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[2px]" />
              <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/80 bg-white px-6 py-8 text-center shadow-[0_30px_90px_rgba(15,23,42,.28)]">
                <span className="grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <Loader2 size={28} className="animate-spin" />
                </span>
                <div>
                  <p className="text-base font-semibold text-zinc-950">
                    Preparing{" "}
                    {exportingItem?.format === "nextjs" ? "Next.js" : "HTML"}{" "}
                    export
                  </p>
                  <p className="mt-1.5 text-sm leading-5 text-zinc-500">
                    Packaging your website… Download will start automatically.
                  </p>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
