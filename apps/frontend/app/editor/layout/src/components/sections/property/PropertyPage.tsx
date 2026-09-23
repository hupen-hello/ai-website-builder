"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  ProductCardData,
  ProductSlideData,
  SectionProps,
} from "./../../../types/section";
import InlineRichText from "../../builder/InlineRichText";
import { normalizePropertyIndexLayout } from "../../../lib/propertyLayouts";

type PropertySlide = {
  title: string;
  category: string;
  desc: string;
  image: string;
  alt?: string;
  active?: boolean;
  slug?: string;
  href?: string;
  price?: string;
  address?: string;
  bedrooms?: string;
  bathrooms?: string;
  areaSqft?: string;
  propertyType?: string;
  listingType?: "sale" | "rent";
};

const createPropertySlug = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const readText = (item: ProductCardData | ProductSlideData, key: string) => {
  const value = (item as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
};

const toPropertySlide = (
  item: ProductCardData | ProductSlideData,
  detailBase?: string,
): PropertySlide => {
  const image = "image" in item ? item.image : "";
  const alt = "alt" in item ? item.alt : undefined;
  const active =
    "active" in item && typeof item.active === "boolean"
      ? item.active
      : true;
  const title = "productTitle" in item ? item.productTitle : item.title;
  const slug =
    ("slug" in item && typeof item.slug === "string" && item.slug.trim()) ||
    createPropertySlug(title) ||
    "";
  const explicitLink =
    "link" in item && typeof item.link === "string" ? item.link.trim() : "";
  const href =
    explicitLink ||
    (detailBase && slug
      ? `${detailBase.replace(/\/+$/, "")}/${encodeURIComponent(slug)}`
      : undefined);

  return {
    title,
    category: "category" in item ? item.category : "Property",
    desc: "productInfoDesc" in item ? item.productInfoDesc : item.desc,
    image,
    alt,
    active,
    slug,
    href,
    price: readText(item, "price"),
    address: readText(item, "address"),
    bedrooms: readText(item, "bedrooms"),
    bathrooms: readText(item, "bathrooms"),
    areaSqft: readText(item, "areaSqft"),
    propertyType: readText(item, "propertyType"),
    listingType: readText(item, "listingType") === "rent" ? "rent" : "sale",
  };
};

const buildSpecLabel = (property: PropertySlide) =>
  [
    property.bedrooms ? `${property.bedrooms} Beds` : "",
    property.bathrooms ? `${property.bathrooms} Baths` : "",
    property.areaSqft ? `${property.areaSqft} sqft` : "",
  ]
    .filter(Boolean)
    .join(" · ");

const CardShell = ({
  href,
  children,
  className,
}: {
  href?: string;
  children: ReactNode;
  className?: string;
}) => {
  if (href) {
    return (
      <Link
        href={href}
        className={`block transition hover:-translate-y-0.5 hover:shadow-md ${className || ""}`}
      >
        {children}
      </Link>
    );
  }
  return <div className={className}>{children}</div>;
};

const PropertyCard = ({
  property,
  index,
  compact = false,
}: {
  property: PropertySlide;
  index: number;
  compact?: boolean;
}) => {
  const specs = buildSpecLabel(property);

  return (
    <CardShell href={property.href}>
      <article
        className={`overflow-hidden border border-slate-200 bg-slate-50 ${
          compact ? "rounded-xl" : "rounded-2xl"
        } ${property.href ? "h-full" : ""}`}
      >
        {property.image ? (
          <div className={`relative bg-slate-200 ${compact ? "h-36" : "h-56"}`}>
            <Image
              src={property.image}
              alt={property.alt ?? property.title}
              data-editor-media
              data-editor-media-type="image"
              data-editor-media-src={property.image}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 33vw, 100vw"
            />
          </div>
        ) : null}
        <div className={compact ? "p-4" : "p-5"}>
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="text-xs font-bold uppercase tracking-[0.18em] theme-accent"
              data-editor-inline-format-key={`service-page:${index}:category`}
            >
              <InlineRichText
                value={property.category}
                formatKey={`service-page:${index}:category`}
              />
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                property.listingType === "rent"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {property.listingType === "rent" ? "For Rent" : "For Sale"}
            </span>
          </div>
          {property.price ? (
            <p className="mt-2 text-lg font-black text-slate-950">
              {property.price}
            </p>
          ) : null}
          {specs ? (
            <p className="mt-1 text-xs font-semibold text-slate-500">{specs}</p>
          ) : null}
          <h3
            className={`mt-2 font-black ${compact ? "text-lg" : "mt-3 text-xl"}`}
            data-editor-inline-format-key={`service-page:${index}:title`}
          >
            <InlineRichText
              value={property.title}
              formatKey={`service-page:${index}:title`}
            />
          </h3>
          {property.address ? (
            <p className="mt-1 text-sm text-slate-500">{property.address}</p>
          ) : null}
          <p
            className={`mt-2 text-sm leading-7 text-slate-600 ${compact ? "line-clamp-2" : "mt-3"}`}
            data-editor-inline-format-key={`service-page:${index}:description`}
          >
            <InlineRichText
              value={property.desc}
              formatKey={`service-page:${index}:description`}
            />
          </p>
          {property.href ? (
            <p className="mt-3 text-sm font-bold theme-accent">
              View details →
            </p>
          ) : null}
        </div>
      </article>
    </CardShell>
  );
};

const IntroBlock = ({ data }: { data: NonNullable<SectionProps["data"]> }) => (
  <div>
    <p
      className="text-sm font-bold uppercase tracking-[0.22em] theme-accent"
      data-editor-inline-format-key="service-page:pretitle"
    >
      <InlineRichText
        value={data.pretitle ?? ""}
        formatKey="service-page:pretitle"
      />
    </p>
    <h1
      className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-5xl"
      data-editor-inline-format-key="service-page:title"
    >
      <InlineRichText
        value={data.title ?? ""}
        formatKey="service-page:title"
      />
    </h1>
    <div className="mt-5 space-y-4 text-base leading-8 text-slate-600">
      <p data-editor-inline-format-key="service-page:description">
        <InlineRichText
          value={data.desc ?? ""}
          formatKey="service-page:description"
        />
      </p>
      {data.desc2 ? (
        <p data-editor-inline-format-key="service-page:description-secondary">
          <InlineRichText
            value={data.desc2}
            formatKey="service-page:description-secondary"
          />
        </p>
      ) : null}
    </div>
  </div>
);

const SectionHeading = ({
  data,
}: {
  data: NonNullable<SectionProps["data"]>;
}) => (
  <div>
    <p
      className="text-sm font-bold uppercase tracking-[0.22em] theme-accent"
      data-editor-inline-format-key="service-page:subtitle"
    >
      <InlineRichText
        value={data.subtitle ?? ""}
        formatKey="service-page:subtitle"
      />
    </p>
    <h2
      className="mt-3 text-3xl font-black tracking-tight"
      data-editor-inline-format-key="service-page:section-title"
    >
      <InlineRichText
        value={data.productSectionTitle ?? ""}
        formatKey="service-page:section-title"
      />
    </h2>
  </div>
);

export default function PropertyPage({ data = {} }: SectionProps) {
  const [startIndex, setStartIndex] = useState(0);
  const layout = normalizePropertyIndexLayout(
    typeof data.layout === "string" ? data.layout : "PropertyPage-1",
  );
  const sideImage = data.sideImage;
  const sideImageTitle = data.sideImageTitle ?? "";
  const detailBase =
    typeof data.propertyDetailBase === "string"
      ? data.propertyDetailBase.trim()
      : "";

  const properties = useMemo(() => {
    const fromItems = (data.productItems ?? []).filter(
      (item) =>
        !("active" in item) ||
        item.active === undefined ||
        item.active !== false,
    );
    const slides = fromItems.length
      ? fromItems
      : data.serviceSlides?.length
        ? data.serviceSlides
        : data.productSlides?.length
          ? data.productSlides
          : [];
    return slides
      .map((item) => toPropertySlide(item, detailBase || undefined))
      .filter((item) => item.title && item.active !== false);
  }, [data.productItems, data.productSlides, data.serviceSlides, detailBase]);

  const visibleCarousel = properties.length
    ? Array.from(
        { length: Math.min(3, properties.length) },
        (_, index) => properties[(startIndex + index) % properties.length],
      )
    : [];
  const canSlide = properties.length > 3;
  const featured = properties[0];
  const rest = properties.slice(1);

  const moveSlider = (direction: -1 | 1) => {
    if (!properties.length) return;
    setStartIndex(
      (current) => (current + direction + properties.length) % properties.length,
    );
  };

  // PropertyPage-2 — Feature spotlight
  if (layout === "PropertyPage-2") {
    return (
      <main className="bg-slate-50 text-slate-950">
        <section className="border-b border-slate-200 bg-white px-5 py-16 md:px-8 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p
              className="text-sm font-bold uppercase tracking-[0.22em] theme-accent"
              data-editor-inline-format-key="service-page:pretitle"
            >
              <InlineRichText
                value={data.pretitle ?? ""}
                formatKey="service-page:pretitle"
              />
            </p>
            <h1
              className="mt-4 text-4xl font-black tracking-tight md:text-6xl"
              data-editor-inline-format-key="service-page:title"
            >
              <InlineRichText
                value={data.title ?? ""}
                formatKey="service-page:title"
              />
            </h1>
            <p
              className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600"
              data-editor-inline-format-key="service-page:description"
            >
              <InlineRichText
                value={data.desc ?? ""}
                formatKey="service-page:description"
              />
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 md:px-8 lg:py-16">
          <SectionHeading data={data} />
          {featured ? (
            <CardShell href={featured.href} className="mt-8 block">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:grid md:grid-cols-[1.1fr_0.9fr]">
                {featured.image ? (
                  <div className="relative min-h-[280px] bg-slate-100">
                    <Image
                      src={featured.image}
                      alt={featured.alt ?? featured.title}
                      data-editor-media
                      data-editor-media-type="image"
                      data-editor-media-src={featured.image}
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 55vw, 100vw"
                    />
                  </div>
                ) : null}
                <div className="flex flex-col justify-center p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] theme-accent">
                    {featured.category}
                  </p>
                  {featured.price ? (
                    <p className="mt-2 text-2xl font-black text-slate-950">
                      {featured.price}
                    </p>
                  ) : null}
                  <h3 className="mt-3 text-3xl font-black">{featured.title}</h3>
                  {buildSpecLabel(featured) ? (
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {buildSpecLabel(featured)}
                    </p>
                  ) : null}
                  <p className="mt-4 text-base leading-7 text-slate-600">
                    {featured.desc}
                  </p>
                  {featured.href ? (
                    <p className="mt-5 text-sm font-bold theme-accent">
                      View details →
                    </p>
                  ) : null}
                </div>
              </div>
            </CardShell>
          ) : null}
          {rest.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {rest.map((property, index) => (
                <PropertyCard
                  key={`${property.slug || property.title}-${index}`}
                  property={property}
                  index={index + 1}
                  compact
                />
              ))}
            </div>
          ) : null}
        </section>
      </main>
    );
  }

  // PropertyPage-3 — Card showcase
  if (layout === "PropertyPage-3") {
    return (
      <main className="bg-white text-slate-950">
        <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <IntroBlock data={data} />
          </div>
          <div className="mt-12">
            <div className="mb-8 text-center">
              <SectionHeading data={data} />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property, index) => (
                <PropertyCard
                  key={`${property.slug || property.title}-${index}`}
                  property={property}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }

  // PropertyPage-4 — Grid catalog
  if (layout === "PropertyPage-4") {
    return (
      <main className="bg-slate-50 text-slate-950">
        <section className="border-b border-slate-200 bg-white px-5 py-12 md:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <IntroBlock data={data} />
            {sideImage ? (
              <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-2xl bg-slate-100 md:h-48">
                <Image
                  src={sideImage}
                  alt={sideImageTitle}
                  data-editor-media
                  data-editor-media-type="image"
                  data-editor-media-src={sideImage}
                  fill
                  className="object-cover"
                  sizes="320px"
                />
              </div>
            ) : null}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-10 md:px-8 lg:py-14">
          <SectionHeading data={data} />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map((property, index) => (
              <PropertyCard
                key={`${property.slug || property.title}-${index}`}
                property={property}
                index={index}
                compact
              />
            ))}
          </div>
        </section>
      </main>
    );
  }

  // PropertyPage-1 — Split intro + carousel (default)
  return (
    <main className="bg-white text-slate-950">
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[0.95fr_1.05fr] md:px-8 lg:py-20">
        <IntroBlock data={data} />

        {sideImage ? (
          <div className="relative min-h-[320px] overflow-hidden rounded-[28px] bg-slate-100 shadow-xl">
            <Image
              src={sideImage}
              alt={sideImageTitle}
              data-editor-media
              data-editor-media-type="image"
              data-editor-media-src={sideImage}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 45vw, 100vw"
            />
          </div>
        ) : null}
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 md:px-8 lg:pb-24">
        <div className="mb-8 flex items-center justify-between gap-4">
          <SectionHeading data={data} />

          {canSlide ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => moveSlider(-1)}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
                aria-label="Previous properties"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => moveSlider(1)}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
                aria-label="Next properties"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {visibleCarousel.map((property, index) => (
            <PropertyCard
              key={`${property.slug || property.title}-${index}`}
              property={property}
              index={index}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
