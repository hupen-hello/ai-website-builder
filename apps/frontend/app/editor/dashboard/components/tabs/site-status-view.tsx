"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Globe2 } from "lucide-react";
import TemplateActions from "../template-actions";
import { getSitePreviewImage, type SiteFilter, type UserSite } from "../types";

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
    <section className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-9">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-medium text-zinc-500 transition hover:text-blue-700"
      >
        <ArrowLeft size={15} /> Back to dashboard
      </button>
      <div className="mt-5">
        <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>
        <p className="mt-1 text-xs text-zinc-500">
          {visibleSites.length}{" "}
          {visibleSites.length === 1 ? "website" : "websites"} in this view.
        </p>
      </div>
      <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleSites.map((site, index) => {
          const previewHref = site.published ? `/published/${site.slug}` : null;

          return (
            <article
              key={site.id}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative h-48 overflow-hidden bg-zinc-100">
                <Image
                  src={getSitePreviewImage(index)}
                  alt={`${site.title || "Website"} preview`}
                  fill
                  className="object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                />
                {!site.published && (
                  <span className="absolute left-3 top-3 rounded-full bg-amber-100 px-2.5 py-1 text-[9px] font-semibold text-amber-800">
                    Unpublished draft
                  </span>
                )}
              </div>
              <div className="flex h-[72px] items-center gap-3 p-4">
                <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <Globe2 size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium">
                    {site.title || "Untitled website"}
                  </h3>
                  <p className="mt-1 text-[10px] text-zinc-500">
                    {site.category || "Website"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-[9px] ${
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
