"use client";

import { useMemo } from "react";
import Image from "next/image";
import type { SectionProps } from "../../../types/section";

type AwardItem = {
  year: string;
  title: string;
  org: string;
  desc?: string;
  image: string;
  alt?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getAwards = (value: unknown): AwardItem[] =>
  Array.isArray(value)
    ? value.flatMap((item) =>
      isRecord(item) &&
        typeof item.year === "string" &&
        typeof item.title === "string" &&
        typeof item.org === "string" &&
        typeof item.image === "string"
        ? [
          {
            year: item.year,
            title: item.title,
            org: item.org,
            image: item.image,
            desc: typeof item.desc === "string" ? item.desc : undefined,
            alt: typeof item.alt === "string" ? item.alt : undefined,
          },
        ]
        : [],
    )
    : [];

const isRemoteImage = (src: string) => /^https?:\/\//i.test(src);

export default function RealEstateAwardsPage1({ data = {} }: SectionProps) {
  const awards = useMemo(() => getAwards(data.awardItems), [data.awardItems]);

  return (
    <section
      data-editor-section-label="Awards and Recognition"
      data-editor-fields="contentPretitle contentTitle awardItems"
      className="bg-white px-5 py-14 text-[#141414] md:px-8 md:py-20 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a4472f]">
              {typeof data.contentPretitle === "string"
                ? data.contentPretitle
                : "Our honours"}
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-[-0.03em] md:text-4xl">
              {typeof data.contentTitle === "string"
                ? data.contentTitle
                : "Awards that mark how we work"}
            </h2>
          </div>
        </div>

        <div
          data-box-layout-grid="grid"
          className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {awards.map((award) => (
            <article
              key={`${award.year}-${award.title}`}
              className="flex min-h-72 flex-col rounded-[1.25rem] border border-[#141414]/10 bg-[#f8f6f1] p-6 transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_45px_rgba(20,20,20,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="relative h-20 w-20">
                  <Image
                    src={award.image}
                    alt={award.alt ?? `${award.title} award`}
                    fill
                    unoptimized={
                      isRemoteImage(award.image) ||
                      award.image.toLowerCase().endsWith(".svg")
                    }
                    className="object-contain"
                    sizes="80px"
                    data-editor-media
                    data-editor-media-type="image"
                    data-editor-media-src={award.image}
                  />
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#a4472f]">
                  {award.year}
                </span>
              </div>
              <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#141414]/45">
                {award.org}
              </p>
              <h3 className="mt-2 text-xl font-semibold">{award.title}</h3>
              {award.desc && (
                <p className="mt-3 text-sm leading-6 text-[#141414]/60">
                  {award.desc}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
