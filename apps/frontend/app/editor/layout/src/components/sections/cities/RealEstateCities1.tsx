"use client";

import { useMemo, useState } from "react";
import { useOptionalPreview } from "../../context/PreviewContext";
import Image from "next/image";
import Link from "next/link";
import { FaArrowRight, FaBuilding } from "react-icons/fa";
import type { SectionProps } from "../../../types/section";
import { resolvePublishedListingHref, resolvePublishedPageHref } from "../../../lib/sectionScroll";
import {
  handleManagerCardClick,
  slugFromListingHref,
} from "../../../lib/editorManagerCards";

// const MAX_CARDS = 4;

type CityItem = {
  name: string;
  desc: string;
  image: string;
  alt: string;
  listingsLabel?: string;
  href: string;
  slug?: string;
  category?: string;
  location?: string;
};

type SectionButton = {
  label: string;
  href: string;
};

const getString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getCities = (value: unknown, detailBase?: string): CityItem[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const city = item as Record<string, unknown>;
    const name = getString(city.name, getString(city.title));
    const image = getString(city.image);

    if (!name || !image) return [];

    const slug = getString(city.slug, slugify(name));
    const rawHref = getString(city.href, "/projects");

    return [
      {
        name,
        image,
        alt: getString(city.alt, name),
        desc: getString(city.desc, getString(city.description)),
        listingsLabel: getString(city.listingsLabel) || undefined,
        href: resolvePublishedListingHref(rawHref, detailBase, slug),
        slug,
        category: getString(city.category) || undefined,
        location: getString(city.location) || undefined,
      },
    ];
  });
};

const getCategories = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
      (category): category is string =>
        typeof category === "string" && Boolean(category.trim()),
    )
    : [];

const getTabLabels = (value: unknown) =>
  Array.isArray(value)
    ? value.map((label) => (typeof label === "string" ? label : ""))
    : [];

const getButton = (value: unknown): SectionButton | null => {
  if (!value || typeof value !== "object") return null;

  const button = value as Record<string, unknown>;
  const label = getString(button.label);
  const href = getString(button.href);

  return label && href ? { label, href } : null;
};

const bypassImageOptimization = (src: string) =>
  src.startsWith("data:") ||
  src.startsWith("http://") ||
  src.startsWith("https://");

export default function RealEstateCities1({
  data = {},
  editorMode = false,
}: SectionProps) {
  const portfolioDetailBase =
    typeof data.portfolioDetailBase === "string"
      ? data.portfolioDetailBase.trim()
      : "";
  const siteBase =
    typeof data.publishedSiteBase === "string" ? data.publishedSiteBase : "";
  const cities = useMemo(
    () => getCities(data.cities, portfolioDetailBase || undefined),
    [data.cities, portfolioDetailBase],
  );
  const categories = useMemo(
    () => getCategories(data.categories),
    [data.categories],
  );
  const filterValues = useMemo(() => {
    if (categories.length) {
      return categories[0].toLowerCase() === "all"
        ? categories
        : ["All", ...categories];
    }

    const fromItems = Array.from(
      new Set(
        cities
          .map((city) => city.category ?? city.listingsLabel)
          .filter((category): category is string => Boolean(category)),
      ),
    );

    return ["All", ...fromItems];
  }, [categories, cities]);
  const tabLabels = useMemo(() => getTabLabels(data.tabs), [data.tabs]);
  const filters = useMemo(
    () =>
      filterValues.map((value, index) => ({
        value,
        label: tabLabels[index] || value,
      })),
    [filterValues, tabLabels],
  );
  const preview = useOptionalPreview();
  const [localFilter, setLocalFilter] = useState("All");
  const setActivePortfolioFilter =
    preview?.setActivePortfolioFilter ?? setLocalFilter;
  const portfolioFilter =
    preview?.activePortfolioFilter || localFilter || "All";
  const button = getButton(data.button);
  const resolveListingHref = (href: string) =>
    resolvePublishedListingHref(href, portfolioDetailBase || undefined);
  const projectsIndexHref = resolvePublishedPageHref(
    "/projects",
    siteBase || undefined,
  );

  if (!cities.length) return null;

  return (
    <section className="bg-white py-7 md:py-8">
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          {data.pretitle && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c44536]">
              {data.pretitle}
            </p>
          )}
          {data.title && (
            <h2 className="mt-3 text-[1.75rem] font-semibold leading-tight text-[#141414] sm:text-[2rem] md:text-[2.5rem]">
              {data.title}
            </h2>
          )}
          {data.desc && (
            <p className="mt-3 text-sm leading-relaxed text-[#141414]/65 md:text-base">
              {data.desc}
            </p>
          )}
        </div>

        <div className="mt-6 flex max-w-full justify-start gap-2 overflow-x-auto pb-1 md:mt-8 md:justify-center [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((filter) => {
            const isActive = portfolioFilter === filter.value;
            return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={isActive}
              data-export-filter={filter.value}
              onClick={() => {
                setActivePortfolioFilter(filter.value);
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${isActive
                ? "bg-[#141414] text-white"
                : "text-[#141414] hover:bg-[#141414]/5"
                }`}
            >
              {filter.label}
            </button>
            );
          })}
        </div>

        <div
          data-box-layout-grid="grid"
          data-editor-no-inline
          data-editor-card-fields="image alt category listingsLabel name title location desc description href"
          className="
    mt-8
    flex
    gap-4
    overflow-x-auto
    scroll-smooth
    snap-x
    snap-mandatory
    pb-3
    md:mt-10
    md:gap-5
    [-ms-overflow-style:none]
    [scrollbar-width:none]
    [&::-webkit-scrollbar]:hidden
  "
        >
          {cities.map((city) => {
            const category = city.category ?? city.listingsLabel ?? "";
            const isVisible =
              portfolioFilter === "All" ||
              category.toLowerCase() === portfolioFilter.toLowerCase();

            return (
              <Link
                key={`${city.name}-${city.href}`}
                href={city.href}
                data-export-card-category={category || "All"}
                className={`
    group
    relative
    w-[85%]
    shrink-0
    snap-start
    overflow-hidden
    rounded-2xl
    sm:w-[48%]
    lg:w-[calc(25%-15px)]
    ${isVisible ? "" : "hidden"}
  `}
                onClick={(event) => {
                  handleManagerCardClick(event, editorMode, "Portfolio", {
                    slug:
                      city.slug ||
                      slugFromListingHref(city.href, "projects") ||
                      slugify(city.name),
                    href: resolveListingHref(city.href),
                    title: city.name,
                  });
                }}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#f3efe8]">
                  <Image
                    src={city.image}
                    alt={city.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    unoptimized={bypassImageOptimization(city.image)}
                    data-editor-media
                    data-editor-media-type="image"
                    data-editor-media-src={city.image}
                    className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    {category && (
                      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/85">
                        <FaBuilding className="text-[10px]" aria-hidden />
                        {category}
                      </p>
                    )}
                    <h3 className="mt-2 text-lg font-semibold leading-snug">
                      {city.name}
                    </h3>
                    {city.desc && (
                      <p className="mt-1 line-clamp-1 text-sm text-white/80">
                        {city.desc}
                      </p>
                    )}
                    {city.location && (
                      <p className="mt-1.5 text-xs text-white/65">
                        {city.location}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {button && (
          <div className="mt-8 flex justify-center">
            <Link
              href={
                portfolioFilter === "All"
                  ? resolvePublishedPageHref(button.href, siteBase || undefined)
                  : `${projectsIndexHref}?category=${encodeURIComponent(portfolioFilter)}`
              }
              className="inline-flex items-center gap-2 rounded-full bg-[#141414] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#141414]/90"
            >
              {button.label}
              <FaArrowRight className="text-[10px]" aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
