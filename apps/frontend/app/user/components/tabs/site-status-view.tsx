"use client";

import { useState } from "react";
import { ArrowLeft, Globe2 } from "lucide-react";
import TemplateActions from "../template-actions";
import { getSitePreviewGradient, type SiteFilter, type UserSite } from "../types";

type SiteStatusViewProps = {
  filter: SiteFilter;
  sites: UserSite[];
  openingSiteId: string | null;
  deletingSiteId: string | null;
  onBack: () => void;
  onEdit: (site: UserSite) => void;
  onDelete: (site: UserSite) => void;
};

export default function SiteStatusView({
  filter,
  sites,
  openingSiteId,
  deletingSiteId,
  onBack,
  onEdit,
  onDelete,
}: SiteStatusViewProps) {
  const visibleSites = sites.filter((site) => {
    if (filter === "all") return true;
    return filter === "published" ? site.published : !site.published;
  });

  const heading =
    filter === "all"
      ? "All websites"
      : filter === "published"
        ? "Published websites"
        : "Draft websites";

  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 sm:py-6 lg:px-9">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-zinc-500 transition hover:text-blue-700 sm:text-sm"
      >
        <ArrowLeft size={15} /> Back to dashboard
      </button>
      <div className="mt-4">
        <h2 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
          {heading}
        </h2>
        <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
          {visibleSites.length}{" "}
          {visibleSites.length === 1 ? "website" : "websites"} in this view.
        </p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleSites.map((site, index) => {
          const previewHref = site.published ? `/published/${site.slug}` : null;

          return (
            <article
              key={site.id}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative h-48 overflow-hidden bg-zinc-100">
                <div
                  className="absolute inset-0 transition duration-500 group-hover:scale-[1.02]"
                  style={{ background: getSitePreviewGradient(index) }}
                />
                {!site.published && (
                  <span className="absolute left-3 top-3 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
                    Unpublished draft
                  </span>
                )}
              </div>
              <div className="flex h-[72px] items-center gap-3 p-4">
                <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <Globe2 size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-zinc-900">
                    {site.title || "Untitled website"}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {site.category || "Website"}
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
                  onDelete={() => onDelete(site)}
                  editing={openingSiteId === site.id}
                  deleting={deletingSiteId === site.id}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
