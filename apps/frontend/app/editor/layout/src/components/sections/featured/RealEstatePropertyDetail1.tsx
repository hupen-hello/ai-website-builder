"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import type { SectionProps } from "../../../types/section";
import RealEstateBreadcrumbNav1 from "../breadcrumb/RealEstateBreadcrumbNav1";
import RealEstateAmenities1 from "./RealEstateAmenities1";
import { parsePropertyAmenities } from "../../../lib/propertyAmenities";
import { publishedHrefFromData } from "../../../lib/sectionScroll";

const getString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const getRecords = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && !Array.isArray(item),
    )
    : [];

const bypassImageOptimization = (src: string) =>
  src.startsWith("data:") || /^https?:\/\//i.test(src);

const getSlideImages = (data: Record<string, unknown>, image: string) => {
  const extra: string[] = [];
  for (const key of ["images", "gallery", "slides"] as const) {
    const value = data[key];
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      if (typeof item === "string" && item.trim()) extra.push(item.trim());
      if (
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        typeof (item as { image?: unknown }).image === "string"
      ) {
        extra.push(((item as { image: string }).image || "").trim());
      }
    }
  }
  return Array.from(new Set([image, ...extra].filter(Boolean)));
};

export default function RealEstatePropertyDetail1({ data = {} }: SectionProps) {
  const title = getString(data.title, "Property details");
  const image = getString(data.image);
  const statusText = getString(data.statusText);
  const infoTitle = getString(data.infoTitle);
  const price = getString(data.price);
  const shortDesc = getString(data.description, getString(data.desc));
  const location = getString(data.location);
  const floorPlan = getString(data.floorPlan);
  const longDesc = useMemo(() => {
    const explicit = getString(data.longDescription).trim();
    if (explicit) return explicit;
    const body = getString(data.body, shortDesc).trim();
    return body;
  }, [data.body, data.longDescription, shortDesc]);
  const features = useMemo(() => {
    const explicit = getRecords(data.features).filter(
      (row) => getString(row.label) && getString(row.value),
    );
    if (explicit.length) return explicit;
    const built: Array<Record<string, unknown>> = [];
    const bedrooms = getString(data.bedrooms);
    const areaSqft = getString(data.areaSqft);
    const bathrooms = getString(data.bathrooms);
    const parking = getString(data.parking);
    if (bedrooms) built.push({ label: "Bedrooms", value: bedrooms });
    if (areaSqft) {
      built.push({
        label: "Area",
        value: /sq\.?\s*ft|sqft/i.test(areaSqft)
          ? areaSqft
          : `${areaSqft} sq.ft`,
      });
    }
    if (bathrooms) built.push({ label: "Bathrooms", value: bathrooms });
    if (parking) built.push({ label: "Parking", value: parking });
    return built;
  }, [data.areaSqft, data.bathrooms, data.bedrooms, data.features, data.parking]);
  const amenities = parsePropertyAmenities(data.amenities).map(
    (item) => item.name,
  );
  const button =
    typeof data.button === "object" && data.button !== null && !Array.isArray(data.button)
      ? (data.button as Record<string, unknown>)
      : null;
  const pub = (href: string) => publishedHrefFromData(href, data);
  const primaryHref = pub(
    getString(data.primaryButtonHref) ||
      (button ? getString(button.href) : "") ||
      "/contact",
  );
  const propertiesHref = pub(
    typeof data.propertiesHref === "string" && data.propertiesHref.trim()
      ? data.propertiesHref
      : "/properties",
  );
  const homeHref = pub(
    typeof data.homeHref === "string" && data.homeHref.trim()
      ? data.homeHref
      : "/",
  );
  const slides = useMemo(
    () => getSlideImages(data as Record<string, unknown>, image),
    [data, image],
  );
  const [slideIndex, setSlideIndex] = useState(0);
  const canSlide = slides.length > 1;
  const goSlide = (direction: -1 | 1) => {
    if (!canSlide) return;
    setSlideIndex(
      (current) => (current + direction + slides.length) % slides.length,
    );
  };

  useEffect(() => {
    setSlideIndex(0);
  }, [title, image, slides.length]);

  return (
    <main className="overflow-x-hidden border-t border-[#141414]/10 bg-white text-[#141414]">
      <section
        data-editor-section-label="Property Overview"
        data-editor-fields="homeLabel propertiesLabel title subtitle description body image alt category statusText price infoTitle features button primaryButtonLabel primaryButtonHref backButtonLabel gallery floorPlan bedrooms bathrooms areaSqft parking"
        className="px-5 py-10 md:px-8 md:py-14 lg:px-10 lg:py-16"
      >
        <div className="mx-auto max-w-7xl">
          <RealEstateBreadcrumbNav1
            items={[
              {
                label:
                  typeof data.homeLabel === "string"
                    ? data.homeLabel
                    : "Home",
                href: homeHref,
              },
              {
                label:
                  typeof data.propertiesLabel === "string"
                    ? data.propertiesLabel
                    : "Properties",
                href: propertiesHref,
              },
              { label: title },
            ]}
          />

          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                {statusText && <span className="bg-[#141414] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white">{statusText}</span>}
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c44536]">
                  {[getString(data.category), getString(data.subtitle)].filter(Boolean).join(" · ")}
                </p>
              </div>

              <h1 className="mt-7 break-words text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-5xl">{title}</h1>
              {infoTitle && <p className="mt-5 text-xl text-[#141414]/80">{infoTitle}</p>}
              {price && <p className="mt-5 text-2xl font-semibold">{price}</p>}
              {location ? (
                <p className="mt-3 text-base text-[#141414]/55">{location}</p>
              ) : null}
              {shortDesc && <p className="mt-8 max-w-3xl text-lg leading-8 text-[#141414]/65 md:text-xl md:leading-10">{shortDesc}</p>}

              {features.length > 0 && (
                <dl className="mt-10 grid grid-cols-2 border-y border-[#141414]/12 py-8 sm:grid-cols-3">
                  {features.map((feature, index) => (
                    <div key={`${getString(feature.label)}-${index}`} className={index > 0 ? "pl-5 md:pl-8" : ""}>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#141414]/45">{getString(feature.label)}</dt>
                      <dd className="mt-3 text-base font-semibold md:text-lg">{getString(feature.value)}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href={primaryHref} className="inline-flex min-h-14 items-center gap-3 rounded-full bg-[#141414] px-8 text-base font-semibold text-white transition hover:bg-[#c44536]">
                  {button ? getString(button.label, getString(data.primaryButtonLabel, "Book a visit")) : getString(data.primaryButtonLabel, "Book a visit")} <ArrowRight size={17} aria-hidden />
                </Link>
                <Link href={propertiesHref} className="inline-flex min-h-14 items-center gap-3 rounded-full border border-[#141414]/20 px-8 text-base font-semibold transition hover:border-[#141414]">
                  <ArrowLeft size={17} aria-hidden /> {typeof data.backButtonLabel === "string" ? data.backButtonLabel : "All properties"}
                </Link>
              </div>
            </div>

            {slides.length ? (
              <div
                className="relative min-w-0 overflow-hidden rounded-[1.35rem] bg-[#eee9df]"
                data-export-fade-slider
              >
                <div className="relative aspect-[16/10] w-full min-h-[18rem] lg:min-h-[28rem]">
                  {slides.map((src, index) => (
                    <div
                      key={`${src}-${index}`}
                      data-export-fade-slide
                      data-active={index === slideIndex ? "true" : "false"}
                      aria-hidden={index === slideIndex ? "false" : "true"}
                      className={`absolute inset-0 transition-opacity duration-500 ${
                        index === slideIndex
                          ? "opacity-100"
                          : "pointer-events-none opacity-0"
                      }`}
                    >
                      <Image
                        src={src}
                        alt={getString(data.alt, title)}
                        fill
                        priority={index === 0}
                        unoptimized={bypassImageOptimization(src)}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                        data-editor-media
                        data-editor-media-type="image"
                        data-editor-media-src={src}
                      />
                    </div>
                  ))}
                </div>
                {canSlide ? (
                  <>
                    <button
                      type="button"
                      aria-label="Previous property image"
                      onClick={() => goSlide(-1)}
                      className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[#17241f]/90 text-white md:left-5 md:h-14 md:w-14"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next property image"
                      onClick={() => goSlide(1)}
                      className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[#17241f]/90 text-white md:right-5 md:h-14 md:w-14"
                    >
                      <ArrowRight size={20} />
                    </button>
                    <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
                      {slides.map((src, index) => (
                        <button
                          key={`${src}-${index}`}
                          type="button"
                          data-export-fade-dot
                          aria-label={`Show image ${index + 1}`}
                          onClick={() => setSlideIndex(index)}
                          className={
                            index === slideIndex
                              ? "h-3 w-10 rounded-full bg-white"
                              : "h-3 w-3 rounded-full bg-white/55"
                          }
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {amenities.length ? (
      <RealEstateAmenities1
        pretitle={
          typeof data.amenitiesPretitle === "string"
            ? data.amenitiesPretitle
            : "Amenities"
        }
        title={
          typeof data.amenitiesTitle === "string"
            ? data.amenitiesTitle
            : "What this property offers."
        }
        description={
          typeof data.amenitiesDesc === "string"
            ? data.amenitiesDesc
            : "Everyday comforts and lifestyle facilities included with this listing."
        }
        items={amenities}
      />
      ) : null}

      {floorPlan ? (
        <section
          data-editor-section-label="Floor plan"
          data-editor-fields="floorPlan"
          className="bg-[#f7f4ee] px-5 py-14 md:px-8 md:py-16 lg:px-10"
        >
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c44536]">
              Floor plan
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
              Layout at a glance
            </h2>
            <div className="relative mt-8 overflow-hidden rounded-[1.35rem] border border-[#141414]/10 bg-white">
              <div className="relative mx-auto aspect-[16/10] w-full max-w-4xl">
                <Image
                  src={floorPlan}
                  alt={`${title} floor plan`}
                  fill
                  unoptimized={bypassImageOptimization(floorPlan)}
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-contain p-4"
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {longDesc ? (
        <section
          data-editor-section-label="Property Story"
          data-editor-fields="longDescription body"
          className="bg-white px-5 py-16 md:px-8 md:py-20 lg:px-10"
        >
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c44536]">
              {typeof data.storyPretitle === "string"
                ? data.storyPretitle
                : "About this home"}
            </p>
            <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
              {typeof data.storyTitle === "string"
                ? data.storyTitle
                : `More about ${title}`}
            </h2>
            <div className="mt-8 max-w-4xl space-y-5 text-base leading-8 text-[#141414]/70 md:text-lg md:leading-9">
              {longDesc.split(/\n\n+/).map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 32)}`}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
