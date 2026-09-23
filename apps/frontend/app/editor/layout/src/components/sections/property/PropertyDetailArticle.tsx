"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { normalizePropertyDetailLayout } from "../../../lib/propertyLayouts";
import {
  getPropertyAmenityIcon,
  parsePropertyAmenities,
  type PropertyAmenity,
} from "../../../lib/propertyAmenities";

export type PropertyDetailContent = {
  title: string;
  category?: string;
  excerpt?: string;
  content?: string;
  image?: string;
  layout?: string;
  price?: string;
  address?: string;
  bedrooms?: string;
  bathrooms?: string;
  areaSqft?: string;
  parking?: string;
  propertyType?: string;
  listingType?: string;
  /** Amenity list — structured `{ name, icon }` or legacy comma-separated string. */
  amenities?:
    | string
    | Array<{
        name: string;
        icon?: string;
      }>;
  floorPlan?: string;
  /** Extra images from Property manager gallery */
  gallery?: string[];
};

type PropertyDetailArticleProps = {
  propertyItem: PropertyDetailContent;
  backSlot?: ReactNode;
};

const PAGE_SHELL =
  "mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12";

const formatOptionSlugLabel = (value: string) =>
  value
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Apartment",
  villa: "Villa",
  house: "House",
  plot: "Plot",
  commercial: "Commercial",
  office: "Office",
};

const stripHtmlText = (value: string) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const HtmlOrText = ({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) => {
  const trimmed = value.trim();
  if (!trimmed || !stripHtmlText(trimmed)) return null;
  if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) {
    return (
      <div
        className={`property-detail-prose manager-detail-prose max-w-none text-slate-700 ${className}`}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }
  return (
    <div
      className={`whitespace-pre-wrap text-lg leading-8 text-slate-700 ${className}`}
    >
      {trimmed}
    </div>
  );
};

const BackRow = ({
  children,
  light = false,
}: {
  children?: ReactNode;
  light?: boolean;
}) => {
  if (!children) return null;
  return (
    <div
      className={`mb-6 sm:mb-8 ${light ? "[&_a]:text-white/90 [&_a]:hover:text-white" : ""}`}
    >
      {children}
    </div>
  );
};

const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: "For Sale",
  rent: "For Rent",
};

const PropertyMeta = ({
  category,
  listingType,
  propertyType,
  price,
  address,
  bedrooms,
  bathrooms,
  areaSqft,
  parking,
  light = false,
}: {
  category?: string;
  listingType?: string;
  propertyType?: string;
  price?: string;
  address?: string;
  bedrooms?: string;
  bathrooms?: string;
  areaSqft?: string;
  parking?: string;
  light?: boolean;
}) => {
  const normalizedListingType = (listingType || "sale").trim();
  const listingLabel =
    LISTING_TYPE_LABELS[normalizedListingType] ||
    formatOptionSlugLabel(normalizedListingType);
  const typeLabel = propertyType
    ? PROPERTY_TYPE_LABELS[propertyType] || formatOptionSlugLabel(propertyType)
    : "";
  const specs = [
    bedrooms ? `${bedrooms} Beds` : "",
    bathrooms ? `${bathrooms} Baths` : "",
    areaSqft ? `${areaSqft} sqft` : "",
    parking ? `${parking} Parking` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {category ? (
        <span
          className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
            light ? "text-teal-200" : "text-teal-700"
          }`}
        >
          {category}
        </span>
      ) : null}
      <span
        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
          listingType === "rent"
            ? light
              ? "bg-amber-400/20 text-amber-100"
              : "bg-amber-100 text-amber-700"
            : light
              ? "bg-emerald-400/20 text-emerald-100"
              : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {listingLabel}
      </span>
      {typeLabel ? (
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            light ? "bg-white/15 text-white/80" : "bg-slate-200 text-slate-600"
          }`}
        >
          {typeLabel}
        </span>
      ) : null}
      {price ? (
        <span
          className={`text-base font-black ${
            light ? "text-white" : "text-slate-950"
          }`}
        >
          {price}
        </span>
      ) : null}
      {specs ? (
        <span
          className={`text-sm font-semibold ${
            light ? "text-white/75" : "text-slate-500"
          }`}
        >
          {specs}
        </span>
      ) : null}
      {address ? (
        <span
          className={`text-sm ${light ? "text-white/70" : "text-slate-500"}`}
        >
          {address}
        </span>
      ) : null}
    </div>
  );
};

const AmenitiesSection = ({ amenities }: { amenities: PropertyAmenity[] }) => {
  if (!amenities.length) return null;
  return (
    <section className="mt-12 sm:mt-14">
      <h2 className="text-2xl font-bold tracking-tight text-slate-950">
        Amenities
      </h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {amenities.map((amenity, index) => {
          const Icon = getPropertyAmenityIcon(amenity.icon);
          return (
            <li
              key={`${amenity.name}-${amenity.icon}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800"
            >
              <span className="theme-accent-soft grid h-10 w-10 shrink-0 place-items-center rounded-lg">
                <Icon size={18} strokeWidth={2.25} />
              </span>
              <span>{amenity.name}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

const FloorPlanSection = ({ floorPlan }: { floorPlan?: string }) => {
  if (!floorPlan) return null;
  return (
    <section className="mt-12 sm:mt-14">
      <h2 className="text-2xl font-bold tracking-tight text-slate-950">
        Floor plan
      </h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={floorPlan}
          alt="Floor plan"
          className="h-auto w-full object-contain"
        />
      </div>
    </section>
  );
};

const GallerySlider = ({
  title,
  image,
  gallery,
  className = "mt-8",
}: {
  title: string;
  image: string;
  gallery?: string[];
  className?: string;
}) => {
  const slides = useMemo(() => {
    const extra = Array.isArray(gallery)
      ? gallery.map((item) => item.trim()).filter(Boolean)
      : [];
    return Array.from(new Set([image, ...extra].filter(Boolean)));
  }, [gallery, image]);
  const [index, setIndex] = useState(0);
  const canSlide = slides.length > 1;

  useEffect(() => {
    setIndex(0);
  }, [title, image, slides.length]);

  if (!slides.length) return null;
  const active = slides[Math.min(index, slides.length - 1)] || image;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${className}`}
    >
      <div className="relative aspect-[16/9] w-full sm:aspect-[2/1]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active}
          alt={title}
          className="h-full w-full object-cover"
        />
      </div>
      {canSlide ? (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() =>
              setIndex((current) => (current - 1 + slides.length) % slides.length)
            }
            className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-slate-950/80 text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() =>
              setIndex((current) => (current + 1) % slides.length)
            }
            className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-slate-950/80 text-white"
          >
            <ArrowRight size={18} />
          </button>
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((src, slideIndex) => (
              <button
                key={`${src}-${slideIndex}`}
                type="button"
                aria-label={`Show image ${slideIndex + 1}`}
                onClick={() => setIndex(slideIndex)}
                className={
                  slideIndex === index
                    ? "h-2.5 w-8 rounded-full bg-white"
                    : "h-2.5 w-2.5 rounded-full bg-white/60"
                }
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default function PropertyDetailArticle({
  propertyItem,
  backSlot,
}: PropertyDetailArticleProps) {
  const layout = normalizePropertyDetailLayout(propertyItem.layout);
  const title = propertyItem.title || "Untitled property";
  const category = propertyItem.category?.trim() || "";
  const excerpt = propertyItem.excerpt?.trim() || "";
  const rawContent = propertyItem.content?.trim() || "";
  const hasBody = Boolean(stripHtmlText(rawContent));
  const content =
    (hasBody ? rawContent : "") ||
    excerpt ||
    "No content has been added to this property yet.";
  const showExcerpt =
    Boolean(excerpt) && stripHtmlText(content) !== stripHtmlText(excerpt);
  const image = propertyItem.image?.trim() || "/bg1.jpg";
  const gallery = Array.isArray(propertyItem.gallery)
    ? propertyItem.gallery.map((item) => item.trim()).filter(Boolean)
    : [];
  const listingType = (propertyItem.listingType || "sale").trim();
  const propertyType = propertyItem.propertyType?.trim() || "";
  const price = propertyItem.price?.trim() || "";
  const address = propertyItem.address?.trim() || "";
  const bedrooms = propertyItem.bedrooms?.trim() || "";
  const bathrooms = propertyItem.bathrooms?.trim() || "";
  const areaSqft = propertyItem.areaSqft?.trim() || "";
  const parking = propertyItem.parking?.trim() || "";
  const amenities = parsePropertyAmenities(propertyItem.amenities);
  const floorPlan = propertyItem.floorPlan?.trim() || "";
  const galleryBlock = (
    <GallerySlider title={title} image={image} gallery={gallery} />
  );
  const galleryFlush = (
    <GallerySlider
      title={title}
      image={image}
      gallery={gallery}
      className="mt-0 h-full min-h-[280px] rounded-none border-0 sm:min-h-[360px]"
    />
  );

  const meta = {
    category,
    listingType,
    propertyType,
    price,
    address,
    bedrooms,
    bathrooms,
    areaSqft,
    parking,
  } as const;

  // PropertyDetail-2 — Split (no overflow clip on the story column)
  if (layout === "PropertyDetail-2") {
    return (
      <article className="w-full bg-[#f4f7f6] text-slate-950">
        <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
          <BackRow>{backSlot}</BackRow>
          <div className="rounded-[1.75rem] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:grid lg:grid-cols-2">
            <div className="relative min-h-[280px] overflow-hidden rounded-t-[1.75rem] bg-slate-200 sm:min-h-[360px] lg:min-h-full lg:rounded-l-[1.75rem] lg:rounded-tr-none">
              {galleryFlush}
            </div>
            <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
              <PropertyMeta {...meta} />
              <h1 className="mt-3 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl">
                {title}
              </h1>
              {showExcerpt ? (
                <p className="mt-5 text-lg leading-8 text-slate-600 sm:text-xl">
                  {excerpt}
                </p>
              ) : null}
              <div className="mt-8 border-t border-slate-200 pt-8">
                <HtmlOrText value={content} />
              </div>
            </div>
          </div>
          <AmenitiesSection amenities={amenities} />
          <FloorPlanSection floorPlan={floorPlan} />
        </div>
      </article>
    );
  }

  // PropertyDetail-3 — Cover image same width as content
  if (layout === "PropertyDetail-3") {
    return (
      <article className="w-full bg-white text-slate-950">
        <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
          <BackRow>{backSlot}</BackRow>
          <PropertyMeta {...meta} />
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {showExcerpt ? (
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
              {excerpt}
            </p>
          ) : null}
          <div className="mt-8">{galleryBlock}</div>
          <div className="mt-12 sm:mt-14">
            <HtmlOrText value={content} />
          </div>
          <AmenitiesSection amenities={amenities} />
          <FloorPlanSection floorPlan={floorPlan} />
        </div>
      </article>
    );
  }

  // PropertyDetail-4 — Intro + summary
  if (layout === "PropertyDetail-4") {
    return (
      <article className="w-full bg-white text-slate-950">
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#eef6f4_0%,#ffffff_100%)]">
          <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
            <BackRow>{backSlot}</BackRow>
            <div className="grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
              <div>
                <PropertyMeta {...meta} />
                <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {title}
                </h1>
                {showExcerpt ? (
                  <p className="mt-5 text-xl font-medium leading-9 text-slate-600">
                    {excerpt}
                  </p>
                ) : null}
              </div>
              <div className="w-full">{galleryBlock}</div>
            </div>
          </div>
        </div>
        <div
          className={`${PAGE_SHELL} grid gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16`}
        >
          <div>
            <HtmlOrText value={content} />
            <AmenitiesSection amenities={amenities} />
            <FloorPlanSection floorPlan={floorPlan} />
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border-l-2 border-teal-600 pl-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                At a glance
              </p>
              <p className="mt-3 text-xl font-bold text-slate-950">{title}</p>
              <div className="mt-3">
                <PropertyMeta {...meta} />
              </div>
              {excerpt ? (
                <p className="mt-4 text-sm leading-6 text-slate-600">{excerpt}</p>
              ) : null}
            </div>
          </aside>
        </div>
      </article>
    );
  }

  // PropertyDetail-5 — Title, image, content
  if (layout === "PropertyDetail-5") {
    return (
      <article className="w-full bg-slate-50 text-slate-950">
        <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
          <BackRow>{backSlot}</BackRow>
          <PropertyMeta {...meta} />
          <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {showExcerpt ? (
            <p className="mt-6 border-l-[3px] border-teal-700 pl-5 text-xl font-medium leading-9 text-slate-700 sm:text-2xl">
              {excerpt}
            </p>
          ) : null}
          <div className="mt-10 sm:mt-12">{galleryBlock}</div>
          <div className="mt-12 sm:mt-14">
            <HtmlOrText value={content} />
          </div>
          <AmenitiesSection amenities={amenities} />
          <FloorPlanSection floorPlan={floorPlan} />
        </div>
      </article>
    );
  }

  // PropertyDetail-1 — Hero image + full content below
  return (
    <article className="w-full bg-white text-slate-950">
      <div className={`${PAGE_SHELL} py-10 sm:py-14`}>
        <BackRow>{backSlot}</BackRow>
        <PropertyMeta {...meta} />
        <h1 className="mt-3 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {showExcerpt ? (
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
            {excerpt}
          </p>
        ) : null}
        <div className="mt-8">{galleryBlock}</div>
        <div className="mt-12 sm:mt-14">
          <HtmlOrText value={content} />
        </div>
        <AmenitiesSection amenities={amenities} />
        <FloorPlanSection floorPlan={floorPlan} />
      </div>
    </article>
  );
}
