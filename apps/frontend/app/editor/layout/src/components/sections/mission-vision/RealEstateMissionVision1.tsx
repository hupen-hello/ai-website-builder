"use client";

import Image from "next/image";
import type { SectionProps } from "../../../types/section";

type TextItem = { title: string; desc: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getTextItems = (value: unknown): TextItem[] =>
  Array.isArray(value)
    ? value.flatMap((item) =>
        isRecord(item) &&
        typeof item.title === "string" &&
        typeof item.desc === "string"
          ? [{ title: item.title, desc: item.desc }]
          : [],
      )
    : [];

const isRemoteImage = (src: string) => /^https?:\/\//i.test(src);

export default function RealEstateMissionVision1({ data = {} }: SectionProps) {
  const pillars = getTextItems(data.pillars);
  const sideImage = typeof data.sideImage === "string" ? data.sideImage : undefined;

  return (
    <section
      data-editor-section-label="Mission Pillars"
      data-editor-fields="sideImage sideImageTitle pillarsPretitle pillarsTitle pillars"
      className="bg-[#14251f] px-5 py-14 text-white md:px-8 md:py-20 lg:px-10"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        {sideImage && (
          <div className="relative min-h-[420px] overflow-hidden rounded-[1.25rem] bg-white/5 md:min-h-[540px]">
            <Image
              src={sideImage}
              alt={
                typeof data.sideImageTitle === "string"
                  ? data.sideImageTitle
                  : "HAUS Group mission"
              }
              fill
              unoptimized={isRemoteImage(sideImage)}
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
              data-editor-media
              data-editor-media-type="image"
              data-editor-media-src={sideImage}
            />
          </div>
        )}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e9ad91]">
            {typeof data.pillarsPretitle === "string"
              ? data.pillarsPretitle
              : "How we work"}
          </p>
          <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.03em] md:text-4xl">
            {typeof data.pillarsTitle === "string"
              ? data.pillarsTitle
              : "Promises behind every shortlist."}
          </h2>
          <div className="mt-9 space-y-6">
            {pillars.map((item, index) => (
              <article key={item.title} className="border-t border-white/15 pt-6">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-[#e9ad91]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 max-w-xl text-sm leading-7 text-white/60">
                  {item.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
