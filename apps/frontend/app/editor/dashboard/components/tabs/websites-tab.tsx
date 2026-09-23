"use client";

import Image from "next/image";
import { Globe2, Plus, Search } from "lucide-react";
import TemplateActions from "../template-actions";
import { getSitePreviewImage, type UserSite } from "../types";

type WebsitesTabProps = {
  sites: UserSite[];
  loading: boolean;
  searchQuery: string;
  statusFilter: "all" | "published" | "draft";
  openingSiteId: string | null;
  deletingSiteId: string | null;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | "published" | "draft") => void;
  onCreateWebsite: () => void;
  onEdit: (site: UserSite) => void;
  onDelete: (site: UserSite) => void;
};

export default function WebsitesTab({
  sites,
  loading,
  searchQuery,
  statusFilter,
  openingSiteId,
  deletingSiteId,
  onSearchChange,
  onStatusFilterChange,
  onCreateWebsite,
  onEdit,
  onDelete,
}: WebsitesTabProps) {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredSites = sites.filter((site) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" ? site.published : !site.published);
    const matchesSearch =
      !normalizedSearch ||
      [site.title, site.category, site.slug].some((value) =>
        value?.toLowerCase().includes(normalizedSearch),
      );

    return matchesStatus && matchesSearch;
  });

  return (
    <section className="mx-auto w-full max-w-[1320px] px-6 py-8 lg:px-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">My Websites</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Manage drafts and published websites.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateWebsite}
          className="flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-medium text-white"
        >
          <Plus size={16} /> New website
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-zinc-500 sm:max-w-md">
          <Search size={16} />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search websites"
            className="min-w-0 flex-1 bg-transparent text-xs text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(
              event.target.value as "all" | "published" | "draft",
            )
          }
          className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-medium text-zinc-700 outline-none"
          aria-label="Filter websites by status"
        >
          <option value="all">All sites</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-[260px] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100"
            />
          ))}
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center text-sm text-zinc-500">
          {sites.length === 0
            ? "No websites yet. Create your first website to get started."
            : "No matching websites. Try a different search or filter."}
        </div>
      ) : (
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredSites.map((site, index) => {
            const previewHref = site.published
              ? `/published/${site.slug}`
              : null;

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
                </div>
                <div className="flex h-[68px] items-center gap-3 p-4">
                  <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
                    <Globe2 size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium group-hover:text-blue-700">
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
      )}
    </section>
  );
}
