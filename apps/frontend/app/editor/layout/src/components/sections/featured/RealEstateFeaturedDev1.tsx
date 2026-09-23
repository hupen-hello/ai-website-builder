"use client";

import Image from "next/image";
import type { SectionProps } from "../../../types/section";

type Developer = {
  name: string;
  image: string;
  alt: string;
};

const getString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const getDevelopers = (value: unknown): Developer[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const name = getString(item.name, getString(item.title));
    const image = getString(item.image);

    return name && image
      ? [{ name, image, alt: getString(item.alt, `${name} logo`) }]
      : [];
  });
};

const bypassImageOptimization = (src: string) =>
  src.startsWith("data:") ||
  src.startsWith("http://") ||
  src.startsWith("https://");

export default function RealEstateFeaturedDev1({
  data = {},
}: SectionProps) {
  const developers = getDevelopers(data.items);
  const hasCustomBoxLayout =
    typeof data.boxesPerRow === "number" &&
    data.boxesPerRow >= 2 &&
    data.boxesPerRow <= 6;

  if (!developers.length) return null;

  const marqueeItems = [...developers, ...developers];

  return (
    <section
      id="featured-developers"
      className="overflow-hidden bg-white py-12 md:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 text-center md:px-8 lg:px-10">
        {data.pretitle && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c44536]">
            {getString(data.pretitle)}
          </p>
        )}
        <h2 className="mx-auto mt-2 max-w-3xl text-2xl font-semibold leading-tight text-[#141414] md:text-3xl">
          {getString(data.title, "Featured developers we partner with.")}
        </h2>
        {data.desc && (
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#141414]/60">
            {getString(data.desc)}
          </p>
        )}
      </div>

      <div className="relative mt-8 md:mt-10">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-linear-to-r from-white to-transparent md:w-28"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-linear-to-l from-white to-transparent md:w-28"
          aria-hidden
        />

        <div
          data-box-layout-grid={hasCustomBoxLayout ? "grid" : undefined}
          className={hasCustomBoxLayout
            ? "grid w-full gap-4 px-2 md:gap-5"
            : "animate-marquee flex w-max gap-4 px-2 hover:[animation-play-state:paused] md:gap-5"}
        >
          {(hasCustomBoxLayout ? developers : marqueeItems).map((item, index) => (
            <article
              key={`${item.name}-${index}`}
              aria-hidden={!hasCustomBoxLayout && index >= developers.length}
              className={`flex h-28 shrink-0 items-center justify-center rounded-2xl border border-[#141414]/10 bg-white p-4 shadow-[0_8px_30px_rgba(20,20,20,0.04)] sm:h-32 ${hasCustomBoxLayout ? "w-full" : "w-40 sm:w-48"}`}
            >
              <div className="relative h-full w-full">
                <Image
                  src={item.image}
                  alt={index < developers.length ? item.alt : ""}
                  fill
                  sizes="192px"
                  unoptimized={bypassImageOptimization(item.image)}
                  data-editor-media
                  data-editor-media-type="image"
                  data-editor-media-src={item.image}
                  className="object-contain"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
