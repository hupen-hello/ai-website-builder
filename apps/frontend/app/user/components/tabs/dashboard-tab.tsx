"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Globe2,
  Layers3,
  Plus,
  Sparkles,
} from "lucide-react";
import TemplateActions from "../template-actions";
import SiteStatusView from "./site-status-view";
import {
  formatRelativeUpdatedAt,
  getSitePreviewGradient,
  type SiteFilter,
  type UserSite,
} from "../types";

type SummaryCardData = {
  label: string;
  filter: SiteFilter;
  count: number;
  status: string;
  detail: string;
  footer: string;
  icon: typeof Layers3;
  surface: string;
  accent: string;
  tagStyle: string;
};

function SummaryCard({
  card,
  onSelect,
}: {
  card: SummaryCardData;
  onSelect: (filter: SiteFilter) => void;
}) {
  const Icon = card.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(card.filter)}
      className={`${card.surface} group flex cursor-pointer flex-col rounded-2xl border p-3 text-left shadow-[0_8px_24px_rgba(45,40,65,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(45,40,65,0.1)]`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`${card.tagStyle} grid size-8 place-items-center rounded-xl`}
        >
          <Icon size={15} />
        </span>
        <span
          className={`${card.tagStyle} rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide`}
        >
          {card.status}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="flex items-end gap-2">
          <strong className={`${card.accent} text-xl leading-none sm:text-2xl`}>
            {card.count}
          </strong>
          <h3 className={`${card.accent} pb-0.5 text-xs font-semibold sm:text-sm`}>
            {card.label}
          </h3>
        </div>
        <p className="text-right text-xs text-zinc-600">{card.detail}</p>
      </div>
      <div className="mt-3 flex items-center border-t border-white/45 pt-2">
        <span className="text-[11px] text-zinc-600">{card.footer}</span>
        <span
          className={`${card.accent} ml-auto flex items-center gap-1 text-[11px] font-semibold`}
        >
          View websites <ArrowRight size={12} />
        </span>
      </div>
    </button>
  );
}

type DashboardTabContentProps = {
  userName: string;
  sites: UserSite[];
  loading: boolean;
  openingSiteId: string | null;
  onManageWebsites: () => void;
  onViewAll: () => void;
  onCreateWebsite: () => void;
  onEdit: (site: UserSite) => void;
};

export default function DashboardTabContent({
  userName,
  sites,
  loading,
  openingSiteId,
  onManageWebsites,
  onViewAll,
  onCreateWebsite,
  onEdit,
}: DashboardTabContentProps) {
  const [siteFilter, setSiteFilter] = useState<SiteFilter | null>(null);

  const publishedSites = sites.filter((site) => site.published).length;
  const draftSites = sites.length - publishedSites;
  const latestDraft = useMemo(
    () =>
      [...sites]
        .filter((site) => !site.published)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )[0],
    [sites],
  );

  const summaryCards: SummaryCardData[] = [
    {
      label: "Total websites",
      filter: "all",
      count: sites.length,
      status: "All sites",
      detail: `${publishedSites} published · ${draftSites} draft`,
      footer: `${sites.length} active project${sites.length === 1 ? "" : "s"}`,
      icon: Layers3,
      surface: "border-[#d9ddfa] bg-[#e8e9ff]",
      accent: "text-[#2563eb]",
      tagStyle: "bg-white/65 text-[#2563eb]",
    },
    {
      label: "Live websites",
      filter: "published",
      count: publishedSites,
      status: "Published",
      detail: "Available to visitors",
      footer: publishedSites > 0 ? "All sites online" : "No live sites yet",
      icon: CheckCircle2,
      surface: "border-[#ccebdd] bg-[#dcf5e9]",
      accent: "text-[#28805b]",
      tagStyle: "bg-white/65 text-[#2d8b63]",
    },
    {
      label: "Draft websites",
      filter: "draft",
      count: draftSites,
      status: "In progress",
      detail: latestDraft?.title || "No drafts yet",
      footer: latestDraft
        ? formatRelativeUpdatedAt(latestDraft.updatedAt)
        : "Start a new draft",
      icon: Clock3,
      surface: "border-[#f1dfc5] bg-[#faebd7]",
      accent: "text-[#b96a22]",
      tagStyle: "bg-white/65 text-[#b96a22]",
    },
  ];

  const recentSites = useMemo(
    () =>
      [...sites]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 3),
    [sites],
  );

  if (siteFilter) {
    return (
      <SiteStatusView
        filter={siteFilter}
        sites={sites}
        openingSiteId={openingSiteId}
        deletingSiteId={null}
        onBack={() => setSiteFilter(null)}
        onEdit={onEdit}
        onDelete={() => undefined}
      />
    );
  }

  return (
    <section className="relative mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 sm:py-6 lg:px-9">
      <div className="relative isolate overflow-hidden rounded-[24px] border border-blue-100 bg-[#eef2ff] p-4 shadow-[0_16px_45px_rgba(48,75,155,.10)] sm:p-5">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-45"
        >
          <source src="/a2.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,.96)_0%,rgba(248,248,255,.88)_36%,rgba(231,227,255,.55)_68%,rgba(255,255,255,.75)_100%)]" />
        <div className="absolute -right-16 -top-24 -z-10 size-80 rounded-full bg-blue-300/20 blur-xl" />

        <div className="relative max-w-md py-2 sm:py-3">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-blue-700 backdrop-blur">
            <Sparkles size={11} /> AI workspace ready
          </p>
          <h2 className="mt-2.5 text-xl font-bold leading-tight tracking-tight text-zinc-950 sm:text-2xl">
            Welcome back,
            <br />
            {userName.split(" ")[0] || userName}.
          </h2>
          <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-600 sm:text-sm">
            Create with AI, manage your drafts, and publish every website from
            one smart workspace.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCreateWebsite}
              className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 sm:text-sm"
            >
              <Plus size={15} /> Create website
            </button>
            <button
              type="button"
              onClick={onManageWebsites}
              className="flex h-10 items-center gap-2 rounded-xl border border-blue-100 bg-white/90 px-4 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur transition hover:border-blue-300 sm:text-sm"
            >
              <Globe2 size={15} /> Manage websites
            </button>
          </div>
        </div>

        <div className="relative mt-6 rounded-2xl border border-white/80 bg-white/55 p-2.5 shadow-[0_10px_35px_rgba(42,52,94,.08)] backdrop-blur-md sm:mt-8 sm:p-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map((card) => (
              <SummaryCard
                key={card.label}
                card={{
                  ...card,
                  count: loading ? 0 : card.count,
                }}
                onSelect={setSiteFilter}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-950 sm:text-base">
          Recent websites
        </h3>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-semibold text-blue-700 sm:text-sm"
        >
          View all <ArrowRight size={14} />
        </button>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          [1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-[212px] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100"
            />
          ))
        ) : recentSites.length ? (
          recentSites.map((site, index) => {
            const previewHref = site.published
              ? `/published/${site.slug}`
              : null;

            return (
              <article
                key={site.id}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative h-44 overflow-hidden bg-zinc-100">
                  <div
                    className="absolute inset-0 transition duration-500 group-hover:scale-[1.02]"
                    style={{ background: getSitePreviewGradient(index) }}
                  />
                  <span className="absolute inset-0 bg-zinc-950/0 transition group-hover:bg-zinc-950/10" />
                </div>
                <div className="flex h-[68px] items-center gap-3 p-4">
                  <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
                    <Globe2 size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-zinc-900 group-hover:text-blue-700">
                      {site.title || "Untitled website"}
                    </h4>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {formatRelativeUpdatedAt(site.updatedAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      site.published
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {site.published ? "Published" : "Draft"}
                  </span>
                  <TemplateActions
                    name={site.title || "Untitled website"}
                    previewHref={previewHref}
                    onEdit={() => onEdit(site)}
                    editing={openingSiteId === site.id}
                  />
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-xs text-zinc-500 sm:text-sm">
            No websites yet. Create your first website to see it here.
          </div>
        )}
      </div>
    </section>
  );
}
