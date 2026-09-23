"use client";

import { useEffect, useRef, useState } from "react";
import {
  REDESIGN_ESTIMATE_MS,
  getRedesignBuildStartedAt,
  readRedesignBuildFeed,
  subscribeRedesignBuildFeed,
  type RedesignFeedEvent,
} from "@/lib/redesign-build-feed";
import { getBuiltSiteSections } from "@/lib/built-site-theme";

function toneClass(tone?: RedesignFeedEvent["tone"]) {
  if (tone === "ok") return "bg-emerald-500";
  if (tone === "warn") return "bg-amber-500";
  if (tone === "work") return "bg-blue-500";
  return "bg-slate-400";
}

function formatClock(at: number) {
  const d = new Date(at);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatRemaining(ms: number) {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m <= 0) return `~${s}s left`;
  return `~${m}m ${s.toString().padStart(2, "0")}s left`;
}

function BuildTimeProgress({
  designId,
  done = false,
}: {
  designId?: string;
  done?: boolean;
}) {
  const [now, setNow] = useState<number | null>(null);
  const [sectionCount, setSectionCount] = useState(0);
  const [planCount, setPlanCount] = useState(0);

  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      const sections = getBuiltSiteSections(designId);
      setSectionCount(sections?.items?.length || 0);
      try {
        const id = designId || "";
        const themeRaw =
          window.sessionStorage.getItem(`lestow-redesign-built-site:${id}`) ||
          window.localStorage.getItem(`lestow-redesign-built-site:${id}`);
        if (themeRaw) {
          const theme = JSON.parse(themeRaw) as { sectionPlan?: unknown[] };
          setPlanCount(Array.isArray(theme.sectionPlan) ? theme.sectionPlan.length : 0);
        }
      } catch {
        /* ignore */
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [designId]);

  const startedAt = now == null ? 0 : getRedesignBuildStartedAt(designId);
  const elapsed = now == null ? 0 : Math.max(0, now - startedAt);
  const sectionShare =
    planCount > 0
      ? Math.min(0.95, sectionCount / Math.max(planCount, 1))
      : sectionCount > 0
        ? Math.min(0.5, sectionCount / 12)
        : 0;
  const timeShare = Math.min(0.2, elapsed / REDESIGN_ESTIMATE_MS);
  const raw = sectionCount === 0 ? timeShare * 0.5 : sectionShare * 0.85 + timeShare * 0.15;
  const percent = done ? 100 : now == null ? 0 : Math.min(96, Math.round(raw * 100));
  const overdue = !done && now != null && elapsed > REDESIGN_ESTIMATE_MS;
  const remaining = done
    ? 0
    : now == null
      ? REDESIGN_ESTIMATE_MS
      : Math.max(0, REDESIGN_ESTIMATE_MS - elapsed);
  const timeLabel = done
    ? "Ready"
    : overdue
      ? `${percent}% · still working (${Math.floor(elapsed / 60_000)}m elapsed)`
      : sectionCount === 0
        ? `${percent}% · capturing / waiting on first Lestow HTML`
        : `${percent}% · ${formatRemaining(remaining)}`;

  return (
    <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-[11px]">
        <span className="font-semibold text-slate-700">
          {done
            ? "Complete"
            : overdue
              ? "Taking longer than usual"
              : sectionCount === 0
                ? "Early phase"
                : "Estimated progress"}
        </span>
        <span className="tabular-nums text-slate-500">{timeLabel}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] leading-4 text-slate-500">
        Typical redesign ~1–3 min (read your domain + rebuild).{" "}
        {sectionCount > 0
          ? `${sectionCount}${planCount ? `/${planCount}` : ""} sections streamed.`
          : "No section HTML yet — reading your existing website…"}
      </p>
    </div>
  );
}

export default function LiveBuildFeed({
  designId,
  compact = false,
  className = "",
  done = false,
}: {
  designId?: string;
  compact?: boolean;
  className?: string;
  done?: boolean;
}) {
  const [events, setEvents] = useState<RedesignFeedEvent[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setEvents(readRedesignBuildFeed(designId));
    sync();
    const unsub = subscribeRedesignBuildFeed(sync);
    const timer = window.setInterval(sync, 700);
    return () => {
      unsub();
      window.clearInterval(timer);
    };
  }, [designId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events.length]);

  if (!events.length) {
    return (
      <div
        className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
      >
        <div className="p-4">
          <p className="text-sm font-medium text-slate-800">Preparing live build log…</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Every capture, Lestow pass, and section fill will stream here so you always know what is
            happening.
          </p>
        </div>
        <BuildTimeProgress designId={designId} done={done} />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
            Live build feed
          </p>
          <p className="truncate text-xs text-slate-500">
            Moment-by-moment — stay with the redesign while Lestow works
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
      </div>
      <ul
        className={`space-y-2.5 overflow-y-auto px-3 py-3 ${compact ? "max-h-36" : "max-h-[min(44vh,360px)]"}`}
      >
        {events.map((ev) => (
          <li
            key={ev.id}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition"
          >
            <div className="flex items-start gap-2.5">
              <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${toneClass(ev.tone)}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[13px] font-semibold leading-snug text-slate-900">{ev.title}</p>
                  <time className="shrink-0 text-[10px] tabular-nums text-slate-400">
                    {formatClock(ev.at)}
                  </time>
                </div>
                {ev.detail ? (
                  <p className="mt-1 text-[12px] leading-5 text-slate-600">{ev.detail}</p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
        <div ref={bottomRef} />
      </ul>
      <BuildTimeProgress designId={designId} done={done} />
    </div>
  );
}
