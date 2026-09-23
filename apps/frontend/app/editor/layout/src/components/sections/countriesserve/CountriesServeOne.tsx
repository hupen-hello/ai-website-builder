"use client";

import Image from "next/image";
import type {
  CountryServeItemData,
  CountryServeListingData,
  SectionProps,
} from "../../../types/section";
import InlineRichText from "../../builder/InlineRichText";
import { resolveCountryFlagImage } from "@/lib/countryFlags";

const createListingSlug = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getCountries = (data: SectionProps["data"]): CountryServeItemData[] => {
  const items = Array.isArray(data?.countriesServeItems)
    ? data.countriesServeItems
    : [];
  return items
    .filter((item) => item && item.active !== false)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

const getListings = (
  data: SectionProps["data"],
): CountryServeListingData[] => {
  if (Array.isArray(data?.countriesServeListings)) {
    return data.countriesServeListings
      .filter((item) => item && item.active !== false)
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  const migrated: CountryServeListingData[] = [];
  const rawCountries = Array.isArray(data?.countriesServeItems)
    ? data.countriesServeItems
    : [];
  for (const country of rawCountries) {
    if (!Array.isArray(country.items)) continue;
    for (const link of country.items) {
      const legacy = link as CountryServeListingData & { href?: string };
      migrated.push({
        id: legacy.id,
        title: legacy.title,
        category: country.name,
        countryId: country.id,
        desc: legacy.desc,
        content: legacy.content,
        image: legacy.image,
        alt: legacy.alt,
        link: legacy.link || legacy.href || "",
        slug: legacy.slug,
        order: legacy.order,
        active: legacy.active !== false,
        seoTitle: legacy.seoTitle,
        seoDescription: legacy.seoDescription,
        seoKeywords: legacy.seoKeywords,
      });
    }
  }
  return migrated
    .filter((item) => item && item.active !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

const resolveListingHref = (
  listing: CountryServeListingData,
  detailBase?: string,
) => {
  const slug =
    (listing.slug || "").trim() || createListingSlug(listing.title || "");
  const explicit = (listing.link || "").trim();
  if (explicit && explicit !== "#") return explicit;
  if (detailBase && slug) {
    return `${detailBase.replace(/\/+$/, "")}/${encodeURIComponent(slug)}`;
  }
  if (slug) return `#master-detail/country/${encodeURIComponent(slug)}`;
  return "";
};

export default function CountriesServeOne({
  data = {},
  editorMode = false,
}: SectionProps) {
  const countries = getCountries(data);
  const listings = getListings(data);
  const detailBase =
    typeof data.countriesServeDetailBase === "string"
      ? data.countriesServeDetailBase.trim()
      : "";
  const titleFormatKey = "countries-serve:title";
  const descriptionFormatKey = "countries-serve:description";

  if (!countries.length && !editorMode) return null;

  return (
    <section className="bg-white px-5 py-14 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          {data.title ? (
            <h2
              className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
              data-editor-inline-format-key={titleFormatKey}
            >
              <InlineRichText value={data.title} formatKey={titleFormatKey} />
            </h2>
          ) : null}
          {data.desc ? (
            <p
              className="mt-4 text-sm leading-7 text-slate-600 sm:text-base"
              data-editor-inline-format-key={descriptionFormatKey}
            >
              <InlineRichText
                value={data.desc}
                formatKey={descriptionFormatKey}
              />
            </p>
          ) : null}
        </div>

        {countries.length ? (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {countries.map((country, countryIndex) => {
              const countryListings = listings.filter(
                (listing) =>
                  (country.id && listing.countryId === country.id) ||
                  (listing.category || "").trim().toLowerCase() ===
                    (country.name || "").trim().toLowerCase(),
              );
              const flagSrc =
                (country.flagImage || "").trim() ||
                resolveCountryFlagImage(country.name || "");
              return (
                <article
                  key={country.id || `${country.name}-${countryIndex}`}
                  className="min-w-0"
                >
                  <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
                    {flagSrc ? (
                      <span className="relative h-5 w-7 shrink-0 overflow-hidden rounded-[2px] bg-slate-100 shadow-sm ring-1 ring-slate-200">
                        <Image
                          src={flagSrc}
                          alt={country.flagAlt || country.name || "Flag"}
                          data-editor-media
                          data-editor-media-type="image"
                          data-editor-media-src={flagSrc}
                          fill
                          className="object-cover"
                          unoptimized={
                            flagSrc.startsWith("data:") ||
                            flagSrc.includes("flagcdn.com")
                          }
                        />
                      </span>
                    ) : (
                      <span className="h-5 w-7 shrink-0 rounded-[2px] bg-slate-200" />
                    )}
                    <h3
                      className="truncate text-base font-bold text-slate-950"
                      data-editor-inline-format-key={`countries-serve:country:${countryIndex}:name`}
                    >
                      <InlineRichText
                        value={country.name}
                        formatKey={`countries-serve:country:${countryIndex}:name`}
                      />
                    </h3>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {countryListings.map((listing, linkIndex) => {
                      const href = resolveListingHref(listing, detailBase);
                      const label = listing.title || "";
                      if (!label) return null;
                      const content = (
                        <span
                          data-editor-inline-format-key={`countries-serve:country:${countryIndex}:link:${linkIndex}`}
                        >
                          <InlineRichText
                            value={label}
                            formatKey={`countries-serve:country:${countryIndex}:link:${linkIndex}`}
                          />
                        </span>
                      );
                      return (
                        <li
                          key={listing.id || `${label}-${linkIndex}`}
                          className="text-sm leading-6 text-slate-700"
                        >
                          {href ? (
                            <a
                              href={href}
                              className="transition hover:text-slate-950 hover:underline"
                            >
                              {content}
                            </a>
                          ) : (
                            content
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-10 text-center text-sm text-slate-500">
            Add countries and listings from the Countries manager.
          </p>
        )}
      </div>
    </section>
  );
}
